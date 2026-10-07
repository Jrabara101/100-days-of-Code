import React, { useState } from 'react';
import { SplitSegmentDefinition } from '../types/race';
import { Modal, Button, Badge } from './ui/primitives';
import { parseLiveSplitLss, exportToLiveSplitLss } from '../utils/lssParser';
import { formatTime } from '../utils/formatters';
import { Plus, Trash2, Upload, Download, FileCode, Check } from 'lucide-react';

interface SplitTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  categoryName: string;
  segments: SplitSegmentDefinition[];
  onSaveTemplate: (gameTitle: string, categoryName: string, segments: SplitSegmentDefinition[]) => void;
}

export const SplitTemplateModal: React.FC<SplitTemplateModalProps> = ({
  isOpen,
  onClose,
  gameTitle: initialTitle,
  categoryName: initialCategory,
  segments: initialSegments,
  onSaveTemplate,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [category, setCategory] = useState(initialCategory);
  const [segments, setSegments] = useState<SplitSegmentDefinition[]>(initialSegments);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleAddSegment = () => {
    const newSeg: SplitSegmentDefinition = {
      id: `seg-${Date.now().toString(36)}`,
      name: `New Segment ${segments.length + 1}`,
      targetDurationMs: 60000,
      personalBestSplitMs: 60000 * (segments.length + 1),
      goldSegmentDurationMs: 55000,
    };
    setSegments([...segments, newSeg]);
  };

  const handleRemoveSegment = (id: string) => {
    setSegments(segments.filter(s => s.id !== id));
  };

  const handleUpdateSegment = (id: string, field: keyof SplitSegmentDefinition, value: any) => {
    setSegments(segments.map(s => {
      if (s.id === id) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (parsed.segments) {
            setTitle(parsed.gameTitle || title);
            setCategory(parsed.categoryName || category);
            setSegments(parsed.segments);
            setImportStatus('JSON splits imported successfully!');
          }
        } else {
          // Parse LiveSplit .lss XML
          const parsed = parseLiveSplitLss(text);
          setTitle(parsed.gameTitle);
          setCategory(parsed.categoryName);
          setSegments(parsed.segments);
          setImportStatus(`Imported ${parsed.segments.length} segments from LiveSplit .lss!`);
        }
      } catch (err) {
        setImportStatus('Failed to parse file. Verify file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleExportJson = () => {
    const data = JSON.stringify({ gameTitle: title, categoryName: category, segments }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_splits.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveAndApply = () => {
    onSaveTemplate(title, category, segments);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="SPLIT TEMPLATE & LIVESPLIT (.LSS) MANAGER"
      subtitle="Create, customize, import, or export split configurations"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 font-mono text-xs text-slate-100">
        {/* Game & Category Form */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-obsidian-surface rounded border border-obsidian-border">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">GAME TITLE</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-obsidian-void border border-obsidian-border rounded px-2.5 py-1.5 text-slate-100 text-xs focus:border-neon-cyan focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">CATEGORY</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-obsidian-void border border-obsidian-border rounded px-2.5 py-1.5 text-slate-100 text-xs focus:border-neon-cyan focus:outline-none"
            />
          </div>
        </div>

        {/* File Import / Export Bar */}
        <div className="flex flex-wrap items-center justify-between p-3 rounded bg-obsidian-void border border-obsidian-border gap-2">
          <label className="inline-flex items-center gap-2 cursor-pointer bg-obsidian-surface hover:bg-obsidian-overlay border border-obsidian-border px-3 py-1.5 rounded text-xs font-bold text-slate-200 transition-colors">
            <Upload className="h-3.5 w-3.5 text-neon-cyan" />
            IMPORT .LSS / JSON
            <input
              type="file"
              accept=".lss,.xml,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <Button variant="secondary" size="sm" onClick={handleExportJson} className="flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5 text-neon-gold" />
            EXPORT JSON
          </Button>

          {importStatus && (
            <span className="text-[10px] text-neon-emerald w-full">{importStatus}</span>
          )}
        </div>

        {/* Segments Editor Table */}
        <div className="border border-obsidian-border rounded overflow-hidden">
          <div className="grid grid-cols-12 px-3 py-2 bg-obsidian-surface text-[10px] text-slate-400 font-bold border-b border-obsidian-border">
            <div className="col-span-1">#</div>
            <div className="col-span-5">SEGMENT NAME</div>
            <div className="col-span-3">TARGET DURATION (SEC)</div>
            <div className="col-span-2 text-right">GOLD (SEC)</div>
            <div className="col-span-1 text-center">DEL</div>
          </div>

          <div className="max-h-[280px] overflow-y-auto divide-y divide-obsidian-border/40 custom-scrollbar">
            {segments.map((seg, idx) => (
              <div key={seg.id} className="grid grid-cols-12 px-3 py-2 items-center text-xs gap-2">
                <span className="col-span-1 text-slate-500 font-bold">{idx + 1}</span>
                <input
                  type="text"
                  value={seg.name}
                  onChange={(e) => handleUpdateSegment(seg.id, 'name', e.target.value)}
                  className="col-span-5 bg-obsidian-void border border-obsidian-border rounded px-2 py-1 text-slate-200 text-xs focus:border-neon-cyan focus:outline-none"
                />
                <input
                  type="number"
                  value={Math.round((seg.targetDurationMs || 60000) / 1000)}
                  onChange={(e) => handleUpdateSegment(seg.id, 'targetDurationMs', parseFloat(e.target.value) * 1000)}
                  className="col-span-3 bg-obsidian-void border border-obsidian-border rounded px-2 py-1 text-slate-200 text-xs focus:border-neon-cyan focus:outline-none"
                />
                <input
                  type="number"
                  value={Math.round((seg.goldSegmentDurationMs || 50000) / 1000)}
                  onChange={(e) => handleUpdateSegment(seg.id, 'goldSegmentDurationMs', parseFloat(e.target.value) * 1000)}
                  className="col-span-2 bg-obsidian-void border border-obsidian-border rounded px-2 py-1 text-slate-200 text-xs focus:border-neon-cyan focus:outline-none text-right"
                />
                <div className="col-span-1 text-center">
                  <button
                    onClick={() => handleRemoveSegment(seg.id)}
                    className="text-slate-500 hover:text-neon-ruby transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2 bg-obsidian-surface border-t border-obsidian-border">
            <Button variant="ghost" size="sm" onClick={handleAddSegment} className="w-full text-neon-cyan">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Segment
            </Button>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="pt-3 flex items-center justify-between border-t border-obsidian-border">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleSaveAndApply}>
            Save & Apply to Race Room
          </Button>
        </div>
      </div>
    </Modal>
  );
};
