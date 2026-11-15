import http from 'node:http';
import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { chatStore } from './db/store';
import { CURRENT_USER_ID } from './seedData';
import type { PresenceStatus } from '../src/types/chat';

const PORT = Number(process.env.PORT ?? 3001);

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(event: string, payload: unknown) {
  const frame = JSON.stringify({ event, payload, timestamp: Date.now() });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(frame);
    }
  }
}

function scheduleReceiptLifecycle(messageId: string, conversationId: string) {
  // Simulate network ack -> Delivered -> Read receipts
  setTimeout(() => {
    const msg = chatStore.messages.get(messageId);
    if (!msg || msg.deliveryState === 'scheduled') return;
    msg.deliveryState = 'delivered';
    broadcast('message:receipt', { messageId, conversationId, deliveryState: 'delivered' });
  }, 550);

  setTimeout(() => {
    const msg = chatStore.messages.get(messageId);
    if (!msg || msg.deliveryState === 'scheduled') return;
    msg.deliveryState = 'read';
    broadcast('message:receipt', { messageId, conversationId, deliveryState: 'read' });
  }, 1900);
}

function maybeSimulatePeerReply(conversationId: string, senderId: string, parentThreadId: string | null, isSilent: boolean) {
  if (senderId !== CURRENT_USER_ID || isSilent) return;
  const conv = chatStore.conversations.get(conversationId);
  if (!conv) return;

  const peer = conv.participantUsers.find(
    (u) => u.id !== CURRENT_USER_ID && u.presence === 'online'
  );
  if (!peer) return;

  setTimeout(() => {
    broadcast('typing:whisper', {
      conversationId,
      userId: peer.id,
      userName: peer.displayName.split(' ')[0],
      kind: parentThreadId ? 'thread_typing' : 'typing',
      threadId: parentThreadId,
      expiresAt: Date.now() + 4000,
    });
  }, 900);

  setTimeout(() => {
    const replies = parentThreadId
      ? [
          'Got it — updating the thread spec now.',
          'Makes sense! Tracking this directly in the thread.',
          'Nice catch, synced on my end too.',
        ]
      : [
          'Received! Checking that right now ⚡',
          'Looks super clean on my side too.',
          'On it — let’s spin up a thread if we need to dive deeper.',
        ];
    const replyContent = replies[Math.floor(Math.random() * replies.length)];
    const { message, parentMessage } = chatStore.createMessage({
      clientMsgId: crypto.randomUUID(),
      conversationId,
      senderId: peer.id,
      parentThreadId,
      content: replyContent,
    });

    if (parentThreadId) {
      broadcast('message:thread_reply', { message, parentMessage });
    } else {
      broadcast('message:new', { message });
    }
    const hydrated = chatStore.hydrateConversation(conv);
    broadcast('conversation:updated', hydrated);
  }, 2800);
}

// REST API Routes
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mode: process.env.DATABASE_URL ? 'postgres' : 'memory', time: new Date().toISOString() });
});

app.get('/api/bootstrap', (_req, res) => {
  res.json({
    currentUser: chatStore.getCurrentUser(),
    users: chatStore.getUsers(),
    contacts: chatStore.getContacts(),
    conversations: chatStore.getConversations(),
    bookmarkedIds: Array.from(chatStore.bookmarkedIds),
    followedThreadIds: Array.from(chatStore.followedThreadIds),
  });
});

app.get('/api/conversations', (_req, res) => {
  res.json(chatStore.getConversations());
});

app.post('/api/conversations/direct', (req, res) => {
  const { targetUserId } = req.body as { targetUserId?: string };
  if (!targetUserId) {
    res.status(400).json({ error: 'targetUserId is required' });
    return;
  }
  const conv = chatStore.createOrGetDirectConversation(targetUserId);
  if (!conv) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  broadcast('conversation:updated', conv);
  res.json(conv);
});

app.post('/api/conversations/group', (req, res) => {
  const { title, memberUserIds, sourceConversationId, shareLast20Messages } = req.body as {
    title?: string;
    memberUserIds?: string[];
    sourceConversationId?: string;
    shareLast20Messages?: boolean;
  };
  if (!memberUserIds || !Array.isArray(memberUserIds) || memberUserIds.length === 0) {
    res.status(400).json({ error: 'memberUserIds required' });
    return;
  }
  const conv = chatStore.createGroupConversation(title ?? 'New Group', memberUserIds, {
    sourceConversationId,
    shareLast20Messages,
  });
  broadcast('conversation:updated', conv);
  res.status(201).json(conv);
});

