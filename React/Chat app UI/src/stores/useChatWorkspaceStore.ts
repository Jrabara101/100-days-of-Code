import { create } from 'zustand';
import { idbStorage } from '../lib/idb';
import type {
  DraftData,
  InboxFilterLens,
  MediaAttachment,
  PrimaryZone,
  RightPaneMode,
  User,
} from '../types/chat';

export interface ActiveCallState {
  conversationId: string;
  title: string;
  participants: User[];
  mode: 'audio' | 'video';
  startedAt: number;
}

export interface ToastItem {
  id: string;
  text: string;
  tone?: 'info' | 'success' | 'warning';
}

interface ChatWorkspaceState {
  theme: 'dark' | 'light';
  activeZone: PrimaryZone;
  activeConversationId: string | null;
  rightPaneMode: RightPaneMode;
  activeThreadId: string | null;
  sidebarWidth: number;
  inboxFilter: InboxFilterLens;
  searchQuery: string;
  chatSearchQuery: string;
  isChatSearchOpen: boolean;
  dismissedPinnedBannerByConv: Record<string, boolean>;
  drafts: Record<string, DraftData>;
  scrollOffsets: Record<string, number>;
  highlightedMessageId: string | null;
  mobileStage: 'list' | 'chat' | 'drawer';
  bookmarkedIds: string[];
  pendingOutboxCount: number;

  // Modals & Overlays
  isCommandOpen: boolean;
  isNewGroupModalOpen: boolean;
  escalationSourceConvId: string | null;
  isContactExchangeOpen: boolean;
  isPollModalOpen: boolean;
  lightboxMedia: MediaAttachment | null;
  activeCall: ActiveCallState | null;
  selectedContactCircle: string;
  toasts: ToastItem[];

  // Actions
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setActiveZone: (zone: PrimaryZone) => void;
  selectConversation: (conversationId: string) => void;
  openThreadDrawer: (parentMessageId: string) => void;
  openInspectorDrawer: () => void;
  closeRightPane: () => void;
  setSidebarWidth: (w: number) => void;
  setInboxFilter: (lens: InboxFilterLens) => void;
  setSearchQuery: (q: string) => void;
  setChatSearchOpen: (open: boolean) => void;
  setChatSearchQuery: (q: string) => void;
  dismissPinnedBanner: (convId: string) => void;
  hydrateFromIdb: () => Promise<void>;
  updateDraft: (conversationId: string, patch: Partial<DraftData>) => void;
  clearDraft: (conversationId: string) => void;
  setScrollOffset: (conversationId: string, offset: number) => void;
  flashMessageAnchor: (messageId: string) => void;
  setMobileStage: (stage: 'list' | 'chat' | 'drawer') => void;
  setBookmarkedIds: (ids: string[]) => void;
  setPendingOutboxCount: (count: number) => void;
  setCommandOpen: (open: boolean) => void;
  openNewGroupModal: (sourceConvId?: string | null) => void;
  closeNewGroupModal: () => void;
  setContactExchangeOpen: (open: boolean) => void;
  setPollModalOpen: (open: boolean) => void;
  setLightboxMedia: (media: MediaAttachment | null) => void;
  setActiveCall: (call: ActiveCallState | null) => void;
  setSelectedContactCircle: (circle: string) => void;
  pushToast: (text: string, tone?: 'info' | 'success' | 'warning') => void;
}

const DEFAULT_LIAM_CONV = '10000000-0000-4000-8000-000000000008';

