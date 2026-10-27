import React from 'react';
import { Calendar } from 'lucide-react';

export default function DatePickerBlock({
  question,
  value = '',
  onChange,
  onSubmit,
  disabled = false
}) {
  return (
    <div className="w-full max-w-md">
      <div className="relative flex items-center">
        <input
          type="date"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (onSubmit) onSubmit();
            }
          }}
          className="w-full bg-[#121418] border border-white/10 rounded-xl p-4 text-xl text-white outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all cursor-pointer [color-scheme:dark]"
        />
        <Calendar className="w-5 h-5 text-slate-400 absolute right-4 pointer-events-none" />
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <span className="keycap-badge">Enter ↵</span>
        <span>to confirm date</span>
      </div>
    </div>
  );
}
