import { SoundEffectsEngine } from '../audio/SoundEffectsEngine';
import { QUESTION_BANK } from '../data/triviaData';
import { calculateDecayedScore, calculateSafeHavenPayout } from './scoring';
import { EngineSnapshot, FSMPhase, LifelineState, Question } from './types';

export type StateChangeCallback = (snapshot: EngineSnapshot) => void;

/**
 * Headless Trivia Gameshow Finite State Machine (FSM)
 * Decouples state progression, monotonic clock deltas, and lifeline mutations from React renders.
 */
export class TriviaGameshowEngine {
  public audio: SoundEffectsEngine;
  private onStateChange: StateChangeCallback | null = null;

  // FSM Phase
  private phase: FSMPhase = 'INTRO';
  private currentTierIndex: number = 0;
  private currentQuestion: Question;

  // Monotonic Timing
  private totalDuration: number = 12000; // 12.0s
  private startTime: number = 0;
  private remainingMs: number = 12000;
  private timerRaf: number | null = null;
  private introTimeout: number | null = null;
  private lockedTimeout: number | null = null;

  // Scoring & Accuracy
  private totalScore: number = 0;
  private safeHavenScore: number = 0;
  private streak: number = 0;
  private selectedOptionIndex: number | null = null;
  private isCorrect: boolean | null = null;
  private roundPointsAwarded: number = 0;
  private lastAnswerTimeMs: number | null = null;

  // Lifelines Matrix
  private lifelines: LifelineState = {
    fiftyFifty: true,
    freeze: true,
    skip: true
  };
  private hiddenOptions: Set<number> = new Set();
  private isFrozen: boolean = false;
  private freezeExpiry: number = 0;

  constructor(onStateChange?: StateChangeCallback) {
    this.audio = new SoundEffectsEngine();
    this.onStateChange = onStateChange || null;
    this.currentQuestion = QUESTION_BANK[0];
    this.initQuestion();
  }

  public setListener(callback: StateChangeCallback) {
    this.onStateChange = callback;
    this.notify();
  }

  /**
   * Staging Phase: Presents question, enforces 1.2s synchronized reading window before countdown
   */
  public initQuestion() {
    this.clearTimers();

    if (this.currentTierIndex >= QUESTION_BANK.length) {
      this.phase = 'VICTORY';
      this.audio.playFanfare();
      this.notify();
      return;
    }

    this.currentQuestion = QUESTION_BANK[this.currentTierIndex];
    this.phase = 'INTRO';
    this.selectedOptionIndex = null;
    this.isCorrect = null;
    this.roundPointsAwarded = 0;
    this.lastAnswerTimeMs = null;
    this.hiddenOptions.clear();
    this.isFrozen = false;
    this.freezeExpiry = 0;
    this.remainingMs = this.totalDuration;

    this.notify();

    // 1.2-second synchronized reading staging delay
    this.introTimeout = window.setTimeout(() => {
      this.phase = 'COUNTDOWN';
      this.startTime = performance.now();
      this.startTimerLoop();
      this.notify();
    }, 1200);
  }

  /**
   * Monotonic High-Resolution Countdown Loop via requestAnimationFrame
   */
  private startTimerLoop() {
    if (this.timerRaf) cancelAnimationFrame(this.timerRaf);

    let lastTickSec = Math.ceil(this.remainingMs / 1000);

    const loop = (currentTime: number) => {
      if (this.phase !== 'COUNTDOWN') return;

      if (this.isFrozen) {
        if (currentTime >= this.freezeExpiry) {
          this.isFrozen = false;
          // Shift start timestamp so frozen duration is not penalized
          this.startTime = currentTime - (this.totalDuration - this.remainingMs);
        }
      } else {
        const elapsed = currentTime - this.startTime;
        this.remainingMs = Math.max(0, this.totalDuration - elapsed);

        // Procedural Audio Tension Tick every whole second
        const currentSec = Math.ceil(this.remainingMs / 1000);
        if (currentSec !== lastTickSec && currentSec > 0 && currentSec <= 10) {
          this.audio.playTick();
          lastTickSec = currentSec;
        }

        if (this.remainingMs <= 0) {
          this.handleTimeout();
          return;
        }
      }

      this.notify();
      this.timerRaf = requestAnimationFrame(loop);
    };

    this.timerRaf = requestAnimationFrame(loop);
  }

  /**
   * Handles Player Selection - Locks input gate immediately
   */
  public handleSelectOption(index: number) {
    if (this.phase !== 'COUNTDOWN' || this.hiddenOptions.has(index)) return;

    this.selectedOptionIndex = index;
    this.phase = 'LOCKED';
    this.lastAnswerTimeMs = Math.max(0, this.totalDuration - this.remainingMs);

    if (this.timerRaf) {
      cancelAnimationFrame(this.timerRaf);
      this.timerRaf = null;
    }

    this.audio.playLockIn();
    this.audio.startDrone();
    this.notify();

    // 1.4-second suspense window before dramatic verification reveal
    this.lockedTimeout = window.setTimeout(() => {
      this.resolveAnswer();
    }, 1400);
  }

