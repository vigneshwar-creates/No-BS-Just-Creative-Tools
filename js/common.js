// common.js – shared utilities for the FunApp

/**
 * Inject a simple top navigation bar into the page body.
 * The bar contains links to all feature pages and highlights the current page.
 */
function injectNavBar() {
  const nav = document.createElement('nav');
  nav.className = 'funapp-nav';
  const pages = [
    { href: 'index.html', label: 'Home' },
    { href: 'palette.html', label: 'Palette' },
    { href: 'gradient.html', label: 'Gradient' },
    { href: 'ascii.html', label: 'ASCII' },
    { href: 'bigtext.html', label: 'Big Text' },
    { href: 'filters.html', label: 'Filters' },
    { href: 'gif.html', label: 'GIF' },
    { href: 'pdf.html', label: 'PDF' },
    { href: 'qrcode.html', label: 'QR Code' },
    { href: 'lorem.html', label: 'Lorem' },
    { href: 'base64.html', label: 'Base64' },
    { href: 'colormixer.html', label: 'Color Mixer' },
    { href: 'resize.html', label: 'Resize' },
    { href: 'uuid.html', label: 'UUID' }
  ];
  const ul = document.createElement('ul');
  pages.forEach(p => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = p.href;
    a.textContent = p.label;
    if (location.pathname.endsWith(p.href)) {
      a.classList.add('active');
    }
    li.appendChild(a);
    ul.appendChild(li);
  });
  nav.appendChild(ul);
  // Insert at top of body
  document.body.insertBefore(nav, document.body.firstChild);
}

/**
 * Show a temporary toast message.
 * @param {string} msg Message to display
 * @param {number} [duration=2000] Time in ms before it disappears
 */
function showToast(msg, duration = 2000) {
  const toast = document.createElement('div');
  toast.className = 'funapp-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('visible'), 10);
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Initialize page – inject nav and bind any generic UI helpers.
 */
function initFunApp() {
  injectNavBar();
  // expose toast globally for other scripts
  window.showToast = showToast;
}

// Run after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFunApp);
} else {
  initFunApp();
}
