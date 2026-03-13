// ========================================
// Spell Check Modal
// ========================================
const spellState = {
  suggestions: [],
  selectedIndex: 0,
  abortController: null,
  correctWord: null
};

// Minimum Zipf frequency score to trust a word as "correct".
// Zipf scale: 0 = nonexistent, 3 = rare, 5 = common, 7 = very common.
// "asthetics" scores ~0; "aesthetics" scores ~3.5.
// Anything below this threshold gets flagged even if it's an exact phonetic match.
const MIN_ZIPF_SCORE = 1.5;

// ---- Keyboard nav ----
const handleSpellKeydown = (e) => {
  const modal = document.getElementById('spell-modal');
  if (!modal?.classList.contains('active')) return;

  if (['ArrowDown', 'ArrowUp', 'Enter', 'd', 'D'].includes(e.key)) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
  
  // D key — define the selected suggestion or the correct word
  if (e.key === 'd' || e.key === 'D') {
    if (spellState.suggestions.length) {
      _defineWord(spellState.suggestions[spellState.selectedIndex]);
    } else if (spellState.correctWord) {
      _defineWord(spellState.correctWord);
    }
    return;
  }

  if (!spellState.suggestions.length) return;

  if (e.key === 'ArrowDown') {
    spellState.selectedIndex = (spellState.selectedIndex + 1) % spellState.suggestions.length;
    renderSpellSuggestions();
  } else if (e.key === 'ArrowUp') {
    spellState.selectedIndex = (spellState.selectedIndex - 1 + spellState.suggestions.length) % spellState.suggestions.length;
    renderSpellSuggestions();
  } else if (e.key === 'Enter') {
    copySpellSuggestion();
  }
};

let spellTypingTimeout = null;

function openSpellModal(query) {
  spellState.suggestions = [];
  spellState.selectedIndex = 0;
  if (spellState.abortController) spellState.abortController.abort();
  spellState.abortController = new AbortController();

  document.getElementById('spell-query-word').textContent = query;
  document.getElementById('spell-result-area').innerHTML = '<span class="spell-unknown">checking...</span>';
  document.getElementById('spell-hint').textContent = '';
  document.getElementById('spell-modal').classList.add('active');

  document.addEventListener('keydown', handleSpellKeydown, true);

  const words = query.trim().split(/\s+/);

  clearTimeout(spellTypingTimeout);
  spellTypingTimeout = setTimeout(() => {
    words.length === 1 ? checkSingleWord(words[0]) : checkMultipleWords(words);
  }, 300);
}

function handleSpellCheck(query) {
  openSpellModal(query);
}

// ---- Extract Zipf frequency from Datamuse tags ----
// Returns a number (0 if not present)
function _zipf(result) {
  if (!result?.tags) return 0;
  const tag = result.tags.find(t => t.startsWith('f:'));
  return tag ? parseFloat(tag.slice(2)) : 0;
}

// ---- Define a word via OneLook (reuses existing def: routing) ----
function _defineWord(word) {
  closeSpellModal();
  navigate(`https://onelook.com/?w=${encodeURIComponent(word)}`);
}

// ---- Single word ----
function checkSingleWord(word) {
  const timeoutId = setTimeout(() => {
    if (spellState.abortController) spellState.abortController.abort();
  }, 5000);

  // Request frequency metadata (md=f) alongside phonetic suggestions
  fetch(
    `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=f&max=8`,
    { signal: spellState.abortController.signal }
  )
    .then(r => r.json())
    .then(results => {
      clearTimeout(timeoutId);
      const area = document.getElementById('spell-result-area');
      const hint = document.getElementById('spell-hint');
      if (!area) return;

      if (!results.length) {
        area.innerHTML = '<span class="spell-unknown">no suggestions found</span>';
        return;
      }

      const topResult = results[0];
      const exactMatch = topResult.word.toLowerCase() === word.toLowerCase();
      const freq = _zipf(topResult);
      const trustedCorrect = exactMatch && freq >= MIN_ZIPF_SCORE;

      if (trustedCorrect) {
        area.innerHTML = `
          <div class="spell-correct-row">
            <span class="spell-correct">✓ Looks correct!</span>
            <button class="spell-define-btn" data-word="${topResult.word}">define</button>
          </div>`;
        area.querySelector('.spell-define-btn').addEventListener('click', (e) => {
          _defineWord(e.target.dataset.word);
        });
        hint.textContent = 'D → define word';
        // Store word for D key
        spellState.correctWord = topResult.word;
        return;
      }
      spellState.correctWord = null;

      // Either not an exact match, or frequency too low to trust —
      // filter out the input itself from suggestions so we don't echo it back
      const filtered = results
        .filter(r => r.word.toLowerCase() !== word.toLowerCase())
        .slice(0, 5);

      if (!filtered.length) {
        // Word exists but is very rare — flag it
        area.innerHTML = '<span class="spell-unknown">word not recognised — check spelling</span>';
        hint.textContent = '';
        return;
      }

      spellState.suggestions = filtered.map(r => r.word);
      spellState.selectedIndex = 0;
      renderSpellSuggestions();
      hint.textContent = '↑ ↓ navigate  ·  Enter to copy  ·  Esc to close';
    })
    .catch(err => {
      if (err.name === 'AbortError') return;
      const area = document.getElementById('spell-result-area');
      if (area) area.innerHTML = '<span class="spell-unknown">offline or error</span>';
    });
}

