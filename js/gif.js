// GIF Maker - Simple frame-based GIF creator

const GIFEncoder = (() => {
  function encode(width, height, frames, delay) {
    const pixels = [];
    const disposal = [];
    
    for (const frame of frames) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      let img = frame;
      if (typeof frame === 'string') {
        img = new Image();
        img.src = frame;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      const data = ctx.getImageData(0, 0, width, height).data;
      pixels.push(data);
      disposal.push(2);
    }
    
    const colors = buildColorTable(pixels);
    const indexed = indexPixels(pixels, colors);
    
    let output = buildGIF(width, height, frames.length, delay, colors, indexed, disposal);
    return new Blob([output], { type: 'image/gif' });
  }
  
  function buildColorTable(pixels) {
    const colorMap = new Map();
    const table = [];
    
    for (const data of pixels) {
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const key = (r << 16) | (g << 8) | b;
        if (!colorMap.has(key) && table.length < 256) {
          colorMap.set(key, true);
          table.push([r, g, b]);
        }
      }
    }
    
    while (table.length < 256) {
      table.push([0, 0, 0]);
    }
    return table;
  }
  
  function indexPixels(pixels, colors) {
    const indexed = [];
    const colorMap = new Map();
    colors.forEach((c, i) => colorMap.set(c[0] << 16 | c[1] << 8 | c[2], i));
    
    for (const data of pixels) {
      const frameData = [];
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const key = (r << 16) | (g << 8) | b;
        frameData.push(colorMap.has(key) ? colorMap.get(key) : 0);
      }
      indexed.push(frameData);
    }
    return indexed;
  }
  
  function buildGIF(width, height, frameCount, delay, colors, indexed, disposal) {
    const chunks = [];
    
    // Header
    chunks.push(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])); // GIF89a
    
    // Logical Screen Descriptor
    chunks.push(new Uint8Array([
      width & 0xFF, (width >> 8) & 0xFF,
      height & 0xFF, (height >> 8) & 0xFF,
      0xF7, // Global color table flag, color resolution, sorted flag, size
      0x00, // Background color index
      0x00  // Pixel aspect ratio
    ]));
    
    // Global Color Table
    const colorTable = new Uint8Array(256 * 3);
    colors.forEach((c, i) => {
      colorTable[i * 3] = c[0];
      colorTable[i * 3 + 1] = c[1];
      colorTable[i * 3 + 2] = c[2];
    });
    chunks.push(colorTable);
    
    // NETSCAPE Extension for looping
    chunks.push(new Uint8Array([0x21, 0xFF, 0x0B, 0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2E, 0x30, 0x03, 0x01, 0x00, 0x00, 0x00]));
    
    // Frames
    for (let f = 0; f < frameCount; f++) {
      // Graphic Control Extension
      chunks.push(new Uint8Array([0x21, 0xF9, 0x04, 0x00, (delay / 10) & 0xFF, ((delay / 10) >> 8) & 0xFF, 0x00, 0x00]));
      
      // Image Descriptor
      chunks.push(new Uint8Array([0x2C, 0x00, 0x00, 0x00, 0x00, width & 0xFF, (width >> 8) & 0xFF, height & 0xFF, (height >> 8) & 0xFF, 0x00]));
      
      // Local Color Table (use same as global)
      // Image Data (LZW minimum code size)
      const minCodeSize = 8;
      const lzwData = lzwEncode(indexed[f], minCodeSize);
      const subBlocks = splitIntoSubBlocks(lzwData);
      chunks.push(new Uint8Array([minCodeSize]));
      chunks.push(subBlocks);
    }
    
    // Trailer
    chunks.push(new Uint8Array([0x3B]));
    
    // Combine all chunks
    const totalLen = chunks.reduce((a, b) => a + b.length, 0);
    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }
  
  function lzwEncode(pixels, minCodeSize) {
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;
    let codeSize = minCodeSize + 1;
    let nextCode = eoiCode + 1;
    
    const dictionary = new Map();
    for (let i = 0; i < clearCode; i++) {
      dictionary.set(String(i), i);
    }
    
    const output = [];
    let buffer = 0, bufferLen = 0;
    
    const emit = (code) => {
      buffer |= code << bufferLen;
      bufferLen += codeSize;
      while (bufferLen >= 8) {
        output.push(buffer & 0xFF);
        buffer >>= 8;
        bufferLen -= 8;
      }
    };
    
    emit(clearCode);
    
    let current = '';
    for (const pixel of pixels) {
      const pixelStr = String(pixel);
      const combined = current ? current + ',' + pixelStr : pixelStr;
      
      if (dictionary.has(combined)) {
        current = combined;
      } else {
        emit(dictionary.get(current));
        
        if (nextCode < 4096) {
          dictionary.set(combined, nextCode++);
          if (nextCode > (1 << codeSize) && codeSize < 12) {
            codeSize++;
          }
        }
        current = pixelStr;
      }
    }
    
    if (current) {
      emit(dictionary.get(current));
    }
    emit(eoiCode);
    
    if (bufferLen > 0) {
      output.push(buffer & 0xFF);
    }
    
    return output;
  }
  
  function splitIntoSubBlocks(data) {
    const blocks = [];
    for (let i = 0; i < data.length; i += 255) {
      const chunk = data.slice(i, i + 255);
      blocks.push(new Uint8Array([chunk.length, ...chunk]));
    }
    return new Uint8Array(blocks.flat());
  }
  
  return { encode };
})();

