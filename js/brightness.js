(function() {
  'use strict';

  let originalImage = null;

  document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('brightness-drop-zone');
    const fileInput = document.getElementById('brightness-file-input');
    const infoDiv = document.getElementById('brightness-info');
    const canvas = document.getElementById('brightness-canvas');
    const emptyDiv = document.getElementById('brightness-empty');
    const downloadBtn = document.getElementById('brightness-download');
    const brightnessSlider = document.getElementById('brightness-slider');
    const contrastSlider = document.getElementById('contrast-slider');
    const brightnessVal = document.getElementById('brightness-val');
    const contrastVal = document.getElementById('contrast-val');
    const previewImg = document.getElementById('brightness-preview');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => { if (e.target.files[0]) loadImage(e.target.files[0]); });

    brightnessSlider.addEventListener('input', updatePreview);
    contrastSlider.addEventListener('input', updatePreview);
    downloadBtn.addEventListener('click', downloadImage);

    function loadImage(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          originalImage = img;
          previewImg.src = img.src;
          document.getElementById('brightness-orig-size').textContent = `${img.width} × ${img.height}px`;
          infoDiv.classList.remove('hidden');
          previewImg.style.display = 'block';
          canvas.style.display = 'none';
          emptyDiv.style.display = 'none';
          brightnessSlider.value = 0;
          contrastSlider.value = 0;
          brightnessVal.textContent = '0';
          contrastVal.textContent = '0';
          updatePreview();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function updatePreview() {
      if (!originalImage) return;

      const brightness = parseInt(brightnessSlider.value);
      const contrast = parseInt(contrastSlider.value);

      brightnessVal.textContent = brightness;
      contrastVal.textContent = contrast;

      const filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%)`;
      previewImg.style.filter = filter;
    }

    function downloadImage() {
      if (!originalImage) return;

      const brightness = parseInt(brightnessSlider.value);
      const contrast = parseInt(contrastSlider.value);

      canvas.width = originalImage.width;
      canvas.height = originalImage.height;

      const ctx = canvas.getContext('2d');
      ctx.filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%)`;
      ctx.drawImage(originalImage, 0, 0);
      ctx.filter = 'none';

      canvas.style.display = 'block';
      emptyDiv.style.display = 'none';
      previewImg.style.display = 'none';

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'brightness-adjusted.png';
      link.href = dataUrl;
      link.click();

      window.jctHistory?.save('brightness', { brightness, contrast });
    }
  });
})();