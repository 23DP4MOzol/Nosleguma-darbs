// =======================================
// APP.JS - Marketplace Functionality
// =======================================

// Initialize Supabase client
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================
// TOAST NOTIFICATIONS
// ============================
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ============================
// NAVBAR FUNCTIONALITY
// ============================
const hamburgerBtn = document.getElementById('hamburgerBtn');
const navbarLinks = document.querySelector('.navbar-links');

hamburgerBtn.addEventListener('click', () => {
  navbarLinks.classList.toggle('active');
});

async function updateNavbar() {
  const user = supabase.auth.user();
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const balanceBadge = document.getElementById('balanceBadge');

  if (user) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'flex';
    balanceBadge.style.display = 'flex';

    const { data } = await supabase
      .from('users')
      .select('balance')
      .eq('id', user.id)
      .single();
    if (data) balanceBadge.querySelector('span').innerText = `€${data.balance.toFixed(2)}`;
  } else {
    loginBtn.style.display = 'flex';
    logoutBtn.style.display = 'none';
    balanceBadge.style.display = 'none';
  }
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  showToast("Logged out successfully", "success");
  updateNavbar();
});

supabase.auth.onAuthStateChange((event, session) => {
  updateNavbar();
});

updateNavbar();

// ============================
// AUTHENTICATION
// ============================
async function getCurrentUser() {
  return supabase.auth.user();
}

async function loginUser(email, password) {
  const { user, error } = await supabase.auth.signIn({ email, password });
  if(error) showToast(error.message, "error");
  else showToast("Logged in successfully", "success");
  updateNavbar();
  return { user, error };
}

async function registerUser(email, password, username) {
  const { user, error } = await supabase.auth.signUp({ email, password });
  if(error) return { error };

  await supabase.from('users').insert({
    id: user.id,
    email,
    username,
    balance: 0.0,
    role: 'user'
  });
  updateNavbar();
  return { user };
}

// ============================
// USER PROFILE
// ============================
async function loadUserProfile() {
  const user = await getCurrentUser();
  if(!user) return;
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  
  document.getElementById("usernameInput").value = data.username;
  document.getElementById("userEmail").innerText = data.email;
  document.getElementById("userRole").innerText = data.role;
  document.getElementById("userBalance").innerText = data.balance.toFixed(2);
  document.getElementById("userBalanceHeader").innerText = `€${data.balance.toFixed(2)}`;
}

async function updateUsername(newUsername) {
  const user = await getCurrentUser();
  if(!user) return;
  const { error } = await supabase
    .from('users')
    .update({ username: newUsername })
    .eq('id', user.id);
  if(error) showToast(error.message, "error");
  else {
    showToast("Username updated", "success");
    await loadUserProfile();
  }
}

async function changeUserPassword(newPassword) {
  const { error } = await supabase.auth.update({ password: newPassword });
  if(error) showToast(error.message, "error");
  else showToast("Password changed successfully", "success");
}

// ============================
// BALANCE MANAGEMENT
// ============================
async function loadUserBalance() {
  const user = await getCurrentUser();
  if(!user) return;
  const { data } = await supabase
    .from('users')
    .select('balance')
    .eq('id', user.id)
    .single();
  if(data) {
    document.getElementById("userBalance").innerText = data.balance.toFixed(2);
    document.getElementById("userBalanceHeader").innerText = `€${data.balance.toFixed(2)}`;
  }
}

async function addBalance(amount) {
  const user = await getCurrentUser();
  if(!user) return;
  const { data, error } = await supabase
    .from('users')
    .update({ balance: supabase.raw('balance + ?', [amount]) })
    .eq('id', user.id);
  if(error) showToast(error.message, "error");
  else {
    showToast(`€${amount} added to balance`, "success");
    await loadUserBalance();
    await loadTransactionHistory();
  }
}

// ============================
// TRANSACTION HISTORY
// ============================
async function loadTransactionHistory() {
  const user = await getCurrentUser();
  if(!user) return;
  const { data } = await supabase
    .from('user_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);
  const container = document.getElementById("transactionList");
  if(container) {
    container.innerHTML = '';
    data.forEach(tx => {
      const el = document.createElement("div");
      el.className = "flex justify-between p-2 border-b border-gray-200";
      el.innerHTML = `<span>${tx.description}</span><span class="${tx.amount>0?'text-success':'text-destructive'}">€${tx.amount.toFixed(2)}</span>`;
      container.appendChild(el);
    });
  }
}

// ============================
// PRODUCT MANAGEMENT
// ============================
async function createProduct(product) {
  const user = await getCurrentUser();
  if(!user) return;

  const listingFee = Math.max(product.price * 0.005, 0.50);

  // Deduct listing fee
  const { error: feeError } = await supabase
    .from('users')
    .update({ balance: supabase.raw('balance - ?', [listingFee]) })
    .eq('id', user.id);
  if(feeError) return showToast(feeError.message, "error");

  // Create product
  const { error } = await supabase
    .from('products')
    .insert({ ...product, seller_id: user.id, listing_fee: listingFee });
  if(error) showToast(error.message, "error");
  else showToast("Product listed successfully", "success");
}

// Load products for marketplace
async function loadProducts(containerId) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  const container = document.getElementById(containerId);
  if(container) {
    container.innerHTML = '';
    data.forEach(product => {
      const card = document.createElement("div");
      card.className = "product-card card";
      card.innerHTML = `
        <img src="${product.image_url || 'placeholder.jpg'}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>€${product.price.toFixed(2)}</p>
        <span class="badge badge-primary">${product.category}</span>
        <span>${product.condition || ''}</span>
        <span>${product.location || ''}</span>
        <span>${product.is_reserved ? 'Reserved' : ''}</span>
      `;
      container.appendChild(card);
    });
  }
}

