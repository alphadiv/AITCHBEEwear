import { useEffect, useState } from 'react';
import './TouchBurst.css';

export default function TouchBurst({ x, y, onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 700);
    return () => clearTimeout(t);
  }, [x, y, onDone]);

  return (
    <div
      className={`touch-burst ${visible ? 'touch-burst-visible' : ''}`}
      style={{ left: x, top: y }}
      aria-hidden
    >
      <span className="touch-burst-inner" />
      <span className="touch-burst-outer" />
      <span className="touch-burst-ring" />
    </div>
  );
}
