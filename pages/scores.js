import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../styles/Scores.module.css";
import Cookies from "js-cookie";

export default function Scores() {
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [scores, setScores] = useState([]);
  const [filteredScores, setFilteredScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterLetter, setFilterLetter] = useState(""); // For filtering by letter
  const [showMaxScores, setShowMaxScores] = useState(false); // Toggle for max scores

  useEffect(() => {
    const user = Cookies.get("loggedInUser");
    if (user) {
      setLoggedInUser(user);
      fetchScores(user);
    } else {
      router.push("/login");
    }
  }, [router]);

  const fetchScores = async (username) => {
    try {
      const response = await fetch(`/api/scores?username=${username}`);
      const result = await response.json();
      if (response.ok && result.success) {
        setScores(result.data);
        setFilteredScores(result.data); // Initially show all scores
      } else {
        throw new Error(result.message || "Failed to fetch scores");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter scores by letter
  const handleFilterByLetter = (e) => {
    const letter = e.target.value.toUpperCase();
    setFilterLetter(letter);
    setShowMaxScores(false); // Reset max scores filter
    if (letter === "") {
      setFilteredScores(scores); // Show all scores if filter is cleared
    } else {
      const filtered = scores.filter((score) =>
        score.sign.toUpperCase() === letter
      );
      setFilteredScores(filtered);
    }
  };

  // Toggle max scores filter
  const handleMaxScores = () => {
    setShowMaxScores(!showMaxScores);
    setFilterLetter(""); // Reset letter filter
    if (!showMaxScores) {
      // Group by sign and find the max score for each sign
      const maxScores = [];
      const signs = [...new Set(scores.map((score) => score.sign))]; // Unique signs
      signs.forEach((sign) => {
        const signScores = scores.filter((s) => s.sign === sign);
        const maxScore = signScores.reduce((max, score) => 
          score.score > max.score ? score : max, signScores[0]);
        maxScores.push(maxScore);
      });
      setFilteredScores(maxScores);
    } else {
      setFilteredScores(scores); // Show all scores
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerBox}>
        <h1>Your Scores</h1>
      </div>

      {/* Filter Controls */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Filter by letter (e.g., A)"
          value={filterLetter}
          onChange={handleFilterByLetter}
          className={styles.input}
          maxLength={1}
        />
        <button onClick={handleMaxScores} className={styles.button}>
          {showMaxScores ? "Show All Scores" : "Show Max Scores"}
        </button>
      </div>

      {loading && <p>Loading scores...</p>}
      {error && <p className={styles.error}>Error: {error}</p>}
      {!loading && !error && filteredScores.length === 0 && (
        <p>No scores found.</p>
      )}
      {!loading && !error && filteredScores.length > 0 && (
        <table className={styles.scoreTable}>
          <thead>
            <tr>
              <th>Sign</th>
              <th>Score</th>
              <th>Confidence</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredScores.map((score, index) => (
              <tr key={index}>
                <td>{score.sign}</td>
                <td>
                  {score.score.toFixed(1)}%
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progress}
                      style={{ width: `${score.score}%` }}
                    ></div>
                  </div>
                </td>
                <td>
                  {(score.confidence * 100).toFixed(1)}%
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progress}
                      style={{ width: `${score.confidence * 100}%` }}
                    ></div>
                  </div>
                </td>
                <td>{new Date(score.date).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button
        onClick={() => router.push("/")}
        className={styles.button}
      >
        Back to Home
      </button>
    </div>
  );
}