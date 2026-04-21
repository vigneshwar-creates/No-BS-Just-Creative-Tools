(function() {
  'use strict';

  let originalImage = null;

  document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('convert-drop-zone');
    const fileInput = document.getElementById('convert-file-input');
    const infoDiv = document.getElementById('convert-info');
    const canvas = document.getElementById('convert-canvas');
    const emptyDiv = document.getElementById('convert-empty');
    const convertBtn = document.getElementById('convert-btn');
    const downloadBtn = document.getElementById('convert-download');
    const formatSelect = document.getElementById('convert-format');
    const qualitySlider = document.getElementById('convert-quality');
    const qualityVal = document.getElementById('convert-quality-val');
    const qualityGroup = document.getElementById('convert-quality-group');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => { if (e.target.files[0]) loadImage(e.target.files[0]); });

    formatSelect.addEventListener('change', () => {
      qualityGroup.style.display = formatSelect.value === 'image/png' ? 'none' : 'flex';
    });

    qualitySlider.addEventListener('input', () => { qualityVal.textContent = qualitySlider.value; });
    convertBtn.addEventListener('click', convertImage);
    downloadBtn.addEventListener('click', downloadImage);

    function loadImage(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          originalImage = img;
          document.getElementById('convert-orig-size').textContent = `${img.width} × ${img.height}px`;
          infoDiv.classList.remove('hidden');
          convertImage();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function convertImage() {
      if (!originalImage) return;

      canvas.width = originalImage.width;
      canvas.height = originalImage.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(originalImage, 0, 0);

      canvas.style.display = 'block';
      emptyDiv.style.display = 'none';
      
      window.jctHistory?.save('convert', { originalWidth: originalImage.width, originalHeight: originalImage.height });
    }

    function downloadImage() {
      if (!canvas.width) return;

      const format = formatSelect.value;
      const quality = format === 'image/png' ? 1 : parseInt(qualitySlider.value) / 100;

      const ext = format.split('/')[1];
      const dataUrl = canvas.toDataURL(format, quality);

      const link = document.createElement('a');
      link.download = `converted.${ext}`;
      link.href = dataUrl;
      link.click();

      window.jctHistory?.save('convert', { format: ext, quality: parseInt(qualitySlider.value) });
    }
  });
})();