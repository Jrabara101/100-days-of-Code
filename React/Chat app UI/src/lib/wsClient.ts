import type { QueryClient } from '@tanstack/react-query';
import type {
  Conversation,
  DeliveryState,
  Message,
  MessagesPage,
  TypingWhisper,
  User,
} from '../types/chat';
import { api, type ThreadPayload } from './api';
import { idbStorage } from './idb';
import { usePresenceStore } from '../stores/usePresenceStore';
import { useChatWorkspaceStore } from '../stores/useChatWorkspaceStore';

interface WsEnvelope {
  event: string;
  payload: unknown;
}

class WsClient {
  private ws: WebSocket | null = null;
  private queryClient: QueryClient | null = null;
  private reconnectTimer: number | null = null;
  private pruneTimer: number | null = null;
  private flushing = false;

  attachQueryClient(qc: QueryClient) {
    this.queryClient = qc;
  }

  connect() {
    const { simulatedOffline } = usePresenceStore.getState();
    if (simulatedOffline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      usePresenceStore.getState().setConnectionState('offline');
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    usePresenceStore.getState().setConnectionState('connecting');
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${proto}//${window.location.host}/ws`;

    try {
      const socket = new WebSocket(url);
      this.ws = socket;

      socket.onopen = () => {
        usePresenceStore.getState().setConnectionState('live');
        void this.flushOfflineOutbox();
      };

      socket.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data) as WsEnvelope;
          this.handleEvent(msg);
        } catch {
          // Ignore malformed WS message
        }
      };

      socket.onclose = () => {
        this.ws = null;
        const offline =
          usePresenceStore.getState().simulatedOffline ||
          (typeof navigator !== 'undefined' && !navigator.onLine);
        usePresenceStore.getState().setConnectionState(offline ? 'offline' : 'connecting');
        if (!offline) this.scheduleReconnect();
      };

      socket.onerror = () => {
        socket.close();
      };

