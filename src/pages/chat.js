import { supabase, getOrCreateConversation, uploadImage } from '../supabase.js';
import { i18n } from '../i18n.js';
import { showConfirmModal, showInfoModal } from '../ui/modal.js';

const t = (key) => i18n.t(key);
const SUPPORT_THREAD_KEY = 'support-thread';
const PIN_STORAGE_PREFIX = 'vendly_pinned_chats_';

const langSelect = document.getElementById('langSelect');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const balanceBadge = document.getElementById('balanceBadge');
const chatList = document.getElementById('chatList');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const supportShortcutBtn = document.getElementById('supportShortcutBtn');
const pinConversationBtn = document.getElementById('pinConversationBtn');
const reportConversationBtn = document.getElementById('reportConversationBtn');
const chatAttachBtn = document.getElementById('chatAttachBtn');
const chatAttachmentInput = document.getElementById('chatAttachmentInput');
const chatAttachmentPreview = document.getElementById('chatAttachmentPreview');

let currentUser = null;
let currentUserProfile = null;
let activeThread = null;
let threadSubscription = null;
let globalMessageSub = null;
let globalSupportSub = null;
let knownMessageIds = new Set();
let selectedAttachment = null;
let supportThreadSummary = null;
let cachedConversations = [];

async function fetchAdminSupportUser() {
  try {
    const byRole = await supabase
      .from('users')
      .select('id, username')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();
    if (byRole?.data?.id) return byRole.data;

    const byEmail = await supabase
      .from('users')
      .select('id, username')
      .ilike('email', '%admin%')
      .limit(1)
      .maybeSingle();
    return byEmail?.data || null;
  } catch (error) {
    console.warn('Admin support user lookup failed', error?.message || error);
    return null;
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getPinnedChatIds() {
  if (!currentUser) return new Set([SUPPORT_THREAD_KEY]);
  try {
    const raw = JSON.parse(localStorage.getItem(`${PIN_STORAGE_PREFIX}${currentUser.id}`) || '[]');
    const ids = new Set(Array.isArray(raw) ? raw : []);
    ids.add(SUPPORT_THREAD_KEY);
    return ids;
  } catch (error) {
    return new Set([SUPPORT_THREAD_KEY]);
  }
}

function savePinnedChatIds(ids) {
  if (!currentUser) return;
  const values = [...ids].filter(Boolean);
  if (!values.includes(SUPPORT_THREAD_KEY)) values.unshift(SUPPORT_THREAD_KEY);
  localStorage.setItem(`${PIN_STORAGE_PREFIX}${currentUser.id}`, JSON.stringify(values));
}

function setSelectedAttachment(file) {
  selectedAttachment = file || null;
  if (!chatAttachmentPreview) return;

  if (!selectedAttachment) {
    chatAttachmentPreview.style.display = 'none';
    chatAttachmentPreview.innerHTML = '';
    if (chatAttachmentInput) chatAttachmentInput.value = '';
    return;
  }

  chatAttachmentPreview.style.display = 'block';
  chatAttachmentPreview.innerHTML = `
    <div class="chat-attachment-pill">
      <span>Attachment: ${escapeHtml(selectedAttachment.name)}</span>
      <button type="button" id="clearChatAttachmentBtn">x</button>
    </div>
  `;

  document.getElementById('clearChatAttachmentBtn')?.addEventListener('click', () => {
    setSelectedAttachment(null);
  });
}

function setActiveSidebarItem(threadKey) {
  chatList.querySelectorAll('.chat-list-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.threadKey === threadKey);
  });
}

function getThreadKey(thread) {
  if (!thread) return '';
  if (thread.kind === 'support') return SUPPORT_THREAD_KEY;
  return thread.id;
}

function isSupportThread(thread) {
  return thread?.kind === 'support';
}

function getOtherParticipant(conv) {
  return conv.buyer?.id === currentUser?.id ? conv.seller : conv.buyer;
}

function formatMessageTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString();
}

function renderAttachmentContent(message) {
  if (!message?.attachment_url) return '';
  const attachmentName = escapeHtml(message.attachment_name || 'Attachment');
  const attachmentUrl = escapeHtml(message.attachment_url);
  const attachmentType = String(message.attachment_type || '');

  if (attachmentType.startsWith('image/')) {
    return `
      <div class="message-attachment">
        <img src="${attachmentUrl}" alt="${attachmentName}">
        <a href="${attachmentUrl}" target="_blank" rel="noopener noreferrer">${attachmentName}</a>
      </div>
    `;
  }

  return `
    <div class="message-attachment">
      <a href="${attachmentUrl}" target="_blank" rel="noopener noreferrer">${attachmentName}</a>
    </div>
  `;
}

async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const redirectUrl = window.location.href;
    window.location.href = `login.html?redirect=${encodeURIComponent(redirectUrl)}&reason=chat`;
    return false;
  }
  return user;
}

