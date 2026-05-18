(function () {
  try {
    var stored = localStorage.getItem('faktur_platform_theme');
    var theme = stored || 'system';
    var resolved =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme;
    var root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
  } catch (e) {
    // localStorage unavailable — fall through, React will apply default
  }
})();
