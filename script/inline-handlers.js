// ========================================
// Inline Handlers — CSP-safe event wiring
// Replaces all onclick= attributes in index.html
// Must load AFTER all modal scripts and commands.js
// ========================================

document.addEventListener('DOMContentLoaded', () => {

  function on(id, fn) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  }

  // ---- Config modal ----
  on('btn-edit-bookmarks',     () => openBookmarksModal());
  on('btn-tags-from-config',   () => { closeConfig(); openTagsModal(); });
  on('btn-customize-from-config', () => { closeConfig(); openCustomizeModal(); });
  on('btn-import-backup',      () => importBackup());
  on('btn-export-backup',      () => exportBackup());
  on('btn-cancel-config',      () => closeConfig());
  on('btn-save-config',        () => saveConfig());

  // ---- Help modal ----
  on('btn-close-help',         () => closeHelp());

  // ---- IP modal ----
  on('btn-close-ip',           () => closeIPInfo());

  // ---- Speed modal ----
  on('btn-close-speed',        () => closeSpeedTest());

  // ---- Spell modal ----
  on('btn-close-spell',        () => closeSpellModal());

  // ---- Bookmarks modal ----
  on('toggle-editor-btn',      () => toggleEditorMode());
  on('btn-cancel-bookmarks',   () => closeBookmarksModal());
  on('btn-save-bookmarks',     () => saveBookmarksFromModal());

  // ---- Gemini modal ----
  on('btn-copy-gemini',        () => copyGeminiResponse());
  on('btn-close-gemini',       () => closeGeminiModal());

  // ---- Customize modal ----
  on('btn-reset-colors',       () => resetAllSyntaxColors());
  on('btn-edit-prompts',       () => { closeCustomizeModal(); openPromptsModal(); });
  on('btn-cancel-customize',   () => closeCustomizeModal());
  on('btn-save-customize',     () => saveCustomize());

  // ---- Tags modal ----
  on('btn-add-tag',            () => addCustomTag());
  on('btn-dir-extensions',     () => { closeTagsModal(); openDirConfigModal(); });
  on('btn-cancel-tags',        () => closeTagsModal());
  on('btn-save-tags',          () => saveTagsModal());

  // ---- Dir modal ----
  on('dir-copy-btn',           () => copyDirCommand());
  on('btn-cancel-dir',         () => closeDirModal());
  on('btn-search-dir',         () => fireDirSearch());

  // ---- Prompts modal ----
  on('btn-reset-prompts',      () => resetPromptsModal());
  on('btn-cancel-prompts',     () => closePromptsModal());
  on('btn-save-prompts',       () => savePromptsModal());

  // ---- DirConfig modal ----
  on('btn-cancel-dirconfig',   () => closeDirConfigModal());
  on('btn-save-dirconfig',     () => saveDirConfig());

  // ---- Pronounce modal ----
  on('btn-close-pronounce',    () => closePronounceModal());

  // ---- History modal ----
  on('btn-clear-history',      () => clearHistory());
  on('btn-close-history',      () => closeHistoryModal());

});
