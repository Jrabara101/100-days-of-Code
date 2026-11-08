import React, { useEffect, useRef } from 'react';
import { TranscriptSegment } from '../../types';
import { Play, User } from 'lucide-react';
import { sounds } from '../../services/audioEffects';

interface TranscriptRailProps {
  transcriptSegments: TranscriptSegment[];
  currentTime: number;
  onSeekTo: (seconds: number) => void;
  formatTimecode: (seconds: number) => string;
}

export const TranscriptRail: React.FC<TranscriptRailProps> = ({
  transcriptSegments,
  currentTime,
  onSeekTo,
  formatTimecode
}) => {
  const activeItemRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to active transcript segment
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [currentTime]);

  const currentMs = currentTime * 1000;

  return (
    <div className="flex flex-col h-full bg-[#11141C] text-slate-200 overflow-y-auto p-4 space-y-2">
      <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[11px] font-mono text-slate-400">
        <span>AUTO-SCROLLING LECTURE TRANSCRIPT</span>
        <span>Click line to seek</span>
      </div>

      {transcriptSegments.map((segment, index) => {
        const isActive = currentMs >= segment.startMs && currentMs <= segment.endMs;
        const startSec = Math.floor(segment.startMs / 1000);

        return (
          <div
            key={index}
            ref={isActive ? activeItemRef : null}
            onClick={() => {
              sounds.playClick();
              onSeekTo(startSec);
            }}
            className={`p-3 rounded-xl transition-all cursor-pointer border ${
              isActive
                ? 'bg-indigo-600/20 border-indigo-500/60 shadow-sm text-white'
                : 'bg-transparent border-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-indigo-400 font-bold flex items-center gap-1">
                <Play className="w-2.5 h-2.5 fill-indigo-400" />
                {formatTimecode(startSec)}
              </span>

              {segment.speaker && (
                <span className="text-[10px] font-mono text-slate-500">
                  {segment.speaker}
                </span>
              )}
            </div>

            <p className={`text-xs leading-relaxed ${isActive ? 'font-medium text-slate-100' : ''}`}>
              {segment.text}
            </p>
          </div>
        );
      })}
    </div>
  );
};

