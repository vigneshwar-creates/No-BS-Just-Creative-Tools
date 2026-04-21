// SVG Wave Generator Logic

class WaveGenerator {
  constructor() {
    this.preview = document.getElementById('wavePreview');
    this.svgOutput = document.getElementById('svgOutput');
    this.copyBtn = document.getElementById('copySvg');
    this.generateBtn = document.getElementById('generateBtn');
    this.downloadSvgBtn = document.getElementById('downloadSvg');
    this.downloadPngBtn = document.getElementById('downloadPng');
    
    // Control elements
    this.waveType = document.getElementById('waveType');
    this.amplitude = document.getElementById('amplitude');
    this.amplitudeValue = document.getElementById('ampValue');
    this.wavelength = document.getElementById('wavelength');
    this.wavelengthValue = document.getElementById('waveValue');
    this.segments = document.getElementById('segments');
    this.segmentsValue = document.getElementById('segValue');
    this.complexity = document.getElementById('complexity');
    this.complexityValue = document.getElementById('compValue');
    this.waveColor = document.getElementById('waveColor');
    this.bgColor = document.getElementById('bgColor');
    
    this.init();
  }
  
  init() {
    // Event listeners
    this.generateBtn.addEventListener('click', () => this.generateWave());
    this.copyBtn.addEventListener('click', () => this.copySvg());
    this.downloadSvgBtn.addEventListener('click', () => this.downloadSVG());
    this.downloadPngBtn.addEventListener('click', () => this.downloadPNG());
    
    // Update value displays
    this.amplitude.addEventListener('input', () => {
      this.amplitudeValue.textContent = this.amplitude.value;
      this.generateWave();
    });
    
    this.wavelength.addEventListener('input', () => {
      this.wavelengthValue.textContent = this.wavelength.value;
      this.generateWave();
    });
    
    this.segments.addEventListener('input', () => {
      this.segmentsValue.textContent = this.segments.value;
      this.generateWave();
    });
    
    this.complexity.addEventListener('input', () => {
      this.complexityValue.textContent = this.complexity.value;
      this.generateWave();
    });
    
    this.waveType.addEventListener('change', () => this.generateWave());
    this.waveColor.addEventListener('input', () => this.generateWave());
    this.bgColor.addEventListener('input', () => this.generateWave());
    
    // Generate initial wave
    this.generateWave();
  }
  
  generateWave() {
    const type = this.waveType.value;
    const amp = parseInt(this.amplitude.value);
    const waveLen = parseInt(this.wavelength.value);
    const segs = parseInt(this.segments.value);
    const complexity = parseFloat(this.complexity.value);
    const waveColor = this.waveColor.value;
    const bgColor = this.bgColor.value;
    
    let pathData = '';
    
    switch(type) {
      case 'sine':
        pathData = this.generateSineWave(amp, waveLen, segs, complexity);
        break;
      case 'blob':
        pathData = this.generateBlob(amp, waveLen, segs, complexity);
        break;
      case 'triangular':
        pathData = this.generateTriangularWave(amp, waveLen, segs, complexity);
        break;
      case 'square':
        pathData = this.generateSquareWave(amp, waveLen, segs, complexity);
        break;
      default:
        pathData = this.generateSineWave(amp, waveLen, segs, complexity);
    }
    
    const svg = `
<svg width="800" height="400" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  <path d="${pathData}" fill="none" stroke="${waveColor}" stroke-width="4"/>
</svg>`;
    
    this.preview.innerHTML = svg;
    
    // Format SVG for output
    const formattedSvg = svg.replace(/></g, '>\n<').trim();
    this.svgOutput.innerHTML = `<pre>${this.escapeHtml(formattedSvg)}</pre>`;
  }
  
