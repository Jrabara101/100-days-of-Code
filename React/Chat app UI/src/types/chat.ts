export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface WorkingHours {
  start: string; // "09:00"
  end: string;   // "18:00"
  days: number[]; // 1=Mon..7=Sun
}

export interface User {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string;
  statusEmoji: string;
  statusText: string;
  presence: PresenceStatus;
  timezone: string;
  workingHours: WorkingHours;
  lastSeenAt: string;
  roleTitle?: string;
}

export type ContactStatus = 'accepted' | 'pending_request' | 'blocked';

export interface Contact {
  ownerId: string;
  contactUserId: string;
  user: User;
  aliasName: string | null;
  circleTags: string[];
  privateNotes: string;
  isFavorite: boolean;
  status: ContactStatus;
  mutualCount: number;
  requestPreview?: string;
  createdAt: string;
}

export interface ThreadParticipantPreview {
  id: string;
  displayName: string;
  avatarUrl: string;
}

export interface VoiceAttachment {
  id: string;
  kind: 'voice';
  durationSec: number;
  waveform: number[]; // 32 normalized bars 0.1..1.0
  transcript: string;
  audioUrl?: string;
}

export interface MediaAttachment {
  id: string;
  kind: 'image' | 'video';
  url: string;
  name: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
}

export interface FileAttachment {
  id: string;
  kind: 'file';
  name: string;
  ext: string;
  sizeBytes: number;
  url: string;
}

export interface LinkUnfurlAttachment {
  id: string;
  kind: 'link';
  url: string;
  domain: string;
  title: string;
  description: string;
  imageUrl?: string;
  favicon?: string;
}

export interface PollOption {
  id: string;
  label: string;
  voterIds: string[];
}

export interface PollAttachment {
  id: string;
  kind: 'poll';
  question: string;
  allowMultiple: boolean;
  options: PollOption[];
}

export interface CodeAttachment {
  id: string;
  kind: 'code';
  language: string;
  filename?: string;
  code: string;
}

export type MessageAttachment =
  | VoiceAttachment
  | MediaAttachment
  | FileAttachment
  | LinkUnfurlAttachment
  | PollAttachment
  | CodeAttachment;

export type DeliveryState = 'sending' | 'sent' | 'delivered' | 'read' | 'scheduled';

export interface MessageEditEntry {
  content: string;
  editedAt: string;
}

export interface Message {
  id: string;
  clientMsgId: string;
  conversationId: string;
  senderId: string;
  parentThreadId: string | null;
  alsoBroadcastToMain: boolean;
  quoteReplyId: string | null;
  content: string;
  attachments: MessageAttachment[];
  reactions: Record<string, string[]>; // emoji -> array of userIds
  replyCount: number;
  threadParticipants: ThreadParticipantPreview[];
  lastThreadReplyAt: string | null;
  latestThreadSnippet?: string | null;
  isSilent: boolean;
  scheduledFor?: string | null;
  deliveryState?: DeliveryState;
  editHistory?: MessageEditEntry[];
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
}

export type ConversationType = 'direct' | 'group';

export interface ConversationMember {
  conversationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  lastReadMessageId: string | null;
  unreadCount: number;
  unreadMentionsCount: number;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string | null;
  avatarUrl: string | null;
  pinnedMessageId: string | null;
  pinnedMessageIds: string[];
  lastMessageAt: string;
  createdAt: string;
  members: ConversationMember[];
  participantUsers: User[];
  lastMessagePreview?: {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    createdAt: string;
    deliveryState?: DeliveryState;
    hasThreadActivity?: boolean;
    threadReplyCount?: number;
  } | null;
  unreadThreadsCount?: number;
}

export interface DraftData {
  text: string;
  quoteReplyId: string | null;
  attachments: MessageAttachment[];
  updatedAt: string;
}

export type PrimaryZone = 'chats' | 'threads' | 'contacts' | 'bookmarks' | 'vault';
export type RightPaneMode = 'closed' | 'thread' | 'inspector';
export type InboxFilterLens = 'all' | 'unread' | 'threads' | 'mentions' | 'requests' | 'archived';

export interface TypingWhisper {
  conversationId: string;
  userId: string;
  userName: string;
  kind: 'typing' | 'recording' | 'thread_typing';
  threadId?: string | null;
  expiresAt: number;
}

export interface MessagesPage {
  items: Message[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface OutboxEntry {
  clientMsgId: string;
  conversationId: string;
  parentThreadId: string | null;
  alsoBroadcastToMain: boolean;
  quoteReplyId: string | null;
  content: string;
  attachments: MessageAttachment[];
  isSilent: boolean;
  scheduledFor?: string | null;
  createdAt: string;
}

