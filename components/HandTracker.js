import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

export default function HandTracker({ onGestureDetected, currentPrompt, isSessionActive }) {
  const webcamRef = useRef(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [error, setError] = useState(null);
  const [webcamReady, setWebcamReady] = useState(false); // Track webcam readiness

  const captureAndPredict = async () => {
    if (!webcamRef.current || isPredicting) return;

    setIsPredicting(true);
    try {
      if (!webcamRef.current.video || webcamRef.current.video.readyState !== 4) {
        throw new Error("Webcam not ready");
      }

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error("Failed to capture webcam frame");
      }

      if (!imageSrc.startsWith("data:image/jpeg;base64,")) {
        throw new Error("Invalid screenshot format");
      }
      const base64Data = imageSrc.split(",")[1];
      if (!base64Data) {
        throw new Error("Empty base64 data");
      }

      const payload = { image: base64Data };
      if (currentPrompt) {
        payload.target_sign = currentPrompt;
      }

      console.log("Sending payload:", {
        imageLength: base64Data.length,
        target_sign: payload.target_sign,
      });

      const predictResponse = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!predictResponse.ok) {
        const errorData = await predictResponse.json();
        throw new Error(`Prediction failed: ${JSON.stringify(errorData)}`);
      }

      const data = await predictResponse.json();
      if (data.error) {
        throw new Error(data.error);
      }

      if (onGestureDetected) {
        const normalizedGesture = data.predictedSign.toUpperCase();
        const normalizedPrompt = currentPrompt.toUpperCase();
        const isCorrect = normalizedGesture === normalizedPrompt;
        console.log("Prediction result:", {
          predictedSign: data.predictedSign,
          isCorrect: isCorrect,
          confidence: data.confidence,
          targetSign: currentPrompt,
        });
        onGestureDetected({
          gesture: data.predictedSign,
          isCorrect: isCorrect,
          confidence: data.confidence,
        });
      }
    } catch (err) {
      console.error("Prediction error:", err);
      setError(err.message);
    } finally {
      setIsPredicting(false);
    }
  };

  useEffect(() => {
    let interval;
    if (webcamReady) { // Only start interval when webcam is ready
      interval = setInterval(captureAndPredict, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [webcamReady, currentPrompt, isSessionActive]); 

  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  return (
    <div className="relative w-full h-full">
      <Webcam
        ref={webcamRef}
        className="w-full h-full object-contain"
        screenshotFormat="image/jpeg"
        screenshotQuality={0.9}
        mirrored
        videoConstraints={{
          width: 640,
          height: 480,
          facingMode: "user",
        }}
        onUserMedia={() => {
          setWebcamReady(true); 
          console.log("Webcam stream initialized");
        }}
        onUserMediaError={(err) => {
          console.error("Webcam access error:", err);
          setError("Failed to access webcam. Please allow camera permissions.");
          setWebcamReady(false); 
        }}
      />
      {error && (
        <div className="absolute top-2 left-2 bg-white text-red-500 p-2 rounded">
          Error: {error}
        </div>
      )}
    </div>
  );
}