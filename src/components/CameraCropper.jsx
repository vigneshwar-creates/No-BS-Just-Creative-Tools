import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Scissors, Check, X, ArrowLeft } from 'lucide-react';
import './CameraCropper.css';

export default function CameraCropper({ onBack, onSave }) {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [cropBox, setCropBox] = useState({ x: 50, y: 50, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragType, setDragType] = useState(null); // 'move' or 'resize-se' etc.
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Start camera stream on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCapturedImage(null);
    setCroppedImage(null);
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    // Mirror the capture if user-facing
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleCropMouseDown = (e, type) => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !capturedImage) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });

    setCropBox(prev => {
      let { x, y, width, height } = prev;
      
      if (dragType === 'move') {
        return {
          ...prev,
          x: Math.max(0, x + dx),
          y: Math.max(0, y + dy)
        };
      } else if (dragType === 'resize-se') {
        return {
          ...prev,
          width: Math.max(50, width + dx),
          height: Math.max(50, height + dy)
        };
      }
      return prev;
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragType(null);
  };

  const performCrop = () => {
    const img = new Image();
    img.src = capturedImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = cropBox.width;
      canvas.height = cropBox.height;
      
      const ctx = canvas.getContext('2d');
      
      // Calculate crop offsets relative to container dimensions if scaled
      // For simplicity, we match the render scale
      ctx.drawImage(
        img,
        cropBox.x, cropBox.y, cropBox.width, cropBox.height, // Source
        0, 0, cropBox.width, cropBox.height // Destination
      );
      
      const croppedUrl = canvas.toDataURL('image/jpeg');
      setCroppedImage(croppedUrl);
    };
  };

  const handleSaveProject = () => {
    if (croppedImage) {
      onSave({
        id: Date.now(),
        type: 'image',
        name: `Camera Crop ${new Date().toLocaleTimeString()}`,
        dataUrl: croppedImage
      });
    }
  };

  return (
    <div className="camera-cropper-container" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <header className="camera-cropper-header">
        <div className="header-left">
          <button className="btn" onClick={onBack} style={{padding: '0.4rem'}}>
            <ArrowLeft size={16}/> Back
          </button>
          <h1 className="header-font" style={{fontSize: '18px', margin: 0}}>Webcam Photo Cropper</h1>
        </div>
        <div className="header-right">
        </div>
      </header>

      <div className="camera-cropper-layout">
        <aside className="camera-cropper-sidebar">
          <div className="sidebar-tab-content">
            <h3 className="header-font" style={{fontSize: '18px', marginBottom: '1.5rem'}}>Camera Tools</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
              {!capturedImage && !cameraError && (
                 <p className="text-12" style={{color: 'var(--text-secondary)'}}>Allow camera access and click "Capture Frame" on the right to take a photo.</p>
              )}

              {capturedImage && !croppedImage && (
                <>
                  <p className="text-12" style={{color: 'var(--text-secondary)'}}>Drag the crop box over your photo to select the area to keep.</p>
                  <div style={{marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    <button className="btn btn-primary" onClick={performCrop}>
                      <Scissors size={16} /> Crop Image
                    </button>
                    <button className="btn" onClick={startCamera}>
                      <RefreshCw size={16} /> Retake Photo
                    </button>
                  </div>
                </>
              )}

              {croppedImage && (
                <>
                  <p className="text-12" style={{color: 'var(--text-secondary)'}}>Looking good! Save your cropped photo to the workspace.</p>
                  <div style={{marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    <button className="btn btn-primary" onClick={handleSaveProject}>
                      <Check size={16} /> Send to Workspace
                    </button>
                    <button className="btn" onClick={() => setCroppedImage(null)}>
                      <X size={16} /> Recrop
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>

        <main className="camera-cropper-main" ref={containerRef}>
        {!capturedImage && !cameraError && (
          <div className="camera-feed-wrapper">
            <video ref={videoRef} autoPlay playsInline muted className="camera-video"></video>
            <button className="btn btn-primary capture-btn" onClick={capturePhoto}>
              <Camera size={20} /> Capture Frame
            </button>
          </div>
        )}

        {cameraError && (
          <div className="camera-error card-imperfect">
            <p className="header-font">{cameraError}</p>
            <button className="btn" onClick={startCamera} style={{marginTop: '1rem'}}>
              <RefreshCw size={16} /> Retry Camera
            </button>
          </div>
        )}

        {capturedImage && !croppedImage && (
          <div className="crop-editor-wrapper">
            <div className="crop-image-container" style={{ position: 'relative' }}>
              <img src={capturedImage} alt="Capture" className="captured-img" />
              
              {/* Crop box overlay */}
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
                <div 
                  className="crop-handle-se"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleCropMouseDown(e, 'resize-se');
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {croppedImage && (
          <div className="cropped-result-wrapper">
            <h3 className="header-font" style={{marginBottom: '1rem'}}>Nicely Cropped!</h3>
            <div className="cropped-preview-card">
              <img src={croppedImage} alt="Cropped result" className="cropped-img-preview" />
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}
