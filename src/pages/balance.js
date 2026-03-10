import { supabase } from '../supabase.js';
import { i18n } from '../i18n.js';
import '../main.js';
import { showConfirmModal, showInfoModal } from '../ui/modal.js';

// ============================
// Initialize Theme from localStorage
// ============================
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  const html = document.documentElement;
  html.classList.remove('light', 'dark');
  html.classList.add(savedTheme);
  html.setAttribute('data-theme', savedTheme);
  document.getElementById('themeToggle').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

// ============================
// Initialize Language from localStorage
// ============================
function initializeLanguage() {
  const savedLang = localStorage.getItem('lang') || 'en';
  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    langSelect.value = savedLang;
  }
  i18n.setLang(savedLang);
}

// ============================
// Language Change Handler
// ============================
document.getElementById('langSelect').addEventListener('change', (e) => {
  const lang = e.target.value;
  localStorage.setItem('lang', lang);
  i18n.setLang(lang);
});

// ============================
// Dark/Light Mode Toggle
// ============================
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

// ============================
// Initialize on page load
// ============================
initializeTheme();
initializeLanguage();

// ============================
// Hamburger Mobile Menu
// ============================
document.getElementById('hamburgerBtn').addEventListener('click', () => {
  document.querySelector('.navbar-links').classList.toggle('active');
});

// ============================
// Supabase Auth & Balance
// ============================
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const balanceBadge = document.getElementById('balanceBadge');
const currentBalanceEl = document.getElementById('currentBalance');
const transactionHistoryEl = document.getElementById('transactionHistory');

let currentUserId = null;

// Keep transaction filter state and loader above loadUser so loadUser can call it
let currentTransactionFilter = 'all';

