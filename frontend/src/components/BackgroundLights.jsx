import './BackgroundLights.css';

export default function BackgroundLights() {
  return (
    <div className="bg-lights" aria-hidden>
      <div className="bg-light bg-light-1" />
      <div className="bg-light bg-light-2" />
      <div className="bg-light bg-light-3" />
      <div className="bg-light bg-light-4" />
      <div className="bg-light bg-light-5" />
      <div className="bg-glow-line bg-glow-line-1" />
      <div className="bg-glow-line bg-glow-line-2" />
      <div className="bg-noise" />
    </div>
  );
}
