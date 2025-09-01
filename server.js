const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const port = 3000;

// MongoDB Atlas 連線字串，建議使用環境變數
const uri = process.env.MONGODB_URI || 'mongodb+srv://desk_booking_user:PowhOAtvLNGDgHDr@cluster0.swwjz9s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

// 中間件
app.use(express.json());
app.use(express.static('public'));

// 連接到 MongoDB
async function connectToMongo() {
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
  }
}
connectToMongo();

// 獲取所有預約
app.get('/bookings', async (req, res) => {
  try {
    const collection = client.db('desk_booking').collection('bookings');
    const bookings = await collection.find({}).toArray();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// 新增預約並檢查衝突
app.post('/bookings', async (req, res) => {
  const { name, start, end } = req.body;
  if (!name || !start || !end) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newBooking = { name, start, end };
  const collection = client.db('desk_booking').collection('bookings');

  try {
    // 檢查時間衝突
    const hasConflict = await collection.find({
      $or: [
        { start: { $lt: new Date(end) }, end: { $gt: new Date(start) } }
      ]
    }).toArray();

    if (hasConflict.length > 0) {
      return res.status(409).json({ error: 'Time slot conflict' });
    }

    await collection.insertOne(newBooking);
    res.status(201).json(newBooking);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// 關閉 MongoDB 連線（伺服器關閉時）
process.on('SIGINT', async () => {
  await client.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
