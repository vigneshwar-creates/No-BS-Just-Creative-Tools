import React from 'react';
import { ArrowLeft, Play, Pause, Download, Settings, Image as ImageIcon, Type, Sparkles } from 'lucide-react';
import './GifEditor.css';

export default function GifEditor({ onBack }) {
  return (
    <div className="gif-editor-container">
      <header className="gif-editor-header">
        <div className="header-left">
          <button className="btn back-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
          <h2>GIF Creator & Editor</h2>
        </div>
        <div className="header-right">
          <button className="btn btn-primary">
            <Download size={16} /> Export GIF
          </button>
        </div>
      </header>

      <div className="gif-editor-layout">
        <aside className="gif-editor-sidebar">
          <div className="sidebar-tab-content">
            <h3 className="section-title">Editor Tools</h3>
            <div className="tool-grid">
              <button className="btn tool-btn"><Type size={18} /> Add Text</button>
              <button className="btn tool-btn"><ImageIcon size={18} /> Add Image</button>
            </div>
            
            <h3 className="section-title" style={{marginTop: '2rem'}}>Settings</h3>
            <div className="settings-panel">
              <label>Framerate (fps)</label>
              <input type="range" min="1" max="60" defaultValue="15" style={{width: '100%'}}/>
            </div>
          </div>
        </aside>

        <main className="gif-editor-main">
          <div className="gif-preview-wrapper" style={{width: '500px', height: '500px', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{color: '#fff'}}>GIF Preview Placeholder</span>
          </div>
          
          <div className="timeline-container" style={{position: 'absolute', bottom: '20px', left: '20px', right: '20px', height: '120px', backgroundColor: 'var(--bg-panel)', border: '2px solid var(--text-primary)', borderRadius: '12px'}}>
            <div style={{padding: '1rem', textAlign: 'center'}}>Frames Timeline Placeholder</div>
          </div>
        </main>
      </div>
    </div>
  );
}