export const useChatWorkspaceStore = create<ChatWorkspaceState>((set, get) => ({
  theme:
    typeof window !== 'undefined' && localStorage.getItem('relay-theme') === 'light'
      ? 'light'
      : 'dark',
  activeZone: 'chats',
  activeConversationId: '10000000-0000-4000-8000-000000000001',
  rightPaneMode: 'thread',
  activeThreadId: '20000000-0000-4000-8000-000000000001',
  sidebarWidth: 320,
  inboxFilter: 'all',
  searchQuery: '',
  chatSearchQuery: '',
  isChatSearchOpen: false,
  dismissedPinnedBannerByConv: {},
  drafts: {
    [DEFAULT_LIAM_CONV]: {
      text: 'Hi Liam, attached the Q4 roadmap deck for tomorrow morning’s review...',
      quoteReplyId: null,
      attachments: [],
      updatedAt: new Date(Date.now() - 12 * 60_000).toISOString(),
    },
  },
  scrollOffsets: {},
  highlightedMessageId: null,
  mobileStage: 'chat',
  bookmarkedIds: [
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000301',
  ],
  pendingOutboxCount: 0,

  isCommandOpen: false,
  isNewGroupModalOpen: false,
  escalationSourceConvId: null,
  isContactExchangeOpen: false,
  isPollModalOpen: false,
  lightboxMedia: null,
  activeCall: null,
  selectedContactCircle: 'All Contacts',
  toasts: [],

  setTheme: (theme) => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('relay-theme', theme);
    }
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  setActiveZone: (activeZone) => set({ activeZone }),

  selectConversation: (conversationId) =>
    set((state) => ({
      activeZone: 'chats',
      activeConversationId: conversationId,
      mobileStage: 'chat',
      isChatSearchOpen: false,
      chatSearchQuery: '',
      rightPaneMode: state.rightPaneMode === 'thread' ? 'closed' : state.rightPaneMode,
      activeThreadId: state.rightPaneMode === 'thread' ? null : state.activeThreadId,
    })),

  openThreadDrawer: (parentMessageId) => {
    set({
      rightPaneMode: 'thread',
      activeThreadId: parentMessageId,
      mobileStage: 'drawer',
    });
    get().flashMessageAnchor(parentMessageId);
  },

  openInspectorDrawer: () =>
    set((state) => ({
      rightPaneMode: state.rightPaneMode === 'inspector' ? 'closed' : 'inspector',
      mobileStage: state.rightPaneMode === 'inspector' ? 'chat' : 'drawer',
    })),

  closeRightPane: () =>
    set({
      rightPaneMode: 'closed',
      activeThreadId: null,
      mobileStage: 'chat',
    }),

  setSidebarWidth: (w) => set({ sidebarWidth: Math.min(440, Math.max(260, w)) }),
  setInboxFilter: (inboxFilter) => set({ inboxFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setChatSearchOpen: (isChatSearchOpen) => set({ isChatSearchOpen }),
  setChatSearchQuery: (chatSearchQuery) => set({ chatSearchQuery }),
  dismissPinnedBanner: (convId) =>
    set((s) => ({
      dismissedPinnedBannerByConv: { ...s.dismissedPinnedBannerByConv, [convId]: true },
    })),

  hydrateFromIdb: async () => {
    try {
      const [idbDrafts, idbOffsets, outbox] = await Promise.all([
        idbStorage.getAllDrafts(),
        idbStorage.getAllScrollOffsets(),
        idbStorage.listOutbox(),
      ]);
      set((s) => ({
        drafts: { ...s.drafts, ...idbDrafts },
        scrollOffsets: { ...s.scrollOffsets, ...idbOffsets },
        pendingOutboxCount: outbox.length,
      }));
    } catch {
      // Ignore IDB unavailable
    }
  },

  updateDraft: (conversationId, patch) => {
    set((state) => {
      const prev = state.drafts[conversationId] ?? {
        text: '',
        quoteReplyId: null,
        attachments: [],
        updatedAt: new Date().toISOString(),
      };
      const next: DraftData = {
        ...prev,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      const isEmpty =
        !next.text.trim() && !next.quoteReplyId && next.attachments.length === 0;
      const nextDrafts = { ...state.drafts };
      if (isEmpty) {
        delete nextDrafts[conversationId];
      } else {
        nextDrafts[conversationId] = next;
      }
      void idbStorage.saveDraft(conversationId, next);
      return { drafts: nextDrafts };
    });
  },

  clearDraft: (conversationId) => {
    set((state) => {
      const nextDrafts = { ...state.drafts };
      delete nextDrafts[conversationId];
      void idbStorage.saveDraft(conversationId, {
        text: '',
        quoteReplyId: null,
        attachments: [],
        updatedAt: new Date().toISOString(),
      });
      return { drafts: nextDrafts };
    });
  },

  setScrollOffset: (conversationId, offset) => {
    set((s) => ({
      scrollOffsets: { ...s.scrollOffsets, [conversationId]: offset },
    }));
    void idbStorage.saveScrollOffset(conversationId, offset);
  },

  flashMessageAnchor: (messageId) => {
    set({ highlightedMessageId: messageId });
    setTimeout(() => {
      if (get().highlightedMessageId === messageId) {
        set({ highlightedMessageId: null });
      }
    }, 1600);
  },

  setMobileStage: (mobileStage) => set({ mobileStage }),
  setBookmarkedIds: (bookmarkedIds) => set({ bookmarkedIds }),
  setPendingOutboxCount: (pendingOutboxCount) => set({ pendingOutboxCount }),
  setCommandOpen: (isCommandOpen) => set({ isCommandOpen }),
  openNewGroupModal: (sourceConvId = null) =>
    set({ isNewGroupModalOpen: true, escalationSourceConvId: sourceConvId }),
  closeNewGroupModal: () =>
    set({ isNewGroupModalOpen: false, escalationSourceConvId: null }),
  setContactExchangeOpen: (isContactExchangeOpen) => set({ isContactExchangeOpen }),
  setPollModalOpen: (isPollModalOpen) => set({ isPollModalOpen }),
  setLightboxMedia: (lightboxMedia) => set({ lightboxMedia }),
  setActiveCall: (activeCall) => set({ activeCall }),
  setSelectedContactCircle: (selectedContactCircle) => set({ selectedContactCircle }),

  pushToast: (text, tone = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, tone }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3200);
  },
}));

