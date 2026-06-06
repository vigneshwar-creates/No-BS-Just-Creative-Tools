import React, { useState } from 'react';
import './ColorPicker.css';

const SWATCHES = [
  '#000000', '#1E293B', '#FFFFFF', '#F8FAFC', 
  '#3B82F6', '#60A5FA', '#F97316', '#EC4899',
  '#10B981', '#8B5CF6', '#EF4444', '#F59E0B'
];

export default function ColorPicker({ value = '#3B82F6', onChange }) {
  const [hex, setHex] = useState(value);

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
      
      <div className="color-picker-swatches">
        {SWATCHES.map((color) => (
          <button
            key={color}
            className={`color-swatch ${color === hex ? 'active' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => selectColor(color)}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>
      
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
  );
}
