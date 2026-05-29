import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, Image as ImageIcon, Sparkles, Camera, Scissors, Layers } from 'lucide-react';
import { get } from 'idb-keyval';
import './Landing.css';

export default function Landing({ onEnter }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentProject, setRecentProject] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');

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
      'smart-fit': 'Smart-Fit Canvas Project',
      'image-crop': 'Organic Crop Project',
      'camera-crop': 'Camera Capture Project',
      'design-canvas': 'Advanced Design Canvas',
      'gif-editor': 'Creative GIF Project'
    };
    setNewProjectName(toolNames[toolId] || 'New Workspace Project');
    setShowNameModal(true);
  };

  const handleConfirmName = (e) => {
    if (e) e.preventDefault();
    setShowNameModal(false);
    onEnter(selectedTool, newProjectName.trim() || 'Untitled Workspace');
  };

  const defaultProjects = [
    { id: 1, name: 'Summer Campaign Poster', type: 'image', date: 'Last week' },
    { id: 2, name: 'Autumn Creative Overlay', type: 'image', date: '2 weeks ago' },
  ];

  const displayProjects = recentProject 
    ? [{...recentProject, date: 'Just now'}, ...defaultProjects] 
    : defaultProjects;

  const filteredProjects = displayProjects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIconForType = (type) => {
    return <ImageIcon size={24} className="project-icon icon-image" />;
  };

  const creativeTools = [
    {
      id: 'smart-fit',
      title: 'Smart-Fit Canvas',
      desc: 'Intelligent crop & expand. Seamlessly generate background edges locally.',
      icon: <ImageIcon size={32} className="tool-icon icon-image" />
    },
    {
      id: 'image-crop',
      title: 'Organic Image Cropper',
      desc: 'Crop local photos in standard dimensions or draw a freehand lasso cutout.',
      icon: <Scissors size={32} className="tool-icon" style={{color: 'var(--accent-secondary)'}} />
    },
    {
      id: 'camera-crop',
      title: 'Local Camera Cropper',
      desc: 'Snap frame captures using your webcam and instantly crop them locally.',
      icon: <Camera size={32} className="tool-icon" style={{color: 'var(--accent-primary)'}} />
    },
    {
      id: 'design-canvas',
      title: 'Advanced Design Canvas',
      desc: 'Layers, color adjustments, custom text, custom font uploads, and drawing.',
      icon: <Layers size={32} className="tool-icon" style={{color: 'var(--accent-primary)'}} />
    },
    {
      id: 'gif-editor',
      title: 'Creative GIF Editor',
      desc: 'Upload GIFs or record webcam bursts. Overlay text, emojis, and custom drawings.',
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
        <h1 className="hero-title header-font">
          Create <span className="highlight-text">freely</span>.<br/>No subscriptions. No servers.
        </h1>
        <p className="hero-subtitle">
          Your files stay on your device. Just powerful, lightning-fast tools that feel like magic.
        </p>
        <div style={{display: 'flex', gap: '1rem'}}>
          <a href="#tools-hub" className="btn btn-primary cta-btn" style={{textDecoration: 'none'}}>
            Explore Tools <ArrowRight size={20} />
          </a>
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

      <section className="showcase-section" style={{marginTop: '4rem'}}>
        <div className="showcase-header">
          <h2 className="header-font">Your Projects</h2>
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search past work..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="projects-grid">
          {filteredProjects.length > 0 ? (
            filteredProjects.map(project => (
              <div key={project.id} className="project-card" onClick={() => onEnter(project.type)}>
                <div className="project-card-header">
                  {getIconForType(project.type)}
                </div>
                <div className="project-card-body">
                  <h3 className="header-font">{project.name}</h3>
                  <p>{project.date}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>No projects found matching "{searchQuery}".</p>
            </div>
          )}
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
