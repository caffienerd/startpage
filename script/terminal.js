// ========================================
// Terminal — input, autocomplete, keyboard
// ========================================

function initializeBrowserInfo() {
  document.getElementById("username").textContent = getStoredUsername();
  document.getElementById("browser-info").textContent = getBrowser();
}

function typePlaceholder(input, examples, typingSpeed = 50) {
  if (input._typingTimeout) {
    clearTimeout(input._typingTimeout);
    input._typingTimeout = null;
  }
  input.placeholder = "";

  let exampleIndex = 0;
  let charIndex = 0;

  function type() {
    if (charIndex < examples[exampleIndex].length) {
      input.placeholder += examples[exampleIndex].charAt(charIndex++);
      input._typingTimeout = setTimeout(type, typingSpeed);
    } else {
      input._typingTimeout = setTimeout(() => {
        input.placeholder = "";
        charIndex = 0;
        exampleIndex = (exampleIndex + 1) % examples.length;
        type();
      }, 2000);
    }
  }
  type();
}

// ---- Dir syntax highlighter ----
// Returns an HTML string for the hint overlay when value matches a dir pattern,
// or null if not a dir command.
function getDirSyntaxHtml(value) {
  // Match: dir  [/cat]  [/engine]  [: keyword]
  // We highlight progressively as the user types.
  // Tokens: dir=cmd color, /cat=search color, /engine=theme color, :kw=plain
  const dirRe = /^(dir)(\/[a-z]*)?(\/[a-z]*)?(:.*)?$/i;
  const m = value.match(dirRe);
  if (!m) return null;

  const [, base, catSlash, engSlash, colonRest] = m;
  let html = `<span class="syn-dir">${escapeHTML(base)}</span>`;

  if (catSlash !== undefined) {
    const slash = '/';
    const cat = catSlash.slice(1); // remove leading /
    html += `<span class="syn-dir-sep">${slash}</span><span class="syn-dir-cat">${escapeHTML(cat)}</span>`;
  }
  if (engSlash !== undefined) {
    const slash = '/';
    const eng = engSlash.slice(1);
    html += `<span class="syn-dir-sep">${slash}</span><span class="syn-dir-eng">${escapeHTML(eng)}</span>`;
  }
  if (colonRest !== undefined) {
    const colon = colonRest[0]; // ':'
    const kw = colonRest.slice(1);
    html += `<span class="syn-dir-sep">${colon}</span><span class="syn-dir-kw">${escapeHTML(kw)}</span>`;
  }
  return html;
}

// ---- Autocomplete suggestions for dir commands ----
// Returns suggestion string or null
function getDirAutocompleteSuggestion(value) {
  const lower = value.toLowerCase();

  // Suggest 'dir/' when user types 'd', 'di', or 'dir' (no slash yet)
  if (/^di?r?$/.test(lower)) {
    return 'dir/';
  }

  // After 'dir/' — suggest category + colon (e.g. dir/media:)
  const afterDirSlash = lower.match(/^dir\/([a-z]*)$/);
  if (afterDirSlash) {
    const typed = afterDirSlash[1];
    const allOptions = [];
    for (const [key, def] of Object.entries(DIR_CATEGORIES)) {
      allOptions.push(key);
      def.aliases.forEach(a => allOptions.push(a));
    }
    // Exact match (e.g. 'dir/media' → 'dir/media:')
    const exact = allOptions.find(c => c === typed);
    if (exact) return `dir/${exact}:`;
    // Partial match (e.g. 'dir/me' → 'dir/media:')
    const match = allOptions.find(c => c.startsWith(typed) && c !== typed);
    if (match) return `dir/${match}:`;
  }

  // After 'dir/cat/' — suggest engine + colon (e.g. dir/media/ggl:)
  const afterCatSlash = lower.match(/^dir\/([a-z]+)\/([a-z]*)$/);
  if (afterCatSlash) {
    const typedEng = afterCatSlash[2];
    const engines = ['ggl', 'ddg', 'bing'];
    // Exact match (e.g. 'dir/media/ggl' → 'dir/media/ggl:')
    const exact = engines.find(e => e === typedEng);
    if (exact) return `dir/${afterCatSlash[1]}/${exact}:`;
    // Partial match (e.g. 'dir/media/g' → 'dir/media/ggl:')
    const match = engines.find(e => e.startsWith(typedEng) && e !== typedEng);
    if (match) return `dir/${afterCatSlash[1]}/${match}:`;
  }

  // After 'dir//...' (no cat, engine slot)
  const afterDoubleSlash = lower.match(/^dir\/\/([a-z]*)$/);
  if (afterDoubleSlash) {
    const typedEng = afterDoubleSlash[1];
    const engines = ['ggl', 'ddg', 'bing'];
    const exact = engines.find(e => e === typedEng);
    if (exact) return `dir//${exact}:`;
    const match = engines.find(e => e.startsWith(typedEng) && e !== typedEng);
    if (match) return `dir//${match}:`;
  }

  return null;
}

