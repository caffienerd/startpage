// ========================================
// Customize Modal — Syntax Colors + Theme Switcher
// ========================================

const SYNTAX_COLOR_DEFS = [
  { key: 'cmd',     label: ':commands',       example: ':config'   },
  { key: 'theme',   label: ':theme commands', example: ':dark'     },
  { key: 'search',  label: 'search prefixes', example: 'yt:query'  },
  { key: 'version', label: ':version',        example: ':version'  },
  { key: 'url',     label: 'direct URLs',     example: 'chess.com' },
  { key: 'unknown', label: 'unknown command', example: ':???'      },
];

const THEME_DEFS = [
  { value: 'light',     label: 'Light'     },
  { value: 'dark',      label: 'Dark'      },
  { value: 'black',     label: 'Black'     },
  { value: 'nord',      label: 'Nord'      },
  { value: 'newspaper', label: 'Newspaper' },
  { value: 'coffee',    label: 'Coffee'    },
  { value: 'root',      label: 'Root'      },
  { value: 'neon',      label: 'Neon'      },
];

// ---- Open / Close ----
function openCustomizeModal() {
  _renderCustomizeModal();
  document.getElementById('customize-modal').classList.add('active');
  // Focus first hex input
  const first = document.querySelector('#customize-modal .customize-hex');
  if (first) first.focus();
}

function closeCustomizeModal() {
  document.getElementById('customize-modal').classList.remove('active');
}

// ---- Render ----
function _renderCustomizeModal() {
  const colors = getStoredSyntaxColors();
  const currentTheme = getStoredTheme();

  // ---- Syntax color rows ----
  const grid = document.getElementById('customize-color-grid');
  grid.innerHTML = '';

  SYNTAX_COLOR_DEFS.forEach(({ key, label, example }) => {
    const color = colors[key] || DEFAULT_SYNTAX_COLORS[key];

    const row = document.createElement('div');
    row.className = 'customize-row';
    row.dataset.key = key;

    row.innerHTML = `
      <span class="customize-label">${label}</span>
      <span class="customize-preview" style="color:${color}">${example}</span>
      <div class="customize-color-wrap">
        <input type="color" class="customize-swatch" value="${color}" data-key="${key}" title="Pick color">
        <input type="text" class="customize-hex" value="${color.toUpperCase()}" data-key="${key}" maxlength="7" spellcheck="false">
      </div>
      <button class="customize-reset-btn" data-key="${key}" title="Reset">↺</button>
    `;

    // Swatch → hex + preview live
    const swatch = row.querySelector('.customize-swatch');
    const hex    = row.querySelector('.customize-hex');
    const preview = row.querySelector('.customize-preview');

    swatch.addEventListener('input', () => {
      const v = swatch.value;
      hex.value = v.toUpperCase();
      preview.style.color = v;
      _applyLiveColor(key, v);
    });

    hex.addEventListener('input', () => {
      const v = hex.value.trim();
      if (/^#[0-9a-f]{6}$/i.test(v)) {
        swatch.value = v;
        preview.style.color = v;
        _applyLiveColor(key, v);
      }
    });

    hex.addEventListener('blur', () => {
      // Normalise: ensure starts with #, 6 hex digits
      let v = hex.value.trim();
      if (!v.startsWith('#')) v = '#' + v;
      if (/^#[0-9a-f]{6}$/i.test(v)) {
        hex.value = v.toUpperCase();
        swatch.value = v;
        preview.style.color = v;
        _applyLiveColor(key, v);
      } else {
        // revert to current stored
        const stored = getStoredSyntaxColors();
        hex.value = (stored[key] || DEFAULT_SYNTAX_COLORS[key]).toUpperCase();
        swatch.value = stored[key] || DEFAULT_SYNTAX_COLORS[key];
        preview.style.color = stored[key] || DEFAULT_SYNTAX_COLORS[key];
      }
    });

    // Reset button
    row.querySelector('.customize-reset-btn').addEventListener('click', () => {
      const def = DEFAULT_SYNTAX_COLORS[key];
      swatch.value = def;
      hex.value = def.toUpperCase();
      preview.style.color = def;
      _applyLiveColor(key, def);
    });

    grid.appendChild(row);
  });

  // ---- Theme buttons ----
  const themeGrid = document.getElementById('customize-theme-grid');
  themeGrid.innerHTML = '';

  THEME_DEFS.forEach(({ value, label }) => {
    const btn = document.createElement('button');
    btn.className = 'customize-theme-btn' + (value === currentTheme ? ' active-theme' : '');
    btn.textContent = label;
    btn.addEventListener('click', () => {
      _applyTheme(value);
      // Update active styling
      themeGrid.querySelectorAll('.customize-theme-btn').forEach(b => b.classList.remove('active-theme'));
      btn.classList.add('active-theme');
    });
    themeGrid.appendChild(btn);
  });
}

// ---- Live color preview (CSS variable only, not saved yet) ----
function _applyLiveColor(key, value) {
  document.documentElement.style.setProperty(`--syn-${key}`, value);
}

// ---- Apply theme (mirrors commands.js logic) ----
function _applyTheme(theme) {
  THEMES.forEach(t => {
    document.body.classList.remove(`${t}-mode`);
    document.documentElement.classList.remove(`${t}-mode`);
  });
  if (theme !== 'light') {
    document.documentElement.classList.add(`${theme}-mode`);
  }
  saveTheme(theme);
}

// ---- Save ----
function saveCustomize() {
  const colors = { ...getStoredSyntaxColors() };

  document.querySelectorAll('#customize-color-grid .customize-row').forEach(row => {
    const key = row.dataset.key;
    const hex = row.querySelector('.customize-hex').value.trim();
    if (/^#[0-9a-f]{6}$/i.test(hex)) {
      colors[key] = hex.toLowerCase();
    }
  });

  saveSyntaxColors(colors);
  applySyntaxColors(colors);
  closeCustomizeModal();
}

// ---- Reset all syntax colors ----
function resetAllSyntaxColors() {
  if (!confirm('Reset all syntax colors to defaults?')) return;
  saveSyntaxColors({ ...DEFAULT_SYNTAX_COLORS });
  applySyntaxColors(DEFAULT_SYNTAX_COLORS);
  _renderCustomizeModal(); // re-render pickers with defaults
}