import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";

export default function HandTracker({ onGestureDetected }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [workerInstance, setWorkerInstance] = useState(null);
  const [modelReady, setModelReady] = useState(false);
  const [error, setError] = useState(null);
  const [model, setModel] = useState(null);

  // Create the worker once when the component mounts.
  useEffect(() => {
    const worker = new Worker("/workers/handWorker.js");

    setWorkerInstance(worker);
    console.log("HandTracker: Worker created");

    // Listen for messages from the worker
    worker.onmessage = (e) => {
      const data = e.data;

      if (data.status === "tfVersion") {
        console.log("TensorFlow.js Version:", data.version);
      } else if (data.status === "modelLoaded") {
        setModelReady(true);
        console.log("HandTracker: Model loaded in worker");
      } else if (data.status === "modelError") {
        console.error("HandTracker: Model load error in worker:", data.error);
        setError(`Model load failed: ${data.error}`);
      } else if (data.status === "predictionError") {
        console.error("HandTracker: Prediction error in worker:", data.error);
        setError(`Prediction failed: ${data.error}`);
      } else if (data.predictedSign !== undefined) {
        console.log("HandTracker: Received prediction from worker:", data.predictedSign);
        if (onGestureDetected) onGestureDetected(data.predictedSign);
      }
    };

    worker.onerror = (err) => {
      console.error("HandTracker: Worker encountered an error:", err);
      setError(`Worker error: ${err.message}`);
    };

   
    worker.postMessage({ command: "loadModel" });

    return () => {
      worker.terminate();
    };
  }, [onGestureDetected]);

  //capture frames and send them to the worker when ready.
  useEffect(() => {
    let lastWorkerCall = Date.now();

    const detectHands = async () => {
      if (
        webcamRef.current &&
        webcamRef.current.video.readyState === 4 &&
        workerInstance &&
        modelReady
      ) {
        const video = webcamRef.current.video;
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;

        const now = Date.now();
        if (now - lastWorkerCall > 500) { // Throttle to every 500ms
          lastWorkerCall = now;
          try {
            const imageBitmap = await createImageBitmap(video);
            console.log("HandTracker: ImageBitmap created", imageBitmap.width, imageBitmap.height);
            workerInstance.postMessage({ command: "predict", imageBitmap }, [imageBitmap]);
          } catch (err) {
            console.error("HandTracker: Error creating ImageBitmap:", err);
            setError("Error processing the video frame");
          }
        }
      }
      setTimeout(detectHands, 100);
    };

    detectHands();
  }, [workerInstance, modelReady]);

  // Load the model directly in the main thread 
  const loadModelDirectly = async () => {
    try {
      const modelPath = '/model/model.json'; 
      const loadedModel = await tf.loadGraphModel(modelPath);
      setModel(loadedModel);
      console.log("Main thread: Model loaded successfully.");
      setModelReady(true);
    } catch (error) {
      console.error("Main thread: Model load error:", error);
      setError(`Model load failed: ${error.message}`);
    }
  };

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Webcam
        ref={webcamRef}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        mirrored
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
      <button onClick={loadModelDirectly}>Load Model (Main Thread)</button>
      <div>{modelReady ? "Model Ready" : "Loading Model..."}</div>
    </div>
  );
}
