// ========================================
// Command routing
// ========================================

// ========================================
// Version
// ========================================
function openVersion() {
  const ver = window.APP_VERSION || 'unknown';
  alert('v' + ver);
}

const AI_ROUTE_BADGE_NAV_DELAY_MS = 550;
const AI_ROUTE_BADGE_HIDE_MS = 2600;

function openAiRouterHelp() {
  alert(
    'ai: is a semantic intent router.\n\n' +
    'How it works:\n' +
    '1) You type a natural-language intent.\n' +
    '2) It detects likely destination (maps, YouTube, Reddit, settings, etc.).\n' +
    '3) It navigates there directly.\n' +
    '4) If no clear match exists, it falls back to Google search.\n\n' +
    'Use gem: or gemini: for direct Gemini prompting.'
  );
}

function handleSpecialCommands(value) {
  const rawValue = value.trim();
  const normalized = rawValue.toLowerCase();
  const input = document.getElementById('terminal-input');
  const elements = document.querySelectorAll("a");

  const clear = (hideBadge = true) => {
    input.value = '';
    resetStyles(elements);
    updateSyntaxHighlight("");
    if (hideBadge) hideAiRouteBadge();
  };

  // ---- Modal commands ----
  if (normalized === ":help") { openHelp(); clear(); return; }
  if (normalized === ":help_ai_router") { openAiRouterHelp(); clear(); return; }
  if (/^:aimode(\s+(on|off|toggle))?$/i.test(rawValue)) {
    const match = rawValue.match(/^:aimode(?:\s+(on|off|toggle))?$/i);
    const action = (match?.[1] || 'toggle').toLowerCase();
    const current = getStoredAiModeEnabled();
    const next = action === 'toggle' ? !current : action === 'on';
    saveAiModeEnabled(next);
    if (!next) hideAiRouteBadge();
    alert(`AI mode ${next ? 'enabled' : 'disabled'}. ${next ? 'Plain text can route without ai: after bookmark check.' : 'Use ai: prefix for routing.'}`);
    clear();
    return;
  }
  if (normalized === ":version" || normalized === ":ver") { openVersion(); clear(); return; }
  if (normalized === ":ipconfig" || normalized === ":ip") { openIPInfo(); clear(); return; }
  if (normalized === ":netspeed" || normalized === ":speed") { openSpeedTest(); clear(); return; }
  if (normalized === ":gemini") { window.location.href = "https://gemini.google.com/app"; return; }
  if (normalized === ":bookmarks" || normalized === ":bm") { openBookmarksModal(); clear(); return; }
  if (normalized === ":config" || normalized === ":weather" || normalized === ":time") { openConfig(); clear(); return; }

  // ---- Theme ----
  if (normalized === ":dark") {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('black-mode', 'nord-mode', 'newspaper-mode', 'coffee-mode', 'root-mode', 'neon-mode');
    document.documentElement.classList.add('dark-mode');
    document.documentElement.classList.remove('black-mode', 'nord-mode', 'newspaper-mode', 'coffee-mode', 'root-mode', 'neon-mode');
    saveTheme('dark');
    clear();
    return;
  }
  if (normalized === ":black" || normalized === ":amoled") {
    document.body.classList.add('black-mode');
    document.body.classList.remove('dark-mode', 'nord-mode', 'newspaper-mode', 'coffee-mode', 'root-mode', 'neon-mode');
    document.documentElement.classList.add('black-mode');
    document.documentElement.classList.remove('dark-mode', 'nord-mode', 'newspaper-mode', 'coffee-mode', 'root-mode', 'neon-mode');
    saveTheme('black');
    clear();
    return;
  }
  if (normalized === ":nord") {
    document.body.classList.add('nord-mode');
    document.body.classList.remove('dark-mode', 'black-mode', 'newspaper-mode', 'coffee-mode', 'root-mode', 'neon-mode');
    document.documentElement.classList.add('nord-mode');
    document.documentElement.classList.remove('dark-mode', 'black-mode', 'newspaper-mode', 'coffee-mode', 'root-mode', 'neon-mode');
    saveTheme('nord');
    clear();
    return;
  }
  if (normalized === ":newspaper") {
    document.body.classList.add('newspaper-mode');
    document.body.classList.remove('dark-mode', 'black-mode', 'nord-mode', 'coffee-mode', 'root-mode', 'neon-mode');
    document.documentElement.classList.add('newspaper-mode');
    document.documentElement.classList.remove('dark-mode', 'black-mode', 'nord-mode', 'coffee-mode', 'root-mode', 'neon-mode');
    saveTheme('newspaper');
    clear();
    return;
  }
  if (normalized === ":coffee") {
    document.body.classList.add('coffee-mode');
    document.body.classList.remove('dark-mode', 'black-mode', 'nord-mode', 'newspaper-mode', 'root-mode', 'neon-mode');
    document.documentElement.classList.add('coffee-mode');
    document.documentElement.classList.remove('dark-mode', 'black-mode', 'nord-mode', 'newspaper-mode', 'root-mode', 'neon-mode');
    saveTheme('coffee');
    clear();
    return;
  }
  if (normalized === ":root" || normalized === ":hacker") {
    document.body.classList.add('root-mode');
    document.body.classList.remove('dark-mode', 'black-mode', 'nord-mode', 'newspaper-mode', 'coffee-mode', 'neon-mode');
    document.documentElement.classList.add('root-mode');
    document.documentElement.classList.remove('dark-mode', 'black-mode', 'nord-mode', 'newspaper-mode', 'coffee-mode', 'neon-mode');
    saveTheme('root');
    clear();
    return;
  }
  if (normalized === ":neon" || normalized === ":cyberpunk") {
    document.body.classList.add('neon-mode');
    document.body.classList.remove('dark-mode', 'black-mode', 'nord-mode', 'newspaper-mode', 'coffee-mode', 'root-mode');
    document.documentElement.classList.add('neon-mode');
    document.documentElement.classList.remove('dark-mode', 'black-mode', 'nord-mode', 'newspaper-mode', 'coffee-mode', 'root-mode');
    saveTheme('neon');
    clear();
    return;
  }
  if (normalized === ":light") {
    document.body.classList.remove('dark-mode', 'black-mode', 'nord-mode', 'newspaper-mode', 'coffee-mode', 'root-mode', 'neon-mode');
    document.documentElement.classList.remove('dark-mode', 'black-mode', 'nord-mode', 'newspaper-mode', 'coffee-mode', 'root-mode', 'neon-mode');
    saveTheme('light');
    clear();
    return;
  }

  // ---- Spell check ----
  if (/^spell\s*:/i.test(rawValue)) {
    const query = rawValue.replace(/^spell\s*:/i, "").trim();
    if (query) { handleSpellCheck(query); clear(); }
    return;
  }

  // ---- Gemini AI ----
  if (/^(gem|gemini)\s*:/i.test(rawValue)) {
    const query = rawValue.replace(/^(gem|gemini)\s*:/i, "").trim();
    if (query) {
      handleGeminiPrompt(query);
      clear();
    }
    return;
  }

  // ---- Semantic intent router ----
  if (/^ai\s*:/i.test(rawValue)) {
    const query = rawValue.replace(/^ai\s*:/i, "").trim();
    if (query) {
      routeSemanticIntent(query);
      clear(false);
    }
    return;
  }

  // ---- Search shortcuts ----
  if (/^yt:/i.test(rawValue)) { window.location.href = `https://www.youtube.com/results?search_query=${enc(rawValue, "yt:")}`; return; }
  if (/^r:/i.test(rawValue)) { window.location.href = `https://google.com/search?q=site:reddit.com ${rawValue.replace(/^r:/i, "")}`; return; }
  if (/^ddg:/i.test(rawValue)) { window.location.href = `https://duckduckgo.com/?q=${enc(rawValue, "ddg:")}`; return; }
  if (/^imdb:/i.test(rawValue)) { window.location.href = `https://www.imdb.com/find?q=${enc(rawValue, "imdb:")}`; return; }
  if (/^alt:/i.test(rawValue)) { window.location.href = `https://alternativeto.net/browse/search/?q=${enc(rawValue, "alt:")}`; return; }
  if (/^def:/i.test(rawValue)) { window.location.href = `https://onelook.com/?w=${enc(rawValue, "def:")}`; return; }
  if (/^the:/i.test(rawValue)) { window.location.href = `https://onelook.com/thesaurus/?s=${enc(rawValue, "the:")}`; return; }
  if (/^syn:/i.test(rawValue)) { window.location.href = `https://onelook.com/?related=1&w=${enc(rawValue, "syn:")}`; return; }
  if (/^quote:/i.test(rawValue)) { window.location.href = `https://onelook.com/?mentions=1&w=${enc(rawValue, "quote:")}`; return; }
  if (/^maps:/i.test(rawValue)) { window.location.href = `https://www.google.com/maps/search/${enc(rawValue, "maps:")}`; return; }
  if (/^cws:/i.test(rawValue)) {
    const q = rawValue.replace(/^cws:/i, "").trim();
    window.location.href = getBrowser() === "firefox"
      ? `https://addons.mozilla.org/en-US/firefox/search/?q=${encodeURIComponent(q)}`
      : `https://chromewebstore.google.com/search/${encodeURIComponent(q)}`;
    return;
  }

  // ---- Direct URL or Google ----
  if (rawValue.split(".").length >= 2 && !rawValue.includes(" ")) {
    window.location.href = rawValue.startsWith("http") ? rawValue : `https://${rawValue}`;
  } else {
    window.location.href = `https://google.com/search?q=${encodeURIComponent(rawValue)}`;
  }
}

