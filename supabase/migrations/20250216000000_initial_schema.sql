-- AITCHBEE – Supabase schema (run in Supabase SQL Editor or via CLI)
-- Tables: users, products, product_ratings, orders, order_items, verification_codes

-- Users (custom auth; JWT issued by your backend)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image TEXT,
  description TEXT,
  category TEXT DEFAULT 'Other',
  colors JSONB DEFAULT '[]'::jsonb,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product ratings (one per user per product)
CREATE TABLE IF NOT EXISTS product_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_product_ratings_product ON product_ratings (product_id);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email TEXT,
  user_phone TEXT,
  total DECIMAL(10, 2) NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders (date);

-- Order line items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);

-- Phone verification codes (optional; can expire and be cleaned up)
CREATE TABLE IF NOT EXISTS verification_codes (
  phone TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Optional: enable RLS but allow service role full access (default)
-- Your backend uses the service_role key, so it bypasses RLS.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Seed initial products (same as original app)
INSERT INTO products (id, name, price, image, description, category, colors, stock) VALUES
  ('1', 'AITCHBEE Hive Tee', 49.99, '/products/tee-1.jpg', 'Premium black cotton tee with golden bee logo. Limited edition.', 'T-Shirts', '["Black", "White", "Yellow"]'::jsonb, 50),
  ('2', 'AITCHBEE Hoodie', 89.99, '/products/hoodie-1.jpg', 'Oversized hoodie with embroidered bee. Heavyweight fleece.', 'Hoodies', '["Black", "Yellow"]'::jsonb, 30),
  ('3', 'AITCHBEE Cap', 34.99, '/products/cap-1.jpg', 'Structured cap with metallic bee patch. One size fits all.', 'Accessories', '["Black", "White"]'::jsonb, 100),
  ('4', 'AITCHBEE Crewneck', 64.99, '/products/crew-1.jpg', 'Classic crewneck with subtle hive pattern. Soft cotton blend.', 'Sweatshirts', '["Black", "White", "Yellow"]'::jsonb, 40),
  ('5', 'AITCHBEE Tote Bag', 29.99, '/products/tote-1.jpg', 'Canvas tote with screen-printed bee. Eco-friendly.', 'Accessories', '["Black", "Yellow"]'::jsonb, 80)
ON CONFLICT (id) DO NOTHING;
