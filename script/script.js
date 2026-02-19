// ========================================
// Main entry point
// ========================================

function loadTheme() {
  if (getStoredTheme() === 'dark') document.body.classList.add('dark-mode');
}

// ---- Init ----
document.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  generateBookmarks();
  initializeTerminal();
  updateTime();
  updateWeather();

  setInterval(updateTime,   60000);
  setInterval(updateWeather, 1800000);
});

// ---- Global keyboard: Escape closes all modals, any key refocuses input ----
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeConfig();
    closeHelp();
    closeIPInfo();
    closeSpeedTest();
    closeSpellModal();
    closeGeminiModal();
  }

  // Refocus terminal unless a modal input is active
  const configModal = document.getElementById('config-modal');
  if (!configModal.classList.contains('active')) {
    document.getElementById('terminal-input').focus();
  }
});

// ---- Click-outside closes modals ----
window.addEventListener('DOMContentLoaded', () => {
  [
    ['config-modal',  closeConfig],
    ['help-modal',    closeHelp],
    ['ip-modal',      closeIPInfo],
    ['speed-modal',   closeSpeedTest],
    ['spell-modal',   closeSpellModal],
    ['gemini-modal',  closeGeminiModal],
  ].forEach(([id, fn]) => {
    document.getElementById(id).addEventListener('click', (e) => {
      if (e.target.id === id) fn();
    });
  });
});
