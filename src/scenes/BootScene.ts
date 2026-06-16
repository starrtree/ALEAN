import Phaser from 'phaser';
import { COLORS } from '../config/game';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create(): void {
    this.createPlayerTexture();
    this.createEnemyTextures();
    this.createProjectileTextures();
    this.createBackdropTextures();
    this.scene.start('MenuScene');
  }

  private createPlayerTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x05080d).fillRoundedRect(9, 20, 72, 24, 11);
    g.fillStyle(0x182431).fillRoundedRect(20, 15, 47, 24, 10);
    g.fillStyle(COLORS.green).fillRect(22, 38, 38, 3);
    g.fillStyle(COLORS.purple).fillTriangle(8, 28, 0, 34, 9, 39);
    g.fillStyle(0x7b5139).fillCircle(38, 14, 8);
    g.fillStyle(0x10121a).fillRoundedRect(28, 4, 22, 10, 5);
    g.fillStyle(COLORS.green).fillRect(46, 12, 8, 3);
    g.lineStyle(2, COLORS.hotPurple, 0.85).strokeRoundedRect(9, 20, 72, 24, 11);
    g.generateTexture('player-bike', 88, 50);
    g.destroy();
  }

  private createEnemyTextures(): void {
    const patrol = this.make.graphics({ x: 0, y: 0 });
    patrol.fillStyle(0x030509).fillEllipse(36, 20, 68, 24);
    patrol.fillStyle(0x151b24).fillRoundedRect(20, 4, 32, 19, 9);
    patrol.fillStyle(COLORS.red).fillCircle(28, 10, 4);
    patrol.fillStyle(COLORS.cyan).fillCircle(44, 10, 4);
    patrol.lineStyle(2, 0x596474, 1).strokeEllipse(36, 20, 68, 24);
    patrol.generateTexture('enemy-patrol', 72, 34);
    patrol.clear();

    patrol.fillStyle(0x05070b).fillTriangle(4, 18, 68, 4, 59, 31);
    patrol.fillStyle(0x202836).fillTriangle(18, 18, 57, 10, 51, 26);
    patrol.fillStyle(COLORS.red).fillRect(45, 13, 11, 3);
    patrol.lineStyle(2, COLORS.purple, 0.75).strokeTriangle(4, 18, 68, 4, 59, 31);
    patrol.generateTexture('enemy-interceptor', 72, 34);
    patrol.clear();

    patrol.fillStyle(0x090b10).fillCircle(22, 22, 20);
    patrol.fillStyle(0x202838).fillCircle(22, 22, 12);
    patrol.fillStyle(COLORS.red).fillCircle(22, 22, 5);
    patrol.lineStyle(3, COLORS.cyan, 0.85).strokeCircle(22, 22, 19);
    patrol.generateTexture('enemy-sniper', 44, 44);
    patrol.clear();

    patrol.fillStyle(0x0a0e14).fillRoundedRect(2, 11, 78, 34, 14);
    patrol.fillStyle(0x202b38).fillRoundedRect(15, 2, 50, 34, 12);
    patrol.fillStyle(COLORS.red).fillRect(24, 12, 10, 5);
    patrol.fillStyle(COLORS.cyan).fillRect(46, 12, 10, 5);
    patrol.lineStyle(3, COLORS.hotPurple, 0.9).strokeRoundedRect(2, 11, 78, 34, 14);
    patrol.generateTexture('enemy-warden', 82, 50);
    patrol.destroy();
  }

  private createProjectileTextures(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(COLORS.white).fillRoundedRect(5, 3, 22, 4, 2);
    g.fillStyle(COLORS.purple).fillRoundedRect(0, 1, 25, 8, 4);
    g.generateTexture('shot-purple', 30, 10);
    g.clear();
    g.fillStyle(COLORS.lime).fillCircle(8, 8, 7);
    g.lineStyle(2, COLORS.green, 0.9).strokeCircle(8, 8, 7);
    g.generateTexture('shot-green', 16, 16);
    g.clear();
    g.fillStyle(COLORS.red).fillCircle(6, 6, 5);
    g.fillStyle(COLORS.white).fillCircle(6, 6, 2);
    g.generateTexture('shot-enemy', 12, 12);
    g.clear();
    g.fillStyle(COLORS.cyan).fillRoundedRect(0, 2, 26, 5, 2);
    g.fillStyle(COLORS.white).fillRoundedRect(7, 3, 19, 3, 1);
    g.generateTexture('shot-sniper', 28, 9);
    g.destroy();
  }

  private createBackdropTextures(): void {
    const far = this.make.graphics({ x: 0, y: 0 });
    far.fillStyle(0x170529).fillRect(0, 0, 960, 220);
    for (let x = 0; x < 960; x += 42) {
      const height = 45 + ((x * 17) % 130);
      far.fillStyle(x % 84 === 0 ? 0x27104a : 0x210b3d).fillRect(x, 220 - height, 34, height);
      for (let y = 220 - height + 12; y < 210; y += 18) far.fillStyle(0x2e73a8, 0.6).fillRect(x + 7, y, 3, 6);
    }
    far.generateTexture('city-far', 960, 220);
    far.clear();
    far.fillStyle(0x0c1019).fillRect(0, 0, 960, 210);
    for (let x = 0; x < 960; x += 90) {
      const height = 80 + ((x * 23) % 120);
      far.fillStyle(0x111728).fillRect(x, 210 - height, 70, height);
      far.lineStyle(2, x % 180 === 0 ? COLORS.purple : COLORS.green, 0.25).strokeRect(x + 2, 212 - height, 66, height - 4);
    }
    far.generateTexture('city-near', 960, 210);
    far.destroy();
  }
}
