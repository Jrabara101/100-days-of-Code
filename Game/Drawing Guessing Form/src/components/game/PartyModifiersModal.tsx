import React, { useState } from 'react';
import { SlidersHorizontal, EyeOff, Sparkles, Check, Plus } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { PartyModifiers } from '@/types/game';
import { DEFAULT_WORD_DECKS } from '@/store/gameStore';
import { cn } from '@/lib/utils';

interface PartyModifiersModalProps {
  open: boolean;
  onClose: () => void;
  modifiers: PartyModifiers;
  onToggleBlindfold: () => void;
  onToggleOneLine: () => void;
  onSelectDeck: (deckName: string) => void;
  onImportCustomWords: (words: string[]) => void;
}

export const PartyModifiersModal: React.FC<PartyModifiersModalProps> = ({
  open,
  onClose,
  modifiers,
  onToggleBlindfold,
  onToggleOneLine,
  onSelectDeck,
  onImportCustomWords,
}) => {
  const [customInput, setCustomInput] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  const handleCustomImport = () => {
    if (!customInput.trim()) return;
    const words = customInput
      .split(/[\n,]+/)
      .map((w) => w.trim().toUpperCase())
      .filter((w) => w.length >= 2);

    if (words.length > 0) {
      onImportCustomWords(words);
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 2000);
      setCustomInput('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose} className="max-w-md text-left">
      <div className="flex items-center gap-2 pb-2 mb-3 border-b border-[#D5C7B0]">
        <div className="w-8 h-8 rounded-xl bg-studio-sienna/15 border border-studio-sienna/30 text-studio-sienna flex items-center justify-center">
          <SlidersHorizontal className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-serif font-bold text-studio-ink">
            Party Modifiers & Chaos Decks
          </h2>
          <p className="text-[11px] text-studio-charcoal/80 font-sans">
            Customize round rules and inject spontaneous studio chaos!
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        {/* Blindfold Mode Card */}
        <div
          onClick={onToggleBlindfold}
          className={cn(
            'p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none',
            modifiers.blindfoldMode
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/40'
              : 'bg-white border-[#D5C7B0] hover:border-studio-sienna/60'
          )}
        >
          <div
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
              modifiers.blindfoldMode
                ? 'bg-rose-500 text-white'
                : 'bg-studio-paper text-studio-charcoal border border-[#D5C7B0]'
            )}
          >
            <EyeOff className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-xs text-studio-ink">
                Blindfold Ink Mode
              </span>
              <span
                className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5 rounded-full font-sans',
                  modifiers.blindfoldMode
                    ? 'bg-rose-200 text-rose-900'
                    : 'bg-stone-200 text-stone-600'
                )}
              >
                {modifiers.blindfoldMode ? 'ENABLED' : 'OFF'}
              </span>
            </div>
            <p className="text-[10px] text-studio-charcoal/80 mt-0.5">
              The drawer's ink evaporates after 1 second! Strokes are preserved for the round timelapse.
            </p>
          </div>
        </div>

        {/* One-Line Mode Card */}
        <div
          onClick={onToggleOneLine}
          className={cn(
            'p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none',
            modifiers.oneLineOnly
              ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-400/40'
              : 'bg-white border-[#D5C7B0] hover:border-studio-sienna/60'
          )}
        >
          <div
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
              modifiers.oneLineOnly
                ? 'bg-purple-600 text-white'
                : 'bg-studio-paper text-studio-charcoal border border-[#D5C7B0]'
            )}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-xs text-studio-ink">
                One-Line Only (Continuous Pen)
              </span>
              <span
                className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5 rounded-full font-sans',
                  modifiers.oneLineOnly
                    ? 'bg-purple-200 text-purple-900'
                    : 'bg-stone-200 text-stone-600'
                )}
              >
                {modifiers.oneLineOnly ? 'ENABLED' : 'OFF'}
              </span>
            </div>
            <p className="text-[10px] text-studio-charcoal/80 mt-0.5">
              The pen cannot be lifted once drawing begins. Every detail must flow in a single stroke!
            </p>
          </div>
        </div>

        {/* Word Decks */}
        <div>
          <label className="block text-[11px] font-bold text-studio-charcoal uppercase tracking-wider mb-1.5">
            Active Word Deck
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.keys(DEFAULT_WORD_DECKS).map((deckName) => (
              <button
                key={deckName}
                onClick={() => onSelectDeck(deckName)}
                className={cn(
                  'p-2 rounded-xl text-left border text-xs font-serif font-semibold transition active:scale-95',
                  modifiers.activeDeck === deckName
                    ? 'bg-amber-100/80 border-studio-sienna text-studio-sienna shadow-xs'
                    : 'bg-white border-[#D5C7B0] text-studio-charcoal hover:bg-studio-cream'
                )}
              >
                {deckName}
              </button>
            ))}
          </div>
        </div>

        {/* Inside-Joke Deck Builder (Paste Custom Words) */}
        <div className="p-3 bg-white/70 rounded-2xl border border-[#D5C7B0]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-studio-ink font-serif flex items-center gap-1">
              <Plus className="w-3.5 h-3.5 text-studio-sienna" />
              <span>Inside-Joke Deck Builder</span>
            </span>
            {modifiers.customWords.length > 0 && (
              <span className="text-[9px] bg-studio-moss/20 text-studio-moss font-mono font-bold px-1.5 py-0.2 rounded">
                {modifiers.customWords.length} custom words
              </span>
            )}
          </div>
          <textarea
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            rows={2}
            placeholder="Paste custom words separated by commas (e.g. LaserCat, Overtime, PizzaTime)..."
            className="w-full bg-white border border-[#D5C7B0] rounded-xl p-2 text-xs text-studio-ink placeholder-studio-charcoal/60 focus:outline-none focus:ring-1 focus:ring-studio-sienna font-sans resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-studio-charcoal/70 italic">
              One-click instant lobby import
            </span>
            <button
              onClick={handleCustomImport}
              disabled={!customInput.trim()}
              className="px-3 py-1 bg-studio-sienna hover:bg-studio-siennaLight disabled:opacity-40 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
            >
              {importSuccess ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              <span>{importSuccess ? 'Imported!' : 'Import Deck'}</span>
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
