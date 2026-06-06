import React from 'react';
import { ArrowLeft, Play, Pause, Scissors, Download, Monitor, Smartphone, LayoutGrid } from 'lucide-react';
import './VideoEditor.css';

export default function VideoEditor({ onBack }) {
  return (
    <div className="video-editor-container">
      <header className="video-editor-header">
        <div className="header-left">
          <button className="btn back-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
          <h2>Video Editor (basic)</h2>
        </div>
        <div className="header-right">
          <button className="btn btn-primary">
            <Download size={16} /> Export Video
          </button>
        </div>
      </header>

      <div className="video-editor-layout">
        <aside className="video-editor-sidebar">
          <div className="sidebar-tab-content">
            <h3 className="section-title">Timeline Tools</h3>
            <div className="tool-grid">
              <button className="btn tool-btn"><Scissors size={18} /> Split</button>
              <button className="btn tool-btn"><Play size={18} /> Play</button>
            </div>
            
            <h3 className="section-title" style={{marginTop: '2rem'}}>Aspect Ratio</h3>
            <div className="ratio-presets">
              <button className="ratio-btn active"><Monitor size={20} /> 16:9</button>
              <button className="ratio-btn"><Smartphone size={20} /> 9:16</button>
              <button className="ratio-btn"><LayoutGrid size={20} /> 1:1</button>
            </div>
          </div>
        </aside>

        <main className="video-editor-main">
          <div className="video-preview-wrapper" style={{width: '640px', height: '360px', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{color: '#fff'}}>Video Preview Placeholder</span>
          </div>
          
          <div className="timeline-container" style={{position: 'absolute', bottom: '20px', left: '20px', right: '20px', height: '100px', backgroundColor: 'var(--bg-panel)', border: '2px solid var(--text-primary)', borderRadius: '12px'}}>
            <div style={{padding: '1rem', textAlign: 'center'}}>Timeline Placeholder</div>
          </div>
        </main>
      </div>
    </div>
  );
}
