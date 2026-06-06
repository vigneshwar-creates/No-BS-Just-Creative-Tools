import React from 'react';
import { ArrowLeft, Type, ImageIcon, Layers, Download, PlusSquare, Eraser, Move } from 'lucide-react';
import './DesignCanvas.css';

export default function DesignCanvas({ onBack }) {
  return (
    <div className="design-canvas-container">
      <header className="design-canvas-header">
        <div className="header-left">
          <button className="btn back-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
          <h2>Canvas Image & Text Editor</h2>
        </div>
        <div className="header-right">
          <button className="btn btn-primary">
            <Download size={16} /> Export Design
          </button>
        </div>
      </header>

      <div className="design-canvas-layout">
        <aside className="design-canvas-sidebar">
          <div className="sidebar-tab-content">
            <h3 className="section-title">Tools</h3>
            <div className="tool-grid">
              <button className="btn tool-btn"><Type size={18} /> Text</button>
              <button className="btn tool-btn"><ImageIcon size={18} /> Image</button>
              <button className="btn tool-btn"><PlusSquare size={18} /> Shape</button>
              <button className="btn tool-btn"><Eraser size={18} /> Eraser</button>
            </div>
            
            <h3 className="section-title" style={{marginTop: '2rem'}}>Layers</h3>
            <div className="layers-panel" style={{flex: 1, backgroundColor: 'var(--bg-color)', border: '2px solid var(--border-color)', borderRadius: '8px', padding: '1rem'}}>
              <p style={{textAlign: 'center', color: 'var(--text-muted)'}}>No layers yet</p>
            </div>
          </div>
        </aside>

        <main className="design-canvas-main">
          <div className="canvas-wrapper" style={{width: '600px', height: '600px', backgroundColor: '#fff', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '4px 4px 0px rgba(0,0,0,0.1)'}}>
            <span style={{color: 'var(--text-muted)'}}>Design Canvas Placeholder</span>
          </div>
        </main>
      </div>
    </div>
  );
}
