import crypto from 'node:crypto';
import {
  CURRENT_USER_ID,
  INITIAL_CONTACTS,
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
  INITIAL_USERS,
} from '../seedData';
import type {
  Contact,
  Conversation,
  ConversationMember,
  Message,
  MessageAttachment,
  MessagesPage,
  PresenceStatus,
  User,
} from '../../src/types/chat';

export interface CreateMessageInput {
  clientMsgId: string;
  conversationId: string;
  senderId: string;
  parentThreadId?: string | null;
  alsoBroadcastToMain?: boolean;
  quoteReplyId?: string | null;
  content: string;
  attachments?: MessageAttachment[];
  isSilent?: boolean;
  scheduledFor?: string | null;
}

class ChatStore {
  users: Map<string, User> = new Map();
  contacts: Map<string, Contact> = new Map(); // key: `${ownerId}:${contactUserId}`
  conversations: Map<string, Conversation> = new Map();
  messages: Map<string, Message> = new Map();
  clientMsgIndex: Map<string, string> = new Map(); // clientMsgId -> message.id (idempotency!)
  bookmarkedIds: Set<string> = new Set([
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000301',
  ]);
  followedThreadIds: Set<string> = new Set([
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000201',
    '20000000-0000-4000-8000-000000000401',
  ]);

  constructor() {
    this.seed();
  }

  seed() {
    this.users.clear();
    this.contacts.clear();
    this.conversations.clear();
    this.messages.clear();
    this.clientMsgIndex.clear();

    for (const u of INITIAL_USERS) {
      this.users.set(u.id, structuredClone(u));
    }
    for (const c of INITIAL_CONTACTS) {
      this.contacts.set(`${c.ownerId}:${c.contactUserId}`, structuredClone(c));
    }
    for (const conv of INITIAL_CONVERSATIONS) {
      this.conversations.set(conv.id, structuredClone(conv));
    }
    for (const msg of INITIAL_MESSAGES) {
      const cloned = structuredClone(msg);
      this.messages.set(cloned.id, cloned);
      this.clientMsgIndex.set(cloned.clientMsgId, cloned.id);
    }
  }

