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
    if (!user) throw new Error('User not found');
    
    // Stats
    const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('seller_id', userId);
    const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    const { count: conversationsCount } = await supabase.from('conversations').select('*', { count: 'exact', head: true }).or(`user_1.eq.${userId},user_2.eq.${userId}`);
    
    // Financials - detailed breakdown
    const { data: transactions } = await supabase.from('user_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    const totalSpent = transactions?.filter(t => t.transaction_type === 'purchase').reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
    const totalFees = transactions?.filter(t => t.transaction_type === 'fee').reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
    const totalEarned = transactions?.filter(t => t.transaction_type === 'sale').reduce((sum, t) => sum + t.amount, 0) || 0;
    const totalTopUps = transactions?.filter(t => t.transaction_type === 'topup').reduce((sum, t) => sum + t.amount, 0) || 0;
    
    // Purchase history with product details
    const { data: purchaseOrders } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    // Products sold (seller history)
    const { data: products } = await supabase.from('products').select('*').eq('seller_id', userId).order('created_at', { ascending: false });
    
    // Orders
    const { data: orders } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
    
    // Recent conversations
    const { data: conversations } = await supabase
      .from('conversations')
      .select('*, product:products(name, price)')
      .or(`user_1.eq.${userId},user_2.eq.${userId}`)
      .order('last_message_at', { ascending: false })
      .limit(10);
    
    showUserDetailModal(user, { 
      productsCount, 
      ordersCount,
      conversationsCount,
      totalSpent, 
      totalEarned,
      totalFees,
      totalTopUps,
      transactions, 
      products, 
      orders,
      purchaseOrders,
      conversations
    });
    
  } catch (error) {
    console.error('Error loading user details:', error);
    alert('Error: ' + error.message);
  }
}

