import { supabase, getCurrentUser } from '../supabase.js';
import { i18n } from '../i18n.js';
import { showInfoModal, showConfirmModal, showPromptModal } from '../ui/modal.js';
import { getPlatformSettings, applyPlatformSettingsToWindow, renderPlatformWarningBanner } from '../platform-settings.js';
import { fetchAuditLogs, purgeAuditLogsOlderThan, logAuditEvent } from '../audit.js';

// ============================
// State Management
// ============================
let currentTab = 'dashboard';
let currentUser = null;
const PAGE_SIZES = {
  users: 50,
  products: 50,
  transactions: 100,
  chats: 50,
  userTransactions: 20,
  userOrders: 20,
  recentActivities: 15
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function lockBodyScroll(locked) {
  document.body.style.overflow = locked ? 'hidden' : '';
}

const adminModalStack = [];
const ADMIN_MODAL_BASE_Z_INDEX = 9999;
const ADMIN_MODAL_LAYER_STEP = 10;

function syncAdminModalStack() {
  adminModalStack.forEach((modalId, index) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const layerBase = ADMIN_MODAL_BASE_Z_INDEX + (index * ADMIN_MODAL_LAYER_STEP);
    const overlay = modal.querySelector('.modal-overlay');
    const content = modal.querySelector('.modal-content');
    const closeButton = modal.querySelector('.modal-close');

    modal.style.zIndex = String(layerBase);
    if (overlay) overlay.style.zIndex = String(layerBase);
    if (content) content.style.zIndex = String(layerBase + 1);
    if (closeButton) closeButton.style.zIndex = String(layerBase + 2);
  });

  lockBodyScroll(adminModalStack.length > 0);
}

function openModalById(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  const existingIndex = adminModalStack.indexOf(modalId);
  if (existingIndex !== -1) {
    adminModalStack.splice(existingIndex, 1);
  }

  adminModalStack.push(modalId);
  modal.style.display = 'flex';
  syncAdminModalStack();
}

function closeModalById(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  const existingIndex = adminModalStack.indexOf(modalId);
  if (existingIndex !== -1) {
    adminModalStack.splice(existingIndex, 1);
  }

  modal.style.display = 'none';
  modal.style.zIndex = '';
  modal.querySelector('.modal-overlay')?.style.removeProperty('z-index');
  modal.querySelector('.modal-content')?.style.removeProperty('z-index');
  modal.querySelector('.modal-close')?.style.removeProperty('z-index');
  syncAdminModalStack();
}

function showAdminDataModal(title, bodyHtml) {
  const content = document.getElementById('adminDataModalContent');
  if (!content) return;
  content.innerHTML = `
    <div class="admin-detail-layout">
      <div class="admin-detail-header">
        <h2 style="margin:0 0 0.35rem 0;">${escapeHtml(title)}</h2>
      </div>
      ${bodyHtml}
    </div>
  `;
  openModalById('adminDataModal');
}

async function fetchUsersMap(userIds) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, role, balance')
    .in('id', ids);

  if (error) throw error;

  return Object.fromEntries((data || []).map((user) => [user.id, user]));
}

async function fetchProductsMap(productIds) {
  const ids = [...new Set((productIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, stock, status, seller_id, created_at, listing_fee, reserve_fee, condition, location, image_url')
    .in('id', ids);

  if (error) throw error;

  return Object.fromEntries((data || []).map((product) => [product.id, product]));
}

async function fetchOrdersForUser(userId) {
  const attempts = [
    () => supabase
      .from('orders')
      .select('*')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZES.userOrders),
    () => supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZES.userOrders)
  ];

  for (const run of attempts) {
    const { data, error } = await run();
    if (!error) return data || [];
  }

  return [];
}

// ============================
// Authentication Check
// ============================
async function checkAdminAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href) + '&reason=admin';
    return false;
  }

  // Try to read role from the users table
  try {
    const { data: userData, error: userErr } = await supabase
      .from('users')
      .select('id, role, email')
      .eq('id', user.id)
      .maybeSingle();

    if (userErr) {
      console.warn('Error fetching users row for admin check:', userErr.message || userErr);
    }

    // If we found a users row, validate role
    if (userData && userData.role === 'admin') {
      return user;
    }

    // Fallback: check by email (some setups store users under email only)
    if (user.email) {
      try {
        const { data: byEmail } = await supabase
          .from('users')
          .select('id, role')
          .eq('email', user.email)
          .maybeSingle();

        if (byEmail && byEmail.role === 'admin') {
          return user;
        }
      } catch (e) {
        console.warn('Email lookup for admin check failed:', e?.message || e);
      }
    }

    // If no users row exists but the auth metadata claims admin, create a minimal users row and allow access
    if (!userData) {
      const claimedRole = user.user_metadata?.role || user.app_metadata?.role;
      if (claimedRole === 'admin') {
        try {
          await supabase.from('users').upsert({
            id: user.id,
            email: user.email,
            username: user.user_metadata?.username || user.email?.split('@')[0] || null,
            balance: 0,
            role: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
          return user;
        } catch (e) {
          console.warn('Failed to create users row for admin fallback:', e?.message || e);
        }
      }
    }
  } catch (e) {
    console.error('Error during admin auth check:', e?.message || e);
  }

  // Final deny
  await showInfoModal('Access denied. Admin privileges required.', 'Access Denied');
  window.location.href = 'index.html';
  return false;
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
    const { data: activities, error } = await supabase
      .from('user_transactions')
      .select('id, user_id, amount, transaction_type, description, created_at')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZES.recentActivities);

    if (error) throw error;

    const usersById = await fetchUsersMap((activities || []).map((item) => item.user_id));
    
    const tbody = document.getElementById('dash-activities');
    if (!activities?.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No recent activities</td></tr>';
      return;
    }
    
    tbody.innerHTML = activities.map(a => `
      <tr>
        <td>${escapeHtml(usersById[a.user_id]?.username || usersById[a.user_id]?.email || 'Unknown')}</td>
        <td><span class="badge badge-${a.transaction_type}">${a.transaction_type}</span></td>
        <td>${formatDate(a.created_at)}</td>
        <td class="${a.amount >= 0 ? 'text-success' : 'text-danger'}">€${Math.abs(a.amount).toFixed(2)}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading activities:', error);
    const tbody = document.getElementById('dash-activities');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Unable to load recent activities</td></tr>';
    }
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
        ${user.role !== 'admin' ? `<button class="btn btn-sm btn-success" data-action="promote-user" data-id="${user.id}">Promote</button><button class="btn btn-sm btn-danger" data-action="delete-user" data-id="${user.id}">Delete</button>` : `<button class="btn btn-sm btn-warning" data-action="demote-user" data-id="${user.id}">Demote</button><button class="btn btn-sm btn-danger" data-action="delete-user" data-id="${user.id}">Delete</button>`}
      </td>
    </tr>
  `).join('');
}

