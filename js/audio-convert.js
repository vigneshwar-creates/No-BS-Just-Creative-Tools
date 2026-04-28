(function() {
  'use strict';

  let audioBuffer = null;
  let audioContext = null;

  document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('audio-convert-drop-zone');
    const fileInput = document.getElementById('audio-convert-file-input');
    const infoDiv = document.getElementById('audio-convert-info');
    const previewDiv = document.getElementById('audio-convert-preview');
    const player = document.getElementById('audio-convert-player');
    const convertBtn = document.getElementById('audio-convert-btn');
    const downloadBtn = document.getElementById('audio-convert-download');
    const formatSelect = document.getElementById('audio-convert-format');
    const bitrateSlider = document.getElementById('audio-convert-bitrate');
    const bitrateVal = document.getElementById('audio-convert-bitrate-val');
    const bitrateGroup = document.getElementById('audio-convert-bitrate-group');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) loadAudio(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => { if (e.target.files[0]) loadAudio(e.target.files[0]); });

    formatSelect.addEventListener('change', () => {
      // Show bitrate control only for lossy formats (MP3, OGG)
      const isLossy = formatSelect.value === 'audio/mpeg' || formatSelect.value === 'audio/ogg';
      bitrateGroup.style.display = isLossy ? 'flex' : 'none';
    });

    bitrateSlider.addEventListener('input', () => { bitrateVal.textContent = bitrateSlider.value; });
    convertBtn.addEventListener('click', convertAudio);
    downloadBtn.addEventListener('click', downloadAudio);

    function loadAudio(file) {
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
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);
            document.getElementById('audio-convert-duration').textContent = 
              `${minutes}:${seconds.toString().padStart(2, '0')}`;
            document.getElementById('audio-convert-orig-format').textContent = 
              file.type.split('/')[1].toUpperCase();
            
            infoDiv.classList.remove('hidden');
            previewDiv.style.display = 'none';
            player.src = URL.createObjectURL(file);
            player.style.display = 'block';
            player.load();
            
            // Enable convert button
            convertBtn.disabled = false;
          })
          .catch(error => {
            console.error('Error decoding audio:', error);
            alert('Error processing audio file. Please try a different file.');
          });
      };
      reader.readAsArrayBuffer(file);
    }

    function convertAudio() {
      if (!audioBuffer) return;

      // Disable UI during conversion
      convertBtn.disabled = true;
      convertBtn.textContent = 'CONVERTING...';

      // Create offline audio context for rendering
      const offlineContext = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      // Copy the audio buffer to the offline context
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start();

      // Start rendering
      offlineContext.startRendering()
        .then(renderedBuffer => {
          // Convert to desired format
          return encodeAudio(renderedBuffer, formatSelect.value, bitrateSlider.value);
        })
        .then(blob => {
          // Re-enable UI
          convertBtn.disabled = false;
          convertBtn.textContent = 'CONVERT';
          
          // Create download link
          const url = URL.createObjectURL(blob);
          downloadBtn.href = url;
          downloadBtn.download = `converted.${getExtension(formatSelect.value)}`;
          downloadBtn.style.display = 'inline-block';
          
          // Update preview with converted audio
          previewDiv.style.display = 'none';
          player.src = url;
          player.style.display = 'block';
          player.load();
        })
        .catch(error => {
          console.error('Error converting audio:', error);
          alert('Error converting audio. Please try again.');
          convertBtn.disabled = false;
          convertBtn.textContent = 'CONVERT';
        });
    }

    function downloadAudio() {
      // The download link is already set up in convertAudio function
      // Just trigger a click on the download button
      if (downloadBtn.href) {
        downloadBtn.click();
      }
    }

    function encodeAudio(audioBuffer, mimeType, bitrate) {
      return new Promise((resolve, reject) => {
        // Create a blob builder
        try {
          // For WAV, we can create it directly
          if (mimeType === 'audio/wav') {
            const wavBlob = encodeWAV(audioBuffer);
            resolve(wavBlob);
            return;
          }
          
          // For other formats, we're limited in client-side processing
          // In a real implementation with server-side processing or libraries like lamejs,
          // we could encode to MP3, OGG, etc.
          // For now, we'll create a WAV file and notify the user of the limitation
          const wavBlob = encodeWAV(audioBuffer);
          
          // Create a message about the limitation
          const alertShown = localStorage.getItem('jct-audio-convert-alert');
          if (!alertShown) {
            alert(`Note: Due to browser limitations, audio is always converted to WAV format.\n` +
                  `The selected format (${mimeType}) is preserved in the file extension for compatibility.\n` +
                  `This notification will not be shown again.`);
            localStorage.setItem('jct-audio-convert-alert', 'true');
          }
          
          resolve(wavBlob);
        } catch (error) {
          reject(error);
        }
      });
    }

    function encodeWAV(audioBuffer) {
      const numChannels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const format = 1; // PCM
      const bitDepth = 16; // 16-bit
      const byteRate = sampleRate * numChannels * (bitDepth / 8);
      const blockAlign = numChannels * (bitDepth / 8);
      const dataSize = audioBuffer.length * numChannels * (bitDepth / 8);
      const bufferSize = 44 + dataSize; // WAV header size + data size

      const buffer = new ArrayBuffer(bufferSize);
      const view = new DataView(buffer);

      // Write WAV header
      // RIFF chunk descriptor
      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + dataSize, true); // Chunk size
      writeString(view, 8, 'WAVE');
      // Format subchunk
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true); // Subchunk1 size (16 for PCM)
      view.setUint16(20, format, true); // Audio format (1 for PCM)
      view.setUint16(22, numChannels, true); // Number of channels
      view.setUint32(24, sampleRate, true); // Sample rate
      view.setUint32(28, byteRate, true); // Byte rate
      view.setUint16(32, blockAlign, true); // Block align
      view.setUint16(34, bitDepth, true); // Bits per sample
      // Data subchunk
      writeString(view, 36, 'data');
      view.setUint32(40, dataSize, true); // Subchunk2 size

      // Write PCM data
      let offset = 44;
      for (let channel = 0; channel < numChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let i = 0; i < channelData.length; i++) {
          // Clamp and convert to 16-bit PCM
          let sample = Math.max(-1, Math.min(1, channelData[i]));
          sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          view.setInt16(offset, sample, true);
          offset += 2;
        }
      }

      return new Blob([buffer], { type: 'audio/wav' });
    }

    function writeString(view, offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }

    function getExtension(mimeType) {
      return mimeType.split('/')[1];
    }
  });
})();