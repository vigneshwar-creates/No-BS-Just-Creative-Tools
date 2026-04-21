(function() {
  'use strict';

  let currentFile = null;

  document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('metadata-drop-zone');
    const fileInput = document.getElementById('metadata-file-input');
    const infoDiv = document.getElementById('metadata-info');
    const resultsDiv = document.getElementById('metadata-results');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => { if (e.target.files[0]) loadImage(e.target.files[0]); });

    function loadImage(file) {
      currentFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          document.getElementById('metadata-orig-size').textContent = `${img.width} × ${img.height}px`;
          infoDiv.classList.remove('hidden');
          extractMetadata(file, img);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function extractMetadata(file, img) {
      resultsDiv.innerHTML = '<p>Extracting metadata...</p>';

      EXIF.getData(img, function() {
        const allTags = EXIF.getAllTags(this);
        let html = '<div class="metadata-grid">';

        const basic = [
          { label: 'File Name', value: file.name },
          { label: 'File Size', value: formatBytes(file.size) },
          { label: 'Image Size', value: `${img.width} × ${img.height}px` },
          { label: 'File Type', value: file.type || 'Unknown' }
        ];

        basic.forEach(item => {
          html += `<div class="metadata-item"><strong>${item.label}:</strong> ${item.value}</div>`;
        });

        const exifFields = [
          { key: 'Make', label: 'Camera Make' },
          { key: 'Model', label: 'Camera Model' },
          { key: 'DateTimeOriginal', label: 'Date Taken' },
          { key: 'ExposureTime', label: 'Exposure' },
          { key: 'FNumber', label: 'F-Number' },
          { key: 'ISOSpeedRatings', label: 'ISO' },
          { key: 'FocalLength', label: 'Focal Length' },
          { key: 'Flash', label: 'Flash' },
          { key: 'WhiteBalance', label: 'White Balance' },
          { key: 'Orientation', label: 'Orientation' }
        ];

        let hasExif = false;
        exifFields.forEach(field => {
          if (allTags[field.key]) {
            hasExif = true;
            html += `<div class="metadata-item"><strong>${field.label}:</strong> ${allTags[field.key]}</div>`;
          }
        });

        const gpsKeys = ['GPSLatitude', 'GPSLongitude', 'GPSAltitude'];
        let hasGps = false;
        gpsKeys.forEach(key => {
          if (allTags[key]) {
            hasGps = true;
            html += `<div class="metadata-item"><strong>${key}:</strong> ${allTags[key]}</div>`;
          }
        });

        if (!hasExif && !hasGps) {
          html += '<div class="metadata-item">No EXIF data found</div>';
        }

        html += '</div>';
        resultsDiv.innerHTML = html;

        window.jctHistory?.save('metadata', { file: file.name });
      });
    }

    function formatBytes(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  });
})();