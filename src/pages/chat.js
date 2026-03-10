import { supabase, getOrCreateConversation } from '../supabase.js';
import { i18n } from '../i18n.js';
import { showInfoModal, showPromptModal } from '../ui/modal.js';

// ============================
// Authentication Check - Redirect guests to login
// ============================
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // User is not logged in, redirect to login page with reason
    const redirectUrl = window.location.href;
    const reason = 'chat';
    window.location.href = `login.html?redirect=${encodeURIComponent(redirectUrl)}&reason=${reason}`;
    return false;
  }
  return user;
}

// small HTML escape helper used throughout the chat UI
function escapeHtml(unsafe) {
  if (!unsafe && unsafe !== 0) return '';
  return String(unsafe)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;');
}

// ============================
// Language Setup
// ============================
const langSelect = document.getElementById('langSelect');
langSelect.addEventListener('change', e => i18n.setLang(e.target.value));

// ============================
// Dark/Light Mode Toggle
// ============================
// Theme toggle is handled by centralized theme.js

// ============================
// Hamburger Menu
// ============================
document.getElementById('hamburgerBtn').addEventListener('click', () => {
  document.querySelector('.navbar-links').classList.toggle('active');
});

// ============================
// Supabase Auth
// ============================
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const balanceBadge = document.getElementById('balanceBadge');

let currentUser = null;

async function loadUser() {
  const { data: { user } } = await supabase.auth.getUser();
  currentUser = user;
  if (user) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'flex';
    // show balance if available
    try {
      const { data } = await supabase.from('users').select('balance, username').eq('id', user.id).maybeSingle();
      if (data && data.balance !== undefined) {
        balanceBadge.querySelector('span').innerText = `€${parseFloat(data.balance||0).toFixed(2)}`;
      }
    } catch(e){ /* ignore */ }
    await loadConversations();

    // On mobile: show sidebar (contact list) by default
    if (window.innerWidth <= 768) {
      const sidebar = document.querySelector('.chat-sidebar');
      if (sidebar) sidebar.classList.add('mobile-visible');
    }
  } else {
    loginBtn.style.display = 'flex';
    logoutBtn.style.display = 'none';
  }
}

// Ensure login button navigates to login page
if (loginBtn && !loginBtn._hasHandler) {
  loginBtn.addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'login.html'; });
  loginBtn._hasHandler = true;
}

// Single logout handler
if (logoutBtn && !logoutBtn._hasHandler) {
  logoutBtn.addEventListener('click', async (e) => {
    e && e.preventDefault();
    try { await supabase.auth.signOut(); } catch (err) { console.warn('Sign out failed', err); }
    window.location.href = 'index.html';
  });
  logoutBtn._hasHandler = true;
}

// Dropdown toggle (single handler)
(function setupDropdown() {
  const dropdownBtnLocal = document.querySelector('.dropdown-btn');
  if (!dropdownBtnLocal) return;
  dropdownBtnLocal.addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = e.target.closest('.dropdown');
    if (dropdown) dropdown.classList.toggle('open');
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
  });
})();

// ============================
// Chat Logic (real implementation)
// ============================
const chatList = document.getElementById('chatList');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

let activeConversation = null;
let messageSub = null;
let globalMessageSub = null;
let knownConversationIds = new Set();
let knownMessageIds = new Set(); // track messages we've already rendered to avoid duplicates

