(function() {
  'use strict';

  let audioContext = null;
  let analyser = null;
  let dataArray = null;
  let bufferLength = null;
  let animationFrameId = null;
  let audioBuffer = null;
  let isPlaying = false;

  document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('waveform-file-input');
    const dropZone = document.getElementById('waveform-drop-zone');
    const infoDiv = document.getElementById('waveform-info');
    const durationSpan = document.getElementById('waveform-duration');
    const sampleRateSpan = document.getElementById('waveform-sample-rate');
    const canvas = document.getElementById('waveform-canvas');
    const canvasCtx = canvas.getContext('2d');
    const emptyDiv = document.getElementById('waveform-empty');
    const waveformContainer = document.getElementById('waveform-container');
    const fileInputSection = document.getElementById('file-input-section');
    const micInputSection = document.getElementById('mic-input-section');
    const micBtn = document.getElementById('mic-btn');
    const micStatus = document.getElementById('mic-status');
    const recordTimeSelect = document.getElementById('record-time');
    const inputMethodRadios = document.getElementsByName('input-method');
    
    // Handle file input
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) loadAudioFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => { if (e.target.files[0]) loadAudioFile(e.target.files[0]); });

    // Handle input method switching
    inputMethodRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.value === 'file') {
          fileInputSection.style.display = 'block';
          micInputSection.style.display = 'none';
          stopAudio();
        } else {
          fileInputSection.style.display = 'none';
          micInputSection.style.display = 'block';
          stopAudio();
        }
      });
    });

    // Handle microphone button
    micBtn.addEventListener('click', toggleMicrophone);

    // Initialize canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    draw(); // Initial draw

    function resizeCanvas() {
      canvas.width = waveformContainer.clientWidth;
      canvas.height = waveformContainer.clientHeight;
      draw();
    }

    function loadAudioFile(file) {
      stopAudio();
      
      const reader = new FileReader();
      reader.onload = (e) => {
        // Initialize audio context if not already done
        if (!audioContext) {
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        audioContext.decodeAudioData(e.target.result)
          .then(decodedData => {
            audioBuffer = decodedData;
            const duration = audioBuffer.duration;
            const sampleRate = audioBuffer.sampleRate;
            
            durationSpan.textContent = formatDuration(duration);
            sampleRateSpan.textContent = sampleRate.toLocaleString();
            infoDiv.classList.remove('hidden');
            emptyDiv.style.display = 'none';
            
            // Start visualization
            startVisualization();
          })
          .catch(error => {
            console.error('Error decoding audio:', error);
            alert('Error processing audio file. Please try a different file.');
          });
      };
      reader.readAsArrayBuffer(file);
    }

    function startVisualization() {
      stopAudio(); // Stop any existing visualization
      
      // Create analyser node
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);

      // Create buffer source
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      // Start playing
      source.start(0);
      isPlaying = true;
      
      // Start drawing
      draw();
    }

    function toggleMicrophone() {
      if (micBtn.textContent === 'ENABLE MICROPHONE') {
        enableMicrophone();
      } else {
        disableMicrophone();
      }
    }

    async function enableMicrophone() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micBtn.textContent = 'DISABLE MICROPHONE';
        micStatus.textContent = 'Microphone enabled - listening...';
        micStatus.style.color = 'var(--accent2)';
        
        stopAudio();
        
        if (!audioContext) {
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Create analyser
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        // Create microphone source
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        isPlaying = true;
        draw();
      } catch (err) {
        console.error('Error accessing microphone:', err);
        micStatus.textContent = 'Error accessing microphone. Please check permissions.';
        micStatus.style.color = 'var(--text-muted)';
      }
    }

    function disableMicrophone() {
      stopAudio();
      micBtn.textContent = 'ENABLE MICROPHONE';
      micStatus.textContent = 'Microphone disabled';
      micStatus.style.color = '';
    }

    function stopAudio() {
      isPlaying = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (audioContext) {
        // Close and recreate context to release resources
        audioContext.close();
        audioContext = null;
      }
    }

    function draw() {
      if (!isPlaying || !analyser) return;
      
      analyser.getByteTimeDomainData(dataArray);
      
      canvasCtx.fillStyle = '#0d0d0d';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'var(--accent)';
      canvasCtx.beginPath();
      
      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;
        
        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
      
      animationFrameId = requestAnimationFrame(draw);
    }

    function formatDuration(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      const milliseconds = Math.floor((seconds % 1) * 1000);
      return `${minutes}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }
  });
})();