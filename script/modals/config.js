// ========================================
// Config Modal
// ========================================
function openConfig() {
  document.getElementById('config-textarea').value      = JSON.stringify(getStoredBookmarks(), null, 2);
  document.getElementById('weather-location').value     = getStoredWeatherLocation();
  document.getElementById('time-zone').value            = getStoredTimezone();
  document.getElementById('config-username').value      = getStoredUsername();
  document.getElementById('gemini-api-key').value       = getStoredGeminiApiKey();
  document.getElementById('gemini-model').value         = getStoredGeminiModel();
  document.getElementById('gemini-system-prompt').value = getStoredGeminiSystemPrompt();
  document.getElementById('ai-mode-enabled').checked    = getStoredAiModeEnabled();
  document.getElementById('ai-route-badge-mode').value  = getStoredAiRouteBadgeMode();
  document.getElementById('config-modal').classList.add('active');
}

function closeConfig() {
  document.getElementById('config-modal').classList.remove('active');
}

function saveConfig() {
  const textarea      = document.getElementById('config-textarea');
  const weatherInput  = document.getElementById('weather-location');
  const timezoneInput = document.getElementById('time-zone');
  const usernameInput = document.getElementById('config-username');
  const geminiKeyInput = document.getElementById('gemini-api-key');
  const geminiModelInput = document.getElementById('gemini-model');
  const geminiSystemPromptInput = document.getElementById('gemini-system-prompt');
  const aiModeEnabledInput = document.getElementById('ai-mode-enabled');
  const aiRouteBadgeModeInput = document.getElementById('ai-route-badge-mode');

  let bookmarks = null;
  let bookmarkError = false;

  try {
    const parsed = JSON.parse(textarea.value);
    if (Array.isArray(parsed)) {
      bookmarks = parsed;
    } else {
      bookmarkError = true;
    }
  } catch {
    bookmarkError = true;
  }

  if (bookmarks) {
    saveBookmarks(bookmarks);
  }

  saveWeatherLocation(weatherInput.value  || DEFAULT_WEATHER_LOCATION);
  saveTimezone(timezoneInput.value        || DEFAULT_TIMEZONE);
  if (usernameInput.value.trim()) saveUsername(usernameInput.value.trim());
  saveGeminiApiKey(geminiKeyInput.value);
  saveGeminiModel(geminiModelInput.value.trim() || DEFAULT_GEMINI_MODEL);
  saveGeminiSystemPrompt(geminiSystemPromptInput.value);
  saveAiModeEnabled(!!aiModeEnabledInput.checked);
  saveAiRouteBadgeMode(aiRouteBadgeModeInput.value);

  generateBookmarks();
  updateWeather();
  closeConfig();
  if (typeof hideAiRouteBadge === 'function') hideAiRouteBadge();
  initializeTerminal();

  if (bookmarkError) {
    alert('AI/config settings saved. Bookmarks JSON was invalid, so bookmarks were not updated.');
  }
}
