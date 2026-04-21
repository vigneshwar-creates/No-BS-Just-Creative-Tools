// Color Mixer

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: r * 255, g: g * 255, b: b * 255 };
}

function mixColors(c1, c2, ratio, mode) {
  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);
  if (!rgb1 || !rgb2) return c1;
  
  const r = ratio / 100;
  let result;
  
  switch (mode) {
    case 'blend':
      result = {
        r: rgb1.r * (1 - r) + rgb2.r * r,
        g: rgb1.g * (1 - r) + rgb2.g * r,
        b: rgb1.b * (1 - r) + rgb2.b * r
      };
      break;
    case 'add':
      result = {
        r: Math.min(255, rgb1.r + rgb2.r * r),
        g: Math.min(255, rgb1.g + rgb2.g * r),
        b: Math.min(255, rgb1.b + rgb2.b * r)
      };
      break;
    case 'subtract':
      result = {
        r: Math.max(0, rgb1.r - rgb2.r * r),
        g: Math.max(0, rgb1.g - rgb2.g * r),
        b: Math.max(0, rgb1.b - rgb2.b * r)
      };
      break;
    case 'multiply':
      result = {
        r: (rgb1.r / 255) * (rgb2.r / 255 * r + (1 - r)) * 255,
        g: (rgb1.g / 255) * (rgb2.g / 255 * r + (1 - r)) * 255,
        b: (rgb1.b / 255) * (rgb2.b / 255 * r + (1 - r)) * 255
      };
      break;
    default:
      result = { r: rgb1.r, g: rgb1.g, b: rgb1.b };
  }
  
  return rgbToHex(result.r, result.g, result.b);
}

function generateHarmony(baseHex, type) {
  const rgb = hexToRgb(baseHex);
  if (!rgb) return [baseHex];
  
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const colors = [baseHex];
  
  switch (type) {
    case 'complementary':
      colors.push(hslToRgb((hsl.h + 180) % 360, hsl.s, hsl.l));
      break;
    case 'triadic':
      colors.push(hslToRgb((hsl.h + 120) % 360, hsl.s, hsl.l));
      colors.push(hslToRgb((hsl.h + 240) % 360, hsl.s, hsl.l));
      break;
    case 'analogous':
      colors.push(hslToRgb((hsl.h + 30) % 360, hsl.s, hsl.l));
      colors.push(hslToRgb((hsl.h - 30 + 360) % 360, hsl.s, hsl.l));
      break;
    case 'split':
      colors.push(hslToRgb((hsl.h + 150) % 360, hsl.s, hsl.l));
      colors.push(hslToRgb((hsl.h + 210) % 360, hsl.s, hsl.l));
      break;
    case 'tetradic':
      colors.push(hslToRgb((hsl.h + 90) % 360, hsl.s, hsl.l));
      colors.push(hslToRgb((hsl.h + 180) % 360, hsl.s, hsl.l));
      colors.push(hslToRgb((hsl.h + 270) % 360, hsl.s, hsl.l));
      break;
    case 'monochromatic':
      colors.push(hslToRgb(hsl.h, hsl.s, Math.max(10, hsl.l - 30)));
      colors.push(hslToRgb(hsl.h, hsl.s, Math.min(90, hsl.l + 30)));
      colors.push(hslToRgb(hsl.h, Math.max(10, hsl.s - 30), hsl.l));
      break;
  }
  
  return colors;
}

function hslToHex(h, s, l) {
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

document.addEventListener('DOMContentLoaded', () => {
  const color1Input = document.getElementById('color1');
  const color2Input = document.getElementById('color2');
  const color1Hex = document.getElementById('color1-hex');
  const color2Hex = document.getElementById('color2-hex');
  const blendSlider = document.getElementById('blend-ratio');
  const blendVal = document.getElementById('blend-val');
  const mixBtns = document.querySelectorAll('.mode-btn[data-mix]');
  const generateBtn = document.getElementById('mix-generate');
  const harmonySelect = document.getElementById('harmony-type');
  const harmonyBtn = document.getElementById('harmony-generate');
  const resultDiv = document.getElementById('mix-result');
  const resultHex = document.getElementById('mix-result-hex');
  const paletteGrid = document.getElementById('palette-grid');
  const copyHint = document.getElementById('mix-copy-hint');
  
  let currentMode = 'blend';
  
  color1Input.addEventListener('input', () => color1Hex.value = color1Input.value);
  color2Input.addEventListener('input', () => color2Hex.value = color2Input.value);
  color1Hex.addEventListener('change', () => { if (/^#[0-9A-Fa-f]{6}$/.test(color1Hex.value)) color1Input.value = color1Hex.value; });
  color2Hex.addEventListener('change', () => { if (/^#[0-9A-Fa-f]{6}$/.test(color2Hex.value)) color2Input.value = color2Hex.value; });
  
  blendSlider.addEventListener('input', () => blendVal.textContent = blendSlider.value);
  
  mixBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      mixBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mix;
    });
  });
  
  generateBtn.addEventListener('click', () => {
    const result = mixColors(color1Input.value, color2Input.value, parseInt(blendSlider.value), currentMode);
    resultDiv.style.background = result;
    resultHex.textContent = result.toUpperCase();
    copyHint.style.opacity = '1';
  });
  
  resultDiv.addEventListener('click', () => {
    const hex = resultHex.textContent;
    if (hex) {
      copyToClipboard(hex, { textContent: 'COPIED!' });
      setTimeout(() => copyHint.style.opacity = '1', 1500);
    }
  });
  
  harmonyBtn.addEventListener('click', () => {
    const harmonyColors = generateHarmony(color1Input.value, harmonySelect.value);
    paletteGrid.innerHTML = '';
    harmonyColors.forEach(hex => {
      const swatch = document.createElement('div');
      swatch.className = 'palette-item';
      swatch.style.background = hex;
      swatch.innerHTML = `<span class="palette-item-hex">${hex.toUpperCase()}</span>`;
      swatch.addEventListener('click', () => copyToClipboard(hex, { textContent: 'COPIED!' }));
      paletteGrid.appendChild(swatch);
    });
    window.jctHistory?.save('colormixer', { baseColor: color1Input.value, harmony: harmonySelect.value });
  });
  
  generateBtn.click();
});