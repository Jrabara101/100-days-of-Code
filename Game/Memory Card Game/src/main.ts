import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import './style.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 800,
  height: 800,
  backgroundColor: '#F5F6FA',
  scene: GameScene,
};

new Phaser.Game(config);
