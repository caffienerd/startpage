// ========================================
// Prompts Modal — Terminal placeholder suggestions editor
// ========================================

const DEFAULT_PROMPTS = [
  "search anything...",
  ":help → commands",
  ":config → settings",
  "ai:directions to home → maps",
  ":aimode → toggle no-prefix AI routing",
  "yt:query → youtube",
  "maps:location → google maps",
  "dir/books: dune → open directory",
  "dir/music/ddg: flac albums → open dir on DDG",
];

// ---- Storage ----
function getStoredPrompts() {
  try {
    const stored = localStorage.getItem('terminalPrompts');
    return stored ? JSON.parse(stored) : null; // null = use defaults
  } catch (e) { return null; }
}

function savePrompts(prompts) {
  try { localStorage.setItem('terminalPrompts', JSON.stringify(prompts)); }
  catch (e) { console.error('Failed to save prompts:', e); }
}

function clearStoredPrompts() {
  localStorage.removeItem('terminalPrompts');
}

// Returns whichever list is active (stored or defaults)
function getActivePrompts() {
  return getStoredPrompts() || DEFAULT_PROMPTS;
}

// ---- Modal ----
function openPromptsModal() {
  const textarea = document.getElementById('prompts-textarea');
  const prompts = getActivePrompts();
  textarea.value = prompts.join('\n');
  document.getElementById('prompts-modal').classList.add('active');
  textarea.focus();
}

function closePromptsModal() {
  document.getElementById('prompts-modal').classList.remove('active');
}

function savePromptsModal() {
  const textarea = document.getElementById('prompts-textarea');
  const lines = textarea.value
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) {
    // Empty → reset to defaults
    clearStoredPrompts();
  } else {
    savePrompts(lines);
  }

  // Restart the placeholder animation with new prompts
  const input = document.getElementById('terminal-input');
  if (input) {
    if (input._typingTimeout) clearTimeout(input._typingTimeout);
    typePlaceholder(input, lines.length > 0 ? lines : DEFAULT_PROMPTS);
  }

  closePromptsModal();
}

function resetPromptsModal() {
  document.getElementById('prompts-textarea').value = DEFAULT_PROMPTS.join('\n');
}