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
      spotify: 'https://open.spotify.com/track/1I3exfFxPVoPuRFz8Vavui?autoplay_ok=1',
      apple: 'https://music.apple.com/us/album/alean/1721627495?i=1721627496',
      youtube: 'https://music.youtube.com/watch?v=oGB0u8gl2eM',
      amazon: 'https://music.amazon.com/albums/B0CQ9NYCSB'
    },
    defaultKeys: {
      flap: 'Space',
      laser: 'f',
      bomb: 'e',
      boost: 'Shift'
    },
    lyrics: [
      {t:1,text:'Yeah oh oh'},
      {t:4,text:'(Let\'s go let\'s go)'},
      {t:6.5,text:'I do not I do not need that purple drink to feel like an alien!',punch:true},
      {t:11,text:'I do not need that purple drink, To make me lean I\'m already high as an alien!'},
      {t:17,text:'I just touch that green, Now Mother Nature showin\' me a scene!'},
      {t:20,text:'It ain\'t what you think, It\'s somethin\' far off in the galaxy!'},
      {t:23,text:'Now I done seen everything! Oh oh oh',punch:true},
      {t:26,text:'I feel like the Earth "I just wanna (one) rock", My diamonds electric they shock'},
      {t:29.5,text:'But I can\'t always give my light away, \'Cause y\'all like to stay in the dark'},
      {t:33,text:'And I can\'t give my time away, To people that just wanna talk/Tok'},
      {t:36,text:'\'Cause I\'m bout to tick(Tik), Like bish I\'m the bomb, Osama-dot-com',punch:true},
      {t:38,text:'I\'m lit I\'m live'},
      {t:40,text:'Mama told me to survive'},
      {t:41.5,text:'Now get your mind right, And open up your eyes!',punch:true},
      {t:45,text:'Cause y\'all been blind'},
      {t:47,text:'And I was too, But it took me to open the blinds'},
      {t:48.5,text:'Read the fine lines in the covenant, See why I won\'t ever sign away my life'},
      {t:51,text:'Sh*t coulda been over I was down, But I found out how to get up over it'},
      {t:55,text:'I should\'ve been known I\'m him, So fresh that I don\'t need deodorant'},
      {t:58,text:'Yeah they should\'ve been known I\'m the realest, They just fake it and go with it'},
      {t:61.5,text:'Hopped in a spaceship told \'em get on'},
      {t:63,text:'I know I\'m someone that they wanna get cloned'},
      {t:65.5,text:'Now I\'m driving a UFO so I can\'t be identified',punch:true},
      {t:69.5,text:'No ID so I can\'t get a DUI',punch:true},
      {t:72.5,text:'Roll with me and you might stay alive'},
      {t:75.5,text:'Just might survive the ride',punch:true},
      {t:77.5,text:'\'Cause I do not need that purple drink, To make me lean I\'m already high as an alien!'},
      {t:82,text:'I just touch that green, Now Mother Nature showin\' me a scene!'},
      {t:85,text:'It ain\'t what you think, It\'s somethin\' far off in the galaxy!'},
      {t:88.5,text:'Now I done seen everything! Oh oh oh',punch:true},
      {t:90,text:'(I do not need that purple drink)'},
      {t:93,text:'(High as an alien)'},
      {t:96.5,text:'(Now Mother Nature showin\' me a scene)'},
      {t:102,text:'(Now I done seen everything! Ohh oh ooh)'},
      {t:105,text:'I done seen everything, But never seen a single thing like me',punch:true},
      {t:109,text:'I won\'t let out the demons, But I\'ll let \'em turn me to a beast'},
      {t:113,text:'And I\'m not off a bean, But I can be an awful being'},
      {t:117,text:'Float on that beat like a butterfly, But I turned up the sting',punch:true},
      {t:121,text:'Can\'t tell me that you not a vegan, Clearly you don\'t want no beef'},
      {t:125,text:'This trigger finger will light you up, Do you wanna meet ET?',punch:true},
      {t:130,text:'I just feel like that purple drink'},
      {t:null,text:'The way I can make them lean, Make \'em forget what they seen',ambiguous:'Provided as 2:01 after the 2:10 line; needs corrected timestamp.'},
      {t:134.5,text:'MIB Man I Been alien!',punch:true}
    ],
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
      // Keep the opening fast but readable: stars rise from survival + aggression, not immediately.
      const timeStars = Math.floor(Math.max(0, elapsed - 18) / 34);
      const killStars = Math.floor(kills / 18);
      return Math.min(5, 1 + timeStars + killStars);
    },
    spawnInterval(level) {
      return [0, 1.55, 1.24, 0.98, 0.76, 0.58][Math.max(1, Math.min(5, level))];
    }
  };

  window.ALEAN_CFG = config;
  window.ALEAN_MATH = math;
})();
