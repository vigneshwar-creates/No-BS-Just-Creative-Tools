// history.js - Undo/Redo history system for filters
(function() {
  'use strict';

  function init() {
    const intensityBox = document.querySelector('.intensity-box');
    if (!intensityBox) {
      setTimeout(init, 100);
      return;
    }

    if (typeof window.JCTFilters === 'undefined') {
      setTimeout(init, 100);
      return;
    }

    // History state
    const historyStack = [];
    let historyIndex = -1;
    let isRestoring = false;
    const MAX_HISTORY = 20;

    // Create history UI
    const historyBox = document.createElement('div');
    historyBox.className = 'history-box';
    historyBox.innerHTML = `
      <div class="control-group">
        <label class="control-label">HISTORY</label>
        <div class="history-controls">
          <button class="rotate-btn" id="undo-btn" title="Undo (Ctrl+Z)" disabled>↶ UNDO</button>
          <button class="rotate-btn" id="redo-btn" title="Redo (Ctrl+Y)" disabled>↷ REDO</button>
        </div>
      </div>
    `;

    // Find the download bar and insert before it
    const downloadBar = document.querySelector('.download-bar');
    if (downloadBar) {
      downloadBar.parentNode.insertBefore(historyBox, downloadBar);
    }

    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');

    // Save current state to history
    function saveToHistory() {
      if (isRestoring) return;

      const { canvas } = window.JCTFilters;
      if (!canvas || !canvas.width || !canvas.height) return;

      // Remove any states after current index
      if (historyIndex < historyStack.length - 1) {
        historyStack.splice(historyIndex + 1);
      }

      // Add current state
      const state = canvas.toDataURL('image/png');
      historyStack.push(state);

      // Limit history size
      if (historyStack.length > MAX_HISTORY) {
        historyStack.shift();
      } else {
        historyIndex++;
      }

      updateButtons();
    }

    // Update button states
    function updateButtons() {
      undoBtn.disabled = historyIndex <= 0;
      redoBtn.disabled = historyIndex >= historyStack.length - 1;
    }

    // Undo
    function undo() {
      if (historyIndex <= 0) return;

      isRestoring = true;
      historyIndex--;

      const img = new Image();
      img.onload = () => {
        const { canvas, ctx } = window.JCTFilters;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        isRestoring = false;
        updateButtons();
      };
      img.src = historyStack[historyIndex];
    }

    // Redo
    function redo() {
      if (historyIndex >= historyStack.length - 1) return;

      isRestoring = historyIndex++;
      const img = new Image();
      img.onload = () => {
        const { canvas, ctx } = window.JCTFilters;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        isRestoring = false;
        updateButtons();
      };
      img.src = historyStack[historyIndex];
    }

    // Event listeners
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    });

    // Hook into filter changes - save history after filter application
    const originalApplyFilter = window.JCTFilters.applyFilter;
    window.JCTFilters.applyFilter = function(filterName) {
      originalApplyFilter.call(this, filterName);

      // Debounce history saving
      clearTimeout(window._historyTimeout);
      window._historyTimeout = setTimeout(() => {
        if (!isRestoring) {
          saveToHistory();
        }
      }, 500);
    };

    // Initialize with first state when image is loaded
    const originalLoadFile = window.JCTFilters.loadFile;
    window.JCTFilters.loadFile = function(file) {
      // Clear history
      historyStack.length = 0;
      historyIndex = -1;

      originalLoadFile.call(this, file);

      // Save initial state after image loads
      setTimeout(() => {
        if (window.JCTFilters.originalImage) {
          saveToHistory();
        }
      }, 100);
    };
  }

  init();
})();