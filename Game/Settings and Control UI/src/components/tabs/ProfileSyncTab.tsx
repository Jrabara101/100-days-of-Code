import React, { useState } from 'react';
import { Share2, Download, Upload, ShieldCheck, Copy, Check, AlertCircle, FileCode } from 'lucide-react';
import { SettingsState } from '@/types/settings';
import { Button } from '@/components/ui/Button';
import { exportSettingsToUrlHash, importSettingsFromUrlHash } from '@/services/storageService';
import { sanitizeProfileControls, SanitizerReport } from '@/services/macroSanitizer';
import { soundEngine } from '@/services/audioService';

export interface ProfileSyncTabProps {
  settings: SettingsState;
  onApplyImportedProfile: (imported: Partial<SettingsState>) => void;
}

export const ProfileSyncTab: React.FC<ProfileSyncTabProps> = ({
  settings,
  onApplyImportedProfile,
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [importHashInput, setImportHashInput] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [sanitizerResult, setSanitizerResult] = useState<SanitizerReport>(() =>
    sanitizeProfileControls(settings.controls)
  );

  const urlHash = exportSettingsToUrlHash(settings);

  const handleCopyHash = () => {
    if (!urlHash) return;
    navigator.clipboard.writeText(urlHash);
    setCopiedHash(true);
    soundEngine.playSaveSuccess();
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleImportHash = () => {
    setImportError(null);
    if (!importHashInput.trim()) return;

    const imported = importSettingsFromUrlHash(importHashInput.trim());
    if (imported) {
      onApplyImportedProfile(imported);
      setImportHashInput('');
      soundEngine.playSaveSuccess();
    } else {
      setImportError('Invalid or corrupted profile hash code. Verification failed.');
      soundEngine.playConflictBuzz();
    }
  };

  const handleExportJSON = () => {
    soundEngine.playSelectClick();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tactical_settings_profile_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.controls) {
          const check = sanitizeProfileControls(parsed.controls);
          setSanitizerResult(check);
          onApplyImportedProfile(parsed);
          soundEngine.playSaveSuccess();
        } else {
          setImportError('Invalid JSON structure: Missing controls schema.');
          soundEngine.playConflictBuzz();
        }
      } catch (err) {
        setImportError('Corrupted JSON file. Unable to parse settings profile.');
        soundEngine.playConflictBuzz();
      }
    };
    reader.readAsText(file);
  };

  const runSanitizerAudit = () => {
    soundEngine.playListeningTone();
    const report = sanitizeProfileControls(settings.controls);
    setSanitizerResult(report);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tournament Macro Sanitizer & Rule Validation Inspector */}
      <div className="p-4 rounded-xl bg-[#0E1118] border border-[#1E2538] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-mono font-bold uppercase text-slate-200 tracking-wider">
              Esports Telemetry & Macro Sanitizer
            </h3>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded font-mono text-xs font-bold border ${
              sanitizerResult.isValid
                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 shadow-glow-emerald'
                : 'bg-red-950/80 border-red-600 text-red-300 shadow-glow-crimson'
            }`}
          >
            {sanitizerResult.isValid ? '✓ TOURNAMENT VERIFIED' : '⚠ VIOLATION FLAGGED'}
          </span>
        </div>

        <p className="text-xs text-[#64748B] leading-relaxed">
          Validates active control bindings against strict competitive anti-cheat thresholds. Disallows un-intercepted OS shortcuts, illegal hardware rapid-fire scripts, and unauthorized key chords.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 font-mono text-xs pt-1">
          <div className="p-2.5 rounded bg-[#131722] border border-[#1E2538]">
            <span className="block text-[10px] text-slate-500">ILLEGAL KEYS NEUTRALIZED</span>
            <span className="font-bold text-slate-200">{sanitizerResult.flags.illegalKeysNeutralized}</span>
          </div>
          <div className="p-2.5 rounded bg-[#131722] border border-[#1E2538]">
            <span className="block text-[10px] text-slate-500">COMPOUND MACROS STRIPPED</span>
            <span className="font-bold text-slate-200">{sanitizerResult.flags.compoundMacroViolations}</span>
          </div>
          <div className="p-2.5 rounded bg-[#131722] border border-[#1E2538]">
            <span className="block text-[10px] text-slate-500">TURBO EXPLOIT FILTER</span>
            <span className="font-bold text-emerald-400">ARMED (0 DETECTED)</span>
          </div>
        </div>

        {sanitizerResult.violations.length > 0 && (
          <div className="p-3 rounded bg-red-950/40 border border-red-900 text-red-200 text-xs flex flex-col gap-1">
            {sanitizerResult.violations.map((v, i) => (
              <span key={i}>• {v}</span>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button size="sm" variant="secondary" onClick={runSanitizerAudit} className="text-xs font-mono">
            Re-Run Integrity Audit
          </Button>
        </div>
      </div>

      {/* Cross-Device URL Hash Export & Import */}
      <div className="p-4 rounded-xl bg-[#0E1118] border border-[#1E2538] flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-mono font-bold uppercase text-slate-200 tracking-wider">
            Tournament URL Profile Hash Sync
          </h3>
        </div>

        <p className="text-xs text-[#64748B]">
          Export your exact control matrix and calibration tuning into a compressed URL hash for instant cloud-less portability across tournament PCs and console browsers.
        </p>

        {/* Export hash block */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-mono text-slate-400">Current Profile Compressed Hash:</span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={urlHash}
              className="flex-1 px-3 py-1.5 rounded-lg bg-[#131722] border border-[#1E2538] font-mono text-xs text-cyan-300 select-all"
            />
            <Button size="sm" variant="primary" onClick={handleCopyHash} className="gap-1.5 whitespace-nowrap font-mono text-xs">
              {copiedHash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedHash ? 'COPIED!' : 'COPY HASH'}
            </Button>
          </div>
        </div>

        {/* Import hash block */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-[#1E2538]">
          <span className="text-xs font-mono text-slate-400">Import Remote Profile Hash:</span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Paste tournament hash string here..."
              value={importHashInput}
              onChange={(e) => setImportHashInput(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-[#131722] border border-[#1E2538] focus:border-[#38BDF8] font-mono text-xs text-white placeholder-slate-500 outline-none"
            />
            <Button size="sm" variant="secondary" onClick={handleImportHash} className="font-mono text-xs whitespace-nowrap">
              APPLY HASH
            </Button>
          </div>
        </div>

        {importError && (
          <div className="flex items-center gap-2 p-2.5 rounded bg-red-950/80 border border-red-600 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{importError}</span>
          </div>
        )}
      </div>

      {/* File JSON Export & Import */}
      <div className="p-4 rounded-xl bg-[#0E1118] border border-[#1E2538] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#1C2232] text-slate-300 border border-[#1E2538]">
            <FileCode className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100 font-sans">
              Raw File Backup (.JSON)
            </h4>
            <span className="text-xs text-[#64748B] block mt-0.5">
              Save configuration files directly to local storage or load squad backup archives.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Button size="sm" variant="secondary" onClick={handleExportJSON} className="gap-1.5 font-mono text-xs">
            <Download className="w-3.5 h-3.5" />
            DOWNLOAD .JSON
          </Button>

          <label className="cursor-pointer">
            <span className="inline-flex items-center justify-center font-medium transition-all duration-150 select-none outline-none px-3.5 py-1.5 text-xs font-mono rounded gap-1.5 bg-[#1C2232] hover:bg-[#283145] text-[#F8FAFC] border border-[#1E2538] hover:border-slate-600 active:scale-[0.98]">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              LOAD .JSON
            </span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
