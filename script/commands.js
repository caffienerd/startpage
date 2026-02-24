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
  const themeMatch = normalized.replace(/^:/, '');
  const THEME_ALIASES = { 'amoled': 'black', 'hacker': 'root', 'cyberpunk': 'neon' };
  const targetTheme = THEME_ALIASES[themeMatch] || themeMatch;

  if (THEMES.includes(targetTheme) || targetTheme === 'light') {
    THEMES.forEach(t => {
      document.body.classList.remove(`${t}-mode`);
      document.documentElement.classList.remove(`${t}-mode`);
    });
    if (targetTheme !== 'light') {
      document.documentElement.classList.add(`${targetTheme}-mode`);
    }
    saveTheme(targetTheme);
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
  if (/^yt:/i.test(rawValue)) { navigate(`https://www.youtube.com/results?search_query=${encodeSearchQuery(rawValue, "yt:")}`); return; }
  if (/^r:/i.test(rawValue)) { navigate(`https://google.com/search?q=site:reddit.com ${rawValue.replace(/^r:/i, "")}`); return; }
  if (/^ddg:/i.test(rawValue)) { navigate(`https://duckduckgo.com/?q=${encodeSearchQuery(rawValue, "ddg:")}`); return; }
  if (/^imdb:/i.test(rawValue)) { navigate(`https://www.imdb.com/find?q=${encodeSearchQuery(rawValue, "imdb:")}`); return; }
  if (/^alt:/i.test(rawValue)) { navigate(`https://alternativeto.net/browse/search/?q=${encodeSearchQuery(rawValue, "alt:")}`); return; }
  if (/^def:/i.test(rawValue)) { navigate(`https://onelook.com/?w=${encodeSearchQuery(rawValue, "def:")}`); return; }
  if (/^the:/i.test(rawValue)) { navigate(`https://onelook.com/thesaurus/?s=${encodeSearchQuery(rawValue, "the:")}`); return; }
  if (/^syn:/i.test(rawValue)) { navigate(`https://onelook.com/?related=1&w=${encodeSearchQuery(rawValue, "syn:")}`); return; }
  if (/^quote:/i.test(rawValue)) { navigate(`https://onelook.com/?mentions=1&w=${encodeSearchQuery(rawValue, "quote:")}`); return; }
  if (/^maps:/i.test(rawValue)) { navigate(`https://www.google.com/maps/search/${encodeSearchQuery(rawValue, "maps:")}`); return; }
  if (/^cws:/i.test(rawValue)) {
    const q = rawValue.replace(/^cws:/i, "").trim();
    navigate(getBrowser() === "firefox"
      ? `https://addons.mozilla.org/en-US/firefox/search/?q=${encodeURIComponent(q)}`
      : `https://chromewebstore.google.com/search/${encodeURIComponent(q)}`);
    return;
  }

  // ---- Direct URL or Google ----
  if (rawValue.split(".").length >= 2 && !rawValue.includes(" ")) {
    navigate(rawValue.startsWith("http") ? rawValue : `https://${rawValue}`);
  } else {
    navigate(`https://google.com/search?q=${encodeURIComponent(rawValue)}`);
  }
}

function navigate(url) {
  try { window.location.href = url; } catch (e) { console.error('Navigation failed', e); }
}

// Shorthand: strip prefix and encode
function encodeSearchQuery(value, prefix) {
  return encodeURIComponent(value.startsWith(prefix) ? value.slice(prefix.length).trim() : value.trim());
}

function routeSemanticIntent(query) {
  const raw = query.trim();
  const cleaned = stripIntentLead(raw);
  const cleanedLower = cleaned.toLowerCase();

  const commandRoute = (cmd) => {
    showAiRouteBadge(getAiCommandDestination(cmd), raw, AI_ROUTE_BADGE_NAV_DELAY_MS).then(() => {
      handleSpecialCommands(cmd);
    });
  };

  const navRoute = (url, destination) => {
    showAiRouteBadge(destination || getAiUrlDestination(url), raw, AI_ROUTE_BADGE_NAV_DELAY_MS).then(() => {
      navigate(url);
    });
  };

  const mappedCommand = matchCommandIntent(cleanedLower);
  if (mappedCommand) {
    commandRoute(mappedCommand);
    return;
  }

  const directUrl = extractIntentUrl(cleaned);
  if (directUrl) {
    navRoute(directUrl, getAiUrlDestination(directUrl));
    return;
  }

  const mappedUrl = matchWebIntent(cleaned, cleanedLower, { allowSideEffects: true });
  if (mappedUrl === HANDLED_INTERNALLY) return;
  if (mappedUrl && mappedUrl.startsWith('spell://')) {
    const candidate = mappedUrl.replace(/^spell:\/\//, '');
    showAiRouteBadge('Spell Check', cleanedQuery, AI_ROUTE_BADGE_NAV_DELAY_MS).then(() => {
      handleSpellCheck(candidate);
    });
    return;
  }
  if (mappedUrl) {
    navRoute(mappedUrl);
    return;
  }

  navRoute(`https://google.com/search?q=${encodeURIComponent(cleaned || raw)}`, 'Google Search');
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
