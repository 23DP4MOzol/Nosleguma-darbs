import { supabase, getCurrentUser } from '../supabase.js';
import { i18n } from '../i18n.js';

// ============================
// State Management
// ============================
let currentTab = 'dashboard';
let currentUser = null;

// ============================
// Authentication Check
// ============================
async function checkAdminAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href) + '&reason=admin';
    return false;
  }
  
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (!userData || userData.role !== 'admin') {
    alert('Access denied. Admin privileges required.');
    window.location.href = 'index.html';
    return false;
  }
  
  return user;
}

// ============================
// Navigation
// ============================
function switchAdminTab(tab) {
  currentTab = tab;
  
  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tab) btn.classList.add('active');
  });
  
  document.querySelectorAll('.admin-section').forEach(section => {
    section.style.display = 'none';
  });
  document.getElementById(`section-${tab}`).style.display = 'block';
  
  loadTabData(tab);
}

async function loadTabData(tab) {
  switch(tab) {
    case 'dashboard': await loadDashboard(); break;
    case 'users': await loadUsers(); break;
    case 'products': await loadProducts(); break;
    case 'transactions': await loadTransactions(); break;
    case 'orders': await loadOrders(); break;
    case 'chats': await loadConversations(); break;
    case 'tickets': await loadSupportTickets(); break;
    case 'analytics': await loadAnalytics(); break;
    case 'settings': await loadSiteSettings(); break;
  }
}

// ============================
// Dashboard
// ============================
async function loadDashboard() {
  try {
    // User stats
    const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
    
    // Product stats
    const { count: totalProducts } = await supabase.from('products').select('*', { count: 'exact', head: true });
    
    // Transaction stats
    const today = new Date().toISOString().split('T')[0];
    const { data: todayTx } = await supabase.from('user_transactions').select('amount').gte('created_at', today);
    const todayRevenue = todayTx?.reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0) || 0;
    
    const { data: allTx } = await supabase.from('user_transactions').select('amount');
    const totalRevenue = allTx?.reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0) || 0;
    
    // Order stats
    const { count: totalOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    
    // Support tickets
    const { count: openTickets } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open');
    
    // Update UI
    document.getElementById('dash-total-users').textContent = totalUsers || 0;
    document.getElementById('dash-total-products').textContent = totalProducts || 0;
    document.getElementById('dash-today-revenue').textContent = `€${todayRevenue.toFixed(2)}`;
    document.getElementById('dash-total-revenue').textContent = `€${totalRevenue.toFixed(2)}`;
    document.getElementById('dash-total-orders').textContent = totalOrders || 0;
    document.getElementById('dash-open-tickets').textContent = openTickets || 0;
    
    await loadRecentActivities();
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

async function loadRecentActivities() {
  try {
    const { data: activities } = await supabase
      .from('user_transactions')
      .select('*, users!user_id(username, email)')
      .order('created_at', { ascending: false })
      .limit(15);
    
    const tbody = document.getElementById('dash-activities');
    if (!activities?.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No recent activities</td></tr>';
      return;
    }
    
    tbody.innerHTML = activities.map(a => `
      <tr>
        <td>${a.users?.username || a.users?.email || 'Unknown'}</td>
        <td><span class="badge badge-${a.transaction_type}">${a.transaction_type}</span></td>
        <td>${formatDate(a.created_at)}</td>
        <td class="${a.amount >= 0 ? 'text-success' : 'text-danger'}">€${Math.abs(a.amount).toFixed(2)}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading activities:', error);
  }
}

// ============================
// Users Management
// ============================
async function loadUsers() {
  await searchUsers();
}

async function searchUsers() {
  const search = document.getElementById('user-search')?.value || '';
  const role = document.getElementById('user-role')?.value || 'all';
  
  let query = supabase.from('users').select('*');
  
  if (search) {
    query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%`);
  }
  if (role !== 'all') {
    query = query.eq('role', role);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false }).limit(100);
  
  if (error) {
    console.error('Error searching users:', error);
    return;
  }
  
  displayUsers(data || []);
}