// ---- Build hint HTML for dir ghost-text cases (partial coloring) ----
// Input text will be transparent (input-dir-composing); hint renders everything.
// Completed segments get their token color; partial/incomplete segments get plain text color.
function getDirGhostHintHtml(value, suggestion) {
  const remaining = suggestion.substring(value.length);
  const ghostSpan = remaining ? `<span class="suggestion">${escapeHTML(remaining)}</span>` : '';

  // No slash yet (d, di, dir) — no coloring at all, just hide value + ghost
  if (!value.includes('/')) {
    return `<span style="visibility:hidden">${escapeHTML(value)}</span>${ghostSpan}`;
  }

  // Has colon — delegate to getDirSyntaxHtml for the prefix, plain for keyword
  const colonIdx = value.indexOf(':');
  if (colonIdx !== -1) {
    const prefix = value.slice(0, colonIdx + 1);
    const kw = value.slice(colonIdx + 1);
    return getDirSyntaxHtml(prefix) + `<span class="syn-dir-plain">${escapeHTML(kw)}</span>${ghostSpan}`;
  }

  // Has slash(es), no colon
  const parts = value.split('/');
  // parts[0]='dir', parts[1]=cat (may be empty), parts[2]=eng (may be undefined/empty)

  let html = `<span class="syn-dir">${escapeHTML(parts[0])}</span>`;

  if (parts.length === 2) {
    const catSeg = parts[1];
    if (!catSeg) {
      // 'dir/' — separator done, nothing partial
      html += `<span class="syn-dir-sep">/</span>`;
    } else {
      // 'dir/partial' — cat not yet complete, show as plain
      html += `<span class="syn-dir-plain">/${escapeHTML(catSeg)}</span>`;
    }
  } else if (parts.length >= 3) {
    const catSeg = parts[1];
    const engSeg = parts[2];
    // cat is complete (followed by '/')
    html += `<span class="syn-dir-sep">/</span><span class="syn-dir-cat">${escapeHTML(catSeg)}</span>`;
    if (!engSeg) {
      // 'dir/cat/' — separator done, nothing partial
      html += `<span class="syn-dir-sep">/</span>`;
    } else {
      // 'dir/cat/partial' — engine not yet complete, show as plain
      html += `<span class="syn-dir-plain">/${escapeHTML(engSeg)}</span>`;
    }
  }

  html += ghostSpan;
  return html;
}

