// ========================================
// Main entry point
// ========================================

function loadTheme() {
  const theme = getStoredTheme();
  document.body.classList.remove('dark-mode', 'black-mode', 'nord-mode', 'newspaper-mode', 'coffee-mode', 'root-mode', 'neon-mode');
  document.documentElement.classList.remove('dark-mode', 'black-mode', 'nord-mode', 'newspaper-mode', 'coffee-mode', 'root-mode', 'neon-mode');

  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
    document.documentElement.classList.add('dark-mode');
  } else if (theme === 'black') {
    document.body.classList.add('black-mode');
    document.documentElement.classList.add('black-mode');
  } else if (theme === 'nord') {
    document.body.classList.add('nord-mode');
    document.documentElement.classList.add('nord-mode');
  } else if (theme === 'newspaper') {
    document.body.classList.add('newspaper-mode');
    document.documentElement.classList.add('newspaper-mode');
  } else if (theme === 'coffee') {
    document.body.classList.add('coffee-mode');
    document.documentElement.classList.add('coffee-mode');
  } else if (theme === 'root') {
    document.body.classList.add('root-mode');
    document.documentElement.classList.add('root-mode');
  } else if (theme === 'neon') {
    document.body.classList.add('neon-mode');
    document.documentElement.classList.add('neon-mode');
  }
}

// ---- Init ----
document.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  generateBookmarks();
  initializeTerminal();
  updateTime();
  updateWeather();

  setInterval(updateTime, 60000);
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
    ['config-modal', closeConfig],
    ['help-modal', closeHelp],
    ['ip-modal', closeIPInfo],
    ['speed-modal', closeSpeedTest],
    ['spell-modal', closeSpellModal],
    ['gemini-modal', closeGeminiModal],
  ].forEach(([id, fn]) => {
    document.getElementById(id).addEventListener('click', (e) => {
      if (e.target.id === id) fn();
    });
  });
});
