import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "../styles/Scores.module.css";

export default function Scores() {
  const [scores, setScores] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const loggedInUser = localStorage.getItem("loggedInUser");

    if (!loggedInUser) {
      router.push("/login"); // Redirect if not logged in
      return;
    }

    async function fetchScores() {
      const response = await fetch(`/api/scores?username=${loggedInUser}`);
      const data = await response.json();

      if (data.success) {
        setScores(data.data);
      }
    }

    fetchScores();
  }, []);

  return (
    <div className={styles.container}>
      <h1>{localStorage.getItem("loggedInUser")}'s Scores</h1>
      <ul className={styles.scoreList}>
        {scores.map((score, index) => (
          <li key={index}>
            {score.sign}: {score.score} points on {new Date(score.date).toLocaleDateString()}
          </li>
        ))}
      </ul>
      <button onClick={() => router.push("/")}>Back to Home</button>
    </div>
  );
}
