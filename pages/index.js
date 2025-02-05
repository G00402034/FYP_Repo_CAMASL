import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import SignPrompt from "../components/SignPrompt";
import HandTracker from "../components/HandTracker";
import styles from "../styles/Home.module.css";

export default function Home() {
  const router = useRouter();
  const [currentPrompt, setCurrentPrompt] = useState("A");
  const [detectedGesture, setDetectedGesture] = useState("Unknown Gesture");
  const [isMatch, setIsMatch] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [scores, setScores] = useState([]);

  let captureInterval = null;
  let sessionTimeout = null;

  useEffect(() => {
    return () => {
      if (captureInterval) clearInterval(captureInterval);
      if (sessionTimeout) clearTimeout(sessionTimeout);
    };
  }, []);

  const handleNewPrompt = (newPrompt) => {
    setCurrentPrompt(newPrompt);
    setIsMatch(false);
    setScores([]);
  };

  const handleGestureDetected = (gesture) => {
    console.log("Main: Detected gesture:", gesture);
    setDetectedGesture(gesture);
    setIsMatch(gesture.toLowerCase() === currentPrompt.toLowerCase());
  };

  const handleSession = async () => {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (!loggedInUser) {
      alert("Please log in first!");
      router.push("/login");
      return;
    }

    setIsSessionActive(true);
    setScores([]);

    const duration = 30000; // 30 seconds
    const interval = 1000;  // capture every 1 second

    captureInterval = setInterval(() => {
      setScores((prevScores) => [
        ...prevScores,
        detectedGesture.toLowerCase() === currentPrompt.toLowerCase() ? 1 : 0,
      ]);
    }, interval);

    sessionTimeout = setTimeout(async () => {
      clearInterval(captureInterval);
      setIsSessionActive(false);

      if (scores.length === 0) {
        alert("No gestures detected. Please try again!");
        return;
      }

      const accuracyScore = (scores.filter((s) => s === 1).length / scores.length) * 100;

      // Save score in the database.
      await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loggedInUser,
          sign: currentPrompt,
          score: accuracyScore,
          date: new Date(),
        }),
      });

      alert(`Your accuracy for ${currentPrompt}: ${accuracyScore.toFixed(2)}%`);
    }, duration);
  };

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div className={styles.cameraContainer}>
          <HandTracker onGestureDetected={handleGestureDetected} />
        </div>
        <div className={styles.signContainer}>
          <SignPrompt
            onNewPrompt={handleNewPrompt}
            detectedGesture={detectedGesture}
            isMatch={isMatch}
          />
        </div>
      </div>
      <div className={styles.controls}>
        <button
          onClick={handleSession}
          className={styles.button}
          disabled={isSessionActive}
        >
          {isSessionActive ? "Session in Progress..." : "Start Session"}
        </button>
      </div>
    </div>
  );
}
