(function() {
  'use strict';

  let currentFile = null;

  const PNG_SIGNATURE = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  const JPG_SIGNATURE = [0xFF, 0xD8, 0xFF];
  const GIF_SIGNATURE = [0x47, 0x49, 0x46];

  document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('validate-drop-zone');
    const fileInput = document.getElementById('validate-file-input');
    const resultsDiv = document.getElementById('validate-results');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) validateFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => { if (e.target.files[0]) validateFile(e.target.files[0]); });

    function validateFile(file) {
      currentFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        const array = new Uint8Array(e.target.result);
        validateImage(array, file);
      };
      reader.readAsArrayBuffer(file.slice(0, 12));
    }

    function validateImage(array, file) {
      let html = '<div class="validate-grid">';
      html += `<div class="validate-item"><strong>File Name:</strong> ${file.name}</div>`;
      html += `<div class="validate-item"><strong>File Size:</strong> ${formatBytes(file.size)}</div>`;

      const signature = Array.from(array.slice(0, 8));
      let format = 'Unknown';
      let valid = false;

      if (arraysEqual(signature.slice(0, 8), PNG_SIGNATURE)) {
        format = 'PNG';
        valid = true;
      } else if (arraysEqual(signature.slice(0, 3), JPG_SIGNATURE)) {
        format = 'JPEG';
        valid = true;
      } else if (arraysEqual(signature.slice(0, 3), GIF_SIGNATURE)) {
        format = 'GIF';
        valid = true;
      } else if (file.name.toLowerCase().endsWith('.webp')) {
        format = 'WebP';
        valid = true;
      }

      html += `<div class="validate-item"><strong>Format:</strong> ${format}</div>`;
      html += `<div class="validate-item"><strong>Signature:</strong> ${valid ? 'Valid' : 'Invalid'}</div>`;

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          html += `<div class="validate-item"><strong>Dimensions:</strong> ${img.width} × ${img.height}px</div>`;
          html += `<div class="validate-item"><strong>Status:</strong> <span class="status-${valid ? 'valid' : 'invalid'}">${valid ? 'VALID' : 'INVALID'}</span></div>`;
          html += '</div>';
          resultsDiv.innerHTML = html;

          window.jctHistory?.save('validate', { file: file.name, valid, format });
        };
        img.onerror = () => {
          html += `<div class="validate-item"><strong>Dimensions:</strong> Could not load</div>`;
          html += `<div class="validate-item"><strong>Status:</strong> <span class="status-invalid">INVALID</span></div>`;
          html += '</div>';
          resultsDiv.innerHTML = html;
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function arraysEqual(a, b) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    }

    function formatBytes(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  });
})();