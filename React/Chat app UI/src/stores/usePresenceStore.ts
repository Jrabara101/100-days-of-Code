import { create } from 'zustand';
import type { TypingWhisper, User } from '../types/chat';
import { CURRENT_USER_ID } from '../lib/constants';

interface PresenceState {
  currentUserId: string;
  usersById: Record<string, User>;
  whispers: Record<string, TypingWhisper[]>;
  connectionState: 'live' | 'connecting' | 'offline';
  simulatedOffline: boolean;

  setUsers: (users: User[]) => void;
  upsertUser: (user: User) => void;
  addWhisper: (whisper: TypingWhisper) => void;
  pruneWhispers: () => void;
  setConnectionState: (state: 'live' | 'connecting' | 'offline') => void;
  setSimulatedOffline: (offline: boolean) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  currentUserId: CURRENT_USER_ID,
  usersById: {},
  whispers: {},
  connectionState: 'connecting',
  simulatedOffline: false,

  setUsers: (users) => {
    const map: Record<string, User> = {};
    for (const u of users) map[u.id] = u;
    set({ usersById: map });
  },

  upsertUser: (user) =>
    set((s) => ({
      usersById: { ...s.usersById, [user.id]: user },
    })),

  addWhisper: (whisper) =>
    set((s) => {
      const existing = s.whispers[whisper.conversationId] ?? [];
      const filtered = existing.filter(
        (w) => w.userId !== whisper.userId && w.expiresAt > Date.now()
      );
      return {
        whispers: {
          ...s.whispers,
          [whisper.conversationId]: [...filtered, whisper],
        },
      };
    }),

  pruneWhispers: () =>
    set((s) => {
      const now = Date.now();
      let changed = false;
      const next: Record<string, TypingWhisper[]> = {};
      for (const [cid, list] of Object.entries(s.whispers)) {
        const valid = list.filter((w) => w.expiresAt > now);
        if (valid.length !== list.length) changed = true;
        if (valid.length > 0) next[cid] = valid;
      }
      return changed ? { whispers: next } : s;
    }),

  setConnectionState: (connectionState) => set({ connectionState }),
  setSimulatedOffline: (simulatedOffline) => set({ simulatedOffline }),
}));
