import React, { useState, useRef, useEffect } from 'react';
import { Upload, ArrowLeft, Download, RotateCcw, Check, User, ShieldCheck, Heart, MessageCircle, Play, Eye, Share2, Compass, Bookmark } from 'lucide-react';
import './ProfileEditor.css';

// Platform presets metadata
const PLATFORM_PRESETS = {
  x: {
    id: 'x',
    name: 'X (Twitter)',
    width: 400,
    height: 400,
    desc: 'Recommended: 400x400 px. Circular crop.',
    badgeLabel: 'Verified Check',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    width: 640,
    height: 640,
    desc: 'Recommended: 320x320 px (640x640 for Retina). Circular crop.',
    badgeLabel: 'Story Ring',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    width: 800,
    height: 800,
    desc: 'Recommended: 800x800 px. Circular crop.',
    badgeLabel: 'None',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    width: 400,
    height: 400,
    desc: 'Recommended: 200x200 px (400x400 for sharpness). Circular crop.',
    badgeLabel: 'Follow (+) Button',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    width: 360,
    height: 360,
    desc: 'Recommended: 170x170 px (360x360 for high-res). Circular crop.',
    badgeLabel: 'Active Status Dot',
  }
};

// Preset solid background colors
const BACKGROUND_COLORS = [
  { name: 'Transparent', value: 'transparent' },
  { name: 'Pure White', value: '#ffffff' },
  { name: 'Pitch Black', value: '#000000' },
  { name: 'Warm Sun', value: '#f9d371' },
  { name: 'Terracotta', value: '#e67e5a' },
  { name: 'Sage Green', value: '#74a089' },
  { name: 'Sky Blue', value: '#4ba3e3' },
  { name: 'Neon Purple', value: '#9c27b0' },
  { name: 'Soft Cream', value: '#fdfbf7' },
];

