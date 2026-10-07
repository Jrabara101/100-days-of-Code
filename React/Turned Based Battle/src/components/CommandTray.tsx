import React, { useEffect } from 'react';
import { FighterEntity, FighterStance, AbilityDefinition } from '../types/combat';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Tooltip } from './ui/Tooltip';
import { Swords, Shield, Zap, Hammer, Flame, Lock, CheckCircle2 } from 'lucide-react';

interface CommandTrayProps {
  player: FighterEntity;
  selectedActionId: string | null;
  selectedStance: FighterStance;
  isCommitted: boolean;
  isResolving: boolean;
  onSelectAction: (actionId: string) => void;
  onSetStance: (stance: FighterStance) => void;
  onCommitAction: () => void;
}

export const CommandTray: React.FC<CommandTrayProps> = ({
  player,
  selectedActionId,
  selectedStance,
  isCommitted,
  isResolving,
  onSelectAction,
  onSetStance,
  onCommitAction,
}) => {
  // Hotkey listener for [1], [2], [3], [4], [Space]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCommitted || isResolving) return;

      if (e.key === '1') {
        const ab = player.abilities[0];
        if (ab) onSelectAction(ab.id);
      } else if (e.key === '2') {
        const ab = player.abilities[1];
        if (ab) onSelectAction(ab.id);
      } else if (e.key === '3') {
        const ab = player.abilities[2];
        if (ab && ab.currentCooldown === 0 && ab.energyCost <= player.currentEnergy) {
          onSelectAction(ab.id);
        }
      } else if (e.key === '4') {
        const ab = player.abilities[3];
        if (ab && ab.currentCooldown === 0 && ab.energyCost <= player.currentEnergy) {
          onSelectAction(ab.id);
        }
      } else if (e.code === 'Space') {
        e.preventDefault();
        // If an action is selected, space commits; or if ultimate is ready, selects and commits!
        if (selectedActionId) {
          onCommitAction();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player, selectedActionId, isCommitted, isResolving, onSelectAction, onCommitAction]);

  const getAbilityIcon = (id: string) => {
    switch (id) {
      case 'slash':
        return <Swords className="w-5 h-5 text-ember-orange" />;
      case 'guard':
        return <Shield className="w-5 h-5 text-cooling-cyan" />;
      case 'lance':
        return <Zap className="w-5 h-5 text-solar-gold" />;
      case 'quake':
        return <Hammer className="w-5 h-5 text-amber-500" />;
      case 'supernova':
        return <Flame className="w-6 h-6 text-white" />;
      default:
        return <Swords className="w-5 h-5 text-ember-orange" />;
    }
  };

  const selectedAbility = player.abilities.find((a) => a.id === selectedActionId);

  return (
    <div className="w-full bg-magma-950/95 border-t border-ember-orange/40 backdrop-blur-xl p-3 sm:p-5 shadow-[0_-10px_35px_rgba(0,0,0,0.8)] relative z-30">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        {/* Top Tray Bar: Stance Switchers & Intent Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-magma-800 pb-2.5">
          {/* Stance Selector */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider hidden sm:inline">
              PILOT STANCE:
            </span>
            <div className="inline-flex rounded-md p-0.5 bg-magma-900 border border-magma-700">
              {(['BALANCED', 'AGGRESSIVE', 'DEFENSIVE'] as FighterStance[]).map((st) => (
                <button
                  key={st}
                  disabled={isCommitted || isResolving}
                  onClick={() => onSetStance(st)}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                    selectedStance === st
                      ? st === 'AGGRESSIVE'
                        ? 'bg-crimson-heat text-white shadow-[0_0_12px_rgba(220,38,38,0.7)]'
                        : st === 'DEFENSIVE'
                        ? 'bg-cooling-cyan text-magma-950 shadow-[0_0_12px_rgba(56,189,248,0.7)]'
                        : 'bg-solar-gold text-magma-950 shadow-[0_0_12px_rgba(251,191,36,0.7)]'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <Tooltip
              content={
                selectedStance === 'AGGRESSIVE'
                  ? 'AGGRESSIVE: +25% Damage Dealt, takes +20% damage, +15 Speed'
                  : selectedStance === 'DEFENSIVE'
                  ? 'DEFENSIVE: -30% Damage Taken, +50% Parry Counter chance, -10 Speed'
                  : 'BALANCED: Standard tactical combat posture'
              }
            >
              <span className="text-[10px] font-mono text-text-muted border border-magma-700 rounded-full px-1.5 py-0.2 cursor-help">
                ?
              </span>
            </Tooltip>
          </div>

          {/* Current Intent Label */}
          <div className="flex items-center gap-2">
            <div className="font-mono text-xs">
              <span className="text-text-muted uppercase">INTENT: </span>
              <span className="text-solar-gold font-bold">
                {selectedAbility ? selectedAbility.name.toUpperCase() : 'NO ACTION SELECTED'}
              </span>
            </div>

            {/* Lock / Commit Button */}
            <Button
              variant={isCommitted ? 'magma' : 'solar'}
              size="md"
              disabled={isCommitted || isResolving || !selectedActionId}
              onClick={onCommitAction}
              className="gap-2 min-w-[160px]"
            >
              {isCommitted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>ACTION COMMITTED</span>
                </>
              ) : isResolving ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-solar-gold animate-ping" />
                  <span>RESOLVING...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-magma-950" />
                  <span>LOCK IN [SPACE]</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Ability Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {player.abilities.map((ability: AbilityDefinition) => {
            const isSelected = selectedActionId === ability.id;
            const isOnCooldown = ability.currentCooldown > 0;
            const isLackingEnergy = ability.energyCost > player.currentEnergy;
            const isDisabled = isCommitted || isResolving || isOnCooldown || isLackingEnergy;
            const isUlt = ability.type === 'ULTIMATE';

            return (
              <button
                key={ability.id}
                type="button"
                disabled={isDisabled}
                onClick={() => onSelectAction(ability.id)}
                className={`relative text-left p-3 rounded-lg border transition-all duration-150 flex flex-col justify-between group cursor-pointer ${
                  isSelected
                    ? 'border-2 border-solar-gold bg-magma-850 shadow-[0_0_18px_rgba(251,191,36,0.35)] scale-[1.02]'
                    : isUlt
                    ? 'bg-gradient-to-b from-magma-900 to-crimson-heat/30 border-crimson-heat/60 hover:border-crimson-heat'
                    : 'bg-magma-900/90 border-magma-700/80 hover:border-ember-orange/60 hover:bg-magma-850'
                } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {/* Hotkey Badge */}
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-mono text-[9px] text-solar-gold bg-magma-950 border border-magma-700 px-1.5 py-0.2 rounded font-bold">
                    [{ability.hotkey || '?'}]
                  </span>
                  <span className="font-mono text-[9px] text-text-muted uppercase">
                    P{ability.priority}
                  </span>
                </div>

                {/* Icon & Title */}
                <div className="flex items-center gap-2 my-1">
                  <div className="w-8 h-8 rounded bg-magma-950 border border-magma-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {getAbilityIcon(ability.id)}
                  </div>
                  <div>
                    <h5 className="font-rajdhani font-bold text-xs sm:text-sm text-text-primary group-hover:text-solar-gold transition-colors leading-tight">
                      {ability.name}
                    </h5>
                    <span className="font-mono text-[9px] text-text-muted uppercase">
                      {ability.type}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="font-chakra text-[10px] text-text-muted line-clamp-2 my-1">
                  {ability.description}
                </p>

                {/* Stats Footer */}
                <div className="pt-1.5 border-t border-magma-800 flex items-center justify-between font-mono text-[10px]">
                  <span className="text-solar-gold font-bold">
                    {ability.baseDamage > 0 ? `${ability.baseDamage} DMG` : 'GUARD'}
                  </span>
                  <span
                    className={
                      ability.energyCost > 0
                        ? isLackingEnergy
                          ? 'text-red-400 font-bold'
                          : 'text-cooling-cyan font-bold'
                        : 'text-emerald-400'
                    }
                  >
                    {ability.energyCost > 0 ? `${ability.energyCost} AP` : 'FREE'}
                  </span>
                </div>

                {/* Cooldown Overlay */}
                {isOnCooldown && (
                  <div className="absolute inset-0 bg-magma-950/85 backdrop-blur-[1px] rounded-lg flex flex-col items-center justify-center z-10">
                    <span className="font-mono text-xl font-black text-solar-gold animate-pulse">
                      {ability.currentCooldown}
                    </span>
                    <span className="font-mono text-[9px] text-text-muted tracking-wider uppercase">
                      TURNS CD
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
