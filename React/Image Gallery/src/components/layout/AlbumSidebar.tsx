import React, { useState } from 'react';
import { useGalleryStore } from '../../store/useGalleryStore';

export const AlbumSidebar: React.FC = () => {
  const albums = useGalleryStore((s) => s.albums);
  const activeAlbumId = useGalleryStore((s) => s.activeAlbumId);
  const setActiveAlbum = useGalleryStore((s) => s.setActiveAlbum);
  const allIds = useGalleryStore((s) => s.allIds);
  const sidebarOpen = useGalleryStore((s) => s.sidebarOpen);
  const toggleSidebar = useGalleryStore((s) => s.toggleSidebar);
  const assignToAlbumOptimistic = useGalleryStore((s) => s.assignToAlbumOptimistic);
  const createNewAlbum = useGalleryStore((s) => s.createNewAlbum);

  const [dragOverAlbumId, setDragOverAlbumId] = useState<string | null>(null);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState<boolean>(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState<string>('');

  const handleDragOver = (e: React.DragEvent, albumId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverAlbumId !== albumId) {
      setDragOverAlbumId(albumId);
    }
  };

  const handleDragLeave = (albumId: string) => {
    if (dragOverAlbumId === albumId) {
      setDragOverAlbumId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, albumId: string) => {
    e.preventDefault();
    setDragOverAlbumId(null);
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        if (parsed.mediaIds && Array.isArray(parsed.mediaIds)) {
          assignToAlbumOptimistic(parsed.mediaIds, albumId);
        }
      }
    } catch (err) {
      console.error('Failed to parse drag drop data:', err);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAlbumTitle.trim()) {
      createNewAlbum(newAlbumTitle.trim());
      setNewAlbumTitle('');
      setIsCreatingAlbum(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed left-0 top-16 bottom-0 w-64 bg-surface-container-lowest border-r border-outline-variant/30 z-30 flex flex-col justify-between p-4 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6 overflow-y-auto pr-1">
          {/* Section: Studio Catalog & Drag Targets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-mono-data text-[10px] uppercase text-outline tracking-wider font-semibold">
                Studio Catalog
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingAlbum(!isCreatingAlbum)}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high text-primary hover:bg-primary hover:text-[#09090b] font-mono-data text-[10px] transition-all"
              >
                <span className="material-symbols-outlined text-[13px]">add</span>
                <span>New</span>
              </button>
            </div>

            {/* Inline Album Creation Form */}
            {isCreatingAlbum && (
              <form
                onSubmit={handleCreateSubmit}
                className="p-2 rounded-lg bg-surface-container border border-outline-variant/30 space-y-1.5 animate-in fade-in"
              >
                <input
                  type="text"
                  placeholder="Album name..."
                  value={newAlbumTitle}
                  onChange={(e) => setNewAlbumTitle(e.target.value)}
                  autoFocus
                  className="w-full px-2 py-1 text-xs rounded bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                />
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingAlbum(false)}
                    className="px-2 py-0.5 text-[10px] text-outline hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2 py-0.5 text-[10px] bg-primary text-[#09090b] rounded font-semibold"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* All Media Root Folder */}
            <div
              onClick={() => setActiveAlbum(null)}
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                activeAlbumId === null
                  ? 'bg-surface-container-high text-primary font-medium shadow-sm border border-primary/20'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">view_quilt</span>
                <span className="text-xs">All Media Archive</span>
              </div>
              <span className="font-mono-data text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-outline">
                {allIds.length}
              </span>
            </div>

            {/* Album Folders with Droppable Drag-and-Drop Targets */}
            <div className="space-y-1 pt-1">
              {Object.values(albums).map((album) => {
                const isSelected = activeAlbumId === album.id;
                const isDropping = dragOverAlbumId === album.id;

                return (
                  <div
                    key={album.id}
                    onDragOver={(e) => handleDragOver(e, album.id)}
                    onDragLeave={() => handleDragLeave(album.id)}
                    onDrop={(e) => handleDrop(e, album.id)}
                    onClick={() => setActiveAlbum(album.id)}
                    className={`group relative rounded-lg p-2 cursor-pointer transition-all duration-200 ${
                      isDropping
                        ? 'bg-primary/20 border-2 border-dashed border-primary shadow-[0_0_15px_rgba(56,189,248,0.4)] scale-[1.02]'
                        : isSelected
                        ? 'bg-surface-container-high text-primary font-medium border border-primary/30 shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`material-symbols-outlined text-[18px] ${
                            isSelected || isDropping ? 'text-primary' : 'text-outline'
                          }`}
                        >
                          {isSelected ? 'folder_open' : album.icon || 'folder'}
                        </span>
                        <span className="text-xs truncate max-w-[130px]">{album.name}</span>
                      </div>
                      <span className="font-mono-data text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-outline">
                        {album.itemCount}
                      </span>
                    </div>

                    {/* Droppable Hover Affordance */}
                    {isDropping && (
                      <div className="mt-1.5 py-1 px-2 rounded bg-surface-container-highest/80 text-primary font-mono-data text-[9px] flex items-center justify-center gap-1.5 animate-pulse">
                        <span className="material-symbols-outlined text-[14px]">file_download</span>
                        <span>Drop to re-parent</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Smart Sets */}
          <div className="space-y-1.5 pt-2 border-t border-outline-variant/30">
            <div className="font-mono-data text-[10px] uppercase tracking-wider text-outline px-1">
              Smart Sets
            </div>
            <div className="space-y-1 text-xs text-on-surface-variant">
              <div
                onClick={() => {
                  useGalleryStore.getState().setActiveRatingFilter(null);
                  useGalleryStore.getState().setFormatFilter(null);
                  setActiveAlbum(null);
                }}
                className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-surface-container hover:text-on-surface cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    auto_awesome
                  </span>
                  <span>Recent Captures</span>
                </span>
                <span className="font-mono-data text-[10px] text-outline">12</span>
              </div>

              <div
                onClick={() => useGalleryStore.getState().setFormatFilter('ARW')}
                className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-surface-container hover:text-on-surface cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    hdr_on
                  </span>
                  <span>16-Bit RAW (ARW)</span>
                </span>
                <span className="font-mono-data text-[10px] text-outline">5</span>
              </div>

              <div
                onClick={() => useGalleryStore.getState().setActiveRatingFilter(5)}
                className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-surface-container hover:text-on-surface cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    star_rate
                  </span>
                  <span>5-Star Portfolio</span>
                </span>
                <span className="font-mono-data text-[10px] text-outline">8</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Hardware Engine Telemetry */}
        <div className="pt-3 border-t border-outline-variant/30 space-y-2">
          <div className="p-2.5 rounded-lg bg-surface-container-lowest space-y-1.5 border border-outline-variant/20">
            <div className="flex items-center justify-between font-mono-data text-[10px]">
              <span className="text-outline">NVMe Cache</span>
              <span className="text-on-surface font-semibold">148 GB / 1.0 TB</span>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-1 overflow-hidden">
              <div className="bg-primary-container h-full rounded-full w-[15%]" />
            </div>
            <div className="flex items-center justify-between font-mono-data text-[9px] text-outline pt-0.5">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Vulkan Engine
              </span>
              <span className="text-primary-fixed-dim">0.8ms Render</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
