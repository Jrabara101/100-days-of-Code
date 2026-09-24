import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  HelpCircle,
  Flame,
  Snowflake,
  Sparkles,
  Trophy,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { GUESSER_PUZZLES, GuesserPuzzle } from '../data/sampleStories';
import { StoryPanel, ThemeConfig } from '../types';
import { sound } from '../utils/soundEngine';

interface PlotGuesserModalProps {
  isOpen: boolean;
  theme: ThemeConfig;
  currentStoryTitle: string;
  currentStoryPanels: StoryPanel[];
  onClose: () => void;
}

export const PlotGuesserModal: React.FC<PlotGuesserModalProps> = ({
  isOpen,
  theme,
  currentStoryTitle,
  currentStoryPanels,
  onClose,
}) => {
  const [selectedPuzzleIdx, setSelectedPuzzleIdx] = useState<number>(0);
  const [useCurrentStory, setUseCurrentStory] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [guessHistory, setGuessHistory] = useState<
    { guess: string; proximity: 'hot' | 'warm' | 'cold'; feedback: string }[]
  >([]);
  const [isSolved, setIsSolved] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState(0);

  if (!isOpen) return null;

  const currentPuzzle: GuesserPuzzle = useCurrentStory
    ? {
        id: 'custom-story',
        title: currentStoryTitle,
        category: 'Pop Culture',
        emojis: currentStoryPanels.map((p) => p.stickers[0]?.char || '⭐'),
        hints: [
          'Genre: Custom Storyboard Episode',
          `Characters: ${currentStoryPanels.length} sequential story beats`,
          `First letter: ${currentStoryTitle.trim().charAt(0)}`,
        ],
        proseMask: 'Decode the secret plot crafted by your friend!',
      }
    : GUESSER_PUZZLES[selectedPuzzleIdx];

  // Levenshtein distance & similarity calculation
  const calculateProximity = (guess: string, target: string) => {
    const cleanGuess = guess.trim().toLowerCase();
    const cleanTarget = target.trim().toLowerCase();

    if (cleanGuess === cleanTarget) {
      return { proximity: 'hot' as const, feedback: '🔥 EXACT MATCH! You solved the mystery!' };
    }

    if (cleanTarget.includes(cleanGuess) || cleanGuess.includes(cleanTarget)) {
      return { proximity: 'hot' as const, feedback: '🔥 Boiling Hot! You are extremely close!' };
    }

    // Check shared words
    const targetWords = cleanTarget.split(/\s+/);
    const guessWords = cleanGuess.split(/\s+/);
    const sharedWords = guessWords.filter((w) => w.length > 2 && targetWords.includes(w));

    if (sharedWords.length > 0) {
      return { proximity: 'warm' as const, feedback: '🌡️ Warm! You got part of the title right!' };
    }

    return { proximity: 'cold' as const, feedback: '❄️ Freezing Cold! Keep thinking or reveal a hint!' };
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim() || isSolved) return;

    const result = calculateProximity(guessInput, currentPuzzle.title);

    setGuessHistory((prev) => [
      { guess: guessInput.trim(), proximity: result.proximity, feedback: result.feedback },
      ...prev,
    ]);

    if (
      guessInput.trim().toLowerCase() === currentPuzzle.title.trim().toLowerCase() ||
      result.proximity === 'hot' && guessInput.trim().length >= currentPuzzle.title.length - 2
    ) {
      setIsSolved(true);
      sound.playDing();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {}
    } else if (result.proximity === 'hot' || result.proximity === 'warm') {
      sound.playChime();
    } else {
      sound.playPop();
    }

    setGuessInput('');
  };

  const handleRevealHint = () => {
    if (hintsRevealed < currentPuzzle.hints.length) {
      setHintsRevealed((prev) => prev + 1);
      sound.playChime();
    }
  };

  const handleNextPuzzle = () => {
    setIsSolved(false);
    setGuessHistory([]);
    setHintsRevealed(0);
    setGuessInput('');
    setSelectedPuzzleIdx((prev) => (prev + 1) % GUESSER_PUZZLES.length);
    sound.playPop();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-pop-in select-none">
      <div className="w-full max-w-2xl bg-white dark:bg-[#10131a] rounded-3xl border border-rose-100 dark:border-[#374151] shadow-2xl p-5 flex flex-col gap-4 text-stone-800 dark:text-stone-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🕵️</span>
            <div className="flex flex-col">
              <span className="font-fredoka text-lg font-bold">
                Decode the Plot! Party Game
              </span>
              <span className="font-fredoka text-xs text-stone-400">
                Guess the secret movie, tale, or plot sequence from emojis
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Puzzle Selector Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {GUESSER_PUZZLES.map((pz, idx) => (
            <button
              key={pz.id}
              onClick={() => {
                setUseCurrentStory(false);
                setSelectedPuzzleIdx(idx);
                setIsSolved(false);
                setGuessHistory([]);
                setHintsRevealed(0);
                sound.playPop();
              }}
              className={`px-3 py-1 rounded-2xl font-fredoka text-xs font-bold transition-all shrink-0 clay-puffy ${
                !useCurrentStory && selectedPuzzleIdx === idx
                  ? 'bg-berry-red text-white shadow-clay-sm'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
              }`}
            >
              #{idx + 1} {pz.category}
            </button>
          ))}
          <button
            onClick={() => {
              setUseCurrentStory(true);
              setIsSolved(false);
              setGuessHistory([]);
              setHintsRevealed(0);
              sound.playPop();
            }}
            className={`px-3 py-1 rounded-2xl font-fredoka text-xs font-bold transition-all shrink-0 clay-puffy ${
              useCurrentStory
                ? 'bg-berry-red text-white shadow-clay-sm'
                : 'bg-amber-100 text-amber-900'
            }`}
          >
            🎮 Active Canvas Story
          </button>
        </div>

        {/* 5-Panel Emoji Mystery Sequence Showcase */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 dark:from-stone-900 dark:to-stone-800 border border-rose-200 dark:border-stone-700 flex flex-col items-center gap-3">
          <div className="text-[11px] font-fredoka font-bold text-berry-red tracking-wider uppercase">
            5-Panel Clue Sequence
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {currentPuzzle.emojis.map((em, i) => (
              <div
                key={i}
                className="w-16 h-16 rounded-2xl bg-white dark:bg-stone-800 border-2 border-rose-200 dark:border-stone-600 shadow-clay-card flex items-center justify-center text-3xl hover:scale-125 transition-transform"
              >
                {em}
              </div>
            ))}
          </div>
          <p className="font-quicksand text-xs italic text-stone-600 dark:text-stone-300 text-center max-w-md">
            "{currentPuzzle.proseMask}"
          </p>
        </div>

        {/* Victory Banner if Solved */}
        {isSolved && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 flex items-center justify-between text-emerald-900 dark:text-emerald-200 animate-pop-in">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-500 animate-bounce" />
              <div className="flex flex-col">
                <span className="font-fredoka text-sm font-bold">
                  CORRECT! You decoded the plot: "{currentPuzzle.title}"
                </span>
                <span className="font-fredoka text-xs">
                  Solved in {guessHistory.length} guesses! 🎉
                </span>
              </div>
            </div>
            <button
              onClick={handleNextPuzzle}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-fredoka text-xs font-bold clay-puffy"
            >
              Next Mystery ➜
            </button>
          </div>
        )}

        {/* Guess Input Form */}
        {!isSolved && (
          <form onSubmit={handleGuessSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              placeholder="Type your guess here (e.g. Star Wars, Titanic)..."
              className="flex-1 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-fredoka text-sm outline-none focus:border-berry-red"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-berry-red hover:bg-rose-600 text-white font-fredoka text-sm font-bold shadow-clay-btn clay-puffy flex items-center gap-1.5"
            >
              <span>Submit Guess</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Hints Box */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
          <div className="flex flex-col gap-1">
            <span className="font-fredoka text-xs font-bold flex items-center gap-1 text-stone-600 dark:text-stone-300">
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>
                Hints Revealed ({hintsRevealed}/{currentPuzzle.hints.length}):
              </span>
            </span>
            <div className="flex flex-col gap-0.5">
              {currentPuzzle.hints.slice(0, hintsRevealed).map((h, i) => (
                <span key={i} className="text-xs font-quicksand font-bold text-amber-600 dark:text-amber-400">
                  • {h}
                </span>
              ))}
            </div>
          </div>
          {hintsRevealed < currentPuzzle.hints.length && !isSolved && (
            <button
              onClick={handleRevealHint}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-fredoka text-xs font-bold clay-puffy"
            >
              Reveal Hint
            </button>
          )}
        </div>

        {/* Guess History & Hot/Cold Proximity Feedback */}
        {guessHistory.length > 0 && (
          <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
            <span className="font-fredoka text-[10px] uppercase font-bold text-stone-400">
              Previous Guesses:
            </span>
            {guessHistory.map((g, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-xl border flex items-center justify-between font-fredoka text-xs ${
                  g.proximity === 'hot'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700 dark:text-rose-300'
                    : g.proximity === 'warm'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-800 dark:text-amber-300'
                    : 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 text-sky-700 dark:text-sky-300'
                }`}
              >
                <span className="font-bold">"{g.guess}"</span>
                <span className="flex items-center gap-1 font-semibold">{g.feedback}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
