import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import type { VoiceAttachment } from '../../types/chat';
import { cn, formatDuration } from '../../lib/utils';

interface VoiceNotePlayerProps {
  attachment: VoiceAttachment;
  isOutbound: boolean;
}

export function VoiceNotePlayer({ attachment, isOutbound }: VoiceNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const duration = Math.max(1, attachment.durationSec);
  const progress = Math.min(1, currentTime / duration);

  useEffect(() => {
    if (attachment.audioUrl) {
      const audio = new Audio(attachment.audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      return () => {
        audio.pause();
        audioRef.current = null;
      };
    }
    return undefined;
  }, [attachment.audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (audioRef.current) {
      void audioRef.current.play().catch(() => {});
    }

    timerRef.current = window.setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        setCurrentTime(audioRef.current.currentTime);
        return;
      }
      setCurrentTime((prev) => {
        const next = prev + 0.1 * speed;
        if (next >= duration) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, duration]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  const handleScrub = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetSec = ratio * duration;
    setCurrentTime(targetSec);
    if (audioRef.current) {
      audioRef.current.currentTime = targetSec;
    }
  };

  const cycleSpeed = () => {
    setSpeed((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1));
  };

  const bars = attachment.waveform.slice(0, 32);

  return (
    <div className="space-y-2 min-w-[240px] max-w-[320px]">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95',
            isOutbound
              ? 'bg-white text-blue-600 shadow-sm'
              : 'bg-blue-600 text-white shadow-sm'
          )}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* 32-bar interactive SVG waveform */}
        <div className="flex-1 min-w-0">
          <svg
            viewBox="0 0 160 28"
            className="w-full h-7 cursor-pointer"
            onClick={handleScrub}
            role="slider"
            aria-label="Voice waveform scrubber"
            aria-valuenow={Math.round(currentTime)}
            aria-valuemin={0}
            aria-valuemax={duration}
          >
            {bars.map((amp, i) => {
              const barPct = (i + 0.5) / bars.length;
              const filled = barPct <= progress;
              const height = Math.max(4, Math.round(amp * 24));
              const y = Math.round((28 - height) / 2);
              return (
                <rect
                  key={i}
                  x={i * 5}
                  y={y}
                  width="3"
                  height={height}
                  rx="1.5"
                  fill={
                    filled
                      ? isOutbound
                        ? '#FFFFFF'
                        : '#2563EB'
                      : isOutbound
                        ? 'rgba(255,255,255,0.35)'
                        : 'rgba(148,163,184,0.45)'
                  }
                />
              );
            })}
          </svg>

          <div className="flex items-center justify-between text-[11px] mt-0.5">
            <span
              className={cn(
                'tabular-nums-meta',
                isOutbound ? 'text-white/80' : 'text-txt-muted'
              )}
            >
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={cycleSpeed}
                className={cn(
                  'tabular-nums-meta px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition-colors',
                  isOutbound
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'bg-surface-tertiary text-txt-primary hover:bg-blue-500/15'
                )}
              >
                {speed}x
              </button>
              {attachment.transcript && (
                <button
                  type="button"
                  onClick={() => setTranscriptOpen((v) => !v)}
                  className={cn(
                    'px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition-colors',
                    isOutbound
                      ? 'bg-white/20 text-white hover:bg-white/30'
                      : 'bg-surface-tertiary text-txt-primary hover:bg-blue-500/15'
                  )}
                >
                  Aa Transcript
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {transcriptOpen && attachment.transcript && (
        <div
          className={cn(
            'rounded-xl px-3 py-2 text-xs leading-relaxed border',
            isOutbound
              ? 'bg-white/10 border-white/20 text-white/95'
              : 'bg-surface-secondary border-divider text-txt-muted'
          )}
        >
          “{attachment.transcript}”
        </div>
      )}
    </div>
  );
}

