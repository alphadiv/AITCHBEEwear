import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiBase, safeJson } from '../utils/api';
import './Admin.css';

export default function Admin() {
  const { user, authHeader, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStock, setEditingStock] = useState(null);
  const [stockValue, setStockValue] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/');
      return;
    }
    if (user?.role !== 'admin') return;

    const base = getApiBase();
    const h = authHeader();
    Promise.all([
      fetch(`${base}/api/admin/stats`, { headers: h }).then((r) => r.ok ? safeJson(r) : Promise.reject()),
      fetch(`${base}/api/admin/orders`, { headers: h }).then((r) => r.ok ? safeJson(r) : Promise.reject()),
      fetch(`${base}/api/admin/products`, { headers: h }).then((r) => r.ok ? safeJson(r) : Promise.reject()),
    ])
      .then(([s, o, p]) => {
        setStats(s);
        setOrders(o);
        setProducts(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, navigate, authHeader]);

  const updateStock = (productId) => {
    const v = parseInt(stockValue, 10);
    if (isNaN(v) || v < 0) return;
    fetch(`${getApiBase()}/api/admin/products/${productId}/stock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ stock: v }),
    })
      .then((r) => r.ok ? safeJson(r) : Promise.reject())
      .then((p) => {
        setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, stock: p.stock } : x)));
        setEditingStock(null);
      })
      .catch(() => {
        setEditingStock(null);
      });
  };

  if (authLoading || (user && user.role !== 'admin' && !loading)) return null;
  if (loading || !stats) return <div className="admin-page"><p className="admin-loading">Loading...</p></div>;

  return (
    <div className="admin-page">
      <h1 className="admin-title">Admin Dashboard</h1>
      <p className="admin-welcome">Welcome, {user?.name}</p>

      <section className="admin-stats">
        <div className="admin-stat-card">
          <span className="admin-stat-value">{stats.totalOrders}</span>
          <span className="admin-stat-label">Total orders</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-value">${stats.totalRevenue?.toFixed(2)}</span>
          <span className="admin-stat-label">Revenue</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-value">{stats.productsCount}</span>
          <span className="admin-stat-label">Articles</span>
        </div>
        <div className="admin-stat-card admin-stat-warn">
          <span className="admin-stat-value">{stats.lowStockCount}</span>
          <span className="admin-stat-label">Low stock (&lt;10)</span>
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">Orders</h2>
        <div className="admin-orders-wrap">
          {orders.length === 0 ? (
            <p className="admin-empty">No orders yet.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Items</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{new Date(o.date).toLocaleDateString()}</td>
                    <td>{o.userEmail || '—'}</td>
                    <td>{o.userPhone || '—'}</td>
                    <td>{o.items?.map((i) => `${i.name} × ${i.quantity}`).join(', ')}</td>
                    <td>${o.total?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">Products & stock</h2>
        <div className="admin-products-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Ratings</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={p.stock < 10 ? 'admin-row-low' : ''}>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>${p.price?.toFixed(2)}</td>
                  <td>
                    {editingStock === p.id ? (
                      <input
                        type="number"
                        min="0"
                        value={stockValue}
                        onChange={(e) => setStockValue(e.target.value)}
                        className="admin-stock-input"
                        autoFocus
                      />
                    ) : (
                      p.stock
                    )}
                  </td>
                  <td>{p.ratingCount ? `${p.averageRating?.toFixed(1)} ★ (${p.ratingCount})` : '—'}</td>
                  <td>
                    {editingStock === p.id ? (
                      <>
                        <button type="button" className="admin-btn admin-btn-ok" onClick={() => updateStock(p.id)}>Save</button>
                        <button type="button" className="admin-btn" onClick={() => setEditingStock(null)}>Cancel</button>
                      </>
                    ) : (
                      <button type="button" className="admin-btn" onClick={() => { setEditingStock(p.id); setStockValue(String(p.stock)); }}>Edit stock</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
