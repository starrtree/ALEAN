import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, PLAYER } from '../config/game';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { EnemyDirector, type SpawnRequest } from '../systems/EnemyDirector';
import { gameEvents } from '../systems/events';
import { Synth } from '../systems/Synth';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.Physics.Arcade.Group;
  private playerShots!: Phaser.Physics.Arcade.Group;
  private greenBombs!: Phaser.Physics.Arcade.Group;
  private enemyShots!: Phaser.Physics.Arcade.Group;
  private director = new EnemyDirector();
  private synth = new Synth();
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private elapsed = 0;
  private score = 0;
  private kills = 0;
  private combo = 1;
  private lastKillAt = 0;
  private lastPurpleAt = 0;
  private lastGreenAt = 0;
  private alert = 1;
  private paused = false;
  private awakeningActiveUntil = 0;
  private farCity!: Phaser.GameObjects.TileSprite;
  private nearCity!: Phaser.GameObjects.TileSprite;
  private road!: Phaser.GameObjects.TileSprite;
  private trail!: Phaser.GameObjects.Graphics;
  private pauseOverlay?: Phaser.GameObjects.Container;

  constructor() { super('GameScene'); }

  create(): void {
    this.elapsed = 0;
    this.paused = false;
    this.physics.resume();
    this.score = 0;
    this.kills = 0;
    this.combo = 1;
    this.alert = 1;
    this.director.reset();
    this.createWorld();
    this.createGroups();
    this.player = new Player(this, 180, GAME_HEIGHT / 2);
    this.createControls();
    this.createCollisions();
    this.scene.launch('HudScene');
    this.input.once('pointerdown', () => this.synth.unlock());
    this.input.keyboard?.once('keydown', () => this.synth.unlock());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scene.stop('HudScene'));
    this.emitHud();
  }

  update(time: number, delta: number): void {
    if (this.paused) return;
    const dt = Math.min(delta, 34);
    this.elapsed += dt;
    this.alert = Phaser.Math.Clamp(1 + Math.floor(this.elapsed / 18000), 1, 5);
    this.updateWorld(dt);
    this.updatePlayer(time);
    this.director.update(this.elapsed, this.alert, (request) => this.spawnEnemy(request));
    this.updateEnemies(time, dt);
    this.updateProjectiles(dt);
    this.updateFlow(time);
    this.player.clampToCombatArea();
    this.emitHud();
  }

  private createWorld(): void {
    const sky = this.add.graphics().setDepth(-20);
    sky.fillGradientStyle(0x250046, 0x150034, 0x080014, 0x080014, 1);
    sky.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    for (let i = 0; i < 120; i++) {
      sky.fillStyle(i % 9 === 0 ? COLORS.green : 0xffffff, Phaser.Math.FloatBetween(0.1, 0.65));
      sky.fillCircle(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(0, 330), Phaser.Math.Between(1, 2));
    }
    this.farCity = this.add.tileSprite(GAME_WIDTH / 2, 320, GAME_WIDTH, 220, 'city-far').setDepth(-14).setAlpha(0.88);
    this.nearCity = this.add.tileSprite(GAME_WIDTH / 2, 390, GAME_WIDTH, 210, 'city-near').setDepth(-8).setAlpha(0.9);
    const roadTexture = this.make.graphics({ x: 0, y: 0 });
    roadTexture.fillStyle(0x080b12).fillRect(0, 0, 320, 88);
    roadTexture.fillStyle(COLORS.purple, 0.65).fillRect(0, 8, 180, 3);
    roadTexture.fillStyle(COLORS.green, 0.4).fillRect(210, 70, 95, 2);
    roadTexture.generateTexture('road-loop', 320, 88);
    roadTexture.destroy();
    this.road = this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT - 38, GAME_WIDTH, 88, 'road-loop').setDepth(-5);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 82, GAME_WIDTH, 3, COLORS.purple, 0.35).setDepth(-4);
    this.trail = this.add.graphics().setDepth(20);
  }

  private createGroups(): void {
    this.enemies = this.physics.add.group({ runChildUpdate: false });
    this.playerShots = this.physics.add.group({ defaultKey: 'shot-purple', maxSize: 100 });
    this.greenBombs = this.physics.add.group({ defaultKey: 'shot-green', maxSize: 30 });
    this.enemyShots = this.physics.add.group({ defaultKey: 'shot-enemy', maxSize: 160 });
  }

  private createControls(): void {
    if (!this.input.keyboard) throw new Error('Keyboard input unavailable');
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,J,K,E,P,M') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-M', () => {
      const muted = !(this.registry.get('muted') ?? false);
      this.registry.set('muted', muted);
      this.synth.setMuted(muted);
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown && !this.paused) {
        this.player.x = Phaser.Math.Linear(this.player.x, pointer.worldX, 0.16);
        this.player.y = Phaser.Math.Linear(this.player.y, pointer.worldY, 0.16);
      }
    });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) this.fireGreen(this.time.now);
      else this.firePurple(this.time.now);
    });
    this.input.mouse?.disableContextMenu();
  }

  private createCollisions(): void {
    this.physics.add.overlap(this.playerShots, this.enemies, (a, b) => this.onPurpleHit(a as Phaser.GameObjects.GameObject, b as Phaser.GameObjects.GameObject));
    this.physics.add.overlap(this.greenBombs, this.enemies, (a, b) => this.onGreenHit(a as Phaser.GameObjects.GameObject, b as Phaser.GameObjects.GameObject));
    this.physics.add.overlap(this.player, this.enemyShots, (a, b) => this.onPlayerHit(a as Phaser.GameObjects.GameObject, b as Phaser.GameObjects.GameObject));
    this.physics.add.overlap(this.player, this.enemies, (a, b) => this.onPlayerCollision(a as Phaser.GameObjects.GameObject, b as Phaser.GameObjects.GameObject));
  }

  private updateWorld(dt: number): void {
    const speed = (0.18 + this.alert * 0.025) * dt;
    this.farCity.tilePositionX += speed * 0.28;
    this.nearCity.tilePositionX += speed * 0.72;
    this.road.tilePositionX += speed * 2.3;
    this.trail.clear();
    this.trail.lineStyle(5, COLORS.purple, 0.2).lineBetween(this.player.x - 8, this.player.y + 10, this.player.x - 125, this.player.y + Phaser.Math.Between(5, 16));
    this.trail.lineStyle(2, COLORS.green, 0.45).lineBetween(this.player.x - 12, this.player.y + 14, this.player.x - 95, this.player.y + Phaser.Math.Between(10, 20));
  }

  private updatePlayer(time: number): void {
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;
    const direction = new Phaser.Math.Vector2(Number(right) - Number(left), Number(down) - Number(up));
    if (direction.lengthSq() > 1) direction.normalize();
    this.player.move(direction.x, direction.y);

    if (Phaser.Input.Keyboard.JustDown(this.cursors.space!)) {
      if (this.player.dash(time, direction)) {
        this.synth.tone(180, 0.16, 'sawtooth', 0.45, 620);
        this.cameras.main.shake(90, 0.004);
        this.spawnBurst(this.player.x - 30, this.player.y, COLORS.purple, 18);
      }
    }
    if (this.keys.J.isDown) this.firePurple(time);
    if (Phaser.Input.Keyboard.JustDown(this.keys.K)) this.fireGreen(time);
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.activateAwakening(time);
  }

  private firePurple(time: number): void {
    const cooldown = time < this.awakeningActiveUntil ? 58 : PLAYER.purpleCooldown;
    if (time < this.lastPurpleAt + cooldown) return;
    this.lastPurpleAt = time;
    const shot = this.playerShots.get(this.player.x + 48, this.player.y, 'shot-purple') as Phaser.Physics.Arcade.Image | null;
    if (!shot) return;
    shot.enableBody(true, this.player.x + 48, this.player.y, true, true).setVelocityX(time < this.awakeningActiveUntil ? 1050 : 820).setDepth(26);
    shot.setData('damage', time < this.awakeningActiveUntil ? 2 : 1).setData('life', 1050);
    this.synth.tone(time < this.awakeningActiveUntil ? 1180 : 880, 0.045, 'square', 0.22, 180);
  }

  private fireGreen(time: number): void {
    if (time < this.lastGreenAt + PLAYER.greenCooldown) return;
    this.lastGreenAt = time;
    const bomb = this.greenBombs.get(this.player.x + 38, this.player.y, 'shot-green') as Phaser.Physics.Arcade.Image | null;
    if (!bomb) return;
    bomb.enableBody(true, this.player.x + 38, this.player.y, true, true).setVelocity(490, -90).setAccelerationY(330).setDepth(26);
    bomb.setData('damage', 2).setData('life', 1800);
    this.synth.tone(390, 0.11, 'triangle', 0.3, -140);
  }

  private activateAwakening(time: number): void {
    if (!this.player.consumeAwakening()) return;
    this.awakeningActiveUntil = time + 6200;
    this.cameras.main.flash(420, 115, 255, 182, false);
    this.cameras.main.zoomTo(1.035, 280, 'Sine.easeOut', true);
    this.time.delayedCall(350, () => this.cameras.main.zoomTo(1, 500));
    this.spawnBurst(this.player.x, this.player.y, COLORS.green, 55);
    this.synth.tone(220, 0.65, 'sine', 0.55, 660);
    this.enemyShots.children.each((child) => {
      const shot = child as Phaser.Physics.Arcade.Image;
      if (shot.active) {
        this.score += 15;
        shot.disableBody(true, true);
      }
      return true;
    });
  }

  private spawnEnemy(request: SpawnRequest): void {
    const enemy = new Enemy(this, request.kind, request.x, request.y);
    this.enemies.add(enemy);
    enemy.nextShotAt = this.time.now + Phaser.Math.Between(650, 1400);
    if (request.kind === 'warden') {
      this.cameras.main.flash(280, 170, 30, 55, false);
      this.add.text(GAME_WIDTH / 2, 155, 'SYSTEM WARDEN DEPLOYED', {
        fontFamily: 'Arial Black', fontSize: '27px', color: '#ff6b85', stroke: '#19000a', strokeThickness: 7
      }).setOrigin(0.5).setDepth(80).setScrollFactor(0).setAlpha(0).setScale(1.5)
        .setData('banner', true);
      const banner = this.children.list.find((child) => child.getData?.('banner')) as Phaser.GameObjects.Text | undefined;
      if (banner) this.tweens.add({ targets: banner, alpha: 1, scale: 1, duration: 260, hold: 1100, yoyo: true, onComplete: () => banner.destroy() });
    }
  }

  private updateEnemies(time: number, dt: number): void {
    this.enemies.children.each((child) => {
      const enemy = child as Enemy;
      if (!enemy.active) return true;
      enemy.updateEnemy(dt, this.player);
      if (enemy.x < -120) {
        enemy.destroy();
        this.combo = 1;
        return true;
      }
      if (time >= enemy.nextShotAt && enemy.x > this.player.x + 80 && enemy.x < GAME_WIDTH + 30) {
        this.fireEnemy(enemy, time);
        enemy.nextShotAt = time + enemy.fireRate * Phaser.Math.FloatBetween(0.78, 1.18);
      }
      return true;
    });
  }

  private fireEnemy(enemy: Enemy, time: number): void {
    const isSniper = enemy.kind === 'sniper';
    const isWarden = enemy.kind === 'warden';
    const count = isWarden ? 3 : 1;
    for (let i = 0; i < count; i++) {
      const shot = this.enemyShots.get(enemy.x - 18, enemy.y, isSniper ? 'shot-sniper' : 'shot-enemy') as Phaser.Physics.Arcade.Image | null;
      if (!shot) continue;
      shot.setTexture(isSniper ? 'shot-sniper' : 'shot-enemy');
      shot.enableBody(true, enemy.x - 18, enemy.y + (i - 1) * 18, true, true).setDepth(25);
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
      const prediction = new Phaser.Math.Vector2(
        this.player.x + playerBody.velocity.x * 0.18,
        this.player.y + playerBody.velocity.y * 0.18
      );
      const direction = prediction.subtract(new Phaser.Math.Vector2(enemy.x, enemy.y + (i - 1) * 18)).normalize();
      const speed = isSniper ? 520 : isWarden ? 360 : 285;
      shot.setVelocity(direction.x * speed, direction.y * speed).setData('life', 4200).setData('damage', isSniper ? 2 : 1);
      if (isSniper) shot.setTint(COLORS.cyan);
    }
    this.synth.tone(isSniper ? 160 : 260, isSniper ? 0.16 : 0.06, 'sawtooth', 0.16, isSniper ? 500 : -60);
    if (isSniper) this.spawnTelegraph(enemy.x, enemy.y, this.player.x, this.player.y, time);
  }

  private spawnTelegraph(x1: number, y1: number, x2: number, y2: number, _time: number): void {
    const beam = this.add.line(0, 0, x1, y1, x2, y2, COLORS.red, 0.5).setOrigin(0).setDepth(22);
    this.tweens.add({ targets: beam, alpha: 0, duration: 210, onComplete: () => beam.destroy() });
  }

  private updateProjectiles(dt: number): void {
    const process = (group: Phaser.Physics.Arcade.Group): void => {
      group.children.each((child) => {
        const projectile = child as Phaser.Physics.Arcade.Image;
        if (!projectile.active) return true;
        const life = Number(projectile.getData('life') ?? 1500) - dt;
        projectile.setData('life', life);
        if (life <= 0 || projectile.x < -80 || projectile.x > GAME_WIDTH + 100 || projectile.y < -80 || projectile.y > GAME_HEIGHT + 80) projectile.disableBody(true, true);
        return true;
      });
    };
    process(this.playerShots);
    process(this.greenBombs);
    process(this.enemyShots);
  }

  private onPurpleHit(shotObject: Phaser.GameObjects.GameObject, enemyObject: Phaser.GameObjects.GameObject): void {
    const shot = shotObject as Phaser.Physics.Arcade.Image;
    const enemy = enemyObject as Enemy;
    if (!shot.active || !enemy.active) return;
    shot.disableBody(true, true);
    const dead = enemy.hit(Number(shot.getData('damage') ?? 1));
    this.spawnBurst(shot.x, shot.y, COLORS.purple, 5);
    if (dead) this.destroyEnemy(enemy, 'purple');
  }

  private onGreenHit(bombObject: Phaser.GameObjects.GameObject, enemyObject: Phaser.GameObjects.GameObject): void {
    const bomb = bombObject as Phaser.Physics.Arcade.Image;
    const enemy = enemyObject as Enemy;
    if (!bomb.active || !enemy.active) return;
    bomb.disableBody(true, true);
    const radius = this.awakeningActiveUntil > this.time.now ? 190 : 125;
    this.greenExplosion(enemy.x, enemy.y, radius);
  }

  private greenExplosion(x: number, y: number, radius: number): void {
    const ring = this.add.circle(x, y, 16, COLORS.green, 0.28).setStrokeStyle(4, COLORS.lime, 0.9).setDepth(40);
    this.tweens.add({ targets: ring, radius, alpha: 0, duration: 320, ease: 'Quad.out', onComplete: () => ring.destroy() });
    this.spawnBurst(x, y, COLORS.green, 30);
    this.synth.burst();
    const targets: Enemy[] = [];
    this.enemies.children.each((child) => {
      const enemy = child as Enemy;
      if (enemy.active && Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= radius) targets.push(enemy);
      return true;
    });
    targets.slice(0, 7).forEach((enemy, index) => {
      this.time.delayedCall(index * 55, () => {
        if (!enemy.active) return;
        const vine = this.add.line(0, 0, x, y, enemy.x, enemy.y, COLORS.green, 0.9).setOrigin(0).setLineWidth(3).setDepth(35);
        this.tweens.add({ targets: vine, alpha: 0, duration: 220, onComplete: () => vine.destroy() });
        if (enemy.hit(3)) this.destroyEnemy(enemy, 'green');
      });
    });
  }

  private destroyEnemy(enemy: Enemy, element: 'purple' | 'green'): void {
    const x = enemy.x;
    const y = enemy.y;
    const kind = enemy.kind;
    const scoreValue = enemy.scoreValue * this.combo;
    this.score += scoreValue;
    this.kills += 1;
    this.combo = Math.min(9, this.combo + 1);
    this.lastKillAt = this.time.now;
    this.player.addAwakening(element === 'green' ? 14 : 8);
    this.spawnBurst(x, y, element === 'green' ? COLORS.green : COLORS.purple, kind === 'warden' ? 70 : 24);
    this.cameras.main.shake(kind === 'warden' ? 420 : 90, kind === 'warden' ? 0.015 : 0.004);
    this.synth.burst();
    enemy.destroy();
    if (kind === 'warden') {
      this.player.health = Math.min(PLAYER.maxHealth, this.player.health + 2);
      this.score += 5000;
    }
  }

  private onPlayerHit(_playerObject: Phaser.GameObjects.GameObject, shotObject: Phaser.GameObjects.GameObject): void {
    const shot = shotObject as Phaser.Physics.Arcade.Image;
    if (!shot.active) return;
    shot.disableBody(true, true);
    this.damagePlayer(Number(shot.getData('damage') ?? 1));
  }

  private onPlayerCollision(_playerObject: Phaser.GameObjects.GameObject, enemyObject: Phaser.GameObjects.GameObject): void {
    const enemy = enemyObject as Enemy;
    if (!enemy.active) return;
    if (this.player.isDashing) {
      this.destroyEnemy(enemy, 'purple');
      return;
    }
    this.damagePlayer(enemy.kind === 'warden' ? 2 : 1);
    enemy.setVelocityX(240);
  }

  private damagePlayer(amount: number): void {
    if (!this.player.takeDamage(this.time.now, amount)) return;
    this.combo = 1;
    this.cameras.main.shake(180, 0.012);
    this.cameras.main.flash(120, 255, 40, 70, false);
    this.spawnBurst(this.player.x, this.player.y, COLORS.red, 28);
    this.synth.tone(120, 0.22, 'sawtooth', 0.55, -70);
    if (this.player.health <= 0) this.gameOver();
  }

  private updateFlow(time: number): void {
    if (this.combo > 1 && time > this.lastKillAt + 2400) this.combo = 1;
    if (time < this.awakeningActiveUntil) {
      this.player.setTint(0xcaffdc);
      this.farCity.setTint(0xc9ffe1);
    } else {
      this.player.clearTint();
      this.farCity.clearTint();
    }
  }

  private spawnBurst(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const particle = this.add.rectangle(x, y, Phaser.Math.Between(2, 7), Phaser.Math.Between(2, 7), color, 1).setDepth(50).setRotation(Phaser.Math.FloatBetween(0, Math.PI));
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.Between(20, count > 40 ? 160 : 85);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        rotation: particle.rotation + Phaser.Math.FloatBetween(-2, 2),
        duration: Phaser.Math.Between(220, 650),
        ease: 'Quad.out',
        onComplete: () => particle.destroy()
      });
    }
  }

  private emitHud(): void {
    gameEvents.emit('hud:update', {
      score: this.score,
      health: this.player.health,
      maxHealth: PLAYER.maxHealth,
      awakening: this.player.awakening,
      alert: this.alert,
      combo: this.combo
    });
  }

  private togglePause(): void {
    this.paused = !this.paused;
    this.physics.world.isPaused = this.paused;
    if (this.paused) {
      const shade = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x030308, 0.72);
      const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'PURSUIT PAUSED\n\nPRESS P TO RESUME', {
        fontFamily: 'Arial Black', fontSize: '30px', color: '#ffffff', align: 'center'
      }).setOrigin(0.5);
      this.pauseOverlay = this.add.container(0, 0, [shade, text]).setDepth(200);
    } else {
      this.pauseOverlay?.destroy(true);
      this.pauseOverlay = undefined;
    }
  }

  private gameOver(): void {
    this.physics.pause();
    this.paused = true;
    const best = Math.max(Number(localStorage.getItem('alean-neon-pursuit-best') ?? 0), this.score);
    localStorage.setItem('alean-neon-pursuit-best', String(best));
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x040208, 0.86).setDepth(190);
    const title = this.add.text(GAME_WIDTH / 2, 180, 'CONTAINMENT COMPLETE', {
      fontFamily: 'Arial Black', fontSize: '43px', color: '#ff617e', stroke: '#19000b', strokeThickness: 8
    }).setOrigin(0.5).setDepth(200);
    const results = this.add.text(GAME_WIDTH / 2, 280, `SCORE ${this.score.toLocaleString()}\nBEST ${best.toLocaleString()}\nUFOs DISABLED ${this.kills}`, {
      fontFamily: 'monospace', fontSize: '23px', color: '#dce7ff', align: 'center', lineSpacing: 10
    }).setOrigin(0.5).setDepth(200);
    const restart = this.add.text(GAME_WIDTH / 2, 405, 'RESTART PURSUIT', {
      fontFamily: 'Arial', fontSize: '21px', color: '#07110b', backgroundColor: '#63ffad', padding: { x: 22, y: 12 }
    }).setOrigin(0.5).setDepth(200).setInteractive({ useHandCursor: true });
    restart.on('pointerdown', () => this.scene.restart());
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.restart());
    this.tweens.add({ targets: [overlay, title, results, restart], alpha: { from: 0, to: 1 }, duration: 320 });
  }
}
