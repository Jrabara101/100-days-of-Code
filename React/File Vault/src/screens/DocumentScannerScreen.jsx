import React, { useState, useRef, useEffect } from 'react';
import { useVault } from '../context/VaultContext';
import { 
  X, 
  Zap, 
  ZapOff, 
  Compass, 
  ShieldCheck, 
  Camera, 
  Check, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DocumentScannerScreen() {
  const { setCurrentScreen, setScannedDocument, showToast } = useVault();

  const [mode, setMode] = useState('auto'); // auto | manual
  const [torchOn, setTorchOn] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('color'); // color | bw | grayscale | unwarp
  const [detectedConfidence, setDetectedConfidence] = useState(98.4);
  const [gyroAngle, setGyroAngle] = useState(0.4);
  const [shutterFlashing, setShutterFlashing] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const videoRef = useRef(null);
  const [useRealCamera, setUseRealCamera] = useState(false);

  // Attempt real camera stream if user grants permission
  useEffect(() => {
    let stream = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            setUseRealCamera(true);
          }
        })
        .catch(() => {
          // Fall back gracefully to high-res synthesized document feed
          setUseRealCamera(false);
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Simulate subtle gyro angle changes
  useEffect(() => {
    const interval = setInterval(() => {
      setGyroAngle(+(0.2 + Math.random() * 0.4).toFixed(1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleCapture = () => {
    setShutterFlashing(true);
    showToast('Document Page Captured! Edge quad locked.', 'camera');
    confetti({ particleCount: 25, spread: 45, origin: { y: 0.85 } });

    setTimeout(() => {
      setShutterFlashing(false);
      // Navigate to Document Crop & OCR Review
      setScannedDocument(prev => ({
        ...prev,
        pageIndex: pageCount,
        totalPages: pageCount,
        filterProfile: selectedFilter === 'bw' ? 'bw' : (selectedFilter === 'grayscale' ? 'grayscale' : 'color')
      }));
      setCurrentScreen('crop_review');
    }, 450);
  };

  const handleFinish = () => {
    setCurrentScreen('crop_review');
  };

  return (
    <div className="relative w-full h-full min-h-[780px] bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* Flash animation layer */}
      {shutterFlashing && (
        <div className="absolute inset-0 bg-white z-50 pointer-events-none animate-shutter-flash"></div>
      )}

      {/* 1. Top HUD Bar */}
      <div className="relative z-30 pt-3 px-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          {/* Close button */}
          <button
            onClick={() => setCurrentScreen('files')}
            className="w-10 h-10 rounded-full bg-slate-900/80 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Mode Switcher Pill */}
          <div className="flex items-center bg-slate-900/90 rounded-full p-1 border border-slate-700/80 text-xs font-mono">
            <button
              onClick={() => { setMode('auto'); showToast('Auto-capture mode armed'); }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                mode === 'auto' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${mode === 'auto' ? 'bg-slate-950' : 'bg-emerald-400'}`}></span>
              <span>Auto</span>
            </button>
            <button
              onClick={() => { setMode('manual'); showToast('Manual shutter mode enabled'); }}
              className={`px-3 py-1 rounded-full transition-all ${
                mode === 'manual' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
              }`}
            >
              Manual
            </button>
          </div>

          {/* Flash / Torch Toggle */}
          <button
            onClick={() => {
              setTorchOn(!torchOn);
              showToast(torchOn ? 'Torch disabled' : 'Torch active: Exposure boosted', 'flash_on');
            }}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
              torchOn ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-900/80 border-slate-700/60 text-slate-300'
            }`}
          >
            {torchOn ? <Zap className="w-5 h-5 fill-slate-950" /> : <ZapOff className="w-5 h-5" />}
          </button>
        </div>

        {/* Secondary Telemetry Strip */}
        <div className="flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure Enclave OCR</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-cyan-500/30 text-cyan-400">
            <Compass className="w-3.5 h-3.5" />
            <span>Hold Flat {gyroAngle}°</span>
          </div>
        </div>
      </div>

      {/* 2. Center Viewfinder Camera & Perspective Detection Quad */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden my-2">
        {/* Real or Simulated Camera Feed */}
        {useRealCamera ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-slate-900 flex items-center justify-center overflow-hidden">
            {/* High-res Document Sample under Scanner */}
            <img
              src="https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=1000&q=80"
              alt="Scanned Document"
              className="w-[92%] h-[88%] object-cover rounded shadow-2xl opacity-80 filter contrast-125"
            />
            {/* Second document behind for realistic desk scanning */}
            <div className="absolute -right-8 top-12 w-48 h-64 bg-slate-800/80 rounded border border-slate-700/50 transform rotate-12 opacity-40 pointer-events-none"></div>
          </div>
        )}

        {/* Glowing Perspective Quad Bounding Box Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none filter-scanner-glow">
          {/* Animated Scanning Polygon with emerald & cyan border */}
          <polygon
            points="45,90 340,75 355,480 35,465"
            fill="rgba(16, 185, 129, 0.12)"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeDasharray="6,4"
          />
          {/* Corner Vertices */}
          <circle cx="45" cy="90" r="9" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
          <circle cx="340" cy="75" r="9" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
          <circle cx="355" cy="480" r="9" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
          <circle cx="35" cy="465" r="9" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
        </svg>

        {/* Floating Detection Status Pills */}
        <div className="absolute top-4 inset-x-0 flex flex-col items-center gap-1.5 pointer-events-none z-20">
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-950/90 border border-emerald-500/50 shadow-lg font-mono text-xs text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-bold tracking-wide">DOCUMENT DETECTED</span>
            <span className="text-emerald-400 font-bold">{detectedConfidence}%</span>
          </div>

          <div className="px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-[11px] font-mono text-slate-300">
            A4 Contract • Page {pageCount}/3
          </div>
        </div>

        {/* Guidance Prompt */}
        <div className="absolute bottom-6 inset-x-0 flex justify-center pointer-events-none z-20 px-6">
          <div className="bg-slate-950/90 backdrop-blur-md px-4 py-2 rounded-full border border-cyan-500/30 flex items-center gap-2 text-xs font-medium text-slate-200 text-center shadow-xl">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Position corners or hold steady to auto-capture</span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Controls HUD */}
      <div className="relative z-30 pb-6 px-4 flex flex-col gap-3 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pt-3">
        {/* Filter Selection Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar font-mono text-xs">
          {[
            { id: 'color', label: 'Color' },
            { id: 'bw', label: 'B&W Clear' },
            { id: 'grayscale', label: 'Grayscale' },
            { id: 'unwarp', label: 'Unwarp' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => {
                setSelectedFilter(f.id);
                showToast(`Filter applied: ${f.label}`);
              }}
              className={`px-3 py-1 rounded-full transition-colors ${
                selectedFilter === f.id
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-emerald-500/60'
                  : 'bg-slate-900/70 text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Shutter & Nav Action Row */}
        <div className="flex items-center justify-around mt-1">
          {/* Page Counter Thumbnail */}
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center text-center font-mono">
            <span className="text-xs font-bold text-white">{pageCount} / 1</span>
            <span className="text-[9px] uppercase tracking-wider text-slate-400">Pages</span>
          </div>

          {/* Shutter Button */}
          <button
            onClick={handleCapture}
            className="w-20 h-20 rounded-full border-4 border-white/90 p-1 flex items-center justify-center active:scale-90 transition-transform shadow-[0_0_25px_rgba(255,255,255,0.4)]"
            title="Capture Document Page"
          >
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-slate-950">
              <Sparkles className="w-7 h-7" />
            </div>
          </button>

          {/* Done Button */}
          <button
            onClick={handleFinish}
            className="w-14 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 flex flex-col items-center justify-center font-mono transition-all shadow-lg"
            title="Review & Crop"
          >
            <Check className="w-6 h-6 stroke-[2.5]" />
            <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}
