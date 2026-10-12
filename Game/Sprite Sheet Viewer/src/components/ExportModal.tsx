import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  FileCode,
  FileSpreadsheet,
  FileType,
  Image as ImageIcon,
} from 'lucide-react';
import { SpriteAtlasProject } from '../types/sprite';
import {
  exportTexturePackerArray,
  exportTexturePackerHash,
  exportGodot4SpriteFrames,
  exportCSSKeyframes,
  exportUnityCSV,
} from '../lib/engineExporters';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: SpriteAtlasProject;
}

type ExportTab = 'tp-array' | 'tp-hash' | 'godot' | 'css' | 'unity';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [activeTab, setActiveTab] = useState<ExportTab>('tp-array');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate code content based on active tab
  let codeContent = '';
  let filename = '';
  let mimeType = 'application/json';

  switch (activeTab) {
    case 'tp-array':
      codeContent = exportTexturePackerArray(project);
      filename = `${project.title.toLowerCase().replace(/\s+/g, '_')}_array.json`;
      mimeType = 'application/json';
      break;
    case 'tp-hash':
      codeContent = exportTexturePackerHash(project);
      filename = `${project.title.toLowerCase().replace(/\s+/g, '_')}_hash.json`;
      mimeType = 'application/json';
      break;
    case 'godot':
      codeContent = exportGodot4SpriteFrames(project);
      filename = `${project.title.toLowerCase().replace(/\s+/g, '_')}.tres`;
      mimeType = 'text/plain';
      break;
    case 'css':
      codeContent = exportCSSKeyframes(project);
      filename = `${project.title.toLowerCase().replace(/\s+/g, '_')}.css`;
      mimeType = 'text/css';
      break;
    case 'unity':
      codeContent = exportUnityCSV(project);
      filename = `${project.title.toLowerCase().replace(/\s+/g, '_')}.csv`;
      mimeType = 'text/csv';
      break;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([codeContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    const a = document.createElement('a');
    a.href = project.imageUrl;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '_')}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-void/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-dock border border-border-subtle rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="h-12 border-b border-border-subtle px-4 flex items-center justify-between bg-card">
          <div className="flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-accent-cyan" />
            <h2 className="text-sm font-bold text-text-display">
              Universal Multi-Engine Metadata Exporter
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-dock text-text-muted hover:text-accent-crimson transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Engine Tabs */}
        <div className="flex items-center space-x-1 px-4 py-2 border-b border-border-subtle bg-void overflow-x-auto">
          <button
            onClick={() => setActiveTab('tp-array')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              activeTab === 'tp-array'
                ? 'bg-accent-cyan text-void shadow-glow-cyan'
                : 'text-text-muted hover:text-text-display hover:bg-card'
            }`}
          >
            <span>Phaser / Pixi (Array)</span>
          </button>

          <button
            onClick={() => setActiveTab('tp-hash')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              activeTab === 'tp-hash'
                ? 'bg-accent-cyan text-void shadow-glow-cyan'
                : 'text-text-muted hover:text-text-display hover:bg-card'
            }`}
          >
            <span>TexturePacker (Hash)</span>
          </button>

          <button
            onClick={() => setActiveTab('godot')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              activeTab === 'godot'
                ? 'bg-accent-cyan text-void shadow-glow-cyan'
                : 'text-text-muted hover:text-text-display hover:bg-card'
            }`}
          >
            <span>Godot 4 (.tres)</span>
          </button>

          <button
            onClick={() => setActiveTab('css')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              activeTab === 'css'
                ? 'bg-accent-cyan text-void shadow-glow-cyan'
                : 'text-text-muted hover:text-text-display hover:bg-card'
            }`}
          >
            <span>CSS Keyframes</span>
          </button>

          <button
            onClick={() => setActiveTab('unity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              activeTab === 'unity'
                ? 'bg-accent-cyan text-void shadow-glow-cyan'
                : 'text-text-muted hover:text-text-display hover:bg-card'
            }`}
          >
            <span>Unity CSV / Meta</span>
          </button>
        </div>

        {/* Code Viewport */}
        <div className="relative flex-1 p-4 bg-void overflow-hidden flex flex-col">
          <div className="flex items-center justify-between pb-2 text-xs font-mono text-text-muted">
            <span>{filename}</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-card hover:bg-border-subtle text-text-display text-xs border border-border-subtle transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-accent-emerald" />
                    <span className="text-accent-emerald">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadFile}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-accent-cyan text-void font-bold text-xs shadow-glow-cyan transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          <pre className="flex-1 bg-card p-3 rounded-lg border border-border-subtle overflow-auto font-mono text-[11px] text-accent-cyan leading-relaxed select-text">
            <code>{codeContent}</code>
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-dock border-t border-border-subtle flex items-center justify-between">
          <button
            onClick={handleDownloadPng}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-card hover:bg-border-subtle text-text-display text-xs font-medium border border-border-subtle transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-accent-emerald" />
            <span>Download Atlas PNG Texture</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-card hover:bg-border-subtle text-text-display text-xs font-semibold border border-border-subtle"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
