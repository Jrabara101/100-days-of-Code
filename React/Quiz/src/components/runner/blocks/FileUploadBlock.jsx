import React, { useState } from 'react';
import { UploadCloud, File, CheckCircle2, X } from 'lucide-react';
import { sound } from '../../../utils/audio';

export default function FileUploadBlock({
  question,
  value,
  onChange,
  onSubmit,
  disabled = false
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    sound.playKeyTap();
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          sound.playCorrect();
          onChange({
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            type: file.type
          });
          return null;
        }
        return prev + 30;
      });
    }, 80);
  };

  const removeFile = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className="w-full max-w-xl">
      {value ? (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <File className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                <span>{value.name}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xs text-slate-400">{value.size} • Ready</div>
            </div>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-brand bg-brand/10 scale-[1.01]'
              : 'border-white/15 bg-[#121418] hover:border-brand/50 hover:bg-[#181A20]'
          }`}
        >
          <input
            type="file"
            className="hidden"
            disabled={disabled}
            onChange={handleFileSelect}
          />
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="text-base font-semibold text-white mb-1">
            Click to upload or drag & drop
          </div>
          <div className="text-xs text-slate-400">
            Supports PNG, JPG, PDF, or documents up to 10MB
          </div>

          {uploadProgress !== null && (
            <div className="w-full max-w-xs mt-4">
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand transition-all duration-100"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">Uploading... {uploadProgress}%</div>
            </div>
          )}
        </label>
      )}

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <span className="keycap-badge">Enter ↵</span>
        <span>to advance</span>
      </div>
    </div>
  );
}