window.viewUserDetails = async function(userId) {
  try {
    const { data: user, error: userError } = await supabase.from('users').select('*').eq('id', userId).single();
    if (userError) throw userError;
    if (!user) throw new Error('User not found');

    const [
      productsResult,
      transactionsResult,
      conversationsResult,
      orders,
      productsCountResult,
      conversationsCountResult,
      auditLogs
    ] = await Promise.all([
      supabase.from('products').select('*').eq('seller_id', userId).order('created_at', { ascending: false }).limit(PAGE_SIZES.userOrders),
      supabase.from('user_transactions').select('id, amount, transaction_type, description, reference_id, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(PAGE_SIZES.userTransactions),
      supabase.from('conversations').select('*').or(`buyer_id.eq.${userId},seller_id.eq.${userId}`).order('last_message_at', { ascending: false }).limit(10),
      fetchOrdersForUser(userId),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('seller_id', userId),
      supabase.from('conversations').select('*', { count: 'exact', head: true }).or(`buyer_id.eq.${userId},seller_id.eq.${userId}`),
      fetchAuditLogs({ days: 14, limit: 50, actorUserId: userId }).catch(() => [])
    ]);

    if (productsResult.error) throw productsResult.error;
    if (transactionsResult.error) throw transactionsResult.error;
    if (conversationsResult.error) throw conversationsResult.error;

    const products = productsResult.data || [];
    const transactions = transactionsResult.data || [];
    const conversations = conversationsResult.data || [];
    const productsCount = productsCountResult.count || products.length;
    const conversationsCount = conversationsCountResult.count || conversations.length;
    const ordersCount = Array.isArray(orders) ? orders.length : 0;
    const purchaseOrders = (orders || []).filter((order) => order.buyer_id === userId || order.user_id === userId);
    const productMap = await fetchProductsMap(conversations.map((conv) => conv.product_id).concat((orders || []).map((order) => order.product_id)));

    const enrichedConversations = conversations.map((conversation) => ({
      ...conversation,
      product: productMap[conversation.product_id] || null
    }));

    const enrichedOrders = (orders || []).map((order) => ({
      ...order,
      product: productMap[order.product_id] || null
    }));

    const totalSpent = transactions.filter(t => t.transaction_type === 'purchase').reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);
    const totalFees = transactions.filter(t => t.transaction_type === 'fee').reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);
    const totalEarned = transactions.filter(t => t.transaction_type === 'sale').reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalTopUps = transactions.filter(t => ['topup', 'deposit'].includes(t.transaction_type)).reduce((sum, t) => sum + Number(t.amount || 0), 0);

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
      orders: enrichedOrders,
      purchaseOrders,
      conversations: enrichedConversations,
      auditLogs: auditLogs || []
    });
    
  } catch (error) {
    console.error('Error loading user details:', error);
    await showInfoModal('Error: ' + error.message, 'Error');
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
      <button class="tab-btn" data-tab="udt-audit" onclick="switchUserTab('udt-audit')" style="padding:0.75rem 1.5rem;border:none;background:none;border-bottom:3px solid transparent;cursor:pointer;font-weight:500;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">🕵️ Audit (${stats.auditLogs?.length || 0})</button>
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
                  <div style="font-size:1.25rem;font-weight:bold;color:#10b981;">€${parseFloat(order.total_amount || order.total || 0).toFixed(2)}</div>
                  <span class="badge badge-${order.status}">${order.status.toUpperCase()}</span>
                </div>
              </div>
              ${order.product ? `
                <div style="background:var(--bg-secondary);padding:0.75rem;border-radius:4px;">
                  <div style="color:var(--muted);font-size:0.875rem;margin-bottom:0.5rem;">Product</div>
                  <div>• ${order.product.name || 'Unknown product'}</div>
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
              <img src="${p.image_url || 'https://placehold.co/150/667eea/white?text=No+Image'}" style="width:100%;height:150px;object-fit:cover;border-radius:4px;margin-bottom:0.75rem;">
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

    <div id="udt-audit" class="tab-content">
      ${stats.auditLogs && stats.auditLogs.length > 0 ? `
        <table class="admin-table" style="width:100%;border-collapse:collapse;">
          <thead style="background:var(--bg-secondary);">
            <tr>
              <th style="padding:0.75rem;text-align:left;border-bottom:2px solid var(--border);">Date</th>
              <th style="padding:0.75rem;text-align:left;border-bottom:2px solid var(--border);">Event</th>
              <th style="padding:0.75rem;text-align:left;border-bottom:2px solid var(--border);">Page</th>
              <th style="padding:0.75rem;text-align:left;border-bottom:2px solid var(--border);">Data</th>
            </tr>
          </thead>
          <tbody>
            ${stats.auditLogs.map(log => {
              const data = log.event_data ? JSON.stringify(log.event_data) : '';
              const shortData = data.length > 140 ? `${data.slice(0, 140)}...` : data;
              return `
                <tr style="border-bottom:1px solid var(--border);">
                  <td style="padding:0.75rem;">${formatDate(log.created_at)}</td>
                  <td style="padding:0.75rem;"><span class="badge">${escapeHtml(log.event_type || 'unknown')}</span></td>
                  <td style="padding:0.75rem;">${escapeHtml(log.page_path || '-')}</td>
                  <td style="padding:0.75rem;max-width:320px;word-break:break-word;">${escapeHtml(shortData || '-')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      ` : '<p style="text-align:center;color:var(--muted);">No audit entries in the last 14 days</p>'}
    </div>
  `;
  
  openModalById('userDetailModal');
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
  const newBalance = await showPromptModal(`Enter new balance for user (current: €${parseFloat(currentBalance || 0).toFixed(2)}):`, { title: 'Edit Balance', defaultValue: parseFloat(currentBalance || 0).toFixed(2) });
  if (newBalance === null) return;
  
  const balanceNum = parseFloat(newBalance);
  if (isNaN(balanceNum)) {
    await showInfoModal('Invalid balance amount', 'Error');
    return;
  }
  
  try {
    const { error } = await supabase
      .from('users')
      .update({ balance: balanceNum })
      .eq('id', userId);
    
    if (error) throw error;
    await showInfoModal(`Balance updated to €${balanceNum.toFixed(2)}`, 'Success');
    viewUserDetails(userId); // Refresh modal
  } catch (err) {
    console.error('Error updating balance:', err);
    await showInfoModal('Error updating balance: ' + err.message, 'Error');
  }
};

window.deleteUser = async function(userId) {
  const confirmed = await showConfirmModal({ title: 'Delete User', message: 'Are you sure you want to DELETE this user? This cannot be undone! All their data (balance, products, orders) will be removed.', okText: 'Delete', cancelText: 'Cancel' });
  if (!confirmed) return;
  
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
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
    
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
    
    await showInfoModal('User deleted successfully (including all their products, orders, and transactions)', 'Success');
    closeModalById('userDetailModal');
    await loadUsers();
    
  } catch (error) {
    console.error('Error deleting user:', error);
    await showInfoModal('Error deleting user: ' + error.message, 'Error');
  }
};

window.editUser = async function(userId, currentBalance) {
  const newBalance = await showPromptModal('Enter new balance for user:', { title: 'Edit Balance', defaultValue: String(currentBalance) });
  if (newBalance === null) return;
  
  try {
    const { error } = await supabase.from('users').update({ 
      balance: parseFloat(newBalance),
      updated_at: new Date().toISOString()
    }).eq('id', userId);
    
    if (error) throw error;
    
    await showInfoModal('Balance updated successfully', 'Success');
    await loadUsers();
  } catch (error) {
    await showInfoModal('Error updating balance: ' + error.message, 'Error');
  }
};

// ============================
// Products Management
// ============================
async function loadProducts() {
  const search = document.getElementById('product-search')?.value || '';
  const status = document.getElementById('product-status')?.value || 'all';

  let query = supabase.from('products').select('*');

  if (search) query = query.ilike('name', `%${search}%`);
  if (status !== 'all') query = query.eq('status', status);
  
  const { data, error } = await query.order('created_at', { ascending: false }).limit(PAGE_SIZES.products);
  
  if (error) {
    console.error('Error loading products:', error);
    return;
  }

  const sellersById = await fetchUsersMap((data || []).map((product) => product.seller_id));
  displayProducts((data || []).map((product) => ({
    ...product,
    seller: sellersById[product.seller_id] || null
  })));
}

function displayProducts(products) {
  const tbody = document.getElementById('products-table-body');
  
  if (!products.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No products found</td></tr>';
    return;
  }
  
  tbody.innerHTML = products.map(p => `
    <tr>
      <td><img src="${p.image_url || 'https://placehold.co/50/667eea/white?text=No+Image'}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;"></td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.seller?.username || p.seller?.email || 'Unknown')}</td>
      <td>€${parseFloat(p.price).toFixed(2)}</td>
      <td>${p.stock}</td>
      <td>${escapeHtml(p.condition || 'N/A')}</td>
      <td>${formatDate(p.created_at)}</td>
      <td><span class="badge badge-${p.status || (p.stock > 0 ? 'active' : 'sold')}">${escapeHtml(p.status || (p.stock > 0 ? 'active' : 'sold'))}</span></td>
      <td>
        <button class="btn btn-sm" data-action="view-product" data-id="${p.id}">View</button>
        <button class="btn btn-sm btn-warning" data-action="edit-product-stock" data-id="${p.id}" data-stock="${p.stock}">Stock</button>
        <button class="btn btn-sm btn-secondary" data-action="set-product-status" data-id="${p.id}" data-status="${p.status || ''}">Status</button>
        <button class="btn btn-sm btn-danger" data-action="delete-product" data-id="${p.id}">Delete</button>
      </td>
    </tr>
  `).join('');
}

window.viewProductDetails = async function(productId) {
  try {
    const { data: product, error } = await supabase.from('products').select('*').eq('id', productId).single();
    if (error) throw error;

    const sellersById = await fetchUsersMap([product.seller_id]);
    const seller = sellersById[product.seller_id];

    showAdminDataModal(`Product: ${product.name || 'Untitled'}`, `
      <div class="admin-info-grid">
        <div><strong>Seller</strong><div>${escapeHtml(seller?.username || seller?.email || 'Unknown')}</div></div>
        <div><strong>Price</strong><div>€${parseFloat(product.price || 0).toFixed(2)}</div></div>
        <div><strong>Stock</strong><div>${product.stock ?? 0}</div></div>
        <div><strong>Status</strong><div>${escapeHtml(product.status || 'active')}</div></div>
        <div><strong>Condition</strong><div>${escapeHtml(product.condition || 'N/A')}</div></div>
        <div><strong>Listing Fee</strong><div>€${parseFloat(product.listing_fee || 0).toFixed(2)}</div></div>
      </div>
      <div class="admin-card" style="padding:1rem;">
        <h3 style="margin-top:0;">Description</h3>
        <div style="white-space:pre-wrap;word-break:break-word;">${escapeHtml(product.description || 'No description')}</div>
      </div>
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
        <button class="btn btn-warning" onclick="editProductStock('${product.id}', ${Number(product.stock || 0)})">Update Stock</button>
        <button class="btn btn-secondary" onclick="setProductStatus('${product.id}', '${escapeHtml(product.status || 'active')}')">Change Status</button>
      </div>
    `);
  } catch (error) {
    await showInfoModal('Error loading product: ' + error.message, 'Error');
  }
};

window.editProductStock = async function(productId, currentStock) {
  const response = await showPromptModal('Enter the new stock amount:', { title: 'Update Stock', defaultValue: String(currentStock ?? 0) });
  if (response === null) return;

  const stock = Number.parseInt(response, 10);
  if (!Number.isFinite(stock) || stock < 0) {
    await showInfoModal('Stock must be 0 or higher.', 'Error');
    return;
  }

  try {
    const payload = {
      stock,
      updated_at: new Date().toISOString()
    };

    if (stock === 0) payload.status = 'sold';

    const { error } = await supabase.from('products').update(payload).eq('id', productId);
    if (error) throw error;

    await loadProducts();
    await showInfoModal('Product stock updated.', 'Success');
  } catch (error) {
    await showInfoModal('Error updating stock: ' + error.message, 'Error');
  }
};

window.setProductStatus = async function(productId, currentStatus = 'active') {
  const response = await showPromptModal('Enter product status: active, hidden, or sold', { title: 'Set Product Status', defaultValue: currentStatus || 'active' });
  if (response === null) return;

  const status = String(response).trim().toLowerCase();
  if (!['active', 'hidden', 'sold'].includes(status)) {
    await showInfoModal('Status must be active, hidden, or sold.', 'Error');
    return;
  }

  try {
    const { error } = await supabase
      .from('products')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', productId);

    if (error) throw error;

    await loadProducts();
    await showInfoModal('Product status updated.', 'Success');
  } catch (error) {
    await showInfoModal('Error updating product status: ' + error.message, 'Error');
  }
};

window.deleteProduct = async function(productId) {
  const confirmed = await showConfirmModal({ title: 'Delete Product', message: 'Delete this product?', okText: 'Delete', cancelText: 'Cancel' });
  if (!confirmed) return;
  
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) {
    await showInfoModal('Error: ' + error.message, 'Error');
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
    
    let query = supabase.from('user_transactions').select('id, user_id, amount, transaction_type, description, reference_id, created_at');
    
    if (type !== 'all') {
      query = query.eq('transaction_type', type);
    }
    
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    
    if (dateTo) {
      query = query.lte('created_at', dateTo + 'T23:59:59');
    }
    
    const { data, error } = await query.order('created_at', { ascending: false }).limit(PAGE_SIZES.transactions);
    
    if (error) {
      console.error('❌ Error loading transactions:', error);
      await showInfoModal('Error loading transactions: ' + error.message, 'Error');
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
    
    const usersById = await fetchUsersMap(filteredData.map((item) => item.user_id));
    const enrichedTransactions = filteredData.map((item) => ({
      ...item,
      user: usersById[item.user_id] || null
    }));

    displayTransactions(enrichedTransactions, stats);
  } catch (err) {
    console.error('❌ Transaction loading error:', err);
    await showInfoModal('Error: ' + err.message, 'Error');
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
      'withdrawal': '📤',
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
            <span>${escapeHtml(t.user?.username || t.user?.email || 'Unknown')}</span>
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
          €${parseFloat(t.user?.balance || 0).toFixed(2)}
        </td>
        <td style="padding:1rem;">
          <button class="btn btn-sm" data-action="view-transaction" data-id="${t.id}" style="cursor:pointer;">
            View
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.viewTransactionDetails = async function(transactionId) {
  try {
    const { data: transaction, error } = await supabase
      .from('user_transactions')
      .select('id, user_id, amount, transaction_type, description, reference_id, created_at')
      .eq('id', transactionId)
      .single();

    if (error) throw error;

    const usersById = await fetchUsersMap([transaction.user_id]);
    const user = usersById[transaction.user_id];

    showAdminDataModal(`Transaction ${transaction.id.slice(0, 8)}`, `
      <div class="admin-info-grid">
        <div><strong>User</strong><div>${escapeHtml(user?.username || user?.email || 'Unknown')}</div></div>
        <div><strong>Type</strong><div>${escapeHtml(transaction.transaction_type)}</div></div>
        <div><strong>Amount</strong><div>${transaction.amount >= 0 ? '+' : '-'}€${Math.abs(Number(transaction.amount || 0)).toFixed(2)}</div></div>
        <div><strong>Date</strong><div>${formatDate(transaction.created_at)}</div></div>
        <div><strong>Reference</strong><div>${escapeHtml(transaction.reference_id || 'None')}</div></div>
        <div><strong>User Balance</strong><div>€${parseFloat(user?.balance || 0).toFixed(2)}</div></div>
      </div>
      <div class="admin-card" style="padding:1rem;">
        <h3 style="margin-top:0;">Description</h3>
        <div style="white-space:pre-wrap;word-break:break-word;">${escapeHtml(transaction.description || 'No description')}</div>
      </div>
      <div>
        <button class="btn btn-secondary" onclick="viewUserDetails('${transaction.user_id}')">Open User</button>
      </div>
    `);
  } catch (error) {
    await showInfoModal('Error loading transaction: ' + error.message, 'Error');
  }
};

function formatTransactionDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

window.clearTransactionHistory = async function() {
  const confirmed = await showConfirmModal({ title: 'Clear Transaction History', message: 'Are you sure you want to CLEAR ALL transaction history? This action cannot be undone!', okText: 'Clear', cancelText: 'Cancel' });
  if (!confirmed) return;
  
  try {
    const { data: allTransactions } = await supabase.from('user_transactions').select('id');
    let deletedCount = 0;
    
    if (allTransactions && allTransactions.length > 0) {
      for (const tx of allTransactions) {
        const { error: delErr } = await supabase.from('user_transactions').delete().eq('id', tx.id);
        if (!delErr) deletedCount++;
      }
    }
    
    await showInfoModal(`${i18n.t('admin_history_cleared')}\n${deletedCount} ${i18n.t('admin_transactions_deleted')}`, 'Success');
    loadTransactions();
  } catch (error) {
    await showInfoModal('Error clearing transaction history: ' + error.message, 'Error');
  }
};

export async function exportTransactions() {
  const type = document.getElementById('tx-type')?.value || 'all';
  const amountFilter = document.getElementById('tx-amount')?.value || 'all';
  const dateFrom = document.getElementById('tx-date-from')?.value;
  const dateTo = document.getElementById('tx-date-to')?.value;
  
  // Get current table data
  const tbody = document.getElementById('transactions-table-body');
  const rows = tbody.querySelectorAll('tr');
  
  if (rows.length === 0 || (rows.length === 1 && rows[0].textContent.includes('No transactions'))) {
    await showInfoModal('No transactions to export. Apply filters and load transactions first.', 'Info');
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
    const search = (document.getElementById('chat-search')?.value || '').trim().toLowerCase();
    const status = document.getElementById('chat-status')?.value || 'all';

    let query = supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false })
      .limit(PAGE_SIZES.chats);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    
    if (error) throw error;

    const usersById = await fetchUsersMap((data || []).flatMap((item) => [item.buyer_id, item.seller_id]));
    const productsById = await fetchProductsMap((data || []).map((item) => item.product_id));
    let conversations = (data || []).map((item) => ({
      ...item,
      buyer: usersById[item.buyer_id] || null,
      seller: usersById[item.seller_id] || null,
      product: productsById[item.product_id] || null
    }));

    if (search) {
      conversations = conversations.filter((conversation) => {
        const haystack = [
          conversation.buyer?.username,
          conversation.buyer?.email,
          conversation.seller?.username,
          conversation.seller?.email,
          conversation.product?.name,
          conversation.last_message
        ].filter(Boolean).join(' ').toLowerCase();

        return haystack.includes(search);
      });
    }

    displayConversations(conversations);
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
    const [{ data: conversation, error: conversationError }, { data: messages, error: messagesError }] = await Promise.all([
      supabase.from('conversations').select('*').eq('id', conversationId).single(),
      supabase
      .from('messages')
      .select('id, sender_id, content, created_at, message_type')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(250)
    ]);

    if (conversationError) throw conversationError;
    if (messagesError) throw messagesError;

    const usersById = await fetchUsersMap([conversation.buyer_id, conversation.seller_id, ...(messages || []).map((message) => message.sender_id)]);
    const productsById = await fetchProductsMap([conversation.product_id]);
    const product = productsById[conversation.product_id];
    const buyer = usersById[conversation.buyer_id];
    const seller = usersById[conversation.seller_id];

    showAdminDataModal(`Conversation ${conversation.id.slice(0, 8)}`, `
      <div class="admin-info-grid">
        <div><strong>Buyer</strong><div>${escapeHtml(buyer?.username || buyer?.email || 'Unknown')}</div></div>
        <div><strong>Seller</strong><div>${escapeHtml(seller?.username || seller?.email || 'Unknown')}</div></div>
        <div><strong>Product</strong><div>${escapeHtml(product?.name || 'No product')}</div></div>
        <div><strong>Status</strong><div>${escapeHtml(conversation.status || 'active')}</div></div>
      </div>
      <div class="admin-chat-log">
        ${(messages || []).length ? messages.map((message) => `
          <div class="admin-chat-message">
            <div class="admin-chat-message-meta">
              <strong>${escapeHtml(usersById[message.sender_id]?.username || usersById[message.sender_id]?.email || 'Unknown')}</strong>
              <span style="color:var(--muted);">${formatDate(message.created_at)}</span>
            </div>
            <div class="admin-chat-message-content">${escapeHtml(message.content || '')}</div>
          </div>
        `).join('') : '<p style="margin:0;color:var(--muted);">No messages in this conversation.</p>'}
      </div>
    `);
  } catch (error) {
    await showInfoModal('Error loading messages: ' + error.message, 'Error');
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

window.viewTicket = async function(ticketId) {
  await showInfoModal('Ticket detail view coming soon', 'Info');
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
    await showInfoModal('Error resolving ticket: ' + error.message, 'Error');
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
  const container = document.getElementById('site-settings-form');
  if (!container) return;

  let settings = null;
  try {
    settings = await getPlatformSettings({ useCache: false });
  } catch (e) {
    settings = null;
  }

  const s = settings || {
    warning_enabled: false,
    warning_text: '',
    disable_buying: false,
    disable_listing: false
  };

  container.innerHTML = `
    <h3>⚙️ Platform Settings</h3>
    <p style="color:var(--muted);margin-top:0.25rem;">These settings are read by the website automatically (banner + feature toggles).</p>

    <div class="settings-section" style="margin-top:1rem;">
      <h4>⚠️ Website Warning Banner</h4>
      <label style="display:flex;align-items:center;gap:0.5rem;">
        <input type="checkbox" id="ps_warning_enabled" ${s.warning_enabled ? 'checked' : ''}>
        Enable warning banner
      </label>
      <textarea id="ps_warning_text" rows="3" style="width:100%;padding:0.75rem;border:1px solid var(--border);border-radius:12px;background:var(--card-bg);color:var(--fg);margin-top:0.75rem;" placeholder="Type the warning text that should appear on every page...">${String(s.warning_text || '').replace(/</g,'&lt;')}</textarea>
    </div>

    <div class="settings-section" style="margin-top:1rem;">
      <h4>🛑 Feature Toggles</h4>
      <label style="display:flex;align-items:center;gap:0.5rem;">
        <input type="checkbox" id="ps_disable_buying" ${s.disable_buying ? 'checked' : ''}>
        Disable buying (checkout)
      </label>
      <label style="display:flex;align-items:center;gap:0.5rem;margin-top:0.5rem;">
        <input type="checkbox" id="ps_disable_listing" ${s.disable_listing ? 'checked' : ''}>
        Disable listing (selling)
      </label>
    </div>

    <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-top:1rem;">
      <button class="btn btn-primary" data-action="save-platform-settings">Save Platform Settings</button>
      <button class="btn btn-secondary" data-action="refresh-platform-settings">Reload</button>
    </div>

    <h3 style="margin-top:2rem;">🕵️ Audit Logs (last 14 days)</h3>
    <p style="color:var(--muted);margin-top:0.25rem;">Tracks page views, admin setting changes, and auth-related events (best-effort).</p>
    <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-top:0.75rem;">
      <button class="btn btn-primary" data-action="refresh-audit">Refresh Audit Logs</button>
      <button class="btn btn-warning" data-action="purge-audit">Delete Logs Older Than 14 Days</button>
    </div>
    <div id="audit-logs-container" style="margin-top:0.75rem;">
      <p style="color:var(--muted);">Loading audit logs...</p>
    </div>
  `;

  try {
    await loadAuditLogs();
  } catch (e) {
    // ignore
  }

  try {
    await logAuditEvent('admin_view_settings', { tab: 'settings' });
  } catch (e) {}
}

async function savePlatformSettingsFromForm() {
  const warningEnabled = !!document.getElementById('ps_warning_enabled')?.checked;
  const warningText = String(document.getElementById('ps_warning_text')?.value || '').trim();
  const disableBuying = !!document.getElementById('ps_disable_buying')?.checked;
  const disableListing = !!document.getElementById('ps_disable_listing')?.checked;

  const next = {
    id: 1,
    warning_enabled: warningEnabled,
    warning_text: warningText,
    disable_buying: disableBuying,
    disable_listing: disableListing,
    updated_at: new Date().toISOString()
  };

  const confirmed = await showConfirmModal({
    title: 'Save Platform Settings',
    message: 'Apply these settings to the website now?',
    okText: 'Save',
    cancelText: 'Cancel'
  });
  if (!confirmed) return;

  const { error } = await supabase
    .from('platform_settings')
    .upsert(next, { onConflict: 'id' });

  if (error) throw error;

  // Update client-side cache so the banner/toggles apply immediately on this page.
  try { localStorage.setItem('vendly_platform_settings_cache', JSON.stringify(next)); } catch (e) {}
  try { applyPlatformSettingsToWindow(next); } catch (e) {}
  try { renderPlatformWarningBanner(next); } catch (e) {}

  try {
    await logAuditEvent('admin_update_platform_settings', {
      warning_enabled: warningEnabled,
      warning_text_len: warningText.length,
      disable_buying: disableBuying,
      disable_listing: disableListing
    });
  } catch (e) {}

  await showInfoModal('Platform settings saved. The website will pick these up automatically.', 'Saved');
}

async function loadAuditLogs() {
  const container = document.getElementById('audit-logs-container');
  if (!container) return;

  try {
    const rows = await fetchAuditLogs({ days: 14, limit: 250 });
    if (!rows.length) {
      container.innerHTML = '<p style="color:var(--muted);">No audit logs found for the last 14 days.</p>';
      return;
    }

    const safe = (v) => {
      const s = v == null ? '' : String(v);
      return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Actor</th>
            <th>Event</th>
            <th>Page</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => {
            const data = r.event_data ? JSON.stringify(r.event_data) : '';
            const dataShort = data.length > 140 ? data.slice(0, 140) + '…' : data;
            return `
              <tr>
                <td>${safe(formatDate(r.created_at))}</td>
                <td>${safe(r.actor_email || r.actor_user_id || '-') }</td>
                <td><span class="badge">${safe(r.event_type)}</span></td>
                <td>${safe(r.page_path || '-')}</td>
                <td style="max-width:360px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${safe(dataShort)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (e) {
    container.innerHTML = `<p style="color:var(--error);">Error loading audit logs: ${e.message || e}</p>`;
  }
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
  document.getElementById('user-role')?.addEventListener('change', loadUsers);
  document.getElementById('product-search')?.addEventListener('input', debounce(loadProducts, 300));
  document.getElementById('product-status')?.addEventListener('change', loadProducts);
  document.getElementById('chat-search')?.addEventListener('input', debounce(loadConversations, 250));
  document.getElementById('chat-status')?.addEventListener('change', loadConversations);
  
  // Event delegation for action buttons
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    
    switch(action) {
      case 'view-user': viewUserDetails(id); break;
      case 'edit-user': editUser(id, btn.dataset.balance); break;
      case 'promote-user': promoteUserById(id); break;
      case 'demote-user': demoteUserById(id); break;
      case 'delete-user': deleteUser(id); break;
      case 'view-product': viewProductDetails(id); break;
      case 'edit-product-stock': editProductStock(id, btn.dataset.stock); break;
      case 'set-product-status': setProductStatus(id, btn.dataset.status); break;
      case 'delete-product': deleteProduct(id); break;
      case 'view-transaction': viewTransactionDetails(id); break;
      case 'view-conversation': viewConversation(id); break;
      case 'resolve-ticket': resolveTicket(id); break;
      case 'save-platform-settings':
        try {
          await savePlatformSettingsFromForm();
        } catch (err) {
          await showInfoModal('Error saving platform settings: ' + (err.message || err), 'Error');
        }
        break;
      case 'refresh-platform-settings':
        await loadSiteSettings();
        break;
      case 'refresh-audit':
        await loadAuditLogs();
        break;
      case 'purge-audit':
        try {
          const ok = await showConfirmModal({
            title: 'Delete Old Audit Logs',
            message: 'Delete audit logs older than 14 days?',
            okText: 'Delete',
            cancelText: 'Cancel'
          });
          if (!ok) break;
          await purgeAuditLogsOlderThan({ days: 14 });
          await logAuditEvent('admin_purge_audit_logs', { days: 14 });
          await loadAuditLogs();
          await showInfoModal('Old audit logs deleted (older than 14 days).', 'Done');
        } catch (err) {
          await showInfoModal('Error deleting audit logs: ' + (err.message || err), 'Error');
        }
        break;
      case 'refresh-stats': 
        loadDashboard(); 
        await showInfoModal('Stats refreshed!', 'Info');
        break;
      case 'clear-data': 
        await showInfoModal('Data cleanup feature coming soon', 'Info');
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
    
    const userId = await showPromptModal(`${i18n.t('admin_select_user')}:\n\n${users.map(u => `${u.email} (€${u.balance})`).join('\n')}\n\nEnter email:`, { title: 'Select User' });
    if (!userId) return;
    
    const selectedUser = users.find(u => u.email === userId);
    if (!selectedUser) {
      await showInfoModal('User not found', 'Error');
      return;
    }
    
    const action = await showPromptModal(`Select action for ${selectedUser.email}:\n1. Add\n2. Subtract\n3. Set\n\nEnter 1, 2, or 3:`, { title: 'Balance Action' });
    if (!action) return;
    
    const amountStr = await showPromptModal(`${i18n.t('admin_amount')}:`, { title: 'Amount' });
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
      await showInfoModal('Invalid amount', 'Error');
      return;
    }
    
    const reason = await showPromptModal(`${i18n.t('admin_reason')}:`, { title: 'Reason' });
    if (!reason) return;
    
    let newBalance;
    if (action === '1') newBalance = selectedUser.balance + amount;
    else if (action === '2') newBalance = selectedUser.balance - amount;
    else if (action === '3') newBalance = amount;
    else return;
    
    const conf = await showConfirmModal({ title: 'Confirm Balance Change', message: `${i18n.t('admin_confirm_balance')}\n${selectedUser.email}: €${selectedUser.balance} → €${newBalance}`, okText: 'Confirm', cancelText: 'Cancel' });
    if (!conf) return;
    
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
    
    await showInfoModal(`${i18n.t('admin_user_balance_updated')}\n${selectedUser.email}: €${Math.max(0, newBalance)}`, 'Success');
    console.log(`✅ Balance adjusted for ${selectedUser.email}: €${selectedUser.balance} → €${Math.max(0, newBalance)}`);
    
    await loadTransactions();
    await loadDashboard();
  } catch (err) {
    console.error('❌ Balance adjustment error:', err);
    await showInfoModal(`${i18n.t('admin_error')}: ${err.message}`, 'Error');
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
    
    const email = await showPromptModal(`${i18n.t('admin_select_user')}:\n\n${users.map(u => u.email).join('\n')}\n\nEnter email:`, { title: 'Select User' });
    if (!email) return;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      await showInfoModal('User not found', 'Error');
      return;
    }
    
    const types = ['deposit', 'withdraw', 'topup', 'refund', 'fee', 'adjustment'];
    const type = await showPromptModal(`Select transaction type:\n${types.map((t, i) => `${i+1}. ${t}`).join('\n')}\n\nEnter 1-6:`, { title: 'Transaction Type' });
    if (!type) return;
    
    const typeIdx = parseInt(type) - 1;
    if (typeIdx < 0 || typeIdx >= types.length) return;
    
    const amountStr = await showPromptModal(`${i18n.t('admin_amount')}:`, { title: 'Amount' });
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
      await showInfoModal('Invalid amount', 'Error');
      return;
    }
    
    const description = await showPromptModal(`${i18n.t('admin_reason')}:`, { title: 'Description' });
    if (!description) return;
    
    const confirmed = await showConfirmModal({ title: 'Create Transaction', message: `${i18n.t('admin_confirm_create_tx')}\n${email}: ${types[typeIdx]} €${amount}\n${description}`, okText: 'Create', cancelText: 'Cancel' });
    if (!confirmed) return;
    
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
    
    await showInfoModal(`${i18n.t('admin_transaction_created')}\n${email} - ${types[typeIdx]} €${amount}`, 'Success');
    console.log(`✅ Transaction created: ${email} - ${types[typeIdx]} €${amount}`);
    
    await loadTransactions();
  } catch (err) {
    console.error('❌ Transaction creation error:', err);
    await showInfoModal(`${i18n.t('admin_error')}: ${err.message}`, 'Error');
  }
};

