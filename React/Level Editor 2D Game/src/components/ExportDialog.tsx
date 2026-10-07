import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Download,
  FileCode,
  Image as ImageIcon,
  Check,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { LevelMap } from '../types/index.js';
import {
  exportToTiledJSON,
  exportToGodotTSCN,
  exportToUnityCSV,
  renderCompositePNG,
  downloadFile,
} from '../utils/exporter.js';
import { Button } from './ui/index.js';
import { sound } from '../utils/audio.js';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  map: LevelMap;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose, map }) => {
  const [activeTab, setActiveTab] = useState<'tiled' | 'godot' | 'unity' | 'png' | 'blueprint'>('tiled');
  const [copied, setCopied] = useState(false);
  const [pngDataUrl, setPngDataUrl] = useState<string | null>(null);
  const [pngScale, setPngScale] = useState<number>(2);

  // Generate PNG preview when tab is active
  useEffect(() => {
    if (activeTab === 'png' && isOpen) {
      renderCompositePNG(map, pngScale).then((url) => setPngDataUrl(url));
    }
  }, [activeTab, pngScale, map, isOpen]);

  if (!isOpen) return null;

  const tiledContent = exportToTiledJSON(map);
  const godotContent = exportToGodotTSCN(map);
  const unityContent = exportToUnityCSV(map, 1);
  const blueprintContent = JSON.stringify(map, null, 2);

  const getCurrentContent = () => {
    if (activeTab === 'tiled') return tiledContent;
    if (activeTab === 'godot') return godotContent;
    if (activeTab === 'unity') return unityContent;
    return blueprintContent;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentContent());
    setCopied(true);
    sound.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    sound.playClick();
    const safeTitle = map.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    if (activeTab === 'tiled') {
      downloadFile(tiledContent, `${safeTitle}.tmj`, 'application/json');
    } else if (activeTab === 'godot') {
      downloadFile(godotContent, `${safeTitle}.tscn`, 'text/plain');
    } else if (activeTab === 'unity') {
      downloadFile(unityContent, `${safeTitle}_layer.csv`, 'text/csv');
    } else if (activeTab === 'blueprint') {
      downloadFile(blueprintContent, `${safeTitle}_blueprint.json`, 'application/json');
    } else if (activeTab === 'png' && pngDataUrl) {
      const a = document.createElement('a');
      a.href = pngDataUrl;
      a.download = `${safeTitle}_composite_${pngScale}x.png`;
      a.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#121620] border border-[#222B3D] rounded-2xl w-full max-w-3xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#222B3D] flex items-center justify-between bg-[#0E121A]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Download className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-sm text-[#F8FAFC]">
              Universal Engine-Ready Asset Exporter
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#192030]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-[#222B3D] bg-[#0E121A]/50 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('tiled')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'tiled'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Tiled JSON (.tmj)</span>
          </button>

          <button
            onClick={() => setActiveTab('godot')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'godot'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            <span>Godot 4 (.tscn)</span>
          </button>

          <button
            onClick={() => setActiveTab('unity')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'unity'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unity CSV Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('png')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'png'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Composite PNG</span>
          </button>

          <button
            onClick={() => setActiveTab('blueprint')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'blueprint'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Blueprint JSON</span>
          </button>
        </div>

        {/* Modal Body: Code or PNG Preview */}
        <div className="flex-1 overflow-hidden p-5 flex flex-col">
          {activeTab === 'png' ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 overflow-y-auto">
              {/* Scale Controls */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-[#94A3B8]">Upscale Factor:</span>
                {[1, 2, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPngScale(s)}
                    className={`px-2 py-0.5 rounded border ${
                      pngScale === s
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                        : 'bg-[#192030] text-[#94A3B8] border-[#222B3D]'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              {pngDataUrl ? (
                <div className="max-h-[340px] max-w-full overflow-auto border border-[#222B3D] rounded-xl p-2 bg-[#0A0C10] shadow-inner">
                  <img
                    src={pngDataUrl}
                    alt="Map Composite Preview"
                    className="max-h-[300px] object-contain mx-auto image-rendering-pixelated"
                  />
                </div>
              ) : (
                <div className="text-sm text-[#64748B] py-12">Rendering composite PNG...</div>
              )}
            </div>
          ) : (
            <div className="flex-1 bg-[#0A0C10] border border-[#222B3D] rounded-xl p-3 overflow-auto font-mono text-[11px] text-slate-300 leading-relaxed select-text">
              <pre>{getCurrentContent()}</pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#222B3D] bg-[#0E121A] flex items-center justify-between">
          <span className="text-xs text-[#64748B] font-mono">
            {map.dimensions.widthInTiles}×{map.dimensions.heightInTiles} tiles • {map.layers.length} layers •{' '}
            {map.entities.length} entities
          </span>

          <div className="flex items-center gap-2">
            {activeTab !== 'png' && (
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </Button>
            )}

            <Button variant="primary" size="sm" onClick={handleDownload}>
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
