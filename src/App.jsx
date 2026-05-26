import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Music, FileText, Download, RotateCcw, Sparkles } from 'lucide-react';
import { get, set } from 'idb-keyval';

export default function App() {
  const [project, setProject] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Smart-Fit specific state
  const [smartFitMode, setSmartFitMode] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(100); // percentage or pixels, let's say percentages for mock
  
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
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target.result;
        let projType = 'unknown';
        if (type.startsWith('image/')) projType = 'image';
        else if (type.startsWith('audio/')) projType = 'audio';
        else if (type === 'application/pdf' || type.startsWith('text/')) projType = 'document';
        
        await saveProject({ id: Date.now(), type: projType, name: file.name, dataUrl });
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

  const renderSidebar = () => {
    if (!project) return null;

    if (project.type === 'image') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 className="header-font" style={{ fontSize: '18px', marginBottom: '8px' }}>Smart-Fit Canvas</h2>
            <p className="text-12" style={{ color: 'var(--text-secondary)' }}>
              Resize your photo for any platform without awkward cropping.
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
    }
    
    if (project.type === 'audio') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 className="header-font" style={{ fontSize: '18px', marginBottom: '8px' }}>Audio Engine</h2>
            <p className="text-12" style={{ color: 'var(--text-secondary)' }}>
              Real-time waveform analysis &amp; processing.
            </p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="text-12" style={{ color: 'var(--text-secondary)' }}>Voice Enhancement</label>
            <input type="range" min="0" max="100" defaultValue="50" style={{ width: '100%', accentColor: 'var(--accent-cyan)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="text-12" style={{ color: 'var(--text-secondary)' }}>Background Noise Reduction</label>
            <input type="range" min="0" max="100" defaultValue="80" style={{ width: '100%', accentColor: 'var(--accent-cyan)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="text-12" style={{ color: 'var(--text-secondary)' }}>Reverb</label>
            <input type="range" min="0" max="100" defaultValue="20" style={{ width: '100%', accentColor: 'var(--accent-cyan)' }} />
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={clearProject} style={{ flex: 1 }}>
              <RotateCcw size={16} /> Reset
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }}>
              <Download size={16} /> Export
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h2 className="header-font" style={{ fontSize: '18px', marginBottom: '8px' }}>Document Editor</h2>
          <p className="text-12" style={{ color: 'var(--text-secondary)' }}>
            Block-based, magnetic layout engine.
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
            input.onchange = (e) => {
              if (e.target.files.length > 0) {
                // mock drop event
                handleDrop({ preventDefault: () => {}, dataTransfer: { files: e.target.files } });
              }
            };
            input.click();
          }}
        >
          <UploadCloud size={48} />
          <div>
            <h2 className="header-font">Drop any file here</h2>
            <p className="text-14">Image, Audio, or Document</p>
          </div>
        </div>
      );
    }

    if (project.type === 'image') {
      return (
        <div style={{ position: 'relative', width: '80%', height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ 
            position: 'relative', 
            transition: 'all 0.5s ease',
            padding: smartFitMode ? '40px' : '0',
            background: smartFitMode ? 'linear-gradient(45deg, #2a2a2a, #1a1a1a)' : 'transparent',
            boxShadow: smartFitMode ? '0 0 40px rgba(0, 243, 255, 0.1)' : 'none',
            borderRadius: '12px',
            border: smartFitMode ? '2px dashed var(--accent-cyan)' : 'none'
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
                <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', color: 'var(--accent-cyan)', fontSize: '12px', fontWeight: 'bold', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px' }}>
                  AI Background Generated
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    if (project.type === 'audio') {
      return (
        <div style={{ width: '80%', textAlign: 'center' }}>
          <Music size={64} style={{ color: 'var(--accent-cyan)', marginBottom: '1rem', opacity: 0.8 }} />
          <h2 className="header-font">{project.name}</h2>
          <div style={{ width: '100%', height: '120px', background: 'var(--bg-panel)', marginTop: '2rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {/* Fake waveform */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '100%', padding: '0 20px' }}>
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} style={{ width: '6px', height: `${Math.max(10, Math.random() * 100)}%`, background: 'var(--accent-cyan)', borderRadius: '3px', opacity: 0.8 }}></div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ width: '80%', maxWidth: '800px', height: '80%', background: '#fff', color: '#000', borderRadius: '8px', padding: '2rem', overflowY: 'auto' }}>
        <h2 className="header-font" style={{ borderBottom: '2px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>{project.name}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ height: '20px', background: '#f0f0f0', borderRadius: '4px', width: '100%' }}></div>
          <div style={{ height: '20px', background: '#f0f0f0', borderRadius: '4px', width: '90%' }}></div>
          <div style={{ height: '20px', background: '#f0f0f0', borderRadius: '4px', width: '95%' }}></div>
          <div style={{ height: '20px', background: '#f0f0f0', borderRadius: '4px', width: '80%' }}></div>
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
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '24px', height: '24px', background: 'var(--accent-cyan)', borderRadius: '4px' }}></div>
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
