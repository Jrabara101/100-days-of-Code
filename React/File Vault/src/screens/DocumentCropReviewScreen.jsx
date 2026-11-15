import React, { useState } from 'react';
import { useVault } from '../context/VaultContext';
import { 
  ArrowLeft, 
  Check, 
  RotateCw, 
  Sliders, 
  Maximize, 
  RotateCcw, 
  FileText, 
  Crop, 
  Copy, 
  Search,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DocumentCropReviewScreen() {
  const { 
    scannedDocument, 
    setScannedDocument, 
    saveScannedDocumentToVault, 
    setCurrentScreen, 
    showToast 
  } = useVault();

  const [activeTab, setActiveTab] = useState('crop'); // crop | ocr
  const [filterProfile, setFilterProfile] = useState(scannedDocument.filterProfile || 'bw');
  const [rotation, setRotation] = useState(0);
  const [deskewOn, setDeskewOn] = useState(true);
  const [paperFormat, setPaperFormat] = useState('A4');
  const [ocrText, setOcrText] = useState(scannedDocument.ocrText);
  const [copiedOcr, setCopiedOcr] = useState(false);
  const [activeCorner, setActiveCorner] = useState(0); // 0: Top-Left, 1: Top-Right, 2: Bottom-Right, 3: Bottom-Left

  // 4 corner coordinates (percentages)
  const [corners, setCorners] = useState(scannedDocument.corners || [
    { x: 10, y: 12 },
    { x: 90, y: 10 },
    { x: 92, y: 90 },
    { x: 8, y: 88 }
  ]);

  const handleRotate = () => {
    const next = (rotation + 90) % 360;
    setRotation(next);
    showToast(`Rotated ${next}°`, 'rotate_90_degrees_cw');
  };

  const handleDeskew = () => {
    setDeskewOn(!deskewOn);
    showToast(deskewOn ? 'Deskew disabled' : 'Planar Deskew compensation active', 'tune');
  };

  const handleResetPins = () => {
    setCorners([
      { x: 8, y: 10 },
      { x: 92, y: 8 },
      { x: 94, y: 92 },
      { x: 6, y: 90 }
    ]);
    showToast('Corner pins reset to auto-detected quadrilateral boundary', 'restart_alt');
  };

  const handleSaveToVault = () => {
    saveScannedDocumentToVault({
      ...scannedDocument,
      filterProfile,
      rotation,
      deskew: deskewOn,
      format: paperFormat,
      ocrText
    });
  };

  const copyText = () => {
    navigator.clipboard.writeText(ocrText);
    setCopiedOcr(true);
    showToast('OCR text copied to clipboard', 'content_copy');
    setTimeout(() => setCopiedOcr(false), 2000);
  };

  const filterClasses = {
    bw: 'grayscale contrast-[190%] brightness-105',
    color: 'contrast-110 saturate-125',
    grayscale: 'grayscale contrast-125'
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-surface pb-16 font-sans text-on-surface">
      {/* 1. Top Header */}
      <div className="sticky top-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-surface-container shadow-sm">
        <button
          onClick={() => setCurrentScreen('scanner')}
          className="flex items-center gap-1 text-xs font-semibold text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retake</span>
        </button>

        <div className="flex flex-col items-center min-w-0 px-2 text-center">
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-primary">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>PAGE 1 OF 1 • REVIEW</span>
          </div>
          <span className="font-mono text-[10px] text-on-surface-variant truncate">
            {scannedDocument.title || 'Contract_Scan_01.pdf'}
          </span>
        </div>

        <button
          onClick={handleSaveToVault}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all active:scale-95 shadow-sm"
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Done</span>
        </button>
      </div>

      {/* 2. Mode Selector: Adjust Crop & Filter vs Live OCR Text */}
      <div className="px-4 pt-3">
        <div className="w-full p-1 bg-surface-container-low rounded-xl flex items-center">
          <button
            onClick={() => setActiveTab('crop')}
            className={`flex-1 py-2 px-3 rounded-lg text-center font-display text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'crop'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <Crop className="w-3.5 h-3.5" />
            <span>Adjust Crop &amp; Filter</span>
          </button>
          <button
            onClick={() => setActiveTab('ocr')}
            className={`flex-1 py-2 px-3 rounded-lg text-center font-display text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'ocr'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-secondary" />
            <span>Live OCR Text (342)</span>
          </button>
        </div>
      </div>

      {activeTab === 'crop' ? (
        <div className="px-4 pt-3 flex flex-col gap-3">
          {/* Legibility & Resolution Status Strip */}
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-fixed/20 text-on-tertiary-container font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
              <span>Legibility: {scannedDocument.ocrConfidence || 99.2}% • Ready for OCR</span>
            </div>
            <span className="text-[11px] text-on-surface-variant">1600 × 2140 px</span>
          </div>

          {/* 3. Interactive Crop Preview Area */}
          <div className="relative w-full aspect-[3/4] max-h-[440px] bg-surface-container-low rounded-2xl overflow-hidden border border-surface-container shadow-inner flex items-center justify-center">
            {/* Scanned Image */}
            <img
              src={scannedDocument.imageSrc || "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=1000&q=80"}
              alt="Scan Preview"
              style={{ transform: `rotate(${rotation}deg)` }}
              className={`w-full h-full object-cover transition-all duration-300 ${filterClasses[filterProfile]}`}
            />

            {/* Perspective Polygon & Grid Overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {/* Rule of thirds grid lines */}
              <line x1="33%" y1="0%" x2="33%" y2="100%" stroke="rgba(5, 150, 105, 0.25)" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="66%" y1="0%" x2="66%" y2="100%" stroke="rgba(5, 150, 105, 0.25)" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="0%" y1="33%" x2="100%" y2="33%" stroke="rgba(5, 150, 105, 0.25)" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="0%" y1="66%" x2="100%" y2="66%" stroke="rgba(5, 150, 105, 0.25)" strokeWidth="1" strokeDasharray="3,3" />

              {/* Dashed green crop box */}
              <polygon
                points={`${corners[0].x}%,${corners[0].y}% ${corners[1].x}%,${corners[1].y}% ${corners[2].x}%,${corners[2].y}% ${corners[3].x}%,${corners[3].y}%`}
                fill="rgba(5, 150, 105, 0.08)"
                stroke="#059669"
                strokeWidth="2"
                strokeDasharray="5,4"
              />
            </svg>

            {/* 4 Interactive Corner Handles */}
            {corners.map((pt, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setActiveCorner(idx);
                  showToast(`Corner ${idx + 1} Selected: Fine-tuning coordinates`, 'touch_app');
                }}
                style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-emerald-500 bg-white flex items-center justify-center cursor-pointer shadow-lg transition-transform active:scale-125 z-20 ${
                  activeCorner === idx ? 'ring-4 ring-emerald-500/30 scale-110' : ''
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-primary-container"></div>
              </div>
            ))}

            {/* Magnifier Loupe in Top Right */}
            <div className="absolute top-3 right-3 w-16 h-16 rounded-full bg-surface-container-lowest/90 backdrop-blur-md border-2 border-emerald-500 shadow-xl overflow-hidden pointer-events-none flex flex-col items-center justify-center">
              {/* Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-px bg-emerald-500/60"></div>
                <div className="h-full w-px bg-emerald-500/60 absolute"></div>
              </div>
              <span className="font-mono text-[9px] font-bold text-emerald-800 bg-emerald-100/80 px-1 rounded z-10">
                CORNER 1x
              </span>
            </div>

            {/* Bottom Auto-Lock status pill */}
            <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-md text-xs font-mono text-primary border border-outline-variant/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Perspective Corners Auto-Locked</span>
              </div>
            </div>
          </div>

          {/* 4. Crop Toolbar Controls */}
          <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-xs">
            <button
              onClick={handleRotate}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-surface-container-lowest border border-outline-variant/30 hover:bg-surface-container transition-colors shadow-sm"
            >
              <RotateCw className="w-4 h-4 text-secondary mb-1" />
              <span>Rotate 90°</span>
            </button>

            <button
              onClick={handleDeskew}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-colors shadow-sm ${
                deskewOn
                  ? 'bg-surface-container border-secondary text-primary font-bold'
                  : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant'
              }`}
            >
              <Sliders className="w-4 h-4 text-secondary mb-1" />
              <span>Deskew {deskewOn ? 'On' : 'Off'}</span>
            </button>

            <button
              onClick={() => {
                const formats = ['A4', 'Letter', 'Legal', 'ID Card'];
                const next = formats[(formats.indexOf(paperFormat) + 1) % formats.length];
                setPaperFormat(next);
                showToast(`Format set to ${next}`);
              }}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-surface-container-lowest border border-outline-variant/30 hover:bg-surface-container transition-colors shadow-sm"
            >
              <Maximize className="w-4 h-4 text-secondary mb-1" />
              <span>Format: {paperFormat}</span>
            </button>

            <button
              onClick={handleResetPins}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-surface-container-lowest border border-outline-variant/30 hover:bg-surface-container transition-colors shadow-sm"
            >
              <RotateCcw className="w-4 h-4 text-secondary mb-1" />
              <span>Reset Pin</span>
            </button>
          </div>

          {/* 5. Enhancement Profile */}
          <div className="bg-surface-container-lowest rounded-xl p-3 border border-outline-variant/30 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="font-display text-primary">ENHANCEMENT PROFILE</span>
              <span className="font-mono text-emerald-700 text-[11px]">Crisp Text Boosted</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'bw', label: 'Clean B&W', sub: 'High Contrast' },
                { id: 'color', label: 'True Color', sub: 'Color Restored' },
                { id: 'grayscale', label: 'Grayscale Pro', sub: 'Smooth Gray' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setFilterProfile(p.id)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    filterProfile === p.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm'
                      : 'border-surface-container bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <div className="text-xs font-bold">{p.label}</div>
                  <div className="text-[10px] opacity-75 font-mono">{p.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 6. Export Format Strip */}
          <div className="bg-surface-container-lowest rounded-xl p-3 border border-outline-variant/30 shadow-sm flex items-center justify-between">
            <span className="font-display text-xs font-bold text-primary">EXPORT FORMAT</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                PDF/A-3b
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface-container text-on-secondary-container">
                OCR Layer Embedded
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Live OCR Text Tab */
        <div className="px-4 pt-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono text-xs text-on-surface-variant">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>342 words recognized • 99.2% accuracy</span>
            </div>
            <button
              onClick={copyText}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-mono font-semibold text-secondary transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedOcr ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>

          {/* Editable OCR text area */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-sm">
            <textarea
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              rows={16}
              className="w-full bg-transparent font-mono text-xs leading-relaxed text-on-surface focus:outline-none resize-none"
              placeholder="OCR extracted text will display here..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
