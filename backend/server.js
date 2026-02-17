import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as db from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'aitchbee-secret-change-in-production';
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const useSupabase = !!db.supabase;

// In-memory fallback when Supabase is not configured
const users = [];
const orders = [];
const verificationCodes = {};

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

const productsInMemory = [
  { id: '1', name: 'AITCHBEE Hive Tee', price: 49.99, image: '/products/tee-1.jpg', description: 'Premium black cotton tee with golden bee logo. Limited edition.', category: 'T-Shirts', colors: ['Black', 'White', 'Yellow'], stock: 50, ratings: [] },
  { id: '2', name: 'AITCHBEE Hoodie', price: 89.99, image: '/products/hoodie-1.jpg', description: 'Oversized hoodie with embroidered bee. Heavyweight fleece.', category: 'Hoodies', colors: ['Black', 'Yellow'], stock: 30, ratings: [] },
  { id: '3', name: 'AITCHBEE Cap', price: 34.99, image: '/products/cap-1.jpg', description: 'Structured cap with metallic bee patch. One size fits all.', category: 'Accessories', colors: ['Black', 'White'], stock: 100, ratings: [] },
  { id: '4', name: 'AITCHBEE Crewneck', price: 64.99, image: '/products/crew-1.jpg', description: 'Classic crewneck with subtle hive pattern. Soft cotton blend.', category: 'Sweatshirts', colors: ['Black', 'White', 'Yellow'], stock: 40, ratings: [] },
  { id: '5', name: 'AITCHBEE Tote Bag', price: 29.99, image: '/products/tote-1.jpg', description: 'Canvas tote with screen-printed bee. Eco-friendly.', category: 'Accessories', colors: ['Black', 'Yellow'], stock: 80, ratings: [] },
];

async function seedUsersMemory() {
  if (users.find((u) => u.email === 'admin@aitchbee.com')) return;
  const hash = await bcrypt.hash('admin123', 10);
  users.push({ id: 'admin-1', email: 'admin@aitchbee.com', name: 'Admin', passwordHash: hash, role: 'admin' });
  console.log('Admin: admin@aitchbee.com / admin123');
  if (users.find((u) => u.email === 'buyer@test.com')) return;
  const hash2 = await bcrypt.hash('buyer123', 10);
  users.push({ id: 'buyer-1', email: 'buyer@test.com', name: 'Test Buyer', phone: '+216123456789', passwordHash: hash2, role: 'user' });
  console.log('Buyer (test): buyer@test.com / buyer123');
}

function getProductWithRating(p, ratings, userId) {
  const sum = (ratings || []).reduce((s, r) => s + r.rating, 0);
  const ratingCount = (ratings || []).length;
  const averageRating = ratingCount ? Math.round((sum / ratingCount) * 10) / 10 : 0;
  const userRating = userId ? (ratings || []).find((r) => r.userId === userId)?.rating : null;
  const { ratings: _r, ...rest } = p;
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

function getUserIdFromHeader(req) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return null;
    return jwt.verify(auth.slice(7), JWT_SECRET)?.id ?? null;
  } catch {
    return null;
  }
}

// ----- Auth -----
app.post('/api/auth/send-verification', async (req, res) => {
  try {
    const { phone } = req.body || {};
    if (!phone) return res.status(400).json({ error: 'Phone number required' });
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 10 * 60 * 1000;
    if (useSupabase) {
      await db.setVerificationCode(phone, code, expiresAt);
    } else {
      verificationCodes[phone] = { code, expiresAt };
    }
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
    let stored;
    if (useSupabase) {
      stored = await db.getVerificationCode(phone);
      if (stored) await db.deleteVerificationCode(phone);
    } else {
      stored = verificationCodes[phone];
      delete verificationCodes[phone];
    }
    if (!stored || stored.code !== code) return res.status(400).json({ error: 'Invalid code' });
    if (Date.now() > stored.expiresAt) return res.status(400).json({ error: 'Code expired' });
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
    const fullPhone = countryCode ? `${countryCode}${phone}` : phone;
    if (useSupabase) {
      if (await db.userExistsByEmail(email)) return res.status(400).json({ error: 'Email already registered' });
      if (await db.userExistsByPhone(fullPhone)) return res.status(400).json({ error: 'Phone already registered' });
      const hash = await bcrypt.hash(password, 10);
      const user = { id: 'u-' + Date.now(), email: email.toLowerCase(), name: name || email.split('@')[0], phone: fullPhone, passwordHash: hash, role: 'user' };
      await db.createUser(user);
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role } });
    }
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return res.status(400).json({ error: 'Email already registered' });
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
    const user = useSupabase ? await db.getUserByEmail(email) : users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = useSupabase ? await db.getUserById(req.user.id) : users.find((u) => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load user' });
  }
});