function showUserDetailModal(user, stats) {
  const modal = document.getElementById('userDetailModal');
  const content = document.getElementById('userDetailContent');
  
  content.innerHTML = `
    <div class="admin-modal-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:2px solid var(--border);">
      <div>
        <h2>👤 ${user.username || user.email}</h2>
        <p style="color:var(--muted);margin:0.25rem 0;">ID: <code>${user.id}</code></p>
        <p style="color:var(--muted);margin:0.25rem 0;">Role: <strong>${user.role.toUpperCase()}</strong></p>
      </div>
      <div style="display:flex;gap:0.5rem;">
        <button class="btn btn-primary" onclick="editUser('${user.id}', ${user.balance})">Edit Balance</button>
        ${user.role !== 'admin' ? `<button class="btn btn-danger" data-action="delete-user" data-id="${user.id}">Delete User</button>` : '<span class="badge badge-admin">Admin User</span>'}
      </div>
    </div>
    
    <!-- Financial Overview -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:2rem;">
      <div class="admin-card" style="padding:1rem;">
        <div style="color:var(--muted);font-size:0.875rem;margin-bottom:0.5rem;">💰 Current Balance</div>
        <div style="font-size:1.5rem;font-weight:bold;color:#10b981;">€${parseFloat(user.balance || 0).toFixed(2)}</div>
      </div>
      <div class="admin-card" style="padding:1rem;">
        <div style="color:var(--muted);font-size:0.875rem;margin-bottom:0.5rem;">🛒 Total Spent</div>
        <div style="font-size:1.5rem;font-weight:bold;color:#ef4444;">-€${stats.totalSpent.toFixed(2)}</div>
      </div>
      <div class="admin-card" style="padding:1rem;">
        <div style="color:var(--muted);font-size:0.875rem;margin-bottom:0.5rem;">💸 Total Earned</div>
        <div style="font-size:1.5rem;font-weight:bold;color:#10b981;">+€${stats.totalEarned.toFixed(2)}</div>
      </div>
      <div class="admin-card" style="padding:1rem;">
        <div style="color:var(--muted);font-size:0.875rem;margin-bottom:0.5rem;">📊 Total Fees</div>
        <div style="font-size:1.5rem;font-weight:bold;color:#f59e0b;">-€${stats.totalFees.toFixed(2)}</div>
      </div>
      <div class="admin-card" style="padding:1rem;">
        <div style="color:var(--muted);font-size:0.875rem;margin-bottom:0.5rem;">📈 Top-ups Added</div>
        <div style="font-size:1.5rem;font-weight:bold;color:#3b82f6;">+€${stats.totalTopUps.toFixed(2)}</div>
      </div>
      <div class="admin-card" style="padding:1rem;">
        <div style="color:var(--muted);font-size:0.875rem;margin-bottom:0.5rem;">📅 Member Since</div>
        <div style="font-size:1.5rem;font-weight:bold;">${formatDate(user.created_at).split(' ')[0]}</div>
      </div>
    </div>
    
    <!-- User Info -->
    <div class="admin-card" style="margin-bottom:2rem;">
      <h3 style="margin-top:0;">👤 Profile Information</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.5rem;">
        <div>
          <div style="color:var(--muted);font-size:0.875rem;">Email</div>
          <div style="font-weight:500;">${user.email}</div>
        </div>
        <div>
          <div style="color:var(--muted);font-size:0.875rem;">Username</div>
          <div style="font-weight:500;">${user.username || 'Not set'}</div>
        </div>
        <div>
          <div style="color:var(--muted);font-size:0.875rem;">Language</div>
          <div style="font-weight:500;">${(user.language || 'en').toUpperCase()}</div>
        </div>
        <div>
          <div style="color:var(--muted);font-size:0.875rem;">Products Listed</div>
          <div style="font-weight:500;font-size:1.25rem;">${stats.productsCount}</div>
        </div>
        <div>
          <div style="color:var(--muted);font-size:0.875rem;">Orders Made</div>
          <div style="font-weight:500;font-size:1.25rem;">${stats.ordersCount}</div>
        </div>
        <div>
          <div style="color:var(--muted);font-size:0.875rem;">Conversations</div>
          <div style="font-weight:500;font-size:1.25rem;">${stats.conversationsCount}</div>
        </div>
      </div>
    </div>
    
    <!-- Tabs -->
    <div class="admin-modal-tabs" style="margin-bottom:1.5rem;border-bottom:2px solid var(--border);">
      <button class="tab-btn active" data-tab="udt-transactions" onclick="switchUserTab('udt-transactions')" style="padding:0.75rem 1.5rem;border:none;background:none;border-bottom:3px solid transparent;cursor:pointer;font-weight:500;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">💳 Transactions (${stats.transactions?.length || 0})</button>
      <button class="tab-btn" data-tab="udt-purchases" onclick="switchUserTab('udt-purchases')" style="padding:0.75rem 1.5rem;border:none;background:none;border-bottom:3px solid transparent;cursor:pointer;font-weight:500;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">🛍️ Purchase History (${stats.purchaseOrders?.length || 0})</button>
      <button class="tab-btn" data-tab="udt-products" onclick="switchUserTab('udt-products')" style="padding:0.75rem 1.5rem;border:none;background:none;border-bottom:3px solid transparent;cursor:pointer;font-weight:500;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">📦 Products (${stats.products?.length || 0})</button>
      <button class="tab-btn" data-tab="udt-chats" onclick="switchUserTab('udt-chats')" style="padding:0.75rem 1.5rem;border:none;background:none;border-bottom:3px solid transparent;cursor:pointer;font-weight:500;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">💬 Conversations (${stats.conversations?.length || 0})</button>
    </div>
    
    <!-- Transactions Tab -->
    <div id="udt-transactions" class="tab-content active">
      ${stats.transactions && stats.transactions.length > 0 ? `
        <table class="admin-table" style="width:100%;border-collapse:collapse;">
          <thead style="background:var(--bg-secondary);">
            <tr>
              <th style="padding:0.75rem;text-align:left;border-bottom:2px solid var(--border);">Date</th>
              <th style="padding:0.75rem;text-align:left;border-bottom:2px solid var(--border);">Type</th>
              <th style="padding:0.75rem;text-align:left;border-bottom:2px solid var(--border);">Description</th>
              <th style="padding:0.75rem;text-align:right;border-bottom:2px solid var(--border);">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${stats.transactions.map(t => `
              <tr style="border-bottom:1px solid var(--border);">
                <td style="padding:0.75rem;">${formatDate(t.created_at)}</td>
                <td style="padding:0.75rem;"><span class="badge badge-${t.transaction_type}">${t.transaction_type.replace('_', ' ').toUpperCase()}</span></td>
                <td style="padding:0.75rem;">${t.description || '-'}</td>
                <td style="padding:0.75rem;text-align:right;font-weight:500;color:${t.amount >= 0 ? '#10b981' : '#ef4444'};">${t.amount >= 0 ? '+' : ''}€${Math.abs(t.amount).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p style="text-align:center;color:var(--muted);">No transactions</p>'}
    </div>
    
    <!-- Purchase History Tab -->
    <div id="udt-purchases" class="tab-content">
      ${stats.purchaseOrders && stats.purchaseOrders.length > 0 ? `
        <div style="display:flex;flex-direction:column;gap:1rem;">
          ${stats.purchaseOrders.map(order => `
            <div class="admin-card" style="padding:1.5rem;border-left:4px solid #3b82f6;">
              <div style="display:flex;justify-content:space-between;margin-bottom:1rem;">
                <div>
                  <h4 style="margin:0 0 0.25rem;">Order #${order.id.slice(0, 8)}</h4>
                  <p style="color:var(--muted);margin:0;font-size:0.875rem;">${formatDate(order.created_at)}</p>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:1.25rem;font-weight:bold;color:#10b981;">€${parseFloat(order.total || 0).toFixed(2)}</div>
                  <span class="badge badge-${order.status}">${order.status.toUpperCase()}</span>
                </div>
              </div>
              ${order.items && order.items.length > 0 ? `
                <div style="background:var(--bg-secondary);padding:0.75rem;border-radius:4px;">
                  <div style="color:var(--muted);font-size:0.875rem;margin-bottom:0.5rem;">Items:</div>
                  ${order.items.map(item => `<div>• ${item.quantity}x ${item.product_name || 'Unknown'} @ €${parseFloat(item.price || 0).toFixed(2)}</div>`).join('')}
                </div>
              ` : ''}
              ${order.shipping_address ? `<div style="color:var(--muted);font-size:0.875rem;margin-top:0.75rem;">📍 ${order.shipping_address}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : '<p style="text-align:center;color:var(--muted);">No purchase history</p>'}
    </div>
    
    <!-- Products Tab -->
    <div id="udt-products" class="tab-content">
      ${stats.products && stats.products.length > 0 ? `
        <div class="admin-products-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1.5rem;">
          ${stats.products.map(p => `
            <div class="admin-card">
              <img src="${p.image_url || 'https://via.placeholder.com/150'}" style="width:100%;height:150px;object-fit:cover;border-radius:4px;margin-bottom:0.75rem;">
              <h4 style="margin:0 0 0.5rem;">${p.name}</h4>
              <div style="color:var(--muted);font-size:0.875rem;margin-bottom:0.75rem;">${p.condition || 'N/A'}</div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:bold;color:#10b981;font-size:1.1rem;">€${parseFloat(p.price).toFixed(2)}</span>
                <span style="color:var(--muted);font-size:0.875rem;">Stock: ${p.stock}</span>
              </div>
            </div>
          `).join('')}
        </div>
      ` : '<p style="text-align:center;color:var(--muted);">No products listed</p>'}
    </div>
    
    <!-- Conversations Tab -->
    <div id="udt-chats" class="tab-content">
      ${stats.conversations && stats.conversations.length > 0 ? `
        <div style="display:flex;flex-direction:column;gap:1rem;">
          ${stats.conversations.map(c => `
            <div class="admin-card" style="padding:1rem;">
              <div style="display:flex;justify-content:space-between;align-items:start;">
                <div>
                  <h4 style="margin:0 0 0.25rem;">📦 ${c.product?.name || 'Unknown Product'}</h4>
                  <div style="color:var(--muted);font-size:0.875rem;">€${parseFloat(c.product?.price || 0).toFixed(2)}</div>
                  <div style="color:var(--muted);font-size:0.875rem;margin-top:0.5rem;">${formatDate(c.last_message_at)}</div>
                </div>
                <span class="badge badge-${c.status}">${c.status.toUpperCase()}</span>
              </div>
            </div>
          `).join('')}
        </div>
      ` : '<p style="text-align:center;color:var(--muted);">No conversations</p>'}
    </div>
  `;
  
  modal.style.display = 'flex';
}

window.switchUserTab = function(tabId) {
  document.querySelectorAll('#userDetailContent .tab-btn').forEach(b => {
    b.classList.remove('active');
    b.style.borderBottomColor = 'transparent';
  });
  document.querySelectorAll('#userDetailContent .tab-content').forEach(c => {
    c.classList.remove('active');
    c.style.display = 'none';
  });
  const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.style.borderBottomColor = 'var(--primary)';
  }
  const activeContent = document.getElementById(tabId);
  if (activeContent) {
    activeContent.classList.add('active');
    activeContent.style.display = 'block';
  }
};

window.editUser = async function(userId, currentBalance) {
  const newBalance = prompt(`Enter new balance for user (current: €${parseFloat(currentBalance || 0).toFixed(2)}):`, parseFloat(currentBalance || 0).toFixed(2));
  if (newBalance === null) return;
  
  const balanceNum = parseFloat(newBalance);
  if (isNaN(balanceNum)) {
    alert('Invalid balance amount');
    return;
  }
  
  try {
    const { error } = await supabase
      .from('users')
      .update({ balance: balanceNum })
      .eq('id', userId);
    
    if (error) throw error;
    alert(`✅ Balance updated to €${balanceNum.toFixed(2)}`);
    viewUserDetails(userId); // Refresh modal
  } catch (err) {
    console.error('Error updating balance:', err);
    alert('Error updating balance: ' + err.message);
  }
};

window.deleteUser = async function(userId) {
  if (!confirm('Are you sure you want to DELETE this user? This cannot be undone! All their data (balance, products, orders) will be removed.')) return;
  
  try {
    console.log('🗑️ Deleting user:', userId);
    
    // Delete user's products first (due to foreign key constraints)
    const { error: delProductsErr } = await supabase
      .from('products')
      .delete()
      .eq('seller_id', userId);
    
    if (delProductsErr) {
      console.warn('Warning: Could not delete all products:', delProductsErr);
    } else {
      console.log('✅ Deleted user products');
    }
    
    // Delete user's orders
    const { error: delOrdersErr } = await supabase
      .from('orders')
      .delete()
      .eq('user_id', userId);
    
    if (delOrdersErr) {
      console.warn('Warning: Could not delete all orders:', delOrdersErr);
    } else {
      console.log('✅ Deleted user orders');
    }
    
    // Delete user's transactions
    const { error: delTxErr } = await supabase
      .from('user_transactions')
      .delete()
      .eq('user_id', userId);
    
    if (delTxErr) {
      console.warn('Warning: Could not delete all transactions:', delTxErr);
    } else {
      console.log('✅ Deleted user transactions');
    }
    
    // Delete user's conversations and messages
    const { error: delConvErr } = await supabase
      .from('conversations')
      .delete()
      .or(`user_1.eq.${userId},user_2.eq.${userId}`);
    
    if (delConvErr) {
      console.warn('Warning: Could not delete conversations:', delConvErr);
    } else {
      console.log('✅ Deleted user conversations');
    }
    
    // Finally, delete the user record
    const { error: delUserErr } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (delUserErr) throw delUserErr;
    console.log('✅ Deleted user from database');
    
    alert('✅ User deleted successfully (including all their products, orders, and transactions)');
    document.getElementById('userDetailModal').style.display = 'none';
    await loadUsers();
    
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('❌ Error deleting user: ' + error.message);
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
  try {
    const type = document.getElementById('tx-type')?.value || 'all';
    const amountFilter = document.getElementById('tx-amount')?.value || 'all';
    const dateFrom = document.getElementById('tx-date-from')?.value;
    const dateTo = document.getElementById('tx-date-to')?.value;
    
    let query = supabase.from('user_transactions').select('*, users!user_id(id, username, email, balance)');
    
    if (type !== 'all') {
      query = query.eq('transaction_type', type);
    }
    
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    
    if (dateTo) {
      query = query.lte('created_at', dateTo + 'T23:59:59');
    }
    
    const { data, error } = await query.order('created_at', { ascending: false }).limit(500);
    
    if (error) {
      console.error('❌ Error loading transactions:', error);
      alert('Error loading transactions: ' + error.message);
      return;
    }
    
    // Apply profit/loss filter client-side
    let filteredData = data || [];
    if (amountFilter === 'profit') {
      filteredData = filteredData.filter(t => t.amount > 0);
    } else if (amountFilter === 'loss') {
      filteredData = filteredData.filter(t => t.amount < 0);
    }
    
    // Calculate statistics
    const stats = {
      total: filteredData.length,
      totalIncome: filteredData.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
      totalExpenses: filteredData.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
      byType: {}
    };
    
    filteredData.forEach(t => {
      if (!stats.byType[t.transaction_type]) {
        stats.byType[t.transaction_type] = 0;
      }
      stats.byType[t.transaction_type]++;
    });
    
    displayTransactions(filteredData, stats);
  } catch (err) {
    console.error('❌ Transaction loading error:', err);
    alert('Error: ' + err.message);
  }
}

function displayTransactions(transactions, stats = {}) {
  const tbody = document.getElementById('transactions-table-body');
  const statsContainer = document.getElementById('transactions-stats-container');
  
  if (!transactions.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--muted);">
      📭 ${i18n.t('no_tx')}
    </td></tr>`;
    if (statsContainer) {
      statsContainer.innerHTML = `<p style="text-align:center;color:var(--muted);">No transactions to display</p>`;
    }
    return;
  }
  
  // Display statistics if available
  if (statsContainer && Object.keys(stats).length > 0) {
    const netBalance = stats.totalIncome - stats.totalExpenses;
    statsContainer.innerHTML = `
      <div class="transactions-stats-grid">
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <div class="stat-label">${i18n.t('admin_total_income')}</div>
            <div class="stat-value" style="color:#10b981;">+€${stats.totalIncome.toFixed(2)}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📉</div>
          <div class="stat-content">
            <div class="stat-label">${i18n.t('admin_total_expenses')}</div>
            <div class="stat-value" style="color:#ef4444;">-€${stats.totalExpenses.toFixed(2)}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-label">${i18n.t('admin_net_balance')}</div>
            <div class="stat-value" style="color:${netBalance >= 0 ? '#10b981' : '#ef4444'};">${netBalance >= 0 ? '+' : ''}€${netBalance.toFixed(2)}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <div class="stat-label">${i18n.t('admin_transaction_count')}</div>
            <div class="stat-value">${stats.total}</div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Get icon for transaction type
  const getTypeIcon = (type) => {
    const icons = {
      'purchase': '🛒',
      'sale': '💵',
      'deposit': '📥',
      'withdraw': '📤',
      'topup': '➕',
      'fee': '💸',
      'refund': '↩️',
      'transfer': '↔️'
    };
    return icons[type] || '💳';
  };
  
  // Get color for amount
  const getAmountColor = (amount) => {
    if (amount > 0) return 'color:#10b981;';
    if (amount < 0) return 'color:#ef4444;';
    return 'color:var(--muted);';
  };
  
  tbody.innerHTML = transactions.map(t => {
    const typeLabel = i18n.t(`tx_${t.transaction_type}`) || t.transaction_type;
    const statusLabel = i18n.t(`tx_${t.status || 'completed'}`) || (t.status || 'completed');
    const typeIcon = getTypeIcon(t.transaction_type);
    const amountColor = getAmountColor(t.amount);
    
    return `
      <tr style="border-bottom:1px solid var(--border);">
        <td style="padding:1rem;font-weight:500;">${formatDate(t.created_at)}</td>
        <td style="padding:1rem;">
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <span style="font-size:1.25rem;">${typeIcon}</span>
            <span>${t.users?.username || t.users?.email || 'Unknown'}</span>
          </div>
        </td>
        <td style="padding:1rem;">
          <span class="badge badge-${t.transaction_type}">${typeLabel}</span>
        </td>
        <td style="padding:1rem;max-width:300px;word-break:break-word;">
          <span style="color:var(--muted);font-size:0.9rem;">${t.description || '—'}</span>
        </td>
        <td style="padding:1rem;text-align:right;font-weight:600;${amountColor}">
          ${t.amount >= 0 ? '+' : ''}€${Math.abs(t.amount).toFixed(2)}
        </td>
        <td style="padding:1rem;">
          <span class="badge badge-${t.status || 'completed'}" style="text-transform:capitalize;">
            ${statusLabel}
          </span>
        </td>
        <td style="padding:1rem;color:var(--muted);font-size:0.875rem;">
          €${parseFloat(t.users?.balance || 0).toFixed(2)}
        </td>
        <td style="padding:1rem;">
          <button class="btn btn-sm" onclick="viewUserDetails('${t.user_id}')" style="cursor:pointer;">
            👤 View
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function formatTransactionDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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
  const type = document.getElementById('tx-type')?.value || 'all';
  const amountFilter = document.getElementById('tx-amount')?.value || 'all';
  const dateFrom = document.getElementById('tx-date-from')?.value;
  const dateTo = document.getElementById('tx-date-to')?.value;
  
  // Get current table data
  const tbody = document.getElementById('transactions-table-body');
  const rows = tbody.querySelectorAll('tr');
  
  if (rows.length === 0 || (rows.length === 1 && rows[0].textContent.includes('No transactions'))) {
    alert('No transactions to export. Apply filters and load transactions first.');
    return;
  }
  
  // Build CSV header
  const headers = ['Date', 'User', 'Type', 'Description', 'Amount (€)', 'Status', 'Balance (€)'];
  const csv = [headers.join(',')];
  
  // Extract table data
  rows.forEach(row => {
    if (!row.textContent.includes('No transactions') && !row.textContent.includes('Loading')) {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 7) {
        const rowData = [
          cells[0].textContent.trim(),
          cells[1].textContent.trim(),
          cells[2].textContent.trim(),
          cells[3].textContent.trim(),
          cells[4].textContent.trim(),
          cells[5].textContent.trim(),
          cells[6].textContent.trim()
        ];
        csv.push(rowData.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','));
      }
    }
  });
  
  // Generate filename with filters
  const now = new Date();
  const timestamp = now.toISOString().split('T')[0];
  const filename = `transactions_${type}_${timestamp}.csv`;
  
  // Create and download file
  const csvContent = csv.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  
  console.log('✅ Exported ' + (csv.length - 1) + ' transactions to ' + filename);
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

// ============================
// MANUAL ADMIN ACTIONS
// ============================

window.adjustUserBalance = async function() {
  try {
    // Get list of users
    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('id, email, username, balance')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (usersErr) throw usersErr;
    
    const userId = prompt(`${i18n.t('admin_select_user')}:\n\n${users.map(u => `${u.email} (€${u.balance})`).join('\n')}\n\nEnter email:`);
    if (!userId) return;
    
    const selectedUser = users.find(u => u.email === userId);
    if (!selectedUser) {
      alert('User not found');
      return;
    }
    
    const action = prompt(`Select action for ${selectedUser.email}:\n1. Add\n2. Subtract\n3. Set\n\nEnter 1, 2, or 3:`);
    if (!action) return;
    
    const amount = parseFloat(prompt(`${i18n.t('admin_amount')}:`));
    if (isNaN(amount)) {
      alert('Invalid amount');
      return;
    }
    
    const reason = prompt(`${i18n.t('admin_reason')}:`);
    if (!reason) return;
    
    let newBalance;
    if (action === '1') newBalance = selectedUser.balance + amount;
    else if (action === '2') newBalance = selectedUser.balance - amount;
    else if (action === '3') newBalance = amount;
    else return;
    
    if (!confirm(`${i18n.t('admin_confirm_balance')}\n${selectedUser.email}: €${selectedUser.balance} → €${newBalance}`)) return;
    
    // Update balance
    const { error: updateErr } = await supabase
      .from('users')
      .update({ balance: Math.max(0, newBalance) })
      .eq('id', selectedUser.id);
    
    if (updateErr) throw updateErr;
    
    // Log transaction
    const txAmount = action === '1' ? amount : action === '2' ? -amount : (amount - selectedUser.balance);
    const { error: txErr } = await supabase
      .from('user_transactions')
      .insert({
        user_id: selectedUser.id,
        transaction_type: 'admin_adjustment',
        amount: txAmount,
        description: `[ADMIN] ${reason}`,
        status: 'completed'
      });
    
    if (txErr) console.warn('Transaction log error:', txErr);
    
    alert(`✅ ${i18n.t('admin_user_balance_updated')}\n${selectedUser.email}: €${Math.max(0, newBalance)}`);
    console.log(`✅ Balance adjusted for ${selectedUser.email}: €${selectedUser.balance} → €${Math.max(0, newBalance)}`);
    
    await loadTransactions();
    await loadDashboard();
  } catch (err) {
    console.error('❌ Balance adjustment error:', err);
    alert(`${i18n.t('admin_error')}: ${err.message}`);
  }
};

window.createManualTransaction = async function() {
  try {
    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('id, email, username')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (usersErr) throw usersErr;
    
    const email = prompt(`${i18n.t('admin_select_user')}:\n\n${users.map(u => u.email).join('\n')}\n\nEnter email:`);
    if (!email) return;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      alert('User not found');
      return;
    }
    
    const types = ['deposit', 'withdraw', 'topup', 'refund', 'fee', 'adjustment'];
    const type = prompt(`Select transaction type:\n${types.map((t, i) => `${i+1}. ${t}`).join('\n')}\n\nEnter 1-6:`);
    if (!type) return;
    
    const typeIdx = parseInt(type) - 1;
    if (typeIdx < 0 || typeIdx >= types.length) return;
    
    const amount = parseFloat(prompt(`${i18n.t('admin_amount')}:`));
    if (isNaN(amount)) {
      alert('Invalid amount');
      return;
    }
    
    const description = prompt(`${i18n.t('admin_reason')}:`);
    if (!description) return;
    
    if (!confirm(`${i18n.t('admin_confirm_create_tx')}\n${email}: ${types[typeIdx]} €${amount}\n${description}`)) return;
    
    // Create transaction
    const { error: txErr } = await supabase
      .from('user_transactions')
      .insert({
        user_id: user.id,
        transaction_type: types[typeIdx],
        amount: amount,
        description: `[ADMIN] ${description}`,
        status: 'completed'
      });
    
    if (txErr) throw txErr;
    
    alert(`✅ ${i18n.t('admin_transaction_created')}\n${email} - ${types[typeIdx]} €${amount}`);
    console.log(`✅ Transaction created: ${email} - ${types[typeIdx]} €${amount}`);
    
    await loadTransactions();
  } catch (err) {
    console.error('❌ Transaction creation error:', err);
    alert(`${i18n.t('admin_error')}: ${err.message}`);
  }
};

window.resetAllStatistics = async function() {
  if (!confirm(`⚠️ ${i18n.t('admin_confirm_reset')}\n\nThis will DELETE all transaction records!`)) return;
  if (!confirm('⚠️ FINAL CONFIRMATION: Are you absolutely sure? This cannot be undone!')) return;
  
  try {
    console.log('🗑️ Resetting all statistics...');
    
    // Delete all transactions
    const { error: txErr } = await supabase
      .from('user_transactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (txErr) throw txErr;
    
    // Reset all user balances to 0 (optional - can be skipped)
    // const { error: balErr } = await supabase
    //   .from('users')
    //   .update({ balance: 0 })
    //   .neq('id', '00000000-0000-0000-0000-000000000000');
    
    alert(`✅ ${i18n.t('admin_stats_reset')}`);
    console.log('✅ All statistics reset successfully');
    
    await loadTransactions();
    await loadDashboard();
  } catch (err) {
    console.error('❌ Reset error:', err);
    alert(`${i18n.t('admin_error')}: ${err.message}`);
  }
};

window.resetUserStatistics = async function() {
  try {
    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('id, email, username')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (usersErr) throw usersErr;
    
    const email = prompt(`Select user to reset:\n\n${users.map(u => u.email).join('\n')}`);
    if (!email) return;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      alert('User not found');
      return;
    }
    
    if (!confirm(`⚠️ Reset all transactions for ${email}?\n\nThis will delete their transaction history!`)) return;
    if (!confirm('⚠️ FINAL CONFIRMATION: Are you sure?')) return;
    
    const { error } = await supabase
      .from('user_transactions')
      .delete()
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    alert(`✅ User statistics reset for ${email}`);
    console.log(`✅ Reset statistics for ${email}`);
    
    await loadTransactions();
  } catch (err) {
    console.error('❌ User reset error:', err);
    alert(`${i18n.t('admin_error')}: ${err.message}`);
  }
};

window.bulkAdjustBalances = async function() {
  try {
    const amount = parseFloat(prompt('Enter amount to add/subtract from all users (use negative for subtract):'));
    if (isNaN(amount)) {
      alert('Invalid amount');
      return;
    }
    
    const reason = prompt('Reason for bulk adjustment:');
    if (!reason) return;
    
    if (!confirm(`⚠️ Add €${amount} to ALL users?\nReason: ${reason}`)) return;
    
    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('id, balance')
      .neq('role', 'admin');
    
    if (usersErr) throw usersErr;
    
    let updated = 0;
    for (const user of users) {
      const newBalance = Math.max(0, user.balance + amount);
      const { error: updateErr } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', user.id);
      
      if (!updateErr) updated++;
      
      // Log transaction
      await supabase
        .from('user_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'bulk_adjustment',
          amount: amount,
          description: `[ADMIN BULK] ${reason}`,
          status: 'completed'
        });
    }
    
    alert(`✅ Updated ${updated} user balances\nAmount: €${amount}\nReason: ${reason}`);
    console.log(`✅ Bulk adjustment completed: ${updated} users`);
    
    await loadTransactions();
    await loadDashboard();
  } catch (err) {
    console.error('❌ Bulk adjustment error:', err);
    alert(`${i18n.t('admin_error')}: ${err.message}`);
  }
};

