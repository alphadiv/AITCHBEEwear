import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiBase, safeJson } from '../utils/api';
import './Cart.css';

export default function Cart() {
  const { user, authHeader } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem('aitchbee-cart') || '[]'));
    setMounted(true);
  }, []);

  const remove = (index) => {
    setRemoving(index);
    setTimeout(() => {
      const next = items.filter((_, i) => i !== index);
      setItems(next);
      localStorage.setItem('aitchbee-cart', JSON.stringify(next));
      setRemoving(null);
    }, 350);
  };

  const total = items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);

  const checkout = async () => {
    if (user) {
      setCheckingOut(true);
      try {
        const orderItems = items.map((i) => ({ productId: i.id, quantity: i.quantity || 1 }));
        const res = await fetch(`${getApiBase()}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify({ items: orderItems }),
        });
        const data = await safeJson(res).catch(() => ({}));
        if (res.ok) {
          localStorage.setItem('aitchbee-cart', '[]');
          window.dispatchEvent(new CustomEvent('aitchbee-cart-update'));
          setItems([]);
          setOrderSuccess(true);
        } else {
          alert(data.error || 'Checkout failed');
        }
      } catch (e) {
        alert(e.message || 'Checkout failed');
      } finally {
        setCheckingOut(false);
      }
    }
  };

  if (orderSuccess) {
    return (
      <div className="cart-page cart-page-empty">
        <div className="cart-empty-wrap">
          <h1 className="cart-title">Order placed</h1>
          <div className="cart-empty">
            <div className="cart-empty-icon">
              <span className="cart-empty-icon-bag">✓</span>
              <span className="cart-empty-icon-glow" />
            </div>
            <h2 className="cart-empty-title">Thank you</h2>
            <p className="cart-empty-desc">Your order has been received.</p>
            <Link to="/shop" className="btn btn-primary cart-empty-cta">Continue shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0 && mounted) {
    return (
      <div className="cart-page cart-page-empty">
        <div className="cart-empty-wrap">
          <h1 className="cart-title">Your cart</h1>
          <div className="cart-empty">
            <div className="cart-empty-icon">
              <span className="cart-empty-icon-bag">🛒</span>
              <span className="cart-empty-icon-glow" />
            </div>
            <h2 className="cart-empty-title">Your cart is empty</h2>
            <p className="cart-empty-desc">Add something from the hive.</p>
            <Link to="/shop" className="btn btn-primary cart-empty-cta">
              Shop AITCHBEE
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <div className={`cart-page ${mounted ? 'cart-mounted' : ''}`}>
      <header className="cart-header">
        <h1 className="cart-title">Your cart</h1>
        <span className="cart-count">{items.length} item{items.length !== 1 ? 's' : ''}</span>
      </header>

      <div className="cart-list">
        {items.map((item, i) => (
          <div
            key={`${item.id}-${i}`}
            className={`cart-item ${removing === i ? 'cart-item-removing' : ''}`}
            style={{ '--item-delay': `${i * 0.06}s` }}
          >
            <div className="cart-item-image">
              <span className="product-initial">{item.name?.charAt(0)}</span>
            </div>
            <div className="cart-item-info">
              <h3>{item.name}</h3>
              <p>${item.price?.toFixed(2)} × {item.quantity || 1}</p>
            </div>
            <p className="cart-item-total">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
            <button
              type="button"
              className="cart-remove"
              onClick={() => remove(i)}
              aria-label="Remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="cart-footer">
        <div className="cart-total-wrap">
          <span className="cart-total-label">Total</span>
          <span className="cart-total-amount">${total.toFixed(2)}</span>
        </div>
        {user ? (
          <button type="button" className="btn btn-primary cart-checkout" onClick={checkout} disabled={checkingOut}>
            {checkingOut ? 'Placing order...' : 'Checkout'}
          </button>
        ) : (
          <p className="cart-login-hint">Login to place an order</p>
        )}
      </div>
    </div>
  );
}
