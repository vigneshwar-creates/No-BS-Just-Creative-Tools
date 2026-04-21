// Image Resizer/Compressor

let originalImage = null;
let originalWidth = 0;
let originalHeight = 0;

document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('resize-drop-zone');
  const fileInput = document.getElementById('resize-file-input');
  const infoDiv = document.getElementById('resize-info');
  const canvas = document.getElementById('resize-canvas');
  const emptyDiv = document.getElementById('resize-empty');
  const processBtn = document.getElementById('resize-process');
  const downloadBtn = document.getElementById('resize-download');
  
  const dimBtn = document.getElementById('resize-dim-btn');
  const scaleBtn = document.getElementById('resize-scale-btn');
  const maxBtn = document.getElementById('resize-max-btn');
  const dimControls = document.getElementById('resize-dim-controls');
  const scaleControls = document.getElementById('resize-scale-controls');
  const maxControls = document.getElementById('resize-max-controls');
  
  const widthInput = document.getElementById('resize-width');
  const heightInput = document.getElementById('resize-height');
  const aspectCheck = document.getElementById('resize-aspect');
  const scaleInput = document.getElementById('resize-scale');
  const maxInput = document.getElementById('resize-max');
  const qualityInput = document.getElementById('resize-quality');
  const formatSelect = document.getElementById('resize-format');
  
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', (e) => { if (e.target.files[0]) loadImage(e.target.files[0]); });
  
  const modeBtns = [dimBtn, scaleBtn, maxBtn];
  const modeControls = [dimControls, scaleControls, maxControls];
  
  modeBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      modeControls.forEach(c => c.classList.add('hidden'));
      btn.classList.remove('active') || true;
      btn.classList.add('active');
      modeControls[idx].classList.remove('hidden');
    });
  });
  
  widthInput.addEventListener('change', () => {
    if (aspectCheck.checked && originalWidth && originalHeight) {
      const ratio = originalHeight / originalWidth;
      heightInput.value = Math.round(widthInput.value * ratio);
    }
  });
  heightInput.addEventListener('change', () => {
    if (aspectCheck.checked && originalWidth && originalHeight) {
      const ratio = originalWidth / originalHeight;
      widthInput.value = Math.round(heightInput.value * ratio);
    }
  });
  
  ['resize-scale', 'resize-max', 'resize-quality'].forEach(id => {
    const el = document.getElementById(id);
    const val = document.getElementById(id + '-val');
    if (el && val) el.addEventListener('input', () => val.textContent = el.value);
  });
  
  formatSelect.addEventListener('change', () => {
    const qualityGroup = document.getElementById('resize-quality-group');
    qualityGroup.style.display = formatSelect.value === 'image/png' ? 'none' : 'flex';
  });
  
  processBtn.addEventListener('click', processImage);
  downloadBtn.addEventListener('click', downloadImage);
  
  function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        originalImage = img;
        originalWidth = img.width;
        originalHeight = img.height;
        document.getElementById('resize-orig-size').textContent = formatBytes(file.size);
        document.getElementById('resize-orig-dims').textContent = `${img.width} × ${img.height}px`;
        infoDiv.classList.remove('hidden');
        widthInput.value = img.width;
        heightInput.value = img.height;
        processImage();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
  
  function processImage() {
    if (!originalImage) return;
    
    let newWidth, newHeight;
    const mode = document.querySelector('.mode-btn[data-mode].active')?.dataset.mode || 'dimensions';
    
    if (mode === 'dimensions') {
      newWidth = parseInt(widthInput.value) || originalWidth;
      newHeight = parseInt(heightInput.value) || originalHeight;
    } else if (mode === 'scale') {
      const scale = parseInt(scaleInput.value) / 100;
      newWidth = Math.round(originalWidth * scale);
      newHeight = Math.round(originalHeight * scale);
    } else {
      const maxW = parseInt(maxInput.value);
      if (originalWidth > maxW) {
        const ratio = maxW / originalWidth;
        newWidth = maxW;
        newHeight = Math.round(originalHeight * ratio);
      } else {
        newWidth = originalWidth;
        newHeight = originalHeight;
      }
    }
    
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);
    
    canvas.style.display = 'block';
    emptyDiv.style.display = 'none';
  }
  
  function downloadImage() {
    if (!canvas.width) return;
    
    const format = formatSelect.value;
    const quality = format === 'image/png' ? 1 : parseInt(qualityInput.value) / 100;
    const mimeType = formatSelect.value;
    
    const ext = mimeType.split('/')[1];
    const dataUrl = canvas.toDataURL(mimeType, quality);
    
    const link = document.createElement('a');
    link.download = `resized.${ext}`;
    link.href = dataUrl;
    link.click();
    
    window.jctHistory?.save('resize', { 
      original: `${originalWidth}x${originalHeight}`, 
      new: `${canvas.width}x${canvas.height}`,
      format: ext 
    });
  }
  
  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
});