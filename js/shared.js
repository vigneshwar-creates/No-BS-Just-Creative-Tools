// Shared functionality for all JCT pages

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initKeyboardShortcuts();
  initHistory();
});

function initTheme() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;
  
  const savedTheme = localStorage.getItem('jct-theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }
  
  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('jct-theme', newTheme);
  });
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      const routes = {
        '1': 'ascii.html',
        '2': 'filters.html',
        '3': 'palette.html',
        '4': 'gradient.html',
        '5': 'bigtext.html',
        '6': 'qrcode.html',
        '7': 'base64.html',
        '8': 'lorem.html',
        '9': 'resize.html',
        '0': 'colormixer.html'
      };
      if (routes[key]) {
        e.preventDefault();
        window.location.href = routes[key];
      }
      if (key === 't') {
        e.preventDefault();
        document.getElementById('theme-toggle')?.click();
      }
    }
  });
}

function initHistory() {
  window.jctHistory = {
    save: (tool, data) => {
      const history = JSON.parse(localStorage.getItem('jct-history') || '[]');
      history.unshift({ tool, data, timestamp: Date.now() });
      if (history.length > 50) history.pop();
      localStorage.setItem('jct-history', JSON.stringify(history));
    },
    get: (tool) => {
      const history = JSON.parse(localStorage.getItem('jct-history') || '[]');
      return tool ? history.filter(h => h.tool === tool) : history;
    },
    clear: () => localStorage.removeItem('jct-history')
  };
}

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.textContent;
    btn.textContent = 'COPIED!';
    btn.style.color = 'var(--accent2)';
    setTimeout(() => {
      btn.textContent = original;
      btn.style.color = '';
    }, 1500);
  });
}