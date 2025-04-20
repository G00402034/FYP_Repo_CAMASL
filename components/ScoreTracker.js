import React, { useState, useEffect } from 'react';

export default function ScoreTracker({ username }) {
  const [scores, setScores] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchScores() {
      try {
        if (!username) {
          setError("No username provided");
          return;
        }
        const response = await fetch(`/api/scores?username=${username}`);
        const data = await response.json();
        if (data.success) {
          setScores(data.data);
          setError(null);
        } else {
          setError(data.message || "Failed to fetch scores");
        }
      } catch (err) {
        console.error("Error fetching scores:", err);
        setError("Failed to fetch scores");
      }
    }
    fetchScores();
  }, [username]);

  return (
    <div>
      <h2>User Scores</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {scores.length === 0 && !error && <p>No scores available</p>}
      <ul>
        {scores.map((score, index) => (
          <li key={index}>
            {score.date}: {score.sign} - {score.score} points
          </li>
        ))}
      </ul>
    </div>
  );
}