import Phaser from 'phaser';

export type EnemyKind = 'patrol' | 'interceptor' | 'sniper' | 'warden';

const STATS: Record<EnemyKind, { texture: string; health: number; speed: number; score: number; fireRate: number }> = {
  patrol: { texture: 'enemy-patrol', health: 2, speed: 125, score: 120, fireRate: 1450 },
  interceptor: { texture: 'enemy-interceptor', health: 2, speed: 250, score: 175, fireRate: 2100 },
  sniper: { texture: 'enemy-sniper', health: 3, speed: 90, score: 260, fireRate: 2400 },
  warden: { texture: 'enemy-warden', health: 18, speed: 72, score: 2200, fireRate: 900 }
};

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly kind: EnemyKind;
  health: number;
  readonly scoreValue: number;
  readonly fireRate: number;
  nextShotAt = 0;
  age = 0;
  laneY: number;
  shielded = false;

  constructor(scene: Phaser.Scene, kind: EnemyKind, x: number, y: number) {
    const stats = STATS[kind];
    super(scene, x, y, stats.texture);
    this.kind = kind;
    this.health = stats.health;
    this.scoreValue = stats.score;
    this.fireRate = stats.fireRate;
    this.laneY = y;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(24).setVelocityX(-stats.speed);
    this.setBodySize(this.width * 0.72, this.height * 0.65);
    if (kind === 'warden') this.setScale(1.18).setBodySize(72, 40);
  }

  updateEnemy(delta: number, player: Phaser.GameObjects.Components.Transform): void {
    this.age += delta;
    switch (this.kind) {
      case 'patrol':
        this.y = this.laneY + Math.sin(this.age * 0.0035) * 42;
        if (this.x < 780) this.setVelocityX(-65);
        break;
      case 'interceptor': {
        const targetY = player.y + Math.sin(this.age * 0.009) * 55;
        this.setVelocityY(Phaser.Math.Clamp((targetY - this.y) * 3.2, -280, 280));
        if (this.x < player.x + 185) this.setVelocityX(-95);
        break;
      }
      case 'sniper':
        this.setVelocityX(this.x > 790 ? -100 : 0);
        this.setVelocityY((player.y - this.y) * 0.55);
        break;
      case 'warden':
        this.setVelocityX(this.x > 760 ? -85 : 0);
        this.setVelocityY(Math.sin(this.age * 0.002) * 50);
        break;
    }
  }

  hit(damage: number): boolean {
    this.health -= this.shielded ? damage * 0.35 : damage;
    this.setTint(0xffffff);
    this.scene.time.delayedCall(45, () => this.active && this.clearTint());
    return this.health <= 0;
  }
}
