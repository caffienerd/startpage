// ========================================
// Open Directory Modal
// ========================================

const DIR_CATEGORIES = {
  media:    { label: 'Media',    aliases: ['vid', 'video'],       defaultExt: ['mkv','mp4','avi','mov','mpg','wmv','divx','mpeg'] },
  books:    { label: 'Books',    aliases: ['book', 'ebook'],      defaultExt: ['MOBI','CBZ','CBR','CBC','CHM','EPUB','FB2','LIT','LRF','ODT','PDF','PRC','PDB','PML','RB','RTF','TCR','DOC','DOCX'] },
  music:    { label: 'Music',    aliases: ['audio', 'mus'],       defaultExt: ['mp3','wav','ac3','ogg','flac','wma','m4a','aac','mod'] },
  software: { label: 'Software', aliases: ['soft', 'iso', 'app'], defaultExt: ['exe','iso','dmg','tar','7z','bz2','gz','rar','zip','apk'] },
  images:   { label: 'Images',   aliases: ['img', 'pics'],        defaultExt: ['jpg','png','bmp','gif','tif','tiff','psd'] },
  other:    { label: 'Other',    aliases: [],                     defaultExt: [] },
};

const DIR_EXCLUSIONS = `-inurl:(jsp|pl|php|html|aspx|htm|cf|shtml) intitle:index.of -inurl:(listen77|mp3raid|mp3toss|mp3drug|index_of|index-of|wallywashis|downloadmana)`;

// ========================================
// Dir Extension Storage
// ========================================
function getStoredDirExtensions() {
  try {
    const stored = localStorage.getItem('dirExtensions');
    return stored ? JSON.parse(stored) : {};
  } catch (e) { return {}; }
}

function saveDirExtensions(exts) {
  try { localStorage.setItem('dirExtensions', JSON.stringify(exts)); }
  catch (e) { console.error('Failed to save dir extensions:', e); }
}

function getDirCategoryExtensions(key) {
  const stored = getStoredDirExtensions();
  if (stored[key] && Array.isArray(stored[key]) && stored[key].length > 0) return stored[key];
  return DIR_CATEGORIES[key]?.defaultExt || [];
}

// ========================================
// Query Builder
// ========================================
function buildDirQuery(keyword, category) {
  const key = resolveDirCategoryKey(category);
  let extPart = '';
  if (key && key !== 'other') {
    const exts = getDirCategoryExtensions(key);
    if (exts.length > 0) extPart = ` +(${exts.join('|')})`;
  }
  return `${keyword.trim()}${extPart} ${DIR_EXCLUSIONS}`;
}

function resolveDirCategoryKey(raw) {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  if (DIR_CATEGORIES[lower]) return lower;
  for (const [key, def] of Object.entries(DIR_CATEGORIES)) {
    if (def.aliases.includes(lower)) return key;
  }
  return null;
}

function resolveDirCategory(raw) {
  const key = resolveDirCategoryKey(raw);
  return key ? DIR_CATEGORIES[key] : null;
}

function resolveDirEngine(engineStr) {
  if (!engineStr) return getStoredSearchEngine();
  const e = engineStr.toLowerCase();
  if (['ggl', 'google'].includes(e)) return 'google';
  if (['ddg', 'duckduckgo'].includes(e)) return 'ddg';
  if (['bing'].includes(e)) return 'bing';
  return getStoredSearchEngine();
}

function buildDirUrl(keyword, category, engineOverride) {
  const query = buildDirQuery(keyword, category);
  const engine = resolveDirEngine(engineOverride);
  const q = encodeURIComponent(query);
  if (engine === 'ddg')  return `https://duckduckgo.com/?q=${q}`;
  if (engine === 'bing') return `https://www.bing.com/search?q=${q}`;
  return `https://www.google.com/search?q=${q}`;
}

function parseDirCommand(rawValue) {
  const match = rawValue.match(/^dir(?:\/([a-z]*))?(?:\/([a-z]*))?:\s*(.*)/i);
  if (!match) return null;
  return { category: match[1] || '', engine: match[2] || '', keyword: match[3] || '' };
}

