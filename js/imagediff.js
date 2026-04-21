(function() {
  'use strict';

  let image1 = null;
  let image2 = null;
  let img1Data = null;
  let img2Data = null;

  document.addEventListener('DOMContentLoaded', () => {
    const dropZone1 = document.getElementById('diff-drop-zone-1');
    const dropZone2 = document.getElementById('diff-drop-zone-2');
    const fileInput1 = document.getElementById('diff-file-input-1');
    const fileInput2 = document.getElementById('diff-file-input-2');
    const canvas = document.getElementById('diff-canvas');
    const emptyDiv = document.getElementById('diff-empty');
    const compareBtn = document.getElementById('diff-compare-btn');
    const downloadBtn = document.getElementById('diff-download');
    const diffInfo = document.getElementById('diff-info');

    dropZone1.addEventListener('click', () => fileInput1.click());
    dropZone2.addEventListener('click', () => fileInput2.click());

    [dropZone1, dropZone2].forEach((dz, idx) => {
      const input = idx === 0 ? fileInput1 : fileInput2;
      dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dragover'); });
      dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
      dz.addEventListener('drop', (e) => {
        e.preventDefault();
        dz.classList.remove('dragover');
        if (e.dataTransfer.files[0]) {
          if (idx === 0) loadImage(e.dataTransfer.files[0], 1);
          else loadImage(e.dataTransfer.files[0], 2);
        }
      });
      input.addEventListener('change', (e) => {
        if (e.target.files[0]) {
          if (idx === 0) loadImage(e.target.files[0], 1);
          else loadImage(e.target.files[0], 2);
        }
      });
    });

    compareBtn.addEventListener('click', compareImages);
    downloadBtn.addEventListener('click', downloadImage);

    function loadImage(file, num) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          if (num === 1) {
            image1 = img;
            img1Data = null;
            document.getElementById('diff-img1-size').textContent = `${img.width} × ${img.height}px`;
          } else {
            image2 = img;
            img2Data = null;
            document.getElementById('diff-img2-size').textContent = `${img.width} × ${img.height}px`;
          }
          if (image1 && image2) {
            compareImages();
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function compareImages() {
      if (!image1 || !image2) return;

      const w = Math.max(image1.width, image2.width);
      const h = Math.max(image1.height, image2.height);

      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);

      const c1 = document.createElement('canvas');
      c1.width = w;
      c1.height = h;
      const cx1 = c1.getContext('2d');
      cx1.drawImage(image1, 0, 0);

      const c2 = document.createElement('canvas');
      c2.width = w;
      c2.height = h;
      const cx2 = c2.getContext('2d');
      cx2.drawImage(image2, 0, 0);

      const d1 = cx1.getImageData(0, 0, w, h);
      const d2 = cx2.getImageData(0, 0, w, h);

      const result = ctx.createImageData(w, h);
      const data = result.data;

      let diffCount = 0;
      for (let i = 0; i < d1.data.length; i += 4) {
        const r1 = d1.data[i], g1 = d1.data[i+1], b1 = d1.data[i+2];
        const r2 = d2.data[i], g2 = d2.data[i+1], b2 = d2.data[i+2];

        const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);

        if (diff > 30) {
          data[i] = 255;
          data[i+1] = 0;
          data[i+2] = 0;
          data[i+3] = 255;
          diffCount++;
        } else {
          data[i] = 128;
          data[i+1] = 128;
          data[i+2] = 128;
          data[i+3] = 128;
        }
      }

      ctx.putImageData(result, 0, 0);

      canvas.style.display = 'block';
      emptyDiv.style.display = 'none';

      const totalPixels = w * h;
      const diffPercent = ((diffCount / totalPixels) * 100).toFixed(1);
      diffInfo.textContent = `Differences: ${diffCount} pixels (${diffPercent}%)`;

      window.jctHistory?.save('imagediff', { pixels: diffCount, percent: diffPercent });
    }

    function downloadImage() {
      if (!canvas.width) return;
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'diff.png';
      link.href = dataUrl;
      link.click();
    }
  });
})();