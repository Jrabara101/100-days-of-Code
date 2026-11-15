import { describe, expect, it, beforeEach } from 'vitest';
import { getContactTimezoneInfo } from '../lib/timezone';
import { computeSimpleWordDiff } from '../lib/utils';
import { chatStore } from '../../server/db/store';
import { CURRENT_USER_ID } from '../../server/seedData';

describe('Timezone & Send-Silently Boundaries', () => {
  it('flags 1:25 AM in Berlin as sleeping and computes next 9 AM ISO', () => {
    // 2026-11-12T00:25:00Z -> 01:25 AM in Europe/Berlin (UTC+1)
    const fixedNow = new Date('2026-11-12T00:25:00Z');
    const info = getContactTimezoneInfo(
      'Europe/Berlin',
      { start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] },
      'Asia/Singapore',
      fixedNow
    );

    expect(info.city).toBe('Berlin');
    expect(info.hour24).toBe(1);
    expect(info.isSleeping).toBe(true);
    expect(info.isWorkingHours).toBe(false);
    expect(info.statusLabel).toBe('Sleeping');
    expect(info.next9amLabel).toBe('Today 9:00 AM their time');
    expect(new Date(info.next9amIso).getTime()).toBeGreaterThan(fixedNow.getTime());
  });

  it('identifies active working hours accurately', () => {
    // 2026-11-12T02:30:00Z -> 11:30 AM in Asia/Tokyo (UTC+9)
    const fixedNow = new Date('2026-11-12T02:30:00Z');
    const info = getContactTimezoneInfo(
      'Asia/Tokyo',
      { start: '09:30', end: '18:30', days: [1, 2, 3, 4, 5] },
      'Asia/Singapore',
      fixedNow
    );

    expect(info.city).toBe('Tokyo');
    expect(info.isSleeping).toBe(false);
    expect(info.isWorkingHours).toBe(true);
    expect(info.offsetDeltaLabel).toBe('+1h ahead');
  });
});

describe('Store Idempotency, Thread Rollup, and Escalation', () => {
  beforeEach(() => {
    chatStore.seed();
  });

  it('deduplicates replayed messages by clientMsgId (offline queue safety)', () => {
    const convId = '10000000-0000-4000-8000-000000000001';
    const clientMsgId = '99999999-0000-4000-8000-000000000001';

    const first = chatStore.createMessage({
      clientMsgId,
      conversationId: convId,
      senderId: CURRENT_USER_ID,
      content: 'Offline queued message',
    });

    const second = chatStore.createMessage({
      clientMsgId,
      conversationId: convId,
      senderId: CURRENT_USER_ID,
      content: 'Offline queued message',
    });

    expect(first.deduplicated).toBe(false);
    expect(second.deduplicated).toBe(true);
    expect(second.message.id).toBe(first.message.id);
  });

  it('atomically rolls up thread replies and mirrors broadcast replies to main stream', () => {
    const convId = '10000000-0000-4000-8000-000000000001';
    const parentId = '20000000-0000-4000-8000-000000000001';
    const beforeParent = chatStore.messages.get(parentId)!;
    const beforeCount = beforeParent.replyCount;

    const { message, parentMessage } = chatStore.createMessage({
      clientMsgId: '99999999-0000-4000-8000-000000000002',
      conversationId: convId,
      senderId: '00000000-0000-4000-8000-000000000004',
      parentThreadId: parentId,
      alsoBroadcastToMain: true,
      content: 'Final decision: shipping v2.4 tokens!',
    });

    expect(parentMessage?.replyCount).toBe(beforeCount + 1);
    expect(parentMessage?.threadParticipants.length).toBeLessThanOrEqual(4);
    expect(parentMessage?.latestThreadSnippet).toContain('Final decision');

    const mainPage = chatStore.getMessagesPage(convId, null, 50);
    expect(mainPage.items.some((m) => m.id === message.id)).toBe(true);
  });

  it('escalates a 1-on-1 chat to a group and carries over last 20 messages when enabled', () => {
    const sourceConvId = '10000000-0000-4000-8000-000000000001';
    const group = chatStore.createGroupConversation(
      'Elena + Marcus Sync',
      ['00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003'],
      { sourceConversationId: sourceConvId, shareLast20Messages: true }
    );

    expect(group.type).toBe('group');
    expect(group.participantUsers.length).toBe(3);

    const groupMsgs = chatStore.getMessagesPage(group.id, null, 50);
    expect(groupMsgs.items.length).toBeGreaterThan(2);
    expect(
      groupMsgs.items.some((m) => m.content.includes('Escalated to group'))
    ).toBe(true);
  });

  it('computes edit diff and enforces edit history', () => {
    const res = chatStore.createMessage({
      clientMsgId: '99999999-0000-4000-8000-000000000003',
      conversationId: '10000000-0000-4000-8000-000000000003',
      senderId: CURRENT_USER_ID,
      content: 'Deploying cluster v1',
    });

    const edited = chatStore.editMessage(res.message.id, 'Deploying cluster v2');
    expect(edited.error).toBeUndefined();
    expect(edited.message?.editHistory?.length).toBe(1);

    const diff = computeSimpleWordDiff('Deploying cluster v1', 'Deploying cluster v2');
    expect(diff.some((d) => d.type === 'removed' && d.text === 'v1')).toBe(true);
    expect(diff.some((d) => d.type === 'added' && d.text === 'v2')).toBe(true);
  });
});

