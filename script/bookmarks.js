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

function _rootDomain(hostname) {
  const parts = hostname.split('.');
  return parts.length > 2 ? parts.slice(-2).join('.') : hostname;
}

function _buildSources(hostname) {
  const root  = _rootDomain(hostname);
  const isSub = root !== hostname;

  const tier1 = [
    [`https://icons.duckduckgo.com/ip3/${hostname}.ico`,   16],
    [`https://favicon.im/${hostname}?larger=true`,          16],
    [`https://icon.horse/icon/${hostname}`,                 16],
    [`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`, 16],
  ];

  if (isSub) {
    tier1.push(
      [`https://icons.duckduckgo.com/ip3/${root}.ico`,   16],
      [`https://favicon.im/${root}?larger=true`,          16],
      [`https://icon.horse/icon/${root}`,                 16],
      [`https://www.google.com/s2/favicons?domain=${root}&sz=32`, 16],
    );
  }

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

  const tier3 = [
    [`https://geticon.io/img?url=${hostname}&size=128`, 16],
    [`https://api.faviconkit.com/${hostname}/256`,       16],
  ];

  return { tier1, tier2, tier3 };
}

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

async function _probeSequential(sources) {
  for (const [src, minSize] of sources) {
    const w = await _probeIcon(src, minSize);
    if (w > 0) return src;
  }
  return null;
}

async function _loadFavicon(displayImg, domain, sources) {
  if (domain in _faviconMemCache) {
    const cached = _faviconMemCache[domain];
    if (cached) displayImg.src = cached;
    else        displayImg.style.display = 'none';
    return;
  }

  if (!sources) { displayImg.style.display = 'none'; return; }

  let winner = await _raceTier(sources.tier1);
  if (!winner) winner = await _probeSequential(sources.tier2);
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

// ---- Build a single bookmark <li> element ----
function _buildBookmarkLi(bookmark) {
  let domain = '';
  try { domain = new URL(bookmark.href).hostname; } catch {}
  const sources = _buildSources(domain);
  const li = document.createElement('li');
  li.innerHTML = `<a href="${bookmark.href}" class="bookmark-link"><img alt="${bookmark.title}" class="bookmark-icon"><span>${bookmark.title}</span></a>`;
  const img = li.querySelector('img');
  _loadFavicon(img, domain, sources);
  return li;
}

// ---- Swap an <li>'s anchor to a new bookmark ----
function _swapLiBookmark(li, bm) {
  const a = li.querySelector('a');
  a.href = bm.href;
  a.querySelector('span').textContent = bm.title;
  let domain = '';
  try { domain = new URL(bm.href).hostname; } catch {}
  const img = a.querySelector('img');
  img.style.display = '';
  _loadFavicon(img, domain, _buildSources(domain));
}

// Track original upfront bookmarks per slot for reset
let _upfrontSlots = []; // Array of { li, bookmark }

function generateBookmarks() {
  const container = document.getElementById('bookmarks');
  container.innerHTML = '';
  _upfrontSlots = [];

  const bookmarks = getStoredBookmarks();
  const numSections = Math.ceil(bookmarks.length / ITEMS_PER_SECTION);

  for (let i = 0; i < numSections; i++) {
    const section = document.createElement('div');
    section.className = 'bookmark-section';
    const ul = document.createElement('ul');
    const slice = bookmarks.slice(i * ITEMS_PER_SECTION, (i + 1) * ITEMS_PER_SECTION);

    slice.forEach(bookmark => {
      if (!bookmark.href || !bookmark.title) return;
      const li = _buildBookmarkLi(bookmark);
      ul.appendChild(li);
      _upfrontSlots.push({ li, bookmark });
    });

    section.appendChild(ul);
    container.appendChild(section);
  }
}

// ---- Score a bookmark against a query ----
// Returns: 2 = startsWith title, 1 = includes title, 0 = no match
// Match on title only — href matching causes false positives with long URLs.
function _scoreUpfront(title, href, value) {
  if (title.startsWith(value)) return 2;
  if (title.includes(value)) return 1;
  return 0;
}

// Shelf bookmarks match on title ONLY — URLs are often long/noisy search strings.
function _scoreShelf(title, value) {
  if (title.startsWith(value)) return 2;
  if (title.includes(value)) return 1;
  return 0;
}

// ---- Main filter function — called from handleInput in terminal.js ----
// Returns best match { href, title } or null (used by AI badge in terminal.js).
function filterBookmarksWithShelf(rawValue) {
  const value = (rawValue || '').trim().toLowerCase();

  // Reset all classes first
  _upfrontSlots.forEach(({ li }) => {
    li.classList.remove('bookmark-match', 'bookmark-nomatch', 'primary-match', 'shelf-swapped');
  });

  // Empty input or command/dir prefix → restore everything to default
  if (!value || rawValue.startsWith(':') || /^dir/i.test(rawValue)) {
    _upfrontSlots.forEach(({ li, bookmark }) => {
      if (li._shelfBookmark) {
        _swapLiBookmark(li, bookmark);
        delete li._shelfBookmark;
      }
    });
    return null;
  }

  const shelfBookmarks = getStoredShelfBookmarks();

  // Score upfront slots (title + href)
  const upfrontScores = _upfrontSlots.map(({ bookmark }) =>
    _scoreUpfront(bookmark.title.toLowerCase(), bookmark.href.toLowerCase(), value)
  );

  // Score + sort shelf bookmarks by title only, best first
  const scoredShelf = shelfBookmarks
    .map(bm => ({ bm, score: _scoreShelf(bm.title.toLowerCase(), value) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  let shelfIdx = 0;
  let bestMatchLi = null;
  let bestMatchScore = 0;
  let bestMatch = null;

  _upfrontSlots.forEach(({ li, bookmark }, i) => {
    const upfrontScore = upfrontScores[i];

    if (upfrontScore > 0) {
      // Upfront matches — restore if was swapped, mark as match
      if (li._shelfBookmark) {
        _swapLiBookmark(li, bookmark);
        delete li._shelfBookmark;
        li.classList.remove('shelf-swapped');
      }
      li.classList.add('bookmark-match');
      // Upfront scores: startsWith=2, includes=1
      const slotScore = upfrontScore; // 2 or 1
      if (slotScore > bestMatchScore) {
        bestMatchScore = slotScore;
        bestMatchLi = li;
        bestMatch = { href: bookmark.href, title: bookmark.title };
      }
    } else {
      // Upfront doesn't match — try shelf
      if (shelfIdx < scoredShelf.length) {
        const { bm, score } = scoredShelf[shelfIdx++];
        _swapLiBookmark(li, bm);
        li._shelfBookmark = bm;
        li.classList.add('bookmark-match', 'shelf-swapped');
        // Shelf scores are lower priority than upfront: startsWith=1.5, includes=0.5
        const slotScore = score === 2 ? 1.5 : 0.5;
        if (slotScore > bestMatchScore) {
          bestMatchScore = slotScore;
          bestMatchLi = li;
          bestMatch = { href: bm.href, title: bm.title };
        }
      } else {
        // No shelf item available — restore upfront and fade out
        if (li._shelfBookmark) {
          _swapLiBookmark(li, bookmark);
          delete li._shelfBookmark;
          li.classList.remove('shelf-swapped');
        }
        li.classList.add('bookmark-nomatch');
      }
    }
  });

  // Best match gets primary highlight
  if (bestMatchLi) bestMatchLi.classList.add('primary-match');

  return bestMatch;
}