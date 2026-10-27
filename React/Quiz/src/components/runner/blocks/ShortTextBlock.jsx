import React, { useEffect, useRef } from 'react';
import { CornerDownLeft } from 'lucide-react';

export default function ShortTextBlock({
  question,
  value = '',
  onChange,
  onSubmit,
  disabled = false
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    // Auto-focus input on mount
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [question.id, disabled]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (onSubmit) onSubmit();
    }
  };

  return (
    <div className="w-full max-w-xl">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={question.properties?.placeholder || 'Type your answer here...'}
          className="w-full bg-transparent border-b-2 border-white/20 focus:border-brand text-xl sm:text-2xl py-3 px-1 text-white placeholder-slate-500 outline-none transition-all duration-200"
        />
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <span className="keycap-badge">Enter ↵</span>
        <span>to advance</span>
      </div>
    </div>
  );
}