// Shorthand: strip prefix and encode
function enc(value, prefix) {
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return encodeURIComponent(value.replace(new RegExp(`^${escapedPrefix}`, 'i'), "").trim());
}

async function routeSemanticIntent(query) {
  const raw = query.trim();
  const cleaned = stripIntentLead(raw);
  const cleanedLower = cleaned.toLowerCase();

  const commandRoute = async (cmd) => {
    await showAiRouteBadge(getAiCommandDestination(cmd), raw, AI_ROUTE_BADGE_NAV_DELAY_MS);
    handleSpecialCommands(cmd);
  };

  const navRoute = async (url, destination) => {
    await showAiRouteBadge(destination || getAiUrlDestination(url), raw, AI_ROUTE_BADGE_NAV_DELAY_MS);
    window.location.href = url;
  };

  const mappedCommand = matchCommandIntent(cleanedLower);
  if (mappedCommand) {
    await commandRoute(mappedCommand);
    return;
  }

  const directUrl = extractIntentUrl(cleaned);
  if (directUrl) {
    await navRoute(directUrl, getAiUrlDestination(directUrl));
    return;
  }

  const mappedUrl = matchWebIntent(cleaned, cleanedLower, { allowSideEffects: true });
  if (mappedUrl === '__handled__') return;
  if (mappedUrl) {
    await navRoute(mappedUrl);
    return;
  }

  await navRoute(`https://google.com/search?q=${encodeURIComponent(cleaned || raw)}`, 'Google Search');
}

