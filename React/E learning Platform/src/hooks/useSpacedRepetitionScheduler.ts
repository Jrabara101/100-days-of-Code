import { useState, useCallback, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SpacedRepetitionCard, SRSRating } from '../types';
import { learningEngine } from '../services/learningEngine';
import { sounds } from '../services/audioEffects';

export function useSpacedRepetitionScheduler() {
  const [cards, setCards] = useState<SpacedRepetitionCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);

  const loadCards = useCallback(() => {
    const due = learningEngine.getDueSpacedRepetitionCards();
    setCards(due);
    setCurrentIndex(0);
    setIsAnswerRevealed(false);
    setSessionCompleted(due.length === 0);
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const currentCard: SpacedRepetitionCard | undefined = cards[currentIndex];
  const totalCards = cards.length;

  const revealAnswer = useCallback(() => {
    sounds.playClick();
    setIsAnswerRevealed(true);
  }, []);

  const rateCard = useCallback((rating: SRSRating) => {
    if (!currentCard) return;

    if (rating === 'again') {
      sounds.playWarning();
    } else {
      sounds.playSuccess();
    }

    learningEngine.reviewSpacedCard(currentCard.id, rating);

    if (currentIndex < totalCards - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsAnswerRevealed(false);
    } else {
      // Completed all cards in daily deck!
      setSessionCompleted(true);
      
      // Restore decaying module retention rings back to 98% emerald
      learningEngine.restoreModuleRetention('mod-01', 98);
      learningEngine.restoreModuleRetention('mod-03', 96);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Fallback
      }
    }
  }, [currentCard, currentIndex, totalCards]);

  return {
    cards,
    currentCard,
    currentIndex,
    totalCards,
    isAnswerRevealed,
    sessionCompleted,
    revealAnswer,
    rateCard,
    refreshQueue: loadCards
  };
}

