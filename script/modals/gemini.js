// ========================================
// Gemini Modal + API
// ========================================
function openGeminiModal() {
  document.getElementById('gemini-modal').classList.add('active');
}

function closeGeminiModal() {
  document.getElementById('gemini-modal').classList.remove('active');
}

async function handleGeminiPrompt(prompt) {
  const apiKey = normalizeGeminiApiKey(getStoredGeminiApiKey());
  const primaryModel = getStoredGeminiModel() || DEFAULT_GEMINI_MODEL;
  const systemPrompt = getStoredGeminiSystemPrompt();
  const responseArea = document.getElementById('gemini-response-area');
  const queryText = document.getElementById('gemini-query-text');
  const statusText = document.getElementById('gemini-status');
  const modelBadge = document.getElementById('gemini-model-badge');
  const systemState = document.getElementById('gemini-system-state');

  if (!responseArea || !queryText || !statusText || !modelBadge || !systemState) {
    alert('Gemini UI is missing required elements. Please refresh.');
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
    const modelsToTry = [primaryModel, DEFAULT_GEMINI_MODEL, 'gemini-2.0-flash-lite', 'gemini-2.0-flash']
      .filter((m, i, arr) => !!m && arr.indexOf(m) === i);

    let data = null;
    let usedModel = '';
    let lastErr = '';

    for (const model of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    statusText.textContent = 'Network error';
    responseArea.textContent = `Request failed: ${err?.message || 'Unknown error.'}

If you are on file:// and this keeps failing, check browser privacy/shield settings blocking cross-origin requests.`;
    responseArea.classList.add('gemini-error');
  }
}

function copyGeminiResponse() {
  const area = document.getElementById('gemini-response-area');
  const statusText = document.getElementById('gemini-status');
  if (!area?.textContent?.trim()) return;

  navigator.clipboard.writeText(area.textContent).then(() => {
    if (statusText) statusText.textContent = 'Copied to clipboard';
  }).catch(() => {
    if (statusText) statusText.textContent = 'Copy failed';
  });
}

document.addEventListener('keydown', (e) => {
  const isGeminiOpen = document.getElementById('gemini-modal')?.classList.contains('active');
  if (isGeminiOpen && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
    e.preventDefault();
    copyGeminiResponse();
  }
});
