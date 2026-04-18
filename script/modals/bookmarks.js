// ========================================
// Bookmarks Modal Logic
// ========================================

// Active tab: 'upfront' | 'shelf'
let _bmActiveTab = 'upfront';

function openBookmarksModal() {
  _bmActiveTab = 'upfront';
  _bmSwitchTab('upfront');

  // Wire tab buttons — CSP forbids inline onclick, so we do it here
  document.querySelectorAll('.bm-tab-btn').forEach(btn => {
    const fresh = btn.cloneNode(true);
    btn.parentNode.replaceChild(fresh, btn);
  });
  document.querySelectorAll('.bm-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => _bmSwitchTab(btn.dataset.tab));
  });

  document.getElementById('bookmarks-modal').classList.add('active');

  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      closeBookmarksModal();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  const cleanupEsc = () => {
    if (!document.getElementById('bookmarks-modal').classList.contains('active')) {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('click', cleanupEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
  document.addEventListener('click', cleanupEsc);
}

function closeBookmarksModal() {
  document.getElementById('bookmarks-modal').classList.remove('active');
}

// ---- Tab switching ----
function _bmSwitchTab(tab) {
  _bmActiveTab = tab;

  document.querySelectorAll('.bm-tab-btn').forEach(btn => {
    btn.classList.toggle('bm-tab-active', btn.dataset.tab === tab);
  });

  // JSON toggle only relevant for upfront
  const toggleBtn = document.getElementById('toggle-editor-btn');
  if (toggleBtn) toggleBtn.style.display = tab === 'shelf' ? 'none' : '';

  if (tab === 'shelf') {
    _renderShelfEditor(getStoredShelfBookmarks());
  } else {
    const grid = document.getElementById('bookmarks-grid-editor');
    const textarea = document.getElementById('config-textarea');
    const shelfEditor = document.getElementById('shelf-list-editor');
    grid.classList.remove('hidden');
    textarea.classList.add('hidden');
    if (shelfEditor) shelfEditor.classList.add('hidden');
    if (toggleBtn) toggleBtn.textContent = 'Edit as JSON';
    renderGridEditor(getStoredBookmarks());
  }
}

// ========================================
// Shelf list editor (infinite, scrollable)
// ========================================
function _renderShelfEditor(bookmarks) {
  const grid = document.getElementById('bookmarks-grid-editor');
  const textarea = document.getElementById('config-textarea');
  grid.classList.add('hidden');
  textarea.classList.add('hidden');

  let shelfEditor = document.getElementById('shelf-list-editor');
  if (!shelfEditor) {
    shelfEditor = document.createElement('div');
    shelfEditor.id = 'shelf-list-editor';
    grid.parentNode.insertBefore(shelfEditor, grid);
  }
  shelfEditor.classList.remove('hidden');
  shelfEditor.innerHTML = '';

  // + Add button at top
  const addBtn = document.createElement('button');
  addBtn.className = 'shelf-add-btn';
  addBtn.textContent = '+ Add bookmark';
  addBtn.addEventListener('click', () => _shelfAddRow());
  shelfEditor.appendChild(addBtn);

  // Scrollable list
  const list = document.createElement('div');
  list.id = 'shelf-list';
  list.className = 'shelf-list';
  shelfEditor.appendChild(list);

  bookmarks.forEach(bm => _shelfAddRow(bm, list));
}

function _shelfAddRow(bm = null, listEl = null) {
  const list = listEl || document.getElementById('shelf-list');
  if (!list) return;

  const row = document.createElement('div');
  row.className = 'shelf-row';

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.className = 'shelf-title-input';
  titleInput.placeholder = 'Title';
  titleInput.value = bm?.title || '';
  titleInput.spellcheck = false;

  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.className = 'shelf-url-input';
  urlInput.placeholder = 'https://...';
  urlInput.value = bm?.href || '';
  urlInput.spellcheck = false;

  const removeBtn = document.createElement('button');
  removeBtn.className = 'shelf-remove-btn';
  removeBtn.textContent = '×';
  removeBtn.title = 'Remove';
  removeBtn.addEventListener('click', () => row.remove());

  row.appendChild(titleInput);
  row.appendChild(urlInput);
  row.appendChild(removeBtn);
  list.appendChild(row);

  if (!bm) titleInput.focus();
}

function _collectShelfBookmarks() {
  const rows = document.querySelectorAll('#shelf-list .shelf-row');
  const bookmarks = [];
  rows.forEach(row => {
    const title = row.querySelector('.shelf-title-input').value.trim();
    const href  = row.querySelector('.shelf-url-input').value.trim();
    if (title || href) {
      bookmarks.push({ title: title || href, href: href || '#' });
    }
  });
  return bookmarks;
}

// ========================================
// Upfront grid editor
// ========================================
function renderGridEditor(bookmarks) {
  const grid = document.getElementById('bookmarks-grid-editor');
  const shelfEditor = document.getElementById('shelf-list-editor');
  grid.classList.remove('hidden');
  if (shelfEditor) shelfEditor.classList.add('hidden');
  grid.innerHTML = '';

  const columns = 4;
  const rows = Math.max(5, Math.ceil(bookmarks.length / columns));

  for (let c = 0; c < columns; c++) {
    const colDiv = document.createElement('div');
    colDiv.className = 'bookmark-edit-column';

    for (let r = 0; r < rows; r++) {
      const idx = c * rows + r;
      const bm = (bookmarks[idx] && typeof bookmarks[idx] === 'object') ? bookmarks[idx] : { title: '', href: '' };

      const cell = document.createElement('div');
      cell.className = 'bookmark-edit-cell';

      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.className = 'bm-title-input';
      titleInput.placeholder = 'Title';
      titleInput.value = bm.title || '';
      titleInput.spellcheck = false;

      const urlInput = document.createElement('input');
      urlInput.type = 'text';
      urlInput.className = 'bm-url-input';
      urlInput.placeholder = 'https://...';
      urlInput.value = bm.href || '';
      urlInput.spellcheck = false;

      cell.appendChild(titleInput);
      cell.appendChild(urlInput);
      colDiv.appendChild(cell);
    }
    grid.appendChild(colDiv);
  }
}

function toggleEditorMode() {
  const grid = document.getElementById('bookmarks-grid-editor');
  const textarea = document.getElementById('config-textarea');
  const btn = document.getElementById('toggle-editor-btn');

  if (grid.classList.contains('hidden')) {
    try {
      const bookmarks = JSON.parse(textarea.value);
      renderGridEditor(Array.isArray(bookmarks) ? bookmarks : []);
      grid.classList.remove('hidden');
      textarea.classList.add('hidden');
      btn.textContent = 'Edit as JSON';
    } catch (e) {
      showAlert('Invalid JSON format. Please fix any syntax errors before switching to grid view.', { type: 'error', title: 'Invalid JSON' });
    }
  } else {
    const bookmarks = collectGridBookmarks();
    textarea.value = JSON.stringify(bookmarks, null, 2);
    grid.classList.add('hidden');
    textarea.classList.remove('hidden');
    btn.textContent = 'Edit as Grid';
  }
}

function collectGridBookmarks() {
  const cells = document.querySelectorAll('#bookmarks-grid-editor .bookmark-edit-cell');
  const bookmarks = [];
  cells.forEach(cell => {
    const title = cell.querySelector('.bm-title-input').value.trim();
    const href  = cell.querySelector('.bm-url-input').value.trim();
    if (title || href) {
      bookmarks.push({ title: title || href, href: href || '#' });
    }
  });
  return bookmarks;
}

// ========================================
// Save
// ========================================
function saveBookmarksFromModal() {
  if (_bmActiveTab === 'shelf') {
    const bookmarks = _collectShelfBookmarks();
    saveShelfBookmarks(bookmarks);
    showToast('Shelf bookmarks saved', 'success');
    closeBookmarksModal();
    return;
  }

  const grid = document.getElementById('bookmarks-grid-editor');
  const textarea = document.getElementById('config-textarea');
  let bookmarks = null;
  let bookmarkError = false;

  if (!grid.classList.contains('hidden')) {
    bookmarks = collectGridBookmarks();
  } else {
    try {
      const parsed = JSON.parse(textarea.value);
      if (Array.isArray(parsed)) bookmarks = parsed;
      else bookmarkError = true;
    } catch (e) {
      bookmarkError = true;
    }
  }

  if (bookmarks && !bookmarkError) {
    saveBookmarks(bookmarks);
    generateBookmarks();
    showToast('Bookmarks saved', 'success');
    closeBookmarksModal();
  } else if (bookmarkError) {
    showAlert('Invalid JSON! Please fix it or switch back to grid mode.', { type: 'error', title: 'Invalid JSON' });
  }
}