function handleDirCommand(rawValue) {
  const parsed = parseDirCommand(rawValue);
  if (!parsed) return false;
  if (!parsed.keyword.trim()) { openDirModal(); return true; }
  navigate(buildDirUrl(parsed.keyword, parsed.category, parsed.engine));
  return true;
}

// ========================================
// :dir — Interactive Builder Modal
// ========================================
function openDirModal(prefill = {}) {
  _renderDirModal(prefill);
  document.getElementById('dir-modal').classList.add('active');
  document.getElementById('dir-keyword-input')?.focus();
}

function closeDirModal() {
  document.getElementById('dir-modal').classList.remove('active');
}

function _renderDirModal(prefill = {}) {
  const kwInput = document.getElementById('dir-keyword-input');
  if (kwInput) kwInput.value = prefill.keyword || '';

  const defaultEngine = getStoredSearchEngine();
  document.querySelectorAll('#dir-cat-grid .dir-cat-btn').forEach(btn => {
    btn.classList.toggle('active-cat', btn.dataset.cat === (prefill.category || ''));
  });
  document.querySelectorAll('#dir-engine-grid .dir-engine-btn').forEach(btn => {
    const isDefault = btn.dataset.engine === '' && !prefill.engine;
    const isSelected = !!prefill.engine && btn.dataset.engine === prefill.engine;
    btn.classList.toggle('active-engine', isDefault || isSelected);
    if (btn.dataset.engine === '') {
      btn.textContent = `Default ({{ ${({ google: 'Google', ddg: 'DDG', bing: 'Bing' }[defaultEngine] || 'Google')} }})`;
      btn.textContent = `Default (${({ google: 'Google', ddg: 'DDG', bing: 'Bing' }[defaultEngine] || 'Google')})`;
    }
  });
  _updateDirPreview();
}

function _getDirModalState() {
  return {
    keyword:  (document.getElementById('dir-keyword-input')?.value || '').trim(),
    category: document.querySelector('#dir-cat-grid .active-cat')?.dataset.cat || '',
    engine:   document.querySelector('#dir-engine-grid .active-engine')?.dataset.engine || '',
  };
}

function _updateDirPreview() {
  const state = _getDirModalState();
  const preview  = document.getElementById('dir-command-preview');
  const previewUrl = document.getElementById('dir-url-preview');
  if (!preview) return;

  let cmd = 'dir';
  if (state.category || state.engine) {
    cmd += `/${state.category}`;
    if (state.engine) cmd += `/${state.engine}`;
  }
  cmd += `: ${state.keyword || '<keyword>'}`;
  preview.textContent = cmd;

  if (previewUrl) {
    const engineName = { google: 'Google', ddg: 'DuckDuckGo', bing: 'Bing' }[resolveDirEngine(state.engine)] || 'Google';
    previewUrl.textContent = state.keyword ? `→ ${engineName} open directory search` : 'Enter a keyword to preview';
  }
}

function fireDirSearch() {
  const state = _getDirModalState();
  if (!state.keyword) { document.getElementById('dir-keyword-input')?.focus(); return; }
  closeDirModal();
  navigate(buildDirUrl(state.keyword, state.category, state.engine));
}

