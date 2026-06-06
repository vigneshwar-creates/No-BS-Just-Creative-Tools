import React from 'react';
import { ArrowLeft, Scissors, Square, Check, RotateCcw } from 'lucide-react';
import './ImageCropper.css';

export default function ImageCropper({ onBack }) {
  return (
    <div className="image-cropper-container">
      <header className="image-cropper-header">
        <div className="header-left">
          <button className="btn back-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
          <h2>Freehand & Shape Cropper</h2>
        </div>
        <div className="header-right">
          <button className="btn btn-primary">
            <Check size={16} /> Save Crop
          </button>
        </div>
      </header>

      <div className="image-cropper-layout">
        <aside className="image-cropper-sidebar">
          <div className="sidebar-tab-content">
            <h3 className="section-title">Crop Mode</h3>
            <div className="tool-grid" style={{display: 'flex', gap: '0.5rem', marginTop: '1rem'}}>
              <button className="btn tool-btn active" style={{flex: 1}}><Square size={18} /> Standard</button>
              <button className="btn tool-btn" style={{flex: 1}}><Scissors size={18} /> Freehand</button>
            </div>
            
            <h3 className="section-title" style={{marginTop: '2rem'}}>Aspect Ratio</h3>
            <div className="ratio-presets" style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem'}}>
              <button className="btn active">Free</button>
              <button className="btn">1:1</button>
              <button className="btn">16:9</button>
              <button className="btn">4:3</button>
            </div>

            <div style={{marginTop: 'auto'}}>
              <button className="btn" style={{width: '100%'}}><RotateCcw size={16}/> Reset</button>
            </div>
          </div>
        </aside>

        <main className="image-cropper-main">
          <div className="crop-workspace-wrapper" style={{width: '600px', height: '600px', backgroundColor: 'var(--bg-color)', border: '2px dashed var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px'}}>
            <span style={{color: 'var(--text-muted)'}}>Image Canvas Placeholder</span>
          </div>
        </main>
      </div>
    </div>
  );
}
