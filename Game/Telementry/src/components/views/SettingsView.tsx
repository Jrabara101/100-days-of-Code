import React, { useState } from 'react';
import { PlayerProfile, PlayerAnnotation } from '../../types/telemetry';
import { 
  Shield, 
  Download, 
  Globe, 
  Calendar, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  FileText,
  FileSpreadsheet,
  Lock,
  Tag
} from 'lucide-react';

interface SettingsViewProps {
  player: PlayerProfile;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerProfile>>;
  annotations: PlayerAnnotation[];
  onAddAnnotation: (date: string, note: string, category: PlayerAnnotation['category']) => void;
  onDeleteAnnotation: (id: string) => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  player,
  setPlayer,
  annotations,
  onAddAnnotation,
  onDeleteAnnotation,
  onExportJSON,
  onExportCSV
}) => {
  const [newDate, setNewDate] = useState('2026-09-25');
  const [newNote, setNewNote] = useState('');
  const [newCategory, setNewCategory] = useState<PlayerAnnotation['category']>('gear');
  const [saveToast, setSaveToast] = useState(false);

  const handlePrivacyChange = (visibility: PlayerProfile['privacy']['profileVisibility']) => {
    setPlayer(prev => ({
      ...prev,
      privacy: { ...prev.privacy, profileVisibility: visibility }
    }));
    triggerToast();
  };

  const handleToggleSection = (key: keyof PlayerProfile['privacy']) => {
    setPlayer(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: !prev.privacy[key]
      }
    }));
    triggerToast();
  };

  const triggerToast = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleAddAnnotationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddAnnotation(newDate, newNote.trim(), newCategory);
    setNewNote('');
    triggerToast();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 p-3 rounded bg-emerald-500 text-[#090d16] font-['Space_Grotesk'] text-xs font-bold shadow-[0_0_20px_#10B981] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Telemetry Preferences Updated</span>
        </div>
      )}

      {/* Section 1: Privacy Controls (Decision: Privacy by default) */}
      <section className="rounded-lg bg-[#0d1322] border border-[#1f293d] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-cyan-400" />
          <h2 className="font-['Space_Grotesk'] text-sm font-bold text-slate-100 uppercase tracking-wider">
            Privacy & Identity Controls
          </h2>
        </div>
        <p className="font-['Inter'] text-xs text-slate-400 mb-4">
          Control who can view your telemetry data. Public leaderboards are completely opt-in.
        </p>

        <div className="space-y-4">
          {/* Profile Visibility */}
          <div>
            <label className="block text-xs font-['JetBrains_Mono'] text-slate-300 mb-2">
              PROFILE VISIBILITY LEVEL:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(['private', 'friends', 'public'] as const).map((vis) => {
                const isSelected = player.privacy.profileVisibility === vis;
                return (
                  <button
                    key={vis}
                    onClick={() => handlePrivacyChange(vis)}
                    className={`p-3 rounded border text-left transition font-['JetBrains_Mono'] text-xs ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                        : 'bg-[#090d16] border-[#1f293d] text-slate-400 hover:text-slate-200 hover:bg-[#111827]'
                    }`}
                  >
                    <div className="font-bold uppercase">{vis}</div>
                    <div className="text-[10px] text-slate-500 font-['Inter'] mt-0.5">
                      {vis === 'private' && 'Only visible to your local client'}
                      {vis === 'friends' && 'Visible to mutually approved duo friends'}
                      {vis === 'public' && 'Sharable link accessible anywhere'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Granular Section Toggles */}
          <div className="pt-3 border-t border-[#1f293d] space-y-2">
            <span className="text-xs font-['JetBrains_Mono'] text-slate-300 block mb-1">
              SECTION VISIBILITY OVERRIDES:
            </span>

            <div className="flex flex-col sm:flex-row gap-4 text-xs font-['Inter'] text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={player.privacy.showPlaytime}
                  onChange={() => handleToggleSection('showPlaytime')}
                  className="rounded bg-[#090d16] border-[#1f293d] text-cyan-400 focus:ring-0"
                />
                <span>Broadcast Weekly Playtime Hours</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={player.privacy.showKd}
                  onChange={() => handleToggleSection('showKd')}
                  className="rounded bg-[#090d16] border-[#1f293d] text-cyan-400 focus:ring-0"
                />
                <span>Broadcast K/D & Accuracy</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={player.privacy.showGoals}
                  onChange={() => handleToggleSection('showGoals')}
                  className="rounded bg-[#090d16] border-[#1f293d] text-cyan-400 focus:ring-0"
                />
                <span>Broadcast Personal Goals</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Data Sovereignty & Export (Decision: Players trust systems that let them leave) */}
      <section className="rounded-lg bg-[#0d1322] border border-[#1f293d] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-2 mb-2">
          <Download className="w-4 h-4 text-cyan-400" />
          <h2 className="font-['Space_Grotesk'] text-sm font-bold text-slate-100 uppercase tracking-wider">
            Data Sovereignty & Portability
          </h2>
        </div>
        <p className="font-['Inter'] text-xs text-slate-400 mb-4 leading-relaxed">
          You own 100% of your telemetry. Download the complete raw event logs, match durations, accuracy records, and milestones anytime.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={onExportJSON}
            className="flex items-center gap-2 px-4 py-2 rounded bg-[#111827] hover:bg-[#1a2233] border border-cyan-500/30 text-cyan-300 text-xs font-['JetBrains_Mono'] transition"
          >
            <FileText className="w-4 h-4" />
            <span>Export Full Telemetry Archive (JSON)</span>
          </button>

          <button
            onClick={onExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded bg-[#111827] hover:bg-[#1a2233] border border-emerald-500/30 text-emerald-400 text-xs font-['JetBrains_Mono'] transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Sessions Spreadsheet (CSV)</span>
          </button>
        </div>
      </section>

      {/* Section 3: Player Chart Annotations */}
      <section className="rounded-lg bg-[#0d1322] border border-[#1f293d] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-4 h-4 text-cyan-400" />
          <h2 className="font-['Space_Grotesk'] text-sm font-bold text-slate-100 uppercase tracking-wider">
            Gear & Setup Annotations
          </h2>
        </div>
        <p className="font-['Inter'] text-xs text-slate-400 mb-4">
          Add notes to specific dates (e.g. "switched to glass mousepad", "lowered DPI") to explain curve changes.
        </p>

        {/* Existing Annotations list */}
        <div className="space-y-2 mb-4">
          {annotations.map((ann) => (
            <div
              key={ann.id}
              className="flex items-center justify-between p-3 rounded bg-[#090d16] border border-[#1f293d] text-xs font-['JetBrains_Mono']"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-cyan-400 font-bold">{ann.date}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 uppercase">
                  {ann.category}
                </span>
                <span className="font-['Inter'] text-slate-200">{ann.note}</span>
              </div>
              <button
                onClick={() => onDeleteAnnotation(ann.id)}
                className="text-slate-500 hover:text-rose-400 p-1"
                aria-label="Delete annotation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Annotation Form */}
        <form onSubmit={handleAddAnnotationSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="p-2 rounded bg-[#090d16] border border-[#1f293d] text-slate-200 font-['JetBrains_Mono'] focus:outline-none focus:border-cyan-400"
          />

          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as PlayerAnnotation['category'])}
            className="p-2 rounded bg-[#090d16] border border-[#1f293d] text-slate-200 font-['JetBrains_Mono'] focus:outline-none focus:border-cyan-400"
          >
            <option value="gear">Gear (Mouse/Monitor)</option>
            <option value="settings">Settings (DPI/Crosshair)</option>
            <option value="team">Team / Role</option>
            <option value="physical">Physical / Ergonomics</option>
          </select>

          <input
            type="text"
            placeholder="Note text (e.g. Switched to 800 DPI)"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="sm:col-span-2 p-2 rounded bg-[#090d16] border border-[#1f293d] text-slate-200 font-['Inter'] focus:outline-none focus:border-cyan-400"
          />

          <button
            type="submit"
            className="sm:col-span-4 py-2 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 font-['Space_Grotesk'] font-bold text-xs transition"
          >
            + Add Historical Annotation Marker
          </button>
        </form>
      </section>
    </div>
  );
};