app.patch('/api/conversations/:id/member', (req, res) => {
  const conv = chatStore.updateMemberSettings(req.params.id, req.body);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  broadcast('conversation:updated', conv);
  res.json(conv);
});

app.post('/api/conversations/:id/read', (req, res) => {
  const conv = chatStore.markConversationRead(req.params.id);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  broadcast('conversation:updated', conv);
  res.json(conv);
});

app.post('/api/conversations/:id/pin', (req, res) => {
  const { messageId } = req.body as { messageId?: string };
  if (!messageId) {
    res.status(400).json({ error: 'messageId required' });
    return;
  }
  const conv = chatStore.togglePinMessage(req.params.id, messageId);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  broadcast('conversation:updated', conv);
  res.json(conv);
});

app.get('/api/conversations/:id/messages', (req, res) => {
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : null;
  const limit = Number(req.query.limit ?? 30);
  res.json(chatStore.getMessagesPage(req.params.id, cursor, limit));
});

app.get('/api/threads', (_req, res) => {
  res.json(chatStore.getAllFollowedThreads());
});

app.get('/api/threads/:parentId', (req, res) => {
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : null;
  const limit = Number(req.query.limit ?? 50);
  const data = chatStore.getThreadMessages(req.params.parentId, cursor, limit);
  if (!data.parent) {
    res.status(404).json({ error: 'Parent message not found' });
    return;
  }
  res.json(data);
});

app.post('/api/threads/:parentId/follow', (req, res) => {
  const isFollowing = chatStore.toggleFollowThread(req.params.parentId);
  res.json({ threadId: req.params.parentId, isFollowing });
});

app.post('/api/messages', (req, res) => {
  const body = req.body;
  if (!body.clientMsgId || !body.conversationId) {
    res.status(400).json({ error: 'clientMsgId and conversationId are required' });
    return;
  }

  const { message, parentMessage, deduplicated } = chatStore.createMessage({
    clientMsgId: body.clientMsgId,
    conversationId: body.conversationId,
    senderId: body.senderId ?? CURRENT_USER_ID,
    parentThreadId: body.parentThreadId ?? null,
    alsoBroadcastToMain: Boolean(body.alsoBroadcastToMain),
    quoteReplyId: body.quoteReplyId ?? null,
    content: body.content ?? '',
    attachments: body.attachments ?? [],
    isSilent: Boolean(body.isSilent),
    scheduledFor: body.scheduledFor ?? null,
  });

  if (!deduplicated) {
    if (message.parentThreadId) {
      broadcast('message:thread_reply', { message, parentMessage });
    } else {
      broadcast('message:new', { message });
    }
    const conv = chatStore.conversations.get(message.conversationId);
    if (conv) {
      broadcast('conversation:updated', chatStore.hydrateConversation(conv));
    }
    if (!message.scheduledFor) {
      scheduleReceiptLifecycle(message.id, message.conversationId);
      maybeSimulatePeerReply(
        message.conversationId,
        message.senderId,
        message.parentThreadId,
        message.isSilent
      );
    }
  }

  res.status(deduplicated ? 200 : 201).json({ message, parentMessage, deduplicated });
});

app.patch('/api/messages/:id', (req, res) => {
  const { content } = req.body as { content?: string };
  if (typeof content !== 'string') {
    res.status(400).json({ error: 'content is required' });
    return;
  }
  const result = chatStore.editMessage(req.params.id, content);
  if (result.error || !result.message) {
    res.status(400).json({ error: result.error ?? 'Unable to edit message' });
    return;
  }
  broadcast('message:edited', { message: result.message });
  res.json(result.message);
});

app.post('/api/messages/:id/reactions', (req, res) => {
  const { emoji } = req.body as { emoji?: string };
  if (!emoji) {
    res.status(400).json({ error: 'emoji required' });
    return;
  }
  const msg = chatStore.toggleReaction(req.params.id, emoji);
  if (!msg) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }
  broadcast('message:reaction', { message: msg });
  res.json(msg);
});

app.post('/api/messages/:id/vote', (req, res) => {
  const { optionId } = req.body as { optionId?: string };
  if (!optionId) {
    res.status(400).json({ error: 'optionId required' });
    return;
  }
  const msg = chatStore.votePoll(req.params.id, optionId);
  if (!msg) {
    res.status(404).json({ error: 'Poll message not found' });
    return;
  }
  broadcast('message:edited', { message: msg });
  res.json(msg);
});

