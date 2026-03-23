(function redirectWithThemeShell() {
  try {
    const theme = localStorage.getItem('theme') || 'light';
    const backgroundByTheme = {
      light:     '#ffffff',
      dark:      '#2d3436',
      black:     '#000000',
      nord:      '#2e3440',
      newspaper: '#f4efdf',
      coffee:    '#2b1b17',
      root:      '#050505',
      neon:      '#0d0d0d'
    };
    const darkThemes = new Set(['dark', 'black', 'nord', 'coffee', 'root', 'neon']);

    document.documentElement.style.backgroundColor = backgroundByTheme[theme] || '#ffffff';
    document.documentElement.style.colorScheme = darkThemes.has(theme) ? 'dark' : 'light';
  } catch (e) {}

  // Use absolute extension URL so it resolves correctly regardless of folder depth
  const root = (typeof chrome !== 'undefined' && chrome.runtime)
    ? chrome.runtime.getURL('index.html')
    : (typeof browser !== 'undefined' && browser.runtime)
      ? browser.runtime.getURL('index.html')
      : '../index.html'; // localhost fallback

  window.location.replace(root);
})();