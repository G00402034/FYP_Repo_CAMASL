import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import SignPrompt from "../components/SignPrompt";
import HandTracker from "../components/HandTracker";
import styles from "../styles/Home.module.css";
import Cookies from "js-cookie";

export default function Home() {
  const router = useRouter();
  const [currentPrompt, setCurrentPrompt] = useState("A");
  const [detectedGesture, setDetectedGesture] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionResults, setSessionResults] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    const user = Cookies.get("loggedInUser");
    if (user) {
      setLoggedInUser(user);
    } else {
      router.push("/login");
    }
  }, [router]);

  const handleNewPrompt = (newPrompt) => {
    setCurrentPrompt(newPrompt);
    setDetectedGesture(null);
  };

  const handleGestureDetected = (result) => {
    setDetectedGesture(result);
    
    if (isSessionActive) {
      setSessionResults((prev) => {
        const newResults = [
          ...prev,
          {
            timestamp: Date.now(),
            gesture: result.gesture,
            isCorrect: result.isCorrect,
            confidence: result.confidence,
          },
        ];
        
        return newResults;
      });
    }
  };

  const handleSession = async () => {
    if (!loggedInUser) {
      console.log('Session: No user, redirecting to login');
      alert("Please log in first!");
      router.push("/login");
      return;
    }

    setIsSessionActive(true);
    setSessionResults([]);

    setTimeout(async () => {
      setIsSessionActive(false);
      
      if (sessionResults.length === 0) {
        alert("No gestures detected. Please try again!");
        return;
      }

      const correctCount = sessionResults.filter((r) => r.isCorrect).length;
      const accuracyScore = (correctCount / sessionResults.length) * 100;
      const avgConfidence =
        sessionResults.reduce((sum, r) => sum + r.confidence, 0) /
        sessionResults.length;

      try {
        const scoreData = {
          username: loggedInUser,
          sign: currentPrompt,
          score: accuracyScore,
          confidence: avgConfidence,
          date: new Date().toISOString(),
        };
        console.log("Sending score:", scoreData);

        const response = await fetch("/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(scoreData),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to save score");
        }

        console.log("Score saved:", result.data);
        alert(`Session completed! Accuracy: ${accuracyScore.toFixed(1)}%`);
      } catch (error) {
        console.error("Failed to save score:", error);
        alert(`Failed to save session results: ${error.message}`);
      }
    }, 30000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div className={styles.cameraContainer}>
          <HandTracker
            onGestureDetected={handleGestureDetected}
            currentPrompt={currentPrompt}
            isSessionActive={isSessionActive}
          />
        </div>

        <div className={styles.signContainer}>
          <div className={styles.signBox}>
            Current Sign: {currentPrompt}
            {detectedGesture && (
              <div
                className={
                  detectedGesture.isCorrect ? styles.correct : styles.incorrect
                }
              >
                {detectedGesture.gesture} (
                {Math.round(detectedGesture.confidence * 100)}%)
              </div>
            )}
          </div>
          <div className={styles.imageBox}>
            <img
              src={`/signs/${currentPrompt}.jpg`}
              alt={`Sign ${currentPrompt}`}
            />
          </div>
          <SignPrompt onNewPrompt={handleNewPrompt} />
        </div>
      </div>

      <div className={styles.controls}>
        <button
          onClick={handleSession}
          className={styles.button}
          disabled={isSessionActive}
        >
          {isSessionActive
            ? `Session in progress... (${sessionResults.length} samples)`
            : "Start 30s Session"}
        </button>

        {isSessionActive && (
          <div className={styles.sessionStats}>
            Correct: {sessionResults.filter((r) => r.isCorrect).length} /{" "}
            {sessionResults.length}
          </div>
        )}
      </div>
    </div>
  );
}