async function loadTransactions(userId, filter = 'all') {
  const { data, error } = await supabase.from('user_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });

  // Clear existing transactions (but keep the header)
  const existingTransactions = transactionHistoryEl.querySelectorAll('.transaction-item');
  existingTransactions.forEach(tx => tx.remove());

  if(data && data.length) {
    // Filter transactions based on type
    let filteredData = data;
    if (filter !== 'all') {
      switch(filter) {
        case 'deposits':
          filteredData = data.filter(tx => tx.transaction_type === 'deposit');
          break;
        case 'purchases':
          filteredData = data.filter(tx => tx.transaction_type === 'purchase');
          break;
        case 'sales':
          filteredData = data.filter(tx => tx.transaction_type === 'sale');
          break;
      }
    }

    filteredData.forEach(tx => {
      const div = document.createElement('div');
      div.className = 'transaction-item';
      div.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid var(--border);
        transition: background-color 0.2s;
        border-radius: 8px;
      `;
      
      // Dark mode aware hover
      div.onmouseover = () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        div.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'var(--secondary)';
      };
      div.onmouseout = () => div.style.backgroundColor = 'transparent';

      const getTransactionIcon = (type) => {
        switch(type) {
          case 'deposit': return '💰';
          case 'purchase': return '🛒';
          case 'sale': return '💸';
          case 'admin_adjustment': return '📝';
          case 'refund': return '↩️';
          case 'withdrawal': return '💳';
          case 'escrow_hold': return '🔒';
          case 'escrow_release': return '🔓';
          default: return '💳';
        }
      };

      const getTransactionColor = (type) => {
        switch(type) {
          case 'deposit': return '#10b981';
          case 'sale': return '#10b981';
          case 'refund': return '#10b981';
          case 'escrow_release': return '#10b981';
          case 'purchase': case 'admin_adjustment': case 'withdrawal': case 'escrow_hold': return '#ef4444';
          default: return '#6b7280';
        }
      };

      // Translate transaction descriptions
      const getTransactionDescription = (tx) => {
        // Check if description contains known patterns
        const desc = tx.description || '';
        
        // Common transaction patterns
        if (desc.toLowerCase().includes('top-up') || desc.toLowerCase().includes('topup')) {
          return i18n.t('transaction_topup');
        } else if (desc.toLowerCase().includes('withdrawal') || desc.toLowerCase().includes('withdraw')) {
          return i18n.t('transaction_withdraw');
        } else if (desc.toLowerCase().includes('listing fee')) {
          const match = desc.match(/listing fee for (.+)/i);
          return match ? `${i18n.t('transaction_listing_fee')}: ${match[1]}` : i18n.t('transaction_listing_fee');
        } else if (desc.toLowerCase().includes('purchase')) {
          const match = desc.match(/purchase[:\s]+(.+)/i);
          return match ? `${i18n.t('transaction_purchase')}: ${match[1]}` : i18n.t('transaction_purchase');
        } else if (desc.toLowerCase().includes('sale')) {
          const match = desc.match(/sale[:\s]+(.+)/i);
          return match ? `${i18n.t('transaction_sale')}: ${match[1]}` : i18n.t('transaction_sale');
        } else if (desc.toLowerCase().includes('refund')) {
          return i18n.t('transaction_refund');
        }
        
        // Fallback to original description or transaction type
        return desc || tx.transaction_type.replace('_', ' ');
      };

      const amount = Math.abs(parseFloat(tx.amount || 0));
      const isPositive = ['deposit', 'sale', 'refund', 'escrow_release'].includes(tx.transaction_type);

      div.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="font-size: 1.25rem;">${getTransactionIcon(tx.transaction_type)}</div>
          <div>
            <div style="font-weight: 500; color: var(--fg);">${getTransactionDescription(tx)}</div>
            <div style="font-size: 0.875rem; color: var(--muted);">${new Date(tx.created_at).toLocaleDateString()}</div>
          </div>
        </div>
        <div style="font-weight: 600; color: ${getTransactionColor(tx.transaction_type)};">
          ${isPositive ? '+' : '-'}€${amount.toFixed(2)}
        </div>
      `;
      transactionHistoryEl.appendChild(div);
    });

    if (filteredData.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.style.cssText = 'text-align: center; padding: 2rem; color: var(--muted);';
      emptyDiv.innerHTML = `<div style="font-size: 2rem; margin-bottom: 1rem;">📭</div>${i18n.t('no_filter_transactions').replace('{filter}', filter)}`;
      transactionHistoryEl.appendChild(emptyDiv);
    }
  } else {
    const emptyDiv = document.createElement('div');
    emptyDiv.style.cssText = 'text-align: center; padding: 2rem; color: var(--muted);';
    emptyDiv.innerHTML = `<div style="font-size: 2rem; margin-bottom: 1rem;">📭</div>${i18n.t('no_transactions_found')}`;
    transactionHistoryEl.appendChild(emptyDiv);
  }
}

async function loadUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if(user) {
    currentUserId = user.id;
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'flex';
    // Fetch user balance and role
    // First try session cache for instant UI
    try {
      const cached = JSON.parse(sessionStorage.getItem('vendly_balance_cache') || 'null');
      if (cached && cached.userId === user.id && typeof cached.balance !== 'undefined') {
        const balance = parseFloat(cached.balance || 0);
        balanceBadge.querySelector('span').innerText = `€${balance.toFixed(2)}`;
        currentBalanceEl.innerText = `€${balance.toFixed(2)}`;
        if (cached.role === 'admin') {
          const adminBtnEl = document.getElementById('adminBtn');
          if (adminBtnEl) adminBtnEl.style.display = 'flex';
        }
      }
    } catch (e) {
      // ignore parse errors
    }

    // Fire a fresh query to ensure we have the latest data
    try {
      const { data, error } = await supabase.from('users').select('id, balance, role').eq('id', user.id).maybeSingle();
      if (error) console.warn('Error fetching user balance:', error);
      if (data) {
        const balance = parseFloat(data.balance || 0);
        balanceBadge.querySelector('span').innerText = `€${balance.toFixed(2)}`;
        currentBalanceEl.innerText = `€${balance.toFixed(2)}`;
        // Cache it for navbar and other pages
        try { sessionStorage.setItem('vendly_balance_cache', JSON.stringify({ userId: data.id, balance: data.balance, role: data.role })); } catch (e) {}
        if (data.role === 'admin') {
          const adminBtnEl = document.getElementById('adminBtn');
          if (adminBtnEl) adminBtnEl.style.display = 'flex';
        }
      } else {
        // no data
        balanceBadge.querySelector('span').innerText = `€0.00`;
        currentBalanceEl.innerText = `€0.00`;
      }
    } catch (e) {
      console.warn('Failed to fetch users row in loadUser:', e?.message || e);
    }
    loadTransactions(user.id, currentTransactionFilter);
    // Also load user's own products for management
    loadUserProducts(user.id);
  } else {
    loginBtn.style.display = 'flex';
    logoutBtn.style.display = 'none';
    // Redirect to login if not authenticated
    window.location.href = 'login.html';
  }
}

