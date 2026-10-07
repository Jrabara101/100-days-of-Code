import React, { useState, useEffect, useRef } from 'react';
import { useBlog } from '../../context/BlogContext';
import { Bold, Code, MessageSquareQuote, Send, X } from 'lucide-react';

export const CommentComposer = ({ 
  postId, 
  parentId = null, 
  onSuccess, 
  onCancel, 
  placeholder = "Contribute to this discussion with signal..." 
}) => {
  const { 
    currentUser, 
    addComment, 
    quoteForComposer, 
    setQuoteForComposer 
  } = useBlog();

  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);

  // If a quote was activated via TextSelectionQuoteTooltip, insert into top-level composer
  useEffect(() => {
    if (quoteForComposer && !parentId) {
      setContent(prev => {
        const prefix = `> ${quoteForComposer}\n\n`;
        return prev ? `${prev}\n\n${prefix}` : prefix;
      });
      setQuoteForComposer('');
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [quoteForComposer, parentId, setQuoteForComposer]);

  const insertMarkdown = (prefix, suffix = '') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.substring(start, end);

    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newText = content.substring(0, start) + replacement + content.substring(end);
    setContent(newText);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
    }, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);

    // Optimistic delay simulation
    setTimeout(() => {
      addComment({
        postId,
        parentId,
        content: content.trim()
      });

      setContent('');
      setIsSubmitting(false);
      if (onSuccess) onSuccess();
    }, 180);
  };

  return (
    <form 
      id={!parentId ? "comment-composer-box" : undefined}
      onSubmit={handleSubmit}
      className="p-4 rounded-2xl border border-[#E5E5DF] dark:border-[#26272C] bg-white dark:bg-[#141518] shadow-xs"
    >
      {/* Header with User Info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-6 h-6 rounded-full object-cover border border-[#E5E5DF] dark:border-[#26272C]"
          />
          <span className="text-xs font-medium text-[#18181B] dark:text-[#F4F4F6]">
            {currentUser.name}
          </span>
          <span className="text-[11px] text-[#71717A] dark:text-[#9496A1] font-mono">
            {currentUser.handle}
          </span>
        </div>

        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => insertMarkdown('**', '**')}
            className="p-1.5 rounded-md text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F6] hover:bg-[#F3F3EE] dark:hover:bg-[#1B1C21] transition-colors cursor-pointer"
            title="Bold (**text**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('`', '`')}
            className="p-1.5 rounded-md text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F6] hover:bg-[#F3F3EE] dark:hover:bg-[#1B1C21] transition-colors cursor-pointer"
            title="Inline Code (`code`)"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('> ')}
            className="p-1.5 rounded-md text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F6] hover:bg-[#F3F3EE] dark:hover:bg-[#1B1C21] transition-colors cursor-pointer"
            title="Blockquote (> quote)"
          >
            <MessageSquareQuote className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        rows={parentId ? 3 : 4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3 rounded-xl border border-[#E5E5DF] dark:border-[#26272C] bg-[#FAFAF8] dark:bg-[#0C0D0E] text-xs sm:text-sm text-[#18181B] dark:text-[#F4F4F6] focus:outline-hidden focus:ring-1 focus:ring-[#18181B] dark:focus:ring-white transition-all resize-y font-sans leading-relaxed"
      />

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#E5E5DF]/60 dark:border-[#26272C]/60">
        <span className="text-[11px] font-mono text-[#71717A] dark:text-[#9496A1]">
          Markdown formatting supported
        </span>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F6] cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-[#18181B] text-white dark:bg-[#F4F4F6] dark:text-[#18181B] hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
          >
            <Send className="w-3 h-3" />
            <span>{isSubmitting ? 'Posting...' : 'Submit Response'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
