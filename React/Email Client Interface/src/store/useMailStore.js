import { create } from 'zustand';
import { db } from '../db/db';

export const useMailStore = create((set, get) => ({
  // Navigation & Horizons
  activeHorizon: 'focused',
  setActiveHorizon: (horizon) => set({ 
    activeHorizon: horizon, 
    keyboardIndex: 0,
    checkedThreadIds: new Set(),
  }),

  // Selection & Cursor
  selectedThreadId: 'th_1',
  setSelectedThreadId: (id) => set({ selectedThreadId: id }),
  checkedThreadIds: new Set(),
  toggleCheckedThread: (id, isShiftClick = false, visibleIds = []) => {
    const current = new Set(get().checkedThreadIds);
    if (isShiftClick && visibleIds.length > 0 && current.size > 0) {
      const lastSelected = Array.from(current)[current.size - 1];
      const start = visibleIds.indexOf(lastSelected);
      const end = visibleIds.indexOf(id);
      if (start !== -1 && end !== -1) {
        const [low, high] = start < end ? [start, end] : [end, start];
        for (let i = low; i <= high; i++) {
          current.add(visibleIds[i]);
        }
        set({ checkedThreadIds: current });
        return;
      }
    }
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    set({ checkedThreadIds: current });
  },
  selectAllThreads: (allIds) => set({ checkedThreadIds: new Set(allIds) }),
  clearCheckedThreads: () => set({ checkedThreadIds: new Set() }),

  keyboardIndex: 0,
  setKeyboardIndex: (idx) => set({ keyboardIndex: idx }),
  moveKeyboardCursor: (delta, maxCount) => {
    if (maxCount <= 0) return;
    const current = get().keyboardIndex;
    const next = Math.max(0, Math.min(maxCount - 1, current + delta));
    set({ keyboardIndex: next });
  },

  // Search AST & State
  isSearchPaletteOpen: false,
  setSearchPaletteOpen: (isOpen, mode = 'threads') => set({ 
    isSearchPaletteOpen: isOpen, 
    searchMode: mode 
  }),
  searchMode: 'threads', // 'threads' | 'attachments' | 'actions'
  setSearchMode: (mode) => set({ searchMode: mode }),
  searchQuery: '',
  searchTokens: [], // e.g. [{ key: 'from', value: 'elena' }, { key: 'label', value: 'legal' }]
  searchLatencyMs: 8,
  setSearchQuery: (query) => {
    const start = performance.now();
    // Parse tokens from query like `from:elena label:legal has:attachment`
    const tokenRegex = /(\b(from|to|label|has|is|filename|after|before):[^\s]+)/gi;
    const matches = query.match(tokenRegex) || [];
    const tokens = matches.map(m => {
      const [key, ...vals] = m.split(':');
      return { key: key.toLowerCase(), value: vals.join(':'), raw: m };
    });
    const duration = Math.max(2, Math.round(performance.now() - start + Math.random() * 6));
    set({ searchQuery: query, searchTokens: tokens, searchLatencyMs: duration });
  },
  addSearchToken: (tokenObj) => {
    const tokens = [...get().searchTokens.filter(t => t.key !== tokenObj.key), tokenObj];
    const rawTokens = tokens.map(t => `${t.key}:${t.value}`).join(' ');
    set({ 
      searchTokens: tokens, 
      searchQuery: `${rawTokens} ${get().searchQuery.replace(/(\b(from|to|label|has|is|filename|after|before):[^\s]+)/gi, '').trim()}`.trim()
    });
  },
  removeSearchToken: (key) => {
    const tokens = get().searchTokens.filter(t => t.key !== key);
    const rawTokens = tokens.map(t => `${t.key}:${t.value}`).join(' ');
    set({ 
      searchTokens: tokens, 
      searchQuery: `${rawTokens} ${get().searchQuery.replace(/(\b(from|to|label|has|is|filename|after|before):[^\s]+)/gi, '').trim()}`.trim()
    });
  },

  // Modals & Drawers
  isScreenerOpen: false,
  setScreenerOpen: (isOpen) => set({ isScreenerOpen: isOpen }),
  isRuleStudioOpen: false,
  setRuleStudioOpen: (isOpen) => set({ isRuleStudioOpen: isOpen }),
  isLabelManagerOpen: false,
  setLabelManagerOpen: (isOpen) => set({ isLabelManagerOpen: isOpen }),
  isShortcutsOpen: false,
  setShortcutsOpen: (isOpen) => set({ isShortcutsOpen: isOpen }),
  isRightRailOpen: true,
  toggleRightRail: () => set((state) => ({ isRightRailOpen: !state.isRightRailOpen })),
  
  // Reading & View Customization
  densityMode: 'comfortable', // 'compact' (44px) | 'comfortable' (64px)
  toggleDensityMode: () => set((state) => ({ 
    densityMode: state.densityMode === 'compact' ? 'comfortable' : 'compact' 
  })),
  serifReadingMode: false,
  toggleSerifReadingMode: () => set((state) => ({ serifReadingMode: !state.serifReadingMode })),
  theme: 'dark',
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme: nextTheme });
  },

  // Popover Key-Trigger states
  labelPickerThreadId: null,
  setLabelPickerThreadId: (id) => set({ labelPickerThreadId: id }),
  snoozePickerThreadId: null,
  setSnoozePickerThreadId: (id) => set({ snoozePickerThreadId: id }),

  // Compose Studio & Multiple Drafts
  activeDrafts: [],
  activeDraftId: null,
  isFocusComposer: false,
  toggleFocusComposer: () => set((state) => ({ isFocusComposer: !state.isFocusComposer })),
  
  openComposer: (initialData = {}) => {
    const id = `draft_${Date.now()}`;
    const newDraft = {
      id,
      to: initialData.to || '',
      cc: initialData.cc || '',
      bcc: initialData.bcc || '',
      subject: initialData.subject || '',
      body: initialData.body || '',
      attachments: initialData.attachments || [],
      isMinimized: false,
      remindNoReply: initialData.remindNoReply || false,
      scheduledFor: initialData.scheduledFor || null,
      replyToThreadId: initialData.replyToThreadId || null,
      inReplyToMessageId: initialData.inReplyToMessageId || null,
      ...initialData,
    };
    set((state) => ({
      activeDrafts: [...state.activeDrafts, newDraft],
      activeDraftId: id,
    }));
    return id;
  },

  updateDraft: (draftId, updates) => {
    set((state) => ({
      activeDrafts: state.activeDrafts.map((d) =>
        d.id === draftId ? { ...d, ...updates } : d
      ),
    }));
  },

  closeDraft: (draftId) => {
    set((state) => {
      const remaining = state.activeDrafts.filter((d) => d.id !== draftId);
      return {
        activeDrafts: remaining,
        activeDraftId: remaining.length > 0 ? remaining[remaining.length - 1].id : null,
      };
    });
  },

  minimizeDraft: (draftId) => {
    set((state) => ({
      activeDrafts: state.activeDrafts.map((d) =>
        d.id === draftId ? { ...d, isMinimized: !d.isMinimized } : d
      ),
    }));
  },

  // 15-Second Undo-Send Queue
  undoQueue: [],
  queueSendDraft: (draft) => {
    const queueId = `undo_${Date.now()}`;
    const duration = 15;
    const expiresAt = Date.now() + duration * 1000;
    
    // Remove from active drafts immediately
    set((state) => ({
      activeDrafts: state.activeDrafts.filter((d) => d.id !== draft.id),
      activeDraftId: null,
      undoQueue: [
        ...state.undoQueue,
        {
          id: queueId,
          draft,
          totalSeconds: duration,
          remainingSeconds: duration,
          expiresAt,
        }
      ]
    }));

    // Start interval
    const interval = setInterval(async () => {
      const currentQueue = get().undoQueue.find(q => q.id === queueId);
      if (!currentQueue) {
        clearInterval(interval);
        return;
      }

      const diff = Math.ceil((currentQueue.expiresAt - Date.now()) / 1000);
      if (diff <= 0) {
        clearInterval(interval);
        // Dispatch permanently
        get().finalizeSend(currentQueue.draft, queueId);
      } else {
        set((state) => ({
          undoQueue: state.undoQueue.map(q => 
            q.id === queueId ? { ...q, remainingSeconds: diff } : q
          )
        }));
      }
    }, 1000);
  },

  cancelUndoSend: (queueId) => {
    const item = get().undoQueue.find(q => q.id === queueId);
    if (!item) return;

    // Restore draft into active drafts
    set((state) => ({
      undoQueue: state.undoQueue.filter(q => q.id !== queueId),
      activeDrafts: [...state.activeDrafts, item.draft],
      activeDraftId: item.draft.id,
    }));
  },

  dispatchImmediately: (queueId) => {
    const item = get().undoQueue.find(q => q.id === queueId);
    if (!item) return;
    get().finalizeSend(item.draft, queueId);
  },

  finalizeSend: async (draft, queueId) => {
    set((state) => ({
      undoQueue: state.undoQueue.filter(q => q.id !== queueId),
    }));

    try {
      // Create new message in Dexie
      const newMsg = {
        id: `msg_${Date.now()}`,
        thread_id: draft.replyToThreadId || `th_${Date.now()}`,
        message_id_header: `<msg-${Date.now()}@acme.dev>`,
        from_participant: {
          name: 'Alex Rivera',
          email: 'alex@acme.dev',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        },
        to_participants: draft.to.split(',').map(e => ({ email: e.trim(), name: e.trim().split('@')[0] })),
        cc_participants: draft.cc ? draft.cc.split(',').map(e => ({ email: e.trim(), name: e.trim().split('@')[0] })) : [],
        body_html: `<p>${draft.body.replace(/\n/g, '<br/>')}</p>`,
        body_text: draft.body,
        attachments: draft.attachments || [],
        list_unsubscribe_url: null,
        trackers_blocked_count: 0,
        send_status: 'sent',
        scheduled_for: draft.scheduledFor,
        created_at: new Date().toISOString(),
        team_notes: [],
      };
      await db.messages.add(newMsg);

      if (draft.replyToThreadId) {
        await db.threads.update(draft.replyToThreadId, {
          last_message_at: new Date().toISOString(),
          snippet: draft.body.slice(0, 100),
          message_count: (await db.messages.where({ thread_id: draft.replyToThreadId }).count()),
          needs_reply_reminder_at: draft.remindNoReply 
            ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() 
            : null,
        });
      } else {
        const newThread = {
          id: newMsg.thread_id,
          account_id: 'acc_1',
          subject: draft.subject || '(No Subject)',
          snippet: draft.body.slice(0, 100),
          split_category: 'focused',
          message_count: 1,
          has_attachments: draft.attachments?.length > 0,
          is_unread: false,
          is_starred: false,
          is_archived: false,
          is_trash: false,
          snoozed_until: null,
          needs_reply_reminder_at: draft.remindNoReply 
            ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() 
            : null,
          last_message_at: new Date().toISOString(),
          labels: [],
          participants: [
            { name: 'Alex Rivera', email: 'alex@acme.dev' },
            ...newMsg.to_participants,
          ],
          primary_sender: {
            name: 'Alex Rivera',
            email: 'alex@acme.dev',
          }
        };
        await db.threads.add(newThread);
      }
    } catch (err) {
      console.error('Error finalizing send:', err);
    }
  },

  // Optimistic Thread Triage Actions
  markDone: async (targetIds) => {
    const ids = Array.isArray(targetIds) ? targetIds : [targetIds];
    if (ids.length === 0) return;
    
    // Update local state / IndexedDB
    await db.threads.where('id').anyOf(ids).modify({ is_archived: true });
    
    // Advance selected thread if current was archived
    const currentSelected = get().selectedThreadId;
    if (ids.includes(currentSelected)) {
      set({ selectedThreadId: null });
    }
    // Clear selection
    set({ checkedThreadIds: new Set() });
  },

  unarchiveThread: async (threadId) => {
    await db.threads.update(threadId, { is_archived: false });
  },

  toggleStar: async (threadId) => {
    const thread = await db.threads.get(threadId);
    if (!thread) return;
    await db.threads.update(threadId, { is_starred: !thread.is_starred });
  },

  toggleUnread: async (threadId) => {
    const thread = await db.threads.get(threadId);
    if (!thread) return;
    await db.threads.update(threadId, { is_unread: !thread.is_unread });
  },

  snoozeThread: async (threadId, snoozeDate) => {
    await db.threads.update(threadId, {
      snoozed_until: snoozeDate,
      is_archived: false,
    });
    set({ snoozePickerThreadId: null });
    if (get().selectedThreadId === threadId) {
      set({ selectedThreadId: null });
    }
  },

  trashThread: async (threadId) => {
    await db.threads.update(threadId, { is_trash: true });
    if (get().selectedThreadId === threadId) {
      set({ selectedThreadId: null });
    }
  },

  assignLabel: async (threadId, labelSlug) => {
    const thread = await db.threads.get(threadId);
    if (!thread) return;
    const currentLabels = thread.labels || [];
    if (!currentLabels.includes(labelSlug)) {
      await db.threads.update(threadId, {
        labels: [...currentLabels, labelSlug],
      });
    }
    set({ labelPickerThreadId: null });
  },

  removeLabel: async (threadId, labelSlug) => {
    const thread = await db.threads.get(threadId);
    if (!thread) return;
    await db.threads.update(threadId, {
      labels: (thread.labels || []).filter(l => l !== labelSlug),
    });
  },

  unsubscribeAndArchive: async (threadId) => {
    await db.threads.update(threadId, {
      is_archived: true,
      labels: [...((await db.threads.get(threadId))?.labels || []), 'unsubscribed'],
    });
    if (get().selectedThreadId === threadId) {
      set({ selectedThreadId: null });
    }
  },

  // Screener Actions
  approveSender: async (screenerId, targetHorizon = 'focused') => {
    const item = await db.screener.get(screenerId);
    if (!item) return;

    await db.screener.update(screenerId, { status: `approved_${targetHorizon}` });

    // Also convert screener email into a thread in that horizon!
    const newThread = {
      id: `th_scr_${screenerId}`,
      account_id: 'acc_1',
      subject: item.preview_subject,
      snippet: item.preview_snippet,
      split_category: targetHorizon,
      message_count: 1,
      has_attachments: false,
      is_unread: true,
      is_starred: false,
      is_archived: false,
      is_trash: false,
      snoozed_until: null,
      needs_reply_reminder_at: null,
      last_message_at: item.received_at,
      labels: targetHorizon === 'paper_trail' ? ['finance'] : [],
      participants: [
        { name: item.sender_name, email: item.sender_email },
        { name: 'Alex Rivera', email: 'alex@acme.dev' }
      ],
      primary_sender: {
        name: item.sender_name,
        email: item.sender_email,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${item.sender_name}&backgroundColor=3b82f6`,
      }
    };
    await db.threads.add(newThread);

    const newMsg = {
      id: `msg_scr_${screenerId}`,
      thread_id: newThread.id,
      message_id_header: `<screened-${screenerId}@${item.sender_domain}>`,
      from_participant: newThread.primary_sender,
      to_participants: [{ name: 'Alex Rivera', email: 'alex@acme.dev' }],
      cc_participants: [],
      body_html: `<p>${item.preview_snippet}</p><p>Best regards,<br><strong>${item.sender_name}</strong></p>`,
      body_text: item.preview_snippet,
      attachments: [],
      list_unsubscribe_url: item.detected_type === 'Technical Newsletter' ? 'https://unsubscribe.org' : null,
      trackers_blocked_count: 1,
      send_status: 'received',
      created_at: item.received_at,
      team_notes: [],
    };
    await db.messages.add(newMsg);
  },

  blockSender: async (screenerId) => {
    await db.screener.update(screenerId, { status: 'blocked' });
  },

  // Team side-notes
  addTeamNote: async (messageId, content) => {
    const msg = await db.messages.get(messageId);
    if (!msg) return;
    const notes = msg.team_notes || [];
    const newNote = {
      id: `note_${Date.now()}`,
      author: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      content,
      created_at: new Date().toISOString(),
    };
    await db.messages.update(messageId, {
      team_notes: [...notes, newNote],
    });
  },

  // Triage stats
  stats: {
    clearedToday: 28,
    timeElapsedMinutes: 6,
  },
  incrementClearedCount: (count = 1) => {
    set((state) => ({
      stats: {
        ...state.stats,
        clearedToday: state.stats.clearedToday + count,
      }
    }));
  }
}));

