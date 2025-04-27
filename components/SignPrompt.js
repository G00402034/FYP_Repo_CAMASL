import React, { useEffect, useState } from 'react';

export default function SignPrompt({ onNewPrompt }) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const [currentSign, setCurrentSign] = useState('A');
  const [isHovered, setIsHovered] = useState(false); 

  const getNextSign = () => {
    const nextSign = letters[Math.floor(Math.random() * letters.length)];
    setCurrentSign(nextSign);
    if (onNewPrompt) onNewPrompt(nextSign); 
  };

  useEffect(() => {
    getNextSign();
  }, []);

  const buttonStyle = {
    padding: '10px 20px',
    fontSize: '1rem',
    backgroundColor: isHovered ? '#0056b3' : '#2c3e50', // Change background on hover
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '10px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <button 
        onClick={getNextSign} 
        style={buttonStyle}
        onMouseEnter={() => setIsHovered(true)} // Set hover state to true
        onMouseLeave={() => setIsHovered(false)} // Set hover state to false
      >
        Next Sign
      </button>
    </div>
  );
}
