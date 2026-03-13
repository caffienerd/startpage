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
  toast.innerHTML = `<span class="sp-toast-icon">${icon}</span><span class="sp-toast-msg">${_uiEscape(message)}</span>`;

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
function showAlert(message, { title = null, type = 'info' } = {}) {
  return new Promise((resolve) => {
    _removeSpModal();

    const overlay = document.createElement('div');
    overlay.id = 'sp-modal-overlay';
    overlay.className = 'sp-overlay';

    const icon = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }[type] || 'ℹ';

    overlay.innerHTML = `
      <div class="sp-modal" role="alertdialog" aria-modal="true">
        <div class="sp-modal-icon sp-modal-icon-${type}">${icon}</div>
        ${title ? `<h3 class="sp-modal-title">${_uiEscape(title)}</h3>` : ''}
        <p class="sp-modal-body">${_formatMessage(message)}</p>
        <div class="sp-modal-buttons">
          <button class="sp-btn sp-modal-ok">Dismiss</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    // Focus after paint so the button is interactive
    requestAnimationFrame(() => {
      overlay.classList.add('sp-overlay-show');
      overlay.querySelector('.sp-modal-ok').focus();
    });

    const close = () => { _removeSpModal(); resolve(); };
    overlay.querySelector('.sp-modal-ok').addEventListener('click', close);
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

    overlay.innerHTML = `
      <div class="sp-modal" role="alertdialog" aria-modal="true">
        <div class="sp-modal-icon sp-modal-icon-warning">⚠</div>
        ${title ? `<h3 class="sp-modal-title">${_uiEscape(title)}</h3>` : ''}
        <p class="sp-modal-body">${_formatMessage(message)}</p>
        <div class="sp-modal-buttons">
          <button class="sp-btn sp-btn-ghost sp-modal-cancel">${_uiEscape(cancelLabel)}</button>
          <button class="sp-btn sp-modal-ok">${_uiEscape(confirmLabel)}</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('sp-overlay-show');
      overlay.querySelector('.sp-modal-ok').focus();
    });

    const close = (result) => { _removeSpModal(); resolve(result); };
    overlay.querySelector('.sp-modal-ok').addEventListener('click', () => close(true));
    overlay.querySelector('.sp-modal-cancel').addEventListener('click', () => close(false));
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