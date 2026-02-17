import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiBase, getAssetUrl } from '../utils/api';
import { StarRatingDisplay } from '../components/StarRating';
import './Shop.css';

export default function Shop() {
  const { authHeader } = useAuth();
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${getApiBase()}/api/products`, { headers: authHeader() })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        setProducts(data);
        setLoaded(true);
      })
      .catch(() => setProducts([]));
  }, [authHeader]);

  return (
    <div className={`shop-page ${loaded ? 'shop-loaded' : ''}`}>
      <header className="shop-header">
        <span className="shop-header-line shop-header-line-l" />
        <div className="shop-header-content">
          <h1 className="shop-title">Shop AITCH<span className="yellow">BEE</span></h1>
          <p className="shop-desc">All pieces. Black, yellow, white.</p>
          <div className="shop-badge-wrap">
            <span className="shop-badge">{products.length} pieces</span>
          </div>
        </div>
        <span className="shop-header-line shop-header-line-r" />
      </header>

      <div className="shop-grid">
        {products.map((p, index) => (
          <Link
            key={p.id}
            to={`/product/${p.id}`}
            className="product-card"
            style={{ '--card-delay': `${index * 0.08}s` }}
          >
            <div className="product-card-image">
              {p.image?.startsWith('/uploads/') ? (
                <img src={getAssetUrl(p.image)} alt={p.name} className="product-card-img" />
              ) : (
                <div className="product-placeholder">
                  <span className="product-initial">{p.name.charAt(0)}</span>
                </div>
              )}
              <span className="product-card-overlay">View</span>
            </div>
            <div className="product-card-body">
              <span className="product-card-category">{p.category}</span>
              <h3>{p.name}</h3>
              <div className="product-card-rating">
                <StarRatingDisplay averageRating={p.averageRating} ratingCount={p.ratingCount} />
              </div>
              <p className="product-card-price">${p.price?.toFixed(2)}</p>
            </div>
            <span className="product-card-glow" />
          </Link>
        ))}
      </div>
    </div>
  );
}
