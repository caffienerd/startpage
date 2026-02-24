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
