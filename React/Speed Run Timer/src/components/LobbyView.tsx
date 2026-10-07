import React, { useState } from 'react';
import { 
  MultiplayerRaceState, 
  RaceParticipant 
} from '../types/race';
import { Button, Badge, Card, Modal } from './ui/primitives';
import { generateQrSvg } from '../utils/qrGenerator';
import { 
  Copy, 
  Check, 
  QrCode, 
  Play, 
  Users, 
  Bot, 
  Sparkles, 
  Layers, 
  Crown, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

interface LobbyViewProps {
  raceState: MultiplayerRaceState;
  myPlayerId: string;
  onToggleReady: () => void;
  onStartCountdown: () => void;
  onChangeCategory: (templateId: string) => void;
  onAddGhost: (ghostType: 'WR' | 'PB' | 'DEV_TARGET') => void;
  onRemoveGhost: (ghostId: string) => void;
  onOpenTemplatesModal: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  raceState,
  myPlayerId,
  onToggleReady,
  onStartCountdown,
  onChangeCategory,
  onAddGhost,
  onRemoveGhost,
  onOpenTemplatesModal,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const isHost = raceState.hostPlayerId === myPlayerId;
  const myParticipant = raceState.participants.find(p => p.playerId === myPlayerId);
  const allReady = raceState.participants.every(p => p.isReady);

  const inviteUrl = `${window.location.origin}/?room=${raceState.roomCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Hero Lobby Card */}
      <Card className="p-6 border-neon-cyan/30 shadow-glow-cyan/10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-obsidian-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="cyan">INSTANT RACE LOBBY</Badge>
              <Badge variant="slate">MONOTONIC TIME SYNC ACTIVE</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-100">
              {raceState.gameTitle}
            </h1>
            <p className="text-sm font-mono text-neon-cyan/90 font-medium">
              Category: {raceState.categoryName} ({raceState.segments.length} Segments)
            </p>
          </div>

          {/* 4-Character Room PIN & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-obsidian-void p-2.5 rounded-[4px] border border-obsidian-border text-center">
              <span className="text-[10px] font-mono uppercase text-slate-400 block tracking-widest">
                ROOM PIN
              </span>
              <span className="text-2xl font-black font-mono text-neon-gold tracking-widest">
                {raceState.roomCode}
              </span>
            </div>

            <Button
              variant="secondary"
              size="md"
              onClick={handleCopyLink}
              className="flex items-center gap-2"
            >
              {copiedLink ? <Check className="h-4 w-4 text-neon-emerald" /> : <Copy className="h-4 w-4" />}
              {copiedLink ? 'COPIED LINK!' : 'COPY INVITE URL'}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowQrModal(true)}
              title="Show QR Code for Mobile Racers"
            >
              <QrCode className="h-4 w-4 text-neon-cyan" />
            </Button>
          </div>
        </div>

        {/* Category Quick Presets (Host Controls) */}
        {isHost && (
          <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-neon-cyan" />
              <span className="text-slate-300 font-bold">SWITCH CATEGORY:</span>
              <button
                onClick={() => onChangeCategory('apex-cyber-runner')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  raceState.gameTitle === 'Apex Cyber-Runner' 
                    ? 'bg-neon-cyan text-obsidian-void font-bold' 
                    : 'bg-obsidian-void text-slate-400 hover:text-slate-200 border border-obsidian-border'
                }`}
              >
                Apex Cyber-Runner
              </button>
              <button
                onClick={() => onChangeCategory('sm64-16-star')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  raceState.gameTitle === 'Super Mario 64' 
                    ? 'bg-neon-cyan text-obsidian-void font-bold' 
                    : 'bg-obsidian-void text-slate-400 hover:text-slate-200 border border-obsidian-border'
                }`}
              >
                SM64 16 Star
              </button>
              <button
                onClick={() => onChangeCategory('celeste-any-percent')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  raceState.gameTitle === 'Celeste' 
                    ? 'bg-neon-cyan text-obsidian-void font-bold' 
                    : 'bg-obsidian-void text-slate-400 hover:text-slate-200 border border-obsidian-border'
                }`}
              >
                Celeste Any%
              </button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenTemplatesModal}
              className="text-neon-gold hover:text-amber-300"
            >
              + Custom / LiveSplit .LSS
            </Button>
          </div>
        )}
      </Card>

      {/* Participant Grid & Ghost Setup */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Participants Ready-Check (2 Columns) */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono px-1">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-neon-cyan" />
              <span className="font-bold text-slate-200">
                ACTIVE RACERS ({raceState.participants.length})
              </span>
            </div>
            <span className="text-slate-400">
              {raceState.participants.filter(p => p.isReady).length} / {raceState.participants.length} Ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {raceState.participants.map((p) => {
              const isMe = p.playerId === myPlayerId;

              return (
                <div
                  key={p.playerId}
                  className={`p-3.5 rounded-[4px] bg-obsidian-surface border transition-all flex items-center justify-between ${
                    p.isReady
                      ? 'border-neon-emerald/50 bg-neon-emerald/5 shadow-glow-emerald/10'
                      : 'border-obsidian-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={p.avatarUrl}
                      alt={p.username}
                      className="h-9 w-9 rounded-full bg-obsidian-void border border-obsidian-border"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-100">
                        <span>{p.username}</span>
                        {p.isHost && <Crown className="h-3.5 w-3.5 text-neon-gold fill-neon-gold" />}
                        {p.isGhost && <Bot className="h-3.5 w-3.5 text-neon-purple" />}
                        {isMe && <span className="text-[10px] text-neon-cyan">(YOU)</span>}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block">
                        {p.isGhost ? 'Asynchronous Telemetry Ghost' : 'Verified Monotonic Client'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.isReady ? (
                      <Badge variant="emerald" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        READY
                      </Badge>
                    ) : (
                      <Badge variant="slate">NOT READY</Badge>
                    )}

                    {p.isGhost && isHost && (
                      <button
                        onClick={() => onRemoveGhost(p.playerId)}
                        className="text-slate-500 hover:text-neon-ruby p-1 text-xs"
                        title="Remove Ghost"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ghost Dual Telemetry Sidebar */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200 px-1">
            <Sparkles className="h-4 w-4 text-neon-gold" />
            <span>PACING GHOST DUELS</span>
          </div>

          <Card className="p-4 space-y-3 text-xs font-mono">
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Race alongside live telemetry pacing markers without waiting for a live opponent:
            </p>

            <div className="space-y-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start text-[11px] border-neon-purple/40 hover:border-neon-purple"
                onClick={() => onAddGhost('WR')}
              >
                <Bot className="h-3.5 w-3.5 mr-2 text-neon-purple" />
                + World Record Ghost
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start text-[11px] border-neon-gold/40 hover:border-neon-gold"
                onClick={() => onAddGhost('PB')}
              >
                <Bot className="h-3.5 w-3.5 mr-2 text-neon-gold" />
                + Personal Best Ghost
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start text-[11px]"
                onClick={() => onAddGhost('DEV_TARGET')}
              >
                <Bot className="h-3.5 w-3.5 mr-2 text-neon-cyan" />
                + Target Pacer Ghost
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Lobby Bottom Actions Bar */}
      <div className="p-4 rounded-[4px] bg-obsidian-surface border border-obsidian-border flex flex-wrap items-center justify-between gap-4">
        {/* Toggle Ready Button */}
        <Button
          variant={myParticipant?.isReady ? 'secondary' : 'primary'}
          size="lg"
          onClick={onToggleReady}
          className="font-mono tracking-widest font-black"
        >
          {myParticipant?.isReady ? 'UNREADY' : 'READY UP [PRESS TO CONFIRM]'}
        </Button>

        {/* Start Synchronized Race (Host Only) */}
        {isHost ? (
          <Button
            variant="gold"
            size="lg"
            onClick={onStartCountdown}
            disabled={!allReady}
            className="font-mono tracking-widest font-black shadow-glow-gold"
          >
            <Play className="h-4 w-4 mr-2 fill-obsidian-void" />
            START SYNCHRONIZED RACE (3s)
          </Button>
        ) : (
          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <Clock className="h-4 w-4 animate-spin text-neon-cyan" />
            <span>Awaiting host to initiate synchronized countdown...</span>
          </div>
        )}
      </div>

      {/* QR Code Dialog Modal */}
      <Modal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title="Scan QR Code to Join Race"
        subtitle={`Room PIN: ${raceState.roomCode} // Point smartphone camera to enter instantly`}
      >
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div
            dangerouslySetInnerHTML={{
              __html: generateQrSvg(inviteUrl, 220),
            }}
          />
          <div className="text-xs font-mono text-slate-300">
            <span>Invite URL: </span>
            <span className="text-neon-cyan underline break-all">{inviteUrl}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={handleCopyLink}>
            {copiedLink ? 'Copied!' : 'Copy Direct Link'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
