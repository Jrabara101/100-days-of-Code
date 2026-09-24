import React, { useState } from 'react';
import {
  Volume2,
  Sparkles,
  GitFork,
  BookOpen,
  Wand2,
  Plus,
  Trash2,
  SlidersHorizontal,
  Sliders,
} from 'lucide-react';
import { StoryPanel, SceneMood, ThemeConfig, BranchChoice } from '../types';
import { sound } from '../utils/soundEngine';
import { generateProseFromEmojis, ProseTone } from '../utils/narratorEngine';

interface InspectorDrawerProps {
  panel: StoryPanel | null;
  allPanels: StoryPanel[];
  theme: ThemeConfig;
  onUpdatePanel: (updates: Partial<StoryPanel>) => void;
  onAddBranchChoice: (label: string, labelEmoji: string, targetPanelId: string) => void;
  onRemoveBranchChoice: (choiceId: string) => void;
}

export const InspectorDrawer: React.FC<InspectorDrawerProps> = ({
  panel,
  allPanels,
  theme,
  onUpdatePanel,
  onAddBranchChoice,
  onRemoveBranchChoice,
}) => {
  const isDark = theme.isDark;
  const [proseTone, setProseTone] = useState<ProseTone>('kawaii');
  const [generatedProse, setGeneratedProse] = useState<string>('');
  const [newChoiceLabel, setNewChoiceLabel] = useState('');
  const [newChoiceEmoji, setNewChoiceEmoji] = useState('✨');
  const [newChoiceTarget, setNewChoiceTarget] = useState(allPanels[0]?.id || '');

  if (!panel) return null;

  // Active lead sticker
  const leadSticker = panel.stickers[0] || { char: '🐻', name: 'Chef Teddy' };

  // Sound FX buttons
  const soundEffects = [
    { name: 'Chime Bell', icon: '🔔', action: () => sound.playChime() },
    { name: 'Squeaky!', icon: '🧸', action: () => sound.playSqueak() },
    { name: 'Oven Ding', icon: '⏲️', action: () => sound.playDing() },
    { name: 'Cream Squish', icon: '🧁', action: () => sound.playSquish() },
    { name: 'Comic POW', icon: '💥', action: () => sound.playPow() },
    { name: 'Slide Whoosh', icon: '💨', action: () => sound.playWhoosh() },
  ];

  const moods: { id: SceneMood; label: string; icon: string }[] = [
    { id: 'playful', label: 'Playful', icon: '🍓' },
    { id: 'dramatic', label: 'Dramatic', icon: '⚡' },
    { id: 'romantic', label: 'Romantic', icon: '💖' },
    { id: 'spooky', label: 'Spooky', icon: '👻' },
    { id: 'cyberpunk', label: 'Cyber', icon: '🤖' },
  ];

  // Generate Prose from current panel emojis
  const handleGenerateProse = () => {
    sound.playChime();
    const chars = panel.stickers.map((s) => s.char);
    const result = generateProseFromEmojis(chars, proseTone, panel.mood);
    setGeneratedProse(result);
  };

  const handleApplyProseToCaption = () => {
    if (generatedProse) {
      onUpdatePanel({ caption: generatedProse });
      sound.playPop();
    }
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChoiceLabel.trim() || !newChoiceTarget) return;
    onAddBranchChoice(newChoiceLabel.trim(), newChoiceEmoji, newChoiceTarget);
    setNewChoiceLabel('');
  };

  return (
    <aside
      className={`w-[260px] lg:w-[280px] shrink-0 rounded-3xl border flex flex-col justify-between p-3.5 my-1 overflow-y-auto scrollbar-none transition-all ${
        isDark
          ? 'bg-[#10131a]/95 border-[#374151] text-stone-200 shadow-brutal-hard'
          : 'bg-white/85 backdrop-blur-md border-white shadow-marshmallow text-stone-800'
      }`}
    >
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-1.5 border-b ${
            isDark ? 'border-stone-800' : 'border-rose-100'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xl">🔔</span>
            <span className="font-fredoka text-sm font-bold">Emote &amp; Mixer</span>
          </div>
          <span className="text-[10px] font-fredoka px-2 py-0.5 rounded-full font-bold bg-amber-400/20 text-amber-500">
            INSPECTOR
          </span>
        </div>

        {/* Lead Character Card */}
        <div
          className={`p-2.5 rounded-2xl border flex items-center gap-2.5 shadow-sm ${
            isDark
              ? 'bg-[#191b23] border-[#374151]'
              : 'bg-gradient-to-tr from-rose-50 via-pink-50 to-amber-50 border-rose-200/80 shadow-clay-sm'
          }`}
        >
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
              isDark ? 'bg-stone-800 border border-stone-700' : 'bg-white shadow-clay-sm'
            }`}
          >
            {leadSticker.char}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-fredoka text-xs font-bold truncate">
              {leadSticker.name || 'Stage Lead'}
            </span>
            <span className="font-fredoka text-[10px] text-berry-red font-semibold">
              Mood: {panel.mood.toUpperCase()} • 🍓 100
            </span>
            <div className="w-24 bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="h-full rounded-full"
                style={{ width: '85%', backgroundColor: theme.primaryColor }}
              />
            </div>
          </div>
        </div>

        {/* Sound FX Triggers */}
        <div className="flex flex-col gap-1.5">
          <span className="font-fredoka text-[10px] uppercase tracking-wider text-stone-400 font-bold">
            Web Audio FX Triggers
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {soundEffects.map((sfx) => (
              <button
                key={sfx.name}
                onClick={sfx.action}
                className={`h-8 px-2 rounded-xl border flex items-center justify-center gap-1 shadow-sm clay-puffy transition-transform ${
                  isDark
                    ? 'bg-[#191b23] hover:bg-stone-800 border-[#374151] text-stone-200'
                    : 'bg-rose-50/70 hover:bg-rose-100 border-rose-100 text-stone-700'
                }`}
                title={sfx.name}
              >
                <span className="text-sm">{sfx.icon}</span>
                <span className="font-fredoka text-[10px] font-bold truncate">{sfx.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scene Mood Selector */}
        <div className="flex flex-col gap-1.5">
          <span className="font-fredoka text-[10px] uppercase tracking-wider text-stone-400 font-bold">
            Scene Mood
          </span>
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            {moods.map((m) => {
              const active = panel.mood === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    onUpdatePanel({ mood: m.id });
                    sound.playPop();
                  }}
                  className={`px-2 py-1 rounded-xl font-fredoka text-[10px] font-bold shrink-0 clay-puffy flex items-center gap-1 border transition-all ${
                    active
                      ? isDark
                        ? 'bg-amber-500 text-stone-950 font-bold border-amber-400'
                        : 'bg-berry-red text-white font-bold border-berry-red shadow-clay-sm'
                      : isDark
                      ? 'bg-[#191b23] text-stone-300 border-[#374151]'
                      : 'bg-rose-50/60 text-stone-700 border-rose-100 hover:bg-rose-100'
                  }`}
                >
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* "Emoji-to-Prose" Story Narrator Generator */}
        <div
          className={`p-2.5 rounded-2xl border flex flex-col gap-2 shadow-sm ${
            isDark
              ? 'bg-[#191b23] border-[#374151]'
              : 'bg-rose-50/60 border-rose-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-fredoka text-[11px] font-bold flex items-center gap-1">
              <Wand2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Emoji-to-Prose Narrator</span>
            </span>
            <span className="font-fredoka text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400 text-stone-950 font-bold">
              AI ENGINE
            </span>
          </div>

          {/* Tone Selector */}
          <div className="grid grid-cols-3 gap-1">
            {(['kawaii', 'comedic', 'dramatic', 'noir', 'cyberpunk'] as ProseTone[]).map((t) => (
              <button
                key={t}
                onClick={() => setProseTone(t)}
                className={`py-0.5 px-1 rounded-lg text-[9px] font-fredoka capitalize border transition-all ${
                  proseTone === t
                    ? 'bg-berry-red text-white font-bold border-berry-red'
                    : isDark
                    ? 'bg-stone-800 text-stone-300 border-stone-700'
                    : 'bg-white text-stone-600 border-stone-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerateProse}
            className={`w-full py-1.5 px-2 rounded-xl font-fredoka text-xs font-bold flex items-center justify-center gap-1.5 clay-puffy shadow-sm ${
              isDark
                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                : 'bg-gradient-to-r from-berry-red to-cream-pink text-white shadow-clay-btn'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Generate Prose Caption</span>
          </button>

          {generatedProse && (
            <div className="flex flex-col gap-1.5 pt-1">
              <p className="text-[11px] font-quicksand italic leading-snug p-2 rounded-xl bg-white dark:bg-stone-800 border border-rose-100 dark:border-stone-700">
                "{generatedProse}"
              </p>
              <button
                onClick={handleApplyProseToCaption}
                className="w-full py-1 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-fredoka text-[10px] font-bold flex items-center justify-center gap-1"
              >
                <span>Use as Panel Subtitle</span>
              </button>
            </div>
          )}
        </div>

        {/* Branching Plot Path Manager */}
        <div
          className={`p-2.5 rounded-2xl border flex flex-col gap-2 ${
            isDark
              ? 'bg-[#191b23] border-[#374151]'
              : 'bg-amber-50/70 border-amber-200/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-fredoka text-[11px] font-bold flex items-center gap-1 text-amber-900 dark:text-amber-300">
              <GitFork className="w-3.5 h-3.5 text-amber-500" />
              <span>Branching Paths</span>
            </span>
            <span className="font-fredoka text-[9px] text-amber-800 font-bold bg-white dark:bg-stone-800 px-1.5 py-0.5 rounded-full border">
              {(panel.choices || []).length} Branches
            </span>
          </div>

          {/* Current Choices List */}
          <div className="flex flex-col gap-1">
            {(panel.choices || []).map((ch) => (
              <div
                key={ch.id}
                className="flex items-center justify-between p-1 px-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 text-xs font-fredoka"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-base">{ch.labelEmoji}</span>
                  <span className="truncate">{ch.label}</span>
                </div>
                <button
                  onClick={() => onRemoveBranchChoice(ch.id)}
                  className="text-rose-500 hover:text-rose-700 p-0.5"
                  title="Remove Branch"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Choice Form */}
          <form onSubmit={handleCreateBranch} className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newChoiceEmoji}
                onChange={(e) => setNewChoiceEmoji(e.target.value)}
                className="w-9 text-center p-1 rounded-xl bg-white dark:bg-stone-800 border font-fredoka text-sm"
                title="Choice Emoji"
              />
              <input
                type="text"
                placeholder="Choice label (e.g. Open Door)"
                value={newChoiceLabel}
                onChange={(e) => setNewChoiceLabel(e.target.value)}
                className="flex-1 p-1 px-2 rounded-xl bg-white dark:bg-stone-800 border font-quicksand text-xs outline-none"
              />
            </div>
            <div className="flex items-center gap-1">
              <select
                value={newChoiceTarget}
                onChange={(e) => setNewChoiceTarget(e.target.value)}
                className="flex-1 p-1 px-2 rounded-xl bg-white dark:bg-stone-800 border font-fredoka text-xs"
              >
                {allPanels.map((p, idx) => (
                  <option key={p.id} value={p.id}>
                    Target: #{idx + 1} {p.title || 'Panel'}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-fredoka text-xs font-bold clay-puffy flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </aside>
  );
};
