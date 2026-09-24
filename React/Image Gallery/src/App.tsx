import React, { useEffect } from 'react';
import { useGalleryStore } from './store/useGalleryStore';
import { INITIAL_MEDIA, INITIAL_ALBUMS } from './data/mockMedia';
import { BackgroundLayer } from './components/background/BackgroundLayer';
import { HeaderHUD } from './components/layout/HeaderHUD';
import { AlbumSidebar } from './components/layout/AlbumSidebar';
import { FilterStrip } from './components/layout/FilterStrip';
import { VirtualizedMasonry } from './components/gallery/VirtualizedMasonry';
import { BatchActionDock } from './components/gallery/BatchActionDock';
import { LightboxStudio } from './components/lightbox/LightboxStudio';
import { MutationToast } from './components/layout/MutationToast';

export const App: React.FC = () => {
  const initializeGallery = useGalleryStore((s) => s.initializeGallery);
  const sidebarOpen = useGalleryStore((s) => s.sidebarOpen);

  // Initialize store with curated media assets
  useEffect(() => {
    initializeGallery(INITIAL_MEDIA, INITIAL_ALBUMS);
  }, [initializeGallery]);

  return (
    <div className="relative min-h-screen bg-transparent text-on-surface antialiased overflow-x-hidden">
      {/* Background Variation Layer (Void, HTML Canvas, Volumetric, Studio) */}
      <BackgroundLayer />

      {/* Global Top Aperture HUD */}
      <HeaderHUD />

      {/* Catalog & Drag-to-Album Sidebar */}
      <AlbumSidebar />

      {/* Main Spatial Media Workspace */}
      <div
        className={`pt-20 pb-24 px-4 sm:px-6 transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-72' : 'lg:pl-8'
        }`}
      >
        <main className="w-full max-w-[1920px] mx-auto">
          {/* Top Filter and Spatial Control Strip */}
          <FilterStrip />

          {/* 60fps Virtualized Spatial Masonry Grid Canvas */}
          <VirtualizedMasonry />
        </main>
      </div>

      {/* Persistent Floating Batch Command Dock */}
      <BatchActionDock />

      {/* Deep-Zoom Lightbox Studio Modal */}
      <LightboxStudio />

      {/* Netcode Optimistic Mutation & Rollback Toast */}
      <MutationToast />
    </div>
  );
};

export default App;
