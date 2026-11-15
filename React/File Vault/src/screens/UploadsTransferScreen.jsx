import React, { useRef, useState } from 'react';
import { useVault } from '../context/VaultContext';
import { 
  Pause, 
  Play, 
  X, 
  UploadCloud, 
  HardDrive, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Lock, 
  Zap,
  ArrowUp
} from 'lucide-react';

export default function UploadsTransferScreen() {
  const { 
    transfers, 
    handleUploadFile, 
    toggleTransferPause, 
    cancelTransfer, 
    showToast 
  } = useVault();

  const fileInputRef = useRef(null);
  const [autoCompress, setAutoCompress] = useState(false);
  const [sha256Verify, setSha256Verify] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [allPaused, setAllPaused] = useState(false);

  const activeQueueCount = transfers.filter(t => t.status !== 'completed').length;
  const totalBytes = transfers.reduce((acc, t) => acc + (t.sizeBytes || 0), 0);
  const processedBytes = transfers.reduce((acc, t) => acc + (t.processedBytes || 0), 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const processedMB = (processedBytes / (1024 * 1024)).toFixed(1);
  const aggregatePct = totalBytes > 0 ? Math.round((processedBytes / totalBytes) * 100) : 58;

  const handlePauseAll = () => {
    setAllPaused(!allPaused);
    transfers.forEach(t => toggleTransferPause(t.id));
  };

  const handleCancelAll = () => {
    transfers.forEach(t => cancelTransfer(t.id));
    showToast('Active transfer queue cleared');
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        handleUploadFile(files[i]);
      }
    }
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        handleUploadFile(e.dataTransfer.files[i]);
      }
    }
  };

  return (
    <div className="flex flex-col w-full pb-20 px-4 sm:px-5 pt-4 gap-4 font-sans text-on-surface">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        className="hidden"
      />

      {/* 1. Overview & Pipe Velocity Card */}
      <section className="flex flex-col bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse"></span>
              <h2 className="font-display text-xs sm:text-sm font-bold text-primary truncate">
                Active Queue: {activeQueueCount} files
              </h2>
            </div>
            <p className="font-mono text-[11px] text-on-surface-variant mt-0.5 truncate">
              {processedMB} MB processing of {totalMB > 0 ? totalMB : '360.9'} MB total
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handlePauseAll}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-secondary-container transition-all active:scale-95 text-xs font-mono font-semibold"
            >
              {allPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
              <span>{allPaused ? 'Resume' : 'Pause'}</span>
            </button>
            <button
              onClick={handleCancelAll}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-error-container hover:bg-error-container/80 text-on-error-container transition-all active:scale-95 text-xs font-mono font-semibold"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        {/* Overall Aggregate Progress bar */}
        <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
          <div
            className="bg-secondary h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${aggregatePct}%` }}
          ></div>
        </div>

        {/* Cryptographic Pipe Badge */}
        <div className="flex items-center justify-between pt-0.5 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 text-on-surface-variant min-w-0">
            <Zap className="w-3.5 h-3.5 text-on-tertiary-container flex-shrink-0" />
            <span className="font-bold text-on-surface">8.4 MB/s</span>
            <span>•</span>
            <span className="truncate">TLS 1.3 Secure Pipe</span>
          </div>

          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-on-secondary-container font-mono text-[10px] font-bold uppercase tracking-wider flex-shrink-0">
            <Lock className="w-2.5 h-2.5" />
            <span>P2P Stream</span>
          </div>
        </div>
      </section>

      {/* 2. Ingest Dropzone Card */}
      <section
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (fileInputRef.current) fileInputRef.current.click();
        }}
        className={`group cursor-pointer flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all text-center shadow-sm ${
          isDragOver 
            ? 'border-secondary bg-surface-container' 
            : 'border-outline-variant/60 hover:border-secondary bg-surface-container-lowest hover:bg-surface-container-low/40'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-secondary-container/50 flex items-center justify-center mb-2 text-secondary transition-transform group-hover:scale-110 shadow-sm">
          <UploadCloud className="w-6 h-6" />
        </div>
        <span className="font-display text-sm font-bold text-primary">
          Tap or drag files to upload
        </span>
        <p className="text-xs text-on-surface-variant max-w-[260px] mt-0.5">
          Supports RAW, 4K Video, Docs, CSV up to 25 GB each
        </p>
        <div className="mt-3">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-container text-white font-mono text-xs font-semibold shadow-sm hover:opacity-95 active:scale-95 transition-all"
          >
            <HardDrive className="w-4 h-4" />
            <span>Browse Device / Camera</span>
          </button>
        </div>
      </section>

      {/* 3. Transfer Preferences Bar */}
      <section className="flex flex-col bg-surface-container-lowest rounded-2xl p-3 shadow-sm border border-outline-variant/30 gap-2">
        {/* Toggle 1: Auto-compress */}
        <label className="flex items-center justify-between p-1.5 cursor-pointer">
          <div className="flex flex-col">
            <span className="font-display text-xs font-semibold text-primary">
              Auto-compress images
            </span>
            <span className="text-[11px] text-on-surface-variant font-mono">
              Preserve lossless metadata when off
            </span>
          </div>
          <input
            type="checkbox"
            checked={autoCompress}
            onChange={(e) => setAutoCompress(e.target.checked)}
            className="w-4 h-4 text-secondary rounded focus:ring-secondary cursor-pointer"
          />
        </label>

        <div className="h-px bg-surface-container w-full"></div>

        {/* Toggle 2: SHA-256 Checksum */}
        <label className="flex items-center justify-between p-1.5 cursor-pointer">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-xs font-semibold text-primary">
                SHA-256 Checksum
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                Verified
              </span>
            </div>
            <span className="text-[11px] text-on-surface-variant font-mono">
              Real-time bit-rot verification
            </span>
          </div>
          <input
            type="checkbox"
            checked={sha256Verify}
            onChange={(e) => setSha256Verify(e.target.checked)}
            className="w-4 h-4 text-secondary rounded focus:ring-secondary cursor-pointer"
          />
        </label>
      </section>

      {/* 4. In Progress Upload Stream Items */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 font-mono text-xs text-on-surface-variant">
            <span className="font-bold text-primary">In Progress</span>
            <span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center font-bold text-[10px]">
              {transfers.length}
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-secondary font-bold">
            STREAMING
          </span>
        </div>

        {transfers.map(t => (
          <div
            key={t.id}
            className="flex flex-col p-3 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-secondary flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <h4 className="font-display text-xs font-bold text-primary truncate" title={t.name}>
                    {t.name}
                  </h4>
                  <span className="font-mono text-[10px] text-on-surface-variant truncate">
                    {t.sizeDisplay} • {t.format}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleTransferPause(t.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-high text-on-secondary-container"
                >
                  {t.status === 'paused' ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                </button>
                <button
                  onClick={() => cancelTransfer(t.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container hover:bg-error-container text-on-surface-variant hover:text-on-error-container"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Progress Track */}
            <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  t.status === 'hashing' ? 'bg-emerald-600' : 'bg-secondary'
                }`}
                style={{ width: `${t.progressPct}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between font-mono text-[10px] text-on-surface-variant">
              <span>{t.eta}</span>
              <div className="flex items-center gap-1">
                <ArrowUp className="w-3 h-3 text-secondary" />
                <span className="font-bold text-primary">{t.speed || '8.4 MB/s'}</span>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
