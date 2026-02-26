// ========================================
// Defaults
// ========================================
const DEFAULT_BOOKMARKS = [
  { href: "https://mail.google.com/", title: "Gmail" },
  { href: "https://huggingface.co/spaces", title: "HuggingFace" },
  { href: "https://youtube.com", title: "YouTube" },
  { href: "https://drive.google.com/", title: "Drive" },
  { href: "https://discord.com/app", title: "Discord" },
  { href: "https://deepsite.hf.co/", title: "Deepsite" },
  { href: "https://web.whatsapp.com/", title: "WhatsApp" },
  { href: "https://www.reddit.com/", title: "Reddit" },
  { href: "https://x.com/home", title: "X" },
  { href: "https://pinterest.com/", title: "Pinterest" },
  { href: "https://chat.deepseek.com/", title: "DeepSeek" },
  { href: "https://grok.com/", title: "Grock" },
  { href: "https://www.perplexity.ai/", title: "Perplexity" },
  { href: "https://chatgpt.com/", title: "ChatGPT" },
  { href: "https://alternativeto.net/", title: "AlternativeTo" },
  { href: "https://github.com/", title: "Github" },
  { href: "https://gemini.google.com/app", title: "Gemini" },
  { href: "https://www.instagram.com/", title: "Instagram" },
  { href: "https://fmhy.net/", title: "FMHY" },
  { href: "https://claude.ai/new", title: "Claude" }
];

const DEFAULT_USERNAME = "coffeenerd";
const DEFAULT_WEATHER_LOCATION = "Gurgaon";
const DEFAULT_WEATHER_UNIT = "celsius";
const DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
const DEFAULT_GEMINI_SYSTEM_PROMPT = "";
const DEFAULT_AI_MODE_ENABLED = false;
const DEFAULT_AI_ROUTE_BADGE_MODE = "live";
const DEFAULT_SEARCH_ENGINE = "google"; // "google" | "ddg" | "bing"

// ========================================
// Syntax Colors — universal, theme-independent
// ========================================
const DEFAULT_SYNTAX_COLORS = {
  cmd:     '#667eea', // :commands
  theme:   '#f6ad55', // :theme commands
  search:  '#f39c12', // search prefixes (yt:, maps:, etc.)
  version: '#00b894', // :version
  url:     '#5fafaf', // direct URLs (chess.com)
  unknown: '#e74c3c', // unrecognised :commands
};

function getStoredSyntaxColors() {
  try {
    const stored = localStorage.getItem('syntaxColors');
    if (!stored) return { ...DEFAULT_SYNTAX_COLORS };
    return { ...DEFAULT_SYNTAX_COLORS, ...JSON.parse(stored) };
  } catch (e) {
    return { ...DEFAULT_SYNTAX_COLORS };
  }
}
function saveSyntaxColors(colors) {
  try {
    localStorage.setItem('syntaxColors', JSON.stringify(colors));
  } catch (e) { console.error('Failed to save syntax colors:', e); }
}
function applySyntaxColors(colors) {
  const root = document.documentElement;
  root.style.setProperty('--syn-cmd',     colors.cmd     || DEFAULT_SYNTAX_COLORS.cmd);
  root.style.setProperty('--syn-theme',   colors.theme   || DEFAULT_SYNTAX_COLORS.theme);
  root.style.setProperty('--syn-search',  colors.search  || DEFAULT_SYNTAX_COLORS.search);
  root.style.setProperty('--syn-version', colors.version || DEFAULT_SYNTAX_COLORS.version);
  root.style.setProperty('--syn-url',     colors.url     || DEFAULT_SYNTAX_COLORS.url);
  root.style.setProperty('--syn-unknown', colors.unknown || DEFAULT_SYNTAX_COLORS.unknown);
}

// ========================================
// Bookmarks
// ========================================
function getStoredBookmarks() {
  try {
    const stored = localStorage.getItem('bookmarks');
    return stored ? JSON.parse(stored) : DEFAULT_BOOKMARKS;
  } catch (e) {
    console.error('Failed to parse bookmarks:', e);
    return DEFAULT_BOOKMARKS;
  }
}
function saveBookmarks(bookmarks) {
  if (!Array.isArray(bookmarks)) throw new Error('Invalid bookmarks data');
  try {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  } catch (e) {
    console.error('Failed to save bookmarks:', e);
    alert('Could not save bookmarks. Storage may be full.');
  }
}

// ========================================
// Username
// ========================================
function getStoredUsername() {
  return localStorage.getItem('username') || DEFAULT_USERNAME;
}
function saveUsername(name) {
  if (!name || typeof name !== 'string') throw new Error('Invalid username');
  try {
    localStorage.setItem('username', name.trim());
  } catch (e) {
    console.error('Failed to save username:', e);
  }
}

// ========================================
// Theme
// ========================================
function getStoredTheme() {
  return localStorage.getItem('theme') || 'light';
}
function saveTheme(theme) {
  try {
    localStorage.setItem('theme', theme);
  } catch (e) {
    console.error('Failed to save theme:', e);
  }
}

