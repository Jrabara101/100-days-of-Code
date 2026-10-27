import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Users,
  Copy,
  Check,
  Sparkles,
  Heart,
  X,
  Share2,
  ThumbsUp,
  Gamepad2,
  Flame,
} from 'lucide-react';
import { GameTitle, SquadRoom } from '../types/game';
import { createSquadRoom, joinSquadRoom, fetchSquadRoom, voteSquadGame } from '../lib/api';
import { useStore } from '../lib/store';
import { formatPrice, cn } from '../lib/utils';
import confetti from 'canvas-confetti';

export interface SquadCartModalProps {
  coOpGames: GameTitle[];
  isOpen: boolean;
  onClose: () => void;
}

export function SquadCartModal({ coOpGames, isOpen, onClose }: SquadCartModalProps) {
  const [username, setUsername] = useState('Alex');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [swipeIndex, setSwipeIndex] = useState(0);

  const squadRoom = useStore((s) => s.squadRoom);
  const setSquadRoom = useStore((s) => s.setSquadRoom);
  const setSelectedGame = useStore((s) => s.setSelectedGame);

  // Poll room updates if code exists
  const { data: liveRoom } = useQuery<SquadRoom>({
    queryKey: ['squad', squadRoom?.code],
    queryFn: () => fetchSquadRoom(squadRoom!.code),
    enabled: !!squadRoom?.code && isOpen,
    refetchInterval: 3000,
  });

  const activeRoom = liveRoom || squadRoom;

  // Create room mutation
  const createMutation = useMutation({
    mutationFn: (user: string) => createSquadRoom(user),
    onSuccess: (room) => {
      setSquadRoom(room);
      confetti({ particleCount: 50, spread: 60 });
    },
  });

  // Join room mutation
  const joinMutation = useMutation({
    mutationFn: ({ code, user }: { code: string; user: string }) => joinSquadRoom(code, user),
    onSuccess: (room) => {
      setSquadRoom(room);
      confetti({ particleCount: 50, spread: 60 });
    },
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: ({ gameId, vote }: { gameId: string; vote: 'yes' | 'no' }) =>
      voteSquadGame(activeRoom!.code, username, gameId, vote),
    onSuccess: (updatedRoom) => {
      setSquadRoom(updatedRoom);
      if (updatedRoom.overlapMatches.length > (activeRoom?.overlapMatches.length || 0)) {
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
      }
    },
  });

  const handleVote = (vote: 'yes' | 'no') => {
    if (!currentCoOpGame || !activeRoom) return;
    voteMutation.mutate({ gameId: currentCoOpGame.id, vote });
    setSwipeIndex((prev) => (prev + 1) % coOpGames.length);
  };

  const copyLink = () => {
    if (!activeRoom) return;
    navigator.clipboard.writeText(activeRoom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const currentCoOpGame = coOpGames[swipeIndex] || coOpGames[0];
  const overlapGames = coOpGames.filter((g) => activeRoom?.overlapMatches?.includes(g.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl glass-popover rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 z-10 text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#101622]/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#3B82F6] flex items-center justify-center text-white">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white">
                SQUAD CART // Co-Op Matcher Deck
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Swipe with your party on co-op games to find overlapping games everyone wants to play!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Manager / Header Bar */}
        {activeRoom ? (
          <div className="p-4 sm:px-6 bg-[#080B11] border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[#94A3B8]">SQUAD ROOM:</span>
              <span className="px-3 py-1 rounded-lg bg-[#192234] border border-[#06B6D4]/40 font-mono font-extrabold text-lg tracking-widest text-[#38BDF8]">
                {activeRoom.code}
              </span>
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 text-xs font-mono text-[#94A3B8] hover:text-white bg-[#192234] px-2.5 py-1 rounded-md border border-white/5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Code Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#94A3B8]">Party Members ({activeRoom.members.length}):</span>
              <div className="flex -space-x-1.5">
                {activeRoom.members.map((m, i) => (
                  <span
                    key={i}
                    title={m}
                    className="w-7 h-7 rounded-full bg-[#1E293B] border border-white/20 flex items-center justify-center text-[11px] font-mono font-bold text-white shadow"
                  >
                    {m.charAt(0).toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Create or Join Room Form */
          <div className="p-6 bg-[#080B11] border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your Nickname"
                className="bg-[#192234] text-xs font-mono text-white border border-white/10 rounded-lg px-3 py-2 w-36 focus:outline-none focus:border-[#06B6D4]"
              />
              <button
                onClick={() => createMutation.mutate(username)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] text-white text-xs font-mono font-bold shadow-md hover:scale-102 transition-all"
              >
                + Create Squad Room
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={4}
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="4-CHAR CODE"
                className="bg-[#192234] text-xs font-mono text-white border border-white/10 rounded-lg px-3 py-2 w-32 uppercase tracking-widest text-center focus:outline-none focus:border-[#06B6D4]"
              />
              <button
                onClick={() => joinMutation.mutate({ code: joinCodeInput, user: username })}
                className="px-4 py-2 rounded-lg bg-[#192234] hover:bg-[#1E293B] text-white text-xs font-mono font-bold border border-white/10"
              >
                Join
              </button>
            </div>
          </div>
        )}

        {/* Main Swiper & Overlap Tray */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Swiping Card (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            <span className="text-xs font-mono text-[#94A3B8] font-bold block uppercase">
              Swipe Co-Op Candidate ({swipeIndex + 1}/{coOpGames.length}):
            </span>

            {currentCoOpGame ? (
              <div className="p-4 rounded-xl bg-[#101622] border border-white/10 space-y-3">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                  <img
                    src={currentCoOpGame.media.heroBannerUrl}
                    alt={currentCoOpGame.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10">
                    <span className="text-xs font-mono font-bold text-white bg-black/70 px-2.5 py-0.5 rounded backdrop-blur-md">
                      {formatPrice(currentCoOpGame.priceCents)}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-black/70 px-2.5 py-0.5 rounded backdrop-blur-md">
                      {currentCoOpGame.reviewSummary.allTimeScore}% Positive
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-display font-bold text-lg text-white">
                    {currentCoOpGame.title}
                  </h4>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    {currentCoOpGame.tags.map((t) => t.name).join(' • ')}
                  </p>
                </div>

                {/* Swipe Yes / No Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleVote('no')}
                    className="flex-1 py-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-mono font-bold text-xs border border-rose-500/30 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <X className="w-4 h-4 text-rose-400" />
                    <span>Pass</span>
                  </button>

                  <button
                    onClick={() => handleVote('yes')}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-xs border border-emerald-400/50 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all hover:scale-102"
                  >
                    <ThumbsUp className="w-4 h-4 text-white" />
                    <span>Want to Play!</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs font-mono text-[#94A3B8]">No co-op titles in rotation.</p>
            )}
          </div>

          {/* Right: Overlap Matches Tray (5 cols) */}
          <div className="md:col-span-5 space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#38BDF8] flex items-center gap-1.5 uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
                OVERLAPPING SQUAD MATCHES:
              </span>
              <span className="text-xs font-mono text-[#94A3B8]">
                {overlapGames.length} Overlapping
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[320px] pr-1">
              {overlapGames.length === 0 ? (
                <div className="p-8 text-center text-[#94A3B8] font-mono text-xs border border-dashed border-white/10 rounded-xl bg-[#101622]/50">
                  <Flame className="w-6 h-6 mx-auto text-[#06B6D4] opacity-40 mb-2" />
                  <span>No mutual matches yet. Keep swiping to find titles all party members want!</span>
                </div>
              ) : (
                overlapGames.map((game) => (
                  <div
                    key={game.id}
                    onClick={() => {
                      onClose();
                      setSelectedGame(game);
                    }}
                    className="p-3 rounded-xl bg-[#192234] border border-[#06B6D4]/40 hover:border-[#06B6D4] cursor-pointer transition-all flex items-center gap-3 shadow-md glow-cyan"
                  >
                    <img
                      src={game.media.capsuleUrl}
                      alt={game.title}
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-display font-bold text-sm text-white truncate">
                        {game.title}
                      </h5>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold block mt-0.5">
                        ✓ Everyone in squad wants this!
                      </span>
                      <span className="text-xs font-mono text-[#94A3B8]">
                        {formatPrice(game.priceCents)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
