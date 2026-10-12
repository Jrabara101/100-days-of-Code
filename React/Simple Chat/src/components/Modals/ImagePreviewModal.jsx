import React from 'react';
import { X, Download } from 'lucide-react';

export default function ImagePreviewModal({ imageUrl, onClose }) {
  if (!imageUrl) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-pop-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
      >
        <div className="absolute top-3 right-3 flex items-center space-x-2 z-10">
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-sm"
            title="Open original"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-sm"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <img
          src={imageUrl}
          alt="Full Preview"
          className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
        />
      </div>
    </div>
  );
}
