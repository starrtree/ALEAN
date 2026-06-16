import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PLAYER } from '../config/game';

export class Player extends Phaser.Physics.Arcade.Sprite {
  health: number = PLAYER.maxHealth;
  awakening = 0;
  invulnerableUntil = 0;
  dashReadyAt = 0;
  isDashing = false;
  private dashTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-bike');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(30).setCollideWorldBounds(true).setDrag(PLAYER.drag).setMaxVelocity(PLAYER.speed);
    this.setBodySize(58, 27).setOffset(13, 13);
  }

  move(xAxis: number, yAxis: number): void {
    if (this.isDashing) return;
    this.setAcceleration(xAxis * PLAYER.acceleration, yAxis * PLAYER.acceleration);
    const body = this.body as Phaser.Physics.Arcade.Body;
    const targetRotation = Phaser.Math.Clamp(yAxis * 0.13 + body.velocity.y / 1800, -0.24, 0.24);
    this.rotation = Phaser.Math.Linear(this.rotation, targetRotation, 0.18);
  }

  dash(now: number, direction: Phaser.Math.Vector2): boolean {
    if (now < this.dashReadyAt || this.isDashing) return false;
    this.dashReadyAt = now + PLAYER.dashCooldown;
    this.isDashing = true;
    this.invulnerableUntil = now + PLAYER.dashDuration + 70;
    if (direction.lengthSq() === 0) direction.set(1, 0);
    direction.normalize();
    this.setMaxVelocity(PLAYER.dashSpeed).setAcceleration(0, 0).setVelocity(direction.x * PLAYER.dashSpeed, direction.y * PLAYER.dashSpeed);
    this.setTint(0xeafff4).setAlpha(0.72);
    this.dashTimer?.remove(false);
    this.dashTimer = this.scene.time.delayedCall(PLAYER.dashDuration, () => {
      this.isDashing = false;
      this.clearTint().setAlpha(1).setMaxVelocity(PLAYER.speed);
    });
    return true;
  }

  takeDamage(now: number, amount = 1): boolean {
    if (now < this.invulnerableUntil) return false;
    this.health = Math.max(0, this.health - amount);
    this.invulnerableUntil = now + 900;
    this.setTint(0xff5573);
    this.scene.time.delayedCall(120, () => this.clearTint());
    return true;
  }

  addAwakening(value: number): boolean {
    this.awakening = Phaser.Math.Clamp(this.awakening + value, 0, 100);
    return this.awakening >= 100;
  }

  consumeAwakening(): boolean {
    if (this.awakening < 100) return false;
    this.awakening = 0;
    return true;
  }

  clampToCombatArea(): void {
    this.x = Phaser.Math.Clamp(this.x, 72, GAME_WIDTH - 90);
    this.y = Phaser.Math.Clamp(this.y, 64, GAME_HEIGHT - 76);
  }
}
