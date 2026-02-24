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

    // Focus the first input or the modal to capture keyboard events
    const firstInput = document.querySelector('#bookmarks-grid-editor input');
    if (firstInput) firstInput.focus();

    // Handle Esc key specifically for this modal
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closeBookmarksModal();
            document.removeEventListener('keydown', handleEsc);
        }
    };

    // Clean up to prevent leaks if closed another way
    const cleanupEsc = (e) => {
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

function renderGridEditor(bookmarks) {
    const grid = document.getElementById('bookmarks-grid-editor');
    grid.innerHTML = '';

    const columns = 4;
    // Calculate required rows, ensuring at least 5 to maintain some UI stability
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
        // Switching to Grid
        try {
            const bookmarks = JSON.parse(textarea.value);
            renderGridEditor(Array.isArray(bookmarks) ? bookmarks : []);
            grid.classList.remove('hidden');
            textarea.classList.add('hidden');
            btn.textContent = 'Edit as JSON';
        } catch (e) {
            console.error('Failed to parse bookmarks JSON:', e);
            alert('Invalid JSON format. Please fix any syntax errors before switching to grid view.');
        }
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
        } catch (e) {
            console.error('Failed to parse bookmarks JSON when saving:', e);
            bookmarkError = true;
        }
    }

    if (bookmarks && !bookmarkError) {
        saveBookmarks(bookmarks);
        generateBookmarks(); // Update the UI
        closeBookmarksModal();
    } else if (bookmarkError) {
        alert('Invalid JSON! Please fix it or switch back to grid mode.');
    }
}