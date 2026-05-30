import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Image as ImageIcon, Sparkles, Camera, Scissors, Layers, Upload } from 'lucide-react';
import { get, set } from 'idb-keyval';
import './Landing.css';
import headerVideo from '../assets/videos/0530.mp4';

export default function Landing({ onEnter }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentProject, setRecentProject] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [showSafeInfo, setShowSafeInfo] = useState(false);

  useEffect(() => {
    get('jct-project').then(saved => {
      if (saved) {
        setRecentProject(saved);
      }
    });
  }, []);

  const handleToolSelect = (toolId) => {
    setSelectedTool(toolId);
    const toolNames = {
      'smart-fit': 'Smart Resizer Project',
      'image-crop': 'Shape Cropper Project',
      'camera-crop': 'Webcam Cropper Project',
      'design-canvas': 'Canvas Editor Project',
      'gif-editor': 'GIF Creator Project'
    };
    setNewProjectName(toolNames[toolId] || 'New Workspace Project');
    setShowNameModal(true);
  };

  const handleConfirmName = (e) => {
    if (e) e.preventDefault();
    setShowNameModal(false);
    onEnter(selectedTool, newProjectName.trim() || 'Untitled Workspace');
  };

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

        const projName = parsedData.projectName || 'Imported Project';
        await set(`jct-canvas-project-${projName}`, {
          layers: parsedData.layers || [],
          importedFonts: parsedData.importedFonts || []
        });

        onEnter('design-canvas', projName);
      } catch (err) {
        alert('Could not read the .jct file. It may be corrupted.');
      }
    };
    reader.readAsText(file);
  };

  const creativeTools = [
    {
      id: 'smart-fit',
      title: 'Smart Image Resizer',
      desc: 'Resize your photos to fit any social media layout perfectly without losing details.',
      icon: <ImageIcon size={32} className="tool-icon icon-image" />
    },
    {
      id: 'image-crop',
      title: 'Freehand & Shape Cropper',
      desc: 'Crop your photos into rectangles or draw a freehand loop to cut out any object.',
      icon: <Scissors size={32} className="tool-icon" style={{color: 'var(--accent-secondary)'}} />
    },
    {
      id: 'camera-crop',
      title: 'Webcam Photo Cropper',
      desc: 'Take a quick picture using your webcam and crop it instantly.',
      icon: <Camera size={32} className="tool-icon" style={{color: 'var(--accent-primary)'}} />
    },
    {
      id: 'design-canvas',
      title: 'Canvas Image & Text Editor',
      desc: 'Add text layers, draw, use layered boards, and adjust colors on a graphic design canvas.',
      icon: <Layers size={32} className="tool-icon" style={{color: 'var(--accent-primary)'}} />
    },
    {
      id: 'gif-editor',
      title: 'GIF Creator & Editor',
      desc: 'Make moving pictures (GIFs) and customize them with text overlays and custom drawings.',
      icon: <Sparkles size={32} className="tool-icon" style={{color: 'var(--accent-highlight)'}} />
    }
  ];

  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="logo header-font">JCT <Sparkles size={16} color="var(--accent-highlight)" style={{display: 'inline', marginLeft: '4px'}}/></div>
        <button className="btn" onClick={() => handleToolSelect('smart-fit')}>
          New Workspace
        </button>
      </nav>

      <main className="hero-section">
        {/* Full-Fidelity Background Video loop playing fully visible in the background */}
        <div className="hero-video-container">
          <video 
            className="hero-video"
            autoPlay 
            loop 
            muted 
            playsInline
            src={headerVideo}
          />
          <div className="hero-video-overlay"></div>
        </div>

        {/* Premium Neo-Brutalist Glassmorphic Card floating on top of the looping video background */}
        <div className="hero-content hero-glass-card">
          <h1 className="hero-title header-font">
            Create <span className="highlight-text">freely</span>.
          </h1>
          <p className="hero-subtitle">
            Your files stay on your device. Just powerful, lightning-fast tools that feel like magic.
          </p>
        </div>
      </main>

      <section id="tools-hub" className="tools-section">
        <div className="showcase-header">
          <h2 className="header-font">Select a Tool</h2>
        </div>
        <div className="tools-grid">
          {creativeTools.map(tool => (
            <div key={tool.id} className="tool-card card-imperfect" onClick={() => handleToolSelect(tool.id)}>
              <div className="tool-card-header">{tool.icon}</div>
              <h3 className="header-font" style={{marginTop: '1rem'}}>{tool.title}</h3>
              <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem'}}>{tool.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="showcase-section" style={{marginTop: '4rem', padding: '2rem', background: 'var(--bg-panel)', borderRadius: '12px', border: '2px solid var(--text-primary)', boxShadow: '4px 4px 0px var(--text-primary)'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem'}}>
          <h2 className="header-font" style={{fontSize: '22px', margin: 0}}>Import Project using JCT</h2>
          <span 
            className="help-icon"
            onClick={() => setShowSafeInfo(!showSafeInfo)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'white',
              border: '2px solid var(--text-primary)',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '1px 1px 0px black'
            }}
            title="Click to learn why JCT is safe!"
          >
            ?
          </span>
        </div>

        {/* Expandable security box explaining why it is safe */}
        {showSafeInfo && (
          <div style={{
            background: 'var(--bg-app)',
            border: '2px solid var(--text-primary)',
            borderRadius: '8px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            fontSize: '0.95rem',
            boxShadow: '3px 3px 0px black',
            lineHeight: '1.5'
          }}>
            <h4 className="header-font" style={{margin: '0 0 0.5rem 0', color: 'var(--accent-secondary)', fontSize: '16px'}}>🔒 Why is JCT 100% Safe?</h4>
            <p style={{margin: 0}}>
              Your files never go to the internet or any company! Everything runs right inside your own web browser. The `.jct` project files are just simple documents saved directly on your computer's hard drive. Nobody else can ever see your images.
            </p>
          </div>
        )}

        {/* Warning Auto-Save Prompt */}
        <div style={{
          background: 'rgba(234, 84, 85, 0.08)',
          border: '2px solid #ea5455',
          borderRadius: '8px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          fontSize: '0.95rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          boxShadow: '3px 3px 0px rgba(234, 84, 85, 0.15)',
          lineHeight: '1.5'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: '#ea5455'}}>
            <span>⚠️ Important Auto-Save Notice:</span>
          </div>
          <p style={{margin: 0}}>
            Your changes are auto-saved in your browser's temporary memory. But <strong>your projects will be lost when you quit the tab or clear your browser history/cache!</strong> We strongly recommend clicking <strong>"Export .JCT"</strong> inside the canvas to save your work permanently on your computer.
          </p>
        </div>

        {/* Import Action */}
        <div style={{display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap'}}>
          <label className="btn btn-primary" style={{cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem'}}>
            <Upload size={18} /> Open `.jct` Project File
            <input 
              type="file" 
              accept=".jct" 
              onChange={handleJCTImport} 
              style={{display: 'none'}} 
            />
          </label>
          <span style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
            Select a `.jct` project file from your computer to pick up right where you left off.
          </span>
        </div>
      </section>

      {showNameModal && (
        <div className="modal-overlay">
          <div className="modal-content card-imperfect">
            <h2 className="header-font" style={{marginBottom: '1rem', fontSize: '24px'}}>Name Your Project</h2>
            <p style={{color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem'}}>
              Give your workspace a name so you can search for it easily later.
            </p>
            <form onSubmit={handleConfirmName}>
              <input 
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                style={{
                  width: '100%',
                  marginBottom: '1.5rem',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  background: 'var(--bg-app)',
                  border: '2px solid var(--text-primary)',
                  borderRadius: '8px',
                  boxShadow: 'inset 2px 2px 0px rgba(0,0,0,0.1)',
                  outline: 'none'
                }}
                placeholder="Enter project name..."
                autoFocus
                required
              />
              <div style={{display: 'flex', gap: '0.75rem', justifyContent: 'flex-end'}}>
                <button type="button" className="btn" onClick={() => setShowNameModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
