// ========================================
// Favicon helper
// ========================================
const FAVICON_PROBE_TIMEOUT_MS = 6000;
const FAVICON_CACHE_KEY = 'favicon-resolved-v1';
const FAVICON_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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

// ---- Strip subdomains to get root domain ----
// gemini.google.com → google.com
// deepsite.hf.co    → hf.co
// pages.dev subdomain → pages.dev
function _rootDomain(hostname) {
  const parts = hostname.split('.');
  return parts.length > 2 ? parts.slice(-2).join('.') : hostname;
}

// ---- Build candidate list ----
// Returns array of [url, minNaturalWidth].
// Strategy:
//   Tier 1 (parallel race)  — fast, reliable services
//   Tier 2 (sequential)     — direct domain probing, only if Tier 1 fails
function _buildSources(hostname) {
  const root  = _rootDomain(hostname);
  const isSub = root !== hostname;

  // Tier 1 — aggregator services.
  // DDG is first: excellent coverage, fast CDN, returns a clean icon or times out — never a misleading placeholder.
  // favicon.im is second: 404s cleanly for unknown domains.
  // icon.horse is third: broad fallback.
  // Google S2 is intentionally LAST in tier 1 — it redirects to faviconV2 which 404s
  // for uncrawled domains and pollutes the console with noise.
  const tier1 = [
    [`https://icons.duckduckgo.com/ip3/${hostname}.ico`,   16],
    [`https://favicon.im/${hostname}?larger=true`,          16],
    [`https://icon.horse/icon/${hostname}`,                 16],
    [`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`, 16],
  ];

  // For subdomains, also probe the root domain via the same services
  if (isSub) {
    tier1.push(
      [`https://icons.duckduckgo.com/ip3/${root}.ico`,   16],
      [`https://favicon.im/${root}?larger=true`,          16],
      [`https://icon.horse/icon/${root}`,                 16],
      [`https://www.google.com/s2/favicons?domain=${root}&sz=32`, 16],
    );
  }

  // Tier 2 — direct domain probing.
  // Require ≥20px to avoid accepting a 16px default grey-icon placeholder.
  const tier2 = [
    [`https://${hostname}/apple-touch-icon.png`, 20],
    [`https://${hostname}/favicon.ico`,          20],
  ];
  if (isSub) {
    tier2.push(
      [`https://${root}/apple-touch-icon.png`, 20],
      [`https://${root}/favicon.ico`,          20],
    );
  }

  // Tier 3 — last resort scrapers
  const tier3 = [
    [`https://geticon.io/img?url=${hostname}&size=128`, 16],
    [`https://api.faviconkit.com/${hostname}/256`,       16],
  ];

  return { tier1, tier2, tier3 };
}

// ---- Probe a single URL ----
function _probeIcon(src, minSize) {
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const finish = (w) => { if (!settled) { settled = true; resolve(w); } };
    const timer = setTimeout(() => finish(0), FAVICON_PROBE_TIMEOUT_MS);
    img.onload  = () => { clearTimeout(timer); finish(img.naturalWidth >= minSize ? img.naturalWidth : 0); };
    img.onerror = () => { clearTimeout(timer); finish(0); };
    img.src = src;
  });
}

// ---- Race a tier — returns first winner URL or null ----
async function _raceTier(sources) {
  if (!sources.length) return null;
  return new Promise((resolve) => {
    let remaining = sources.length;
    let won = false;
    for (const [src, minSize] of sources) {
      _probeIcon(src, minSize).then((w) => {
        remaining--;
        if (w > 0 && !won) { won = true; resolve(src); }
        else if (remaining === 0 && !won) { resolve(null); }
      });
    }
  });
}

// ---- Sequential tier fallback ----
async function _probeSequential(sources) {
  for (const [src, minSize] of sources) {
    const w = await _probeIcon(src, minSize);
    if (w > 0) return src;
  }
  return null;
}

// ---- Main loader ----
async function _loadFavicon(displayImg, domain, sources) {
  // Serve from memory/disk cache immediately
  if (domain in _faviconMemCache) {
    const cached = _faviconMemCache[domain];
    if (cached) displayImg.src = cached;
    else        displayImg.style.display = 'none';
    return;
  }

  if (!sources) { displayImg.style.display = 'none'; return; }

  // Tier 1: race all aggregators — fastest reliable winner
  let winner = await _raceTier(sources.tier1);

  // Tier 2: direct domain probing (sequential, slower)
  if (!winner) winner = await _probeSequential(sources.tier2);

  // Tier 3: last resort scrapers
  if (!winner) winner = await _probeSequential(sources.tier3);

  _faviconMemCache[domain] = winner;
  _persistFaviconCache();

  if (winner) displayImg.src = winner;
  else        displayImg.style.display = 'none';
}

// ========================================
// Bookmark rendering
// ========================================
const ITEMS_PER_SECTION = 5;

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

      const sources = _buildSources(domain);
      li.innerHTML = `<a href="${bookmark.href}" class="bookmark-link"><img alt="${bookmark.title}" class="bookmark-icon"><span>${bookmark.title}</span></a>`;
      const img = li.querySelector('img');
      _loadFavicon(img, domain, sources);
      ul.appendChild(li);
    });

    section.appendChild(ul);
    container.appendChild(section);
  }
}