function displayUsers(users) {
  const tbody = document.getElementById('users-table-body');
  
  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No users found</td></tr>';
    return;
  }
  
  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.username || 'N/A'}</td>
      <td>${user.email}</td>
      <td><span class="badge badge-${user.role}">${user.role}</span></td>
      <td>€${parseFloat(user.balance || 0).toFixed(2)}</td>
      <td>${formatDate(user.created_at)}</td>
      <td>${user.role === 'admin' ? '<span class="badge badge-admin">Admin</span>' : '<span class="badge badge-user">User</span>'}</td>
      <td>
        <button class="btn btn-sm" data-action="view-user" data-id="${user.id}">View</button>
        <button class="btn btn-sm btn-warning" data-action="edit-user" data-id="${user.id}" data-balance="${user.balance}">Edit</button>
        ${user.role !== 'admin' ? `<button class="btn btn-sm btn-danger" data-action="delete-user" data-id="${user.id}">Delete</button>` : ''}
      </td>
    </tr>
  `).join('');
}

window.viewUserDetails = async function(userId) {
  try {
    // User data
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    
    // Stats
    const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('seller_id', userId);
    const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    
    // Financials
    const { data: transactions } = await supabase.from('user_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
    const totalSpent = transactions?.filter(t => ['purchase', 'fee'].includes(t.transaction_type)).reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
    const totalEarned = transactions?.filter(t => t.transaction_type === 'sale').reduce((sum, t) => sum + t.amount, 0) || 0;
    
    // Products
    const { data: products } = await supabase.from('products').select('*').eq('seller_id', userId).order('created_at', { ascending: false }).limit(10);
    
    // Orders
    const { data: orders } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10);
    
    showUserDetailModal(user, { productsCount, ordersCount, totalSpent, totalEarned, transactions, products, orders });
    
  } catch (error) {
    console.error('Error loading user details:', error);
    alert('Error: ' + error.message);
  }
}

function showUserDetailModal(user, stats) {
  const modal = document.getElementById('userDetailModal');
  const content = document.getElementById('userDetailContent');
  
  content.innerHTML = `
    <div class="admin-modal-header">
      <h2>👤 User: ${user.username || user.email}</h2>
      ${user.role !== 'admin' ? `<button class="btn btn-danger" data-action="delete-user" data-id="${user.id}">Delete User</button>` : ''}
    </div>
    
    <div class="admin-modal-grid">
      <div class="admin-card">
        <h3>Profile Information</h3>
        <div class="admin-info-grid">
          <div class="info-item"><strong>User ID:</strong><br><code>${user.id}</code></div>
          <div class="info-item"><strong>Email:</strong><br>${user.email}</div>
          <div class="info-item"><strong>Username:</strong><br>${user.username || 'N/A'}</div>
          <div class="info-item"><strong>Role:</strong><br><span class="badge badge-${user.role}">${user.role}</span></div>
          <div class="info-item"><strong>Balance:</strong><br>€${parseFloat(user.balance || 0).toFixed(2)}</div>
          <div class="info-item"><strong>Joined:</strong><br>${formatDate(user.created_at)}</div>
          <div class="info-item"><strong>Language:</strong><br>${user.language || 'en'}</div>
        </div>
      </div>
      
      <div class="admin-card">
        <h3>📊 Statistics</h3>
        <div class="admin-stats-grid">
          <div class="stat-box">
            <div class="stat-value">€${parseFloat(user.balance || 0).toFixed(2)}</div>
            <div class="stat-label">Balance</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">€${stats.totalSpent.toFixed(2)}</div>
            <div class="stat-label">Total Spent</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">€${stats.totalEarned.toFixed(2)}</div>
            <div class="stat-label">Total Earned</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${stats.productsCount}</div>
            <div class="stat-label">Products</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${stats.ordersCount}</div>
            <div class="stat-label">Orders</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="admin-modal-tabs">
      <button class="tab-btn active" data-tab="udt-transactions" onclick="switchUserTab('udt-transactions')">💳 Transactions</button>
      <button class="tab-btn" data-tab="udt-products" onclick="switchUserTab('udt-products')">📦 Products</button>
      <button class="tab-btn" data-tab="udt-orders" onclick="switchUserTab('udt-orders')">🛒 Orders</button>
    </div>
    
    <div id="udt-transactions" class="tab-content active">
      <table class="admin-table">
        <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th></tr></thead>
        <tbody>
          ${stats.transactions?.map(t => `
            <tr>
              <td>${formatDate(t.created_at)}</td>
              <td><span class="badge badge-${t.transaction_type}">${t.transaction_type}</span></td>
              <td>${t.description || '-'}</td>
              <td class="${t.amount >= 0 ? 'text-success' : 'text-danger'}">€${Math.abs(t.amount).toFixed(2)}</td>
            </tr>
          `).join('') || '<tr><td colspan="4">No transactions</td></tr>'}
        </tbody>
      </table>
    </div>
    
    <div id="udt-products" class="tab-content">
      <div class="admin-products-grid">
        ${stats.products?.map(p => `
          <div class="product-card-mini">
            <img src="${p.image_url || 'https://via.placeholder.com/100'}" alt="${p.name}">
            <div class="product-info-mini">
              <h4>${p.name}</h4>
              <p>€${parseFloat(p.price).toFixed(2)} • Stock: ${p.stock}</p>
            </div>
          </div>
        `).join('') || '<p>No products listed</p>'}
      </div>
    </div>
    
    <div id="udt-orders" class="tab-content">
      <table class="admin-table">
        <thead><tr><th>Order ID</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          ${stats.orders?.map(o => `
            <tr>
              <td>${o.id.slice(0, 8)}...</td>
              <td>€${parseFloat(o.total || 0).toFixed(2)}</td>
              <td><span class="badge badge-${o.status}">${o.status}</span></td>
              <td>${formatDate(o.created_at)}</td>
            </tr>
          `).join('') || '<tr><td colspan="4">No orders</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
  
  modal.style.display = 'flex';
}

