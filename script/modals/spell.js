// ========================================
// Spell Check Modal
// ========================================
let spellSuggestions  = [];
let spellSelectedIndex = 0;

function openSpellModal(query) {
  spellSuggestions   = [];
  spellSelectedIndex = 0;

  document.getElementById('spell-query-word').textContent    = query;
  document.getElementById('spell-result-area').innerHTML     = '<span class="spell-unknown">checking...</span>';
  document.getElementById('spell-hint').textContent          = '';
  document.getElementById('spell-modal').classList.add('active');

  const words = query.trim().split(/\s+/);
  words.length === 1 ? checkSingleWord(words[0]) : checkMultipleWords(words);
}

function handleSpellCheck(query) {
  openSpellModal(query);
}

// ---- Single word ----
function checkSingleWord(word) {
  fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&max=5`)
    .then(r => r.json())
    .then(results => {
      const area = document.getElementById('spell-result-area');
      const hint = document.getElementById('spell-hint');
      if (!area) return;

      if (!results.length) {
        area.innerHTML = '<span class="spell-unknown">no suggestions found</span>';
        return;
      }

      const isCorrect = results[0].word.toLowerCase() === word.toLowerCase();
      if (isCorrect) {
        area.innerHTML   = '<span class="spell-correct">✓ Looks correct!</span>';
        hint.textContent = '';
        return;
      }

      spellSuggestions   = results.map(r => r.word);
      spellSelectedIndex = 0;
      renderSpellSuggestions();
      hint.textContent = '↑ ↓ navigate  ·  Enter to copy  ·  Esc to close';
    })
    .catch(() => {
      const area = document.getElementById('spell-result-area');
      if (area) area.innerHTML = '<span class="spell-unknown">offline or error</span>';
    });
}

// ---- Multiple words ----
function checkMultipleWords(words) {
  const area = document.getElementById('spell-result-area');
  const hint = document.getElementById('spell-hint');

  Promise.all(
    words.map(word => {
      const clean = word.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');
      if (!clean) return Promise.resolve({ word, clean, correct: true, suggestion: null });

      return fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(clean)}&max=5`)
        .then(r => r.json())
        .then(results => {
          const exactMatch    = results.some(r => r.word.toLowerCase() === clean.toLowerCase());
          const topSuggestion = results[0]?.word ?? null;
          return { word, clean, correct: exactMatch, suggestion: exactMatch ? null : topSuggestion };
        })
        .catch(() => ({ word, clean, correct: false, suggestion: null }));
    })
  ).then(wordResults => {
    if (!area) return;

    if (wordResults.every(r => r.correct)) {
      area.innerHTML   = '<span class="spell-correct">✓ All words look correct!</span>';
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

  area.innerHTML = spellSuggestions.map((word, i) => `
    <div class="spell-suggestion-item ${i === spellSelectedIndex ? 'spell-selected' : ''}" data-index="${i}">
      <span class="spell-index">${i === spellSelectedIndex ? '▶' : ' '}</span>
      <span class="spell-word">${word}</span>
      ${i === 0 ? '<span class="spell-badge">best match</span>' : ''}
    </div>`).join('');

  area.querySelectorAll('.spell-suggestion-item').forEach(el => {
    el.addEventListener('click', () => {
      spellSelectedIndex = parseInt(el.dataset.index);
      copySpellSuggestion();
    });
  });
}

// ---- Clipboard ----
function copyToClipboard(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

function copySpellSuggestion() {
  const word = spellSuggestions[spellSelectedIndex];
  if (word) { copyToClipboard(word); closeSpellModal(); }
}

function closeSpellModal() {
  document.getElementById('spell-modal').classList.remove('active');
  spellSuggestions   = [];
  spellSelectedIndex = 0;
  document.getElementById('terminal-input').focus();
}

// Keyboard nav ? capture phase so Enter doesn't also fire search
document.addEventListener('keydown', (e) => {
  const modal = document.getElementById('spell-modal');
  if (!modal?.classList.contains('active')) return;

  if (['ArrowDown','ArrowUp','Enter'].includes(e.key)) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
  if (!spellSuggestions.length) return;

  if (e.key === 'ArrowDown')  spellSelectedIndex = (spellSelectedIndex + 1) % spellSuggestions.length, renderSpellSuggestions();
  else if (e.key === 'ArrowUp') spellSelectedIndex = (spellSelectedIndex - 1 + spellSuggestions.length) % spellSuggestions.length, renderSpellSuggestions();
  else if (e.key === 'Enter') copySpellSuggestion();
}, true);