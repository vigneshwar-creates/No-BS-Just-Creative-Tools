// Shared functionality for all JCT pages

// ── Service Worker Registration (runs on every page) ────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js')
      .then(function (r) { console.log('[JCT] SW active:', r.scope); })
      .catch(function (e) { console.warn('[JCT] SW failed:', e); });
  });
}

// ── Theme ──────────────────────────────────────────────────────────────────
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

// ── Keyboard Shortcuts ─────────────────────────────────────────────────────
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      const routes = {
        '1': 'ascii.html', '2': 'filters.html', '3': 'palette.html',
        '4': 'gradient.html', '5': 'bigtext.html', '6': 'qrcode.html',
        '7': 'base64.html', '8': 'lorem.html', '9': 'resize.html',
        '0': 'colormixer.html'
      };
      if (routes[key]) { e.preventDefault(); window.location.href = routes[key]; }
      if (key === 't') { e.preventDefault(); document.getElementById('theme-toggle')?.click(); }
    }
  });
}

// ── History ────────────────────────────────────────────────────────────────
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

// ── Clipboard Helper ───────────────────────────────────────────────────────
function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.textContent;
    btn.textContent = 'COPIED!';
    btn.style.color = 'var(--accent2)';
    setTimeout(() => { btn.textContent = original; btn.style.color = ''; }, 1500);
  });
}

// ── Favorites ──────────────────────────────────────────────────────────────
function initFavorites() {
  const favButtons = document.querySelectorAll('.fav-btn');
  const favoritesSection = document.querySelector('.favorites-section');
  const favoritesGrid = document.getElementById('favorites-grid');

  const loadFavorites = () => {
    if (!favoritesSection || !favoritesGrid) return;
    const stored = JSON.parse(localStorage.getItem('jct-favorites') || '[]');
    if (stored.length) {
      favoritesSection.style.display = '';
      favoritesGrid.innerHTML = '';
      stored.forEach(tool => {
        const origCard = document.querySelector(`a[href$="${tool}.html"]`);
        if (origCard) {
          const clone = origCard.cloneNode(true);
          const btn = clone.querySelector('.fav-btn');
          if (btn) btn.remove();
          favoritesGrid.appendChild(clone);
        }
      });
    } else {
      favoritesSection.style.display = 'none';
    }
  };

  const toggleFavorite = (tool, btn) => {
    const stored = JSON.parse(localStorage.getItem('jct-favorites') || '[]');
    const idx = stored.indexOf(tool);
    if (idx === -1) { stored.push(tool); btn.textContent = '⭐'; }
    else { stored.splice(idx, 1); btn.textContent = '☆'; }
    localStorage.setItem('jct-favorites', JSON.stringify(stored));
    loadFavorites();
  };

  favButtons.forEach(btn => {
    const tool = btn.getAttribute('data-tool');
    const stored = JSON.parse(localStorage.getItem('jct-favorites') || '[]');
    btn.textContent = stored.includes(tool) ? '⭐' : '☆';
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); e.preventDefault();
      toggleFavorite(tool, btn);
    });
  });

  loadFavorites();
}

// ── Intersection Observer (fade-in) ───────────────────────────────────────
function initObservers() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ── Search + Category Filtering (index page only) ─────────────────────────
function initFiltering() {
  // Use specific selector to avoid collision with camera filter buttons
  const categoryBtns = document.querySelectorAll('.tool-filters .filter-btn');
  const searchInput = document.getElementById('tool-search');
  const menuCards = document.querySelectorAll('.menu-grid .menu-card');

  if (!categoryBtns.length && !searchInput) return; // Not on index page

  let activeFilter = 'all';
  let searchTerm = '';

  function applyFilters() {
    menuCards.forEach(card => {
      const categories = (card.getAttribute('data-category') || '').toLowerCase();
      const title = (card.querySelector('.menu-card-title')?.textContent || '').toLowerCase();
      const desc = (card.querySelector('.menu-card-desc')?.textContent || '').toLowerCase();

      const matchesCategory = activeFilter === 'all' || categories.includes(activeFilter);
      const matchesSearch = !searchTerm ||
        title.includes(searchTerm) ||
        desc.includes(searchTerm) ||
        categories.includes(searchTerm);

      if (matchesCategory && matchesSearch) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  }

  categoryBtns.forEach(button => {
    button.addEventListener('click', () => {
      categoryBtns.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      activeFilter = button.getAttribute('data-filter') || 'all';
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchTerm = searchInput.value.trim().toLowerCase();
      applyFilters();
    });
    // Clear search on Escape
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        searchTerm = '';
        applyFilters();
      }
    });
  }
}

// ── Mobile Navigation with backdrop + scroll lock ─────────────────────────
function initMobileNav() {
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  if (!navToggle || !navLinks) return;

  // Create backdrop element
  let backdrop = document.getElementById('nav-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'nav-backdrop';
    backdrop.style.cssText = [
      'position:fixed', 'inset:0', 'background:rgba(0,0,0,0.7)',
      'z-index:999', 'display:none', 'backdrop-filter:blur(2px)',
      '-webkit-backdrop-filter:blur(2px)'
    ].join(';');
    document.body.appendChild(backdrop);
  }

  function openNav() {
    navToggle.classList.add('active');
    navLinks.classList.add('active');
    backdrop.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    navToggle.classList.remove('active');
    navLinks.classList.remove('active');
    backdrop.style.display = 'none';
    document.body.style.overflow = '';
  }

  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    navLinks.classList.contains('active') ? closeNav() : openNav();
  });

  // Close on backdrop click
  backdrop.addEventListener('click', closeNav);

  // Close on link click
  navLinks.addEventListener('click', (e) => {
    if (e.target.classList.contains('nav-link')) closeNav();
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });
}

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initKeyboardShortcuts();
  initHistory();
  initFavorites();
  initObservers();
  initFiltering();
  initMobileNav();
});