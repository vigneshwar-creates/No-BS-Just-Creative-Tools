import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import Landing from './Landing.jsx';
import './index.css';

function RootComponent() {
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [activeTool, setActiveTool] = useState('smart-fit'); // 'smart-fit', 'camera-crop', 'audio', 'document'
  const [projectName, setProjectName] = useState('');

  return showWorkspace ? (
    <App 
      activeTool={activeTool} 
      projectName={projectName}
      onBack={() => setShowWorkspace(false)} 
    />
  ) : (
    <Landing onEnter={(tool, name) => {
      setActiveTool(tool || 'smart-fit');
      setProjectName(name || 'Untitled Project');
      setShowWorkspace(true);
    }} />
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);
