import React from 'react';
import { WeaponType } from '../../types/game';
import { getSynergyName } from '../../engine/WeaponSystem';
import { Badge } from '../ui/Badge';

interface WeaponSynergyTrayProps {
  activeSynergies: WeaponType[];
  overchargeRatio: number; // 0 to 1
}

export function WeaponSynergyTray({ activeSynergies, overchargeRatio }: WeaponSynergyTrayProps) {
  const synergy = getSynergyName(activeSynergies);
  const synergySet = new Set(activeSynergies);

  const slots = [
    {
      slotNum: '01',
      name: 'Plasma Cannon',
      tag: 'plasma_repeater' as WeaponType,
      tier: 'T4',
      color: 'amber',
      accent: 'border-amber-500/40 text-amber-300',
      fill: 'bg-amber-400 shadow-[0_0_8px_#f59e0b]',
      percent: 95,
      active: synergySet.has('plasma_repeater'),
    },
    {
      slotNum: '02',
      name: 'Ion Scatter / EMP',
      tag: 'scatter_shot' as WeaponType,
      tier: 'T3',
      color: 'cyan',
      accent: 'border-primary/50 text-primary',
      fill: 'bg-primary shadow-[0_0_8px_#06b6d4]',
      percent: synergySet.has('scatter_shot') || synergySet.has('emp_beam') ? 85 : 20,
      active: synergySet.has('scatter_shot') || synergySet.has('emp_beam'),
    },
    {
      slotNum: '03',
      name: 'Vortex Seeker Pods',
      tag: 'homing_missile' as WeaponType,
      tier: 'T2',
      color: 'secondary',
      accent: 'border-secondary/50 text-secondary',
      fill: 'bg-secondary shadow-[0_0_8px_#10b981]',
      percent: synergySet.has('homing_missile') ? 100 : 15,
      active: synergySet.has('homing_missile'),
    },
  ];

  return (
    <div className="flex flex-col gap-2 bg-surface-container-lowest/90 backdrop-blur-xl p-3 sm:p-4 rounded-lg border border-outline-variant/40 shadow-2xl min-w-[280px]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-on-surface uppercase font-bold">
          <span className="material-symbols-outlined text-[15px] text-primary">token</span>
          <span>WEAPON SYNERGY ARRAY</span>
        </div>
        <span
          className="font-mono text-[10px] font-bold tracking-tight truncate max-w-[180px]"
          style={{ color: synergy.color }}
        >
          [{synergy.name}]
        </span>
      </div>

      {/* 3 Modular Hardpoint Bays */}
      <div className="grid grid-cols-3 gap-2">
        {slots.map((s) => (
          <div
            key={s.slotNum}
            className={`flex flex-col gap-1 p-2 rounded bg-surface-container/70 border ${
              s.active ? s.accent : 'border-outline-variant/30 opacity-60'
            } relative overflow-hidden transition-all`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold text-on-surface-variant">SLOT {s.slotNum}</span>
              <span className="px-1 py-0.2 bg-surface-container-highest text-[8px] font-mono rounded font-bold">
                {s.tier}
              </span>
            </div>
            <span className="font-mono text-[10px] text-on-surface leading-tight truncate font-semibold">
              {s.name}
            </span>
            <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-300 ${s.active ? s.fill : 'bg-outline-variant'}`}
                style={{ width: `${s.active ? s.percent : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