// ---- Syntax highlighting + autocomplete ghost ----
function updateSyntaxHighlight(rawValue) {
  const value = rawValue.toLowerCase(); // use for matching only; rawValue for rendering
  const hintEl = document.getElementById('command-hint');
  const input = document.getElementById('terminal-input');

  const suggestions = {
    'r': 'r:',
    'y': 'yt:',
    'a': 'alt:',
    'am': 'amazon:',
    'd': 'dir/',      // dir takes priority over def: — type 'de' for def:
    'de': 'def:',
    'dd': 'ddg:',
    'i': 'imdb:',
    't': 'the:',
    's': 'syn:',
    'q': 'quote:',
    'm': 'maps:',
    'c': 'cws:',
    'g': 'gem:',
    'gg': 'ggl:',
    'ge': 'gemini:',
    'bi': 'bing:',
    'ai': 'ai:',
    'sp': 'spell:',
    'pr': 'pronounce:',
    ':c': ':config',
    ':cu': ':customize',
    ':ta': ':tags',
    ':di': ':dir',
    ':dirc': ':dirconfig',
    ':p': ':prompts',
    ':d': ':dark',
    ':b': ':black',
    ':am': ':amoled',
    ':bm': ':bookmarks',
    ':i': ':ipconfig',
    ':l': ':light',
    ':h': ':help',
    ':ha': ':help_ai_router',
    ':hi': ':history',
    ':to': ':tour',
    ':aim': ':aimode',
    ':ge': ':gemini',
    ':n': ':netspeed',
    ':w': ':weather',
    ':ti': ':time',
    ':ve': ':version',
    ':up': ':update',
    ':ex': ':export',
    ':im': ':import',
    ':re': ':reset',
    ':no': ':nord',
    ':ne': ':newspaper',
    ':co': ':coffee',
    ':ro': ':root',
    ':neo': ':neon'
  };

  // Inject custom tags into suggestions
  const customTags = typeof getStoredCustomTags === 'function' ? getStoredCustomTags() : [];
  customTags.forEach(tag => {
    if (tag.prefix && tag.prefix.length >= 2) {
      suggestions[tag.prefix.slice(0, 2)] = tag.prefix + ':';
    }
  });
  const customTagPrefixes = customTags.map(t => t.prefix).filter(Boolean);

  const themeCommands = [':dark', ':black', ':amoled', ':light', ':nord', ':newspaper', ':coffee', ':root', ':neon'];
  const knownCommands = [':help', ':help_ai_router', ':aimode', ':bookmarks', ':bm', ':ipconfig', ':ip', ':netspeed', ':speed', ':config', ':customize', ':custom', ':tags', ':dir', ':dirconfig', ':prompts', ':weather', ':time', ':gemini', ':update', ':export', ':import', ':reset', ':history', ':tour', ':hacker', ':cyberpunk', ...themeCommands];
  const versionCommands = [':version', ':ver', ':update'];
  const knownSearch = /^(r|yt|alt|def|ddg|ggl|bing|amazon|imdb|the|syn|quote|maps|cws|spell|pronounce|gem|gemini|ai):/;
  const knownSearchDynamic = customTagPrefixes.length
    ? new RegExp(`^(r|yt|alt|def|ddg|ggl|bing|amazon|imdb|the|syn|quote|maps|cws|spell|pronounce|gem|gemini|ai|${customTagPrefixes.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}):`)
    : knownSearch;

  // ---- DIR syntax: only match valid dir patterns (not 'directory', 'dir is broken', etc.) ----
  if (/^di?r?$/.test(value) || /^dir[/:]/.test(value)) {
    const dirSuggest = getDirAutocompleteSuggestion(value);

    if (dirSuggest && dirSuggest !== value) {
      // Has an autocomplete suggestion — show ghost text with partial coloring
      input.setAttribute('data-suggestion', dirSuggest);

      if (value.includes('/')) {
        // Has slash: render partial coloring via hint using rawValue, input text transparent
        hintEl.innerHTML = getDirGhostHintHtml(rawValue, dirSuggest);
        input.className = 'input-dir-composing';
      } else {
        // Just 'd', 'di', 'dir' — no color yet, plain ghost text
        const remaining = dirSuggest.substring(value.length);
        hintEl.innerHTML = `<span style="visibility:hidden">${escapeHTML(rawValue)}</span><span class="suggestion">${escapeHTML(remaining)}</span>`;
        input.className = '';
      }
      return;
    }

    // No suggestion available
    input.removeAttribute('data-suggestion');

    const colonIdx = value.indexOf(':');
    if (colonIdx !== -1) {
      const rawPrefix = rawValue.slice(0, colonIdx + 1);
      const kw = value.slice(colonIdx + 1);
      const isBright = kw.length > 0;

      if (isBright) {
        hintEl.innerHTML = getDirSyntaxHtml(rawPrefix);
        input.className = 'input-dir-active';
      } else {
        hintEl.innerHTML = getDirSyntaxHtml(rawPrefix);
        input.className = 'input-dir-composing';
      }
      return;
    }

    // No colon, no suggestion — partial coloring for whatever is typed
    if (value.includes('/')) {
      hintEl.innerHTML = getDirGhostHintHtml(rawValue, rawValue); // no ghost span
      input.className = 'input-dir-composing';
    } else {
      hintEl.textContent = '';
      input.className = '';
    }
    return;
  }

  // Check for a matching autocomplete suggestion
  for (const [prefix, full] of Object.entries(suggestions)) {
    if (value && full.startsWith(value) && value !== full) {
      input.setAttribute('data-suggestion', full);
      const remaining = full.substring(value.length);
      // Use rawValue (not lowercase) for hidden spacer — exact width match regardless of caps
      hintEl.innerHTML = `<span style="visibility:hidden">${escapeHTML(rawValue)}</span><span class="suggestion">${escapeHTML(remaining)}</span>`;

      if (value.startsWith(':')) {
        if (versionCommands.some(c => c.startsWith(value))) input.className = 'input-version';
        else if (themeCommands.some(c => c.startsWith(value))) input.className = 'input-theme';
        else input.className = 'input-cmd';
      } else if (knownSearchDynamic.test(value)) {
        input.className = 'input-search';
      } else if (value.length > 3 && /[a-z0-9]\.[a-z]+/.test(value) && !value.includes(' ')) {
        input.className = 'input-url';
      } else {
        input.className = '';
      }
      return;
    }
  }

  // No autocomplete — clear hint, color input itself
  input.removeAttribute('data-suggestion');

  // For search prefixes with content after colon: color prefix via hint overlay,
  // leave input class empty so query shows in normal terminal text color.
  // Use rawValue so the hidden spacer matches actual input width regardless of caps.
  const rawPrefixMatch = rawValue.match(/^([^:\s]+:)(.+)$/);
  if (rawPrefixMatch && knownSearchDynamic.test(value)) {
    const [, rawPrefix, rawRest] = rawPrefixMatch;
    hintEl.innerHTML = `<span class="search">${escapeHTML(rawPrefix)}</span><span style="visibility:hidden">${escapeHTML(rawRest)}</span>`;
    input.className = '';
    return;
  }

  hintEl.textContent = '';

  if (value.startsWith(':') && versionCommands.some(c => c === value || c.startsWith(value))) {
    input.className = 'input-version';
  } else if (value.startsWith(':') && themeCommands.some(c => c === value || c.startsWith(value))) {
    input.className = 'input-theme';
  } else if (value.startsWith(':') && knownCommands.some(c => c === value || c.startsWith(value))) {
    input.className = 'input-cmd';
  } else if (value.startsWith(':') && value.length > 1) {
    input.className = 'input-unknown';
  } else if (knownSearchDynamic.test(value)) {
    input.className = 'input-search';
  } else if (value.length > 3 && /[a-z0-9]\.[a-z]+/.test(value) && !value.includes(' ')) {
    input.className = 'input-url';
  } else {
    input.className = '';
  }
}

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getBookmarkTitle(anchor) {
  const label = anchor.querySelector('span');
  return (label ? label.textContent : anchor.textContent || '').trim() || 'Bookmark';
}

