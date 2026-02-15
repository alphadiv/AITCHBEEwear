import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'aitchbee-secret-change-in-production';
const UPLOADS_DIR = path.join(__dirname, 'uploads');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// In-memory store (use a database in production)
const users = [];
const orders = [];
const verificationCodes = {}; // phone -> { code, expiresAt }

// Seed admin user (password: admin123) and test buyer (password: buyer123)
const seedUsers = async () => {
  if (!users.find((u) => u.email === 'admin@aitchbee.com')) {
    const hash = await bcrypt.hash('admin123', 10);
    users.push({
      id: 'admin-1',
      email: 'admin@aitchbee.com',
      name: 'Admin',
      passwordHash: hash,
      role: 'admin',
    });
    console.log('Admin: admin@aitchbee.com / admin123');
  }
  if (!users.find((u) => u.email === 'buyer@test.com')) {
    const hash = await bcrypt.hash('buyer123', 10);
    users.push({
      id: 'buyer-1',
      email: 'buyer@test.com',
      name: 'Test Buyer',
      phone: '+216123456789',
      passwordHash: hash,
      role: 'user',
    });
    console.log('Buyer (test): buyer@test.com / buyer123');
  }
};

const products = [
  { id: '1', name: 'AITCHBEE Hive Tee', price: 49.99, image: '/products/tee-1.jpg', description: 'Premium black cotton tee with golden bee logo. Limited edition.', category: 'T-Shirts', colors: ['Black', 'White', 'Yellow'], stock: 50, ratings: [] },
  { id: '2', name: 'AITCHBEE Hoodie', price: 89.99, image: '/products/hoodie-1.jpg', description: 'Oversized hoodie with embroidered bee. Heavyweight fleece.', category: 'Hoodies', colors: ['Black', 'Yellow'], stock: 30, ratings: [] },
  { id: '3', name: 'AITCHBEE Cap', price: 34.99, image: '/products/cap-1.jpg', description: 'Structured cap with metallic bee patch. One size fits all.', category: 'Accessories', colors: ['Black', 'White'], stock: 100, ratings: [] },
  { id: '4', name: 'AITCHBEE Crewneck', price: 64.99, image: '/products/crew-1.jpg', description: 'Classic crewneck with subtle hive pattern. Soft cotton blend.', category: 'Sweatshirts', colors: ['Black', 'White', 'Yellow'], stock: 40, ratings: [] },
  { id: '5', name: 'AITCHBEE Tote Bag', price: 29.99, image: '/products/tote-1.jpg', description: 'Canvas tote with screen-printed bee. Eco-friendly.', category: 'Accessories', colors: ['Black', 'Yellow'], stock: 80, ratings: [] },
];

function getProductWithRating(p, userId) {
  const ratings = p.ratings || [];
  const sum = ratings.reduce((s, r) => s + r.rating, 0);
  const averageRating = ratings.length ? Math.round((sum / ratings.length) * 10) / 10 : 0;
  const ratingCount = ratings.length;
  const userRating = userId ? ratings.find((r) => r.userId === userId)?.rating : null;
  const { ratings: _, ...rest } = p;
  return { ...rest, averageRating, ratingCount, userRating };
}

const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const token = auth.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};

// ----- Auth -----
app.post('/api/auth/send-verification', async (req, res) => {
  try {
    const { phone } = req.body || {};
    if (!phone) return res.status(400).json({ error: 'Phone number required' });
    const code = String(Math.floor(100000 + Math.random() * 900000));
    verificationCodes[phone] = { code, expiresAt: Date.now() + 10 * 60 * 1000 };
    console.log(`[VERIFICATION] Code for ${phone}: ${code}`);
    res.json({ message: 'Verification code sent' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to send code' });
  }
});

app.post('/api/auth/verify-phone', async (req, res) => {
  try {
    const { phone, code } = req.body || {};
    if (!phone || !code) return res.status(400).json({ error: 'Phone and code required' });
    const stored = verificationCodes[phone];
    if (!stored || stored.code !== code) return res.status(400).json({ error: 'Invalid code' });
    if (Date.now() > stored.expiresAt) {
      delete verificationCodes[phone];
      return res.status(400).json({ error: 'Code expired' });
    }
    delete verificationCodes[phone];
    res.json({ verified: true });
  } catch (e) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, phone, countryCode } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (!phone) return res.status(400).json({ error: 'Phone number required' });
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return res.status(400).json({ error: 'Email already registered' });
    const fullPhone = countryCode ? `${countryCode}${phone}` : phone;
    if (users.some((u) => u.phone === fullPhone)) return res.status(400).json({ error: 'Phone already registered' });
    const hash = await bcrypt.hash(password, 10);
    const user = { id: 'u-' + Date.now(), email: email.toLowerCase(), name: name || email.split('@')[0], phone: fullPhone, passwordHash: hash, role: 'user' };
    users.push(user);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role });
});