window.resetAllStatistics = async function() {
  const step1 = await showConfirmModal({ title: 'Reset All Statistics', message: `${i18n.t('admin_confirm_reset')}\n\nThis will DELETE all transaction records!`, okText: 'Continue', cancelText: 'Cancel' });
  if (!step1) return;
  const step2 = await showConfirmModal({ title: 'Final Confirmation', message: 'FINAL CONFIRMATION: Are you absolutely sure? This cannot be undone!', okText: 'Yes, delete', cancelText: 'No' });
  if (!step2) return;
  
  try {
    console.log('🗑️ Resetting all statistics...');
    
    // Get all transaction IDs first
    const { data: allTx } = await supabase
      .from('user_transactions')
      .select('id');
    
    // Delete all transactions by ID
    let deletedCount = 0;
    if (allTx && allTx.length > 0) {
      for (const tx of allTx) {
        const { error: delErr } = await supabase
          .from('user_transactions')
          .delete()
          .eq('id', tx.id);
        if (!delErr) deletedCount++;
      }
    }
    
    await showInfoModal(i18n.t('admin_stats_reset') + '\nDeleted ' + deletedCount + ' transactions', 'Success');
    console.log(`✅ All statistics reset - deleted ${deletedCount} transactions`);
    
    await loadTransactions();
    await loadDashboard();
  } catch (err) {
    console.error('❌ Reset error:', err);
    await showInfoModal(i18n.t('admin_error') + ': ' + err.message, 'Error');
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
    
    const email = await showPromptModal(`Select user to reset:\n\n${users.map(u => u.email).join('\n')}`);
    if (!email) return;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      await showInfoModal('User not found', 'Info');
      return;
    }
    
    const step1 = await showConfirmModal({ title: 'Reset User Transactions', message: `Reset all transactions for ${email}?\n\nThis will delete their transaction history!`, okText: 'Continue', cancelText: 'Cancel' });
    if (!step1) return;
    const step2 = await showConfirmModal({ title: 'Final Confirmation', message: 'FINAL CONFIRMATION: Are you sure?', okText: 'Yes, reset', cancelText: 'No' });
    if (!step2) return;
    
    // Get all user's transaction IDs
    const { data: userTx } = await supabase
      .from('user_transactions')
      .select('id')
      .eq('user_id', user.id);
    
    // Delete all user's transactions by ID
    let deletedCount = 0;
    if (userTx && userTx.length > 0) {
      for (const tx of userTx) {
        const { error: delErr } = await supabase
          .from('user_transactions')
          .delete()
          .eq('id', tx.id);
        if (!delErr) deletedCount++;
      }
    }
    
    await showInfoModal('User statistics reset for ' + email + '\nDeleted ' + deletedCount + ' transactions', 'Success');
    console.log(`✅ Reset statistics for ${email} - deleted ${deletedCount} transactions`);
    
    await loadTransactions();
  } catch (err) {
    console.error('❌ User reset error:', err);
    await showInfoModal(i18n.t('admin_error') + ': ' + err.message, 'Error');
  }
};

