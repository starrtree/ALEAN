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
  test('one heart awarded at third kill',()=>eq(M.heartAwardsBetween(2,3),1));
  test('multi-kill awards every crossed milestone',()=>eq(M.heartAwardsBetween(2,7),2));
  test('wanted level begins at 1',()=>eq(M.wantedLevel(0,0),1));
  test('wanted level caps at 5',()=>eq(M.wantedLevel(999,999),5));
  test('higher wanted level spawns faster',()=>ok(M.spawnInterval(5)<M.spawnInterval(1)));
  test('all palettes include weapon colors',()=>ok(C.palettes.every(p=>p.laser&&p.bomb&&p.hull&&p.accent)));
  test('menu audio filename uses repo capitalization',()=>ok(C.audio.menu.endsWith('ALEAN_Menu.m4a')));
  test('game track is real ALEAN file',()=>ok(C.audio.song.endsWith('ALEAN.m4a')));
  test('engine intro + loop configured',()=>ok(C.audio.engineIntro.includes('HOVER-ENGINE_intro')&&C.audio.engineLoop.includes('HOVER-ENGINE_loop')));
  test('provided laser and bomb SFX configured',()=>ok(C.audio.laser.endsWith('laser.mp3')&&C.audio.bomb.endsWith('gameboy_pluck.mp3')));
  test('official HyperFollow is present',()=>eq(C.links.hyperfollow,'https://distrokid.com/hyperfollow/maxstarr/alean'));

  document.getElementById('summary').textContent=`${pass} passed / ${fail} failed`;
  document.body.dataset.ok=fail===0?'true':'false';
})();
