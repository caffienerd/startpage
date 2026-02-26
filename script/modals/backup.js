// ========================================
// Backup — Export / Import localStorage
// ========================================

const BACKUP_KEYS = [
  'username', 'theme', 'weatherLocation', 'weatherUnit', 'timezone',
  'geminiApiKey', 'geminiModel', 'geminiSystemPrompt',
  'aiModeEnabled', 'aiRouteBadgeMode', 'searchEngine',
  'bookmarks', 'syntaxColors', 'searchOverrides', 'customTags'
];

function exportBackup() {
  const data = { _version: 1, _exported: new Date().toISOString() };
  BACKUP_KEYS.forEach(key => {
    const val = localStorage.getItem(key);
    if (val !== null) data[key] = val;
  });

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `startpage-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importBackup() {
  const input = document.createElement('input');
  input.type   = 'file';
  input.accept = '.json,application/json';

  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // Basic validation
        if (!data || typeof data !== 'object') throw new Error('Invalid file');

        let restored = 0;
        BACKUP_KEYS.forEach(key => {
          if (data[key] !== undefined) {
            localStorage.setItem(key, data[key]);
            restored++;
          }
        });

        _showBackupToast(`✓ Restored ${restored} settings — reloading...`);
        setTimeout(() => location.reload(), 1200);

      } catch (err) {
        _showBackupToast('✕ Invalid backup file', true);
      }
    };
    reader.readAsText(file);
  });

  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}

function _showBackupToast(msg, isError = false) {
  const existing = document.getElementById('backup-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'backup-toast';
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
    background: ${isError ? '#e74c3c' : 'var(--terminal-bg)'};
    color: var(--text-color); border: 1px solid var(--card-border);
    padding: 10px 20px; border-radius: 8px; font-family: var(--monospace-font-family);
    font-size: 13px; z-index: 9999; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    animation: fadeInUp 0.2s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}