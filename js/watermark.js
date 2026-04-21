(function() {
  'use strict';

  let originalImage = null;

  document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('watermark-drop-zone');
    const fileInput = document.getElementById('watermark-file-input');
    const infoDiv = document.getElementById('watermark-info');
    const canvas = document.getElementById('watermark-canvas');
    const emptyDiv = document.getElementById('watermark-empty');
    const previewCanvas = document.getElementById('watermark-canvas');
    const applyBtn = document.getElementById('watermark-apply-btn');
    const downloadBtn = document.getElementById('watermark-download');
    const textInput = document.getElementById('watermark-text');
    const positionSelect = document.getElementById('watermark-position');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => { if (e.target.files[0]) loadImage(e.target.files[0]); });

    textInput.addEventListener('input', updatePreview);
    positionSelect.addEventListener('change', updatePreview);
    applyBtn.addEventListener('click', applyWatermark);
    downloadBtn.addEventListener('click', downloadImage);

    function loadImage(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          originalImage = img;
          document.getElementById('watermark-orig-size').textContent = `${img.width} × ${img.height}px`;
          infoDiv.classList.remove('hidden');
          updatePreview();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function updatePreview() {
      if (!originalImage) return;

      canvas.width = originalImage.width;
      canvas.height = originalImage.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(originalImage, 0, 0);
      canvas.style.display = 'block';
      emptyDiv.style.display = 'none';

      const text = textInput.value.slice(0, 12);
      if (!text) return;

      const fontSize = Math.max(16, Math.floor(canvas.height / 20));
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.lineWidth = Math.max(2, fontSize / 8);

      const pos = positionSelect.value;
      const margin = fontSize;
      let x, y;

      if (pos.includes('left')) x = margin;
      else if (pos.includes('center')) x = canvas.width / 2;
      else x = canvas.width - margin;

      if (pos.includes('top')) y = margin + fontSize;
      else if (pos.includes('center')) y = canvas.height / 2 + fontSize / 3;
      else y = canvas.height - margin;

      ctx.textAlign = pos.includes('left') ? 'left' : pos.includes('right') ? 'right' : 'center';
      ctx.textBaseline = 'top';
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    }

    function applyWatermark() {
      updatePreview();
      window.jctHistory?.save('watermark', { text: textInput.value });
    }

    function downloadImage() {
      if (!canvas.width) return;
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'watermarked.png';
      link.href = dataUrl;
      link.click();
    }
  });
})();