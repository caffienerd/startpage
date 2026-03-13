// ========================================
// Pronounce Modal
// ========================================

const pronounceState = {
  results:    [],   // [{ word, cleanWord, ipa, audio }]
  queueIndex: 0,
  isPlaying:  false,
  fullQuery:  '',
};

const handlePronounceKeydown = (e) => {
  const modal = document.getElementById('pronounce-modal');
  if (!modal?.classList.contains('active')) return;
  if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    e.stopImmediatePropagation();
    _togglePronounce();
    return;
  }
  if (e.key === 'd' || e.key === 'D') {
    e.preventDefault();
    e.stopImmediatePropagation();
    const word = document.getElementById('pronounce-query-word')?.textContent?.trim();
    if (word) { closePronounceModal(); navigate(`https://onelook.com/?w=${encodeURIComponent(word)}`); }
    return;
  }
};

function handlePronounce(query) {
  const trimmed = query.trim();
  if (!trimmed) return;
  _stopPronounce();
  Object.assign(pronounceState, { results: [], queueIndex: 0, fullQuery: trimmed });

  document.getElementById('pronounce-query-word').textContent = trimmed;
  document.getElementById('pronounce-result-area').innerHTML = '<span class="pronounce-loading">fetching...</span>';
  document.getElementById('pronounce-hint').textContent = '';
  document.getElementById('pronounce-modal').classList.add('active');
  document.addEventListener('keydown', handlePronounceKeydown, true);

  const words = trimmed.split(/\s+/).filter(Boolean);
  Promise.all(words.map(w => _fetchWordData(w))).then(results => {
    pronounceState.results = results;
    _renderResults(results);
  });
}

// ---- IPA → readable syllable format ----
// Converts /ˌnjuːmə.nəʊ.ʌl/ → nyoo·muh·noh·uhl
function ipaToReadable(ipa) {
  let s = ipa.replace(/^[\[\/]|[\]\/]$/g, '').trim();

  // Step 1: stress marks → syllable dot (they mark syllable onset)
  s = s.replace(/[ˈˌ]/g, '.');

  // Step 2: multi-char IPA sequences → placeholders (prevents double-processing)
  // Order matters: longer/more specific patterns first
  const multiMap = [
    ['nj','ny'],  // nj onset → ny (e.g. njuː → nyoo)
    ['tʃ','ch'], ['dʒ','j'],
    ['juː','yoo'],['iː','ee'],['uː','oo'],
    ['ɑː','ah'], ['ɔː','aw'],['ɜː','ur'],['ɛː','air'],
    ['aɪ','ai'], ['aʊ','ow'],['eɪ','ay'],['ɔɪ','oy'],
    ['əʊ','oh'], ['oʊ','oh'],
    ['ɪə','eer'],['eə','air'],['ʊə','oor'],
    ['ju','yoo'],
    ['tɹ','tr'],['dɹ','dr'],['ɹ','r'],['ŋ','ng'],
  ];
  const phs = [];
  for (let i = 0; i < multiMap.length; i++) {
    const [from, to] = multiMap[i];
    const ph = String.fromCodePoint(0xE000 + i); // private-use Unicode, safe placeholder
    phs.push([ph, to]);
    s = s.split(from).join(ph);
  }

  // Step 3: strip remaining length marks
  s = s.replace(/[ːˑ]/g, '');

  // Step 4: single-char IPA → ASCII
  const single = {
    'ə':'uh','ʌ':'uh','æ':'a', 'ɛ':'e',
    'ɪ':'i', 'ɒ':'aw','ɔ':'aw','ʊ':'oo',
    'i':'ee','u':'oo','e':'e', 'o':'oh','a':'a',
    'θ':'th','ð':'dh','ʃ':'sh','ʒ':'zh',
    'x':'kh','ɡ':'g', 'j':'y', 'ɫ':'l',
    'ʔ':'',  'ʰ':'',  'ʲ':'',
  };
  let out = '';
  for (const ch of s) out += single[ch] ?? ch;

  // Step 5: expand placeholders
  for (const [ph, to] of phs) out = out.split(ph).join(to);

  // Step 6: IPA syllable dots → · and clean up
  out = out.split('.').join('·');
  out = out.replace(/·{2,}/g, '·').replace(/^·|·$/g, '');
  return out;
}

