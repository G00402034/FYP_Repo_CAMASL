import React, { useState, useEffect } from 'react';

export default function ScoreTracker({ username }) {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    async function fetchScores() {
      const response = await fetch(`/api/scores?username=${username}`);
      const data = await response.json();
      if (data.success) {
        setScores(data.data);
      }
    }
    fetchScores();
  }, [username]);

  return (
    <div>
      <h2>User Scores</h2>
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