// ========================================
// Extension Storage Shim
// Moves the Gemini API key out of localStorage into chrome.storage.local
// (which is encrypted at rest and not readable by web page JS on other origins).
// Everything else stays in localStorage — no migration needed.
//
// This file must be loaded BEFORE storage.js so it can override
// getStoredGeminiApiKey / saveGeminiApiKey with async-safe versions.
//
// The key is still accessed synchronously by most callers, so we:
//   1. Cache it in memory after an async load at startup (extStorageReady promise)
//   2. Override the get/save functions to use the cache + chrome.storage.local
// ========================================

const EXT_GEMINI_KEY = 'geminiApiKey';

// In-memory cache — populated during init
let _cachedGeminiApiKey = '';

// Promise that resolves once the key is loaded from chrome.storage.local
// Script.js waits on this before calling DOMContentLoaded init.
window.extStorageReady = new Promise((resolve) => {
  try {
    const storage = (typeof chrome !== 'undefined' && chrome.storage)
      ? chrome.storage.local
      : (typeof browser !== 'undefined' && browser.storage)
        ? browser.storage.local
        : null;

    if (!storage) {
      // Fallback: running as plain webpage (dev mode)
      _cachedGeminiApiKey = localStorage.getItem(EXT_GEMINI_KEY) || '';
      resolve();
      return;
    }

    storage.get([EXT_GEMINI_KEY], (result) => {
      _cachedGeminiApiKey = result?.[EXT_GEMINI_KEY] || '';

      // One-time migration: if old key exists in localStorage, move it over
      const legacy = localStorage.getItem(EXT_GEMINI_KEY);
      if (legacy && !_cachedGeminiApiKey) {
        _cachedGeminiApiKey = legacy;
        storage.set({ [EXT_GEMINI_KEY]: legacy });
        localStorage.removeItem(EXT_GEMINI_KEY);
      } else if (legacy) {
        // Clean up any lingering localStorage copy
        localStorage.removeItem(EXT_GEMINI_KEY);
      }

      resolve();
    });
  } catch (e) {
    console.warn('ext-storage: init failed, falling back to localStorage', e);
    _cachedGeminiApiKey = localStorage.getItem(EXT_GEMINI_KEY) || '';
    resolve();
  }
});

// ---- Override storage.js functions ----
// These run after storage.js loads because storage.js declares them with
// function declarations (hoisted), but we reassign the variables here.
// We use window.onload-style deferred assignment via a flag that storage.js
// checks, OR we simply shadow them as window properties which take precedence
// over the function declarations in the same scope when called as window.X.
// Simplest reliable approach: redefine after DOMContentLoaded.

document.addEventListener('DOMContentLoaded', () => {
  // By this point storage.js has already run. Reassign on window so all
  // callers that do getStoredGeminiApiKey() pick up our version.
}, { once: true });

// Override immediately — storage.js uses function declarations so they're
// hoisted, but window property assignment wins when code calls the name
// without explicit scope. We assign to window so later scripts see our version.

window.getStoredGeminiApiKey = function () {
  return _cachedGeminiApiKey;
};

window.normalizeGeminiApiKey = function (key) {
  return String(key || '').trim();
};

window.saveGeminiApiKey = function (key) {
  const normalized = String(key || '').trim();
  _cachedGeminiApiKey = normalized;

  // Remove from localStorage (never store it there)
  localStorage.removeItem(EXT_GEMINI_KEY);

  const storage = (typeof chrome !== 'undefined' && chrome.storage)
    ? chrome.storage.local
    : (typeof browser !== 'undefined' && browser.storage)
      ? browser.storage.local
      : null;

  if (storage) {
    storage.set({ [EXT_GEMINI_KEY]: normalized });
  }
};
