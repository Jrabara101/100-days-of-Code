import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Contact, Conversation, PresenceStatus } from '../types/chat';
import { useChatWorkspaceStore } from '../stores/useChatWorkspaceStore';
import { usePresenceStore } from '../stores/usePresenceStore';

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: api.getConversations,
    staleTime: 15_000,
  });
}

export function useContacts() {
  return useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: api.getContacts,
    staleTime: 20_000,
  });
}

export function useConversationActions() {
  const queryClient = useQueryClient();
  const selectConversation = useChatWorkspaceStore((s) => s.selectConversation);
  const pushToast = useChatWorkspaceStore((s) => s.pushToast);

  const markRead = useMutation({
    mutationFn: (conversationId: string) => api.markRead(conversationId),
    onSuccess: (updated) => {
      queryClient.setQueryData<Conversation[]>(['conversations'], (old) =>
        old?.map((c) => (c.id === updated.id ? updated : c)) ?? [updated]
      );
    },
  });

  const updateMember = useMutation({
    mutationFn: ({
      conversationId,
      patch,
    }: {
      conversationId: string;
      patch: { isPinned?: boolean; isMuted?: boolean; isArchived?: boolean; unreadCount?: number };
    }) => api.updateMemberSettings(conversationId, patch),
    onSuccess: (updated) => {
      queryClient.setQueryData<Conversation[]>(['conversations'], (old) =>
        old?.map((c) => (c.id === updated.id ? updated : c)) ?? [updated]
      );
    },
  });

  const startDirectChat = useMutation({
    mutationFn: (targetUserId: string) => api.createOrGetDirect(targetUserId),
    onSuccess: (conv) => {
      queryClient.setQueryData<Conversation[]>(['conversations'], (old) => {
        if (!old) return [conv];
        return old.some((c) => c.id === conv.id) ? old : [conv, ...old];
      });
      selectConversation(conv.id);
    },
  });

  const createGroup = useMutation({
    mutationFn: (payload: {
      title: string;
      memberUserIds: string[];
      sourceConversationId?: string;
      shareLast20Messages?: boolean;
    }) => api.createGroup(payload),
    onSuccess: (conv) => {
      queryClient.setQueryData<Conversation[]>(['conversations'], (old) =>
        old ? [conv, ...old] : [conv]
      );
      selectConversation(conv.id);
      pushToast(`Created group "${conv.title}"`, 'success');
    },
  });

  const togglePinMessage = useMutation({
    mutationFn: ({ conversationId, messageId }: { conversationId: string; messageId: string }) =>
      api.togglePinMessage(conversationId, messageId),
    onSuccess: (updated) => {
      queryClient.setQueryData<Conversation[]>(['conversations'], (old) =>
        old?.map((c) => (c.id === updated.id ? updated : c)) ?? [updated]
      );
      pushToast('Updated pinned messages', 'info');
    },
  });

  return {
    markRead,
    updateMember,
    startDirectChat,
    createGroup,
    togglePinMessage,
  };
}

export function useContactMutations() {
  const queryClient = useQueryClient();
  const pushToast = useChatWorkspaceStore((s) => s.pushToast);

  const updateContact = useMutation({
    mutationFn: ({
      userId,
      patch,
    }: {
      userId: string;
      patch: Partial<Pick<Contact, 'aliasName' | 'circleTags' | 'privateNotes' | 'isFavorite' | 'status'>>;
    }) => api.updateContact(userId, patch),
    onSuccess: (updated) => {
      queryClient.setQueryData<Contact[]>(['contacts'], (old) =>
        old?.map((c) => (c.contactUserId === updated.contactUserId ? updated : c)) ?? [updated]
      );
    },
  });

  const addContact = useMutation({
    mutationFn: (contactUserId: string) =>
      api.upsertContact({ contactUserId, status: 'accepted', circleTags: ['Core Team'] }),
    onSuccess: (added) => {
      queryClient.setQueryData<Contact[]>(['contacts'], (old) =>
        old ? [...old.filter((c) => c.contactUserId !== added.contactUserId), added] : [added]
      );
      pushToast(`Added ${added.user.displayName} to Contacts`, 'success');
    },
  });

  const updateMyPresence = useMutation({
    mutationFn: (payload: { presence: PresenceStatus; statusEmoji?: string; statusText?: string }) =>
      api.updateMyPresence(payload),
    onSuccess: (user) => {
      usePresenceStore.getState().upsertUser(user);
      pushToast('Updated status', 'success');
    },
  });

  return { updateContact, addContact, updateMyPresence };
}

