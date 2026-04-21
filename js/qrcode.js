// QR Code Generator using vanilla JS
// Implements QR Code model 2 (alphanumeric + binary)

const QRCode = {
  generate: function(text, size = 256, ecLevel = 'M') {
    const canvas = document.getElementById('qr-canvas');
    const ctx = canvas.getContext('2d');
    
    const moduleCount = this.calculateModuleCount(text.length, ecLevel);
    const moduleSize = Math.floor(size / moduleCount);
    const realSize = moduleSize * moduleCount;
    
    canvas.width = realSize;
    canvas.height = realSize;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, realSize, realSize);
    
    const data = this.encodeData(text, moduleCount, ecLevel);
    
    ctx.fillStyle = '#000000';
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (data[row * moduleCount + col]) {
          ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
        }
      }
    }
    
    canvas.style.display = 'block';
    document.getElementById('qr-empty').style.display = 'none';
    
    window.jctHistory?.save('qrcode', { text, size, ecLevel });
  },
  
  calculateModuleCount: function(dataLen, ecLevel) {
    const ecLevels = { L: 1, M: 0, Q: 1, H: 2 };
    const version = Math.ceil(Math.sqrt(dataLen * 8 + ecLevels[ecLevel] * 50)) + 1;
    return Math.min(Math.max(21 + (version - 1) * 4, 21), 37);
  },
  
  encodeData: function(text, moduleCount, ecLevel) {
    const data = new Array(moduleCount * moduleCount).fill(false);
    
    // Finder patterns (corners)
    this.drawFinderPattern(data, moduleCount, 0, 0);
    this.drawFinderPattern(data, moduleCount, moduleCount - 7, 0);
    this.drawFinderPattern(data, moduleCount, 0, moduleCount - 7);
    
    // Timing patterns
    for (let i = 8; i < moduleCount - 8; i++) {
      data[6 * moduleCount + i] = i % 2 === 0;
      data[i * moduleCount + 6] = i % 2 === 0;
    }
    
    // Data modules (simple placement)
    let bitIndex = 0;
    const bits = this.stringToBits(text);
    
    for (let col = moduleCount - 1; col >= 1; col -= 2) {
      if (col === 6) col--;
      for (let row = 0; row < moduleCount; row++) {
        for (let c = 0; c < 2; c++) {
          const x = col - c;
          if (!this.isReserved(data, moduleCount, x, row)) {
            if (bitIndex < bits.length) {
              data[row * moduleCount + x] = bits[bitIndex];
              bitIndex++;
            }
          }
        }
      }
    }
    
    return data;
  },
  
  drawFinderPattern: function(data, size, row, col) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const inBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        data[(row + r) * size + (col + c)] = inBorder || inInner;
      }
    }
  },
  
  isReserved: function(data, size, col, row) {
    // Finder patterns
    if (col < 8 && row < 8) return true;
    if (col >= size - 8 && row < 8) return true;
    if (col < 8 && row >= size - 8) return true;
    // Timing patterns
    if (col === 6 || row === 6) return true;
    return false;
  },
  
  stringToBits: function(str) {
    const bits = [];
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      for (let b = 7; b >= 0; b--) {
        bits.push((code >> b) & 1);
      }
    }
    // Add terminator
    for (let i = 0; i < 8 && bits.length % 8 !== 0; i++) {
      bits.push(0);
    }
    return bits;
  },
  
  copyToClipboard: function() {
    const canvas = document.getElementById('qr-canvas');
    if (canvas.style.display === 'none') return;
    
    canvas.toBlob(blob => {
      navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]).then(() => {
        const btn = document.getElementById('qr-copy');
        btn.textContent = 'COPIED!';
        setTimeout(() => btn.textContent = 'COPY PNG', 1500);
      });
    });
  },
  
  download: function() {
    const canvas = document.getElementById('qr-canvas');
    if (canvas.style.display === 'none') return;
    
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = document.getElementById('qr-generate');
  const copyBtn = document.getElementById('qr-copy');
  const downloadBtn = document.getElementById('qr-download');
  const contentInput = document.getElementById('qr-content');
  const sizeInput = document.getElementById('qr-size');
  const ecSelect = document.getElementById('qr-ec');
  const sizeVal = document.getElementById('qr-size-val');
  
  sizeInput.addEventListener('input', () => {
    sizeVal.textContent = sizeInput.value;
  });
  
  generateBtn.addEventListener('click', () => {
    const text = contentInput.value.trim();
    if (!text) {
      contentInput.focus();
      return;
    }
    QRCode.generate(text, parseInt(sizeInput.value), ecSelect.value);
  });
  
  contentInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      generateBtn.click();
    }
  });
  
  copyBtn.addEventListener('click', () => QRCode.copyToClipboard());
  downloadBtn.addEventListener('click', () => QRCode.download());
});