      if (!this.pruneTimer) {
        this.pruneTimer = window.setInterval(() => {
          usePresenceStore.getState().pruneWhispers();
        }, 1000);
      }
    } catch {
      usePresenceStore.getState().setConnectionState('offline');
      this.scheduleReconnect();
    }
  }

  disconnectForOfflineMode() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    usePresenceStore.getState().setConnectionState('offline');
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2200);
  }

  emit(event: string, payload: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, payload }));
    }
  }

  async flushOfflineOutbox() {
    if (this.flushing) return;
    if (usePresenceStore.getState().simulatedOffline) return;
    this.flushing = true;

    try {
      const queued = await idbStorage.listOutbox();
      if (queued.length === 0) {
        useChatWorkspaceStore.getState().setPendingOutboxCount(0);
        return;
      }

      for (const item of queued) {
        try {
          const { message, parentMessage } = await api.sendMessage(item);
          await idbStorage.removeOutbox(item.clientMsgId);
          this.reconcileServerMessage(message, parentMessage);
        } catch {
          break;
        }
      }
      const remaining = await idbStorage.listOutbox();
      useChatWorkspaceStore.getState().setPendingOutboxCount(remaining.length);
      if (remaining.length === 0 && queued.length > 0) {
        useChatWorkspaceStore
          .getState()
          .pushToast(`Synced ${queued.length} queued offline message${queued.length > 1 ? 's' : ''}`, 'success');
      }
    } finally {
      this.flushing = false;
    }
  }

  private reconcileServerMessage(message: Message, parentMessage: Message | null) {
    if (!this.queryClient) return;
    if (!message.parentThreadId || message.alsoBroadcastToMain) {
      this.upsertMessageInInfiniteCache(message.conversationId, message);
    }
    if (message.parentThreadId) {
      this.upsertThreadReplyInCache(message.parentThreadId, message, parentMessage);
      if (parentMessage) {
        this.upsertMessageInInfiniteCache(parentMessage.conversationId, parentMessage);
      }
    }
    void this.queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }

  private handleEvent(envelope: WsEnvelope) {
    const qc = this.queryClient;
    if (!qc) return;

    switch (envelope.event) {
      case 'typing:whisper': {
        usePresenceStore.getState().addWhisper(envelope.payload as TypingWhisper);
        break;
      }
      case 'presence:sync': {
        const { user } = envelope.payload as { user: User };
        usePresenceStore.getState().upsertUser(user);
        void qc.invalidateQueries({ queryKey: ['contacts'] });
        void qc.invalidateQueries({ queryKey: ['conversations'] });
        break;
      }
      case 'conversation:updated': {
        const conv = envelope.payload as Conversation;
        qc.setQueryData<Conversation[]>(['conversations'], (old) => {
          if (!old) return [conv];
          const exists = old.some((c) => c.id === conv.id);
          const next = exists ? old.map((c) => (c.id === conv.id ? conv : c)) : [conv, ...old];
          return next.sort(
            (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
          );
        });
        break;
      }
      case 'message:new': {
        const { message } = envelope.payload as { message: Message };
        this.upsertMessageInInfiniteCache(message.conversationId, message);
        void qc.invalidateQueries({ queryKey: ['vault'] });
        break;
      }
      case 'message:thread_reply': {
        const { message, parentMessage } = envelope.payload as {
          message: Message;
          parentMessage: Message | null;
        };
        if (message.parentThreadId) {
          this.upsertThreadReplyInCache(message.parentThreadId, message, parentMessage);
        }
        if (parentMessage) {
          this.upsertMessageInInfiniteCache(parentMessage.conversationId, parentMessage);
        }
        if (message.alsoBroadcastToMain) {
          this.upsertMessageInInfiniteCache(message.conversationId, message);
        }
        void qc.invalidateQueries({ queryKey: ['threads'] });
        break;
      }
      case 'message:reaction':
      case 'message:edited': {
        const { message } = envelope.payload as { message: Message };
        if (!message.parentThreadId || message.alsoBroadcastToMain) {
          this.upsertMessageInInfiniteCache(message.conversationId, message);
        }
        if (message.parentThreadId) {
          this.upsertThreadReplyInCache(message.parentThreadId, message, null);
        }
        break;
      }
      case 'message:receipt': {
        const { messageId, conversationId, deliveryState } = envelope.payload as {
          messageId: string;
          conversationId: string;
          deliveryState: DeliveryState;
        };
        qc.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] }>(
          ['messages', conversationId],
          (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.map((m) =>
                  m.id === messageId ? { ...m, deliveryState } : m
                ),
              })),
            };
          }
        );
        break;
      }
      default:
        break;
    }
  }

  private upsertMessageInInfiniteCache(conversationId: string, incoming: Message) {
    if (!this.queryClient) return;
    this.queryClient.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] }>(
      ['messages', conversationId],
      (old) => {
        if (!old) return old;
        let replaced = false;
        const pages = old.pages.map((page) => ({
          ...page,
          items: page.items.map((m) => {
            if (m.id === incoming.id || m.clientMsgId === incoming.clientMsgId) {
              replaced = true;
              return incoming;
            }
            return m;
          }),
        }));

        if (replaced) return { ...old, pages };

        const lastPageIdx = pages.length - 1;
        if (lastPageIdx < 0) {
          return {
            ...old,
            pages: [{ items: [incoming], nextCursor: null, hasMore: false }],
          };
        }

        const updatedLast = {
          ...pages[lastPageIdx],
          items: [...pages[lastPageIdx].items, incoming],
        };
        return {
          ...old,
          pages: [...pages.slice(0, lastPageIdx), updatedLast],
        };
      }
    );
  }

  private upsertThreadReplyInCache(
    parentThreadId: string,
    reply: Message,
    parentMessage: Message | null
  ) {
    if (!this.queryClient) return;
    this.queryClient.setQueryData<ThreadPayload>(['thread', parentThreadId], (old) => {
      if (!old) return old;
      const exists = old.replies.items.some(
        (m) => m.id === reply.id || m.clientMsgId === reply.clientMsgId
      );
      const nextItems = exists
        ? old.replies.items.map((m) =>
            m.id === reply.id || m.clientMsgId === reply.clientMsgId ? reply : m
          )
        : [...old.replies.items, reply];

      return {
        ...old,
        parent: parentMessage ?? old.parent,
        replies: {
          ...old.replies,
          items: nextItems,
        },
      };
    });
  }
}

export const wsClient = new WsClient();

