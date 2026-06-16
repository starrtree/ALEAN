import Phaser from 'phaser';
import { COLORS, GAME_WIDTH } from '../config/game';
import { gameEvents, type HudState } from '../systems/events';

export class HudScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private alertText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private healthBar!: Phaser.GameObjects.Rectangle;
  private awakeningBar!: Phaser.GameObjects.Rectangle;

  constructor() { super('HudScene'); }

  create(): void {
    this.add.rectangle(18, 18, 300, 78, 0x050610, 0.82).setOrigin(0).setStrokeStyle(1, COLORS.purple, 0.65);
    this.scoreText = this.add.text(32, 28, 'SCORE 000000', { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' });
    this.comboText = this.add.text(32, 57, 'FLOW x1', { fontFamily: 'monospace', fontSize: '15px', color: '#63ffad' });
    this.alertText = this.add.text(GAME_WIDTH - 32, 28, 'SYSTEM ALERT 1', { fontFamily: 'monospace', fontSize: '18px', color: '#ff6681' }).setOrigin(1, 0);

    this.add.text(32, 94, 'BIKE', { fontFamily: 'monospace', fontSize: '12px', color: '#aeb9d0' });
    this.add.rectangle(80, 102, 185, 12, 0x1b2130, 0.95).setOrigin(0, 0.5);
    this.healthBar = this.add.rectangle(80, 102, 185, 8, COLORS.red, 1).setOrigin(0, 0.5);

    this.add.text(GAME_WIDTH - 300, 94, 'AWAKENING', { fontFamily: 'monospace', fontSize: '12px', color: '#aeb9d0' });
    this.add.rectangle(GAME_WIDTH - 190, 102, 158, 12, 0x1b2130, 0.95).setOrigin(0, 0.5);
    this.awakeningBar = this.add.rectangle(GAME_WIDTH - 190, 102, 0, 8, COLORS.green, 1).setOrigin(0, 0.5);

    this.add.text(GAME_WIDTH - 24, 515, 'P PAUSE   M MUTE', { fontFamily: 'monospace', fontSize: '12px', color: '#8290a8' }).setOrigin(1);
    gameEvents.on('hud:update', this.updateHud, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => gameEvents.off('hud:update', this.updateHud, this));
  }

  private updateHud(state: HudState): void {
    this.scoreText.setText(`SCORE ${state.score.toString().padStart(6, '0')}`);
    this.comboText.setText(`FLOW x${Math.max(1, state.combo)}`);
    this.alertText.setText(`SYSTEM ALERT ${state.alert}`);
    this.healthBar.width = 185 * (state.health / state.maxHealth);
    this.awakeningBar.width = 158 * (state.awakening / 100);
    this.awakeningBar.setFillStyle(state.awakening >= 100 ? COLORS.white : COLORS.green);
  }
}
