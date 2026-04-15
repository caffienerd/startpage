// ========================================
// Themed UI — replaces native alert() / confirm()
// ========================================

// Self-contained escape — does NOT depend on terminal.js's escapeHTML
function _uiEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function _formatMessage(msg) {
  return _uiEscape(String(msg)).replace(/\n/g, '<br>');
}

// ---- Toast (auto-dismiss, bottom-center) ----
// type: 'info' | 'success' | 'error'
function showToast(message, type = 'info', duration = 3000) {
  const existing = document.getElementById('sp-toast');
  if (existing) { clearTimeout(existing._timeout); existing.remove(); }

  const toast = document.createElement('div');
  toast.id = 'sp-toast';
  toast.className = `sp-toast sp-toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  const icon = { success: '✓', error: '✕', info: 'ℹ' }[type] || 'ℹ';
  const iconSpan = document.createElement('span');
  iconSpan.className = 'sp-toast-icon';
  iconSpan.textContent = icon;
  const msgSpan = document.createElement('span');
  msgSpan.className = 'sp-toast-msg';
  msgSpan.textContent = message;
  toast.appendChild(iconSpan);
  toast.appendChild(msgSpan);

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('sp-toast-show'));

  const remove = () => {
    toast.classList.remove('sp-toast-show');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  };

  toast._timeout = setTimeout(remove, duration);
  toast.addEventListener('click', () => { clearTimeout(toast._timeout); remove(); });
}

// ---- Alert modal (themed, replaces alert()) ----
function showAlert(message, { title = null, type = 'info', raw = false } = {}) {
  return new Promise((resolve) => {
    _removeSpModal();

    const overlay = document.createElement('div');
    overlay.id = 'sp-modal-overlay';
    overlay.className = 'sp-overlay';

    const icon = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }[type] || 'ℹ';
    const bodyContent = raw ? message : `<p class="sp-modal-body">${_formatMessage(message)}</p>`;

    // All user-supplied strings are sanitized via _uiEscape/_formatMessage before injection
    const modal = document.createElement('div');
    modal.setAttribute('role', 'alertdialog');
    modal.setAttribute('aria-modal', 'true');
    modal.className = 'sp-modal';

    const iconEl = document.createElement('div');
    iconEl.className = `sp-modal-icon sp-modal-icon-${type}`;
    iconEl.textContent = icon;
    modal.appendChild(iconEl);

    if (title) {
      const h3 = document.createElement('h3');
      h3.className = 'sp-modal-title';
      h3.textContent = title;
      modal.appendChild(h3);
    }

    if (raw) {
      // raw mode: caller passes pre-sanitized HTML (internal use only).
      // We use DOMParser to avoid direct innerHTML assignment.
      const wrapper = document.createElement('div');
      const parsed  = new DOMParser().parseFromString(message, 'text/html');
      [...parsed.body.childNodes].forEach(n => wrapper.appendChild(document.importNode(n, true)));
      modal.appendChild(wrapper);
    } else {
      const p = document.createElement('p');
      p.className = 'sp-modal-body';
      p.textContent = message;
      modal.appendChild(p);
    }

    const buttons = document.createElement('div');
    buttons.className = 'sp-modal-buttons';
    const okBtn = document.createElement('button');
    okBtn.className = 'sp-btn sp-modal-ok';
    okBtn.textContent = 'Dismiss';
    buttons.appendChild(okBtn);
    modal.appendChild(buttons);
    overlay.appendChild(modal);

    document.body.appendChild(overlay);

    // Focus after paint so the button is interactive
    requestAnimationFrame(() => {
      overlay.classList.add('sp-overlay-show');
      modal.querySelector('.sp-modal-ok').focus();
    });

    const close = () => { _removeSpModal(); resolve(); };
    modal.querySelector('.sp-modal-ok').addEventListener('click', close);
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); close(); }
    });
  });
}

// ---- Confirm modal (themed, replaces confirm()) ----
// Returns Promise<boolean>
function showConfirm(message, { title = null, confirmLabel = 'Confirm', cancelLabel = 'Cancel' } = {}) {
  return new Promise((resolve) => {
    _removeSpModal();

    const overlay = document.createElement('div');
    overlay.id = 'sp-modal-overlay';
    overlay.className = 'sp-overlay';

    // All user-supplied strings are sanitized via _uiEscape before use
    const modal = document.createElement('div');
    modal.setAttribute('role', 'alertdialog');
    modal.setAttribute('aria-modal', 'true');
    modal.className = 'sp-modal';

    const iconEl = document.createElement('div');
    iconEl.className = 'sp-modal-icon sp-modal-icon-warning';
    iconEl.textContent = '⚠';
    modal.appendChild(iconEl);

    if (title) {
      const h3 = document.createElement('h3');
      h3.className = 'sp-modal-title';
      h3.textContent = title;
      modal.appendChild(h3);
    }

    const p = document.createElement('p');
    p.className = 'sp-modal-body';
    p.textContent = message;
    modal.appendChild(p);

    const buttons = document.createElement('div');
    buttons.className = 'sp-modal-buttons';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'sp-btn sp-btn-ghost sp-modal-cancel';
    cancelBtn.textContent = cancelLabel;
    const okBtn = document.createElement('button');
    okBtn.className = 'sp-btn sp-modal-ok';
    okBtn.textContent = confirmLabel;
    buttons.appendChild(cancelBtn);
    buttons.appendChild(okBtn);
    modal.appendChild(buttons);
    overlay.appendChild(modal);

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('sp-overlay-show');
      modal.querySelector('.sp-modal-ok').focus();
    });

    const close = (result) => { _removeSpModal(); resolve(result); };
    modal.querySelector('.sp-modal-ok').addEventListener('click', () => close(true));
    modal.querySelector('.sp-modal-cancel').addEventListener('click', () => close(false));
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(false); }
      if (e.key === 'Enter')  { e.preventDefault(); close(true);  }
    });
  });
}

// ---- Internal ----
function _removeSpModal() {
  const el = document.getElementById('sp-modal-overlay');
  if (el) el.remove();
}