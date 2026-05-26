import React, { useState, useRef, useEffect } from 'react';
import { Upload, RefreshCw, Scissors, Check, X, ArrowLeft, Download, RefreshCw as ResetIcon, Move, Maximize2, Trash2 } from 'lucide-react';
import './ImageCropper.css';

export default function ImageCropper({ onBack, onSave }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 });
  
  // Crop modes: 'standard' or 'free'
  const [cropMode, setCropMode] = useState('standard'); 
  
  // Standard Crop State
  const [cropBox, setCropBox] = useState({ x: 50, y: 50, width: 250, height: 250 });
  const [aspectRatio, setAspectRatio] = useState('free'); // 'free', '1:1', '16:9', '4:3', '9:16'
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragType, setDragType] = useState(null); // 'move', 'nw', 'ne', 'sw', 'se'
  
  // Free Crop (Lasso) State
  const [lassoPoints, setLassoPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);
  const lassoCanvasRef = useRef(null);
  const containerRef = useRef(null);

  // Set up resize observer to keep canvas and img dimensions in sync if page scales
  useEffect(() => {
    if (!imgRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === imgRef.current) {
          const { width, height } = entry.contentRect;
          setImgDimensions(prev => ({
            ...prev,
            width: width || imgRef.current.clientWidth,
            height: height || imgRef.current.clientHeight
          }));
        }
      }
    });
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [imageSrc]);

  // Redraw lasso canvas path when points change or mode changes
  useEffect(() => {
    if (cropMode !== 'free' || !lassoCanvasRef.current || !imgDimensions.width) return;
    const canvas = lassoCanvasRef.current;
    canvas.width = imgDimensions.width;
    canvas.height = imgDimensions.height;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (lassoPoints.length === 0) return;
    
    // Draw the path
    ctx.strokeStyle = '#e67e5a'; // --accent-primary
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
    for (let i = 1; i < lassoPoints.length; i++) {
      ctx.lineTo(lassoPoints[i].x, lassoPoints[i].y);
    }
    
    if (!isDrawing && lassoPoints.length > 2) {
      ctx.closePath();
      // Draw semi-transparent filled mask overlay inside the selection
      ctx.fillStyle = 'rgba(230, 126, 90, 0.15)';
      ctx.fill();
    }
    ctx.stroke();
    
    // Draw starting point marker
    ctx.setLineDash([]);
    ctx.fillStyle = '#f9d371'; // --accent-highlight
    ctx.strokeStyle = '#2d2a26';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lassoPoints[0].x, lassoPoints[0].y, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }, [lassoPoints, isDrawing, cropMode, imgDimensions]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      loadImage(e.target.files[0]);
    }
  };

  const loadImage = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target.result);
      setCroppedImage(null);
      setLassoPoints([]);
    };
    reader.readAsDataURL(file);
  };

  const handleImageLoad = (e) => {
    const { width, height, naturalWidth, naturalHeight } = e.target;
    setImgDimensions({ width, height, naturalWidth, naturalHeight });
    
    // Initialize standard crop box to be a centered square of 60% of min dimension
    const size = Math.min(width, height) * 0.6;
    setCropBox({
      x: (width - size) / 2,
      y: (height - size) / 2,
      width: size,
      height: size
    });
  };

  // Dragging Standard Crop Box logic
  const handleCropMouseDown = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || cropMode !== 'standard' || !imgRef.current) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });
    
    setCropBox(prev => {
      let { x, y, width, height } = prev;
      const imgW = imgDimensions.width;
      const imgH = imgDimensions.height;
      
      if (dragType === 'move') {
        const nextX = Math.max(0, Math.min(imgW - width, x + dx));
        const nextY = Math.max(0, Math.min(imgH - height, y + dy));
        return { ...prev, x: nextX, y: nextY };
      }
      
      // Handles resizing
      let newW = width;
      let newH = height;
      let newX = x;
      let newY = y;
      
      // Keep aspect ratio helper
      const getFixedAspectSize = (w, h, type) => {
        let ratioVal = 1;
        if (aspectRatio === '1:1') ratioVal = 1;
        else if (aspectRatio === '16:9') ratioVal = 16 / 9;
        else if (aspectRatio === '4:3') ratioVal = 4 / 3;
        else if (aspectRatio === '9:16') ratioVal = 9 / 16;
        
        if (type.includes('e') || type.includes('w')) {
          return { w: w, h: w / ratioVal };
        } else {
          return { w: h * ratioVal, h: h };
        }
      };
      
      const minSize = 40;
      
      if (dragType === 'se') {
        newW = Math.max(minSize, Math.min(imgW - x, width + dx));
        newH = Math.max(minSize, Math.min(imgH - y, height + dy));
        if (aspectRatio !== 'free') {
          const fixed = getFixedAspectSize(newW, newH, 'se');
          if (x + fixed.w <= imgW && y + fixed.h <= imgH) {
            newW = fixed.w;
            newH = fixed.h;
          } else {
            return prev;
          }
        }
      } else if (dragType === 'sw') {
        const maxDx = x;
        const actualDx = Math.min(maxDx, -dx);
        newW = Math.max(minSize, width + actualDx);
        newH = Math.max(minSize, Math.min(imgH - y, height + dy));
        newX = x - (newW - width);
        if (aspectRatio !== 'free') {
          const fixed = getFixedAspectSize(newW, newH, 'sw');
          if (x + width - fixed.w >= 0 && y + fixed.h <= imgH) {
            newX = x + width - fixed.w;
            newW = fixed.w;
            newH = fixed.h;
          } else {
            return prev;
          }
        }
      } else if (dragType === 'ne') {
        newW = Math.max(minSize, Math.min(imgW - x, width + dx));
        const maxDy = y;
        const actualDy = Math.min(maxDy, -dy);
        newH = Math.max(minSize, height + actualDy);
        newY = y - (newH - height);
        if (aspectRatio !== 'free') {
          const fixed = getFixedAspectSize(newW, newH, 'ne');
          if (x + fixed.w <= imgW && y + height - fixed.h >= 0) {
            newY = y + height - fixed.h;
            newW = fixed.w;
            newH = fixed.h;
          } else {
            return prev;
          }
        }
      } else if (dragType === 'nw') {
        const maxDx = x;
        const actualDx = Math.min(maxDx, -dx);
        newW = Math.max(minSize, width + actualDx);
        newX = x - (newW - width);
        
        const maxDy = y;
        const actualDy = Math.min(maxDy, -dy);
        newH = Math.max(minSize, height + actualDy);
        newY = y - (newH - height);
        
        if (aspectRatio !== 'free') {
          const fixed = getFixedAspectSize(newW, newH, 'nw');
          if (x + width - fixed.w >= 0 && y + height - fixed.h >= 0) {
            newX = x + width - fixed.w;
            newY = y + height - fixed.h;
            newW = fixed.w;
            newH = fixed.h;
          } else {
            return prev;
          }
        }
      }
      
      return { x: newX, y: newY, width: newW, height: newH };
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragType(null);
  };

  // Lasso drawing handlers
  const getCanvasMousePos = (e) => {
    if (!lassoCanvasRef.current) return { x: 0, y: 0 };
    const rect = lassoCanvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleLassoMouseDown = (e) => {
    if (cropMode !== 'free') return;
    e.preventDefault();
    const pos = getCanvasMousePos(e);
    setIsDrawing(true);
    setLassoPoints([pos]);
  };

  const handleLassoMouseMove = (e) => {
    if (cropMode !== 'free' || !isDrawing) return;
    const pos = getCanvasMousePos(e);
    setLassoPoints(prev => [...prev, pos]);
  };

  const handleLassoMouseUp = () => {
    if (cropMode !== 'free' || !isDrawing) return;
    setIsDrawing(false);
    
    // Auto-close loop if there's enough points
    if (lassoPoints.length > 2) {
      setLassoPoints(prev => [...prev, prev[0]]);
    }
  };

  // Reset current selection
  const handleReset = () => {
    setLassoPoints([]);
    const size = Math.min(imgDimensions.width, imgDimensions.height) * 0.6;
    setCropBox({
      x: (imgDimensions.width - size) / 2,
      y: (imgDimensions.height - size) / 2,
      width: size,
      height: size
    });
  };

  // Switch Aspect Ratios in standard mode
  const handleAspectRatioChange = (ratio) => {
    setAspectRatio(ratio);
    if (ratio === 'free') return;
    
    let ratioVal = 1;
    if (ratio === '1:1') ratioVal = 1;
    else if (ratio === '16:9') ratioVal = 16 / 9;
    else if (ratio === '4:3') ratioVal = 4 / 3;
    else if (ratio === '9:16') ratioVal = 9 / 16;
    
    setCropBox(prev => {
      let w = prev.width;
      let h = w / ratioVal;
      
      // Keep inside boundary
      if (prev.x + w > imgDimensions.width) {
        w = imgDimensions.width - prev.x;
        h = w / ratioVal;
      }
      if (prev.y + h > imgDimensions.height) {
        h = imgDimensions.height - prev.y;
        w = h * ratioVal;
      }
      
      return {
        ...prev,
        width: w,
        height: h
      };
    });
  };

  // Perform the cropping
  const performCrop = () => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const scaleX = img.naturalWidth / imgDimensions.width;
      const scaleY = img.naturalHeight / imgDimensions.height;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (cropMode === 'standard') {
        const srcX = cropBox.x * scaleX;
        const srcY = cropBox.y * scaleY;
        const srcW = cropBox.width * scaleX;
        const srcH = cropBox.height * scaleY;
        
        canvas.width = srcW;
        canvas.height = srcH;
        
        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
        const croppedUrl = canvas.toDataURL('image/png'); // Preserve transparent backgrounds
        setCroppedImage(croppedUrl);
      } else {
        // Free Lasso crop
        if (lassoPoints.length < 3) return;
        
        // Find bounding box of lasso points in image space
        const origPoints = lassoPoints.map(p => ({
          x: p.x * scaleX,
          y: p.y * scaleY
        }));
        
        const xs = origPoints.map(p => p.x);
        const ys = origPoints.map(p => p.y);
        
        const minX = Math.max(0, Math.min(...xs));
        const maxX = Math.min(img.naturalWidth, Math.max(...xs));
        const minY = Math.max(0, Math.min(...ys));
        const maxY = Math.min(img.naturalHeight, Math.max(...ys));
        
        const w = maxX - minX;
        const h = maxY - minY;
        
        if (w <= 0 || h <= 0) return;
        
        canvas.width = w;
        canvas.height = h;
        
        // Setup clip path offset by bounding box origin
        ctx.beginPath();
        ctx.moveTo(origPoints[0].x - minX, origPoints[0].y - minY);
        for (let i = 1; i < origPoints.length; i++) {
          ctx.lineTo(origPoints[i].x - minX, origPoints[i].y - minY);
        }
        ctx.closePath();
        ctx.clip();
        
        // Draw image offset by bounding box origin
        ctx.drawImage(img, -minX, -minY);
        
        const croppedUrl = canvas.toDataURL('image/png'); // Essential to be PNG for transparency!
        setCroppedImage(croppedUrl);
      }
    };
  };

  const handleSaveProject = () => {
    if (croppedImage) {
      onSave({
        id: Date.now(),
        type: 'image',
        name: `Cropped Image ${new Date().toLocaleTimeString()}`,
        dataUrl: croppedImage
      });
    }
  };

  const handleDownload = () => {
    if (!croppedImage) return;
    const a = document.createElement('a');
    a.href = croppedImage;
    a.download = `jct-cropped-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div 
      className="image-cropper-container" 
      onMouseMove={handleMouseMove} 
      onMouseUp={handleMouseUp}
      ref={containerRef}
    >
      <header className="cropper-header">
        <button className="btn back-btn" onClick={onBack} style={{padding: '0.4rem', boxShadow: '2px 2px 0px black'}}>
          <ArrowLeft size={16} />
        </button>
        <h2 className="header-font">Organic Image Cropper</h2>
      </header>

      <div className="cropper-workspace">
        {!imageSrc && (
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
            <Upload size={48} style={{ color: 'var(--accent-secondary)' }} />
            <div>
              <h2 className="header-font">Select Image to Crop</h2>
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
        )}

        {imageSrc && !croppedImage && (
          <div className="crop-editor-wrapper">
            <div className="crop-image-area" style={{ position: 'relative' }}>
              <img 
                ref={imgRef}
                src={imageSrc} 
                alt="Original" 
                className="original-img" 
                onLoad={handleImageLoad}
                draggable="false"
              />
              
              {/* Standard Box Selection */}
              {cropMode === 'standard' && imgDimensions.width > 0 && (
                <div 
                  className="crop-selection-box"
                  style={{
                    left: `${cropBox.x}px`,
                    top: `${cropBox.y}px`,
                    width: `${cropBox.width}px`,
                    height: `${cropBox.height}px`
                  }}
                  onMouseDown={(e) => handleCropMouseDown(e, 'move')}
                >
                  {/* Grid Lines (Rule of Thirds) */}
                  <div className="crop-grid-h1" />
                  <div className="crop-grid-h2" />
                  <div className="crop-grid-v1" />
                  <div className="crop-grid-v2" />

                  {/* Resizing Corners */}
                  <div className="crop-handle handle-nw" onMouseDown={(e) => handleCropMouseDown(e, 'nw')} />
                  <div className="crop-handle handle-ne" onMouseDown={(e) => handleCropMouseDown(e, 'ne')} />
                  <div className="crop-handle handle-sw" onMouseDown={(e) => handleCropMouseDown(e, 'sw')} />
                  <div className="crop-handle handle-se" onMouseDown={(e) => handleCropMouseDown(e, 'se')} />
                </div>
              )}

              {/* Free Lasso Draw Overlay */}
              {cropMode === 'free' && imgDimensions.width > 0 && (
                <canvas 
                  ref={lassoCanvasRef}
                  className="lasso-canvas"
                  onMouseDown={handleLassoMouseDown}
                  onMouseMove={handleLassoMouseMove}
                  onMouseUp={handleLassoMouseUp}
                  onMouseLeave={handleLassoMouseUp}
                />
              )}
            </div>
          </div>
        )}

        {croppedImage && (
          <div className="cropped-result-wrapper">
            <h3 className="header-font" style={{ marginBottom: '1rem', fontSize: '22px' }}>
              Nicely Cropped! ✨
            </h3>
            <div className="cropped-preview-card card-imperfect">
              <img src={croppedImage} alt="Cropped preview" className="cropped-img-preview" />
            </div>
            <div className="cropped-actions">
              <button className="btn" onClick={() => setCroppedImage(null)}>
                <X size={16} /> Recrop
              </button>
              <button className="btn btn-primary" onClick={handleSaveProject}>
                <Check size={16} /> Save to Canvas
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="sidebar">
        <h2 className="header-font" style={{ fontSize: '20px', marginBottom: '8px' }}>Cropper Menu</h2>
        <p className="text-12" style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Standard aspect-ratio scaling or freehand lasso cutout.
        </p>

        {imageSrc && !croppedImage && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
            {/* Mode selection tabs */}
            <div>
              <label className="text-12 header-font" style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Crop Mode
              </label>
              <div className="mode-toggle-group">
                <button 
                  className={`toggle-btn ${cropMode === 'standard' ? 'active' : ''}`}
                  onClick={() => {
                    setCropMode('standard');
                    setLassoPoints([]);
                  }}
                >
                  Standard Rectangle
                </button>
                <button 
                  className={`toggle-btn ${cropMode === 'free' ? 'active' : ''}`}
                  onClick={() => setCropMode('free')}
                >
                  Free Lasso Loop
                </button>
              </div>
            </div>

            {/* Standard Mode Ratios */}
            {cropMode === 'standard' && (
              <div>
                <label className="text-12 header-font" style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Preset Aspect Ratio
                </label>
                <div className="ratios-grid">
                  {['free', '1:1', '16:9', '4:3', '9:16'].map(ratio => (
                    <button 
                      key={ratio}
                      className={`ratio-btn ${aspectRatio === ratio ? 'active' : ''}`}
                      onClick={() => handleAspectRatioChange(ratio)}
                    >
                      {ratio === 'free' ? 'Any Size' : ratio}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Free Mode drawing instructions */}
            {cropMode === 'free' && (
              <div className="instructions-card card-imperfect">
                <h4 className="header-font" style={{ fontSize: '14px', marginBottom: '4px' }}>How to Lasso:</h4>
                <ol style={{ paddingLeft: '1.2rem', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <li>Click &amp; hold on the image.</li>
                  <li>Draw a loop around the object you want to extract.</li>
                  <li>Release the mouse to close the selection loop.</li>
                </ol>
                {lassoPoints.length > 0 && (
                  <button className="btn btn-danger" onClick={() => setLassoPoints([])} style={{ marginTop: '1rem', width: '100%', padding: '0.3rem', fontSize: '13px' }}>
                    <Trash2 size={14} /> Clear Drawing
                  </button>
                )}
              </div>
            )}

            {/* Shared workspace actions */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn" onClick={handleReset}>
                <RefreshCw size={16} /> Reset Crop Selection
              </button>
              <button 
                className="btn btn-primary" 
                onClick={performCrop}
                disabled={cropMode === 'free' && lassoPoints.length < 3}
                style={{
                  opacity: cropMode === 'free' && lassoPoints.length < 3 ? 0.6 : 1,
                  cursor: cropMode === 'free' && lassoPoints.length < 3 ? 'not-allowed' : 'pointer'
                }}
              >
                <Scissors size={16} /> Crop Image
              </button>
              <button className="btn" onClick={() => setImageSrc(null)} style={{ border: '2px solid #ea5455', color: '#ea5455' }}>
                <Trash2 size={16} /> Select New Image
              </button>
            </div>
          </div>
        )}

        {croppedImage && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', justifyContent: 'flex-end' }}>
            <button className="btn" onClick={handleDownload} style={{ width: '100%', background: 'var(--accent-secondary)', color: 'white' }}>
              <Download size={16} /> Direct Download (PNG)
            </button>
            <button className="btn btn-primary" onClick={handleSaveProject} style={{ width: '100%' }}>
              <Check size={16} /> Send to Smart-Fit Workspace
            </button>
          </div>
        )}

        {!imageSrc && (
          <div style={{ marginTop: 'auto', color: 'var(--text-muted)' }} className="text-12">
            <p style={{ marginBottom: '8px' }}>High-fidelity Lasso selection</p>
            <p style={{ marginBottom: '8px' }}>Transparent PNG cutout output</p>
            <p>100% Secure &amp; local processing</p>
          </div>
        )}
      </div>
    </div>
  );
}
