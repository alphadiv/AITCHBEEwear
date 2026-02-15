import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <Link to="/" className="footer-logo">AITCH<span className="logo-bee">BEE</span></Link>
        <p className="footer-tagline">Branding clothes. Buzzing style.</p>
        <div className="footer-links">
          <Link to="/shop">Shop</Link>
          <Link to="/cart">Cart</Link>
          <a href="#contact">Contact</a>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} AITCHBEE. All rights reserved.</p>
      </div>
    </footer>
  );
}
