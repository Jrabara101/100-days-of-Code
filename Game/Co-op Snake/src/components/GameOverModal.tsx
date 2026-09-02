import React from 'react';
import type { CollisionCause, TelemetryData } from '../engine/types';
import { AlertTriangle, RotateCcw, Trophy, Flame, Apple, Award } from 'lucide-react';
import { globalAudio } from '../engine/AudioEngine';

interface GameOverModalProps {
  telemetry: TelemetryData;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ telemetry, onRestart }) => {
  const isVersus = telemetry.opponentMode === 'AI_ENEMY';

  const getCollisionDetails = (cause: CollisionCause) => {
    if (isVersus) {
      if (telemetry.errorCode === '0xPLAYER_VICTORY') {
        return {
          title: 'VICTORY ACHIEVED!',
          desc: (
            <>
              <span className="text-[#0055ff] font-black bg-white px-2 py-0.5 brutal-border-2">Player 1</span> outmaneuvered the{' '}
              <span className="text-[#ff0033] font-black bg-white px-2 py-0.5 brutal-border-2">AI Rival</span>!
            </>
          ),
          code: '0xPLAYER_VICTORY',
          iconColor: 'bg-[#00ff66]',
        };
      } else if (telemetry.errorCode === '0xAI_VICTORY') {
        return {
          title: 'DEFEAT ENCOUNTERED',
          desc: (
            <>
              <span className="text-[#ff0033] font-black bg-white px-2 py-0.5 brutal-border-2">AI Rival</span> outlived{' '}
              <span className="text-[#0055ff] font-black bg-white px-2 py-0.5 brutal-border-2">Player 1</span>!
            </>
          ),
          code: '0xAI_VICTORY',
          iconColor: 'bg-[#ff0033]',
        };
      } else if (telemetry.errorCode === '0xVERSUS_DRAW') {
        return {
          title: 'MUTUAL DESTRUCTION (DRAW)',
          desc: 'Simultaneous mutual head collision occurred.',
          code: '0xVERSUS_DRAW',
          iconColor: 'bg-[#ffea00]',
        };
      }
    }

    switch (cause) {
      case 'P1_WALL':
        return {
          title: 'BOUNDARY BREACH',
          desc: (
            <>
              <span className="text-[#0055ff] font-black bg-white px-2 py-0.5 brutal-border-2">Player 1</span> impacted the perimeter grid boundary.
            </>
          ),
          code: '0xWALL_OOB_P1',
          iconColor: 'bg-[#ff0033]',
        };
      case 'P2_WALL':
        return {
          title: 'BOUNDARY BREACH',
          desc: (
            <>
              <span className="text-[#ff0033] font-black bg-white px-2 py-0.5 brutal-border-2">Player 2 / AI</span> impacted the perimeter grid boundary.
            </>
          ),
          code: '0xWALL_OOB_P2',
          iconColor: 'bg-[#ff0033]',
        };
      case 'P1_SELF':
        return {
          title: 'SELF-INTERSECTION',
          desc: (
            <>
              <span className="text-[#0055ff] font-black bg-white px-2 py-0.5 brutal-border-2">Player 1</span> collided with their own tail segments.
            </>
          ),
          code: '0xSELF_INTERSECT_P1',
          iconColor: 'bg-[#ff0033]',
        };
      case 'P2_SELF':
        return {
          title: 'SELF-INTERSECTION',
          desc: (
            <>
              <span className="text-[#ff0033] font-black bg-white px-2 py-0.5 brutal-border-2">Player 2 / AI</span> collided with their own tail segments.
            </>
          ),
          code: '0xSELF_INTERSECT_P2',
          iconColor: 'bg-[#ff0033]',
        };
      case 'P1_P2_MUTUAL_HEAD':
        return {
          title: 'MUTUAL HEAD COLLISION',
          desc: (
            <>
              <span className="text-[#0055ff] font-black bg-white px-2 py-0.5 brutal-border-2">Player 1</span> and{' '}
              <span className="text-[#ff0033] font-black bg-white px-2 py-0.5 brutal-border-2">Player 2 / AI</span> suffered a direct head-to-head collision.
            </>
          ),
          code: '0xHEAD_HEAD_LOCK',
          iconColor: 'bg-[#ffea00]',
        };
      case 'P1_INTO_P2_BODY':
        return {
          title: 'COLLISION DETECTED',
          desc: (
            <>
              <span className="text-[#0055ff] font-black bg-white px-2 py-0.5 brutal-border-2">Player 1</span> collided with{' '}
              <span className="text-[#ff0033] font-black bg-white px-2 py-0.5 brutal-border-2">Player 2 / AI</span> tail segments.
            </>
          ),
          code: '0xPARTNER_TAIL_HIT_P1',
          iconColor: 'bg-[#ff0033]',
        };
      case 'P2_INTO_P1_BODY':
        return {
          title: 'COLLISION DETECTED',
          desc: (
            <>
              <span className="text-[#ff0033] font-black bg-white px-2 py-0.5 brutal-border-2">Player 2 / AI</span> collided with{' '}
              <span className="text-[#0055ff] font-black bg-white px-2 py-0.5 brutal-border-2">Player 1's</span> tail segments.
            </>
          ),
          code: '0xPARTNER_TAIL_HIT_P2',
          iconColor: 'bg-[#ff0033]',
        };
      case 'OUT_OF_LIVES':
      default:
        return {
          title: 'RUN TERMINATED',
          desc: 'Shared emergency life reserve depleted. Revive beacon expired before recovery.',
          code: telemetry.errorCode || '0xLIFE_DEPLETED',
          iconColor: 'bg-[#ff0033]',
        };
    }
  };

  const details = getCollisionDetails(telemetry.collisionCause);
  const isNewHighScore = telemetry.score > 0 && telemetry.score >= telemetry.highScore;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-5 brutal-border px-6 sm:px-10 py-8 bg-white brutal-shadow-lg max-w-[560px] w-full text-black">
        {/* Warning Icon Box */}
        <div className={`flex items-center justify-center w-20 h-20 ${details.iconColor || 'bg-[#ff0033]'} brutal-border brutal-shadow-sm`}>
          {isVersus && telemetry.errorCode === '0xPLAYER_VICTORY' ? (
            <Award className="w-12 h-12 text-black stroke-[2.5]" />
          ) : (
            <AlertTriangle className="w-12 h-12 text-white stroke-[2.5]" />
          )}
        </div>

        {/* Title */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-3xl sm:text-4xl font-display leading-tight tracking-tight uppercase">
            {details.title}
          </h2>
          <div className="font-mono-code text-sm sm:text-base leading-snug bg-[#e5e5e5] p-4 brutal-border w-full mt-2">
            <p className="font-bold">{details.desc}</p>
            <div className="bg-black text-white mt-3 py-1.5 px-3 text-xs font-display tracking-widest inline-block brutal-border-2">
              SYS_ERR_CODE: {details.code}
            </div>
          </div>
        </div>

        {/* Versus Match Summary vs Co-op Stats */}
        {isVersus ? (
          <div className="grid grid-cols-2 gap-3 w-full font-mono-code text-center">
            <div className="p-3 bg-[#0055ff] text-white brutal-border flex flex-col items-center justify-center">
              <span className="text-xs font-display uppercase tracking-wider">PLAYER 1 SCORE</span>
              <span className="text-2xl font-display mt-0.5">{telemetry.p1Score.toLocaleString()}</span>
              <span className="text-xs text-white/80 mt-1">Length: {telemetry.p1Length}</span>
            </div>

            <div className="p-3 bg-[#ff0033] text-white brutal-border flex flex-col items-center justify-center">
              <span className="text-xs font-display uppercase tracking-wider">AI RIVAL SCORE</span>
              <span className="text-2xl font-display mt-0.5">{telemetry.p2Score.toLocaleString()}</span>
              <span className="text-xs text-white/80 mt-1">
                Length: {telemetry.p2Length} ({telemetry.aiDifficulty})
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full font-mono-code text-center">
            <div className="p-2.5 bg-[#ffea00] brutal-border flex flex-col items-center justify-center">
              <span className="text-[10px] font-display uppercase tracking-wider">TEAM SCORE</span>
              <span className="text-lg sm:text-xl font-display mt-0.5">{telemetry.score.toLocaleString()}</span>
            </div>

            <div className="p-2.5 bg-white brutal-border flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 text-[10px] font-display uppercase tracking-wider">
                <Trophy className="w-3 h-3 text-[#ffea00]" /> HIGH
              </div>
              <span className="text-lg sm:text-xl font-display mt-0.5">{telemetry.highScore.toLocaleString()}</span>
            </div>

            <div className="p-2.5 bg-white brutal-border flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 text-[10px] font-display uppercase tracking-wider">
                <Apple className="w-3 h-3 text-[#00ff66]" /> FOOD
              </div>
              <span className="text-lg sm:text-xl font-display mt-0.5">
                {telemetry.p1Length + telemetry.p2Length - 8}
              </span>
            </div>

            <div className="p-2.5 bg-white brutal-border flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 text-[10px] font-display uppercase tracking-wider">
                <Flame className="w-3 h-3 text-[#ff0033]" /> COMBO
              </div>
              <span className="text-lg sm:text-xl font-display mt-0.5">x{telemetry.combo.toFixed(1)}</span>
            </div>
          </div>
        )}

        {isNewHighScore && (
          <div className="w-full bg-[#00ff66] text-black font-display text-center py-2 px-4 brutal-border text-sm tracking-wider animate-bounce">
            ★ NEW ALL-TIME RECORD ACHIEVED! ★
          </div>
        )}

        {/* Restart Button */}
        <button
          onClick={() => {
            globalAudio.playClick();
            onRestart();
          }}
          className="group relative flex w-full cursor-pointer items-center justify-center brutal-border h-14 sm:h-16 px-6 bg-[#ff0033] text-white font-display text-xl sm:text-2xl hover:bg-[#ffea00] hover:text-black transition-all brutal-shadow-hover mt-2"
        >
          <span className="flex items-center gap-3">
            <RotateCcw className="w-6 h-6 stroke-[3] group-hover:rotate-180 transition-transform duration-300" />
            FORCE REBOOT [R]
          </span>
        </button>
      </div>
    </div>
  );
};
