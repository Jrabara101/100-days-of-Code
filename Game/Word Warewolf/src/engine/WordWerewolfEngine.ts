import {
  CouncilSessionState,
  FsmState,
  Player,
  TelemetryEvent,
  WordPair
} from './types';
import { getRandomWordPair } from './wordMatrix';
import {
  computeClueDivergence,
  updateBayesianSuspicionVector
} from './bayesianAccumulator';
import { soundEngine } from '../audio/soundEngine';

export class WordWerewolfEngine {
  private onStateChange?: (state: CouncilSessionState) => void;
  private timerId: number | null = null;

  public state: FsmState = 'SETUP';
  public round: number = 1;
  public tick: number = 0x4810;

  public players: Player[] = [];
  public currentWordPair!: WordPair;
  public civilianWord: string = '';
  public werewolfWord: string = '';
  public werewolfId: number = -1;

  public clueTurnIndex: number = 0;
  public cluesSubmitted: number = 0;
  public convictedPlayerId: number = -1;
  public winnerTeam: 'CIVILIANS' | 'WEREWOLF' | '' = '';
  public victoryReason: string = '';
  public deliberationTimeLeft: number = 30;

  public rebuttalGuessedWord?: string;
  public isRebuttalCorrect?: boolean;
  public telemetryLog: TelemetryEvent[] = [];

  constructor(onStateChange?: (state: CouncilSessionState) => void) {
    this.onStateChange = onStateChange;
    this.initSession();
  }

  public setListener(onStateChange: (state: CouncilSessionState) => void) {
    this.onStateChange = onStateChange;
  }

  public initSession() {
    this.currentWordPair = getRandomWordPair();
    this.civilianWord = this.currentWordPair.civilianWord;
    this.werewolfWord = this.currentWordPair.werewolfWord;

    // Assign 1 Werewolf uniformly among 4 seats
    this.werewolfId = Math.floor(Math.random() * 4);

    this.players = [
      {
        id: 0,
        name: 'VOXEL_ARCHON',
        codename: 'VOX_CIV_01',
        title: 'Tribunal Magistrate',
        isHuman: true,
        role: this.werewolfId === 0 ? 'WEREWOLF' : 'CIVILIAN',
        word: this.werewolfId === 0 ? this.werewolfWord : this.civilianWord,
        alive: true,
        clue: '',
        clueHistory: [],
        votes: 0,
        suspicion: 0.25,
        divergenceScore: 0.1,
        colorHex: '#38bdf8',
        badge: 'YOU',
        perk: 'VETO DECREE (1.5x Ballot Weight)'
      },
      {
        id: 1,
        name: 'CYBER_ALCHEMIST',
        codename: 'ALCHEMIST_02',
        title: 'Element Synthesis Automaton',
        isHuman: false,
        role: this.werewolfId === 1 ? 'WEREWOLF' : 'CIVILIAN',
        word: this.werewolfId === 1 ? this.werewolfWord : this.civilianWord,
        alive: true,
        clue: '',
        clueHistory: [],
        votes: 0,
        suspicion: 0.25,
        divergenceScore: 0.15,
        colorHex: '#f59e0b',
        badge: 'BOT',
        perk: 'METALLURGY HEURISTICS'
      },
      {
        id: 2,
        name: 'RUNE_HERMIT',
        codename: 'HERMIT_03',
        title: 'Subterranean Cryptographer',
        isHuman: false,
        role: this.werewolfId === 2 ? 'WEREWOLF' : 'CIVILIAN',
        word: this.werewolfId === 2 ? this.werewolfWord : this.civilianWord,
        alive: true,
        clue: '',
        clueHistory: [],
        votes: 0,
        suspicion: 0.25,
        divergenceScore: 0.12,
        colorHex: '#a855f7',
        badge: 'BOT',
        perk: 'ANOMALY DETECTOR'
      },
      {
        id: 3,
        name: 'SHADOW_FANG',
        codename: 'INQUISITOR_04',
        title: 'High Council Inquisitor',
        isHuman: false,
        role: this.werewolfId === 3 ? 'WEREWOLF' : 'CIVILIAN',
        word: this.werewolfId === 3 ? this.werewolfWord : this.civilianWord,
        alive: true,
        clue: '',
        clueHistory: [],
        votes: 0,
        suspicion: 0.25,
        divergenceScore: 0.2,
        colorHex: '#f43f5e',
        badge: 'BOT',
        perk: 'SHADOW MASQUERADE'
      }
    ];

    this.clueTurnIndex = 0;
    this.cluesSubmitted = 0;
    this.convictedPlayerId = -1;
    this.winnerTeam = '';
    this.victoryReason = '';
    this.rebuttalGuessedWord = undefined;
    this.isRebuttalCorrect = undefined;
    this.deliberationTimeLeft = 30;

    this.state = 'REVEAL';
    this.addTelemetry('SYSTEM', 'PROTOCOL-96 INITIALIZED. 4 COUNCIL SEATS CONVENED.');
    this.addTelemetry('BAYES', 'BAYESIAN SUSPICION PRIOR UNIFORMLY SEEDED @ 25.0% PER SEAT.');

    this.notify();
  }

