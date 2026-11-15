import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, NetworkOfflineError, type ThreadPayload } from '../lib/api';
import { idbStorage } from '../lib/idb';
import { generateUuid } from '../lib/utils';
import { CURRENT_USER_ID } from '../lib/constants';
import type { Message, MessagesPage } from '../types/chat';
import { useChatWorkspaceStore } from '../stores/useChatWorkspaceStore';
import { usePresenceStore } from '../stores/usePresenceStore';

export function useThread(parentThreadId: string | null) {
  return useQuery<ThreadPayload>({
    queryKey: ['thread', parentThreadId],
    enabled: Boolean(parentThreadId),
    queryFn: () => api.getThread(parentThreadId!),
  });
}

export function useAllThreads() {
  return useQuery({
    queryKey: ['threads'],
    queryFn: api.getThreads,
  });
}

export function useThreadMutations(parentThreadId: string | null) {
  const queryClient = useQueryClient();
  const pushToast = useChatWorkspaceStore((s) => s.pushToast);

  const sendThreadReply = useMutation({
    mutationFn: async (vars: {
      clientMsgId: string;
      conversationId: string;
      parentThreadId: string;
      content: string;
      alsoBroadcastToMain: boolean;
    }) => {
      const entry = {
        clientMsgId: vars.clientMsgId,
        conversationId: vars.conversationId,
        parentThreadId: vars.parentThreadId,
        alsoBroadcastToMain: vars.alsoBroadcastToMain,
        quoteReplyId: null,
        content: vars.content,
        attachments: [],
        isSilent: false,
        createdAt: new Date().toISOString(),
      };
      await idbStorage.enqueueOutbox(entry);
      try {
        const res = await api.sendMessage(entry);
        await idbStorage.removeOutbox(vars.clientMsgId);
        const remaining = await idbStorage.listOutbox();
        useChatWorkspaceStore.getState().setPendingOutboxCount(remaining.length);
        return res;
      } catch (err) {
        if (err instanceof NetworkOfflineError) {
          const remaining = await idbStorage.listOutbox();
          useChatWorkspaceStore.getState().setPendingOutboxCount(remaining.length);
          return { queuedOffline: true as const };
        }
        await idbStorage.removeOutbox(vars.clientMsgId);
        throw err;
      }
    },
    onMutate: async (vars) => {
      const me = usePresenceStore.getState().usersById[CURRENT_USER_ID];
      const optimisticReply: Message = {
        id: vars.clientMsgId,
        clientMsgId: vars.clientMsgId,
        conversationId: vars.conversationId,
        senderId: CURRENT_USER_ID,
        parentThreadId: vars.parentThreadId,
        alsoBroadcastToMain: vars.alsoBroadcastToMain,
        quoteReplyId: null,
        content: vars.content,
        attachments: [],
        reactions: {},
        replyCount: 0,
        threadParticipants: [],
        lastThreadReplyAt: null,
        isSilent: false,
        deliveryState: 'sending',
        editedAt: null,
        deletedAt: null,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ThreadPayload>(['thread', vars.parentThreadId], (old) => {
        if (!old) return old;
        const participants = [...old.parent.threadParticipants];
        if (me && !participants.some((p) => p.id === me.id) && participants.length < 4) {
          participants.push({
            id: me.id,
            displayName: me.displayName,
            avatarUrl: me.avatarUrl,
          });
        }
        return {
          ...old,
          parent: {
            ...old.parent,
            replyCount: old.parent.replyCount + 1,
            threadParticipants: participants,
            lastThreadReplyAt: optimisticReply.createdAt,
            latestThreadSnippet: optimisticReply.content.slice(0, 120),
          },
          replies: {
            ...old.replies,
            items: [...old.replies.items, optimisticReply],
          },
        };
      });

      // Optimistically bump parent message summary card + optionally broadcast to main chat
      queryClient.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] }>(
        ['messages', vars.conversationId],
        (old) => {
          if (!old) return old;
          const pages = old.pages.map((page) => ({
            ...page,
            items: page.items.map((m) => {
              if (m.id !== vars.parentThreadId) return m;
              const participants = [...m.threadParticipants];
              if (me && !participants.some((p) => p.id === me.id) && participants.length < 4) {
                participants.push({
                  id: me.id,
                  displayName: me.displayName,
                  avatarUrl: me.avatarUrl,
                });
              }
              return {
                ...m,
                replyCount: m.replyCount + 1,
                threadParticipants: participants,
                lastThreadReplyAt: optimisticReply.createdAt,
                latestThreadSnippet: optimisticReply.content.slice(0, 120),
              };
            }),
          }));

          if (vars.alsoBroadcastToMain) {
            const lastIdx = pages.length - 1;
            pages[lastIdx] = {
              ...pages[lastIdx],
              items: [...pages[lastIdx].items, optimisticReply],
            };
          }

          return { ...old, pages };
        }
      );
    },
    onSuccess: (res, vars) => {
      if ('queuedOffline' in res) {
        pushToast('Thread reply queued offline in IndexedDB', 'warning');
        return;
      }
      const { message, parentMessage } = res;
      queryClient.setQueryData<ThreadPayload>(['thread', vars.parentThreadId], (old) => {
        if (!old) return old;
        return {
          ...old,
          parent: parentMessage ?? old.parent,
          replies: {
            ...old.replies,
            items: old.replies.items.map((r) =>
              r.clientMsgId === message.clientMsgId ? message : r
            ),
          },
        };
      });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });

  const toggleFollow = useMutation({
    mutationFn: () => api.toggleFollowThread(parentThreadId!),
    onSuccess: (res) => {
      queryClient.setQueryData<ThreadPayload>(['thread', parentThreadId], (old) =>
        old ? { ...old, isFollowing: res.isFollowing } : old
      );
      pushToast(res.isFollowing ? 'Following thread notifications' : 'Muted thread', 'info');
    },
  });

  const toggleThreadReaction = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      api.toggleReaction(messageId, emoji),
    onSuccess: (updated) => {
      if (!parentThreadId) return;
      queryClient.setQueryData<ThreadPayload>(['thread', parentThreadId], (old) => {
        if (!old) return old;
        return {
          ...old,
          parent: old.parent.id === updated.id ? updated : old.parent,
          replies: {
            ...old.replies,
            items: old.replies.items.map((r) => (r.id === updated.id ? updated : r)),
          },
        };
      });
    },
  });

  const dispatchReply = (
    conversationId: string,
    parentId: string,
    content: string,
    alsoBroadcastToMain: boolean
  ) => {
    sendThreadReply.mutate({
      clientMsgId: generateUuid(),
      conversationId,
      parentThreadId: parentId,
      content,
      alsoBroadcastToMain,
    });
  };

  return {
    dispatchReply,
    toggleFollow,
    toggleThreadReaction,
  };
}