// ---- Fetch ----

// Strip leading/trailing punctuation for API lookups
function _clean(word) {
  return word.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');
}

async function _fetchWordData(word) {
  const clean = _clean(word);
  if (!clean) return { word, cleanWord: word, ipa: null, audio: null };

  const [wikt, dict] = await Promise.all([_fetchWiktIPA(clean), _fetchFreeDictData(clean)]);
  return { word, cleanWord: clean, ipa: wikt.ipa || dict.ipa || null, audio: dict.audio || null };
}

async function _fetchWiktIPA(word) {
  try {
    const url = `https://en.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(word)}&prop=text&format=json&origin=*`;
    const res  = await fetch(url);
    if (!res.ok) return { ipa: null };
    const data = await res.json();
    const html = data?.parse?.text?.['*'];
    if (!html) return { ipa: null };

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const ipaSpans = [];

    // Scope to English section
    const engH2 = [...doc.querySelectorAll('h2')].find(h => h.textContent.toLowerCase().includes('english'));
    if (engH2) {
      let el = engH2.nextElementSibling;
      while (el && el.tagName !== 'H2') {
        el.querySelectorAll('span.IPA').forEach(s => ipaSpans.push(s));
        el = el.nextElementSibling;
      }
    }
    if (!ipaSpans.length) doc.querySelectorAll('span.IPA').forEach(s => ipaSpans.push(s));

    // First clean phonemic /.../ form only
    const texts = ipaSpans.map(s => s.textContent.trim()).filter(Boolean);
    const phonemic = texts.find(t => t.startsWith('/') && t.endsWith('/'));
    const fallback = texts.find(t => t.includes('/') || t.includes('['));
    return { ipa: phonemic || fallback || null };
  } catch { return { ipa: null }; }
}

async function _fetchFreeDictData(word) {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) return { audio: null, ipa: null };
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return { audio: null, ipa: null };
    const entry    = data[0];
    const phonetics = entry.phonetics || [];
    const ipa      = phonetics.find(p => p.text)?.text || entry.phonetic || null;
    const chosen   = phonetics.find(p => p.audio?.includes('-us')) || phonetics.find(p => p.audio);
    const audio    = chosen?.audio
      ? (chosen.audio.startsWith('//') ? 'https:' + chosen.audio : chosen.audio)
      : null;
    return { audio, ipa };
  } catch { return { audio: null, ipa: null }; }
}

// ---- Render ----

function _renderResults(results) {
  const area   = document.getElementById('pronounce-result-area');
  const hint   = document.getElementById('pronounce-hint');
  const hasTTS = 'speechSynthesis' in window;
  const canPlay = results.some(r => r.audio) || hasTTS;

  area.innerHTML = results.map(r => {
    let ipaHtml = '<span class="pronounce-no-phonetic">—</span>';
    if (r.ipa) {
      const readable = ipaToReadable(r.ipa);
      ipaHtml = `
        <span class="pronounce-readable">${readable}</span>
        <span class="pronounce-ipa-small">${r.ipa}</span>`;
    }
    return `
      <div class="pronounce-word-row">
        <span class="pronounce-word-label">${r.word}</span>
        <span class="pronounce-phonetic-wrap">${ipaHtml}</span>
      </div>`;
  }).join('')
    + (canPlay ? `
    <div class="pronounce-play-row">
      <button class="pronounce-play-btn" id="pronounce-play-btn">
        <span class="pronounce-play-icon">▶</span>
        <span class="pronounce-play-label">Play</span>
      </button>
    </div>` : '');

  document.getElementById('pronounce-play-btn')?.addEventListener('click', _togglePronounce);
  hint.textContent = `${canPlay ? 'Space → play/stop  ·  ' : ''}D → define  ·  Esc to close`;
}

