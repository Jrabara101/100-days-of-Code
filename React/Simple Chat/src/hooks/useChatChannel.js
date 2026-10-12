import { useEffect, useRef, useCallback } from 'react';
import { echoService } from '../services/echo';

/**
 * Custom hook managing Laravel Echo lifecycle subscriptions,
 * real-time event listeners (MessageSent, MessageDelivered, MessageRead),
 * typing whispers, and presence rosters for a conversation.
 */
export function useChatChannel({
  conversationId,
  currentUser,
  onMessageSent,
  onMessageDelivered,
  onMessageRead,
  onTypingWhisper,
  onPresenceUpdate,
}) {
  const privateChannelRef = useRef(null);
  const presenceChannelRef = useRef(null);
  const whisperTimeoutRef = useRef(null);

  // Keep callback refs updated to prevent stale closures
  const callbacksRef = useRef({
    onMessageSent,
    onMessageDelivered,
    onMessageRead,
    onTypingWhisper,
    onPresenceUpdate,
  });

  useEffect(() => {
    callbacksRef.current = {
      onMessageSent,
      onMessageDelivered,
      onMessageRead,
      onTypingWhisper,
      onPresenceUpdate,
    };
  });

  useEffect(() => {
    if (!conversationId) return;

    // 1. Subscribe to Private Channel: private-chat.{conversationId}
    const privateChan = echoService.privateChatChannel(conversationId);
    privateChannelRef.current = privateChan;

    const handleMessageSent = (event) => {
      callbacksRef.current.onMessageSent?.(event);
    };

    const handleMessageDelivered = (event) => {
      callbacksRef.current.onMessageDelivered?.(event);
    };

    const handleMessageRead = (event) => {
      callbacksRef.current.onMessageRead?.(event);
    };

    privateChan
      .listen('MessageSent', handleMessageSent)
      .listen('MessageDelivered', handleMessageDelivered)
      .listen('MessageRead', handleMessageRead);

    // 2. Subscribe to Presence Channel: presence-chat.{conversationId}
    const presenceChan = echoService.presenceChatChannel(conversationId);
    presenceChannelRef.current = presenceChan;

    const handleTypingWhisper = (payload) => {
      callbacksRef.current.onTypingWhisper?.(payload);
    };

    presenceChan.listenForWhisper('typing', handleTypingWhisper);

    // Presence roster listeners
    let roster = [];
    if (presenceChan.here) {
      presenceChan
        .here((users) => {
          roster = users || [];
          callbacksRef.current.onPresenceUpdate?.(roster);
        })
        .joining((user) => {
          if (!roster.some((u) => u.id === user.id)) {
            roster = [...roster, user];
          }
          callbacksRef.current.onPresenceUpdate?.(roster);
        })
        .leaving((user) => {
          roster = roster.filter((u) => u.id !== user.id);
          callbacksRef.current.onPresenceUpdate?.(roster);
        });
    }

    // Cleanup subscription
    return () => {
      if (privateChan.stopListening) {
        privateChan.stopListening('MessageSent', handleMessageSent);
        privateChan.stopListening('MessageDelivered', handleMessageDelivered);
        privateChan.stopListening('MessageRead', handleMessageRead);
      }
      if (presenceChan.stopListeningForWhisper) {
        presenceChan.stopListeningForWhisper('typing', handleTypingWhisper);
      }
    };
  }, [conversationId]);

  /**
   * Emit client typing whisper with 3-second expiration logic
   */
  const emitTypingWhisper = useCallback(
    (isTyping = true) => {
      if (!presenceChannelRef.current || !currentUser) return;

      presenceChannelRef.current.whisper('typing', {
        userId: currentUser.id,
        userName: currentUser.name,
        isTyping,
        conversationId,
        timestamp: Date.now(),
      });

      // Clear existing auto-stop timer
      if (whisperTimeoutRef.current) {
        clearTimeout(whisperTimeoutRef.current);
      }

      if (isTyping) {
        // Automatically send stop whisper after 3 seconds of keystroke inactivity
        whisperTimeoutRef.current = setTimeout(() => {
          if (presenceChannelRef.current) {
            presenceChannelRef.current.whisper('typing', {
              userId: currentUser.id,
              userName: currentUser.name,
              isTyping: false,
              conversationId,
              timestamp: Date.now(),
            });
          }
        }, 3000);
      }
    },
    [conversationId, currentUser]
  );

  return {
    emitTypingWhisper,
  };
}
