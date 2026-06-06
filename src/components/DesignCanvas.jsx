import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Image as ImageIcon, Text as TextIcon, Edit3, Trash2, Eye, EyeOff, 
  Layers, Upload, Move, Maximize2, Minimize2, ChevronUp, ChevronDown, Check,
  Download, Type, Compass, HelpCircle, ShieldAlert, Sparkles
} from 'lucide-react';
import { get, set } from 'idb-keyval';
import ColorPicker from './ColorPicker';
import './DesignCanvas.css';

export default function DesignCanvas({ onBack, projectName }) {
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [toolMode, setToolMode] = useState('select'); // 'select', 'draw', 'text'
  const [canvasSize] = useState({ width: 800, height: 600 });
  const [isSecureStore, setIsSecureStore] = useState(true);

  // Brush settings
  const [brushColor, setBrushColor] = useState('#e67e5a');
  const [brushWidth, setBrushWidth] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);

  // Font imports
  const [importedFonts, setImportedFonts] = useState([]);
  const [selectedFont, setSelectedFont] = useState('Inter');

  // Aspect ratio lock
  const [isRatioLocked, setIsRatioLocked] = useState(false);

  // Dragging and resizing state for selected layer
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [layerStartPos, setLayerStartPos] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [activeHandle, setActiveHandle] = useState(null); // 'move', 'nw', 'ne', 'sw', 'se'

  const drawingCanvasRef = useRef(null);
  const viewportRef = useRef(null);

  // Load project state from IndexedDB (Secure client-side persistence) on mount
  useEffect(() => {
    get(`jct-canvas-project-${projectName || 'default'}`).then((saved) => {
      if (saved) {
        setLayers(saved.layers || []);
        // Load custom fonts if they are saved in the project
        if (saved.importedFonts) {
          saved.importedFonts.forEach(fontData => {
            loadFontFromDataUrl(fontData.name, fontData.dataUrl);
          });
          setImportedFonts(saved.importedFonts);
        }
      }
    });
  }, [projectName]);

  // Save project state automatically when layers or fonts change
  useEffect(() => {
    const projectState = {
      layers,
      importedFonts,
      updatedAt: Date.now()
    };
    set(`jct-canvas-project-${projectName || 'default'}`, projectState);
  }, [layers, importedFonts, projectName]);

  // Load a font dynamically into the document
  const loadFontFromDataUrl = async (name, dataUrl) => {
    try {
      const response = await fetch(dataUrl);
      const arrayBuffer = await response.arrayBuffer();
      const font = new FontFace(name, arrayBuffer);
      await font.load();
      document.fonts.add(font);
    } catch (e) {
      console.error('Error loading custom font:', e);
    }
  };

  // Handle custom font file upload
  const handleFontUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      await loadFontFromDataUrl(fontName, dataUrl);
      
      const newFontObj = { name: fontName, dataUrl };
      setImportedFonts(prev => [...prev, newFontObj]);
      setSelectedFont(fontName);
      
      // If a text layer is selected, apply the font directly
      if (selectedLayerId) {
        setLayers(prev => prev.map(layer => {
          if (layer.id === selectedLayerId && layer.type === 'text') {
            return { ...layer, fontFamily: fontName };
          }
          return layer;
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Image Upload handler
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const img = new Image();
      img.onload = () => {
        // Calculate nice centered positioning
        const maxW = 400;
        const scale = Math.min(maxW / img.width, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        
        const newLayer = {
          id: Date.now(),
          type: 'image',
          name: file.name,
          dataUrl,
          x: (canvasSize.width - w) / 2,
          y: (canvasSize.height - h) / 2,
          width: w,
          height: h,
          aspectRatio: w / h,
          opacity: 100,
          visible: true,
          brightness: 100,
          contrast: 100,
          saturation: 100,
          blur: 0,
          hueRotate: 0
        };
        
        setLayers(prev => [...prev, newLayer]);
        setSelectedLayerId(newLayer.id);
        setToolMode('select');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Generate Organic Background Layer
  const generateOrganicBackground = async () => {
    const w = 800;
    const h = 600;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#141413';
    ctx.fillRect(0, 0, w, h);

    const particles = Array.from({length: 3000}, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      life: Math.random() * 50
    }));

    ctx.lineWidth = 1;
    for(let i=0; i<100; i++) {
      for(let p of particles) {
        if(p.life <= 0) continue;
        const angle = Math.sin(p.x * 0.01) + Math.cos(p.y * 0.01) * Math.PI * 2;
        const speed = 2;
        const nx = p.x + Math.cos(angle) * speed;
        const ny = p.y + Math.sin(angle) * speed;
        
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nx, ny);
        
        const hue = (p.x/w) * 60 + 200;
        ctx.strokeStyle = `hsla(${hue}, 80%, 60%, 0.1)`;
        ctx.stroke();
        
        p.x = nx;
        p.y = ny;
        p.life--;
      }
    }

    const dataUrl = canvas.toDataURL('image/png');
    const newLayer = {
      id: Date.now(),
      type: 'image',
      name: 'Organic Pattern',
      dataUrl,
      x: 0,
      y: 0,
      width: w,
      height: h,
      aspectRatio: w / h,
      opacity: 100,
      visible: true,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      hueRotate: 0
    };
    
    setLayers(prev => [newLayer, ...prev]);
    setSelectedLayerId(newLayer.id);
    setToolMode('select');
  };

  // Add a new Text Layer
  const addTextLayer = () => {
    const newLayer = {
      id: Date.now(),
      type: 'text',
      name: 'Text Layer',
      text: 'Double click to edit',
      x: (canvasSize.width - 200) / 2,
      y: (canvasSize.height - 40) / 2,
      width: 200,
      height: 40,
      fontSize: 24,
      fontFamily: selectedFont,
      color: '#2d2a26',
      opacity: 100,
      visible: true
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    setToolMode('select');
  };

  // Freehand Drawing initialization
  useEffect(() => {
    if (toolMode !== 'draw') return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [toolMode]);

  const startDrawing = (e) => {
    if (toolMode !== 'draw') return;
    e.preventDefault();
    setIsDrawing(true);
    const canvas = drawingCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushWidth;
  };

  const draw = (e) => {
    if (!isDrawing || toolMode !== 'draw') return;
    const canvas = drawingCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || toolMode !== 'draw') return;
    setIsDrawing(false);

    // Save the drawing as an image layer
    const canvas = drawingCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const dataUrl = canvas.toDataURL();

    // Check if anything was actually drawn
    const newLayer = {
      id: Date.now(),
      type: 'image',
      name: `Sketch Layer`,
      dataUrl,
      x: 0,
      y: 0,
      width: canvasSize.width,
      height: canvasSize.height,
      aspectRatio: canvasSize.width / canvasSize.height,
      opacity: 100,
      visible: true,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      hueRotate: 0
    };

    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    setToolMode('select');

    // Clear the drawing surface
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Selection Dragging and Resizing Logic
  const handleViewportMouseDown = (e, layer, handle = 'move') => {
    if (toolMode !== 'select') return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedLayerId(layer.id);
    setActiveHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setLayerStartPos({ x: layer.x, y: layer.y, width: layer.width, height: layer.height });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!activeHandle || selectedLayerId === null) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      setLayers(prev => prev.map(layer => {
        if (layer.id !== selectedLayerId) return layer;

        if (activeHandle === 'move') {
          return {
            ...layer,
            x: layerStartPos.x + dx,
            y: layerStartPos.y + dy
          };
        }

        // Resizing logic
        let w = layerStartPos.width;
        let h = layerStartPos.height;
        let x = layerStartPos.x;
        let y = layerStartPos.y;

        if (activeHandle.includes('se')) {
          w = Math.max(20, layerStartPos.width + dx);
          if (isRatioLocked) {
            h = w / layer.aspectRatio;
          } else {
            h = Math.max(20, layerStartPos.height + dy);
          }
        } else if (activeHandle.includes('ne')) {
          w = Math.max(20, layerStartPos.width + dx);
          if (isRatioLocked) {
            h = w / layer.aspectRatio;
          } else {
            h = Math.max(20, layerStartPos.height - dy);
          }
          y = layerStartPos.y - (h - layerStartPos.height);
        } else if (activeHandle.includes('sw')) {
          w = Math.max(20, layerStartPos.width - dx);
          x = layerStartPos.x + (layerStartPos.width - w);
          if (isRatioLocked) {
            h = w / layer.aspectRatio;
          } else {
            h = Math.max(20, layerStartPos.height + dy);
          }
        } else if (activeHandle.includes('nw')) {
          w = Math.max(20, layerStartPos.width - dx);
          x = layerStartPos.x + (layerStartPos.width - w);
          if (isRatioLocked) {
            h = w / layer.aspectRatio;
          } else {
            h = Math.max(20, layerStartPos.height - dy);
          }
          y = layerStartPos.y - (h - layerStartPos.height);
        }

        return {
          ...layer,
          x, y, width: w, height: h
        };
      }));
    };

    const handleMouseUp = () => {
      setActiveHandle(null);
    };

    if (activeHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeHandle, selectedLayerId, dragStart, layerStartPos, isRatioLocked]);

  // Selected Layer Adjuster
  const updateSelectedLayerProperty = (property, value) => {
    if (!selectedLayerId) return;
    setLayers(prev => prev.map(layer => {
      if (layer.id === selectedLayerId) {
        return { ...layer, [property]: value };
      }
      return layer;
    }));
  };

  const getSelectedLayer = () => {
    return layers.find(l => l.id === selectedLayerId);
  };

  // Layer Arrangement ordering
  const moveLayer = (direction) => {
    if (!selectedLayerId) return;
    const index = layers.findIndex(l => l.id === selectedLayerId);
    if (index === -1) return;

    const newLayers = [...layers];
    if (direction === 'forward' && index < layers.length - 1) {
      const temp = newLayers[index];
      newLayers[index] = newLayers[index + 1];
      newLayers[index + 1] = temp;
    } else if (direction === 'backward' && index > 0) {
      const temp = newLayers[index];
      newLayers[index] = newLayers[index - 1];
      newLayers[index - 1] = temp;
    } else if (direction === 'front') {
      const temp = newLayers[index];
      newLayers.splice(index, 1);
      newLayers.push(temp);
    } else if (direction === 'back') {
      const temp = newLayers[index];
      newLayers.splice(index, 1);
      newLayers.unshift(temp);
    }
    setLayers(newLayers);
  };

  const toggleLayerVisibility = (id) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const deleteLayer = (id) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  // Helper to compile CSS filters for adjustments
  const getFilterString = (layer) => {
    if (layer.type !== 'image') return 'none';
    return `brightness(${layer.brightness}%) contrast(${layer.contrast}%) saturate(${layer.saturation}%) blur(${layer.blur}px) hue-rotate(${layer.hueRotate}deg)`;
  };

  const exportCanvasAsPNG = () => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    const ctx = canvas.getContext('2d');
    
    // Fill transparent or white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let loadedCount = 0;
    const visibleLayers = layers.filter(l => l.visible);

    if (visibleLayers.length === 0) {
      // Just download blank white page
      triggerDownload(canvas.toDataURL());
      return;
    }

    const drawLayerToCanvas = (layer, imgElement = null) => {
      ctx.save();
      ctx.globalAlpha = layer.opacity / 100;
      
      if (layer.type === 'image' && imgElement) {
        // Apply filters to canvas context where supported
        ctx.filter = `brightness(${layer.brightness}%) contrast(${layer.contrast}%) saturate(${layer.saturation}%) blur(${layer.blur}px) hue-rotate(${layer.hueRotate}deg)`;
        ctx.drawImage(imgElement, layer.x, layer.y, layer.width, layer.height);
      } else if (layer.type === 'text') {
        ctx.fillStyle = layer.color;
        ctx.font = `${layer.fontSize}px "${layer.fontFamily}"`;
        ctx.textBaseline = 'top';
        ctx.fillText(layer.text, layer.x, layer.y);
      }
      ctx.restore();
    };

    visibleLayers.forEach(layer => {
      if (layer.type === 'image') {
        const img = new Image();
        img.onload = () => {
          drawLayerToCanvas(layer, img);
          loadedCount++;
          if (loadedCount === visibleLayers.length) {
            triggerDownload(canvas.toDataURL());
          }
        };
        img.src = layer.dataUrl;
      } else {
        drawLayerToCanvas(layer);
        loadedCount++;
        if (loadedCount === visibleLayers.length) {
          triggerDownload(canvas.toDataURL());
        }
      }
    });
  };

  const triggerDownload = (dataUrl) => {
    const link = document.createElement('a');
    link.download = `${projectName || 'JCT-Design'}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Export project state as a portable .jct JSON file
  const exportAsJCT = () => {
    const projectData = {
      fileType: 'JCT_PROJECT',
      version: '1.0',
      projectName: projectName || 'Untitled Design',
      layers,
      importedFonts
    };

    const jsonString = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `${projectName || 'JCT-Design'}.jct`;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
  };

  // Import project state from a uploaded .jct file
  const handleJCTImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        if (parsedData.fileType !== 'JCT_PROJECT') {
          alert('Invalid file format. Please upload a valid .jct project file.');
          return;
        }

        // Restore layers
        setLayers(parsedData.layers || []);

        // Restore custom fonts if present
        if (parsedData.importedFonts) {
          parsedData.importedFonts.forEach(fontData => {
            loadFontFromDataUrl(fontData.name, fontData.dataUrl);
          });
          setImportedFonts(parsedData.importedFonts);
        }

        setSelectedLayerId(null);
      } catch (err) {
        console.error('Error importing .jct file:', err);
        alert('Could not read .jct file. It may be corrupted.');
      }
    };
    reader.readAsText(file);
  };

  const selectedLayer = getSelectedLayer();

  return (
    <div className="design-canvas-container">
      {/* LEFT SIDEBAR: Adjustments and Editing Tools */}
      <aside className="design-left-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <button className="btn back-btn" onClick={onBack} style={{ padding: '0.4rem', boxShadow: '2px 2px 0px black' }}>
            <ArrowLeft size={16} />
          </button>
          <h1 className="header-font" style={{ fontSize: '18px' }}>Design Canvas</h1>
        </div>

        {/* Toolbar Modes */}
        <div className="control-section">
          <label className="control-title">Tools</label>
          <div className="toggle-group">
            <button 
              className={`toggle-btn ${toolMode === 'select' ? 'active' : ''}`}
              onClick={() => setToolMode('select')}
            >
              Select &amp; Resize
            </button>
            <button 
              className={`toggle-btn ${toolMode === 'draw' ? 'active' : ''}`}
              onClick={() => setToolMode('draw')}
            >
              Pen Tool
            </button>
          </div>
        </div>

        {/* Pen Tool configurations */}
        {toolMode === 'draw' && (
          <div className="control-section" style={{ background: 'var(--bg-panel-hover)', padding: '0.75rem', borderRadius: '8px', border: '2px solid var(--text-primary)' }}>
            <label className="control-title" style={{ fontSize: '12px' }}>Pen Configurations</label>
            <div className="color-picker-wrapper">
              <span className="slider-label" style={{ fontSize: '12px', flex: 1, marginBottom: '8px' }}>Brush Color:</span>
              <ColorPicker 
                color={brushColor} 
                onChange={setBrushColor}
              />
            </div>
            <div className="slider-group" style={{ marginTop: '0.5rem' }}>
              <div className="slider-label">
                <span>Brush Width:</span>
                <span>{brushWidth}px</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={brushWidth} 
                onChange={(e) => setBrushWidth(parseInt(e.target.value))}
                className="slider-input"
              />
            </div>
          </div>
        )}

        {/* Selected Layer Properties */}
        {selectedLayer && (
          <div className="control-section" style={{ background: 'var(--bg-panel-hover)', padding: '0.75rem', borderRadius: '8px', border: '2px solid var(--text-primary)' }}>
            <label className="control-title" style={{ fontSize: '12px' }}>Layer Settings</label>
            
            {/* Opacity slider for all layers */}
            <div className="slider-group">
              <div className="slider-label">
                <span>Opacity:</span>
                <span>{selectedLayer.opacity}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={selectedLayer.opacity} 
                onChange={(e) => updateSelectedLayerProperty('opacity', parseInt(e.target.value))}
                className="slider-input"
              />
            </div>

            {/* Text Customizations */}
            {selectedLayer.type === 'text' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div className="slider-group">
                  <span className="slider-label" style={{ fontSize: '12px' }}>Text Content:</span>
                  <input 
                    type="text" 
                    value={selectedLayer.text} 
                    onChange={(e) => updateSelectedLayerProperty('text', e.target.value)}
                    style={{ border: '2px solid var(--text-primary)', padding: '4px 8px', borderRadius: '4px', width: '100%', fontSize: '14px' }}
                  />
                </div>
                <div className="slider-group">
                  <span className="slider-label">Font Family:</span>
                  <select 
                    value={selectedLayer.fontFamily} 
                    onChange={(e) => updateSelectedLayerProperty('fontFamily', e.target.value)}
                    style={{ border: '2px solid var(--text-primary)', padding: '4px 8px', borderRadius: '4px', fontSize: '13px' }}
                  >
                    <option value="Inter">Standard (Inter)</option>
                    <option value="Space Grotesk">Headline (Space Grotesk)</option>
                    {importedFonts.map(font => (
                      <option key={font.name} value={font.name}>{font.name} (Custom)</option>
                    ))}
                  </select>
                </div>
                <div className="slider-group">
                  <div className="slider-label">
                    <span>Font Size:</span>
                    <span>{selectedLayer.fontSize}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={selectedLayer.fontSize} 
                    onChange={(e) => updateSelectedLayerProperty('fontSize', parseInt(e.target.value))}
                    className="slider-input"
                  />
                </div>
                <div className="color-picker-wrapper" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span className="slider-label" style={{ marginBottom: '8px' }}>Text Color:</span>
                  <ColorPicker 
                    color={selectedLayer.color} 
                    onChange={(c) => updateSelectedLayerProperty('color', c)}
                  />
                </div>
              </div>
            )}

            {/* Image Adjustments & Color Grading */}
            {selectedLayer.type === 'image' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div className="slider-group">
                  <div className="slider-label">
                    <span>Brightness:</span>
                    <span>{selectedLayer.brightness}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="200" 
                    value={selectedLayer.brightness} 
                    onChange={(e) => updateSelectedLayerProperty('brightness', parseInt(e.target.value))}
                    className="slider-input"
                  />
                </div>
                <div className="slider-group">
                  <div className="slider-label">
                    <span>Contrast:</span>
                    <span>{selectedLayer.contrast}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="200" 
                    value={selectedLayer.contrast} 
                    onChange={(e) => updateSelectedLayerProperty('contrast', parseInt(e.target.value))}
                    className="slider-input"
                  />
                </div>
                <div className="slider-group">
                  <div className="slider-label">
                    <span>Saturation:</span>
                    <span>{selectedLayer.saturation}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="200" 
                    value={selectedLayer.saturation} 
                    onChange={(e) => updateSelectedLayerProperty('saturation', parseInt(e.target.value))}
                    className="slider-input"
                  />
                </div>
                <div className="slider-group">
                  <div className="slider-label">
                    <span>Hue Rotate:</span>
                    <span>{selectedLayer.hueRotate}°</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="360" 
                    value={selectedLayer.hueRotate} 
                    onChange={(e) => updateSelectedLayerProperty('hueRotate', parseInt(e.target.value))}
                    className="slider-input"
                  />
                </div>
                <div className="slider-group">
                  <div className="slider-label">
                    <span>Blur:</span>
                    <span>{selectedLayer.blur}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="20" 
                    value={selectedLayer.blur} 
                    onChange={(e) => updateSelectedLayerProperty('blur', parseInt(e.target.value))}
                    className="slider-input"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* MIDDLE WORKSPACE: Canvas and Viewport */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Canvas Toolbar Header */}
        <div className="canvas-top-bar">
          <div className="tool-group-horizontal">
            {/* Aspect ratio control */}
            <button 
              className={`btn btn-small ${isRatioLocked ? 'btn-primary' : ''}`}
              onClick={() => setIsRatioLocked(!isRatioLocked)}
            >
              {isRatioLocked ? 'Ratio: Locked' : 'Ratio: Free'}
            </button>

            {/* Custom font import */}
            <label className="btn btn-small" style={{ cursor: 'pointer' }}>
              <Upload size={14} /> Import Font
              <input 
                type="file" 
                accept=".ttf,.otf,.woff,.woff2" 
                onChange={handleFontUpload} 
                style={{ display: 'none' }} 
              />
            </label>

            {/* Custom .jct file import */}
            <label className="btn btn-small" style={{ cursor: 'pointer', background: 'rgba(116, 160, 137, 0.15)', border: '2px solid var(--accent-secondary)' }}>
              <Upload size={14} /> Import .JCT
              <input 
                type="file" 
                accept=".jct" 
                onChange={handleJCTImport} 
                style={{ display: 'none' }} 
              />
            </label>
          </div>

          <div className="tool-group-horizontal">
            {/* Import photo / elements */}
            <label className="btn btn-small btn-primary" style={{ cursor: 'pointer' }}>
              <ImageIcon size={14} /> Add Image
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                style={{ display: 'none' }} 
              />
            </label>

            {/* Add text layer */}
            <button className="btn btn-small btn-primary" onClick={addTextLayer}>
              <TextIcon size={14} /> Add Text
            </button>

            {/* Generate Organic Background Layer */}
            <button className="btn btn-small btn-primary" onClick={generateOrganicBackground}>
              <Sparkles size={14} /> Add Pattern
            </button>

            {/* Export PNG */}
            <button className="btn btn-small" style={{ background: 'var(--accent-highlight)' }} onClick={exportCanvasAsPNG}>
              <Download size={14} /> Export PNG
            </button>

            {/* Export .jct project */}
            <button className="btn btn-small btn-primary" onClick={exportAsJCT}>
              <Download size={14} /> Export .JCT
            </button>
          </div>
        </div>

        {/* The design workspace */}
        <div className="design-workspace" onClick={() => setSelectedLayerId(null)}>
          <div 
            ref={viewportRef}
            className={`canvas-viewport ${toolMode === 'draw' ? 'drawing-mode' : ''}`}
            style={{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px` }}
          >
            {/* Render Layers */}
            {layers.map(layer => {
              if (!layer.visible) return null;
              
              return (
                <div 
                  key={layer.id}
                  className="canvas-layer-element"
                  style={{
                    left: `${layer.x}px`,
                    top: `${layer.y}px`,
                    width: `${layer.width}px`,
                    height: `${layer.height}px`,
                    zIndex: layers.findIndex(l => l.id === layer.id) + 1,
                    opacity: layer.opacity / 100
                  }}
                  onMouseDown={(e) => handleViewportMouseDown(e, layer, 'move')}
                  onClick={(e) => e.stopPropagation()}
                  draggable="false"
                  onDragStart={(e) => e.preventDefault()}
                >
                  {layer.type === 'image' ? (
                    <img 
                      src={layer.dataUrl} 
                      alt={layer.name}
                      style={{ filter: getFilterString(layer) }}
                      draggable="false"
                      onDragStart={(e) => e.preventDefault()}
                    />
                  ) : (
                    <p style={{ 
                      fontSize: `${layer.fontSize}px`, 
                      fontFamily: `"${layer.fontFamily}", sans-serif`,
                      color: layer.color
                    }}>
                      {layer.text}
                    </p>
                  )}
                </div>
              );
            })}

            {/* Drawing overlay when in draw tool mode */}
            {toolMode === 'draw' && (
              <canvas
                ref={drawingCanvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                className="drawing-overlay-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            )}

            {/* Active layer selection bounding box with resize handles */}
            {selectedLayer && toolMode === 'select' && (
              <div 
                className="selection-bounding-box"
                style={{
                  left: `${selectedLayer.x}px`,
                  top: `${selectedLayer.y}px`,
                  width: `${selectedLayer.width}px`,
                  height: `${selectedLayer.height}px`,
                  zIndex: 9999
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Resize corner handles */}
                <div className="resize-handle handle-nw" onMouseDown={(e) => handleViewportMouseDown(e, selectedLayer, 'nw')} onClick={(e) => e.stopPropagation()} />
                <div className="resize-handle handle-ne" onMouseDown={(e) => handleViewportMouseDown(e, selectedLayer, 'ne')} onClick={(e) => e.stopPropagation()} />
                <div className="resize-handle handle-sw" onMouseDown={(e) => handleViewportMouseDown(e, selectedLayer, 'sw')} onClick={(e) => e.stopPropagation()} />
                <div className="resize-handle handle-se" onMouseDown={(e) => handleViewportMouseDown(e, selectedLayer, 'se')} onClick={(e) => e.stopPropagation()} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR: Layers List and Depth Arrangements */}
      <aside className="design-right-panel">
        {/* Layer depth controls */}
        {selectedLayer && (
          <div className="control-section">
            <label className="control-title">Arrange Elements</label>
            <div className="button-grid-2x2">
              <button className="btn btn-small" onClick={() => moveLayer('forward')}>
                Bring Forward
              </button>
              <button className="btn btn-small" onClick={() => moveLayer('backward')}>
                Send Backward
              </button>
              <button className="btn btn-small" onClick={() => moveLayer('front')}>
                Bring to Front
              </button>
              <button className="btn btn-small" onClick={() => moveLayer('back')}>
                Send to Back
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Layer Stack panel */}
        <div className="control-section" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label className="control-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Layers size={16} /> Layers Stack
          </label>
          <div className="layer-list">
            {layers.slice().reverse().map((layer, index) => (
              <div 
                key={layer.id}
                className={`layer-item ${selectedLayerId === layer.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedLayerId(layer.id);
                  setToolMode('select');
                }}
              >
                <div style={{ marginRight: '4px' }}>
                  {layer.type === 'image' ? <ImageIcon size={14} /> : <Type size={14} />}
                </div>
                <span className="layer-name">{layer.name}</span>
                
                {/* Visibility toggler */}
                <button 
                  className="layer-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(layer.id);
                  }}
                >
                  {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>

                {/* Delete button */}
                <button 
                  className="layer-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLayer(layer.id);
                  }}
                  style={{ color: '#d9534f' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            
            {layers.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '2rem' }}>
                No layers added yet. Import an image or add text to start.
              </div>
            )}
          </div>
        </div>

        {/* Security / Cookie Verification Badge */}
        <div 
          style={{ 
            marginTop: 'auto', 
            background: 'rgba(116, 160, 137, 0.1)', 
            border: '2px solid var(--accent-secondary)', 
            padding: '0.75rem', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '0.5rem' 
          }}
        >
          <Compass size={16} style={{ color: 'var(--accent-secondary)', marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>SECURE STORAGE</h4>
            <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Your workspace is stored locally using an encrypted state. We do not use unsafe trackers.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