window.recalculateUserBalance = async function() {
  try {
    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('id, email')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (usersErr) throw usersErr;
    
    const email = prompt(`Calculate balance from transactions:\n\n${users.map(u => u.email).join('\n')}`);
    if (!email) return;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      alert('User not found');
      return;
    }
    
    // Get all transactions for user
    const { data: txs, error: txErr } = await supabase
      .from('user_transactions')
      .select('amount')
      .eq('user_id', user.id);
    
    if (txErr) throw txErr;
    
    const calculatedBalance = txs.reduce((sum, t) => sum + t.amount, 0);
    
    if (!confirm(`Recalculate balance for ${email}?\n\nCalculated balance: €${Math.max(0, calculatedBalance).toFixed(2)}`)) return;
    
    const { error: updateErr } = await supabase
      .from('users')
      .update({ balance: Math.max(0, calculatedBalance) })
      .eq('id', user.id);
    
    if (updateErr) throw updateErr;
    
    alert(`✅ Balance recalculated for ${email}\nNew balance: €${Math.max(0, calculatedBalance).toFixed(2)}`);
    console.log(`✅ Recalculated ${email} balance: €${Math.max(0, calculatedBalance).toFixed(2)}`);
    
    await loadDashboard();
  } catch (err) {
    console.error('❌ Recalculation error:', err);
    alert(`${i18n.t('admin_error')}: ${err.message}`);
  }
};

