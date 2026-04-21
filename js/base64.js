// Base64 Encoder/Decoder

document.addEventListener('DOMContentLoaded', () => {
  const modeBtns = document.querySelectorAll('.mode-btn[data-mode]');
  const input = document.getElementById('base64-input');
  const output = document.getElementById('base64-output');
  const processBtn = document.getElementById('base64-process');
  const clearBtn = document.getElementById('base64-clear');
  const copyBtn = document.getElementById('base64-copy');
  const dropZone = document.getElementById('base64-drop-zone');
  const fileInput = document.getElementById('base64-file-input');
  const sizeInfo = document.getElementById('base64-size');
  
  let currentMode = 'encode';
  
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
    });
  });
  
  processBtn.addEventListener('click', () => {
    const text = input.value;
    if (!text) {
      input.focus();
      return;
    }
    
    try {
      if (currentMode === 'encode') {
        const encoded = btoa(unescape(encodeURIComponent(text)));
        output.textContent = encoded;
        sizeInfo.textContent = `Original: ${text.length} bytes | Encoded: ${encoded.length} bytes`;
        window.jctHistory?.save('base64', { mode: 'encode', input: text, output: encoded });
      } else {
        const decoded = decodeURIComponent(escape(atob(text)));
        output.textContent = decoded;
        sizeInfo.textContent = `Encoded: ${text.length} bytes | Decoded: ${decoded.length} bytes`;
        window.jctHistory?.save('base64', { mode: 'decode', input: text, output: decoded });
      }
    } catch (e) {
      output.textContent = 'ERROR: Invalid input for ' + currentMode + ' mode';
      sizeInfo.textContent = '—';
    }
  });
  
  clearBtn.addEventListener('click', () => {
    input.value = '';
    output.textContent = '';
    sizeInfo.textContent = '—';
  });
  
  copyBtn.addEventListener('click', () => {
    if (output.textContent) {
      copyToClipboard(output.textContent, copyBtn);
    }
  });
  
  dropZone.addEventListener('click', () => fileInput.click());
  
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });
  
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  });
  
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) processImage(file);
  });
  
  function processImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      input.value = base64;
      sizeInfo.textContent = `${file.name} (${formatBytes(file.size)}) → Base64: ${formatBytes(base64.length)}`;
      output.textContent = base64;
    };
    reader.readAsDataURL(file);
  }
  
  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
});