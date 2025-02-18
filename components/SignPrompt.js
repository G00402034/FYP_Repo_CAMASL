
import React, { useEffect, useState } from 'react';

export default function SignPrompt({ onNewPrompt, detectedGesture, isMatch }) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const [currentSign, setCurrentSign] = useState('A');

  const getNextSign = () => {
    const nextSign = letters[Math.floor(Math.random() * letters.length)];
    setCurrentSign(nextSign);
    if (onNewPrompt) onNewPrompt(nextSign);
  };

  useEffect(() => {
    getNextSign();
  }, []);

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
    },
    image: {
      width: '200px',
      height: '200px',
      margin: '20px',
      border: '1px solid #ccc',
    },
    button: {
      padding: '10px 20px',
      fontSize: '1rem',
      backgroundColor: '#ff0606',
      color: '#fff',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      marginTop: '10px',
    },
  };

  return (
    <div style={styles.container}>
      <h2>Current Sign: {currentSign}</h2>
      <img src={`/signs/${currentSign}.jpg`} style={styles.image} alt={`Sign ${currentSign}`} />
      <button onClick={getNextSign} style={styles.button}>
        Next Sign
      </button>
    </div>
  );
}
