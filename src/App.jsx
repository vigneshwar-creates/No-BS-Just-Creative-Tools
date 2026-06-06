import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Download, RotateCcw, Sparkles, ArrowLeft, Scissors, Camera, Layers, Video } from 'lucide-react';
import { get, set } from 'idb-keyval';
const CameraCropper = React.lazy(() => import('./components/CameraCropper'));
const ImageCropper = React.lazy(() => import('./components/ImageCropper'));
const DesignCanvas = React.lazy(() => import('./components/DesignCanvas'));
const GifEditor = React.lazy(() => import('./components/GifEditor'));
const VideoEditor = React.lazy(() => import('./components/VideoEditor'));
import headerVideo from '../assets/videos/0530.mp4';

export default function App({ activeTool, projectName, onBack }) {
  const [currentTool, setCurrentTool] = useState(activeTool);
  const [project, setProject] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  useEffect(() => {
    // Make sure currentTool keeps up if parent changes it
    setCurrentTool(activeTool);
  }, [activeTool]);

  useEffect(() => {
    // Attempt to load from IndexedDB
    get('jct-project').then((saved) => {
      if (saved) {
        setProject(saved);
        showToast('Session Restored');
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
  };

  // If the user selected the Camera Cropper tool directly
  if (currentTool === 'camera-crop') {
    return (
      <React.Suspense fallback={<div style={{padding: '2rem', textAlign: 'center'}}>Loading tool...</div>}>
        <CameraCropper 
          onBack={onBack} 
          onSave={async (newProj) => {
            if (projectName) {
              newProj.name = projectName;
            }
            await saveProject(newProj);
            setCurrentTool('design-canvas'); // Automatically open in Canvas after cropping
            showToast('Image loaded into Canvas');
          }}
        />
      </React.Suspense>
    );
  }

  // If the user selected the Organic Image Cropper tool
  if (currentTool === 'image-crop') {
    return (
      <React.Suspense fallback={<div style={{padding: '2rem', textAlign: 'center'}}>Loading tool...</div>}>
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
      </React.Suspense>
    );
  }

  // If the user selected the Advanced Design Canvas tool
  if (currentTool === 'design-canvas') {
    return (
      <React.Suspense fallback={<div style={{padding: '2rem', textAlign: 'center'}}>Loading tool...</div>}>
        <DesignCanvas 
          onBack={onBack} 
          projectName={projectName}
        />
      </React.Suspense>
    );
  }

  // If the user selected the Creative GIF Editor tool
  if (currentTool === 'gif-editor') {
    return (
      <React.Suspense fallback={<div style={{padding: '2rem', textAlign: 'center'}}>Loading tool...</div>}>
        <GifEditor 
          onBack={onBack}
        />
      </React.Suspense>
    );
  }

  // If the user selected the Video Clips Editor tool
  if (currentTool === 'video-editor') {
    return (
      <React.Suspense fallback={<div style={{padding: '2rem', textAlign: 'center'}}>Loading tool...</div>}>
        <VideoEditor 
          onBack={onBack}
          defaultVideoUrl={headerVideo}
        />
      </React.Suspense>
    );
  }

  const renderSidebar = () => {
    if (!project) {
      return (
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 className="header-font" style={{fontSize: '16px'}}>Choose a Workspace</h3>
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
          <button className={`btn ${currentTool === 'video-editor' ? 'btn-primary' : ''}`} onClick={() => setCurrentTool('video-editor')}>
            <Video size={16} /> Video Editor (basic)
          </button>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h2 className="header-font" style={{ fontSize: '18px', marginBottom: '8px' }}>Project Hub</h2>
          <p className="text-12" style={{ color: 'var(--text-secondary)' }}>
            Your image is loaded in the local database. Choose a tool above to edit it.
          </p>
        </div>
        
        <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
          <button className="btn" onClick={clearProject} style={{ flex: 1 }}>
            <RotateCcw size={16} /> Reset
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
          transition: 'all 0.5s ease'
        }}>
          <img 
            src={project.dataUrl} 
            alt="Project" 
            style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', display: 'block', borderRadius: '4px' }} 
          />
        </div>
      </div>
    );
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-color)'}}>
      <header style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', backgroundColor: 'var(--bg-panel)', borderBottom: '2px solid var(--text-primary)', height: '60px', flexShrink: 0, zIndex: 50}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
          <button className="btn" onClick={onBack} style={{padding: '0.4rem'}}>
            <ArrowLeft size={16}/> Back
          </button>
          <h1 className="header-font" style={{fontSize: '18px', margin: 0}}>Workspace Hub</h1>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}></div>
      </header>

      <div style={{display: 'flex', flex: 1, overflow: 'hidden'}}>
        <aside style={{width: '300px', minWidth: '260px', backgroundColor: 'var(--bg-panel)', borderRight: '2px solid var(--text-primary)', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0, zIndex: 40}}>
          <div style={{padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1}}>
            {renderSidebar()}
            
            {!project && (
              <div style={{ marginTop: 'auto', color: 'var(--text-muted)' }} className="text-12">
                <p style={{ marginBottom: '8px' }}>100% Client-Side</p>
                <p style={{ marginBottom: '8px' }}>Local-First</p>
                <p>Powered by WASM &amp; WebGPU</p>
              </div>
            )}
          </div>
        </aside>

        <main onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.1) 1px, transparent 0)', backgroundSize: '24px 24px'}}>
          {renderCanvas()}
        </main>
      </div>

      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  );
}
