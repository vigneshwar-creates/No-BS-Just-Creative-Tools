import React, { useState, useEffect } from 'react';
import { ArrowRight, Search, FileText, Image as ImageIcon, Music, Sparkles } from 'lucide-react';
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

  // Mock projects to showcase the grid
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

  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="logo header-font">JCT <Sparkles size={16} color="var(--accent-highlight)" style={{display: 'inline', marginLeft: '4px'}}/></div>
        <button className="btn" onClick={onEnter}>
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
        <button className="btn btn-primary cta-btn" onClick={onEnter}>
          Start Creating <ArrowRight size={20} />
        </button>
      </main>

      <section className="showcase-section">
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
              <div key={project.id} className="project-card" onClick={onEnter}>
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
