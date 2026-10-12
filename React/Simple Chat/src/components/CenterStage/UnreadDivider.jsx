import React from 'react';

export default function UnreadDivider() {
  return (
    <div className="flex items-center justify-center my-4 select-none relative animate-pop-in">
      <div className="h-[1.5px] bg-red-500/70 dark:bg-red-500/80 flex-grow" />
      <span className="mx-2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500 text-white shadow-sm">
        New Messages
      </span>
      <div className="h-[1.5px] bg-red-500/70 dark:bg-red-500/80 flex-grow" />
    </div>
  );
}
