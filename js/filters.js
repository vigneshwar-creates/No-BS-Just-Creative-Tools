/**
 * filters.js — 18+ Vintage Camera Filters
 * All filters implemented via canvas pixel manipulation (no CSS tricks).
 * Techniques: color matrix, gamma, noise, vignette, scanlines, date stamps,
 *             chromatic aberration, halftone, cross-process, color shift.
 */
(function () {
  'use strict';

  const canvas     = document.getElementById('filter-canvas');
  if (!canvas) return;

  const ctx        = canvas.getContext('2d', { willReadFrequently: true });
  const dropArea   = document.getElementById('drop-overlay');
  const noImg      = document.getElementById('no-image');
  const fileInput  = document.getElementById('filter-file');
  const cameraBadge= document.getElementById('camera-badge');
  const intensitySlider = document.getElementById('intensity-slider');
  const intensityVal    = document.getElementById('intensity-val');
  const dateStampToggle = document.getElementById('date-stamp-toggle');
  const grainToggle     = document.getElementById('grain-toggle');
  const downloadBtn     = document.getElementById('download-btn');

  let originalImage  = null;
  let currentFilter  = 'normal';
  let intensity      = 1.0;
  let showDateStamp  = false;
  let showGrain      = true;
  let rotationAngle  = 0;
  let flipH = false;
  let flipV = false;

  // Expose to window for rotation.js and other modules
  window.JCTFilters = {
    get canvas() { return canvas; },
    get ctx() { return ctx; },
    get originalImage() { return originalImage; },
    get currentFilter() { return currentFilter; },
    get intensity() { return intensity; },
    get showDateStamp() { return showDateStamp; },
    get showGrain() { return showGrain; },
    get rotationAngle() { return rotationAngle; },
    set rotationAngle(val) { rotationAngle = val; },
    get flipH() { return flipH; },
    set flipH(val) { flipH = val; },
    get flipV() { return flipV; },
    set flipV(val) { flipV = val; },
    FILTERS, applyFilter, loadFile, applyGrainOverlay, drawDateStamp
  };

  // ── Image Loading ─────────────────────────────────────────────────────────
  function loadFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const img = new Image();
    img.onload = () => {
      // Clean up previous image and canvas references
      if (originalImage) {
        URL.revokeObjectURL(originalImage.src);
        originalImage = null;
      }
      
      // Downsample large images (>4MP) to maintain performance
      const MAX_PIXELS = 4000000; // 4MP
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      
      if (w * h > MAX_PIXELS) {
        const scale = Math.sqrt(MAX_PIXELS / (w * h));
        w = Math.floor(w * scale);
        h = Math.floor(h * scale);
        
        // Create downscaled version
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        originalImage = new Image();
        originalImage.src = canvas.toDataURL('image/png');
        canvas.remove(); // Clean up temporary canvas
      } else {
        originalImage = img;
      }
      
      noImg.style.display = 'none';
      canvas.style.display = 'block';
      cameraBadge.style.display = 'block';
      applyFilter(currentFilter);
    };
    img.src = URL.createObjectURL(file);
  }

  dropArea.addEventListener('click', () => fileInput.click());
  dropArea.addEventListener('dragover', e => { e.preventDefault(); dropArea.classList.add('active'); });
  dropArea.addEventListener('dragleave', () => dropArea.classList.remove('active'));
  dropArea.addEventListener('drop', e => {
    e.preventDefault(); dropArea.classList.remove('active');
    loadFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => loadFile(fileInput.files[0]));

  // ── Filter buttons ─────────────────────────────────────────────────────────
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      cameraBadge.textContent = btn.querySelector('.fn') ? btn.querySelector('.fn').textContent : currentFilter.toUpperCase();
      if (originalImage) applyFilter(currentFilter);
    });
  });

  // ── Intensity ──────────────────────────────────────────────────────────────
  let filterTimeout = null;
  intensitySlider.addEventListener('input', () => {
    intensity = parseInt(intensitySlider.value) / 100;
    intensityVal.textContent = intensitySlider.value;
    if (originalImage) {
      // Throttle filter application to maintain 60fps
      clearTimeout(filterTimeout);
      filterTimeout = setTimeout(() => {
        requestAnimationFrame(() => applyFilter(currentFilter));
      }, 16); // ~60fps
    }
  });

  // ── Toggles ───────────────────────────────────────────────────────────────
  dateStampToggle.addEventListener('click', () => {
    showDateStamp = !showDateStamp;
    dateStampToggle.classList.toggle('on', showDateStamp);
    if (originalImage) applyFilter(currentFilter);
  });

  grainToggle.addEventListener('click', () => {
    showGrain = !showGrain;
    grainToggle.classList.toggle('on', showGrain);
    if (originalImage) applyFilter(currentFilter);
  });

  // ── Download ──────────────────────────────────────────────────────────────
  downloadBtn.addEventListener('click', () => {
    if (!originalImage) return;
    const a = document.createElement('a');
    a.download = `jct-${currentFilter}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  });

  // ── Main render ───────────────────────────────────────────────────────────
  function applyFilter(filterName) {
    if (!originalImage) return;

    // Size canvas to image (max 1200px wide)
    const maxW = 1200;
    let w = originalImage.naturalWidth;
    let h = originalImage.naturalHeight;
    if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }

    // Handle rotation - calculate canvas size to fit rotated image
    const absRotation = Math.abs(rotationAngle);
    const isRotated = absRotation % 180 !== 0;
    let canvasW = w;
    let canvasH = h;

    if (isRotated && absRotation !== 0) {
      const angleRad = (absRotation * Math.PI) / 180;
      canvasW = Math.ceil(Math.abs(w * Math.cos(angleRad)) + Math.abs(h * Math.sin(angleRad)));
      canvasH = Math.ceil(Math.abs(w * Math.sin(angleRad)) + Math.abs(h * Math.cos(angleRad)));
    }

    canvas.width = canvasW;
    canvas.height = canvasH;

    // Clear canvas
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Handle rotation with canvas transform
    ctx.save();
    if (rotationAngle !== 0) {
      ctx.translate(canvasW / 2, canvasH / 2);
      ctx.rotate((rotationAngle * Math.PI) / 180);
    }
    if (flipH || flipV) {
      ctx.translate(flipH ? -w/2 : w/2, flipV ? -h/2 : h/2);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      if (!rotationAngle) {
        ctx.translate(-w/2, -h/2);
      }
    }
    if (rotationAngle !== 0 || flipH || flipV) {
      ctx.drawImage(originalImage, -w / 2, -h / 2, w, h);
    } else {
      ctx.drawImage(originalImage, 0, 0, w, h);
    }
    ctx.restore();

    // Get the actual drawn dimensions
    const drawnW = canvasW;
    const drawnH = canvasH;
    const imageData = ctx.getImageData(0, 0, drawnW, drawnH);

    // Apply filter to pixel data
    const fn = FILTERS[filterName] || FILTERS.normal;
    fn(imageData.data, drawnW, drawnH, intensity);

    ctx.putImageData(imageData, 0, 0);

    // Post-effects (drawn on top via ctx)
    if (showGrain && filterName !== 'normal') applyGrainOverlay(drawnW, drawnH, intensity);
    if (showDateStamp && filterName !== 'normal') drawDateStamp(drawnW, drawnH);
  }

  // ── Grain overlay (drawn separately so it doesn't corrupt pixel data) ─────
  function applyGrainOverlay(w, h, str) {
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const octx = off.getContext('2d');
    const id = octx.getImageData(0, 0, w, h);
    const d = id.data;
    const amount = str * 28;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * amount;
      d[i] += n; d[i+1] += n; d[i+2] += n;
      d[i+3] = 18;
    }
    octx.putImageData(id, 0, 0);
    ctx.drawImage(off, 0, 0);
  }

  // ── Date stamp ───────────────────────────────────────────────────────────
  function drawDateStamp(w, h) {
    const now = new Date();
    const stamp = `${String(now.getMonth()+1).padStart(2,'0')} ${String(now.getDate()).padStart(2,'0')} '${String(now.getFullYear()).slice(2)}`;
    const fsize = Math.max(14, Math.round(w * 0.026));
    ctx.save();
    ctx.font = `bold ${fsize}px Courier New, monospace`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#ff6a00';
    ctx.fillText(stamp, w - fsize * 0.6, h - fsize * 0.6);
    ctx.restore();
  }

  // ── Utility functions ─────────────────────────────────────────────────────
  function clamp(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }

  function applyColorMatrix(d, matrix) {
    // matrix is [r,g,b] coeffs for each output channel
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i+1], b = d[i+2];
      d[i]   = clamp(r * matrix[0] + g * matrix[1] + b * matrix[2]  + matrix[3]);
      d[i+1] = clamp(r * matrix[4] + g * matrix[5] + b * matrix[6]  + matrix[7]);
      d[i+2] = clamp(r * matrix[8] + g * matrix[9] + b * matrix[10] + matrix[11]);
    }
  }

  function adjustExposure(d, factor) {
    for (let i = 0; i < d.length; i += 4) {
      d[i]   = clamp(d[i]   * factor);
      d[i+1] = clamp(d[i+1] * factor);
      d[i+2] = clamp(d[i+2] * factor);
    }
  }

  function adjustContrast(d, factor) {
    const f = 259 * (factor + 255) / (255 * (259 - factor));
    for (let i = 0; i < d.length; i += 4) {
      d[i]   = clamp(f * (d[i]   - 128) + 128);
      d[i+1] = clamp(f * (d[i+1] - 128) + 128);
      d[i+2] = clamp(f * (d[i+2] - 128) + 128);
    }
  }

  function adjustSaturation(d, factor) {
    for (let i = 0; i < d.length; i += 4) {
      const avg = (d[i] + d[i+1] + d[i+2]) / 3;
      d[i]   = clamp(avg + factor * (d[i]   - avg));
      d[i+1] = clamp(avg + factor * (d[i+1] - avg));
      d[i+2] = clamp(avg + factor * (d[i+2] - avg));
    }
  }

  function toGrayscale(d) {
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
      d[i] = d[i+1] = d[i+2] = lum;
    }
  }

  function applyVignette(d, w, h, str) {
    const cx = w / 2, cy = h / 2;
    const maxDist = Math.sqrt(cx * cx + cy * cy);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        const v = 1 - (dist / maxDist) * str;
        d[i]   = clamp(d[i]   * v);
        d[i+1] = clamp(d[i+1] * v);
        d[i+2] = clamp(d[i+2] * v);
      }
    }
  }

  function addColorCast(d, rOff, gOff, bOff) {
    for (let i = 0; i < d.length; i += 4) {
      d[i]   = clamp(d[i]   + rOff);
      d[i+1] = clamp(d[i+1] + gOff);
      d[i+2] = clamp(d[i+2] + bOff);
    }
  }

  function gammaCorrect(d, gamma) {
    const table = [];
    for (let i = 0; i < 256; i++) table[i] = clamp(Math.round(255 * Math.pow(i / 255, 1 / gamma)));
    for (let i = 0; i < d.length; i += 4) {
      d[i]   = table[d[i]];
      d[i+1] = table[d[i+1]];
      d[i+2] = table[d[i+2]];
    }
  }

  function applyCurve(d, rCurve, gCurve, bCurve) {
    // Curves are arrays of 256 values
    for (let i = 0; i < d.length; i += 4) {
      d[i]   = rCurve[d[i]];
      d[i+1] = gCurve[d[i+1]];
      d[i+2] = bCurve[d[i+2]];
    }
  }

  function makeSCurve(lift, gamma, gain) {
    const t = [];
    for (let i = 0; i < 256; i++) {
      let v = i / 255;
      v = lift + (gain - lift) * Math.pow(v, 1 / gamma);
      t[i] = clamp(Math.round(v * 255));
    }
    return t;
  }

  function addPixelNoise(d, amount) {
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * amount;
      d[i]   = clamp(d[i]   + n);
      d[i+1] = clamp(d[i+1] + n);
      d[i+2] = clamp(d[i+2] + n);
    }
  }

  function addBandingNoise(d, w, h, bands) {
    // Low-res blocking (digicam artifact)
    const blockW = Math.max(1, Math.round(w / bands));
    const blockH = Math.max(1, Math.round(h / bands));
    const blockData = new Uint8ClampedArray(d.length);
    for (let y = 0; y < h; y += blockH) {
      for (let x = 0; x < w; x += blockW) {
        const srcI = (y * w + x) * 4;
        const r = d[srcI], g = d[srcI+1], b = d[srcI+2];
        for (let dy = 0; dy < blockH && y + dy < h; dy++) {
          for (let dx = 0; dx < blockW && x + dx < w; dx++) {
            const di = ((y+dy) * w + (x+dx)) * 4;
            blockData[di] = r; blockData[di+1] = g; blockData[di+2] = b; blockData[di+3] = 255;
          }
        }
      }
    }
    for (let i = 0; i < d.length; i++) d[i] = blockData[i];
  }

  function blendOriginal(d, origD, alpha) {
    // alpha = 0 → full original, alpha = 1 → full filtered
    for (let i = 0; i < d.length; i += 4) {
      d[i]   = clamp(origD[i]   + alpha * (d[i]   - origD[i]));
      d[i+1] = clamp(origD[i+1] + alpha * (d[i+1] - origD[i+1]));
      d[i+2] = clamp(origD[i+2] + alpha * (d[i+2] - origD[i+2]));
    }
  }

  // ── FILTER DEFINITIONS ────────────────────────────────────────────────────
  //  Each filter receives: (Uint8ClampedArray data, width, height, intensity 0-1)
  //  Modifies data in-place.

  const FILTERS = {

    normal(d) { /* no-op */ },

    // ── 90s FILM STOCKS ──────────────────────────────────────────────────────

    kodak_gold(d, w, h, str) {
      const orig = new Uint8ClampedArray(d);
      // Warm shadows, lifted blacks, golden highlights
      const rCurve = makeSCurve(0.06, 0.95, 1.0);
      const gCurve = makeSCurve(0.03, 0.97, 0.96);
      const bCurve = makeSCurve(0.0,  1.08, 0.80);
      applyCurve(d, rCurve, gCurve, bCurve);
      adjustSaturation(d, 1.3);
      applyVignette(d, w, h, 0.7 * str);
      addColorCast(d, 12 * str, 6 * str, -8 * str);
      blendOriginal(d, orig, str);
    },

    fuji_velvia(d, w, h, str) {
      const orig = new Uint8ClampedArray(d);
      adjustSaturation(d, 1.8);
      adjustContrast(d, 40 * str);
      const rCurve = makeSCurve(0.0, 1.0, 1.05);
      const gCurve = makeSCurve(0.02, 0.9, 0.99);
      const bCurve = makeSCurve(0.05, 1.05, 0.95);
      applyCurve(d, rCurve, gCurve, bCurve);
      applyVignette(d, w, h, 0.5 * str);
      blendOriginal(d, orig, str);
    },

    kodak_portra(d, w, h, str) {
      const orig = new Uint8ClampedArray(d);
      // Creamy skin, low contrast, warm
      adjustSaturation(d, 0.9);
      adjustContrast(d, -15 * str);
      adjustExposure(d, 1.05);
      addColorCast(d, 8 * str, 3 * str, -4 * str);
      const rCurve = makeSCurve(0.05, 0.9, 0.98);
      const gCurve = makeSCurve(0.04, 0.95, 0.94);
      const bCurve = makeSCurve(0.03, 1.05, 0.85);
      applyCurve(d, rCurve, gCurve, bCurve);
      applyVignette(d, w, h, 0.4 * str);
      blendOriginal(d, orig, str);
    },

    agfa_vista(d, w, h, str) {
      const orig = new Uint8ClampedArray(d);
      // Punchy greens, slight magenta cast
      adjustSaturation(d, 1.4);
      const rCurve = makeSCurve(0.02, 1.0, 1.02);
      const gCurve = makeSCurve(0.0,  0.9, 1.08);
      const bCurve = makeSCurve(0.03, 1.1, 0.9);
      applyCurve(d, rCurve, gCurve, bCurve);
      adjustContrast(d, 20 * str);
      addColorCast(d, 5 * str, -4 * str, -10 * str);
      applyVignette(d, w, h, 0.6 * str);
      blendOriginal(d, orig, str);
    },

    film_noir(d, w, h, str) {
      const orig = new Uint8ClampedArray(d);
      toGrayscale(d);
      adjustContrast(d, 60 * str);
      applyVignette(d, w, h, 1.0 * str);
      addColorCast(d, 0, 0, 5 * str); // slight cool tint
      gammaCorrect(d, 0.85);
      blendOriginal(d, orig, str);
    },

    lomography(d, w, h, str) {
      const orig = new Uint8ClampedArray(d);
      adjustSaturation(d, 1.5);
      adjustContrast(d, 30 * str);
      applyVignette(d, w, h, 1.2 * str);
      addColorCast(d, 15 * str, -5 * str, -15 * str);
      addPixelNoise(d, 18 * str);
      blendOriginal(d, orig, str);
    },

    // ── DIGICAM ERA ───────────────────────────────────────────────────────────

    early_digicam(d, w, h, str) {
      const orig = new Uint8ClampedArray(d);
      // CCD-style noise, banding, low dynamic range
      addBandingNoise(d, w, h, Math.round(80 + 40 * (1 - str)));
      addPixelNoise(d, 30 * str);
      adjustContrast(d, -20 * str);
      adjustSaturation(d, 0.7 + 0.3 * (1-str));
      addColorCast(d, 5 * str, 8 * str, 10 * str); // slight cyan push
      blendOriginal(d, orig, str);
    },

    digicam_2002(d, w, h, str) {
      const orig = new Uint8ClampedArray(d);
      // Y2K: oversaturated, sharpened look
      adjustSaturation(d, 2.0);
      adjustContrast(d, 35 * str);
      adjustExposure(d, 1.1);
      addColorCast(d, 0, 5 * str, 15 * str);
      addPixelNoise(d, 12 * str);
      blendOriginal(d, orig, str);
    },

    digicam_portrait(d, w, h, str) {
      const orig = new Uint8ClampedArray(d);
      // Indoor flash: overexposed center, blue tinge
      adjustExposure(d, 1.25 * str + (1 - str));
      addColorCast(d, -4 * str, -2 * str, 20 * str);
      adjustSaturation(d, 0.85);
      addPixelNoise(d, 15 * str);
      blendOriginal(d, orig, str);
    },

    camera_phone(d, w, h, str) {
      const orig = new Uint8ClampedArray(d);
      // VGA-era Nokia style: low res, greenish
      addBandingNoise(d, w, h, Math.round(40 + 20 * (1 - str)));
      addColorCast(d, -5 * str, 10 * str, -8 * str);
      adjustSaturation(d, 0.6);
      adjustContrast(d, -10 * str);
      addPixelNoise(d, 35 * str);
      blendOriginal(d, orig, str);
    },

    // ── DISPOSABLE & POLAROID ─────────────────────────────────────────────────

    disposable(d, w, h, str) {
      const orig = new Uint8ClampedArray(d);
      // Fujifilm disposable — greens push, warm, grainy
      adjustSaturation(d, 1.15);
      addColorCast(d, -5 * str, 12 * str, -10 * str);
      adjustContrast(d, 15 * str);
      applyVignette(d, w, h, 0.8 * str);
      addPixelNoise(d, 22 * str);
      const rC = makeSCurve(0.04, 1.0, 0.98);
      const gC = makeSCurve(0.0,  0.95, 1.05);
      const bC = makeSCurve(0.02, 1.05, 0.88);
      applyCurve(d, rC, gC, bC);
      blendOriginal(d, orig, str);
    },

    polaroid(d, w, h, str) {
      const orig = new Uint8ClampedArray(d);
      // Faded, green-yellow shift, low sat, lifted blacks
      adjustSaturation(d, 0.75);
      const rC = makeSCurve(0.08, 0.92, 0.94);
      const gC = makeSCurve(0.06, 0.95, 0.98);
      const bC = makeSCurve(0.10, 1.08, 0.78);
      applyCurve(d, rC, gC, bC);
      adjustContrast(d, -20 * str);
      applyVignette(d, w, h, 0.5 * str);
      addColorCast(d, 8 * str, 10 * str, -12 * str);
      blendOriginal(d, orig, str);
    },

    instax(d, w, h, str) {
      const orig = new Uint8ClampedArray(d);
      // Instax Mini: bright, high key, slight warm
      adjustExposure(d, 1.15);
      adjustSaturation(d, 1.2);
      adjustContrast(d, 10 * str);
      addColorCast(d, 10 * str, 6 * str, -4 * str);
      blendOriginal(d, orig, str);
    },

    expired_film(d, w, h, str) {
      const orig = new Uint8ClampedArray(d);
      // Color drift, halation, fog
      addColorCast(d, 30 * str, -10 * str, -20 * str);
      adjustSaturation(d, 0.6);
      addPixelNoise(d, 40 * str);
      applyVignette(d, w, h, 1.0 * str);
      // Random color streaks per row
      const w4 = w * 4;
      for (let y = 0; y < d.length / 4 / w; y++) {
        if (Math.random() < 0.04 * str) {
          const shift = (Math.random() - 0.5) * 40 * str;
          for (let x = 0; x < w; x++) {
            const i = y * w4 + x * 4;
            d[i]   = clamp(d[i]   + shift);
            d[i+2] = clamp(d[i+2] - shift * 0.5);
          }
        }
      }
      blendOriginal(d, orig, str);
    },

    // ── CREATIVE ──────────────────────────────────────────────────────────────

    vhs(d, w, h, str) {
      const orig = new Uint8ClampedArray(d);
      // Desaturated, scanlines via alpha (drawn post), color bleed
      adjustSaturation(d, 0.7);
      adjustContrast(d, -10 * str);
      // Horizontal color bleed: shift red channel left, blue right
      const bleed = Math.round(4 * str);
      const copy = new Uint8ClampedArray(d);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const ir = (y * w + Math.max(0, x - bleed)) * 4;
          const ib = (y * w + Math.min(w-1, x + bleed)) * 4;
          d[i]   = copy[ir];   // R from left
          d[i+2] = copy[ib+2]; // B from right
        }
      }
      // Scan lines
      for (let y = 0; y < h; y += 3) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          d[i] = clamp(d[i] * 0.6); d[i+1] = clamp(d[i+1] * 0.6); d[i+2] = clamp(d[i+2] * 0.6);
        }
      }
      blendOriginal(d, orig, str);
    },

    glitch(d, w, h, str) {
      const orig = new Uint8ClampedArray(d);
      // RGB channel split + random row displacement
      const shift = Math.round(14 * str);
      const copy = new Uint8ClampedArray(d);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i  = (y * w + x) * 4;
          const ir = (y * w + Math.min(w-1, x + shift)) * 4;
          const ib = (y * w + Math.max(0, x - shift))   * 4;
          d[i]   = copy[ir];
          d[i+2] = copy[ib+2];
        }
      }
      // Random glitch rows
      const rows = Math.round(h * 0.06 * str);
      for (let r = 0; r < rows; r++) {
        const y = Math.floor(Math.random() * h);
        const dx = Math.round((Math.random() - 0.5) * w * 0.3 * str);
        for (let x = 0; x < w; x++) {
          const src = (y * w + Math.max(0, Math.min(w-1, x + dx))) * 4;
          const dst = (y * w + x) * 4;
          d[dst] = copy[src]; d[dst+1] = copy[src+1]; d[dst+2] = copy[src+2];
        }
      }
      blendOriginal(d, orig, str);
    },

    duotone(d, w, h, str) {
      const orig = new Uint8ClampedArray(d);
      toGrayscale(d);
      // Map: shadows → deep blue, highlights → hot pink
      for (let i = 0; i < d.length; i += 4) {
        const lum = d[i] / 255;
        // Shadow color: #1a1a2e → bright: #ff2d78
        const r = clamp(26  + lum * (255 - 26));
        const g = clamp(26  + lum * (45  - 26));
        const b = clamp(46  + lum * (120 - 46));
        d[i]   = r; d[i+1] = g; d[i+2] = b;
      }
      blendOriginal(d, orig, str);
    },

    cross_process(d, w, h, str) {
      const orig = new Uint8ClampedArray(d);
      // E-6 slide film developed in C-41 chemistry: extreme color shifts
      const rC = makeSCurve(0.0, 0.8, 1.15);
      const gC = makeSCurve(0.0, 1.2, 0.95);
      const bC = makeSCurve(0.15, 1.05, 0.7);
      applyCurve(d, rC, gC, bC);
      adjustSaturation(d, 2.0);
      adjustContrast(d, 50 * str);
      applyVignette(d, w, h, 0.6 * str);
      blendOriginal(d, orig, str);
    },

    // ── Y2K TRENDING ──────────────────────────────────────────────────────────

    cyberpunk(d, w, h, str) {
      // Inspired by CamanJS / Pixels.js cyberpunk: deep teal shadows, magenta mids
      const orig = new Uint8ClampedArray(d);
      adjustSaturation(d, 1.6);
      for (let i = 0; i < d.length; i += 4) {
        const lum = (d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114) / 255;
        // Shadow: push cyan/teal
        if (lum < 0.4) {
          d[i]   = clamp(d[i]   * (1 - str * 0.3));
          d[i+1] = clamp(d[i+1] + str * 20 * (1 - lum));
          d[i+2] = clamp(d[i+2] + str * 35 * (1 - lum));
        }
        // Highlights: push magenta
        if (lum > 0.7) {
          d[i]   = clamp(d[i]   + str * 20 * lum);
          d[i+1] = clamp(d[i+1] * (1 - str * 0.15));
          d[i+2] = clamp(d[i+2] + str * 10 * lum);
        }
      }
      adjustContrast(d, 25 * str);
      applyVignette(d, w, h, 0.7 * str);
      blendOriginal(d, orig, str);
    },

    office_party(d, w, h, str) {
      // Late 90s office party digicam: harsh on-camera flash, blueish
      const orig = new Uint8ClampedArray(d);
      adjustExposure(d, 1.3);
      adjustSaturation(d, 0.7);
      addColorCast(d, -8 * str, -4 * str, 22 * str);
      addPixelNoise(d, 20 * str);
      // Flash hotspot: bright centre circle
      const cx = w / 2, cy = h / 2;
      const rad = Math.min(w, h) * 0.35;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
          if (dist < rad) {
            const boost = (1 - dist / rad) * 0.3 * str;
            const i = (y * w + x) * 4;
            d[i]   = clamp(d[i]   + boost * 255);
            d[i+1] = clamp(d[i+1] + boost * 255);
            d[i+2] = clamp(d[i+2] + boost * 255);
          }
        }
      }
      blendOriginal(d, orig, str);
    },

    bayer_lcd(d, w, h, str) {
      // Bayer matrix / low color depth — simulates CCD banding & LCD grid
      const orig = new Uint8ClampedArray(d);
      // Quantize colors to simulate low bit depth
      const levels = Math.round(4 + (1 - str) * 28); // str=1 → 4 levels
      const step = 256 / levels;
      for (let i = 0; i < d.length; i += 4) {
        d[i]   = clamp(Math.round(d[i]   / step) * step);
        d[i+1] = clamp(Math.round(d[i+1] / step) * step);
        d[i+2] = clamp(Math.round(d[i+2] / step) * step);
      }
      // Bayer-pattern sub-pixel tinting (R-G-B-G grid)
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const cell = (y % 2) * 2 + (x % 2); // 0-3
          if (cell === 0) { d[i]   = clamp(d[i]   + 12 * str); }        // R
          else if (cell === 1 || cell === 2) { d[i+1] = clamp(d[i+1] + 8 * str); } // G
          else { d[i+2] = clamp(d[i+2] + 12 * str); }                   // B
        }
      }
      blendOriginal(d, orig, str);
    },

    lofi_ccd(d, w, h, str) {
      // Lo-Fi CCD — based on Pixels.js "lofi" technique:
      // extreme vignette, crushed blacks, high saturation
      const orig = new Uint8ClampedArray(d);
      adjustSaturation(d, 1.8);
      adjustContrast(d, 40 * str);
      // Crush blacks
      const rCrush = makeSCurve(0.05, 0.92, 1.0);
      const gCrush = makeSCurve(0.04, 0.94, 0.98);
      const bCrush = makeSCurve(0.08, 0.96, 0.92);
      applyCurve(d, rCrush, gCrush, bCrush);
      applyVignette(d, w, h, 1.5 * str);
      addPixelNoise(d, 10 * str);
      blendOriginal(d, orig, str);
    },

    chromostamp(d, w, h, str) {
      // Y2K "chromatic stamp" — heavy lateral aberration per row, like a bad digicam lens
      const orig = new Uint8ClampedArray(d);
      const copy = new Uint8ClampedArray(d);
      for (let y = 0; y < h; y++) {
        // Chromatic aberration increases toward edges
        const edgeFactor = Math.abs(y - h / 2) / (h / 2);
        const shiftR = Math.round(edgeFactor * 6 * str);
        const shiftB = Math.round(-edgeFactor * 4 * str);
        for (let x = 0; x < w; x++) {
          const i  = (y * w + x) * 4;
          const ir = (y * w + Math.min(w - 1, x + shiftR)) * 4;
          const ib = (y * w + Math.max(0, x + shiftB)) * 4;
          d[i]   = copy[ir];
          d[i+2] = copy[ib + 2];
        }
      }
      addPixelNoise(d, 8 * str);
      blendOriginal(d, orig, str);
    },

    milky_fade(d, w, h, str) {
      // "Milky" fade — pastel, faded, high-key whites; trending on Y2K edits
      const orig = new Uint8ClampedArray(d);
      adjustSaturation(d, 0.65);
      adjustContrast(d, -30 * str);
      adjustExposure(d, 1.2);
      // Lift shadows to white-ish
      const lift = makeSCurve(0.15, 0.85, 1.0);
      applyCurve(d, lift, lift, lift);
      addColorCast(d, 10 * str, 8 * str, 14 * str);
      blendOriginal(d, orig, str);
    },

    pixelcrush(d, w, h, str) {
      // Pixelcrush: heavy downscale + upscale = visible pixel grid
      const orig = new Uint8ClampedArray(d);
      const scale = Math.max(2, Math.round(16 * str));
      const bW = Math.max(1, w / scale);
      const bH = Math.max(1, h / scale);
      // Build pixelated version in-place
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const bx = Math.floor(x / scale) * scale;
          const by = Math.floor(y / scale) * scale;
          const si = (Math.min(h - 1, by) * w + Math.min(w - 1, bx)) * 4;
          const di = (y * w + x) * 4;
          d[di]   = orig[si];
          d[di+1] = orig[si+1];
          d[di+2] = orig[si+2];
        }
      }
      // Add slight scanline grid
      for (let y = 0; y < h; y += scale) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          d[i] = clamp(d[i] * 0.7); d[i+1] = clamp(d[i+1] * 0.7); d[i+2] = clamp(d[i+2] * 0.7);
        }
      }
      blendOriginal(d, orig, str);
    },

    aqua_dream(d, w, h, str) {
      // Aqua Dream — trendy Y2K teal/cyan push, inspired by Fuji Superia aqua cast
      const orig = new Uint8ClampedArray(d);
      adjustSaturation(d, 1.25);
      const rC = makeSCurve(0.0, 1.0, 0.88);
      const gC = makeSCurve(0.02, 0.95, 1.05);
      const bC = makeSCurve(0.04, 0.9, 1.12);
      applyCurve(d, rC, gC, bC);
      addColorCast(d, -12 * str, 6 * str, 20 * str);
      applyVignette(d, w, h, 0.5 * str);
      adjustContrast(d, 10 * str);
      blendOriginal(d, orig, str);
    },

    sunset_boost(d, w, h, str) {
      // Sunset Boost — warm highlights, cool shadows (split toning)
      const orig = new Uint8ClampedArray(d);
      adjustSaturation(d, 1.35);
      for (let i = 0; i < d.length; i += 4) {
        const lum = (d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114) / 255;
        // Shadows: push blue
        const shadowStr = Math.max(0, (0.4 - lum) / 0.4) * str;
        d[i]   = clamp(d[i]   - shadowStr * 20);
        d[i+2] = clamp(d[i+2] + shadowStr * 30);
        // Highlights: push orange
        const hiliteStr = Math.max(0, (lum - 0.6) / 0.4) * str;
        d[i]   = clamp(d[i]   + hiliteStr * 40);
        d[i+1] = clamp(d[i+1] + hiliteStr * 15);
        d[i+2] = clamp(d[i+2] - hiliteStr * 20);
      }
      adjustContrast(d, 15 * str);
      applyVignette(d, w, h, 0.4 * str);
      blendOriginal(d, orig, str);
    },

    silicon_valley(d, w, h, str) {
      // Silicon Valley (00s tech company camera): clinical, cool, slightly overexposed
      const orig = new Uint8ClampedArray(d);
      adjustSaturation(d, 0.55);
      adjustContrast(d, -10 * str);
      adjustExposure(d, 1.15);
      addColorCast(d, -5 * str, -2 * str, 18 * str);
      const rC = makeSCurve(0.06, 1.0, 0.95);
      const gC = makeSCurve(0.05, 1.0, 0.96);
      const bC = makeSCurve(0.04, 0.95, 1.04);
      applyCurve(d, rC, gC, bC);
      blendOriginal(d, orig, str);
    }

  };

})();
