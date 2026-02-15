import { useState, useEffect } from 'react';
import logoImg from '../aitchbee.png';
import bgImg from '../Background.png';
import './LoadingScreen.css';

const LOADING_DURATION_MS = 5000;

export default function LoadingScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / LOADING_DURATION_MS) * 100);
      setProgress(p);
      if (elapsed >= LOADING_DURATION_MS) {
        clearInterval(interval);
        setExiting(true);
        setTimeout(() => onFinish?.(), 450);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div className={`loading-screen ${exiting ? 'loading-screen-exit' : ''}`}>
      <div className="loading-bg" style={{ backgroundImage: `url(${bgImg})` }} />
      <div className="loading-content">
        <div className="loading-logo-wrap">
          <img src={logoImg} alt="Aitch'Bee" className="loading-logo" />
          <span className="loading-logo-shine" />
          <span className="loading-logo-glow" />
        </div>
        <div className="loading-bar-wrap">
          <div className="loading-bar" style={{ width: `${progress}%` }} />
        </div>
        <p className="loading-text">Loading the hive...</p>
      </div>
    </div>
  );
}
