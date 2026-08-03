import React, { useState, useRef, useCallback, memo } from 'react';

// ==========================================
// 1. HEADLESS GAME ENGINE (No React Dependency)
// ==========================================
class BattleshipEngine {
  constructor(onStateChange) {
    this.gridSize = 10;
    this.totalCells = 100;
    
    // 0: Water, 1: Ship, 2: Miss, 3: Hit, 4: Sunk
    this.playerGrid = new Int8Array(this.totalCells);
    this.enemyGrid = new Int8Array(this.totalCells);
    
    this.playerShips = [];
    this.enemyShips = [];
    this.shipLengths = [5, 4, 3, 3, 2];
    
    this.gameState = 'PLAYER_TURN'; // PLAYER_TURN, AI_TURN, GAME_OVER
    this.winner = null;
    this.onStateChange = onStateChange; // Callback to trigger React render
    
    this.initFleets();
  }

  initFleets() {
    this.playerGrid.fill(0);
    this.enemyGrid.fill(0);
    this.playerShips = [];
    this.enemyShips = [];
    this.gameState = 'PLAYER_TURN';
    this.winner = null;
    
    this.shipLengths.forEach(len => {
      this.placeShip(this.playerGrid, this.playerShips, len);
      this.placeShip(this.enemyGrid, this.enemyShips, len);
    });
  }

  placeShip(grid, fleet, length) {
    let placed = false;
    while (!placed) {
      const isVertical = Math.random() > 0.5;
      const startX = Math.floor(Math.random() * (isVertical ? this.gridSize : this.gridSize - length + 1));
      const startY = Math.floor(Math.random() * (isVertical ? this.gridSize - length + 1 : this.gridSize));
      
      const indices = [];
      let collision = false;

      for (let i = 0; i < length; i++) {
        const idx = (startY + (isVertical ? i : 0)) * this.gridSize + (startX + (isVertical ? 0 : i));
        if (grid[idx] !== 0) collision = true;
        indices.push(idx);
      }

      if (!collision) {
        indices.forEach(idx => grid[idx] = 1);
        fleet.push({ indices, hits: 0, length, destroyed: false });
        placed = true;
      }
    }
  }

  processPlayerTurn(index) {
    if (this.gameState !== 'PLAYER_TURN' || this.enemyGrid[index] > 1) return;

    this.executeStrike(this.enemyGrid, this.enemyShips, index, 'PLAYER');
    
    if (this.gameState !== 'GAME_OVER') {
      this.gameState = 'AI_TURN';
      this.notifyReact();
      
      // Decoupled AI Execution
      setTimeout(() => this.processAITurn(), 600);
    }
  }

  processAITurn() {
    if (this.gameState !== 'AI_TURN') return;

    // Simple Parity Hunt AI (Targets checkerboard pattern)
    let validIndices = [];
    for (let i = 0; i < this.totalCells; i++) {
      if (this.playerGrid[i] < 2) {
        const x = i % this.gridSize;
        const y = Math.floor(i / this.gridSize);
        if ((x + y) % 2 === 0) validIndices.push(i);
      }
    }
    
    if (validIndices.length === 0) {
      for (let i = 0; i < this.totalCells; i++) {
        if (this.playerGrid[i] < 2) validIndices.push(i);
      }
    }

    const strikeIndex = validIndices[Math.floor(Math.random() * validIndices.length)];
    this.executeStrike(this.playerGrid, this.playerShips, strikeIndex, 'AI');

    if (this.gameState !== 'GAME_OVER') {
      this.gameState = 'PLAYER_TURN';
      this.notifyReact();
    }
  }

  executeStrike(grid, fleet, index, initiator) {
    const isHit = grid[index] === 1;
    grid[index] = isHit ? 3 : 2;

    if (isHit) {
      fleet.forEach(ship => {
        if (ship.indices.includes(index)) {
          ship.hits++;
          if (ship.hits === ship.length) {
            ship.destroyed = true;
            ship.indices.forEach(idx => grid[idx] = 4); // Mark as sunk
          }
        }
      });
    }

    this.checkWinCondition();
  }

  checkWinCondition() {
    const playerLost = this.playerShips.length > 0 && this.playerShips.every(s => s.destroyed);
    const enemyLost = this.enemyShips.length > 0 && this.enemyShips.every(s => s.destroyed);

    if (playerLost || enemyLost) {
      this.gameState = 'GAME_OVER';
      this.winner = playerLost ? 'AI' : 'PLAYER';
    }
    this.notifyReact();
  }

  restart() {
    this.initFleets();
    this.notifyReact();
  }

  notifyReact() {
    // Pass cloned arrays to trigger React state updates safely
    this.onStateChange({
      playerGrid: new Int8Array(this.playerGrid),
      enemyGrid: new Int8Array(this.enemyGrid),
      gameState: this.gameState,
      winner: this.winner,
      playerShips: [...this.playerShips],
      enemyShips: [...this.enemyShips]
    });
  }
}

// ==========================================
// 2. OPTIMIZED REACT UI COMPONENTS
// ==========================================

