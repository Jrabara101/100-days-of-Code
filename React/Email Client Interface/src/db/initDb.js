import { db } from './db';
import {
  INITIAL_ACCOUNTS,
  INITIAL_LABELS,
  INITIAL_CONTACTS,
  INITIAL_SCREENER,
  INITIAL_THREADS,
  INITIAL_MESSAGES,
  INITIAL_SNIPPETS,
  INITIAL_RULES,
} from './mockData';

export async function initializeDatabase() {
  try {
    const threadCount = await db.threads.count();
    if (threadCount === 0) {
      console.log('Seeding AeroMail Dexie IndexedDB with rich mock dataset...');
      await db.accounts.bulkAdd(INITIAL_ACCOUNTS);
      await db.labels.bulkAdd(INITIAL_LABELS);
      await db.contacts.bulkAdd(INITIAL_CONTACTS);
      await db.screener.bulkAdd(INITIAL_SCREENER);
      await db.threads.bulkAdd(INITIAL_THREADS);
      await db.messages.bulkAdd(INITIAL_MESSAGES);
      await db.snippets.bulkAdd(INITIAL_SNIPPETS);
      await db.triage_rules.bulkAdd(INITIAL_RULES);
      console.log('IndexedDB seeded successfully!');
    }
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
  }
}

export async function resetDatabase() {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
    }
  });
  await db.accounts.bulkAdd(INITIAL_ACCOUNTS);
  await db.labels.bulkAdd(INITIAL_LABELS);
  await db.contacts.bulkAdd(INITIAL_CONTACTS);
  await db.screener.bulkAdd(INITIAL_SCREENER);
  await db.threads.bulkAdd(INITIAL_THREADS);
  await db.messages.bulkAdd(INITIAL_MESSAGES);
  await db.snippets.bulkAdd(INITIAL_SNIPPETS);
  await db.triage_rules.bulkAdd(INITIAL_RULES);
}

