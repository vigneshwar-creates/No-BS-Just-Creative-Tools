// Favicon Generator

let sourceImage = null;

document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('favicon-drop-zone');
  const fileInput = document.getElementById('favicon-file-input');
  const generateBtn = document.getElementById('favicon-generate');
  const downloadBtn = document.getElementById('favicon-download');
  const previewDiv = document.getElementById('favicon-preview');
  const emptyDiv = document.getElementById('favicon-empty');
  const sizeCheckboxes = document.querySelectorAll('input[type="checkbox"][value]');
  
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', (e) => { if (e.target.files[0]) loadImage(e.target.files[0]); });
  
  generateBtn.addEventListener('click', generateFavicons);
  downloadBtn.addEventListener('click', downloadFavicons);
  
  function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        sourceImage = img;
        generateFavicons();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
  
  function generateFavicons() {
    if (!sourceImage) return;
    
    const sizes = Array.from(sizeCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => parseInt(cb.value));
    
    previewDiv.innerHTML = '';
    
    sizes.forEach(size => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(sourceImage, 0, 0, size, size);
      
      const wrapper = document.createElement('div');
      wrapper.style.textAlign = 'center';
      
      const imgEl = document.createElement('img');
      imgEl.src = canvas.toDataURL('image/png');
      imgEl.style.width = size <= 64 ? '32px' : '48px';
      imgEl.style.height = size <= 64 ? '32px' : '48px';
      imgEl.style.border = '1px solid #333';
      imgEl.style.display = 'block';
      imgEl.style.margin = '0 auto 8px';
      
      const label = document.createElement('div');
      label.style.fontSize = '0.55rem';
      label.style.color = 'var(--text-muted)';
      label.textContent = `${size}×${size}`;
      
      wrapper.appendChild(imgEl);
      wrapper.appendChild(label);
      previewDiv.appendChild(wrapper);
    });
    
    emptyDiv.style.display = 'none';
    window.jctHistory?.save('favicon', { sizes });
  }
  
  async function downloadFavicons() {
    if (!sourceImage) return;
    
    const sizes = Array.from(sizeCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => parseInt(cb.value));
    
    const canvases = sizes.map(size => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(sourceImage, 0, 0, size, size);
      return { size, canvas };
    });
    
    const zip = await createZip(canvases);
    const link = document.createElement('a');
    link.download = 'favicons.zip';
    link.href = URL.createObjectURL(zip);
    link.click();
    URL.revokeObjectURL(link.href);
  }
  
  async function createZip(files) {
    const zip = new Blob(['PK' + String.fromCharCode(3,4) + ' favicons'], { type: 'application/zip' });
    
    const reader = new FileReader();
    const fileData = [];
    
    for (const { size, canvas } of files) {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const arrayBuffer = await blob.arrayBuffer();
      const baseName = size === 512 ? 'apple-touch-icon' : 
                       size === 192 ? 'android-chrome-192' : 
                       size === 512 ? 'android-chrome-512' : 
                       `favicon-${size}x${size}`;
      fileData.push({ name: `${baseName}.png`, data: arrayBuffer });
    }
    
    const dirHeader = createZipDir('favicon/');
    const fileHeaders = fileData.map(f => createZipFile(f.name, f.data));
    const allData = [dirHeader, ...fileHeaders].join('');
    
    const blob = new Blob([allData], { type: 'application/zip' });
    return blob;
  }
  
  function createZipDir(name) {
    const encoded = encodeURIComponent(name);
    const len = name.length;
    const header = 16 + len;
    return String.fromCharCode(0x50, 0x4b, 0x01, 0x02) +
           String.fromCharCode(0x14, 0x00, 0x00, 0x00, 0x08, 0x00) +
           String.fromCharCode(0, 0, 0, 0, 0, 0, 0, 0, 0, 0) +
           String.fromCharCode(len, 0, 0, 0) +
           String.fromCharCode(22, 0, 0, 0) +
           name +
           'favicon/' +
           String.fromCharCode(0x50, 0x4b, 0x03, 0x04) +
           String.fromCharCode(0x14, 0x00, 0x00, 0x00, 0x08, 0x00);
  }
  
  function createZipFile(name, data) {
    const crc = crc32(data);
    const len = data.byteLength;
    return String.fromCharCode(0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0, 0, 8, 0) +
           crc.toString(16).padStart(8, '0') +
           String.fromCharCode(len & 0xff, (len >> 8) & 0xff, (len >> 16) & 0xff, (len >> 24) & 0xff);
  }
  
  function crc32(data) {
    let crc = 0xffffffff;
    const table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    const bytes = new Uint8Array(data);
    for (let i = 0; i < bytes.length; i++) {
      crc = table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return crc ^ 0xffffffff;
  }
});