import React, { useState, useEffect } from 'react';
import { useSequencerStore } from '../store/useSequencerStore';
import { exportPatternToWav } from '../audio/wavExporter';
import { Dialog } from './ui/dialog';
import { Button } from './ui/button';
import { Copy, Check, DownloadCloud, FileAudio, RefreshCw } from 'lucide-react';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ open, onOpenChange }) => {
  const getUrlShareHash = useSequencerStore((s) => s.getUrlShareHash);
  const getSerializedPattern = useSequencerStore((s) => s.getSerializedPattern);
  const loadPattern = useSequencerStore((s) => s.loadPattern);
  const state = useSequencerStore();

  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [isRenderingWav, setIsRenderingWav] = useState(false);
  const [jsonStatus, setJsonStatus] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const pattern = getSerializedPattern();
      setJsonText(JSON.stringify(pattern, null, 2));

      const hash = getUrlShareHash();
      const fullUrl = `${window.location.origin}${window.location.pathname}${hash}`;
      setShareUrl(fullUrl);
      setCopied(false);
      setJsonStatus(null);
    }
  }, [open, getSerializedPattern, getUrlShareHash]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed', err);
    }
  };

  const handleLoadJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed && Array.isArray(parsed.tracks)) {
        loadPattern(parsed);
        setJsonStatus('Pattern successfully loaded!');
        setTimeout(() => setJsonStatus(null), 2500);
      } else {
        setJsonStatus('Error: Invalid JSON format');
      }
    } catch {
      setJsonStatus('Error: Could not parse JSON');
    }
  };

  const handleRenderWav = async () => {
    try {
      setIsRenderingWav(true);
      const wavBlob = await exportPatternToWav(state, 2);
      const url = URL.createObjectURL(wavBlob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `POCKET_BEAT_${state.activeKit}_${state.bpm}BPM.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Offline WAV render failed', err);
    } finally {
      setIsRenderingWav(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Share Pattern & Export Audio"
      description="Export current beat matrix or render high-fidelity 16-bit PCM WAV"
    >
      <div className="space-y-4 text-xs font-mono mt-3">
        {/* Instant Share URL */}
        <div className="space-y-1.5">
          <label className="text-[#A8A29E] uppercase font-bold text-[10px] tracking-wider">
            Instant Share URL (Base64 Encoded Pattern)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-[#100E0D] border border-[#383330] rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none"
            />
            <Button
              onClick={handleCopyUrl}
              variant="primary"
              size="sm"
              className="px-3 py-2 rounded-xl flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
          </div>
        </div>

        {/* Pattern JSON */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[#A8A29E] uppercase font-bold text-[10px] tracking-wider">
              Pattern JSON Specification
            </label>
            {jsonStatus && (
              <span className={`text-[10px] ${jsonStatus.startsWith('Error') ? 'text-rose-400' : 'text-emerald-400'}`}>
                {jsonStatus}
              </span>
            )}
          </div>
          <textarea
            rows={5}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="w-full bg-[#100E0D] border border-[#383330] rounded-xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500 resize-none"
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button
              onClick={handleLoadJson}
              variant="secondary"
              size="sm"
              className="rounded-xl"
            >
              Load JSON Pattern
            </Button>
          </div>
        </div>

        {/* Offline Audio WAV Renderer */}
        <div className="pt-3 border-t border-[#292421] flex items-center justify-between">
          <div>
            <div className="text-white font-bold text-xs flex items-center gap-1.5">
              <DownloadCloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Offline Audio WAV Renderer</span>
            </div>
            <div className="text-[10px] text-[#78716C]">
              Renders 2 complete loops (32 steps) to uncompressed 16-bit WAV
            </div>
          </div>

          <Button
            onClick={handleRenderWav}
            disabled={isRenderingWav}
            variant="emerald"
            size="sm"
            className="rounded-xl flex items-center gap-2"
          >
            {isRenderingWav ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Rendering...</span>
              </>
            ) : (
              <>
                <FileAudio className="w-3.5 h-3.5" />
                <span>Render WAV</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
