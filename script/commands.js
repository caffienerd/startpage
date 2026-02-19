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

function handleSpecialCommands(value) {
  const rawValue = value.trim();
  const normalized = rawValue.toLowerCase();
  const input    = document.getElementById('terminal-input');
  const elements = document.querySelectorAll("a");

  const clear = () => {
    input.value = '';
    resetStyles(elements);
    updateSyntaxHighlight("");
  };

  // ---- Modal commands ----
  if (normalized === ":help")                         { openHelp();      clear(); return; }
  if (normalized === ":version" || normalized === ":ver")  { openVersion();   clear(); return; }
  if (normalized === ":ipconfig" || normalized === ":ip")  { openIPInfo();    clear(); return; }
  if (normalized === ":netspeed"  || normalized === ":speed") { openSpeedTest(); clear(); return; }
  if (normalized === ":gemini")                       { window.location.href = "https://gemini.google.com/app"; return; }
  if (normalized === ":config" || normalized === ":weather" || normalized === ":time") { openConfig(); clear(); return; }

  // ---- Theme ----
  if (normalized === ":dark")  { document.body.classList.add('dark-mode');    saveTheme('dark');  clear(); return; }
  if (normalized === ":light") { document.body.classList.remove('dark-mode'); saveTheme('light'); clear(); return; }

  // ---- Spell check ----
  if (/^spell\s*:/i.test(rawValue)) {
    const query = rawValue.replace(/^spell\s*:/i, "").trim();
    if (query) { handleSpellCheck(query); clear(); }
    return;
  }

  // ---- Gemini AI ----
  if (/^(gem|gemini|ai)\s*:/i.test(rawValue)) {
    const query = rawValue.replace(/^(gem|gemini|ai)\s*:/i, "").trim();
    if (query) {
      handleGeminiPrompt(query);
      clear();
    }
    return;
  }

  // ---- Search shortcuts ----
  if (/^yt:/i.test(rawValue))    { window.location.href = `https://www.youtube.com/results?search_query=${enc(rawValue, "yt:")}`;             return; }
  if (/^r:/i.test(rawValue))     { window.location.href = `https://google.com/search?q=site:reddit.com ${rawValue.replace(/^r:/i, "")}`;       return; }
  if (/^ddg:/i.test(rawValue))   { window.location.href = `https://duckduckgo.com/?q=${enc(rawValue, "ddg:")}`;                               return; }
  if (/^imdb:/i.test(rawValue))  { window.location.href = `https://www.imdb.com/find?q=${enc(rawValue, "imdb:")}`;                            return; }
  if (/^alt:/i.test(rawValue))   { window.location.href = `https://alternativeto.net/browse/search/?q=${enc(rawValue, "alt:")}`;              return; }
  if (/^def:/i.test(rawValue))   { window.location.href = `https://onelook.com/?w=${enc(rawValue, "def:")}`;                                  return; }
  if (/^the:/i.test(rawValue))   { window.location.href = `https://onelook.com/thesaurus/?s=${enc(rawValue, "the:")}`;                        return; }
  if (/^syn:/i.test(rawValue))   { window.location.href = `https://onelook.com/?related=1&w=${enc(rawValue, "syn:")}`;                        return; }
  if (/^quote:/i.test(rawValue)) { window.location.href = `https://onelook.com/?mentions=1&w=${enc(rawValue, "quote:")}`;                     return; }
  if (/^maps:/i.test(rawValue))  { window.location.href = `https://www.google.com/maps/search/${enc(rawValue, "maps:")}`;                     return; }
  if (/^cws:/i.test(rawValue))   {
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
