/**
 * gradient.js — CSS Gradient Generator
 */
(function () {
  'use strict';

  const stopsContainer = document.getElementById('grad-stops');
  if (!stopsContainer) return;

  const typeSelect   = document.getElementById('grad-type');
  const angleInput   = document.getElementById('grad-angle');
  const angleVal     = document.getElementById('grad-angle-val');
  const angleGroup   = document.getElementById('grad-angle-group');
  const addStopBtn   = document.getElementById('add-stop-btn');
  const preview      = document.getElementById('grad-preview');
  const cssOutput    = document.getElementById('grad-css-output');
  const copyBtn      = document.getElementById('grad-copy-btn');
  const copyHexBtn   = document.getElementById('grad-copy-hex-btn');

  // Presets
  const presets = {
    'grad-preset-sunset': [
      { color: '#ff416c', pos: 0 }, { color: '#ff4b2b', pos: 50 }, { color: '#f5af19', pos: 100 }
    ],
    'grad-preset-ocean': [
      { color: '#1a1a2e', pos: 0 }, { color: '#16213e', pos: 40 }, { color: '#0f3460', pos: 75 }, { color: '#00b4d8', pos: 100 }
    ],
    'grad-preset-neon': [
      { color: '#ff2d78', pos: 0 }, { color: '#7b61ff', pos: 50 }, { color: '#00ffaa', pos: 100 }
    ],
    'grad-preset-mono': [
      { color: '#000000', pos: 0 }, { color: '#1a1a1a', pos: 50 }, { color: '#333333', pos: 100 }
    ]
  };

  Object.keys(presets).forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', () => loadPreset(presets[id]));
  });

  function loadPreset(stops) {
    stopsContainer.innerHTML = '';
    stops.forEach((s, i) => addStopRow(s.color, s.pos, i < 2));
    updateGradient();
  }

  function addStopRow(color = '#ffffff', pos = 50, hideRemove = false) {
    const row = document.createElement('div');
    row.className = 'stop-row';
    row.innerHTML = `
      <input type="color" class="stop-color-input" value="${color}">
      <input type="number" class="stop-pos-input" value="${pos}" min="0" max="100">
      <span style="font-size:0.6rem;color:#555">%</span>
      <button class="remove-stop ${hideRemove ? 'hidden' : ''}">×</button>
    `;
    row.querySelector('.remove-stop').addEventListener('click', () => {
      row.remove();
      updateRemoveVisibility();
      updateGradient();
    });
    stopsContainer.appendChild(row);
  }

  function updateRemoveVisibility() {
    const rows = stopsContainer.querySelectorAll('.stop-row');
    rows.forEach((r, i) => {
      const btn = r.querySelector('.remove-stop');
      if (rows.length <= 2) btn.classList.add('hidden');
      else btn.classList.remove('hidden');
    });
  }

  addStopBtn.addEventListener('click', () => {
    if (stopsContainer.children.length >= 8) return;
    addStopRow();
    updateRemoveVisibility();
    updateGradient();
  });

  stopsContainer.addEventListener('input', updateGradient);
  typeSelect.addEventListener('change', () => {
    angleGroup.style.display = typeSelect.value === 'linear' ? '' : 'none';
    updateGradient();
  });
  angleInput.addEventListener('input', () => {
    angleVal.textContent = angleInput.value;
    updateGradient();
  });

  function updateGradient() {
    const rows = stopsContainer.querySelectorAll('.stop-row');
    const stops = Array.from(rows).map(r => {
      const color = r.querySelector('.stop-color-input').value;
      const pos   = r.querySelector('.stop-pos-input').value;
      return `${color} ${pos}%`;
    });

    const type  = typeSelect.value;
    const angle = angleInput.value;
    let css;

    if (type === 'linear') {
      css = `linear-gradient(${angle}deg, ${stops.join(', ')})`;
    } else if (type === 'radial') {
      css = `radial-gradient(circle, ${stops.join(', ')})`;
    } else {
      css = `conic-gradient(from ${angle}deg, ${stops.join(', ')})`;
    }

    preview.style.background = css;
    cssOutput.textContent = `background: ${css};`;
  }

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(cssOutput.textContent).then(() => flashBtn(copyBtn, 'COPIED!'));
  });

  copyHexBtn.addEventListener('click', () => {
    const stops = Array.from(stopsContainer.querySelectorAll('.stop-color-input')).map(i => i.value).join(', ');
    navigator.clipboard.writeText(stops).then(() => flashBtn(copyHexBtn, 'COPIED!'));
  });

  function flashBtn(btn, msg) {
    const orig = btn.textContent;
    btn.textContent = msg;
    setTimeout(() => { btn.textContent = orig; }, 1200);
  }

  updateGradient();
})();
