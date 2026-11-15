import Dexie from 'dexie';

export const db = new Dexie('AeroMailDB');

db.version(1).stores({
  accounts: 'id, email_address, display_name',
  screener: 'id, sender_email, sender_name, sender_domain, status, received_at',
  threads: 'id, account_id, split_category, is_unread, is_starred, is_archived, is_trash, snoozed_until, needs_reply_reminder_at, last_message_at, *labels',
  messages: 'id, thread_id, send_status, created_at',
  labels: 'id, slug, name, color_hex, bundle_in_inbox',
  triage_rules: 'id, name',
  snippets: 'id, shortcut',
  contacts: 'email, name, company, vip',
});

