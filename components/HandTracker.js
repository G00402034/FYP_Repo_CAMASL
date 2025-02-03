import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import Webcam from "react-webcam";
import { drawHand } from "../utils/drawHand";

export default function HandTracker({ onGestureDetected }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log("Attempting to load ASL model...");

        // Load the model
        const loadedModel = await tf.loadLayersModel("/model/model.json");

        // Ensure the model has the correct input shape
        const newInput = tf.input({ shape: [224, 224, 3] });  // Explicitly setting input shape
        const newModel = tf.model({
          inputs: newInput,
          outputs: loadedModel.outputs
        });

        setModel(newModel);
        console.log("ASL Model Loaded Successfully");
        console.log("Model Summary:", newModel.summary()); // Log model structure
      } catch (error) {
        console.error("Error loading ASL model:", error);
      }
    };

    const runHandTracking = async () => {
      const handposeModel = await handpose.load();
      console.log("HandPose model loaded.");

      const detectHands = async () => {
        if (
          webcamRef.current &&
          webcamRef.current.video.readyState === 4
        ) {
          const video = webcamRef.current.video;
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;

          canvasRef.current.width = videoWidth;
          canvasRef.current.height = videoHeight;

          // Detect hands
          const handEstimations = await handposeModel.estimateHands(video);
          if (handEstimations.length > 0) {
            console.log("Hand detected:", handEstimations);

            // Extract the image for ASL Model Prediction
            const detectedSign = await predictSign(video);
            if (onGestureDetected) onGestureDetected(detectedSign);
          }

          // Draw hand landmarks
          const ctx = canvasRef.current.getContext("2d");
          ctx.clearRect(0, 0, videoWidth, videoHeight);
          drawHand(handEstimations, ctx);
        }
      };

      setInterval(detectHands, 500);
    };

    loadModel();
    runHandTracking();
  }, []);

  const predictSign = async (video) => {
    if (!model) {
      console.error("Model not loaded yet.");
      return "Unknown";
    }

    // Convert video frame to Tensor
    const tensor = tf.browser.fromPixels(video)
      .resizeNearestNeighbor([224, 224])
      .toFloat()
      .div(255.0) // Normalize pixels between 0-1
      .expandDims(0); // Add batch dimension

    const predictions = await model.predict(tensor).data();
    const predictedIndex = predictions.indexOf(Math.max(...predictions));
    const aslSigns = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    return aslSigns[predictedIndex] || "Unknown";
  };

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      {/* Webcam Feed */}
      <Webcam
        ref={webcamRef}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover"
        }}
        mirrored
      />
      {/* Canvas Overlay */}
      <canvas ref={canvasRef} style={{
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none"
      }} />
    </div>
  );
}
