import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminUpload.css';

const CATEGORIES = ['T-Shirts', 'Hoodies', 'Sweatshirts', 'Accessories', 'Other'];
const COLOR_OPTIONS = ['Black', 'White', 'Yellow'];

export default function AdminUpload() {
  const { user, authHeader, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    stock: '0',
    colors: [],
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleColor = (color) => {
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.includes(color) ? prev.colors.filter((c) => c !== color) : [...prev.colors, color],
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPEG, PNG, etc.)');
      return;
    }
    setError('');
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!user || user.role !== 'admin') return;
    const price = parseFloat(form.price);
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    if (isNaN(price) || price < 0) {
      setError('Enter a valid price');
      return;
    }
    setLoading(true);
    try {
      let imageBase64 = null;
      if (imageFile) {
        imageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
      }
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          name: form.name.trim(),
          price,
          description: form.description.trim() || undefined,
          category: form.category || 'Other',
          colors: form.colors,
          stock: Math.max(0, parseInt(form.stock, 10) || 0),
          imageBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setSuccess(true);
      setForm({ name: '', price: '', description: '', category: '', stock: '0', colors: [] });
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || (user && user.role !== 'admin' && !loading)) return null;

  return (
    <div className="admin-upload-page">
      <h1 className="admin-upload-title">Upload article</h1>
      <p className="admin-upload-desc">Add a new product to the shop.</p>

      <form onSubmit={handleSubmit} className="admin-upload-form">
        {error && <p className="admin-upload-error">{error}</p>}
        {success && <p className="admin-upload-success">Article added successfully.</p>}

        <label className="admin-upload-label">
          Name *
          <input type="text" name="name" value={form.name} onChange={handleChange} className="admin-upload-input" placeholder="e.g. AITCHBEE Hive Tee" required />
        </label>

        <label className="admin-upload-label">
          Price *
          <input type="number" name="price" value={form.price} onChange={handleChange} className="admin-upload-input" placeholder="49.99" min="0" step="0.01" required />
        </label>

        <label className="admin-upload-label">
          Picture (optional)
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} className="admin-upload-file" />
          {imagePreview && (
            <div className="admin-upload-preview-wrap">
              <img src={imagePreview} alt="Preview" className="admin-upload-preview" />
              <button type="button" className="admin-upload-remove-img" onClick={() => { setImageFile(null); setImagePreview(null); }}>Remove</button>
            </div>
          )}
        </label>

        <label className="admin-upload-label">
          Description
          <textarea name="description" value={form.description} onChange={handleChange} className="admin-upload-input admin-upload-textarea" placeholder="Product description" rows={3} />
        </label>

        <label className="admin-upload-label">
          Category
          <select name="category" value={form.category} onChange={handleChange} className="admin-upload-input">
            <option value="">Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <div className="admin-upload-label">
          Colors
          <div className="admin-upload-colors">
            {COLOR_OPTIONS.map((c) => (
              <label key={c} className="admin-upload-color-chip">
                <input type="checkbox" checked={form.colors.includes(c)} onChange={() => toggleColor(c)} />
                <span>{c}</span>
              </label>
            ))}
          </div>
        </div>

        <label className="admin-upload-label">
          Stock
          <input type="number" name="stock" value={form.stock} onChange={handleChange} className="admin-upload-input" min="0" />
        </label>

        <div className="admin-upload-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Adding...' : 'Add article'}
          </button>
          <button type="button" className="btn admin-upload-back" onClick={() => navigate('/admin')}>
            Back to Admin
          </button>
        </div>
      </form>
    </div>
  );
}
