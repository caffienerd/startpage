// ========================================
// Tour — demonstrative walkthrough
// Types commands into the terminal, executes them live.
// Small tip card anchored bottom-right. No dim, no spotlight.
// ========================================

const TOUR_SEEN_KEY = 'tour-seen-v1';

// ---- Step definitions ----
// tip:         what the tooltip says
// type:        string to typewrite into terminal (optional)
// execute:     fn() called after typing is done (before user clicks Next)
// afterHide:   fn() cleanup when leaving this step
// delay:       ms to wait after execute before tooltip appears (default 0)

const TOUR_STEPS = [
  {
    tip: "Welcome to Terminal Start Page. Everything runs through the terminal. Let's take a quick look.",
  },
  {
    tip: "Not a fan of the light theme? Let's switch to dark — watch the terminal.",
    type: ':dark',
    execute: () => {
      if (typeof _applyTheme === 'function') _applyTheme('dark');
    },
  },
  {
    tip: "Type :config to open settings — username, weather location, timezone, Gemini API key.",
    type: ':config',
    execute: () => { if (typeof openConfig === 'function') openConfig(); },
    afterHide: () => { if (typeof closeConfig === 'function') closeConfig(); },
  },
  {
    tip: "Type :customize to pick a theme and set your own syntax highlight colors.",
    type: ':customize',
    execute: () => { if (typeof openCustomizeModal === 'function') openCustomizeModal(); },
    afterHide: () => { if (typeof closeCustomizeModal === 'function') closeCustomizeModal(); },
  },
  {
    tip: "Type :help to see every command, prefix, and shortcut available.",
    type: ':help',
    execute: () => { if (typeof openHelp === 'function') openHelp(); },
    afterHide: () => { if (typeof closeHelp === 'function') closeHelp(); },
  },
  {
    tip: null, // GitHub star — special last step, :help stays open
    execute: () => { if (typeof openHelp === 'function') openHelp(); },
    // No afterHide — we intentionally leave :help open when tour ends
  },
];

// ---- State ----
let _tourActive  = false;
let _tourStep    = 0;
let _tourCard    = null;
let _keydown     = null;
let _typeTimer   = null;
let _typing      = false;

// ---- Public ----
function openTour(force = false) {
  if (_tourActive) return;
  if (!force && localStorage.getItem(TOUR_SEEN_KEY)) return;
  _tourActive = true;
  _tourStep   = 0;
  _buildCard();
  _showStep(0);
}

function closeTour(skipCleanup = false) {
  if (!_tourActive) return;
  _stopTyping();
  const s = TOUR_STEPS[_tourStep];
  const isLastStep = _tourStep === TOUR_STEPS.length - 1;
  // Only run afterHide if not the last step (last step keeps :help open)
  if (s?.afterHide && !isLastStep) try { s.afterHide(); } catch(e) {}
  _destroyCard();
  _tourActive = false;
  localStorage.setItem(TOUR_SEEN_KEY, '1');
  // Don't clear terminal or close help if ending naturally on last step
  if (!isLastStep) _clearTerminal();
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => openTour(false), 1000);
});

// ---- Build card ----
function _buildCard() {
  _tourCard = document.createElement('div');
  _tourCard.id = 'tour-card';
  _tourCard.innerHTML = `
    <p class="tour-tip" id="tour-tip"></p>
    <div class="tour-foot">
      <button class="tour-skip" id="tour-skip">Skip tour</button>
      <div class="tour-nav">
        <button class="tour-arrow" id="tour-prev" title="Back">←</button>
        <span class="tour-counter" id="tour-counter"></span>
        <button class="tour-arrow tour-arrow-next" id="tour-next" title="Next">→</button>
      </div>
    </div>
  `;
  document.body.appendChild(_tourCard);

  document.getElementById('tour-skip').addEventListener('click', closeTour);
  document.getElementById('tour-prev').addEventListener('click', _prev);
  document.getElementById('tour-next').addEventListener('click', _next);

  _keydown = (e) => {
    if (!_tourActive) return;
    if (e.key === 'Escape')                          { e.preventDefault(); closeTour(); }
    if (e.key === 'ArrowRight' || e.key === 'Enter') {
      // If currently typing, skip to end of animation first
      if (_typing) { e.preventDefault(); _skipTyping(); return; }
      e.preventDefault(); _next();
    }
    if (e.key === 'ArrowLeft') { e.preventDefault(); _prev(); }
  };
  document.addEventListener('keydown', _keydown, true);
}

