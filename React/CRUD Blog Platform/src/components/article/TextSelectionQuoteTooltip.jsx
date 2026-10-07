import React, { useState, useEffect } from 'react';
import { useBlog } from '../../context/BlogContext';
import { MessageSquareQuote, Sparkles } from 'lucide-react';

export const TextSelectionQuoteTooltip = ({ containerRef, articleTitle, authorName }) => {
  const { activateQuoteInComment, setQuoteShareData } = useBlog();
  const [position, setPosition] = useState(null);
  const [selectedText, setSelectedText] = useState('');

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setPosition(null);
        setSelectedText('');
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 5) {
        setPosition(null);
        return;
      }

      // Check if selection is within the article container
      if (containerRef.current && containerRef.current.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setPosition({
          top: rect.top - 46,
          left: rect.left + rect.width / 2
        });
        setSelectedText(text);
      }
    };

    const handleMouseDown = (e) => {
      // Don't close immediately if clicking inside the tooltip itself
      if (e.target.closest('#quote-tooltip-pill')) return;
      setPosition(null);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [containerRef]);

  if (!position || !selectedText) return null;

  const handleQuoteInComment = () => {
    activateQuoteInComment(selectedText);
    setPosition(null);

    // Smooth scroll down to the comment composer
    const composer = document.getElementById('comment-composer-box');
    if (composer) {
      composer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const textarea = composer.querySelector('textarea');
        textarea?.focus();
      }, 400);
    }
  };

  const handleShareQuoteCard = () => {
    setQuoteShareData({
      isOpen: true,
      quote: selectedText,
      author: authorName,
      title: articleTitle
    });
    setPosition(null);
  };

  return (
    <div
      id="quote-tooltip-pill"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)'
      }}
      className="fixed z-50 flex items-center gap-1.5 p-1 bg-[#18181B] text-white dark:bg-[#F4F4F6] dark:text-[#18181B] rounded-full shadow-2xl border border-white/10 text-xs font-medium animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      <button
        onClick={handleQuoteInComment}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full hover:bg-white/15 dark:hover:bg-black/10 transition-colors cursor-pointer"
        title="Insert quote into discussion response"
      >
        <MessageSquareQuote className="w-3.5 h-3.5 text-[#E11D48]" />
        <span>Quote in Comment</span>
      </button>

      <div className="w-[1px] h-3.5 bg-white/20 dark:bg-black/20" />

      <button
        onClick={handleShareQuoteCard}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-white/15 dark:hover:bg-black/10 transition-colors cursor-pointer"
        title="Generate quote card"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
        <span>Share</span>
      </button>
    </div>
  );
};
