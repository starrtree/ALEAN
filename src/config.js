(function () {
  'use strict';

  const ASSET = './public/assets/audio/';

  const palettes = [
    { key:'BIO_LUMEN', name:'BIO-LUMEN', lore:'Living light grown inside engineered tissue.', hull:'#13262b', hull2:'#0b1519', accent:'#7de3a1', plume:'#a6f8c8', laser:'#b46cff', bomb:'#77d89b' },
    { key:'MOTHER', name:'MOTHER EARTH', lore:'Mineral armor, moss circuitry, planetary memory.', hull:'#34423a', hull2:'#1d2922', accent:'#a8c98a', plume:'#b9e7a2', laser:'#d8b0ff', bomb:'#83b978' },
    { key:'SPIRIT_TECH', name:'SPIRIT TECH', lore:'A machine tuned to thought, aura, and intention.', hull:'#29233b', hull2:'#151121', accent:'#8ed5dc', plume:'#d19be8', laser:'#c792ff', bomb:'#8fc8a8' },
    { key:'CYBORG', name:'CYBORG ALLOY', lore:'Human instinct inside a cold adaptive chassis.', hull:'#46515c', hull2:'#252c34', accent:'#80a9c7', plume:'#b2d9e9', laser:'#99bfff', bomb:'#83b697' },
    { key:'HUMAN', name:'HUMAN GRIT', lore:'Warm metal, hand-built repairs, imperfect survival.', hull:'#51483e', hull2:'#2c2825', accent:'#d7a36f', plume:'#edc797', laser:'#d8b0ff', bomb:'#a9b66f' },
    { key:'UTOPIA', name:'UTOPIAN DAWN', lore:'Clean energy from a future that chose cooperation.', hull:'#dfe7e8', hull2:'#93a5ad', accent:'#a6d7d0', plume:'#c9e7ff', laser:'#b9a7ff', bomb:'#8fcfb0' },
    { key:'DYSTOPIA', name:'DYSTOPIAN RUSH', lore:'Black-market plating stolen from the surveillance state.', hull:'#2b2c31', hull2:'#101115', accent:'#b56a73', plume:'#d4a063', laser:'#cf6fae', bomb:'#8fa36d' },
    { key:'MAGUS', name:'ARCANE MAGUS', lore:'Ritual geometry burned into anti-gravity hardware.', hull:'#341b46', hull2:'#190c24', accent:'#a478c9', plume:'#ddb46c', laser:'#c98cff', bomb:'#99b66a' },
    { key:'NEUROVINE', name:'NEUROVINE', lore:'Symbiotic roots think faster than the targeting computer.', hull:'#17341f', hull2:'#0a1d10', accent:'#77b986', plume:'#a6d98d', laser:'#b18cdd', bomb:'#69bd78' },
    { key:'EXIST', name:'EXISTENTIAL MONO', lore:'No prophecy. No certainty. Only motion through the void.', hull:'#2d3038', hull2:'#14161b', accent:'#b6bcc7', plume:'#d5d8df', laser:'#c2b2df', bomb:'#879f88' },
    { key:'VOID', name:'VOID PILGRIM', lore:'A craft painted with the absence between stars.', hull:'#13131a', hull2:'#07070a', accent:'#5d6470', plume:'#776f8f', laser:'#9d86cb', bomb:'#708b75' },
    { key:'STARRSEED', name:'STARRSEED', lore:'Rooted in light. Tuned to growth.', hull:'#5a4321', hull2:'#251a0b', accent:'#dfbf65', plume:'#f0d890', laser:'#c9a7ff', bomb:'#89b978' }
  ];

  const config = {
    W: 384,
    H: 216,
    PLAYER_X: 88,
    gravity: 720,
    flapVelocity: -250,
    maxFall: 310,
    maxHearts: 8,
    startingHearts: 3,
    audio: {
      song: ASSET + 'ALEAN.m4a',
      menu: ASSET + 'ALEAN_Menu.m4a',
      engineIntro: ASSET + 'HOVER-ENGINE_intro.m4a',
      engineLoop: ASSET + 'HOVER-ENGINE_loop.m4a',
      laser: ASSET + 'laser.mp3',
      bomb: ASSET + 'gameboy_pluck.mp3'
    },
    links: {
      hyperfollow: 'https://distrokid.com/hyperfollow/maxstarr/alean',
      spotify: 'https://open.spotify.com/search/Alean%20Max%20Starr',
      apple: 'https://music.apple.com/us/search?term=Alean%20Max%20Starr',
      itunes: 'https://music.apple.com/us/search?term=Alean%20Max%20Starr',
      youtube: 'https://music.youtube.com/search?q=Alean%20Max%20Starr',
      amazon: 'https://music.amazon.com/search/Alean%20Max%20Starr'
    },
    palettes
  };

  const math = {
    clamp(v, a, b) { return Math.max(a, Math.min(b, v)); },
    overlap(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    },
    heartAwardsBetween(oldKills, newKills) {
      return Math.max(0, Math.floor(newKills / 3) - Math.floor(oldKills / 3));
    },
    wantedLevel(elapsed, kills) {
      return Math.min(5, 1 + Math.floor(elapsed / 28) + Math.floor(kills / 16));
    },
    spawnInterval(level) {
      return [0, 1.15, 0.92, 0.74, 0.58, 0.44][Math.max(1, Math.min(5, level))];
    }
  };

  window.ALEAN_CFG = config;
  window.ALEAN_MATH = math;
})();
