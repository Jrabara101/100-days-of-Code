import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, NetworkOfflineError } from '../lib/api';
import { idbStorage } from '../lib/idb';
import { generateUuid } from '../lib/utils';
import { CURRENT_USER_ID } from '../lib/constants';
import type { Conversation, Message, MessageAttachment, MessagesPage } from '../types/chat';
import { useChatWorkspaceStore } from '../stores/useChatWorkspaceStore';

export function useMessages(conversationId: string | null) {
  return useInfiniteQuery<MessagesPage>({
    queryKey: ['messages', conversationId],
    enabled: Boolean(conversationId),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const cid = conversationId!;
      try {
        const page = await api.getMessages(cid, pageParam as string | null, 35);
        if (!pageParam) {
          void idbStorage.cacheMessages(cid, page.items);
        }
        return page;
      } catch (err) {
        if (err instanceof NetworkOfflineError && !pageParam) {
          const cached = await idbStorage.getCachedMessages(cid);
          if (cached) {
            return { items: cached, nextCursor: null, hasMore: false };
          }
        }
        throw err;
      }
    },
    getPreviousPageParam: (firstPage) => (firstPage.hasMore ? firstPage.nextCursor : undefined),
    getNextPageParam: () => undefined,
  });
}

export interface SendOptimisticInput {
  conversationId: string;
  content: string;
  quoteReplyId?: string | null;
  attachments?: MessageAttachment[];
  isSilent?: boolean;
  scheduledFor?: string | null;
}

export function useMessageMutations(conversationId: string | null) {
  const queryClient = useQueryClient();
  const pushToast = useChatWorkspaceStore((s) => s.pushToast);
  const setBookmarkedIds = useChatWorkspaceStore((s) => s.setBookmarkedIds);

  const sendMessage = useMutation({
    mutationFn: async (input: SendOptimisticInput & { clientMsgId: string }) => {
      const outboxEntry = {
        clientMsgId: input.clientMsgId,
        conversationId: input.conversationId,
        parentThreadId: null,
        alsoBroadcastToMain: false,
        quoteReplyId: input.quoteReplyId ?? null,
        content: input.content,
        attachments: input.attachments ?? [],
        isSilent: Boolean(input.isSilent),
        scheduledFor: input.scheduledFor ?? null,
        createdAt: new Date().toISOString(),
      };
      await idbStorage.enqueueOutbox(outboxEntry);
      try {
        const res = await api.sendMessage(outboxEntry);
        await idbStorage.removeOutbox(input.clientMsgId);
        const remaining = await idbStorage.listOutbox();
        useChatWorkspaceStore.getState().setPendingOutboxCount(remaining.length);
        return res;
      } catch (err) {
        if (err instanceof NetworkOfflineError) {
          const remaining = await idbStorage.listOutbox();
          useChatWorkspaceStore.getState().setPendingOutboxCount(remaining.length);
          return { queuedOffline: true as const };
        }
        await idbStorage.removeOutbox(input.clientMsgId);
        throw err;
      }
    },
    onMutate: async (vars) => {
      const cid = vars.conversationId;
      const optimistic: Message = {
        id: vars.clientMsgId,
        clientMsgId: vars.clientMsgId,
        conversationId: cid,
        senderId: CURRENT_USER_ID,
        parentThreadId: null,
        alsoBroadcastToMain: false,
        quoteReplyId: vars.quoteReplyId ?? null,
        content: vars.content,
        attachments: vars.attachments ?? [],
        reactions: {},
        replyCount: 0,
        threadParticipants: [],
        lastThreadReplyAt: null,
        isSilent: Boolean(vars.isSilent),
        scheduledFor: vars.scheduledFor ?? null,
        deliveryState: vars.scheduledFor ? 'scheduled' : 'sending',
        editedAt: null,
        deletedAt: null,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] }>(
        ['messages', cid],
        (old) => {
          if (!old) {
            return {
              pages: [{ items: [optimistic], nextCursor: null, hasMore: false }],
              pageParams: [null],
            };
          }
          const lastIdx = old.pages.length - 1;
          const updatedLast = {
            ...old.pages[lastIdx],
            items: [...old.pages[lastIdx].items, optimistic],
          };
          return {
            ...old,
            pages: [...old.pages.slice(0, lastIdx), updatedLast],
          };
        }
      );

      // Update conversation preview immediately
      queryClient.setQueryData<Conversation[]>(['conversations'], (old) => {
        if (!old) return old;
        const next = old.map((c) =>
          c.id === cid
            ? {
                ...c,
                lastMessageAt: optimistic.createdAt,
                lastMessagePreview: {
                  id: optimistic.id,
                  senderId: CURRENT_USER_ID,
                  senderName: 'You',
                  content: optimistic.content || '[Attachment]',
                  createdAt: optimistic.createdAt,
                  deliveryState: optimistic.deliveryState,
                },
              }
            : c
        );
        return next.sort(
          (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
      });
    },
    onSuccess: (res, vars) => {
      if ('queuedOffline' in res) {
        pushToast('Offline — queued in IndexedDB for auto-sync', 'warning');
        return;
      }
      const { message } = res;
      queryClient.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] }>(
        ['messages', vars.conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              items: p.items.map((m) => (m.clientMsgId === message.clientMsgId ? message : m)),
            })),
          };
        }
      );
      if (message.scheduledFor) {
        pushToast('Message scheduled for 9:00 AM recipient time', 'success');
      }
      void queryClient.invalidateQueries({ queryKey: ['vault'] });
    },
  });

  const dispatchMessage = (input: SendOptimisticInput) => {
    sendMessage.mutate({
      ...input,
      clientMsgId: generateUuid(),
    });
  };

  const toggleReaction = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      api.toggleReaction(messageId, emoji),
    onMutate: async ({ messageId, emoji }) => {
      if (!conversationId) return;
      queryClient.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] }>(
        ['messages', conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((m) => {
                if (m.id !== messageId) return m;
                const list = m.reactions[emoji] ?? [];
                const nextList = list.includes(CURRENT_USER_ID)
                  ? list.filter((u) => u !== CURRENT_USER_ID)
                  : [...list, CURRENT_USER_ID];
                const nextReactions = { ...m.reactions };
                if (nextList.length === 0) delete nextReactions[emoji];
                else nextReactions[emoji] = nextList;
                return { ...m, reactions: nextReactions };
              }),
            })),
          };
        }
      );
    },
  });

  const editMessage = useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      api.editMessage(messageId, content),
    onSuccess: (updated) => {
      queryClient.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] }>(
        ['messages', updated.conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              items: p.items.map((m) => (m.id === updated.id ? updated : m)),
            })),
          };
        }
      );
      pushToast('Message updated', 'info');
    },
    onError: (err: Error) => {
      pushToast(err.message, 'warning');
    },
  });

  const votePoll = useMutation({
    mutationFn: ({ messageId, optionId }: { messageId: string; optionId: string }) =>
      api.votePoll(messageId, optionId),
    onSuccess: (updated) => {
      queryClient.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] }>(
        ['messages', updated.conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              items: p.items.map((m) => (m.id === updated.id ? updated : m)),
            })),
          };
        }
      );
    },
  });

  const toggleBookmark = useMutation({
    mutationFn: (messageId: string) => api.toggleBookmark(messageId),
    onSuccess: (res) => {
      setBookmarkedIds(res.bookmarkedIds);
      void queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      pushToast(res.bookmarked ? 'Saved to Bookmarks' : 'Removed from Bookmarks', 'info');
    },
  });

  return {
    dispatchMessage,
    toggleReaction,
    editMessage,
    votePoll,
    toggleBookmark,
  };
}