  generateSineWave(amplitude, wavelength, segments, complexity) {
    const width = 800;
    const height = 400;
    const centerY = height / 2;
    
    let path = `M0 ${centerY}`;
    
    for(let i = 0; i <= segments; i++) {
      const x = (width / segments) * i;
      // Add some complexity/noise
      const noise = complexity * (Math.random() - 0.5) * amplitude * 0.5;
      const y = centerY + Math.sin((x / wavelength) * Math.PI * 2) * amplitude + noise;
      path += ` L${x} ${y}`;
    }
    
    // Close the path at the bottom
    path += ` L${width} ${height} L0 ${height} Z`;
    
    return path;
  }
  
  generateBlob(amplitude, wavelength, segments, complexity) {
    const width = 800;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    
    let path = '';
    
    for(let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      // Vary radius based on sine wave and complexity
      const baseRadius = amplitude;
      const wave = Math.sin(i * 0.5) * amplitude * 0.3;
      const noise = complexity * (Math.random() - 0.5) * amplitude * 0.4;
      const radius = baseRadius + wave + noise;
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if(i === 0) {
        path += `M${x} ${y}`;
      } else {
        path += ` L${x} ${y}`;
      }
    }
    
    path += ' Z';
    return path;
  }
  
  generateTriangularWave(amplitude, wavelength, segments, complexity) {
    const width = 800;
    const height = 400;
    const centerY = height / 2;
    
    let path = `M0 ${centerY}`;
    
    for(let i = 0; i <= segments; i++) {
      const x = (width / segments) * i;
      const noise = complexity * (Math.random() - 0.5) * amplitude * 0.3;
      // Triangle wave: abs(sin(x)) scaled
      const triangle = 2 * Math.abs(2 * ((x / wavelength) % 1) - 1) - 1;
      const y = centerY + triangle * amplitude + noise;
      path += ` L${x} ${y}`;
    }
    
    // Close the path at the bottom
    path += ` L${width} ${height} L0 ${height} Z`;
    
    return path;
  }
  
  generateSquareWave(amplitude, wavelength, segments, complexity) {
    const width = 800;
    const height = 400;
    const centerY = height / 2;
    
    let path = `M0 ${centerY}`;
    
    for(let i = 0; i <= segments; i++) {
      const x = (width / segments) * i;
      const noise = complexity * (Math.random() - 0.5) * amplitude * 0.3;
      // Square wave: sign(sin(x))
      const square = Math.sin((x / wavelength) * Math.PI * 2) >= 0 ? 1 : -1;
      const y = centerY + square * amplitude + noise;
      path += ` L${x} ${y}`;
    }
    
    // Close the path at the bottom
    path += ` L${width} ${height} L0 ${height} Z`;
    
    return path;
  }
  
  copySvg() {
    const svgText = this.svgOutput.textContent.trim();
    navigator.clipboard.writeText(svgText).then(() => {
      const originalText = this.copyBtn.textContent;
      this.copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        this.copyBtn.textContent = originalText;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      this.copyBtn.textContent = 'Error!';
      setTimeout(() => {
        this.copyBtn.textContent = 'Copy SVG Code';
      }, 2000);
    });
  }
  
  downloadSVG() {
    const svgText = this.svgOutput.textContent.trim();
    const blob = new Blob([svgText], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wave.svg';
    link.click();
    URL.revokeObjectURL(url);
  }
  
  downloadPNG() {
    // Convert SVG to PNG using canvas
    const svgText = this.svgOutput.textContent.trim();
    const svgBlob = new Blob([svgText], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      
      // Fill background
      ctx.fillStyle = this.bgColor.value;
      ctx.fillRect(0, 0, 800, 400);
      
      // Draw SVG
      ctx.drawImage(img, 0, 0, 800, 400);
      
      // Convert to PNG and download
      canvas.toBlob((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'wave.png';
        link.click();
        URL.revokeObjectURL(link.href);
      }, 'image/png');
      
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      window.showToast('Error generating PNG. Please try again.');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }
  
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.waveGenerator = new WaveGenerator();
});