function stripIntentLead(query) {
  return query
    .replace(/^(open|go to|visit|launch|take me to|show me|find|search|look up)\s+/i, '')
    .trim();
}

function extractIntentUrl(query) {
  const candidate = query.trim().replace(/^https?:\/\//i, '');
  if (!candidate || candidate.includes(' ')) return '';
  if (!/\./.test(candidate)) return '';
  return /^https?:\/\//i.test(query.trim()) ? query.trim() : `https://${candidate}`;
}

function includesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function matchCommandIntent(lowerQuery) {
  if (includesAny(lowerQuery, [/\b(help|commands?)\b/])) return ':help';
  if (includesAny(lowerQuery, [/\b(config|settings?|preferences?)\b/])) return ':config';
  if (includesAny(lowerQuery, [/\b(ip|ipv4|ipv6|asn|isp|vpn|latency)\b/, /\bnetwork info\b/])) return ':ipconfig';
  if (includesAny(lowerQuery, [/\b(speed\s*test|internet speed|network speed|wifi speed|download speed|upload speed)\b/])) return ':netspeed';
  if (includesAny(lowerQuery, [/\b(weather|forecast|temperature)\b/])) return ':weather';
  if (includesAny(lowerQuery, [/\b(time|timezone|clock)\b/])) return ':time';
  return '';
}

function matchWebIntent(cleanedQuery, lowerQuery, options = {}) {
  const allowSideEffects = options.allowSideEffects !== false;

  if (includesAny(lowerQuery, [/\b(map|maps|directions?|navigate|route|near me|nearby|where is|distance to)\b/])) {
    return `https://www.google.com/maps/search/${encodeURIComponent(cleanedQuery)}`;
  }

  if (includesAny(lowerQuery, [/\b(reddit|subreddit|r\/)\b/])) {
    return `https://google.com/search?q=${encodeURIComponent(`site:reddit.com ${cleanedQuery}`)}`;
  }

  if (includesAny(lowerQuery, [/\b(youtube|yt|video|watch|trailer|playlist|music video)\b/])) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanedQuery)}`;
  }

  if (includesAny(lowerQuery, [/\b(movie|film|tv show|series|actor|actress|cast|imdb|rating)\b/])) {
    return `https://www.imdb.com/find?q=${encodeURIComponent(cleanedQuery)}`;
  }

  if (includesAny(lowerQuery, [/\b(define|definition|meaning)\b/])) {
    return `https://onelook.com/?w=${encodeURIComponent(cleanedQuery)}`;
  }

  if (includesAny(lowerQuery, [/\b(thesaurus|another word for)\b/])) {
    return `https://onelook.com/thesaurus/?s=${encodeURIComponent(cleanedQuery)}`;
  }

  if (includesAny(lowerQuery, [/\b(synonym|similar word)\b/])) {
    return `https://onelook.com/?related=1&w=${encodeURIComponent(cleanedQuery)}`;
  }

  if (includesAny(lowerQuery, [/\b(quote|quotation|who said)\b/])) {
    return `https://onelook.com/?mentions=1&w=${encodeURIComponent(cleanedQuery)}`;
  }

  if (includesAny(lowerQuery, [/\b(extension|addon|add-on|plugin)\b/])) {
    return getBrowser() === "firefox"
      ? `https://addons.mozilla.org/en-US/firefox/search/?q=${encodeURIComponent(cleanedQuery)}`
      : `https://chromewebstore.google.com/search/${encodeURIComponent(cleanedQuery)}`;
  }

  if (includesAny(lowerQuery, [/\b(alternative to|replace|substitute)\b/])) {
    return `https://alternativeto.net/browse/search/?q=${encodeURIComponent(cleanedQuery)}`;
  }

  if (includesAny(lowerQuery, [/\b(spell|spelling)\b/])) {
    const candidate = cleanedQuery.replace(/\b(spell|spelling|how do you spell)\b/gi, '').trim();
    if (candidate && !candidate.includes(' ')) {
      if (allowSideEffects) {
        showAiRouteBadge('Spell Check', cleanedQuery);
        handleSpellCheck(candidate);
        return '__handled__';
      }
      return `spell://${candidate}`;
    }
  }

  return '';
}