function findFirstBookmarkMatch(elements, rawValue) {
  const value = (rawValue || '').trim().toLowerCase();
  if (!value) return null;

  let bestMatch = null;

  for (const el of elements) {
    const title = getBookmarkTitle(el).toLowerCase();

    if (title.startsWith(value)) {
      return {
        href: el.href,
        title: getBookmarkTitle(el),
        element: el
      };
    }

    if (!bestMatch && title.includes(value)) {
      bestMatch = {
        href: el.href,
        title: getBookmarkTitle(el),
        element: el
      };
    }
  }

  return bestMatch;
}

// ---- Input handler (bookmark filtering) ----
function handleInput(input, elements) {
  // Hide the hint overlay once the input scrolls horizontally (prefix would overlap)
  input.addEventListener("scroll", () => {
    const hintEl = document.getElementById('command-hint');
    if (!hintEl) return;
    if (input.scrollLeft > 0) {
      hintEl.style.visibility = 'hidden';
      // If input text was transparent (composing), make it visible so it doesn't disappear
      if (input.classList.contains('input-dir-composing')) {
        input.classList.remove('input-dir-composing');
        input.classList.add('input-dir-active');
      }
    } else {
      hintEl.style.visibility = '';
    }
  });

  input.addEventListener("input", () => {
    // Don't process input while any modal is open
    if (document.querySelector('.config-modal.active, #sp-modal-overlay')) return;

    // Reset hint visibility on each keystroke (scroll resets when text shortens)
    const hintEl = document.getElementById('command-hint');
    if (hintEl) hintEl.style.visibility = '';

    const rawValue = input.value;
    const value = rawValue.toLowerCase();
    updateSyntaxHighlight(rawValue);

    // Re-query live — generateBookmarks() rebuilds the DOM so the static
    // NodeList captured at init time is stale after first render.
    const liveElements = document.querySelectorAll("#bookmarks a");

    // 1. Filter bookmarks (upfront + shelf slot-swap).
    // filterBookmarksWithShelf returns the best match {href, title} or null.
    let bookmarkMatch = null;
    if (typeof filterBookmarksWithShelf === 'function') {
      bookmarkMatch = filterBookmarksWithShelf(rawValue);
    } else {
      // Fallback: plain highlight without shelf
      bookmarkMatch = findFirstBookmarkMatch(liveElements, rawValue);
      liveElements.forEach(el => {
        const title = getBookmarkTitle(el).toLowerCase();
        const href = el.href.toLowerCase();
        if (!rawValue.trim() || rawValue.startsWith(':') || /^dir/i.test(rawValue)) {
          el.parentElement?.classList.remove("bookmark-match", "bookmark-nomatch", "primary-match");
          return;
        }
        const isMatch = title.includes(rawValue.toLowerCase()) || href.includes(rawValue.toLowerCase());
        el.parentElement?.classList.toggle("bookmark-match", isMatch);
        el.parentElement?.classList.toggle("bookmark-nomatch", !isMatch);
      });
      if (bookmarkMatch?.element) {
        bookmarkMatch.element.parentElement?.classList.add("primary-match");
      }
    }

    // 2. Update AI badge / route preview
    if (/^ai\s*:/i.test(rawValue)) {
      const aiQuery = rawValue.replace(/^ai\s*:/i, "").trim();
      previewAiRoute(aiQuery);
    } else if (bookmarkMatch) {
      if (getStoredAiModeEnabled()) {
        showAiRouteBadge(bookmarkMatch.title, rawValue.trim(), 0, 'preview');
      }
    } else {
      hideAiRouteBadge();
    }
  });
}