// ========================================
// Weather / Timezone
// ========================================
function getStoredWeatherLocation() {
  return localStorage.getItem('weatherLocation') || DEFAULT_WEATHER_LOCATION;
}
function saveWeatherLocation(location) {
  try {
    localStorage.setItem('weatherLocation', location);
  } catch (e) { console.error(e); }
}
function getStoredWeatherUnit() {
  return localStorage.getItem('weatherUnit') || DEFAULT_WEATHER_UNIT;
}
function saveWeatherUnit(unit) {
  try {
    localStorage.setItem('weatherUnit', unit);
  } catch (e) { console.error(e); }
}
function getStoredTimezone() {
  return localStorage.getItem('timezone') || DEFAULT_TIMEZONE;
}
function saveTimezone(tz) {
  try {
    localStorage.setItem('timezone', tz);
  } catch (e) { console.error(e); }
}

// ========================================
// Gemini
// ========================================
function getStoredGeminiApiKey() {
  return localStorage.getItem('geminiApiKey') || '';
}

function normalizeGeminiApiKey(key) {
  return String(key || '').trim();
}

function saveGeminiApiKey(key) {
  localStorage.setItem('geminiApiKey', normalizeGeminiApiKey(key));
}
function getStoredGeminiModel() {
  return localStorage.getItem('geminiModel') || DEFAULT_GEMINI_MODEL;
}
function saveGeminiModel(model) {
  localStorage.setItem('geminiModel', model);
}
function getStoredGeminiSystemPrompt() {
  return localStorage.getItem('geminiSystemPrompt') || DEFAULT_GEMINI_SYSTEM_PROMPT;
}
function saveGeminiSystemPrompt(prompt) {
  localStorage.setItem('geminiSystemPrompt', String(prompt || '').trim());
}

// ========================================
// AI Router
// ========================================
function getStoredAiModeEnabled() {
  const stored = localStorage.getItem('aiModeEnabled');
  if (stored === null) return DEFAULT_AI_MODE_ENABLED;
  return stored === 'true';
}
function saveAiModeEnabled(enabled) {
  localStorage.setItem('aiModeEnabled', enabled ? 'true' : 'false');
}
function getStoredAiRouteBadgeMode() {
  const mode = (localStorage.getItem('aiRouteBadgeMode') || DEFAULT_AI_ROUTE_BADGE_MODE).toLowerCase();
  return ['live', 'route', 'off'].includes(mode) ? mode : DEFAULT_AI_ROUTE_BADGE_MODE;
}
function saveAiRouteBadgeMode(mode) {
  const normalized = String(mode || '').toLowerCase();
  localStorage.setItem('aiRouteBadgeMode', ['live', 'route', 'off'].includes(normalized) ? normalized : DEFAULT_AI_ROUTE_BADGE_MODE);
}

// ========================================
// Search Overrides — per-prefix URL overrides
// ========================================
const OVERRIDEABLE_PREFIXES = {
  'yt':     { label: 'YouTube',       default: 'https://www.youtube.com/results?search_query=' },
  'r':      { label: 'Reddit',        default: 'https://google.com/search?q=site:reddit.com ' },
  'ddg':    { label: 'DuckDuckGo',    default: 'https://duckduckgo.com/?q=' },
  'bing':   { label: 'Bing',          default: 'https://www.bing.com/search?q=' },
  'ggl':    { label: 'Google',        default: 'https://www.google.com/search?q=' },
  'amazon': { label: 'Amazon',        default: 'https://www.amazon.com/s?k=' },
  'imdb':   { label: 'IMDb',          default: 'https://www.imdb.com/find?q=' },
  'alt':    { label: 'AlternativeTo', default: 'https://alternativeto.net/browse/search/?q=' },
  'maps':   { label: 'Maps',          default: 'https://www.google.com/maps/search/' },
};

function getStoredSearchOverrides() {
  try {
    const stored = localStorage.getItem('searchOverrides');
    return stored ? JSON.parse(stored) : {};
  } catch (e) { return {}; }
}
function saveSearchOverrides(overrides) {
  try { localStorage.setItem('searchOverrides', JSON.stringify(overrides)); }
  catch (e) { console.error('Failed to save search overrides:', e); }
}

// ========================================
// Custom Tags — user-defined prefix:url pairs
// ========================================
function getStoredCustomTags() {
  try {
    const stored = localStorage.getItem('customTags');
    return stored ? JSON.parse(stored) : [];
    // Format: [{ prefix: 'gh', url: 'https://github.com/search?q=' }, ...]
  } catch (e) { return []; }
}
function saveCustomTags(tags) {
  try { localStorage.setItem('customTags', JSON.stringify(tags)); }
  catch (e) { console.error('Failed to save custom tags:', e); }
}
function getStoredSearchEngine() {
  const stored = localStorage.getItem('searchEngine') || DEFAULT_SEARCH_ENGINE;
  return ['google', 'ddg', 'bing'].includes(stored) ? stored : DEFAULT_SEARCH_ENGINE;
}
function saveSearchEngine(engine) {
  const normalized = String(engine || '').toLowerCase();
  localStorage.setItem('searchEngine', ['google', 'ddg', 'bing'].includes(normalized) ? normalized : DEFAULT_SEARCH_ENGINE);
}