// Preset background gradients
const BACKGROUND_GRADIENTS = [
  { name: 'Sunset Glow', value: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
  { name: 'Green Lagoon', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { name: 'Instagram Ring', value: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' },
  { name: 'Twilight Purple', value: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)' },
  { name: 'Cyberpunk', value: 'linear-gradient(135deg, #f107a3 0%, #07dbf1 100%)' },
];

// Helper to calculate MS-DOS date & time for ZIP metadata
function getDosDateTime(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const dosTime = ((hours << 11) | (minutes << 5) | (seconds >> 1)) & 0xFFFF;
  const dosDate = (((year - 1980) << 9) | ((month + 1) << 5) | day) & 0xFFFF;
  return { time: dosTime, date: dosDate };
}

// Compute CRC32 checksum for ZIP file entries
function computeCrc32(data) {
  let crc = -1;
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    let temp = (crc ^ byte) & 0xFF;
    for (let j = 0; j < 8; j++) {
      if (temp & 1) {
        temp = (temp >>> 1) ^ 0xEDB88320;
      } else {
        temp = temp >>> 1;
      }
    }
    crc = (crc >>> 8) ^ temp;
  }
  return (crc ^ -1) >>> 0;
}

// Zero-Dependency Client-Side ZIP Generator (uncompressed stored method)
function generateZipBlob(files) {
  let offset = 0;
  const localHeaders = [];
  const centralDirs = [];
  const textEncoder = new TextEncoder();
  const date = new Date();
  const { time: dosTime, date: dosDate } = getDosDateTime(date);

  const fileDataList = [];

  for (const file of files) {
    const filenameBytes = textEncoder.encode(file.name);
    const dataBytes = file.data;
    const crc = computeCrc32(dataBytes);
    const localOffset = offset;

    // Local File Header
    const localHeaderBuffer = new ArrayBuffer(30 + filenameBytes.length);
    const localView = new DataView(localHeaderBuffer);

    localView.setUint32(0, 0x04034b50, true);       // signature
    localView.setUint16(4, 10, true);               // version needed
    localView.setUint16(6, 0, true);                // flags
    localView.setUint16(8, 0, true);                // compression (0 = stored)
    localView.setUint16(10, dosTime, true);
    localView.setUint16(12, dosDate, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, dataBytes.length, true); // compressed size
    localView.setUint32(22, dataBytes.length, true); // uncompressed size
    localView.setUint16(26, filenameBytes.length, true);
    localView.setUint16(28, 0, true);               // extra field len

    const localHeaderBytes = new Uint8Array(localHeaderBuffer);
    localHeaderBytes.set(filenameBytes, 30);

    localHeaders.push(localHeaderBytes);
    fileDataList.push(dataBytes);

    offset += localHeaderBytes.length + dataBytes.length;

    // Central Directory Header
    const centralHeaderBuffer = new ArrayBuffer(46 + filenameBytes.length);
    const centralView = new DataView(centralHeaderBuffer);

    centralView.setUint32(0, 0x02014b50, true);       // signature
    centralView.setUint16(4, 20, true);               // version made by
    centralView.setUint16(6, 10, true);               // version needed
    centralView.setUint16(8, 0, true);                // flags
    centralView.setUint16(10, 0, true);               // compression method
    centralView.setUint16(12, dosTime, true);
    centralView.setUint16(14, dosDate, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, dataBytes.length, true); // compressed size
    centralView.setUint32(24, dataBytes.length, true); // uncompressed size
    centralView.setUint16(28, filenameBytes.length, true);
    centralView.setUint16(30, 0, true);               // extra field len
    centralView.setUint16(32, 0, true);               // comment len
    centralView.setUint16(34, 0, true);               // disk start
    centralView.setUint16(36, 0, true);               // internal attrs
    centralView.setUint32(38, 0, true);               // external attrs
    centralView.setUint32(42, localOffset, true);     // local header offset

    const centralHeaderBytes = new Uint8Array(centralHeaderBuffer);
    centralHeaderBytes.set(filenameBytes, 46);

    centralDirs.push(centralHeaderBytes);
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const cd of centralDirs) {
    centralDirSize += cd.length;
  }

  // End of Central Directory
  const eocdBuffer = new ArrayBuffer(22);
  const eocdView = new DataView(eocdBuffer);

  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);                    // disk number
  eocdView.setUint16(6, 0, true);                    // disk with cd
  eocdView.setUint16(8, files.length, true);          // num records on disk
  eocdView.setUint16(10, files.length, true);         // num records total
  eocdView.setUint32(12, centralDirSize, true);
  eocdView.setUint32(16, centralDirOffset, true);
  eocdView.setUint16(20, 0, true);                   // comment len

  const eocdBytes = new Uint8Array(eocdBuffer);

  // Allocate total space
  const totalLength = centralDirOffset + centralDirSize + eocdBytes.length;
  const result = new Uint8Array(totalLength);

  let currentOffset = 0;
  for (let i = 0; i < files.length; i++) {
    result.set(localHeaders[i], currentOffset);
    currentOffset += localHeaders[i].length;
    result.set(fileDataList[i], currentOffset);
    currentOffset += fileDataList[i].length;
  }

  for (const cd of centralDirs) {
    result.set(cd, currentOffset);
    currentOffset += cd.length;
  }

  result.set(eocdBytes, currentOffset);

  return new Blob([result], { type: 'application/zip' });
}

export default function ProfileEditor({ onBack, projectName }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [platform, setPlatform] = useState('x'); // 'x', 'instagram', 'youtube', 'tiktok', 'facebook'
  const [activeTab, setActiveTab] = useState('editor'); // 'editor', 'mockups'

  // Image manipulation parameters
  const [zoom, setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // Styling options
  const [bgColor, setBgColor] = useState('transparent');
  const [customBgColor, setCustomBgColor] = useState('#e67e5a');
  const [borderColor, setBorderColor] = useState('#ffffff');
  const [borderWidth, setBorderWidth] = useState(0);
  const [glowStyle, setGlowStyle] = useState('none'); // 'none', 'soft', 'neon', 'terracotta'
  const [showBadges, setShowBadges] = useState(true);

  // Filters
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Native image dimensions
  const [imgDimensions, setImgDimensions] = useState({ naturalWidth: 0, naturalHeight: 0 });
  const [initialScale, setInitialScale] = useState(1.0);

  // Refs
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);

  // Reset parameters when a new image is loaded
  const resetImageState = () => {
    setZoom(1.0);
    setRotation(0);
    setPanX(0);
    setPanY(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBgColor('transparent');
    setBorderWidth(0);
    setGlowStyle('none');
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      loadImage(e.target.files[0]);
    }
  };

  const loadImage = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target.result);
      resetImageState();
    };
    reader.readAsDataURL(file);
  };

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setImgDimensions({ naturalWidth, naturalHeight });

    // Initial scale: Fit so that the smaller side is exactly 260px (diameter of crop circle)
    const scale = Math.max(260 / naturalWidth, 260 / naturalHeight);
    setInitialScale(scale);
  };

  // Panning Event Handlers (Click-and-Drag)
  const handleMouseDown = (e) => {
    if (!imageSrc) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !imageSrc) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanX((prev) => prev + dx);
    setPanY((prev) => prev + dy);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Scroll Wheel Zoom
  const handleWheel = (e) => {
    if (!imageSrc) return;
    e.preventDefault();
    const zoomStep = 0.05;
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(4.0, prev + zoomStep));
    } else {
      setZoom((prev) => Math.max(0.5, prev - zoomStep));
    }
  };

  // Render crop snapshot to canvas
  const renderToCanvas = (targetPlatformId) => {
    return new Promise((resolve) => {
      const preset = PLATFORM_PRESETS[targetPlatformId];
      const canvas = document.createElement('canvas');
      canvas.width = preset.width;
      canvas.height = preset.height;
      const ctx = canvas.getContext('2d');

      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        // 1. Draw Background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let bgStyle = bgColor;
        if (bgColor === 'custom') {
          bgStyle = customBgColor;
        }

        if (bgStyle !== 'transparent') {
          ctx.fillStyle = bgStyle;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 2. Draw Image under transformations
        ctx.save();
        
        // Translate to canvas center
        ctx.translate(canvas.width / 2, canvas.height / 2);
        
        // Apply rotation
        ctx.rotate((rotation * Math.PI) / 180);

        // Apply filters
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

        // Calculate scaling matching the viewport
        const exportScaleRatio = preset.width / 260; // relative to display diameter
        const finalScale = initialScale * zoom * exportScaleRatio;

        // Apply panning offsets (translated to export coordinate scale)
        ctx.translate(panX * exportScaleRatio, panY * exportScaleRatio);

        const drawW = imgDimensions.naturalWidth * finalScale;
        const drawH = imgDimensions.naturalHeight * finalScale;

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // 3. Draw border outline if configured
        if (borderWidth > 0) {
          ctx.save();
          ctx.beginPath();
          // Draw standard circular path
          const radius = (preset.width / 2) - ((borderWidth * (preset.width / 260)) / 2);
          ctx.arc(preset.width / 2, preset.height / 2, radius, 0, 2 * Math.PI);
          ctx.lineWidth = borderWidth * (preset.width / 260);
          ctx.strokeStyle = borderColor;
          
          // Optional Glow Shadow on Canvas
          if (glowStyle !== 'none') {
            ctx.shadowBlur = 15;
            if (glowStyle === 'neon') ctx.shadowColor = '#9c27b0';
            else if (glowStyle === 'terracotta') ctx.shadowColor = '#e67e5a';
            else ctx.shadowColor = 'rgba(0,0,0,0.5)';
          }
          
          ctx.stroke();
          ctx.restore();
        }

        // Return DataUrl
        resolve(canvas.toDataURL('image/png'));
      };
    });
  };

  // Download Avatar for currently selected platform
  const handleSingleDownload = async () => {
    if (!imageSrc) return;
    const dataUrl = await renderToCanvas(platform);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `jct-${platform}-profile-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Export ZIP containing formatted cuts for ALL 5 platforms at once
  const handleBatchZipDownload = async () => {
    if (!imageSrc) return;
    const filePromises = Object.keys(PLATFORM_PRESETS).map(async (key) => {
      const dataUrl = await renderToCanvas(key);
      
      // Convert Data URL to binary Uint8Array
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      return {
        name: `${key}-avatar.png`,
        data: new Uint8Array(arrayBuffer)
      };
    });

    const files = await Promise.all(filePromises);
    const zipBlob = generateZipBlob(files);
    
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jct-all-avatars-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper for applying custom shadows to the circle frame in UI
  const getGlowShadowStyle = () => {
    if (glowStyle === 'none') return 'none';
    if (glowStyle === 'soft') return '0 0 16px rgba(0,0,0,0.4)';
    if (glowStyle === 'neon') return '0 0 20px #9c27b0, 0 0 8px #9c27b0';
    if (glowStyle === 'terracotta') return '0 0 20px #e67e5a, 0 0 8px #e67e5a';
    return 'none';
  };

  return (
    <div className="profile-editor-container">
      <header className="profile-editor-header">
        <div className="header-left">
          <button className="btn" onClick={onBack} style={{ padding: '0.4rem' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="header-font" style={{ fontSize: '18px', margin: 0 }}>
            Social Profile Avatar Editor {projectName ? `- ${projectName}` : ''}
          </h1>
        </div>
        <div>
          {imageSrc && (
            <div className="workspace-tabs">
              <button 
                className={`workspace-tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
                onClick={() => setActiveTab('editor')}
              >
                Canvas Editor
              </button>
              <button 
                className={`workspace-tab-btn ${activeTab === 'mockups' ? 'active' : ''}`}
                onClick={() => setActiveTab('mockups')}
              >
                Simulated Mockups
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="profile-editor-layout">
        {/* Sidebar Controls */}
        <aside className="profile-editor-sidebar">
          <div className="sidebar-content">
            <h3 className="header-font" style={{ fontSize: '18px', marginBottom: '4px' }}>Avatar Setup</h3>
            <p className="text-12" style={{ color: 'var(--text-secondary)' }}>
              Pan, scale, and adjust your profile photo. Export with safe-zone overrides.
            </p>

            {imageSrc ? (
              <>
                {/* Platform Presets Selection */}
                <div className="tool-section">
                  <label className="tool-label">Target Platform</label>
                  <div className="platform-select-grid">
                    {Object.values(PLATFORM_PRESETS).map((p) => (
                      <button
                        key={p.id}
                        className={`platform-btn ${platform === p.id ? 'active' : ''}`}
                        onClick={() => setPlatform(p.id)}
                      >
                        <User size={16} />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-12" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                    {PLATFORM_PRESETS[platform].desc}
                  </p>
                </div>

                {/* Canvas Background Settings */}
                <div className="tool-section">
                  <label className="tool-label">Avatar Background</label>
                  <div className="color-options-container">
                    <div className="color-swatches-grid">
                      {BACKGROUND_COLORS.map((c) => (
                        <button
                          key={c.name}
                          className={`color-swatch ${c.value === 'transparent' ? 'swatch-transparent' : ''} ${bgColor === c.value ? 'active' : ''}`}
                          style={c.value !== 'transparent' ? { backgroundColor: c.value } : {}}
                          onClick={() => setBgColor(c.value)}
                          title={c.name}
                        />
                      ))}
                    </div>
                    
                    {/* Gradient options */}
                    <div className="color-swatches-grid">
                      {BACKGROUND_GRADIENTS.map((g) => (
                        <button
                          key={g.name}
                          className={`color-swatch ${bgColor === g.value ? 'active' : ''}`}
                          style={{ background: g.value }}
                          onClick={() => setBgColor(g.value)}
                          title={g.name}
                        />
                      ))}
                      
                      {/* Custom color picker option */}
                      <div className="color-picker-input-wrapper" style={{ gridColumn: 'span 2' }}>
                        <input
                          type="color"
                          className="color-picker-native"
                          value={customBgColor}
                          onChange={(e) => {
                            setCustomBgColor(e.target.value);
                            setBgColor('custom');
                          }}
                        />
                        <button 
                          className={`btn ${bgColor === 'custom' ? 'btn-primary' : ''}`}
                          style={{ padding: '2px 8px', fontSize: '11px', boxShadow: '1px 1px 0px black' }}
                          onClick={() => setBgColor('custom')}
                        >
                          Custom
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Badges Overlay toggle */}
                <div className="tool-section">
                  <label className="tool-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={showBadges}
                      onChange={(e) => setShowBadges(e.target.checked)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <span>Show Safe Overlay Badge</span>
                  </label>
                  <p className="text-12" style={{ color: 'var(--text-secondary)' }}>
                    Visualizes overlays: checkmarks, story rings, or statuses that may crop your text.
                  </p>
                </div>

                {/* Border Ring Settings */}
                <div className="tool-section">
                  <label className="tool-label">Border Outline</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="border-width-presets">
                      {[0, 4, 8, 12, 16].map((w) => (
                        <button
                          key={w}
                          className={`border-preset-btn ${borderWidth === w ? 'active' : ''}`}
                          onClick={() => setBorderWidth(w)}
                        >
                          {w === 0 ? 'None' : `${w}px`}
                        </button>
                      ))}
                    </div>
                    {borderWidth > 0 && (
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span className="text-12">Color:</span>
                        <input
                          type="color"
                          className="color-picker-native"
                          value={borderColor}
                          onChange={(e) => setBorderColor(e.target.value)}
                        />
                        <select
                          className="btn"
                          style={{ padding: '4px', fontSize: '11px', flex: 1, boxShadow: '1px 1px 0px black' }}
                          value={glowStyle}
                          onChange={(e) => setGlowStyle(e.target.value)}
                        >
                          <option value="none">No Shadow</option>
                          <option value="soft">Soft Drop Shadow</option>
                          <option value="neon">Neon Purple Glow</option>
                          <option value="terracotta">Terracotta Glow</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interactive Slider Adjustments */}
                <div className="tool-section">
                  <label className="tool-label">Adjustments</label>
                  <div className="control-slider-group">
                    <div className="slider-wrapper">
                      <div className="slider-header">
                        <span>Zoom</span>
                        <span>{zoom.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        className="slider-input"
                        min="0.5"
                        max="4.0"
                        step="0.05"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                      />
                    </div>

                    <div className="slider-wrapper">
                      <div className="slider-header">
                        <span>Rotation</span>
                        <span>{rotation}°</span>
                      </div>
                      <input
                        type="range"
                        className="slider-input"
                        min="0"
                        max="360"
                        value={rotation}
                        onChange={(e) => setRotation(parseInt(e.target.value))}
                      />
                    </div>

                    <div className="slider-wrapper">
                      <div className="slider-header">
                        <span>Brightness</span>
                        <span>{brightness}%</span>
                      </div>
                      <input
                        type="range"
                        className="slider-input"
                        min="50"
                        max="150"
                        value={brightness}
                        onChange={(e) => setBrightness(parseInt(e.target.value))}
                      />
                    </div>

                    <div className="slider-wrapper">
                      <div className="slider-header">
                        <span>Contrast</span>
                        <span>{contrast}%</span>
                      </div>
                      <input
                        type="range"
                        className="slider-input"
                        min="50"
                        max="150"
                        value={contrast}
                        onChange={(e) => setContrast(parseInt(e.target.value))}
                      />
                    </div>

                    <div className="slider-wrapper">
                      <div className="slider-header">
                        <span>Saturation</span>
                        <span>{saturation}%</span>
                      </div>
                      <input
                        type="range"
                        className="slider-input"
                        min="0"
                        max="200"
                        value={saturation}
                        onChange={(e) => setSaturation(parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* Save and Exporters */}
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button className="btn" onClick={resetImageState}>
                    <RotateCcw size={14} /> Reset Image Styling
                  </button>
                  <button className="btn btn-primary" onClick={handleSingleDownload}>
                    <Download size={14} /> Download for {PLATFORM_PRESETS[platform].name}
                  </button>
                  <button 
                    className="btn" 
                    onClick={handleBatchZipDownload} 
                    style={{ background: 'var(--accent-secondary)', color: 'white', border: '2px solid var(--text-primary)' }}
                  >
                    📦 Download ZIP for All Platforms
                  </button>
                  <button className="btn" onClick={() => setImageSrc(null)} style={{ border: '2px solid #ea5455', color: '#ea5455', marginTop: '10px' }}>
                    Select New Photo
                  </button>
                </div>
              </>
            ) : (
              <div style={{ marginTop: 'auto', color: 'var(--text-muted)' }} className="text-12">
                <p style={{ marginBottom: '8px' }}>Crop safe-zone visualizers</p>
                <p style={{ marginBottom: '8px' }}>Simulated feed mockups</p>
                <p>100% Client-Side Processing</p>
              </div>
            )}
          </div>
        </aside>

        {/* Main Work Area */}
        <main className={`profile-editor-main ${activeTab === 'mockups' ? 'mockups-mode' : ''}`}>
          {!imageSrc ? (
            <div 
              className="drop-zone"
              onClick={() => fileInputRef.current.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('active');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('active');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('active');
                if (e.dataTransfer.files.length > 0) {
                  loadImage(e.dataTransfer.files[0]);
                }
              }}
              style={{ width: '80%', maxWidth: '600px', margin: 'auto' }}
            >
              <Upload size={48} style={{ color: 'var(--accent-primary)' }} />
              <div>
                <h2 className="header-font">Select Avatar Photo</h2>
                <p className="text-14">Drag &amp; drop your JPEG, PNG, or WebP here</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
            </div>
          ) : activeTab === 'editor' ? (
            /* Canvas Editor Tab View */
            <div className="crop-editor-wrapper">
              <div 
                className="crop-canvas-viewport"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                {/* The dynamic image underneath the mask */}
                <div 
                  className="image-transform-layer"
                  style={{
                    transform: `translate(${panX}px, ${panY}px) scale(${initialScale * zoom}) rotate(${rotation}deg)`,
                    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                  }}
                >
                  <img 
                    ref={imgRef}
                    src={imageSrc} 
                    alt="Source Avatar" 
                    className="transformed-img"
                    onLoad={handleImageLoad}
                    draggable="false"
                  />
                </div>

                {/* Custom Background render color behind transparent PNGs in CSS preview */}
                <div 
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: bgColor === 'custom' ? customBgColor : bgColor,
                    zIndex: 1,
                    pointerEvents: 'none'
                  }}
                />

                {/* Custom border glow overlays in CSS preview */}
                {borderWidth > 0 && (
                  <div 
                    className="custom-border-glow"
                    style={{
                      border: `${borderWidth}px solid ${borderColor}`,
                      boxShadow: getGlowShadowStyle()
                    }}
                  />
                )}

                {/* Platform-specific Visual Previews/Badges overlays */}
                {showBadges && platform === 'x' && (
                  <div className="crop-badge-overlay badge-x-verified">
                    <ShieldCheck size={26} color="#1d9bf0" fill="#1d9bf0" style={{ color: 'white' }} />
                  </div>
                )}

                {showBadges && platform === 'instagram' && (
                  <div className="crop-badge-overlay badge-instagram-story" />
                )}

                {showBadges && platform === 'tiktok' && (
                  <div className="crop-badge-overlay badge-tiktok-plus">+</div>
                )}

                {showBadges && platform === 'facebook' && (
                  <div className="crop-badge-overlay badge-facebook-active" />
                )}

                {/* Circular Crop Mask Overlay */}
                <div className="crop-circle-mask" />
              </div>

              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>
                💡 <strong>Drag</strong> to position · <strong>Scroll</strong> to zoom
              </div>
            </div>
          ) : (
            /* Live Simulated Mockups Tab View */
            <div className="mockups-viewport-container">
              <h2 className="header-font" style={{ fontSize: '24px', alignSelf: 'flex-start' }}>Simulated Social Mockups</h2>
              <div className="mockups-columns-wrapper">
                
                {/* Left Column - Text Feeds */}
                <div className="mockups-column">
                  
                  {/* X (Twitter) Feed Mockup */}
                  <div className="mockup-card">
                    <div className="mockup-card-title">X (Twitter) Post Mockup</div>
                    <div className="mockup-card-body">
                      <div className="x-tweet-container">
                        <div className="x-avatar-col">
                          <div className="x-mockup-avatar-wrapper">
                            <div style={{
                              width: '48px', height: '48px', borderRadius: '50%',
                              overflow: 'hidden', position: 'relative', border: '1px solid rgba(0,0,0,0.1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <div style={{
                                position: 'absolute',
                                transform: `translate(${panX * (48/260)}px, ${panY * (48/260)}px) scale(${initialScale * zoom * (48/260)}) rotate(${rotation}deg)`,
                                filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                              }}>
                                <img src={imageSrc} style={{ display: 'block', maxWidth: 'none', maxHeight: 'none' }} />
                              </div>
                              <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                background: bgColor === 'custom' ? customBgColor : bgColor, zIndex: -1
                              }} />
                            </div>
                            {showBadges && platform === 'x' && (
                              <div className="x-mockup-verified-icon">
                                <ShieldCheck size={16} color="#1d9bf0" fill="#1d9bf0" style={{ color: 'white' }} />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="x-content-col">
                          <div className="x-user-header">
                            <span className="x-display-name">Creative Designer</span>
                            <span className="x-handle">@creative_tools</span>
                            <span className="x-dot">·</span>
                            <span className="x-time">2h</span>
                          </div>
                          <div className="x-tweet-text">
                            Just customized my brand-new profile picture completely client-side in JCT. Safe, no servers, 100% private. Check it out!
                          </div>
                          <div className="x-actions-row">
                            <span>💬 12</span>
                            <span>🔁 43</span>
                            <span>❤️ 198</span>
                            <span>📊 2.4K</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Facebook Post Mockup */}
                  <div className="mockup-card">
                    <div className="mockup-card-title">Facebook Post Mockup</div>
                    <div className="mockup-card-body">
                      <div className="fb-post-container">
                        <div className="fb-header">
                          <div className="fb-avatar-wrapper">
                            <div style={{
                              width: '40px', height: '40px', borderRadius: '50%',
                              overflow: 'hidden', position: 'relative',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <div style={{
                                position: 'absolute',
                                transform: `translate(${panX * (40/260)}px, ${panY * (40/260)}px) scale(${initialScale * zoom * (40/260)}) rotate(${rotation}deg)`,
                                filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                              }}>
                                <img src={imageSrc} style={{ display: 'block', maxWidth: 'none', maxHeight: 'none' }} />
                              </div>
                              <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                background: bgColor === 'custom' ? customBgColor : bgColor, zIndex: -1
                              }} />
                            </div>
                            {showBadges && platform === 'facebook' && (
                              <div className="fb-active-dot" />
                            )}
                          </div>
                          <div className="fb-header-info">
                            <div className="fb-profile-name">
                              Just Creative Tools
                              {showBadges && platform === 'facebook' && (
                                <ShieldCheck size={14} color="#1877f2" fill="#1877f2" style={{ color: 'white' }} />
                              )}
                            </div>
                            <span className="fb-time-privacy">Just now · Public 🌐</span>
                          </div>
                        </div>
                        <div className="fb-content">
                          Testing the brand-new Social Profile Avatar Editor mockup view! Fits perfectly in the feed.
                        </div>
                        <div className="fb-actions-row">
                          <span>👍 Like</span>
                          <span>💬 Comment</span>
                          <span>➡️ Share</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* YouTube Comment Mockup */}
                  <div className="mockup-card">
                    <div className="mockup-card-title">YouTube Comment Mockup</div>
                    <div className="mockup-card-body">
                      <div className="yt-comment-container">
                        <div className="yt-avatar-wrapper">
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            overflow: 'hidden', position: 'relative',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <div style={{
                              position: 'absolute',
                              transform: `translate(${panX * (40/260)}px, ${panY * (40/260)}px) scale(${initialScale * zoom * (40/260)}) rotate(${rotation}deg)`,
                              filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                            }}>
                              <img src={imageSrc} style={{ display: 'block', maxWidth: 'none', maxHeight: 'none' }} />
                            </div>
                            <div style={{
                              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                              background: bgColor === 'custom' ? customBgColor : bgColor, zIndex: -1
                            }} />
                          </div>
                        </div>
                        <div className="yt-comment-body">
                          <div className="yt-author-line">
                            <span className="yt-author-name">@JCTCreator</span>
                            <span className="yt-time">5 minutes ago</span>
                          </div>
                          <div className="yt-text">
                            No servers, no tracking, just pure creative tools. Love that JCT runs entirely in my browser. Subscribed! 🎨
                          </div>
                          <div className="yt-actions">
                            <span>👍 198</span>
                            <span>👎</span>
                            <span>Reply</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Column - Media Feeds */}
                <div className="mockups-column">
                  
                  {/* Instagram Feed Post Mockup */}
                  <div className="mockup-card">
                    <div className="mockup-card-title">Instagram Feed Mockup</div>
                    <div className="mockup-card-body">
                      <div className="ig-mockup-container">
                        <div className="ig-post-header">
                          <div className="ig-user-info">
                            <div className={`ig-avatar-wrapper ${showBadges && platform === 'instagram' ? 'with-story' : ''}`}>
                              <div className="ig-avatar-inner">
                                <div style={{
                                  width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                  <div style={{
                                    position: 'absolute',
                                    transform: `translate(${panX * (32/260)}px, ${panY * (32/260)}px) scale(${initialScale * zoom * (32/260)}) rotate(${rotation}deg)`,
                                    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                                  }}>
                                    <img src={imageSrc} style={{ display: 'block', maxWidth: 'none', maxHeight: 'none' }} />
                                  </div>
                                  <div style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                    background: bgColor === 'custom' ? customBgColor : bgColor, zIndex: -1
                                  }} />
                                </div>
                              </div>
                            </div>
                            <span className="ig-username">creative_tools</span>
                          </div>
                          <span>•••</span>
                        </div>
                        <div className="ig-post-body">
                          ✨ JCT Preview
                        </div>
                        <div className="ig-post-footer">
                          <div className="ig-post-icons">
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <Heart size={16} />
                              <MessageCircle size={16} />
                              <Share2 size={16} />
                            </div>
                            <Bookmark size={16} />
                          </div>
                          <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>423 likes</div>
                          <div className="ig-caption">
                            <span style={{ fontWeight: 'bold' }}>creative_tools</span> New avatar day! Fully designed offline in browser.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TikTok Video Overlay Mockup */}
                  <div className="mockup-card">
                    <div className="mockup-card-title">TikTok Overlay Mockup</div>
                    <div className="mockup-card-body">
                      <div className="tt-mockup-container">
                        <div className="tt-bg-sim" />
                        <div className="tt-sidebar">
                          <div className="tt-avatar-box">
                            <div style={{
                              width: '45px', height: '45px', borderRadius: '50%',
                              overflow: 'hidden', position: 'relative', border: '1.5px solid white',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <div style={{
                                position: 'absolute',
                                transform: `translate(${panX * (45/260)}px, ${panY * (45/260)}px) scale(${initialScale * zoom * (45/260)}) rotate(${rotation}deg)`,
                                filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                              }}>
                                <img src={imageSrc} style={{ display: 'block', maxWidth: 'none', maxHeight: 'none' }} />
                              </div>
                              <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                background: bgColor === 'custom' ? customBgColor : bgColor, zIndex: -1
                              }} />
                            </div>
                            {showBadges && platform === 'tiktok' && (
                              <div className="tt-plus-badge">+</div>
                            )}
                          </div>
                          <div className="tt-action-btn">
                            <div className="tt-action-icon">❤️</div>
                            <span>42.1K</span>
                          </div>
                          <div className="tt-action-btn">
                            <div className="tt-action-icon">💬</div>
                            <span>1.2K</span>
                          </div>
                          <div className="tt-action-btn">
                            <div className="tt-action-icon">⭐️</div>
                            <span>5.4K</span>
                          </div>
                          <div className="tt-action-btn">
                            <div className="tt-action-icon">➡️</div>
                            <span>890</span>
                          </div>
                        </div>
                        <div className="tt-caption-box">
                          <div className="tt-username">@creative_tools</div>
                          <div>Making awesome designs using un-snooped web apps! #NoBS #offline #localfirst</div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
