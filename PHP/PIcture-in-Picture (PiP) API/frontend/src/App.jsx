import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [stream, setStream] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle'); // idle, recording, stopped
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [permissionError, setPermissionError] = useState(null);

  const videoRef = useRef(null);

  // Phase 2: Screen Capture Logic
  const startCapture = async () => {
    try {
      setPermissionError(null);
      // Request Screen Capture
      const displayMediaOptions = {
        video: {
          cursor: "always"
        },
        audio: true
      };

      const mediaStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Listen for stream end (e.g. user stops sharing from browser UI)
      mediaStream.getTracks().forEach(track => {
        track.onended = () => {
          stopRecording();
        };
      });

    } catch (err) {
      console.error("Error: " + err);
      setPermissionError("Permission Denied or Browser Not Supported. " + err.message);
    }
  };

  const startRecording = () => {
    if (!stream) return;

    setRecordedChunks([]);
    const options = { mimeType: 'video/webm; codecs=vp9' };
    const recorder = new MediaRecorder(stream, options);

    const streamToLaravel = async (blobChunk) => {
      // Real-time upload to Laravel API
      const formData = new FormData();
      formData.append('video_chunk', blobChunk);

      try {
        // In Phase 3, this would point to the actual endpoint
        // await fetch('http://localhost:8000/api/upload-chunk', { method: 'POST', body: formData });
        console.log("Broadcasting chunk to Laravel Backend: ", blobChunk.size, "bytes");
      } catch (e) {
        console.error("Stream upload failed", e);
      }
    };

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data]);
        streamToLaravel(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunks, {
        type: "video/webm"
      });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setStream(null); // Clear stream to stop camera active light if preferred, or keep it
    };

    recorder.start(1000); // Collect 1s chunks
    setMediaRecorder(recorder);
    setRecordingStatus('recording');
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setRecordingStatus('stopped');
  };

  const togglePiP = async () => {
    if (videoRef.current && document.pictureInPictureElement !== videoRef.current) {
      try {
        await videoRef.current.requestPictureInPicture();
      } catch (error) {
        console.error("PiP failed", error);
      }
    } else {
      await document.exitPictureInPicture();
    }
  };

  // Phase 4: Local Save with File System Access API
  const saveToLocal = async () => {
    if (!previewUrl) return;

    try {
      // Fetch the blob from the object URL
      const response = await fetch(previewUrl);
      const blob = await response.blob();

      // Check for File System Access API support
      if ('showSaveFilePicker' in window) {
        const handle = await window.showSaveFilePicker({
          suggestedName: `nexus-recording-${Date.now()}.webm`,
          types: [{
            description: 'WebM Video',
            accept: { 'video/webm': ['.webm'] },
          }],
        });

        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        // Fallback for browsers without FSA API (Auto-Download)
        const a = document.createElement('a');
        a.href = previewUrl;
        a.download = `nexus-recording-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

    } catch (err) {
      console.error(err);
      if (err.name !== 'AbortError') {
        alert("Failed to save file: " + err.message);
      }
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>NexusCam</h1>
        <p>Advanced Browser-Based Screen Recorder</p>
      </header>

      <main className="main-content">
        <div className="video-wrapper">
          {previewUrl && recordingStatus === 'stopped' ? (
            <video controls src={previewUrl} className="preview-player"></video>
          ) : (
            <video ref={videoRef} autoPlay muted className="live-preview"></video>
          )}
        </div>

        {permissionError && <div className="error-banner">{permissionError}</div>}

        <div className="controls-bar">
          {recordingStatus === 'idle' || recordingStatus === 'stopped' ? (
            <button className="btn btn-primary" onClick={startCapture}>
              🖥️ Select Screen
            </button>
          ) : null}

          {stream && recordingStatus === 'idle' && (
            <button className="btn btn-danger" onClick={startRecording}>
              🔴 Start Recording
            </button>
          )}

          {recordingStatus === 'recording' && (
            <button className="btn btn-stop" onClick={stopRecording}>
              ⏹️ Stop Recording
            </button>
          )}

          <button className="btn btn-secondary" onClick={togglePiP} disabled={!stream && !previewUrl}>
            📺 PiP Mode
          </button>

          {previewUrl && (
            <button className="btn btn-success" onClick={saveToLocal}>
              💾 Save to Disk
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
