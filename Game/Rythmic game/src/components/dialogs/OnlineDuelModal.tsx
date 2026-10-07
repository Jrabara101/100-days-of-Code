import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Users, Wifi, Swords, CheckCircle2 } from 'lucide-react';

interface OnlineDuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  onSetPlayerName: (name: string) => void;
  currentRoomId: string;
  onSetRoomId: (id: string) => void;
  isConnected: boolean;
  playerCount: number;
}

export const OnlineDuelModal: React.FC<OnlineDuelModalProps> = ({
  isOpen,
  onClose,
  playerName,
  onSetPlayerName,
  currentRoomId,
  onSetRoomId,
  isConnected,
  playerCount,
}) => {
  const [inputName, setInputName] = useState(playerName);
  const [inputRoom, setInputRoom] = useState(currentRoomId);

  const handleApply = () => {
    onSetPlayerName(inputName || 'CYBER_TAPPER');
    onSetRoomId(inputRoom || 'CYBER_ARENA_1');
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Real-Time Room Duels"
      description="WebSocket matchmaking & live score telemetry relay"
      className="max-w-md"
    >
      <div className="flex flex-col gap-5 py-2">
        {/* Connection status indicator */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-surface-mid/80 border border-white/10">
          <div className="flex items-center gap-2">
            <Wifi className={`w-4 h-4 ${isConnected ? 'text-emerald-400' : 'text-gray-500'}`} />
            <span className="font-mono text-xs font-bold">
              SOCKET STATUS: {isConnected ? 'CONNECTED' : 'STANDBY'}
            </span>
          </div>
          <Badge variant={isConnected ? 'emerald' : 'outline'}>
            {playerCount} PILOT{playerCount === 1 ? '' : 'S'} IN ARENA
          </Badge>
        </div>

        {/* Player Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono text-gray-300">CALLSIGN / PLAYER HANDLE</label>
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            className="bg-surface-mid border border-white/15 px-3 py-2 rounded-lg font-mono text-sm text-white focus:outline-none focus:border-primary"
            placeholder="e.g. CYBER_VALKYRIE"
          />
        </div>

        {/* Room Code */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono text-gray-300">DUEL ROOM CODE</label>
          <input
            type="text"
            value={inputRoom}
            onChange={(e) => setInputRoom(e.target.value.toUpperCase())}
            className="bg-surface-mid border border-white/15 px-3 py-2 rounded-lg font-mono text-sm text-primary font-bold focus:outline-none focus:border-primary"
            placeholder="CYBER_ARENA_1"
          />
          <span className="text-[11px] font-mono text-gray-400">
            Share this room code with a friend to duel live side-by-side!
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleApply}>
            <Swords className="w-4 h-4 mr-1.5" /> Join Duel Room
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
