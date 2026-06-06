import React from 'react';
import { ArrowLeft, Camera, Check, RotateCcw } from 'lucide-react';
import './CameraCropper.css';

export default function CameraCropper({ onBack }) {
  return (
    <div className="camera-cropper-container">
      <header className="camera-cropper-header">
        <div className="header-left">
          <button className="btn back-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
          <h2>Webcam Photo Cropper</h2>
        </div>
        <div className="header-right">
          <button className="btn btn-primary">
            <Check size={16} /> Save Image
          </button>
        </div>
      </header>

      <div className="camera-cropper-layout">
        <aside className="camera-cropper-sidebar">
          <div className="sidebar-tab-content">
            <h3 className="section-title">Camera Controls</h3>
            <div className="tool-grid" style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
              <button className="btn tool-btn" style={{width: '100%'}}><Camera size={18} /> Capture Photo</button>
              <button className="btn tool-btn" style={{width: '100%'}}><RotateCcw size={18} /> Retake</button>
            </div>
            
            <div style={{marginTop: 'auto', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
              <p className="text-12" style={{color: 'var(--text-secondary)'}}>Grant camera permissions to use this tool.</p>
            </div>
          </div>
        </aside>

        <main className="camera-cropper-main">
          <div className="camera-feed-wrapper" style={{width: '640px', height: '480px', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: '2px solid var(--text-primary)'}}>
            <span style={{color: '#fff'}}>Camera Feed Placeholder</span>
          </div>
        </main>
      </div>
    </div>
  );
}
