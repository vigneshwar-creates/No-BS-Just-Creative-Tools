(function() {
  'use strict';

  let originalImage = null;

  document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('steg-drop-zone');
    const fileInput = document.getElementById('steg-file-input');
    const infoDiv = document.getElementById('steg-info');
    const canvas = document.getElementById('steg-canvas');
    const emptyDiv = document.getElementById('steg-empty');
    const encodeBtn = document.getElementById('steg-encode-btn');
    const decodeBtn = document.getElementById('steg-decode-btn');
    const downloadBtn = document.getElementById('steg-download');
    const modeSelect = document.getElementById('steg-mode');
    const textInput = document.getElementById('steg-text');
    const resultDiv = document.getElementById('steg-result');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => { if (e.target.files[0]) loadImage(e.target.files[0]); });

    encodeBtn.addEventListener('click', encodeText);
    decodeBtn.addEventListener('click', decodeText);
    downloadBtn.addEventListener('click', downloadImage);

    function loadImage(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          originalImage = img;
          document.getElementById('steg-orig-size').textContent = `${img.width} × ${img.height}px`;
          infoDiv.classList.remove('hidden');
          displayOriginal();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function displayOriginal() {
      if (!originalImage) return;
      canvas.width = originalImage.width;
      canvas.height = originalImage.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(originalImage, 0, 0);
      canvas.style.display = 'block';
      emptyDiv.style.display = 'none';
    }

    function encodeText() {
      if (!originalImage) return;

      const text = textInput.value;
      if (!text) {
        resultDiv.textContent = 'Please enter text to encode';
        return;
      }
      if (text.length > 12) {
        resultDiv.textContent = 'Text too long (max 12 characters)';
        return;
      }

      canvas.width = originalImage.width;
      canvas.height = originalImage.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(originalImage, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      const binary = textToBinary(text);
      const bits = binary.split('');

      let bitIdx = 0;
      for (let i = 0; i < data.length && bitIdx < bits.length; i += 4) {
        if (bitIdx < bits.length) {
          data[i] = (data[i] & 0xFE) | parseInt(bits[bitIdx]);
          bitIdx++;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      resultDiv.textContent = 'Text encoded: ' + text;

      window.jctHistory?.save('steg-encode', { text });
    }

    function decodeText() {
      if (!originalImage) return;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(originalImage, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      let binary = '';
      for (let i = 0; i < data.length && binary.length < 96; i += 4) {
        binary += (data[i] & 1).toString();
      }

      const text = binaryToText(binary);
      resultDiv.textContent = 'Decoded: ' + text;

      window.jctHistory?.save('steg-decode', { text });
    }

    function textToBinary(text) {
      let binary = '';
      for (let i = 0; i < text.length; i++) {
        binary += text.charCodeAt(i).toString(2).padStart(8, '0');
      }
      return binary;
    }

    function binaryToText(binary) {
      let text = '';
      for (let i = 0; i < binary.length; i += 8) {
        const byte = binary.substr(i, 8);
        if (byte.length === 8) {
          text += String.fromCharCode(parseInt(byte, 2));
        }
      }
      return text.replace(/\0/g, '');
    }

    function downloadImage() {
      if (!canvas.width) return;
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'steganography.png';
      link.href = dataUrl;
      link.click();
    }
  });
})();