window.switchUserTab = function(tabId) {
  document.querySelectorAll('#userDetailContent .tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#userDetailContent .tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
  document.getElementById(tabId)?.classList.add('active');
};

window.deleteUser = async function(userId) {
  if (!confirm('Are you sure you want to DELETE this user? This cannot be undone!')) return;
  
  try {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;
    
    alert('User deleted successfully');
    document.getElementById('userDetailModal').style.display = 'none';
    await loadUsers();
  } catch (error) {
    alert('Error deleting user: ' + error.message);
  }
};

window.editUser = async function(userId, currentBalance) {
  const newBalance = prompt('Enter new balance for user:', currentBalance);
  if (newBalance === null) return;
  
  try {
    const { error } = await supabase.from('users').update({ 
      balance: parseFloat(newBalance),
      updated_at: new Date().toISOString()
    }).eq('id', userId);
    
    if (error) throw error;
    
    alert('Balance updated successfully');
    await loadUsers();
  } catch (error) {
    alert('Error updating balance: ' + error.message);
  }
};

// ============================
// Products Management
// ============================
async function loadProducts() {
  const search = document.getElementById('product-search')?.value || '';
  
  let query = supabase.from('products').select('*, users!seller_id(username, email)');
  
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false }).limit(100);
  
  if (error) {
    console.error('Error loading products:', error);
    return;
  }
  
  displayProducts(data || []);
}

function displayProducts(products) {
  const tbody = document.getElementById('products-table-body');
  
  if (!products.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No products found</td></tr>';
    return;
  }
  
  tbody.innerHTML = products.map(p => `
    <tr>
      <td><img src="${p.image_url || 'https://via.placeholder.com/50'}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;"></td>
      <td>${p.name}</td>
      <td>${p.users?.username || 'Unknown'}</td>
      <td>€${parseFloat(p.price).toFixed(2)}</td>
      <td>${p.stock}</td>
      <td>${p.condition || 'N/A'}</td>
      <td>${formatDate(p.created_at)}</td>
      <td>
        <button class="btn btn-sm btn-danger" data-action="delete-product" data-id="${p.id}">Delete</button>
      </td>
    </tr>
  `).join('');
}

window.deleteProduct = async function(productId) {
  if (!confirm('Delete this product?')) return;
  
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) {
    alert('Error: ' + error.message);
    return;
  }
  
  await loadProducts();
};

// ============================
// Transactions Management
// ============================
async function loadTransactions() {
  const type = document.getElementById('tx-type')?.value || 'all';
  const amountFilter = document.getElementById('tx-amount')?.value || 'all';
  const dateFrom = document.getElementById('tx-date-from')?.value;
  const dateTo = document.getElementById('tx-date-to')?.value;
  
  let query = supabase.from('user_transactions').select('*, users!user_id(username, email)');
  
  if (type !== 'all') {
    query = query.eq('transaction_type', type);
  }
  
  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }
  
  if (dateTo) {
    query = query.lte('created_at', dateTo + 'T23:59:59');
  }
  
  const { data, error } = await query.order('created_at', { ascending: false }).limit(200);
  
  if (error) {
    console.error('Error loading transactions:', error);
    return;
  }
  
  // Apply profit/loss filter client-side
  let filteredData = data || [];
  if (amountFilter === 'profit') {
    filteredData = filteredData.filter(t => t.amount > 0);
  } else if (amountFilter === 'loss') {
    filteredData = filteredData.filter(t => t.amount < 0);
  }
  
  displayTransactions(filteredData);
}