// Reserve a product
async function reserveProduct(productId) {
  const user = await getCurrentUser();
  if(!user) return;
  const reserveFee = 0.20;

  // Deduct fee
  const { error: feeError } = await supabase
    .from('users')
    .update({ balance: supabase.raw('balance - ?', [reserveFee]) })
    .eq('id', user.id);
  if(feeError) return showToast(feeError.message, "error");

  // Mark product reserved
  const { error } = await supabase
    .from('products')
    .update({ is_reserved: true, reserved_by: user.id, reserved_at: new Date() })
    .eq('id', productId);
  if(error) showToast(error.message, "error");
  else showToast("Product reserved", "success");
}

// Purchase product
async function purchaseProduct(productId) {
  const user = await getCurrentUser();
  if(!user) return;
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();
  if(!product) return showToast("Product not found", "error");

  // Deduct full price
  const { error: paymentError } = await supabase
    .from('users')
    .update({ balance: supabase.raw('balance - ?', [product.price]) })
    .eq('id', user.id);
  if(paymentError) return showToast(paymentError.message, "error");

  // Mark product as sold
  await supabase
    .from('products')
    .update({ stock: product.stock - 1, is_reserved: false, reserved_by: null })
    .eq('id', productId);
  
  showToast("Product purchased successfully", "success");
}

// ============================
// MESSAGING
// ============================
async function loadUserConversations(containerId) {
  const user = await getCurrentUser();
  if(!user) return;
  const { data } = await supabase
    .from('conversations')
    .select('*')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false });
  const container = document.getElementById(containerId);
  if(container) {
    container.innerHTML = '';
    data.forEach(conv => {
      const el = document.createElement("div");
      el.className = "conversation-card card p-3 mb-2";
      el.innerText = `Conversation with ${conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id} about product ${conv.product_id}`;
      container.appendChild(el);
    });
  }
}

// Send message
async function sendMessage(conversationId, content) {
  const user = await getCurrentUser();
  if(!user) return;
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content,
    message_type: 'text',
    is_read: false,
    created_at: new Date()
  });
  showToast("Message sent", "success");
}

// ============================
// ADMIN DASHBOARD
// ============================
async function loadAdminData() {
  // Users
  const { data: users } = await supabase.from('users').select('*');
  const usersTable = document.getElementById("usersTable")?.querySelector("tbody");
  if(usersTable) {
    usersTable.innerHTML = '';
    users.forEach(u => {
      usersTable.innerHTML += `<tr>
        <td class="p-2 border">${u.id}</td>
        <td class="p-2 border">${u.email}</td>
        <td class="p-2 border">${u.username}</td>
        <td class="p-2 border">${u.role}</td>
        <td class="p-2 border">€${u.balance.toFixed(2)}</td>
      </tr>`;
    });
  }

  // Products
  const { data: products } = await supabase.from('products').select('*');
  const productsTable = document.getElementById("productsTable")?.querySelector("tbody");
  if(productsTable) {
    productsTable.innerHTML = '';
    products.forEach(p => {
      productsTable.innerHTML += `<tr>
        <td class="p-2 border">${p.id}</td>
        <td class="p-2 border">${p.name}</td>
        <td class="p-2 border">${p.seller_id}</td>
        <td class="p-2 border">€${p.price.toFixed(2)}</td>
        <td class="p-2 border">${p.stock}</td>
        <td class="p-2 border">${p.is_reserved ? 'Yes' : 'No'}</td>
      </tr>`;
    });
  }

  // Conversations
  const { data: convs } = await supabase.from('conversations').select('*');
  const convTable = document.getElementById("conversationsTable")?.querySelector("tbody");
  if(convTable) {
    convTable.innerHTML = '';
    convs.forEach(c => {
      convTable.innerHTML += `<tr>
        <td class="p-2 border">${c.id}</td>
        <td class="p-2 border">${c.product_id}</td>
        <td class="p-2 border">${c.buyer_id}</td>
        <td class="p-2 border">${c.seller_id}</td>
        <td class="p-2 border">${c.status}</td>
        <td class="p-2 border">${c.last_message_at || ''}</td>
      </tr>`;
    });
  }

  // AI Sessions
  const { data: aiSessions } = await supabase.from('chat_sessions').select('*');
  const aiTable = document.getElementById("aiSessionsTable")?.querySelector("tbody");
  if(aiTable) {
    aiTable.innerHTML = '';
    aiSessions.forEach(s => {
      aiTable.innerHTML += `<tr>
        <td class="p-2 border">${s.id}</td>
        <td class="p-2 border">${s.user_id}</td>
        <td class="p-2 border">${s.status}</td>
        <td class="p-2 border">${s.language}</td>
        <td class="p-2 border">${s.title}</td>
      </tr>`;
    });
  }
}