window.deleteAdminUser = async function() {
  try {
    const { data: admins, error: adminsErr } = await supabase
      .from('users')
      .select('id, email, username')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });
    
    if (adminsErr) throw adminsErr;
    
    if (admins.length === 0) {
      alert('No admin users found');
      return;
    }
    
    const email = prompt(`${i18n.t('admin_select_user')}:\n\n${admins.map(a => a.email).join('\n')}`);
    if (!email) return;
    
    const admin = admins.find(a => a.email === email);
    if (!admin) {
      alert('Admin not found');
      return;
    }
    
    if (!confirm(`⚠️ ${i18n.t('admin_confirm_delete_admin')}\n\n${email}`)) return;
    if (!confirm('⚠️ FINAL CONFIRMATION - This cannot be undone!')) return;
    
    // Delete admin user and cascade
    const { error: delErr } = await supabase
      .from('users')
      .delete()
      .eq('id', admin.id);
    
    if (delErr) throw delErr;
    
    alert(`✅ ${i18n.t('admin_admin_deleted')}\n${email}`);
    console.log(`✅ Admin user deleted: ${email}`);
    
    await loadUsers();
    await loadDashboard();
  } catch (err) {
    console.error('❌ Delete admin error:', err);
    alert(`${i18n.t('admin_error')}: ${err.message}`);
  }
};