  public advanceFromReveal() {
    soundEngine.playClick();
    this.state = 'CLUES';
    this.clueTurnIndex = 0;
    this.addTelemetry('SYSTEM', 'PHASE 02: CLUE BROADCAST COMMENCED.');
    this.notify();
    this.checkBotTurn();
  }

  public submitClue(playerId: number, rawClueText: string) {
    if (this.state !== 'CLUES' || playerId !== this.clueTurnIndex) return;

    const clueText = rawClueText.trim().toUpperCase();
    if (!clueText) return;

    soundEngine.playTransmit();
    const speaker = this.players[playerId];
    speaker.clue = clueText;
    speaker.clueHistory.push(clueText);

    // Compute semantic divergence
    const divergence = computeClueDivergence(clueText, this.currentWordPair);
    speaker.divergenceScore = divergence;

    this.addTelemetry(
      'CLUE',
      `DISPATCH FROM [${speaker.name}]: "${clueText}"`,
      speaker.name
    );

    if (divergence > 0.65) {
      soundEngine.playAlarm();
      this.addTelemetry(
        'BAYES',
        `LEXICAL ANOMALY DETECTED IN ${speaker.name} @ ${(divergence * 100).toFixed(1)}% DIVERGENCE!`,
        speaker.name,
        true
      );
    }

    // Update Bayesian suspicion vector across all seats
    const currentPriors = this.players.map(p => p.suspicion);
    const updatedPosteriors = updateBayesianSuspicionVector(currentPriors, playerId, divergence);
    this.players.forEach((p, idx) => {
      p.suspicion = updatedPosteriors[idx];
    });

    this.addTelemetry(
      'BAYES',
      `SUSPICION VECTOR UPDATED. HIGHEST POSTERIOR: ${this.getHighestSuspicionPlayer().name} (${(this.getHighestSuspicionPlayer().suspicion * 100).toFixed(1)}%)`
    );

    this.cluesSubmitted++;

    if (this.cluesSubmitted >= this.players.length) {
      // All 4 clues submitted -> proceed to Voting
      this.state = 'VOTING';
      this.deliberationTimeLeft = 30;
      this.addTelemetry('SYSTEM', 'ALL DISPATCHES RECORDED. ENTERING PHASE 03: TRIBUNAL ACCUSATION.');
      soundEngine.playGavel();
      this.startDeliberationCountdown();
      this.notify();
    } else {
      this.clueTurnIndex = (this.clueTurnIndex + 1) % this.players.length;
      this.notify();
      this.checkBotTurn();
    }
  }

  private checkBotTurn() {
    const current = this.players[this.clueTurnIndex];
    if (current && !current.isHuman && this.state === 'CLUES') {
      const delay = 1200 + Math.random() * 800;
      setTimeout(() => {
        if (this.state !== 'CLUES' || this.clueTurnIndex !== current.id) return;
        const pair = this.currentWordPair;

        let pickedClue = '';
        if (current.role === 'WEREWOLF') {
          // Werewolf Bot bluffing heuristics:
          // 30% chance to blend with an overlapping civilian concept, 70% chance to use a werewolf clue
          const roll = Math.random();
          if (roll < 0.35 && pair.civilianClues.length > 0) {
            pickedClue = pair.civilianClues[Math.floor(Math.random() * pair.civilianClues.length)];
          } else {
            pickedClue = pair.werewolfClues[Math.floor(Math.random() * pair.werewolfClues.length)];
          }
        } else {
          // Civilian Bot picks from civilian clues
          pickedClue = pair.civilianClues[Math.floor(Math.random() * pair.civilianClues.length)];
        }

        this.submitClue(current.id, pickedClue);
      }, delay);
    }
  }

