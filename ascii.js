/**
 * ascii.js — ASCII Art Generator
 * Fixes: text-to-ASCII (uses canvas render), image-to-ASCII (correct pixel read)
 */
(function () {
  'use strict';

  // ── Character sets ──────────────────────────────────────────────────────────
  const CHARSETS = {
    dense:    '█▓▒░ ',
    standard: '@#%=+*:. ',
    minimal:  '@#. ',
    outline:  '  .:;|=+ ',
    slant:    '▀▄ ',
    entity:   '@#%=+*:. '  // uses entity pipeline; chars overridden at edges
  };

  // ── Edge chars by gradient angle (8 directions + flat) ────────────────────
  // Angle in radians → representative ASCII char that visually matches slope
  const EDGE_CHARS_STRONG = '|\\-/';
  const EDGE_CHARS_MEDIUM = '!](/';

  // ── Entity-aware image-to-ASCII ────────────────────────────────────────────
  // Pipeline:
  //  1. CLAHE-lite: local contrast normalisation to reveal flat-region detail
  //  2. Sobel X/Y → edge magnitude + gradient angle
  //  3. Non-maximum suppression (thin edges to 1px)
  //  4. For each cell: if edge → direction char, else → luminance char
  //  5. Blend edge response into luminance for smooth falloff

  function imageToAsciiEntity(img, width) {
    const aspect = img.naturalHeight / img.naturalWidth;
    const height = Math.max(1, Math.round(width * aspect * 0.46));

    const cvs = document.createElement('canvas');
    cvs.width = width;
    cvs.height = height;
    const ctx = cvs.getContext('2d');

    // 1. Draw image
    ctx.drawImage(img, 0, 0, width, height);
    const raw = ctx.getImageData(0, 0, width, height);
    const d = raw.data;

    // Build grayscale buffer
    const gray = new Float32Array(width * height);
    for (let i = 0; i < d.length; i += 4) {
      const p = i / 4;
      gray[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    }

    // 2. CLAHE-lite: per-block histogram equalisation (block = 8x8 cells)
    const blockSz = 8;
    const clahe = claheLite(gray, width, height, blockSz);

    // 3. Sobel — compute Gx, Gy, magnitude, angle
    const mag   = new Float32Array(width * height);
    const angle = new Float32Array(width * height); // radians
    let maxMag = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const p = y * width + x;
        // Sobel kernels using CLAHE-enhanced luminance
        const tl = clahe[(y-1)*width+(x-1)], tc = clahe[(y-1)*width+x], tr = clahe[(y-1)*width+(x+1)];
        const ml = clahe[y    *width+(x-1)],                              mr = clahe[y    *width+(x+1)];
        const bl = clahe[(y+1)*width+(x-1)], bc = clahe[(y+1)*width+x], br = clahe[(y+1)*width+(x+1)];

        const gx = (-tl + tr - 2*ml + 2*mr - bl + br);
        const gy = (-tl - 2*tc - tr + bl + 2*bc + br);

        mag[p]   = Math.sqrt(gx * gx + gy * gy);
        angle[p] = Math.atan2(gy, gx); // -π to π
        if (mag[p] > maxMag) maxMag = mag[p];
      }
    }

    // 4. Non-maximum suppression (thin edges)
    const suppressed = new Float32Array(width * height);
    const threshold  = maxMag * 0.20; // adaptive — top 80% of edge strength

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const p = y * width + x;
        const m = mag[p];
        if (m < threshold) { suppressed[p] = 0; continue; }

        // Quantise angle to 4 directions
        const a = ((angle[p] * 180 / Math.PI) + 180) % 180;
        let n1, n2;
        if      (a < 22.5  || a >= 157.5) { n1 = mag[y*width+(x-1)];     n2 = mag[y*width+(x+1)];     } // 0° horiz
        else if (a < 67.5)                { n1 = mag[(y-1)*width+(x+1)]; n2 = mag[(y+1)*width+(x-1)]; } // 45°
        else if (a < 112.5)               { n1 = mag[(y-1)*width+x];     n2 = mag[(y+1)*width+x];     } // 90° vert
        else                              { n1 = mag[(y-1)*width+(x-1)]; n2 = mag[(y+1)*width+(x+1)]; } // 135°

        suppressed[p] = (m >= n1 && m >= n2) ? m : 0;
      }
    }

    // 5. Build ASCII output
    const lumChars   = '@#S%?*+;:,. '; // dense to light for fills
    const edgeStrong = ['|', '-', '/', '\\', '|', '-', '/', '\\']; // by angle octant
    const edgeMed    = [';', '~', ',', '`',  ';', '~', ',', '`' ];
    const strongThresh = maxMag * 0.55;
    const medThresh    = maxMag * 0.20;

    let out = '';
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = y * width + x;
        const s = suppressed[p];

        if (s > strongThresh) {
          // Strong edge: pick direction char
          const a = ((angle[p] * 180 / Math.PI) + 360) % 360;
          const octant = Math.round(a / 45) % 8;
          out += edgeStrong[octant];
        } else if (s > medThresh) {
          // Medium edge: softer edge char
          const a = ((angle[p] * 180 / Math.PI) + 360) % 360;
          const octant = Math.round(a / 45) % 8;
          out += edgeMed[octant];
        } else {
          // Interior: luminance-based fill with CLAHE enhancement
          const lum = clahe[p];
          const idx = Math.round((lum / 255) * (lumChars.length - 1));
          out += lumChars[idx];
        }
      }
      out += '\n';
    }
    return out;
  }

  // ── CLAHE-lite: Contrast Limited Adaptive Histogram Equalisation ───────────
  // Divides image into blockSz×blockSz blocks, equalises each, bilinear blend.
  function claheLite(gray, w, h, blockSz) {
    const result = new Float32Array(w * h);
    const clipLimit = 3.5; // contrast clip strength

    // Compute block grid
    const cols = Math.ceil(w / blockSz);
    const rows = Math.ceil(h / blockSz);

    // Build LUT per block
    const luts = [];
    for (let br = 0; br < rows; br++) {
      luts[br] = [];
      for (let bc = 0; bc < cols; bc++) {
        const x0 = bc * blockSz, y0 = br * blockSz;
        const x1 = Math.min(x0 + blockSz, w);
        const y1 = Math.min(y0 + blockSz, h);
        luts[br][bc] = buildBlockLUT(gray, w, x0, y0, x1, y1, clipLimit);
      }
    }

    // Interpolate for each pixel
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        const v = gray[p];

        // Find surrounding block corners
        const bx = (x / blockSz) - 0.5;
        const by = (y / blockSz) - 0.5;
        const bx0 = Math.max(0, Math.floor(bx)),  bx1 = Math.min(cols - 1, bx0 + 1);
        const by0 = Math.max(0, Math.floor(by)),  by1 = Math.min(rows - 1, by0 + 1);
        const tx = bx - bx0, ty = by - by0;

        const vi = Math.round(v);
        const v00 = luts[by0][bx0][vi];
        const v10 = luts[by0][bx1][vi];
        const v01 = luts[by1][bx0][vi];
        const v11 = luts[by1][bx1][vi];

        // Bilinear blend
        result[p] = v00*(1-tx)*(1-ty) + v10*tx*(1-ty) + v01*(1-tx)*ty + v11*tx*ty;
      }
    }
    return result;
  }

  function buildBlockLUT(gray, w, x0, y0, x1, y1, clipLimit) {
    const hist = new Int32Array(256);
    let count = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        hist[Math.round(gray[y * w + x])]++;
        count++;
      }
    }
    // Clip histogram
    const clip = Math.max(1, Math.round((count / 256) * clipLimit));
    let excess = 0;
    for (let i = 0; i < 256; i++) {
      if (hist[i] > clip) { excess += hist[i] - clip; hist[i] = clip; }
    }
    // Redistribute excess
    const add = Math.floor(excess / 256);
    for (let i = 0; i < 256; i++) hist[i] += add;

    // CDF → LUT
    const lut = new Float32Array(256);
    let cdf = 0, cdfMin = -1;
    for (let i = 0; i < 256; i++) {
      cdf += hist[i];
      if (cdfMin < 0 && hist[i] > 0) cdfMin = cdf;
      lut[i] = Math.round(((cdf - cdfMin) / Math.max(1, count - cdfMin)) * 255);
    }
    return lut;
  }

  // ── FIGlet-style font data (5-row block letters) ────────────────────────────
  const FONTS = {
    block: {
      A: ['┌─┐','│█│','└─┘','  │','  │'],
      B: ['┌─┐','├─┤','│ │','├─┤','└─┘'],
      C: ['┌──','│  ','│  ','│  ','└──'],
      D: ['┌─╮','│ │','│ │','│ │','└─╯'],
      E: ['┌──','├──','│  ','├──','└──'],
      F: ['┌──','├──','│  ','│  ','│  '],
      G: ['┌──','│  ','│ ╮','│ │','└──'],
      H: ['│ │','│ │','├─┤','│ │','│ │'],
      I: ['│','│','│','│','│'],
      J: ['  │','  │','  │','│ │','└─┘'],
      K: ['│╲ ','│╱ ','├╲ ','│╲ ','│ ╲'],
      L: ['│  ','│  ','│  ','│  ','└──'],
      M: ['╔╗','║║','╠╣','║║','╚╝'],
      N: ['╔╗','║║','║║','║║','╚╝'],
      O: ['┌─┐','│ │','│ │','│ │','└─┘'],
      P: ['┌─┐','│ │','├─┘','│  ','│  '],
      Q: ['┌─┐','│ │','│ │','│╲│','└─╯'],
      R: ['┌─┐','│ │','├─┤','│╲ ','│ ╲'],
      S: ['┌──','└─┐','  │','┌─┘','└──'],
      T: ['───','│  ','│  ','│  ','│  '],
      U: ['│ │','│ │','│ │','│ │','└─┘'],
      V: ['│ │','│ │','│ │','└┬┘',' │ '],
      W: ['│ │','│ │','│╳│','│╲│','╰─╯'],
      X: ['╲ ╱','╲╱ ','╱╲ ','╱ ╲','   '],
      Y: ['│ │','└┬┘',' │ ',' │ ',' │ '],
      Z: ['───','  ╱',' ╱ ','╱  ','───'],
      '0': ['┌─┐','│╲│','│ │','│╱│','└─┘'],
      '1': [' │',' │',' │',' │',' │'],
      '2': ['┌─┐','  │','┌─┘','│  ','└──'],
      '3': ['───','  │','─┤ ','  │','───'],
      '4': ['│ │','│ │','└─┤','  │','  │'],
      '5': ['──┐','│  ','└─┐','  │','──┘'],
      '6': ['┌──','│  ','├─┐','│ │','└─┘'],
      '7': ['───','  │','  │','  │','  │'],
      '8': ['┌─┐','│ │','├─┤','│ │','└─┘'],
      '9': ['┌─┐','│ │','└─┤','  │','  │'],
      ' ': ['   ','   ','   ','   ','   ']
    },
    thin: {
      A: ['∧','││','┼─┼','│ │','│ │'],
      B: ['├─┐','├─┤','│ │','├─┤','└─┘'],
      C: ['╭──','│  ','│  ','│  ','╰──'],
      D: ['╭─╮','│ │','│ │','│ │','╰─╯'],
      E: ['╭──','├──','│  ','├──','╰──'],
      F: ['╭──','├──','│  ','│  ','│  '],
      G: ['╭──','│  ','│ ╮','│ │','╰──'],
      H: ['│ │','│ │','├─┤','│ │','│ │'],
      I: ['─','│','│','│','─'],
      J: ['  │','  │','  │','╰─│','  ╯'],
      K: ['│ ╱','│╱ ','├╲ ','│ ╲','│  ╲'],
      L: ['│  ','│  ','│  ','│  ','╰──'],
      M: ['│╲│','│╱│','│ │','│ │','│ │'],
      N: ['│╲ ','│ ╲','│  │','│  │','│  │'],
      O: ['╭─╮','│ │','│ │','│ │','╰─╯'],
      P: ['╭─╮','│ │','├─╯','│  ','│  '],
      Q: ['╭─╮','│ │','│ │','│ ┘','╰─╲'],
      R: ['╭─╮','│ │','├─┤','│ ╲','│  ╲'],
      S: ['╭──','╰─╮','  │','╭─╯','╰──'],
      T: ['─┬─',' │ ',' │ ',' │ ',' │ '],
      U: ['│ │','│ │','│ │','│ │','╰─╯'],
      V: ['╲ ╱','╲ ╱',' ╲╱',' ╲╱','  ╲'],
      W: ['│ │','│ │','│ │','╰┬╯',' │ '],
      X: ['╲ ╱',' ╲╱',' ╱╲','╱ ╲','   '],
      Y: ['╲ ╱',' ╲╱',' │ ',' │ ',' │ '],
      Z: ['──╮',' ╱ ','╱  ','╰──','   '],
      '0': ['╭─╮','│ │','│ │','│ │','╰─╯'],
      '1': [' │',' │',' │',' │',' │'],
      '2': ['╭─╮','  │','╭─╯','│  ','╰──'],
      '3': ['──╮','  │','─┤ ','  │','──╯'],
      '4': ['│ │','│ │','╰─┤','  │','  │'],
      '5': ['──╮','│  ','╰─╮','  │','──╯'],
      '6': ['╭──','│  ','├─╮','│ │','╰─╯'],
      '7': ['──╮','  │','  │','  │','  │'],
      '8': ['╭─╮','│ │','├─┤','│ │','╰─╯'],
      '9': ['╭─╮','│ │','╰─┤','  │','  │'],
      ' ': ['   ','   ','   ','   ','   ']
    },
    double: {
      A: ['╔═╗','║▓║','╠═╣','║ ║','║ ║'],
      B: ['╔═╗','╠═╣','║ ║','╠═╣','╚═╝'],
      C: ['╔══','║  ','║  ','║  ','╚══'],
      D: ['╔═╗','║ ║','║ ║','║ ║','╚═╝'],
      E: ['╔══','╠══','║  ','╠══','╚══'],
      F: ['╔══','╠══','║  ','║  ','║  '],
      G: ['╔══','║  ','║ ╗','║ ║','╚══'],
      H: ['║ ║','║ ║','╠═╣','║ ║','║ ║'],
      I: ['║','║','║','║','║'],
      J: ['  ║','  ║','  ║','║ ║','╚═╝'],
      K: ['║ ╗','║╔╝','╠╩╗','║ ╚','║  ╚'],
      L: ['║  ','║  ','║  ','║  ','╚══'],
      M: ['╔╗╔','╠╬╣','║║║','║║║','╝╚╝'],
      N: ['╔╗ ','║╚╗','║ ║','║  ║','╝  ╝'],
      O: ['╔═╗','║ ║','║ ║','║ ║','╚═╝'],
      P: ['╔═╗','║ ║','╠═╝','║  ','║  '],
      Q: ['╔═╗','║ ║','║ ║','╚═╝','  ╚'],
      R: ['╔═╗','║ ║','╠═╣','║ ╚','║  ╚'],
      S: ['╔══','╚═╗','  ║','═╗ ','╚══'],
      T: ['╔══╗',' ║ ',' ║ ',' ║ ',' ║ '],
      U: ['║ ║','║ ║','║ ║','║ ║','╚═╝'],
      V: ['║ ║','║ ║','╚╤╝',' │ ','   '],
      W: ['║ ║','║ ║','╠═╣','╚╦╝',' ║ '],
      X: ['╗ ╔','╚╗╔╝',' ╔╗ ','╔╝╚╗','╝  ╚'],
      Y: ['║ ║','╚╦╝',' ║ ',' ║ ',' ║ '],
      Z: ['══╗','  ║',' ║ ','║  ','╚══'],
      '0': ['╔═╗','║ ║','║ ║','║ ║','╚═╝'],
      '1': [' ║',' ║',' ║',' ║',' ║'],
      '2': ['╔═╗','  ║','╔═╝','║  ','╚══'],
      '3': ['══╗','  ║','═╣ ','  ║','══╝'],
      '4': ['║ ║','║ ║','╚═╣','  ║','  ║'],
      '5': ['══╗','║  ','╚═╗','  ║','══╝'],
      '6': ['╔══','║  ','╠═╗','║ ║','╚═╝'],
      '7': ['══╗','  ║','  ║','  ║','  ║'],
      '8': ['╔═╗','║ ║','╠═╣','║ ║','╚═╝'],
      '9': ['╔═╗','║ ║','╚═╣','  ║','  ║'],
      ' ': ['   ','   ','   ','   ','   ']
    },
    shadow: {
      A: [' ▄█▄ ','█   █','█████','█   █','█   █'],
      B: ['████ ','█   █','████ ','█   █','████ '],
      C: [' ████','█    ','█    ','█    ',' ████'],
      D: ['████ ','█   █','█   █','█   █','████ '],
      E: ['█████','█    ','████ ','█    ','█████'],
      F: ['█████','█    ','████ ','█    ','█    '],
      G: [' ████','█    ','█  ██','█   █',' ████'],
      H: ['█   █','█   █','█████','█   █','█   █'],
      I: ['███',' █ ',' █ ',' █ ','███'],
      J: ['  ██','   █','   █','█  █',' ██ '],
      K: ['█  █','█ █ ','██  ','█ █ ','█  █'],
      L: ['█   ','█   ','█   ','█   ','████'],
      M: ['█   █','██ ██','█ █ █','█   █','█   █'],
      N: ['█   █','██  █','█ █ █','█  ██','█   █'],
      O: [' ███ ','█   █','█   █','█   █',' ███ '],
      P: ['████ ','█   █','████ ','█    ','█    '],
      Q: [' ███ ','█   █','█   █','█  ██',' ████'],
      R: ['████ ','█   █','████ ','█ █  ','█  █ '],
      S: [' ████','█    ',' ███ ','    █','████ '],
      T: ['█████',' █   ',' █   ',' █   ',' █   '],
      U: ['█   █','█   █','█   █','█   █',' ███ '],
      V: ['█   █','█   █','█   █',' █ █ ','  █  '],
      W: ['█   █','█   █','█ █ █','██ ██','█   █'],
      X: ['█   █',' █ █ ','  █  ',' █ █ ','█   █'],
      Y: ['█   █',' █ █ ','  █  ','  █  ','  █  '],
      Z: ['█████','   █ ','  █  ',' █   ','█████'],
      '0': [' ███ ','█  ██','█ █ █','██  █',' ███ '],
      '1': [' █ ',' █ ',' █ ',' █ ','███'],
      '2': [' ███','   █',' ██ ','█   ','████'],
      '3': ['████','   █',' ██ ','   █','████'],
      '4': ['█  █','█  █','████','   █','   █'],
      '5': ['████','█   ','███ ','   █','███ '],
      '6': [' ███','█   ','████','█  █',' ███'],
      '7': ['████','   █','  █ ',' █  ',' █  '],
      '8': [' ███','█  █',' ███','█  █',' ███'],
      '9': [' ███','█  █',' ████','   █',' ███'],
      ' ': ['     ','     ','     ','     ','     ']
    },
    retro: {
      A: ['▗▄▖','▐█▌','█▀█','█ █','█ █'],
      B: ['▙▄▖','▙▄▟','█ █','▙▄▟','▛▀▘'],
      C: ['▗▄▖','█  ','█  ','█  ','▝▄▘'],
      D: ['▙▄ ','█ ▌','█ ▌','█ ▌','▛▀ '],
      E: ['▟▀▀','▛▀ ','█  ','▛▀ ','▙▄▄'],
      F: ['▟▀▀','▛▀ ','█  ','█  ','█  '],
      G: ['▗▄▖','█  ','█▄▖','█ ▌','▝▄▘'],
      H: ['█ █','█ █','███','█ █','█ █'],
      I: ['▐','▐','▐','▐','▐'],
      J: ['  ▐','  ▐','  ▐','▌ ▐','▝▄▘'],
      K: ['█ █','█▐ ','██ ','█▐ ','█ █'],
      L: ['█  ','█  ','█  ','█  ','███'],
      M: ['█▄▄█','█▀▀█','█  █','█  █','█  █'],
      N: ['▐▙▖ ','█▚█ ','█▐█ ','█ ▚ ','█ ▝█'],
      O: ['▗▄▖','█ █','█ █','█ █','▝▄▘'],
      P: ['▙▄▖','█ █','▛▀▘','█  ','█  '],
      Q: ['▗▄▖','█ █','█ █','▝▟▘','  ▚'],
      R: ['▙▄▖','█ █','▛▀▖','█▚ ','█ ▚'],
      S: ['▗▄▖','▛  ','▝▄▖','  ▌','▝▄▘'],
      T: ['▀█▀',' █ ',' █ ',' █ ',' █ '],
      U: ['█ █','█ █','█ █','█ █','▝▄▘'],
      V: ['█ █','█ █','▌ ▐','▚ ▞',' ▀ '],
      W: ['█ █','█ █','█▄█','▛▀▛','█ █'],
      X: ['▚ ▞',' ▞▚ ','▐▄▌',' ▞▚ ','▞ ▚'],
      Y: ['█ █','▝█▘',' █ ',' █ ',' █ '],
      Z: ['▀▀█','  ▞',' ▞ ','▞  ','█▄▄'],
      '0': ['▗▄▖','█ █','█ █','█ █','▝▄▘'],
      '1': ['▗█','  █','  █','  █','  █'],
      '2': ['▗▄▖','  █','▗▄▘','█  ','███'],
      '3': ['▗▄▖','  █','▗▄▘','  █','▝▄▘'],
      '4': ['█ █','█ █','▙▄█','  █','  █'],
      '5': ['███','█  ','▙▄ ','  █','▙▄▘'],
      '6': ['▗▄▖','█  ','▙▄▖','█ █','▝▄▘'],
      '7': ['███','  █',' █ ',' █ ',' █ '],
      '8': ['▗▄▖','█ █','▝▄▘','█ █','▝▄▘'],
      '9': ['▗▄▖','█ █','▝▄▟','  █','▝▄▘'],
      ' ': ['   ','   ','   ','   ','   ']
    },
    digital: {
      A: ['___|_','|   |','|___|','|   |','|   |'],
      B: ['|\\  ','| > |','| > |','|___|','|___|'],
      C: ['___','|  ','|  ','|__','   '],
      D: ['|\\  ','| \\ ','|  |','|  |','|__|'],
      E: ['|---','|   ','|---','|   ','|---'],
      F: ['|---','|---','|   ','|   ','|   '],
      G: ['___','|   ','| _','|  |','|__|'],
      H: ['| |','| |','|-|','| |','| |'],
      I: ['|','|','|','|','|'],
      J: ['  |','  |','  |','| |','|_|'],
      K: ['|/','|<','|\\','| \\','|  \\'],
      L: ['|  ','|  ','|  ','|  ','|__'],
      M: ['|\\/|','|  |','|  |','|  |','|  |'],
      N: ['|\\|','| |','| |','| |','| |'],
      O: ['___','|  |','|  |','|  |','|__|'],
      P: ['___|','|   |','|___|','|    ','|    '],
      Q: ['___','|  |','|  |','|_\\|','   \\'],
      R: ['|_|','| |','|-|','|\\ ','|  \\'],
      S: ['___','|   ','|___','   |','___|'],
      T: ['-|-','  |','  |','  |','  |'],
      U: ['| |','| |','| |','| |','|_|'],
      V: ['| |','| |','| |',' V ',' * '],
      W: ['| |','| |','|V|','|/\\|','   '],
      X: ['\\/ ','\\/ ',' X ',' /\\ ','/ \\'],
      Y: ['\\|/','\\|/',' | ',' | ',' | '],
      Z: ['---','  /','  /',' / ','---'],
      '0': ['_0_','| |','|0|','| |','|_|'],
      '1': [' |',' |',' |',' |',' |'],
      '2': ['_2_','  |','___|','|  ','|__'],
      '3': ['___','  |','_| ','  |','___|'],
      '4': ['| |','|_|','  |','  |','  |'],
      '5': ['_5_','|  ','|__','  |','___|'],
      '6': ['___','|  ','|__','| |','|_|'],
      '7': ['_7_','  |','  |','  |','  |'],
      '8': ['_8_','| |','|_|','| |','|_|'],
      '9': ['_9_','| |','|_|','  |','  |'],
      ' ': ['   ','   ','   ','   ','   ']
    }
  };

  // Normalise for missing chars
  Object.keys(FONTS).forEach(fname => {
    const fallback = (FONTS[fname][' '] || ['   ','   ','   ','   ','   ']);
    for (let c = 65; c <= 90; c++) {
      const k = String.fromCharCode(c);
      if (!FONTS[fname][k]) FONTS[fname][k] = fallback;
    }
    for (let n = 0; n <= 9; n++) {
      const k = String(n);
      if (!FONTS[fname][k]) FONTS[fname][k] = fallback;
    }
  });

  // ── ASCII from image (standard + entity-aware) ───────────────────────────────
  function imageToAscii(img, width, charsetKey) {
    // Route to entity pipeline if selected
    if (charsetKey === 'entity') return imageToAsciiEntity(img, width);

    const chars = CHARSETS[charsetKey] || CHARSETS.standard;
    const aspect = img.naturalHeight / img.naturalWidth;
    const height = Math.max(1, Math.round(width * aspect * 0.46));

    const cvs = document.createElement('canvas');
    cvs.width = width;
    cvs.height = height;
    const ctx = cvs.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    const data = ctx.getImageData(0, 0, width, height).data;
    let out = '';
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const idx = Math.round((lum / 255) * (chars.length - 1));
        out += chars[idx];
      }
      out += '\n';
    }
    return out;
  }

  // ── ASCII from text (canvas-rendered text → ascii) ──────────────────────────
  function textToAscii(text, width, charsetKey) {
    if (!text.trim()) return '';
    text = text.toUpperCase().replace(/[^A-Z0-9 !?.:-]/g, '');
    if (!text) return 'USE A-Z 0-9 ONLY';

    const fontSize = 24;
    const cvs = document.createElement('canvas');
    cvs.width = width * 2;
    cvs.height = 60;
    const ctx = cvs.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cvs.width, cvs.height);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textBaseline = 'top';
    ctx.fillText(text, 4, 4);

    const pxW = cvs.width;
    const pxH = cvs.height;
    const data = ctx.getImageData(0, 0, pxW, pxH).data;
    const chars = CHARSETS[charsetKey] || CHARSETS.standard;
    const stepX = Math.max(1, Math.floor(pxW / width));
    const stepY = Math.max(1, Math.floor(stepX * 2));

    let out = '';
    for (let y = 0; y < pxH; y += stepY) {
      let row = '';
      for (let x = 0; x < pxW; x += stepX) {
        const i = (y * pxW + x) * 4;
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const idx = Math.round((lum / 255) * (chars.length - 1));
        row += chars[idx];
      }
      // Skip entirely blank rows at top/bottom
      if (row.trim()) out += row + '\n';
    }
    return out || text;
  }

  // ── Big figlet-style text ────────────────────────────────────────────────────
  function generateFiglet(text, fontName) {
    const font = FONTS[fontName] || FONTS.block;
    text = text.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
    if (!text) return 'USE A-Z 0-9 ONLY';

    const rows = 5;
    const lines = Array(rows).fill('');
    for (const ch of text) {
      const glyphRows = font[ch] || font[' '] || ['   ','   ','   ','   ','   '];
      const maxW = Math.max(...glyphRows.map(r => r.length));
      for (let r = 0; r < rows; r++) {
        const row = (glyphRows[r] || '').padEnd(maxW, ' ');
        lines[r] += row + ' ';
      }
    }
    return lines.join('\n');
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    const modeTextBtn = document.getElementById('ascii-mode-text');
    const modeImgBtn  = document.getElementById('ascii-mode-img');
    const textSection = document.getElementById('ascii-text-section');
    const imgSection  = document.getElementById('ascii-image-section');
    const dropZone    = document.getElementById('ascii-drop-zone');
    const fileInput   = document.getElementById('ascii-file-input');
    const textInput   = document.getElementById('ascii-text-input');
    const widthSlider = document.getElementById('ascii-width');
    const widthVal    = document.getElementById('ascii-width-val');
    const charsetSel  = document.getElementById('ascii-charset');
    const fontSel     = document.getElementById('ascii-font');
    const entityNote  = document.getElementById('ascii-entity-note');
    const sizeSlider  = document.getElementById('ascii-size');
    const sizeVal     = document.getElementById('ascii-size-val');
    const output      = document.getElementById('ascii-output');
    const generateBtn = document.getElementById('ascii-generate-btn');
    const clearBtn    = document.getElementById('ascii-clear-btn');
    const copyBtn     = document.getElementById('ascii-copy-btn');
    const dlBtn       = document.getElementById('ascii-download-btn');

    if (!modeTextBtn) return; // not on ascii page

    let mode = 'text';
    let loadedImg = null;

    // Mode switch
    modeTextBtn.addEventListener('click', () => {
      mode = 'text';
      modeTextBtn.classList.add('active');
      modeImgBtn.classList.remove('active');
      textSection.classList.remove('hidden');
      imgSection.classList.add('hidden');
    });

    modeImgBtn.addEventListener('click', () => {
      mode = 'image';
      modeImgBtn.classList.add('active');
      modeTextBtn.classList.remove('active');
      imgSection.classList.remove('hidden');
      textSection.classList.add('hidden');
    });

    // Sliders
    widthSlider.addEventListener('input', () => { widthVal.textContent = widthSlider.value; });
    sizeSlider.addEventListener('input', () => {
      sizeVal.textContent = sizeSlider.value;
      output.style.fontSize = sizeSlider.value + 'px';
    });

    // Show entity note when entity mode selected
    charsetSel.addEventListener('change', () => {
      if (entityNote) entityNote.style.display = charsetSel.value === 'entity' ? 'block' : 'none';
    });

    // Drop zone
    function loadImageFile(file) {
      if (!file || !file.type.startsWith('image/')) return;
      const img = new Image();
      img.onload = () => {
        loadedImg = img;
        const p = dropZone.querySelector('.drop-zone-text');
        if (p) p.textContent = 'IMAGE LOADED — CLICK GENERATE';
      };
      img.src = URL.createObjectURL(file);
    }

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault(); dropZone.classList.remove('dragover');
      loadImageFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => loadImageFile(fileInput.files[0]));

    // Generate
    generateBtn.addEventListener('click', () => {
      const w = parseInt(widthSlider.value);
      const charset = charsetSel.value;
      const font = fontSel.value;

      output.classList.add('processing');
      setTimeout(() => {
        try {
          if (mode === 'text') {
            if (font !== 'standard') {
              // Use figlet font
              output.textContent = generateFiglet(textInput.value || 'HELLO', font);
            } else {
              output.textContent = textToAscii(textInput.value || 'HELLO', w, charset);
            }
          } else {
            if (!loadedImg) { output.textContent = '← UPLOAD AN IMAGE FIRST'; return; }
            output.textContent = imageToAscii(loadedImg, w, charset);
          }
        } catch (e) {
          output.textContent = 'ERROR: ' + e.message;
        }
        output.classList.remove('processing');
      }, 20);
    });

    clearBtn.addEventListener('click', () => {
      textInput.value = '';
      output.textContent = '// Generate something above to see output here...';
      loadedImg = null;
      const p = dropZone.querySelector('.drop-zone-text');
      if (p) p.textContent = 'Drop image here or click';
    });

    copyBtn.addEventListener('click', () => {
      const txt = output.textContent;
      if (!txt || txt.startsWith('//')) return;
      navigator.clipboard.writeText(txt).then(() => flashBtn(copyBtn, 'COPIED!'));
    });

    dlBtn.addEventListener('click', () => {
      const txt = output.textContent;
      if (!txt || txt.startsWith('//')) return;
      const blob = new Blob([txt], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ascii-art.txt';
      a.click();
    });

    function flashBtn(btn, msg) {
      const orig = btn.textContent;
      btn.textContent = msg;
      setTimeout(() => { btn.textContent = orig; }, 1200);
    }
  });
})();
