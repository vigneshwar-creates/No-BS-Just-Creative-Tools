// QR Code Generator using qrcode-generator library

const QRCode = {
  generate: function(text, size = 256, ecLevel = 'M') {
    const canvas = document.getElementById('qr-canvas');
    const ctx = canvas.getContext('2d');
    
    // Use qrcode-generator library (typeNumber 0 = auto)
    const qr = qrcode(0, ecLevel);
    qr.addData(text);
    qr.make();
    
    const moduleCount = qr.getModuleCount();
    const moduleSize = Math.floor(size / moduleCount);
    const realSize = moduleSize * moduleCount;
    
    canvas.width = realSize;
    canvas.height = realSize;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, realSize, realSize);
    
    ctx.fillStyle = '#000000';
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
        }
      }
    }
    
    canvas.style.display = 'block';
    document.getElementById('qr-empty').style.display = 'none';
    
    window.jctHistory?.save('qrcode', { text, size, ecLevel });
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
  
  // Check if qrcode library loaded
  if (typeof qrcode === 'undefined') {
    generateBtn.disabled = true;
    generateBtn.textContent = 'LIBRARY ERROR';
    console.error('qrcode-generator library not loaded');
    return;
  }
  
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