app.post('/api/messages/:id/bookmark', (req, res) => {
  const bookmarked = chatStore.toggleBookmark(req.params.id);
  res.json({ messageId: req.params.id, bookmarked, bookmarkedIds: Array.from(chatStore.bookmarkedIds) });
});

app.get('/api/bookmarks', (_req, res) => {
  res.json(chatStore.getBookmarkedMessages());
});

app.get('/api/vault', (_req, res) => {
  res.json(chatStore.getAllVaultMessages());
});

app.get('/api/contacts', (_req, res) => {
  res.json(chatStore.getContacts());
});

app.get('/api/contacts/discover', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  res.json(chatStore.searchDiscoverableUsers(q));
});

app.post('/api/contacts', (req, res) => {
  const { contactUserId, circleTags, privateNotes, isFavorite, status } = req.body;
  const contact = chatStore.upsertContact(CURRENT_USER_ID, contactUserId, {
    circleTags,
    privateNotes,
    isFavorite,
    status,
  });
  if (!contact) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.status(201).json(contact);
});

app.patch('/api/contacts/:userId', (req, res) => {
  const contact = chatStore.upsertContact(CURRENT_USER_ID, req.params.userId, req.body);
  if (!contact) {
    res.status(404).json({ error: 'Contact not found' });
    return;
  }
  res.json(contact);
});

app.patch('/api/me/presence', (req, res) => {
  const { presence, statusEmoji, statusText } = req.body as {
    presence: PresenceStatus;
    statusEmoji?: string;
    statusText?: string;
  };
  const updated = chatStore.updateUserPresence(CURRENT_USER_ID, presence, statusEmoji, statusText);
  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  broadcast('presence:sync', { user: updated });
  res.json(updated);
});

// WebSocket Connection Handling
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ event: 'ws:connected', payload: { serverTime: Date.now() } }));

  ws.on('message', (raw) => {
    try {
      const parsed = JSON.parse(raw.toString()) as { event: string; payload?: Record<string, unknown> };
      switch (parsed.event) {
        case 'ping':
          ws.send(JSON.stringify({ event: 'pong', payload: { t: Date.now() } }));
          break;
        case 'typing:start':
        case 'recording:audio':
        case 'thread:typing': {
          const p = parsed.payload ?? {};
          broadcast('typing:whisper', {
            conversationId: p.conversationId,
            userId: p.userId ?? CURRENT_USER_ID,
            userName: p.userName ?? 'River',
            kind:
              parsed.event === 'recording:audio'
                ? 'recording'
                : parsed.event === 'thread:typing'
                  ? 'thread_typing'
                  : 'typing',
            threadId: p.threadId ?? null,
            expiresAt: Date.now() + 3500,
          });
          break;
        }
        case 'presence:update': {
          const p = parsed.payload ?? {};
          const updated = chatStore.updateUserPresence(
            CURRENT_USER_ID,
            (p.presence as PresenceStatus) ?? 'online',
            p.statusEmoji as string | undefined,
            p.statusText as string | undefined
          );
          if (updated) broadcast('presence:sync', { user: updated });
          break;
        }
        default:
          break;
      }
    } catch {
      // Ignore malformed WS frames
    }
  });
});

// Ambient Live Activity Signals in secondary chats so the roster feels breathing & alive
const ambientScenarios = [
  {
    conversationId: '10000000-0000-4000-8000-000000000002',
    userId: '00000000-0000-4000-8000-000000000004',
    userName: 'Maya',
    kind: 'typing' as const,
  },
  {
    conversationId: '10000000-0000-4000-8000-000000000004',
    userId: '00000000-0000-4000-8000-000000000003',
    userName: 'Marcus',
    kind: 'thread_typing' as const,
  },
  {
    conversationId: '10000000-0000-4000-8000-000000000006',
    userId: '00000000-0000-4000-8000-000000000005',
    userName: 'Alex',
    kind: 'recording' as const,
  },
];
let ambientIdx = 0;
setInterval(() => {
  if (wss.clients.size === 0) return;
  const scenario = ambientScenarios[ambientIdx % ambientScenarios.length];
  ambientIdx += 1;
  broadcast('typing:whisper', {
    ...scenario,
    expiresAt: Date.now() + 3800,
  });
}, 14_000);

server.listen(PORT, () => {
  console.log(`Relay API & WebSocket server listening on http://localhost:${PORT}`);
});

