import React from 'react';
import {
  Pencil,
  PaintBucket,
  Eraser,
  Undo2,
  FileX2,
  Monitor,
  Send,
  Coffee,
  Check,
} from 'lucide-react';
import { useCanvasEngine } from '@/hooks/useCanvasEngine';
import { ToolType, DrawAction, Player } from '@/types/game';
import { Slider } from '@/components/ui/slider';
import { ARTISAN_PALETTE } from '@/components/canvas/ArtistToolbar';
import { cn } from '@/lib/utils';

interface MobileStylusViewProps {
  roomId: string;
  timeLeft: number;
  currentTool: ToolType;
  onSelectTool: (t: ToolType) => void;
  brushColor: string;
  onSelectColor: (c: string) => void;
  brushSize: number;
  onSelectSize: (s: number) => void;
  isArtist: boolean;
  targetWord: string;
  categoryHint: string;
  actions: DrawAction[];
  onCommitAction: (a: DrawAction) => void;
  onUndo: () => void;
  onClear: () => void;
  onSwitchToDesktop: () => void;
  onSubmitGuess: (text: string) => void;
  hasGuessedCorrectly: boolean;
  localPlayer: Player;
}

export const MobileStylusView: React.FC<MobileStylusViewProps> = ({
  roomId,
  timeLeft,
  currentTool,
  onSelectTool,
  brushColor,
  onSelectColor,
  brushSize,
  onSelectSize,
  isArtist,
  targetWord,
  categoryHint,
  actions,
  onCommitAction,
  onUndo,
  onClear,
  onSwitchToDesktop,
  onSubmitGuess,
  hasGuessedCorrectly,
}) => {
  const [guessInput, setGuessInput] = React.useState('');

  const {
    layer1Ref,
    layer2Ref,
    containerRef,
    handlePointerDown,
    handlePointerMove,
    commitActiveStroke,
  } = useCanvasEngine({
    currentTool,
    brushColor,
    brushSize,
    isDrawingEnabled: isArtist,
    isBlindfold: false,
    isOneLineOnly: false,
    actions,
    onCommitAction,
  });

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim()) return;
    onSubmitGuess(guessInput.trim());
    setGuessInput('');
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#281B14] text-amber-100 overflow-hidden select-none">
      {/* Top Mobile Bar */}
      <div className="bg-[#1E140E] px-3 py-2 border-b border-[#442F24] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="font-hand font-bold text-base text-amber-200">Den #{roomId}</span>
        </div>

        {/* Word reminder for artist / hint for guesser */}
        <div className="text-center">
          {isArtist ? (
            <div>
              <span className="text-[9px] uppercase tracking-wider text-amber-300 font-bold">Draw:</span>
              <div className="font-serif font-bold text-sm text-white">{targetWord}</div>
            </div>
          ) : (
            <div>
              <span className="text-[9px] uppercase tracking-wider text-amber-300 font-bold">Hint:</span>
              <div className="font-serif font-bold text-xs text-white truncate max-w-[140px]">
                {categoryHint}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Timer */}
          <div className="flex items-center gap-1 bg-[#38241A] px-2 py-0.5 rounded-lg border border-[#523A2B] text-xs font-mono font-bold">
            <Coffee className="w-3.5 h-3.5 text-amber-300" />
            <span>{timeLeft}s</span>
          </div>

          {/* Switch back to TV */}
          <button
            onClick={onSwitchToDesktop}
            className="p-1.5 bg-[#38241A] hover:bg-[#4E3224] rounded-lg border border-[#523A2B] text-amber-200"
            title="Switch to Easel/TV View"
          >
            <Monitor className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Touch Canvas Area */}
      <div className="flex-1 p-2 flex items-center justify-center min-h-0">
        <div
          ref={containerRef}
          className="relative w-full h-full max-w-lg aspect-[4/3] paper-texture rounded-2xl shadow-2xl border-2 border-[#C5B59E] overflow-hidden touch-none"
        >
          <canvas
            ref={layer1Ref}
            className="absolute inset-0 w-full h-full block cursor-crosshair"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={commitActiveStroke}
            onPointerCancel={commitActiveStroke}
          />
          <canvas
            ref={layer2Ref}
            className="absolute inset-0 w-full h-full block pointer-events-none"
          />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-[#1E140E] p-2.5 border-t border-[#442F24] shrink-0 space-y-2">
        {isArtist ? (
          <>
            {/* Tools & Actions Row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onSelectTool('brush')}
                  className={cn(
                    'p-2 rounded-xl transition',
                    currentTool === 'brush'
                      ? 'bg-studio-sienna text-white'
                      : 'bg-[#38241A] text-amber-200 border border-[#523A2B]'
                  )}
                  title="Pencil"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onSelectTool('fill')}
                  className={cn(
                    'p-2 rounded-xl transition',
                    currentTool === 'fill'
                      ? 'bg-studio-sienna text-white'
                      : 'bg-[#38241A] text-amber-200 border border-[#523A2B]'
                  )}
                  title="Bucket Fill"
                >
                  <PaintBucket className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onSelectTool('eraser')}
                  className={cn(
                    'p-2 rounded-xl transition',
                    currentTool === 'eraser'
                      ? 'bg-studio-sienna text-white'
                      : 'bg-[#38241A] text-amber-200 border border-[#523A2B]'
                  )}
                  title="Eraser"
                >
                  <Eraser className="w-4 h-4" />
                </button>
              </div>

              {/* Slider for brush size */}
              <div className="flex-1 max-w-[120px] px-2">
                <Slider
                  min={2}
                  max={32}
                  value={brushSize}
                  onValueChange={onSelectSize}
                />
              </div>

              {/* Undo & Clear */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onUndo}
                  className="p-2 bg-[#38241A] hover:bg-[#4E3224] rounded-xl border border-[#523A2B] text-amber-200"
                  title="Undo"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClear}
                  className="p-2 bg-[#38241A] hover:bg-rose-950 rounded-xl border border-[#523A2B] text-rose-300"
                  title="Clear"
                >
                  <FileX2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Color Swatches Horizontal Scroll */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
              {ARTISAN_PALETTE.map((swatch) => (
                <button
                  key={swatch.color}
                  onClick={() => onSelectColor(swatch.color)}
                  style={{ backgroundColor: swatch.color }}
                  className={cn(
                    'w-7 h-7 rounded-full shrink-0 shadow-sm border border-stone-600',
                    brushColor === swatch.color &&
                      'ring-2 ring-amber-400 ring-offset-1 ring-offset-[#1E140E] scale-110'
                  )}
                />
              ))}
            </div>
          </>
        ) : (
          /* Guesser Mobile Input */
          <form onSubmit={handleGuessSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              placeholder={
                hasGuessedCorrectly ? 'You solved it! ☕' : 'Type your deduction...'
              }
              disabled={hasGuessedCorrectly}
              className="flex-1 bg-white text-stone-900 px-3 py-2 rounded-xl text-xs font-sans placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-studio-sienna disabled:bg-stone-200"
            />
            <button
              type="submit"
              disabled={hasGuessedCorrectly || !guessInput.trim()}
              className="px-4 py-2 bg-studio-sienna hover:bg-studio-siennaLight disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
            >
              {hasGuessedCorrectly ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              <span>{hasGuessedCorrectly ? 'Solved' : 'Guess'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
