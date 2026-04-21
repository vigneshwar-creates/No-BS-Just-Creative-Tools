/**
 * drag.js — Draggable panel system
 * Make any .panel.draggable-mode element draggable by its .panel-header[data-drag-handle]
 */
(function () {
  'use strict';

  function initDraggable(canvas) {
    const panels = canvas.querySelectorAll('.panel.draggable-mode');

    panels.forEach(panel => {
      const handle = panel.querySelector('[data-drag-handle]');
      if (!handle) return;
      makeDraggable(panel, handle, canvas);
    });
  }

  function makeDraggable(panel, handle, container) {
    let startX, startY, startLeft, startTop, isDragging = false;

    handle.addEventListener('mousedown', onMouseDown);
    handle.addEventListener('touchstart', onTouchStart, { passive: false });

    function onMouseDown(e) {
      if (e.target.tagName === 'BUTTON') return;
      e.preventDefault();
      startDrag(e.clientX, e.clientY);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }

    function onTouchStart(e) {
      if (e.target.tagName === 'BUTTON') return;
      e.preventDefault();
      const t = e.touches[0];
      startDrag(t.clientX, t.clientY);
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
    }

    function startDrag(cx, cy) {
      isDragging = true;
      const rect = panel.getBoundingClientRect();
      const cRect = container.getBoundingClientRect();
      startLeft = rect.left - cRect.left;
      startTop = rect.top - cRect.top;
      startX = cx;
      startY = cy;
      panel.classList.add('dragging');
      bringToFront(panel, container);
    }

    function onMouseMove(e) { move(e.clientX, e.clientY); }
    function onTouchMove(e) {
      e.preventDefault();
      move(e.touches[0].clientX, e.touches[0].clientY);
    }

    function move(cx, cy) {
      if (!isDragging) return;
      const cRect = container.getBoundingClientRect();
      let newLeft = startLeft + (cx - startX);
      let newTop = startTop + (cy - startY);

      // Clamp to container
      const panelW = panel.offsetWidth;
      const panelH = panel.offsetHeight;
      newLeft = Math.max(0, Math.min(newLeft, cRect.width - panelW));
      newTop = Math.max(0, Math.min(newTop, Math.max(panelH, container.scrollHeight) - 60));

      panel.style.left = newLeft + 'px';
      panel.style.top = newTop + 'px';

      // Expand container if needed
      const neededH = newTop + panelH + 24;
      if (neededH > container.clientHeight) {
        container.style.minHeight = neededH + 'px';
      }
    }

    function onMouseUp() {
      stopDrag();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    function onTouchEnd() {
      stopDrag();
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    }

    function stopDrag() {
      isDragging = false;
      panel.classList.remove('dragging');
    }
  }

  function bringToFront(panel, container) {
    const panels = container.querySelectorAll('.panel.draggable-mode');
    let maxZ = 10;
    panels.forEach(p => {
      const z = parseInt(p.style.zIndex) || 10;
      if (z > maxZ) maxZ = z;
    });
    panel.style.zIndex = maxZ + 1;
  }

  // Auto-init on load
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.drag-canvas').forEach(canvas => {
      // Make canvas tall enough for absolute panels
      const panels = canvas.querySelectorAll('.panel.draggable-mode');
      let maxBottom = 400;
      panels.forEach(p => {
        const top = parseInt(p.style.top) || 0;
        const h = p.offsetHeight || 300;
        if (top + h + 24 > maxBottom) maxBottom = top + h + 24;
      });
      canvas.style.minHeight = Math.max(600, maxBottom) + 'px';

      initDraggable(canvas);
    });
  });

  // Expose for manual use
  window.initDraggable = initDraggable;
})();
