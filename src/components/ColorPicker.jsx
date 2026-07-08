import React, { useState, useEffect } from 'react';
import './ColorPicker.css';

const SWATCHES = [
  '#000000', '#1E293B', '#FFFFFF', '#F8FAFC', 
  '#3B82F6', '#60A5FA', '#F97316', '#EC4899',
  '#10B981', '#8B5CF6', '#EF4444', '#F59E0B',
  '#FF5733', '#C70039', '#900C3F', '#581845'
];

export default function ColorPicker({ color = '#3B82F6', onChange }) {
  const [hex, setHex] = useState(color);
  const [mode, setMode] = useState('default'); // 'default' or 'advanced'

  useEffect(() => {
    setHex(color);
  }, [color]);

  const handleHexChange = (e) => {
    const val = e.target.value;
    setHex(val);
    if (/^#[0-9A-Fa-f]{6}$/i.test(val)) {
      onChange?.(val);
    }
  };

  const selectColor = (c) => {
    setHex(c);
    onChange?.(c);
  };

  return (
    <div className="color-picker-root">
      <div className="color-picker-header">
        <label className="color-picker-label">Color</label>
        <div className="color-picker-preview" style={{ backgroundColor: hex }}></div>
      </div>
      
      <div className="color-picker-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <button 
          onClick={() => setMode('default')} 
          style={{ flex: 1, padding: '4px', fontSize: '10px', background: mode === 'default' ? 'var(--bg-panel-hover)' : 'transparent', color: mode === 'default' ? 'var(--accent-primary)' : 'var(--text-secondary)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Default
        </button>
        <button 
          onClick={() => setMode('advanced')} 
          style={{ flex: 1, padding: '4px', fontSize: '10px', background: mode === 'advanced' ? 'var(--bg-panel-hover)' : 'transparent', color: mode === 'advanced' ? 'var(--accent-primary)' : 'var(--text-secondary)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Advanced
        </button>
      </div>
      
      {mode === 'default' ? (
        <>
          <div className="color-picker-swatches">
            {SWATCHES.map((c) => (
              <button
                key={c}
                className={`color-swatch ${c === hex ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => selectColor(c)}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
          <div className="color-picker-input-group" style={{ marginTop: '0.5rem' }}>
            <span className="color-picker-hash">#</span>
            <input
              type="text"
              className="color-picker-input"
              value={hex.replace('#', '')}
              onChange={handleHexChange}
              maxLength={6}
            />
          </div>
        </>
      ) : (
        <div className="color-picker-advanced" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <input 
            type="color" 
            value={hex} 
            onChange={handleHexChange} 
            style={{ width: '100%', height: '40px', padding: '0', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
          />
          <div className="color-picker-input-group">
            <span className="color-picker-hash">#</span>
            <input
              type="text"
              className="color-picker-input"
              value={hex.replace('#', '')}
              onChange={handleHexChange}
              maxLength={6}
            />
          </div>
        </div>
      )}
    </div>
  );
}
