// rotation.js - Add rotation controls to filters
(function() {
  'use strict';

  // Wait for filters.js to initialize
  function init() {
    const intensityBox = document.querySelector('.intensity-box');
    if (!intensityBox) {
      // Retry if DOM not ready
      setTimeout(init, 100);
      return;
    }

    // Check if JCTFilters is available
    if (typeof window.JCTFilters === 'undefined') {
      setTimeout(init, 100);
      return;
    }

    const { canvas, ctx, rotationAngle: existingAngle, applyFilter, currentFilter, intensity, showGrain, showDateStamp, FILTERS } = window.JCTFilters;

    // Create rotation control container
    const rotationBox = document.createElement('div');
    rotationBox.className = 'rotation-box';
    rotationBox.innerHTML = `
      <div class="control-group">
        <label class="control-label">ROTATION</label>
        <div class="rotation-controls">
          <button class="rotate-btn" data-rotate="-90">↺ 90°</button>
          <button class="rotate-btn" data-rotate="-45">↺ 45°</button>
          <input type="range" class="range-input" id="rotation-slider" min="-180" max="180" value="0" style="width:100%;margin:8px 0">
          <button class="rotate-btn" data-rotate="45">↻ 45°</button>
          <button class="rotate-btn" data-rotate="90">↻ 90°</button>
        </div>
      </div>
      <div class="control-group" style="margin-top:12px">
        <label class="control-label">FLIP</label>
        <div class="rotation-controls">
          <button class="rotate-btn" id="flip-h-btn">↔ HORIZ</button>
          <button class="rotate-btn" id="flip-v-btn">↕ VERT</button>
        </div>
      </div>
    `;

    // Insert before intensity box
    intensityBox.parentNode.insertBefore(rotationBox, intensityBox);

    // Flip button handlers
    const flipHBtn = document.getElementById('flip-h-btn');
    const flipVBtn = document.getElementById('flip-v-btn');

    flipHBtn.addEventListener('click', () => {
      window.JCTFilters.flipH = !window.JCTFilters.flipH;
      flipHBtn.classList.toggle('active', window.JCTFilters.flipH);
      if (window.JCTFilters.originalImage) {
        applyFilter(window.JCTFilters.currentFilter);
      }
    });

    flipVBtn.addEventListener('click', () => {
      window.JCTFilters.flipV = !window.JCTFilters.flipV;
      flipVBtn.classList.toggle('active', window.JCTFilters.flipV);
      if (window.JCTFilters.originalImage) {
        applyFilter(window.JCTFilters.currentFilter);
      }
    });

    // Reset button
    const resetBtn = document.createElement('button');
    resetBtn.className = 'rotate-btn';
    resetBtn.id = 'reset-btn';
    resetBtn.textContent = 'RESET ALL';
    resetBtn.style.marginTop = '12px';
    resetBtn.style.width = '100%';
    resetBtn.style.background = '#1a1a1a';

    resetBtn.addEventListener('click', () => {
      window.JCTFilters.rotationAngle = 0;
      window.JCTFilters.flipH = false;
      window.JCTFilters.flipV = false;

      // Reset UI
      rotationSlider.value = 0;
      rotationVal.textContent = '0°';
      flipHBtn.classList.remove('active');
      flipVBtn.classList.remove('active');

      if (window.JCTFilters.originalImage) {
        applyFilter(window.JCTFilters.currentFilter);
      }
    });

    rotationBox.appendChild(resetBtn);

    // Rotation state - initialize
    if (typeof window.JCTFilters.rotationAngle === 'undefined') {
      window.JCTFilters.rotationAngle = 0;
    }
    const rotationSlider = document.getElementById('rotation-slider');

    // Add rotation value display
    const label = rotationSlider.parentNode.querySelector('.control-label');
    const rotationVal = document.createElement('span');
    rotationVal.className = 'control-value';
    rotationVal.id = 'rotation-val';
    rotationVal.textContent = '0°';
    label.appendChild(rotationVal);

    // Update rotation value display
    rotationSlider.addEventListener('input', () => {
      window.JCTFilters.rotationAngle = parseInt(rotationSlider.value);
      rotationVal.textContent = rotationSlider.value + '°';
      if (window.JCTFilters.originalImage) {
        requestAnimationFrame(() => applyFilter(window.JCTFilters.currentFilter));
      }
    });

    // Rotate buttons
    document.querySelectorAll('.rotate-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const angle = parseInt(btn.dataset.rotate);
        window.JCTFilters.rotationAngle = (window.JCTFilters.rotationAngle + angle + 360) % 360;
        rotationSlider.value = window.JCTFilters.rotationAngle;
        rotationVal.textContent = window.JCTFilters.rotationAngle + '°';
        if (window.JCTFilters.originalImage) {
          applyFilter(window.JCTFilters.currentFilter);
        }
      });
    });
  }

  // Start initialization
  init();
})();