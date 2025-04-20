import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db('mydatabase');

  if (req.method === 'POST') {
    const { username, sign, score, confidence, date } = req.body;

    if (!username || !sign || !score || !confidence || !date) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    try {
      const result = await db.collection('scores').insertOne({
        username,
        sign,
        score,
        confidence,
        date,
      });

      res.status(201).json({ success: true, data: { id: result.insertedId, username, sign, score, confidence, date } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Database error: ' + error.message });
    }
  } else if (req.method === 'GET') {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required.' });
    }

    try {
      const scores = await db.collection('scores').find({ username }).toArray();
      res.status(200).json({ success: true, data: scores });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Database error: ' + error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
}