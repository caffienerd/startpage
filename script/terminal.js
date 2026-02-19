// ========================================
// Terminal — input, autocomplete, keyboard
// ========================================

function initializeBrowserInfo() {
  document.getElementById("username").textContent     = getStoredUsername();
  document.getElementById("browser-info").textContent = getBrowser();
}

function typePlaceholder(input, examples, typingSpeed = 50) {
  if (input._typingTimeout) {
    clearTimeout(input._typingTimeout);
    input._typingTimeout = null;
  }
  input.placeholder = "";

  let exampleIndex = 0;
  let charIndex    = 0;

  function type() {
    if (charIndex < examples[exampleIndex].length) {
      input.placeholder += examples[exampleIndex].charAt(charIndex++);
      input._typingTimeout = setTimeout(type, typingSpeed);
    } else {
      input._typingTimeout = setTimeout(() => {
        input.placeholder = "";
        charIndex    = 0;
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
  const input  = document.getElementById('terminal-input');

  const suggestions = {
    'r':   'r:',
    'y':   'yt:',
    'a':   'alt:',
    'd':   'def:',
    'dd':  'ddg:',
    'i':   'imdb:',
    't':   'the:',
    's':   'syn:',
    'q':   'quote:',
    'm':   'maps:',
    'c':   'cws:',
    'g':   'gem:',
    'ge':  'gemini:',
    'ai':  'ai:',
    'sp':  'spell:',
    ':c':  ':config',
    ':d':  ':dark',
    ':i':  ':ipconfig',
    ':l':  ':light',
    ':h':  ':help',
    ':ge': ':gemini',
    ':n':  ':netspeed',
    ':w':  ':weather',
    ':ti': ':time',
    ':ve': ':version'
  };

  const knownCommands = [':help',':ipconfig',':ip',':netspeed',':speed',':config',':weather',':time',':dark',':light',':gemini'];
  const versionCommands = [':version',':ver'];
  const knownSearch   = /^(r|yt|alt|def|ddg|imdb|the|syn|quote|maps|cws|spell|gem|gemini|ai):/;

  // Check for a matching autocomplete suggestion
  for (const [prefix, full] of Object.entries(suggestions)) {
    if (value && full.startsWith(value) && value !== full) {
      input.setAttribute('data-suggestion', full);
      const remaining = full.substring(value.length);
      // Ghost text only AHEAD — invisible spacer keeps alignment
      hintEl.innerHTML = `<span style="visibility:hidden">${escapeHTML(value)}</span><span class="suggestion">${escapeHTML(remaining)}</span>`;
      input.className = value.startsWith(':') ? (versionCommands.some(c => c.startsWith(value)) ? 'input-version' : 'input-cmd') : (knownSearch.test(value) ? 'input-search' : '');
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
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ---- Input handler (bookmark filtering) ----
function handleInput(input, elements) {
  input.addEventListener("input", () => {
    const rawValue = input.value;
    const value = rawValue.toLowerCase();
    updateSyntaxHighlight(value);

    if (value === "" || value.match(/^(r|yt|alt|ddg|imdb|def|the|syn|quote|maps|cws|spell|gem|gemini|ai):/)) {
      resetStyles(elements);
      return;
    }

    elements.forEach(el => {
      const isMatch = el.textContent.toLowerCase().includes(value.replace(/^:/, ""));
      el.classList.toggle("bookmark-match",   isMatch);
      el.classList.toggle("bookmark-nomatch", !isMatch);
    });
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

    // Ctrl+C clears
    if (e.ctrlKey && e.key === "c") {
      e.preventDefault();
      input.value = "";
      resetStyles(elements);
      updateSyntaxHighlight("");
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

// ---- Enter key routing ----
function handleEnterKey(rawValue, value, elements, history) {
  const isSearch  = value.match(/^(r|yt|alt|ddg|imdb|def|the|syn|quote|maps|cws|spell|gem|gemini|ai):/);
  const isCommand = value.startsWith(':');

  if (isSearch || isCommand) {
    handleSpecialCommands(rawValue.trim());
    if (rawValue.trim()) history.push(rawValue.trim());
    return;
  }

  // Try bookmark first
  let matched = false;
  elements.forEach(el => {
    if (value && el.textContent.toLowerCase().includes(value)) {
      window.location.href = el.href;
      matched = true;
    }
  });

  if (!matched) handleSpecialCommands(rawValue.trim());
  if (rawValue.trim()) history.push(rawValue.trim());
}

// ---- Initialize terminal ----
function initializeTerminal() {
  const input = document.getElementById("terminal-input");
  const examples = [
    "search anything...",
    ":help → commands",
    ":config → settings",
    "yt:query → youtube",
    "maps:location → google maps",
  ];
  const elements = document.querySelectorAll("a");

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
