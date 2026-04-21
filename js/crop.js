(function() {
  'use strict';

  let originalImage = null;

  document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('crop-drop-zone');
    const fileInput = document.getElementById('crop-file-input');
    const infoDiv = document.getElementById('crop-info');
    const canvas = document.getElementById('crop-canvas');
    const emptyDiv = document.getElementById('crop-empty');
    const cropBtn = document.getElementById('crop-btn');
    const downloadBtn = document.getElementById('crop-download');
    const widthInput = document.getElementById('crop-width');
    const heightInput = document.getElementById('crop-height');
    const previewCanvas = document.getElementById('crop-preview-canvas');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => { if (e.target.files[0]) loadImage(e.target.files[0]); });

    cropBtn.addEventListener('click', cropImage);
    downloadBtn.addEventListener('click', downloadImage);

    function loadImage(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          originalImage = img;
          document.getElementById('crop-orig-size').textContent = `${img.width} × ${img.height}px`;
          infoDiv.classList.remove('hidden');
          widthInput.value = img.width;
          heightInput.value = img.height;
          updatePreview();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function updatePreview() {
      if (!originalImage) return;

      const previewCanvas = document.getElementById('crop-preview-canvas');
      const w = parseInt(widthInput.value) || originalImage.width;
      const h = parseInt(heightInput.value) || originalImage.height;

      previewCanvas.width = w;
      previewCanvas.height = h;
      previewCanvas.style.width = w + 'px';
      previewCanvas.style.height = h + 'px';

      const ctx = previewCanvas.getContext('2d');
      const srcX = Math.max(0, Math.floor((originalImage.width - w) / 2));
      const srcY = Math.max(0, Math.floor((originalImage.height - h) / 2));

      ctx.drawImage(originalImage, srcX, srcY, w, h, 0, 0, w, h);
      previewCanvas.style.display = 'block';
    }

    function cropImage() {
      if (!originalImage) return;

      const w = parseInt(widthInput.value) || originalImage.width;
      const h = parseInt(heightInput.value) || originalImage.height;

      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      const srcX = Math.max(0, Math.floor((originalImage.width - w) / 2));
      const srcY = Math.max(0, Math.floor((originalImage.height - h) / 2));

      ctx.drawImage(originalImage, srcX, srcY, w, h, 0, 0, w, h);

      canvas.style.display = 'block';
      emptyDiv.style.display = 'none';

      window.jctHistory?.save('crop', { width: w, height: h });
    }

    function downloadImage() {
      if (!canvas.width) return;
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'cropped.png';
      link.href = dataUrl;
      link.click();
    }
  });
})();