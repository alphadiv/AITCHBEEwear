import { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import './ProductShowcase3D.css';

function ProductCard3D({ product, index, activeIndex }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  const isActive = index === activeIndex;
  const targetX = isActive ? 0 : index > activeIndex ? 6 : -6;
  const targetZ = isActive ? 0 : -5;
  const targetRotY = isActive ? 0 : index > activeIndex ? -0.5 : 0.5;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    mesh.position.x += (targetX - mesh.position.x) * Math.min(delta * 5, 1);
    mesh.position.z += (targetZ - mesh.position.z) * Math.min(delta * 5, 1);
    mesh.rotation.y += (targetRotY - mesh.rotation.y) * Math.min(delta * 5, 1);
    const scale = hovered && isActive ? 1.05 : 1;
    const s = mesh.scale;
    s.x += (scale - s.x) * Math.min(delta * 8, 1);
    s.y += (scale - s.y) * Math.min(delta * 8, 1);
    s.z += (scale - s.z) * Math.min(delta * 8, 1);
  });

  return (
    <mesh
      ref={meshRef}
      position={[index * 2 - 4, 0, index === activeIndex ? 0 : -5]}
      rotation={[0, index === activeIndex ? 0 : index > activeIndex ? -0.5 : 0.5, 0]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[4, 5, 0.15]} />
      <meshStandardMaterial
        color={isActive ? '#1a1a1a' : '#141414'}
        emissive={hovered && isActive ? '#FFD93D' : '#000000'}
        emissiveIntensity={hovered && isActive ? 0.15 : 0}
        metalness={0.3}
        roughness={0.6}
      />
    </mesh>
  );
}

function Scene({ products, activeIndex }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} />
      <pointLight position={[-5, 5, 5]} intensity={0.5} color="#FFD93D" />
      {products.map((product, i) => (
        <ProductCard3D key={product.id} product={product} index={i} activeIndex={activeIndex} />
      ))}
    </>
  );
}

export default function ProductShowcase3D({ products, onSelect }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const goNext = () => {
    setActiveIndex((i) => (i + 1) % products.length);
  };

  const goPrev = () => {
    setActiveIndex((i) => (i - 1 + products.length) % products.length);
  };

  const current = products[activeIndex];

  return (
    <div className="showcase-3d">
      <div className="showcase-3d-canvas-wrap">
        <Canvas camera={{ position: [0, 0, 12], fov: 45 }} dpr={[1, 2]}>
          <Suspense fallback={null}>
            <Scene products={products} activeIndex={activeIndex} />
          </Suspense>
        </Canvas>
      </div>
      <div className="showcase-3d-controls">
        <button type="button" className="showcase-btn showcase-prev" onClick={goPrev} aria-label="Previous">
          ←
        </button>
        <div className="showcase-info">
          <h3 className="showcase-title">{current?.name}</h3>
          <p className="showcase-price">${current?.price?.toFixed(2)}</p>
          <button type="button" className="showcase-add" onClick={() => onSelect?.(current)}>
            View product
          </button>
        </div>
        <button type="button" className="showcase-btn showcase-next" onClick={goNext} aria-label="Next">
          →
        </button>
      </div>
      <div className="showcase-dots">
        {products.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`showcase-dot ${i === activeIndex ? 'active' : ''}`}
            onClick={() => setActiveIndex(i)}
            aria-label={`Go to product ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