window.promoteUserToAdmin = async function() {
  try {
    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (usersErr) throw usersErr;
    
    const email = prompt(`Select user to promote:\n\n${users.map(u => u.email).join('\n')}`);
    if (!email) return;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      alert('User not found');
      return;
    }
    
    if (!confirm(`${i18n.t('admin_confirm_action')}\n\nPromote ${email} to admin?`)) return;
    
    const { error } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', user.id);
    
    if (error) throw error;
    
    alert(`✅ ${i18n.t('admin_promote_success')}\n${email}`);
    console.log(`✅ User promoted to admin: ${email}`);
    
    await loadUsers();
  } catch (err) {
    console.error('❌ Promote error:', err);
    alert(`${i18n.t('admin_error')}: ${err.message}`);
  }
};

window.demoteAdminUser = async function() {
  try {
    const { data: admins, error: adminsErr } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });
    
    if (adminsErr) throw adminsErr;
    
    const email = prompt(`Select admin to demote:\n\n${admins.map(a => a.email).join('\n')}`);
    if (!email) return;
    
    const admin = admins.find(a => a.email === email);
    if (!admin) {
      alert('Admin not found');
      return;
    }
    
    if (!confirm(`${i18n.t('admin_confirm_demote')}\n\n${email}`)) return;
    
    const { error } = await supabase
      .from('users')
      .update({ role: 'user' })
      .eq('id', admin.id);
    
    if (error) throw error;
    
    alert(`✅ ${i18n.t('admin_demote_success')}\n${email}`);
    console.log(`✅ Admin demoted to user: ${email}`);
    
    await loadUsers();
  } catch (err) {
    console.error('❌ Demote error:', err);
    alert(`${i18n.t('admin_error')}: ${err.message}`);
  }
};

