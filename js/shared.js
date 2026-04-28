// Shared functionality for all JCT pages

// ── Service Worker Registration (runs on every page) ────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(r) { console.log('[JCT] SW active:', r.scope); })
      .catch(function(e) { console.warn('[JCT] SW failed:', e); });
  });
}



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

// ── Favorites Logic ────────────────────────────────────────────────────────
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
    if (idx === -1) {
      stored.push(tool);
      btn.textContent = '⭐';
    } else {
      stored.splice(idx, 1);
      btn.textContent = '☆';
    }
    localStorage.setItem('jct-favorites', JSON.stringify(stored));
    loadFavorites();
  };

  favButtons.forEach(btn => {
    const tool = btn.getAttribute('data-tool');
    const stored = JSON.parse(localStorage.getItem('jct-favorites') || '[]');
    btn.textContent = stored.includes(tool) ? '⭐' : '☆';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      toggleFavorite(tool, btn);
    });
  });
  
  loadFavorites();
}

// ── Intersection Observer ──────────────────────────────────────────────────
function initObservers() {
  const observerOptions = { threshold: 0.1 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ── Filtering Logic ────────────────────────────────────────────────────────
function initFiltering() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const menuCards = document.querySelectorAll('.menu-card');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      const filter = button.getAttribute('data-filter');
      
      // Filter menu cards
      menuCards.forEach(card => {
        const categories = card.getAttribute('data-category');
        if (filter === 'all' || categories.includes(filter)) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}

// Update DOMContentLoaded to include merged logic
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initKeyboardShortcuts();
  initHistory();
  initFavorites();
  initObservers();
  initFiltering();
  initMobileNav();
});

// Mobile Navigation Toggle
function initMobileNav() {
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  
  if (!navToggle || !navLinks) return;
  
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
  });
  
  // Close mobile nav when clicking a link
  navLinks.addEventListener('click', (e) => {
    if (e.target.classList.contains('nav-link')) {
      navToggle.classList.remove('active');
      navLinks.classList.remove('active');
    }
  });
  
  // Close mobile nav when clicking outside
  document.addEventListener('click', (e) => {
    if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
      navToggle.classList.remove('active');
      navLinks.classList.remove('active');
    }
  });
}