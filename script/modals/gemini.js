// ========================================
// Gemini Modal + API
// ========================================
let geminiAbortController = null;

const handleGeminiCopyShortcut = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
    e.preventDefault();
    copyGeminiResponse();
  }
};

function openGeminiModal() {
  document.getElementById('gemini-modal').classList.add('active');
  document.addEventListener('keydown', handleGeminiCopyShortcut);
}

function closeGeminiModal() {
  document.getElementById('gemini-modal').classList.remove('active');
  document.removeEventListener('keydown', handleGeminiCopyShortcut);

  if (geminiAbortController) {
    geminiAbortController.abort();
    geminiAbortController = null;
  }
}

async function handleGeminiPrompt(prompt) {
  if (window.location.protocol === 'file:') {
    showAlert(
      'Gemini API requires HTTPS or localhost HTTP.\n\nPlease serve this page via a local web server:\n  python3 -m http.server',
      { type: 'warning', title: 'HTTPS Required' }
    );
    return;
  }

  const apiKey = normalizeGeminiApiKey(getStoredGeminiApiKey());
  const primaryModel = getStoredGeminiModel() || (typeof DEFAULT_GEMINI_MODEL !== 'undefined' ? DEFAULT_GEMINI_MODEL : '');
  const systemPrompt = getStoredGeminiSystemPrompt();
  const responseArea = document.getElementById('gemini-response-area');
  const queryText = document.getElementById('gemini-query-text');
  const statusText = document.getElementById('gemini-status');
  const modelBadge = document.getElementById('gemini-model-badge');
  const systemState = document.getElementById('gemini-system-state');

  if (!responseArea || !queryText || !statusText || !modelBadge || !systemState) {
    showAlert('Gemini UI is missing required elements. Please refresh.', { type: 'error', title: 'UI Error' });
    return;
  }

  queryText.textContent = prompt || '(empty prompt)';
  modelBadge.textContent = primaryModel;
  systemState.textContent = systemPrompt ? `system prompt: on (${systemPrompt.length} chars)` : 'system prompt: off';
  statusText.textContent = 'Thinking...';
  responseArea.textContent = '...';
  responseArea.classList.remove('gemini-error');
  openGeminiModal();

  if (!apiKey) {
    statusText.textContent = 'Configuration required';
    responseArea.textContent = 'Missing Gemini API key. Open :config and set "Gemini API Key".';
    responseArea.classList.add('gemini-error');
    return;
  }

  try {
    const defaultModel = typeof DEFAULT_GEMINI_MODEL !== 'undefined' ? DEFAULT_GEMINI_MODEL : '';
    const modelsToTry = [...new Set([primaryModel, defaultModel, 'gemini-2.0-flash-lite', 'gemini-2.0-flash'].filter(Boolean))];

    let data = null;
    let usedModel = '';
    let lastErr = '';

    geminiAbortController = new AbortController();

    for (const model of modelsToTry) {
      if (geminiAbortController.signal.aborted) throw new Error('Request aborted by user closure.');

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      const res = await fetch(url, {
        method: 'POST',
        signal: geminiAbortController.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          ...(systemPrompt ? {
            systemInstruction: {
              role: 'system',
              parts: [{ text: systemPrompt }]
            }
          } : {}),
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ]
        })
      });

      const attemptData = await res.json();
      if (res.ok) {
        data = attemptData;
        usedModel = model;
        break;
      }

      lastErr = attemptData?.error?.message || `Request failed (${res.status}).`;
    }

    if (!data) {
      statusText.textContent = 'Gemini request failed';
      responseArea.textContent = `Gemini error: ${lastErr}`;
      responseArea.classList.add('gemini-error');
      return;
    }

    const text = data?.candidates?.[0]?.content?.parts
      ?.map((p) => p?.text || '')
      .join('\n')
      .trim();

    statusText.textContent = 'Done';
    modelBadge.textContent = usedModel || primaryModel;
    responseArea.textContent = text || 'No text response returned.';
  } catch (err) {
    if (err.name === 'AbortError') return;

    statusText.textContent = 'Network error';
    responseArea.textContent = `Request failed: ${err?.message || 'Unknown error.'}`;
    responseArea.classList.add('gemini-error');
  } finally {
    geminiAbortController = null;
  }
}

function copyGeminiResponse() {
  const area = document.getElementById('gemini-response-area');
  const statusText = document.getElementById('gemini-status');
  if (!area?.textContent?.trim()) return;

  navigator.clipboard.writeText(area.textContent).then(() => {
    if (statusText) statusText.textContent = 'Copied to clipboard';
    showToast('Copied to clipboard', 'success', 2000);
  }).catch(() => {
    if (statusText) statusText.textContent = 'Copy failed';
    showToast('Copy failed', 'error', 2000);
  });
}