loginBtn.addEventListener('click', async () => {
  window.location.href = 'login.html';
});

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
});

// ============================
// Add Funds / Withdraw
// ============================
const addFundsContainer = document.querySelector('.add-funds');
const fundControls = addFundsContainer?.querySelector('div'); // the controls row containing input + add button

// Ensure withdraw button exists and is visible next to the Add Funds button
let withdrawBtn = document.getElementById('withdrawBtn');
if (!withdrawBtn) {
  withdrawBtn = document.createElement('button');
  withdrawBtn.id = 'withdrawBtn';
  withdrawBtn.className = 'btn-hero-secondary';
  withdrawBtn.style.cssText = 'margin-left:0.5rem;padding:0.75rem 1rem;border-radius:8px; background:#ef4444;color:white;border:none; cursor:pointer;';
  withdrawBtn.textContent = 'Withdraw';
  fundControls?.appendChild(withdrawBtn);
}

// Deposit (Add Funds) handler - uses addBalance from supabase.js
const addFundsBtn = document.getElementById('addFundsBtn');
if (addFundsBtn) {
  addFundsBtn.addEventListener('click', async () => {
    const amount = parseFloat(document.getElementById('fundAmount').value);
    if (isNaN(amount) || amount <= 0) return alert(i18n.t('enter_valid_amount'));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert(i18n.t('loginFirst'));

    try {
      // Import addBalance function from supabase.js
      const { addBalance } = await import('../supabase.js');
      await addBalance(user.id, amount, 'Balance top-up');
      await loadUser();
      document.getElementById('fundAmount').value = '';
      alert(i18n.t('deposit_success'));
    } catch (err) {
      console.error('Error adding funds:', err);
      alert('Failed to add funds: ' + (err.message || err));
    }
  });
}

// Withdraw handler - uses updateBalance from supabase.js
if (withdrawBtn) {
  withdrawBtn.addEventListener('click', async () => {
    const amount = parseFloat(document.getElementById('fundAmount').value);
    if (isNaN(amount) || amount <= 0) return alert(i18n.t('enter_valid_amount'));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert(i18n.t('loginFirst'));

    try {
      // Import getBalance and updateBalance from supabase.js
      const { getBalance, updateBalance } = await import('../supabase.js');
      const currentBalance = await getBalance(user.id);
      
      if (currentBalance < amount) {
        alert('Insufficient balance for withdrawal');
        return;
      }
      
      const newBalance = currentBalance - amount;
      await updateBalance(user.id, newBalance);
      
      // Record withdrawal transaction
      await supabase.from('user_transactions').insert({
        user_id: user.id,
        amount: -amount,
        transaction_type: 'withdrawal',
        description: 'Withdrawal',
        created_at: new Date().toISOString()
      });
      
      await loadUser();
      document.getElementById('fundAmount').value = '';
      alert(i18n.t('withdrawal_success'));
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      alert('Failed to withdraw: ' + (error.message || error));
    }
  });
}

