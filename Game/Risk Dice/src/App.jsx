import React, { useState, useRef, useCallback, memo } from 'react';

// ==========================================
// 1. HEADLESS RISK COMBAT ENGINE
// ==========================================
class RiskEngine {
  constructor() {
    this.attackerArmies = 10;
    this.defenderArmies = 10;
    this.attackDiceCount = 3; // Max 3 (requires at least 4 armies: 3 to roll + 1 left behind)
    this.defendDiceCount = 2; // Max 2 (requires at least 2 armies)
  }

  // Pure mathematical single battle round resolver
  resolveSingleRound(attCount, defCount) {
    const numAttDice = Math.min(attCount - 1, 3);
    const numDefDice = Math.min(defCount, 2);

    if (numAttDice <= 0 || numDefDice <= 0) return null;

    // Roll and sort descending
    const attRolls = Array.from({ length: numAttDice }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => b - a);
    const defRolls = Array.from({ length: numDefDice }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => b - a);

    let attLosses = 0;
    let defLosses = 0;

    const comparisons = Math.min(attRolls.length, defRolls.length);
    for (let i = 0; i < comparisons; i++) {
      if (attRolls[i] > defRolls[i]) {
        defLosses++;
      } else {
        // Ties go to the defender in Risk
        attLosses++;
      }
    }

    return {
      attRolls,
      defRolls,
      attLosses,
      defLosses,
      newAttCount: attCount - attLosses,
      newDefCount: defCount - defLosses
    };
  }
}

// ==========================================
// 2. PIXELATED UI COMPONENTS (Memoized)
// ==========================================
const PixelDie = memo(({ value }) => {
  return (
    <div className="w-12 h-12 bg-white border-2 border-black flex items-center justify-center font-black text-xl text-black shadow-[4px_4px_0px_0px_#000] select-none">
      {value || '?'}
    </div>
  );
});