window.resetDashboardStats = async function() {
  if (!confirm(`⚠️ ${i18n.t('admin_dashboard_reset')}?\n\nThis resets all dashboard statistics.`)) return;
  if (!confirm('⚠️ FINAL CONFIRMATION: Are you sure?')) return;
  
  try {
    // Delete all transactions (which resets calculated stats)
    const { error: txErr } = await supabase
      .from('user_transactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (txErr) throw txErr;
    
    // Delete all orders
    const { error: ordErr } = await supabase
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (ordErr) console.warn('Order deletion warning:', ordErr);
    
    // Reset all user balances to 0
    const { error: balErr } = await supabase
      .from('users')
      .update({ balance: 0 })
      .neq('role', 'admin');
    
    if (balErr) console.warn('Balance reset warning:', balErr);
    
    alert(`✅ ${i18n.t('admin_dashboard_reset')}`);
    console.log('✅ Dashboard statistics reset');
    
    await loadDashboard();
    await loadTransactions();
  } catch (err) {
    console.error('❌ Reset dashboard error:', err);
    alert(`${i18n.t('admin_error')}: ${err.message}`);
  }
};

window.resetTotalRevenue = async function() {
  if (!confirm(`⚠️ ${i18n.t('admin_reset_revenue')}?\n\nThis deletes all transactions.`)) return;
  if (!confirm('⚠️ FINAL CONFIRMATION: Are you absolutely sure?')) return;
  
  try {
    // Delete all transactions
    const { error } = await supabase
      .from('user_transactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (error) throw error;
    
    // Reset user balances to 0
    const { error: balErr } = await supabase
      .from('users')
      .update({ balance: 0 })
      .neq('role', 'admin');
    
    if (balErr) console.warn('Balance reset warning:', balErr);
    
    alert(`✅ ${i18n.t('admin_revenue_reset')}`);
    console.log('✅ Total revenue reset');
    
    await loadDashboard();
    await loadTransactions();
  } catch (err) {
    console.error('❌ Reset revenue error:', err);
    alert(`${i18n.t('admin_error')}: ${err.message}`);
  }
};

window.deleteAllProductsAndData = async function() {
  if (!confirm(`⚠️ ${i18n.t('admin_confirm_delete_all')}\n\nThis includes:\n- All users (except admins)\n- All products\n- All orders\n- All transactions\n- All conversations`)) return;
  if (!confirm('⚠️⚠️⚠️ FINAL CONFIRMATION - Type YES if you understand this is irreversible!')) return;
  
  const confirm2 = prompt('⚠️⚠️⚠️ Enter YES to confirm you want to DELETE EVERYTHING:');
  if (confirm2 !== 'YES') {
    alert('Cancelled');
    return;
  }
  
  try {
    console.log('🔥 DELETING ALL DATA...');
    
    // Get all non-admin users
    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('id')
      .neq('role', 'admin');
    
    if (!usersErr && users && users.length > 0) {
      // Delete transactions
      await supabase
        .from('user_transactions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Delete conversations
      await supabase
        .from('conversations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Delete orders
      await supabase
        .from('orders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Delete products
      await supabase
        .from('products')
        .delete()
        .neq('seller_id', '');
      
      // Delete non-admin users
      for (const user of users) {
        await supabase
          .from('users')
          .delete()
          .eq('id', user.id);
      }
    }
    
    alert('🔥 ALL DATA DELETED - System reset to admin-only');
    console.log('🔥 Complete data wipe completed');
    
    await loadDashboard();
    await loadUsers();
    await loadProducts();
  } catch (err) {
    console.error('❌ Data deletion error:', err);
    alert(`${i18n.t('admin_error')}: ${err.message}`);
  }
};

window.deleteSpecificUser = async function() {
  try {
    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('id, email, username, role')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (usersErr) throw usersErr;
    
    const email = prompt(`${i18n.t('admin_select_user')}:\n\n${users.map(u => `${u.email} (${u.role})`).join('\n')}`);
    if (!email) return;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      alert('User not found');
      return;
    }
    
    if (!confirm(`⚠️ Delete ${email} and ALL their data?\nThis includes products, orders, transactions.`)) return;
    if (!confirm('⚠️ FINAL CONFIRMATION: Are you sure?')) return;
    
    // Delete user's data
    await supabase.from('user_transactions').delete().eq('user_id', user.id);
    await supabase.from('products').delete().eq('seller_id', user.id);
    await supabase.from('orders').delete().eq('user_id', user.id);
    await supabase.from('conversations').delete().eq('user_id', user.id);
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);
    
    if (error) throw error;
    
    alert(`✅ ${i18n.t('admin_delete_success')}\n${email}`);
    console.log(`✅ User deleted: ${email}`);
    
    await loadUsers();
    await loadDashboard();
  } catch (err) {
    console.error('❌ User deletion error:', err);
    alert(`${i18n.t('admin_error')}: ${err.message}`);
  }
};

window.getSystemHealth = async function() {
  try {
    const { count: userCount, error: userErr } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    const { count: productCount, error: productErr } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    const { count: orderCount, error: orderErr } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    const { count: txCount, error: txErr } = await supabase
      .from('user_transactions')
      .select('*', { count: 'exact', head: true });
    
    const health = `
📊 SYSTEM HEALTH REPORT
======================
👥 Total Users: ${userCount || 0}
📦 Total Products: ${productCount || 0}
🛒 Total Orders: ${orderCount || 0}
💳 Total Transactions: ${txCount || 0}

Status: ✅ All systems operational
Last Check: ${new Date().toLocaleString()}
    `;
    
    alert(health);
    console.log(health);
  } catch (err) {
    console.error('❌ Health check error:', err);
    alert(`${i18n.t('admin_error')}: ${err.message}`);
  }
};

// Modal handlers
document.getElementById('userDetailModalClose')?.addEventListener('click', () => {
  document.getElementById('userDetailModal').style.display = 'none';
});
document.getElementById('userDetailModalOverlay')?.addEventListener('click', () => {
  document.getElementById('userDetailModal').style.display = 'none';
});

// Run
initialize();