// ---- Persistent command history (localStorage, max 30 entries) ----
const HISTORY_KEY = 'terminal-history-v1';
const HISTORY_MAX = 30;

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch { return []; }
}

function saveHistory(history) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch {}
}

function pushHistory(entry) {
  if (!entry || !entry.trim()) return;
  const h = loadHistory();
  // Remove duplicate if already exists (move to end)
  const deduped = h.filter(e => e !== entry.trim());
  deduped.push(entry.trim());
  // Keep last 30
  if (deduped.length > HISTORY_MAX) deduped.splice(0, deduped.length - HISTORY_MAX);
  saveHistory(deduped);
}

function handleKeyboardEvents(input, elements) {
  let filteredHistory = [];
  let historyIndex    = -1;
  let historyPrefix   = '';

  function buildFilteredHistory(prefix) {
    const h = loadHistory();
    const reversed = [...h].reverse();
    if (!prefix) return reversed;
    const lp = prefix.toLowerCase();
    return reversed.filter(e => e.toLowerCase().startsWith(lp));
  }

  input.addEventListener("keydown", (e) => {
    const rawValue = input.value;
    const value = rawValue.toLowerCase();

    const activeModal = document.querySelector('.config-modal.active');
    const anyModalOpen = activeModal || document.getElementById('sp-modal-overlay');
    if (activeModal) {
      const content = activeModal.querySelector('.config-content') || activeModal;
      const scrollAmount = 40;
      const pageAmount = 300;
      if (e.key === 'ArrowUp')   { content.scrollTop -= scrollAmount; e.preventDefault(); return; }
      if (e.key === 'ArrowDown') { content.scrollTop += scrollAmount; e.preventDefault(); return; }
      if (e.key === 'PageUp')    { content.scrollTop -= pageAmount;   e.preventDefault(); return; }
      if (e.key === 'PageDown')  { content.scrollTop += pageAmount;   e.preventDefault(); return; }
    }

    if (anyModalOpen) return;

    if ((e.key === "Tab" || e.key === "ArrowRight") && input.hasAttribute('data-suggestion')) {
      e.preventDefault();
      const suggestion = input.getAttribute('data-suggestion');
      input.value = suggestion;
      updateSyntaxHighlight(suggestion);
      input.placeholder = '';
      return;
    }

    if ((e.ctrlKey || e.altKey) && !e.shiftKey && e.key === "Enter") {
      e.preventDefault(); e.stopPropagation();
      const url = resolveUrl(input.value, elements);
      if (url) openInNewTab(url, false);
      return;
    }
    if ((e.ctrlKey || e.altKey) && e.shiftKey && e.key === "Enter") {
      e.preventDefault(); e.stopPropagation();
      const url = resolveUrl(input.value, elements);
      if (url) openInNewTab(url, true);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex === -1) {
        historyPrefix   = input.value;
        filteredHistory = buildFilteredHistory(historyPrefix);
        if (!filteredHistory.length) return;
        historyIndex = 0;
      } else {
        if (historyIndex < filteredHistory.length - 1) historyIndex++;
        else return;
      }
      input.value = filteredHistory[historyIndex];
      updateSyntaxHighlight(input.value);

    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      if (historyIndex > 0) {
        historyIndex--;
        input.value = filteredHistory[historyIndex];
        updateSyntaxHighlight(input.value);
      } else {
        historyIndex    = -1;
        filteredHistory = [];
        input.value     = historyPrefix;
        updateSyntaxHighlight(historyPrefix);
      }

    } else if (e.key === "Enter") {
      handleEnterKey(rawValue, value, elements);
      historyIndex = -1; filteredHistory = []; historyPrefix = '';
    } else {
      if (historyIndex !== -1) { historyIndex = -1; filteredHistory = []; historyPrefix = ''; }
    }
  });
}

