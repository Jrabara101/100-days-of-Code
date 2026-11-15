import React, { useEffect } from 'react';
import { useMailStore } from '../../store/useMailStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';

export function KeyboardListener() {
  const {
    activeHorizon,
    selectedThreadId,
    setSelectedThreadId,
    keyboardIndex,
    moveKeyboardCursor,
    markDone,
    toggleUnread,
    openComposer,
    unsubscribeAndArchive,
    setSearchPaletteOpen,
    isSearchPaletteOpen,
    isScreenerOpen,
    setScreenerOpen,
    isRuleStudioOpen,
    setRuleStudioOpen,
    isShortcutsOpen,
    setShortcutsOpen,
    labelPickerThreadId,
    setLabelPickerThreadId,
    snoozePickerThreadId,
    setSnoozePickerThreadId,
    undoQueue,
    cancelUndoSend,
    activeDrafts,
    activeDraftId,
    queueSendDraft,
  } = useMailStore();

  const allThreads = useLiveQuery(() => db.threads.toArray()) || [];
  const messages = useLiveQuery(
    () => selectedThreadId ? db.messages.where({ thread_id: selectedThreadId }).sortBy('created_at') : [],
    [selectedThreadId]
  ) || [];

  // Determine visible count in active horizon
  const visibleThreads = allThreads.filter((t) => {
    if (activeHorizon === 'trash') return t.is_trash;
    if (t.is_trash) return false;
    if (activeHorizon === 'archive') return t.is_archived;
    if (t.is_archived) return false;
    if (activeHorizon === 'starred') return t.is_starred;
    if (activeHorizon === 'snoozed') return !!t.snoozed_until;
    if (activeHorizon === 'waiting_reply') return t.split_category === 'waiting_reply';
    if (activeHorizon === 'sent') return t.primary_sender?.email === 'alex@acme.dev';
    if (activeHorizon === 'focused') return t.split_category === 'focused';
    if (activeHorizon === 'vip') return t.split_category === 'vip' || t.primary_sender?.is_vip;
    if (activeHorizon === 'feed') return t.split_category === 'feed';
    if (activeHorizon === 'paper_trail') return t.split_category === 'paper_trail';
    return true;
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInputFocused = activeTag === 'input' || activeTag === 'textarea';

      // Cmd+Enter inside compose body
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (activeDraftId) {
          const currentDraft = activeDrafts.find(d => d.id === activeDraftId);
          if (currentDraft) {
            e.preventDefault();
            queueSendDraft(currentDraft);
            return;
          }
        }
      }

      // Cmd+K or / search trigger
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchPaletteOpen(true);
        return;
      }

      if (e.key === 'Escape') {
        if (isSearchPaletteOpen) setSearchPaletteOpen(false);
        if (isScreenerOpen) setScreenerOpen(false);
        if (isRuleStudioOpen) setRuleStudioOpen(false);
        if (isShortcutsOpen) setShortcutsOpen(false);
        if (labelPickerThreadId) setLabelPickerThreadId(null);
        if (snoozePickerThreadId) setSnoozePickerThreadId(null);
        return;
      }

      // If user is typing in an input field, do not trigger single-key hotkeys
      if (isInputFocused) return;

      // 1-Click Unsubscribe + Archive All Past: Cmd+Shift+U or Ctrl+Shift+U
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        if (selectedThreadId) {
          unsubscribeAndArchive(selectedThreadId);
        }
        return;
      }

      // Hotkey handlers
      const key = e.key.toLowerCase();

      if (key === '/') {
        e.preventDefault();
        setSearchPaletteOpen(true);
        return;
      }

      if (key === '?') {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      if (key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        moveKeyboardCursor(1, visibleThreads.length);
        const nextThread = visibleThreads[keyboardIndex + 1];
        if (nextThread) setSelectedThreadId(nextThread.id);
        return;
      }

      if (key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        moveKeyboardCursor(-1, visibleThreads.length);
        const prevThread = visibleThreads[keyboardIndex - 1];
        if (prevThread) setSelectedThreadId(prevThread.id);
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const currentThread = visibleThreads[keyboardIndex];
        if (currentThread) {
          setSelectedThreadId(currentThread.id);
        }
        return;
      }

      if (key === 'e') {
        // Mark Done
        e.preventDefault();
        const target = selectedThreadId || visibleThreads[keyboardIndex]?.id;
        if (target) {
          markDone(target);
        }
        return;
      }

      if (key === 'u') {
        // Toggle Unread
        e.preventDefault();
        const target = selectedThreadId || visibleThreads[keyboardIndex]?.id;
        if (target) {
          toggleUnread(target);
        }
        return;
      }

      if (key === 'h') {
        // Snooze
        e.preventDefault();
        const target = selectedThreadId || visibleThreads[keyboardIndex]?.id;
        if (target) {
          setSnoozePickerThreadId(target);
        }
        return;
      }

      if (key === 'l') {
        // Label
        e.preventDefault();
        const target = selectedThreadId || visibleThreads[keyboardIndex]?.id;
        if (target) {
          setLabelPickerThreadId(target);
        }
        return;
      }

      if (key === 'c') {
        // Compose
        e.preventDefault();
        openComposer();
        return;
      }

      if (key === 'z') {
        // Undo Send
        e.preventDefault();
        if (undoQueue.length > 0) {
          cancelUndoSend(undoQueue[undoQueue.length - 1].id);
        }
        return;
      }

      if (key === 'r') {
        // Reply
        e.preventDefault();
        if (selectedThreadId) {
          const currentThread = visibleThreads.find(t => t.id === selectedThreadId);
          const lastMsg = messages[messages.length - 1];
          openComposer({
            to: lastMsg?.from_participant?.email || currentThread?.primary_sender?.email || '',
            subject: currentThread?.subject?.startsWith('Re:') ? currentThread.subject : `Re: ${currentThread?.subject || ''}`,
            replyToThreadId: selectedThreadId,
            inReplyToMessageId: lastMsg?.id,
          });
        }
        return;
      }

      if (key === 'a') {
        // Reply All
        e.preventDefault();
        if (selectedThreadId) {
          const currentThread = visibleThreads.find(t => t.id === selectedThreadId);
          const lastMsg = messages[messages.length - 1];
          const cc = lastMsg?.cc_participants?.map(c => c.email).join(', ') || '';
          openComposer({
            to: lastMsg?.from_participant?.email || currentThread?.primary_sender?.email || '',
            cc,
            subject: currentThread?.subject?.startsWith('Re:') ? currentThread.subject : `Re: ${currentThread?.subject || ''}`,
            replyToThreadId: selectedThreadId,
            inReplyToMessageId: lastMsg?.id,
          });
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    visibleThreads,
    keyboardIndex,
    selectedThreadId,
    messages,
    activeDraftId,
    activeDrafts,
    undoQueue,
    isSearchPaletteOpen,
    isScreenerOpen,
    isRuleStudioOpen,
    isShortcutsOpen,
    labelPickerThreadId,
    snoozePickerThreadId,
  ]);

  return null;
}

