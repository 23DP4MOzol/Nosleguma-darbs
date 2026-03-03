// Shared modal helpers (injects HTML/CSS and exposes showConfirmModal/showInfoModal)
function injectModal() {
  if (document.getElementById('globalConfirmModal')) return;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
  <div id="globalConfirmModal" style="display:none;position:fixed;inset:0;align-items:center;justify-content:center;z-index:9999;">
    <div id="globalConfirmOverlay" style="position:absolute;inset:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(2px);"></div>
    <div id="globalConfirmContent" style="position:relative;z-index:10000;width:520px;max-width:calc(100% - 40px);background:var(--card-bg, #fff);border:1px solid var(--border, #e5e7eb);border-radius:12px;padding:18px;box-shadow:0 12px 40px rgba(2,6,23,0.12);">
      <button id="globalConfirmClose" style="position:absolute;right:10px;top:8px;background:none;border:none;font-size:20px;cursor:pointer;">×</button>
      <h3 id="globalConfirmTitle" style="margin:0 0 6px 0;font-size:1.1rem;color:var(--primary, #2563eb);">Confirm</h3>
      <div id="globalConfirmMessage" style="color:var(--muted, #6b7280);margin-bottom:10px;font-size:0.95rem;white-space:pre-wrap;"></div>
      <input id="globalConfirmInput" type="text" style="display:none;width:100%;padding:10px;border:1px solid var(--border, #e5e7eb);border-radius:8px;margin-top:6px;box-sizing:border-box;" />
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
        <button id="globalConfirmCancel" style="padding:8px 12px;border-radius:8px;border:1px solid var(--border, #e5e7eb);background:var(--secondary, #f3f4f6);cursor:pointer;">Cancel</button>
        <button id="globalConfirmOk" style="padding:8px 12px;border-radius:8px;border:none;background:var(--primary, #2563eb);color:white;cursor:pointer;">Confirm</button>
      </div>
    </div>
  </div>
  `;

  document.body.appendChild(wrapper);

  // inject small style to ensure visibility in dark mode
  const style = document.createElement('style');
  style.textContent = `
    :root { --card-bg: #ffffff; --border: #e5e7eb; --primary: #2563eb; --secondary: #f3f4f6; --muted: #6b7280; }
    @media (prefers-color-scheme: dark) { :root { --card-bg: #0b1220; --border: #1f2937; --primary: #60a5fa; --secondary: #111827; --muted: #9ca3af; } }
  `;
  document.head.appendChild(style);
}

function ensureInjected() {
  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectModal);
  } else {
    injectModal();
  }
}

ensureInjected();

export function showConfirmModal({ title = 'Confirm', message = '', placeholder = '', showInput = false, okText = 'Confirm', cancelText = 'Cancel' } = {}) {
  return new Promise((resolve) => {
    ensureInjected();
    const modal = document.getElementById('globalConfirmModal');
    const overlay = document.getElementById('globalConfirmOverlay');
    const closeBtn = document.getElementById('globalConfirmClose');
    const titleEl = document.getElementById('globalConfirmTitle');
    const msgEl = document.getElementById('globalConfirmMessage');
    const inputEl = document.getElementById('globalConfirmInput');
    const okBtn = document.getElementById('globalConfirmOk');
    const cancelBtn = document.getElementById('globalConfirmCancel');

    titleEl.innerText = title;
    msgEl.innerText = message;
    okBtn.innerText = okText;
    cancelBtn.innerText = cancelText;

    if (showInput) {
      inputEl.style.display = 'block';
      inputEl.placeholder = placeholder || '';
      inputEl.value = '';
      setTimeout(() => inputEl.focus(), 50);
    } else {
      inputEl.style.display = 'none';
    }

    function cleanup() {
      modal.style.display = 'none';
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      closeBtn.removeEventListener('click', onCancel);
      overlay.removeEventListener('click', onCancel);
    }

    function onOk() {
      const value = showInput ? inputEl.value : true;
      cleanup();
      resolve(value);
    }

    function onCancel() {
      cleanup();
      resolve(false);
    }

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    closeBtn.addEventListener('click', onCancel);
    overlay.addEventListener('click', onCancel);

    modal.style.display = 'flex';
  });
}

export function showInfoModal(message = '', title = 'Info') {
  return showConfirmModal({ title, message, showInput: false, okText: 'OK', cancelText: 'Close' });
}
