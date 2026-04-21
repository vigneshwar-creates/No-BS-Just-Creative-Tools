(function() {
  'use strict';

  let images = [];

  document.addEventListener('DOMContentLoaded', () => {
    const fileInputs = [
      document.getElementById('collage-file-input-1'),
      document.getElementById('collage-file-input-2'),
      document.getElementById('collage-file-input-3'),
      document.getElementById('collage-file-input-4')
    ];
    const dropZones = [
      document.getElementById('collage-drop-zone-1'),
      document.getElementById('collage-drop-zone-2'),
      document.getElementById('collage-drop-zone-3'),
      document.getElementById('collage-drop-zone-4')
    ];
    const canvas = document.getElementById('collage-canvas');
    const emptyDiv = document.getElementById('collage-empty');
    const createBtn = document.getElementById('collage-create-btn');
    const downloadBtn = document.getElementById('collage-download');
    const layoutSelect = document.getElementById('collage-layout');

    fileInputs.forEach((input, idx) => {
      const dropZone = dropZones[idx];
      dropZone.addEventListener('click', () => input.click());
      dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0], idx);
      });
      input.addEventListener('change', (e) => { if (e.target.files[0]) loadImage(e.target.files[0], idx); });
    });

    createBtn.addEventListener('click', createCollage);
    downloadBtn.addEventListener('click', downloadCollage);

    function loadImage(file, idx) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          images[idx] = img;
          const preview = document.getElementById('collage-preview-' + (idx + 1));
          if (preview) {
            preview.src = img.src;
            preview.style.display = 'block';
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function createCollage() {
      const validImages = images.filter(img => img != null);
      if (validImages.length === 0) return;

      const layout = layoutSelect.value;
      let cols, rows;

      if (layout === '2x2') {
        cols = 2;
        rows = 2;
      } else if (layout === 'horizontal') {
        cols = validImages.length;
        rows = 1;
      } else {
        cols = 1;
        rows = validImages.length;
      }

      let maxW = 0, maxH = 0;
      validImages.forEach(img => {
        if (img.width > maxW) maxW = img.width;
        if (img.height > maxH) maxH = img.height;
      });

      const cellW = maxW;
      const cellH = maxH;

      canvas.width = cellW * cols;
      canvas.height = cellH * rows;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let imgIdx = 0;
      for (let r = 0; r < rows && imgIdx < validImages.length; r++) {
        for (let c = 0; c < cols && imgIdx < validImages.length; c++) {
          const img = validImages[imgIdx];
          const x = c * cellW;
          const y = r * cellH;
          const scale = Math.min(cellW / img.width, cellH / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          const ox = x + (cellW - w) / 2;
          const oy = y + (cellH - h) / 2;
          ctx.drawImage(img, ox, oy, w, h);
          imgIdx++;
        }
      }

      canvas.style.display = 'block';
      emptyDiv.style.display = 'none';

      window.jctHistory?.save('collage', { images: validImages.length, layout });
    }

    function downloadCollage() {
      if (!canvas.width) return;
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'collage.png';
      link.href = dataUrl;
      link.click();
    }
  });
})();