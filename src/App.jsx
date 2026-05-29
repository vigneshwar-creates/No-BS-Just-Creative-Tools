import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Download, RotateCcw, Sparkles, ArrowLeft, Scissors, Camera, Layers } from 'lucide-react';
import { get, set } from 'idb-keyval';
import CameraCropper from './components/CameraCropper';
import ImageCropper from './components/ImageCropper';
import DesignCanvas from './components/DesignCanvas';
import GifEditor from './components/GifEditor';

export default function App({ activeTool, projectName, onBack }) {
  const [currentTool, setCurrentTool] = useState(activeTool);
  const [project, setProject] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Smart-Fit specific state
  const [smartFitMode, setSmartFitMode] = useState(false);
  
  useEffect(() => {
    // Make sure currentTool keeps up if parent changes it
    setCurrentTool(activeTool);
  }, [activeTool]);

  useEffect(() => {
    // Attempt to load from IndexedDB
    get('jct-project').then((saved) => {
      if (saved) {
        setProject(saved);
        showToast('Restored your session');
      }
    });
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const saveProject = async (proj) => {
    setProject(proj);
    await set('jct-project', proj);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const type = file.type;
      
      if (!type.startsWith('image/')) {
        showToast('Only image files are supported');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target.result;
        await saveProject({ id: Date.now(), type: 'image', name: projectName || file.name, dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearProject = async () => {
    await set('jct-project', null);
    setProject(null);
    setSmartFitMode(false);
  };

  const expandCanvas = () => {
    setSmartFitMode(true);
    showToast('AI generating missing background...');
  };

  // If the user selected the Camera Cropper tool directly
  if (currentTool === 'camera-crop') {
    return (
      <CameraCropper 
        onBack={onBack} 
        onSave={async (newProj) => {
          if (projectName) {
            newProj.name = projectName;
          }
          await saveProject(newProj);
          setCurrentTool('smart-fit'); // Automatically open in Smart-Fit Canvas after cropping!
          showToast('Image loaded into Smart-Fit Canvas');
        }}
      />
    );
  }

  // If the user selected the Organic Image Cropper tool
  if (currentTool === 'image-crop') {
    return (
      <ImageCropper 
        onBack={onBack} 
        onSave={async (newProj) => {
          if (projectName) {
            newProj.name = projectName;
          }
          await saveProject(newProj);
          setCurrentTool('smart-fit'); // Automatically open in Smart-Fit Canvas after cropping!
          showToast('Image loaded into Smart-Fit Canvas');
        }}
      />
    );
  }

  // If the user selected the Advanced Design Canvas tool
  if (currentTool === 'design-canvas') {
    return (
      <DesignCanvas 
        onBack={onBack} 
        projectName={projectName}
      />
    );
  }

  // If the user selected the Creative GIF Editor tool
  if (currentTool === 'gif-editor') {
    return (
      <GifEditor 
        onBack={onBack}
      />
    );
  }

  const renderSidebar = () => {
    if (!project) {
      return (
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 className="header-font" style={{fontSize: '16px'}}>Choose a Workspace</h3>
          <button className={`btn ${currentTool === 'smart-fit' ? 'btn-primary' : ''}`} onClick={() => setCurrentTool('smart-fit')}>
            <ImageIcon size={16} /> Smart Image Resizer
          </button>
          <button className={`btn ${currentTool === 'image-crop' ? 'btn-primary' : ''}`} onClick={() => setCurrentTool('image-crop')}>
            <Scissors size={16} /> Freehand &amp; Shape Cropper
          </button>
          <button className={`btn ${currentTool === 'camera-crop' ? 'btn-primary' : ''}`} onClick={() => setCurrentTool('camera-crop')}>
            <Camera size={16} /> Webcam Photo Cropper
          </button>
          <button className={`btn ${currentTool === 'design-canvas' ? 'btn-primary' : ''}`} onClick={() => setCurrentTool('design-canvas')}>
            <Layers size={16} /> Canvas Image &amp; Text Editor
          </button>
          <button className={`btn ${currentTool === 'gif-editor' ? 'btn-primary' : ''}`} onClick={() => setCurrentTool('gif-editor')}>
            <Sparkles size={16} /> GIF Creator &amp; Editor
          </button>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h2 className="header-font" style={{ fontSize: '18px', marginBottom: '8px' }}>Smart Image Resizer</h2>
          <p className="text-12" style={{ color: 'var(--text-secondary)' }}>
            Resize your photos to fit any social media layout perfectly without losing details.
          </p>
        </div>
        
        <button className="btn btn-primary" onClick={expandCanvas}>
          <Sparkles size={16} /> Expand Canvas (AI)
        </button>
        
        <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
          <button className="btn" onClick={clearProject} style={{ flex: 1 }}>
            <RotateCcw size={16} /> Reset
          </button>
          <button className="btn" style={{ flex: 1 }}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>
    );
  };

  const renderCanvas = () => {
    if (!project) {
      return (
        <div 
          className={`drop-zone ${isDragging ? 'active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
              if (e.target.files.length > 0) {
                handleDrop({ preventDefault: () => {}, dataTransfer: { files: e.target.files } });
              }
            };
            input.click();
          }}
        >
          <ImageIcon size={48} />
          <div>
            <h2 className="header-font">Drop your Image here</h2>
            <p className="text-14">or click to browse local files</p>
          </div>
        </div>
      );
    }

    return (
      <div style={{ position: 'relative', width: '80%', height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ 
          position: 'relative', 
          transition: 'all 0.5s ease',
          padding: smartFitMode ? '40px' : '0',
          background: smartFitMode ? 'var(--bg-panel)' : 'transparent',
          boxShadow: smartFitMode ? '4px 4px 0px var(--text-primary)' : 'none',
          borderRadius: smartFitMode ? '16px' : '0',
          border: smartFitMode ? '2px dashed var(--text-primary)' : 'none',
          transform: smartFitMode ? 'rotate(0.5deg)' : 'none'
        }}>
          <img 
            src={project.dataUrl} 
            alt="Project" 
            style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', display: 'block', borderRadius: '4px' }} 
          />
          {smartFitMode && (
            <>
              <div className="crop-handle" style={{ top: '-8px', left: '50%', transform: 'translateX(-50%)' }} />
              <div className="crop-handle" style={{ bottom: '-8px', left: '50%', transform: 'translateX(-50%)' }} />
              <div className="crop-handle" style={{ left: '-8px', top: '50%', transform: 'translateY(-50%)' }} />
              <div className="crop-handle" style={{ right: '-8px', top: '50%', transform: 'translateY(-50%)' }} />
              <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 'bold', background: 'var(--accent-highlight)', border: '2px solid var(--text-primary)', padding: '4px 8px', borderRadius: '4px' }}>
                AI Background Generated
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="canvas-container" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        {renderCanvas()}
      </div>
      
      <div className="sidebar">
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn back-btn" onClick={onBack} style={{padding: '0.4rem', boxShadow: '2px 2px 0px black'}}>
            <ArrowLeft size={16} />
          </button>
          <h1 className="header-font" style={{ fontSize: '20px', letterSpacing: '-0.5px' }}>JCT</h1>
        </div>
        
        {renderSidebar()}
        
        {!project && (
          <div style={{ marginTop: 'auto', color: 'var(--text-muted)' }} className="text-12">
            <p style={{ marginBottom: '8px' }}>100% Client-Side</p>
            <p style={{ marginBottom: '8px' }}>Local-First</p>
            <p>Powered by WASM &amp; WebGPU</p>
          </div>
        )}
      </div>

      {toastMsg && <div className="toast">{toastMsg}</div>}
    </>
  );
}
