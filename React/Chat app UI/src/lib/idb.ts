import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { DraftData, Message, OutboxEntry } from '../types/chat';

interface RelayDB extends DBSchema {
  outbox: {
    key: string;
    value: OutboxEntry;
    indexes: { 'by-created': string };
  };
  drafts: {
    key: string; // conversationId
    value: DraftData & { conversationId: string };
  };
  scrollOffsets: {
    key: string; // conversationId
    value: { conversationId: string; offset: number };
  };
  cachedMessages: {
    key: string; // conversationId
    value: { conversationId: string; messages: Message[]; updatedAt: number };
  };
}

let dbPromise: Promise<IDBPDatabase<RelayDB>> | null = null;

function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<RelayDB>('relay-chat-workspace-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('outbox')) {
          const store = db.createObjectStore('outbox', { keyPath: 'clientMsgId' });
          store.createIndex('by-created', 'createdAt');
        }
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'conversationId' });
        }
        if (!db.objectStoreNames.contains('scrollOffsets')) {
          db.createObjectStore('scrollOffsets', { keyPath: 'conversationId' });
        }
        if (!db.objectStoreNames.contains('cachedMessages')) {
          db.createObjectStore('cachedMessages', { keyPath: 'conversationId' });
        }
      },
    });
  }
  return dbPromise;
}

export const idbStorage = {
  async enqueueOutbox(entry: OutboxEntry): Promise<void> {
    if (!isIndexedDbAvailable()) return;
    const db = await getDb();
    await db.put('outbox', entry);
  },

  async removeOutbox(clientMsgId: string): Promise<void> {
    if (!isIndexedDbAvailable()) return;
    const db = await getDb();
    await db.delete('outbox', clientMsgId);
  },

  async listOutbox(): Promise<OutboxEntry[]> {
    if (!isIndexedDbAvailable()) return [];
    const db = await getDb();
    return db.getAllFromIndex('outbox', 'by-created');
  },

  async saveDraft(conversationId: string, draft: DraftData): Promise<void> {
    if (!isIndexedDbAvailable()) return;
    const db = await getDb();
    if (!draft.text.trim() && !draft.quoteReplyId && draft.attachments.length === 0) {
      await db.delete('drafts', conversationId);
      return;
    }
    await db.put('drafts', { conversationId, ...draft });
  },

  async getAllDrafts(): Promise<Record<string, DraftData>> {
    if (!isIndexedDbAvailable()) return {};
    const db = await getDb();
    const all = await db.getAll('drafts');
    const result: Record<string, DraftData> = {};
    for (const item of all) {
      result[item.conversationId] = {
        text: item.text,
        quoteReplyId: item.quoteReplyId,
        attachments: item.attachments,
        updatedAt: item.updatedAt,
      };
    }
    return result;
  },

  async saveScrollOffset(conversationId: string, offset: number): Promise<void> {
    if (!isIndexedDbAvailable()) return;
    const db = await getDb();
    await db.put('scrollOffsets', { conversationId, offset });
  },

  async getAllScrollOffsets(): Promise<Record<string, number>> {
    if (!isIndexedDbAvailable()) return {};
    const db = await getDb();
    const all = await db.getAll('scrollOffsets');
    const map: Record<string, number> = {};
    for (const row of all) map[row.conversationId] = row.offset;
    return map;
  },

  async cacheMessages(conversationId: string, messages: Message[]): Promise<void> {
    if (!isIndexedDbAvailable()) return;
    const db = await getDb();
    await db.put('cachedMessages', { conversationId, messages, updatedAt: Date.now() });
  },

  async getCachedMessages(conversationId: string): Promise<Message[] | null> {
    if (!isIndexedDbAvailable()) return null;
    const db = await getDb();
    const row = await db.get('cachedMessages', conversationId);
    return row?.messages ?? null;
  },
};

