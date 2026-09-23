import React, { useEffect, useState } from 'react';
import { Feather, Clock } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { WordChoice } from '@/types/game';
import { cn } from '@/lib/utils';

interface WordSelectModalProps {
  open: boolean;
  choices: WordChoice[];
  onSelectWord: (choice: WordChoice) => void;
  isArtist: boolean;
  artistName: string;
}

export const WordSelectModal: React.FC<WordSelectModalProps> = ({
  open,
  choices,
  onSelectWord,
  isArtist,
  artistName,
}) => {
  const [countdown, setCountdown] = useState<number>(10);

  useEffect(() => {
    if (!open) {
      setCountdown(10);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto-select fallback (middle choice or first choice)
          if (choices.length > 0) {
            const fallback = choices[1] || choices[0];
            onSelectWord(fallback);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, choices, onSelectWord]);

  return (
    <Dialog open={open} onOpenChange={() => {}} showClose={false}>
      <div className="w-12 h-12 rounded-2xl bg-studio-sienna/15 text-studio-sienna border border-studio-sienna/30 mx-auto flex items-center justify-center mb-3 shadow-inner">
        <Feather className="w-6 h-6" />
      </div>

      <h2 className="text-lg font-serif font-bold text-studio-ink">
        {isArtist ? 'Your Turn at the Easel!' : `${artistName} is choosing a prompt...`}
      </h2>

      <p className="text-xs font-sans text-studio-charcoal mt-1 mb-4 flex items-center justify-center gap-1">
        <Clock className="w-3.5 h-3.5 text-studio-sienna" />
        <span>
          {isArtist ? 'Choose your sketch prompt. Auto-selecting in ' : 'Auto-selecting in '}
          <span className="font-bold text-studio-sienna">{countdown}s</span>
        </span>
      </p>

      {isArtist ? (
        <div className="space-y-2.5">
          {choices.map((choice) => {
            const isEasy = choice.difficulty === 'EASY';
            const isHard = choice.difficulty === 'HARD';

            return (
              <button
                key={choice.word}
                onClick={() => onSelectWord(choice)}
                className="w-full p-3 rounded-2xl bg-white hover:bg-studio-cream border border-[#D5C7B0] hover:border-studio-sienna flex items-center justify-between transition-all group shadow-sm active:scale-98 text-left cursor-pointer"
              >
                <div>
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border font-sans',
                      isEasy
                        ? 'text-studio-moss bg-emerald-100/80 border-emerald-300/60'
                        : isHard
                        ? 'text-studio-sienna bg-studio-sienna/10 border-studio-sienna/30'
                        : 'text-amber-800 bg-amber-100/80 border-amber-300/60'
                    )}
                  >
                    {isEasy ? 'Gentle Sketch' : isHard ? 'Masterpiece' : 'Detailed'}
                  </span>
                  <div className="text-base font-serif font-bold text-studio-ink group-hover:text-studio-sienna mt-1">
                    {choice.word}
                  </div>
                  <div className="text-[10px] text-studio-charcoal/70 font-sans">
                    {choice.category}
                  </div>
                </div>
                <span
                  className={cn(
                    'font-mono text-xs font-bold',
                    isEasy
                      ? 'text-studio-charcoal'
                      : isHard
                      ? 'text-studio-sienna'
                      : 'text-amber-700'
                  )}
                >
                  +{choice.points} pts
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="p-6 bg-white/70 rounded-2xl border border-[#D5C7B0] text-center">
          <div className="inline-block animate-spin text-studio-sienna mb-2">
            <Feather className="w-5 h-5" />
          </div>
          <p className="text-xs font-serif italic text-studio-charcoal">
            The easel is being prepared for the next artistic round...
          </p>
        </div>
      )}
    </Dialog>
  );
};