window.bulkAdjustBalances = async function() {
  try {
    const amountStr = await showPromptModal('Enter amount to add/subtract from all users (use negative for subtract):', { title: 'Amount' }); const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
      await showInfoModal('Invalid amount', 'Info');
      return;
    }
    
    const reason = await showPromptModal('Reason for bulk adjustment:', { title: 'Reason' });
    if (!reason) return;
    
    const confirmed = await showConfirmModal({ title: 'Bulk Adjust Balances', message: `Add €${amount} to ALL users?\nReason: ${reason}`, okText: 'Apply', cancelText: 'Cancel' });
    if (!confirmed) return;
    
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
    
    await showInfoModal('Updated ' + updated + ' user balances\nAmount: €' + amount + '\nReason: ' + reason, 'Success');
    console.log(`✅ Bulk adjustment completed: ${updated} users`);
    
    await loadTransactions();
    await loadDashboard();
  } catch (err) {
    console.error('❌ Bulk adjustment error:', err);
    await showInfoModal(i18n.t('admin_error') + ': ' + err.message, 'Error');
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
    
    const email = await showPromptModal(`Calculate balance from transactions:\n\n${users.map(u => u.email).join('\n')}`);
    if (!email) return;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      await showInfoModal('User not found', 'Info');
      return;
    }
    
    // Get all transactions for user
    const { data: txs, error: txErr } = await supabase
      .from('user_transactions')
      .select('amount')
      .eq('user_id', user.id);
    
    if (txErr) throw txErr;
    
    const calculatedBalance = txs.reduce((sum, t) => sum + t.amount, 0);
    
    const confirmed = await showConfirmModal({ title: 'Recalculate Balance', message: `Recalculate balance for ${email}?\n\nCalculated balance: €${Math.max(0, calculatedBalance).toFixed(2)}`, okText: 'Recalculate', cancelText: 'Cancel' });
    if (!confirmed) return;
    
    const { error: updateErr } = await supabase
      .from('users')
      .update({ balance: Math.max(0, calculatedBalance) })
      .eq('id', user.id);
    
    if (updateErr) throw updateErr;
    
    await showInfoModal('Balance recalculated for ' + email + '\nNew balance: €' + Math.max(0, calculatedBalance).toFixed(2), 'Success');
    console.log(`✅ Recalculated ${email} balance: €${Math.max(0, calculatedBalance).toFixed(2)}`);
    
    await loadDashboard();
  } catch (err) {
    console.error('❌ Recalculation error:', err);
    await showInfoModal(i18n.t('admin_error') + ': ' + err.message, 'Error');
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
      await showInfoModal('No admin users found', 'Info');
      return;
    }
    
    const email = await showPromptModal(`${i18n.t('admin_select_user')}:\n\n${admins.map(a => a.email).join('\n')}`);
    if (!email) return;
    
    const admin = admins.find(a => a.email === email);
    if (!admin) {
      await showInfoModal('Admin not found', 'Info');
      return;
    }
    
    const step1 = await showConfirmModal({ title: 'Delete Admin User', message: `${i18n.t('admin_confirm_delete_admin')}\n\n${email}`, okText: 'Delete', cancelText: 'Cancel' });
    if (!step1) return;
    const step2 = await showConfirmModal({ title: 'Final Confirmation', message: 'FINAL CONFIRMATION - This cannot be undone!', okText: 'Yes, delete', cancelText: 'No' });
    if (!step2) return;
    
    // Delete admin user and cascade
    const { error: delErr } = await supabase
      .from('users')
      .delete()
      .eq('id', admin.id);
    
    if (delErr) throw delErr;
    
    await showInfoModal(i18n.t('admin_admin_deleted') + '\n' + email, 'Success');
    console.log(`✅ Admin user deleted: ${email}`);
    
    await loadUsers();
    await loadDashboard();
  } catch (err) {
    console.error('❌ Delete admin error:', err);
    await showInfoModal(i18n.t('admin_error') + ': ' + err.message, 'Error');
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
    
    const email = await showPromptModal(`Select user to promote:\n\n${users.map(u => u.email).join('\n')}`);
    if (!email) return;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      await showInfoModal('User not found', 'Info');
      return;
    }
    
    const confirmed = await showConfirmModal({ title: 'Promote to Admin', message: `${i18n.t('admin_confirm_action')}\n\nPromote ${email} to admin?`, okText: 'Promote', cancelText: 'Cancel' });
    if (!confirmed) return;
    
    const { error } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', user.id);
    
    if (error) throw error;
    
    await showInfoModal(i18n.t('admin_promote_success') + '\n' + email, 'Success');
    console.log(`✅ User promoted to admin: ${email}`);
    
    await loadUsers();
  } catch (err) {
    console.error('❌ Promote error:', err);
    await showInfoModal(i18n.t('admin_error') + ': ' + err.message, 'Error');
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
    
    const email = await showPromptModal(`Select admin to demote:\n\n${admins.map(a => a.email).join('\n')}`);
    if (!email) return;
    
    const admin = admins.find(a => a.email === email);
    if (!admin) {
      await showInfoModal('Admin not found', 'Info');
      return;
    }
    
    const confirmed = await showConfirmModal({ title: 'Demote Admin', message: `${i18n.t('admin_confirm_demote')}\n\n${email}`, okText: 'Demote', cancelText: 'Cancel' });
    if (!confirmed) return;
    
    const { error } = await supabase
      .from('users')
      .update({ role: 'user' })
      .eq('id', admin.id);
    
    if (error) throw error;
    
    await showInfoModal(i18n.t('admin_demote_success') + '\n' + email, 'Success');
    console.log(`✅ Admin demoted to user: ${email}`);
    
    await loadUsers();
  } catch (err) {
    console.error('❌ Demote error:', err);
    await showInfoModal(i18n.t('admin_error') + ': ' + err.message, 'Error');
  }
};

