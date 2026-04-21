(function() {
  'use strict';

  let originalImage = null;

  document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('blur-drop-zone');
    const fileInput = document.getElementById('blur-file-input');
    const infoDiv = document.getElementById('blur-info');
    const canvas = document.getElementById('blur-canvas');
    const emptyDiv = document.getElementById('blur-empty');
    const downloadBtn = document.getElementById('blur-download');
    const blurSlider = document.getElementById('blur-slider');
    const blurVal = document.getElementById('blur-val');
    const previewImg = document.getElementById('blur-preview');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => { if (e.target.files[0]) loadImage(e.target.files[0]); });

    blurSlider.addEventListener('input', updatePreview);
    downloadBtn.addEventListener('click', downloadImage);

    function loadImage(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          originalImage = img;
          previewImg.src = img.src;
          document.getElementById('blur-orig-size').textContent = `${img.width} × ${img.height}px`;
          infoDiv.classList.remove('hidden');
          previewImg.style.display = 'block';
          canvas.style.display = 'none';
          emptyDiv.style.display = 'none';
          blurSlider.value = 0;
          blurVal.textContent = '0';
          updatePreview();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function updatePreview() {
      if (!originalImage) return;

      const blur = parseInt(blurSlider.value);
      blurVal.textContent = blur;
      previewImg.style.filter = `blur(${blur}px)`;
    }

    function downloadImage() {
      if (!originalImage) return;

      const blur = parseInt(blurSlider.value);

      canvas.width = originalImage.width;
      canvas.height = originalImage.height;

      const ctx = canvas.getContext('2d');
      ctx.filter = `blur(${blur}px)`;
      ctx.drawImage(originalImage, 0, 0);
      ctx.filter = 'none';

      canvas.style.display = 'block';
      emptyDiv.style.display = 'none';
      previewImg.style.display = 'none';

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'blurred.png';
      link.href = dataUrl;
      link.click();

      window.jctHistory?.save('blur', { amount: blur });
    }
  });
})();