function showAiRouteBadge(destination, query, waitMs = 0, mode = 'route') {
  const badge = document.getElementById('ai-route-badge');
  if (!badge) return Promise.resolve();
  const badgeMode = getStoredAiRouteBadgeMode();
  if (badgeMode === 'off') return Promise.resolve();
  if (mode === 'preview' && badgeMode !== 'live') return Promise.resolve();

  const message = query
    ? `Routing to: ${destination}\n${query}`
    : `Routing to: ${destination}`;

  badge.textContent = message;
  badge.classList.toggle('preview', mode === 'preview');
  badge.classList.remove('bump');
  void badge.offsetWidth;
  badge.classList.add('bump');
  badge.classList.add('show');

  if (badge._hideTimeout) {
    clearTimeout(badge._hideTimeout);
    badge._hideTimeout = null;
  }
  if (mode !== 'preview') {
    badge._hideTimeout = setTimeout(() => {
      badge.classList.remove('show');
    }, AI_ROUTE_BADGE_HIDE_MS);
  }

  if (!waitMs) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, waitMs));
}

function hideAiRouteBadge() {
  const badge = document.getElementById('ai-route-badge');
  if (!badge) return;
  if (badge._hideTimeout) {
    clearTimeout(badge._hideTimeout);
    badge._hideTimeout = null;
  }
  badge.classList.remove('show', 'preview', 'bump');
  badge.textContent = '';
}