function displayTransactions(transactions) {
  const tbody = document.getElementById('transactions-table-body');
  
  if (!transactions.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No transactions found</td></tr>';
    return;
  }
  
  tbody.innerHTML = transactions.map(t => `
    <tr>
      <td>${formatDate(t.created_at)}</td>
      <td>${t.users?.username || 'Unknown'}</td>
      <td><span class="badge badge-${t.transaction_type}">${t.transaction_type}</span></td>
      <td>${t.description || '-'}</td>
      <td class="${t.amount >= 0 ? 'text-success' : 'text-danger'}">€${Math.abs(t.amount).toFixed(2)}</td>
      <td><span class="badge badge-${t.status || 'pending'}">${t.status || 'completed'}</span></td>
    </tr>
  `).join('');
}

window.clearTransactionHistory = async function() {
  if (!confirm('Are you sure you want to CLEAR ALL transaction history? This action cannot be undone!')) return;
  
  try {
    const { error } = await supabase.from('user_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
    
    alert('Transaction history cleared successfully');
    loadTransactions();
  } catch (error) {
    alert('Error clearing transaction history: ' + error.message);
  }
};

export function exportTransactions() {
  alert('Export feature coming soon - will export to CSV');
}

// ============================
// Orders Management
// ============================
async function loadOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  
  if (error) {
    console.error('Error loading orders:', error);
    return;
  }
  
  displayOrders(data || []);
}

function displayOrders(orders) {
  const tbody = document.getElementById('orders-table-body');
  
  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No orders found</td></tr>';
    return;
  }
  
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td>${o.id.slice(0, 8)}...</td>
      <td>€${parseFloat(o.total || 0).toFixed(2)}</td>
      <td><span class="badge badge-${o.status}">${o.status}</span></td>
      <td>${o.shipping_address || '-'}</td>
      <td>${formatDate(o.created_at)}</td>
    </tr>
  `).join('');
}

// ============================
// Conversations / Chat Moderation
// ============================
async function loadConversations() {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        buyer:users!buyer_id(username, email),
        seller:users!seller_id(username, email),
        product:products(name, price)
      `)
      .order('last_message_at', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    
    displayConversations(data || []);
  } catch (error) {
    console.error('Error loading conversations:', error);
    document.getElementById('chats-content').innerHTML = '<p>Error loading conversations</p>';
  }
}

function displayConversations(conversations) {
  const container = document.getElementById('chats-content');
  
  if (!conversations.length) {
    container.innerHTML = '<p style="text-align:center;">No conversations found</p>';
    return;
  }
  
  container.innerHTML = `
    <div class="admin-conversations-list">
      ${conversations.map(c => `
        <div class="conversation-item">
          <div class="conversation-users">
            <span>${c.buyer?.username || 'Buyer'}</span> ↔ <span>${c.seller?.username || 'Seller'}</span>
          </div>
          <div class="conversation-product">📦 ${c.product?.name || 'No product'}</div>
          <div class="conversation-preview">${c.last_message || 'No messages'}</div>
          <div class="conversation-time">${formatDate(c.last_message_at)}</div>
          <span class="badge badge-${c.status}">${c.status}</span>
          <button class="btn btn-sm" data-action="view-conversation" data-id="${c.id}">View</button>
        </div>
      `).join('')}
    </div>
  `;
}

window.viewConversation = async function(conversationId) {
  try {
    const { data: messages } = await supabase
      .from('messages')
      .select('*, sender:users!sender_id(username)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (!messages?.length) {
      alert('No messages in this conversation');
      return;
    }
    
    const chatHtml = messages.map(m => `
      <div style="margin-bottom:0.5rem;">
        <strong>${m.sender?.username}:</strong> ${m.content}
        <span style="color:var(--muted);font-size:0.75rem;">(${formatDate(m.created_at)})</span>
      </div>
    `).join('');
    
    alert(`Conversation Messages:\n\n${chatHtml}`);
  } catch (error) {
    alert('Error loading messages: ' + error.message);
  }
};

// ============================
// Support Tickets
// ============================
async function loadSupportTickets() {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*, user:users!user_id(username, email)')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    
    displayTickets(data || []);
  } catch (error) {
    console.error('Error loading tickets:', error);
    document.getElementById('tickets-content').innerHTML = '<p>Error loading tickets</p>';
  }
}

