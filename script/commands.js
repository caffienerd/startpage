// ========================================
// Command routing
// ========================================

// ========================================
// Version
// ========================================
function openVersion() {
  const ver = (typeof browser !== 'undefined' && browser.runtime?.getManifest?.()?.version) || (typeof chrome !== 'undefined' && chrome.runtime?.getManifest?.()?.version) || window.APP_VERSION || 'unknown';
  showAlert('Version: ' + ver, { title: 'Start Page', type: 'info' });
}

async function checkForUpdate() {
  const REMOTE_URL = 'https://raw.githubusercontent.com/caffienerd/startpage/refs/heads/master/version/version.js';
  const local = (typeof browser !== 'undefined' && browser.runtime?.getManifest?.()?.version) || (typeof chrome !== 'undefined' && chrome.runtime?.getManifest?.()?.version) || window.APP_VERSION || 'unknown';

  showToast('Checking for updates...', 'info', 2500);

  try {
    const res = await fetch(REMOTE_URL + '?_=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const match = text.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
    if (!match) throw new Error('Could not parse remote version');
    const remote = match[1];

    if (remote === local) {
      showAlert(`You're up to date!\n\nCurrent version: v${local}`, { title: 'No Updates', type: 'success' });
    } else {
      showAlert(
        `New version available!\n\nInstalled:  v${local}\nLatest:     v${remote}\n\ngithub.com/caffienerd/startpage`,
        { title: 'Update Available', type: 'warning' }
      );
    }
  } catch (err) {
    showAlert(`Could not reach GitHub.\n\n${err.message}`, { title: 'Update Check Failed', type: 'error' });
  }
}

const AI_ROUTE_BADGE_NAV_DELAY_MS = 550;
const AI_ROUTE_BADGE_HIDE_MS = 2600;

function openAiRouterHelp() {
  showAlert(
    'ai: is a semantic intent router.\n\n' +
    'How it works:\n' +
    '1) You type a natural-language intent.\n' +
    '2) It detects likely destination (maps, YouTube, Reddit, settings, etc.).\n' +
    '3) It navigates there directly.\n' +
    '4) If no clear match exists, it falls back to Google search.\n\n' +
    'Use gem: or gemini: for direct Gemini prompting.',
    { title: 'AI Router', type: 'info' }
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
    showToast(
      next
        ? 'AI mode enabled — plain text routes without ai: prefix'
        : 'AI mode disabled — use ai: prefix for routing',
      next ? 'success' : 'info',
      3500
    );
    clear();
    return;
  }
  if (normalized === ":version" || normalized === ":ver") { openVersion(); clear(); return; }
  if (normalized === ":update") { checkForUpdate(); clear(); return; }
  if (normalized === ":history") { openHistory(); clear(); return; }
  if (normalized === ":tour") { openTour(true); clear(); return; }
  if (normalized === ":export") { exportBackup(); clear(); return; }
  if (normalized === ":import") { importBackup(); clear(); return; }
  if (normalized === ":reset") { handleResetCommand(); clear(); return; }
  if (normalized === ":ipconfig" || normalized === ":ip") { openIPInfo(); clear(); return; }
  if (normalized === ":netspeed" || normalized === ":speed") { openSpeedTest(); clear(); return; }
  if (normalized === ":gemini") { navigate("https://gemini.google.com/app"); return; }
  if (normalized === ":bookmarks" || normalized === ":bm") { openBookmarksModal(); clear(); return; }
  if (normalized === ":customize" || normalized === ":custom") { openCustomizeModal(); clear(); return; }
  if (normalized === ":tags") { openTagsModal(); clear(); return; }
  if (normalized === ":dir") { openDirModal(); clear(); return; }
  if (normalized === ":dirconfig") { openDirConfigModal(); clear(); return; }
  if (normalized === ":prompts") { openPromptsModal(); clear(); return; }
  if (normalized === ":config" || normalized === ":weather" || normalized === ":time") { openConfig(); clear(); return; }

  // ---- Open Directory search ----
  if (/^dir(\/[a-z]*)?(\/[a-z]*)?:/i.test(rawValue)) {
    if (handleDirCommand(rawValue)) { clear(); return; }
  }

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

  // ---- Pronounce ----
  if (/^pronounce\s*:/i.test(rawValue)) {
    const query = rawValue.replace(/^pronounce\s*:/i, "").trim();
    if (query) { handlePronounce(query); clear(); }
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

  // ---- Custom tags (user-defined prefix:url) ----
  const customTags = typeof getStoredCustomTags === 'function' ? getStoredCustomTags() : [];
  for (const tag of customTags) {
    if (!tag.prefix || !tag.url) continue;
    const re = new RegExp(`^${tag.prefix}:`, 'i');
    if (re.test(rawValue)) {
      const q = encodeURIComponent(rawValue.replace(re, '').trim());
      navigate(tag.url.replace(/\$q/g, q) + (tag.url.includes('$q') ? '' : q));
      return;
    }
  }

  // ---- Search overrides check ----
  const overrides = typeof getStoredSearchOverrides === 'function' ? getStoredSearchOverrides() : {};

  // ---- Search shortcuts ----
  if (/^yt:/i.test(rawValue)) { navigate(`${overrides.yt || 'https://www.youtube.com/results?search_query='}${encodeSearchQuery(rawValue, 'yt:')}`); return; }
  if (/^r:/i.test(rawValue)) { navigate(`${overrides.r || 'https://google.com/search?q=site:reddit.com '}${rawValue.replace(/^r:/i, '')}`); return; }
  if (/^ddg:/i.test(rawValue)) { navigate(`${overrides.ddg || 'https://duckduckgo.com/?q='}${encodeSearchQuery(rawValue, 'ddg:')}`); return; }
  if (/^bing:/i.test(rawValue)) { navigate(`${overrides.bing || 'https://www.bing.com/search?q='}${encodeSearchQuery(rawValue, 'bing:')}`); return; }
  if (/^ggl:/i.test(rawValue)) { navigate(`${overrides.ggl || 'https://www.google.com/search?q='}${encodeSearchQuery(rawValue, 'ggl:')}`); return; }
  if (/^amazon:/i.test(rawValue)) { navigate(`${overrides.amazon || 'https://www.amazon.com/s?k='}${encodeSearchQuery(rawValue, 'amazon:')}`); return; }
  if (/^imdb:/i.test(rawValue)) { navigate(`${overrides.imdb || 'https://www.imdb.com/find?q='}${encodeSearchQuery(rawValue, 'imdb:')}`); return; }
  if (/^alt:/i.test(rawValue)) { navigate(`${overrides.alt || 'https://alternativeto.net/browse/search/?q='}${encodeSearchQuery(rawValue, 'alt:')}`); return; }
  if (/^maps:/i.test(rawValue)) { navigate(`${overrides.maps || 'https://www.google.com/maps/search/'}${encodeSearchQuery(rawValue, 'maps:')}`); return; }
  if (/^def:/i.test(rawValue)) { navigate(`https://onelook.com/?w=${encodeSearchQuery(rawValue, "def:")}`); return; }
  if (/^the:/i.test(rawValue)) { navigate(`https://onelook.com/thesaurus/?s=${encodeSearchQuery(rawValue, "the:")}`); return; }
  if (/^syn:/i.test(rawValue)) { navigate(`https://onelook.com/?related=1&w=${encodeSearchQuery(rawValue, "syn:")}`); return; }
  if (/^quote:/i.test(rawValue)) { navigate(`https://onelook.com/?mentions=1&w=${encodeSearchQuery(rawValue, "quote:")}`); return; }
  if (/^cws:/i.test(rawValue)) {
    const q = rawValue.replace(/^cws:/i, "").trim();
    navigate(getBrowser() === "firefox"
      ? `https://addons.mozilla.org/en-US/firefox/search/?q=${encodeURIComponent(q)}`
      : `https://chromewebstore.google.com/search/${encodeURIComponent(q)}`);
    return;
  }

  // ---- Direct URL or default search ----
  if (rawValue.split(".").length >= 2 && !rawValue.includes(" ")) {
    navigate(rawValue.startsWith("http") ? rawValue : `https://${rawValue}`);
  } else {
    const engine = (typeof getStoredSearchEngine === 'function') ? getStoredSearchEngine() : 'google';
    const q = encodeURIComponent(rawValue);
    if (engine === 'ddg') navigate(`https://duckduckgo.com/?q=${q}`);
    else if (engine === 'bing') navigate(`https://www.bing.com/search?q=${q}`);
    else navigate(`https://google.com/search?q=${q}`);
  }
}

function showLoading() {
  const el = document.getElementById('loading-overlay');
  if (!el) return;
  el.classList.remove('hiding');
  el.classList.add('visible');
}

function navigate(url) {
  try {
    showLoading();
    window.location.href = url;
  } catch (e) { console.error('Navigation failed', e); }
}

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

  const mappedUrl = matchWebIntent(cleaned, cleanedLower);
  if (mappedUrl) {
    if (mappedUrl.startsWith('spell://')) {
      handleSpellCheck(mappedUrl.replace('spell://', ''));
      return;
    }
    navRoute(mappedUrl, getAiUrlDestination(mappedUrl));
    return;
  }

  const engine = (typeof getStoredSearchEngine === 'function') ? getStoredSearchEngine() : 'google';
  const q = encodeURIComponent(cleaned || raw);
  if (engine === 'ddg') navRoute(`https://duckduckgo.com/?q=${q}`, 'DuckDuckGo Search');
  else if (engine === 'bing') navRoute(`https://www.bing.com/search?q=${q}`, 'Bing Search');
  else navRoute(`https://google.com/search?q=${q}`, 'Google Search');
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

// ---- :reset — wipe all localStorage + caches ----
async function handleResetCommand() {
  const confirmed = await showConfirm(
    'This will clear ALL settings, bookmarks, API keys, themes, syntax colors, favicon cache, command history, and any other stored data.\n\nThe page will reload with factory defaults.',
    { title: 'Reset Everything?', confirmLabel: 'Yes, reset', cancelLabel: 'Cancel' }
  );
  if (!confirmed) return;

  // Clear extension storage (Gemini API key) if available
  try {
    const extStorage = (typeof browser !== 'undefined' && browser?.storage?.local)
      ? browser.storage.local
      : (typeof chrome !== 'undefined' && chrome?.storage?.local)
        ? chrome.storage.local
        : null;
    if (extStorage) extStorage.clear();
  } catch (e) {}

  // Wipe all localStorage
  localStorage.clear();

  showToast('All data cleared — reloading...', 'success', 1500);
  setTimeout(() => location.reload(), 1500);
}

// ---- Command History modal ----
let _historySelectedIndex = -1;

function openHistory() {
  _renderHistoryModal();
  document.getElementById('history-modal').classList.add('active');
  _historySelectedIndex = -1;

  // Keyboard nav within the list
  const modal = document.getElementById('history-modal');
  modal._historyKeydown = (e) => {
    const entries = [...document.querySelectorAll('#history-list .history-entry')];

    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeHistoryModal();
      return;
    }

    if (!entries.length) return;

    const LIST_SCROLL_PAGE = 5; // entries per PgUp/PgDn jump

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      _historySelectedIndex = Math.min(_historySelectedIndex + 1, entries.length - 1);
      if (_historySelectedIndex < 0) _historySelectedIndex = 0;
      entries[_historySelectedIndex].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      _historySelectedIndex = Math.max(_historySelectedIndex - 1, 0);
      entries[_historySelectedIndex].focus();
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      _historySelectedIndex = Math.min(_historySelectedIndex + LIST_SCROLL_PAGE, entries.length - 1);
      if (_historySelectedIndex < 0) _historySelectedIndex = 0;
      entries[_historySelectedIndex].focus();
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      _historySelectedIndex = Math.max(_historySelectedIndex - LIST_SCROLL_PAGE, 0);
      entries[_historySelectedIndex].focus();
    }
  };
  modal.addEventListener('keydown', modal._historyKeydown);

  // Focus first entry if any
  requestAnimationFrame(() => {
    const first = document.querySelector('#history-list .history-entry');
    if (first) { _historySelectedIndex = 0; first.focus(); }
  });
}