// ---- Playback ----

function _togglePronounce() {
  pronounceState.isPlaying ? _stopPronounce() : _startPronounce();
}

function _startPronounce() {
  pronounceState.isPlaying  = true;
  pronounceState.queueIndex = 0;
  _updatePlayButton(true);

  const results = pronounceState.results;
  const hasAnyMP3 = results.some(r => r.audio);

  if (!hasAnyMP3) {
    // All TTS — speak the full phrase at once (sounds natural)
    _speakFullPhrase();
  } else {
    _playNext();
  }
}

function _speakFullPhrase() {
  if (!('speechSynthesis' in window) || !pronounceState.isPlaying) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(pronounceState.fullQuery);
  utt.lang  = 'en-US';
  utt.rate  = 0.9;
  const voices = window.speechSynthesis.getVoices();
  const en = voices.find(v => v.lang === 'en-US' && v.localService) || voices.find(v => v.lang.startsWith('en'));
  if (en) utt.voice = en;
  utt.onend = utt.onerror = () => {
    pronounceState.isPlaying = false;
    _updatePlayButton(false);
  };
  window.speechSynthesis.speak(utt);
}

function _playNext() {
  if (!pronounceState.isPlaying) return;

  const results = pronounceState.results;
  const i = pronounceState.queueIndex;

  if (i >= results.length) {
    pronounceState.isPlaying = false;
    _updatePlayButton(false);
    return;
  }

  pronounceState.queueIndex++;
  const r = results[i];

  if (r.audio) {
    const audio = new Audio(r.audio);
    audio.onended = () => {
      if (pronounceState.isPlaying) setTimeout(_playNext, 120);
    };
    audio.onerror = () => {
      // MP3 failed — TTS this word then continue
      _speakSingleWord(r.cleanWord, () => {
        if (pronounceState.isPlaying) setTimeout(_playNext, 120);
      });
    };
    audio.play().catch(() => {
      _speakSingleWord(r.cleanWord, () => {
        if (pronounceState.isPlaying) setTimeout(_playNext, 120);
      });
    });
  } else {
    // No MP3 — TTS this word then continue
    _speakSingleWord(r.cleanWord, () => {
      if (pronounceState.isPlaying) setTimeout(_playNext, 120);
    });
  }
}

function _speakSingleWord(word, onDone) {
  if (!('speechSynthesis' in window)) { onDone?.(); return; }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(word);
  utt.lang  = 'en-US';
  utt.rate  = 0.85;
  const voices = window.speechSynthesis.getVoices();
  const en = voices.find(v => v.lang === 'en-US' && v.localService) || voices.find(v => v.lang.startsWith('en'));
  if (en) utt.voice = en;
  utt.onend = utt.onerror = () => onDone?.();
  window.speechSynthesis.speak(utt);
}

function _stopPronounce() {
  pronounceState.isPlaying = false;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  _updatePlayButton(false);
}

function _updatePlayButton(playing) {
  const btn = document.getElementById('pronounce-play-btn');
  if (!btn) return;
  btn.querySelector('.pronounce-play-icon').textContent = playing ? '■' : '▶';
  btn.querySelector('.pronounce-play-label').textContent = playing ? 'Stop' : 'Play';
  btn.classList.toggle('pronounce-playing', playing);
}

// ---- Close ----

function closePronounceModal() {
  _stopPronounce();
  Object.assign(pronounceState, { results: [], queueIndex: 0, fullQuery: '' });
  document.getElementById('pronounce-modal').classList.remove('active');
  document.removeEventListener('keydown', handlePronounceKeydown, true);
  document.getElementById('terminal-input')?.focus();
}