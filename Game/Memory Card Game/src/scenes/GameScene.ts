import Phaser from 'phaser';
import { CardData, CardObject, GameState } from '../types';

export class GameScene extends Phaser.Scene {
  private firstCard: CardObject | null = null;
  private secondCard: CardObject | null = null;
  private isLocked: boolean = false;
  private isGameOver: boolean = false;
  private moves: number = 0;
  private matchesFound: number = 0;
  private totalPairs: number = 8;
  private timeRemaining: number = 45;

  private movesText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private gameTimer!: Phaser.Time.TimerEvent;

  constructor() {
    super('GameScene');
  }

  create() {
    // Logic will go here in next tasks
  }
}
