import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, FileText, Image as ImageIcon, Music, Sparkles, Camera } from 'lucide-react';
import { get } from 'idb-keyval';
import './Landing.css';

export default function Landing({ onEnter }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentProject, setRecentProject] = useState(null);

  useEffect(() => {
    get('jct-project').then(saved => {
      if (saved) {
        setRecentProject(saved);
      }
    });
  }, []);

  const defaultProjects = [
    { id: 1, name: 'Podcast Intro Edit', type: 'audio', date: '2 days ago' },
    { id: 2, name: 'Summer Campaign Poster', type: 'image', date: 'Last week' },
    { id: 3, name: 'Q3 Financial Report', type: 'document', date: '2 weeks ago' },
  ];

  const displayProjects = recentProject 
    ? [{...recentProject, date: 'Just now'}, ...defaultProjects] 
    : defaultProjects;

  const filteredProjects = displayProjects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIconForType = (type) => {
    switch (type) {
      case 'image': return <ImageIcon size={24} className="project-icon icon-image" />;
      case 'audio': return <Music size={24} className="project-icon icon-audio" />;
      case 'document': return <FileText size={24} className="project-icon icon-doc" />;
      default: return <FileText size={24} className="project-icon" />;
    }
  };

  const creativeTools = [
    {
      id: 'smart-fit',
      title: 'Smart-Fit Canvas',
      desc: 'Intelligent crop & expand. Seamlessly generate background edges locally.',
      icon: <ImageIcon size={32} className="tool-icon icon-image" />
    },
    {
      id: 'camera-crop',
      title: 'Local Camera Cropper',
      desc: 'Snap frame captures using your webcam and instantly crop them locally.',
      icon: <Camera size={32} className="tool-icon" style={{color: 'var(--accent-primary)'}} />
    },
    {
      id: 'audio',
      title: 'Voice & Reverb Engine',
      desc: 'Isolate vocal audio and strip noise via local DSP processing sliders.',
      icon: <Music size={32} className="tool-icon icon-audio" />
    },
    {
      id: 'document',
      title: 'Magnetic Document Editor',
      desc: 'Fluid block-based layouts. Text magnetically wraps around objects.',
      icon: <FileText size={32} className="tool-icon icon-doc" />
    }
  ];

  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="logo header-font">JCT <Sparkles size={16} color="var(--accent-highlight)" style={{display: 'inline', marginLeft: '4px'}}/></div>
        <button className="btn" onClick={() => onEnter('smart-fit')}>
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
            <div key={tool.id} className="tool-card card-imperfect" onClick={() => onEnter(tool.id)}>
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
    </div>
  );
}
