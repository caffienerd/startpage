(function redirectWithThemeShell() {
  try {
    const theme = localStorage.getItem('theme') || 'light';
    const backgroundByTheme = {
      light: '#ffffff',
      dark: '#2d3436',
      black: '#000000',
      nord: '#2e3440',
      newspaper: '#f4efdf',
      coffee: '#2b1b17',
      root: '#050505',
      neon: '#0d0d0d'
    };
    const darkLikeThemes = new Set(['dark', 'black', 'nord', 'coffee', 'root', 'neon']);

    document.documentElement.style.backgroundColor = backgroundByTheme[theme] || '#0d0d0d';
    document.documentElement.style.colorScheme = darkLikeThemes.has(theme) ? 'dark' : 'light';
  } catch (e) {
    // No-op.
  }

  window.location.replace('index.html');
})();