  getUsers(): User[] {
    return Array.from(this.users.values());
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getCurrentUser(): User {
    return this.users.get(CURRENT_USER_ID)!;
  }

  updateUserPresence(userId: string, presence: PresenceStatus, statusEmoji?: string, statusText?: string): User | null {
    const u = this.users.get(userId);
    if (!u) return null;
    u.presence = presence;
    if (statusEmoji !== undefined) u.statusEmoji = statusEmoji;
    if (statusText !== undefined) u.statusText = statusText;
    u.lastSeenAt = new Date().toISOString();

    // Sync user inside conversations & contacts
    for (const contact of this.contacts.values()) {
      if (contact.contactUserId === userId) {
        contact.user = structuredClone(u);
      }
    }
    for (const conv of this.conversations.values()) {
      conv.participantUsers = conv.participantUsers.map((pu) =>
        pu.id === userId ? structuredClone(u) : pu
      );
    }
    return u;
  }

  getContacts(ownerId = CURRENT_USER_ID): Contact[] {
    return Array.from(this.contacts.values())
      .filter((c) => c.ownerId === ownerId)
      .map((c) => ({
        ...c,
        user: this.users.get(c.contactUserId) ?? c.user,
      }))
      .sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        return a.user.displayName.localeCompare(b.user.displayName);
      });
  }

  searchDiscoverableUsers(query: string, ownerId = CURRENT_USER_ID): User[] {
    const q = query.trim().toLowerCase().replace(/^@/, '');
    const existingIds = new Set(
      Array.from(this.contacts.values())
        .filter((c) => c.ownerId === ownerId && c.status === 'accepted')
        .map((c) => c.contactUserId)
    );
    existingIds.add(ownerId);

    return Array.from(this.users.values()).filter((u) => {
      if (existingIds.has(u.id)) return false;
      if (!q) return true;
      return (
        u.handle.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        (u.roleTitle ?? '').toLowerCase().includes(q)
      );
    });
  }

  upsertContact(
    ownerId: string,
    contactUserId: string,
    patch: Partial<Pick<Contact, 'aliasName' | 'circleTags' | 'privateNotes' | 'isFavorite' | 'status'>>
  ): Contact | null {
    const user = this.users.get(contactUserId);
    if (!user) return null;
    const key = `${ownerId}:${contactUserId}`;
    const existing = this.contacts.get(key);
    const updated: Contact = existing
      ? {
          ...existing,
          ...patch,
          user,
        }
      : {
          ownerId,
          contactUserId,
          user,
          aliasName: patch.aliasName ?? null,
          circleTags: patch.circleTags ?? ['Core Team'],
          privateNotes: patch.privateNotes ?? '',
          isFavorite: patch.isFavorite ?? false,
          status: patch.status ?? 'accepted',
          mutualCount: 1,
          createdAt: new Date().toISOString(),
        };
    this.contacts.set(key, updated);
    return updated;
  }

  getConversations(userId = CURRENT_USER_ID): Conversation[] {
    const list = Array.from(this.conversations.values())
      .filter((c) => c.members.some((m) => m.userId === userId))
      .map((conv) => this.hydrateConversation(conv));

    return list.sort((a, b) => {
      const ma = a.members.find((m) => m.userId === userId);
      const mb = b.members.find((m) => m.userId === userId);
      if ((ma?.isPinned ?? false) !== (mb?.isPinned ?? false)) {
        return ma?.isPinned ? -1 : 1;
      }
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
  }

  hydrateConversation(conv: Conversation): Conversation {
    const mainMessages = Array.from(this.messages.values())
      .filter(
        (m) =>
          m.conversationId === conv.id &&
          !m.deletedAt &&
          (m.parentThreadId === null || m.alsoBroadcastToMain)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const lastMsg = mainMessages[0] ?? null;
    const sender = lastMsg ? this.users.get(lastMsg.senderId) : null;

    // Check recent thread activity
    const activeThreadedParents = mainMessages.filter((m) => m.replyCount > 0 && m.lastThreadReplyAt);
    activeThreadedParents.sort(
      (a, b) =>
        new Date(b.lastThreadReplyAt ?? 0).getTime() -
        new Date(a.lastThreadReplyAt ?? 0).getTime()
    );
    const newestThreadParent = activeThreadedParents[0];

    let previewText = lastMsg?.content ?? '';
    if (!previewText && lastMsg?.attachments?.length) {
      const att = lastMsg.attachments[0];
      if (att.kind === 'voice') previewText = `🎙️ Voice note (${att.durationSec}s)`;
      else if (att.kind === 'image') previewText = `🖼️ ${att.name}`;
      else if (att.kind === 'file') previewText = `📎 ${att.name}`;
      else if (att.kind === 'poll') previewText = `📊 Poll: ${att.question}`;
      else if (att.kind === 'code') previewText = `💻 Code: ${att.filename ?? att.language}`;
      else if (att.kind === 'link') previewText = `🔗 ${att.title}`;
    }

    const participantUsers = conv.members
      .map((m) => this.users.get(m.userId))
      .filter((u): u is User => Boolean(u));

    const unreadThreadsCount = mainMessages.filter(
      (m) => m.replyCount > 0 && this.followedThreadIds.has(m.id)
    ).length > 0
      ? conv.unreadThreadsCount ?? 0
      : 0;

    return {
      ...conv,
      participantUsers,
      unreadThreadsCount,
      lastMessagePreview: lastMsg
        ? {
            id: lastMsg.id,
            senderId: lastMsg.senderId,
            senderName: sender?.id === CURRENT_USER_ID ? 'You' : sender?.displayName.split(' ')[0] ?? 'Member',
            content: previewText,
            createdAt: lastMsg.createdAt,
            deliveryState: lastMsg.deliveryState ?? 'read',
            hasThreadActivity: Boolean(newestThreadParent && newestThreadParent.replyCount > 0),
            threadReplyCount: newestThreadParent?.replyCount ?? 0,
          }
        : null,
    };
  }

  getMessagesPage(conversationId: string, cursor?: string | null, limit = 30): MessagesPage {
    const all = Array.from(this.messages.values())
      .filter(
        (m) =>
          m.conversationId === conversationId &&
          !m.deletedAt &&
          (m.parentThreadId === null || m.alsoBroadcastToMain)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    let endIdx = all.length;
    if (cursor) {
      const cursorIdx = all.findIndex((m) => m.id === cursor);
      if (cursorIdx !== -1) {
        endIdx = cursorIdx;
      }
    }

    const startIdx = Math.max(0, endIdx - limit);
    const items = all.slice(startIdx, endIdx);
    return {
      items,
      nextCursor: startIdx > 0 ? items[0]?.id ?? null : null,
      hasMore: startIdx > 0,
    };
  }

  getThreadMessages(parentThreadId: string, cursor?: string | null, limit = 50): {
    parent: Message | null;
    replies: MessagesPage;
    isFollowing: boolean;
  } {
    const parent = this.messages.get(parentThreadId) ?? null;
    const allReplies = Array.from(this.messages.values())
      .filter((m) => m.parentThreadId === parentThreadId && !m.deletedAt)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    let startIdx = 0;
    if (cursor) {
      const idx = allReplies.findIndex((m) => m.id === cursor);
      if (idx !== -1) startIdx = idx + 1;
    }

    const items = allReplies.slice(startIdx, startIdx + limit);
    const hasMore = startIdx + limit < allReplies.length;
    return {
      parent,
      replies: {
        items,
        nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
        hasMore,
      },
      isFollowing: this.followedThreadIds.has(parentThreadId),
    };
  }

  /**
   * Mirrors the PostgreSQL `trg_messages_thread_rollup` trigger and idempotent `client_msg_id` constraint.
   */
  createMessage(input: CreateMessageInput): { message: Message; parentMessage: Message | null; deduplicated: boolean } {
    const existingId = this.clientMsgIndex.get(input.clientMsgId);
    if (existingId) {
      const existing = this.messages.get(existingId)!;
      const parent = existing.parentThreadId ? this.messages.get(existing.parentThreadId) ?? null : null;
      return { message: existing, parentMessage: parent, deduplicated: true };
    }

    const id = crypto.randomUUID();
    const nowIso = new Date().toISOString();
    const message: Message = {
      id,
      clientMsgId: input.clientMsgId,
      conversationId: input.conversationId,
      senderId: input.senderId,
      parentThreadId: input.parentThreadId ?? null,
      alsoBroadcastToMain: Boolean(input.alsoBroadcastToMain),
      quoteReplyId: input.quoteReplyId ?? null,
      content: input.content,
      attachments: input.attachments ?? [],
      reactions: {},
      replyCount: 0,
      threadParticipants: [],
      lastThreadReplyAt: null,
      latestThreadSnippet: null,
      isSilent: Boolean(input.isSilent),
      scheduledFor: input.scheduledFor ?? null,
      deliveryState: input.scheduledFor ? 'scheduled' : 'sent',
      editHistory: [],
      editedAt: null,
      deletedAt: null,
      createdAt: nowIso,
    };

    this.messages.set(message.id, message);
    this.clientMsgIndex.set(message.clientMsgId, message.id);

    let parentMessage: Message | null = null;
    if (message.parentThreadId) {
      const parent = this.messages.get(message.parentThreadId);
      if (parent) {
        const sender = this.users.get(message.senderId);
        const alreadyIn = parent.threadParticipants.some((p) => p.id === message.senderId);
        if (!alreadyIn && parent.threadParticipants.length < 4 && sender) {
          parent.threadParticipants = [
            ...parent.threadParticipants,
            {
              id: sender.id,
              displayName: sender.displayName,
              avatarUrl: sender.avatarUrl,
            },
          ];
        }
        parent.replyCount += 1;
        parent.lastThreadReplyAt = message.createdAt;
        parent.latestThreadSnippet = (message.content.trim() || '[Attachment]').slice(0, 120);
        parentMessage = parent;
        this.followedThreadIds.add(parent.id);
      }
    }

    const conv = this.conversations.get(message.conversationId);
    if (conv && (!message.parentThreadId || message.alsoBroadcastToMain)) {
      conv.lastMessageAt = message.createdAt;
      if (message.senderId !== CURRENT_USER_ID) {
        const me = conv.members.find((m) => m.userId === CURRENT_USER_ID);
        if (me) {
          me.unreadCount += 1;
          if (message.content.toLowerCase().includes('@river')) {
            me.unreadMentionsCount += 1;
          }
        }
      }
    }

    return { message, parentMessage, deduplicated: false };
  }

  toggleReaction(messageId: string, emoji: string, userId = CURRENT_USER_ID): Message | null {
    const msg = this.messages.get(messageId);
    if (!msg) return null;
    const current = msg.reactions[emoji] ?? [];
    if (current.includes(userId)) {
      const filtered = current.filter((id) => id !== userId);
      if (filtered.length === 0) {
        const rest = { ...msg.reactions };
        delete rest[emoji];
        msg.reactions = rest;
      } else {
        msg.reactions = { ...msg.reactions, [emoji]: filtered };
      }
    } else {
      msg.reactions = { ...msg.reactions, [emoji]: [...current, userId] };
    }
    return msg;
  }

  editMessage(messageId: string, newContent: string, userId = CURRENT_USER_ID): { message: Message | null; error?: string } {
    const msg = this.messages.get(messageId);
    if (!msg) return { message: null, error: 'Message not found' };
    if (msg.senderId !== userId) return { message: null, error: 'Only sender can edit' };

    const ageMs = Date.now() - new Date(msg.createdAt).getTime();
    if (ageMs > 15 * 60_000) {
      return { message: null, error: '15-minute edit grace window expired' };
    }

    const nowIso = new Date().toISOString();
    msg.editHistory = [...(msg.editHistory ?? []), { content: msg.content, editedAt: nowIso }];
    msg.content = newContent;
    msg.editedAt = nowIso;
    return { message: msg };
  }

  votePoll(messageId: string, optionId: string, userId = CURRENT_USER_ID): Message | null {
    const msg = this.messages.get(messageId);
    if (!msg) return null;
    const pollIdx = msg.attachments.findIndex((a) => a.kind === 'poll');
    if (pollIdx === -1) return null;
    const poll = msg.attachments[pollIdx];
    if (poll.kind !== 'poll') return null;

    const updatedOptions = poll.options.map((opt) => {
      const hasVoted = opt.voterIds.includes(userId);
      if (opt.id === optionId) {
        return {
          ...opt,
          voterIds: hasVoted ? opt.voterIds.filter((id) => id !== userId) : [...opt.voterIds, userId],
        };
      }
      if (!poll.allowMultiple) {
        return { ...opt, voterIds: opt.voterIds.filter((id) => id !== userId) };
      }
      return opt;
    });

    const nextAttachments = [...msg.attachments];
    nextAttachments[pollIdx] = { ...poll, options: updatedOptions };
    msg.attachments = nextAttachments;
    return msg;
  }

  togglePinMessage(conversationId: string, messageId: string): Conversation | null {
    const conv = this.conversations.get(conversationId);
    if (!conv) return null;
    const exists = conv.pinnedMessageIds.includes(messageId);
    if (exists) {
      conv.pinnedMessageIds = conv.pinnedMessageIds.filter((id) => id !== messageId);
    } else {
      conv.pinnedMessageIds = [messageId, ...conv.pinnedMessageIds];
    }
    conv.pinnedMessageId = conv.pinnedMessageIds[0] ?? null;
    return this.hydrateConversation(conv);
  }

  markConversationRead(conversationId: string, userId = CURRENT_USER_ID): Conversation | null {
    const conv = this.conversations.get(conversationId);
    if (!conv) return null;
    const member = conv.members.find((m) => m.userId === userId);
    if (!member) return null;

    const mainMessages = Array.from(this.messages.values())
      .filter((m) => m.conversationId === conversationId && !m.deletedAt && m.parentThreadId === null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (mainMessages[0]) {
      member.lastReadMessageId = mainMessages[0].id;
    }
    member.unreadCount = 0;
    member.unreadMentionsCount = 0;
    conv.unreadThreadsCount = 0;
    return this.hydrateConversation(conv);
  }

  updateMemberSettings(
    conversationId: string,
    patch: Partial<Pick<ConversationMember, 'isPinned' | 'isMuted' | 'isArchived' | 'unreadCount'>>,
    userId = CURRENT_USER_ID
  ): Conversation | null {
    const conv = this.conversations.get(conversationId);
    if (!conv) return null;
    const member = conv.members.find((m) => m.userId === userId);
    if (!member) return null;
    Object.assign(member, patch);
    return this.hydrateConversation(conv);
  }

  createOrGetDirectConversation(targetUserId: string, ownerId = CURRENT_USER_ID): Conversation | null {
    const target = this.users.get(targetUserId);
    if (!target) return null;

    for (const conv of this.conversations.values()) {
      if (
        conv.type === 'direct' &&
        conv.members.some((m) => m.userId === ownerId) &&
        conv.members.some((m) => m.userId === targetUserId)
      ) {
        return this.hydrateConversation(conv);
      }
    }

    const id = crypto.randomUUID();
    const nowIso = new Date().toISOString();
    const conv: Conversation = {
      id,
      type: 'direct',
      title: null,
      avatarUrl: null,
      pinnedMessageId: null,
      pinnedMessageIds: [],
      lastMessageAt: nowIso,
      createdAt: nowIso,
      members: [
        {
          conversationId: id,
          userId: ownerId,
          role: 'owner',
          isPinned: false,
          isMuted: false,
          isArchived: false,
          lastReadMessageId: null,
          unreadCount: 0,
          unreadMentionsCount: 0,
        },
        {
          conversationId: id,
          userId: targetUserId,
          role: 'member',
          isPinned: false,
          isMuted: false,
          isArchived: false,
          lastReadMessageId: null,
          unreadCount: 0,
          unreadMentionsCount: 0,
        },
      ],
      participantUsers: [this.getCurrentUser(), target],
      unreadThreadsCount: 0,
    };
    this.conversations.set(id, conv);
    return this.hydrateConversation(conv);
  }

  createGroupConversation(
    title: string,
    memberUserIds: string[],
    options?: { sourceConversationId?: string; shareLast20Messages?: boolean },
    ownerId = CURRENT_USER_ID
  ): Conversation {
    const id = crypto.randomUUID();
    const nowIso = new Date().toISOString();
    const uniqueIds = Array.from(new Set([ownerId, ...memberUserIds])).filter((uid) =>
      this.users.has(uid)
    );

    const conv: Conversation = {
      id,
      type: 'group',
      title: title.trim() || 'New Group Chat',
      avatarUrl: null,
      pinnedMessageId: null,
      pinnedMessageIds: [],
      lastMessageAt: nowIso,
      createdAt: nowIso,
      members: uniqueIds.map((uid) => ({
        conversationId: id,
        userId: uid,
        role: uid === ownerId ? 'owner' : 'member',
        isPinned: true,
        isMuted: false,
        isArchived: false,
        lastReadMessageId: null,
        unreadCount: 0,
        unreadMentionsCount: 0,
      })),
      participantUsers: uniqueIds.map((uid) => this.users.get(uid)!),
      unreadThreadsCount: 0,
    };

    this.conversations.set(id, conv);

    if (options?.sourceConversationId && options?.shareLast20Messages) {
      const sourceMsgs = Array.from(this.messages.values())
        .filter(
          (m) =>
            m.conversationId === options.sourceConversationId &&
            !m.deletedAt &&
            m.parentThreadId === null
        )
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(-20);

      for (const m of sourceMsgs) {
        const clonedId = crypto.randomUUID();
        const cloned: Message = {
          ...structuredClone(m),
          id: clonedId,
          clientMsgId: crypto.randomUUID(),
          conversationId: id,
          replyCount: 0,
          threadParticipants: [],
          lastThreadReplyAt: null,
        };
        this.messages.set(cloned.id, cloned);
        this.clientMsgIndex.set(cloned.clientMsgId, cloned.id);
      }

      this.createMessage({
        clientMsgId: crypto.randomUUID(),
        conversationId: id,
        senderId: ownerId,
        content: `✨ Escalated to group "${conv.title}" with the last ${sourceMsgs.length} messages of shared context.`,
      });
    } else {
      this.createMessage({
        clientMsgId: crypto.randomUUID(),
        conversationId: id,
        senderId: ownerId,
        content: `Created "${conv.title}" with ${uniqueIds.length} members.`,
      });
    }

    return this.hydrateConversation(conv);
  }

  getAllFollowedThreads(): Array<{ parent: Message; conversation: Conversation; isFollowing: boolean }> {
    const results: Array<{ parent: Message; conversation: Conversation; isFollowing: boolean }> = [];
    for (const msg of this.messages.values()) {
      if (msg.parentThreadId === null && msg.replyCount > 0 && !msg.deletedAt) {
        const conv = this.conversations.get(msg.conversationId);
        if (conv) {
          results.push({
            parent: msg,
            conversation: this.hydrateConversation(conv),
            isFollowing: this.followedThreadIds.has(msg.id),
          });
        }
      }
    }
    return results.sort(
      (a, b) =>
        new Date(b.parent.lastThreadReplyAt ?? b.parent.createdAt).getTime() -
        new Date(a.parent.lastThreadReplyAt ?? a.parent.createdAt).getTime()
    );
  }

  toggleFollowThread(threadId: string): boolean {
    if (this.followedThreadIds.has(threadId)) {
      this.followedThreadIds.delete(threadId);
      return false;
    }
    this.followedThreadIds.add(threadId);
    return true;
  }

  toggleBookmark(messageId: string): boolean {
    if (this.bookmarkedIds.has(messageId)) {
      this.bookmarkedIds.delete(messageId);
      return false;
    }
    this.bookmarkedIds.add(messageId);
    return true;
  }

  getBookmarkedMessages(): Message[] {
    return Array.from(this.bookmarkedIds)
      .map((id) => this.messages.get(id))
      .filter((m): m is Message => Boolean(m && !m.deletedAt))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getAllVaultMessages(): Message[] {
    return Array.from(this.messages.values())
      .filter((m) => !m.deletedAt && m.attachments.length > 0)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const chatStore = new ChatStore();

