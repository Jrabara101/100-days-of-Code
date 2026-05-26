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

  private cards: CardObject[] = [];

  private readonly GRID_START_X = 200;
  private readonly GRID_START_Y = 200;
  private readonly SPACING_X = 130;
  private readonly SPACING_Y = 160;

  constructor() {
    super('GameScene');
  }

  create() {
    const cardTypes: CardData[] = [
      { lang: 'JS', color: 0xf1c40f, textColor: '#000' },
      { lang: 'PY', color: 0x3498db, textColor: '#fff' },
      { lang: 'C++', color: 0x2980b9, textColor: '#fff' },
      { lang: 'RUST', color: 0xe67e22, textColor: '#fff' },
      { lang: 'GO', color: 0x00cec9, textColor: '#fff' },
      { lang: 'SWIFT', color: 0xe74c3c, textColor: '#fff' },
      { lang: 'JAVA', color: 0xd35400, textColor: '#fff' },
      { lang: 'RUBY', color: 0xc0392b, textColor: '#fff' }
    ];

    const deck = this.shuffle([...cardTypes, ...cardTypes]);

    for (let i = 0; i < deck.length; i++) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      const x = this.GRID_START_X + col * this.SPACING_X;
      const y = this.GRID_START_Y + row * this.SPACING_Y;
      
      const cardObj = this.createCard(x, y, deck[i]);
      this.cards.push(cardObj);
    }

    this.movesText = this.add.text(20, 20, 'Moves: 0', {
      fontSize: '24px',
      color: '#2F3542'
    });

    this.timerText = this.add.text(20, 50, 'Time: 45s', {
      fontSize: '24px',
      color: '#2F3542'
    });
  }

  private createCard(x: number, y: number, data: CardData): CardObject {
    const container = this.add.container(x, y);

    const back = this.add.graphics();
    back.fillStyle(0xDCDDE1, 1);
    back.fillRoundedRect(-60, -75, 120, 150, 10);
    container.add(back);

    const icon = this.add.text(0, 0, '</>', {
      fontSize: '32px',
      color: '#A4B0BE',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(icon);

    const front = this.add.graphics();
    front.fillStyle(data.color, 1);
    front.fillRoundedRect(-60, -75, 120, 150, 10);
    front.setVisible(false);
    container.add(front);

    const text = this.add.text(0, 0, data.lang, {
      fontSize: '28px',
      color: data.textColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    text.setVisible(false);
    container.add(text);

    container.setSize(120, 150);
    container.setInteractive();
    container.setData('cardData', data);
    container.setData('isFlipped', false);

    const cardObj = { container, front, text, back, icon };
    container.on('pointerdown', () => this.handleCardClick(cardObj));

    return cardObj;
  }

  private handleCardClick(cardObj: CardObject) {
    if (this.isLocked || cardObj.container.getData('isFlipped') || this.isGameOver) return;

    cardObj.container.setData('isFlipped', true);

    // 2.5D Flip Phase 1: Scale to 0
    this.tweens.add({
      targets: cardObj.container,
      scaleX: 0,
      duration: 150,
      onComplete: () => {
        // Swap visibility
        cardObj.back.setVisible(false);
        cardObj.icon.setVisible(false);
        cardObj.front.setVisible(true);
        cardObj.text.setVisible(true);

        // 2.5D Flip Phase 2: Scale back to 1
        this.tweens.add({
          targets: cardObj.container,
          scaleX: 1,
          duration: 150,
          onComplete: () => {
            this.evaluateState(cardObj);
          }
        });
      }
    });
  }

  private evaluateState(card: CardObject) {
    if (!this.firstCard) {
      this.firstCard = card;
      return;
    }

    this.secondCard = card;
    this.isLocked = true;
    this.moves++;
    this.movesText.setText(`Moves: ${this.moves}`);

    const firstData = this.firstCard.container.getData('cardData') as CardData;
    const secondData = this.secondCard.container.getData('cardData') as CardData;

    if (firstData.lang === secondData.lang) {
      this.handleMatch();
    } else {
      this.handleMismatch();
    }
  }

  private handleMatch() {
    this.tweens.add({
      targets: [this.firstCard!.container, this.secondCard!.container],
      scale: 1.1,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        this.matchesFound++;
        this.resetTurnState();

        if (this.matchesFound === this.totalPairs) {
          this.gameWon();
        }
      }
    });
  }

  private handleMismatch() {
    this.time.delayedCall(1000, () => {
      if (this.firstCard && this.secondCard) {
        this.flipBack(this.firstCard);
        this.flipBack(this.secondCard, () => {
          this.resetTurnState();
        });
      }
    });
  }

  private flipBack(cardObj: CardObject, onComplete?: () => void) {
    this.tweens.add({
      targets: cardObj.container,
      scaleX: 0,
      duration: 150,
      onComplete: () => {
        cardObj.back.setVisible(true);
        cardObj.icon.setVisible(true);
        cardObj.front.setVisible(false);
        cardObj.text.setVisible(false);

        this.tweens.add({
          targets: cardObj.container,
          scaleX: 1,
          duration: 150,
          onComplete: () => {
            cardObj.container.setData('isFlipped', false);
            if (onComplete) onComplete();
          }
        });
      }
    });
  }

  private resetTurnState() {
    this.firstCard = null;
    this.secondCard = null;
    this.isLocked = false;
  }

  private gameWon() {
    this.isGameOver = true;
    const { width, height } = this.scale;
    
    this.add.text(width / 2, height / 2, 'VICTORY!', {
      fontSize: '64px',
      color: '#2F3542',
      fontStyle: 'bold',
      backgroundColor: '#FFFFFFCC',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(100);
  }

  private shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
