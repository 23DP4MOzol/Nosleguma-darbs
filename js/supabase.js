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

// Add balance (topup)
export async function addBalance(userId, amount, description = 'Balance top-up') {
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
        transaction_type: 'topup',
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

// Purchase product with escrow
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

    // Deduct balance (hold in escrow)
    const newBalance = currentBalance - price;
    await updateBalance(userId, newBalance);

    // Update product (decrease stock, mark as sold)
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

    // Record purchase transaction for buyer
    await supabase.from('user_transactions').insert({
      user_id: userId,
      amount: -price,
      transaction_type: 'purchase',
      description: `Purchase: ${product.name}`,
      reference_id: productId,
      created_at: new Date().toISOString()
    });

    // Record sale for seller
    if (product.seller_id) {
      // Get seller balance and update it
      const sellerBalance = await getBalance(product.seller_id);
      await updateBalance(product.seller_id, sellerBalance + price);
      
      await supabase.from('user_transactions').insert({
        user_id: product.seller_id,
        amount: price,
        transaction_type: 'sale',
        description: `Sale: ${product.name}`,
        reference_id: productId,
        created_at: new Date().toISOString()
      });
    }

    return { success: true };
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
      transaction_type: 'fee',
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

// List/Sell product with mandatory condition
export async function listProduct(productData, userId) {
  try {
    // Validate mandatory condition field
    if (!productData.condition || productData.condition.trim() === '') {
      throw new Error('Product condition is mandatory and cannot be empty');
    }

    const validConditions = ['new', 'like_new', 'good', 'fair', 'poor'];
    if (!validConditions.includes(productData.condition.toLowerCase())) {
      throw new Error('Invalid condition. Must be one of: new, like_new, good, fair, poor');
    }

    const price = parseFloat(productData.price);
    // Listing fee ranges from €0.50 to €1.00 based on price
    // Linear scale: €0-€100 = €0.50, €100+ = €1.00
    const listingFee = price >= 100 ? 1.00 : Math.max(0.50, 0.50 + (price / 100) * 0.50);

    // Check balance for listing fee
    const currentBalance = await getBalance(userId);
    if (currentBalance < listingFee) {
      throw new Error('Insufficient balance for listing fee. You need at least €' + listingFee.toFixed(2));
    }

    // Deduct listing fee from user
    const newBalance = currentBalance - listingFee;
    await updateBalance(userId, newBalance);

    // Record listing fee transaction for user
    await supabase.from('user_transactions').insert({
      user_id: userId,
      amount: -listingFee,
      transaction_type: 'fee',
      description: `Listing fee for ${productData.name}`,
      created_at: new Date().toISOString()
    });

    // Credit listing fee to admin account
    const { data: adminUser } = await supabase
      .from('users')
      .select('id, balance')
      .eq('role', 'admin')
      .limit(1)
      .single();
    
    if (adminUser) {
      const adminBalance = parseFloat(adminUser.balance || 0);
      await updateBalance(adminUser.id, adminBalance + listingFee);
      
      // Record income for admin
      await supabase.from('user_transactions').insert({
        user_id: adminUser.id,
        amount: listingFee,
        transaction_type: 'topup',
        description: `Listing fee from ${productData.name}`,
        reference_id: userId,
        created_at: new Date().toISOString()
      });
    }

    // Insert product - match database schema
    const { data, error } = await supabase.from('products').insert([{
      seller_id: userId,
      name: productData.name,
      description: productData.description || '',
      price: price,
      category: productData.category || 'other',
      condition: productData.condition.toLowerCase(),
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

// Release escrow funds (buyer confirms receipt)
export async function releaseEscrow(escrowId, userId) {
  try {
    // Find the escrow transaction
    const { data: escrowTx, error: fetchError } = await supabase
      .from('user_transactions')
      .select('*')
      .eq('escrow_id', escrowId)
      .eq('user_id', userId)
      .eq('escrow_status', 'pending')
      .single();

    if (fetchError || !escrowTx) throw new Error('Escrow transaction not found or already processed');

    // Update escrow status to released
    await supabase
      .from('user_transactions')
      .update({
        escrow_status: 'released',
        updated_at: new Date().toISOString()
      })
      .eq('escrow_id', escrowId);

    // Credit seller
    const sellerTx = await supabase
      .from('user_transactions')
      .select('*')
      .eq('escrow_id', escrowId)
      .eq('transaction_type', 'escrow_pending')
      .single();

    if (sellerTx) {
      const sellerBalance = await getBalance(sellerTx.user_id);
      await updateBalance(sellerTx.user_id, sellerBalance + Math.abs(escrowTx.amount));

      await supabase
        .from('user_transactions')
        .update({
          transaction_type: 'sale',
          escrow_status: 'released',
          updated_at: new Date().toISOString()
        })
        .eq('escrow_id', escrowId)
        .eq('transaction_type', 'escrow_pending');
    }

    return true;
  } catch (error) {
    console.error('Error releasing escrow:', error);
    throw error;
  }
}

// Dispute escrow (initiate dispute resolution)
export async function disputeEscrow(escrowId, userId, reason) {
  try {
    // Update escrow status to disputed
    const { error } = await supabase
      .from('user_transactions')
      .update({
        escrow_status: 'disputed',
        updated_at: new Date().toISOString()
      })
      .eq('escrow_id', escrowId)
      .eq('user_id', userId);

    if (error) throw error;

    // Create support ticket
    await supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        escrow_id: escrowId,
        issue_type: 'escrow_dispute',
        description: reason,
        status: 'open',
        created_at: new Date().toISOString()
      });

    return true;
  } catch (error) {
    console.error('Error disputing escrow:', error);
    throw error;
  }
}

// ============================
// REVIEWS AND RATINGS HELPERS
// ============================

// Calculate seller trust rating
export async function calculateSellerRating(sellerId) {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('seller_id', sellerId);

    if (error) throw error;

    if (!reviews || reviews.length === 0) return 0;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / reviews.length;
  } catch (error) {
    console.error('Error calculating seller rating:', error);
    return 0;
  }
}

// Get seller reviews
export async function getSellerReviews(sellerId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        buyer:users!buyer_id(username),
        product:products(name)
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching seller reviews:', error);
    return [];
  }
}

// Submit review for completed transaction
export async function submitReview(buyerId, sellerId, productId, rating, comment = '') {
  try {
    // Check if transaction exists and is completed
    const { data: transaction, error: txError } = await supabase
      .from('user_transactions')
      .select('*')
      .eq('user_id', buyerId)
      .eq('reference_id', productId)
      .eq('transaction_type', 'escrow_hold')
      .eq('escrow_status', 'released')
      .single();

    if (txError || !transaction) throw new Error('No completed transaction found for this product');

    // Insert review
    const { error } = await supabase
      .from('reviews')
      .insert({
        buyer_id: buyerId,
        seller_id: sellerId,
        product_id: productId,
        rating: parseInt(rating),
        comment,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
}

// ============================
// LOGISTICS AND ORDERS HELPERS
// ============================

// Get available logistics providers (Baltic region)
export function getLogisticsProviders() {
  return [
    { id: 'omniva', name: 'Omniva', description: 'Latvia\'s largest postal service' },
    { id: 'dpd', name: 'DPD', description: 'International courier service' },
    { id: 'lietuvas_pastas', name: 'Lietuvos Paštas', description: 'Lithuanian postal service' },
    { id: 'latvijas_pasts', name: 'Latvijas Pasts', description: 'Latvian state postal service' },
    { id: 'venipak', name: 'Venipak', description: 'Baltic region courier' }
  ];
}

// Get shipping estimate for provider
export async function getShippingEstimate(productLocation, shippingAddress, provider, weight = 1.0) {
  try {
    const baseCost = await calculateShippingCost(productLocation, shippingAddress, provider);

    // Add weight-based surcharge
    const logisticsProviders = {
      omniva: { weightMultiplier: 0.5 },
      dpd: { weightMultiplier: 0.6 },
      lietuvos_pastas: { weightMultiplier: 0.4 },
      latvijas_pasts: { weightMultiplier: 0.45 },
      venipak: { weightMultiplier: 0.7 }
    };

    const providerData = logisticsProviders[provider] || logisticsProviders.omniva;
    const weightSurcharge = providerData.weightMultiplier * (weight - 1.0); // Base 1kg included
    const totalCost = baseCost + Math.max(0, weightSurcharge);

    // Estimate delivery time
    const productCountry = extractCountry(productLocation);
    const shippingCountry = extractCountry(shippingAddress);
    const isLocal = productCountry === shippingCountry && productCountry === 'latvia';

    const deliveryDays = isLocal ? 2 : 5; // 2 days local, 5 days international

    return {
      provider: provider,
      cost: Math.round(totalCost * 100) / 100,
      estimatedDays: deliveryDays,
      currency: 'EUR'
    };
  } catch (error) {
    console.error('Error getting shipping estimate:', error);
    return {
      provider: provider,
      cost: 5.00,
      estimatedDays: 3,
      currency: 'EUR'
    };
  }
}

// Create order with shipping address and logistics provider
export async function createOrder(productId, buyerId, shippingAddress, logisticsProvider = 'omniva') {
  try {
    // Get product details
    const product = await getProduct(productId);
    if (!product) throw new Error('Product not found');

    // Check if buyer has completed purchase (escrow released)
    const { data: transaction, error: txError } = await supabase
      .from('user_transactions')
      .select('*')
      .eq('user_id', buyerId)
      .eq('reference_id', productId)
      .eq('escrow_status', 'released')
      .single();

    if (txError || !transaction) throw new Error('No completed purchase found for this product');

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        product_id: productId,
        buyer_id: buyerId,
        seller_id: product.seller_id,
        shipping_address: shippingAddress,
        order_status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Calculate shipping based on product location, shipping address, and provider
    const shippingCost = await calculateShippingCost(product.location, shippingAddress, logisticsProvider);

    // Update order with shipping cost and provider info
    await supabase
      .from('orders')
      .update({
        shipping_cost: shippingCost,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    return { ...order, shipping_cost: shippingCost, logistics_provider: logisticsProvider };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

// Calculate shipping cost based on location and logistics provider
export async function calculateShippingCost(productLocation, shippingAddress, provider = 'omniva') {
  try {
    // Latvian logistics providers with realistic pricing
    const logisticsProviders = {
      omniva: {
        name: 'Omniva',
        baseRate: 3.50,
        localMultiplier: 1.0,
        internationalMultiplier: 2.5,
        weightMultiplier: 0.5
      },
      dpd: {
        name: 'DPD',
        baseRate: 4.20,
        localMultiplier: 1.2,
        internationalMultiplier: 3.0,
        weightMultiplier: 0.6
      },
      lietuvos_pastas: {
        name: 'Lietuvos Paštas',
        baseRate: 3.00,
        localMultiplier: 0.9,
        internationalMultiplier: 2.2,
        weightMultiplier: 0.4
      },
      latvijas_pasts: {
        name: 'Latvijas Pasts',
        baseRate: 3.80,
        localMultiplier: 1.1,
        internationalMultiplier: 2.8,
        weightMultiplier: 0.45
      },
      venipak: {
        name: 'Venipak',
        baseRate: 4.50,
        localMultiplier: 1.3,
        internationalMultiplier: 3.2,
        weightMultiplier: 0.7
      }
    };

    const selectedProvider = logisticsProviders[provider] || logisticsProviders.omniva;

    // Extract countries for distance calculation
    const productCountry = extractCountry(productLocation);
    const shippingCountry = extractCountry(shippingAddress);

    // Determine if local or international
    const isLocal = productCountry === shippingCountry && productCountry === 'latvia';

    // Calculate base cost
    let shippingCost = selectedProvider.baseRate;

    if (isLocal) {
      shippingCost *= selectedProvider.localMultiplier;
    } else {
      shippingCost *= selectedProvider.internationalMultiplier;
    }

    // Add weight consideration (simplified - assume standard package)
    shippingCost += selectedProvider.weightMultiplier * 1.0; // 1kg base

    // Round to 2 decimal places
    return Math.round(shippingCost * 100) / 100;
  } catch (error) {
    console.error('Error calculating shipping cost:', error);
    return 5.00; // Default fallback cost
  }
}

// Helper function to extract country from address
function extractCountry(address) {
  if (!address) return '';
  // Simple extraction - in real app, use proper geocoding
  const parts = address.split(',');
  const lastPart = parts[parts.length - 1].trim().toLowerCase();

  // Map common country names to standardized format
  const countryMap = {
    'latvia': 'latvia',
    'latvija': 'latvia',
    'lithuania': 'lithuania',
    'lietuva': 'lithuania',
    'estonia': 'estonia',
    'eesti': 'estonia',
    'lv': 'latvia',
    'lt': 'lithuania',
    'ee': 'estonia'
  };

  return countryMap[lastPart] || lastPart;
}

// Update order status
export async function updateOrderStatus(orderId, status, userId) {
  try {
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) throw new Error('Order not found');
    if (order.buyer_id !== userId && order.seller_id !== userId) {
      throw new Error('Unauthorized to update this order');
    }

    const { error } = await supabase
      .from('orders')
      .update({
        order_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

// Get user orders
export async function getUserOrders(userId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        product:products(*),
        buyer:users!buyer_id(username),
        seller:users!seller_id(username)
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
}

// ============================
// DISPUTE RESOLUTION HELPERS
// ============================

// Create support ticket
export async function createSupportTicket(userId, issueType, description, relatedId = null) {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        issue_type: issueType,
        description: description,
        related_id: relatedId,
        status: 'open',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating support ticket:', error);
    throw error;
  }
}

// Get user support tickets
export async function getUserSupportTickets(userId) {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return [];
  }
}

// Update support ticket status (admin only)
export async function updateSupportTicketStatus(ticketId, status, adminId) {
  try {
    const { error } = await supabase
      .from('support_tickets')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating support ticket:', error);
    throw error;
  }
}

// Create or get chat session for dispute resolution
export async function getOrCreateDisputeChat(ticketId, userId, adminId = null) {
  try {
    // Check if chat session already exists for this ticket
    const { data: existing, error: fetchError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('ticket_id', ticketId)
      .single();

    if (existing) return existing;

    // Create new chat session
    const { data: newSession, error: insertError } = await supabase
      .from('chat_sessions')
      .insert({
        ticket_id: ticketId,
        user_id: userId,
        admin_id: adminId,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return newSession;
  } catch (error) {
    console.error('Error getting/creating dispute chat:', error);
    throw error;
  }
}

// Send message in dispute chat
export async function sendDisputeMessage(sessionId, senderId, content, messageType = 'text') {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        sender_id: senderId,
        content: content,
        message_type: messageType,
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update session last activity
    await supabase
      .from('chat_sessions')
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    return data;
  } catch (error) {
    console.error('Error sending dispute message:', error);
    throw error;
  }
}

// Get messages for dispute chat session
export async function getDisputeMessages(sessionId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:users(username)
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching dispute messages:', error);
    return [];
  }
}

// Resolve dispute (admin action)
export async function resolveDispute(ticketId, resolution, adminId) {
  try {
    // Update ticket status
    await supabase
      .from('support_tickets')
      .update({
        status: 'resolved',
        resolution: resolution,
        resolved_by: adminId,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    // Close chat session
    await supabase
      .from('chat_sessions')
      .update({
        status: 'closed',
        updated_at: new Date().toISOString()
      })
      .eq('ticket_id', ticketId);

    return true;
  } catch (error) {
    console.error('Error resolving dispute:', error);
    throw error;
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
