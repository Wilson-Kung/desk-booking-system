const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '僅允許 GET 方法' });
  }

  try {
    await client.connect();
    const collection = client.db('desk_booking').collection('bookings');
    const bookings = await collection.find({}).toArray();
    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ error: '無法獲取預約數據' });
  } finally {
    await client.close();
  }
}
