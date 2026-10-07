import React, { useState, useEffect } from 'react';
import { useBlog } from '../../context/BlogContext';
import { CommentComposer } from './CommentComposer';
import { CommentNode } from './CommentNode';
import { MessageSquare, ArrowUpDown, ShieldCheck } from 'lucide-react';
import * as storage from '../../services/storageService';

export const CommentSection = ({ postId, postAuthorId }) => {
  const { posts } = useBlog();
  const [allComments, setAllComments] = useState([]);
  const [sortOrder, setSortOrder] = useState('top'); // 'top' | 'newest' | 'oldest'

  const refreshComments = () => {
    setAllComments(storage.getComments(postId));
  };

  useEffect(() => {
    refreshComments();
  }, [postId, posts]);

  // Top-level comments only (children are recursively rendered by CommentNode)
  const topLevelComments = allComments.filter(c => !c.parentId);

  // Sorting
  const sortedTopLevel = [...topLevelComments].sort((a, b) => {
    // Always keep pinned comments at the very top
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    if (sortOrder === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortOrder === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else {
      // Top upvoted
      return (b.upvotesCount || 0) - (a.upvotesCount || 0);
    }
  });

  return (
    <section 
      id="comments-discussion-section" 
      className="mt-16 pt-10 border-t border-[#E5E5DF] dark:border-[#26272C]"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-5 h-5 text-[#4F46E5]" />
          <h3 className="font-serif font-bold text-2xl text-[#18181B] dark:text-[#F4F4F6]">
            Discussion ({allComments.length})
          </h3>
        </div>

        {/* Sort Controls & Civility Note */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#71717A] dark:text-[#9496A1]">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-transparent border-none text-[#18181B] dark:text-[#F4F4F6] font-semibold cursor-pointer outline-hidden"
            >
              <option value="top">Top Upvoted</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Chronological</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top-Level Composer */}
      <div className="mb-8">
        <CommentComposer
          postId={postId}
          onSuccess={refreshComments}
          placeholder="Share an insight, question, or counterpoint with civil intent..."
        />
      </div>

      {/* Civility Guardrail Banner */}
      <div className="p-3 mb-6 rounded-xl bg-[#F3F3EE]/60 dark:bg-[#141518]/60 border border-[#E5E5DF]/70 dark:border-[#26272C]/70 flex items-center gap-2.5 text-[11px] text-[#71717A] dark:text-[#9496A1]">
        <ShieldCheck className="w-4 h-4 text-[#0D9488] shrink-0" />
        <span>
          High-signal community guidelines active: Focus on technical precision and intellectual generosity. Quote phrases to ground your counter-arguments.
        </span>
      </div>

      {/* Comment List */}
      {sortedTopLevel.length === 0 ? (
        <div className="p-10 text-center rounded-2xl border border-dashed border-[#E5E5DF] dark:border-[#26272C] bg-[#FAFAF8]/50 dark:bg-[#141518]/50 text-xs text-[#71717A] dark:text-[#9496A1]">
          <p className="font-serif text-sm text-[#18181B] dark:text-[#F4F4F6] mb-1">
            No contributions yet in this discussion
          </p>
          <p>
            Start the discourse above or highlight any passage in the essay to quote it directly.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTopLevel.map(comment => (
            <CommentNode
              key={comment.id}
              comment={comment}
              allComments={allComments}
              postAuthorId={postAuthorId}
              depth={0}
            />
          ))}
        </div>
      )}
    </section>
  );
};
