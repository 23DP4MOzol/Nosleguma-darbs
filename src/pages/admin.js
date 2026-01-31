import { supabase, getCurrentUser } from '../supabase.js';
import { i18n } from '../i18n.js';

// ============================
// Authentication Check - Only admins can access
// ============================
async function checkAdminAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href) + '&reason=admin';
    return false;
  }
  
  // Check if user has admin role
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
// Language and Theme Setup
// ============================
document.getElementById('langSelect').addEventListener('change', e => {
  i18n.setLang(e.target.value);
});

document.getElementById('themeToggle').addEventListener('click', () => {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.classList.remove('dark', 'light');
  html.classList.add(newTheme);
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  document.getElementById('themeToggle').textContent = newTheme === 'dark' ? '☀️' : '🌙';
});

document.getElementById('hamburgerBtn').addEventListener('click', () => {
  document.querySelector('.navbar-links').classList.toggle('active');
});

// ============================
// Dashboard Stats
// ============================
async function loadDashboardStats() {
  try {
    // Total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    // Total products
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    // Today's transactions
    const today = new Date().toISOString().split('T')[0];
    const { count: todayTransactions } = await supabase
      .from('user_transactions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);
    
    // Update UI
    document.getElementById('totalUsers').textContent = totalUsers || 0;
    document.getElementById('totalProducts').textContent = totalProducts || 0;
    document.getElementById('todayTransactions').textContent = todayTransactions || 0;
    
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

// ============================
// User Search
// ============================
async function searchUsers(query) {
  try {
    let queryBuilder = supabase
      .from('users')
      .select('id, email, username, role, balance, created_at');
    
    if (query && query.trim()) {
      queryBuilder = queryBuilder.or(`email.ilike.%${query}%,username.ilike.%${query}%`);
    }
    
    const { data, error } = await queryBuilder
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

async function handleUserSearch(e) {
  e.preventDefault();
  const query = document.getElementById('userSearchInput').value;
  const results = await searchUsers(query);
  displayUserResults(results);
}

function displayUserResults(users) {
  const container = document.getElementById('userSearchResults');
  
  if (users.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--muted);padding:2rem;">No users found.</p>';
    return;
  }
  
  container.innerHTML = `
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:var(--secondary);">
          <th style="padding:0.75rem;text-align:left;border-bottom:1px solid var(--border);">Username</th>
          <th style="padding:0.75rem;text-align:left;border-bottom:1px solid var(--border);">Email</th>
          <th style="padding:0.75rem;text-align:left;border-bottom:1px solid var(--border);">Role</th>
          <th style="padding:0.75rem;text-align:left;border-bottom:1px solid var(--border);">Balance</th>
          <th style="padding:0.75rem;text-align:left;border-bottom:1px solid var(--border);">Joined</th>
          <th style="padding:0.75rem;text-align:left;border-bottom:1px solid var(--border);">Action</th>
        </tr>
      </thead>
      <tbody>
        ${users.map(user => `
          <tr>
            <td style="padding:0.75rem;border-bottom:1px solid var(--border);">${user.username || 'N/A'}</td>
            <td style="padding:0.75rem;border-bottom:1px solid var(--border);">${user.email}</td>
            <td style="padding:0.75rem;border-bottom:1px solid var(--border);">
              <span style="padding:0.25rem 0.5rem;border-radius:4px;background:${user.role === 'admin' ? 'var(--primary)' : 'var(--secondary)'};color:${user.role === 'admin' ? 'white' : 'var(--fg)'};">
                ${user.role}
              </span>
            </td>
            <td style="padding:0.75rem;border-bottom:1px solid var(--border);">€${parseFloat(user.balance || 0).toFixed(2)}</td>
            <td style="padding:0.75rem;border-bottom:1px solid var(--border);">${new Date(user.created_at).toLocaleDateString()}</td>
            <td style="padding:0.75rem;border-bottom:1px solid var(--border);">
              <button class="btn-buy-now" onclick="viewUserDetails('${user.id}')" style="padding:0.5rem 1rem;font-size:0.875rem;">View</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ============================
// User Details View
// ============================
async function viewUserDetails(userId) {
  try {
    // Get user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) throw userError;
    
    // Get auth user info
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    
    // Get user transactions
    const { data: transactions } = await supabase
      .from('user_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    
    // Get user products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });
    
    // Get user purchases
    const { data: purchases } = await supabase
      .from('user_transactions')
      .select('*')
      .eq('user_id', userId)
      .in('transaction_type', ['purchase', 'sale'])
      .order('created_at', { ascending: false })
      .limit(50);
    
    // Show modal
    showUserDetailsModal(userData, authUser, transactions || [], products || [], purchases || []);
    
  } catch (error) {
    console.error('Error loading user details:', error);
    alert('Error loading user details: ' + error.message);
  }
}

function showUserDetailsModal(user, authUser, transactions, products, purchases) {
  const modal = document.getElementById('userDetailsModal');
  const content = document.getElementById('userDetailsContent');
  
  const totalSpent = purchases
    .filter(t => t.transaction_type === 'purchase')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const totalEarned = purchases
    .filter(t => t.transaction_type === 'sale')
    .reduce((sum, t) => sum + t.amount, 0);
  
  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-bottom:2rem;">
      <!-- User Info -->
      <div class="product-card-modern" style="padding:1.5rem;">
        <h3 style="margin:0 0 1rem 0;font-size:1.25rem;">👤 User Information</h3>
        <div style="display:grid;gap:0.75rem;">
          <div><strong>User ID:</strong> <code style="font-size:0.75rem;">${user.id}</code></div>
          <div><strong>Email:</strong> ${user.email}</div>
          <div><strong>Username:</strong> ${user.username || 'N/A'}</div>
          <div><strong>Role:</strong> ${user.role}</div>
          <div><strong>Balance:</strong> €${parseFloat(user.balance || 0).toFixed(2)}</div>
          <div><strong>Bio:</strong> ${user.bio || 'Not set'}</div>
          <div><strong>What I Sell:</strong> ${user.what_i_sell || 'Not set'}</div>
          <div><strong>Joined:</strong> ${new Date(user.created_at).toLocaleString()}</div>
          <div><strong>Email Confirmed:</strong> ${authUser?.email_confirmed_at ? 'Yes' : 'No'}</div>
        </div>
      </div>
      
      <!-- Stats -->
      <div class="product-card-modern" style="padding:1.5rem;">
        <h3 style="margin:0 0 1rem 0;font-size:1.25rem;">📊 User Stats</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
          <div style="text-align:center;padding:1rem;background:var(--secondary);border-radius:8px;">
            <div style="font-size:1.5rem;font-weight:700;">€${parseFloat(user.balance || 0).toFixed(2)}</div>
            <div style="font-size:0.875rem;color:var(--muted);">Current Balance</div>
          </div>
          <div style="text-align:center;padding:1rem;background:var(--secondary);border-radius:8px;">
            <div style="font-size:1.5rem;font-weight:700;">€${totalSpent.toFixed(2)}</div>
            <div style="font-size:0.875rem;color:var(--muted);">Total Spent</div>
          </div>
          <div style="text-align:center;padding:1rem;background:var(--secondary);border-radius:8px;">
            <div style="font-size:1.5rem;font-weight:700;">€${totalEarned.toFixed(2)}</div>
            <div style="font-size:0.875rem;color:var(--muted);">Total Earned</div>
          </div>
          <div style="text-align:center;padding:1rem;background:var(--secondary);border-radius:8px;">
            <div style="font-size:1.5rem;font-weight:700;">${products.length}</div>
            <div style="font-size:0.875rem;color:var(--muted);">Products Listed</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Tabs -->
    <div style="display:flex;gap:0.5rem;margin-bottom:1rem;border-bottom:1px solid var(--border);padding-bottom:0.5rem;">
      <button class="filter-tab active" data-tab="transactions" onclick="switchTab('transactions')">💳 Transactions</button>
      <button class="filter-tab" data-tab="purchases" onclick="switchTab('purchases')">🛒 Purchases</button>
      <button class="filter-tab" data-tab="products" onclick="switchTab('products')">📦 Products</button>
      <button class="filter-tab" data-tab="chats" onclick="switchTab('chats')">💬 Chats</button>
    </div>
    
    <!-- Transactions Tab -->
    <div id="tab-transactions" class="tab-content">
      ${transactions.length === 0 
        ? '<p style="text-align:center;color:var(--muted);padding:2rem;">No transactions found.</p>'
        : `
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:var(--secondary);">
                <th style="padding:0.75rem;text-align:left;border-bottom:1px solid var(--border);">Date</th>
                <th style="padding:0.75rem;text-align:left;border-bottom:1px solid var(--border);">Type</th>
                <th style="padding:0.75rem;text-align:left;border-bottom:1px solid var(--border);">Description</th>
                <th style="padding:0.75rem;text-align:left;border-bottom:1px solid var(--border);">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map(t => `
                <tr>
                  <td style="padding:0.75rem;border-bottom:1px solid var(--border);">${new Date(t.created_at).toLocaleString()}</td>
                  <td style="padding:0.75rem;border-bottom:1px solid var(--border);">
                    <span style="padding:0.25rem 0.5rem;border-radius:4px;background:${getTransactionColor(t.transaction_type)};color:white;font-size:0.75rem;">
                      ${t.transaction_type}
                    </span>
                  </td>
                  <td style="padding:0.75rem;border-bottom:1px solid var(--border);">${t.description || '-'}</td>
                  <td style="padding:0.75rem;border-bottom:1px solid var(--border);color:${t.amount >= 0 ? 'var(--success)' : 'var(--error)'};">
                    ${t.amount >= 0 ? '+' : ''}€${Math.abs(t.amount).toFixed(2)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
    </div>
    
    <!-- Purchases Tab -->
    <div id="tab-purchases" class="tab-content" style="display:none;">
      ${purchases.length === 0 
        ? '<p style="text-align:center;color:var(--muted);padding:2rem;">No purchases found.</p>'
        : `
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:var(--secondary);">
                <th style="padding:0.75rem;text-align:left;border-bottom:1px solid var(--border);">Date</th>
                <th style="padding:0.75rem;text-align:left;border-bottom:1px solid var(--border);">Type</th>
                <th style="padding:0.75rem;text-align:left;border-bottom:1px solid var(--border);">Description</th>
                <th style="padding:0.75rem;text-align:left;border-bottom:1px solid var(--border);">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${purchases.map(t => `
                <tr>
                  <td style="padding:0.75rem;border-bottom:1px solid var(--border);">${new Date(t.created_at).toLocaleString()}</td>
                  <td style="padding:0.75rem;border-bottom:1px solid var(--border);">
                    <span style="padding:0.25rem 0.5rem;border-radius:4px;background:${t.transaction_type === 'purchase' ? '#dc3545' : '#28a745'};color:white;font-size:0.75rem;">
                      ${t.transaction_type}
                    </span>
                  </td>
                  <td style="padding:0.75rem;border-bottom:1px solid var(--border);">${t.description || '-'}</td>
                  <td style="padding:0.75rem;border-bottom:1px solid var(--border);color:${t.amount >= 0 ? 'var(--success)' : 'var(--error)'};">
                    ${t.amount >= 0 ? '+' : ''}€${Math.abs(t.amount).toFixed(2)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
    </div>
    
    <!-- Products Tab -->
    <div id="tab-products" class="tab-content" style="display:none;">
      ${products.length === 0 
        ? '<p style="text-align:center;color:var(--muted);padding:2rem;">No products listed.</p>'
        : `
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(250px, 1fr));gap:1rem;">
            ${products.map(p => `
              <div class="product-card-modern" style="margin:0;">
                <div class="product-image-container">
                  <img src="${p.image_url || 'https://via.placeholder.com/300x200'}" alt="${p.name}" class="product-image" style="height:150px;object-fit:cover;">
                </div>
                <div class="product-info" style="padding:1rem;">
                  <h4 style="margin:0 0 0.5rem 0;font-size:1rem;">${p.name}</h4>
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-weight:700;color:var(--primary);">€${parseFloat(p.price).toFixed(2)}</span>
                    <span style="font-size:0.875rem;color:var(--muted);">Stock: ${p.stock}</span>
                  </div>
                  <div style="margin-top:0.5rem;font-size:0.75rem;color:var(--muted);">
                    Listed: ${new Date(p.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
    </div>
    
    <!-- Chats Tab -->
    <div id="tab-chats" class="tab-content" style="display:none;">
      <p style="text-align:center;color:var(--muted);padding:2rem;">
        Chat history feature coming soon. Users' chat conversations will appear here.
      </p>
    </div>
  `;
  
  modal.style.display = 'flex';
}

function getTransactionColor(type) {
  const colors = {
    'topup': '#28a745',
    'purchase': '#dc3545',
    'sale': '#17a2b8',
    'fee': '#ffc107',
    'withdrawal': '#6c757d',
    'escrow_pending': '#17a2b8',
    'escrow_released': '#28a745'
  };
  return colors[type] || '#6c757d';
}

function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    }
  });
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.style.display = 'none';
  });
  document.getElementById(`tab-${tabName}`).style.display = 'block';
}

// Close modal handlers
document.getElementById('userDetailsModalClose')?.addEventListener('click', () => {
  document.getElementById('userDetailsModal').style.display = 'none';
});

document.getElementById('userDetailsModalOverlay')?.addEventListener('click', () => {
  document.getElementById('userDetailsModal').style.display = 'none';
});

// Make functions globally available
window.viewUserDetails = viewUserDetails;
window.switchTab = switchTab;

// ============================
// Load Recent Activities
// ============================
async function loadRecentActivities() {
  try {
    const { data: activities } = await supabase
      .from('user_transactions')
      .select('*, users!user_id(username, email)')
      .order('created_at', { ascending: false })
      .limit(20);
    
    const tbody = document.getElementById('recentActivitiesBody');
    
    if (!activities || activities.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="padding:1rem;text-align:center;">No recent activities.</td></tr>';
      return;
    }
    
    tbody.innerHTML = activities.map(a => `
      <tr>
        <td style="padding:0.75rem;">${a.users?.username || a.users?.email || 'Unknown'}</td>
        <td style="padding:0.75rem;">${a.transaction_type}</td>
        <td style="padding:0.75rem;">${new Date(a.created_at).toLocaleDateString()}</td>
        <td style="padding:0.75rem;color:${a.amount >= 0 ? 'var(--success)' : 'var(--error)'};">
          ${a.amount >= 0 ? '+' : ''}€${Math.abs(a.amount).toFixed(2)}
        </td>
      </tr>
    `).join('');
    
  } catch (error) {
    console.error('Error loading activities:', error);
  }
}

// ============================
// Initialize Admin Page
// ============================
async function initializeAdminPage() {
  const admin = await checkAdminAuth();
  if (!admin) return;
  
  // Load initial data
  loadDashboardStats();
  loadRecentActivities();
  
  // Load all users by default
  const users = await searchUsers('');
  displayUserResults(users);
  
  // Set up search handler
  document.getElementById('userSearchForm').addEventListener('submit', handleUserSearch);
}

// Run initialization
initializeAdminPage();
