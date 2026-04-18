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

// Firefox / Opera: aggressively reclaim focus from the omnibox.
// These browsers give omnibox focus on newtab even for extension overrides.
// Strategy: poll until we own it, and reclaim on any user interaction.
(function nonChromeFocusGrab() {
  function grab() {
    const input = document.getElementById('terminal-input');
    if (!input) return false;
    if (document.querySelector('.config-modal.active')) return true; // leave modal alone
    if (document.activeElement === input) return true;
    input.focus({ preventScroll: true });
    return document.activeElement === input;
  }

  // Poll for up to 3 seconds after page load — Firefox/Opera allow focus()
  // from page JS once the document is interactive, just not instantly.
  let attempts = 0;
  const poll = setInterval(() => {
    if (grab() || ++attempts > 30) clearInterval(poll);
  }, 100);

  // Firefox-specific: the omnibox steals focus AFTER our poll wins.
  // Watch for the input losing focus to anything outside a modal and yank it back.
  document.addEventListener('focusin', (e) => {
    const input = document.getElementById('terminal-input');
    if (!input) return;
    if (document.querySelector('.config-modal.active')) return;
    if (e.target === input) return;
    // Only reclaim if focus went to body or document (omnibox steal signature)
    if (e.target === document.body || e.target === document.documentElement) {
      input.focus({ preventScroll: true });
    }
  }, { capture: true });

  // Also reclaim when page becomes visible again (switching back to the tab)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      setTimeout(() => grab(), 50);
    }
  });

  // Also reclaim on any click on the page body (not inside a modal)
  document.addEventListener('click', (e) => {
    if (!document.querySelector('.config-modal.active')) grab();
  }, { capture: true });

  // Reclaim on keydown so typing always lands in terminal
  document.addEventListener('keydown', (e) => {
    const input = document.getElementById('terminal-input');
    if (!input) return;
    if (document.activeElement === input) return;
    if (document.querySelector('.config-modal.active')) return;
    if (e.key.length === 1 || e.key === 'Backspace') {
      input.focus({ preventScroll: true });
    }
  }, { capture: true });
})()

// Hide loading overlay if user navigates back (bfcache restore)
window.addEventListener('pageshow', (e) => {
  const el = document.getElementById('loading-overlay');
  if (!el) return;
  el.classList.remove('visible');
  el.classList.add('hiding');
  setTimeout(() => el.classList.remove('hiding'), 300);
});

document.addEventListener("DOMContentLoaded", async () => {
  // Wait for extension storage (Gemini API key) to be loaded before init
  if (window.extStorageReady) await window.extStorageReady;
  initPlaceholders();
  loadTheme();
  applySyntaxColors(getStoredSyntaxColors());
  try { generateBookmarks(); } catch (e) { console.error('Bookmarks init error:', e); }
  initializeTerminal();
  updateTime();
  try { updateWeather(); } catch (e) { console.error('Weather init error:', e); }

  setInterval(updateTime, TIME_UPDATE_INTERVAL);
  setInterval(updateWeather, WEATHER_UPDATE_INTERVAL);

  // Dir modal — category + engine button interactivity
  document.querySelectorAll('#dir-cat-grid .dir-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#dir-cat-grid .dir-cat-btn').forEach(b => b.classList.remove('active-cat'));
      btn.classList.add('active-cat');
      if (typeof _updateDirPreview === 'function') _updateDirPreview();
    });
  });
  document.querySelectorAll('#dir-engine-grid .dir-engine-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#dir-engine-grid .dir-engine-btn').forEach(b => b.classList.remove('active-engine'));
      btn.classList.add('active-engine');
      if (typeof _updateDirPreview === 'function') _updateDirPreview();
    });
  });
  const dirKwInput = document.getElementById('dir-keyword-input');
  if (dirKwInput) {
    dirKwInput.addEventListener('input', () => { if (typeof _updateDirPreview === 'function') _updateDirPreview(); });
    dirKwInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); if (typeof fireDirSearch === 'function') fireDirSearch(); }
    });
  }

  // Click-outside closes modals
  [
    ['config-modal', closeConfig],
    ['help-modal', closeHelp],
    ['ip-modal', closeIPInfo],
    ['speed-modal', closeSpeedTest],
    ['spell-modal', closeSpellModal],
    ['gemini-modal', closeGeminiModal],
    ['customize-modal', closeCustomizeModal],
    ['tags-modal',      closeTagsModal],
    ['dir-modal',       closeDirModal],
    ['dirconfig-modal', closeDirConfigModal],
    ['prompts-modal',   closePromptsModal],
    ['pronounce-modal', closePronounceModal],
    ['history-modal',   closeHistoryModal],
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

  const activeModal = document.querySelector('.config-modal.active') || document.getElementById('sp-modal-overlay');

  if (e.key === 'Escape') {
    if (typeof closeConfig === 'function') closeConfig();
    if (typeof closeHelp === 'function') closeHelp();
    if (typeof closeIPInfo === 'function') closeIPInfo();
    if (typeof closeSpeedTest === 'function') closeSpeedTest();
    if (typeof closeSpellModal === 'function') closeSpellModal();
    if (typeof closeGeminiModal === 'function') closeGeminiModal();
    if (typeof closeBookmarksModal === 'function') closeBookmarksModal();
    if (typeof closeCustomizeModal === 'function') closeCustomizeModal();
    if (typeof closeTagsModal === 'function') closeTagsModal();
    if (typeof closeDirModal === 'function') closeDirModal();
    if (typeof closeDirConfigModal === 'function') closeDirConfigModal();
    if (typeof closePromptsModal === 'function') closePromptsModal();
    if (typeof closePronounceModal === 'function') closePronounceModal();
    if (typeof closeHistoryModal === 'function') closeHistoryModal();
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