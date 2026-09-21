import React, { useEffect } from 'react';
import { usePixelStore } from './store/usePixelStore';
import { AppHeader } from './components/header/AppHeader';
import { EditorView } from './components/editor/EditorView';
import { TimelineView } from './components/timeline/TimelineView';
import { PalettesView } from './components/palettes/PalettesView';
import { LayersView } from './components/layers/LayersView';
import { ExportView } from './components/export/ExportView';
import { PeerJamOverlay } from './components/peer/PeerJamOverlay';

export const App: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    setActiveTool, 
    swapColors, 
    undo, 
    redo,
    canUndo,
    canRedo 
  } = usePixelStore();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (canRedo) redo();
        return;
      }

      // Tool shortcuts
      const key = e.key.toLowerCase();
      if (key === 'b') setActiveTool('pencil');
      if (key === 'e') setActiveTool('eraser');
      if (key === 'g') setActiveTool('bucket');
      if (key === 'i') setActiveTool('picker');
      if (key === 'm') setActiveTool('select');
      if (key === 'v') setActiveTool('move');
      if (key === 'x') swapColors();

      // Mode Navigation shortcuts (Alt+1..5)
      if (e.altKey) {
        if (key === '1') setActiveTab('editor');
        if (key === '2') setActiveTab('timeline');
        if (key === '3') setActiveTab('palettes');
        if (key === '4') setActiveTab('layers');
        if (key === '5') setActiveTab('export');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTool, swapColors, undo, redo, canUndo, canRedo, setActiveTab]);

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-background text-on-surface font-sans antialiased">
      {/* Top Application Header */}
      <AppHeader />

      {/* Main Mode Viewport */}
      <main className="w-full h-[calc(100vh-3.5rem)] pt-14 flex-1 overflow-hidden relative">
        {activeTab === 'editor' && <EditorView />}
        {activeTab === 'timeline' && <TimelineView />}
        {activeTab === 'palettes' && <PalettesView />}
        {activeTab === 'layers' && <LayersView />}
        {activeTab === 'export' && <ExportView />}
      </main>

      {/* Peer Jam Active Room Banner */}
      <PeerJamOverlay />
    </div>
  );
};

export default App;