langSelect?.addEventListener('change', (e) => i18n.setLang(e.target.value));

if (loginBtn && !loginBtn._hasHandler) {
  loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'login.html';
  });
  loginBtn._hasHandler = true;
}

if (logoutBtn && !logoutBtn._hasHandler) {
  logoutBtn.addEventListener('click', async (e) => {
    e?.preventDefault();
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Sign out failed', error);
    }
    window.location.href = 'index.html';
  });
  logoutBtn._hasHandler = true;
}

(function setupDropdown() {
  const dropdownBtnLocal = document.querySelector('.dropdown-btn');
  if (!dropdownBtnLocal) return;
  dropdownBtnLocal.addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = e.target.closest('.dropdown');
    if (dropdown) dropdown.classList.toggle('open');
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown.open').forEach((dropdown) => dropdown.classList.remove('open'));
  });
})();

async function loadUser() {
  const { data: { user } } = await supabase.auth.getUser();
  currentUser = user;

  if (!user) {
    loginBtn.style.display = 'flex';
    logoutBtn.style.display = 'none';
    return;
  }

  loginBtn.style.display = 'none';
  logoutBtn.style.display = 'flex';

  try {
    const { data } = await supabase
      .from('users')
      .select('id, username, balance, role')
      .eq('id', user.id)
      .maybeSingle();

    currentUserProfile = data || null;
    if (data?.balance !== undefined) {
      balanceBadge.querySelector('span').innerText = `€${parseFloat(data.balance || 0).toFixed(2)}`;
      balanceBadge.style.display = 'flex';
    }
  } catch (error) {
    console.warn('Could not load chat user profile', error);
  }

  await loadConversations();

  if (window.innerWidth <= 768) {
    document.querySelector('.chat-sidebar')?.classList.add('mobile-visible');
  }
}

