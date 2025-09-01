const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://desk_booking_user:PowhOAtvLNGDgHDr@cluster0.swwjz9s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

export default async function handler(req, res) {
  await client.connect();
  const collection = client.db('desk_booking').collection('bookings');

  if (req.method === 'GET') {
    const bookings = await collection.find({}).toArray();
    res.status(200).json(bookings);
  } else if (req.method === 'POST') {
    const { name, start, end } = req.body;
    if (!name || !start || !end) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newBooking = { name, start, end };
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
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
