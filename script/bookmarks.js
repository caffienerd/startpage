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
      const fallbacks = getFaviconFallbacks(bookmark.href);
      const faviconUrl = fallbacks[0] || '';

      li.innerHTML = `
        <a href="${bookmark.href}" class="bookmark-link">
          <img alt="${bookmark.title}" class="bookmark-icon">
          <span>${bookmark.title}</span>
        </a>`;

      const img = li.querySelector('img');
      img._fallbacks = fallbacks.slice(1);
      img._fallbackIdx = 0;
      img.addEventListener('error', function () {
        if (this._fallbackIdx < this._fallbacks.length) {
          this.src = this._fallbacks[this._fallbackIdx++];
        } else {
          this.style.display = 'none';
        }
      });
      img.src = faviconUrl;

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