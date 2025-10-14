// =======================================
// SUPABASE.JS - Initialization (v2 syntax)
// =======================================
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nhzukmkmfyyekyhhfyru.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oenVrbWttZnl5ZWt5aGhmeXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MTQzOTQsImV4cCI6MjA3NTQ5MDM5NH0.0uXVwG5yFcPOFIucVuH73Ng5E9F-6syEPnEJCrty6lk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================
// AUTH HELPERS
// ============================

// Get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Login user
export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error };
  return { user: data.user };
}

// Register user
export async function registerUser(email, password, username) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error };

  // Insert user record into "users" table
  await supabase.from('users').insert({
    id: data.user.id,
    email,
    username,
    balance: 0.0,
    role: 'user'
  });

  return { user: data.user };
}

// Logout user
export async function logoutUser() {
  await supabase.auth.signOut();
}

// Fetch user balance
export async function getBalance(userId) {
  const { data, error } = await supabase.from('users').select('balance').eq('id', userId).single();
  if (error) return null;
  return data.balance;
}

// Fetch products
export async function getProducts() {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return data;
}

// Fetch user transactions
export async function getUserTransactions(userId, limit = 10) {
  const { data } = await supabase.from('user_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}

// Add balance
export async function addBalance(userId, amount, description = 'Deposit') {
  await supabase.from('users').update({ balance: supabase.raw('balance + ?', [amount]) }).eq('id', userId);
  await supabase.from('user_transactions').insert({
    user_id: userId,
    amount,
    transaction_type: 'deposit',
    description,
    created_at: new Date()
  });
}

// Buy product
export async function purchaseProduct(productId, userId) {
  const { data: product, error } = await supabase.from('products').select('*').eq('id', productId).single();
  if (error || !product) throw new Error('Product not found');
  
  const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
  if (!user || user.balance < product.price) throw new Error('Insufficient balance');
  if (product.stock <= 0) throw new Error('Out of stock');

  // Deduct balance, decrement stock
  await supabase.from('users').update({ balance: supabase.raw('balance - ?', [product.price]) }).eq('id', userId);
  await supabase.from('products').update({ stock: product.stock - 1, is_reserved: false, reserved_by: null }).eq('id', productId);
  await supabase.from('user_transactions').insert({
    user_id: userId,
    amount: -product.price,
    transaction_type: 'purchase',
    description: `Purchased ${product.name}`,
    reference_id: productId,
    created_at: new Date()
  });
}

// Reserve product
export async function reserveProduct(productId, userId, fee = 0.20) {
  const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
  if (!user || user.balance < fee) throw new Error('Insufficient balance');

  await supabase.from('users').update({ balance: supabase.raw('balance - ?', [fee]) }).eq('id', userId);
  await supabase.from('user_transactions').insert({
    user_id: userId,
    amount: -fee,
    transaction_type: 'reserve_fee',
    description: 'Reserve fee',
    created_at: new Date()
  });
  await supabase.from('products').update({ is_reserved: true, reserved_by: userId, reserved_at: new Date() }).eq('id', productId);
}

// Sell / list product
export async function listProduct(product, userId) {
  const listingFee = Math.max(product.price * 0.005, 0.50);

  const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
  if (!user || user.balance < listingFee) throw new Error('Insufficient balance');

  await supabase.from('users').update({ balance: supabase.raw('balance - ?', [listingFee]) }).eq('id', userId);
  await supabase.from('user_transactions').insert({
    user_id: userId,
    amount: -listingFee,
    transaction_type: 'listing_fee',
    description: `Listing fee for ${product.name}`,
    created_at: new Date()
  });

  const { error } = await supabase.from('products').insert([{
    ...product,
    seller_id: userId,
    listing_fee: listingFee,
    created_at: new Date(),
    updated_at: new Date()
  }]);
  if (error) throw error;
}
