import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { initialComments, incomingStreamQueue } from '../data/initialComments';
import { 
  applyPerspectiveLens, 
  buildCommentIndex, 
  collectUnreadQueue,
  countTotalComments 
} from '../services/rankingEngine';
import confetti from 'canvas-confetti';

const DiscussionContext = createContext(null);

export function DiscussionProvider({ children }) {
  // Main comment tree state
  const [comments, setComments] = useState(initialComments);
  
  // Pending real-time delta buffer (viewport safety)
  const [pendingDeltaBuffer, setPendingDeltaBuffer] = useState([]);
  
  // Perspectives & Navigation Lenses
  const [activeLens, setActiveLens] = useState('high-signal'); // 'high-signal' | 'author-expert' | 'counterpoints' | 'live-now' | 'newest'
  
  // Dual Context Layout Mode
  const [contextMode, setContextMode] = useState('town-square'); // 'town-square' | 'split-editorial'
  
  // Dark/Daylight Mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Paragraph filtering in margin mode
  const [selectedParagraphId, setSelectedParagraphId] = useState(null);
  
  // Highlighted passage quote in composer
  const [activeQuoteAnchor, setActiveQuoteAnchor] = useState(null); // { text, paragraphId, sourceName }
  
  // Focus Thread Drawer (for deep nesting Depth >= 3 or focused reading)
  const [focusThreadId, setFocusThreadId] = useState(null);
  
  // Collapsed thread spines (Set of comment IDs)
  const [collapsedSpineIds, setCollapsedSpineIds] = useState(new Set());
  
  // Ephemeral Real-Time Presence
  const [onlineCount, setOnlineCount] = useState(31);
  const [typingUsers, setTypingUsers] = useState([
    {
      id: "u-maya",
      name: "Maya Lin",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
      threadId: "c-101",
      expiresAt: Date.now() + 18000
    }
  ]);
  
  // Author "Office Hours" state
  const [isAuthorInRoom, setIsAuthorInRoom] = useState(true);
  const [isAuthorTyping, setIsAuthorTyping] = useState(false);
  const [filterUnansweredQuestions, setFilterUnansweredQuestions] = useState(false);

  // Temperature Check Micro-Poll
  const [temperatureVote, setTemperatureVote] = useState(null); // 'agree' | 'nuanced' | 'counter'
  const [temperatureStats, setTemperatureStats] = useState({
    agree: 54,
    nuanced: 32,
    counter: 14,
    total: 342
  });

  // Time-Travel "Since You Last Visited" state
  const [unreadList, setUnreadList] = useState([]);
  const [timeTravelIndex, setTimeTravelIndex] = useState(0);
  const [showTimeTravelBanner, setShowTimeTravelBanner] = useState(true);

  // Stream simulation queue index
  const streamPoolRef = useRef([...incomingStreamQueue]);

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Initialize unread queue on first load
  useEffect(() => {
    const unread = collectUnreadQueue(comments);
    setUnreadList(unread);
  }, []);

  // Periodic heartbeat cleanup for typing coalescer & reader counts
  useEffect(() => {
    const interval = setInterval(() => {
      // Clean expired typing indicators
      setTypingUsers(prev => prev.filter(u => u.expiresAt > Date.now()));
      
      // Slight natural fluctuation in reader count
      setOnlineCount(prev => {
        const delta = Math.floor(Math.random() * 3) - 1;
        return Math.max(18, Math.min(48, prev + delta));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Compute comment lookup index
  const commentIndex = useMemo(() => buildCommentIndex(comments), [comments]);
  
  // Compute total comment count
  const totalCommentsCount = useMemo(() => countTotalComments(comments), [comments]);

  // Active typing thread IDs
  const activeTypingThreadIds = useMemo(() => {
    return typingUsers.map(u => u.threadId);
  }, [typingUsers]);

  // Filtered & sorted comments according to lens
  const visibleComments = useMemo(() => {
    let result = comments;
    
    // If paragraph is selected in margin mode, filter to threads anchoring that paragraph
    if (selectedParagraphId) {
      result = result.filter(c => c.paragraphId === selectedParagraphId);
    }

    // If Author Office Hours "Unanswered questions" filter is active
    if (filterUnansweredQuestions) {
      result = result.filter(c => {
        const isQuestion = c.stance === 'question';
        const hasAuthorReply = c.children?.some(child => child.author?.isAuthor);
        return isQuestion && !hasAuthorReply;
      });
    }

    return applyPerspectiveLens(result, activeLens, activeTypingThreadIds);
  }, [comments, activeLens, selectedParagraphId, filterUnansweredQuestions, activeTypingThreadIds]);

  // Flow pending buffered comments into the live tree
  const flowInPendingBuffer = () => {
    if (pendingDeltaBuffer.length === 0) return;

    setComments(prevComments => {
      let updated = JSON.parse(JSON.stringify(prevComments));
      
      for (const item of pendingDeltaBuffer) {
        const newComment = {
          ...item,
          isUnreadSinceLastVisit: true,
          justFlowedIn: true,
          createdAt: new Date().toISOString()
        };

        if (!item.targetParentId) {
          // Top-level thread insertion
          updated.unshift(newComment);
        } else {
          // Deep insertion helper
          const insertRecursively = (list) => {
            for (const node of list) {
              if (node.id === item.targetParentId) {
                if (!node.children) node.children = [];
                node.children.push(newComment);
                return true;
              }
              if (node.children && node.children.length > 0) {
                if (insertRecursively(node.children)) return true;
              }
            }
            return false;
          };
          insertRecursively(updated);
        }
      }
      return updated;
    });

    setPendingDeltaBuffer([]);
  };

  // Add a new comment authored by current user
  const addComment = ({ parentId = null, paragraphId = null, quotedText = null, body, stance = 'building' }) => {
    const newId = `c-user-${Date.now()}`;
    const newComment = {
      id: newId,
      parentId,
      paragraphId: paragraphId || (parentId && commentIndex[parentId]?.paragraphId) || null,
      quotedText,
      author: {
        name: "You (Visiting Reader)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        role: "Community Contributor",
        isAuthor: false,
        isExpert: false
      },
      createdAt: new Date().toISOString(),
      stance,
      body,
      reactions: {
        changedMyMind: 0,
        spotOn: 1,
        greatSource: 0,
        goodQuestion: 0
      },
      userReactions: ["spotOn"],
      depth: parentId && commentIndex[parentId] ? (commentIndex[parentId].depth || 0) + 1 : 0,
      isUnreadSinceLastVisit: false,
      justFlowedIn: true,
      children: []
    };

    setComments(prev => {
      if (!parentId) {
        return [newComment, ...prev];
      }
      const updated = JSON.parse(JSON.stringify(prev));
      const attachRecursive = (list) => {
        for (const c of list) {
          if (c.id === parentId) {
            if (!c.children) c.children = [];
            c.children.push(newComment);
            return true;
          }
          if (c.children && c.children.length > 0) {
            if (attachRecursive(c.children)) return true;
          }
        }
        return false;
      };
      attachRecursive(updated);
      return updated;
    });

    // Clear active quote anchor
    setActiveQuoteAnchor(null);

    // If posted inside focus drawer, keep drawer open; otherwise scroll to new comment
    setTimeout(() => {
      jumpToComment(newId);
    }, 100);

    return newId;
  };

  // Toggle nuance reactions with feedback
  const toggleReaction = (commentId, reactionKey) => {
    setComments(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const findAndToggle = (list) => {
        for (const c of list) {
          if (c.id === commentId) {
            if (!c.userReactions) c.userReactions = [];
            if (!c.reactions) c.reactions = { changedMyMind: 0, spotOn: 0, greatSource: 0, goodQuestion: 0 };
            
            const hasReacted = c.userReactions.includes(reactionKey);
            if (hasReacted) {
              c.userReactions = c.userReactions.filter(r => r !== reactionKey);
              c.reactions[reactionKey] = Math.max(0, (c.reactions[reactionKey] || 1) - 1);
            } else {
              c.userReactions.push(reactionKey);
              c.reactions[reactionKey] = (c.reactions[reactionKey] || 0) + 1;
              
              // Trigger celebratory confetti for high-value nuance reactions
              if (reactionKey === 'changedMyMind') {
                try {
                  confetti({
                    particleCount: 28,
                    spread: 60,
                    origin: { y: 0.7 },
                    colors: ['#F59E0B', '#10B981', '#6366F1']
                  });
                } catch (e) {
                  // ignore in environments without canvas
                }
              }
            }
            return true;
          }
          if (c.children && c.children.length > 0) {
            if (findAndToggle(c.children)) return true;
          }
        }
        return false;
      };
      findAndToggle(updated);
      return updated;
    });
  };

  // Toggle collapsing of thread branch spine
  const toggleCollapseSpine = (commentId) => {
    setCollapsedSpineIds(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  // Jump and flash comment
  const jumpToComment = (commentId) => {
    const el = document.getElementById(`comment-${commentId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.remove('highlight-flash');
      void el.offsetWidth; // trigger reflow
      el.classList.add('highlight-flash');
    }
  };

  // Jump to article paragraph and highlight
  const jumpToParagraph = (paragraphId) => {
    const el = document.getElementById(paragraphId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.remove('highlight-flash');
      void el.offsetWidth;
      el.classList.add('highlight-flash');
    }
  };

  // Time-Travel Stepper
  const stepTimeTravel = () => {
    if (unreadList.length === 0) return;
    const nextIdx = (timeTravelIndex + 1) % unreadList.length;
    setTimeTravelIndex(nextIdx);
    const target = unreadList[nextIdx];
    if (target) {
      jumpToComment(target.id);
    }
  };

  const dismissTimeTravel = () => {
    setShowTimeTravelBanner(false);
    // Mark all as read
    setComments(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const markRead = (list) => {
        for (const c of list) {
          c.isUnreadSinceLastVisit = false;
          if (c.children) markRead(c.children);
        }
      };
      markRead(updated);
      return updated;
    });
    setUnreadList([]);
  };

  // Temperature check voting
  const castTemperatureVote = (stance) => {
    if (temperatureVote === stance) return;
    setTemperatureVote(stance);
    setTemperatureStats(prev => {
      const updated = { ...prev, total: prev.total + 1 };
      if (stance === 'agree') updated.agree += 1;
      if (stance === 'nuanced') updated.nuanced += 1;
      if (stance === 'counter') updated.counter += 1;
      return updated;
    });
  };

  // Simulation Controls: Trigger incoming comment into pending delta buffer
  const triggerSimulatedStream = () => {
    if (streamPoolRef.current.length === 0) {
      // Reload pool
      streamPoolRef.current = [...incomingStreamQueue];
    }
    const nextItem = streamPoolRef.current.shift();
    if (!nextItem) return;

    // Buffer it instead of violently shifting scroll!
    setPendingDeltaBuffer(prev => [...prev, nextItem]);

    // Also simulate typing event on that thread leading up to it
    if (nextItem.targetParentId) {
      setTypingUsers(prev => [
        ...prev.filter(u => u.threadId !== nextItem.targetParentId),
        {
          id: `u-${Date.now()}`,
          name: nextItem.author.name,
          avatar: nextItem.author.avatar,
          threadId: nextItem.targetParentId,
          expiresAt: Date.now() + 6000
        }
      ]);
    }
  };

  // Simulation Controls: Trigger typing burst
  const triggerTypingBurst = () => {
    const targetThreadId = visibleComments[0]?.id || "c-101";
    setTypingUsers(prev => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        name: "Devon Chen",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        threadId: targetThreadId,
        expiresAt: Date.now() + 8000
      }
    ]);
  };

  // Simulation Controls: Toggle author online/offline
  const toggleAuthorOnline = () => {
    setIsAuthorInRoom(prev => !prev);
  };

  // Simulation Controls: Toggle author typing
  const toggleAuthorTyping = () => {
    setIsAuthorTyping(prev => !prev);
  };

  const value = {
    comments,
    visibleComments,
    totalCommentsCount,
    commentIndex,
    pendingDeltaBuffer,
    flowInPendingBuffer,
    activeLens,
    setActiveLens,
    contextMode,
    setContextMode,
    isDarkMode,
    setIsDarkMode,
    selectedParagraphId,
    setSelectedParagraphId,
    activeQuoteAnchor,
    setActiveQuoteAnchor,
    focusThreadId,
    setFocusThreadId,
    collapsedSpineIds,
    toggleCollapseSpine,
    onlineCount,
    typingUsers,
    activeTypingThreadIds,
    isAuthorInRoom,
    toggleAuthorOnline,
    isAuthorTyping,
    toggleAuthorTyping,
    filterUnansweredQuestions,
    setFilterUnansweredQuestions,
    temperatureVote,
    temperatureStats,
    castTemperatureVote,
    unreadList,
    timeTravelIndex,
    showTimeTravelBanner,
    stepTimeTravel,
    dismissTimeTravel,
    addComment,
    toggleReaction,
    jumpToComment,
    jumpToParagraph,
    triggerSimulatedStream,
    triggerTypingBurst
  };

  return (
    <DiscussionContext.Provider value={value}>
      {children}
    </DiscussionContext.Provider>
  );
}

export function useDiscussion() {
  const context = useContext(DiscussionContext);
  if (!context) {
    throw new Error('useDiscussion must be used within a DiscussionProvider');
  }
  return context;
}