  /**
   * Resolves answer verification, calculates time-decay scoring, and plays feedback audio
   */
  private resolveAnswer() {
    const isRight = this.selectedOptionIndex === this.currentQuestion.correct;
    this.isCorrect = isRight;
    this.phase = 'REVEAL';

    if (isRight) {
      this.audio.playCorrect();
      this.streak++;

      const calculation = calculateDecayedScore(
        this.currentTierIndex,
        this.remainingMs,
        this.totalDuration,
        this.streak
      );

      this.roundPointsAwarded = calculation.pointsAwarded;
      this.totalScore += this.roundPointsAwarded;
      this.safeHavenScore = calculateSafeHavenPayout(this.currentTierIndex);
    } else {
      this.audio.playWrong();
      this.streak = 0;
      this.roundPointsAwarded = 0;
      this.safeHavenScore = calculateSafeHavenPayout(this.currentTierIndex - 1);
    }

    this.notify();
  }

  /**
   * Handles timeout when countdown expires
   */
  private handleTimeout() {
    this.clearTimers();
    this.phase = 'REVEAL';
    this.isCorrect = false;
    this.selectedOptionIndex = -1; // Flagged as expired
    this.streak = 0;
    this.roundPointsAwarded = 0;
    this.safeHavenScore = calculateSafeHavenPayout(this.currentTierIndex - 1);
    this.audio.playWrong();
    this.notify();
  }

  /**
   * Advances game: next tier, victory podium, or game over settlement
   */
  public proceedNext() {
    this.clearTimers();

    if (!this.isCorrect) {
      this.phase = 'GAME_OVER';
      this.notify();
      return;
    }

    this.currentTierIndex++;
    if (this.currentTierIndex >= QUESTION_BANK.length) {
      this.phase = 'VICTORY';
      this.audio.playFanfare();
      this.notify();
    } else {
      this.initQuestion();
    }
  }

  // --- LIFELINE OPERATOR MATRIX ---

  /**
   * 50:50 Lifeline: Preserves correct answer and 1 uniform random distractor
   */
  public useFiftyFifty() {
    if (!this.lifelines.fiftyFifty || this.phase !== 'COUNTDOWN') return;
    this.lifelines.fiftyFifty = false;
    this.audio.playWhoosh();

    const correct = this.currentQuestion.correct;
    const wrongOptions = [0, 1, 2, 3].filter(idx => idx !== correct);

    // Uniformly sample 1 distractor to preserve
    const preservedWrong = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];

    wrongOptions.forEach(idx => {
      if (idx !== preservedWrong) {
        this.hiddenOptions.add(idx);
      }
    });

    this.notify();
  }

  /**
   * Freeze Lifeline: Pauses monotonic timer for 5.0 seconds
   */
  public useFreeze() {
    if (!this.lifelines.freeze || this.phase !== 'COUNTDOWN' || this.isFrozen) return;
    this.lifelines.freeze = false;
    this.audio.playWhoosh();
    this.isFrozen = true;
    this.freezeExpiry = performance.now() + 5000;
    this.notify();
  }

  /**
   * Skip Lifeline: Bypasses current question without penalty
   */
  public useSkip() {
    if (!this.lifelines.skip || this.phase !== 'COUNTDOWN') return;
    this.lifelines.skip = false;
    this.audio.playWhoosh();
    this.clearTimers();

    this.currentTierIndex++;
    this.initQuestion();
  }

  /**
   * Complete tournament reset
   */
  public reset() {
    this.clearTimers();
    this.audio.stopDrone();
    this.currentTierIndex = 0;
    this.totalScore = 0;
    this.safeHavenScore = 0;
    this.streak = 0;
    this.lifelines = { fiftyFifty: true, freeze: true, skip: true };
    this.initQuestion();
  }

  public cleanup() {
    this.clearTimers();
    this.audio.stopDrone();
  }

  private clearTimers() {
    if (this.timerRaf) {
      cancelAnimationFrame(this.timerRaf);
      this.timerRaf = null;
    }
    if (this.introTimeout) {
      clearTimeout(this.introTimeout);
      this.introTimeout = null;
    }
    if (this.lockedTimeout) {
      clearTimeout(this.lockedTimeout);
      this.lockedTimeout = null;
    }
  }

  public getSnapshot(): EngineSnapshot {
    return {
      phase: this.phase,
      tierIndex: this.currentTierIndex,
      question: this.currentQuestion,
      remainingMs: this.remainingMs,
      totalDuration: this.totalDuration,
      selectedOption: this.selectedOptionIndex,
      isCorrect: this.isCorrect,
      roundPoints: this.roundPointsAwarded,
      totalScore: this.totalScore,
      safeHavenScore: this.safeHavenScore,
      streak: this.streak,
      lifelines: { ...this.lifelines },
      hiddenOptions: Array.from(this.hiddenOptions),
      isFrozen: this.isFrozen,
      freezeRemainingMs: this.isFrozen ? Math.max(0, this.freezeExpiry - performance.now()) : 0,
      lastAnswerTimeMs: this.lastAnswerTimeMs
    };
  }

  private notify() {
    if (this.onStateChange) {
      this.onStateChange(this.getSnapshot());
    }
  }
}
