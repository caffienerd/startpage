(function applyPreloadTheme() {
  try {
    // Apply theme before first paint to prevent flash.
    const initialTheme = localStorage.getItem('theme') || 'light';
    const knownThemes = new Set(['dark', 'black', 'nord', 'newspaper', 'coffee', 'root', 'neon']);
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

    if (knownThemes.has(initialTheme)) {
      document.documentElement.classList.add(`${initialTheme}-mode`);
    }

    document.documentElement.style.backgroundColor = backgroundByTheme[initialTheme] || backgroundByTheme.light;

    const darkLikeThemes = new Set(['dark', 'black', 'nord', 'coffee', 'root', 'neon']);
    document.documentElement.style.colorScheme = darkLikeThemes.has(initialTheme) ? 'dark' : 'light';
  } catch (e) {
    // Ignore storage access failures during early boot.
  }
})();
