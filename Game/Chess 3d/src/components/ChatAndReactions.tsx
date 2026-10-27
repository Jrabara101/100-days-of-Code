import React, { useState } from 'react';
import { Send, MessageSquare, X, Smile, Copy, Check, Sparkles, Brain, ArrowRight, Eye, Play } from 'lucide-react';
import { ChatMessage, ReactionItem } from '../multiplayer/MultiplayerClient';
import { TacticalAnalysis } from '../chess/ChessEngine';
import { sounds } from '../audio/SoundEffects';

interface ChatAndReactionsProps {
  isChatOpen: boolean;
  onCloseChat: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
  activeReactions: ReactionItem[];
  isOnline: boolean;
  moveHistory: string[];
  isHistoryOpen: boolean;
  onCloseHistory: () => void;
  // Best Move Tactical Analysis
  analysis: TacticalAnalysis | null;
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
  onShowMoveOnBoard: (from: string, to: string) => void;
  onApplySuggestedMove?: (from: string, to: string, promotion?: string) => void;
  canExecuteMove?: boolean;
}

const EMOJIS = ['👑', '🔥', '🧠', '👏', '😮', '🎉', '♟️'];

export const ChatAndReactions: React.FC<ChatAndReactionsProps> = ({
  isChatOpen,
  onCloseChat,
  messages,
  onSendMessage,
  onSendReaction,
  activeReactions,
  isOnline,
  moveHistory,
  isHistoryOpen,
  onCloseHistory,
  analysis,
  isAnalyzing,
  onRunAnalysis,
  onShowMoveOnBoard,
  onApplySuggestedMove,
  canExecuteMove = true,
}) => {
  const [inputText, setInputText] = useState('');
  const [pgnCopied, setPgnCopied] = useState(false);
  const [isHighlightingOnBoard, setIsHighlightingOnBoard] = useState(false);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleReactionClick = (emoji: string) => {
    onSendReaction(emoji);
    sounds.playReactionPop();
  };

  const handleCopyPGN = () => {
    let pgn = '';
    for (let i = 0; i < moveHistory.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = moveHistory[i];
      const blackMove = moveHistory[i + 1] || '';
      pgn += `${moveNum}. ${whiteMove} ${blackMove}  `;
    }
    navigator.clipboard.writeText(pgn.trim());
    setPgnCopied(true);
    setTimeout(() => setPgnCopied(false), 2000);
  };

  const handleShowMove = (from: string, to: string) => {
    onShowMoveOnBoard(from, to);
    setIsHighlightingOnBoard(true);
    sounds.playSelect();
  };

  return (
    <>
      {/* Floating Animated Reaction Bursts */}
      <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
        {activeReactions.map((r) => (
          <div
            key={r.id}
            className="absolute transition-all duration-1000 transform -translate-x-1/2 flex flex-col items-center animate-fade-up-burst"
            style={{
              left: `${r.x}%`,
              bottom: `${r.y}%`,
            }}
          >
            <div className="text-4xl sm:text-5xl drop-shadow-lg filter">{r.emoji}</div>
            <span className="text-[10px] font-mono-code font-bold text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded-full border border-amber-400/40 mt-1 shadow-md">
              {r.sender}
            </span>
          </div>
        ))}
      </div>

      {/* Quick Reaction Bar */}
      <div className="fixed bottom-28 right-4 z-20 pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#0c1322]/90 border border-slate-800 shadow-xl shadow-black/60 select-none">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleReactionClick(emoji)}
            className="w-8 h-8 rounded-xl hover:bg-slate-800 flex items-center justify-center text-lg hover:scale-125 transition-transform cursor-pointer"
            title={`React ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* In-Game Chat Side Drawer */}
      {isChatOpen && (
        <div className="fixed top-20 right-4 z-30 w-80 max-w-[90vw] h-[480px] bg-[#0c1322]/95 border border-slate-700/90 rounded-2xl p-4 shadow-2xl shadow-black/80 flex flex-col pointer-events-auto select-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-slate-100">Room Chat</span>
            </div>
            <button
              onClick={onCloseChat}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 text-center font-mono-code">
                No chat messages yet.<br />Say hello or react!
              </div>
            ) : (
              messages.map((m, idx) => (
                <div key={idx} className="p-2 rounded-xl bg-[#131b2e] border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={`font-semibold ${
                        m.senderRole === 'white'
                          ? 'text-amber-300'
                          : m.senderRole === 'black'
                          ? 'text-sky-300'
                          : 'text-purple-300'
                      }`}
                    >
                      {m.sender}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono-code">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-slate-200 break-words">{m.text}</div>
                </div>
              ))
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="mt-2.5 pt-2 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Send message..."
              maxLength={200}
              className="flex-1 px-3 py-1.5 rounded-xl bg-[#131b2e] border border-slate-700/80 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Move History, PGN & Best Move Analysis Drawer */}
      {isHistoryOpen && (
        <div className="fixed top-20 left-4 z-30 w-84 max-w-[92vw] h-[520px] bg-[#0c1322]/95 border border-slate-700/90 rounded-2xl p-4 shadow-2xl shadow-black/80 flex flex-col pointer-events-auto select-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5">
            <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>Match History</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyPGN}
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Copy PGN notation"
              >
                {pgnCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onCloseHistory}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dedicated Best Move Analysis Section */}
          <div className="mb-3 p-3 rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/40 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Best Move Analysis</span>
              </div>
              <button
                type="button"
                onClick={onRunAnalysis}
                disabled={isAnalyzing}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Brain className="w-3 h-3" />
                <span>{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
              </button>
            </div>

            {/* Analysis Result Card */}
            {analysis ? (
              <div className="space-y-2 mt-2 pt-2 border-t border-emerald-900/40 text-xs">
                {/* Top Row: Suggested Move & Eval text */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono-code text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-emerald-200">
                      {analysis.bestMove.san}
                    </span>
                    <span className="text-[11px] font-mono-code text-slate-400">
                      ({analysis.bestMove.from} → {analysis.bestMove.to})
                    </span>
                  </div>
                  <span className="text-[11px] font-mono-code font-semibold text-emerald-300">
                    {analysis.evalText}
                  </span>
                </div>

                {/* Centipawn Evaluation Bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-slate-100 transition-all duration-300"
                    style={{ width: `${analysis.evalBarPercent}%` }}
                    title="White vs Black Evaluation"
                  />
                  <div
                    className="h-full bg-slate-900 transition-all duration-300 flex-1"
                  />
                </div>

                {/* Tactical Feedback Summary */}
                <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
                  💡 {analysis.tacticalSummary}
                </p>

                {/* Strategic points */}
                {analysis.tacticalPoints.map((pt, i) => (
                  <div key={i} className="text-[10px] text-slate-400 flex items-start gap-1">
                    <span className="text-emerald-400">▸</span>
                    <span>{pt}</span>
                  </div>
                ))}

                {/* Actions: Show on 3D board & Apply Move */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleShowMove(analysis.bestMove.from, analysis.bestMove.to)}
                    className="flex-1 py-1 rounded-lg bg-[#142426] border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 font-semibold text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Show on 3D Board</span>
                  </button>

                  {canExecuteMove && onApplySuggestedMove && (
                    <button
                      type="button"
                      onClick={() => onApplySuggestedMove(analysis.bestMove.from, analysis.bestMove.to, analysis.bestMove.promotion)}
                      className="flex-1 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Play className="w-3 h-3" />
                      <span>Play Move</span>
                    </button>
                  )}
                </div>

                {/* Alternative moves */}
                {analysis.alternatives.length > 0 && (
                  <div className="pt-1 border-t border-slate-800/80">
                    <span className="text-[10px] font-mono-code text-slate-400 block mb-1">
                      Candidate Lines:
                    </span>
                    <div className="flex gap-2">
                      {analysis.alternatives.map((alt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleShowMove(alt.from, alt.to)}
                          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 hover:border-emerald-400/60 text-[10px] font-mono-code text-slate-300 transition-colors cursor-pointer"
                        >
                          {alt.san}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 leading-snug">
                Click <span className="text-emerald-300 font-semibold">Analyze</span> to evaluate the current board state and receive optimal tactical advice.
              </p>
            )}
          </div>

          {/* Move pairs table */}
          <div className="flex-1 overflow-y-auto space-y-1 font-mono-code text-xs pr-1">
            {moveHistory.length === 0 ? (
              <div className="h-28 flex items-center justify-center text-slate-400 text-center text-xs">
                Match started.<br />Make the first move!
              </div>
            ) : (
              Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, idx) => {
                const moveNum = idx + 1;
                const whiteMove = moveHistory[idx * 2];
                const blackMove = moveHistory[idx * 2 + 1];

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#121a2d]/60 border border-slate-800/40"
                  >
                    <span className="text-slate-400 w-8">{moveNum}.</span>
                    <span className="text-amber-300 font-semibold w-24 text-left">{whiteMove}</span>
                    <span className="text-sky-300 font-semibold w-24 text-left">{blackMove || '...'}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
};
