// ========================================
// Terminal — input, autocomplete, keyboard
// ========================================

// ========================================
// Reset bookmark highlight styles
// ========================================
function resetStyles(elements) {
  elements.forEach(el => {
    el.classList.remove("bookmark-match", "bookmark-nomatch", "primary-match");
    el.style.mixBlendMode = "";
  });
}

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

  // Suggest 'dir:' when user types 'd' or 'di', 'dir/' when they type 'dir'
  if ((lower === 'd' || lower === 'di') && 'dir:'.startsWith(lower)) return 'dir:';
  if (lower === 'dir') return 'dir/';

  // After 'dir/' — suggest categories
  const afterDirSlash = lower.match(/^dir\/([a-z]*)$/);
  if (afterDirSlash) {
    const typed = afterDirSlash[1];
    const allOptions = [];
    for (const [key, def] of Object.entries(DIR_CATEGORIES)) {
      allOptions.push(key);
      def.aliases.forEach(a => allOptions.push(a));
    }
    // If typed exactly matches a valid category, suggest the trailing slash
    if (typed && allOptions.includes(typed)) return `dir/${typed}/`;
    // Otherwise suggest first prefix match
    const match = allOptions.find(c => c.startsWith(typed) && c !== typed);
    if (match) return `dir/${match}/`;
  }

  // After 'dir/cat/' — suggest engines
  const afterCatSlash = lower.match(/^dir\/([a-z]+)\/([a-z]*)$/);
  if (afterCatSlash) {
    const typedEng = afterCatSlash[2];
    const engines = ['ggl', 'ddg', 'bing'];
    const match = engines.find(e => e.startsWith(typedEng) && e !== typedEng);
    if (match) return `dir/${afterCatSlash[1]}/${match}:`;
  }

  // After 'dir//...' (no cat, engine slot)
  const afterDoubleSlash = lower.match(/^dir\/\/([a-z]*)$/);
  if (afterDoubleSlash) {
    const typedEng = afterDoubleSlash[1];
    const engines = ['ggl', 'ddg', 'bing'];
    const match = engines.find(e => e.startsWith(typedEng) && e !== typedEng);
    if (match) return `dir//${match}:`;
  }

  return null;
}

