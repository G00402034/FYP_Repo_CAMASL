
import clientPromise from '../../lib/mongodb';

// The handler function for handling different HTTP methods (GET, POST, etc.)
export default async function handler(req, res) {
  //wait for db to be connected
  const client = await clientPromise;
  const db = client.db("mydatabase");

 
  switch (req.method) {
    case "GET":
      
      const items = await db.collection("items").find({}).toArray();
      res.status(200).json({ success: true, data: items });
      break;

    case "POST":
      
      const newItem = req.body;
      await db.collection("items").insertOne(newItem);
      res.status(201).json({ success: true, data: newItem });
      break;

    default:
      res.status(405).end();
      break;
  }
}
