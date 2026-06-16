import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/game';
import type { EnemyKind } from '../entities/Enemy';

export type SpawnRequest = { kind: EnemyKind; x: number; y: number; delay?: number };

export class EnemyDirector {
  private nextWaveAt = 1100;
  private wave = 0;
  private bossSpawned = false;

  reset(): void {
    this.nextWaveAt = 1100;
    this.wave = 0;
    this.bossSpawned = false;
  }

  update(elapsed: number, alert: number, spawn: (request: SpawnRequest) => void): void {
    if (elapsed < this.nextWaveAt) return;
    this.wave += 1;
    const spacing = Phaser.Math.Clamp(2300 - alert * 170, 850, 2300);
    this.nextWaveAt = elapsed + spacing;

    if (!this.bossSpawned && elapsed > 70000) {
      this.bossSpawned = true;
      spawn({ kind: 'warden', x: GAME_WIDTH + 100, y: GAME_HEIGHT * 0.5 });
      return;
    }

    const pattern = this.wave % 5;
    if (pattern === 0) {
      for (let i = 0; i < 4; i++) spawn({ kind: 'patrol', x: GAME_WIDTH + 80 + i * 90, y: 130 + i * 70 });
    } else if (pattern === 1) {
      spawn({ kind: 'interceptor', x: GAME_WIDTH + 90, y: Phaser.Math.Between(90, GAME_HEIGHT - 90) });
      spawn({ kind: 'interceptor', x: GAME_WIDTH + 250, y: Phaser.Math.Between(90, GAME_HEIGHT - 90) });
    } else if (pattern === 2) {
      spawn({ kind: 'sniper', x: GAME_WIDTH + 80, y: Phaser.Math.Between(100, GAME_HEIGHT - 100) });
      for (let i = 0; i < 3; i++) spawn({ kind: 'patrol', x: GAME_WIDTH + 180 + i * 75, y: 110 + i * 120 });
    } else if (pattern === 3 && alert >= 3) {
      spawn({ kind: 'sniper', x: GAME_WIDTH + 80, y: 120 });
      spawn({ kind: 'sniper', x: GAME_WIDTH + 180, y: GAME_HEIGHT - 120 });
      spawn({ kind: 'interceptor', x: GAME_WIDTH + 300, y: GAME_HEIGHT * 0.5 });
    } else {
      const count = 3 + Math.min(alert, 3);
      for (let i = 0; i < count; i++) {
        const angle = (i / Math.max(1, count - 1)) * Math.PI;
        spawn({ kind: 'patrol', x: GAME_WIDTH + 80 + Math.sin(angle) * 150, y: 90 + i * ((GAME_HEIGHT - 180) / Math.max(1, count - 1)) });
      }
    }
  }
}
