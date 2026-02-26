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

document.addEventListener("DOMContentLoaded", () => {
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
    ['tags-modal',      closeTagsModal],
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
    if (typeof closeTagsModal === 'function') closeTagsModal();
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