// ---- Multiple words ----
function checkMultipleWords(words) {
  const area = document.getElementById('spell-result-area');
  const hint = document.getElementById('spell-hint');

  const timeoutId = setTimeout(() => {
    if (spellState.abortController) spellState.abortController.abort();
  }, 5000);

  Promise.all(
    words.map(word => {
      const clean = word.replace(/^[^a-zA-Z']+|[^a-zA-Z']+$/g, '');
      if (!clean) return Promise.resolve({ word, clean, correct: true, suggestion: null });

      return fetch(
        `https://api.datamuse.com/words?sp=${encodeURIComponent(clean)}&md=f&max=8`,
        { signal: spellState.abortController.signal }
      )
        .then(r => r.json())
        .then(results => {
          const topResult = results[0];
          const exactMatch = topResult && topResult.word.toLowerCase() === clean.toLowerCase();
          const freq = exactMatch ? _zipf(topResult) : 0;
          const trustedCorrect = exactMatch && freq >= MIN_ZIPF_SCORE;

          // Best suggestion = highest-frequency result that isn't the input itself
          const best = results.find(r => r.word.toLowerCase() !== clean.toLowerCase());

          return {
            word,
            clean,
            correct: trustedCorrect,
            suggestion: trustedCorrect ? null : (best?.word ?? null)
          };
        })
        .catch(() => ({ word, clean, correct: false, suggestion: null }));
    })
  ).then(wordResults => {
    clearTimeout(timeoutId);
    if (!area) return;

    if (wordResults.every(r => r.correct)) {
      const defineButtons = wordResults
        .map(r => `<button class="spell-define-btn spell-define-word" data-word="${r.clean}">${r.clean}</button>`)
        .join('');
      area.innerHTML = `
        <span class="spell-correct">✓ All words look correct!</span>
        <div class="spell-define-row">${defineButtons}</div>`;
      area.querySelectorAll('.spell-define-word').forEach(btn => {
        btn.addEventListener('click', () => _defineWord(btn.dataset.word));
      });
      hint.textContent = 'Click a word above to define it';
      return;
    }

    const phraseHTML = wordResults.map(r =>
      r.correct
        ? `<span class="spell-word-ok">${r.word}</span>`
        : `<span class="spell-word-bad" title="Did you mean: ${r.suggestion || '?'}">${r.word}</span>`
    ).join(' ');

    const suggestionsHTML = wordResults
      .filter(r => !r.correct && r.suggestion)
      .map(r => `
        <div class="spell-word-row">
          <span class="spell-word-bad-label">${r.clean || r.word}</span>
          <span class="spell-arrow">→</span>
          <span class="spell-suggestion-item spell-word-fix" data-word="${r.suggestion}">${r.suggestion}</span>
        </div>`)
      .join('');

    area.innerHTML = `
      <div class="spell-phrase-preview">${phraseHTML}</div>
      <div class="spell-corrections">${suggestionsHTML}</div>`;

    area.querySelectorAll('.spell-word-fix').forEach(el => {
      el.addEventListener('click', () => { copyToClipboard(el.dataset.word); closeSpellModal(); });
    });

    hint.textContent = 'Click a suggestion to copy  ·  Esc to close';
  });
}

// ---- Render single-word suggestions ----
function renderSpellSuggestions() {
  const area = document.getElementById('spell-result-area');
  if (!area) return;

  area.setAttribute('role', 'listbox');
  area.innerHTML = spellState.suggestions.map((word, i) => `
    <div class="spell-suggestion-item ${i === spellState.selectedIndex ? 'spell-selected' : ''}"
         role="option"
         aria-selected="${i === spellState.selectedIndex}"
         data-index="${i}">
      <span class="spell-index">${i === spellState.selectedIndex ? '▶' : ' '}</span>
      <span class="spell-word">${word}</span>
      ${i === 0 ? '<span class="spell-badge">best match</span>' : ''}
      <button class="spell-define-btn" data-word="${word}">define</button>
    </div>`).join('');

  area.querySelectorAll('.spell-suggestion-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('spell-define-btn')) {
        _defineWord(e.target.dataset.word);
        return;
      }
      spellState.selectedIndex = parseInt(el.dataset.index);
      copySpellSuggestion();
    });
  });
}

// ---- Clipboard ----
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(err => {
      console.error('Clipboard API failed', err);
      fallbackCopyTextToClipboard(text);
    });
  } else {
    fallbackCopyTextToClipboard(text);
  }
}

function fallbackCopyTextToClipboard(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
}

function copySpellSuggestion() {
  const word = spellState.suggestions[spellState.selectedIndex];
  if (word) { copyToClipboard(word); closeSpellModal(); }
}

function closeSpellModal() {
  document.getElementById('spell-modal').classList.remove('active');
  spellState.suggestions = [];
  spellState.selectedIndex = 0;
  spellState.correctWord = null;
  if (spellState.abortController) {
    spellState.abortController.abort();
    spellState.abortController = null;
  }
  document.removeEventListener('keydown', handleSpellKeydown, true);
  document.getElementById('terminal-input').focus();
}