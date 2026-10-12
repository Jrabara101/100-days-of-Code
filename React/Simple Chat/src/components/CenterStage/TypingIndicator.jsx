import React from 'react';

export default function TypingIndicator({ typers = [] }) {
  if (!typers || typers.length === 0) return null;

  const names = typers.map((t) => t.userName || 'Someone');
  let labelText = '';
  if (names.length === 1) {
    labelText = `${names[0]} is typing...`;
  } else if (names.length === 2) {
    labelText = `${names[0]} and ${names[1]} are typing...`;
  } else {
    labelText = `${names[0]} and ${names.length - 1} others are typing...`;
  }

  return (
    <div className="px-6 py-1.5 flex items-center space-x-2 animate-pop-in text-xs text-slate-500 dark:text-[#8F9CAE]">
      <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-slate-200/60 dark:bg-[#1E2026] border border-slate-300/40 dark:border-[#23262D]">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 typing-dot-1" />
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 typing-dot-2" />
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 typing-dot-3" />
      </div>
      <span className="italic font-medium tracking-tight">{labelText}</span>
    </div>
  );
}
