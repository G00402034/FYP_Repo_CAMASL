import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
// Import the worker using the next-worker loader syntax:
import Worker from "../workers/handWorker.worker.js";

export default function HandTracker({ onGestureDetected }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [workerInstance, setWorkerInstance] = useState(null);
  const [modelReady, setModelReady] = useState(false);

  // Create the worker once when the component mounts.
  useEffect(() => {
    // Instantiate the worker using next-worker.
    const worker = new Worker();
    setWorkerInstance(worker);
    console.log("HandTracker: Worker created", worker);

    // Listen for messages from the worker.
    worker.onmessage = (e) => {
      const data = e.data;
      if (data.status === "modelLoaded") {
        setModelReady(true);
        console.log("HandTracker: Model loaded in worker");
      } else if (data.status === "modelError") {
        console.error("HandTracker: Model load error in worker:", data.error);
      } else if (data.predictedSign !== undefined) {
        console.log("HandTracker: Received prediction from worker:", data.predictedSign);
        if (onGestureDetected) onGestureDetected(data.predictedSign);
      }
    };

    worker.onerror = (err) => {
      console.error("HandTracker: Worker encountered an error:", err);
    };

    return () => {
      worker.terminate();
    };
  }, [onGestureDetected]);

  // Detection loop: capture frames and send them to the worker when ready.
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
        // Update canvas dimensions (if needed)
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;

        const now = Date.now();
        // Throttle sending frames (e.g. every 500ms)
        if (now - lastWorkerCall > 500) {
          lastWorkerCall = now;
          try {
            const imageBitmap = await createImageBitmap(video);
            console.log("HandTracker: ImageBitmap created", imageBitmap.width, imageBitmap.height);
            // Post the imageBitmap to the worker (transfer it).
            workerInstance.postMessage({ command: "predict", imageBitmap }, [imageBitmap]);
          } catch (err) {
            console.error("HandTracker: Error creating ImageBitmap:", err);
          }
        }
      }
      setTimeout(detectHands, 100);
    };

    detectHands();
  }, [workerInstance, modelReady]);

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
      {/* Webcam Feed */}
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
      {/* Canvas Overlay (if needed) */}
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
    </div>
  );
}
