import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductShowcase3D from '../components/ProductShowcase3D';
import logoImg from '../aitchbee.png';
import './Home.css';

export default function Home() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then(setProducts)
      .catch(() => setProducts([
        { id: '1', name: 'AITCHBEE Hive Tee', price: 49.99, image: '', description: '', category: 'T-Shirts', colors: [] },
        { id: '2', name: 'AITCHBEE Hoodie', price: 89.99, image: '', description: '', category: 'Hoodies', colors: [] },
        { id: '3', name: 'AITCHBEE Cap', price: 34.99, image: '', description: '', category: 'Accessories', colors: [] },
        { id: '4', name: 'AITCHBEE Crewneck', price: 64.99, image: '', description: '', category: 'Sweatshirts', colors: [] },
        { id: '5', name: 'AITCHBEE Tote Bag', price: 29.99, image: '', description: '', category: 'Accessories', colors: [] },
      ]));
  }, []);

  const handleSelectProduct = (product) => {
    if (product?.id) navigate(`/product/${product.id}`);
  };

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-logo-wrap">
          <img src={logoImg} alt="Aitch'Bee" className="hero-logo" />
          <span className="hero-logo-shine" />
          <span className="hero-logo-glow" />
        </div>
        <p className="hero-subtitle">Branding clothes. Buzzing style.</p>
        <div className="hero-cta">
          <button type="button" className="btn btn-primary" onClick={() => navigate('/shop')}>
            Shop now
          </button>
        </div>
      </section>

      <section className="showcase-section">
        <h2 className="section-title">Featured</h2>
        <p className="section-desc">Swipe right or use arrows for 3D product view</p>
        {products.length > 0 ? (
          <ProductShowcase3D products={products} onSelect={handleSelectProduct} />
        ) : (
          <div className="showcase-loading">Loading...</div>
        )}
      </section>

      <section className="brand-section">
        <div className="brand-grid">
          <div className="brand-card">
            <span className="brand-icon">◆</span>
            <h3>Premium quality</h3>
            <p>Cotton & sustainable materials</p>
          </div>
          <div className="brand-card">
            <span className="brand-icon">◆</span>
            <h3>Limited drops</h3>
            <p>Exclusive designs, small batches</p>
          </div>
          <div className="brand-card">
            <span className="brand-icon">◆</span>
            <h3>Worldwide shipping</h3>
            <p>Fast & tracked delivery</p>
          </div>
        </div>
      </section>
    </div>
  );
}
