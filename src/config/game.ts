export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const COLORS = {
  void: 0x080014,
  deepPurple: 0x19002f,
  purple: 0xb45cff,
  hotPurple: 0xe28cff,
  green: 0x63ffad,
  lime: 0xb7ff5f,
  cyan: 0x63dcff,
  red: 0xff4f6d,
  white: 0xf3f7ff,
  dark: 0x0c1119
} as const;

export const PLAYER = {
  speed: 330,
  acceleration: 1350,
  drag: 920,
  maxHealth: 5,
  dashSpeed: 880,
  dashDuration: 145,
  dashCooldown: 850,
  purpleCooldown: 105,
  greenCooldown: 720
} as const;
