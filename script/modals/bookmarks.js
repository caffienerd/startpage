// ========================================
// Bookmarks Modal Logic
// ========================================

function openBookmarksModal() {
    const bookmarks = getStoredBookmarks();
    document.getElementById('config-textarea').value = JSON.stringify(bookmarks, null, 2);

    // Ensure we start in grid mode
    const grid = document.getElementById('bookmarks-grid-editor');
    const textarea = document.getElementById('config-textarea');
    const btn = document.getElementById('toggle-editor-btn');

    grid.classList.remove('hidden');
    textarea.classList.add('hidden');
    btn.textContent = 'Edit as JSON';

    renderGridEditor(bookmarks);
    document.getElementById('bookmarks-modal').classList.add('active');

    // If config modal is open, close it (or keep it under)
    // closeConfig(); 
}

function closeBookmarksModal() {
    document.getElementById('bookmarks-modal').classList.remove('active');
}

function renderGridEditor(bookmarks) {
    const grid = document.getElementById('bookmarks-grid-editor');
    grid.innerHTML = '';

    const columns = 4;
    const rows = 5;

    for (let c = 0; c < columns; c++) {
        const colDiv = document.createElement('div');
        colDiv.className = 'bookmark-edit-column';

        for (let r = 0; r < rows; r++) {
            const idx = c * rows + r;
            const bm = bookmarks[idx] || { title: '', href: '' };

            const cell = document.createElement('div');
            cell.className = 'bookmark-edit-cell';
            cell.innerHTML = `
        <input type="text" class="bm-title-input" placeholder="Title" value="${bm.title.replace(/"/g, '&quot;')}">
        <input type="text" class="bm-url-input" placeholder="https://..." value="${bm.href.replace(/"/g, '&quot;')}">
      `;
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
        // Switching to Grid
        try {
            const bookmarks = JSON.parse(textarea.value);
            renderGridEditor(Array.isArray(bookmarks) ? bookmarks : []);
        } catch (e) { }
        grid.classList.remove('hidden');
        textarea.classList.add('hidden');
        btn.textContent = 'Edit as JSON';
    } else {
        // Switching to JSON
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
        const href = cell.querySelector('.bm-url-input').value.trim();
        if (title || href) {
            bookmarks.push({ title: title || href, href: href || '#' });
        }
    });
    return bookmarks;
}

function saveBookmarksFromModal() {
    const grid = document.getElementById('bookmarks-grid-editor');
    const textarea = document.getElementById('config-textarea');

    let bookmarks = null;
    let bookmarkError = false;

    if (!grid.classList.contains('hidden')) {
        bookmarks = collectGridBookmarks();
    } else {
        try {
            const parsed = JSON.parse(textarea.value);
            if (Array.isArray(parsed)) {
                bookmarks = parsed;
            } else {
                bookmarkError = true;
            }
        } catch {
            bookmarkError = true;
        }
    }

    if (bookmarks) {
        saveBookmarks(bookmarks);
        generateBookmarks(); // Update the UI
        closeBookmarksModal();
        if (bookmarkError) {
            alert('Bookmarks saved. Some JSON parts were invalid, so they were cleaned during save.');
        }
    } else if (bookmarkError) {
        alert('Invalid JSON! Please fix it or switch back to grid mode.');
    }
}
