// ========================================
// Spell Check Modal
// ========================================
const spellState = {
  suggestions: [],
  selectedIndex: 0,
  abortController: null
};

// Keyboard nav 
const handleSpellKeydown = (e) => {
  const modal = document.getElementById('spell-modal');
  if (!modal?.classList.contains('active')) return;

  if (['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
    e.preventDefault();
    e.stopImmediatePropagation();
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
  if (spellState.abortController) {
    spellState.abortController.abort();
  }
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
  }, 300); // basic debounce
}

function handleSpellCheck(query) {
  openSpellModal(query);
}

// ---- Single word ----
function checkSingleWord(word) {
  const timeoutId = setTimeout(() => { if (spellState.abortController) spellState.abortController.abort(); }, 5000);

  fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&max=5`, { signal: spellState.abortController.signal })
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

      const isCorrect = results[0].word.toLowerCase() === word.toLowerCase();
      if (isCorrect) {
        area.innerHTML = '<span class="spell-correct">✓ Looks correct!</span>';
        hint.textContent = '';
        return;
      }

      spellState.suggestions = results.map(r => r.word);
      spellState.selectedIndex = 0;
      renderSpellSuggestions();
      hint.textContent = '↑ ↓ navigate  ·  Enter to copy  ·  Esc to close';
    })
    .catch((err) => {
      if (err.name === 'AbortError') return;
      const area = document.getElementById('spell-result-area');
      if (area) area.innerHTML = '<span class="spell-unknown">offline or error</span>';
    });
}

// ---- Multiple words ----
function checkMultipleWords(words) {
  const area = document.getElementById('spell-result-area');
  const hint = document.getElementById('spell-hint');

  const timeoutId = setTimeout(() => { if (spellState.abortController) spellState.abortController.abort(); }, 5000);

  Promise.all(
    words.map(word => {
      const clean = word.replace(/^[^a-zA-Z']+|[^a-zA-Z']+$/g, '');
      if (!clean) return Promise.resolve({ word, clean, correct: true, suggestion: null });

      return fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(clean)}&max=5`, { signal: spellState.abortController.signal })
        .then(r => r.json())
        .then(results => {
          const exactMatch = results.some(r => r.word.toLowerCase() === clean.toLowerCase());
          const topSuggestion = results[0]?.word ?? null;
          return { word, clean, correct: exactMatch, suggestion: exactMatch ? null : topSuggestion };
        })
        .catch(() => ({ word, clean, correct: false, suggestion: null }));
    })
  ).then(wordResults => {
    clearTimeout(timeoutId);
    if (!area) return;

    if (wordResults.every(r => r.correct)) {
      area.innerHTML = '<span class="spell-correct">✓ All words look correct!</span>';
      hint.textContent = '';
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
    </div>`).join('');

  area.querySelectorAll('.spell-suggestion-item').forEach(el => {
    el.addEventListener('click', () => {
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
  try { document.execCommand('copy'); } catch (e) { }
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
  if (spellState.abortController) {
    spellState.abortController.abort();
    spellState.abortController = null;
  }
  document.removeEventListener('keydown', handleSpellKeydown, true);
  document.getElementById('terminal-input').focus();
}