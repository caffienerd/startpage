// ========================================
// Tags Modal — Search Overrides + Custom Tags
// ========================================

function openTagsModal() {
  _renderTagsModal();
  document.getElementById('tags-modal').classList.add('active');
}

function closeTagsModal() {
  document.getElementById('tags-modal').classList.remove('active');
}

function _renderTagsModal() {
  _renderOverrides();
  _renderCustomTags();
}

// ---- Overrides ----
function _renderOverrides() {
  const overrides = getStoredSearchOverrides();
  const grid = document.getElementById('tags-overrides-grid');
  grid.innerHTML = '';

  Object.entries(OVERRIDEABLE_PREFIXES).forEach(([key, { label, default: def }]) => {
    const row = document.createElement('div');
    row.className = 'tags-override-row';

    const lbl = document.createElement('span');
    lbl.className = 'tags-override-label';
    lbl.textContent = label;

    const prefix = document.createElement('span');
    prefix.className = 'tags-override-prefix';
    prefix.textContent = key + ':';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tags-override-input';
    input.spellcheck = false;
    input.placeholder = def;
    input.value = overrides[key] || '';
    input.dataset.key = key;

    const reset = document.createElement('button');
    reset.className = 'tags-reset-btn';
    reset.textContent = '↺';
    reset.title = 'Reset to default';
    reset.addEventListener('click', () => { input.value = ''; });

    row.appendChild(lbl);
    row.appendChild(prefix);
    row.appendChild(input);
    row.appendChild(reset);
    grid.appendChild(row);
  });
}

// ---- Custom Tags ----
function _renderCustomTags() {
  const tags = getStoredCustomTags();
  const list = document.getElementById('tags-custom-list');
  list.innerHTML = '';
  tags.forEach((tag, i) => _renderCustomTagRow(list, tag, i));
}

function _renderCustomTagRow(list, tag, index) {
  const row = document.createElement('div');
  row.className = 'tags-custom-row';
  row.dataset.index = index;

  const prefixInput = document.createElement('input');
  prefixInput.type = 'text';
  prefixInput.className = 'tags-custom-prefix';
  prefixInput.spellcheck = false;
  prefixInput.placeholder = 'prefix';
  prefixInput.value = tag.prefix || '';
  prefixInput.title = 'Prefix (no colon)';

  const colon = document.createElement('span');
  colon.className = 'tags-colon';
  colon.textContent = ':';

  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.className = 'tags-custom-url';
  urlInput.spellcheck = false;
  urlInput.placeholder = 'https://example.com/search?q=';
  urlInput.value = tag.url || '';
  urlInput.title = 'URL — query appended at the end';

  const del = document.createElement('button');
  del.className = 'tags-reset-btn tags-delete-btn';
  del.textContent = '✕';
  del.title = 'Remove';
  del.addEventListener('click', () => {
    row.remove();
  });

  row.appendChild(prefixInput);
  row.appendChild(colon);
  row.appendChild(urlInput);
  row.appendChild(del);
  list.appendChild(row);
}

function addCustomTag() {
  const list = document.getElementById('tags-custom-list');
  const index = list.children.length;
  _renderCustomTagRow(list, { prefix: '', url: '' }, index);
  // Focus the new prefix input
  list.lastElementChild.querySelector('.tags-custom-prefix').focus();
}

// ---- Save ----
function saveTagsModal() {
  // Save overrides
  const overrides = {};
  document.querySelectorAll('#tags-overrides-grid .tags-override-input').forEach(input => {
    const val = input.value.trim();
    if (val) overrides[input.dataset.key] = val;
  });
  saveSearchOverrides(overrides);

  // Save custom tags
  const tags = [];
  document.querySelectorAll('#tags-custom-list .tags-custom-row').forEach(row => {
    const prefix = row.querySelector('.tags-custom-prefix').value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const url    = row.querySelector('.tags-custom-url').value.trim();
    if (prefix && url) tags.push({ prefix, url });
  });
  saveCustomTags(tags);

  closeTagsModal();
}