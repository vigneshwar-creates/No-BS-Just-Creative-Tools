import React from 'react';
import { ArrowRight, Zap, Shield, BatteryCharging } from 'lucide-react';
import './Landing.css';

export default function Landing({ onEnter }) {
  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="logo header-font">JCT</div>
        <button className="btn btn-primary nav-btn" onClick={onEnter}>
          Open Workspace
        </button>
      </nav>

      <main className="hero-section">
        <h1 className="hero-title header-font">
          <span className="gradient-text">No BS.</span> Just Creative Tools.
        </h1>
        <p className="hero-subtitle">
          Lightning-fast image, audio, and document processing directly in your browser. 
          No servers, no subscriptions, zero privacy concerns. Powered by Rust & WebAssembly.
        </p>
        <button className="btn btn-primary cta-btn" onClick={onEnter}>
          Enter Workspace <ArrowRight size={20} />
        </button>
      </main>

      <section className="features-grid">
        <div className="feature-card">
          <Shield size={32} className="feature-icon" />
          <h3 className="header-font">100% Local & Private</h3>
          <p>Your files never leave your device. We eliminated expensive backends so you keep total ownership of your work.</p>
        </div>
        <div className="feature-card">
          <Zap size={32} className="feature-icon" />
          <h3 className="header-font">Blazing Fast Engine</h3>
          <p>Compiled to WebAssembly and rendered via WebGPU, JCT rivals native desktop software without the installation bloat.</p>
        </div>
        <div className="feature-card">
          <BatteryCharging size={32} className="feature-icon" />
          <h3 className="header-font">Zero Friction</h3>
          <p>No logins, no dashboards, no clutter. Instantly drop your files onto the canvas and start creating immediately.</p>
        </div>
      </section>
    </div>
  );
}
