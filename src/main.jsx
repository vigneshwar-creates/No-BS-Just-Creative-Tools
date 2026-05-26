import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import Landing from './Landing.jsx';
import './index.css';

function RootComponent() {
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [activeTool, setActiveTool] = useState('smart-fit'); // 'smart-fit', 'camera-crop', 'audio', 'document'

  return showWorkspace ? (
    <App 
      activeTool={activeTool} 
      onBack={() => setShowWorkspace(false)} 
    />
  ) : (
    <Landing onEnter={(tool) => {
      setActiveTool(tool || 'smart-fit');
      setShowWorkspace(true);
    }} />
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);
