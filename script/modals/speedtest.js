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
  isSpeedTestActive = false;
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

const DOWNLOAD_DURATION = 12000;
const UPLOAD_DURATION = 12000;
const MAX_CHUNK_SIZE = 25 * 1024 * 1024;
const SMOOTHING_FACTOR = 0.8;
const ADAPTIVE_THRESHOLD_MS = 200;
const MAX_RETRIES = 3;

let isSpeedTestActive = false;

function calculateProgress(type, elapsedPct) {
  const base = type === 'download' ? 10 : 55;
  const scale = 45;
  return base + (elapsedPct * scale);
}

async function runSpeedTest() {
  isSpeedTestActive = true;
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

  // Timer
  const timerStart = performance.now();
  const timerInterval = setInterval(() => {
    const s = Math.floor((performance.now() - timerStart) / 1000);
    timerEl.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }, 100);
  const stopTimer = () => {
    clearInterval(timerInterval);
    isSpeedTestActive = false;
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
      let retries = 0;
      while (performance.now() < endTime && isSpeedTestActive) {
        try {
          const streamStart = performance.now();
          if (type === 'download') {
            const res = await fetch(`https://speed.cloudflare.com/__down?bytes=${chunkSize}`, { cache: 'no-store' });
            const reader = res.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done || !isSpeedTestActive) break;
              totalBytes += value.length;
              updateVisuals();
            }
          } else {
            const data = generateRandomData(chunkSize);
            await fetch('https://speed.cloudflare.com/__up', { method: 'POST', body: data, cache: 'no-store' });
            if (!isSpeedTestActive) break;
            totalBytes += chunkSize;
            updateVisuals();
          }

          // Adaptive chunking
          const streamDuration = performance.now() - streamStart;
          if (streamDuration < ADAPTIVE_THRESHOLD_MS && chunkSize < MAX_CHUNK_SIZE) {
            chunkSize *= 1.5;
          }
          retries = 0;
        } catch (e) {
          if (++retries > MAX_RETRIES) throw e;
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
      currentMbps = currentMbps === 0 ? mbps : currentMbps * SMOOTHING_FACTOR + mbps * (1 - SMOOTHING_FACTOR);

      if (type === 'download') dlEl.textContent = currentMbps.toFixed(2);
      else ulEl.textContent = currentMbps.toFixed(2);

      lastDisplayUpdate = now;
    }

    // Launch worker pool
    const workers = Array.from({ length: streams }, () => worker());

    // Wait for the duration to pass
    while (performance.now() < endTime && isSpeedTestActive) {
      const elapsedPct = (performance.now() - startTime) / durationMs;
      updateProgress(calculateProgress(type, elapsedPct));
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
    const finalDl = await performTest('download', DOWNLOAD_DURATION, 5);
    if (isSpeedTestActive) dlEl.textContent = finalDl.toFixed(2);

    // 3. UPLOAD (12 Seconds / 4 Streams)
    if (!isSpeedTestActive) return;
    setStatus('Testing Upload (Sustaining...)');
    currentMbps = 0;
    const finalUl = await performTest('upload', UPLOAD_DURATION, 4);
    if (isSpeedTestActive) ulEl.textContent = finalUl.toFixed(2);

    updateProgress(100);
    setStatus('Test Complete');
    stopTimer();

  } catch (error) {
    console.error('Speed test error:', error);
    setStatus('Test failed: Check connection');
    stopTimer();
  }
}