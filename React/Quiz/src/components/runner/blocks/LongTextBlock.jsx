import React, { useEffect, useRef } from 'react';

export default function LongTextBlock({
  question,
  value = '',
  onChange,
  onSubmit,
  disabled = false
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [question.id, disabled]);

  const handleKeyDown = (e) => {
    // Ctrl + Enter or Cmd + Enter to advance
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (onSubmit) onSubmit();
    }
  };

  return (
    <div className="w-full max-w-xl">
      <textarea
        ref={textareaRef}
        rows={4}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={question.properties?.placeholder || 'Write your thoughts here...'}
        className="w-full bg-[#121418] border border-white/10 rounded-xl p-4 text-lg text-white placeholder-slate-500 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all resize-y"
      />
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="keycap-badge">Ctrl + Enter ↵</span>
          <span>to advance</span>
        </div>
        <span>{value ? `${value.length} characters` : 'Shift + Enter for new line'}</span>
      </div>
    </div>
  );
}
