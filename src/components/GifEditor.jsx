import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Play, Pause, Download, Layers, Type, Smile, Brush, 
  Trash2, Camera, Sparkles, Upload, Clock, Plus, Copy, RefreshCw, X, ChevronRight, ChevronLeft
} from 'lucide-react';
import { parseGIF, decompressFrames } from 'gifuct-js';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import ColorPicker from './ColorPicker';
import './GifEditor.css';

// Popular stickers and emojis for instant creative fun
const PRESET_EMOJIS = [
  '🔥', '✨', '😂', '😍', '👑', '🎉', '❤️', '🙌', '🚀', '💥', 
  '🌈', '🎨', '🍕', '🐱', '🐶', '💀', '💯', '👾', '💖', '🌟',
  '😎', '💩', '🍦', '🍩', '🥑', '🎈', '👻', '👽', '🦄', '🍀'
];

const PRESET_COLORS = [
  '#000000', '#ffffff', '#e67e5a', '#74a089', '#f9d371', 
  '#4a90e2', '#d0021b', '#bd10e0', '#f5a623', '#7ed321'
];

export default function GifEditor({ onBack }) {
  // Navigation / Upload states
  const [frames, setFrames] = useState([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  
  // Custom webcam capture states
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isWebcamRecording, setIsWebcamRecording] = useState(false);
  const [webcamCountdown, setWebcamCountdown] = useState(0);
  const [webcamStream, setWebcamStream] = useState(null);
  const webcamVideoRef = useRef(null);

  // Creative Overlay Layers
  const [textLayers, setTextLayers] = useState([]);
  const [emojiLayers, setEmojiLayers] = useState([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState(null);

  // Selected tool states
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'emoji' | 'draw' | 'settings'
  const [newText, setNewText] = useState('My text');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textStrokeColor, setTextStrokeColor] = useState('#000000');
  const [textSize, setTextSize] = useState(24);

  // Drawing Brush states
  const [brushMode, setBrushMode] = useState('none'); // 'none' | 'draw' | 'eraser'
  const [brushColor, setBrushColor] = useState('#e67e5a');
  const [brushSize, setBrushSize] = useState(8);
  const [frameDrawings, setFrameDrawings] = useState({}); // { [frameIndex]: base64DataUrl }
  const drawingCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  // Frame Timing speed adjust
  const [globalDelay, setGlobalDelay] = useState(100);

  // Export compiling states
  const [exportState, setExportState] = useState('idle'); // 'idle' | 'rendering' | 'complete' | 'error'
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedGifUrl, setExportedGifUrl] = useState('');

  // Handle Toast Notifications
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Re-synchronize brush canvas size when active frame updates
  useEffect(() => {
    if (frames.length > 0 && drawingCanvasRef.current) {
      const activeFrame = frames[currentFrameIndex];
      const canvas = drawingCanvasRef.current;
      if (canvas.width !== activeFrame.width || canvas.height !== activeFrame.height) {
        canvas.width = activeFrame.width;
        canvas.height = activeFrame.height;
      }
      loadFrameDrawing(currentFrameIndex);
    }
  }, [currentFrameIndex, frames]);

  // Handle preview playing sequence
  useEffect(() => {
    let playTimeout;
    if (isPlaying && frames.length > 1) {
      const delay = frames[currentFrameIndex]?.delay || globalDelay || 100;
      playTimeout = setTimeout(() => {
        // Save drawing before moving
        saveCurrentFrameDrawing();
        setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
      }, delay);
    }
    return () => clearTimeout(playTimeout);
  }, [isPlaying, currentFrameIndex, frames, globalDelay]);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [webcamStream]);

  // Parse uploaded GIF using gifuct-js
  const handleGifUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'image/gif') {
      showToast('Please upload a valid GIF file!');
      return;
    }

    setProjectName(file.name.replace(/\.[^/.]+$/, ""));
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target.result;
        showToast('Parsing GIF file...');
        const parsed = parseGIF(buffer);
        const decompressed = decompressFrames(parsed, true);

        if (!decompressed || decompressed.length === 0) {
          showToast('Failed to parse any frames from the GIF.');
          return;
        }

        const width = parsed.lsd.width;
        const height = parsed.lsd.height;

        // Composite frames sequentially to handle transparency and disposal methods properly
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        const reconstructed = [];
        let prevCanvasData = null;

        for (let i = 0; i < decompressed.length; i++) {
          const frame = decompressed[i];
          
          // Save backup for restore disposal
          const backup = ctx.getImageData(0, 0, width, height);

          // Apply previous disposal method before drawing current frame
          if (i > 0) {
            const prevFrame = decompressed[i - 1];
            if (prevFrame.disposalType === 2) {
              // Restore to background (clear bounding box)
              ctx.clearRect(prevFrame.dims.left, prevFrame.dims.top, prevFrame.dims.width, prevFrame.dims.height);
            } else if (prevFrame.disposalType === 3 && prevCanvasData) {
              // Restore to previous composite canvas state
              ctx.putImageData(prevCanvasData, 0, 0);
            }
          }

          // Remember current canvas state in case the next frame disposes with "restore to previous"
          prevCanvasData = ctx.getImageData(0, 0, width, height);

          // Draw current frame patch onto main compositor canvas
          const patchData = new ImageData(frame.patch, frame.dims.width, frame.dims.height);
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = frame.dims.width;
          tempCanvas.height = frame.dims.height;
          tempCanvas.getContext('2d').putImageData(patchData, 0, 0);

          ctx.drawImage(tempCanvas, frame.dims.left, frame.dims.top);

          // Capture the composited output as a PNG DataURL
          const frameCanvas = document.createElement('canvas');
          frameCanvas.width = width;
          frameCanvas.height = height;
          frameCanvas.getContext('2d').putImageData(ctx.getImageData(0, 0, width, height), 0, 0);

          reconstructed.push({
            dataUrl: frameCanvas.toDataURL('image/png'),
            delay: frame.delay || 100,
            width,
            height
          });
        }

        setFrames(reconstructed);
        setFrameDrawings({});
        setTextLayers([]);
        setEmojiLayers([]);
        setCurrentFrameIndex(0);
        showToast(`Imported ${reconstructed.length} frames successfully!`);
      } catch (err) {
        console.error(err);
        showToast('Error parsing GIF file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Webcam Capture methods
  const openWebcam = async () => {
    setIsWebcamActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 300, facingMode: 'user' }
      });
      setWebcamStream(stream);
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      showToast('Could not access webcam. Check permissions.');
      setIsWebcamActive(false);
    }
  };

  const closeWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    setIsWebcamActive(false);
    setIsWebcamRecording(false);
  };

  const captureWebcamBurst = () => {
    if (!webcamStream || !webcamVideoRef.current) return;
    setIsWebcamRecording(true);
    setWebcamCountdown(3);

    // Initial countdown of 3 seconds
    let count = 3;
    const countInterval = setInterval(() => {
      count -= 1;
      setWebcamCountdown(count);
      if (count === 0) {
        clearInterval(countInterval);
        startRecordingFrames();
      }
    }, 1000);
  };

  const startRecordingFrames = () => {
    const video = webcamVideoRef.current;
    const width = video.videoWidth || 400;
    const height = video.videoHeight || 300;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const recorded = [];
    const maxFrames = 20; // 20 frames total
    const captureInterval = 150; // every 150ms

    let frameCount = 0;
    const timer = setInterval(() => {
      // Mirror feed like camera
      ctx.clearRect(0, 0, width, height);
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset scale

      recorded.push({
        dataUrl: canvas.toDataURL('image/png'),
        delay: captureInterval,
        width,
        height
      });

      frameCount++;
      if (frameCount >= maxFrames) {
        clearInterval(timer);
        setFrames(recorded);
        setFrameDrawings({});
        setTextLayers([]);
        setEmojiLayers([]);
        setCurrentFrameIndex(0);
        setProjectName(`Webcam Session ${new Date().toLocaleTimeString()}`);
        showToast('Recorded 20 animated frames!');
        closeWebcam();
      }
    }, captureInterval);
  };

  // Drawing Canvas actions
  const saveCurrentFrameDrawing = () => {
    if (!drawingCanvasRef.current) return;
    const canvas = drawingCanvasRef.current;
    const dataUrl = canvas.toDataURL();
    setFrameDrawings(prev => ({
      ...prev,
      [currentFrameIndex]: dataUrl
    }));
  };

  const loadFrameDrawing = (index) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const savedUrl = frameDrawings[index];
    if (savedUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = savedUrl;
    }
  };

  const clearDrawing = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    setFrameDrawings(prev => {
      const copy = { ...prev };
      delete copy[currentFrameIndex];
      return copy;
    });
    showToast('Drawing cleared for this frame');
  };

  // Brush canvas mouse/pointer events
  const handleDrawingStart = (e) => {
    if (brushMode === 'none') return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (brushMode === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = brushColor;
    }
    
    isDrawingRef.current = true;
  };

  const handleDrawingMove = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleDrawingEnd = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    saveCurrentFrameDrawing();
  };

  // Overlays addition
  const addTextLayer = () => {
    if (!newText.trim()) return;
    const newLayer = {
      id: `text-${Date.now()}`,
      text: newText,
      x: 50, // center (percentage)
      y: 35,
      color: textColor,
      strokeColor: textStrokeColor,
      fontSize: textSize,
      isGlobal: true,
      frameIndex: currentFrameIndex
    };
    setTextLayers(prev => [...prev, newLayer]);
    setSelectedOverlayId(newLayer.id);
    showToast('Added Text Layer');
  };

  const addEmojiLayer = (emoji) => {
    const newLayer = {
      id: `emoji-${Date.now()}`,
      emoji: emoji,
      x: 50,
      y: 50,
      fontSize: 48,
      isGlobal: true,
      frameIndex: currentFrameIndex
    };
    setEmojiLayers(prev => [...prev, newLayer]);
    setSelectedOverlayId(newLayer.id);
    showToast('Added Sticker');
  };

  // Pointer dragging logic for overlays
  const handleOverlayPointerDown = (e, layerId) => {
    e.preventDefault();
    setSelectedOverlayId(layerId);
    
    const element = e.currentTarget;
    const wrapper = element.parentElement;
    const rect = wrapper.getBoundingClientRect();
    
    const handlePointerMove = (moveEvent) => {
      const xPercent = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const yPercent = ((moveEvent.clientY - rect.top) / rect.height) * 100;
      
      const boundedX = Math.max(0, Math.min(100, xPercent));
      const boundedY = Math.max(0, Math.min(100, yPercent));
      
      setTextLayers(prev => prev.map(layer => 
        layer.id === layerId ? { ...layer, x: boundedX, y: boundedY } : layer
      ));
      setEmojiLayers(prev => prev.map(layer => 
        layer.id === layerId ? { ...layer, x: boundedX, y: boundedY } : layer
      ));
    };
    
    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
    
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const deleteLayer = (id) => {
    setTextLayers(prev => prev.filter(layer => layer.id !== id));
    setEmojiLayers(prev => prev.filter(layer => layer.id !== id));
    if (selectedOverlayId === id) setSelectedOverlayId(null);
    showToast('Layer deleted');
  };

  const toggleLayerScope = (id) => {
    setTextLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, isGlobal: !layer.isGlobal, frameIndex: currentFrameIndex } : layer
    ));
    setEmojiLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, isGlobal: !layer.isGlobal, frameIndex: currentFrameIndex } : layer
    ));
    showToast('Layer timeline scope updated');
  };

  // Timeline operations
  const deleteFrame = (index) => {
    if (frames.length <= 1) {
      showToast('Cannot delete the last frame!');
      return;
    }
    
    saveCurrentFrameDrawing();
    const newFrames = frames.filter((_, i) => i !== index);
    
    // Shift drawings dictionary down
    const newDrawings = {};
    Object.keys(frameDrawings).forEach(k => {
      const idx = parseInt(k);
      if (idx < index) {
        newDrawings[idx] = frameDrawings[idx];
      } else if (idx > index) {
        newDrawings[idx - 1] = frameDrawings[idx];
      }
    });

    setFrames(newFrames);
    setFrameDrawings(newDrawings);
    
    const nextIndex = Math.max(0, index - 1);
    setCurrentFrameIndex(nextIndex);
    showToast('Frame deleted');
  };

  const duplicateFrame = (index) => {
    saveCurrentFrameDrawing();
    const frameToDup = frames[index];
    const newFrames = [...frames];
    newFrames.splice(index + 1, 0, { ...frameToDup });

    // Shift drawings dictionary up
    const newDrawings = {};
    Object.keys(frameDrawings).forEach(k => {
      const idx = parseInt(k);
      if (idx <= index) {
        newDrawings[idx] = frameDrawings[idx];
      } else {
        newDrawings[idx + 1] = frameDrawings[idx];
      }
    });
    if (frameDrawings[index]) {
      newDrawings[index + 1] = frameDrawings[index];
    }

    setFrames(newFrames);
    setFrameDrawings(newDrawings);
    setCurrentFrameIndex(index + 1);
    showToast('Frame duplicated');
  };

  const addBlankFrame = () => {
    if (frames.length === 0) return;
    saveCurrentFrameDrawing();
    const activeFrame = frames[currentFrameIndex];
    
    // Create pure transparent canvas
    const canvas = document.createElement('canvas');
    canvas.width = activeFrame.width;
    canvas.height = activeFrame.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const newFrame = {
      dataUrl: canvas.toDataURL(),
      delay: activeFrame.delay,
      width: activeFrame.width,
      height: activeFrame.height
    };

    const newFrames = [...frames];
    newFrames.splice(currentFrameIndex + 1, 0, newFrame);
    
    // Shift drawings up
    const newDrawings = {};
    Object.keys(frameDrawings).forEach(k => {
      const idx = parseInt(k);
      if (idx <= currentFrameIndex) {
        newDrawings[idx] = frameDrawings[idx];
      } else {
        newDrawings[idx + 1] = frameDrawings[idx];
      }
    });

    setFrames(newFrames);
    setFrameDrawings(newDrawings);
    setCurrentFrameIndex(currentFrameIndex + 1);
    showToast('Added blank frame');
  };

  // Speed timings
  const updateGlobalTiming = (val) => {
    setGlobalDelay(val);
    setFrames(prev => prev.map(f => ({ ...f, delay: val })));
    showToast(`Speed updated: ${val}ms per frame`);
  };

  // Compile frames, drawings, text overlays, and stickers into a final animated GIF
  const exportGif = async () => {
    if (frames.length === 0) return;
    saveCurrentFrameDrawing(); // Make sure latest changes are saved

    setIsPlaying(false);
    setExportState('rendering');
    setExportProgress(0);

    const width = frames[0].width;
    const height = frames[0].height;

    // Offscreen rendering canvas
    const renderCanvas = document.createElement('canvas');
    renderCanvas.width = width;
    renderCanvas.height = height;
    const ctx = renderCanvas.getContext('2d');

    const encoder = new GIFEncoder();

    try {
      // Sequence helper to load images asynchronously
      const loadImage = (url) => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject();
        img.src = url;
      });

      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        
        ctx.clearRect(0, 0, width, height);

        // 1. Draw base frame
        const baseImg = await loadImage(frame.dataUrl);
        ctx.drawImage(baseImg, 0, 0);

        // 2. Draw user drawings layer
        const drawingUrl = frameDrawings[i];
        if (drawingUrl) {
          const drawImg = await loadImage(drawingUrl);
          ctx.drawImage(drawImg, 0, 0);
        }

        // 3. Draw Emojis stickers layer
        const frameEmojis = emojiLayers.filter(emoji => 
          emoji.isGlobal || emoji.frameIndex === i
        );
        frameEmojis.forEach(emoji => {
          ctx.font = `${emoji.fontSize}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const rx = (emoji.x / 100) * width;
          const ry = (emoji.y / 100) * height;
          ctx.fillText(emoji.emoji, rx, ry);
        });

        // 4. Draw Text layers
        const frameTexts = textLayers.filter(txt => 
          txt.isGlobal || txt.frameIndex === i
        );
        frameTexts.forEach(txt => {
          ctx.font = `bold ${txt.fontSize}px Space Grotesk, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const rx = (txt.x / 100) * width;
          const ry = (txt.y / 100) * height;

          // Draw stroke first
          if (txt.strokeColor) {
            ctx.strokeStyle = txt.strokeColor;
            ctx.lineWidth = 6;
            ctx.strokeText(txt.text, rx, ry);
          }

          // Draw solid text
          ctx.fillStyle = txt.color;
          ctx.fillText(txt.text, rx, ry);
        });

        // 5. Package bytes for gifenc
        const imgData = ctx.getImageData(0, 0, width, height);
        const formatData = imgData.data;

        // Convert to 256 indexed colors
        const palette = quantize(formatData, 256);
        const index = applyPalette(formatData, palette);

        encoder.writeFrame(index, width, height, {
          palette,
          delay: frame.delay || globalDelay || 100
        });

        // Update percent indicator
        setExportProgress(Math.round(((i + 1) / frames.length) * 100));
      }

      encoder.finish();
      const gifBytes = encoder.bytes();
      const gifBlob = new Blob([gifBytes], { type: 'image/gif' });
      const gifUrl = URL.createObjectURL(gifBlob);

      setExportedGifUrl(gifUrl);
      setExportState('complete');
      showToast('GIF Render Complete!');
    } catch (err) {
      console.error(err);
      setExportState('error');
      showToast('Failed to compile GIF frames.');
    }
  };

  const triggerDownload = () => {
    if (!exportedGifUrl) return;
    const a = document.createElement('a');
    a.href = exportedGifUrl;
    a.download = `${projectName || 'jct-creative'}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Downloaded GIF successfully!');
  };

  // Main render panels
  const renderSidebarContent = () => {
    switch (activeTab) {
      case 'text':
        return (
          <div className="gif-sidebar-section">
            <h3 className="header-font gif-section-title"><Type size={16} color="var(--accent-primary)"/> Custom Text Layer</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
              <input 
                type="text" 
                className="input-field" 
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontSize: '14px',
                  border: '2px solid var(--text-primary)',
                  borderRadius: '6px'
                }}
                placeholder="Type overlay text..."
              />
              <div style={{display: 'flex', justify: 'space-between', alignItems: 'center'}}>
                <label className="text-12" style={{fontWeight: 'bold'}}>Font Size: {textSize}px</label>
                <input 
                  type="range" 
                  min="12" 
                  max="72" 
                  value={textSize}
                  onChange={(e) => setTextSize(parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="text-12" style={{fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>Text Color</label>
                <ColorPicker color={textColor} onChange={setTextColor} />
              </div>
              <div>
                <label className="text-12" style={{fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>Stroke Outline</label>
                <ColorPicker color={textStrokeColor} onChange={setTextStrokeColor} />
              </div>
              <button className="btn btn-primary" onClick={addTextLayer} style={{width: '100%'}}>
                <Plus size={16}/> Add Text Layer
              </button>
            </div>
          </div>
        );
      case 'emoji':
        return (
          <div className="gif-sidebar-section">
            <h3 className="header-font gif-section-title"><Smile size={16} color="var(--accent-primary)"/> Creative Stickers</h3>
            <p className="text-12" style={{color: 'var(--text-secondary)', marginBottom: '0.75rem'}}>
              Click any sticker or emoji to place it onto the workspace. Emojis can be dragged and repositioned freely.
            </p>
            <div className="emoji-grid">
              {PRESET_EMOJIS.map(emoji => (
                <button 
                  key={emoji} 
                  className="emoji-btn"
                  onClick={() => addEmojiLayer(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        );
      case 'draw':
        return (
          <div className="gif-sidebar-section">
            <h3 className="header-font gif-section-title"><Brush size={16} color="var(--accent-primary)"/> Draw on Frames</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
              <div style={{display: 'flex', gap: '8px'}}>
                <button 
                  className={`btn ${brushMode === 'draw' ? 'btn-primary' : ''}`} 
                  onClick={() => setBrushMode('draw')}
                  style={{flex: 1, fontSize: '13px'}}
                >
                  Brush
                </button>
                <button 
                  className={`btn ${brushMode === 'eraser' ? 'btn-primary' : ''}`} 
                  onClick={() => setBrushMode('eraser')}
                  style={{flex: 1, fontSize: '13px'}}
                >
                  Eraser
                </button>
                <button 
                  className={`btn ${brushMode === 'none' ? 'btn-primary' : ''}`} 
                  onClick={() => setBrushMode('none')}
                  style={{flex: 1, fontSize: '13px'}}
                >
                  Select
                </button>
              </div>
              {brushMode !== 'none' && (
                <>
                  <div style={{display: 'flex', justify: 'space-between', alignItems: 'center'}}>
                    <label className="text-12" style={{fontWeight: 'bold'}}>Brush Size: {brushSize}px</label>
                    <input 
                      type="range" 
                      min="2" 
                      max="40" 
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    />
                  </div>
                  {brushMode === 'draw' && (
                    <div>
                      <label className="text-12" style={{fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>Brush Color</label>
                      <ColorPicker color={brushColor} onChange={setBrushColor} />
                    </div>
                  )}
                  <button className="btn" onClick={clearDrawing} style={{width: '100%'}}>
                    <Trash2 size={16}/> Clear Drawing Frame
                  </button>
                </>
              )}
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="gif-sidebar-section">
            <h3 className="header-font gif-section-title"><Clock size={16} color="var(--accent-primary)"/> Animation Speed</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
              <div style={{display: 'flex', justify: 'space-between', alignItems: 'center'}}>
                <label className="text-12" style={{fontWeight: 'bold'}}>Frame Delay: {globalDelay}ms</label>
                <input 
                  type="range" 
                  min="30" 
                  max="800" 
                  step="10"
                  value={globalDelay}
                  onChange={(e) => updateGlobalTiming(parseInt(e.target.value))}
                />
              </div>
              <p className="text-12" style={{color: 'var(--text-secondary)'}}>
                Adjust frame duration. Lower delays animate faster (e.g. 50ms = 20 FPS). Higher delays slow down.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderCanvasView = () => {
    if (frames.length === 0) {
      return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', padding: '2rem'}}>
          <div className="card-imperfect" style={{maxWidth: '460px', width: '100%', textAlign: 'center'}}>
            <h2 className="header-font" style={{fontSize: '28px', marginBottom: '0.5rem'}}>Creative GIF Editor</h2>
            <p style={{color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '2rem'}}>
              Create, edit, draw on GIFs, and add layers! Works entirely in your browser with zero subscriptions.
            </p>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <label className="btn btn-primary" style={{width: '100%', cursor: 'pointer'}}>
                <Upload size={18}/> Upload local GIF file
                <input 
                  type="file" 
                  accept="image/gif" 
                  onChange={handleGifUpload}
                  style={{display: 'none'}} 
                />
              </label>
              
              <button className="btn" onClick={openWebcam} style={{width: '100%'}}>
                <Camera size={18}/> Record Selfie GIF Burst
              </button>
            </div>
          </div>
        </div>
      );
    }

    const activeFrame = frames[currentFrameIndex];
    if (!activeFrame) return null;

    // Filter layers visible on active frame
    const visibleTextLayers = textLayers.filter(layer => 
      layer.isGlobal || layer.frameIndex === currentFrameIndex
    );
    const visibleEmojiLayers = emojiLayers.filter(layer => 
      layer.isGlobal || layer.frameIndex === currentFrameIndex
    );

    return (
      <div className="gif-canvas-area">
        <div className="gif-canvas-container">
          <div 
            className="gif-canvas-wrapper"
            style={{
              width: `${activeFrame.width}px`,
              height: `${activeFrame.height}px`,
              maxWidth: '85%',
              maxHeight: '60vh'
            }}
          >
            {/* Base Image */}
            <img 
              src={activeFrame.dataUrl} 
              alt={`Frame ${currentFrameIndex}`} 
              className="gif-frame-image"
              style={{
                width: '100%',
                height: '100%'
              }}
            />

            {/* Drawing Brush Canvas */}
            <canvas 
              ref={drawingCanvasRef}
              className="gif-drawing-canvas"
              onPointerDown={handleDrawingStart}
              onPointerMove={handleDrawingMove}
              onPointerUp={handleDrawingEnd}
              onPointerLeave={handleDrawingEnd}
              style={{
                pointerEvents: brushMode === 'none' ? 'none' : 'auto'
              }}
            />

            {/* Drag & Move overlay indicators */}
            <div className="gif-interactive-layers">
              {visibleTextLayers.map(txt => (
                <div 
                  key={txt.id} 
                  className={`gif-overlay-item ${selectedOverlayId === txt.id ? 'selected' : ''}`}
                  style={{
                    left: `${txt.x}%`,
                    top: `${txt.y}%`,
                    color: txt.color,
                    fontSize: `${txt.fontSize}px`,
                    fontWeight: 'bold',
                    textShadow: txt.strokeColor ? `-2px -2px 0 ${txt.strokeColor}, 2px -2px 0 ${txt.strokeColor}, -2px 2px 0 ${txt.strokeColor}, 2px 2px 0 ${txt.strokeColor}` : 'none',
                    fontFamily: 'Space Grotesk, sans-serif'
                  }}
                  onPointerDown={(e) => handleOverlayPointerDown(e, txt.id)}
                >
                  {txt.text}
                  {selectedOverlayId === txt.id && (
                    <>
                      <div className="gif-overlay-delete" onClick={() => deleteLayer(txt.id)}>×</div>
                    </>
                  )}
                </div>
              ))}

              {visibleEmojiLayers.map(emoji => (
                <div 
                  key={emoji.id} 
                  className={`gif-overlay-item ${selectedOverlayId === emoji.id ? 'selected' : ''}`}
                  style={{
                    left: `${emoji.x}%`,
                    top: `${emoji.y}%`,
                    fontSize: `${emoji.fontSize}px`
                  }}
                  onPointerDown={(e) => handleOverlayPointerDown(e, emoji.id)}
                >
                  {emoji.emoji}
                  {selectedOverlayId === emoji.id && (
                    <>
                      <div className="gif-overlay-delete" onClick={() => deleteLayer(emoji.id)}>×</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Playback Controls & Timeline */}
        <div className="gif-timeline">
          <div className="gif-timeline-controls">
            <div className="gif-timeline-left">
              <button className="btn" onClick={() => setIsPlaying(!isPlaying)} style={{padding: '0.4rem 0.8rem'}}>
                {isPlaying ? <Pause size={16} /> : <Play size={16} />} {isPlaying ? 'Pause' : 'Play Preview'}
              </button>
              <button className="btn" onClick={addBlankFrame} style={{padding: '0.4rem 0.8rem'}}>
                <Plus size={14}/> Add Frame
              </button>
            </div>
            <div className="gif-timeline-right">
              Frame {currentFrameIndex + 1} / {frames.length} ({activeFrame.delay}ms)
            </div>
          </div>

          <div className="gif-timeline-frames">
            {frames.map((frame, index) => (
              <div 
                key={index} 
                className={`gif-frame-card ${currentFrameIndex === index ? 'active' : ''}`}
                onClick={() => {
                  saveCurrentFrameDrawing();
                  setIsPlaying(false);
                  setCurrentFrameIndex(index);
                }}
              >
                <img src={frame.dataUrl} alt={`Thumbnail ${index}`} className="gif-frame-thumbnail" />
                <div className="gif-frame-meta">{frame.delay}ms</div>
                <div className="gif-frame-delete" onClick={(e) => {
                  e.stopPropagation();
                  deleteFrame(index);
                }}>
                  <Trash2 size={8}/>
                </div>
                <div 
                  className="layer-manager-btn" 
                  style={{position: 'absolute', bottom: '2px', left: '2px', padding: '1px', opacity: 0.6, background: '#fff', borderRadius: '2px'}}
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateFrame(index);
                  }}
                  title="Duplicate Frame"
                >
                  <Copy size={8}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="gif-editor-container">
      {/* Top Header navbar */}
      <header className="gif-editor-header">
        <div className="gif-editor-header-left">
          <button className="btn" onClick={onBack} style={{padding: '0.4rem'}}>
            <ArrowLeft size={16}/> Back
          </button>
          {frames.length > 0 && (
            <input 
              type="text" 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="header-font"
              style={{
                background: 'none',
                border: 'none',
                borderBottom: '2px dashed var(--text-primary)',
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'var(--text-primary)',
                outline: 'none',
                width: '200px'
              }}
              placeholder="Name your GIF..."
            />
          )}
        </div>
        <div className="gif-editor-header-right">
          {frames.length > 0 && (
            <button className="btn btn-primary" onClick={exportGif}>
              <Download size={16}/> Export GIF
            </button>
          )}
        </div>
      </header>

      {/* Workspace split columns */}
      <div className="gif-editor-workspace">
        {frames.length > 0 && (
          <div className="gif-editor-sidebar">
            {/* Quick tabs selector */}
            <div style={{display: 'flex', borderBottom: '2px solid var(--text-primary)', background: 'var(--bg-panel-hover)'}}>
              <button 
                className="layer-manager-btn" 
                style={{flex: 1, padding: '0.75rem', fontWeight: 'bold', borderRight: '1px solid var(--border-color)', background: activeTab === 'text' ? 'var(--bg-panel)' : 'none', color: activeTab === 'text' ? 'var(--accent-primary)' : 'var(--text-secondary)'}}
                onClick={() => setActiveTab('text')}
              >
                Text
              </button>
              <button 
                className="layer-manager-btn" 
                style={{flex: 1, padding: '0.75rem', fontWeight: 'bold', borderRight: '1px solid var(--border-color)', background: activeTab === 'emoji' ? 'var(--bg-panel)' : 'none', color: activeTab === 'emoji' ? 'var(--accent-primary)' : 'var(--text-secondary)'}}
                onClick={() => setActiveTab('emoji')}
              >
                Stickers
              </button>
              <button 
                className="layer-manager-btn" 
                style={{flex: 1, padding: '0.75rem', fontWeight: 'bold', borderRight: '1px solid var(--border-color)', background: activeTab === 'draw' ? 'var(--bg-panel)' : 'none', color: activeTab === 'draw' ? 'var(--accent-primary)' : 'var(--text-secondary)'}}
                onClick={() => setActiveTab('draw')}
              >
                Brush
              </button>
              <button 
                className="layer-manager-btn" 
                style={{flex: 1, padding: '0.75rem', fontWeight: 'bold', background: activeTab === 'settings' ? 'var(--bg-panel)' : 'none', color: activeTab === 'settings' ? 'var(--accent-primary)' : 'var(--text-secondary)'}}
                onClick={() => setActiveTab('settings')}
              >
                Speed
              </button>
            </div>

            {renderSidebarContent()}

            {/* Layer management listing */}
            {(textLayers.length > 0 || emojiLayers.length > 0) && (
              <div className="gif-sidebar-section" style={{marginTop: 'auto', borderTop: '2px solid var(--border-color)'}}>
                <h4 className="header-font" style={{fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.5rem'}}><Layers size={12}/> Active Layers</h4>
                <div className="layers-manager-list">
                  {textLayers.map(txt => (
                    <div key={txt.id} className={`layer-manager-item ${selectedOverlayId === txt.id ? 'active' : ''}`} style={{borderColor: selectedOverlayId === txt.id ? 'var(--accent-primary)' : 'var(--border-color)'}} onClick={() => setSelectedOverlayId(txt.id)}>
                      <div className="layer-manager-label">
                        <Type size={12}/> <span>{txt.text}</span>
                      </div>
                      <div className="layer-manager-actions">
                        <button className="layer-manager-btn" onClick={() => toggleLayerScope(txt.id)} title={txt.isGlobal ? "Global layer (visible on all frames)" : "Single frame layer"}>
                          <Clock size={10} color={txt.isGlobal ? 'var(--accent-secondary)' : 'var(--text-muted)'}/>
                        </button>
                        <button className="layer-manager-btn" onClick={() => deleteLayer(txt.id)}>
                          <Trash2 size={10} color="#d0021b"/>
                        </button>
                      </div>
                    </div>
                  ))}
                  {emojiLayers.map(emo => (
                    <div key={emo.id} className={`layer-manager-item ${selectedOverlayId === emo.id ? 'active' : ''}`} style={{borderColor: selectedOverlayId === emo.id ? 'var(--accent-primary)' : 'var(--border-color)'}} onClick={() => setSelectedOverlayId(emo.id)}>
                      <div className="layer-manager-label">
                        <Smile size={12}/> <span>Sticker {emo.emoji}</span>
                      </div>
                      <div className="layer-manager-actions">
                        <button className="layer-manager-btn" onClick={() => toggleLayerScope(emo.id)} title={emo.isGlobal ? "Global layer" : "Single frame layer"}>
                          <Clock size={10} color={emo.isGlobal ? 'var(--accent-secondary)' : 'var(--text-muted)'}/>
                        </button>
                        <button className="layer-manager-btn" onClick={() => deleteLayer(emo.id)}>
                          <Trash2 size={10} color="#d0021b"/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {renderCanvasView()}
      </div>

      {/* Webcam overlay modal */}
      {isWebcamActive && (
        <div className="gif-modal-overlay">
          <div className="gif-modal-content">
            <h2 className="header-font" style={{marginBottom: '0.5rem'}}>Selfie GIF Capture</h2>
            <p className="text-12" style={{color: 'var(--text-secondary)', marginBottom: '1rem'}}>
              Strike a pose! We'll record a high-speed 3-second burst of 20 frames.
            </p>
            
            <div style={{position: 'relative', width: '100%', display: 'flex', justifyContent: 'center'}}>
              <video ref={webcamVideoRef} autoPlay playsInline muted className="gif-webcam-feed" />
              {isWebcamRecording && webcamCountdown > 0 && (
                <div className="gif-webcam-overlay">
                  {webcamCountdown}
                </div>
              )}
              {isWebcamRecording && webcamCountdown === 0 && (
                <div className="gif-webcam-overlay" style={{fontSize: '18px', color: 'var(--accent-primary)'}}>
                  Recording Frame Burst...
                </div>
              )}
            </div>

            <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem'}}>
              <button className="btn" onClick={closeWebcam} disabled={isWebcamRecording}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={captureWebcamBurst} disabled={isWebcamRecording}>
                <Camera size={16}/> Record Burst
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export modal overlay */}
      {exportState !== 'idle' && (
        <div className="gif-modal-overlay">
          <div className="gif-modal-content">
            {exportState === 'rendering' && (
              <>
                <h2 className="header-font">Compiling Master GIF</h2>
                <p className="text-14" style={{color: 'var(--text-secondary)', marginTop: '0.5rem'}}>
                  Blending frames, overlay texts, stickers, and hand-drawn layers...
                </p>
                <div className="gif-loading-spinner"></div>
                <div style={{fontSize: '18px', fontWeight: 'bold', fontFamily: 'Space Grotesk'}}>
                  {exportProgress}%
                </div>
              </>
            )}

            {exportState === 'complete' && (
              <>
                <h2 className="header-font" style={{color: 'var(--accent-secondary)'}}>Export Successful!</h2>
                <p className="text-14" style={{color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem'}}>
                  Your animated GIF is ready for action! Click below to save it locally.
                </p>
                {exportedGifUrl && (
                  <div style={{border: '2px solid var(--text-primary)', borderRadius: '8px', padding: '1rem', backgroundColor: '#f0f0f0', display: 'inline-block', marginBottom: '1.5rem', maxWidth: '300px', boxShadow: '4px 4px 0px black'}}>
                    <img src={exportedGifUrl} alt="Exported Result" style={{maxWidth: '100%', maxHeight: '200px', objectFit: 'contain'}} />
                  </div>
                )}
                <div style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
                  <button className="btn" onClick={() => setExportState('idle')}>
                    Back to Edit
                  </button>
                  <button className="btn btn-primary" onClick={triggerDownload}>
                    <Download size={16}/> Save GIF File
                  </button>
                </div>
              </>
            )}

            {exportState === 'error' && (
              <>
                <h2 className="header-font" style={{color: '#d0021b'}}>Compilation Failed</h2>
                <p className="text-14" style={{color: 'var(--text-secondary)', marginTop: '1rem', marginBottom: '1.5rem'}}>
                  An error occurred while compiling your frames. Please try again!
                </p>
                <button className="btn" onClick={() => setExportState('idle')}>
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  );
}
