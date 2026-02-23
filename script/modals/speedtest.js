// ========================================
// Speed Test Modal
// ========================================
function openSpeedTest() {
  document.getElementById('speed-modal').classList.add('active');
  document.getElementById('speed-download').textContent = '--';
  document.getElementById('speed-upload').textContent = '--';
  document.getElementById('speed-ping').textContent = '--';
  document.getElementById('speed-signal').textContent = '--';
  document.getElementById('speed-progress-bar').style.width = '0%';
  document.getElementById('speed-status').textContent = 'Starting test...';
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
  const statusEl = document.getElementById('speed-status');
  const progressEl = document.getElementById('speed-progress-bar');
  const dlEl = document.getElementById('speed-download');
  const ulEl = document.getElementById('speed-upload');
  const pingEl = document.getElementById('speed-ping');
  const signalEl = document.getElementById('speed-signal');
  const timerEl = document.getElementById('speed-timer');

  const updateProgress = (pct) => progressEl.style.width = pct + '%';
  const setStatus = (txt) => statusEl.textContent = txt;

  // Measurement State
  let totalBytes = 0;
  let startTime = 0;
  let currentMbps = 0;
  let isActive = true;

  // Timer
  const timerStart = Date.now();
  const timerInterval = setInterval(() => {
    const s = Math.floor((Date.now() - timerStart) / 1000);
    timerEl.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }, 100);
  const stopTimer = () => {
    clearInterval(timerInterval);
    isActive = false;
  };

  const signalStrength = (pings) => {
    if (pings.length < 2) return 'N/A';
    const avg = pings.reduce((a, b) => a + b, 0) / pings.length;
    const jitter = Math.sqrt(pings.reduce((s, p) => s + (p - avg) ** 2, 0) / pings.length);
    if (jitter < 5) return 'Excellent';
    if (jitter < 15) return 'Very Good';
    if (jitter < 30) return 'Good';
    if (jitter < 50) return 'Fair';
    return 'Poor';
  };

  /**
   * Core measurement engine: Professional sustained throughput
   * @param {string} type 'download' or 'upload'
   * @param {number} durationMs total time to run
   * @param {number} streams number of parallel streams
   */
  async function performTest(type, durationMs, streams) {
    totalBytes = 0;
    startTime = performance.now();
    const endTime = startTime + durationMs;

    const displayUpdateInterval = 150; // ms
    let lastDisplayUpdate = startTime;

    // Adaptive chunk size
    let chunkSize = type === 'download' ? 5 * 1024 * 1024 : 1 * 1024 * 1024;

    async function worker() {
      while (performance.now() < endTime && isActive) {
        try {
          const streamStart = performance.now();
          if (type === 'download') {
            const res = await fetch(`https://speed.cloudflare.com/__down?bytes=${chunkSize}`, { cache: 'no-store' });
            const reader = res.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              totalBytes += value.length;
              updateVisuals();
            }
          } else {
            const data = generateRandomData(chunkSize);
            await fetch('https://speed.cloudflare.com/__up', { method: 'POST', body: data, cache: 'no-store' });
            totalBytes += chunkSize;
            updateVisuals();
          }

          // Adaptive chunking: if it took less than 200ms, double it (up to 25MB)
          const streamDuration = performance.now() - streamStart;
          if (streamDuration < 200 && chunkSize < 25 * 1024 * 1024) {
            chunkSize *= 1.5;
          }
        } catch (e) {
          console.warn('Stream failed, retrying...', e);
          await new Promise(r => setTimeout(r, 500));
        }
      }
    }

    function updateVisuals() {
      const now = performance.now();
      if (now - lastDisplayUpdate < displayUpdateInterval) return;

      const elapsed = (now - startTime) / 1000;
      const mbps = (totalBytes * 8) / elapsed / 1e6;

      // Professional smoothing
      currentMbps = currentMbps === 0 ? mbps : currentMbps * 0.8 + mbps * 0.2;

      if (type === 'download') dlEl.textContent = currentMbps.toFixed(2);
      else ulEl.textContent = currentMbps.toFixed(2);

      lastDisplayUpdate = now;
    }

    // Launch worker pool
    const workers = Array.from({ length: streams }, () => worker());

    // Wait for the duration to pass
    while (performance.now() < endTime && isActive) {
      const progressBase = type === 'download' ? 10 : 55;
      const progressScale = 45;
      const elapsedPct = (performance.now() - startTime) / durationMs;
      updateProgress(progressBase + (elapsedPct * progressScale));
      await new Promise(r => setTimeout(r, 100));
    }

    await Promise.all(workers);
    return currentMbps;
  }

  try {
    // 1. PING & WARMUP
    setStatus('Stabilizing... (TCP Warmup)');
    updateProgress(5);
    const pings = [];
    // 5s Warmup/Ping phase
    const pingStart = performance.now();
    while (performance.now() - pingStart < 3000) {
      const t = performance.now();
      await fetch('https://www.cloudflare.com/cdn-cgi/trace', { mode: 'no-cors', cache: 'no-store' }).catch(() => { });
      pings.push(Math.round(performance.now() - t));
      updateProgress(5 + ((performance.now() - pingStart) / 3000) * 5);
      await new Promise(r => setTimeout(r, 100));
    }
    pingEl.textContent = Math.round(pings.reduce((a, b) => a + b, 0) / pings.length);
    signalEl.textContent = signalStrength(pings);

    // 2. DOWNLOAD (15 Seconds / 5 Streams)
    setStatus('Testing Download (Sustaining...)');
    currentMbps = 0;
    const finalDl = await performTest('download', 15000, 5);
    dlEl.textContent = finalDl.toFixed(2);

    // 3. UPLOAD (12 Seconds / 4 Streams)
    setStatus('Testing Upload (Sustaining...)');
    currentMbps = 0;
    const finalUl = await performTest('upload', 12000, 4);
    ulEl.textContent = finalUl.toFixed(2);

    updateProgress(100);
    setStatus('Test Complete');
    stopTimer();

  } catch (error) {
    console.error('Speed test error:', error);
    setStatus('Test failed: Check connection');
    stopTimer();
  }
}