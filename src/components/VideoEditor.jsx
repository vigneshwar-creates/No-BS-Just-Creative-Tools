import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, Download, Scissors, Maximize,
  Upload, Trash2, Clock, RotateCcw, Volume2, Video, ArrowLeft
} from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import './VideoEditor.css';

export default function VideoEditor({ onBack }) {
  // FFmpeg State
  const ffmpegRef = useRef(new FFmpeg());
  const [isFfmpegLoaded, setIsFfmpegLoaded] = useState(false);

  // Video State
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1);

  const [videoMetadata, setVideoMetadata] = useState({
    duration: 0,
    width: 0,
    height: 0
  });

  // Editor State
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [cropAspectRatio, setCropAspectRatio] = useState('original'); // original, 16:9, 9:16, 1:1

  // Export State
  const [exportState, setExportState] = useState('idle'); // idle, rendering, complete, error
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState('');
  const [exportLogs, setExportLogs] = useState([]);
  
  const [toastMsg, setToastMsg] = useState('');

  // Context Menu State
  const [contextMenu, setContextMenu] = useState(null);

  // Welcome modal — show once per session
  const [showWelcome, setShowWelcome] = useState(() => {
    return !sessionStorage.getItem('jct-ve-welcomed');
  });

  const dismissWelcome = () => {
    sessionStorage.setItem('jct-ve-welcomed', '1');
    setShowWelcome(false);
  };

  useEffect(() => {
    const loadFfmpeg = async () => {
      const ffmpeg = ffmpegRef.current;
      ffmpeg.on('log', ({ message }) => {
        logExport(message);
      });
      try {
        await ffmpeg.load({
          coreURL: '/node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js',
          wasmURL: '/node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm'
        });
        setIsFfmpegLoaded(true);
      } catch (err) {
        logExport('Failed loading FFmpeg locally, trying default unpkg CDN...');
        try {
          await ffmpeg.load();
          setIsFfmpegLoaded(true);
        } catch (e) {
          logExport('CRITICAL ERROR: Could not load FFmpeg');
        }
      }
    };
    loadFfmpeg();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const logExport = (msg) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setExportLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "00:00.0";
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    const ms = Math.floor((seconds % 1) * 10).toString();
    return `${m}:${s}.${ms}`;
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoFile(file);
      setVideoUrl(url);
      setIsLoaded(false);
      setExportState('idle');
      setExportedVideoUrl('');
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoUrl('');
    setIsLoaded(false);
    setIsPlaying(false);
  };

  const onVideoLoaded = () => {
    const vid = videoRef.current;
    if (vid) {
      setVideoMetadata({
        duration: vid.duration,
        width: vid.videoWidth,
        height: vid.videoHeight
      });
      setTrimStart(0);
      setTrimEnd(vid.duration);
      setCurrentTime(0);
      setIsLoaded(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);

      if (current >= trimEnd) {
        if (isLooping) {
          videoRef.current.currentTime = trimStart;
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
          videoRef.current.currentTime = trimStart;
        }
      }
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.volume = volume;
    }
  }, [playbackSpeed, volume]);

  const handleTimelineMouseDown = (e) => {
    if (!isLoaded || !videoMetadata) return;
    
    // Left click only for playhead
    if (e.button !== 0) return;

    const timelineRect = e.currentTarget.getBoundingClientRect();
    const updateTime = (clientX) => {
      const x = Math.max(0, Math.min(clientX - timelineRect.left, timelineRect.width));
      const percentage = x / timelineRect.width;
      let newTime = percentage * videoMetadata.duration;
      
      if (newTime < trimStart) newTime = trimStart;
      if (newTime > trimEnd) newTime = trimEnd;
      
      setCurrentTime(newTime);
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
      }
    };

    updateTime(e.clientX);

    const onMouseMove = (moveEvent) => updateTime(moveEvent.clientX);
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Context Menu Logic
  const handleTimelineContextMenu = (e) => {
    e.preventDefault();
    if (!isLoaded || !videoMetadata) return;

    const timelineRect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - timelineRect.left;
    const percentage = clickX / timelineRect.width;
    const clickTime = percentage * videoMetadata.duration;

    setContextMenu({
      mouseX: e.clientX,
      mouseY: e.clientY,
      clickTime: clickTime
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleCutLeft = () => {
    if (contextMenu) {
      setTrimStart(contextMenu.clickTime);
      if (contextMenu.clickTime > trimEnd) {
        setTrimEnd(videoMetadata.duration);
      }
      if (videoRef.current) videoRef.current.currentTime = contextMenu.clickTime;
    }
    closeContextMenu();
  };

  const handleCutRight = () => {
    if (contextMenu) {
      setTrimEnd(contextMenu.clickTime);
      if (contextMenu.clickTime < trimStart) {
        setTrimStart(0);
      }
    }
    closeContextMenu();
  };

  // Preview Aspect Ratio masks
  const getAspectRatioPreviewStyles = () => {
    if (cropAspectRatio === 'original') return { leftMask: '0%', rightMask: '0%' };
    
    let targetRatio = 1;
    if (cropAspectRatio === '16:9') targetRatio = 16/9;
    if (cropAspectRatio === '9:16') targetRatio = 9/16;
    
    const currentRatio = videoMetadata.width / videoMetadata.height;
    
    if (currentRatio > targetRatio) {
      const targetWidth = videoMetadata.height * targetRatio;
      const maskWidth = ((videoMetadata.width - targetWidth) / 2) / videoMetadata.width * 100;
      return { leftMask: `${maskWidth}%`, rightMask: `${maskWidth}%` };
    } else if (currentRatio < targetRatio) {
      // For simplicity in preview, we only mask width in this UI
      return { leftMask: '0%', rightMask: '0%' }; 
    }
    return { leftMask: '0%', rightMask: '0%' };
  };

  const aspectStyles = getAspectRatioPreviewStyles();

  // FFmpeg WebAssembly Export Process
  const startVideoExport = async () => {
    const video = videoRef.current;
    if (!video || !isLoaded) return;
    
    if (!isFfmpegLoaded) {
      showToast('FFmpeg is still loading, please wait...');
      return;
    }

    setIsPlaying(false);
    video.pause();

    setExportState('rendering');
    setExportProgress(0);
    setExportLogs([]);
    setExportedVideoUrl('');

    const ffmpeg = ffmpegRef.current;
    
    logExport('Starting FFmpeg WASM Export process...');
    logExport(`Trim: ${formatTime(trimStart)} to ${formatTime(trimEnd)}`);

    try {
      logExport('Loading video into memory...');
      let fileData;
      if (videoFile) {
        fileData = await fetchFile(videoFile);
      } else {
        fileData = await fetchFile(videoUrl);
      }
      await ffmpeg.writeFile('input.mp4', fileData);

      let vf = [];
      
      // crop filter
      if (cropAspectRatio !== 'original') {
        if (cropAspectRatio === '16:9') {
          vf.push(`crop=iw:iw*(9/16)`);
        } else if (cropAspectRatio === '9:16') {
          vf.push(`crop=ih*(9/16):ih`);
        } else if (cropAspectRatio === '1:1') {
          vf.push(`crop=min(iw\\,ih):min(iw\\,ih)`);
        }
      }

      const vfString = vf.join(',');
      const duration = trimEnd - trimStart;

      let args = [];
      // -ss BEFORE -i = fast input seek with clean keyframes (avoids timestamp drift/stuttering)
      args.push('-ss', `${trimStart}`);
      args.push('-i', 'input.mp4');
      // -t is duration from the seek point (more reliable than -to after input seek)
      args.push('-t', `${duration}`);

      if (vfString.length > 0) {
        args.push('-vf', vfString);
      }

      args.push('-af', `volume=${volume}`);
      args.push('-c:v', 'libx264');
      args.push('-preset', 'fast');      // fast = good quality motion vectors
      args.push('-crf', '23');           // constant quality, no bitrate spikes
      args.push('-c:a', 'aac');          // re-encode audio cleanly
      args.push('-reset_timestamps', '1'); // force output to start from 0:00
      args.push('-movflags', '+faststart'); // web-optimized mp4
      args.push('output.mp4');

      logExport(`Running command: ffmpeg ${args.join(' ')}`);

      ffmpeg.on('progress', ({ progress, time }) => {
        setExportProgress(Math.min(99, Math.round(progress * 100)));
      });

      const execResult = await ffmpeg.exec(args);
      
      if (execResult !== 0) {
          throw new Error('FFmpeg processing failed.');
      }

      logExport('Reading output file...');
      const data = await ffmpeg.readFile('output.mp4');
      
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const downloadUrl = URL.createObjectURL(blob);
      
      setExportedVideoUrl(downloadUrl);
      setExportProgress(100);
      setExportState('complete');
      logExport('SUCCESS: Video compile finished successfully!');
      showToast('Export Completed!');

    } catch (error) {
      console.error(error);
      logExport(`ERROR: ${error.message}`);
      setExportState('error');
      showToast('Export Failed!');
    }
  };

  return (
    <div className="video-editor-container" onClick={closeContextMenu}>
      {/* Editor Header */}
      <header className="video-editor-header">
        <div className="header-left">
          <button className="btn" onClick={onBack} style={{padding: '0.4rem'}}>
            <ArrowLeft size={16}/> Back
          </button>
          <h1 className="header-font" style={{fontSize: '18px', margin: 0}}>Video Editor <span style={{color: 'var(--accent-primary)', fontSize: '14px'}}>(basic)</span></h1>
        </div>
        <div className="header-right">
          {isLoaded && (
            <button className="btn btn-primary" onClick={startVideoExport}>
              <Download size={16}/> Export Video
            </button>
          )}
        </div>
      </header>

      <div className="video-editor-layout">
        {/* Left Sidebar Tools (Unified Toolset) */}
        <aside className="video-editor-sidebar">
          <div className="sidebar-tab-content">
            <h3 className="header-font" style={{fontSize: '18px', marginBottom: '1.5rem'}}>Video Tools</h3>

            {/* Trimming Section */}
            <div className="tool-section">
              <label className="tool-label"><Scissors size={14}/> Trim Video</label>
              <div className="tool-row" style={{display: 'flex', gap: '8px', marginBottom: '10px'}}>
                <div style={{flex: 1}}>
                  <div className="text-12" style={{color: 'var(--text-secondary)', marginBottom: '4px'}}>Start Time</div>
                  <input 
                    type="range" 
                    min={0} max={videoMetadata.duration} step="0.1" 
                    value={trimStart} 
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val < trimEnd) setTrimStart(val);
                      if (videoRef.current) videoRef.current.currentTime = val;
                    }}
                    className="slider"
                  />
                  <div className="text-12" style={{textAlign: 'right'}}>{formatTime(trimStart)}</div>
                </div>
                <div style={{flex: 1}}>
                  <div className="text-12" style={{color: 'var(--text-secondary)', marginBottom: '4px'}}>End Time</div>
                  <input 
                    type="range" 
                    min={0} max={videoMetadata.duration} step="0.1" 
                    value={trimEnd} 
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val > trimStart) setTrimEnd(val);
                      if (videoRef.current) videoRef.current.currentTime = val;
                    }}
                    className="slider"
                  />
                  <div className="text-12" style={{textAlign: 'right'}}>{formatTime(trimEnd)}</div>
                </div>
              </div>
              <p className="text-12" style={{color: 'var(--text-secondary)'}}>
                Tip: Right-click on the timeline below to quickly cut left/right.
              </p>
            </div>

            {/* Cropping Section */}
            <div className="tool-section">
              <label className="tool-label"><Maximize size={14}/> Aspect Ratio / Crop</label>
              <div className="filter-grid">
                {[
                  { id: 'original', name: 'Original' },
                  { id: '16:9', name: '16:9 (YouTube)' },
                  { id: '9:16', name: '9:16 (TikTok)' },
                  { id: '1:1', name: '1:1 (Insta)' }
                ].map(ratio => (
                  <div 
                    key={ratio.id}
                    className={`filter-card ${cropAspectRatio === ratio.id ? 'active' : ''}`}
                    onClick={() => setCropAspectRatio(ratio.id)}
                  >
                    <div className="filter-name">{ratio.name}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Volume Section */}
            <div className="tool-section">
              <label className="tool-label"><Volume2 size={14}/> Original Audio Volume</label>
              <input 
                type="range" 
                min="0" max="2" step="0.1" 
                value={volume} 
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="slider"
              />
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px', color: 'var(--text-secondary)'}}>
                <span>Mute</span>
                <span>{(volume * 100).toFixed(0)}%</span>
                <span>200%</span>
              </div>
            </div>

            {/* Video File info */}
            {isLoaded && (
              <div className="tool-section" style={{marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '15px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <div className="text-12" style={{fontWeight: 'bold'}}>Current Video</div>
                    <div className="text-12" style={{color: 'var(--text-secondary)'}}>{videoMetadata.width}x{videoMetadata.height}</div>
                  </div>
                  <button className="video-control-btn" onClick={removeVideo} title="Remove Video">
                    <Trash2 size={16} color="#ef4444"/>
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Canvas & Timeline Area */}
        <main className="video-editor-main">

          {/* Video element always in DOM so onLoadedMetadata can fire */}
          <video 
            ref={videoRef}
            src={videoUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={onVideoLoaded}
            onEnded={() => setIsPlaying(false)}
            style={{ display: 'none' }}
          />

          <div className="video-canvas-area">
            {!isLoaded ? (
              /* Empty / upload state */
              <div className="video-empty-state">
                <div className="video-empty-icon">
                  <Video size={48} color="var(--accent-primary)"/>
                </div>
                <h2 className="header-font" style={{fontSize: '24px', marginBottom: '8px'}}>Start Your Project</h2>
                <p style={{color: 'var(--text-secondary)', marginBottom: '2rem'}}>Upload a video file to begin editing.</p>
                
                <label className="preset-video-card" style={{cursor: 'pointer', width: '180px'}}>
                  <div className="preset-video-thumbnail">
                    <Upload size={28} color="var(--accent-primary)"/>
                  </div>
                  <div className="preset-video-title">Upload Video</div>
                  <input 
                    type="file" 
                    accept="video/*" 
                    onChange={handleVideoUpload} 
                    style={{display: 'none'}} 
                  />
                </label>
              </div>
            ) : (
              /* Loaded — show native video preview */
              <div 
                className="video-canvas-wrapper" 
                style={{
                  maxWidth: `min(100%, calc(55vh * ${videoMetadata.width / (videoMetadata.height || 1)}))`,
                  aspectRatio: `${videoMetadata.width} / ${videoMetadata.height}`,
                  width: '100%'
                }}
              >
                {/* Visible playback — mirrors the hidden controller video via shared src */}
                <video 
                  src={videoUrl}
                  ref={(el) => {
                    // Keep this display video in sync by making it the primary player
                    // The hidden video above is unused once loaded; swap ref here
                    if (el) videoRef.current = el;
                  }}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  style={{width: '100%', height: '100%', objectFit: 'contain', display: 'block'}}
                />

                {cropAspectRatio !== 'original' && (
                  <>
                    <div className="aspect-ratio-mask-left" style={{ left: 0, width: aspectStyles.leftMask }} />
                    <div className="aspect-ratio-mask-right" style={{ right: 0, width: aspectStyles.rightMask }} />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Interactive Player Controls bar */}
          {isLoaded && (
            <div className="video-playback-controls">
              <button className="video-control-btn" onClick={() => {
                if (videoRef.current) videoRef.current.currentTime = trimStart;
              }} title="Rewind to Trim Start">
                <RotateCcw size={16}/>
              </button>

              <button className="video-control-btn" onClick={() => {
                if (isPlaying) {
                  videoRef.current?.pause();
                } else {
                  if (currentTime >= trimEnd) videoRef.current.currentTime = trimStart;
                  videoRef.current?.play();
                }
                setIsPlaying(!isPlaying);
              }} style={{color: 'var(--accent-primary)'}}>
                {isPlaying ? <Pause size={24} fill="currentColor"/> : <Play size={24} fill="currentColor"/>}
              </button>

              <div className="video-time-display">
                {formatTime(currentTime)} / {formatTime(videoMetadata.duration)}
              </div>

              <button 
                className="video-control-btn" 
                onClick={() => setIsLooping(!isLooping)}
                style={{opacity: isLooping ? 1 : 0.4}}
                title={isLooping ? 'Loop Mode: Active' : 'Loop Mode: Disabled'}
              >
                <Clock size={16}/>
              </button>

              <div style={{display: 'flex', gap: '4px'}}>
                {[0.5, 1, 1.5, 2].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    style={{
                      background: playbackSpeed === speed ? 'var(--accent-highlight)' : 'none',
                      border: '1.5px solid var(--text-primary)',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      padding: '2px 4px',
                      cursor: 'pointer'
                    }}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Timeline slider ranges and captions track */}
          {isLoaded && (
            <div className="video-timeline">
              <div className="video-timeline-header">
                <div className="video-timeline-header-left">
                  <span className="header-font" style={{fontSize: '13px', fontWeight: 'bold'}}>Video Timeline</span>
                </div>
                <div className="video-timeline-header-right text-12">
                  <span>Playback range: {formatTime(trimStart)} - {formatTime(trimEnd)}</span>
                </div>
              </div>

              <div className="video-timeline-scrollable" onContextMenu={handleTimelineContextMenu}>
                {/* 1. VIDEO FILMSTRIP TRACK */}
                <div 
                  className="timeline-track filmstrip" 
                  onMouseDown={handleTimelineMouseDown}
                  style={{cursor: 'crosshair'}}
                >
                  <div className="timeline-track-title">Main Track</div>

                  {/* Visual Filmstrip */}
                  <div className="timeline-filmstrip">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <div key={idx} className="filmstrip-frame">
                        <div className="filmstrip-sprocket top" />
                        <div className="filmstrip-thumbnail-placeholder" />
                        <div className="filmstrip-sprocket bottom" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Trim highlights */}
                  <div 
                    className="trim-range-highlight"
                    style={{
                      left: `${(trimStart / videoMetadata.duration) * 100}%`,
                      width: `${((trimEnd - trimStart) / videoMetadata.duration) * 100}%`
                    }}
                  />

                  {/* Left dimmed region */}
                  <div 
                    className="trim-range-dimmed-left"
                    style={{
                      left: 0,
                      width: `${(trimStart / videoMetadata.duration) * 100}%`
                    }}
                  />

                  {/* Right dimmed region */}
                  <div 
                    className="trim-range-dimmed-right"
                    style={{
                      left: `${(trimEnd / videoMetadata.duration) * 100}%`,
                      right: 0
                    }}
                  />

                  {/* Draggable Playhead */}
                  <div 
                    className="timeline-playhead"
                    style={{ left: `${(currentTime / videoMetadata.duration) * 100}%` }}
                  />
                  <div 
                    className="timeline-playhead-handle"
                    style={{ left: `${(currentTime / videoMetadata.duration) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Context Menu Popup */}
      {contextMenu && (
        <div 
          style={{
            position: 'fixed',
            top: contextMenu.mouseY,
            left: contextMenu.mouseX,
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '6px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            minWidth: '140px'
          }} 
          onMouseLeave={closeContextMenu}
        >
          <div className="text-12" style={{color: 'var(--text-secondary)', padding: '4px', textAlign: 'center', borderBottom: '1px solid var(--border)'}}>
            Time: {formatTime(contextMenu.clickTime)}
          </div>
          <button 
            className="btn btn-secondary" 
            style={{justifyContent: 'flex-start', padding: '6px', fontSize: '12px'}} 
            onClick={handleCutLeft}
          >
            ✂️ Cut till Left
          </button>
          <button 
            className="btn btn-secondary" 
            style={{justifyContent: 'flex-start', padding: '6px', fontSize: '12px'}} 
            onClick={handleCutRight}
          >
            ✂️ Cut till Right
          </button>
        </div>
      )}

      {/* Export Compiling Modal Dialog */}
      {exportState !== 'idle' && (
        <div className="video-modal-overlay">
          <div className="video-modal-content">
            <h3 className="header-font" style={{fontSize: '22px', marginBottom: '1rem'}}>
              {exportState === 'rendering' && '🎬 Rendering Video...'}
              {exportState === 'complete' && '🎉 Rendering Complete!'}
              {exportState === 'error' && '❌ Rendering Error'}
            </h3>

            {exportState === 'rendering' && (
              <p className="text-12" style={{color: 'var(--text-secondary)'}}>
                Applying trims and crops. Do not close this panel.
              </p>
            )}

            <div className="video-rendering-bar-container">
              <div 
                className="video-rendering-bar" 
                style={{ width: `${exportProgress}%` }}
              />
              <span className="video-rendering-percent">{exportProgress}%</span>
            </div>

            <div className="video-rendering-logs">
              {exportLogs.map((log, index) => (
                <div key={index} className="video-rendering-log-line">
                  <span>&gt;</span> {log}
                </div>
              ))}
            </div>

            <div style={{marginTop: '1.5rem', display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
              {exportState === 'complete' && exportedVideoUrl && (
                <a 
                  href={exportedVideoUrl} 
                  download={`${videoFile?.name?.replace(/\.[^/.]+$/, "") || 'jct-edited'}-clip.mp4`}
                  className="btn btn-primary"
                  style={{textDecoration: 'none'}}
                  onClick={() => {
                    setExportState('idle');
                    showToast('Video downloaded successfully!');
                  }}
                >
                  <Download size={15}/> Download Video File
                </a>
              )}

              {exportState === 'error' && (
                <button className="btn" onClick={() => setExportState('idle')}>
                  Close
                </button>
              )}

              {exportState === 'rendering' && (
                <button className="btn" onClick={() => {
                  setExportState('idle');
                  showToast('Export cancelled');
                }}>
                  Cancel Export
                </button>
              )}

              {exportState === 'complete' && (
                <button className="btn" onClick={() => setExportState('idle')}>
                  Close Workspace
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Welcome / Feature Overview Modal */}
      {showWelcome && (
        <div className="video-modal-overlay">
          <div className="video-modal-content" style={{maxWidth: '420px', textAlign: 'center'}}>
            <div style={{fontSize: '40px', marginBottom: '0.5rem'}}>✂️</div>
            <h3 className="header-font" style={{fontSize: '22px', marginBottom: '0.5rem'}}>Video Editor <span style={{color: 'var(--accent-primary)'}}>(basic)</span></h3>
            <p style={{color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '1.5rem'}}>
              Quick & simple. No fluff, no fuss.
            </p>

            <div style={{display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', marginBottom: '1.75rem'}}>
              {[
                { icon: '✂️', label: 'Trim / Chop', desc: 'Set start & end points or right-click timeline to cut left/right.' },
                { icon: '📐', label: 'Aspect Ratio Crop', desc: 'Crop to Original, 16:9 (YouTube), 9:16 (TikTok), or 1:1 (Instagram).' },
                { icon: '🔊', label: 'Volume Control', desc: 'Adjust original audio level before export.' },
                { icon: '💾', label: 'Export as MP4', desc: 'FFmpeg-powered export runs 100% in your browser. No uploads.' },
              ].map(feat => (
                <div key={feat.label} style={{
                  display: 'flex', gap: '12px', alignItems: 'flex-start',
                  background: 'var(--bg-color)', border: '1.5px solid var(--text-primary)',
                  borderRadius: '8px', padding: '10px 12px'
                }}>
                  <span style={{fontSize: '20px', flexShrink: 0}}>{feat.icon}</span>
                  <div>
                    <div style={{fontFamily: 'var(--font-header)', fontWeight: 700, fontSize: '13px'}}>{feat.label}</div>
                    <div style={{fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px'}}>{feat.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-primary" style={{width: '100%', justifyContent: 'center', padding: '0.65rem'}} onClick={dismissWelcome}>
              OK, let's chop! 🎬
            </button>
          </div>
        </div>
      )}

      {/* Toast popup alerts */}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  );
}