// ----- Products (public) -----
app.get('/api/products', (req, res) => {
  const userId = req.headers.authorization ? (() => { try { return jwt.verify(req.headers.authorization.slice(7), JWT_SECRET)?.id; } catch { return null; } })() : null;
  res.json(products.map((p) => getProductWithRating(p, userId)));
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const userId = req.headers.authorization ? (() => { try { return jwt.verify(req.headers.authorization.slice(7), JWT_SECRET)?.id; } catch { return null; } })() : null;
  res.json(getProductWithRating(product, userId));
});

// Rate product (authenticated user)
app.post('/api/products/:id/rate', authMiddleware, (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const rating = Math.min(5, Math.max(1, Number(req.body?.rating) || 0));
  if (!product.ratings) product.ratings = [];
  const existing = product.ratings.findIndex((r) => r.userId === req.user.id);
  if (existing >= 0) product.ratings[existing].rating = rating;
  else product.ratings.push({ userId: req.user.id, rating });
  res.json(getProductWithRating(product, req.user.id));
});

// ----- Orders (authenticated) -----
app.post('/api/orders', authMiddleware, (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Items required' });
  let total = 0;
  const orderItems = [];
  for (const it of items) {
    const product = products.find((p) => p.id === it.productId);
    if (!product) return res.status(400).json({ error: `Product ${it.productId} not found` });
    const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));
    if (product.stock < qty) return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
    total += product.price * qty;
    orderItems.push({ productId: product.id, name: product.name, price: product.price, quantity: qty });
    product.stock -= qty;
  }
  const user = users.find((u) => u.id === req.user.id);
  const order = { id: 'ord-' + Date.now(), userId: req.user.id, userEmail: user?.email || '', userPhone: user?.phone || '', items: orderItems, total, date: new Date().toISOString() };
  orders.push(order);
  res.status(201).json(order);
});

// ----- Admin -----
app.get('/api/admin/stats', authMiddleware, adminMiddleware, (req, res) => {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const productsCount = products.length;
  const lowStockCount = products.filter((p) => p.stock < 10).length;
  const ordersByMonth = {};
  orders.forEach((o) => {
    const month = o.date.slice(0, 7);
    ordersByMonth[month] = (ordersByMonth[month] || 0) + 1;
  });
  res.json({ totalOrders, totalRevenue, productsCount, lowStockCount, ordersByMonth });
});

app.get('/api/admin/orders', authMiddleware, adminMiddleware, (req, res) => {
  res.json([...orders].reverse());
});

app.get('/api/admin/products', authMiddleware, adminMiddleware, (req, res) => {
  res.json(products.map((p) => ({ ...p, averageRating: (p.ratings?.reduce((s, r) => s + r.rating, 0) / (p.ratings?.length || 1)) || 0, ratingCount: p.ratings?.length || 0 })));
});

app.put('/api/admin/products/:id/stock', authMiddleware, adminMiddleware, (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const stock = Math.max(0, Math.floor(Number(req.body?.stock) ?? product.stock));
  product.stock = stock;
  res.json(product);
});

app.post('/api/admin/products', authMiddleware, adminMiddleware, (req, res) => {
  const { name, price, description, category, colors, stock, imageBase64 } = req.body || {};
  if (!name || price == null) return res.status(400).json({ error: 'Name and price required' });
  const id = 'p-' + Date.now();
  let imagePath = '/products/placeholder.jpg';
  if (imageBase64 && typeof imageBase64 === 'string') {
    try {
      const match = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/);
      const ext = match ? (match[1] === 'jpeg' ? 'jpg' : match[1]) : 'jpg';
      const base64Data = match ? match[2] : imageBase64;
      const buffer = Buffer.from(base64Data, 'base64');
      if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      const filename = `${id}.${ext}`;
      const filepath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(filepath, buffer);
      imagePath = '/uploads/' + filename;
    } catch (e) {
      console.error('Image save failed:', e.message);
    }
  }
  const product = {
    id,
    name: String(name),
    price: Number(price),
    image: imagePath,
    description: String(description || ''),
    category: String(category || 'Other'),
    colors: Array.isArray(colors) ? colors : [],
    stock: Math.max(0, Math.floor(Number(stock) || 0)),
    ratings: [],
  };
  products.push(product);
  res.status(201).json(product);
});

// Start
seedUsers().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`AITCHBEE API running at http://localhost:${PORT}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the other process (e.g. run: netstat -ano | findstr :${PORT} then taskkill /PID <pid> /F)`);
    } else {
      console.error(err);
    }
  });
});
