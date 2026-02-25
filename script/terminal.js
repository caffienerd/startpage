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

// ---- Syntax highlighting + autocomplete ghost ----
function updateSyntaxHighlight(value) {
  const hintEl = document.getElementById('command-hint');
  const input = document.getElementById('terminal-input');

  const suggestions = {
    'r': 'r:',
    'y': 'yt:',
    'a': 'alt:',
    'd': 'def:',
    'dd': 'ddg:',
    'i': 'imdb:',
    't': 'the:',
    's': 'syn:',
    'q': 'quote:',
    'm': 'maps:',
    'c': 'cws:',
    'g': 'gem:',
    'ge': 'gemini:',
    'ai': 'ai:',
    'sp': 'spell:',
    ':c': ':config',
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
    ':no': ':nord',
    ':ne': ':newspaper',
    ':co': ':coffee',
    ':ro': ':root',
    ':neo': ':neon'
  };

  const themeCommands = [':dark', ':black', ':amoled', ':light', ':nord', ':newspaper', ':coffee', ':root', ':neon'];
  const knownCommands = [':help', ':help_ai_router', ':aimode', ':bookmarks', ':bm', ':ipconfig', ':ip', ':netspeed', ':speed', ':config', ':weather', ':time', ':gemini', ':hacker', ':cyberpunk', ...themeCommands];
  const versionCommands = [':version', ':ver'];
  const knownSearch = /^(r|yt|alt|def|ddg|imdb|the|syn|quote|maps|cws|spell|gem|gemini|ai):/;

  // Check for a matching autocomplete suggestion
  for (const [prefix, full] of Object.entries(suggestions)) {
    if (value && full.startsWith(value) && value !== full) {
      input.setAttribute('data-suggestion', full);
      const remaining = full.substring(value.length);
      // Ghost text only AHEAD — invisible spacer keeps alignment
      hintEl.innerHTML = `<span style="visibility:hidden">${escapeHTML(value)}</span><span class="suggestion">${escapeHTML(remaining)}</span>`;

      if (value.startsWith(':')) {
        if (versionCommands.some(c => c.startsWith(value))) input.className = 'input-version';
        else if (themeCommands.some(c => c.startsWith(value))) input.className = 'input-theme';
        else input.className = 'input-cmd';
      } else if (knownSearch.test(value)) {
        input.className = 'input-search';
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
  if (searchMatch && knownSearch.test(value)) {
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
  } else if (knownSearch.test(value)) {
    // prefix only, no text yet — color it
    input.className = 'input-search';
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

    // Priority 1: Exact/Prefix match
    if (title.startsWith(value)) {
      return {
        href: el.href,
        title: getBookmarkTitle(el),
        element: el
      };
    }

    // Priority 2: Contains match (save the first one found as fallback)
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
    } else if (getStoredAiModeEnabled() && rawValue.trim() && !rawValue.startsWith(':') && !value.match(/^(r|yt|alt|ddg|imdb|def|the|syn|quote|maps|cws|spell|gem|gemini):/)) {
      previewAiRoute(rawValue.trim());
    } else {
      hideAiRouteBadge();
    }

    // 3. Reset styles if input is empty or a special search
    if (value === "" || value.match(/^(r|yt|alt|ddg|imdb|def|the|syn|quote|maps|cws|spell|gem|gemini|ai):/)) {
      resetStyles(elements);
      return;
    }

    // 4. Update bookmark visibility and highlighting
    elements.forEach(el => {
      const isMatch = el.textContent.toLowerCase().includes(value.replace(/^:/, ""));
      el.classList.toggle("bookmark-match", isMatch);
      el.classList.toggle("bookmark-nomatch", !isMatch);
      // Mark the primary match (the one that Enter will trigger)
      el.classList.toggle("primary-match", bookmarkMatch && el === bookmarkMatch.element);
    });
  });

  input.addEventListener("scroll", () => {
    const hintEl = document.getElementById('command-hint');
    if (hintEl) hintEl.scrollLeft = input.scrollLeft;
  });

  input.addEventListener("blur", () => {
    if (input.value === "") resetStyles(elements);
  });
}

// ---- Keyboard events (history, Tab, Enter) ----
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
      updateSyntaxHighlight(suggestion);
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

  // Skip pure commands (:config, :dark, etc.) — nothing to open in a tab
  const isCommand = value.startsWith(':') && !value.match(/^:(gemini)$/);
  if (isCommand) return null;

  // Bookmark match takes priority
  const bookmarkMatch = findFirstBookmarkMatch(elements, rawValue);
  if (bookmarkMatch) return bookmarkMatch.href;

  // Search prefixes — mirror commands.js logic but return URL instead of navigating
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

  // Direct URL
  if (rawValue.split('.').length >= 2 && !rawValue.includes(' '))
    return rawValue.startsWith('http') ? rawValue : `https://${rawValue}`;

  // Plain text — default search engine
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
  // For focused tab, browser will naturally focus it on click
  // (window.open().focus() is what gets blocked, anchor click is not)
}

// ---- Enter key routing ----
function handleEnterKey(rawValue, value, elements, history) {
  const isSearch = value.match(/^(r|yt|alt|ddg|imdb|def|the|syn|quote|maps|cws|spell|gem|gemini|ai):/);
  const isCommand = value.startsWith(':');

  if (isSearch || isCommand) {
    handleSpecialCommands(rawValue.trim());
    if (rawValue.trim()) history.push(rawValue.trim());
    return;
  }

  // Try bookmark first
  const bookmarkMatch = findFirstBookmarkMatch(elements, rawValue);
  let matched = false;
  if (bookmarkMatch) {
    matched = true;
    if (getStoredAiModeEnabled()) {
      showAiRouteBadge(bookmarkMatch.title, rawValue.trim(), AI_ROUTE_BADGE_NAV_DELAY_MS).then(() => {
        window.location.href = bookmarkMatch.href;
      });
    } else {
      window.location.href = bookmarkMatch.href;
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
  const examples = [
    "search anything...",
    ":help → commands",
    ":config → settings",
    "ai:directions to home → maps",
    ":aimode → toggle no-prefix AI routing",
    "yt:query → youtube",
    "maps:location → google maps",
  ];
  const elements = document.querySelectorAll("#bookmarks a");

  initializeBrowserInfo();
  typePlaceholder(input, examples);

  if (!input._listenersAttached) {
    handleInput(input, elements);
    handleKeyboardEvents(input, elements);
    input._listenersAttached = true;
  }

  resetStyles(elements);
  input.focus();
}