function displayTickets(tickets) {
  const container = document.getElementById('tickets-content');
  
  if (!tickets.length) {
    container.innerHTML = '<p style="text-align:center;">No support tickets</p>';
    return;
  }
  
  container.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr><th>User</th><th>Title</th><th>Priority</th><th>Status</th><th>Date</th><th>Action</th></tr>
      </thead>
      <tbody>
        ${tickets.map(t => `
          <tr>
            <td>${t.user?.username || 'Unknown'}</td>
            <td>${t.title || '-'}</td>
            <td><span class="badge badge-${t.priority}">${t.priority}</span></td>
            <td><span class="badge badge-${t.status}">${t.status}</span></td>
            <td>${formatDate(t.created_at)}</td>
            <td>
              <button class="btn btn-sm" data-action="view-ticket" data-id="${t.id}">View</button>
              ${t.status === 'open' ? `<button class="btn btn-sm btn-success" data-action="resolve-ticket" data-id="${t.id}">Resolve</button>` : ''}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

window.viewTicket = function(ticketId) {
  alert('Ticket detail view coming soon');
};

window.resolveTicket = async function(ticketId) {
  try {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', ticketId);
    
    if (error) throw error;
    
    await loadSupportTickets();
  } catch (error) {
    alert('Error resolving ticket: ' + error.message);
  }
};

// ============================
// Analytics
// ============================
async function loadAnalytics() {
  try {
    // Revenue by month
    const { data: monthlyRevenue } = await supabase
      .from('user_transactions')
      .select('created_at, amount')
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
    
    const revenueByMonth = {};
    monthlyRevenue?.forEach(t => {
      if (t.amount > 0) {
        const month = t.created_at.slice(0, 7);
        revenueByMonth[month] = (revenueByMonth[month] || 0) + t.amount;
      }
    });
    
    // User stats
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    
    document.getElementById('analytics-content').innerHTML = `
      <div class="analytics-grid">
        <div class="analytics-card">
          <h3>💰 Revenue by Month</h3>
          <div class="chart-placeholder">
            ${Object.entries(revenueByMonth).slice(-12).map(([month, amount]) => `
              <div class="chart-bar">
                <div class="bar-value">€${amount.toFixed(0)}</div>
                <div class="bar-label">${month}</div>
              </div>
            `).join('') || '<p>No revenue data</p>'}
          </div>
        </div>
        
        <div class="analytics-card">
          <h3>📈 Platform Stats</h3>
          <div class="admin-stats-grid">
            <div class="stat-box">
              <div class="stat-value">${userCount}</div>
              <div class="stat-label">Total Users</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${productCount}</div>
              <div class="stat-label">Total Products</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${orderCount}</div>
              <div class="stat-label">Total Orders</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">€${Object.values(revenueByMonth).reduce((a, b) => a + b, 0).toFixed(2)}</div>
              <div class="stat-label">Total Revenue</div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading analytics:', error);
    document.getElementById('analytics-content').innerHTML = '<p>Error loading analytics</p>';
  }
}

// ============================
// Site Settings
// ============================
async function loadSiteSettings() {
  document.getElementById('site-settings-form').innerHTML = `
    <h3>⚙️ Platform Settings</h3>
    <p style="color:var(--muted);">Settings are managed through Supabase database. Future enhancement: Add platform_settings table.</p>
    
    <h3 style="margin-top:2rem;">🗄️ Database Stats</h3>
    <button class="btn btn-primary" data-action="refresh-stats">Refresh All Stats</button>
    
    <h3 style="margin-top:2rem;">🔧 Quick Actions</h3>
    <div class="settings-section">
      <button class="btn btn-warning" data-action="clear-data">Archive Old Data</button>
    </div>
  `;
}
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString();
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============================
// Initialize
// ============================
async function initialize() {
  currentUser = await checkAdminAuth();
  if (!currentUser) return;
  
  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchAdminTab(btn.dataset.tab));
  });
  
  document.getElementById('user-search')?.addEventListener('input', debounce(loadUsers, 300));
  document.getElementById('product-search')?.addEventListener('input', debounce(loadProducts, 300));
  
  // Event delegation for action buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    
    switch(action) {
      case 'view-user': viewUserDetails(id); break;
      case 'edit-user': editUser(id, btn.dataset.balance); break;
      case 'delete-user': deleteUser(id); break;
      case 'delete-product': deleteProduct(id); break;
      case 'view-conversation': viewConversation(id); break;
      case 'resolve-ticket': resolveTicket(id); break;
      case 'refresh-stats': 
        loadDashboard(); 
        alert('Stats refreshed!');
        break;
      case 'clear-data': 
        alert('Data cleanup feature coming soon');
        break;
    }
  });
  
  await loadDashboard();
}

// Modal handlers
document.getElementById('userDetailModalClose')?.addEventListener('click', () => {
  document.getElementById('userDetailModal').style.display = 'none';
});
document.getElementById('userDetailModalOverlay')?.addEventListener('click', () => {
  document.getElementById('userDetailModal').style.display = 'none';
});

// Run
initialize();
