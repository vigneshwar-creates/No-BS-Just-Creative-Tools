/**
 * main.js — Global functionality (Theme Toggle, etc.)
 */
(function () {
  'use strict';

  // ── Theme Toggle Logic ──────────────────────────────────────────────────────
  const initTheme = () => {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    // Check for saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    const initialTheme = savedTheme || systemTheme;

    // Apply initial theme
    document.documentElement.setAttribute('data-theme', initialTheme);

    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      
      // Update meta theme color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', newTheme === 'light' ? '#f5f5f5' : '#0a0a0a');
      }
    });
  };

  // ── Initialize ─────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    // ── Favorites Logic ────────────────────────────────────────────────────────
    const favButtons = document.querySelectorAll('.fav-btn');
    const favoritesSection = document.querySelector('.favorites-section');
    const favoritesGrid = document.getElementById('favorites-grid');
    const loadFavorites = () => {
      const stored = JSON.parse(localStorage.getItem('favorites')||'[]');
      // Show section if any favorites
      if (stored.length) {
        favoritesSection.style.display = '';
        favoritesGrid.innerHTML = '';
        stored.forEach(tool => {
          const origCard = document.querySelector(`a[href="${tool}.html"]`);
          if (origCard) {
            const clone = origCard.cloneNode(true);
            // remove existing fav button in clone
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
      const stored = JSON.parse(localStorage.getItem('favorites')||'[]');
      const idx = stored.indexOf(tool);
      if (idx===-1) {
        stored.push(tool);
        btn.textContent = '⭐';
      } else {
        stored.splice(idx,1);
        btn.textContent = '☆';
      }
      localStorage.setItem('favorites',JSON.stringify(stored));
      loadFavorites();
    };
    favButtons.forEach(btn=>{
      const tool = btn.getAttribute('data-tool');
      // set initial state
      const stored = JSON.parse(localStorage.getItem('favorites')||'[]');
      btn.textContent = stored.includes(tool)?'⭐':'☆';
      btn.addEventListener('click', (e)=>{ e.stopPropagation(); e.preventDefault(); toggleFavorite(tool, btn); });
    });
    loadFavorites();
    // ── Existing initTheme call ───────────────────────────────────────────────
    initTheme();

    // Add fade-in classes to elements if they don't have them
    const observerOptions = {
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  });
})();
