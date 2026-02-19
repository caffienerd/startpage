// ========================================
// Time
// ========================================
function updateTime() {
  const timeDisplay = document.getElementById('time-display');
  const now = new Date();
  const hours   = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  timeDisplay.textContent = `${hours}:${minutes}`;
}

// ========================================
// Weather
// ========================================
async function updateWeather() {
  const weatherDisplay = document.getElementById('weather-display');
  const location = getStoredWeatherLocation();

  try {
    const geoRes  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`);
    const geoData = await geoRes.json();

    if (geoData.results && geoData.results.length > 0) {
      const { latitude, longitude, name } = geoData.results[0];
      const weatherRes  = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
      const weatherData = await weatherRes.json();
      const temp = Math.round(weatherData.current_weather.temperature);
      weatherDisplay.innerHTML = `<span>${name} ${temp}°C</span>`;
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
  if (ua.includes("Chrome"))  return "chrome";
  if (ua.includes("Firefox")) return "firefox";
  if (ua.includes("Safari"))  return "safari";
  return "unknown";
}