function previewAiRoute(query) {
  if (getStoredAiRouteBadgeMode() !== 'live') {
    hideAiRouteBadge();
    return;
  }

  const raw = (query || '').trim();
  if (!raw) {
    hideAiRouteBadge();
    return;
  }

  const cleaned = stripIntentLead(raw);
  const cleanedLower = cleaned.toLowerCase();

  const mappedCommand = matchCommandIntent(cleanedLower);
  if (mappedCommand) {
    showAiRouteBadge(getAiCommandDestination(mappedCommand), raw, 0, 'preview');
    return;
  }

  const directUrl = extractIntentUrl(cleaned);
  if (directUrl) {
    showAiRouteBadge(getAiUrlDestination(directUrl), raw, 0, 'preview');
    return;
  }

  const mappedUrl = matchWebIntent(cleaned, cleanedLower, { allowSideEffects: false });
  if (mappedUrl && mappedUrl.startsWith('spell://')) {
    showAiRouteBadge('Spell Check', raw, 0, 'preview');
    return;
  }
  if (mappedUrl) {
    showAiRouteBadge(getAiUrlDestination(mappedUrl), raw, 0, 'preview');
    return;
  }

  showAiRouteBadge('Google Search', raw, 0, 'preview');
}

function getAiCommandDestination(cmd) {
  if (cmd === ':help') return 'Help';
  if (cmd === ':config') return 'Settings';
  if (cmd === ':ipconfig') return 'Network Info';
  if (cmd === ':netspeed') return 'Speed Test';
  if (cmd === ':weather') return 'Weather Settings';
  if (cmd === ':time') return 'Time Settings';
  return 'Tool';
}

function getAiUrlDestination(url) {
  const lower = url.toLowerCase();
  if (lower.includes('google.com/maps')) return 'Google Maps';
  if (lower.includes('youtube.com')) return 'YouTube';
  if (lower.includes('reddit.com')) return 'Reddit';
  if (lower.includes('imdb.com')) return 'IMDb';
  if (lower.includes('onelook.com/thesaurus')) return 'OneLook Thesaurus';
  if (lower.includes('onelook.com/?related=1')) return 'OneLook Synonyms';
  if (lower.includes('onelook.com/?mentions=1')) return 'OneLook Quotes';
  if (lower.includes('onelook.com')) return 'OneLook';
  if (lower.includes('alternativeto.net')) return 'AlternativeTo';
  if (lower.includes('addons.mozilla.org') || lower.includes('chromewebstore.google.com')) return 'Extension Store';
  if (lower.includes('google.com/search')) return 'Google Search';

  try {
    const host = new URL(url).hostname.replace(/^www\./i, '');
    return host || 'Website';
  } catch (_) {
    return 'Website';
  }
}
