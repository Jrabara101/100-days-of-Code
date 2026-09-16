import { create } from 'zustand';
import { sounds } from '../lib/audio';
import { networkHub, type PlayerRole } from '../lib/network';

export type GameId = 'SHARED_PUZZLE' | 'GRID_BATTLER' | 'REACTION_ARENA';
export type GameMode = 'ONLINE' | 'LOCAL_2P' | 'SOLO_AI';

export interface SonarPing {
  x: number;
  y: number;
  role: PlayerRole;
  id: number;
}

export interface FloatingEmote {
  emote: string;
  role: PlayerRole;
  id: number;
}

export interface RadioMessage {
  id: number;
  sender: PlayerRole;
  text: string;
  time: string;
}

interface HubState {
  gameMode: GameMode;
  roomCode: string;
  isHost: boolean;
  playerRole: PlayerRole;
  isConnected: boolean;
  opponentJoined: boolean;
  readyStates: { P1: boolean; P2: boolean };
  activeGame: GameId;
  scores: { P1: number; P2: number };
  activePing: SonarPing | null;
  activeEmote: FloatingEmote | null;
  radioFeed: RadioMessage[];
  crtFilterEnabled: boolean;
  soundMuted: boolean;

  // Actions
  setGameMode: (mode: GameMode) => void;
  setRoomInfo: (code: string, isHost: boolean, role: PlayerRole) => void;
  setConnected: (status: boolean, opponentJoined?: boolean) => void;
  setOpponentJoined: (joined: boolean) => void;
  toggleReady: (role?: PlayerRole) => void;
  setReadyStates: (ready: { P1: boolean; P2: boolean }) => void;
  selectGame: (gameId: GameId, broadcast?: boolean) => void;
  recordWin: (winner: 'P1' | 'P2') => void;
  triggerPing: (x: number, y: number, role?: PlayerRole, broadcast?: boolean) => void;
  triggerEmote: (emote: string, role?: PlayerRole, broadcast?: boolean) => void;
  sendRadioCall: (text: string, role?: PlayerRole, broadcast?: boolean) => void;
  toggleCRT: () => void;
  toggleSound: () => void;
  resetScores: () => void;
}

export const useHubStore = create<HubState>((set, get) => ({
  gameMode: 'LOCAL_2P', // Default to frictionless local 2P so games work instantly out-of-the-box!
  roomCode: 'CYBER-404',
  isHost: true,
  playerRole: 'P1',
  isConnected: true,
  opponentJoined: true,
  readyStates: { P1: false, P2: false },
  activeGame: 'SHARED_PUZZLE',
  scores: { P1: 0, P2: 0 },
  activePing: null,
  activeEmote: null,
  radioFeed: [
    { id: 1, sender: 'P1', text: 'SYSTEM ONLINE: Control Room established.', time: '09:00' }
  ],
  crtFilterEnabled: true,
  soundMuted: false,

  setGameMode: (mode) => {
    sounds.playClick(1.2);
    set({
      gameMode: mode,
      isConnected: mode !== 'ONLINE',
      opponentJoined: mode !== 'ONLINE',
      playerRole: 'P1',
    });
  },

  setRoomInfo: (code, isHost, role) => {
    set({ roomCode: code, isHost, playerRole: role });
  },

  setConnected: (isConnected, opponentJoined = true) => {
    set({ isConnected, opponentJoined });
  },

  setOpponentJoined: (joined) => {
    set({ opponentJoined: joined, isConnected: true });
  },

  toggleReady: (role) => {
    sounds.playClick(1.5);
    const currentRole = role || get().playerRole;
    const key = currentRole === 'P2' ? 'P2' : 'P1';
    const updated = {
      ...get().readyStates,
      [key]: !get().readyStates[key],
    };
    set({ readyStates: updated });

    if (get().gameMode === 'ONLINE') {
      networkHub.send({
        type: 'READY_TOGGLE',
        sender: currentRole,
        payload: updated,
        timestamp: Date.now(),
      });
    }
  },

  setReadyStates: (ready) => set({ readyStates: ready }),

  selectGame: (gameId, broadcast = true) => {
    sounds.playConduitLink();
    set({
      activeGame: gameId,
      readyStates: { P1: false, P2: false },
    });

    if (broadcast && get().gameMode === 'ONLINE') {
      networkHub.send({
        type: 'GAME_SELECT',
        sender: get().playerRole,
        payload: { gameId },
        timestamp: Date.now(),
      });
    }
  },

  recordWin: (winner) => {
    sounds.playVictory();
    set((state) => ({
      scores: {
        ...state.scores,
        [winner]: state.scores[winner] + 1,
      },
    }));
  },

  triggerPing: (x, y, role, broadcast = true) => {
    const activeRole = role || get().playerRole;
    sounds.playPing(activeRole === 'P2');
    const pingObj: SonarPing = { x, y, role: activeRole, id: Date.now() };
    set({ activePing: pingObj });

    if (broadcast && get().gameMode === 'ONLINE') {
      networkHub.send({
        type: 'PING_DROPPED',
        sender: activeRole,
        payload: { x, y },
        timestamp: Date.now(),
      });
    }
  },

  triggerEmote: (emote, role, broadcast = true) => {
    const activeRole = role || get().playerRole;
    sounds.playClick(1.8);
    const emoteObj: FloatingEmote = { emote, role: activeRole, id: Date.now() };
    set({ activeEmote: emoteObj });

    if (broadcast && get().gameMode === 'ONLINE') {
      networkHub.send({
        type: 'EMOTE_SENT',
        sender: activeRole,
        payload: { emote },
        timestamp: Date.now(),
      });
    }
  },

  sendRadioCall: (text, role, broadcast = true) => {
    const activeRole = role || get().playerRole;
    sounds.playClick(1.1);
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newMsg: RadioMessage = {
      id: Date.now(),
      sender: activeRole,
      text,
      time: timeStr,
    };

    set((state) => ({
      radioFeed: [newMsg, ...state.radioFeed.slice(0, 7)],
    }));

    if (broadcast && get().gameMode === 'ONLINE') {
      networkHub.send({
        type: 'COMMS_MESSAGE',
        sender: activeRole,
        payload: { text, time: timeStr },
        timestamp: Date.now(),
      });
    }
  },

  toggleCRT: () => {
    sounds.playClick(0.9);
    set((state) => ({ crtFilterEnabled: !state.crtFilterEnabled }));
  },

  toggleSound: () => {
    const isMuted = sounds.toggleMute();
    set({ soundMuted: isMuted });
  },

  resetScores: () => {
    sounds.playClick(0.8);
    set({ scores: { P1: 0, P2: 0 } });
  },
}));
