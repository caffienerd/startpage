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
// Browser detection (used by commands.js)
// ========================================
function getBrowser() {
  const ua = navigator.userAgent;
  if (navigator.brave && navigator.brave.isBrave) return "brave";
  if (ua.includes("Edg/")) return "edge";
  if (ua.includes("Firefox")) return "firefox";
  if (ua.includes("Chrome")) return "chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "safari";
  return "unknown";
}