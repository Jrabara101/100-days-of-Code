import React, { useState } from 'react';
import { Dialog } from './ui/dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { WeaponEntity } from '../types/game';
import { AVAILABLE_UPGRADES, WeaponUpgrade } from '../engine/weapons';
import { Wrench, Zap, Flame, Snowflake, Shield, Lightbulb, Bomb, Check } from 'lucide-react';

interface ScrapForgeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerScrap: number;
  weapons: WeaponEntity[];
  activeWeaponIndex: number;
  onUpgradeWeapon: (weaponIndex: number, upgrade: WeaponUpgrade) => boolean;
  onDeployFloodlight: () => boolean;
  onDeployTripwire: () => boolean;
  onRepairNearestBarricade: () => boolean;
  onResumeGame: () => void;
}

export function ScrapForgeModal({
  open,
  onOpenChange,
  playerScrap,
  weapons,
  activeWeaponIndex,
  onUpgradeWeapon,
  onDeployFloodlight,
  onDeployTripwire,
  onRepairNearestBarricade,
  onResumeGame,
}: ScrapForgeModalProps) {
  const [selectedWeaponIdx, setSelectedWeaponIdx] = useState(activeWeaponIndex);
  const [tab, setTab] = useState<'weapons' | 'fortifications'>('weapons');
  const targetWeapon = weapons[selectedWeaponIdx] || weapons[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="BIOHAZARD SCRAP FORGE // ARMAMENT EVOLUTION" className="max-w-3xl">
      {/* Scrap Reserve Header */}
      <div className="flex items-center justify-between bg-[#13191C] border border-[#1E272B] p-3 rounded-md mb-4">
        <div>
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">BIOMASS SCRAP RESERVES</div>
          <div className="text-xl font-mono font-black text-amber-400 flex items-center gap-1.5">
            ⚙️ {playerScrap.toLocaleString()} <span className="text-xs text-slate-400 font-normal">UNITS</span>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-sm border border-slate-800">
          <Button
            variant={tab === 'weapons' ? 'hazard' : 'ghost'}
            size="sm"
            onClick={() => setTab('weapons')}
            className="text-xs h-7"
          >
            <Wrench className="w-3.5 h-3.5 mr-1" /> WEAPONS
          </Button>
          <Button
            variant={tab === 'fortifications' ? 'hazard' : 'ghost'}
            size="sm"
            onClick={() => setTab('fortifications')}
            className="text-xs h-7"
          >
            <Shield className="w-3.5 h-3.5 mr-1" /> FORTIFICATIONS
          </Button>
        </div>
      </div>

      {tab === 'weapons' ? (
        <div className="space-y-4">
          {/* Weapon Selector Tabs */}
          <div className="grid grid-cols-3 gap-2">
            {weapons.map((w, idx) => (
              <button
                key={w.id}
                onClick={() => setSelectedWeaponIdx(idx)}
                className={`p-2.5 rounded-sm border text-left font-mono transition-all ${
                  selectedWeaponIdx === idx
                    ? 'border-amber-500 bg-[#1A2328] shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'border-slate-800 bg-[#101416] opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                  <span>SLOT {idx + 1}</span>
                  <Badge variant={w.tier > 1 ? 'hazard' : 'outline'} className="text-[9px] px-1 py-0">
                    TIER {w.tier}
                  </Badge>
                </div>
                <div className="text-xs font-bold text-white truncate">{w.name}</div>
                <div className="text-[10px] text-amber-400">DMG: {w.baseDamage} | ROF: {w.fireRateRps}/s</div>
              </button>
            ))}
          </div>

          {/* Target Weapon Telemetry Specs */}
          {targetWeapon && (
            <div className="bg-[#0C1012] border border-[#1E272B] p-3 rounded-md flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-slate-400 uppercase">SELECTED: </span>
                <span className="text-white font-bold">{targetWeapon.name}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">{targetWeapon.description}</p>
              </div>
              <div className="flex items-center gap-3 text-right">
                <div>
                  <div className="text-slate-500 text-[10px]">PENETRATION</div>
                  <div className="text-amber-400 font-bold">{targetWeapon.piercingCount} TARGETS</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">CAPACITY</div>
                  <div className="text-amber-400 font-bold">{targetWeapon.clipSize} ROUNDS</div>
                </div>
              </div>
            </div>
          )}

          {/* Upgrades Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
            {AVAILABLE_UPGRADES.map((upg) => {
              const canAfford = playerScrap >= upg.cost;
              const isAppliedElemental =
                upg.type === 'elemental' && targetWeapon?.elemental === upg.elementalType;

              return (
                <Card
                  key={upg.id}
                  className={`border transition-all ${
                    canAfford
                      ? 'border-[#1E272B] hover:border-amber-500/60'
                      : 'border-slate-800/50 opacity-60'
                  }`}
                >
                  <CardHeader className="p-3 pb-2 flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs text-white font-mono flex items-center gap-1.5">
                      {upg.elementalType === 'shock' && <Zap className="w-3.5 h-3.5 text-cyan-400" />}
                      {upg.elementalType === 'incendiary' && <Flame className="w-3.5 h-3.5 text-red-400" />}
                      {upg.elementalType === 'cryo' && <Snowflake className="w-3.5 h-3.5 text-sky-400" />}
                      {upg.name}
                    </CardTitle>
                    <Badge variant={upg.type === 'elemental' ? 'cyan' : 'hazard'} className="text-[9px]">
                      {upg.badge}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <CardDescription className="text-[11px] text-slate-300">
                      {upg.description}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="p-3 pt-0 flex justify-between items-center border-t border-slate-800/80 mt-2">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      ⚙️ {upg.cost} SCRAP
                    </span>
                    <Button
                      variant={isAppliedElemental ? 'bio' : 'hazard'}
                      size="sm"
                      disabled={!canAfford || isAppliedElemental}
                      onClick={() => onUpgradeWeapon(selectedWeaponIdx, upg)}
                      className="text-xs h-7 px-3"
                    >
                      {isAppliedElemental ? (
                        <>
                          <Check className="w-3 h-3 mr-1" /> EQUIPPED
                        </>
                      ) : (
                        'FORGE UPGRADE'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        /* Fortifications Tab */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Barricade Repair */}
          <Card className="border-[#1E272B]">
            <CardHeader className="p-4">
              <Wrench className="w-6 h-6 text-amber-400 mb-2" />
              <CardTitle className="text-sm">BARRICADE REPAIR</CardTitle>
              <CardDescription>
                Reinforce compromised entryway boards (+80 HP to nearest structure).
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-4 pt-0 flex justify-between items-center">
              <span className="font-mono text-xs text-amber-400 font-bold">⚙️ 40 SCRAP</span>
              <Button
                variant="hazard"
                size="sm"
                disabled={playerScrap < 40}
                onClick={onRepairNearestBarricade}
                className="text-xs h-7"
              >
                REPAIR
              </Button>
            </CardFooter>
          </Card>

          {/* Floodlight */}
          <Card className="border-[#1E272B]">
            <CardHeader className="p-4">
              <Lightbulb className="w-6 h-6 text-cyan-400 mb-2" />
              <CardTitle className="text-sm">HALOGEN FLOODLIGHT</CardTitle>
              <CardDescription>
                Deploy high-intensity halogen light. Strips silhouettes and blinds sprinters.
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-4 pt-0 flex justify-between items-center">
              <span className="font-mono text-xs text-amber-400 font-bold">⚙️ 120 SCRAP</span>
              <Button
                variant="hazard"
                size="sm"
                disabled={playerScrap < 120}
                onClick={onDeployFloodlight}
                className="text-xs h-7"
              >
                DEPLOY
              </Button>
            </CardFooter>
          </Card>

          {/* Tripwire Mine */}
          <Card className="border-[#1E272B]">
            <CardHeader className="p-4">
              <Bomb className="w-6 h-6 text-red-400 mb-2" />
              <CardTitle className="text-sm">INCENDIARY TRIPWIRE</CardTitle>
              <CardDescription>
                Pressure-detonated fragmentation mine. Deals 180 AoE fire burst damage.
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-4 pt-0 flex justify-between items-center">
              <span className="font-mono text-xs text-amber-400 font-bold">⚙️ 60 SCRAP</span>
              <Button
                variant="hazard"
                size="sm"
                disabled={playerScrap < 60}
                onClick={onDeployTripwire}
                className="text-xs h-7"
              >
                PLANT
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Footer Close/Resume */}
      <div className="mt-5 pt-3 border-t border-[#1E272B] flex justify-end">
        <Button variant="bio" onClick={onResumeGame} className="gap-2">
          RESUME QUARANTINE DEFENSE →
        </Button>
      </div>
    </Dialog>
  );
}
