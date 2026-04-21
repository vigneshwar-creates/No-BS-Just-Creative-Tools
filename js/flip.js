(function() {
  'use strict';

  let originalImage = null;

  document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('flip-drop-zone');
    const fileInput = document.getElementById('flip-file-input');
    const infoDiv = document.getElementById('flip-info');
    const canvas = document.getElementById('flip-canvas');
    const emptyDiv = document.getElementById('flip-empty');
    const hFlipBtn = document.getElementById('flip-h-btn');
    const vFlipBtn = document.getElementById('flip-v-btn');
    const downloadBtn = document.getElementById('flip-download');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => { if (e.target.files[0]) loadImage(e.target.files[0]); });

    hFlipBtn.addEventListener('click', () => flipImage('horizontal'));
    vFlipBtn.addEventListener('click', () => flipImage('vertical'));
    downloadBtn.addEventListener('click', downloadImage);

    const previewImg = document.getElementById('flip-preview');
    
    function loadImage(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          originalImage = img;
          document.getElementById('flip-orig-size').textContent = `${img.width} × ${img.height}px`;
          infoDiv.classList.remove('hidden');
          previewImg.src = img.src;
          previewImg.style.display = 'block';
          canvas.style.display = 'none';
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function flipImage(direction) {
      if (!originalImage) return;

      canvas.width = originalImage.width;
      canvas.height = originalImage.height;

      const ctx = canvas.getContext('2d');

      if (direction === 'horizontal') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      } else if (direction === 'vertical') {
        ctx.translate(0, canvas.height);
        ctx.scale(1, -1);
      }

      ctx.drawImage(originalImage, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      if (direction === 'none') {
        previewImg.style.display = 'block';
        canvas.style.display = 'none';
      } else {
        previewImg.style.display = 'none';
        canvas.style.display = 'block';
      }

      hFlipBtn.classList.toggle('active', direction === 'horizontal');
      vFlipBtn.classList.toggle('active', direction === 'vertical');

      window.jctHistory?.save('flip', { direction });
    }

    function downloadImage() {
      if (!canvas.width) return;
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'flipped.png';
      link.href = dataUrl;
      link.click();
    }
  });
})();