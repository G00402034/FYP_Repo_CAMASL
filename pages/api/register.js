import clientPromise from '../../lib/mongodb';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    try {
      const client = await clientPromise;
      const db = client.db('mydatabase'); 

      // Generate a random salt
      const salt = await bcrypt.genSaltSync(12); 
      const hashedPassword = await bcrypt.hash(password, salt);

      const result = await db.collection('users').insertOne({ username, password: hashedPassword });

      res.status(201).json({ success: true, data: { id: result.insertedId, username } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Database error: ' + error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
}