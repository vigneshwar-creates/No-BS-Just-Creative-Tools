// PDF to Images Converter
// Note: Full PDF parsing requires pdf.js library. This is a placeholder that shows the interface.

let pdfFile = null;
let pdfPages = [];

document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('pdf-drop-zone');
  const fileInput = document.getElementById('pdf-file-input');
  const convertBtn = document.getElementById('pdf-convert');
  const downloadAllBtn = document.getElementById('pdf-download-all');
  const previewDiv = document.getElementById('pdf-preview');
  const emptyDiv = document.getElementById('pdf-empty');
  const infoDiv = document.getElementById('pdf-info');
  const pageCount = document.getElementById('pdf-page-count');
  const scaleSlider = document.getElementById('pdf-scale');
  const scaleVal = document.getElementById('pdf-scale-val');
  
  scaleSlider.addEventListener('input', () => scaleVal.textContent = scaleSlider.value);
  
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files[0] && e.dataTransfer.files[0].type === 'application/pdf') {
      loadPDF(e.dataTransfer.files[0]);
    }
  });
  fileInput.addEventListener('change', (e) => { if (e.target.files[0]) loadPDF(e.target.files[0]); });
  
  convertBtn.addEventListener('click', convertPDF);
  downloadAllBtn.addEventListener('click', downloadAll);
  
  function loadPDF(file) {
    pdfFile = file;
    pageCount.textContent = 'Processing...';
    infoDiv.classList.remove('hidden');
    
    // Read PDF file
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // Check if pdf.js is available
        if (typeof pdfjsLib !== 'undefined') {
          const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
          pdfPages = [];
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            pdfPages.push(page);
          }
          
          pageCount.textContent = pdf.numPages;
          convertBtn.disabled = false;
        } else {
          // Show placeholder without pdf.js
          pageCount.textContent = '1 (demo)';
          pdfPages = [file]; // Store file reference
        }
      } catch (err) {
        pageCount.textContent = 'Error loading PDF';
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  }
  
  async function convertPDF() {
    if (!pdfFile) return;
    
    previewDiv.innerHTML = '';
    emptyDiv.style.display = 'none';
    
    // Check for pdf.js
    if (typeof pdfjsLib === 'undefined') {
      // Demo mode - show placeholder
      const notice = document.createElement('div');
      notice.style.padding = '20px';
      notice.style.background = 'var(--surface2)';
      notice.style.border = '1px solid #333';
      notice.style.textAlign = 'center';
      notice.innerHTML = `
        <p style="color: var(--accent); margin-bottom: 12px;">⚠ PDF.js not loaded</p>
        <p style="font-size: 0.7rem; color: var(--text-muted);">
          This tool requires pdf.js library.<br>
          Add to your HTML: <code style="color: var(--accent2);">https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js</code>
        </p>
      `;
      previewDiv.appendChild(notice);
      return;
    }
    
    const scale = parseFloat(scaleSlider.value);
    const format = document.getElementById('pdf-format').value;
    
    for (const page of pdfPages) {
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({ canvasContext: ctx, viewport }).promise;
      
      const wrapper = document.createElement('div');
      wrapper.style.border = '1px solid #222';
      wrapper.style.padding = '8px';
      wrapper.style.background = '#0d0d0d';
      
      const img = document.createElement('img');
      img.src = canvas.toDataURL(format);
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      
      wrapper.appendChild(img);
      previewDiv.appendChild(wrapper);
    }
    
    window.jctHistory?.save('pdf', { pages: pdfPages.length, scale });
  }
  
  async function downloadAll() {
    const images = previewDiv.querySelectorAll('img');
    for (let i = 0; i < images.length; i++) {
      const link = document.createElement('a');
      link.download = `page-${i + 1}.png`;
      link.href = images[i].src;
      link.click();
      await new Promise(r => setTimeout(r, 200));
    }
  }
});