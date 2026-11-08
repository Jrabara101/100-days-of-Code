import React from 'react';
import { sounds } from '../../services/audioEffects';

interface ClozeFillQuestionProps {
  template: string; // e.g. "broadcastTime ({{blank1}}) << electionTimeout ({{blank2}}) << MTBF ({{blank3}})"
  solutions?: Record<string, string>;
  userValues?: Record<string, string>;
  isSubmitted: boolean;
  onChangeValue: (blankKey: string, value: string) => void;
}

export const ClozeFillQuestion: React.FC<ClozeFillQuestionProps> = ({
  template,
  solutions,
  userValues = {},
  isSubmitted,
  onChangeValue
}) => {
  // Split template by {{...}}
  const parts = template.split(/(\{\{[a-zA-Z0-9_]+\}\})/g);

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#171B26] border border-black/10 dark:border-white/10 shadow-xs space-y-4">
      <div className="text-xs font-mono text-slate-500">
        Enter the technical values or time windows into each code slot:
      </div>

      <div className="p-4 rounded-xl bg-black/5 dark:bg-black/60 border border-black/10 dark:border-white/10 font-mono text-sm leading-loose text-slate-800 dark:text-slate-200 flex flex-wrap items-center gap-2">
        {parts.map((part, index) => {
          const match = part.match(/\{\{([a-zA-Z0-9_]+)\}\}/);
          if (match) {
            const blankKey = match[1];
            const val = userValues[blankKey] || '';
            const correctVal = solutions?.[blankKey] || '';

            let borderStyle = 'border-indigo-400 focus:border-indigo-600 bg-white dark:bg-[#11141C]';
            if (isSubmitted) {
              const isMatch = val.trim().toLowerCase() === correctVal.trim().toLowerCase();
              borderStyle = isMatch
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                : 'border-red-500 bg-red-500/10 text-red-400';
            }

            return (
              <span key={index} className="inline-flex flex-col mx-1">
                <input
                  type="text"
                  disabled={isSubmitted}
                  value={val}
                  onChange={e => onChangeValue(blankKey, e.target.value)}
                  placeholder="e.g. 150ms-300ms"
                  className={`px-2.5 py-1 text-xs font-mono rounded-lg border outline-hidden shadow-xs w-36 text-center ${borderStyle}`}
                />
                {isSubmitted && (
                  <span className="text-[10px] text-emerald-500 font-mono text-center mt-0.5">
                    ({correctVal})
                  </span>
                )}
              </span>
            );
          }

          return <span key={index}>{part}</span>;
        })}
      </div>
    </div>
  );
};

