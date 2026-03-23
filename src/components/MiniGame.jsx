import { useState } from 'react';
import JSConfetti from 'canvas-confetti';

const bonusPoints = [5, 0, 3, 1]; // 4 slices

export default function MiniGame({ onComplete }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);

  const spin = () => {
    if (spinning || result !== null) return;
    setSpinning(true);
    
    // Calculate random rotation between 3 to 6 full spins
    const extraSpins = 360 * (Math.floor(Math.random() * 4) + 3);
    const randomAngle = Math.floor(Math.random() * 360);
    const finalRotation = rotation + extraSpins + randomAngle;
    
    setRotation(finalRotation);

    setTimeout(() => {
      setSpinning(false);
      // Determine slice based on angle
      // Array mapping:
      // 0-90deg -> index 3 (because it rotates clockwise but arrow is at top)
      const normalizedAngle = finalRotation % 360;
      let sliceIdx = 0;
      if (normalizedAngle < 90) sliceIdx = 3;
      else if (normalizedAngle < 180) sliceIdx = 2;
      else if (normalizedAngle < 270) sliceIdx = 1;
      else sliceIdx = 0;

      const points = bonusPoints[sliceIdx];
      setResult(points);
      
      if (points > 0) {
        JSConfetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }

      setTimeout(() => {
        onComplete(points);
      }, 3000); // Wait 3s before triggering completion
    }, 3000); // 3s CSS transition duration
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="spinner-container">
        <div className="spinner-arrow"></div>
        <div 
          className="spinner-wheel" 
          style={{ transform: `rotate(${rotation}deg)` }}
        ></div>
        {/* We can add text into the background conic-gradient or let it be pure visual with colors mapped to points */}
      </div>

      <button className="btn mt-4" onClick={spin} disabled={spinning || result !== null}>
        {result !== null ? "Game Over" : "Spin the Wheel!"}
      </button>

      {result !== null && (
        <div className="spinner-result animate-pulse">
          You won +{result} bonus points!
        </div>
      )}
    </div>
  );
}
