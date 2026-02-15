import { useState, useCallback, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import FlyingBee from './FlyingBee';
import CursorBee from './CursorBee';
import BackgroundLights from './BackgroundLights';
import TouchBurst from './TouchBurst';
import './Layout.css';

let burstId = 0;

export default function Layout({ children }) {
  const [bursts, setBursts] = useState([]);
  const [beeTarget, setBeeTarget] = useState(null);

  const handleTouch = useCallback((clientX, clientY) => {
    const id = ++burstId;
    setBursts((prev) => [...prev, { id, x: clientX, y: clientY }]);
    setBeeTarget({ x: clientX, y: clientY });
    setTimeout(() => setBeeTarget(null), 2800);
  }, []);

  const removeBurst = useCallback((id) => {
    setBursts((prev) => prev.filter((b) => b.id !== id));
  }, []);

  useEffect(() => {
    const onTouchStart = (e) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        handleTouch(t.clientX, t.clientY);
      }
    };
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    return () => document.removeEventListener('touchstart', onTouchStart);
  }, [handleTouch]);

  return (
    <div className="layout">
      <BackgroundLights />
      <CursorBee />
      <FlyingBee targetPosition={beeTarget} />
      {bursts.map((b) => (
        <TouchBurst key={b.id} x={b.x} y={b.y} onDone={() => removeBurst(b.id)} />
      ))}
      <Header />
      <main className="main">{children}</main>
      <Footer />
    </div>
  );
}
