import React from 'react';
import { 
  X, 
  Bookmark, 
  Play, 
  Trash2, 
  Share2, 
  Clock, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { usePodcast } from '../context/PodcastContext';

interface ListeningVaultDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ListeningVaultDrawer: React.FC<ListeningVaultDrawerProps> = ({ isOpen, onClose }) => {
  const { 
    listeningVault, 
    removeFromVault, 
    playEpisode, 
    setActiveAudiogramClip, 
    setIsAudiogramModalOpen 
  } = usePodcast();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md h-full glass-modal border-l border-[var(--border-hairline)] p-6 flex flex-col justify-between shadow-2xl animate-slideLeft">
        
        {/* Drawer Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-hairline)]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
                <Bookmark className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
                  Personal Listening Vault
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {listeningVault.length} saved audio quotes & tactical timestamps
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Clips List */}
          <div className="mt-6 space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {listeningVault.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-muted)]">
                <Bookmark className="w-10 h-10 mx-auto mb-3 opacity-30 text-amber-500" />
                <p className="text-sm font-semibold">Your vault is currently empty.</p>
                <p className="text-xs mt-1 leading-relaxed">
                  Highlight sentences in any episode transcript or tap "Bookmark Moment" on the bottom dock to save audio quotes.
                </p>
              </div>
            ) : (
              listeningVault.map((clip) => {
                const startMins = Math.floor(clip.startTimeSec / 60);
                const startSecs = (clip.startTimeSec % 60).toString().padStart(2, '0');
                const clipDuration = clip.endTimeSec - clip.startTimeSec;

                return (
                  <div
                    key={clip.id}
                    className="p-4 rounded-2xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)] hover:border-amber-500/40 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono-tabular text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                        {startMins}:{startSecs} • {clipDuration}s Clip
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setActiveAudiogramClip(clip);
                            setIsAudiogramModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-amber-400 hover:bg-white/10 transition-colors"
                          title="Generate Audiogram"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeFromVault(clip.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-white/10 transition-colors"
                          title="Remove Clip"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--text-primary)] italic leading-relaxed">
                      "{clip.quoteText}"
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-hairline)]">
                      <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                        {clip.speakerName}
                      </span>

                      <button
                        onClick={() => {
                          playEpisode(clip.episodeId, clip.startTimeSec);
                          onClose();
                        }}
                        className="flex items-center gap-1 text-[11px] font-bold text-amber-500 hover:text-amber-400"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Play Audio</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="pt-4 border-t border-[var(--border-hairline)] text-center text-xs text-[var(--text-muted)]">
          Saved moments persist in local studio memory.
        </div>

      </div>
    </div>
  );
};