// ----- Products (public) -----
app.get('/api/products', async (req, res) => {
  try {
    const userId = getUserIdFromHeader(req);
    if (useSupabase) {
      const productsList = await db.getProducts();
      const out = [];
      for (const p of productsList) {
        const ratings = await db.getRatingsForProduct(p.id);
        out.push(getProductWithRating({ ...p, ratings }, ratings, userId));
      }
      return res.json(out);
    }
    res.json(productsInMemory.map((p) => getProductWithRating(p, p.ratings, userId)));
  } catch (e) {
    res.status(500).json({ error: 'Failed to load products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = useSupabase ? await db.getProductById(req.params.id) : productsInMemory.find((p) => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const userId = getUserIdFromHeader(req);
    const ratings = useSupabase ? await db.getRatingsForProduct(product.id) : (product.ratings || []);
    res.json(getProductWithRating({ ...product, ratings }, ratings, userId));
  } catch (e) {
    res.status(500).json({ error: 'Failed to load product' });
  }
});

app.post('/api/products/:id/rate', authMiddleware, async (req, res) => {
  try {
    const product = useSupabase ? await db.getProductById(req.params.id) : productsInMemory.find((p) => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const rating = Math.min(5, Math.max(1, Number(req.body?.rating) || 0));
    if (useSupabase) {
      await db.upsertProductRating(req.params.id, req.user.id, rating);
      const ratings = await db.getRatingsForProduct(req.params.id);
      const p = await db.getProductById(req.params.id);
      return res.json(getProductWithRating({ ...p, ratings }, ratings, req.user.id));
    }
    if (!product.ratings) product.ratings = [];
    const existing = product.ratings.findIndex((r) => r.userId === req.user.id);
    if (existing >= 0) product.ratings[existing].rating = rating;
    else product.ratings.push({ userId: req.user.id, rating });
    res.json(getProductWithRating(product, product.ratings, req.user.id));
  } catch (e) {
    res.status(500).json({ error: 'Failed to rate' });
  }
});

// ----- Orders (authenticated) -----
app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Items required' });
    const user = useSupabase ? await db.getUserById(req.user.id) : users.find((u) => u.id === req.user.id);
    let total = 0;
    const orderItems = [];
    for (const it of items) {
      const product = useSupabase ? await db.getProductById(it.productId) : productsInMemory.find((p) => p.id === it.productId);
      if (!product) return res.status(400).json({ error: `Product ${it.productId} not found` });
      const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));
      if (product.stock < qty) return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      total += product.price * qty;
      orderItems.push({ productId: product.id, name: product.name, price: product.price, quantity: qty });
      if (useSupabase) {
        await db.updateProductStock(product.id, product.stock - qty);
      } else {
        product.stock -= qty;
      }
    }
    const orderId = 'ord-' + Date.now();
    if (useSupabase) {
      const order = await db.createOrderAndItems(orderId, req.user.id, user?.email || '', user?.phone || '', orderItems, total);
      return res.status(201).json(order);
    }
    const order = { id: orderId, userId: req.user.id, userEmail: user?.email || '', userPhone: user?.phone || '', items: orderItems, total, date: new Date().toISOString() };
    orders.push(order);
    res.status(201).json(order);
  } catch (e) {
    res.status(500).json({ error: 'Order failed' });
  }
});

// ----- Admin -----
app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const ordersList = useSupabase ? await db.getOrdersForStats() : orders;
    const productsList = useSupabase ? await db.getProductsForAdmin() : productsInMemory;
    const totalOrders = ordersList.length;
    const totalRevenue = ordersList.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const productsCount = productsList.length;
    const lowStockCount = productsList.filter((p) => (p.stock ?? 0) < 10).length;
    const ordersByMonth = {};
    ordersList.forEach((o) => {
      const month = (o.date || '').slice(0, 7);
      if (month) ordersByMonth[month] = (ordersByMonth[month] || 0) + 1;
    });
    res.json({ totalOrders, totalRevenue, productsCount, lowStockCount, ordersByMonth });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

app.get('/api/admin/orders', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const ordersList = useSupabase ? await db.getOrders() : [...orders].reverse();
    res.json(ordersList);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

app.get('/api/admin/products', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (useSupabase) {
      const productsList = await db.getProducts();
      const out = [];
      for (const p of productsList) {
        const ratings = await db.getRatingsForProduct(p.id);
        const sum = ratings.reduce((s, r) => s + r.rating, 0);
        const ratingCount = ratings.length;
        out.push({ ...p, averageRating: ratingCount ? sum / ratingCount : 0, ratingCount });
      }
      return res.json(out);
    }
    res.json(productsInMemory.map((p) => ({ ...p, averageRating: (p.ratings?.reduce((s, r) => s + r.rating, 0) / (p.ratings?.length || 1)) || 0, ratingCount: p.ratings?.length || 0 })));
  } catch (e) {
    res.status(500).json({ error: 'Failed to load products' });
  }
});

app.put('/api/admin/products/:id/stock', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stock = Math.max(0, Math.floor(Number(req.body?.stock) ?? 0));
    if (useSupabase) {
      const product = await db.updateProductStock(req.params.id, stock);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      return res.json(product);
    }
    const product = productsInMemory.find((p) => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    product.stock = stock;
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

app.post('/api/admin/products', authMiddleware, adminMiddleware, async (req, res) => {
  try {
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
    };
    if (useSupabase) {
      const created = await db.createProduct({ ...product, ratings: [] });
      return res.status(201).json(created);
    }
    product.ratings = [];
    productsInMemory.push(product);
    res.status(201).json(product);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Start
async function start() {
  if (useSupabase) {
    await db.seedUsersIfNeeded();
    console.log('Using Supabase database');
  } else {
    await seedUsersMemory();
    console.log('Using in-memory store (set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to use Supabase)');
  }
  const server = app.listen(PORT, () => {
    console.log(`AITCHBEE API running at http://localhost:${PORT}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use.`);
    } else {
      console.error(err);
    }
  });
}
start();
