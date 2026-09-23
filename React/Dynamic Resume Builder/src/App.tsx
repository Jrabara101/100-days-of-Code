import React, { useEffect } from 'react';
import { useResumeStore } from './store/useResumeStore';
import { ActivitySidebar } from './components/common/ActivitySidebar';
import { HeaderBar } from './components/common/HeaderBar';
import { FormEditorPane } from './components/editor/FormEditorPane';
import { SpatialCanvas } from './components/canvas/SpatialCanvas';
import { StyleInspectorPane } from './components/inspector/StyleInspectorPane';
import { AtsDiagnosticsHUD } from './components/ats/AtsDiagnosticsHUD';

export const App: React.FC = () => {
  const { viewMode, setViewMode, undo, redo, canUndo, canRedo } = useResumeStore();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: ⌘Z or Ctrl+Z (without shift)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
      // Redo: ⇧⌘Z or Ctrl+Shift+Z or Ctrl+Y
      else if (
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && e.shiftKey) ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        if (canRedo) redo();
      }
      // Escape: Exit Preview mode back to Split View
      else if (e.key === 'Escape' && viewMode === 'preview') {
        e.preventDefault();
        setViewMode('split');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, viewMode, setViewMode]);

  return (
    <div className="relative min-h-screen bg-surface-container-lowest text-on-surface flex flex-col font-body-md selection:bg-primary/30 selection:text-primary">
      {/* Activity Sidebar (Dock) */}
      <ActivitySidebar />

      {/* Main Workspace Frame */}
      <div className="pl-16 flex flex-col h-screen w-full overflow-hidden">
        {/* Top Header Bar */}
        <HeaderBar />

        {/* Studio Workspace 3-Column Grid */}
        <main className="relative pt-14 w-full h-[calc(100vh)] overflow-hidden bg-surface-container-lowest">
          <div className="flex w-full h-[calc(100vh-56px)] overflow-hidden bg-surface-container-lowest">
            {/* COLUMN 1: Left Form Editor Pane (hidden in 'preview' mode) */}
            {viewMode !== 'preview' && <FormEditorPane />}

            {/* COLUMN 2: Center Live A4 Spatial Canvas Viewport */}
            <SpatialCanvas />

            {/* COLUMN 3: Right Sidebar Style & Inspector (hidden in 'preview' or 'editor' mode) */}
            {viewMode === 'split' && <StyleInspectorPane />}
          </div>

          {/* Gamified Floating ATS HUD Overlay */}
          <AtsDiagnosticsHUD />
        </main>
      </div>
    </div>
  );
};

export default App;
