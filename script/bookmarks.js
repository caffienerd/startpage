// ========================================
// Favicon helper
// ========================================
const FAVICON_PROBE_TIMEOUT_MS = 8000;
const FAVICON_CACHE_KEY = 'favicon-resolved-v1';
const FAVICON_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// In-memory cache (hydrated from localStorage on load)
const _faviconMemCache = {};

(function _hydrateFaviconCache() {
  try {
    const raw = localStorage.getItem(FAVICON_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const now = Date.now();
    for (const [key, entry] of Object.entries(parsed)) {
      if (entry && typeof entry === 'object' && now - entry.ts < FAVICON_CACHE_TTL_MS) {
        _faviconMemCache[key] = entry.src;
      }
    }
  } catch {}
})();

function _persistFaviconCache() {
  try {
    const now = Date.now();
    const out = {};
    for (const [key, src] of Object.entries(_faviconMemCache)) {
      out[key] = { src, ts: now };
    }
    localStorage.setItem(FAVICON_CACHE_KEY, JSON.stringify(out));
  } catch {}
}

function getFaviconSources(url) {
  try {
    const domain = new URL(url).hostname;
    return [
      `https://${domain}/apple-touch-icon.png`,
      `https://${domain}/favicon.ico`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      `https://api.faviconkit.com/${domain}/256`,
      `https://icon.horse/icon/${domain}`,
      `https://geticon.io/img?url=${domain}&size=128`,
      `https://favicon.im/${domain}?larger=true`,
    ];
  } catch {
    return [];
  }
}

function _probeIcon(src) {
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    const timer = setTimeout(() => finish(false), FAVICON_PROBE_TIMEOUT_MS);
    img.onload = () => { clearTimeout(timer); finish(img.naturalWidth > 0); };
    img.onerror = () => { clearTimeout(timer); finish(false); };
    img.src = src;
  });
}

/**
 * Fires all probes in parallel. First source to respond successfully wins
 * (fastest wins). Result is cached in localStorage for 7 days so subsequent
 * page loads are instant.
 */
async function _loadFavicon(displayImg, domain, urls) {
  // Serve from cache instantly
  if (domain in _faviconMemCache) {
    const cached = _faviconMemCache[domain];
    if (cached) displayImg.src = cached;
    else displayImg.style.display = 'none';
    return;
  }

  if (!urls.length) { displayImg.style.display = 'none'; return; }

  // Race all probes — fastest successful source wins
  const result = await new Promise((resolve) => {
    let pending = urls.length;
    let won = false;
    urls.forEach((src) => {
      _probeIcon(src).then((ok) => {
        pending--;
        if (ok && !won) { won = true; resolve(src); }
        else if (pending === 0 && !won) { resolve(null); }
      });
    });
  });

  _faviconMemCache[domain] = result;
  _persistFaviconCache();

  if (result) displayImg.src = result;
  else displayImg.style.display = 'none';
}



const ITEMS_PER_SECTION = 5;

// ========================================
// Generate bookmark grid
// ========================================
function generateBookmarks() {
  const container = document.getElementById('bookmarks');
  container.innerHTML = '';

  const bookmarks = getStoredBookmarks();
  const numSections = Math.ceil(bookmarks.length / ITEMS_PER_SECTION);

  for (let i = 0; i < numSections; i++) {
    const section = document.createElement('div');
    section.className = 'bookmark-section';
    const ul = document.createElement('ul');

    const slice = bookmarks.slice(i * ITEMS_PER_SECTION, (i + 1) * ITEMS_PER_SECTION);
    slice.forEach(bookmark => {
      if (!bookmark.href || !bookmark.title) return;

      const li = document.createElement('li');
      let domain = '';
      try { domain = new URL(bookmark.href).hostname; } catch {}
      const sources = getFaviconSources(bookmark.href);

      li.innerHTML = `
        <a href="${bookmark.href}" class="bookmark-link">
          <img alt="${bookmark.title}" class="bookmark-icon">
          <span>${bookmark.title}</span>
        </a>`;

      const img = li.querySelector('img');
      _loadFavicon(img, domain, sources);

      ul.appendChild(li);
    });

    section.appendChild(ul);
    container.appendChild(section);
  }
}

// ========================================
// Reset bookmark highlight styles
// ========================================
function resetStyles(elements) {
  elements.forEach(el => {
    el.classList.remove("bookmark-match", "bookmark-nomatch", "primary-match");
    el.style.mixBlendMode = "";
  });
}