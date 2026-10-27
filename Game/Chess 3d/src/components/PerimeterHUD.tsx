import React, { useState } from 'react';
import { Copy, Check, MessageSquare, Mic, AlertCircle, Sparkles } from 'lucide-react';
import { CapturedPieces } from '../chess/ChessEngine';
import { PieceSymbol } from 'chess.js';

interface PerimeterHUDProps {
  whiteName: string;
  blackName: string;
  whiteTime: number; // in seconds
  blackTime: number; // in seconds
  turn: 'w' | 'b';
  capturedPieces: CapturedPieces;
  isCheck: boolean;
  isCheckmate: boolean;
  gameStatusText?: string;
  isOnline: boolean;
  roomId?: string;
  whiteIsSpeaking?: boolean;
  blackIsSpeaking?: boolean;
  onToggleChat?: () => void;
  unreadChatCount?: number;
}

const PIECE_UNICODE: Record<PieceSymbol, { w: string; b: string }> = {
  p: { w: '♟', b: '♙' },
  n: { w: '♞', b: '♘' },
  b: { w: '♝', b: '♗' },
  r: { w: '♜', b: '♖' },
  q: { w: '♛', b: '♕' },
  k: { w: '♚', b: '♔' },
};

export const PerimeterHUD: React.FC<PerimeterHUDProps> = ({
  whiteName,
  blackName,
  whiteTime,
  blackTime,
  turn,
  capturedPieces,
  isCheck,
  isCheckmate,
  gameStatusText,
  isOnline,
  roomId,
  whiteIsSpeaking,
  blackIsSpeaking,
  onToggleChat,
  unreadChatCount = 0,
}) => {
  const [copied, setCopied] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.floor(Math.max(0, seconds) % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyRoom = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="absolute inset-x-0 top-0 z-20 pointer-events-none p-3 sm:p-5 flex flex-col justify-between">
      {/* Top Header Row */}
      <div className="flex items-start justify-between w-full">
        {/* White Player Card (Top-Left) */}
        <div
          className={`pointer-events-auto flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-[#0a0f1d]/90 border transition-all shadow-xl shadow-black/60 ${
            turn === 'w'
              ? 'border-amber-400/90 ring-1 ring-amber-400/40'
              : 'border-slate-800/80'
          }`}
        >
          {/* White Piece Avatar Icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-slate-100 to-slate-200 border border-amber-300/60 flex items-center justify-center text-slate-950 font-bold shadow-md shrink-0">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-slate-900 fill-current">
              <path d="M12 2l1.2 2.2 2.5-.2-1.3 2.1 1.6 2-2.5.4-.5 2.5-.5-2.5-2.5-.4 1.6-2-1.3-2.1 2.5.2L12 2zm-5 11h10v2H7v-2zm-1 3h12v3H6v-3z" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-100 truncate max-w-[120px] sm:max-w-[160px]">
                {whiteName}
              </span>
              {whiteIsSpeaking && (
                <span className="p-0.5 rounded bg-emerald-500/20 text-emerald-400" title="Speaking">
                  <Mic className="w-3 h-3 animate-pulse" />
                </span>
              )}
            </div>

            {/* Captured Pieces by White & Material Advantage */}
            <div className="flex items-center gap-1 mt-0.5">
              <div className="flex text-xs text-slate-400 tracking-tight">
                {capturedPieces.b.map((p, idx) => (
                  <span key={idx} className="opacity-90">{PIECE_UNICODE[p].b}</span>
                ))}
              </div>
              {capturedPieces.scoreDiff > 0 && (
                <span className="text-[10px] font-mono-code font-bold text-emerald-400 ml-1">
                  +{capturedPieces.scoreDiff}
                </span>
              )}
            </div>
          </div>

          {/* Clock */}
          <div
            className={`ml-2 px-2.5 py-1 rounded-lg font-mono-code text-sm sm:text-base font-bold tabular-nums tracking-wider ${
              turn === 'w'
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                : 'bg-slate-900/80 text-slate-400 border border-slate-800'
            }`}
          >
            {formatTime(whiteTime)}
          </div>
        </div>

        {/* Center Room Code & Status Alert */}
        <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
          {isOnline && roomId && (
            <button
              type="button"
              onClick={handleCopyRoom}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0e1626]/90 border border-slate-700/80 text-xs font-mono-code text-slate-300 hover:text-white hover:border-amber-400 transition-all cursor-pointer shadow-lg"
              title="Click to copy room code"
            >
              <span className="text-slate-400">ROOM:</span>
              <span className="font-bold text-amber-300">{roomId}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          )}

          {/* Status banner (Check, Checkmate, etc.) */}
          {isCheck && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/60 text-red-300 text-xs font-semibold shadow-lg animate-bounce">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span>{isCheckmate ? 'CHECKMATE!' : 'CHECK!'}</span>
            </div>
          )}

          {gameStatusText && !isCheck && (
            <div className="px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-mono-code text-slate-400">
              {gameStatusText}
            </div>
          )}
        </div>

        {/* Black Player Card (Top-Right) */}
        <div
          className={`pointer-events-auto flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-[#0a0f1d]/90 border transition-all shadow-xl shadow-black/60 ${
            turn === 'b'
              ? 'border-amber-400/90 ring-1 ring-amber-400/40'
              : 'border-slate-800/80'
          }`}
        >
          {/* Clock */}
          <div
            className={`mr-2 px-2.5 py-1 rounded-lg font-mono-code text-sm sm:text-base font-bold tabular-nums tracking-wider ${
              turn === 'b'
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                : 'bg-slate-900/80 text-slate-400 border border-slate-800'
            }`}
          >
            {formatTime(blackTime)}
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              {blackIsSpeaking && (
                <span className="p-0.5 rounded bg-emerald-500/20 text-emerald-400" title="Speaking">
                  <Mic className="w-3 h-3 animate-pulse" />
                </span>
              )}
              <span className="text-xs sm:text-sm font-bold text-slate-100 truncate max-w-[120px] sm:max-w-[160px]">
                {blackName}
              </span>
            </div>

            {/* Captured Pieces by Black & Material Advantage */}
            <div className="flex items-center justify-end gap-1 mt-0.5">
              {capturedPieces.scoreDiff < 0 && (
                <span className="text-[10px] font-mono-code font-bold text-emerald-400 mr-1">
                  +{Math.abs(capturedPieces.scoreDiff)}
                </span>
              )}
              <div className="flex text-xs text-slate-400 tracking-tight">
                {capturedPieces.w.map((p, idx) => (
                  <span key={idx} className="opacity-90">{PIECE_UNICODE[p].w}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Black Piece Avatar Icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700 flex items-center justify-center text-slate-100 font-bold shadow-md shrink-0">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-amber-400 fill-current">
              <path d="M12 2l1.2 2.2 2.5-.2-1.3 2.1 1.6 2-2.5.4-.5 2.5-.5-2.5-2.5-.4 1.6-2-1.3-2.1 2.5.2L12 2zm-5 11h10v2H7v-2zm-1 3h12v3H6v-3z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Floating Chat Button for Online matches */}
      {isOnline && onToggleChat && (
        <div className="absolute top-20 right-4 pointer-events-auto">
          <button
            type="button"
            onClick={onToggleChat}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0c1322]/90 border border-slate-700 hover:border-amber-400 text-slate-200 text-xs font-semibold shadow-xl transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>Chat</span>
            {unreadChatCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-mono-code text-[10px] font-bold flex items-center justify-center">
                {unreadChatCount}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
