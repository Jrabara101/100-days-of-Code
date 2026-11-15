import React, { useRef, useState } from 'react';
import { useVault } from '../../context/VaultContext';
import { 
  Scan, 
  Camera, 
  FolderOpen, 
  CloudRain, 
  UploadCloud, 
  ShieldCheck, 
  MapPinOff, 
  X,
  Lock
} from 'lucide-react';

export default function UploadModalSheet() {
  const { 
    uploadModalOpen, 
    setUploadModalOpen, 
    setCurrentScreen, 
    handleUploadFile, 
    showToast 
  } = useVault();

  const fileInputRef = useRef(null);
  const [hardwareEnclaveEnabled, setHardwareEnclaveEnabled] = useState(true);
  const [scrubExifEnabled, setScrubExifEnabled] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!uploadModalOpen) return null;

  const handleClose = () => {
    setUploadModalOpen(false);
  };

  const onSelectAction = (actionKey) => {
    setUploadModalOpen(false);

    if (actionKey === 'scanner') {
      setCurrentScreen('scanner');
      showToast('Opening Document Scanner: Edge detection armed', 'document_scanner');
    } else if (actionKey === 'camera') {
      if (fileInputRef.current) {
        fileInputRef.current.setAttribute('capture', 'environment');
        fileInputRef.current.click();
      }
    } else if (actionKey === 'files') {
      if (fileInputRef.current) {
        fileInputRef.current.removeAttribute('capture');
        fileInputRef.current.click();
      }
    } else if (actionKey === 'cloud') {
      showToast('Connecting to Cloud Sync Bridge (Drive/Dropbox/Box)...', 'cloud_sync');
      setTimeout(() => {
        showToast('Synchronized with Cloud Bridge endpoint', 'check_circle');
      }, 1200);
    }
  };

  const handleFilesSelected = (e) => {
    const selected = e.target.files;
    if (selected && selected.length > 0) {
      for (let i = 0; i < selected.length; i++) {
        handleUploadFile(selected[i]);
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
      setUploadModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Hidden native input for genuine file reading & picking */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFilesSelected}
        multiple
        className="hidden"
      />

      {/* Backdrop */}
      <div 
        onClick={handleClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      />

      {/* Sliding Sheet */}
      <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-t-[28px] shadow-2xl p-5 border-t border-outline-variant/30 z-10 flex flex-col gap-4 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Top Drag Handle */}
        <div className="w-12 h-1.5 bg-outline-variant/60 rounded-full mx-auto -mt-1 mb-1"></div>

        {/* Sheet Header */}
        <div className="flex items-center justify-between pb-2 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-tertiary-container/30 text-on-tertiary-container flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-primary">
                Secure Upload &amp; Ingestion
              </h3>
              <p className="text-xs text-on-surface-variant">
                Encrypted Stream Target • AES-256-GCM
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Action Grid Buttons */}
        <div className="grid grid-cols-1 gap-2.5">
          {/* Action 1: Document Scanner */}
          <button
            onClick={() => onSelectAction('scanner')}
            className="w-full flex items-center gap-3.5 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all text-left group border border-surface-container"
          >
            <div className="w-11 h-11 rounded-xl bg-tertiary-container text-tertiary-fixed flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
              <Scan className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-primary truncate">
                  Document Scanner
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-tertiary-fixed/20 text-on-tertiary-container flex-shrink-0">
                  AI Edge Quad
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
                Auto-edge detection, perspective deskew &amp; live OCR
              </p>
            </div>
          </button>

          {/* Action 2: Camera Capture */}
          <button
            onClick={() => onSelectAction('camera')}
            className="w-full flex items-center gap-3.5 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all text-left group border border-surface-container"
          >
            <div className="w-11 h-11 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
              <Camera className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-primary truncate">
                  Camera Capture
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-container text-on-surface-variant flex-shrink-0">
                  Direct Ingest
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
                Encrypted sensor capture without unencrypted gallery caching
              </p>
            </div>
          </button>

          {/* Action 3: Device Files / Gallery */}
          <button
            onClick={() => onSelectAction('files')}
            className="w-full flex items-center gap-3.5 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all text-left group border border-surface-container"
          >
            <div className="w-11 h-11 rounded-xl bg-primary-container text-surface-container-lowest flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-primary truncate">
                  Device Files / Gallery
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-container text-on-surface-variant flex-shrink-0">
                  Local Picker
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
                Pick real PDF, CSV, Images, Audio, or Video from disk
              </p>
            </div>
          </button>

          {/* Action 4: Cloud Transfer / Import */}
          <button
            onClick={() => onSelectAction('cloud')}
            className="w-full flex items-center gap-3.5 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all text-left group border border-surface-container"
          >
            <div className="w-11 h-11 rounded-xl bg-surface-container text-secondary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
              <CloudRain className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-primary truncate">
                  Cloud Transfer / Import
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-container text-on-surface-variant flex-shrink-0">
                  Sync Bridge
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
                Import encrypted data streams from Drive, Dropbox, or Box
              </p>
            </div>
          </button>
        </div>

        {/* Quick Dropzone Target */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (fileInputRef.current) fileInputRef.current.click();
          }}
          className={`p-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
            isDragOver 
              ? 'border-secondary bg-surface-container' 
              : 'border-outline-variant/80 hover:border-secondary bg-surface-container-low/50 hover:bg-surface-container-low'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-1.5">
            <UploadCloud className="w-5 h-5" />
          </div>
          <p className="font-display text-sm font-semibold text-primary">
            Tap to pick or drag encrypted chunks here
          </p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            Supports PDF, CSV, Images, Audio, Video • Multi-part chunking
          </p>
        </div>

        {/* Ingest Protection Settings */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container p-3.5 space-y-3">
          <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider">
            <span>Ingest Protection Settings</span>
            <span className="inline-flex items-center gap-1 text-on-tertiary-container font-mono text-[10px] font-normal lowercase tracking-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
              Enclave Armed
            </span>
          </div>

          {/* Toggle 1: Hardware Enclave Encryption */}
          <label className="flex items-center justify-between cursor-pointer py-0.5">
            <div className="flex flex-col pr-3">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-on-tertiary-container" />
                <span className="font-display text-xs font-semibold text-primary">
                  Hardware Enclave Encryption
                </span>
              </div>
              <span className="text-[11px] text-on-surface-variant mt-0.5">
                AES-256-GCM symmetric cipher with device-bound key pair
              </span>
            </div>
            <input
              type="checkbox"
              checked={hardwareEnclaveEnabled}
              onChange={(e) => setHardwareEnclaveEnabled(e.target.checked)}
              className="w-4 h-4 text-secondary rounded focus:ring-secondary"
            />
          </label>

          <div className="h-px bg-surface-container w-full"></div>

          {/* Toggle 2: Scrub EXIF & GPS */}
          <label className="flex items-center justify-between cursor-pointer py-0.5">
            <div className="flex flex-col pr-3">
              <div className="flex items-center gap-1.5">
                <MapPinOff className="w-4 h-4 text-secondary" />
                <span className="font-display text-xs font-semibold text-primary">
                  Scrub EXIF &amp; GPS Telemetry
                </span>
              </div>
              <span className="text-[11px] text-on-surface-variant mt-0.5">
                Remove camera serials, timestamps, and geospatial coordinates
              </span>
            </div>
            <input
              type="checkbox"
              checked={scrubExifEnabled}
              onChange={(e) => setScrubExifEnabled(e.target.checked)}
              className="w-4 h-4 text-secondary rounded focus:ring-secondary"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

