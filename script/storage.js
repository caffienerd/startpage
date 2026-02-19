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

const DEFAULT_USERNAME        = "coffeenerd";
const DEFAULT_WEATHER_LOCATION = "Gurgaon";
const DEFAULT_TIMEZONE        = "UTC+5:30";
const DEFAULT_GEMINI_MODEL    = "gemini-2.5-flash-lite";
const DEFAULT_GEMINI_SYSTEM_PROMPT = "";

// ========================================
// Bookmarks
// ========================================
function getStoredBookmarks() {
  const stored = localStorage.getItem('bookmarks');
  return stored ? JSON.parse(stored) : DEFAULT_BOOKMARKS;
}
function saveBookmarks(bookmarks) {
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}

// ========================================
// Username
// ========================================
function getStoredUsername() {
  return localStorage.getItem('username') || DEFAULT_USERNAME;
}
function saveUsername(name) {
  localStorage.setItem('username', name);
}

// ========================================
// Theme
// ========================================
function getStoredTheme() {
  return localStorage.getItem('theme') || 'light';
}
function saveTheme(theme) {
  localStorage.setItem('theme', theme);
}

// ========================================
// Weather / Timezone
// ========================================
function getStoredWeatherLocation() {
  return localStorage.getItem('weatherLocation') || DEFAULT_WEATHER_LOCATION;
}
function saveWeatherLocation(location) {
  localStorage.setItem('weatherLocation', location);
}
function getStoredTimezone() {
  return localStorage.getItem('timezone') || DEFAULT_TIMEZONE;
}
function saveTimezone(tz) {
  localStorage.setItem('timezone', tz);
}

// ========================================
// Gemini
// ========================================
function getStoredGeminiApiKey() {
  return localStorage.getItem('geminiApiKey') || '';
}

function normalizeGeminiApiKey(key) {
  const trimmed = String(key || '').trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
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
