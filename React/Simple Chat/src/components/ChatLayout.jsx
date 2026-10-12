import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ConversationList from './Sidebar/ConversationList';
import ChatHeader from './CenterStage/ChatHeader';
import NetworkBanner from './CenterStage/NetworkBanner';
import MessageStream from './CenterStage/MessageStream';
import TypingIndicator from './CenterStage/TypingIndicator';
import ChatComposer from './CenterStage/ChatComposer';
import ConversationDrawer from './RightRail/ConversationDrawer';
import NewChatModal from './Modals/NewChatModal';
import AddParticipantModal from './Modals/AddParticipantModal';
import PusherSettingsModal from './Modals/PusherSettingsModal';
import ImagePreviewModal from './Modals/ImagePreviewModal';

import { useChatChannel } from '../hooks/useChatChannel';
import { echoService } from '../services/echo';
import { soundService } from '../services/sound';
import {
  CURRENT_USER,
  CONTACT_USERS,
  INITIAL_CONVERSATIONS,
} from '../services/mockData';

export default function ChatLayout() {
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState('conv-sarah');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeQuoteReply, setActiveQuoteReply] = useState(null);
  const [connectionState, setConnectionState] = useState('connected');
  const [typers, setTypers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true);

  // Responsive mobile states
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState('chat'); // 'list' | 'chat'

  // Modals
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [isPusherModalOpen, setIsPusherModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Dark mode class toggle
  const [darkMode, setDarkMode] = useState(true);

  // Tab focus detection for smart title counts & sound throttling
  const [isTabFocused, setIsTabFocused] = useState(true);
  const [backgroundUnreadCount, setBackgroundUnreadCount] = useState(0);

  // Screen resize listener for responsive layout
  useEffect(() => {
    const checkResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileView('chat');
    };
    checkResize();
    window.addEventListener('resize', checkResize);
    return () => window.removeEventListener('resize', checkResize);
  }, []);

  // Sync dark mode class on document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Tab focus / blur listeners for background notification throttling
  useEffect(() => {
    const handleFocus = () => {
      setIsTabFocused(true);
      setBackgroundUnreadCount(0);
      document.title = 'PulseChat — Real-Time Messaging Platform';
    };
    const handleBlur = () => {
      setIsTabFocused(false);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Update document title with unread badge when inactive
  useEffect(() => {
    if (!isTabFocused && backgroundUnreadCount > 0) {
      document.title = `(${backgroundUnreadCount}) New Messages • PulseChat`;
    }
  }, [backgroundUnreadCount, isTabFocused]);

  // Track Echo connection state
  useEffect(() => {
    return echoService.onConnectionStateChange((state) => {
      setConnectionState(state);
    });
  }, []);

  // Fast participants lookup map
  const allUsers = useMemo(
    () => [CURRENT_USER, ...CONTACT_USERS],
    []
  );

  const participantsMap = useMemo(() => {
    const map = {};
    allUsers.forEach((u) => {
      map[u.id] = u;
    });
    return map;
  }, [allUsers]);

  // Active conversation object
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || conversations[0];
  }, [conversations, activeConversationId]);

  // Other participants in the active conversation
  const activeOtherParticipants = useMemo(() => {
    if (!activeConversation) return [];
    return activeConversation.participantIds
      .filter((id) => id !== CURRENT_USER.id)
      .map((id) => participantsMap[id])
      .filter(Boolean);
  }, [activeConversation, participantsMap]);

  // Mark active conversation unread as 0 when viewed
  useEffect(() => {
    if (!activeConversationId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversationId ? { ...c, unreadCount: 0 } : c))
    );
  }, [activeConversationId]);

  // Typing awareness cleanup timer
  const typingTimerRef = React.useRef(null);

  // Hook up Laravel Echo channel listeners for active conversation
  const { emitTypingWhisper } = useChatChannel({
    conversationId: activeConversation?.id,
    currentUser: CURRENT_USER,
    onMessageSent: (event) => {
      handleIncomingBroadcastMessage(event.message);
    },
    onMessageDelivered: (event) => {
      updateMessageStatus(event.messageId, 'delivered');
    },
    onMessageRead: (event) => {
      if (readReceiptsEnabled) {
        updateMessageStatus(event.messageId, 'read');
      }
    },
    onTypingWhisper: (payload) => {
      if (!payload || payload.userId === CURRENT_USER.id) return;
      if (payload.isTyping) {
        setTypers((prev) => {
          if (!prev.some((t) => t.userId === payload.userId)) {
            return [...prev, payload];
          }
          return prev;
        });

        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        // Ephemeral 3-second expiry
        typingTimerRef.current = setTimeout(() => {
          setTypers((prev) => prev.filter((t) => t.userId !== payload.userId));
        }, 3000);
      } else {
        setTypers((prev) => prev.filter((t) => t.userId !== payload.userId));
      }
    },
    onPresenceUpdate: (roster) => {
      // Update contact status if available
    },
  });

  // Update a message's delivery status
  const updateMessageStatus = useCallback((messageId, newStatus) => {
    setConversations((prev) =>
      prev.map((c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === messageId || m.client_message_id === messageId
            ? { ...m, status: newStatus }
            : m
        ),
      }))
    );
  }, []);

  // Handle incoming broadcast message (Pusher event)
  const handleIncomingBroadcastMessage = useCallback(
    (newMsg) => {
      if (!newMsg) return;

      // Acoustic notification
      soundService.playInboundMessage();

      // If tab not focused, increment browser title counter
      if (!isTabFocused) {
        setBackgroundUnreadCount((count) => count + 1);
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === newMsg.conversation_id) {
            const isCurrentChat = c.id === activeConversationId;
            return {
              ...c,
              updatedAt: newMsg.created_at,
              unreadCount: isCurrentChat ? 0 : c.unreadCount + 1,
              messages: [...c.messages, newMsg],
            };
          }
          return c;
        })
      );
    },
    [activeConversationId, isTabFocused]
  );

  // Optimistic Message Dispatch
  const handleSendMessage = useCallback(
    ({ content, attachments = [], replyTo = null }) => {
      const clientMessageId = `c-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const serverId = `msg-${Date.now()}`;

      const optimisticMsg = {
        id: serverId,
        client_message_id: clientMessageId,
        conversation_id: activeConversation.id,
        user_id: CURRENT_USER.id,
        content,
        attachments,
        reply_to_id: replyTo?.id || null,
        reply_to: replyTo
          ? {
              id: replyTo.id,
              user_id: replyTo.user_id,
              userName: participantsMap[replyTo.user_id]?.name || 'Participant',
              content: replyTo.content,
            }
          : null,
        status: connectionState === 'disconnected' ? 'failed' : 'sending',
        reactions: [],
        created_at: new Date().toISOString(),
      };

      // Sound pop
      soundService.playOutboundPop();

      // 1. Optimistically append message to conversation stream
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConversation.id) {
            return {
              ...c,
              updatedAt: optimisticMsg.created_at,
              messages: [...c.messages, optimisticMsg],
            };
          }
          return c;
        })
      );

      // If disconnected, leave as failed so retry queue can be demonstrated
      if (connectionState === 'disconnected') {
        return;
      }

      // 2. Reconcile with Pusher confirmation (sending -> delivered -> read)
      setTimeout(() => {
        updateMessageStatus(optimisticMsg.id, 'delivered');

        // If recipient is online, transition to 'read' after 1.5s
        if (readReceiptsEnabled) {
          setTimeout(() => {
            updateMessageStatus(optimisticMsg.id, 'read');
          }, 1500);
        }
      }, 400);
    },
    [activeConversation, connectionState, participantsMap, readReceiptsEnabled, updateMessageStatus]
  );

  // Retry failed dispatch action
  const handleRetryFailed = useCallback(
    (failedMsg) => {
      updateMessageStatus(failedMsg.id, 'sending');
      soundService.playOutboundPop();

      setTimeout(() => {
        updateMessageStatus(failedMsg.id, 'delivered');
        if (readReceiptsEnabled) {
          setTimeout(() => {
            updateMessageStatus(failedMsg.id, 'read');
          }, 1200);
        }
      }, 400);
    },
    [readReceiptsEnabled, updateMessageStatus]
  );

  // Add / toggle reaction on message
  const handleAddReaction = useCallback((messageId, emoji) => {
    soundService.playReactionTap();
    setConversations((prev) =>
      prev.map((c) => ({
        ...c,
        messages: c.messages.map((m) => {
          if (m.id !== messageId) return m;
          const currentReactions = [...(m.reactions || [])];
          const existingIdx = currentReactions.findIndex((r) => r.emoji === emoji);

          if (existingIdx >= 0) {
            const hasUser = currentReactions[existingIdx].users.includes(CURRENT_USER.id);
            if (hasUser) {
              // remove user
              currentReactions[existingIdx].count -= 1;
              currentReactions[existingIdx].users = currentReactions[existingIdx].users.filter(
                (u) => u !== CURRENT_USER.id
              );
              if (currentReactions[existingIdx].count <= 0) {
                currentReactions.splice(existingIdx, 1);
              }
            } else {
              currentReactions[existingIdx].count += 1;
              currentReactions[existingIdx].users.push(CURRENT_USER.id);
            }
          } else {
            currentReactions.push({
              emoji,
              count: 1,
              users: [CURRENT_USER.id],
            });
          }
          return { ...m, reactions: currentReactions };
        }),
      }))
    );
  }, []);

  // Toggle Pin on conversation
  const handleTogglePin = useCallback((conversationId) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, pinned: !c.pinned } : c))
    );
  }, []);

  // Toggle Mute on active conversation
  const handleToggleMute = useCallback(() => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id ? { ...c, muted: !c.muted } : c
      )
    );
  }, [activeConversation]);

  // Simulate an incoming Pusher broadcast message from the primary contact
  const handleSimulateInboundMessage = useCallback(() => {
    const sender = activeOtherParticipants[0] || CONTACT_USERS[0];
    const sampleResponses = [
      "I've verified the Pusher presence heartbeat. Reconnections are instantaneous!",
      "The optimistic message entrance feels incredibly tactile and snappy.",
      "Just checked the quote reply jump. The smooth scroll and highlight work flawlessly.",
      "Great news: Zero message loss during network handover tests.",
      "Here is the latest responsive layout preview for mobile screens!",
    ];
    const content = sampleResponses[Math.floor(Math.random() * sampleResponses.length)];

    // Trigger typing whisper first for 1.2s before the message lands!
    setTypers([{ userId: sender.id, userName: sender.name }]);

    setTimeout(() => {
      setTypers([]);
      const incomingMsg = {
        id: `msg-in-${Date.now()}`,
        client_message_id: `c-msg-in-${Date.now()}`,
        conversation_id: activeConversation.id,
        user_id: sender.id,
        content,
        attachments: [],
        reply_to_id: null,
        status: 'delivered',
        reactions: [],
        created_at: new Date().toISOString(),
      };

      handleIncomingBroadcastMessage(incomingMsg);
    }, 1200);
  }, [activeConversation, activeOtherParticipants, handleIncomingBroadcastMessage]);

  // Trigger typing whisper simulation
  const handleTriggerTypingWhisper = useCallback(() => {
    const sender = activeOtherParticipants[0] || CONTACT_USERS[0];
    setTypers([{ userId: sender.id, userName: sender.name }]);
    setTimeout(() => {
      setTypers([]);
    }, 3000);
  }, [activeOtherParticipants]);

  // Toggle simulated disconnect / reconnect
  const handleToggleSimulateDisconnect = useCallback(() => {
    if (connectionState === 'connected') {
      echoService.setConnectionState('reconnecting');
      setTimeout(() => {
        echoService.setConnectionState('connected');
      }, 3500);
    } else {
      echoService.setConnectionState('connected');
    }
  }, [connectionState]);

  // Create new Direct Message
  const handleCreateDirect = useCallback(
    (contactId) => {
      // Check if conversation already exists
      const existing = conversations.find(
        (c) =>
          c.type === 'direct' &&
          c.participantIds.includes(contactId) &&
          c.participantIds.includes(CURRENT_USER.id)
      );

      if (existing) {
        setActiveConversationId(existing.id);
      } else {
        const contact = participantsMap[contactId];
        const newConv = {
          id: `conv-dm-${Date.now()}`,
          type: 'direct',
          title: null,
          participantIds: [CURRENT_USER.id, contactId],
          pinned: false,
          muted: false,
          unreadCount: 0,
          lastReadMessageId: null,
          updatedAt: new Date().toISOString(),
          messages: [
            {
              id: `msg-${Date.now()}`,
              client_message_id: `c-msg-${Date.now()}`,
              conversation_id: `conv-dm-${Date.now()}`,
              user_id: contactId,
              content: `Hello Jordan! Starting our direct thread here.`,
              attachments: [],
              reply_to_id: null,
              status: 'read',
              reactions: [],
              created_at: new Date().toISOString(),
            },
          ],
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
      }
      if (isMobile) setMobileView('chat');
    },
    [conversations, isMobile, participantsMap]
  );

  // Create new Group Thread
  const handleCreateGroup = useCallback(
    (title, participantIds) => {
      const newGroup = {
        id: `conv-group-${Date.now()}`,
        type: 'group',
        title,
        participantIds: [CURRENT_USER.id, ...participantIds],
        pinned: true,
        muted: false,
        unreadCount: 0,
        lastReadMessageId: null,
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: `msg-${Date.now()}`,
            client_message_id: `c-msg-${Date.now()}`,
            conversation_id: `conv-group-${Date.now()}`,
            user_id: CURRENT_USER.id,
            content: `Created channel ${title}. Welcome everyone!`,
            attachments: [],
            reply_to_id: null,
            status: 'read',
            reactions: [{ emoji: '🎉', count: 1, users: [CURRENT_USER.id] }],
            created_at: new Date().toISOString(),
          },
        ],
      };
      setConversations((prev) => [newGroup, ...prev]);
      setActiveConversationId(newGroup.id);
      if (isMobile) setMobileView('chat');
    },
    [isMobile]
  );

  // Add extra participants to current conversation (smooth upgrade from DM to Group)
  const handleAddParticipants = useCallback(
    (newParticipantIds) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConversation.id) {
            const updatedParticipants = Array.from(
              new Set([...c.participantIds, ...newParticipantIds])
            );
            return {
              ...c,
              type: 'group',
              title: c.title || `# team-${Date.now().toString().slice(-4)}`,
              participantIds: updatedParticipants,
            };
          }
          return c;
        })
      );
    },
    [activeConversation]
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#0B0C0E] text-slate-900 dark:text-[#F8FAFC]">
      {/* Pane 1: Left Rail (Conversations & Channels - 320px wide) */}
      {(!isMobile || mobileView === 'list') && (
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversation?.id}
          currentUser={CURRENT_USER}
          participantsMap={participantsMap}
          onSelectConversation={(id) => {
            setActiveConversationId(id);
            if (isMobile) setMobileView('chat');
          }}
          onTogglePin={handleTogglePin}
          onOpenNewChatModal={() => setIsNewChatOpen(true)}
          onOpenPusherModal={() => setIsPusherModalOpen(true)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          connectionState={connectionState}
        />
      )}

      {/* Pane 2: Center Stage (The Active Conversation - Flexible Width) */}
      {(!isMobile || mobileView === 'chat') && (
        <div className="flex flex-col flex-grow h-full min-w-0 bg-white dark:bg-[#0B0C0E]">
          {/* Channel Header */}
          <ChatHeader
            conversation={activeConversation}
            otherParticipants={activeOtherParticipants}
            isMobile={isMobile}
            onBack={() => setMobileView('list')}
            onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
            isDrawerOpen={isDrawerOpen}
            onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
            isSearchOpen={isSearchOpen}
            onToggleMute={handleToggleMute}
            onSimulateInbound={handleSimulateInboundMessage}
            onToggleSimulateDisconnect={handleToggleSimulateDisconnect}
            connectionState={connectionState}
          />

          {/* Network Reconnection Banner */}
          <NetworkBanner
            connectionState={connectionState}
            onRetry={() => echoService.setConnectionState('connected')}
          />

          {/* In-conversation search bar */}
          {isSearchOpen && (
            <div className="px-4 py-2 border-b border-slate-200 dark:border-[#23262D] bg-slate-50 dark:bg-[#121316] flex items-center space-x-2 animate-pop-in">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search within this conversation..."
                className="flex-grow px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-[#181A20] border border-slate-200 dark:border-[#23262D] focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                Clear
              </button>
            </div>
          )}

          {/* Message Stream Viewport */}
          <MessageStream
            messages={activeConversation?.messages || []}
            currentUserId={CURRENT_USER.id}
            participantsMap={participantsMap}
            lastReadMessageId={activeConversation?.lastReadMessageId}
            unreadCount={activeConversation?.unreadCount || 0}
            onQuoteReply={(msg) => setActiveQuoteReply(msg)}
            onRetryFailed={handleRetryFailed}
            onAddReaction={handleAddReaction}
            onOpenImage={(url) => setLightboxImage(url)}
            searchQuery={searchQuery}
          />

          {/* Ephemeral Typing Indicator Dock */}
          <TypingIndicator typers={typers} />

          {/* Bottom Composer Deck */}
          <ChatComposer
            onSendMessage={handleSendMessage}
            activeQuoteReply={activeQuoteReply}
            onClearQuoteReply={() => setActiveQuoteReply(null)}
            onTyping={() => emitTypingWhisper(true)}
          />
        </div>
      )}

      {/* Pane 3: Right Rail (Conversation Details & Media Drawer - Collapsible) */}
      {isDrawerOpen && (!isMobile || mobileView === 'chat') && (
        <ConversationDrawer
          conversation={activeConversation}
          participants={
            activeConversation?.type === 'group'
              ? activeConversation.participantIds.map((id) => participantsMap[id]).filter(Boolean)
              : [CURRENT_USER, ...activeOtherParticipants]
          }
          currentUser={CURRENT_USER}
          onClose={() => setIsDrawerOpen(false)}
          onToggleMute={handleToggleMute}
          onToggleReadReceipts={() => setReadReceiptsEnabled(!readReceiptsEnabled)}
          readReceiptsEnabled={readReceiptsEnabled}
          onOpenInviteModal={() => setIsAddParticipantOpen(true)}
          onOpenImage={(url) => setLightboxImage(url)}
        />
      )}

      {/* Modals */}
      {isNewChatOpen && (
        <NewChatModal
          contacts={CONTACT_USERS}
          onClose={() => setIsNewChatOpen(false)}
          onCreateDirect={handleCreateDirect}
          onCreateGroup={handleCreateGroup}
        />
      )}

      {isAddParticipantOpen && (
        <AddParticipantModal
          existingParticipantIds={activeConversation?.participantIds || []}
          allContacts={CONTACT_USERS}
          onClose={() => setIsAddParticipantOpen(false)}
          onAddParticipants={handleAddParticipants}
        />
      )}

      {isPusherModalOpen && (
        <PusherSettingsModal
          onClose={() => setIsPusherModalOpen(false)}
          connectionState={connectionState}
          onTriggerMockInbound={handleSimulateInboundMessage}
          onTriggerTypingWhisper={handleTriggerTypingWhisper}
          onToggleDisconnect={handleToggleSimulateDisconnect}
        />
      )}

      {lightboxImage && (
        <ImagePreviewModal
          imageUrl={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}
