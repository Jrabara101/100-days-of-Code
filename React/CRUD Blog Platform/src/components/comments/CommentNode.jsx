import React, { useState } from 'react';
import { useBlog } from '../../context/BlogContext';
import { CommentComposer } from './CommentComposer';
import { 
  Pin, 
  CornerDownRight, 
  Trash2, 
  Edit3, 
  Flag, 
  ChevronDown, 
  ChevronRight, 
  Check, 
  Clock 
} from 'lucide-react';

export const CommentNode = ({ 
  comment, 
  allComments, 
  postAuthorId, 
  depth = 0 
}) => {
  const { 
    currentUser, 
    upvoteComment, 
    deleteComment, 
    editComment, 
    togglePinComment, 
    flagComment 
  } = useBlog();

  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(comment.upvotesCount || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  // Child replies for this comment
  const childReplies = allComments.filter(c => c.parentId === comment.id);

  const isAuthor = comment.userId === postAuthorId;
  const isCurrentUser = comment.userId === currentUser.id;
  const isDeleted = comment.status === 'deleted';

  // Format relative time
  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleUpvote = () => {
    if (isDeleted) return;
    const res = upvoteComment(comment.id);
    if (res) {
      setLocalUpvotes(res.upvotesCount);
      setHasUpvoted(res.hasUpvoted);
    }
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    editComment(comment.id, editContent);
    setIsEditing(false);
  };

  // Render markdown-like simple paragraphs and quotes
  const renderFormattedText = (text) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('> ')) {
        return (
          <blockquote
            key={idx}
            className="my-1.5 pl-3 border-l-2 border-[#E11D48] text-xs italic text-[#71717A] dark:text-[#9496A1]"
          >
            {line.replace(/^>\s+/, '')}
          </blockquote>
        );
      }
      if (line.trim().startsWith('`') && line.trim().endsWith('`')) {
        return (
          <code
            key={idx}
            className="inline-block my-0.5 px-1.5 py-0.5 rounded font-mono text-xs bg-[#F3F3EE] dark:bg-[#1B1C21] text-[#E11D48]"
          >
            {line.replace(/`/g, '')}
          </code>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-xs sm:text-sm leading-relaxed text-[#18181B] dark:text-[#F4F4F6]">
          {line}
        </p>
      );
    });
  };

  return (
    <div className={`relative ${depth > 0 ? 'mt-3 pl-3 sm:pl-5' : 'mt-4'}`}>
      
      {/* 1px Vertical Thread Guideline */}
      {depth > 0 && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute left-0 top-0 bottom-0 w-2 group cursor-pointer"
          title={isCollapsed ? 'Expand thread' : 'Collapse thread'}
        >
          <div className="w-[1.5px] h-full bg-[#E5E5DF] dark:bg-[#26272C] group-hover:bg-[#E11D48] transition-colors" />
        </button>
      )}

      {/* Main Comment Bubble */}
      <div className={`p-4 rounded-xl border border-[#E5E5DF] dark:border-[#26272C] bg-white dark:bg-[#141518] ${comment.isPinned ? 'ring-1 ring-[#D97706]/40 bg-[#D97706]/5' : ''}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={comment.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'}
              alt={comment.user?.name}
              className="w-6 h-6 rounded-full object-cover border border-[#E5E5DF] dark:border-[#26272C] shrink-0"
            />
            <span className="text-xs font-semibold text-[#18181B] dark:text-[#F4F4F6] truncate">
              {comment.user?.name}
            </span>
            <span className="text-[11px] text-[#71717A] dark:text-[#9496A1] font-mono hidden sm:inline">
              {comment.user?.handle}
            </span>

            {/* OP / Author Badge */}
            {isAuthor && (
              <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded-full bg-[#E11D48]/10 text-[#E11D48] border border-[#E11D48]/20 shrink-0">
                Author
              </span>
            )}

            {/* Pinned Badge */}
            {comment.isPinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full bg-[#D97706]/15 text-[#D97706] shrink-0">
                <Pin className="w-2.5 h-2.5" /> Pinned
              </span>
            )}

            <span className="text-[11px] text-[#71717A] dark:text-[#9496A1]">·</span>
            <span className="text-[11px] text-[#71717A] dark:text-[#9496A1] shrink-0">
              {timeAgo(comment.createdAt)}
            </span>

            {comment.isEdited && (
              <span className="text-[10px] text-[#71717A] dark:text-[#9496A1] italic">
                (edited)
              </span>
            )}
          </div>

          {/* Quick Collapse / Fold Button */}
          {childReplies.length > 0 && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-[11px] font-mono text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F6] px-1.5 py-0.5 rounded hover:bg-[#F3F3EE] dark:hover:bg-[#1B1C21] transition-colors cursor-pointer"
            >
              {isCollapsed ? `[+ ${childReplies.length} replies]` : '[–]'}
            </button>
          )}
        </div>

        {/* Comment Content / Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="mt-2 space-y-2">
            <textarea
              rows={3}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-[#E5E5DF] dark:border-[#26272C] bg-[#FAFAF8] dark:bg-[#0C0D0E] text-xs text-[#18181B] dark:text-[#F4F4F6]"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 text-xs text-[#71717A] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded-md text-xs font-medium bg-[#18181B] text-white dark:bg-[#F4F4F6] dark:text-[#18181B] cursor-pointer"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className={`mt-1 font-serif text-sm ${isDeleted ? 'italic text-[#71717A] dark:text-[#9496A1]' : ''}`}>
            {isDeleted ? (
              <p className="text-xs font-mono opacity-80">[Comment deleted by user]</p>
            ) : (
              renderFormattedText(comment.content)
            )}
          </div>
        )}

        {/* Action Bar */}
        {!isDeleted && (
          <div className="mt-3 pt-2 border-t border-[#E5E5DF]/60 dark:border-[#26272C]/60 flex items-center justify-between text-xs font-mono text-[#71717A] dark:text-[#9496A1]">
            <div className="flex items-center gap-3">
              {/* Upvote button */}
              <button
                onClick={handleUpvote}
                className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  hasUpvoted
                    ? 'text-[#0D9488] font-bold bg-[#0D9488]/10'
                    : 'hover:text-[#18181B] dark:hover:text-[#F4F4F6]'
                }`}
                title="Upvote contribution"
              >
                <span>▲</span>
                <span>{localUpvotes}</span>
              </button>

              {/* Reply toggle */}
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="hover:text-[#18181B] dark:hover:text-[#F4F4F6] cursor-pointer flex items-center gap-1"
              >
                <CornerDownRight className="w-3 h-3" />
                <span>Reply</span>
              </button>

              {/* Edit button (author only) */}
              {isCurrentUser && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="hover:text-[#18181B] dark:hover:text-[#F4F4F6] cursor-pointer"
                  title="Edit comment (15m window)"
                >
                  Edit
                </button>
              )}

              {/* Pin toggle (post author only) */}
              {currentUser.id === postAuthorId && (
                <button
                  onClick={() => togglePinComment(comment.id)}
                  className={`cursor-pointer ${comment.isPinned ? 'text-[#D97706]' : 'hover:text-[#18181B] dark:hover:text-[#F4F4F6]'}`}
                  title="Pin to top of discussion"
                >
                  {comment.isPinned ? 'Unpin' : 'Pin'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Delete button (author only) */}
              {isCurrentUser && (
                <button
                  onClick={() => {
                    if (window.confirm('Delete your comment? Child replies will remain preserved.')) {
                      deleteComment(comment.id);
                    }
                  }}
                  className="hover:text-[#E11D48] cursor-pointer p-0.5"
                  title="Delete comment"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}

              {/* Flag button */}
              <button
                onClick={() => flagComment(comment.id)}
                className="hover:text-[#D97706] cursor-pointer p-0.5"
                title="Report/Flag comment"
              >
                <Flag className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Inline Nested Reply Composer */}
      {isReplying && (
        <div className="mt-3 pl-4">
          <CommentComposer
            postId={comment.postId}
            parentId={comment.id}
            placeholder={`Reply to @${comment.user?.name}...`}
            onSuccess={() => setIsReplying(false)}
            onCancel={() => setIsReplying(false)}
          />
        </div>
      )}

      {/* Recursive Child Replies */}
      {!isCollapsed && childReplies.length > 0 && (
        <div className="space-y-2 mt-2">
          {childReplies.map(child => (
            <CommentNode
              key={child.id}
              comment={child}
              allComments={allComments}
              postAuthorId={postAuthorId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

    </div>
  );
};
