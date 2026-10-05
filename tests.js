(function(){
  'use strict';
  const out=document.getElementById('results');
  let pass=0,fail=0;
  function test(name,fn){
    try{fn();pass++;out.insertAdjacentHTML('beforeend',`<li class="pass">PASS — ${name}</li>`)}
    catch(e){fail++;out.insertAdjacentHTML('beforeend',`<li class="fail">FAIL — ${name}: ${e.message}</li>`)}
  }
  function eq(a,b,msg=''){if(a!==b)throw new Error(`${msg} expected ${b}, got ${a}`)}
  function ok(v,msg='expected truthy'){if(!v)throw new Error(msg)}

  const C=window.ALEAN_CFG,M=window.ALEAN_MATH;
  test('ALEAN dimensions stay 16:9',()=>eq(C.W/C.H,16/9));
  test('collision overlap true',()=>ok(M.overlap({x:0,y:0,w:10,h:10},{x:9,y:9,w:4,h:4})));
  test('collision overlap false',()=>eq(M.overlap({x:0,y:0,w:10,h:10},{x:11,y:0,w:2,h:2}),false));
  test('Neurovine direct hit awards one heart below cap',()=>eq(M.neurovineHeartReward(3,8),1));
  test('Neurovine heart reward stops at cap',()=>eq(M.neurovineHeartReward(8,8),0));
  test('building collision damage is two hearts',()=>eq(C.buildingDamage,2));
  test('wanted level begins at 1',()=>eq(M.wantedLevel(0,0),1));
  test('wanted level caps at 5',()=>eq(M.wantedLevel(999,999),5));
  test('higher wanted level spawns faster',()=>ok(M.spawnInterval(5)<M.spawnInterval(1)));
  test('all palettes include weapon colors',()=>ok(C.palettes.every(p=>p.laser&&p.bomb&&p.hull&&p.accent)));
  test('menu audio filename uses repo capitalization',()=>ok(C.audio.menu.endsWith('ALEAN_Menu.m4a')));
  test('game track is real ALEAN file',()=>ok(C.audio.song.endsWith('ALEAN.m4a')));
  test('engine intro + loop configured',()=>ok(C.audio.engineIntro.includes('HOVER-ENGINE_intro')&&C.audio.engineLoop.includes('HOVER-ENGINE_loop')));
  test('boss fight soundtrack is configured',()=>ok(C.audio.boss.endsWith('bitty-boss-fight-soudntrack.mp3')));
  test('boss soundtrack loops at 38 seconds',()=>eq(C.audio.bossLoopEnd,38));
  test('provided laser and bomb SFX configured',()=>ok(C.audio.laser.endsWith('laser.mp3')&&C.audio.bomb.endsWith('gameboy_pluck.mp3')));
  test('official HyperFollow is present',()=>eq(C.links.hyperfollow,'https://distrokid.com/hyperfollow/maxstarr/alean'));
  test('Spotify deep link is the supplied ALEAN track',()=>eq(C.links.spotify,'https://open.spotify.com/track/1I3exfFxPVoPuRFz8Vavui?autoplay_ok=1'));
  test('Apple Music deep link is the supplied ALEAN track',()=>eq(C.links.apple,'https://music.apple.com/us/album/alean/1721627495?i=1721627496'));
  test('YouTube Music deep link is the supplied ALEAN track',()=>eq(C.links.youtube,'https://music.youtube.com/watch?v=oGB0u8gl2eM'));
  test('Amazon Music deep link is the supplied ALEAN album',()=>eq(C.links.amazon,'https://music.amazon.com/albums/B0CQ9NYCSB'));
  test('desktop combat defaults are ergonomic F/E',()=>ok(C.defaultKeys.laser.toLowerCase()==='f'&&C.defaultKeys.bomb.toLowerCase()==='e'));
  test('opening pursuit remains one star through first 20 seconds',()=>eq(M.wantedLevel(20,0),1));
  test('lyric timestamps with known times are chronological',()=>{
    const times=C.lyrics.filter(l=>Number.isFinite(l.t)).map(l=>l.t);
    ok(times.every((t,i)=>i===0||t>=times[i-1]));
  });
  test('final corrected lyrics use 2:10 and 2:12.5 timestamps',()=>{
    ok(C.lyrics.some(l=>l.t===130&&l.text.includes('The way I can make them lean')));
    ok(C.lyrics.some(l=>l.t===132.5&&l.text.includes('M.I.B. Man I Been alien!')));
  });
  test('difficulty presets include easy medium hard',()=>ok(C.difficulties.easy&&C.difficulties.medium&&C.difficulties.hard));
  test('easy preserves the current forgiving spawn curve',()=>eq(C.difficulties.easy.spawn[1],1.55));
  test('medium restores the pre-easing spawn curve',()=>eq(C.difficulties.medium.spawn[1],1.15));
  test('medium restores original wanted timing',()=>eq(M.wantedLevel(28,0,'medium'),2));
  test('medium restores fixed normal police bullet base',()=>ok(C.difficulties.medium.bulletBase===145&&C.difficulties.medium.bulletWantedStep===0));
  test('hard world is dramatically faster than medium',()=>ok(C.difficulties.hard.worldSpeed>=C.difficulties.medium.worldSpeed*1.6));
  test('hard spawns police dramatically faster than medium',()=>ok(M.spawnInterval(1,'hard')<=M.spawnInterval(1,'medium')*0.55));
  test('hard police bullets are much faster than medium',()=>ok(C.difficulties.hard.bulletBase>=C.difficulties.medium.bulletBase*1.5));
  test('hard mothership is substantially tougher than medium',()=>ok(C.difficulties.hard.bossHp>=C.difficulties.medium.bossHp*2));
  test('hover taps are shorter than the original -250 impulse',()=>ok(Math.abs(C.difficulties.easy.flapVelocity)<250&&Math.abs(C.difficulties.medium.flapVelocity)<250));
  test('easy mothership has less HP than medium',()=>ok(C.difficulties.easy.bossHp<C.difficulties.medium.bossHp));
  test('easy mothership drones are slower than medium',()=>ok(C.difficulties.easy.bossDroneSpeed<C.difficulties.medium.bossDroneSpeed));
  test('sky lyric callouts are at most three words',()=>ok(C.skyLyrics.every(c=>c.text.trim().split(/\s+/).length<=3)));
  test('sky lyric callouts are slowed for readability',()=>ok(C.skyLyrics.every(c=>c.duration>=4.8)));
  test('hover taps are shorter and more precise than v2.2',()=>ok(Math.abs(C.difficulties.easy.flapVelocity)<=190&&Math.abs(C.difficulties.medium.flapVelocity)<=192));

  document.getElementById('summary').textContent=`${pass} passed / ${fail} failed`;
  document.body.dataset.ok=fail===0?'true':'false';
})();
