import React from 'react';

export default function DateDivider({ dateLabel }) {
  return (
    <div className="flex items-center justify-center my-4 select-none">
      <div className="h-px bg-slate-200 dark:bg-[#23262D] flex-grow max-w-[120px]" />
      <span className="mx-3 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide bg-slate-100 dark:bg-[#181A20] text-slate-500 dark:text-[#8F9CAE] border border-slate-200/80 dark:border-[#23262D] shadow-sm">
        {dateLabel}
      </span>
      <div className="h-px bg-slate-200 dark:bg-[#23262D] flex-grow max-w-[120px]" />
    </div>
  );
}
