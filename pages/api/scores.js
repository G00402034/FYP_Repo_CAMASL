import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("mydatabase");

  switch (req.method) {
    case "GET": {
      // Fetch scores for a specific user
      const { username } = req.query;

      if (!username) {
        return res.status(400).json({ success: false, message: "Username is required" });
      }

      const scores = await db.collection("scores").find({ username }).toArray();
      return res.status(200).json({ success: true, data: scores });
    }

    case "POST": {
      // Save a new score entry
      const { username, sign, score, date } = req.body;

      if (!username || !sign || typeof score !== "number") {
        return res.status(400).json({ success: false, message: "Invalid data" });
      }

      const result = await db.collection("scores").insertOne({ username, sign, score, date: date || new Date() });
      return res.status(201).json({ success: true, data: result });
    }

    default:
      res.status(405).json({ success: false, message: "Method Not Allowed" });
  }
}
