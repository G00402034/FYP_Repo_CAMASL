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

      const user = await db.collection('users').findOne({ username });
      if (!user) {
        return res.status(400).json({ success: false, message: 'User not found' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Invalid password' });
      }

      
      
      res.setHeader('Set-Cookie', `loggedInUser=${username}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict`);

      res.status(200).json({ success: true, message: 'Login successful', username });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
}