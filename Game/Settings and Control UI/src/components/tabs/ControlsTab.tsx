import React, { useState } from 'react';
import { Search, RotateCcw, Filter, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { SettingsState, ActionCategory, ErgonomicPreset } from '@/types/settings';
import { KeybindRow } from '@/components/controls/KeybindRow';
import { Button } from '@/components/ui/Button';

export interface ControlsTabProps {
  settings: SettingsState;
  onStartListening: (actionId: string, slot: 'primary' | 'secondary') => void;
  onResetSingle: (actionId: string) => void;
  onResetCategory: (category: string) => void;
  onApplyPreset: (preset: ErgonomicPreset) => void;
}

export const ControlsTab: React.FC<ControlsTabProps> = ({
  settings,
  onStartListening,
  onResetSingle,
  onResetCategory,
  onApplyPreset,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const categories: { id: ActionCategory; label: string }[] = [
    { id: 'movement', label: 'Movement & Locomotion' },
    { id: 'combat', label: 'Combat & Firearms' },
    { id: 'interaction', label: 'Interactions & World' },
    { id: 'ui', label: 'UI & System Navigation' },
  ];

  const allBindings = Object.values(settings.controls);

  // Count modified bindings
  const modifiedCount = allBindings.filter((b) => b.isModified).length;

  // Filter bindings based on search and category
  const filteredBindings = allBindings.filter((b) => {
    const matchesSearch =
      b.actionLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.primary.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.secondary && b.secondary.code.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategoryFilter === 'all' || b.category === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Top Controls Toolbar: Search & Presets */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0E1118] border border-[#1E2538]">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search action or keybind (e.g. Jump, Fire, KeyW)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-[#131722] border border-[#1E2538] focus:border-[#38BDF8] text-sm text-[#F8FAFC] placeholder-slate-500 outline-none transition-colors"
          />
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${
              selectedCategoryFilter === 'all'
                ? 'bg-[#38BDF8] text-slate-950 shadow-glow-cyan'
                : 'bg-[#1C2232] text-slate-400 hover:text-white'
            }`}
          >
            ALL ({allBindings.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategoryFilter(c.id)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all whitespace-nowrap ${
                selectedCategoryFilter === c.id
                  ? 'bg-[#38BDF8] text-slate-950 shadow-glow-cyan'
                  : 'bg-[#1C2232] text-slate-400 hover:text-white'
              }`}
            >
              {c.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Ergonomic Archetypes Quick Selector Banner */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#131722] to-[#1A2234] border border-[#1E2538] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono block">
              Ergonomic Accessibility Archetypes
            </span>
            <span className="text-[11px] text-slate-400">
              One-click control schemes tailored for physical preferences and fatigue reduction.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onApplyPreset('standard')}
            className="text-xs font-mono"
          >
            Standard KBM
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onApplyPreset('single-handed-left')}
            className="text-xs font-mono"
          >
            Left-Handed (WASD)
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onApplyPreset('single-handed-right')}
            className="text-xs font-mono"
          >
            Right-Handed (Arrows)
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onApplyPreset('reduced-fatigue')}
            className="text-xs font-mono"
          >
            Reduced Fatigue
          </Button>
        </div>
      </div>

      {/* Controls Remap Matrix Grouped by Category */}
      <div className="flex flex-col gap-6">
        {categories.map((cat) => {
          const groupBindings = filteredBindings.filter((b) => b.category === cat.id);
          if (groupBindings.length === 0) return null;

          const groupModifiedCount = groupBindings.filter((b) => b.isModified).length;

          return (
            <div key={cat.id} className="flex flex-col gap-2.5">
              {/* Category Sticky Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between py-2 px-3 rounded-lg bg-[#0C0E14]/95 backdrop-blur-sm border-b border-[#1E2538]">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                    {cat.label}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">
                    ({groupBindings.length} actions)
                  </span>
                  {groupModifiedCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 font-mono text-[10px] font-bold">
                      {groupModifiedCount} ALTERED
                    </span>
                  )}
                </div>

                {groupModifiedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onResetCategory(cat.id)}
                    className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-amber-400 transition-colors px-2 py-0.5 rounded hover:bg-[#1E2538]"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Category
                  </button>
                )}
              </div>

              {/* Action Rows */}
              <div className="flex flex-col gap-2">
                {groupBindings.map((binding) => {
                  const isListeningPrimary =
                    settings.rebindingState.isListening &&
                    settings.rebindingState.targetActionId === binding.actionId &&
                    settings.rebindingState.targetSlot === 'primary';

                  const isListeningSecondary =
                    settings.rebindingState.isListening &&
                    settings.rebindingState.targetActionId === binding.actionId &&
                    settings.rebindingState.targetSlot === 'secondary';

                  const isConflictedPrimary =
                    settings.rebindingState.fsmState === 'CONFLICT_DETECTED' &&
                    settings.rebindingState.conflictDetails?.incomingActionId === binding.actionId &&
                    settings.rebindingState.conflictDetails?.incomingSlot === 'primary';

                  const isConflictedSecondary =
                    settings.rebindingState.fsmState === 'CONFLICT_DETECTED' &&
                    settings.rebindingState.conflictDetails?.incomingActionId === binding.actionId &&
                    settings.rebindingState.conflictDetails?.incomingSlot === 'secondary';

                  const conflictText =
                    settings.rebindingState.conflictDetails?.conflictingActionLabel
                      ? `Conflict with [${settings.rebindingState.conflictDetails.conflictingActionLabel}]`
                      : undefined;

                  return (
                    <KeybindRow
                      key={binding.actionId}
                      binding={binding}
                      isListeningPrimary={isListeningPrimary}
                      isListeningSecondary={isListeningSecondary}
                      isConflictedPrimary={isConflictedPrimary}
                      isConflictedSecondary={isConflictedSecondary}
                      conflictTextPrimary={conflictText}
                      conflictTextSecondary={conflictText}
                      onBindPrimary={() => onStartListening(binding.actionId, 'primary')}
                      onBindSecondary={() => onStartListening(binding.actionId, 'secondary')}
                      onResetSingle={() => onResetSingle(binding.actionId)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
