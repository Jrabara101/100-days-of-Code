import type {
  Contact,
  Conversation,
  Message,
  MessageAttachment,
  MessagesPage,
  PresenceStatus,
  User,
} from '../types/chat';
import { usePresenceStore } from '../stores/usePresenceStore';

export class NetworkOfflineError extends Error {
  constructor(message = 'Network is currently offline') {
    super(message);
    this.name = 'NetworkOfflineError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { simulatedOffline } = usePresenceStore.getState();
  if (simulatedOffline || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
    throw new NetworkOfflineError();
  }

  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new NetworkOfflineError('Failed to reach Relay API server');
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error((errBody as { error?: string }).error || `Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export interface BootstrapPayload {
  currentUser: User;
  users: User[];
  contacts: Contact[];
  conversations: Conversation[];
  bookmarkedIds: string[];
  followedThreadIds: string[];
}

export interface ThreadPayload {
  parent: Message;
  replies: MessagesPage;
  isFollowing: boolean;
}

export interface SendMessagePayload {
  clientMsgId: string;
  conversationId: string;
  senderId?: string;
  parentThreadId?: string | null;
  alsoBroadcastToMain?: boolean;
  quoteReplyId?: string | null;
  content: string;
  attachments?: MessageAttachment[];
  isSilent?: boolean;
  scheduledFor?: string | null;
}

export const api = {
  bootstrap: () => request<BootstrapPayload>('/api/bootstrap'),
  getConversations: () => request<Conversation[]>('/api/conversations'),
  createOrGetDirect: (targetUserId: string) =>
    request<Conversation>('/api/conversations/direct', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    }),
  createGroup: (payload: {
    title: string;
    memberUserIds: string[];
    sourceConversationId?: string;
    shareLast20Messages?: boolean;
  }) =>
    request<Conversation>('/api/conversations/group', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateMemberSettings: (
    conversationId: string,
    patch: { isPinned?: boolean; isMuted?: boolean; isArchived?: boolean; unreadCount?: number }
  ) =>
    request<Conversation>(`/api/conversations/${conversationId}/member`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  markRead: (conversationId: string) =>
    request<Conversation>(`/api/conversations/${conversationId}/read`, { method: 'POST' }),
  togglePinMessage: (conversationId: string, messageId: string) =>
    request<Conversation>(`/api/conversations/${conversationId}/pin`, {
      method: 'POST',
      body: JSON.stringify({ messageId }),
    }),
  getMessages: (conversationId: string, cursor?: string | null, limit = 30) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    return request<MessagesPage>(`/api/conversations/${conversationId}/messages?${params}`);
  },
  getThreads: () =>
    request<Array<{ parent: Message; conversation: Conversation; isFollowing: boolean }>>(
      '/api/threads'
    ),
  getThread: (parentId: string, cursor?: string | null) => {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    const qs = params.toString();
    return request<ThreadPayload>(`/api/threads/${parentId}${qs ? `?${qs}` : ''}`);
  },
  toggleFollowThread: (parentId: string) =>
    request<{ threadId: string; isFollowing: boolean }>(`/api/threads/${parentId}/follow`, {
      method: 'POST',
    }),
  sendMessage: (payload: SendMessagePayload) =>
    request<{ message: Message; parentMessage: Message | null; deduplicated: boolean }>(
      '/api/messages',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),
  editMessage: (messageId: string, content: string) =>
    request<Message>(`/api/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    }),
  toggleReaction: (messageId: string, emoji: string) =>
    request<Message>(`/api/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }),
  votePoll: (messageId: string, optionId: string) =>
    request<Message>(`/api/messages/${messageId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId }),
    }),
  toggleBookmark: (messageId: string) =>
    request<{ messageId: string; bookmarked: boolean; bookmarkedIds: string[] }>(
      `/api/messages/${messageId}/bookmark`,
      { method: 'POST' }
    ),
  getBookmarks: () => request<Message[]>('/api/bookmarks'),
  getVault: () => request<Message[]>('/api/vault'),
  getContacts: () => request<Contact[]>('/api/contacts'),
  discoverUsers: (q: string) =>
    request<User[]>(`/api/contacts/discover?q=${encodeURIComponent(q)}`),
  upsertContact: (payload: {
    contactUserId: string;
    circleTags?: string[];
    privateNotes?: string;
    isFavorite?: boolean;
    status?: 'accepted' | 'pending_request' | 'blocked';
    aliasName?: string | null;
  }) =>
    request<Contact>('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateContact: (
    userId: string,
    patch: Partial<Pick<Contact, 'aliasName' | 'circleTags' | 'privateNotes' | 'isFavorite' | 'status'>>
  ) =>
    request<Contact>(`/api/contacts/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  updateMyPresence: (payload: {
    presence: PresenceStatus;
    statusEmoji?: string;
    statusText?: string;
  }) =>
    request<User>('/api/me/presence', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

