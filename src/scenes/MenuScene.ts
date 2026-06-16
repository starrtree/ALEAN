import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/game';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.void);
    this.makeBackdrop();
    const title = this.add.text(GAME_WIDTH / 2, 98, 'ALEAN', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '86px', color: '#f3f7ff', stroke: '#6d28c9', strokeThickness: 8
    }).setOrigin(0.5).setDepth(10);
    this.add.text(GAME_WIDTH / 2, 164, 'NEON PURSUIT', {
      fontFamily: 'Arial, sans-serif', fontSize: '25px', letterSpacing: 12, color: '#7dffbd'
    }).setOrigin(0.5).setDepth(10);

    const bike = this.add.image(GAME_WIDTH / 2, 275, 'player-bike').setScale(2.15).setDepth(10);
    this.tweens.add({ targets: bike, y: 260, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: title, scale: 1.025, duration: 1000, yoyo: true, repeat: -1 });

    const start = this.add.text(GAME_WIDTH / 2, 385, 'CLICK / ENTER TO BREAK CONTAINMENT', {
      fontFamily: 'Arial, sans-serif', fontSize: '20px', color: '#ffffff', backgroundColor: '#24103c', padding: { x: 20, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);

    this.add.text(GAME_WIDTH / 2, 455,
      'MOVE  WASD / ARROWS     FIRE  J     SEED BOMB  K     DASH  SPACE     AWAKEN  E',
      { fontFamily: 'monospace', fontSize: '15px', color: '#b8c4dd', align: 'center' }
    ).setOrigin(0.5).setDepth(10);

    this.add.text(GAME_WIDTH / 2, 497, 'Purple breaks armor. Green detonates living chain reactions.', {
      fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#8bffca'
    }).setOrigin(0.5).setDepth(10);

    const launch = (): void => { this.scene.start('GameScene'); };
    start.on('pointerdown', launch);
    this.input.keyboard?.once('keydown-ENTER', launch);
    this.input.keyboard?.once('keydown-SPACE', launch);
  }

  private makeBackdrop(): void {
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x250145, 0x250145, 0x080014, 0x080014, 1);
    sky.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    for (let i = 0; i < 95; i++) {
      sky.fillStyle(i % 7 === 0 ? COLORS.green : COLORS.purple, Phaser.Math.FloatBetween(0.15, 0.7));
      sky.fillCircle(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(0, GAME_HEIGHT), Phaser.Math.Between(1, 2));
    }
    this.add.tileSprite(GAME_WIDTH / 2, 430, GAME_WIDTH, 220, 'city-far').setAlpha(0.75);
    const mist = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.purple, 0.05);
    this.tweens.add({ targets: mist, alpha: 0.13, duration: 2200, yoyo: true, repeat: -1 });
  }
}
