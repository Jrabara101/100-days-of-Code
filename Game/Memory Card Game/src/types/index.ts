export interface CardData {
  lang: string;
  color: number;
  textColor: string;
}

export interface CardObject {
  container: Phaser.GameObjects.Container;
  front: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
  back: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Text;
}

export enum GameState {
  IDLE,
  LOCKED,
  GAME_OVER
}