// ============================
// Manage User Listings
// ============================
async function loadUserProducts(userId) {
  try {
    const { data, error } = await supabase.from('products').select('*').eq('seller_id', userId).order('created_at', { ascending: false });
    const container = document.getElementById('myListingsContainer');
    
    if (error) {
      console.error('Error loading user products:', error);
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--muted);">
          <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
          <div style="color: #ef4444;">Failed to load listings.</div>
        </div>
      `;
      return;
    }
    
    container.innerHTML = '';
    
    if (!data || data.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--muted);">
          <div style="font-size: 2rem; margin-bottom: 1rem;">📦</div>
          <div data-i18n="no_listings">${i18n.t('no_listings')}</div>
        </div>
      `;
      return;
    }
    
    // Create a header for the listings table
    const header = document.createElement('div');
    header.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 1fr 200px; gap: 1rem; padding: 1rem; border-bottom: 2px solid var(--border); font-weight: 600; color: var(--fg); font-size: 0.875rem;';
    header.innerHTML = `
      <div>Product</div>
      <div>Price</div>
      <div>Stock</div>
      <div>Actions</div>
    `;
    container.appendChild(header);
    
    // Add each product listing
    data.forEach(p => {
      const div = document.createElement('div');
      div.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 1fr 200px; gap: 1rem; align-items: center; padding: 1rem; border-bottom: 1px solid var(--border); transition: background-color 0.2s;';
      
      div.onmouseover = () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        div.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'var(--secondary)';
      };
      div.onmouseout = () => div.style.backgroundColor = 'transparent';
      
      const conditionEmoji = {
        'new': '✨',
        'like_new': '🔄',
        'good': '👍',
        'fair': '😐',
        'poor': '⚠️'
      };
      
      div.innerHTML = `
        <div>
          <div style="font-weight: 600; color: var(--fg); margin-bottom: 0.25rem;">${escapeHtml(p.name)}</div>
          <div style="font-size: 0.875rem; color: var(--muted);">
            ${p.category ? `📦 ${p.category}` : ''} 
            ${p.condition ? `• ${conditionEmoji[p.condition] || ''} ${p.condition.replace('_', ' ')}` : ''}
          </div>
          <div style="font-size: 0.75rem; color: var(--muted); margin-top: 0.25rem;">
            ${p.created_at ? `Created: ${new Date(p.created_at).toLocaleDateString()}` : ''}
          </div>
        </div>
        <div style="font-weight: 600; color: var(--fg);">€${parseFloat(p.price||0).toFixed(2)}</div>
        <div style="color: var(--fg);">
          ${parseInt(p.stock || 0) > 0 
            ? `<span style="color: #10b981;">✓ ${p.stock}</span>` 
            : `<span style="color: #ef4444;">✗ 0</span>`
          }
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button data-id="${p.id}" class="editListingBtn" style="flex: 1; padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: var(--transition);">
            ✏️ ${i18n.t('edit_listing')}
          </button>
          <button data-id="${p.id}" class="deleteListingBtn" style="flex: 1; padding: 0.5rem 1rem; background: #ef4444; color: white; border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: var(--transition);">
            🗑️ ${i18n.t('delete_listing')}
          </button>
        </div>
      `;
      container.appendChild(div);
    });

    // Attach delete handlers
    container.querySelectorAll('.deleteListingBtn').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const id = e.target.getAttribute('data-id');
        const confirmed = await showConfirmModal({ title: 'Delete Listing', message: i18n.t('delete_listing_confirm'), okText: 'Delete', cancelText: 'Cancel' });
        if (!confirmed) return;

        // Show loading state
        btn.textContent = '⏳...';
        btn.disabled = true;

        try {
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) throw error;
          await showInfoModal(i18n.t('listing_deleted'), 'Deleted');
          loadUserProducts(userId);
        } catch (err) {
          console.error('Error deleting listing', err);
          await showInfoModal(i18n.t('failed_to_delete') + ': ' + (err.message || err), 'Error');
          btn.textContent = `🗑️ ${i18n.t('delete_listing')}`;
          btn.disabled = false;
        }
      };
    });

    // Attach edit handlers
    container.querySelectorAll('.editListingBtn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = e.target.getAttribute('data-id');
        window.location.href = `sell.html?edit=${id}`;
      };
    });

  } catch (err) {
    console.error('Error loading user products', err);
    const container = document.getElementById('myListingsContainer');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--muted);">
          <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
          <div style="color: #ef4444;">Failed to load listings: ${err.message}</div>
        </div>
      `;
    }
  }
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Transaction filter buttons
document.getElementById('filterAll').addEventListener('click', () => {
  setActiveFilter('filterAll');
  currentTransactionFilter = 'all';
  loadTransactions(currentUserId, currentTransactionFilter);
});

document.getElementById('filterDeposits').addEventListener('click', () => {
  setActiveFilter('filterDeposits');
  currentTransactionFilter = 'deposits';
  loadTransactions(currentUserId, currentTransactionFilter);
});

document.getElementById('filterPurchases').addEventListener('click', () => {
  setActiveFilter('filterPurchases');
  currentTransactionFilter = 'purchases';
  loadTransactions(currentUserId, currentTransactionFilter);
});

document.getElementById('filterSales').addEventListener('click', () => {
  setActiveFilter('filterSales');
  currentTransactionFilter = 'sales';
  loadTransactions(currentUserId, currentTransactionFilter);
});

function setActiveFilter(activeId) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.style.background = 'var(--card-bg)';
    btn.style.color = 'var(--fg)';
    btn.style.border = '1px solid var(--border)';
  });
  document.getElementById(activeId).classList.add('active');
  document.getElementById(activeId).style.background = 'var(--primary)';
  document.getElementById(activeId).style.color = 'white';
  document.getElementById(activeId).style.border = '1px solid var(--primary)';
}

// Call loadUser after all functions are defined
loadUser();