// ---- Resolve what URL the current input would navigate to ----
function resolveUrl(rawValue, elements) {
  const value = rawValue.trim().toLowerCase();
  if (!value) return null;

  const isCommand = value.startsWith(':') && !value.match(/^:(gemini)$/);
  if (isCommand) return null;

  // Dir command
  if (/^dir(\/[a-z]*)?(\/[a-z]*)?:/i.test(rawValue)) {
    const parsed = parseDirCommand(rawValue);
    if (parsed?.keyword) return buildDirUrl(parsed.keyword, parsed.category, parsed.engine);
    return null;
  }

  const bookmarkMatch = findFirstBookmarkMatch(elements, rawValue);
  if (bookmarkMatch) return bookmarkMatch.href;

  const enc = (str) => encodeURIComponent(str);
  const strip = (prefix) => rawValue.replace(new RegExp(`^${prefix}`, 'i'), '').trim();

  if (/^yt:/i.test(value))     return `https://www.youtube.com/results?search_query=${enc(strip('yt:'))}`;
  if (/^r:/i.test(value))      return `https://google.com/search?q=site:reddit.com ${enc(strip('r:'))}`;
  if (/^ddg:/i.test(value))    return `https://duckduckgo.com/?q=${enc(strip('ddg:'))}`;
  if (/^bing:/i.test(value))   return `https://www.bing.com/search?q=${enc(strip('bing:'))}`;
  if (/^ggl:/i.test(value))    return `https://www.google.com/search?q=${enc(strip('ggl:'))}`;
  if (/^amazon:/i.test(value)) return `https://www.amazon.com/s?k=${enc(strip('amazon:'))}`;
  if (/^imdb:/i.test(value))   return `https://www.imdb.com/find?q=${enc(strip('imdb:'))}`;
  if (/^alt:/i.test(value))    return `https://alternativeto.net/browse/search/?q=${enc(strip('alt:'))}`;
  if (/^def:/i.test(value))    return `https://onelook.com/?w=${enc(strip('def:'))}`;
  if (/^the:/i.test(value))    return `https://onelook.com/thesaurus/?s=${enc(strip('the:'))}`;
  if (/^syn:/i.test(value))    return `https://onelook.com/?related=1&w=${enc(strip('syn:'))}`;
  if (/^quote:/i.test(value))  return `https://onelook.com/?mentions=1&w=${enc(strip('quote:'))}`;
  if (/^maps:/i.test(value))   return `https://www.google.com/maps/search/${enc(strip('maps:'))}`;
  if (/^cws:/i.test(value)) {
    const q = enc(strip('cws:'));
    return typeof getBrowser === 'function' && getBrowser() === 'firefox'
      ? `https://addons.mozilla.org/en-US/firefox/search/?q=${q}`
      : `https://chromewebstore.google.com/search/${q}`;
  }

  if (rawValue.split('.').length >= 2 && !rawValue.includes(' '))
    return rawValue.startsWith('http') ? rawValue : `https://${rawValue}`;

  const engine = typeof getStoredSearchEngine === 'function' ? getStoredSearchEngine() : 'google';
  const q = enc(rawValue.trim());
  if (engine === 'ddg')  return `https://duckduckgo.com/?q=${q}`;
  if (engine === 'bing') return `https://www.bing.com/search?q=${q}`;
  return `https://google.com/search?q=${q}`;
}

