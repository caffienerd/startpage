// ========================================
// Speed Test Modal
// ========================================
function openSpeedTest() {
  document.getElementById('speed-modal').classList.add('active');
  document.getElementById('speed-download').textContent      = '--';
  document.getElementById('speed-upload').textContent        = '--';
  document.getElementById('speed-ping').textContent          = '--';
  document.getElementById('speed-signal').textContent        = '--';
  document.getElementById('speed-progress-bar').style.width  = '0%';
  document.getElementById('speed-status').textContent        = 'Starting test...';
  setTimeout(() => runSpeedTest(), 500);
}

function closeSpeedTest() {
  document.getElementById('speed-modal').classList.remove('active');
}

// Helper: generate large random data within crypto limits
function generateRandomData(size) {
  const MAX = 65536;
  const data = new Uint8Array(size);
  for (let i = 0; i < size; i += MAX) {
    const chunk = new Uint8Array(Math.min(MAX, size - i));
    crypto.getRandomValues(chunk);
    data.set(chunk, i);
  }
  return data;
}

async function runSpeedTest() {
  const statusEl   = document.getElementById('speed-status');
  const progressEl = document.getElementById('speed-progress-bar');
  const dlEl       = document.getElementById('speed-download');
  const ulEl       = document.getElementById('speed-upload');
  const pingEl     = document.getElementById('speed-ping');
  const signalEl   = document.getElementById('speed-signal');
  const timerEl    = document.getElementById('speed-timer');

  // Timer
  const timerStart = Date.now();
  const timerInterval = setInterval(() => {
    const s = Math.floor((Date.now() - timerStart) / 1000);
    timerEl.textContent = `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  }, 100);
  const stopTimer = () => clearInterval(timerInterval);

  // Jitter ? signal strength
  const signalStrength = (pings) => {
    if (pings.length < 2) return 'N/A';
    const avg = pings.reduce((a, b) => a + b, 0) / pings.length;
    const jitter = Math.sqrt(pings.reduce((s, p) => s + (p - avg) ** 2, 0) / pings.length);
    if (jitter < 5)  return 'Excellent';
    if (jitter < 10) return 'Very Good';
    if (jitter < 20) return 'Good';
    if (jitter < 40) return 'Fair';
    return 'Poor';
  };

  try {
    // PING
    statusEl.textContent = 'Testing ping...';
    progressEl.style.width = '5%';
    const pings = [];
    for (let i = 0; i < 5; i++) {
      const t = performance.now();
      await fetch('https://www.cloudflare.com/cdn-cgi/trace', { mode: 'no-cors', cache: 'no-store' }).catch(() => {});
      pings.push(Math.round(performance.now() - t));
    }
    pingEl.textContent   = Math.round(pings.reduce((a, b) => a + b, 0) / pings.length);
    signalEl.textContent = signalStrength(pings);
    progressEl.style.width = '10%';

    // DOWNLOAD (6 × 2.5 MB)
    statusEl.textContent = 'Testing download speed...';
    progressEl.style.width = '15%';
    const dlSpeeds = [];
    for (let i = 0; i < 6; i++) {
      try {
        const t   = performance.now();
        const res = await fetch(`https://speed.cloudflare.com/__down?bytes=2621440`, { cache: 'no-store', priority: 'high' });
        const buf = await res.arrayBuffer();
        const spd = (buf.byteLength * 8) / ((performance.now() - t) / 1000) / 1e6;
        dlSpeeds.push(spd);
        dlEl.textContent = spd.toFixed(2);
        progressEl.style.width = (15 + (i + 1) * 7.5) + '%';
      } catch { /* skip failed chunk */ }
    }
    dlEl.textContent = dlSpeeds.length
      ? (dlSpeeds.reduce((a, b) => a + b, 0) / dlSpeeds.length).toFixed(2)
      : '0.00';
    progressEl.style.width = '60%';

    // UPLOAD (4 × 2 MB)
    statusEl.textContent = 'Testing upload speed...';
    progressEl.style.width = '65%';
    const ulSpeeds = [];
    for (let i = 0; i < 4; i++) {
      try {
        const SIZE = 2097152;
        const t   = performance.now();
        const res = await fetch('https://speed.cloudflare.com/__up', { method: 'POST', body: generateRandomData(SIZE), cache: 'no-store', priority: 'high' });
        await res.text();
        const spd = (SIZE * 8) / ((performance.now() - t) / 1000) / 1e6;
        ulSpeeds.push(spd);
        ulEl.textContent = spd.toFixed(2);
        progressEl.style.width = (65 + (i + 1) * 8.75) + '%';
      } catch { /* skip failed chunk */ }
    }
    ulEl.textContent = ulSpeeds.length
      ? (ulSpeeds.reduce((a, b) => a + b, 0) / ulSpeeds.length).toFixed(2)
      : '0.00';

    progressEl.style.width = '100%';
    statusEl.textContent = 'Test complete!';
    stopTimer();

  } catch (error) {
    console.error('Speed test error:', error);
    statusEl.textContent = 'Test failed: ' + error.message;
    stopTimer();
  }
}