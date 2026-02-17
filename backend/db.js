/**
 * Supabase database layer for AITCHBEE API.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
 */
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabase = url && serviceKey ? createClient(url, serviceKey) : null;

// ---------- Users ----------
export async function getUserByEmail(email) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('users').select('*').ilike('email', email).maybeSingle();
  if (error) throw error;
  return data ? { ...data, passwordHash: data.password_hash } : null;
}

export async function getUserById(id) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? { ...data, passwordHash: data.password_hash } : null;
}

export async function createUser({ id, email, name, phone, passwordHash, role }) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('users').insert({ id, email, name, phone, password_hash: passwordHash, role }).select().single();
  if (error) throw error;
  return { ...data, passwordHash: data.password_hash };
}

export async function userExistsByEmail(email) {
  const u = await getUserByEmail(email);
  return !!u;
}

export async function userExistsByPhone(phone) {
  if (!supabase) return false;
  const { data } = await supabase.from('users').select('id').eq('phone', phone).maybeSingle();
  return !!data;
}

// ---------- Seed users ----------
export async function seedUsersIfNeeded() {
  if (!supabase) return;
  const admin = await getUserByEmail('admin@aitchbee.com');
  if (!admin) {
    const hash = await bcrypt.hash('admin123', 10);
    await supabase.from('users').insert({
      id: 'admin-1',
      email: 'admin@aitchbee.com',
      name: 'Admin',
      password_hash: hash,
      role: 'admin',
    });
    console.log('Admin: admin@aitchbee.com / admin123');
  }
  const buyer = await getUserByEmail('buyer@test.com');
  if (!buyer) {
    const hash = await bcrypt.hash('buyer123', 10);
    await supabase.from('users').insert({
      id: 'buyer-1',
      email: 'buyer@test.com',
      name: 'Test Buyer',
      phone: '+216123456789',
      password_hash: hash,
      role: 'user',
    });
    console.log('Buyer (test): buyer@test.com / buyer123');
  }
}

// ---------- Products ----------
export async function getProducts() {
  if (!supabase) return [];
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToProduct);
}

export async function getProductById(id) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? rowToProduct(data) : null;
}

function rowToProduct(row) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    image: row.image,
    description: row.description,
    category: row.category,
    colors: row.colors || [],
    stock: row.stock ?? 0,
  };
}

export async function createProduct(product) {
  if (!supabase) return null;
  const row = {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    description: product.description || '',
    category: product.category || 'Other',
    colors: product.colors || [],
    stock: product.stock ?? 0,
  };
  const { data, error } = await supabase.from('products').insert(row).select().single();
  if (error) throw error;
  return rowToProduct(data);
}

export async function updateProductStock(id, stock) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('products').update({ stock }).eq('id', id).select().single();
  if (error) throw error;
  return data ? rowToProduct(data) : null;
}

// ---------- Ratings ----------
export async function getRatingsForProduct(productId) {
  if (!supabase) return [];
  const { data, error } = await supabase.from('product_ratings').select('user_id, rating').eq('product_id', productId);
  if (error) throw error;
  return (data || []).map((r) => ({ userId: r.user_id, rating: r.rating }));
}

export async function upsertProductRating(productId, userId, rating) {
  if (!supabase) return;
  await supabase.from('product_ratings').upsert(
    { product_id: productId, user_id: userId, rating },
    { onConflict: 'product_id,user_id' }
  );
}

// ---------- Orders ----------
export async function createOrderAndItems(orderId, userId, userEmail, userPhone, items, total) {
  if (!supabase) return null;
  const { error: orderErr } = await supabase.from('orders').insert({
    id: orderId,
    user_id: userId,
    user_email: userEmail,
    user_phone: userPhone,
    total,
  });
  if (orderErr) throw orderErr;
  const rows = items.map((it) => ({
    order_id: orderId,
    product_id: it.productId,
    name: it.name,
    price: it.price,
    quantity: it.quantity,
  }));
  const { error: itemsErr } = await supabase.from('order_items').insert(rows);
  if (itemsErr) throw itemsErr;
  return { id: orderId, userId, userEmail, userPhone, items, total, date: new Date().toISOString() };
}

export async function getOrders() {
  if (!supabase) return [];
  const { data: ordersData, error: ordersErr } = await supabase.from('orders').select('*').order('date', { ascending: false });
  if (ordersErr) throw ordersErr;
  if (!ordersData?.length) return [];
  const { data: itemsData, error: itemsErr } = await supabase.from('order_items').select('*');
  if (itemsErr) throw itemsErr;
  const itemsByOrder = {};
  (itemsData || []).forEach((row) => {
    if (!itemsByOrder[row.order_id]) itemsByOrder[row.order_id] = [];
    itemsByOrder[row.order_id].push({
      productId: row.product_id,
      name: row.name,
      price: Number(row.price),
      quantity: row.quantity,
    });
  });
  return ordersData.map((o) => ({
    id: o.id,
    userId: o.user_id,
    userEmail: o.user_email,
    userPhone: o.user_phone,
    total: Number(o.total),
    date: o.date,
    items: itemsByOrder[o.id] || [],
  }));
}

// ---------- Admin stats ----------
export async function getOrdersForStats() {
  return getOrders();
}

export async function getProductsForAdmin() {
  return getProducts();
}

// ---------- Verification codes ----------
export async function getVerificationCode(phone) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('verification_codes').select('code, expires_at').eq('phone', phone).maybeSingle();
  if (error) throw error;
  return data ? { code: data.code, expiresAt: new Date(data.expires_at).getTime() } : null;
}

export async function setVerificationCode(phone, code, expiresAt) {
  if (!supabase) return;
  await supabase.from('verification_codes').upsert(
    { phone, code, expires_at: new Date(expiresAt).toISOString() },
    { onConflict: 'phone' }
  );
}

export async function deleteVerificationCode(phone) {
  if (!supabase) return;
  await supabase.from('verification_codes').delete().eq('phone', phone);
}
