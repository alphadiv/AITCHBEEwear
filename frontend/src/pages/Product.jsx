import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StarRatingDisplay, StarRatingInput } from '../components/StarRating';
import './Product.css';

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, authHeader } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const fetchProduct = () => {
    fetch(`/api/products/${id}`, { headers: authHeader() })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    fetchProduct();
  }, [id, user?.id]);

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('aitchbee-cart') || '[]');
    cart.push({ ...product, quantity: 1 });
    localStorage.setItem('aitchbee-cart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('aitchbee-cart-update'));
    navigate('/cart');
  };

  const submitRating = async (rating) => {
    if (!user) return;
    setRatingSubmitting(true);
    try {
      const res = await fetch(`/api/products/${id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ rating }),
      });
      const data = await res.json();
      if (res.ok) setProduct(data);
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (loading) return <div className="product-loading">Loading...</div>;
  if (!product) return <div className="product-error">Product not found. <button type="button" onClick={() => navigate('/shop')}>Back to shop</button></div>;

  return (
    <div className="product-page">
      <button type="button" className="product-back" onClick={() => navigate(-1)}>← Back</button>
      <div className="product-layout">
        <div className="product-image-wrap">
          {product.image?.startsWith('/uploads/') ? (
            <img src={product.image} alt={product.name} className="product-image-real" />
          ) : (
            <div className="product-image-placeholder">
              <span className="product-initial">{product.name.charAt(0)}</span>
            </div>
          )}
        </div>
        <div className="product-details">
          <p className="product-category">{product.category}</p>
          <h1 className="product-name">{product.name}</h1>
          <div className="product-rating-row">
            <StarRatingDisplay averageRating={product.averageRating} ratingCount={product.ratingCount} />
          </div>
          <p className="product-price">${product.price?.toFixed(2)}</p>
          <p className="product-desc">{product.description}</p>
          {user && (
            <div className="product-rate-block">
              <span className="product-rate-label">Your rating:</span>
              <StarRatingInput
                value={product.userRating}
                onChange={submitRating}
                disabled={ratingSubmitting}
              />
            </div>
          )}
          {product.colors?.length > 0 && (
            <div className="product-colors">
              <span>Colors:</span>
              <div className="color-dots">
                {product.colors.map((c) => (
                  <span key={c} className="color-dot" title={c} style={{ background: c === 'Black' ? '#1a1a1a' : c === 'Yellow' ? '#FFD93D' : '#fafafa' }} />
                ))}
              </div>
            </div>
          )}
          <button type="button" className="btn btn-primary product-add" onClick={addToCart}>
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