  private startDeliberationCountdown() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = window.setInterval(() => {
      if (this.state !== 'VOTING') {
        if (this.timerId) clearInterval(this.timerId);
        return;
      }
      this.deliberationTimeLeft--;
      if (this.deliberationTimeLeft <= 0) {
        if (this.timerId) clearInterval(this.timerId);
        // Force voting if time runs out
        this.castBallot(0, this.getHighestSuspicionBotId());
      } else {
        this.notify();
      }
    }, 1000);
  }

  public castBallot(voterId: number, targetId: number) {
    if (this.state !== 'VOTING') return;
    if (this.timerId) clearInterval(this.timerId);

    soundEngine.playGavel();

    // Reset votes
    this.players.forEach(p => (p.votes = 0));

    // Register Human Vote (with perk weight 1.5)
    this.players[targetId].votes += 1.5;
    this.addTelemetry(
      'VOTE',
      `[${this.players[voterId].name}] CAST CONDEMNATION BALLOT ON [${this.players[targetId].name}].`,
      this.players[voterId].name
    );

    // Simulate Autonomous Bot Voting Heuristics
    for (let i = 1; i < this.players.length; i++) {
      const bot = this.players[i];
      let botTargetId: number;

      if (bot.role === 'WEREWOLF') {
        // Werewolf bot deflects towards civilian with highest suspicion or human
        const eligible = this.players.filter(p => p.id !== bot.id);
        eligible.sort((a, b) => b.suspicion - a.suspicion);
        botTargetId = eligible[0].id;
      } else {
        // Civilian bots use Bayesian suspicion with probabilistic weighted selection
        const candidates = this.players.filter(p => p.id !== bot.id);
        const rand = Math.random();
        // 75% chance civilian votes for the top suspicion candidate
        candidates.sort((a, b) => b.suspicion - a.suspicion);
        if (rand < 0.75) {
          botTargetId = candidates[0].id;
        } else {
          botTargetId = candidates[Math.floor(Math.random() * candidates.length)].id;
        }
      }

      this.players[botTargetId].votes += 1;
      this.addTelemetry(
        'VOTE',
        `[${bot.name}] REGISTERED BALLOT ON [${this.players[botTargetId].name}].`,
        bot.name
      );
    }

    // Determine Plurality Vote
    let maxVotes = -1;
    let convictedId = 0;
    this.players.forEach(p => {
      if (p.votes > maxVotes) {
        maxVotes = p.votes;
        convictedId = p.id;
      }
    });

    this.convictedPlayerId = convictedId;
    const convicted = this.players[convictedId];

    this.addTelemetry(
      'VERDICT',
      `TRIBUNAL VERDICT CONFIRMED: [${convicted.name}] CONVICTED WITH ${maxVotes} VOTES.`,
      undefined,
      true
    );

    // Check if convicted is the Werewolf
    if (convictedId === this.werewolfId) {
      // Werewolf caught! Proceed to REBUTTAL phase
      soundEngine.playAlarm();
      this.state = 'REBUTTAL';
      this.addTelemetry(
        'REBUTTAL',
        `WEREWOLF IDENTIFIED! [${convicted.name}] GRANTED 1-CHANCE REBUTTAL TO STEAL VICTORY.`
      );
      this.notify();

      // If Werewolf is a Bot, bot attempts rebuttal guess automatically
      if (!convicted.isHuman) {
        this.triggerBotRebuttal();
      }
    } else {
      // Wrong conviction: Innocence purged, Werewolf escapes!
      soundEngine.playDefeat();
      this.winnerTeam = 'WEREWOLF';
      this.victoryReason = `Civilians condemned innocent ${convicted.name}! The Werewolf (${this.players[this.werewolfId].name}) deceived the council and walked free!`;
      this.state = 'SETTLEMENT';
      this.notify();
    }
  }

  private triggerBotRebuttal() {
    setTimeout(() => {
      if (this.state !== 'REBUTTAL') return;
      const bot = this.players[this.werewolfId];

      // Bot has a 35% chance to guess correctly based on clue analysis
      const pair = this.currentWordPair;
      const willGuessCorrectly = Math.random() < 0.38;
      const guessedWord = willGuessCorrectly ? pair.civilianWord : pair.civilianClues[0] || 'UNKNOWN';

      this.submitWerewolfRebuttalGuess(guessedWord);
    }, 2800);
  }

  public submitWerewolfRebuttalGuess(guess: string) {
    if (this.state !== 'REBUTTAL') return;

    const clean = guess.trim().toUpperCase();
    this.rebuttalGuessedWord = clean;
    const isCorrect = clean === this.civilianWord;
    this.isRebuttalCorrect = isCorrect;

    if (isCorrect) {
      soundEngine.playDefeat();
      this.winnerTeam = 'WEREWOLF';
      this.victoryReason = `Caught Werewolf (${this.players[this.werewolfId].name}) correctly deduced the Civilian Word [${this.civilianWord}] and stole the game!`;
      this.addTelemetry(
        'REBUTTAL',
        `COUNTER-GUESS SUCCESSFUL: "${clean}" MATCHES CIVILIAN CODEWORD! WEREWOLF STEALS VICTORY.`,
        undefined,
        true
      );
    } else {
      soundEngine.playVictory();
      this.winnerTeam = 'CIVILIANS';
      this.victoryReason = `Civilians successfully caught the Werewolf (${this.players[this.werewolfId].name}) and defended the secret word "${this.civilianWord}"!`;
      this.addTelemetry(
        'REBUTTAL',
        `COUNTER-GUESS FAILED: "${clean}" DOES NOT MATCH SECRET CODEWORD. CIVILIANS PREVAIL.`,
        undefined,
        true
      );
    }

    this.state = 'SETTLEMENT';
    this.notify();
  }

  public startNewMatch() {
    soundEngine.playClick();
    this.round++;
    this.initSession();
  }

  private getHighestSuspicionPlayer(): Player {
    let top = this.players[0];
    for (const p of this.players) {
      if (p.suspicion > top.suspicion) top = p;
    }
    return top;
  }

  private getHighestSuspicionBotId(): number {
    let topId = 1;
    let topSusp = -1;
    for (let i = 1; i < this.players.length; i++) {
      if (this.players[i].suspicion > topSusp) {
        topSusp = this.players[i].suspicion;
        topId = i;
      }
    }
    return topId;
  }

  private addTelemetry(
    type: TelemetryEvent['type'],
    message: string,
    sender?: string,
    highlight: boolean = false
  ) {
    this.tick += Math.floor(Math.random() * 5 + 3);
    const tickHex = '0x' + this.tick.toString(16).toUpperCase();
    const event: TelemetryEvent = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      tickHex,
      type,
      message,
      sender,
      highlight
    };
    this.telemetryLog.push(event);
    if (this.telemetryLog.length > 50) {
      this.telemetryLog.shift();
    }
  }

  private notify() {
    if (this.onStateChange) {
      this.onStateChange({
        state: this.state,
        round: this.round,
        tick: this.tick,
        tickHex: '0x' + this.tick.toString(16).toUpperCase(),
        players: this.players.map(p => ({ ...p, clueHistory: [...p.clueHistory] })),
        currentWordPair: { ...this.currentWordPair },
        civilianWord: this.civilianWord,
        werewolfWord: this.werewolfWord,
        werewolfId: this.werewolfId,
        clueTurnIndex: this.clueTurnIndex,
        cluesSubmitted: this.cluesSubmitted,
        convictedPlayerId: this.convictedPlayerId,
        winnerTeam: this.winnerTeam,
        victoryReason: this.victoryReason,
        userPlayer: { ...this.players[0] },
        telemetryLog: [...this.telemetryLog],
        rebuttalGuessedWord: this.rebuttalGuessedWord,
        isRebuttalCorrect: this.isRebuttalCorrect,
        deliberationTimeLeft: this.deliberationTimeLeft
      });
    }
  }
}