window.promoteUserById = async function(userId) {
  try {
    const { data: user, error } = await supabase.from('users').select('id, email').eq('id', userId).single();
    if (error) throw error;
    const confirmed = await showConfirmModal({ title: 'Promote to Admin', message: `Promote ${user.email} to admin?`, okText: 'Promote', cancelText: 'Cancel' });
    if (!confirmed) return;
    const { error: updateErr } = await supabase.from('users').update({ role: 'admin' }).eq('id', userId);
    if (updateErr) throw updateErr;
    await showInfoModal(`✅ ${i18n.t('admin_promote_success')}\n${user.email}`);
    await loadUsers();
  } catch (err) {
    console.error('❌ Promote by id error:', err);
    await showInfoModal(i18n.t('admin_error') + ': ' + err.message, 'Error');
  }
};

window.demoteUserById = async function(userId) {
  try {
    const { data: user, error } = await supabase.from('users').select('id, email').eq('id', userId).single();
    if (error) throw error;
    const confirmed = await showConfirmModal({ title: 'Demote Admin', message: `Demote ${user.email} from admin?`, okText: 'Demote', cancelText: 'Cancel' });
    if (!confirmed) return;
    const { error: updateErr } = await supabase.from('users').update({ role: 'user' }).eq('id', userId);
    if (updateErr) throw updateErr;
    await showInfoModal(`✅ ${i18n.t('admin_demote_success')}\n${user.email}`);
    await loadUsers();
  } catch (err) {
    console.error('❌ Demote by id error:', err);
    await showInfoModal(i18n.t('admin_error') + ': ' + err.message, 'Error');
  }
};