function copyDirCommand() {
  const state = _getDirModalState();
  let cmd = 'dir';
  if (state.category || state.engine) {
    cmd += `/${state.category}`;
    if (state.engine) cmd += `/${state.engine}`;
  }
  cmd += `: ${state.keyword || ''}`;
  const btn = document.getElementById('dir-copy-btn');
  navigator.clipboard?.writeText(cmd).then(() => {
    if (btn) { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy Command', 1500); }
  }).catch(() => {});
}

// ========================================
// :dirconfig — Extension Editor Modal
// ========================================
function openDirConfigModal() {
  _renderDirConfigModal();
  document.getElementById('dirconfig-modal').classList.add('active');
}

function closeDirConfigModal() {
  document.getElementById('dirconfig-modal').classList.remove('active');
}

function _renderDirConfigModal() {
  const container = document.getElementById('dirconfig-categories');
  container.innerHTML = '';
  const stored = getStoredDirExtensions();

  Object.entries(DIR_CATEGORIES).forEach(([key, def]) => {
    if (key === 'other') return;

    const currentExts = getDirCategoryExtensions(key);
    const isCustomized = !!(stored[key] && stored[key].length > 0);

    const section = document.createElement('div');
    section.className = 'dirconfig-category';
    section.dataset.key = key;

    const header = document.createElement('div');
    header.className = 'dirconfig-cat-header';

    const title = document.createElement('span');
    title.className = 'dirconfig-cat-title';
    title.textContent = def.label;

    const resetBtn = document.createElement('button');
    resetBtn.className = 'tags-reset-btn dirconfig-reset-btn';
    resetBtn.textContent = '↺';
    resetBtn.title = 'Reset to defaults';
    resetBtn.style.opacity = isCustomized ? '1' : '0.35';
    resetBtn.addEventListener('click', () => {
      _resetDirCategory(section, key);
      resetBtn.style.opacity = '0.35';
    });

    header.appendChild(title);
    header.appendChild(resetBtn);

    const pillsWrap = document.createElement('div');
    pillsWrap.className = 'dirconfig-pills-wrap';
    pillsWrap.dataset.key = key;

    currentExts.forEach(ext => {
      pillsWrap.appendChild(_makeDirPill(ext, pillsWrap, resetBtn));
    });

    const addWrap = _makeDirAddInput(pillsWrap, resetBtn);

    section.appendChild(header);
    section.appendChild(pillsWrap);
    section.appendChild(addWrap);
    container.appendChild(section);
  });
}

function _makeDirPill(ext, pillsWrap, resetBtn) {
  const pill = document.createElement('span');
  pill.className = 'dirconfig-pill';
  pill.dataset.ext = ext.toLowerCase();

  const label = document.createElement('span');
  label.textContent = ext.toLowerCase();

  const del = document.createElement('button');
  del.className = 'dirconfig-pill-del';
  del.textContent = '×';
  del.title = 'Remove';
  del.addEventListener('click', () => {
    pill.remove();
    if (resetBtn) resetBtn.style.opacity = '1';
  });

  pill.appendChild(label);
  pill.appendChild(del);
  return pill;
}

function _makeDirAddInput(pillsWrap, resetBtn) {
  const wrap = document.createElement('div');
  wrap.className = 'dirconfig-add-wrap';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'dirconfig-add-input';
  input.placeholder = '+ add ext';
  input.spellcheck = false;
  input.maxLength = 12;

  const addExt = () => {
    const val = input.value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!val) return;
    const existing = [...pillsWrap.querySelectorAll('.dirconfig-pill')].map(p => p.dataset.ext);
    if (existing.includes(val)) { input.value = ''; return; }
    pillsWrap.appendChild(_makeDirPill(val, pillsWrap, resetBtn));
    input.value = '';
    if (resetBtn) resetBtn.style.opacity = '1';
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') { e.preventDefault(); addExt(); }
  });
  input.addEventListener('blur', addExt);

  wrap.appendChild(input);
  return wrap;
}

function _resetDirCategory(section, key) {
  const pillsWrap = section.querySelector('.dirconfig-pills-wrap');
  pillsWrap.innerHTML = '';
  const resetBtn = section.querySelector('.dirconfig-reset-btn');
  DIR_CATEGORIES[key].defaultExt.forEach(ext => {
    pillsWrap.appendChild(_makeDirPill(ext, pillsWrap, resetBtn));
  });
}

function saveDirConfig() {
  const result = {};
  document.querySelectorAll('#dirconfig-categories .dirconfig-category').forEach(section => {
    const key = section.dataset.key;
    const pills = [...section.querySelectorAll('.dirconfig-pill')].map(p => p.dataset.ext).filter(Boolean);
    const defaults = (DIR_CATEGORIES[key]?.defaultExt || []).map(e => e.toLowerCase());
    if (JSON.stringify(pills) !== JSON.stringify(defaults)) result[key] = pills;
  });
  saveDirExtensions(result);
  closeDirConfigModal();
}