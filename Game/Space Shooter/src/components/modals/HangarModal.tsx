import React, { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SHIP_SPECS } from '../../engine/ShipConfigs';
import { ShipSpec } from '../../types/game';
import { Crosshair, Shield, Zap, Wind, Check } from 'lucide-react';

interface HangarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedShipId: 'interceptor' | 'dreadnought' | 'scout';
  onSelectShip: (shipId: 'interceptor' | 'dreadnought' | 'scout') => void;
}

export function HangarModal({
  open,
  onOpenChange,
  selectedShipId,
  onSelectShip,
}: HangarModalProps) {
  const [activeTab, setActiveTab] = useState<'interceptor' | 'dreadnought' | 'scout'>(selectedShipId);
  const currentSpec = SHIP_SPECS[activeTab];

  const handleDeploy = () => {
    onSelectShip(activeTab);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>
          <Crosshair className="w-5 h-5 text-primary" />
          ORBITAL HANGAR // SHIP COMMISSIONING
        </DialogTitle>
        <DialogDescription>
          Select and inspect your starfighter chassis before entering the contested sector.
        </DialogDescription>
      </DialogHeader>

      {/* Ship Selection Tabs */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {(Object.keys(SHIP_SPECS) as ('interceptor' | 'dreadnought' | 'scout')[]).map((id) => {
          const spec = SHIP_SPECS[id];
          const isSelected = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'bg-primary/10 border-primary shadow-[0_0_12px_rgba(76,215,246,0.3)]'
                  : 'bg-surface-container-high/60 border-outline-variant/40 hover:border-primary/40'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[10px] font-mono font-bold text-on-surface-variant uppercase">
                  {spec.classTitle}
                </span>
                {selectedShipId === id && (
                  <Badge variant="secondary" className="text-[9px] px-1 py-0">
                    CURRENT
                  </Badge>
                )}
              </div>
              <span className="font-mono text-xs font-bold text-on-surface truncate w-full">
                {spec.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Ship Inspection Card */}
      <div className="bg-surface-container/70 border border-outline-variant/40 rounded-lg p-4 flex flex-col md:flex-row gap-5">
        {/* Ship Blueprint Visual SVG */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-surface-container-lowest/80 rounded border border-outline-variant/30 min-h-[180px]">
          <svg className="w-28 h-28 drop-shadow-[0_0_16px_rgba(76,215,246,0.5)]" viewBox="0 0 160 160" fill="none">
            {activeTab === 'interceptor' && (
              <>
                <polygon
                  points="80,15 98,62 136,88 152,126 122,120 102,138 80,122 58,138 38,120 8,126 24,88 62,62"
                  fill="#161c28"
                  stroke="#4cd7f6"
                  strokeWidth="2"
                />
                <polygon points="80,36 88,72 80,82 72,72" fill="#4cd7f6" />
                <rect x="6" y="98" width="4" height="24" rx="2" fill="#4edea3" />
                <rect x="150" y="98" width="4" height="24" rx="2" fill="#4edea3" />
              </>
            )}
            {activeTab === 'dreadnought' && (
              <>
                <polygon
                  points="80,20 120,40 145,95 130,135 80,125 30,135 15,95 40,40"
                  fill="#161c28"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                />
                <circle cx="80" cy="75" r="18" fill="#242a36" stroke="#f59e0b" strokeWidth="1.5" />
                <circle cx="80" cy="75" r="8" fill="#f59e0b" />
                <rect x="35" y="100" width="8" height="28" fill="#4edea3" rx="2" />
                <rect x="117" y="100" width="8" height="28" fill="#4edea3" rx="2" />
              </>
            )}
            {activeTab === 'scout' && (
              <>
                <polygon
                  points="80,10 110,75 140,110 100,125 80,105 60,125 20,110 50,75"
                  fill="#161c28"
                  stroke="#ddb7ff"
                  strokeWidth="1.8"
                />
                <circle cx="80" cy="65" r="10" fill="#ddb7ff" />
                <line x1="80" y1="20" x2="80" y2="105" stroke="#ddb7ff" strokeWidth="2" />
              </>
            )}
          </svg>
          <span className="font-mono text-[11px] text-primary mt-2 font-bold tracking-wider">
            {currentSpec.name}
          </span>
          <span className="font-mono text-[10px] text-on-surface-variant">
            CORE: {currentSpec.coreRadius}px // GRAZE: {currentSpec.grazeRadius}px
          </span>
        </div>

        {/* Ship Stats Breakdown */}
        <div className="flex-1 flex flex-col justify-between gap-3">
          <div>
            <span className="font-mono text-[11px] text-on-surface-variant uppercase font-bold block mb-1">
              SPECIFICATION // TACTICAL ROLE
            </span>
            <p className="font-mono text-xs text-on-surface leading-relaxed">
              {currentSpec.description}
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/30">
            {/* Stat Bars */}
            {[
              { label: 'FIREPOWER', value: currentSpec.stats.firepower, icon: Crosshair, color: 'bg-primary' },
              { label: 'DEFENSE', value: currentSpec.stats.defense, icon: Shield, color: 'bg-secondary' },
              { label: 'AGILITY', value: currentSpec.stats.agility, icon: Wind, color: 'bg-amber-400' },
              { label: 'GRAZE AFFINITY', value: currentSpec.stats.grazeAffinity, icon: Zap, color: 'bg-tertiary-fixed' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-0.5">
                <div className="flex justify-between font-mono text-[10px] text-on-surface-variant">
                  <span className="flex items-center gap-1 font-semibold">
                    <stat.icon className="w-3 h-3 text-primary" />
                    {stat.label}
                  </span>
                  <span className="font-bold text-on-surface">{stat.value}%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div className={`h-full ${stat.color}`} style={{ width: `${stat.value}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="p-2 rounded bg-surface-container-lowest/80 border border-primary/30">
            <span className="text-[10px] font-mono text-primary font-bold block">
              SPECIAL TRAIT:
            </span>
            <span className="text-[11px] font-mono text-on-surface leading-snug">
              {currentSpec.specialAbility}
            </span>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          CANCEL
        </Button>
        <Button variant="primary" onClick={handleDeploy}>
          <Check className="w-4 h-4 mr-1.5" />
          CONFIRM DEPLOYMENT
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