function closeHistoryModal() {
  const modal = document.getElementById('history-modal');
  if (modal._historyKeydown) {
    modal.removeEventListener('keydown', modal._historyKeydown);
    delete modal._historyKeydown;
  }
  modal.classList.remove('active');
  document.getElementById('terminal-input')?.focus();
}

function _renderHistoryModal() {
  const h = loadHistory();
  const list = document.getElementById('history-list');
  list.innerHTML = '';

  if (!h.length) {
    list.innerHTML = '<div class="history-empty">No history yet.</div>';
    return;
  }

  // Most-recent first
  [...h].reverse().forEach((entry, i) => {
    const el = document.createElement('div');
    el.className = 'history-entry';
    el.tabIndex = 0;
    el.dataset.entry = entry;
    el.innerHTML =
      `<span class="history-index">${i + 1}</span>` +
      `<span class="history-text">${escapeHTML(entry)}</span>`;

    el.addEventListener('click', () => _fillFromHistory(entry));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); _fillFromHistory(entry); }
    });

    list.appendChild(el);
  });
}

function _fillFromHistory(entry) {
  closeHistoryModal();
  const input = document.getElementById('terminal-input');
  if (input) {
    input.value = entry;
    input.focus();
    if (typeof updateSyntaxHighlight === 'function') updateSyntaxHighlight(entry);
  }
}

function clearHistory() {
  localStorage.removeItem('terminal-history-v1');
  _renderHistoryModal();
  showToast('History cleared', 'success');
}