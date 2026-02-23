// ========================================
// Favicon helper
// ========================================
function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    // Use DuckDuckGo — higher quality than Google's s2/favicons
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  } catch {
    return '';
  }
}

function getFaviconFallbacks(url) {
  try {
    const domain = new URL(url).hostname;
    return [
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      `https://${domain}/favicon.ico`,
      `https://favicon.im/${domain}?larger=true`,
    ];
  } catch {
    return [];
  }
}

function faviconError(img) {
  const fallbacks = JSON.parse(decodeURIComponent(img.dataset.fallbacks || '%5B%5D'));
  const idx = parseInt(img.dataset.fallbackIdx || '0');
  if (idx < fallbacks.length) {
    img.dataset.fallbackIdx = idx + 1;
    img.src = fallbacks[idx];
  } else {
    img.style.display = 'none';
  }
}

// ========================================
// Generate bookmark grid
// ========================================
function generateBookmarks() {
  const container = document.getElementById('bookmarks');
  container.innerHTML = '';

  const bookmarks = getStoredBookmarks();
  const itemsPerSection = 5;
  const numSections = Math.ceil(bookmarks.length / itemsPerSection);

  for (let i = 0; i < numSections; i++) {
    const section = document.createElement('div');
    section.className = 'bookmark-section';
    const ul = document.createElement('ul');

    const slice = bookmarks.slice(i * itemsPerSection, (i + 1) * itemsPerSection);
    slice.forEach(bookmark => {
      const li = document.createElement('li');
      const fallbacks = getFaviconFallbacks(bookmark.href);
      const faviconUrl = fallbacks[0] || '';
      const li_id = `bm-${Math.random().toString(36).slice(2, 7)}`;
      li.innerHTML = `
        <a href="${bookmark.href}">
          <img src="${faviconUrl}" alt="${bookmark.title}" data-fallbacks="${encodeURIComponent(JSON.stringify(fallbacks.slice(1)))}" data-fallback-idx="0"
               onerror="faviconError(this)">
          <span>${bookmark.title}</span>
        </a>`;
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
    el.classList.remove("bookmark-match", "bookmark-nomatch");
    el.style.mixBlendMode = "";
  });
}