// ---- Syntax highlighting + autocomplete ghost ----
function updateSyntaxHighlight(value) {
  const hintEl = document.getElementById('command-hint');
  const input = document.getElementById('terminal-input');

  const suggestions = {
    'r': 'r:',
    'y': 'yt:',
    'a': 'alt:',
    'am': 'amazon:',
    'd': 'dir:',      // dir takes priority over def: — type 'de' for def:
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
    ':aim': ':aimode',
    ':ge': ':gemini',
    ':n': ':netspeed',
    ':w': ':weather',
    ':ti': ':time',
    ':ve': ':version',
    ':ex': ':export',
    ':im': ':import',
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
  const knownCommands = [':help', ':help_ai_router', ':aimode', ':bookmarks', ':bm', ':ipconfig', ':ip', ':netspeed', ':speed', ':config', ':customize', ':custom', ':tags', ':dir', ':dirconfig', ':prompts', ':export', ':import', ':weather', ':time', ':gemini', ':hacker', ':cyberpunk', ...themeCommands];
  const versionCommands = [':version', ':ver', ':export', ':import'];
  const knownSearch = /^(r|yt|alt|def|ddg|ggl|bing|amazon|imdb|the|syn|quote|maps|cws|spell|gem|gemini|ai):/;
  const knownSearchDynamic = customTagPrefixes.length
    ? new RegExp(`^(r|yt|alt|def|ddg|ggl|bing|amazon|imdb|the|syn|quote|maps|cws|spell|gem|gemini|ai|${customTagPrefixes.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}):`)
    : knownSearch;

  // ---- DIR syntax: check first before generic suggestions ----
  if (/^dir/i.test(value)) {
    // Check for a dir-specific autocomplete suggestion
    const dirSuggest = getDirAutocompleteSuggestion(value);
    if (dirSuggest && dirSuggest !== value) {
      input.setAttribute('data-suggestion', dirSuggest);
      const remaining = dirSuggest.substring(value.length);
      const dirHtml = getDirSyntaxHtml(value);
      hintEl.innerHTML = `<span style="visibility:hidden">${escapeHTML(value)}</span><span class="suggestion">${escapeHTML(remaining)}</span>`;
      input.className = 'input-dir';
      return;
    }

    // Completed dir command (has colon) — render full syntax highlight
    if (/^dir(\/[a-z]*)?(\/[a-z]*)?:/i.test(value)) {
      input.removeAttribute('data-suggestion');
      const dirHtml = getDirSyntaxHtml(value);
      if (dirHtml) {
        // Use hint overlay for colorized prefix, hide actual input text via transparent color
        const colonIdx = value.indexOf(':');
        const prefix = value.slice(0, colonIdx + 1);
        const rest = value.slice(colonIdx + 1);
        const prefixHtml = getDirSyntaxHtml(prefix + ' ').replace(/<span class="syn-dir-kw">.*<\/span>/, '');
        hintEl.innerHTML = `${getDirSyntaxHtml(prefix)}<span style="visibility:hidden">${escapeHTML(rest)}</span>`;
        input.className = 'input-dir-active';
        return;
      }
    }

    // Partial dir (no colon yet)
    input.removeAttribute('data-suggestion');
    hintEl.textContent = '';
    input.className = 'input-dir';
    return;
  }

  // Check for a matching autocomplete suggestion
  for (const [prefix, full] of Object.entries(suggestions)) {
    if (value && full.startsWith(value) && value !== full) {
      input.setAttribute('data-suggestion', full);
      const remaining = full.substring(value.length);
      hintEl.innerHTML = `<span style="visibility:hidden">${escapeHTML(value)}</span><span class="suggestion">${escapeHTML(remaining)}</span>`;

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

  // For search prefixes with content after colon: show colored prefix in hint, white input
  const searchMatch = value.match(/^([a-z]+:)(.+)$/);
  if (searchMatch && knownSearchDynamic.test(value)) {
    const [, prefix, rest] = searchMatch;
    hintEl.innerHTML = `<span class="search">${escapeHTML(prefix)}</span><span style="visibility:hidden">${escapeHTML(rest)}</span>`;
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
  input.addEventListener("input", () => {
    const rawValue = input.value;
    const value = rawValue.toLowerCase();
    updateSyntaxHighlight(value);

    // 1. Determine the best bookmark match
    const bookmarkMatch = findFirstBookmarkMatch(elements, rawValue);

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

    // 3. Highlight bookmarks
    elements.forEach(el => {
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
  });
}

function handleKeyboardEvents(input, elements) {
  const history = [];
  let historyIndex = -1;

  input.addEventListener("keydown", (e) => {
    const rawValue = input.value;
    const value = rawValue.toLowerCase();

    // Handle keyboard scrolling for active modals
    const activeModal = document.querySelector('.config-modal.active');
    if (activeModal) {
      const content = activeModal.querySelector('.config-content') || activeModal;
      const scrollAmount = 40;
      const pageAmount = 300;

      if (e.key === 'ArrowUp') {
        content.scrollTop -= scrollAmount;
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowDown') {
        content.scrollTop += scrollAmount;
        e.preventDefault();
        return;
      }
      if (e.key === 'PageUp') {
        content.scrollTop -= pageAmount;
        e.preventDefault();
        return;
      }
      if (e.key === 'PageDown') {
        content.scrollTop += pageAmount;
        e.preventDefault();
        return;
      }
    }

    // Tab / → accepts autocomplete suggestion
    if ((e.key === "Tab" || e.key === "ArrowRight") && input.hasAttribute('data-suggestion')) {
      e.preventDefault();
      const suggestion = input.getAttribute('data-suggestion');
      input.value = suggestion;
      updateSyntaxHighlight(suggestion.toLowerCase());
      input.removeAttribute('data-suggestion');
      input.placeholder = '';
      return;
    }

    // Ctrl+Enter or Alt+Enter — open in new background tab
    if ((e.ctrlKey || e.altKey) && !e.shiftKey && e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      const url = resolveUrl(input.value, elements);
      if (url) openInNewTab(url, false);
      return;
    }
    // Ctrl+Shift+Enter or Alt+Shift+Enter — open in new focused tab
    if ((e.ctrlKey || e.altKey) && e.shiftKey && e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      const url = resolveUrl(input.value, elements);
      if (url) openInNewTab(url, true);
      return;
    }

    // History
    if (e.key === "ArrowUp" && historyIndex > 0) {
      e.preventDefault();
      input.value = history[--historyIndex];
      updateSyntaxHighlight(input.value.toLowerCase());
    } else if (e.key === "ArrowDown" && historyIndex < history.length - 1) {
      e.preventDefault();
      input.value = history[++historyIndex];
      updateSyntaxHighlight(input.value.toLowerCase());
    } else if (e.key === "Enter") {
      handleEnterKey(rawValue, value, elements, history);
      historyIndex = history.length;
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
function handleEnterKey(rawValue, value, elements, history) {
  const isSearch = value.match(/^(r|yt|alt|ddg|imdb|def|the|syn|quote|maps|cws|spell|gem|gemini|ai):/);
  const isCommand = value.startsWith(':');
  const isDirCmd = /^dir(\/[a-z]*)?(\/[a-z]*)?:/i.test(rawValue);
  const hasTrailingSpace = /\s$/.test(rawValue);

  if (isDirCmd || isSearch || isCommand) {
    handleSpecialCommands(rawValue.trim());
    if (rawValue.trim()) history.push(rawValue.trim());
    return;
  }

  if (hasTrailingSpace && /[a-z0-9]\.[a-z]+/i.test(rawValue.trim()) && !rawValue.trim().includes(' ')) {
    const q = encodeURIComponent(rawValue.trim());
    const engine = typeof getStoredSearchEngine === 'function' ? getStoredSearchEngine() : 'google';
    if (engine === 'ddg') navigate(`https://duckduckgo.com/?q=${q}`);
    else if (engine === 'bing') navigate(`https://www.bing.com/search?q=${q}`);
    else navigate(`https://google.com/search?q=${q}`);
    if (rawValue.trim()) history.push(rawValue.trim());
    return;
  }

  const bookmarkMatch = findFirstBookmarkMatch(elements, rawValue);
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
  if (rawValue.trim()) history.push(rawValue.trim());
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