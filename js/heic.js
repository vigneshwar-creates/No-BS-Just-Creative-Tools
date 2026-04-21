(function() {
  'use strict';

  let originalImage = null;

  document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('heic-drop-zone');
    const fileInput = document.getElementById('heic-file-input');
    const infoDiv = document.getElementById('heic-info');
    const canvas = document.getElementById('heic-canvas');
    const emptyDiv = document.getElementById('heic-empty');
    const convertBtn = document.getElementById('heic-convert-btn');
    const downloadBtn = document.getElementById('heic-download');
    const formatSelect = document.getElementById('heic-format');
    const errorDiv = document.getElementById('heic-error');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) loadHEIC(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => { if (e.target.files[0]) loadHEIC(e.target.files[0]); });

    convertBtn.addEventListener('click', convertImage);
    downloadBtn.addEventListener('click', downloadImage);

    function loadHEIC(file) {
      errorDiv.textContent = '';

      if (!file.name.toLowerCase().endsWith('.heic')) {
        errorDiv.textContent = 'Please select a HEIC file';
        return;
      }

      if (typeof heic2any === 'undefined') {
        errorDiv.textContent = 'HEIC library not loaded';
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        heic2any({
          blob: new Blob([e.target.result], { type: 'image/heic' }),
          toType: 'image/png',
          quality: 1
        }).then((blob) => {
          const img = new Image();
          img.onload = () => {
            originalImage = img;
            document.getElementById('heic-orig-size').textContent = `${img.width} × ${img.height}px`;
            infoDiv.classList.remove('hidden');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.style.display = 'block';
            emptyDiv.style.display = 'none';
          };
          img.src = URL.createObjectURL(blob);
        }).catch(err => {
          errorDiv.textContent = 'Conversion failed: ' + err.message;
        });
      };
      reader.readAsArrayBuffer(file);
    }

    function convertImage() {
      if (!originalImage) return;

      canvas.width = originalImage.width;
      canvas.height = originalImage.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(originalImage, 0, 0);
    }

    function downloadImage() {
      if (!canvas.width) return;

      const format = formatSelect.value;
      const ext = format.split('/')[1];
      const dataUrl = canvas.toDataURL(format, 1);

      const link = document.createElement('a');
      link.download = `converted.${ext}`;
      link.href = dataUrl;
      link.click();

      window.jctHistory?.save('heic', { format: ext });
    }
  });
})();