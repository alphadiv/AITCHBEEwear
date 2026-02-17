import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../aitchbee.png';
import LoginRegister from './LoginRegister';
import './Header.css';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, authModalOpen, setAuthModalOpen } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const refreshCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('aitchbee-cart') || '[]');
    setCartCount(cart.length);
  };

  useEffect(() => {
    refreshCartCount();
    window.addEventListener('storage', refreshCartCount);
    window.addEventListener('aitchbee-cart-update', refreshCartCount);
    return () => {
      window.removeEventListener('storage', refreshCartCount);
      window.removeEventListener('aitchbee-cart-update', refreshCartCount);
    };
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path || (path === '/' && location.pathname === '/');
  const isAdminArea = location.pathname === '/admin' || location.pathname.startsWith('/admin/');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
        <div className="header-shine" />
        <div className="header-inner">
          <Link to="/" className="logo logo-link">
            <span className="logo-img-wrap">
              <img src={logoImg} alt="Aitch'Bee" className="logo-img" />
              <span className="logo-shine" />
            </span>
          </Link>
          <nav className="nav">
            {!isAdminArea && (
              <>
                <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
                <Link to="/shop" className={`nav-link ${isActive('/shop') ? 'active' : ''}`}>Shop</Link>
                <Link to="/cart" className={`nav-link nav-cart ${isActive('/cart') ? 'active' : ''}`}>
                  <span className="nav-cart-text">Cart</span>
                  {cartCount > 0 && <span className="nav-cart-badge">{cartCount > 9 ? '9+' : cartCount}</span>}
                </Link>
              </>
            )}
            {user ? (
              <>
                {user.role === 'admin' && (
                  <>
                    <Link to="/admin" className={`nav-link ${isActive('/admin') && location.pathname === '/admin' ? 'active' : ''}`}>Admin</Link>
                    <Link to="/admin/upload" className={`nav-link ${isActive('/admin/upload') ? 'active' : ''}`}>Upload</Link>
                  </>
                )}
                <button type="button" className="nav-link nav-btn" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <button type="button" className="nav-link nav-btn nav-login" onClick={() => setAuthModalOpen(true)}>
                Login
              </button>
            )}
          </nav>
        </div>
        <div className="header-bottom-line" />
      </header>
      {authModalOpen && <LoginRegister onClose={() => setAuthModalOpen(false)} />}
    </>
  );
}