// Load user's conversations
async function loadConversations() {
  if (!currentUser) return;
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`*, product:products(id,name), buyer:users!buyer_id(id,username), seller:users!seller_id(id,username)`)
      .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`)
      .order('last_message_at', { ascending: false });
    if (error) throw error;
    renderConversations(data || []);
    knownConversationIds = new Set((data || []).map(d => d.id));
    await ensureGlobalMessageListener();
    // Re-highlight active conversation in the sidebar
    if (activeConversation) {
      const items = chatList.querySelectorAll('.chat-list-item');
      items.forEach(el => {
        el.classList.toggle('active', el.dataset.convId === activeConversation.id);
      });
    }
  } catch (err) {
    console.error('Failed to load conversations', err);
    chatList.innerHTML = '<div style="padding:1rem;color:var(--muted)">Failed to load conversations.</div>';
  }
}

function renderConversations(convs) {
  chatList.innerHTML = '';
  if (!convs || convs.length === 0) {
    chatList.innerHTML = '<div style="padding:1rem;color:var(--muted)">No conversations yet.</div>';
    return;
  }
  convs.forEach(conv => {
    const other = conv.buyer?.id === currentUser.id ? conv.seller : conv.buyer;
    const lastMsgTime = conv.last_message_at ? new Date(conv.last_message_at).toLocaleString() : '';
    const lastText = conv.last_message || (conv.product?.name ? `Regarding: ${conv.product.name}` : 'New conversation');
    const item = document.createElement('div');
    item.className = 'chat-list-item';
    item.dataset.convId = conv.id;
    item.innerHTML = `
      <div class="chat-avatar avatar-circle-small">${(other?.username||'U').charAt(0).toUpperCase()}</div>
      <div class="chat-preview">
        <div class="chat-name">${escapeHtml(other?.username || 'Unknown')}</div>
        <div class="chat-last-message">${escapeHtml(lastText)} <span class="chat-time">${lastMsgTime}</span></div>
      </div>
      <button class="chat-delete-btn" title="Remove conversation" aria-label="Remove conversation">&times;</button>
    `;
    // Click on the contact to open conversation
    item.addEventListener('click', (e) => {
      // Don't open conversation if clicking delete button
      if (e.target.closest('.chat-delete-btn')) return;
      // Mark active
      chatList.querySelectorAll('.chat-list-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      openConversation(conv);
    });
    // Delete button handler
    const deleteBtn = item.querySelector('.chat-delete-btn');
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const confirmed = confirm(`Remove conversation with ${other?.username || 'this user'}? This will delete all messages.`);
      if (!confirmed) return;
      await deleteConversation(conv.id);
    });
    chatList.appendChild(item);
  });
}

// Delete a conversation and all its messages
async function deleteConversation(convId) {
  try {
    // First delete all messages in this conversation
    const { error: msgErr } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', convId);
    if (msgErr) throw msgErr;

    // Then delete the conversation itself
    const { error: convErr } = await supabase
      .from('conversations')
      .delete()
      .eq('id', convId);
    if (convErr) throw convErr;

    // If this was the active conversation, clear the chat area
    if (activeConversation && activeConversation.id === convId) {
      activeConversation = null;
      knownMessageIds.clear();
      chatMessages.innerHTML = '<div style="padding:1rem;color:var(--muted)">Select a conversation to start chatting.</div>';
      document.getElementById('activeUserAvatar').innerText = '';
      document.getElementById('activeUserName').innerText = '';
      document.getElementById('activeUserStatus').innerText = '';
    }

    // Reload conversation list
    await loadConversations();
  } catch (err) {
    console.error('Failed to delete conversation', err);
    await showInfoModal('Failed to remove conversation: ' + (err.message || err), 'Error');
  }
}

async function openConversation(conv) {
  // unsubscribe previous per-conversation channel
  if (messageSub) {
    try { await supabase.removeChannel(messageSub); } catch (e) { /* ignore */ }
    messageSub = null;
  }
  activeConversation = conv;

  // On mobile: hide sidebar, show back button
  if (window.innerWidth <= 768) {
    const sidebar = document.querySelector('.chat-sidebar');
    const backBtn = document.getElementById('chatBackBtn');
    if (sidebar) sidebar.classList.remove('mobile-visible');
    if (backBtn) backBtn.style.display = '';
  }

  const other = conv.buyer?.id === currentUser.id ? conv.seller : conv.buyer;
  document.getElementById('activeUserAvatar').innerText = (other?.username||'U').charAt(0).toUpperCase();
  document.getElementById('activeUserName').innerText = other?.username || 'Unknown';
  document.getElementById('activeUserStatus').innerText = conv.product?.name ? `Regarding: ${conv.product.name}` : '';
  chatMessages.innerHTML = '<div style="padding:1rem;color:var(--muted)">Loading messages…</div>';
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:users(id,username)')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });
    if (error) throw error;
    renderMessages(messages || []);
    // subscribe to new messages for this conversation
    messageSub = supabase.channel(`conversation-${conv.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conv.id}` }, async (payload) => {
        const newMsg = payload.new;
        try {
          // fetch full message including sender to ensure username is available
          const { data: fullMsg, error: msgErr } = await supabase.from('messages').select('*, sender:users(id,username)').eq('id', newMsg.id).maybeSingle();
          const messageToAppend = fullMsg || (Object.assign({}, newMsg, { sender: { id: newMsg.sender_id, username: newMsg.sender_id === currentUser?.id ? 'You' : 'User' } }));
          appendMessage(messageToAppend);
        } catch (e) {
          console.warn('Error handling per-conversation incoming message', e);
          // fallback: append minimal message
          appendMessage(Object.assign({}, newMsg, { sender: { id: newMsg.sender_id, username: newMsg.sender_id === currentUser?.id ? 'You' : 'User' } }));
        }
      })
      .subscribe();
  } catch (err) {
    console.error('Failed to load messages', err);
    chatMessages.innerHTML = '<div style="padding:1rem;color:crimson">Failed to load messages.</div>';
  }
}

function renderMessages(messages) {
  chatMessages.innerHTML = '';
  if (!messages || messages.length === 0) {
    chatMessages.innerHTML = '<div style="padding:1rem;color:var(--muted)">No messages yet. Start the conversation!</div>';
    return;
  }
  messages.forEach(m => appendMessage(m));
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendMessage(m) {
  // If message has an id and we've already rendered it, skip to avoid duplicates
  if (m && m.id && knownMessageIds.has(m.id)) return;
  if (m && m.id) knownMessageIds.add(m.id);

  const isSender = m.sender?.id === currentUser?.id || m.sender_id === currentUser?.id;
  const msgDiv = document.createElement('div');
  msgDiv.className = `message-group ${isSender ? 'sender' : 'receiver'}`;
  const senderName = (m.sender && m.sender.username) ? m.sender.username : (isSender ? 'You' : 'User');
  msgDiv.innerHTML = `
    <div class="message-avatar avatar-circle">${(senderName||'U').charAt(0).toUpperCase()}</div>
    <div class="messages-stack">
      <div class="message-bubble-modern ${isSender ? 'sender' : ''}">${escapeHtml(m.content)}</div>
      <div class="message-timestamp ${isSender ? 'sender' : ''}">${new Date(m.created_at).toLocaleString()}</div>
    </div>
  `;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send message (use server RPC to insert and update conversation atomically)
sendBtn.removeEventListener && sendBtn.removeEventListener('click', () => {});
sendBtn.addEventListener('click', async () => {
  const text = messageInput.value.trim();
  if (!text || !activeConversation || !currentUser) return;
  const optimistic = {
    conversation_id: activeConversation.id,
    sender_id: currentUser.id,
    content: text,
    message_type: 'text',
    is_read: false,
    created_at: new Date().toISOString()
  };
  // optimistic UI (no id yet)
  appendMessage({ ...optimistic, sender: { id: currentUser.id, username: 'You' } });
  messageInput.value = '';
  try {
    // Call the secure RPC which inserts message and updates conversation atomically
    const { data, error } = await supabase.rpc('rpc_send_message', { p_conversation_id: activeConversation.id, p_content: text });
    if (error) throw error;
    // New RPC returns JSON; check for application-level errors embedded in the payload
    if (data?.error) throw new Error(data.error);
    const inserted = Array.isArray(data) ? data[0] : data;
    // rpc may return message_id (avoid ambiguous 'id' column); fall back to id if present
    const insertedId = inserted?.message_id ?? inserted?.id ?? null;
    if (insertedId) knownMessageIds.add(insertedId);
    // refresh conversations so sidebar preview and ordering update
    try { await loadConversations(); } catch (e) { /* ignore */ }
  } catch (err) {
    console.error('Failed to send message via RPC', err);
    await showInfoModal('Failed to send message: ' + (err.message || err), 'Error');
  }
});

// Enter to send
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBtn.click(); }
});

// Global listener: verifies participant and routes message
async function ensureGlobalMessageListener() {
  if (globalMessageSub) return;
  try {
    globalMessageSub = supabase.channel('global-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const newMsg = payload.new;
        try {
          const { data: convData, error: convError } = await supabase.from('conversations').select('id,buyer_id,seller_id').eq('id', newMsg.conversation_id).maybeSingle();
          if (convError || !convData) return;
          const isParticipant = (convData.buyer_id === currentUser?.id) || (convData.seller_id === currentUser?.id);
          if (!isParticipant) return;

          // fetch full message with sender info
          const { data: fullMsg, error: msgErr } = await supabase.from('messages').select('*, sender:users(id,username)').eq('id', newMsg.id).maybeSingle();
          const messageToHandle = fullMsg || Object.assign({}, newMsg, { sender: { id: newMsg.sender_id, username: newMsg.sender_id === currentUser?.id ? 'You' : 'User' } });

          if (activeConversation && messageToHandle.conversation_id === activeConversation.id) {
            appendMessage(messageToHandle);
          } else {
            // refresh conversations list to show unread preview
            await loadConversations();
          }
        } catch (e) { console.warn('Error handling incoming message', e); }
      })
      .subscribe();
  } catch (e) { console.warn('Failed to subscribe to global messages', e); }
}


// ============================
// Query Parameters Handler - Start chat with specific user
// ============================
async function handleQueryParams() {
  const urlParams = new URLSearchParams(window.location.search);
  // Support both 'seller' and 'user' URL params for compatibility
  const sellerParam = urlParams.get('seller') || urlParams.get('user');
  const productId = urlParams.get('product') || null;
  
  if (sellerParam && currentUser) {
    try {
      let recipientId = sellerParam;
      
      // Check if param looks like a UUID or a username
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUuid = uuidRegex.test(sellerParam);
      
      // If it looks like a username (not a UUID), look up the user
      if (!isUuid) {
        const { data: userRow, error } = await supabase
          .from('users')
          .select('id,username')
          .ilike('username', sellerParam)
          .maybeSingle();
        
        if (error) throw error;
        if (userRow) {
          recipientId = userRow.id;
        } else {
          console.warn('User not found with username:', sellerParam);
          await showInfoModal('User not found. They may have changed their username.', 'User Not Found');
          return;
        }
      }
      
      // Prevent chatting with yourself
      if (recipientId === currentUser.id) {
        console.warn('Cannot chat with yourself');
        return;
      }
      
      // Get or create conversation and auto-open it
      const conv = await getOrCreateConversation(productId, currentUser.id, recipientId);
      if (conv) {
        await loadConversations();
        // Highlight the correct item in the sidebar
        const items = chatList.querySelectorAll('.chat-list-item');
        items.forEach(el => {
          el.classList.toggle('active', el.dataset.convId === conv.id);
        });
        await openConversation(conv);
        // Clear URL params after opening chat
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (err) {
      console.error('Error handling query params:', err);
      await showInfoModal('Could not start chat. Please try again.', 'Error');
    }
  }
}

// ============================
// '+' new chat button - Updated to use username
// ============================
const newChatBtn = document.querySelector('.chat-list-header .btn-icon-small');
if (newChatBtn && !newChatBtn._hasHandler) {
  newChatBtn.addEventListener('click', async () => {
    if (!currentUser) { await showInfoModal('Please log in first', 'Authentication Required'); return; }
    
    // Ask for username instead of email
    const username = await showPromptModal('Enter recipient username to start chat:', { title: 'New Chat', placeholder: 'Username' });
    if (!username) return;
    
    try {
      // Look up user by username (case-insensitive)
      const { data: userRow, error } = await supabase
        .from('users')
        .select('id,username,email')
        .ilike('username', username)
        .maybeSingle();
      
      if (error) throw error;
      if (!userRow) { await showInfoModal('User "' + username + '" not found. Please check the username and try again.', 'User Not Found'); return; }
      
      const recipientId = userRow.id;
      const conv = await getOrCreateConversation(null, currentUser.id, recipientId);
      if (conv) {
        await loadConversations();
        // Highlight the correct item in the sidebar
        const items = chatList.querySelectorAll('.chat-list-item');
        items.forEach(el => {
          el.classList.toggle('active', el.dataset.convId === conv.id);
        });
        await openConversation(conv);
      }
    } catch (err) {
      console.error('Failed to create/open chat', err);
      await showInfoModal('Failed to start chat: ' + (err.message || err), 'Error');
    }
  });
  newChatBtn._hasHandler = true;
}

// ============================
// Initialize Chat
// ============================
async function initializeChat() {
  await loadUser();
  // Handle query parameters after chat is initialized
  await handleQueryParams();
}

// Initialize chat after auth check
checkAuth().then(isAuthenticated => {
  if (!isAuthenticated) return;
  initializeChat();
});
