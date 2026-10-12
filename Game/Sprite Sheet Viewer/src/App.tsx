import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SpriteAtlasProject, SliceConfig, BoundingBox, HitboxType, OptimizationResult } from './types/sprite';
import { createDefaultProject, createRogueProject } from './lib/defaultAssets';
import { generateGridFrames, convertIslandsToFrames } from './lib/atlasMath';
import { detectSpriteIslands } from './lib/heuristicSlicer';
import { TopNavbar } from './components/TopNavbar';
import { LeftDock } from './components/LeftDock';
import { AtlasViewport } from './components/AtlasViewport';
import { RightDock } from './components/RightDock';
import { PlaytestModal } from './components/PlaytestModal';
import { ExportModal } from './components/ExportModal';
import { OptimizationModal } from './components/OptimizationModal';

export const App: React.FC = () => {
  // Current active project
  const [project, setProject] = useState<SpriteAtlasProject>(() => createDefaultProject());
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  // Undo / Redo history
  const [history, setHistory] = useState<SpriteAtlasProject[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isUndoRedoAction = useRef(false);

  // Viewport display settings
  const [zoom, setZoom] = useState<number>(4);
  const [pixelated, setPixelated] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Frame selection states
  const [selectedFrameIds, setSelectedFrameIds] = useState<string[]>([]);
  const [activeFrameId, setActiveFrameId] = useState<string | null>(null);

  // Modals
  const [isPlaytestOpen, setIsPlaytestOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isOptimizeOpen, setIsOptimizeOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load Image element whenever project.imageUrl changes
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setLoadedImage(img);
      setProject((p) => ({
        ...p,
        imageDimensions: {
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        },
      }));
    };
    img.src = project.imageUrl;
  }, [project.imageUrl]);

  // Set initial active frame
  useEffect(() => {
    const firstFrameId = Object.keys(project.frames)[0];
    if (firstFrameId && !activeFrameId) {
      setActiveFrameId(firstFrameId);
      setSelectedFrameIds([firstFrameId]);
    }
  }, [project.frames, activeFrameId]);

  // Push state to Undo/Redo history
  const pushHistory = useCallback((newProject: SpriteAtlasProject) => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    setHistory((prev) => {
      const slice = prev.slice(0, historyIndex + 1);
      return [...slice, JSON.parse(JSON.stringify(newProject))];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Update project helper with history snapshot
  const updateProject = useCallback((updater: (prev: SpriteAtlasProject) => SpriteAtlasProject) => {
    setProject((prev) => {
      const updated = updater(prev);
      pushHistory(updated);
      return updated;
    });
  }, [pushHistory]);

  // Undo / Redo handlers
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const prevProject = history[historyIndex - 1];
      setHistoryIndex((idx) => idx - 1);
      setProject(JSON.parse(JSON.stringify(prevProject)));
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const nextProject = history[historyIndex + 1];
      setHistoryIndex((idx) => idx + 1);
      setProject(JSON.parse(JSON.stringify(nextProject)));
    }
  }, [history, historyIndex]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key.toLowerCase() === 'z') {
        setPixelated((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Slice Atlas action (Uniform grid or Heuristic Alpha)
  const handleApplySlice = useCallback(() => {
    if (!loadedImage) return;

    const { sliceConfig, imageDimensions } = project;
    let newFramesList: any[] = [];

    if (sliceConfig.mode === 'auto') {
      // Run Heuristic auto-slice
      const islands = detectSpriteIslands(
        loadedImage,
        sliceConfig.alphaThreshold || 15,
        sliceConfig.minClusterSize || 8
      );
      newFramesList = convertIslandsToFrames(islands);
    } else {
      // Run Uniform Grid slice
      newFramesList = generateGridFrames(
        imageDimensions.width,
        imageDimensions.height,
        sliceConfig
      );
    }

    const newFramesMap: Record<string, any> = {};
    newFramesList.forEach((f) => {
      newFramesMap[f.id] = f;
    });

    updateProject((prev) => {
      // Preserve clips or map to new frames
      const frameIds = Object.keys(newFramesMap);
      const updatedClips = prev.clips.map((c) => ({
        ...c,
        frameIds: c.frameIds.filter((id) => newFramesMap[id]).length > 0
          ? c.frameIds.filter((id) => newFramesMap[id])
          : frameIds.slice(0, 4),
      }));

      return {
        ...prev,
        frames: newFramesMap,
        clips: updatedClips,
      };
    });

    const firstId = Object.keys(newFramesMap)[0] || null;
    setActiveFrameId(firstId);
    setSelectedFrameIds(firstId ? [firstId] : []);
  }, [loadedImage, project, updateProject]);

  // Frame selection
  const handleSelectFrame = (id: string, multi: boolean) => {
    setActiveFrameId(id);
    if (multi) {
      setSelectedFrameIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setSelectedFrameIds([id]);
    }
  };

  const handleSelectMultipleFrames = (ids: string[]) => {
    setSelectedFrameIds(ids);
    if (ids.length > 0) {
      setActiveFrameId(ids[0]);
    }
  };

  const handleSelectAllFrames = () => {
    const allIds = Object.keys(project.frames);
    setSelectedFrameIds(allIds);
  };

  const handleClearSelection = () => {
    setSelectedFrameIds([]);
  };

  // Add selected frames to active clip
  const handleAddSelectedToClip = () => {
    if (selectedFrameIds.length === 0) return;
    updateProject((prev) => {
      const activeClip = prev.clips.find((c) => c.id === prev.activeClipId);
      if (!activeClip) return prev;

      const updatedClips = prev.clips.map((c) =>
        c.id === prev.activeClipId
          ? { ...c, frameIds: [...c.frameIds, ...selectedFrameIds] }
          : c
      );
      return { ...prev, clips: updatedClips };
    });
  };

  // Upload image handler
  const handleUploadImage = async (file: File) => {
    // 1. Instant client-side display via FileReader
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const defaultTile = w >= 64 && w % 32 === 0 ? 32 : 16;

        const defaultFrames = generateGridFrames(w, h, {
          mode: 'grid',
          frameWidth: defaultTile,
          frameHeight: defaultTile,
          offsetX: 0,
          offsetY: 0,
          spacingX: 0,
          spacingY: 0,
        });

        const framesMap: Record<string, any> = {};
        defaultFrames.forEach((f) => (framesMap[f.id] = f));

        const frameIds = Object.keys(framesMap);
        const newProj: SpriteAtlasProject = {
          id: `proj_${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          imageUrl: dataUrl,
          imageDimensions: { width: w, height: h },
          sliceConfig: {
            mode: 'grid',
            frameWidth: defaultTile,
            frameHeight: defaultTile,
            offsetX: 0,
            offsetY: 0,
            spacingX: 0,
            spacingY: 0,
          },
          frames: framesMap,
          clips: [
            {
              id: 'clip_default',
              name: 'Animation 1',
              fps: 12,
              loop: true,
              pingPong: false,
              frameIds: frameIds.slice(0, Math.min(8, frameIds.length)),
            },
          ],
          activeClipId: 'clip_default',
        };

        setProject(newProj);
        pushHistory(newProj);
        setActiveFrameId(frameIds[0] || null);
        setSelectedFrameIds(frameIds[0] ? [frameIds[0]] : []);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);

    // 2. Also asynchronously upload to Fastify backend if running
    try {
      const formData = new FormData();
      formData.append('file', file);
      await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
    } catch {}
  };

  // Switch demo characters
  const handleSelectSample = (sampleType: 'knight' | 'rogue') => {
    const newProj = sampleType === 'rogue' ? createRogueProject() : createDefaultProject();
    setProject(newProj);
    pushHistory(newProj);
    const firstId = Object.keys(newProj.frames)[0] || null;
    setActiveFrameId(firstId);
    setSelectedFrameIds(firstId ? [firstId] : []);
  };

  // Save to Fastify SQLite backend
  const handleSaveCloud = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/atlas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (res.ok) {
        alert('Project session saved successfully to SQLite cloud storage!');
      } else {
        alert('Could not save to backend server. Make sure Fastify backend is running.');
      }
    } catch {
      alert('Saved locally. Backend server not reached.');
    } finally {
      setIsSaving(false);
    }
  };

  // Apply MaxRects optimization result to project
  const handleApplyOptimization = (opt: OptimizationResult) => {
    updateProject((prev) => ({
      ...prev,
      imageUrl: opt.repackedImageUrl,
      imageDimensions: { ...opt.repackedDimensions },
      frames: opt.frames,
    }));
  };

  // Active clip object
  const activeClip = project.clips.find((c) => c.id === project.activeClipId) || project.clips[0];

  return (
    <div className="flex flex-col h-screen w-screen bg-void text-text-display overflow-hidden">
      {/* 1. TOP NAVIGATION BAR */}
      <TopNavbar
        project={project}
        onUpdateTitle={(title) => updateProject((p) => ({ ...p, title }))}
        onUploadImage={handleUploadImage}
        onSelectSample={handleSelectSample}
        zoom={zoom}
        onZoomChange={setZoom}
        onFitToViewport={() => setZoom(1)}
        pixelated={pixelated}
        onTogglePixelated={() => setPixelated((p) => !p)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((g) => !g)}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenPlaytest={() => setIsPlaytestOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenOptimize={() => setIsOptimizeOpen(true)}
        onSaveCloud={handleSaveCloud}
        isSaving={isSaving}
      />

      {/* 2. MAIN 3-COLUMN WORKSPACE */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Dock: Slice & Grid Controller */}
        <LeftDock
          sliceConfig={project.sliceConfig}
          onUpdateSliceConfig={(cfg) =>
            updateProject((p) => ({
              ...p,
              sliceConfig: { ...p.sliceConfig, ...cfg },
            }))
          }
          onApplySlice={handleApplySlice}
          frameCount={Object.keys(project.frames).length}
          selectedCount={selectedFrameIds.length}
          onSelectAllFrames={handleSelectAllFrames}
          onClearSelection={handleClearSelection}
          onAddSelectedToClip={handleAddSelectedToClip}
          activeClipName={activeClip ? activeClip.name : 'Active Clip'}
        />

        {/* Center: Interactive Full-Bleed Atlas Viewport Canvas */}
        <AtlasViewport
          image={loadedImage}
          imageDimensions={project.imageDimensions}
          frames={project.frames}
          selectedFrameIds={selectedFrameIds}
          activeFrameId={activeFrameId}
          onSelectFrame={handleSelectFrame}
          onSelectMultipleFrames={handleSelectMultipleFrames}
          pixelated={pixelated}
          showGrid={showGrid}
          onUploadImage={handleUploadImage}
          zoom={zoom}
          onZoomChange={setZoom}
        />

        {/* Right Dock: Animation Previewer & Filmstrip & Hitbox Inspector */}
        <RightDock
          image={loadedImage}
          clips={project.clips}
          activeClipId={project.activeClipId}
          frames={project.frames}
          onSelectClip={(id) => updateProject((p) => ({ ...p, activeClipId: id }))}
          onCreateClip={(name) =>
            updateProject((p) => {
              const newClip = {
                id: `clip_${Date.now()}`,
                name,
                fps: 12,
                loop: true,
                pingPong: false,
                frameIds: selectedFrameIds.length > 0 ? [...selectedFrameIds] : [],
              };
              return {
                ...p,
                clips: [...p.clips, newClip],
                activeClipId: newClip.id,
              };
            })
          }
          onDeleteClip={(id) =>
            updateProject((p) => ({
              ...p,
              clips: p.clips.filter((c) => c.id !== id),
              activeClipId: p.clips[0]?.id || '',
            }))
          }
          onDuplicateClip={(id) =>
            updateProject((p) => {
              const target = p.clips.find((c) => c.id === id);
              if (!target) return p;
              const copy = {
                ...target,
                id: `clip_${Date.now()}`,
                name: `${target.name} Copy`,
              };
              return {
                ...p,
                clips: [...p.clips, copy],
                activeClipId: copy.id,
              };
            })
          }
          onRenameClip={(id, newName) =>
            updateProject((p) => ({
              ...p,
              clips: p.clips.map((c) => (c.id === id ? { ...c, name: newName } : c)),
            }))
          }
          onUpdateClipFps={(id, fps) =>
            updateProject((p) => ({
              ...p,
              clips: p.clips.map((c) => (c.id === id ? { ...c, fps } : c)),
            }))
          }
          onUpdateClipFrames={(id, frameIds) =>
            updateProject((p) => ({
              ...p,
              clips: p.clips.map((c) => (c.id === id ? { ...c, frameIds } : c)),
            }))
          }
          onUpdateFrameAnchor={(fId, anchor) =>
            updateProject((p) => ({
              ...p,
              frames: {
                ...p.frames,
                [fId]: { ...p.frames[fId], anchorPoint: anchor },
              },
            }))
          }
          onApplyAnchorToAll={(anchor) =>
            updateProject((p) => {
              const updatedFrames = { ...p.frames };
              Object.keys(updatedFrames).forEach((key) => {
                updatedFrames[key] = {
                  ...updatedFrames[key],
                  anchorPoint: { ...anchor },
                };
              });
              return { ...p, frames: updatedFrames };
            })
          }
          onAddHitbox={(fId, type) =>
            updateProject((p) => {
              const frame = p.frames[fId];
              if (!frame) return p;
              const newHb: BoundingBox = {
                id: `hb_${fId}_${Date.now()}`,
                type,
                x: Math.round(frame.sourceRect.width * 0.2),
                y: Math.round(frame.sourceRect.height * 0.2),
                width: Math.round(frame.sourceRect.width * 0.6),
                height: Math.round(frame.sourceRect.height * 0.6),
                label: type.toUpperCase(),
              };
              return {
                ...p,
                frames: {
                  ...p.frames,
                  [fId]: { ...frame, hitboxes: [...frame.hitboxes, newHb] },
                },
              };
            })
          }
          onUpdateHitbox={(fId, hitbox) =>
            updateProject((p) => {
              const frame = p.frames[fId];
              if (!frame) return p;
              return {
                ...p,
                frames: {
                  ...p.frames,
                  [fId]: {
                    ...frame,
                    hitboxes: frame.hitboxes.map((h) => (h.id === hitbox.id ? hitbox : h)),
                  },
                },
              };
            })
          }
          onDeleteHitbox={(fId, hbId) =>
            updateProject((p) => {
              const frame = p.frames[fId];
              if (!frame) return p;
              return {
                ...p,
                frames: {
                  ...p.frames,
                  [fId]: {
                    ...frame,
                    hitboxes: frame.hitboxes.filter((h) => h.id !== hbId),
                  },
                },
              };
            })
          }
          pixelated={pixelated}
        />
      </div>

      {/* 3. MODALS */}
      <PlaytestModal
        isOpen={isPlaytestOpen}
        onClose={() => setIsPlaytestOpen(false)}
        image={loadedImage}
        clips={project.clips}
        frames={project.frames}
        pixelated={pixelated}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        project={project}
      />

      <OptimizationModal
        isOpen={isOptimizeOpen}
        onClose={() => setIsOptimizeOpen(false)}
        project={project}
        onApplyOptimization={handleApplyOptimization}
      />
    </div>
  );
};
