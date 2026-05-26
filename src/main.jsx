import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import Landing from './Landing.jsx';
import './index.css';

function RootComponent() {
  const [showWorkspace, setShowWorkspace] = useState(false);

  return showWorkspace ? (
    <App />
  ) : (
    <Landing onEnter={() => setShowWorkspace(true)} />
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);
