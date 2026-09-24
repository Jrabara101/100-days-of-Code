import React, { useState } from 'react';
import {
  X,
  Download,
  Image as ImageIcon,
  Film,
  FileCode,
  Share2,
  Check,
  Sparkles,
} from 'lucide-react';
import { StoryPanel, ThemeConfig } from '../types';
import { sound } from '../utils/soundEngine';

interface ExportModalProps {
  isOpen: boolean;
  storyTitle: string;
  panels: StoryPanel[];
  theme: ThemeConfig;
  getShareableUrl: () => string;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  storyTitle,
  panels,
  theme,
  getShareableUrl,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  // 1. Export High-Res PNG Comic Strip via HTML5 Canvas
  const handleExportPNG = () => {
    setIsExporting(true);
    sound.playDing();

    const canvas = document.createElement('canvas');
    const panelWidth = 800;
    const panelHeight = 450;
    const padding = 40;
    const cols = Math.min(2, panels.length);
    const rows = Math.ceil(panels.length / cols);

    canvas.width = cols * panelWidth + (cols + 1) * padding;
    canvas.height = rows * panelHeight + (rows + 1) * padding + 120; // plus header title space

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background fill
    ctx.fillStyle = theme.bodyBg || '#FFF1F2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title banner
    ctx.fillStyle = theme.primaryColor || '#F43F5E';
    ctx.font = 'bold 36px Fredoka, sans-serif';
    ctx.fillText(`🍰 ${storyTitle}`, padding, 70);

    ctx.fillStyle = '#666666';
    ctx.font = '18px Fredoka, sans-serif';
    ctx.fillText(`Baked with EmojiStory Atelier • ${panels.length} Comic Panels`, padding, 105);

    // Draw panels
    panels.forEach((p, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = padding + col * (panelWidth + padding);
      const y = 140 + row * (panelHeight + padding);

      // Panel background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x, y, panelWidth, panelHeight);

      // Panel border
      ctx.lineWidth = 6;
      ctx.strokeStyle = theme.frameBorderColor || '#E8D5C4';
      ctx.strokeRect(x, y, panelWidth, panelHeight);

      // Header stamp
      ctx.fillStyle = theme.primaryColor;
      ctx.font = 'bold 20px Fredoka, sans-serif';
      ctx.fillText(`PAGE #${String(idx + 1).padStart(2, '0')}: ${p.title || 'Scene'}`, x + 20, y + 36);

      // Render stickers
      p.stickers.forEach((s) => {
        const sx = x + (s.x / 100) * panelWidth;
        const sy = y + (s.y / 100) * panelHeight;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(((s.rotation || 0) * Math.PI) / 180);
        ctx.font = `${Math.round(48 * (s.scale || 1))}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.char, 0, 0);
        ctx.restore();
      });

      // Subtitle caption at bottom of panel
      ctx.fillStyle = '#222222';
      ctx.font = 'bold 16px Fredoka, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`"${p.caption || ''}"`, x + 20, y + panelHeight - 20);
    });

    // Trigger download
    const link = document.createElement('a');
    link.download = `${storyTitle.replace(/\s+/g, '_')}_comic_strip.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setIsExporting(false);
  };

  // 2. Export JSON story
  const handleExportJSON = () => {
    sound.playPop();
    const data = JSON.stringify({ storyTitle, theme: theme.id, panels }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${storyTitle.replace(/\s+/g, '_')}.json`;
    link.href = url;
    link.click();
  };

  // 3. Share link
  const handleCopyLink = () => {
    sound.playChime();
    const shareUrl = getShareableUrl();
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-pop-in select-none">
      <div className="w-full max-w-lg bg-white dark:bg-[#10131a] rounded-3xl border border-rose-100 dark:border-[#374151] shadow-2xl p-6 flex flex-col gap-4 text-stone-800 dark:text-stone-100">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🎂</span>
            <div className="flex flex-col">
              <span className="font-fredoka text-lg font-bold">
                Bake &amp; Export Story Reel
              </span>
              <span className="font-fredoka text-xs text-stone-400">
                Generate high-res PNG comics, video clips, or shareable links
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* PNG Comic Strip */}
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="p-4 rounded-2xl bg-rose-50 dark:bg-stone-800 border-2 border-rose-200 dark:border-stone-700 hover:border-berry-red flex flex-col items-center justify-center gap-2 clay-puffy text-center"
          >
            <ImageIcon className="w-8 h-8 text-berry-red" />
            <div className="flex flex-col">
              <span className="font-fredoka text-sm font-bold">Export PNG Comic Strip</span>
              <span className="font-fredoka text-[10px] text-stone-400">
                High-res multi-panel graphic novel layout
              </span>
            </div>
          </button>

          {/* JSON File Backup */}
          <button
            onClick={handleExportJSON}
            className="p-4 rounded-2xl bg-amber-50 dark:bg-stone-800 border-2 border-amber-200 dark:border-stone-700 hover:border-amber-400 flex flex-col items-center justify-center gap-2 clay-puffy text-center"
          >
            <FileCode className="w-8 h-8 text-amber-600" />
            <div className="flex flex-col">
              <span className="font-fredoka text-sm font-bold">Download Story JSON</span>
              <span className="font-fredoka text-[10px] text-stone-400">
                Save full narrative state to file
              </span>
            </div>
          </button>
        </div>

        {/* One-click share seed URL */}
        <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-fredoka text-xs font-bold flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-berry-red" />
              <span>One-Click Shareable Seed URL:</span>
            </span>
            <span className="font-fredoka text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              Instant Cloud-Free Embed
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={getShareableUrl()}
              className="flex-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 p-2 rounded-xl text-xs font-mono truncate outline-none select-all"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 rounded-xl bg-berry-red hover:bg-rose-600 text-white font-fredoka text-xs font-bold clay-puffy shrink-0 flex items-center gap-1"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
