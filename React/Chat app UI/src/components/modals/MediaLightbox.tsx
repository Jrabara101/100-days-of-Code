import { X } from 'lucide-react';
import { useChatWorkspaceStore } from '../../stores/useChatWorkspaceStore';

export function MediaLightbox() {
  const media = useChatWorkspaceStore((s) => s.lightboxMedia);
  const setLightboxMedia = useChatWorkspaceStore((s) => s.setLightboxMedia);

  if (!media) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6"
      onClick={() => setLightboxMedia(null)}
    >
      <button
        type="button"
        onClick={() => setLightboxMedia(null)}
        className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
        aria-label="Close lightbox"
      >
        <X className="w-5 h-5" />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-4xl max-h-[85vh] flex flex-col items-center gap-3"
      >
        <img
          src={media.url}
          alt={media.name}
          className="max-h-[78vh] rounded-2xl border border-white/15 shadow-2xl object-contain"
        />
        <p className="text-xs text-slate-300 font-mono">{media.name}</p>
      </div>
    </div>
  );
}