let frameImages = [];

document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('gif-drop-zone');
  const fileInput = document.getElementById('gif-file-input');
  const delaySlider = document.getElementById('gif-delay');
  const delayVal = document.getElementById('gif-delay-val');
  const sizeSelect = document.getElementById('gif-size');
  const generateBtn = document.getElementById('gif-generate');
  const downloadBtn = document.getElementById('gif-download');
  const clearBtn = document.getElementById('gif-clear');
  const framesPreview = document.getElementById('gif-frames-preview');
  const previewImg = document.getElementById('gif-preview-img');
  const emptyDiv = document.getElementById('gif-empty');
  
  let generatedGif = null;
  
  delaySlider.addEventListener('input', () => delayVal.textContent = delaySlider.value);
  
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
  
  generateBtn.addEventListener('click', generateGif);
  downloadBtn.addEventListener('click', downloadGif);
  clearBtn.addEventListener('click', clearFrames);
  
  function handleFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          frameImages.push(img);
          updateFramesPreview();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
  
  function updateFramesPreview() {
    framesPreview.innerHTML = '';
    frameImages.forEach((img, i) => {
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.flexShrink = '0';
      
      const thumb = document.createElement('img');
      thumb.src = img.src;
      thumb.style.width = '60px';
      thumb.style.height = '60px';
      thumb.style.objectFit = 'cover';
      thumb.style.border = '1px solid #333';
      
      const num = document.createElement('div');
      num.style.position = 'absolute';
      num.style.bottom = '2px';
      num.style.right = '2px';
      num.style.background = 'rgba(0,0,0,0.7)';
      num.style.color = '#fff';
      num.style.fontSize = '0.5rem';
      num.style.padding = '1px 4px';
      num.textContent = i + 1;
      
      const remove = document.createElement('button');
      remove.textContent = '×';
      remove.style.position = 'absolute';
      remove.style.top = '2px';
      remove.style.right = '2px';
      remove.style.background = 'rgba(255,0,0,0.7)';
      remove.style.border = 'none';
      remove.style.color = '#fff';
      remove.style.cursor = 'pointer';
      remove.style.width = '16px';
      remove.style.height = '16px';
      remove.style.fontSize = '0.6rem';
      remove.onclick = () => { frameImages.splice(i, 1); updateFramesPreview(); };
      
      wrapper.appendChild(thumb);
      wrapper.appendChild(num);
      wrapper.appendChild(remove);
      framesPreview.appendChild(wrapper);
    });
  }
  
  function generateGif() {
    if (frameImages.length < 2) {
      alert('Please add at least 2 frames');
      return;
    }
    
    let width, height;
    const size = sizeSelect.value;
    
    if (size === 'original') {
      width = frameImages[0].width;
      height = frameImages[0].height;
    } else {
      const targetW = parseInt(size);
      const ratio = frameImages[0].height / frameImages[0].width;
      width = targetW;
      height = Math.round(targetW * ratio);
    }
    
    const frames = frameImages.map(img => img.src);
    const delay = parseInt(delaySlider.value);
    
    try {
      generatedGif = GIFEncoder.encode(width, height, frames, delay);
      const url = URL.createObjectURL(generatedGif);
      previewImg.src = url;
      previewImg.style.display = 'block';
      emptyDiv.style.display = 'none';
      window.jctHistory?.save('gif', { frames: frameImages.length, width, height, delay });
    } catch (e) {
      console.error(e);
      alert('Error creating GIF');
    }
  }
  
  function downloadGif() {
    if (!generatedGif) return;
    const link = document.createElement('a');
    link.download = 'animation.gif';
    link.href = URL.createObjectURL(generatedGif);
    link.click();
  }
  
  function clearFrames() {
    frameImages = [];
    generatedGif = null;
    previewImg.style.display = 'none';
    emptyDiv.style.display = 'block';
    updateFramesPreview();
  }
});