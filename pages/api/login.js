// pages/api/login.js
import clientPromise from '../../lib/mongodb';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { username, password } = req.body;

    try {
      const client = await clientPromise;
      const db = client.db('mydatabase'); 

      const user = await db.collection('users').findOne({ username });
      if (!user) {
        return res.status(400).json({ success: false, message: 'User not found' });
      }

      // Compares the provided password with the hashed password in the database
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Invalid password' });
      }

      res.status(200).json({ success: true, message: 'Login successful' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Database error: ' + error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
}
