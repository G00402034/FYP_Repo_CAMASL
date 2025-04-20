export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
   
    const { image, target_sign } = req.body;
    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

  
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000/predict";
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, target_sign }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Prediction service failed: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Prediction error:", error);
    return res.status(500).json({
      error: "Prediction failed",
      details: error.message,
    });
  }
}