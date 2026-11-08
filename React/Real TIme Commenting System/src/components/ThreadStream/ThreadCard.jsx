import React, { useState } from 'react';
import { useDiscussion } from '../../context/DiscussionContext';
import NuanceReactions from './NuanceReactions';
import ThreadSpine from './ThreadSpine';
import { stanceDefinitions } from '../../data/initialComments';
import { 
  CornerDownRight, 
  MessageSquare, 
  ChevronRight, 
  Maximize2, 
  AtSign,
  Radio
} from 'lucide-react';

export default function ThreadCard({ comment, depth = 0 }) {
  const { 
    collapsedSpineIds, 
    toggleCollapseSpine, 
    setFocusThreadId, 
    jumpToParagraph,
    typingUsers,
    addComment
  } = useDiscussion();

  const [isReplying, setIsReplying] = useState(false);
  const [inlineReplyText, setInlineReplyText] = useState('');
  const [inlineStance, setInlineStance] = useState('building');
  const [isBranchHovered, setIsBranchHovered] = useState(false);

  const hasChildren = comment.children && comment.children.length > 0;
  const isCollapsed = collapsedSpineIds.has(comment.id);
  const childCount = comment.children?.length || 0;

  // Stance metadata
  const stanceInfo = comment.stance ? stanceDefinitions[comment.stance] : null;

  // Check if someone is actively typing in this thread
  const activeTypers = typingUsers.filter(u => u.threadId === comment.id);

  // Time formatter
  const formattedTime = (isoString) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    } catch {
      return 'just now';
    }
  };

  const handleInlineSubmit = (e) => {
    e.preventDefault();
    if (!inlineReplyText.trim()) return;

    addComment({
      parentId: comment.id,
      paragraphId: comment.paragraphId,
      body: inlineReplyText.trim(),
      stance: inlineStance
    });

    setInlineReplyText('');
    setIsReplying(false);
  };

  // Zero-Squish Indentation Cap: Maximum visual indent is level 1 (or 2).
  // Beyond depth 2, render flush or offer Focus Drawer!
  const isDeep = depth >= 2;

  return (
    <div 
      id={`comment-${comment.id}`}
      className={`relative group transition-all duration-300 ${
        comment.justFlowedIn ? 'unread-flow-in' : ''
      } ${
        comment.isUnreadSinceLastVisit ? 'ring-1 ring-amber-500/30' : ''
      }`}
    >
      <div className="flex items-stretch">
        {/* Left Interactive Spine Rail (if it has replies) */}
        {hasChildren && depth < 2 && (
          <div className="w-8 shrink-0 flex flex-col items-center pt-10">
            <ThreadSpine
              isCollapsed={isCollapsed}
              onToggleCollapse={() => toggleCollapseSpine(comment.id)}
              childCount={childCount}
              hasChildren={hasChildren}
              isBranchHovered={isBranchHovered}
              setIsBranchHovered={setIsBranchHovered}
            />
          </div>
        )}

        {/* Main Comment Card Container */}
        <div className={`flex-1 rounded-2xl border transition-all duration-200 ${
          comment.author.isAuthor
            ? 'bg-amber-500/[0.04] dark:bg-amber-500/[0.07] border-amber-500/25'
            : 'bg-salon-card border-salon-border shadow-sm'
        } ${isBranchHovered ? 'border-indigo-400/60 shadow-md' : ''} p-4 sm:p-5 space-y-3`}>
          
          {/* Card Header: Avatar, Name, Role, Stance Badge, Timestamp */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={comment.author.avatar}
                  alt={comment.author.name}
                  className={`w-9 h-9 rounded-full object-cover ring-2 ${
                    comment.author.isAuthor ? 'ring-amber-500' : 'ring-salon-border'
                  }`}
                />
                {comment.author.isAuthor && (
                  <span className="absolute -bottom-1 -right-1 text-[10px] bg-amber-500 text-white rounded-full px-1 font-bold">
                    ★
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-salon-ink-primary">
                    {comment.author.name}
                  </span>
                  
                  {comment.author.isAuthor && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-mono">
                      Author
                    </span>
                  )}

                  {comment.author.isExpert && !comment.author.isAuthor && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                      Verified Expert
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-salon-ink-muted">
                  <span>{comment.author.role}</span>
                  <span>•</span>
                  <span className="font-mono">{formattedTime(comment.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Right Header: Stance Tag & Deep Thread Focus Button */}
            <div className="flex items-center gap-2">
              {stanceInfo && (
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${stanceInfo.badgeClass}`}>
                  {stanceInfo.icon} {stanceInfo.label}
                </span>
              )}

              {/* Button to open in Focus Drawer if thread has depth */}
              {(hasChildren || isDeep) && (
                <button
                  onClick={() => setFocusThreadId(comment.id)}
                  className="p-1 rounded-lg text-salon-ink-muted hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  title="Open this discussion branch in Focus Drawer (55ch width)"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Anchored Quoted Passage (Clickable to scroll & highlight host paragraph) */}
          {comment.quotedText && (
            <div 
              onClick={() => comment.paragraphId && jumpToParagraph(comment.paragraphId)}
              className="group/quote flex items-start gap-2.5 p-3 rounded-xl bg-salon-nested/80 border-l-3 border-amber-500/80 cursor-pointer hover:bg-amber-500/[0.06] transition-colors text-xs"
              title="Click to jump to referenced paragraph in article"
            >
              <div className="flex-1 font-serif italic text-salon-ink-secondary leading-relaxed">
                "{comment.quotedText}"
              </div>
              <CornerDownRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 opacity-70 group-hover/quote:translate-x-0.5 transition-transform" />
            </div>
          )}

          {/* Comment Body Copy */}
          <div className="text-sm leading-relaxed text-salon-ink-primary whitespace-pre-wrap">
            {comment.body}
          </div>

          {/* Active Typers Footer */}
          {activeTypers.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg animate-pulse">
              <Radio className="w-3 h-3 text-emerald-500" />
              <span>
                {activeTypers.map(t => t.name).join(', ')} is typing a response...
              </span>
            </div>
          )}

          {/* Nuance Reactions Bar & Reply Trigger */}
          <NuanceReactions
            comment={comment}
            onReplyClick={() => setIsReplying(!isReplying)}
          />

          {/* Inline Reply Composer */}
          {isReplying && (
            <form onSubmit={handleInlineSubmit} className="pt-3 mt-3 border-t border-salon-border/80 space-y-2 animate-fade-in">
              <div className="flex items-center gap-1.5 text-xs text-salon-ink-muted">
                <span>Replying with stance:</span>
                <select
                  value={inlineStance}
                  onChange={(e) => setInlineStance(e.target.value)}
                  className="px-2 py-0.5 rounded-md border border-salon-border bg-salon-card text-salon-ink-primary text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="building">🌱 Building on this</option>
                  <option value="counterpoint">🔄 Counter-Example</option>
                  <option value="question">❓ Question for Author</option>
                  <option value="resource">📎 Sharing a Resource</option>
                  <option value="fix">🛠️ Fix / Clarification</option>
                </select>
              </div>

              <textarea
                rows={2}
                placeholder={`Reply to ${comment.author.name}...`}
                value={inlineReplyText}
                onChange={(e) => setInlineReplyText(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-salon-border bg-salon-nested dark:bg-zinc-900/80 text-salon-ink-primary focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReplying(false)}
                  className="px-3 py-1 rounded-lg text-xs text-salon-ink-secondary hover:text-salon-ink-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!inlineReplyText.trim()}
                  className="px-3.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white shadow-sm transition-all"
                >
                  Post Reply
                </button>
              </div>
            </form>
          )}

          {/* Collapsed Spine Indicator Banner */}
          {isCollapsed && hasChildren && (
            <button
              onClick={() => toggleCollapseSpine(comment.id)}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-salon-nested border border-salon-border hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-xs font-semibold text-salon-ink-secondary flex items-center justify-center gap-2 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span>
                Expand {childCount} folded {childCount === 1 ? 'reply' : 'replies'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Nested Replies Rendering (Capped at 2 visual indentations) */}
      {!isCollapsed && hasChildren && (
        <div className={`space-y-3 mt-3 ${
          depth === 0 ? 'ml-6 sm:ml-8 pl-2 border-l-2 border-salon-border/60' : 'ml-3 sm:ml-4'
        }`}>
          {comment.children.map(child => (
            <ThreadCard
              key={child.id}
              comment={child}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
