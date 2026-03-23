// ========================================
// Extension Storage Init
// Loads the Gemini API key from chrome.storage.local / browser.storage.local
// into the global _cachedGeminiApiKey before the app initialises.
// storage.js reads and writes this variable directly.
// On localhost (no extension API), falls back to localStorage.
// ========================================

// Global cache — read by storage.js getStoredGeminiApiKey()
var _cachedGeminiApiKey = '';

window.extStorageReady = new Promise((resolve) => {
  try {
    const extStorage = (typeof browser !== 'undefined' && browser?.storage?.local)
      ? browser.storage.local
      : (typeof chrome !== 'undefined' && chrome?.storage?.local)
        ? chrome.storage.local
        : null;

    if (!extStorage) {
      // Localhost — read from localStorage
      _cachedGeminiApiKey = localStorage.getItem('geminiApiKey') || '';
      resolve();
      return;
    }

    const onResult = (result) => {
      _cachedGeminiApiKey = result?.geminiApiKey || '';

      // One-time migration from localStorage → extension storage
      const legacy = localStorage.getItem('geminiApiKey');
      if (legacy && !_cachedGeminiApiKey) {
        _cachedGeminiApiKey = legacy;
        extStorage.set({ geminiApiKey: legacy });
        localStorage.removeItem('geminiApiKey');
      } else if (legacy) {
        localStorage.removeItem('geminiApiKey');
      }

      resolve();
    };

    // Firefox returns Promise; Chrome uses callbacks
    const result = extStorage.get(['geminiApiKey']);
    if (result && typeof result.then === 'function') {
      result.then(onResult).catch(() => { _cachedGeminiApiKey = ''; resolve(); });
    } else {
      extStorage.get(['geminiApiKey'], onResult);
    }
  } catch (e) {
    console.warn('ext-storage: init failed, using localStorage', e);
    _cachedGeminiApiKey = localStorage.getItem('geminiApiKey') || '';
    resolve();
  }
});