import React, { useState } from 'react';
import { useGalleryStore } from '../../store/useGalleryStore';

export const BatchActionDock: React.FC = () => {
  const selectedIds = useGalleryStore((s) => s.selectedIds);
  const clearSelection = useGalleryStore((s) => s.clearSelection);
  const albums = useGalleryStore((s) => s.albums);
  const assignToAlbumOptimistic = useGalleryStore((s) => s.assignToAlbumOptimistic);
  const rollbackMutation = useGalleryStore((s) => s.rollbackMutation);
  const previousState = useGalleryStore((s) => s.previousState);
  const batchDeleteSelected = useGalleryStore((s) => s.batchDeleteSelected);
  const batchAddTag = useGalleryStore((s) => s.batchAddTag);

  const [showAlbumMenu, setShowAlbumMenu] = useState(false);
  const [showTagPrompt, setShowTagPrompt] = useState(false);
  const [tagInput, setTagInput] = useState('');

  if (selectedIds.length === 0) return null;

  const handleMove = (albumId: string) => {
    assignToAlbumOptimistic(selectedIds, albumId);
    setShowAlbumMenu(false);
  };

  const handleAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tagInput.trim()) {
      batchAddTag(tagInput.trim());
      setTagInput('');
      setShowTagPrompt(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[94vw] sm:w-auto animate-in slide-in-from-bottom-5 duration-300">
      <div className="relative glass-dock rounded-full px-4 sm:px-6 py-2.5 shadow-2xl flex items-center gap-3 border border-outline-variant/40 overflow-visible">
        {/* Active Selection Pill */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary font-mono-data text-xs font-semibold whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-primary-container animate-ping" />
          <span>{selectedIds.length} SELECTED</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Move to Album Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowAlbumMenu(!showAlbumMenu);
                setShowTagPrompt(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-highest text-on-surface hover:text-primary hover:bg-surface-container text-xs font-medium transition-colors whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">
                drive_file_move
              </span>
              <span>Move to Album</span>
            </button>

            {showAlbumMenu && (
              <div className="absolute bottom-full mb-2 left-0 w-56 rounded-xl bg-surface-container-high border border-outline-variant/40 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1 text-[10px] font-mono-data uppercase text-outline">
                  Select Destination Album
                </div>
                {Object.values(albums).map((alb) => (
                  <button
                    key={alb.id}
                    type="button"
                    onClick={() => handleMove(alb.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left text-on-surface hover:bg-primary/15 hover:text-primary transition-colors"
                  >
                    <span className="truncate">{alb.name}</span>
                    <span className="font-mono-data text-[10px] text-outline">
                      {alb.itemCount}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Batch Tag Prompt */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowTagPrompt(!showTagPrompt);
                setShowAlbumMenu(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-highest text-on-surface hover:text-primary hover:bg-surface-container text-xs font-medium transition-colors whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">label</span>
              <span>Batch Tag</span>
            </button>

            {showTagPrompt && (
              <form
                onSubmit={handleAddTagSubmit}
                className="absolute bottom-full mb-2 left-0 w-64 rounded-xl bg-surface-container-high border border-outline-variant/40 shadow-2xl p-2 z-50 flex gap-1.5"
              >
                <input
                  type="text"
                  placeholder="#cinematic"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  autoFocus
                  className="flex-1 bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-2.5 py-1 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-primary text-[#09090b] rounded-lg text-xs font-semibold hover:bg-primary/90"
                >
                  Add
                </button>
              </form>
            )}
          </div>

          {/* Test Rollback Button (if mutation occurred) */}
          {previousState && (
            <button
              type="button"
              onClick={rollbackMutation}
              title="Rubber-band state rollback (Netcode pattern)"
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-error-container/20 text-error hover:bg-error-container/30 border border-error-container/40 text-xs font-mono-data font-medium transition-colors whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[15px]">undo</span>
              <span>Rollback Netcode</span>
            </button>
          )}

          {/* Batch Delete */}
          <button
            type="button"
            onClick={batchDeleteSelected}
            title="Archive / Remove Selected"
            className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant hover:text-error hover:bg-error-container/20 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>

          {/* Dismiss Selection */}
          <button
            type="button"
            onClick={clearSelection}
            title="Deselect All (Esc)"
            className="w-7 h-7 rounded-full text-on-surface-variant hover:text-white flex items-center justify-center transition-colors ml-1"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