// React.memo ensures this cell ONLY re-renders if its specific status integer changes.
const GridCell = memo(({ index, status, onClick, isEnemy }) => {
  // 0: Water, 1: Ship, 2: Miss, 3: Hit, 4: Sunk
  const getStyles = () => {
    if (status === 0) return 'bg-[#0f2e1a] hover:bg-[#1a4a2a] cursor-crosshair';
    if (status === 1) return isEnemy ? 'bg-[#0f2e1a] hover:bg-[#1a4a2a] cursor-crosshair' : 'bg-[#3b82f6]'; // Hide enemy ships
    if (status === 2) return 'bg-[#475569] flex items-center justify-center'; // Miss
    if (status === 3) return 'bg-[#ef4444] animate-pulse'; // Hit
    if (status === 4) return 'bg-[#7f1d1d] border-[#dc2626] border'; // Sunk
    return '';
  };

  return (
    <div 
      onClick={() => onClick(index)}
      className={`w-8 h-8 border border-[#0f4a20] transition-colors duration-150 relative ${getStyles()}`}
    >
      {status === 2 && <div className="w-2 h-2 rounded-full bg-white opacity-50 m-auto inset-0 absolute" />}
      {(status === 3 || status === 4) && (
        <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMCAxMCI+PHBhdGggZD0iTTAgMEwxMCAxME0xMCAwTDAgMTAiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+')] opacity-40" />
      )}
    </div>
  );
});

GridCell.displayName = 'GridCell';

export default function BattleshipApp() {
  // Force a re-render by updating an object reference
  const [uiState, setUiState] = useState({
    playerGrid: new Int8Array(100),
    enemyGrid: new Int8Array(100),
    gameState: 'PLAYER_TURN',
    winner: null,
    playerShips: [],
    enemyShips: []
  });

  // Use a ref to hold the headless engine so it survives re-renders
  const engineRef = useRef(null);

  if (!engineRef.current) {
    engineRef.current = new BattleshipEngine((newState) => setUiState(newState));
    // Trigger initial render sync
    engineRef.current.notifyReact();
  }

  // useCallback prevents re-creating the function on every render, keeping Memo safe
  const handleEnemyCellClick = useCallback((index) => {
    engineRef.current.processPlayerTurn(index);
  }, []);

  const handleRestart = useCallback(() => {
    engineRef.current.restart();
  }, []);

  const playerShipsSunk = uiState.playerShips.filter(s => s.destroyed).length;
  const enemyShipsSunk = uiState.enemyShips.filter(s => s.destroyed).length;

  return (
    <div className="min-h-screen bg-[#05110a] flex flex-col items-center justify-center p-8 font-mono text-[#4ade80] select-none">
      
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-black tracking-widest mb-2">NAVAL STRIKE FSM</h1>
        <div className="h-6">
          {uiState.gameState === 'PLAYER_TURN' && <p className="animate-pulse">&gt; AWAITING FIRING COORDINATES...</p>}
          {uiState.gameState === 'AI_TURN' && <p className="text-rose-500">&gt; ENEMY FLEET CALCULATING STRIKE...</p>}
          {uiState.gameState === 'GAME_OVER' && (
            <p className={`font-bold ${uiState.winner === 'PLAYER' ? 'text-emerald-400' : 'text-red-500'}`}>
              {uiState.winner === 'PLAYER' ? 'VICTORY ACHIEVED' : 'CRITICAL DEFEAT'}
            </p>
          )}
        </div>
      </header>

      {/* Fleet Status Metrics */}
      <div className="flex gap-12 mb-6 text-xs uppercase tracking-wider">
        <div className="flex gap-4">
          <span>Target Fleet Destroyed: <strong className="text-rose-400">{enemyShipsSunk}/5</strong></span>
        </div>
        <div className="flex gap-4">
          <span>Own Fleet Destroyed: <strong className="text-blue-400">{playerShipsSunk}/5</strong></span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-12">
        {/* Enemy Grid (Targeting Radar) */}
        <div className="flex flex-col items-center">
          <h2 className="mb-4 font-bold tracking-widest text-sm text-rose-400 border-b-2 border-rose-400 pb-1">TARGET RADAR</h2>
          <div className="grid grid-cols-10 grid-rows-10 bg-[#020a05] p-1 pixel-borders cursor-crosshair relative">
            {/* CRT Overlay Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,255,0,0.1)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] z-10" />
            
            {Array.from({ length: 100 }).map((_, i) => (
              <GridCell 
                key={`enemy-${i}`} 
                index={i} 
                status={uiState.enemyGrid[i]} 
                onClick={handleEnemyCellClick}
                isEnemy={true}
              />
            ))}
          </div>
        </div>

        {/* Player Grid (Fleet Sonar) */}
        <div className="flex flex-col items-center">
          <h2 className="mb-4 font-bold tracking-widest text-sm text-blue-400 border-b-2 border-blue-400 pb-1">FLEET SONAR</h2>
          <div className="grid grid-cols-10 grid-rows-10 bg-[#020a05] p-1 pixel-borders relative">
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,255,0,0.1)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] z-10" />
            
            {Array.from({ length: 100 }).map((_, i) => (
              <GridCell 
                key={`player-${i}`} 
                index={i} 
                status={uiState.playerGrid[i]} 
                onClick={() => {}} // Player cannot click own grid
                isEnemy={false}
              />
            ))}
          </div>
        </div>
      </div>

      {uiState.gameState === 'GAME_OVER' && (
        <button 
          onClick={handleRestart}
          className="mt-8 px-6 py-2 bg-[#0f4a20] hover:bg-[#1a6e32] text-[#4ade80] font-bold tracking-widest border border-[#4ade80] transition-all cursor-pointer pixel-borders active:translate-y-0.5"
        >
          REINITIALIZE BATTLEFIELD
        </button>
      )}

    </div>
  );
}
