// ========================================
// Time
// ========================================
function updateTime() {
  const timeDisplay = document.getElementById('time-display');
  const now = new Date();
  const tz = getStoredTimezone();
  let timeStr;
  try {
    timeStr = new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);
  } catch (e) {
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    timeStr = `${hours}:${minutes}`;
  }
  timeDisplay.textContent = timeStr;
}

// ========================================
// Weather Constants
// ========================================
const GEO_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const WEATHER_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ========================================
// Weather
// ========================================
async function updateWeather() {
  const weatherDisplay = document.getElementById('weather-display');
  const location = getStoredWeatherLocation();
  const unit = getStoredWeatherUnit();

  const cacheKey = `weather_${location}_${unit}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < WEATHER_CACHE_TTL) {
        weatherDisplay.innerHTML = `<span>${data.name} ${data.temp}°${unit === 'fahrenheit' ? 'F' : 'C'}</span>`;
        return;
      }
    } catch (e) { /* ignore cache parse error */ }
  }

  weatherDisplay.innerHTML = `<span>Loading...</span>`;

  try {
    const geoRes = await fetch(`${GEO_API}?name=${encodeURIComponent(location)}&count=1&language=en&format=json`);
    const geoData = await geoRes.json();

    if (geoData.results && geoData.results.length > 0) {
      const { latitude, longitude, name } = geoData.results[0];
      const weatherRes = await fetch(`${WEATHER_API}?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
      const weatherData = await weatherRes.json();

      let temp = weatherData.current_weather.temperature;
      if (unit === 'fahrenheit') temp = (temp * 9 / 5) + 32;
      temp = Math.round(temp);

      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        name,
        temp
      }));

      weatherDisplay.innerHTML = `<span>${name} ${temp}°${unit === 'fahrenheit' ? 'F' : 'C'}</span>`;
    } else {
      weatherDisplay.innerHTML = `<span>${location}</span>`;
    }
  } catch (error) {
    console.error('Weather fetch error:', error);
    weatherDisplay.innerHTML = `<span>${location}</span>`;
  }
}

// ========================================
// Browser detection (used by commands.js and terminal.js)
// ========================================

// Known brands to skip in userAgentData — these are noise, not real browser names
const _GENERIC_BRANDS = new Set([
  'chromium', 'google chrome', 'not a brand', 'not;a brand', 'not/a)brand',
  'not_a brand', 'not?a_brand', 'not-a.brand',
]);

// UA string rules — most specific first
const _UA_RULES = [
  [/Brave/i,            'brave'],
  [/Helium/i,           'helium'],
  [/EdgA?\//i,          'edge'],
  [/OPR\//i,            'opera'],
  [/YaBrowser\//i,      'yandex'],
  [/Vivaldi\//i,        'vivaldi'],
  [/Firefox\//i,        'firefox'],
  [/SamsungBrowser\//i, 'samsung'],
  [/Chrome\//i,         'chrome'],
  [/Safari\//i,         'safari'],
];

function getBrowser() {
  // Tier 1: Brave-specific API
  if (typeof navigator.brave?.isBrave === 'function') return 'brave';

  // Tier 2: userAgentData brands — Chromium forks sometimes expose their real name here
  const brands = navigator.userAgentData?.brands;
  if (Array.isArray(brands)) {
    for (const { brand } of brands) {
      if (!_GENERIC_BRANDS.has(brand.toLowerCase())) return brand;
    }
  }

  // Tier 3: UA string rules
  const ua = navigator.userAgent;
  for (const [re, name] of _UA_RULES) {
    if (re.test(ua)) return name;
  }

  return 'browser';
}