// ---- Open a URL in a new tab (background or focused) ----
function openInNewTab(url, focus) {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ---- Enter key routing ----
function handleEnterKey(rawValue, value, elements) {
  const isSearch = value.match(/^(r|yt|alt|ddg|imdb|def|the|syn|quote|maps|cws|spell|pronounce|gem|gemini|ai):/);
  const isCommand = value.startsWith(':');
  const isDirCmd = /^dir(\/[a-z]*)?(\/[a-z]*)?:/i.test(rawValue);
  const hasTrailingSpace = /\s$/.test(rawValue);

  if (isDirCmd || isSearch || isCommand) {
    handleSpecialCommands(rawValue.trim());
    pushHistory(rawValue.trim());
    return;
  }

  if (hasTrailingSpace && /[a-z0-9]\.[a-z]+/i.test(rawValue.trim()) && !rawValue.trim().includes(' ')) {
    const q = encodeURIComponent(rawValue.trim());
    const engine = typeof getStoredSearchEngine === 'function' ? getStoredSearchEngine() : 'google';
    if (engine === 'ddg') navigate(`https://duckduckgo.com/?q=${q}`);
    else if (engine === 'bing') navigate(`https://www.bing.com/search?q=${q}`);
    else navigate(`https://google.com/search?q=${q}`);
    pushHistory(rawValue.trim());
    return;
  }

  const bookmarkMatch = findFirstBookmarkMatch(document.querySelectorAll("#bookmarks a"), rawValue);
  let matched = false;
  if (bookmarkMatch) {
    matched = true;
    const goToBookmark = (href) => {
      if (typeof showLoading === 'function') showLoading();
      window.location.href = href;
    };
    if (getStoredAiModeEnabled()) {
      showAiRouteBadge(bookmarkMatch.title, rawValue.trim(), AI_ROUTE_BADGE_NAV_DELAY_MS).then(() => {
        goToBookmark(bookmarkMatch.href);
      });
    } else {
      goToBookmark(bookmarkMatch.href);
    }
  }

  if (!matched && getStoredAiModeEnabled() && rawValue.trim()) {
    routeSemanticIntent(rawValue.trim());
  } else if (!matched) {
    handleSpecialCommands(rawValue.trim());
  }
  pushHistory(rawValue.trim());
}

// ---- Initialize terminal ----
function initializeTerminal() {
  const input = document.getElementById("terminal-input");
  const elements = document.querySelectorAll("#bookmarks a");

  initializeBrowserInfo();
  typePlaceholder(input, typeof getActivePrompts === 'function' ? getActivePrompts() : [
    "search anything...",
    ":help → commands",
    ":config → settings",
  ]);

  if (!input._listenersAttached) {
    handleInput(input, elements);
    handleKeyboardEvents(input, elements);
    input._listenersAttached = true;
  }

  resetStyles(elements);
  input.focus();
}