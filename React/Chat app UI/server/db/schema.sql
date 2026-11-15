-- Relay Chat Application PostgreSQL Schema
-- Supports High-Concurrency Active Chats, Living Contacts Directory,
-- Contextual Message Threads, Offline Idempotency, and Shared Memory Vault.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT NOT NULL DEFAULT '',
  status_emoji TEXT NOT NULL DEFAULT '',
  status_text TEXT NOT NULL DEFAULT '',
  presence TEXT NOT NULL DEFAULT 'online' CHECK (presence IN ('online', 'idle', 'dnd', 'offline')),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  working_hours JSONB NOT NULL DEFAULT '{"start": "09:00", "end": "18:00", "days": [1,2,3,4,5]}'::jsonb,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CONTACTS
CREATE TABLE IF NOT EXISTS contacts (
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alias_name TEXT,
  circle_tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  private_notes TEXT NOT NULL DEFAULT '',
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'pending_request', 'blocked')),
  mutual_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_id, contact_user_id)
);

CREATE INDEX IF NOT EXISTS idx_contacts_owner_status ON contacts (owner_id, status);

-- 3. CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  title TEXT,
  avatar_url TEXT,
  pinned_message_id UUID,
  pinned_message_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations (last_message_at DESC);

-- 4. CONVERSATION MEMBERS
CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_muted BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  last_read_message_id UUID,
  unread_count INT NOT NULL DEFAULT 0,
  unread_mentions_count INT NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_members_user ON conversation_members (user_id, is_pinned DESC);

-- 5. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_msg_id UUID UNIQUE NOT NULL,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_thread_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  also_broadcast_to_main BOOLEAN NOT NULL DEFAULT FALSE,
  quote_reply_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  content TEXT NOT NULL DEFAULT '',
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  reactions JSONB NOT NULL DEFAULT '{}'::jsonb,
  reply_count INT NOT NULL DEFAULT 0,
  thread_participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_thread_reply_at TIMESTAMPTZ,
  latest_thread_snippet TEXT,
  is_silent BOOLEAN NOT NULL DEFAULT FALSE,
  scheduled_for TIMESTAMPTZ,
  edit_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cursor pagination indexes for main stream and thread replies
CREATE INDEX IF NOT EXISTS idx_messages_main_cursor
  ON messages (conversation_id, created_at DESC, id DESC)
  WHERE parent_thread_id IS NULL OR also_broadcast_to_main = TRUE;

CREATE INDEX IF NOT EXISTS idx_messages_thread_cursor
  ON messages (parent_thread_id, created_at ASC, id ASC)
  WHERE parent_thread_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_client_id
  ON messages (client_msg_id);

-- 6. POSTGRESQL THREAD ROLLUP TRIGGER
-- Atomically updates parent message reply_count, thread_participants (max 4 avatars),
-- latest_thread_snippet, and last_thread_reply_at whenever a reply is inserted.
CREATE OR REPLACE FUNCTION fn_rollup_thread_reply()
RETURNS TRIGGER AS $$
DECLARE
  sender_avatar TEXT;
  sender_name TEXT;
  current_participants JSONB;
  new_entry JSONB;
  already_exists BOOLEAN;
BEGIN
  IF NEW.parent_thread_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT avatar_url, display_name
    INTO sender_avatar, sender_name
    FROM users
   WHERE id = NEW.sender_id;

  SELECT COALESCE(thread_participants, '[]'::jsonb)
    INTO current_participants
    FROM messages
   WHERE id = NEW.parent_thread_id
   FOR UPDATE;

  SELECT EXISTS (
    SELECT 1
      FROM jsonb_array_elements(current_participants) elem
     WHERE elem->>'id' = NEW.sender_id::TEXT
  ) INTO already_exists;

  IF NOT already_exists AND jsonb_array_length(current_participants) < 4 THEN
    new_entry := jsonb_build_object(
      'id', NEW.sender_id::TEXT,
      'displayName', COALESCE(sender_name, 'Member'),
      'avatarUrl', COALESCE(sender_avatar, '')
    );
    current_participants := current_participants || jsonb_build_array(new_entry);
  END IF;

  UPDATE messages
     SET reply_count = reply_count + 1,
         thread_participants = current_participants,
         last_thread_reply_at = NEW.created_at,
         latest_thread_snippet = LEFT(
           COALESCE(NULLIF(TRIM(NEW.content), ''), '[Attachment]'),
           120
         )
   WHERE id = NEW.parent_thread_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_messages_thread_rollup ON messages;
CREATE TRIGGER trg_messages_thread_rollup
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION fn_rollup_thread_reply();

