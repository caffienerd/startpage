// ========================================
// Main entry point
// ========================================

function loadTheme() {
  const theme = getStoredTheme();
  THEMES.forEach(t => {
    document.body.classList.remove(`${t}-mode`);
    document.documentElement.classList.remove(`${t}-mode`);
  });
  if (theme !== 'light') {
    document.body.classList.add(`${theme}-mode`);
    document.documentElement.classList.add(`${theme}-mode`);
  }
}

// ---- Placeholders Init ----
const CONFIG_PLACEHOLDERS = {
  'config-username': 'e.g., coffeenerd',
  'weather-location': 'e.g., London, Tokyo, New York',
  'time-zone': 'e.g., America/New_York, Europe/London, Asia/Tokyo',
  'gemini-api-key': 'AIza...',
  'gemini-model': 'e.g., gemini-2.5-flash-lite (free)',
  'gemini-system-prompt': 'Optional. Example: You are a concise assistant. Reply in bullet points.',
};

function initPlaceholders() {
  for (const [id, text] of Object.entries(CONFIG_PLACEHOLDERS)) {
    const el = document.getElementById(id);
    if (el) el.placeholder = text;
  }
}

// ---- Init ----
const TIME_UPDATE_INTERVAL = 60 * 1000;
const WEATHER_UPDATE_INTERVAL = 30 * 60 * 1000;

function focusTerminalInput() {
  const input = document.getElementById('terminal-input');
  if (!input) return;
  if (document.querySelector('.config-modal.active')) return;
  input.focus({ preventScroll: true });
}

function ensureInitialTerminalFocus() {
  const retryDelays = [0, 60, 180, 400, 900];
  retryDelays.forEach((delay) => {
    setTimeout(() => {
      if (document.activeElement?.id !== 'terminal-input') focusTerminalInput();
    }, delay);
  });

  window.addEventListener('focus', () => {
    setTimeout(() => {
      if (document.activeElement?.id !== 'terminal-input') focusTerminalInput();
    }, 0);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (document.activeElement?.id !== 'terminal-input') focusTerminalInput();
  });

  // Chrome new-tab can keep focus away from page input. As soon as the page
  // receives interaction, reclaim focus.
  ['mousedown', 'pointerdown', 'touchstart'].forEach((evt) => {
    document.addEventListener(evt, () => {
      if (document.activeElement?.id !== 'terminal-input') focusTerminalInput();
    }, { capture: true, passive: true });
  });

  document.addEventListener('keydown', (e) => {
    if (document.querySelector('.config-modal.active')) return;
    const active = document.activeElement;
    const input = document.getElementById('terminal-input');
    if (!input) return;
    if (active === input) return;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const isPrintable = e.key.length === 1;
    const isBackspace = e.key === 'Backspace';
    if (!isPrintable && !isBackspace) return;

    e.preventDefault();
    focusTerminalInput();
    if (isPrintable) {
      input.value += e.key;
    } else if (isBackspace) {
      input.value = input.value.slice(0, -1);
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, true);
}

function bindButtonAction(id, handler) {
  const el = document.getElementById(id);
  if (!el || typeof handler !== 'function') return;
  el.addEventListener('click', handler);
}

function bindStaticButtonActions() {
  bindButtonAction('btn-edit-bookmarks', openBookmarksModal);
  bindButtonAction('btn-config-customize', () => { closeConfig(); openCustomizeModal(); });
  bindButtonAction('btn-config-cancel', closeConfig);
  bindButtonAction('btn-config-save', saveConfig);
  bindButtonAction('btn-help-close', closeHelp);
  bindButtonAction('btn-ip-close', closeIPInfo);
  bindButtonAction('btn-speed-close', closeSpeedTest);
  bindButtonAction('btn-spell-close', closeSpellModal);
  bindButtonAction('toggle-editor-btn', toggleEditorMode);
  bindButtonAction('btn-bookmarks-cancel', closeBookmarksModal);
  bindButtonAction('btn-bookmarks-save', saveBookmarksFromModal);
  bindButtonAction('btn-gemini-copy', copyGeminiResponse);
  bindButtonAction('btn-gemini-close', closeGeminiModal);
  bindButtonAction('btn-customize-reset', resetAllSyntaxColors);
  bindButtonAction('btn-customize-cancel', closeCustomizeModal);
  bindButtonAction('btn-customize-save', saveCustomize);
}

document.addEventListener("DOMContentLoaded", () => {
  bindStaticButtonActions();
  ensureInitialTerminalFocus();
  initPlaceholders();
  loadTheme();
  applySyntaxColors(getStoredSyntaxColors());
  try { generateBookmarks(); } catch (e) { console.error('Bookmarks init error:', e); }
  initializeTerminal();
  updateTime();
  try { updateWeather(); } catch (e) { console.error('Weather init error:', e); }

  setInterval(updateTime, TIME_UPDATE_INTERVAL);
  setInterval(updateWeather, WEATHER_UPDATE_INTERVAL);

  // Click-outside closes modals
  [
    ['config-modal', closeConfig],
    ['help-modal', closeHelp],
    ['ip-modal', closeIPInfo],
    ['speed-modal', closeSpeedTest],
    ['spell-modal', closeSpellModal],
    ['gemini-modal', closeGeminiModal],
    ['customize-modal', closeCustomizeModal],
  ].forEach(([id, fn]) => {
    if (typeof fn === 'function') {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', (e) => {
          if (e.target.id === id) fn();
        });
      }
    }
  });
});

// ---- Global keyboard: Escape closes all modals, any key refocuses input ----
document.addEventListener('keydown', (e) => {
  // Ignore modifiers unless it's a specific combination we care about
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  const activeModal = document.querySelector('.config-modal.active');

  if (e.key === 'Escape') {
    if (typeof closeConfig === 'function') closeConfig();
    if (typeof closeHelp === 'function') closeHelp();
    if (typeof closeIPInfo === 'function') closeIPInfo();
    if (typeof closeSpeedTest === 'function') closeSpeedTest();
    if (typeof closeSpellModal === 'function') closeSpellModal();
    if (typeof closeGeminiModal === 'function') closeGeminiModal();
    if (typeof closeBookmarksModal === 'function') closeBookmarksModal();
    if (typeof closeCustomizeModal === 'function') closeCustomizeModal();
    return;
  }

  // Focus trap inside modals
  if (activeModal && e.key === 'Tab') {
    const focusableElements = activeModal.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) { // Shift + Tab
        if (document.activeElement === first || document.activeElement === activeModal || document.activeElement === document.body) {
          last.focus();
          e.preventDefault();
        }
      } else { // Tab
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
    return;
  }

  // Refocus terminal unless a modal input is active
  if (!activeModal && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    // Only attempt to focus if the key actually produced a character or we hit backspace
    if (e.key.length === 1 || e.key === 'Backspace') {
      const terminalInput = document.getElementById('terminal-input');
      if (terminalInput) terminalInput.focus();
    }
  }
});