function _destroyCard() {
  if (_keydown) { document.removeEventListener('keydown', _keydown, true); _keydown = null; }
  _tourCard?.remove(); _tourCard = null;
}

// ---- Show step ----
function _showStep(index) {
  const step  = TOUR_STEPS[index];
  const total = TOUR_STEPS.length;
  const isLast = index === total - 1;

  // Counter
  document.getElementById('tour-counter').textContent = `${index + 1} / ${total}`;

  // Prev visibility
  document.getElementById('tour-prev').style.visibility = index === 0 ? 'hidden' : 'visible';

  // Next label
  document.getElementById('tour-next').textContent = isLast ? '✓' : '→';

  // Last step — GitHub star, :help stays open
  if (isLast) {
    _clearTerminal();
    if (typeof openHelp === 'function') openHelp();
    document.getElementById('tour-tip').innerHTML =
      `If you find this useful` +
      `<a href="https://github.com/caffienerd/startpage" target="_blank" rel="noopener" class="tour-star">⭐ Star on GitHub</a>`;
    return;
  }

  // Set tip text
  document.getElementById('tour-tip').textContent = step.tip || '';

  // Typewriter into terminal
  if (step.type) {
    _typeIntoTerminal(step.type, () => {
      // After typing completes — execute the action
      if (step.execute) {
        try { step.execute(); } catch(e) {}
      }
    });
  } else {
    _clearTerminal();
    if (step.execute) try { step.execute(); } catch(e) {}
  }
}

// ---- Typewriter ----
function _typeIntoTerminal(text, onDone) {
  _stopTyping();
  _typing = true;
  const input = document.getElementById('terminal-input');
  if (!input) { _typing = false; onDone?.(); return; }

  input.value = '';
  if (typeof updateSyntaxHighlight === 'function') updateSyntaxHighlight('');

  let i = 0;
  const speed = 90; // ms per character

  function tick() {
    if (i <= text.length) {
      input.value = text.slice(0, i);
      if (typeof updateSyntaxHighlight === 'function') updateSyntaxHighlight(input.value);
      i++;
      _typeTimer = setTimeout(tick, speed);
    } else {
      _typing = false;
      _typeTimer = null;
      // Small pause after typing finishes, before executing action
      _typeTimer = setTimeout(() => { _typeTimer = null; onDone?.(); }, 420);
    }
  }
  tick();
}

function _stopTyping() {
  if (_typeTimer) { clearTimeout(_typeTimer); _typeTimer = null; }
  _typing = false;
}

// Skip to end of current typewriter animation immediately
function _skipTyping() {
  _stopTyping();
  const step = TOUR_STEPS[_tourStep];
  if (!step?.type) return;
  const input = document.getElementById('terminal-input');
  if (input) {
    input.value = step.type;
    if (typeof updateSyntaxHighlight === 'function') updateSyntaxHighlight(step.type);
  }
  if (step.execute) try { step.execute(); } catch(e) {}
}

function _clearTerminal() {
  _stopTyping();
  const input = document.getElementById('terminal-input');
  if (input) {
    input.value = '';
    if (typeof updateSyntaxHighlight === 'function') updateSyntaxHighlight('');
  }
}

// ---- Navigation ----
function _next() {
  if (_typing) { _skipTyping(); return; }
  const cur = TOUR_STEPS[_tourStep];
  if (cur?.afterHide) try { cur.afterHide(); } catch(e) {}
  if (_tourStep < TOUR_STEPS.length - 1) { _tourStep++; _showStep(_tourStep); }
  else closeTour();
}

function _prev() {
  if (_tourStep === 0) return;
  _stopTyping();
  const cur = TOUR_STEPS[_tourStep];
  if (cur?.afterHide) try { cur.afterHide(); } catch(e) {}
  _tourStep--;
  _showStep(_tourStep);
}