async function fetchSupportTicketSummary() {
  if (!currentUser) return null;

  try {
    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(25);

    if (error) throw error;

    const items = tickets || [];
    const primaryTicket = items.find((ticket) => !['resolved', 'done', 'closed'].includes(String(ticket.status || '').toLowerCase()))
      || items[0]
      || null;

    if (!primaryTicket) {
      return {
        ticket: null,
        session: null,
        assignedAdmin: null,
        unread: 0
      };
    }

    const [{ data: session }, assignedAdminResult] = await Promise.all([
      supabase.from('chat_sessions').select('*').eq('ticket_id', primaryTicket.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      primaryTicket.assigned_admin_id
        ? supabase.from('users').select('id, username').eq('id', primaryTicket.assigned_admin_id).maybeSingle()
        : Promise.resolve({ data: null })
    ]);

    return {
      ticket: primaryTicket,
      session: session || null,
      assignedAdmin: assignedAdminResult?.data || null,
      unread: 0
    };
  } catch (error) {
    console.warn('Support summary unavailable', error?.message || error);
    const fallbackAdmin = await fetchAdminSupportUser();
    return {
      ticket: null,
      session: null,
      assignedAdmin: null,
      fallbackAdmin,
      unavailable: true,
      unread: 0
    };
  }
}

function buildSupportListItem(summary) {
  const status = summary?.ticket?.status || 'Not taken';
  const assignedLabel = summary?.assignedAdmin?.username
    ? `Assigned to ${summary.assignedAdmin.username}`
    : (summary?.fallbackAdmin?.username ? `Admin support: ${summary.fallbackAdmin.username}` : (summary?.unavailable ? 'Support setup required' : status));
  const lastText = summary?.ticket?.description
    ? String(summary.ticket.description).slice(0, 80)
    : 'Open a case with support';

  return {
    id: SUPPORT_THREAD_KEY,
    kind: 'support',
    title: 'Support',
    last_message_at: summary?.session?.last_message_at || summary?.ticket?.created_at || null,
    status,
    assignedLabel,
    lastText
  };
}

async function fetchStandardConversations() {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, product:products(id,name), buyer:users!buyer_id(id,username), seller:users!seller_id(id,username)')
    .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`)
    .order('last_message_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function loadConversations() {
  if (!currentUser) return;

  try {
    const [convs, supportSummary] = await Promise.all([
      fetchStandardConversations(),
      fetchSupportTicketSummary()
    ]);

    cachedConversations = convs;
    supportThreadSummary = supportSummary;
    renderConversations(convs, supportSummary);
    await ensureGlobalMessageListener();
    await ensureGlobalSupportListener();
  } catch (error) {
    console.error('Failed to load conversations', error);
    chatList.innerHTML = `<div style="padding:1rem;color:var(--muted)">${escapeHtml(t('chat_failed_load_conversations'))}</div>`;
  }
}

function renderConversations(convs, supportSummary) {
  chatList.innerHTML = '';

  const pinnedIds = getPinnedChatIds();
  const supportItem = buildSupportListItem(supportSummary);
  const items = [
    supportItem,
    ...(convs || [])
  ].sort((a, b) => {
    const aPinned = pinnedIds.has(a.id);
    const bPinned = pinnedIds.has(b.id);
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    const aTime = new Date(a.last_message_at || 0).getTime();
    const bTime = new Date(b.last_message_at || 0).getTime();
    return bTime - aTime;
  });

  if (items.length === 1 && !convs.length) {
    chatList.innerHTML = '';
  }

  items.forEach((entry) => {
    const isSupport = entry.kind === 'support';
    const other = isSupport ? null : getOtherParticipant(entry);
    const title = isSupport ? entry.title : (other?.username || t('unknown'));
    const subtitle = isSupport
      ? entry.assignedLabel
      : (entry.last_message || (entry.product?.name ? `${t('chat_regarding')} ${entry.product.name}` : t('chat_new_conversation')));
    const lastMsgTime = entry.last_message_at ? new Date(entry.last_message_at).toLocaleString() : '';
    const isPinned = pinnedIds.has(entry.id);

    const item = document.createElement('div');
    item.className = `chat-list-item${isSupport ? ' support-item' : ''}${isPinned ? ' pinned-item' : ''}`;
    item.dataset.threadKey = isSupport ? SUPPORT_THREAD_KEY : entry.id;
    item.innerHTML = `
      <div class="chat-avatar avatar-circle-small">${escapeHtml((title || 'S').charAt(0).toUpperCase())}</div>
      <div class="chat-preview">
        <div class="chat-name">${escapeHtml(title)}</div>
        <div class="chat-last-message">${escapeHtml(isSupport ? entry.lastText : subtitle)} <span class="chat-time">${escapeHtml(lastMsgTime)}</span></div>
        ${isSupport ? `<div class="chat-time">${escapeHtml(entry.status || '')}</div>` : ''}
      </div>
      <button class="chat-pin-btn ${isPinned ? 'active' : ''}" type="button" title="Pin conversation">${isPinned ? '★' : '☆'}</button>
      ${isSupport ? '' : `<button class="chat-delete-btn" title="${escapeHtml(t('chat_remove_conversation'))}" aria-label="${escapeHtml(t('chat_remove_conversation'))}">&times;</button>`}
    `;

    item.addEventListener('click', (e) => {
      if (e.target.closest('.chat-delete-btn') || e.target.closest('.chat-pin-btn')) return;
      setActiveSidebarItem(item.dataset.threadKey);
      if (isSupport) {
        openSupportThread();
      } else {
        openConversation(entry);
      }
    });

    item.querySelector('.chat-pin-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePinnedThread(entry.id);
    });

    item.querySelector('.chat-delete-btn')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const confirmed = await showConfirmModal({
        title: t('chat_remove_conversation'),
        message: `${t('chat_remove_conversation_confirm')} ${other?.username || t('chat_this_user')}?`,
        okText: t('delete'),
        cancelText: t('cancel')
      });
      if (confirmed) {
        await deleteConversation(entry.id);
      }
    });

    chatList.appendChild(item);
  });

  if (activeThread) {
    setActiveSidebarItem(getThreadKey(activeThread));
  }
}

function togglePinnedThread(threadId) {
  const pinned = getPinnedChatIds();
  if (threadId === SUPPORT_THREAD_KEY) return;

  if (pinned.has(threadId)) pinned.delete(threadId);
  else pinned.add(threadId);

  savePinnedChatIds(pinned);
  renderConversations(cachedConversations, supportThreadSummary);
  updateHeaderActions();
}

async function deleteConversation(convId) {
  try {
    const { error: msgErr } = await supabase.from('messages').delete().eq('conversation_id', convId);
    if (msgErr) throw msgErr;

    const { error: convErr } = await supabase.from('conversations').delete().eq('id', convId);
    if (convErr) throw convErr;

    if (activeThread?.kind === 'conversation' && activeThread.id === convId) {
      activeThread = null;
      knownMessageIds.clear();
      chatMessages.innerHTML = `<div style="padding:1rem;color:var(--muted)">${escapeHtml(t('chat_select_to_start'))}</div>`;
      document.getElementById('activeUserAvatar').innerText = '';
      document.getElementById('activeUserName').innerText = '';
      document.getElementById('activeUserStatus').innerText = '';
    }

    await loadConversations();
  } catch (error) {
    console.error('Failed to delete conversation', error);
    await showInfoModal(`${t('chat_remove_conversation')} - ${t('admin_error')}: ${error.message || error}`, t('admin_error'));
  }
}

function updateHeaderActions() {
  const isSupport = isSupportThread(activeThread);
  const threadKey = getThreadKey(activeThread);
  const pinned = getPinnedChatIds().has(threadKey);

  if (pinConversationBtn) {
    pinConversationBtn.style.visibility = activeThread ? 'visible' : 'hidden';
    pinConversationBtn.textContent = pinned ? '★' : '📌';
    pinConversationBtn.disabled = isSupport;
    pinConversationBtn.title = isSupport ? 'Support stays pinned' : (pinned ? 'Unpin chat' : 'Pin chat');
  }

  if (reportConversationBtn) {
    reportConversationBtn.style.visibility = activeThread ? 'visible' : 'hidden';
    reportConversationBtn.title = isSupport ? 'Refresh support' : 'Report this chat to support';
  }
}

async function closeThreadSubscription() {
  if (!threadSubscription) return;
  try {
    await supabase.removeChannel(threadSubscription);
  } catch (error) {
    console.warn('Could not remove thread subscription', error);
  }
  threadSubscription = null;
}

async function openConversation(conv) {
  await closeThreadSubscription();
  activeThread = { kind: 'conversation', id: conv.id, conversation: conv };
  updateHeaderActions();
  knownMessageIds.clear();

  if (window.innerWidth <= 768) {
    document.querySelector('.chat-sidebar')?.classList.remove('mobile-visible');
    const backBtn = document.getElementById('chatBackBtn');
    if (backBtn) backBtn.style.display = '';
  }

  const other = getOtherParticipant(conv);
  document.getElementById('activeUserAvatar').innerText = (other?.username || 'U').charAt(0).toUpperCase();
  document.getElementById('activeUserName').innerText = other?.username || t('unknown');
  document.getElementById('activeUserStatus').innerText = conv.product?.name ? `${t('chat_regarding')} ${conv.product.name}` : 'Direct message';
  chatMessages.innerHTML = `<div style="padding:1rem;color:var(--muted)">${escapeHtml(t('loading'))}</div>`;

  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:users(id,username)')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    renderMessages(messages || []);
    threadSubscription = supabase.channel(`conversation-${conv.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conv.id}` }, async (payload) => {
        const newMsg = payload.new;
        const { data: fullMsg } = await supabase
          .from('messages')
          .select('*, sender:users(id,username)')
          .eq('id', newMsg.id)
          .maybeSingle();
        appendMessage(fullMsg || newMsg);
      })
      .subscribe();
  } catch (error) {
    console.error('Failed to load messages', error);
    chatMessages.innerHTML = `<div style="padding:1rem;color:crimson">${escapeHtml(t('chat_failed_load_messages'))}</div>`;
  }
}

function renderSupportWelcome(summary) {
  const assigned = summary?.assignedAdmin?.username ? `Assigned to ${summary.assignedAdmin.username}` : 'No admin has taken this case yet.';
  const ticketStatus = summary?.ticket?.status ? `Status: ${summary.ticket.status}` : 'Start a support thread here.';

  chatMessages.innerHTML = `
    <div class="admin-card" style="max-width:640px;margin:auto;">
      <h3 style="margin-top:0;">Support</h3>
      <p style="color:var(--muted);">${escapeHtml(ticketStatus)}</p>
      <p style="color:var(--muted);">${escapeHtml(assigned)}</p>
      <p>Send a message below and we will open or continue your support case.</p>
    </div>
  `;
}

async function openSupportThread() {
  await closeThreadSubscription();

  if (supportThreadSummary?.unavailable && supportThreadSummary?.fallbackAdmin?.id && currentUser) {
    try {
      const conv = await getOrCreateConversation(null, currentUser.id, supportThreadSummary.fallbackAdmin.id);
      if (conv) {
        activeThread = { kind: 'conversation', id: conv.id, conversation: conv };
        await openConversation(conv);
        return;
      }
    } catch (error) {
      console.warn('Could not open fallback admin support conversation', error?.message || error);
    }
  }

  activeThread = { kind: 'support', id: SUPPORT_THREAD_KEY, summary: supportThreadSummary };
  updateHeaderActions();
  knownMessageIds.clear();

  if (window.innerWidth <= 768) {
    document.querySelector('.chat-sidebar')?.classList.remove('mobile-visible');
    const backBtn = document.getElementById('chatBackBtn');
    if (backBtn) backBtn.style.display = '';
  }

  document.getElementById('activeUserAvatar').innerText = 'S';
  document.getElementById('activeUserName').innerText = 'Support';
  document.getElementById('activeUserStatus').innerText = supportThreadSummary?.assignedAdmin?.username
    ? `In progress with ${supportThreadSummary.assignedAdmin.username}`
    : (supportThreadSummary?.ticket?.status || 'Not taken');

  if (!supportThreadSummary || supportThreadSummary.unavailable) {
    chatMessages.innerHTML = `
      <div class="admin-card" style="max-width:640px;margin:auto;">
        <h3 style="margin-top:0;">Support setup required</h3>
        <p style="color:var(--muted);">Run the SQL file added with this change before using support chat.</p>
      </div>
    `;
    return;
  }

  if (!supportThreadSummary.session?.id) {
    renderSupportWelcome(supportThreadSummary);
    return;
  }

  chatMessages.innerHTML = `<div style="padding:1rem;color:var(--muted)">${escapeHtml(t('loading'))}</div>`;

  try {
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*, sender:users(id,username)')
      .eq('session_id', supportThreadSummary.session.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    renderMessages(messages || []);
    threadSubscription = supabase.channel(`support-session-${supportThreadSummary.session.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${supportThreadSummary.session.id}` }, async (payload) => {
        const newMsg = payload.new;
        const { data: fullMsg } = await supabase
          .from('chat_messages')
          .select('*, sender:users(id,username)')
          .eq('id', newMsg.id)
          .maybeSingle();
        appendMessage(fullMsg || newMsg);
      })
      .subscribe();
  } catch (error) {
    console.error('Failed to load support messages', error);
    renderSupportWelcome(supportThreadSummary);
  }
}

function renderMessages(messages) {
  chatMessages.innerHTML = '';
  if (!messages || messages.length === 0) {
    chatMessages.innerHTML = `<div style="padding:1rem;color:var(--muted)">${escapeHtml(t('chat_no_messages'))}</div>`;
    return;
  }
  messages.forEach((message) => appendMessage(message));
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendMessage(message) {
  if (message?.id && knownMessageIds.has(message.id)) return;
  if (message?.id) knownMessageIds.add(message.id);

  const isSender = message.sender?.id === currentUser?.id || message.sender_id === currentUser?.id;
  const senderName = message.sender?.username || (isSender ? t('chat_you') : t('user'));
  const canReport = activeThread?.kind === 'conversation' && !isSender;

  const msgDiv = document.createElement('div');
  msgDiv.className = `message-group ${isSender ? 'sender' : 'receiver'}`;
  msgDiv.innerHTML = `
    <div class="message-avatar avatar-circle">${escapeHtml((senderName || 'U').charAt(0).toUpperCase())}</div>
    <div class="messages-stack">
      <div class="message-card">
        <div class="message-bubble-modern ${isSender ? 'sender' : ''}">
          ${message.content ? `<div>${escapeHtml(message.content)}</div>` : ''}
          ${renderAttachmentContent(message)}
        </div>
        <div class="message-actions">
          ${canReport ? `<button class="message-action-btn" type="button" data-action="report-message" data-id="${escapeHtml(message.id || '')}">Report</button>` : ''}
        </div>
      </div>
      <div class="message-timestamp ${isSender ? 'sender' : ''}">${escapeHtml(formatMessageTime(message.created_at))}</div>
    </div>
  `;

  msgDiv.querySelector('[data-action="report-message"]')?.addEventListener('click', async () => {
    await reportMessageToSupport(message);
  });

  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function updateConversationPreview(conversationId, previewText) {
  await supabase
    .from('conversations')
    .update({
      last_message: previewText,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationId);
}

async function uploadSelectedAttachment() {
  if (!selectedAttachment) return null;
  const publicUrl = await uploadImage(selectedAttachment, currentUser.id, 'chat');
  return {
    attachment_url: publicUrl,
    attachment_name: selectedAttachment.name,
    attachment_type: selectedAttachment.type || 'application/octet-stream'
  };
}

function buildAttachmentMessageText(text, attachment) {
  if (text) return text;
  return attachment?.attachment_name ? `Shared: ${attachment.attachment_name}` : '';
}

async function insertRowWithOptionalAttachment(table, payload, attachment) {
  const fullPayload = {
    ...payload,
    ...(attachment || {})
  };

  let query = supabase.from(table).insert(fullPayload).select('*, sender:users(id,username)').single();
  let { data, error } = await query;

  if (error && attachment) {
    const fallbackPayload = { ...payload };
    const fallbackRes = await supabase.from(table).insert(fallbackPayload).select('*, sender:users(id,username)').single();
    data = fallbackRes.data;
    error = fallbackRes.error;
    if (!error) {
      throw new Error('Attachment columns are missing. Run the Supabase SQL file for chat attachments first.');
    }
  }

  if (error) throw error;
  return data;
}

async function ensureSupportTicketAndSession(seedMessage = '') {
  let summary = supportThreadSummary;

  if (!summary?.ticket) {
    const timestamp = new Date().toISOString();
    const primaryDescription = seedMessage || 'General support request';

    const initialPayload = {
      user_id: currentUser.id,
      issue_type: 'general_support',
      title: 'Chat support request',
      description: primaryDescription,
      priority: 'normal',
      status: 'not_taken',
      created_at: timestamp,
      updated_at: timestamp
    };

    let { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert(initialPayload)
      .select('*')
      .single();

    if (error) {
      const fallback = await supabase
        .from('support_tickets')
        .insert({
          user_id: currentUser.id,
          issue_type: 'general_support',
          description: primaryDescription,
          status: 'open',
          created_at: timestamp
        })
        .select('*')
        .single();
      ticket = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;
    summary = { ticket, session: null, assignedAdmin: null };
  }

  if (!summary.session?.id) {
    const sessionPayload = {
      ticket_id: summary.ticket.id,
      user_id: currentUser.id,
      status: 'active',
      session_type: 'support',
      title: 'Support'
    };

    let { data: session, error } = await supabase
      .from('chat_sessions')
      .insert(sessionPayload)
      .select('*')
      .single();

    if (error) {
      const fallback = await supabase
        .from('chat_sessions')
        .insert({
          ticket_id: summary.ticket.id,
          user_id: currentUser.id,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();
      session = fallback.data;
      error = fallback.error;
    }

    if (error) {
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('ticket_id', summary.ticket.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!existingSession) throw error;
      summary.session = existingSession;
    } else {
      summary.session = session;
    }
  }

  supportThreadSummary = summary;
  return summary;
}

async function sendConversationMessage() {
  const text = messageInput.value.trim();
  if (!text && !selectedAttachment) return;
  if (!activeThread?.conversation) return;

  const attachment = await uploadSelectedAttachment();
  const messagePayload = {
    conversation_id: activeThread.conversation.id,
    sender_id: currentUser.id,
    content: buildAttachmentMessageText(text, attachment),
    message_type: attachment ? 'attachment' : 'text',
    is_read: false,
    created_at: new Date().toISOString()
  };

  const inserted = await insertRowWithOptionalAttachment('messages', messagePayload, attachment);
  messageInput.value = '';
  setSelectedAttachment(null);
  appendMessage(inserted);
  await updateConversationPreview(activeThread.conversation.id, buildAttachmentMessageText(text, attachment));
  await loadConversations();
}

async function sendSupportMessage() {
  const text = messageInput.value.trim();
  if (!text && !selectedAttachment) return;

  const attachment = await uploadSelectedAttachment();
  const summary = await ensureSupportTicketAndSession(buildAttachmentMessageText(text, attachment));
  const payload = {
    session_id: summary.session.id,
    sender_id: currentUser.id,
    content: buildAttachmentMessageText(text, attachment),
    message_type: attachment ? 'attachment' : 'text',
    is_read: false,
    created_at: new Date().toISOString()
  };

  const inserted = await insertRowWithOptionalAttachment('chat_messages', payload, attachment);

  await supabase
    .from('chat_sessions')
    .update({
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', summary.session.id);

  messageInput.value = '';
  setSelectedAttachment(null);
  appendMessage(inserted);
  await loadConversations();
  if (activeThread?.kind === 'support') {
    activeThread.summary = supportThreadSummary;
  }
}

sendBtn?.addEventListener('click', async () => {
  try {
    if (!activeThread) return;
    if (activeThread.kind === 'support') await sendSupportMessage();
    else await sendConversationMessage();
  } catch (error) {
    console.error('Failed to send chat message', error);
    await showInfoModal(`${t('chat_failed_send_message')}: ${error.message || error}`, t('admin_error'));
  }
});

messageInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendBtn?.click();
  }
});

chatAttachBtn?.addEventListener('click', () => {
  chatAttachmentInput?.click();
});

chatAttachmentInput?.addEventListener('change', (e) => {
  const file = e.target.files?.[0] || null;
  setSelectedAttachment(file);
});

pinConversationBtn?.addEventListener('click', () => {
  if (!activeThread || isSupportThread(activeThread)) return;
  togglePinnedThread(activeThread.id);
});

reportConversationBtn?.addEventListener('click', async () => {
  if (!activeThread) return;

  if (isSupportThread(activeThread)) {
    supportThreadSummary = await fetchSupportTicketSummary();
    await openSupportThread();
    return;
  }

  const other = getOtherParticipant(activeThread.conversation);
  const confirmed = await showConfirmModal({
    title: 'Report this conversation',
    message: `Create a support case for your chat with ${other?.username || 'this user'}?`,
    okText: 'Report',
    cancelText: 'Cancel'
  });

  if (!confirmed) return;

  await reportConversationToSupport(activeThread.conversation);
});

supportShortcutBtn?.addEventListener('click', async () => {
  setActiveSidebarItem(SUPPORT_THREAD_KEY);
  await openSupportThread();
});

async function reportConversationToSupport(conversation) {
  const other = getOtherParticipant(conversation);
  const summary = await ensureSupportTicketAndSession(`Conversation report for ${other?.username || 'user'}`);
  const reportText = `Conversation reported.\nConversation ID: ${conversation.id}\nOther user: ${other?.username || 'Unknown'}\nProduct: ${conversation.product?.name || 'None'}`;

  await insertRowWithOptionalAttachment('chat_messages', {
    session_id: summary.session.id,
    sender_id: currentUser.id,
    content: reportText,
    message_type: 'report',
    is_read: false,
    created_at: new Date().toISOString()
  });

  await loadConversations();
  setActiveSidebarItem(SUPPORT_THREAD_KEY);
  await openSupportThread();
  await showInfoModal('The conversation was forwarded to support.', 'Support');
}

async function reportMessageToSupport(message) {
  const confirmed = await showConfirmModal({
    title: 'Report message',
    message: 'Send this message to support for review?',
    okText: 'Report',
    cancelText: 'Cancel'
  });

  if (!confirmed) return;

  const summary = await ensureSupportTicketAndSession(`Reported message: ${String(message.content || '').slice(0, 200)}`);
  const reportText = `Reported message\nMessage ID: ${message.id || 'unknown'}\nSender: ${message.sender?.username || message.sender_id || 'Unknown'}\nDate: ${formatMessageTime(message.created_at)}\n\n${message.content || '[Attachment only message]'}`;

  await insertRowWithOptionalAttachment('chat_messages', {
    session_id: summary.session.id,
    sender_id: currentUser.id,
    content: reportText,
    message_type: 'report',
    is_read: false,
    created_at: new Date().toISOString()
  });

  await loadConversations();
  await showInfoModal('The message was reported to support.', 'Support');
}

async function ensureGlobalMessageListener() {
  if (globalMessageSub || !currentUser) return;

  globalMessageSub = supabase.channel('global-messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
      const newMsg = payload.new;
      const { data: convData } = await supabase
        .from('conversations')
        .select('id,buyer_id,seller_id')
        .eq('id', newMsg.conversation_id)
        .maybeSingle();

      if (!convData) return;
      const isParticipant = convData.buyer_id === currentUser.id || convData.seller_id === currentUser.id;
      if (!isParticipant) return;

      const { data: fullMsg } = await supabase
        .from('messages')
        .select('*, sender:users(id,username)')
        .eq('id', newMsg.id)
        .maybeSingle();

      if (activeThread?.kind === 'conversation' && activeThread.id === newMsg.conversation_id) {
        appendMessage(fullMsg || newMsg);
      } else {
        await loadConversations();
      }
    })
    .subscribe();
}

async function ensureGlobalSupportListener() {
  if (globalSupportSub || !currentUser) return;

  globalSupportSub = supabase.channel('global-support-messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async (payload) => {
      const newMsg = payload.new;
      const { data: session } = await supabase
        .from('chat_sessions')
        .select('id, user_id, ticket_id')
        .eq('id', newMsg.session_id)
        .maybeSingle();

      if (!session || session.user_id !== currentUser.id) return;

      const { data: fullMsg } = await supabase
        .from('chat_messages')
        .select('*, sender:users(id,username)')
        .eq('id', newMsg.id)
        .maybeSingle();

      supportThreadSummary = await fetchSupportTicketSummary();

      if (activeThread?.kind === 'support' && supportThreadSummary?.session?.id === newMsg.session_id) {
        appendMessage(fullMsg || newMsg);
      } else {
        await loadConversations();
      }
    })
    .subscribe();
}

async function handleQueryParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const sellerParam = urlParams.get('seller') || urlParams.get('user');
  const productId = urlParams.get('product') || null;
  const openSupport = urlParams.get('support');

  if (openSupport === '1' && currentUser) {
    setActiveSidebarItem(SUPPORT_THREAD_KEY);
    await openSupportThread();
    window.history.replaceState(null, '', window.location.pathname);
    return;
  }

  if (sellerParam && currentUser) {
    try {
      let recipientId = sellerParam;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUuid = uuidRegex.test(sellerParam);

      if (!isUuid) {
        const { data: userRow, error } = await supabase
          .from('users')
          .select('id,username')
          .ilike('username', sellerParam)
          .maybeSingle();

        if (error) throw error;
        if (!userRow) {
          await showInfoModal(t('chat_user_not_found_hint'), t('chat_user_not_found'));
          return;
        }

        recipientId = userRow.id;
      }

      if (recipientId === currentUser.id) return;

      const conv = await getOrCreateConversation(productId, currentUser.id, recipientId);
      if (conv) {
        await loadConversations();
        setActiveSidebarItem(conv.id);
        await openConversation(conv);
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (error) {
      console.error('Error handling query params:', error);
      await showInfoModal(t('chat_could_not_start'), t('admin_error'));
    }
  }
}

let newChatDialog = null;

function removeNewChatDialog() {
  if (newChatDialog) {
    newChatDialog.remove();
    newChatDialog = null;
  }
}

async function fetchUserSuggestions(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim();

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username')
      .neq('id', currentUser.id)
      .ilike('username', `${q}%`)
      .limit(8);

    if (error) throw error;
    if (data?.length) return data;

    const fallback = await supabase
      .from('users')
      .select('id, username')
      .neq('id', currentUser.id)
      .ilike('username', `%${q}%`)
      .limit(8);

    return fallback.data || [];
  } catch (error) {
    console.warn('Suggestion query failed:', error?.message || error);
    return [];
  }
}

async function openNewChatDialog() {
  removeNewChatDialog();

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.55);z-index:3000;display:flex;align-items:center;justify-content:center;padding:1rem;';
  overlay.innerHTML = `
    <div style="width:min(560px,100%);background:var(--card-bg);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-lg);padding:1rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:.75rem;margin-bottom:.75rem;">
        <h3 style="margin:0;color:var(--fg);font-size:1.1rem;">${escapeHtml(t('chat_new_chat'))}</h3>
        <button type="button" id="newChatClose" class="icon-btn" style="width:36px;height:36px;">×</button>
      </div>
      <label style="display:block;margin-bottom:.5rem;color:var(--muted);font-size:.9rem;">${escapeHtml(t('chat_enter_username_start'))}</label>
      <input id="newChatUsernameInput" class="chat-input-field" style="width:100%;" placeholder="${escapeHtml(t('username'))}">
      <div id="newChatSuggest" style="margin-top:.6rem;max-height:220px;overflow:auto;border:1px solid var(--border);border-radius:10px;background:var(--bg);display:none;"></div>
      <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem;">
        <button type="button" id="newChatCancel" class="btn btn-secondary">${escapeHtml(t('cancel'))}</button>
        <button type="button" id="newChatStart" class="btn btn-primary">${escapeHtml(t('chat_start'))}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  newChatDialog = overlay;

  const input = overlay.querySelector('#newChatUsernameInput');
  const suggest = overlay.querySelector('#newChatSuggest');
  let selectedUser = null;
  let debounceTimer = null;

  function closeDialog() {
    removeNewChatDialog();
  }

  function renderSuggestions(users) {
    suggest.innerHTML = '';
    if (!users.length) {
      suggest.style.display = 'none';
      return;
    }

    suggest.style.display = 'block';
    users.forEach((user) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.style.cssText = 'display:flex;width:100%;padding:.65rem .75rem;background:transparent;border:none;border-bottom:1px solid var(--border);color:var(--fg);text-align:left;cursor:pointer;';
      item.innerHTML = `👤 ${escapeHtml(user.username)}`;
      item.addEventListener('click', () => {
        selectedUser = user;
        input.value = user.username;
        suggest.style.display = 'none';
      });
      suggest.appendChild(item);
    });
  }

  async function doStartChat() {
    const username = input.value.trim();
    if (!username) {
      await showInfoModal(t('chat_enter_username_start'), t('chat_new_chat'));
      return;
    }

    try {
      let userRow = selectedUser;
      if (!userRow || userRow.username.toLowerCase() !== username.toLowerCase()) {
        const { data, error } = await supabase
          .from('users')
          .select('id,username')
          .eq('username', username)
          .maybeSingle();

        if (error) throw error;
        userRow = data;
      }

      if (!userRow) {
        await showInfoModal(`${t('chat_user_not_found')}: "${username}"`, t('chat_user_not_found'));
        return;
      }

      const conv = await getOrCreateConversation(null, currentUser.id, userRow.id);
      if (conv) {
        closeDialog();
        await loadConversations();
        setActiveSidebarItem(conv.id);
        await openConversation(conv);
      }
    } catch (error) {
      console.error('Failed to create/open chat', error);
      await showInfoModal(`${t('chat_failed_start')}: ${error.message || error}`, t('admin_error'));
    }
  }

  input.addEventListener('input', () => {
    selectedUser = null;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      renderSuggestions(await fetchUserSuggestions(input.value.trim()));
    }, 150);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doStartChat();
    } else if (e.key === 'Escape') {
      closeDialog();
    }
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDialog();
  });

  overlay.querySelector('#newChatClose')?.addEventListener('click', closeDialog);
  overlay.querySelector('#newChatCancel')?.addEventListener('click', closeDialog);
  overlay.querySelector('#newChatStart')?.addEventListener('click', doStartChat);

  setTimeout(() => input.focus(), 30);
}

const newChatBtn = document.querySelector('.chat-list-header .btn-icon-small');
if (newChatBtn && !newChatBtn._hasHandler) {
  newChatBtn.addEventListener('click', async () => {
    if (!currentUser) {
      await showInfoModal(t('loginFirst'), t('chat_auth_required'));
      return;
    }
    await openNewChatDialog();
  });
  newChatBtn._hasHandler = true;
}

async function initializeChat() {
  await loadUser();
  await handleQueryParams();
  updateHeaderActions();
}

checkAuth().then((isAuthenticated) => {
  if (!isAuthenticated) return;
  initializeChat();
});