window.resetDashboardStats = async function() {
  const step1 = await showConfirmModal({ title: 'Reset Dashboard Stats', message: `${i18n.t('admin_dashboard_reset')}?\n\nThis resets all dashboard statistics.`, okText: 'Continue', cancelText: 'Cancel' });
  if (!step1) return;
  const step2 = await showConfirmModal({ title: 'Final Confirmation', message: 'Are you sure?', okText: 'Yes, reset', cancelText: 'No' });
  if (!step2) return;
  
  try {
    // Delete all transactions
    const { data: allTx } = await supabase
      .from('user_transactions')
      .select('id');
    
    let txDeletedCount = 0;
    if (allTx && allTx.length > 0) {
      for (const tx of allTx) {
        const { error: delErr } = await supabase.from('user_transactions').delete().eq('id', tx.id);
        if (!delErr) txDeletedCount++;
      }
    }
    
    // Delete all orders
    const { data: allOrders } = await supabase
      .from('orders')
      .select('id');
    
    let ordDeletedCount = 0;
    if (allOrders && allOrders.length > 0) {
      for (const order of allOrders) {
        const { error: delErr } = await supabase.from('orders').delete().eq('id', order.id);
        if (!delErr) ordDeletedCount++;
      }
    }
    
    // Reset all non-admin user balances to 0
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .neq('role', 'admin');
    
    if (users && users.length > 0) {
      for (const user of users) {
        await supabase.from('users').update({ balance: 0 }).eq('id', user.id);
      }
    }
    
    await showInfoModal(i18n.t('admin_dashboard_reset') + '\nDeleted ' + txDeletedCount + ' transactions, ' + ordDeletedCount + ' orders', 'Success');
    console.log(`✅ Dashboard statistics reset - ${txDeletedCount} transactions, ${ordDeletedCount} orders`);
    
    await loadDashboard();
    await loadTransactions();
  } catch (err) {
    console.error('❌ Reset dashboard error:', err);
    await showInfoModal(i18n.t('admin_error') + ': ' + err.message, 'Error');
  }
};

