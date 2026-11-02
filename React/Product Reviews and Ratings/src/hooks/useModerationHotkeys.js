import { useEffect, useState, useCallback } from 'react';

/**
 * useModerationHotkeys
 * Enables lightning-fast keyboard-first triage navigation (Linear-style speed).
 */
export function useModerationHotkeys({
  onNext,
  onPrev,
  onApprove,
  onReject,
  onRedactAndApprove,
  onToggleBlur,
  onReply,
  onHelp,
  isEnabled = true
}) {
  const [activeHotkey, setActiveHotkey] = useState(null);

  const handleKeyDown = useCallback((e) => {
    if (!isEnabled) return;

    // Do not capture hotkeys if focused in an input, textarea, or contentEditable
    const activeElement = document.activeElement;
    const isTyping =
      activeElement &&
      (activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable);

    // Escape always blurs active element
    if (e.key === 'Escape') {
      if (isTyping) {
        activeElement.blur();
        e.preventDefault();
        return;
      }
    }

    if (isTyping) return;

    const key = e.key.toLowerCase();

    // Flash visual feedback badge
    const flashHotkey = (char) => {
      setActiveHotkey(char.toUpperCase());
      setTimeout(() => setActiveHotkey(null), 300);
    };

    switch (key) {
      case 'j':
        e.preventDefault();
        flashHotkey('J');
        onNext && onNext();
        break;
      case 'k':
        e.preventDefault();
        flashHotkey('K');
        onPrev && onPrev();
        break;
      case 'a':
        e.preventDefault();
        flashHotkey('A');
        onApprove && onApprove();
        break;
      case 'r':
        e.preventDefault();
        flashHotkey('R');
        onReject && onReject();
        break;
      case 'e':
        e.preventDefault();
        flashHotkey('E');
        onRedactAndApprove && onRedactAndApprove();
        break;
      case 'b':
        e.preventDefault();
        flashHotkey('B');
        onToggleBlur && onToggleBlur();
        break;
      case 'm':
        e.preventDefault();
        flashHotkey('M');
        onReply && onReply();
        break;
      case '?':
      case '/':
        if (e.shiftKey) {
          e.preventDefault();
          onHelp && onHelp();
        }
        break;
      default:
        break;
    }
  }, [
    isEnabled,
    onNext,
    onPrev,
    onApprove,
    onReject,
    onRedactAndApprove,
    onToggleBlur,
    onReply,
    onHelp
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { activeHotkey };
}