export default function RiskRollerApp() {
  const engineRef = useRef(new RiskEngine());
  
  // React State Layer
  const [attacker, setAttacker] = useState(10);
  const [defender, setDefender] = useState(10);
  const [lastRolls, setLastRolls] = useState({ attRolls: [], defRolls: [] });
  const [combatLog, setCombatLog] = useState(['> SYSTEM INITIALIZED. AWAITING DEPLOYMENT.']);
  const [isAnimating, setIsAnimating] = useState(false);

  const addLog = (msg) => {
    setCombatLog(prev => [msg, ...prev.slice(0, 5)]);
  };

  const handleManualRoll = () => {
    if (attacker <= 1 || defender <= 0 || isAnimating) return;
    
    setIsAnimating(true);
    // Visual rolling frame delay simulation
    setTimeout(() => {
      const result = engineRef.current.resolveSingleRound(attacker, defender);
      if (result) {
        setAttacker(result.newAttCount);
        setDefender(result.newDefCount);
        setLastRolls({ attRolls: result.attRolls, defRolls: result.defRolls });
        addLog(`ATT: [${result.attRolls.join(',')}] vs DEF: [${result.defRolls.join(',')}] -> Lost A:${result.attLosses} D:${result.defLosses}`);
      }
      setIsAnimating(false);
    }, 250);
  };

  const handleBlitzBattle = () => {
    if (attacker <= 1 || defender <= 0 || isAnimating) return;
    
    setIsAnimating(true);
    let currAtt = attacker;
    let currDef = defender;
    let steps = 0;

    const blitzInterval = setInterval(() => {
      if (currAtt <= 1 || currDef <= 0 || steps > 100) {
        clearInterval(blitzInterval);
        setIsAnimating(false);
        addLog(`> BLITZ COMPLETE. FINAL: ATT(${currAtt}) DEF(${currDef})`);
        return;
      }

      const result = engineRef.current.resolveSingleRound(currAtt, currDef);
      if (result) {
        currAtt = result.newAttCount;
        currDef = result.newDefCount;
        setAttacker(currAtt);
        setDefender(currDef);
        setLastRolls({ attRolls: result.attRolls, defRolls: result.defRolls });
      }
      steps++;
    }, 80); // Smooth animated blitz cadence
  };

  const resetGame = () => {
    setAttacker(15);
    setDefender(10);
    setLastRolls({ attRolls: [], defRolls: [] });
    setCombatLog(['> WAR ROOM RESET. DEPLOY UNITS.']);
  };

  return (
    <div className="min-h-screen bg-[#1e1b4b] flex flex-col items-center justify-center p-6 font-mono text-white select-none">
      
      {/* Pixel Retro Styling Tokens */}
      <style>{`
        .pixel-box {
          box-shadow: 6px 6px 0px 0px #000000;
          border: 4px solid #ffffff;
        }
        .pixel-btn {
          box-shadow: 4px 4px 0px 0px #000000;
          border: 3px solid #ffffff;
          transition: transform 0.1s ease, box-shadow 0.1s ease;
        }
        .pixel-btn:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0px 0px #000000;
        }
        .crt-scanlines::before {
          content: " ";
          display: block;
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
          z-index: 10;
          background-size: 100% 4px;
          pointer-events: none;
        }
      `}</style>

      <div className="relative w-full max-w-2xl bg-[#312e81] p-8 pixel-box crt-scanlines">
        
        {/* Header */}
        <header className="flex justify-between items-center border-b-4 border-white pb-4 mb-6">
          <h1 className="text-xl font-black tracking-widest text-yellow-400">RISK_DICE_SIM.EXE</h1>
          <button onClick={resetGame} className="pixel-btn bg-red-600 px-3 py-1 text-xs font-bold uppercase hover:bg-red-500">
            Reset War
          </button>
        </header>

        {/* Armies Display Board */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Attacker Panel */}
          <div className="bg-[#1e1b4b] p-4 pixel-box border-cyan-400">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-2">Attacking Forces</span>
            <div className="text-4xl font-black mb-4 text-cyan-200">{attacker}</div>
            <div className="flex gap-2">
              <button onClick={() => setAttacker(a => Math.max(2, a - 1))} className="pixel-btn bg-gray-700 px-2 py-1 text-xs">-1</button>
              <button onClick={() => setAttacker(a => a + 1)} className="pixel-btn bg-gray-700 px-2 py-1 text-xs">+1</button>
              <button onClick={() => setAttacker(a => a + 5)} className="pixel-btn bg-cyan-700 px-2 py-1 text-xs">+5</button>
            </div>
          </div>

          {/* Defender Panel */}
          <div className="bg-[#1e1b4b] p-4 pixel-box border-rose-400">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-2">Defending Forces</span>
            <div className="text-4xl font-black mb-4 text-rose-200">{defender}</div>
            <div className="flex gap-2">
              <button onClick={() => setDefender(d => Math.max(1, d - 1))} className="pixel-btn bg-gray-700 px-2 py-1 text-xs">-1</button>
              <button onClick={() => setDefender(d => d + 1)} className="pixel-btn bg-gray-700 px-2 py-1 text-xs">+1</button>
              <button onClick={() => setDefender(d => d + 5)} className="pixel-btn bg-rose-700 px-2 py-1 text-xs">+5</button>
            </div>
          </div>
        </div>

        {/* Dice Visualizer Row */}
        <div className="bg-black/40 p-4 pixel-box mb-6 flex flex-col md:flex-row justify-around items-center gap-4">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-cyan-300 mb-2 font-bold uppercase">Attacker Dice</span>
            <div className="flex gap-2">
              {lastRolls.attRolls.length > 0 ? (
                lastRolls.attRolls.map((v, i) => <PixelDie key={`att-${i}`} value={v} />)
              ) : (
                <div className="text-xs text-gray-500 italic py-3">No Roll Yet</div>
              )}
            </div>
          </div>

          <div className="text-2xl font-black text-yellow-400">VS</div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-rose-300 mb-2 font-bold uppercase">Defender Dice</span>
            <div className="flex gap-2">
              {lastRolls.defRolls.length > 0 ? (
                lastRolls.defRolls.map((v, i) => <PixelDie key={`def-${i}`} value={v} />)
              ) : (
                <div className="text-xs text-gray-500 italic py-3">No Roll Yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Deck */}
        <div className="flex gap-4 mb-6">
          <button 
            disabled={attacker <= 1 || defender <= 0 || isAnimating}
            onClick={handleManualRoll}
            className="pixel-btn bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 flex-1 py-3 text-xs font-black uppercase tracking-wider"
          >
            {isAnimating ? 'Rolling...' : 'Roll Battle (1 Round)'}
          </button>
          
          <button 
            disabled={attacker <= 1 || defender <= 0 || isAnimating}
            onClick={handleBlitzBattle}
            className="pixel-btn bg-amber-600 hover:bg-amber-500 disabled:opacity-40 flex-1 py-3 text-xs font-black uppercase tracking-wider text-yellow-200"
          >
            {isAnimating ? 'Blitzing...' : '⚡ Blitz to Death'}
          </button>
        </div>

        {/* Combat Terminal Log */}
        <div className="bg-black p-3 pixel-box h-24 overflow-y-auto text-[10px] text-emerald-400 space-y-1">
          {combatLog.map((log, idx) => (
            <div key={idx} className="leading-tight">{log}</div>
          ))}
        </div>

      </div>
    </div>
  );
}
