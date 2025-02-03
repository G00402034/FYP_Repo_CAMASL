import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import SignPrompt from '../components/SignPrompt';
import HandTracker from '../components/HandTracker';
import styles from '../styles/Home.module.css';

export default function Home() {
  const router = useRouter();

  const [currentPrompt, setCurrentPrompt] = useState("A");
  const [detectedGesture, setDetectedGesture] = useState("Unknown Gesture");
  const [isMatch, setIsMatch] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);

  // Check if user is logged in
  useEffect(() => {
    const user = localStorage.getItem("loggedInUser");
    if (user) {
      setLoggedInUser(user);
    }
  }, []);

  // Handle new sign prompt from SignPrompt component
  const handleNewPrompt = (newPrompt) => {
    setCurrentPrompt(newPrompt);
    setIsMatch(false); // Reset match status for each new prompt
  };

  // Handle gesture detection from HandTracking component
  const handleGestureDetected = (gesture) => {
    setDetectedGesture(gesture);
    setIsMatch(gesture.toLowerCase() === currentPrompt.toLowerCase());
  };

  // Handle sign-out
  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    setLoggedInUser(null);
    router.push('/login');
  };

  // Handle ASL session with accuracy tracking
  const handleSession = async () => {
    if (!loggedInUser) {
      alert("Please log in first!");
      router.push("/login");
      return;
    }

    setIsSessionActive(true);
    const scores = [];
    const duration = 30000; // 30 seconds
    const interval = 1000; // 1 frame per second

    const captureInterval = setInterval(() => {
      if (detectedGesture) {
        scores.push(detectedGesture === currentPrompt ? 1 : 0);
      }
    }, interval);

    setTimeout(async () => {
      clearInterval(captureInterval);
      setIsSessionActive(false);

      if (scores.length === 0) {
        alert("No gestures detected. Please try again!");
        return;
      }

      const accuracyScore = (scores.filter((s) => s === 1).length / scores.length) * 100;

      // Store score in database
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
      {/* Top Right: Login, Register, Logout Buttons */}
      <div className={styles.topRightButtons}>
        {loggedInUser ? (
          <>
            <span className={styles.welcomeText}>Welcome, {loggedInUser}!</span>
            <button onClick={handleLogout} className={styles.button}>Logout</button>
          </>
        ) : (
          <>
            <button onClick={() => router.push('/login')} className={styles.button}>Login</button>
            <button onClick={() => router.push('/register')} className={styles.button}>Register</button>
          </>
        )}
      </div>

      {/* Main Content Wrapper */}
      <div className={styles.mainContent}>
        {/* Left Section: Camera */}
        <div className={styles.cameraContainer}>
          <HandTracker onGestureDetected={handleGestureDetected} />
        </div>

        {/* Right Section: Current Sign */}
        <div className={styles.signContainer}>
          <SignPrompt onNewPrompt={handleNewPrompt} detectedGesture={detectedGesture} isMatch={isMatch} />
        </div>
      </div>

      {/* Control Buttons Below Camera */}
      <div className={styles.controls}>
        <button onClick={handleSession} className={styles.button} disabled={isSessionActive}>
          {isSessionActive ? "Session in Progress..." : "Start Session"}
        </button>
        <button onClick={() => router.push('/scores')} className={styles.button}>
          View Scores
        </button>
      </div>
    </div>
  );
}
