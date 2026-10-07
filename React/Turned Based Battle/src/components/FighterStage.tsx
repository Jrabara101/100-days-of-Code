import React from 'react';
import { FighterEntity, FloatingTextItem } from '../types/combat';
import { Card } from './ui/Card';
import { Progress } from './ui/Progress';
import { Badge } from './ui/Badge';
import { Tooltip } from './ui/Tooltip';
import { Shield, Zap, AlertTriangle, Flame, ShieldAlert, Cpu } from 'lucide-react';

interface FighterStageProps {
  player: FighterEntity;
  enemy: FighterEntity;
  floatingTexts: FloatingTextItem[];
  isScreenShaking: boolean;
  activeAttackVfx: { actorId: string; targetId: string; type: string } | null;
  opponentCommitted: boolean;
}

export const FighterStage: React.FC<FighterStageProps> = ({
  player,
  enemy,
  floatingTexts,
  isScreenShaking,
  activeAttackVfx,
  opponentCommitted,
}) => {
  // Check if player or enemy is acting
  const isPlayerAttacking = activeAttackVfx?.actorId === player.id;
  const isEnemyAttacking = activeAttackVfx?.actorId === enemy.id;
  const isPlayerHit = activeAttackVfx?.targetId === player.id;
  const isEnemyHit = activeAttackVfx?.targetId === enemy.id;

  const playerTexts = floatingTexts.filter((t) => t.targetFighterId === player.id);
  const enemyTexts = floatingTexts.filter((t) => t.targetFighterId === enemy.id);

  return (
    <div
      className={`relative w-full flex-1 flex items-center justify-between px-3 sm:px-6 lg:px-12 py-2 sm:py-4 overflow-hidden perspective-[1200px] transition-transform ${
        isScreenShaking ? 'animate-shake' : ''
      }`}
    >

      {/* 3D Caldera Arena Floor Grid */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Radial Caldera Heat */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_75%,rgba(249,115,22,0.18),transparent_75%)]" />
        {/* Perspective Grid Floor */}
        <div
          className="absolute bottom-0 left-0 right-0 h-44 opacity-25"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255, 87, 34, 0.4) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255, 87, 34, 0.4) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            transform: 'rotateX(65deg)',
            transformOrigin: 'bottom center',
          }}
        />
      </div>

      {/* LEFT: PLAYER COMBATANT */}
      <div className="relative z-10 w-full max-w-[280px] sm:max-w-[340px] flex flex-col gap-4">
        {/* Player Status Card */}
        <Card className="border border-solar-gold/40 shadow-[0_0_20px_rgba(251,191,36,0.15)] bg-magma-900/90 p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-gradient-to-tr from-amber-600 to-ember-orange border border-solar-gold flex items-center justify-center font-mono font-bold text-xs text-white shadow-sm">
                SC
              </div>
              <div>
                <h4 className="font-rajdhani font-bold text-sm text-solar-gold leading-tight">
                  {player.name}
                </h4>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant={
                      player.stance === 'AGGRESSIVE'
                        ? 'crimson'
                        : player.stance === 'DEFENSIVE'
                        ? 'cyan'
                        : 'solar'
                    }
                  >
                    {player.stance} STANCE
                  </Badge>
                  {player.isStaggered && (
                    <Badge variant="crimson" className="animate-pulse">
                      BREAK!
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Ready Status indicator */}
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  player.isActionCommitted ? 'bg-solar-gold animate-ping' : 'bg-magma-700'
                }`}
              />
              <span className={player.isActionCommitted ? 'text-solar-gold font-bold' : 'text-text-muted'}>
                {player.isActionCommitted ? 'LOCKED' : 'THINKING'}
              </span>
            </div>
          </div>

          {/* Health Bar */}
          <div className="space-y-1 mt-2">
            <div className="flex justify-between font-mono text-[10px] text-text-muted">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Cpu className="w-3 h-3" /> HULL INTEGRITY
              </span>
              <span className="text-text-primary font-bold">
                {player.currentHp} / {player.maxHp}
              </span>
            </div>
            <Progress value={player.currentHp} max={player.maxHp} variant="health" />
          </div>

          {/* Stagger Gauge */}
          <div className="space-y-1 mt-2">
            <div className="flex justify-between font-mono text-[10px] text-text-muted">
              <span className="flex items-center gap-1 text-solar-gold font-bold">
                <ShieldAlert className="w-3 h-3 text-ember-core" /> STAGGER GAUGE
              </span>
              <span className={player.staggerMeter >= 100 ? 'text-crimson-heat font-bold animate-pulse' : 'text-text-primary font-bold'}>
                {player.staggerMeter >= 100 ? 'GUARD BROKEN (100%)' : `${Math.round(player.staggerMeter)}%`}
              </span>
            </div>
            <Progress value={player.staggerMeter} max={100} variant="stagger" />
          </div>

          {/* Energy / Heat Resource */}
          <div className="space-y-1 mt-2">
            <div className="flex justify-between font-mono text-[10px] text-text-muted">
              <span className="flex items-center gap-1 text-cooling-cyan font-bold">
                <Zap className="w-3 h-3" /> REACTOR ENERGY
              </span>
              <span className="text-text-primary font-bold">
                {player.currentEnergy} / {player.maxEnergy} AP
              </span>
            </div>
            <Progress value={player.currentEnergy} max={player.maxEnergy} variant="energy" segments={5} />
          </div>

          {/* Active Status Effects */}
          {player.activeStatuses.length > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-magma-800">
              <span className="font-mono text-[10px] text-text-muted">STATUS:</span>
              {player.activeStatuses.map((st) => (
                <Tooltip
                  key={st.id}
                  content={`${st.name}: ${st.damagePerTurn ? `-${st.damagePerTurn} DoT` : ''} (${st.durationTurns} turns remaining)`}
                >
                  <div className="flex items-center gap-1 bg-crimson-heat/20 border border-crimson-heat/40 text-red-300 px-1.5 py-0.5 rounded text-[10px] font-mono">
                    <Flame className="w-3 h-3 text-ember-orange animate-pulse" />
                    <span>{st.durationTurns}T</span>
                  </div>
                </Tooltip>
              ))}
            </div>
          )}
        </Card>

        {/* Player Visual Mecha Avatar */}
        <div
          className={`relative mx-auto flex flex-col items-center justify-center transition-all duration-300 ${
            isPlayerAttacking ? 'translate-x-12 scale-110' : ''
          } ${isPlayerHit ? 'animate-shake filter brightness-150' : ''} ${
            player.isStaggered ? 'opacity-60 rotate-2' : ''
          }`}
        >
          {/* Floating Combat Texts for Player */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30">
            {playerTexts.map((txt) => (
              <div
                key={txt.id}
                className={`animate-float-damage font-rajdhani font-black text-lg md:text-xl tracking-wider uppercase px-2 py-0.5 rounded ${
                  txt.type === 'crit'
                    ? 'text-solar-gold bg-crimson-heat/80 shadow-[0_0_15px_rgba(251,191,36,0.9)] text-2xl scale-125'
                    : txt.type === 'parry'
                    ? 'text-solar-gold bg-magma-950 border border-solar-gold shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                    : txt.type === 'block'
                    ? 'text-cooling-cyan bg-magma-950 border border-cooling-cyan'
                    : txt.type === 'break'
                    ? 'text-white bg-red-600 shadow-[0_0_20px_rgba(220,38,38,1)] animate-bounce'
                    : 'text-red-400 bg-magma-950/80'
                }`}
                style={{ transform: `translateX(${txt.xOffset || 0}px)` }}
              >
                {txt.text}
              </div>
            ))}
          </div>

          {/* SVG Mecha Body (Pyro-Frame Scion) */}
          <div className="relative w-44 h-48 sm:w-52 sm:h-56 flex items-center justify-center">
            {/* Plasma Aura / Reactor Glow */}
            <div
              className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 ${
                player.stance === 'AGGRESSIVE'
                  ? 'bg-crimson-heat/30 scale-110'
                  : player.stance === 'DEFENSIVE'
                  ? 'bg-cooling-cyan/25 scale-100'
                  : 'bg-ember-orange/25 scale-100'
              }`}
            />

            {/* Tactical Frame Illustration */}
            <svg
              className="w-full h-full drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]"
              viewBox="0 0 200 220"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Torso Armor */}
              <polygon
                points="100,20 145,55 135,130 100,165 65,130 55,55"
                fill="#1b0d07"
                stroke="#FF5722"
                strokeWidth="3"
              />
              {/* Core Reactor */}
              <circle
                cx="100"
                cy="85"
                r="24"
                fill="url(#coreGradient)"
                stroke="#FBBF24"
                strokeWidth="2.5"
                className={player.currentEnergy >= 100 ? 'animate-pulse-glow' : ''}
              />
              {/* Shoulder Pauldrons */}
              <polygon
                points="50,45 15,75 35,120 70,80"
                fill="#26130a"
                stroke="#F97316"
                strokeWidth="2.5"
              />
              <polygon
                points="150,45 185,75 165,120 130,80"
                fill="#26130a"
                stroke="#F97316"
                strokeWidth="2.5"
              />
              {/* Arm Blades / Plasma Emitter */}
              <line x1="170" y1="100" x2="195" y2="185" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />
              <line x1="30" y1="100" x2="5" y2="185" stroke="#FF5722" strokeWidth="3" strokeLinecap="round" />
              {/* Visor */}
              <polygon points="85,35 115,35 110,48 90,48" fill="#38BDF8" className="animate-pulse" />

              <defs>
                <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFF" />
                  <stop offset="40%" stopColor="#FBBF24" />
                  <stop offset="85%" stopColor="#F97316" />
                  <stop offset="100%" stopColor="#DC2626" />
                </radialGradient>
              </defs>
            </svg>

            {/* Defense Barrier Bubble if Guarding */}
            {player.stance === 'DEFENSIVE' && (
              <div className="absolute inset-0 rounded-full border-2 border-cooling-cyan/60 bg-cooling-cyan/10 animate-pulse pointer-events-none shadow-[0_0_25px_rgba(56,189,248,0.5)]" />
            )}

            {/* Stagger broken indicator */}
            {player.isStaggered && (
              <div className="absolute -top-4 px-2 py-0.5 rounded bg-crimson-heat text-white font-mono text-[10px] font-bold uppercase tracking-wider animate-bounce flex items-center gap-1 shadow-md">
                <AlertTriangle className="w-3 h-3" /> STAGGERED
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CENTER CLASH ARENA / VFX STAGE */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center pointer-events-none">
        {/* Active Attack VFX */}
        {activeAttackVfx && (
          <div className="relative flex items-center justify-center">
            {activeAttackVfx.type === 'DEFEND' ? (
              <div className="w-32 h-32 rounded-full border-4 border-cooling-cyan/80 bg-cooling-cyan/20 animate-ping shadow-[0_0_40px_rgba(56,189,248,0.8)]" />
            ) : activeAttackVfx.type === 'ULTIMATE' ? (
              <div className="w-48 h-48 rounded-full border-4 border-solar-gold bg-gradient-to-r from-red-600 via-ember-orange to-solar-gold animate-stagger-shatter shadow-[0_0_80px_rgba(251,191,36,1)] flex items-center justify-center">
                <span className="font-rajdhani font-black text-2xl text-magma-950 tracking-widest uppercase">
                  SUPERNOVA!
                </span>
              </div>
            ) : (
              <div className="relative w-40 h-10 flex items-center justify-center">
                {/* Slash Arc */}
                <div className="w-full h-2 bg-gradient-to-r from-transparent via-solar-gold to-crimson-heat shadow-[0_0_20px_rgba(251,191,36,0.9)] animate-slash-vfx" />
              </div>
            )}
          </div>
        )}

        {/* VS Emblem when idle */}
        {!activeAttackVfx && (
          <div className="hidden md:flex flex-col items-center justify-center opacity-40">
            <span className="font-rajdhani font-black text-4xl text-solar-gold tracking-widest">
              VS
            </span>
            <span className="font-mono text-[9px] text-text-muted tracking-widest uppercase">
              TACTICAL COMMITMENT
            </span>
          </div>
        )}
      </div>

      {/* RIGHT: ENEMY COMBATANT */}
      <div className="relative z-10 w-full max-w-[280px] sm:max-w-[340px] flex flex-col gap-4">
        {/* Enemy Status Card */}
        <Card className="border border-crimson-heat/40 shadow-[0_0_20px_rgba(220,38,38,0.15)] bg-magma-900/90 p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-gradient-to-tr from-crimson-heat to-red-700 border border-solar-gold/40 flex items-center justify-center font-mono font-bold text-xs text-white shadow-sm">
                IT
              </div>
              <div>
                <h4 className="font-rajdhani font-bold text-sm text-crimson-heat leading-tight">
                  {enemy.name}
                </h4>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant={
                      enemy.stance === 'AGGRESSIVE'
                        ? 'crimson'
                        : enemy.stance === 'DEFENSIVE'
                        ? 'cyan'
                        : 'solar'
                    }
                  >
                    {enemy.stance} STANCE
                  </Badge>
                  {enemy.isStaggered && (
                    <Badge variant="crimson" className="animate-pulse">
                      BREAK!
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Opponent Committed Indicator (Masked for anti-cheat!) */}
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  opponentCommitted || enemy.isActionCommitted
                    ? 'bg-solar-gold animate-ping'
                    : 'bg-magma-700'
                }`}
              />
              <span
                className={
                  opponentCommitted || enemy.isActionCommitted
                    ? 'text-solar-gold font-bold'
                    : 'text-text-muted'
                }
              >
                {opponentCommitted || enemy.isActionCommitted ? 'LOCKED' : 'COMMITTING'}
              </span>
            </div>
          </div>

          {/* Health Bar */}
          <div className="space-y-1 mt-2">
            <div className="flex justify-between font-mono text-[10px] text-text-muted">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Cpu className="w-3 h-3" /> HULL INTEGRITY
              </span>
              <span className="text-text-primary font-bold">
                {enemy.currentHp} / {enemy.maxHp}
              </span>
            </div>
            <Progress value={enemy.currentHp} max={enemy.maxHp} variant="health" />
          </div>

          {/* Stagger Gauge */}
          <div className="space-y-1 mt-2">
            <div className="flex justify-between font-mono text-[10px] text-text-muted">
              <span className="flex items-center gap-1 text-solar-gold font-bold">
                <ShieldAlert className="w-3 h-3 text-ember-core" /> STAGGER GAUGE
              </span>
              <span
                className={
                  enemy.staggerMeter >= 100
                    ? 'text-crimson-heat font-bold animate-pulse'
                    : 'text-text-primary font-bold'
                }
              >
                {enemy.staggerMeter >= 100 ? 'GUARD BROKEN (100%)' : `${Math.round(enemy.staggerMeter)}%`}
              </span>
            </div>
            <Progress value={enemy.staggerMeter} max={100} variant="stagger" />
          </div>

          {/* Energy Resource */}
          <div className="space-y-1 mt-2">
            <div className="flex justify-between font-mono text-[10px] text-text-muted">
              <span className="flex items-center gap-1 text-cooling-cyan font-bold">
                <Zap className="w-3 h-3" /> REACTOR ENERGY
              </span>
              <span className="text-text-primary font-bold">
                {enemy.currentEnergy} / {enemy.maxEnergy} AP
              </span>
            </div>
            <Progress value={enemy.currentEnergy} max={enemy.maxEnergy} variant="energy" segments={5} />
          </div>

          {/* Active Status Effects */}
          {enemy.activeStatuses.length > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-magma-800">
              <span className="font-mono text-[10px] text-text-muted">STATUS:</span>
              {enemy.activeStatuses.map((st) => (
                <Tooltip
                  key={st.id}
                  content={`${st.name}: ${st.damagePerTurn ? `-${st.damagePerTurn} DoT` : ''} (${st.durationTurns} turns remaining)`}
                >
                  <div className="flex items-center gap-1 bg-crimson-heat/20 border border-crimson-heat/40 text-red-300 px-1.5 py-0.5 rounded text-[10px] font-mono">
                    <Flame className="w-3 h-3 text-ember-orange animate-pulse" />
                    <span>{st.durationTurns}T</span>
                  </div>
                </Tooltip>
              ))}
            </div>
          )}
        </Card>

        {/* Enemy Visual Mecha Avatar */}
        <div
          className={`relative mx-auto flex flex-col items-center justify-center transition-all duration-300 ${
            isEnemyAttacking ? '-translate-x-12 scale-110' : ''
          } ${isEnemyHit ? 'animate-shake filter brightness-150' : ''} ${
            enemy.isStaggered ? 'opacity-60 -rotate-2' : ''
          }`}
        >
          {/* Floating Combat Texts for Enemy */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30">
            {enemyTexts.map((txt) => (
              <div
                key={txt.id}
                className={`animate-float-damage font-rajdhani font-black text-lg md:text-xl tracking-wider uppercase px-2 py-0.5 rounded ${
                  txt.type === 'crit'
                    ? 'text-solar-gold bg-crimson-heat/80 shadow-[0_0_15px_rgba(251,191,36,0.9)] text-2xl scale-125'
                    : txt.type === 'parry'
                    ? 'text-solar-gold bg-magma-950 border border-solar-gold shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                    : txt.type === 'block'
                    ? 'text-cooling-cyan bg-magma-950 border border-cooling-cyan'
                    : txt.type === 'break'
                    ? 'text-white bg-red-600 shadow-[0_0_20px_rgba(220,38,38,1)] animate-bounce'
                    : 'text-red-400 bg-magma-950/80'
                }`}
                style={{ transform: `translateX(${txt.xOffset || 0}px)` }}
              >
                {txt.text}
              </div>
            ))}
          </div>

          {/* SVG Mecha Body (Ignis-Typhon Mk.IV) */}
          <div className="relative w-44 h-48 sm:w-52 sm:h-56 flex items-center justify-center">
            {/* Plasma Glow */}
            <div className="absolute inset-0 rounded-full blur-xl bg-crimson-heat/25 scale-100" />

            <svg
              className="w-full h-full drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]"
              viewBox="0 0 200 220"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Heavy Volcanic Hull */}
              <polygon
                points="100,15 155,50 145,140 100,175 55,140 45,50"
                fill="#120804"
                stroke="#DC2626"
                strokeWidth="3.5"
              />
              {/* Typhon Eye / Sensor Bar */}
              <rect x="75" y="38" width="50" height="10" rx="3" fill="#FBBF24" className="animate-pulse" />
              {/* Core Reactor */}
              <polygon
                points="100,65 125,100 100,135 75,100"
                fill="url(#typhonCore)"
                stroke="#FF5722"
                strokeWidth="2"
              />
              {/* Spikes / Heavy Pauldrons */}
              <polygon points="40,35 5,50 25,100 55,75" fill="#26130a" stroke="#DC2626" strokeWidth="2.5" />
              <polygon points="160,35 195,50 175,100 145,75" fill="#26130a" stroke="#DC2626" strokeWidth="2.5" />
              {/* Thermal Heavy Hammer Weapon */}
              <line x1="25" y1="85" x2="10" y2="190" stroke="#DC2626" strokeWidth="5" strokeLinecap="round" />
              <rect x="0" y="160" width="22" height="35" rx="3" fill="#381a0e" stroke="#FBBF24" strokeWidth="2" />

              <defs>
                <linearGradient id="typhonCore" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#DC2626" />
                  <stop offset="50%" stopColor="#F97316" />
                  <stop offset="100%" stopColor="#FBBF24" />
                </linearGradient>
              </defs>
            </svg>

            {/* Defense Barrier Bubble if Guarding */}
            {enemy.stance === 'DEFENSIVE' && (
              <div className="absolute inset-0 rounded-full border-2 border-cooling-cyan/60 bg-cooling-cyan/10 animate-pulse pointer-events-none shadow-[0_0_25px_rgba(56,189,248,0.5)]" />
            )}

            {/* Stagger broken indicator */}
            {enemy.isStaggered && (
              <div className="absolute -top-4 px-2 py-0.5 rounded bg-crimson-heat text-white font-mono text-[10px] font-bold uppercase tracking-wider animate-bounce flex items-center gap-1 shadow-md">
                <AlertTriangle className="w-3 h-3" /> STAGGERED
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
