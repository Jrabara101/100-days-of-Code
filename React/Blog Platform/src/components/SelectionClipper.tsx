import React, { useState, useEffect } from 'react';
import { useReader } from '../context/ReaderContext';
import { Scissors, Share2, Film, Check } from 'lucide-react';
import { Article } from '../types';
import confetti from 'canvas-confetti';

interface SelectionClipperProps {
  article: Article;
  onJumpToVideo?: (timestampSec: number) => void;
}

export const SelectionClipper: React.FC<SelectionClipperProps> = ({ article, onJumpToVideo }) => {
  const { saveNewHighlight, openQuoteCard } = useReader();
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    function handleSelectionChange() {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        // Debounce slightly to allow button click
        setTimeout(() => {
          if (!window.getSelection()?.toString().trim()) {
            setPosition(null);
            setSelectedText('');
          }
        }, 150);
        return;
      }

      const text = selection.toString().trim();
      if (text.length >= 15) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedText(text);
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + window.scrollY - 10,
        });
      } else {
        setPosition(null);
        setSelectedText('');
      }
    }

    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('keyup', handleSelectionChange);
    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('keyup', handleSelectionChange);
    };
  }, []);

  if (!position || !selectedText) return null;

  const handleSaveToNotebook = () => {
    saveNewHighlight({
      articleId: article.id,
      articleTitle: article.title,
      categoryName: article.categoryId,
      selectedText,
    });
    setSavedSuccess(true);

    try {
      confetti({
        particleCount: 20,
        spread: 40,
        origin: { y: 0.8 },
      });
    } catch (e) {}

    setTimeout(() => {
      setSavedSuccess(false);
      window.getSelection()?.removeAllRanges();
      setPosition(null);
    }, 1500);
  };

  const handleShareQuoteCard = () => {
    openQuoteCard(selectedText, article.title, article.author.name, article.categoryId);
    window.getSelection()?.removeAllRanges();
    setPosition(null);
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
      }}
      className="z-50 animate-slide-up"
    >
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full shadow-2xl bg-neutral-900/90 text-white border border-white/20 glass-pill text-xs font-interface font-medium">
        {/* Save to Notebook */}
        <button
          onClick={handleSaveToNotebook}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-white/20 transition-colors text-amber-300 cursor-pointer"
        >
          {savedSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">Saved!</span>
            </>
          ) : (
            <>
              <Scissors className="w-3.5 h-3.5" />
              <span>Save to Notebook</span>
            </>
          )}
        </button>

        <span className="opacity-30">|</span>

        {/* Share Quote Card */}
        <button
          onClick={handleShareQuoteCard}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-white/20 transition-colors text-rose-300 cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Quote Card</span>
        </button>

        {/* Jump to video if video exists */}
        {article.hasVideo && onJumpToVideo && (
          <>
            <span className="opacity-30">|</span>
            <button
              onClick={() => {
                onJumpToVideo(120);
                window.getSelection()?.removeAllRanges();
                setPosition(null);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-white/20 transition-colors text-purple-300 cursor-pointer"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Video Sync</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
