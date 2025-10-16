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
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Login user
export async function loginUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    if (error) throw error;
    return { user: data.user, session: data.session };
  } catch (error) {
    console.error('Login error:', error);
    return { error };
  }
}

// Register user
export async function registerUser(email, password, username) {
  try {
    // First, sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email, 
      password 
    });
    
    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // Then, insert or update user record in "users" table
    const { error: insertError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email,
        username: username || email.split('@')[0],
        balance: 0.0,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (insertError) {
      console.error('Error inserting user record:', insertError);
    }

    return { user: authData.user, session: authData.session };
  } catch (error) {
    console.error('Registration error:', error);
    return { error };
  }
}

// Logout user
export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// ============================
// USER DATA HELPERS
// ============================

// Fetch user balance
export async function getBalance(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return parseFloat(data?.balance || 0);
  } catch (error) {
    console.error('Error fetching balance:', error);
    return 0;
  }
}

// Update user balance
export async function updateBalance(userId, newBalance) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating balance:', error);
    return false;
  }
}

// Add balance (deposit)
export async function addBalance(userId, amount, description = 'Deposit') {
  try {
    // Get current balance
    const currentBalance = await getBalance(userId);
    const newBalance = currentBalance + parseFloat(amount);

    // Update balance
    await updateBalance(userId, newBalance);

    // Record transaction
    const { error } = await supabase
      .from('user_transactions')
      .insert({
        user_id: userId,
        amount: parseFloat(amount),
        transaction_type: 'deposit',
        description,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding balance:', error);
    throw error;
  }
}

// ============================
// PRODUCT HELPERS
// ============================

// Fetch all products
export async function getProducts(limit = 100) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// Fetch single product by ID
export async function getProduct(productId) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// Purchase product
export async function purchaseProduct(productId, userId) {
  try {
    // Fetch product details
    const product = await getProduct(productId);
    if (!product) throw new Error('Product not found');

    // Check if product is available
    if (product.stock <= 0) throw new Error('Out of stock');
    if (product.is_reserved && product.reserved_by !== userId) {
      throw new Error('Product is reserved by another user');
    }

    // Get user balance
    const currentBalance = await getBalance(userId);
    const price = parseFloat(product.price);

    if (currentBalance < price) throw new Error('Insufficient balance');

    // Deduct balance
    const newBalance = currentBalance - price;
    await updateBalance(userId, newBalance);

    // Update product (decrease stock)
    const { error: productError } = await supabase
      .from('products')
      .update({
        stock: product.stock - 1,
        is_reserved: false,
        reserved_by: null,
        reserved_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (productError) throw productError;

    // Record purchase transaction
    await supabase.from('user_transactions').insert({
      user_id: userId,
      amount: -price,
      transaction_type: 'purchase',
      description: `Purchased ${product.name}`,
      reference_id: productId,
      created_at: new Date().toISOString()
    });

    // Credit seller if exists
    if (product.seller_id) {
      const sellerBalance = await getBalance(product.seller_id);
      await updateBalance(product.seller_id, sellerBalance + price);

      await supabase.from('user_transactions').insert({
        user_id: product.seller_id,
        amount: price,
        transaction_type: 'sale',
        description: `Sold ${product.name}`,
        reference_id: productId,
        created_at: new Date().toISOString()
      });
    }

    return true;
  } catch (error) {
    console.error('Error purchasing product:', error);
    throw error;
  }
}

// Reserve product
export async function reserveProduct(productId, userId, fee = 0.20) {
  try {
    // Get current balance
    const currentBalance = await getBalance(userId);
    if (currentBalance < fee) throw new Error('Insufficient balance for reserve fee');

    // Check if product exists and is available
    const product = await getProduct(productId);
    if (!product) throw new Error('Product not found');
    if (product.is_reserved) throw new Error('Product is already reserved');

    // Deduct reserve fee
    const newBalance = currentBalance - fee;
    await updateBalance(userId, newBalance);

    // Record reserve fee transaction
    await supabase.from('user_transactions').insert({
      user_id: userId,
      amount: -fee,
      transaction_type: 'reserve_fee',
      description: `Reserve fee for ${product.name}`,
      reference_id: productId,
      created_at: new Date().toISOString()
    });

    // Update product reservation status
    const { error } = await supabase
      .from('products')
      .update({
        is_reserved: true,
        reserved_by: userId,
        reserved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error reserving product:', error);
    throw error;
  }
}

// List/Sell product
export async function listProduct(productData, userId) {
  try {
    const price = parseFloat(productData.price);
    const listingFee = Math.max(price * 0.005, 0.50);

    // Check balance for listing fee
    const currentBalance = await getBalance(userId);
    if (currentBalance < listingFee) {
      throw new Error('Insufficient balance for listing fee');
    }

    // Deduct listing fee
    const newBalance = currentBalance - listingFee;
    await updateBalance(userId, newBalance);

    // Record listing fee transaction
    await supabase.from('user_transactions').insert({
      user_id: userId,
      amount: -listingFee,
      transaction_type: 'listing_fee',
      description: `Listing fee for ${productData.name}`,
      created_at: new Date().toISOString()
    });

    // Insert product
    const { data, error } = await supabase.from('products').insert([{
      seller_id: userId,
      name: productData.name,
      description: productData.description || '',
      price: price,
      category: productData.category || 'other',
      condition: productData.condition || 'new',
      location: productData.location || '',
      image_url: productData.image_url || '',
      stock: parseInt(productData.stock) || 1,
      listing_fee: listingFee,
      reserve_fee: parseFloat(productData.reserve_fee) || 0.20,
      is_reserved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]).select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error listing product:', error);
    throw error;
  }
}

// ============================
// TRANSACTION HELPERS
// ============================

// Fetch user transactions
export async function getUserTransactions(userId, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('user_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

// ============================
// MESSAGING HELPERS
// ============================

// Get or create conversation
export async function getOrCreateConversation(productId, buyerId, sellerId) {
  try {
    // Check if conversation already exists
    const { data: existing, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('product_id', productId)
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId)
      .single();

    if (existing) return existing;

    // Create new conversation
    const { data: newConv, error: insertError } = await supabase
      .from('conversations')
      .insert({
        product_id: productId,
        buyer_id: buyerId,
        seller_id: sellerId,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return newConv;
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    throw error;
  }
}

// Send message
export async function sendMessage(conversationId, senderId, content, messageType = 'text') {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: messageType,
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Get messages for conversation
export async function getMessages(conversationId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

// Get user conversations
export async function getUserConversations(userId) {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        product:products(*),
        buyer:users!buyer_id(*),
        seller:users!seller_id(*)
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}