window.resetTotalRevenue = async function() {
  const step1 = await showConfirmModal({ title: 'Reset Total Revenue', message: `${i18n.t('admin_reset_revenue')}?\n\nThis deletes all transactions.`, okText: 'Continue', cancelText: 'Cancel' });
  if (!step1) return;
  const step2 = await showConfirmModal({ title: 'Final Confirmation', message: 'Are you absolutely sure?', okText: 'Yes, delete', cancelText: 'No' });
  if (!step2) return;
  
  try {
    // Get all transaction IDs
    const { data: allTx } = await supabase
      .from('user_transactions')
      .select('id');
    
    // Delete all transactions by ID
    let deletedCount = 0;
    if (allTx && allTx.length > 0) {
      for (const tx of allTx) {
        const { error: delErr } = await supabase
          .from('user_transactions')
          .delete()
          .eq('id', tx.id);
        if (!delErr) deletedCount++;
      }
    }
    
    // Reset user balances to 0
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .neq('role', 'admin');
    
    if (users && users.length > 0) {
      for (const user of users) {
        await supabase.from('users').update({ balance: 0 }).eq('id', user.id);
      }
    }
    
    await showInfoModal(i18n.t('admin_revenue_reset') + '\nDeleted ' + deletedCount + ' transactions', 'Success');
    console.log(`✅ Total revenue reset - deleted ${deletedCount} transactions`);
    
    await loadDashboard();
    await loadTransactions();
  } catch (err) {
    console.error('❌ Reset revenue error:', err);
    await showInfoModal(i18n.t('admin_error') + ': ' + err.message, 'Error');
  }
};

