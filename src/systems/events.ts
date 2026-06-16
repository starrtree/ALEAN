import Phaser from 'phaser';

export const gameEvents = new Phaser.Events.EventEmitter();

export type HudState = {
  score: number;
  health: number;
  maxHealth: number;
  awakening: number;
  alert: number;
  combo: number;
};
