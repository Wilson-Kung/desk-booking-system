const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '僅允許 POST 方法' });
  }

  const { name, start, end } = req.body;
  if (!name || !start || !end) {
    return res.status(400).json({ error: '缺少必要欄位' });
  }

  const newBooking = { name, start, end };
  try {
    await client.connect();
    const collection = client.db('desk_booking').collection('bookings');

    // 檢查時間衝突
    const hasConflict = await collection.find({
      $or: [
        { start: { $lt: new Date(end) }, end: { $gt: new Date(start) } }
      ]
    }).toArray();

    if (hasConflict.length > 0) {
      return res.status(409).json({ error: '時間段衝突' });
    }

    await collection.insertOne(newBooking);
    res.status(201).json(newBooking);
  } catch (err) {
    res.status(500).json({ error: '無法創建預約' });
  } finally {
    await client.close();
  }
}