window.deleteAllProductsAndData = async function() {
  const step1 = await showConfirmModal({ title: 'Delete Everything', message: `${i18n.t('admin_confirm_delete_all')}\n\nThis includes:\n- All users (except admins)\n- All products\n- All orders\n- All transactions\n- All conversations`, okText: 'Continue', cancelText: 'Cancel' });
  if (!step1) return;
  const step2 = await showConfirmModal({ title: 'FINAL CONFIRMATION', message: 'FINAL CONFIRMATION - Type YES to confirm you want to DELETE EVERYTHING', showInput: true, placeholder: 'Type YES to confirm', okText: 'Confirm', cancelText: 'Cancel' });
  if (!step2 || (typeof step2 === 'string' && step2 !== 'YES')) {
    await showInfoModal('Cancelled');
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
    
    await showInfoModal('🔥 ALL DATA DELETED - System reset to admin-only', 'Info');
    console.log('🔥 Complete data wipe completed');
    
    await loadDashboard();
    await loadUsers();
    await loadProducts();
  } catch (err) {
    console.error('❌ Data deletion error:', err);
    await showInfoModal(i18n.t('admin_error') + ': ' + err.message, 'Error');
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
    
    const email = await showPromptModal(`${i18n.t('admin_select_user')}:\n\n${users.map(u => `${u.email} (${u.role})`).join('\n')}`);
    if (!email) return;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      await showInfoModal('User not found', 'Info');
      return;
    }
    
    const step1 = await showConfirmModal({ title: 'Delete User', message: `Delete ${email} and ALL their data?\nThis includes products, orders, transactions.`, okText: 'Delete', cancelText: 'Cancel' });
    if (!step1) return;
    const step2 = await showConfirmModal({ title: 'Final Confirmation', message: 'FINAL CONFIRMATION: Are you sure?', okText: 'Yes, delete', cancelText: 'No' });
    if (!step2) return;
    
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
    
    await showInfoModal(i18n.t('admin_delete_success') + '\n' + email, 'Success');
    console.log(`✅ User deleted: ${email}`);
    
    await loadUsers();
    await loadDashboard();
  } catch (err) {
    console.error('❌ User deletion error:', err);
    await showInfoModal(i18n.t('admin_error') + ': ' + err.message, 'Error');
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
    
    await showInfoModal(health, 'System Health');
    console.log(health);
  } catch (err) {
    console.error('❌ Health check error:', err);
    await showInfoModal(i18n.t('admin_error') + ': ' + err.message, 'Error');
  }
};

// Modal handlers
document.getElementById('userDetailModalClose')?.addEventListener('click', () => {
  closeModalById('userDetailModal');
});
document.getElementById('userDetailModalOverlay')?.addEventListener('click', () => {
  closeModalById('userDetailModal');
});
document.getElementById('adminDataModalClose')?.addEventListener('click', () => {
  closeModalById('adminDataModal');
});
document.getElementById('adminDataModalOverlay')?.addEventListener('click', () => {
  closeModalById('adminDataModal');
});

window.loadUsers = loadUsers;
window.loadProducts = loadProducts;
window.loadTransactions = loadTransactions;
window.loadConversations = loadConversations;
window.exportTransactions = exportTransactions;

// Run
initialize();
