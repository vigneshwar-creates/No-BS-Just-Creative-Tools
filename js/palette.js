/**
 * palette.js — Color palette extractor
 * Uses median-cut quantization for proper dominant color extraction
 */
(function () {
  'use strict';

  const palDropArea  = document.getElementById('pal-drop-area');
  if (!palDropArea) return;

  const palFileInput = document.getElementById('pal-file-input');
  const palCanvas    = document.getElementById('pal-canvas');
  const palCtx       = palCanvas.getContext('2d', { willReadFrequently: true });
  const palPreviewImg= document.getElementById('palette-preview-img');
  const palNoImage   = document.getElementById('pal-no-image');
  const palStrip     = document.getElementById('pal-strip');
  const palCards     = document.getElementById('pal-cards');
  const palCopyAll   = document.getElementById('pal-copy-all-btn');
  const palLoadBtn   = document.getElementById('pal-load-btn');
  const palExtractBtn= document.getElementById('pal-extract-btn');

  let numColors = 6;
  let lastColors = [];

  // Number buttons
  document.querySelectorAll('.nc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nc-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      numColors = parseInt(btn.dataset.n);
      if (palPreviewImg.src && palPreviewImg.style.display !== 'none') extractAndRender();
    });
  });

  function loadFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const img = new Image();
    img.onload = () => {
      palPreviewImg.src = img.src;
      palPreviewImg.style.display = 'block';
      palNoImage.style.display = 'none';

      // Draw to canvas for pixel access
      const maxW = 800;
      let w = img.width, h = img.height;
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
      palCanvas.width = w; palCanvas.height = h;
      palCtx.drawImage(img, 0, 0, w, h);

      extractAndRender();
    };
    img.src = URL.createObjectURL(file);
  }

  palDropArea.addEventListener('click', () => palFileInput.click());
  palDropArea.addEventListener('dragover', e => { e.preventDefault(); palDropArea.style.borderColor = 'var(--accent4)'; });
  palDropArea.addEventListener('dragleave', () => palDropArea.style.borderColor = '');
  palDropArea.addEventListener('drop', e => {
    e.preventDefault(); palDropArea.style.borderColor = '';
    loadFile(e.dataTransfer.files[0]);
  });
  palFileInput.addEventListener('change', () => loadFile(palFileInput.files[0]));
  palLoadBtn.addEventListener('click', () => palFileInput.click());
  palExtractBtn.addEventListener('click', () => {
    if (palPreviewImg.style.display !== 'none') extractAndRender();
  });

  palCopyAll.addEventListener('click', () => {
    if (!lastColors.length) return;
    navigator.clipboard.writeText(lastColors.join(', ')).then(() => flashBtn(palCopyAll, 'COPIED!'));
  });

  // ── Median-cut quantization ───────────────────────────────────────────────
  function extractAndRender() {
    const { width: w, height: h } = palCanvas;
    if (!w || !h) return;

    const data = palCtx.getImageData(0, 0, w, h).data;
    const pixels = [];

    // Sample every 6th pixel for speed
    for (let i = 0; i < data.length; i += 24) {
      if (data[i+3] < 128) continue;
      pixels.push([data[i], data[i+1], data[i+2]]);
    }

    const colors = medianCut(pixels, numColors);
    lastColors = colors.map(toHex);
    renderPalette(lastColors);
  }

  function medianCut(pixels, depth) {
    if (pixels.length === 0) return [];
    if (depth === 0 || pixels.length <= 1) {
      return [averageColor(pixels)];
    }

    // Find channel with greatest range
    let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
    for (const [r, g, b] of pixels) {
      if (r < minR) minR = r; if (r > maxR) maxR = r;
      if (g < minG) minG = g; if (g > maxG) maxG = g;
      if (b < minB) minB = b; if (b > maxB) maxB = b;
    }

    const rangeR = maxR - minR, rangeG = maxG - minG, rangeB = maxB - minB;
    let sortChannel;
    if (rangeR >= rangeG && rangeR >= rangeB) sortChannel = 0;
    else if (rangeG >= rangeR && rangeG >= rangeB) sortChannel = 1;
    else sortChannel = 2;

    pixels.sort((a, b) => a[sortChannel] - b[sortChannel]);

    const mid = Math.floor(pixels.length / 2);
    const left  = medianCut(pixels.slice(0, mid), depth - 1);
    const right = medianCut(pixels.slice(mid),    depth - 1);
    return [...left, ...right];
  }

  function averageColor(pixels) {
    if (!pixels.length) return [128, 128, 128];
    let r = 0, g = 0, b = 0;
    for (const [pr, pg, pb] of pixels) { r += pr; g += pg; b += pb; }
    return [Math.round(r / pixels.length), Math.round(g / pixels.length), Math.round(b / pixels.length)];
  }

  function toHex([r, g, b]) {
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `rgb(${r}, ${g}, ${b})`;
  }

  // ── Render palette ────────────────────────────────────────────────────────
  function renderPalette(colors) {
    // Strip
    palStrip.innerHTML = '';
    colors.forEach(hex => {
      const sw = document.createElement('div');
      sw.className = 'ps-swatch';
      sw.style.background = hex;
      sw.dataset.hex = hex;
      sw.title = hex;
      sw.addEventListener('click', () => copyHex(hex));
      palStrip.appendChild(sw);
    });

    // Cards
    palCards.innerHTML = '';
    colors.forEach(hex => {
      const card = document.createElement('div');
      card.className = 'pal-card';
      card.innerHTML = `
        <div class="pal-card-color" style="background:${hex}"></div>
        <div class="pal-card-info">
          <div class="pal-card-hex">${hex}</div>
          <div class="pal-card-rgb">${hexToRgb(hex)}</div>
        </div>`;
      card.addEventListener('click', () => copyHex(hex));
      palCards.appendChild(card);
    });
  }

  function copyHex(hex) {
    navigator.clipboard.writeText(hex).catch(() => {});
    // Toast
    const toast = document.createElement('div');
    toast.textContent = hex + ' COPIED';
    Object.assign(toast.style, {
      position: 'fixed', bottom: '32px', right: '32px',
      background: 'var(--accent4)', color: '#fff',
      padding: '10px 20px', fontSize: '0.65rem', letterSpacing: '2px',
      fontFamily: 'Space Mono, monospace', fontWeight: '700',
      zIndex: '9999', border: '1px solid #7b61ff', textTransform: 'uppercase'
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1500);
  }

  function flashBtn(btn, msg) {
    const orig = btn.textContent;
    btn.textContent = msg;
    setTimeout(() => { btn.textContent = orig; }, 1200);
  }
})();
