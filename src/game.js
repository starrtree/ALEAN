(function () {
  'use strict';

  const C = window.ALEAN_CFG;
  const M = window.ALEAN_MATH;

  class AleanGame {
    constructor(canvas, audio) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;
      this.audio = audio;
      this.state = 'menu';
      this.mode = 'song';
      this.last = performance.now();
      this.acc = 0;
      this.fixed = 1 / 60;
      this.elapsed = 0;
      this.runStart = 0;
      this.countdown = 0;
      this.shake = 0;
      this.flash = 0;
      this.paletteKey = localStorage.getItem('alean_palette') || 'BIO_LUMEN';
      this.settings = {
        shake: localStorage.getItem('alean_shake') !== '0',
        reducedFx: localStorage.getItem('alean_reduced_fx') === '1',
        lyrics: localStorage.getItem('alean_lyrics') !== '0'
      };
      try {
        this.keybinds = Object.assign({}, C.defaultKeys, JSON.parse(localStorage.getItem('alean_keybinds') || '{}'));
      } catch (_) {
        this.keybinds = Object.assign({}, C.defaultKeys);
      }
      this.records = this.loadRecords();
      this.keys = {};
      this.bossDirs = { up:false, down:false, left:false, right:false };
      this.actions = { flap:false, laser:false, bomb:false, boost:false };
      this.bg = this.makeCity();
      this.stars = Array.from({ length: 70 }, (_, i) => ({
        x: (i * 59) % C.W,
        y: 6 + ((i * 37) % 132),
        z: 0.2 + ((i % 7) / 10),
        tw: (i % 4) + 1
      }));
      this.bindInput();
      this.bindAudio();
      this.resetRun();
      requestAnimationFrame(t => this.loop(t));
    }

    loadRecords() {
      try {
        return Object.assign({ bestScore:0, bestKills:0, bestChain:0, longest:0, escapes:0 }, JSON.parse(localStorage.getItem('alean_records') || '{}'));
      } catch (_) {
        return { bestScore:0, bestKills:0, bestChain:0, longest:0, escapes:0 };
      }
    }

    saveRecords() {
      localStorage.setItem('alean_records', JSON.stringify(this.records));
    }

    bindAudio() {
      this.audio.onTrackEnded = () => {
        if (this.mode === 'song' && (this.state === 'play' || this.state === 'countdown')) this.finishRun(true);
      };
    }

    bindInput() {
      window.addEventListener('keydown', e => {
        const raw = e.key === ' ' ? 'Space' : e.key;
        const k = String(raw).toLowerCase();
        this.keys[k] = true;
        if (e.code === 'Space') {
          this.keys.space = true;
          if (['play','countdown','gameover','victory'].includes(this.state)) e.preventDefault();
        }

        if ((this.state === 'gameover' || this.state === 'victory') && e.code === 'Space') {
          this.start(this.mode);
          return;
        }

        if (k === 'escape' || k === 'p') {
          if (this.state === 'play') this.pause();
          else if (this.state === 'paused') this.resume();
        }

        if (this.state === 'play') {
          if (this.matchesKey('laser', raw)) this.actions.laser = true;
          if (this.matchesKey('bomb', raw)) this.actions.bomb = true;
          if (this.matchesKey('boost', raw)) this.actions.boost = true;
        }
      });
      window.addEventListener('keyup', e => {
        const raw = e.key === ' ' ? 'Space' : e.key;
        this.keys[String(raw).toLowerCase()] = false;
        if (e.code === 'Space') this.keys.space = false;
      });
    }

    matchesKey(action, raw) {
      return String(this.keybinds[action] || '').toLowerCase() === String(raw || '').toLowerCase();
    }

    setKeybind(action, key) {
      if (!['laser','bomb','boost'].includes(action) || !key) return;
      this.keybinds[action] = key;
      localStorage.setItem('alean_keybinds', JSON.stringify(this.keybinds));
    }

    setBossDirection(direction, active) {
      if (Object.prototype.hasOwnProperty.call(this.bossDirs, direction)) this.bossDirs[direction] = !!active;
    }

    externalAction(name) {
      if (name === 'pause') {
        if (this.state === 'play') this.pause();
        else if (this.state === 'paused') this.resume();
        return;
      }
      if (this.state !== 'play') return;
      if (name === 'flap') this.actions.flap = true;
      if (name === 'laser') this.actions.laser = true;
      if (name === 'bomb') this.actions.bomb = true;
      if (name === 'boost') this.actions.boost = true;
    }

    get palette() {
      return C.palettes.find(p => p.key === this.paletteKey) || C.palettes[0];
    }

    setPalette(key) {
      if (!C.palettes.some(p => p.key === key)) return;
      this.paletteKey = key;
      localStorage.setItem('alean_palette', key);
    }

    resetRun() {
      this.elapsed = 0;
      this.score = 0;
      this.kills = 0;
      this.combo = 1;
      this.bestChain = 0;
      this.hearts = C.startingHearts;
      this.awardedHeartMilestones = 0;
      this.wanted = 1;
      this.spawnClock = 0;
      this.gateClock = 1.6;
      this.powerClock = 0;
      this.bossSpawned = false;
      this.bossMode = false;
      this.bossScale = 0.78;
      this.bossTransition = 0;
      this.jammer = 0;
      this.gravitySnare = 0;
      this.hyper = 0;
      this.player = {
        x:C.PLAYER_X, y:C.H*0.5, w:24, h:18, vy:0, invuln:0,
        shield:0, boost:0, boostEnergy:35, laserCd:0, bombCd:0
      };
      this.enemies = [];
      this.enemyShots = [];
      this.lasers = [];
      this.bombs = [];
      this.gates = [];
      this.pickups = [];
      this.particles = [];
      this.floaters = [];
      this.deathGhosts = [];
    }

    start(mode='song') {
      this.mode = mode;
      this.resetRun();
      this.state = 'countdown';
      this.countdown = 3.25;
      this.runStart = performance.now();
      this.audio.startRun({ endless: mode === 'endless' });
      window.dispatchEvent(new CustomEvent('alean:runstart', { detail:{ mode } }));
    }

    pause() {
      if (this.state !== 'play') return;
      this.state = 'paused';
      this.audio.pauseRun();
      window.dispatchEvent(new Event('alean:paused'));
    }

    resume() {
      if (this.state !== 'paused') return;
      this.state = 'play';
      this.audio.resumeRun();
      this.last = performance.now();
      window.dispatchEvent(new Event('alean:resumed'));
    }

    quitToMenu() {
      this.state = 'menu';
      this.audio.stopRun({ returnToMenu:true });
      window.dispatchEvent(new Event('alean:menu'));
    }

    finishRun(escaped=false) {
      if (['gameover','victory','menu'].includes(this.state)) return;
      this.state = escaped ? 'victory' : 'gameover';
      this.shake = this.settings.shake ? 6 : 0;
      this.audio.stopRun({ returnToMenu:false });
      this.records.bestScore = Math.max(this.records.bestScore, Math.floor(this.score));
      this.records.bestKills = Math.max(this.records.bestKills, this.kills);
      this.records.bestChain = Math.max(this.records.bestChain, this.bestChain);
      this.records.longest = Math.max(this.records.longest, this.elapsed);
      if (escaped) this.records.escapes += 1;
      this.saveRecords();
      window.dispatchEvent(new CustomEvent('alean:finished', { detail:this.resultData(escaped) }));
    }

    resultData(escaped) {
      return {
        escaped,
        mode:this.mode,
        score:Math.floor(this.score),
        kills:this.kills,
        chain:this.bestChain,
        time:this.elapsed,
        records:Object.assign({}, this.records)
      };
    }

    loop(now) {
      let dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.acc += dt;
      while (this.acc >= this.fixed) {
        this.step(this.fixed);
        this.acc -= this.fixed;
      }
      this.render();
      requestAnimationFrame(t => this.loop(t));
    }

    step(dt) {
      this.animateBackground(dt);
      if (this.state === 'gameover' || this.state === 'victory') {
        this.shake = Math.max(0, this.shake - dt * 3.2);
        this.flash = Math.max(0, this.flash - dt * 1.4);
        this.updateParticles(dt);
        return;
      }
      if (this.state === 'countdown') {
        this.countdown -= dt;
        if (this.countdown <= 0) this.state = 'play';
        return;
      }
      if (this.state !== 'play') return;

      this.elapsed += dt;
      this.wanted = M.wantedLevel(this.elapsed, this.kills);
      this.updateTimers(dt);
      this.readContinuousInput();
      this.processActions();
      this.updatePlayer(dt);
      this.spawnClock -= dt;
      this.gateClock -= dt;
      if (this.spawnClock <= 0) this.spawnWave();
      if (!this.bossMode && this.gateClock <= 0) this.spawnGate();
      if (!this.bossSpawned && (this.elapsed > 82 || (this.mode === 'song' && this.audio.progress > 0.68))) this.enterBossMode();
      this.updateWorld(dt);
      this.handleCollisions();
      this.updateParticles(dt);
      this.score += dt * (8 + this.wanted * 2) * (this.player.boost > 0 ? 2 : 1);
    }

    updateTimers(dt) {
      const p = this.player;
      p.invuln = Math.max(0, p.invuln - dt);
      p.boost = Math.max(0, p.boost - dt);
      p.laserCd = Math.max(0, p.laserCd - dt);
      p.bombCd = Math.max(0, p.bombCd - dt);
      this.jammer = Math.max(0, this.jammer - dt);
      this.gravitySnare = Math.max(0, this.gravitySnare - dt);
      this.hyper = Math.max(0, this.hyper - dt);
      this.shake = Math.max(0, this.shake - dt * 20);
      this.flash = Math.max(0, this.flash - dt * 3);
    }

    readContinuousInput() {
      if (!this.bossMode && (this.keys.space || this.keys.w || this.keys.arrowup)) {
        this.actions.flap = true;
        this.keys.space = this.keys.w = this.keys.arrowup = false;
      }
    }

    processActions() {
      if (this.actions.flap) this.flap();
      if (this.actions.laser) this.fireLaser();
      if (this.actions.bomb) this.dropBomb();
      if (this.actions.boost) this.activateBoost();
      this.actions.flap = this.actions.laser = this.actions.bomb = this.actions.boost = false;
    }

    flap() {
      this.player.vy = C.flapVelocity * (this.player.boost > 0 ? 0.92 : 1);
      this.emitTrail(3);
    }

    fireLaser() {
      const p = this.player;
      if (p.laserCd > 0) return;
      p.laserCd = this.hyper > 0 ? 0.08 : 0.16;
      const piercing = this.hyper > 0 ? 3 : 1;
      this.lasers.push({ x:p.x+p.w-1, y:p.y+8, w:11, h:3, vx:390, life:1.25, pierce:piercing });
      this.audio.playLaser();
    }

    dropBomb() {
      const p = this.player;
      if (p.bombCd > 0) return;
      p.bombCd = 0.56;
      this.bombs.push({ x:p.x+p.w-4, y:p.y+11, w:7, h:7, vx:165, vy:-72, ay:360, life:2.2 });
      this.audio.playBomb();
    }

    activateBoost() {
      const p = this.player;
      if (p.boost > 0 || p.boostEnergy < 50) return;
      p.boostEnergy -= 50;
      p.boost = 1.85;
      p.invuln = Math.max(p.invuln, 1.85);
      this.floatText(p.x+10, p.y-8, 'STARRDRIVE x2', '#f2d674');
      this.shake = this.settings.shake ? 3 : 0;
    }

    updatePlayer(dt) {
      const p = this.player;
      if (this.bossMode) {
        const up = this.keys.w || this.keys.arrowup || this.bossDirs.up;
        const down = this.keys.s || this.keys.arrowdown || this.bossDirs.down;
        const left = this.keys.a || this.keys.arrowleft || this.bossDirs.left;
        const right = this.keys.d || this.keys.arrowright || this.bossDirs.right;
        let dx=(right?1:0)-(left?1:0), dy=(down?1:0)-(up?1:0);
        const len=Math.hypot(dx,dy)||1;
        const speed=p.boost>0?245:178;
        if(dx||dy){dx/=len;dy/=len;p.x+=dx*speed*dt;p.y+=dy*speed*dt;this.emitTrail(this.settings.reducedFx?1:2);}
        const aw=C.W/this.bossScale, ah=C.H/this.bossScale;
        p.x=M.clamp(p.x,8,aw-p.w-8);
        p.y=M.clamp(p.y,8,ah-p.h-8);
        p.vy=0;
        return;
      }
      p.vy = Math.min(C.maxFall, p.vy + C.gravity * dt);
      p.y += p.vy * dt;
      if (p.y < 5) { p.y = 5; p.vy = Math.max(0, p.vy); }
      const ground = C.H - 24 - p.h;
      if (p.y > ground) { p.y = ground; p.vy = Math.min(0, p.vy); }
      if (p.boost > 0) this.emitTrail(this.settings.reducedFx ? 1 : 4);
    }

    spawnWave() {
      const level = this.wanted;
      if (this.bossMode) {
        this.spawnClock = Math.max(0.72, 1.5 - level*0.1) * (0.85 + Math.random()*0.45);
        const count = level >= 4 && Math.random() < 0.34 ? 2 : 1;
        for (let i=0;i<count;i++) this.enemies.push(this.makeArenaDrone());
        return;
      }
      this.spawnClock = M.spawnInterval(level) * (0.9 + Math.random() * 0.5);
      let count = 1;
      if (level >= 3 && Math.random() < 0.32) count = 2;
      if (level >= 5 && Math.random() < 0.28) count = 3;
      const baseY = 35 + Math.random() * (C.H - 95);
      for (let i=0; i<count; i++) {
        const type = this.pickEnemyType(level);
        this.enemies.push(this.makeEnemy(type, C.W + 28 + i*34, M.clamp(baseY + (i-(count-1)/2)*32, 24, C.H-60)));
      }
    }

    pickEnemyType(level) {
      const r = Math.random();
      if (level >= 5 && r < 0.18) return 'elite';
      if (level >= 4 && r < 0.34) return 'riot';
      if (level >= 2 && r < 0.58) return 'interceptor';
      return 'scout';
    }

    makeEnemy(type, x, y) {
      const presets = {
        scout:{w:28,h:13,vx:-105,hp:1,fire:3.0,score:100},
        interceptor:{w:30,h:14,vx:-122,hp:1,fire:2.2,score:140},
        riot:{w:34,h:16,vx:-88,hp:2,fire:1.75,score:220},
        elite:{w:33,h:15,vx:-138,hp:2,fire:1.35,score:300}
      };
      const q = Object.assign({}, presets[type]);
      return Object.assign(q, { type, x, y, age:0, fireCd:0.7+Math.random(), phase:Math.random()*6.2, dead:false });
    }

    enterBossMode() {
      this.bossSpawned = true;
      this.bossMode = true;
      this.bossTransition = 1;
      this.gates.length = 0;
      this.enemyShots.length = 0;
      this.enemies.length = 0;
      this.player.x /= this.bossScale;
      this.player.y /= this.bossScale;
      const aw=C.W/this.bossScale, ah=C.H/this.bossScale;
      this.enemies.push({
        type:'boss', x:aw-125, y:ah*0.32, w:96, h:46, vx:0, hp:30, maxHp:30,
        fire:0.72, fireCd:1.25, score:2600, age:0, phase:0, dead:false, arena:true
      });
      this.spawnClock = 1.1;
      this.floatText(aw*0.5,42,'5★ MOTHERSHIP LOCK','#ef7f7f');
      window.dispatchEvent(new Event('alean:bossstart'));
    }

    exitBossMode() {
      if (!this.bossMode) return;
      this.bossMode=false;
      this.player.x=C.PLAYER_X;
      this.player.y=M.clamp(this.player.y*this.bossScale,20,C.H-55);
      this.player.vy=0;
      this.enemies=this.enemies.filter(e=>e.type==='boss');
      this.enemyShots.length=0;
      this.spawnClock=1.1;
      this.gateClock=2.5;
      window.dispatchEvent(new Event('alean:bossend'));
    }

    makeArenaDrone() {
      const aw=C.W/this.bossScale, ah=C.H/this.bossScale;
      const edge=(Math.random()*4)|0;
      let x,y;
      if(edge===0){x=-30;y=Math.random()*ah;}
      else if(edge===1){x=aw+30;y=Math.random()*ah;}
      else if(edge===2){x=Math.random()*aw;y=-24;}
      else{x=Math.random()*aw;y=ah+24;}
      const type=this.wanted>=4&&Math.random()<0.3?'elite':'interceptor';
      const e=this.makeEnemy(type,x,y);
      e.arenaDrone=true;e.vx=0;e.fireCd=1.1+Math.random()*0.8;
      return e;
    }

    spawnGate() {
      this.gateClock = Math.max(3.8, 5.8 - this.wanted*0.22) + Math.random()*1.45;
      const gap = 116 - this.wanted*4;
      const mid = 62 + Math.random()*(C.H-124);
      this.gates.push({ x:C.W+24, w:23, gapTop:mid-gap/2, gapBottom:mid+gap/2, hit:false, passed:false });
    }

    updateWorld(dt) {
      const speedMul = this.player.boost > 0 ? 1.55 : 1;
      const worldSpeed = (76 + this.wanted*8) * speedMul;
      const aw=this.bossMode?C.W/this.bossScale:C.W;
      const ah=this.bossMode?C.H/this.bossScale:C.H;

      if (!this.bossMode) {
        for (const g of this.gates) g.x -= worldSpeed * dt;
        this.gates = this.gates.filter(g => g.x > -42);
      }

      for (const e of this.enemies) {
        e.age += dt;
        const slow = this.gravitySnare > 0 ? 0.58 : 1;
        if (this.bossMode && e.type === 'boss') {
          e.x = aw-128 + Math.sin(e.age*0.72)*28;
          e.y = ah*0.35 + Math.sin(e.age*1.18)*52;
        } else if (this.bossMode && e.arenaDrone) {
          const dx=(this.player.x+this.player.w/2)-(e.x+e.w/2);
          const dy=(this.player.y+this.player.h/2)-(e.y+e.h/2);
          const len=Math.max(1,Math.hypot(dx,dy));
          const chase=(e.type==='elite'?118:92)*slow;
          e.x += dx/len*chase*dt;
          e.y += dy/len*chase*dt;
        } else {
          e.x += (e.vx - worldSpeed*0.16) * dt * slow;
          if (e.type === 'interceptor' || e.type === 'elite') {
            const follow = e.type === 'elite' ? 1.7 : 1.05;
            e.y += M.clamp((this.player.y - e.y) * dt * follow, -42*dt, 42*dt);
          } else {
            e.y += Math.sin(e.age*2.8 + e.phase) * 18 * dt;
          }
        }
        if (this.gravitySnare > 0 && e.type !== 'boss') e.y += (ah*0.48 - e.y) * dt * 0.7;
        e.fireCd -= dt;
        const inFireRange=this.bossMode || (e.x > C.PLAYER_X+45 && e.x < C.W+15);
        if (this.elapsed > 8 && this.jammer <= 0 && e.fireCd <= 0 && inFireRange) {
          this.enemyFire(e);
          e.fireCd = e.fire * (0.9 + Math.random()*0.65);
        }
      }
      this.enemies = this.enemies.filter(e => !e.dead && (this.bossMode ? e.x>-90&&e.x<aw+90&&e.y>-90&&e.y<ah+90 : e.x>-90));

      for (const s of this.enemyShots) {
        s.x += s.vx*dt; s.y += s.vy*dt;
        if (!s.near && s.x < this.player.x+3 && Math.abs((s.y+s.h/2)-(this.player.y+this.player.h/2)) < 26) {
          s.near = true;
          this.player.boostEnergy = M.clamp(this.player.boostEnergy + 5, 0, 100);
          this.score += 25;
          this.floatText(this.player.x+15, this.player.y-5, 'NEAR MISS +25', '#b6d7d0');
        }
      }
      this.enemyShots = this.enemyShots.filter(s => s.x > -30 && s.x < aw+30 && s.y > -30 && s.y < ah+30);

      for (const l of this.lasers) { l.x += l.vx*dt; l.life -= dt; }
      this.lasers = this.lasers.filter(l => l.life > 0 && l.x < aw+30 && l.pierce > 0);

      for (const b of this.bombs) {
        b.x += b.vx*dt; b.vy += b.ay*dt; b.y += b.vy*dt; b.life -= dt;
      }
      this.bombs = this.bombs.filter(b => b.life > 0 && b.y < ah+24 && b.x < aw+30);

      for (const p of this.pickups) {
        p.x -= (this.bossMode?35:worldSpeed*0.7)*dt;
        p.y += Math.sin((this.elapsed+p.phase)*3)*9*dt;
        p.life -= dt;
      }
      this.pickups = this.pickups.filter(p => p.life > 0 && p.x > -18);
    }

    enemyFire(e) {
      const px = this.player.x + this.player.w/2;
      const py = this.player.y + this.player.h/2;
      const ex = e.x;
      const ey = e.y + e.h/2;
      const dx = px-ex, dy = py-ey;
      const len = Math.max(1, Math.hypot(dx,dy));
      const base = 102 + this.wanted*7;
      const speed = e.type === 'elite' ? base+18 : e.type === 'boss' ? base+10 : base;
      if (e.type === 'riot' || e.type === 'boss') {
        const spreads = e.type === 'boss' ? [-0.24,0,0.24] : [-0.16,0.16];
        for (const a of spreads) {
          const ang = Math.atan2(dy,dx) + a;
          this.enemyShots.push({x:ex,y:ey,w:6,h:4,vx:Math.cos(ang)*speed,vy:Math.sin(ang)*speed,near:false});
        }
      } else {
        this.enemyShots.push({x:ex,y:ey,w:6,h:4,vx:dx/len*speed,vy:dy/len*speed,near:false});
      }
    }

    handleCollisions() {
      const p = this.player;

      for (const g of this.gates) {
        if (!g.passed && g.x+g.w < p.x) {
          g.passed = true; this.score += 60 * this.wanted;
        }
        if (g.hit) continue;
        const top = {x:g.x,y:0,w:g.w,h:g.gapTop};
        const bot = {x:g.x,y:g.gapBottom,w:g.w,h:C.H-g.gapBottom};
        if (M.overlap(p,top) || M.overlap(p,bot)) {
          g.hit = true; this.damagePlayer(1);
        }
      }

      for (let i=this.lasers.length-1;i>=0;i--) {
        const l = this.lasers[i];
        for (let j=this.enemies.length-1;j>=0;j--) {
          const e = this.enemies[j];
          if (!M.overlap(l,e)) continue;
          e.hp -= 1;
          l.pierce -= 1;
          this.spark(e.x, e.y+e.h/2, this.palette.laser, 8);
          if (e.hp <= 0) this.destroyEnemy(e, j, 1, true, 'laser');
          if (l.pierce <= 0) break;
        }
      }

      for (let i=this.bombs.length-1;i>=0;i--) {
        const b = this.bombs[i];
        let detonated = false;
        for (let j=this.enemies.length-1;j>=0;j--) {
          const e = this.enemies[j];
          if (!M.overlap(b,e)) continue;
          const cx=e.x+e.w/2, cy=e.y+e.h/2;
          this.bombs.splice(i,1);
          this.plantExplosion(cx,cy,46);
          this.destroyEnemiesInRadius(cx,cy,46);
          detonated = true;
          break;
        }
        if (detonated) continue;
      }

      for (let i=this.enemyShots.length-1;i>=0;i--) {
        if (M.overlap(p,this.enemyShots[i])) {
          this.enemyShots.splice(i,1);
          this.damagePlayer(1);
        }
      }

      for (let i=this.enemies.length-1;i>=0;i--) {
        const e=this.enemies[i];
        if (M.overlap(p,e)) {
          if (p.boost > 0) this.destroyEnemy(e,i,1.4,true,'impact');
          else { this.damagePlayer(1); if (e.type !== 'boss') this.enemies.splice(i,1); }
        }
      }

      for (let i=this.pickups.length-1;i>=0;i--) {
        if (M.overlap(p,this.pickups[i])) {
          const item=this.pickups.splice(i,1)[0];
          this.collectPickup(item.type);
        }
      }
    }

    destroyEnemiesInRadius(cx,cy,r) {
      const targets=[];
      for (let j=this.enemies.length-1;j>=0;j--) {
        const e=this.enemies[j];
        const dx=e.x+e.w/2-cx, dy=e.y+e.h/2-cy;
        if (dx*dx+dy*dy <= r*r) targets.push(j);
      }
      const chain = targets.length;
      for (const j of targets) {
        const e=this.enemies[j];
        this.destroyEnemy(e,j,1 + Math.max(0,chain-1)*0.25, false, 'bomb');
      }
      if (chain >= 2) {
        this.combo = Math.min(8, chain);
        this.bestChain = Math.max(this.bestChain, chain);
        this.score += chain*chain*90;
        this.floatText(cx,cy-18,`NEUROVINE CHAIN x${chain}`,'#8fc59a');
      }
    }

    destroyEnemy(e,index,mult=1,allowDrop=true,cause='impact') {
      if (!e || e.dead) return;
      e.dead = true;
      this.deathGhosts.push({
        x:e.x,y:e.y,w:e.w,h:e.h,type:e.type,phase:e.phase||0,cause,
        life:cause==='bomb'?0.34:0.18,max:cause==='bomb'?0.34:0.18
      });
      const oldKills=this.kills;
      this.kills += 1;
      const heartDelta = M.heartAwardsBetween(oldKills,this.kills);
      if (heartDelta > 0) {
        this.hearts = Math.min(C.maxHearts, this.hearts + heartDelta);
        this.floatText(this.player.x+6,this.player.y-12,'+ HEART','#f48c9d');
      }
      this.score += (e.score||100) * mult * (this.player.boost>0?2:1);
      this.player.boostEnergy = M.clamp(this.player.boostEnergy + (e.type==='boss'?40:10),0,100);
      if (cause === 'bomb') this.plantExplosion(e.x+e.w/2,e.y+e.h/2,e.type==='boss'?58:28);
      else this.explode(e.x+e.w/2,e.y+e.h/2,e.type==='boss'?36:18,cause === 'laser' ? this.palette.laser : null);
      if (allowDrop && e.type!=='boss' && Math.random()<0.17) this.spawnPickup(e.x,e.y);
      if (e.type==='boss') {
        this.score += 2200;
        const aw=this.bossMode?C.W/this.bossScale:C.W;
        this.floatText(aw*0.5,56,'COMMAND SHIP DOWN +2200','#f0c97a');
        setTimeout(() => this.exitBossMode(), 450);
      }
      if (index >= 0 && this.enemies[index] === e) this.enemies.splice(index,1);
    }

    damagePlayer(amount) {
      const p=this.player;
      if (p.invuln>0) return;
      if (p.shield>0) {
        p.shield=0; p.invuln=0.75;
        this.floatText(p.x,p.y-10,'SHIELD BROKE','#8fd2d2');
        this.spark(p.x+p.w/2,p.y+p.h/2,'#8fd2d2',18);
        return;
      }
      this.hearts -= amount;
      p.invuln = 1.2;
      p.vy = -110;
      this.flash = 0.9;
      this.shake = this.settings.shake ? 5 : 0;
      this.spark(p.x+p.w/2,p.y+p.h/2,'#e77a86',24);
      if (this.hearts <= 0) this.finishRun(false);
    }

    spawnPickup(x,y) {
      const pool=['shield','jammer','gravity','hyper','repair','starseed','boost'];
      const type=pool[(Math.random()*pool.length)|0];
      this.pickups.push({type,x,y,w:11,h:11,life:9,phase:Math.random()*6.2});
    }

    collectPickup(type) {
      const p=this.player;
      const labels={
        shield:'PHASE SHIELD', jammer:'POLICE JAMMER', gravity:'GRAVITY SNARE',
        hyper:'LASER HYPERCHARGE', repair:'REPAIR HEART', starseed:'STARRSEED +500', boost:'BOOST CELL'
      };
      if (type==='shield') p.shield=1;
      if (type==='jammer') this.jammer=6;
      if (type==='gravity') this.gravitySnare=6;
      if (type==='hyper') this.hyper=7;
      if (type==='repair') this.hearts=Math.min(C.maxHearts,this.hearts+1);
      if (type==='starseed') { this.score+=500; p.boostEnergy=M.clamp(p.boostEnergy+35,0,100); }
      if (type==='boost') p.boostEnergy=M.clamp(p.boostEnergy+50,0,100);
      this.floatText(p.x+8,p.y-12,labels[type]||type.toUpperCase(),'#e9d17f');
      this.spark(p.x+p.w/2,p.y+p.h/2,'#e9d17f',16);
    }

    animateBackground(dt) {
      const active=['play','countdown'].includes(this.state);
      const speed=(active?54+this.wanted*7:16)*(this.player&&this.player.boost>0?1.5:1);
      for (const layer of this.bg) {
        for (const b of layer.items) {
          b.x -= speed*layer.factor*dt;
          if (b.x+b.w < -4) {
            const maxX=Math.max(...layer.items.map(o=>o.x+o.w));
            b.x=maxX+10+Math.random()*26;
            b.h=layer.minH+Math.random()*(layer.maxH-layer.minH);
            b.w=layer.minW+Math.random()*(layer.maxW-layer.minW);
            b.seed=(Math.random()*9999)|0;
          }
        }
      }
      for (const s of this.stars) {
        s.x -= speed*s.z*0.08*dt;
        if (s.x<0) s.x+=C.W;
      }
    }

    makeCity() {
      const layers=[
        {factor:0.14,color:'#1b1830',window:'#596579',count:10,minH:35,maxH:70,minW:18,maxW:36,base:C.H-24},
        {factor:0.32,color:'#242038',window:'#73808a',count:9,minH:45,maxH:100,minW:22,maxW:42,base:C.H-22},
        {factor:0.56,color:'#302944',window:'#81958b',count:8,minH:55,maxH:132,minW:26,maxW:52,base:C.H-20}
      ];
      for (const layer of layers) {
        layer.items=[];
        let x=-12;
        for(let i=0;i<layer.count;i++){
          const w=layer.minW+Math.random()*(layer.maxW-layer.minW);
          layer.items.push({x,w,h:layer.minH+Math.random()*(layer.maxH-layer.minH),seed:(Math.random()*9999)|0});
          x += w+12+Math.random()*24;
        }
        let cur=-10;
        for(const b of layer.items){ b.x=cur; cur+=b.w+10+Math.random()*22; }
      }
      return layers;
    }

    emitTrail(n) {
      if (this.settings.reducedFx) n=Math.min(1,n);
      for(let i=0;i<n;i++) this.particles.push({x:this.player.x-2,y:this.player.y+11,vx:-90-Math.random()*80,vy:(Math.random()-.5)*30,life:.25+Math.random()*.25,max:.5,color:this.palette.plume,size:2+Math.random()*2});
    }

    explode(x,y,n=18,dominant=null) {
      if (this.settings.reducedFx) n=Math.min(n,10);
      for(let i=0;i<n;i++){
        const a=Math.random()*Math.PI*2, sp=35+Math.random()*120;
        const color=dominant && i%4!==0 ? dominant : (i%3===0?'#f0c46e':i%3===1?'#e67e7e':'#8ba7ba');
        this.particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:.35+Math.random()*.4,max:.75,color,size:2+Math.random()*3});
      }
      this.shake = this.settings.shake ? Math.max(this.shake,2.5) : 0;
    }

    plantExplosion(x,y,r) {
      if (!this.settings.reducedFx) {
        for(let i=0;i<32;i++){
          const a=Math.random()*Math.PI*2, sp=25+Math.random()*r*2.1;
          const greens=[this.palette.bomb,'#77e38e','#3f9f5d','#a1d98e'];
          this.particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:.55+Math.random()*.5,max:1.05,color:greens[i%greens.length],size:2+Math.random()*3});
        }
      }
      this.shake = this.settings.shake ? 4 : 0;
    }

    spark(x,y,color,n=8) {
      if (this.settings.reducedFx) n=Math.min(n,6);
      for(let i=0;i<n;i++) this.particles.push({x,y,vx:(Math.random()-.5)*120,vy:(Math.random()-.5)*120,life:.2+Math.random()*.3,max:.5,color,size:1+Math.random()*2});
    }

    floatText(x,y,text,color) {
      this.floaters.push({x,y,text,color,life:1.25,max:1.25});
    }

    updateParticles(dt) {
      for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=30*dt;p.life-=dt;}
      this.particles=this.particles.filter(p=>p.life>0);
      for(const f of this.floaters){f.y-=16*dt;f.life-=dt;}
      this.floaters=this.floaters.filter(f=>f.life>0);
      for(const g of this.deathGhosts) g.life-=dt;
      this.deathGhosts=this.deathGhosts.filter(g=>g.life>0);
    }

    render() {
      const ctx=this.ctx;
      const sx=this.shake>0?(Math.random()-.5)*this.shake:0;
      const sy=this.shake>0?(Math.random()-.5)*this.shake:0;
      ctx.save();
      ctx.translate(sx,sy);
      this.drawSky();
      this.drawCity();
      if (this.state==='menu') this.drawMenuScene();
      else this.drawGameScene();
      ctx.restore();
      if (this.flash>0) { ctx.fillStyle=`rgba(255,90,110,${Math.min(.28,this.flash*.25)})`;ctx.fillRect(0,0,C.W,C.H); }
    }

    drawSky() {
      const ctx=this.ctx;
      const g=ctx.createLinearGradient(0,0,0,C.H);
      g.addColorStop(0,'#17142a'); g.addColorStop(.48,'#2a2340'); g.addColorStop(1,'#445148');
      ctx.fillStyle=g;ctx.fillRect(0,0,C.W,C.H);
      ctx.fillStyle='rgba(190,205,190,.10)';ctx.fillRect(0,112,C.W,58);
      for(const s of this.stars){
        const a=.18+.32*((Math.sin((performance.now()/400)+s.tw)+1)/2);
        ctx.fillStyle=`rgba(214,220,235,${a})`;ctx.fillRect(s.x|0,s.y|0,s.tw===4?2:1,s.tw===4?2:1);
      }
    }

    drawCity() {
      const ctx=this.ctx;
      for(const layer of this.bg){
        for(const b of layer.items){
          ctx.fillStyle=layer.color;ctx.fillRect(b.x|0,(layer.base-b.h)|0,b.w|0,b.h|0);
          ctx.fillStyle='rgba(255,255,255,.035)';ctx.fillRect((b.x+2)|0,(layer.base-b.h+2)|0,2,(b.h-4)|0);
          this.drawWindows(b,layer);
          if (b.seed%5===0){ctx.fillStyle='#545c64';ctx.fillRect((b.x+b.w*.5)|0,(layer.base-b.h-5)|0,1,5);}
        }
      }
      ctx.fillStyle='#20242b';ctx.fillRect(0,C.H-22,C.W,22);
      ctx.fillStyle='#5f6e63';ctx.fillRect(0,C.H-22,C.W,2);
      ctx.fillStyle='#15181d';ctx.fillRect(0,C.H-12,C.W,12);
      ctx.fillStyle='rgba(125,150,130,.24)';
      for(let x=((this.elapsed*80)%26)-26;x<C.W;x+=26)ctx.fillRect(x|0,C.H-8,12,1);
    }

    drawWindows(b,layer) {
      const ctx=this.ctx;
      const cols=Math.max(1,Math.floor((b.w-7)/7));
      const rows=Math.max(1,Math.floor((b.h-10)/9));
      for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
        const hash=(b.seed+r*17+c*31)%11;
        if(hash<4)continue;
        ctx.fillStyle=hash===10?'#9ba98f':layer.window;
        ctx.globalAlpha=.18+(hash%4)*.08;
        ctx.fillRect((b.x+5+c*7)|0,(layer.base-b.h+7+r*9)|0,2,2);
      }
      ctx.globalAlpha=1;
    }

    drawMenuScene() {
      const bob=Math.sin(performance.now()/420)*4;
      this.drawPlayerSprite(C.W*.49,C.H*.55+bob,2.15,true);
      const x=C.W-88,y=52+Math.sin(performance.now()/520)*8;
      this.drawUfo({x,y,w:36,h:18,type:'elite',age:performance.now()/1000,phase:0,hp:2},1.25);
      this.ctx.fillStyle='rgba(0,0,0,.28)';this.ctx.fillRect(0,0,C.W,C.H);
    }

    drawGameScene() {
      const ctx=this.ctx;
      this.drawPunchline();
      if (this.bossMode) {
        ctx.save();
        ctx.scale(this.bossScale,this.bossScale);
        this.drawWorldEntities();
        ctx.restore();
        this.drawHud();
      } else {
        this.drawWorldEntities();
        this.drawHud();
      }
      this.drawLyrics();
      if(this.state==='countdown')this.drawCountdown();
    }

    drawWorldEntities() {
      for(const g of this.gates)this.drawGate(g);
      for(const p of this.pickups)this.drawPickup(p);
      for(const b of this.bombs)this.drawBomb(b);
      for(const l of this.lasers)this.drawLaser(l);
      for(const s of this.enemyShots)this.drawEnemyShot(s);
      for(const e of this.enemies)this.drawUfo(e,1);
      for(const g of this.deathGhosts)this.drawDeathGhost(g);
      for(const p of this.particles)this.drawParticle(p);
      const blink=this.player.invuln>0&&Math.floor(this.player.invuln*18)%2===0;
      if(!blink)this.drawPlayerSprite(this.player.x,this.player.y,1,false);
      for(const f of this.floaters)this.drawFloater(f);
    }

    drawDeathGhost(g) {
      const ctx=this.ctx,alpha=Math.max(0,g.life/g.max);
      ctx.save();
      ctx.globalAlpha=alpha;
      if(g.cause==='laser'){
        ctx.fillStyle=this.palette.laser;
        ctx.fillRect(g.x,g.y+4,g.w,g.h-5);
        ctx.fillRect(g.x+4,g.y,g.w-8,5);
      } else if(g.cause==='bomb'){
        ctx.fillStyle='#17351f';ctx.fillRect(g.x,g.y+4,g.w,g.h-5);
        ctx.strokeStyle='#71d783';ctx.lineWidth=2;
        ctx.beginPath();
        ctx.moveTo(g.x+2,g.y+g.h);
        ctx.lineTo(g.x+g.w*.35,g.y+g.h*.45);
        ctx.lineTo(g.x+g.w*.52,g.y+2);
        ctx.moveTo(g.x+g.w*.34,g.y+g.h*.48);
        ctx.lineTo(g.x+g.w*.78,g.y+g.h*.25);
        ctx.moveTo(g.x+g.w*.45,g.y+g.h*.65);
        ctx.lineTo(g.x+g.w*.82,g.y+g.h);
        ctx.stroke();
      }
      ctx.restore();
    }

    songTime() {
      const t=this.audio&&this.audio.song?this.audio.song.currentTime:0;
      return Number.isFinite(t)?t:this.elapsed;
    }

    currentLyric() {
      if(!this.settings.lyrics||this.mode!=='song')return null;
      const valid=C.lyrics.filter(l=>Number.isFinite(l.t));
      const t=this.songTime();
      let idx=-1;
      for(let i=0;i<valid.length;i++){if(valid[i].t<=t)idx=i;else break;}
      if(idx<0)return null;
      const lyric=valid[idx],next=valid[idx+1];
      return {lyric,next,t,progress:M.clamp((t-lyric.t)/Math.max(.6,(next?next.t:lyric.t+3)-lyric.t),0,1)};
    }

    drawLyrics() {
      const data=this.currentLyric();if(!data)return;
      const ctx=this.ctx,{lyric,progress}=data;
      const maxW=C.W-34;
      ctx.save();
      ctx.font='6px "Press Start 2P", monospace';
      ctx.textBaseline='middle';
      const words=lyric.text.split(/\s+/);
      const lines=[];let line=[];
      for(const w of words){
        const trial=[...line,w].join(' ');
        if(ctx.measureText(trial).width>maxW&&line.length){lines.push(line);line=[w];}
        else line.push(w);
      }
      if(line.length)lines.push(line);
      const shown=lines.slice(0,2);
      const y0=C.H-42-(shown.length-1)*7;
      ctx.fillStyle='rgba(5,6,9,.68)';ctx.fillRect(12,y0-8,C.W-24,shown.length*14+3);
      const totalWords=words.length,lit=Math.floor(progress*totalWords);
      let seen=0;
      shown.forEach((ln,row)=>{
        const widths=ln.map(w=>ctx.measureText(w+' ').width);
        const total=widths.reduce((a,b)=>a+b,0);
        let x=(C.W-total)/2;
        ln.forEach((w,i)=>{
          ctx.fillStyle=seen<lit?'#f0d05f':'#eef0e8';
          ctx.fillText(w,x,y0+row*14);
          x+=widths[i];seen++;
        });
      });
      ctx.restore();
    }

    drawPunchline() {
      const data=this.currentLyric();if(!data||!data.lyric.punch)return;
      const ctx=this.ctx,text=data.lyric.text.toUpperCase();
      ctx.save();
      ctx.font='18px "Press Start 2P", monospace';
      const tw=ctx.measureText(text).width;
      const x=C.W-(C.W+tw)*data.progress;
      ctx.globalAlpha=.075;
      ctx.fillStyle='#f0d05f';
      ctx.fillText(text,x,72);
      ctx.restore();
    }

    drawPlayerSprite(x,y,s=1,hero=false) {
      const ctx=this.ctx,P=this.palette;
      const px=(v)=>Math.round(v*s);
      ctx.save();ctx.translate(x,y);
      if(hero)ctx.translate(-20*s,-10*s);
      // engine shadow + glow
      ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(px(-6),px(17),px(34),px(4));
      ctx.fillStyle=P.plume;
      const pulse=(Math.floor(performance.now()/80)%3);
      ctx.globalAlpha=.42;ctx.fillRect(px(-12-pulse*2),px(11),px(12+pulse*2),px(6));ctx.globalAlpha=1;
      // hover chassis
      ctx.fillStyle=P.hull2;ctx.fillRect(px(-2),px(8),px(31),px(10));ctx.fillRect(px(4),px(5),px(19),px(4));
      ctx.fillStyle=P.hull;ctx.fillRect(px(2),px(7),px(25),px(7));
      ctx.fillStyle='#0b0d11';ctx.fillRect(px(7),px(15),px(22),px(4));
      ctx.fillStyle=P.accent;ctx.fillRect(px(5),px(9),px(7),px(2));ctx.fillRect(px(20),px(11),px(5),px(2));
      // rider body / suit
      ctx.fillStyle='#11131a';ctx.fillRect(px(1),px(1),px(8),px(10));ctx.fillRect(px(7),px(5),px(5),px(5));
      ctx.fillStyle=P.hull;ctx.fillRect(px(3),px(3),px(6),px(7));
      // head + hair
      ctx.fillStyle='#a86f4c';ctx.fillRect(px(0),px(-4),px(6),px(6));
      ctx.fillStyle='#111015';ctx.fillRect(px(-2),px(-7),px(8),px(4));ctx.fillRect(px(-3),px(-5),px(3),px(4));
      // visor
      ctx.fillStyle=P.accent;ctx.fillRect(px(2),px(-3),px(5),px(2));
      // arm to controls
      ctx.fillStyle='#20242c';ctx.fillRect(px(8),px(6),px(7),px(2));
      // weapon ports
      ctx.fillStyle=P.laser;ctx.fillRect(px(27),px(9),px(3),px(2));
      ctx.restore();
    }

    drawUfo(e,s=1) {
      const ctx=this.ctx,x=e.x,y=e.y,w=e.w,h=e.h;
      ctx.save();ctx.translate(x,y);
      if(s!==1)ctx.scale(s,s);
      const ww=w/s,hh=h/s;
      ctx.fillStyle='rgba(0,0,0,.22)';ctx.fillRect(2,hh-1,ww,4);
      ctx.fillStyle='#08090c';ctx.fillRect(3,4,ww-6,hh-7);ctx.fillRect(0,7,ww,hh-11);
      ctx.fillStyle='#242a32';ctx.fillRect(4,5,ww-8,2);ctx.fillRect(5,hh-5,ww-10,2);
      ctx.fillStyle='#10151c';ctx.fillRect(ww*.35,1,ww*.3,5);
      const blink=Math.floor((performance.now()/150)+(e.phase||0))%2;
      ctx.fillStyle=blink?'#ef4d59':'#702930';ctx.fillRect(ww*.27,3,4,3);
      ctx.fillStyle=blink?'#31526f':'#4db8ef';ctx.fillRect(ww*.66,3,4,3);
      if(e.type==='riot'){ctx.fillStyle='#7c8794';ctx.fillRect(ww*.45,hh-2,3,4);}
      if(e.type==='elite'){ctx.fillStyle='#845d8f';ctx.fillRect(1,hh*.5,3,2);ctx.fillRect(ww-4,hh*.5,3,2);}
      if(e.type==='boss'){
        ctx.fillStyle='#383e48';ctx.fillRect(8,hh-3,ww-16,3);ctx.fillStyle='#b46f78';ctx.fillRect(ww*.45,hh*.3,ww*.1,3);
        const hp=Math.max(0,e.hp/(e.maxHp||30));ctx.fillStyle='#12151b';ctx.fillRect(8,-7,ww-16,3);ctx.fillStyle='#c06f78';ctx.fillRect(8,-7,(ww-16)*hp,3);
      }
      ctx.restore();
    }

    drawLaser(l) {
      const ctx=this.ctx,P=this.palette;
      ctx.fillStyle=P.laser;ctx.fillRect(l.x|0,l.y|0,l.w,l.h);
      ctx.globalAlpha=.25;ctx.fillRect((l.x-6)|0,(l.y-1)|0,l.w+8,l.h+2);ctx.globalAlpha=1;
    }

    drawBomb(b) {
      const ctx=this.ctx,P=this.palette;
      ctx.fillStyle='#17311e';ctx.fillRect(b.x|0,b.y|0,b.w,b.h);
      ctx.fillStyle=P.bomb;ctx.fillRect((b.x+2)|0,(b.y+1)|0,3,4);
      ctx.fillStyle='#9dbb8e';ctx.fillRect((b.x+5)|0,(b.y-2)|0,2,3);
    }

    drawEnemyShot(s) {
      const ctx=this.ctx;ctx.fillStyle='#e06a74';ctx.fillRect(s.x|0,s.y|0,s.w,s.h);
      ctx.fillStyle='rgba(224,106,116,.25)';ctx.fillRect((s.x-3)|0,(s.y-1)|0,s.w+4,s.h+2);
    }

    drawGate(g) {
      const ctx=this.ctx;
      const drawTower=(y,h,flip)=>{
        ctx.fillStyle='#20252c';ctx.fillRect(g.x|0,y|0,g.w,h|0);
        ctx.fillStyle='#3e4846';ctx.fillRect((g.x+3)|0,y|0,3,h|0);
        ctx.fillStyle='#6f8275';
        for(let yy=y+8;yy<y+h-5;yy+=13){ctx.globalAlpha=.22;ctx.fillRect((g.x+11)|0,yy|0,3,3);ctx.fillRect((g.x+20)|0,(yy+4)|0,2,2);}ctx.globalAlpha=1;
        ctx.fillStyle='#333a42';ctx.fillRect((g.x-3)|0,(flip?y+h-5:y)|0,g.w+6,5);
      };
      drawTower(0,g.gapTop,true);drawTower(g.gapBottom,C.H-g.gapBottom,false);
    }

    drawPickup(p) {
      const ctx=this.ctx;const colors={shield:'#81c7d0',jammer:'#cf8b8b',gravity:'#a78cc3',hyper:'#c29be3',repair:'#df7d8e',starseed:'#d8bc68',boost:'#8db69e'};
      ctx.fillStyle='#10131a';ctx.fillRect(p.x|0,p.y|0,11,11);ctx.strokeStyle=colors[p.type]||'#ddd';ctx.strokeRect((p.x+.5)|0,(p.y+.5)|0,10,10);ctx.fillStyle=colors[p.type]||'#ddd';ctx.fillRect((p.x+4)|0,(p.y+4)|0,3,3);
    }

    drawParticle(p) {
      const ctx=this.ctx;ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.fillRect(p.x|0,p.y|0,p.size|0,p.size|0);ctx.globalAlpha=1;
    }

    drawFloater(f) {
      const ctx=this.ctx;ctx.save();ctx.font='7px "Press Start 2P", monospace';ctx.textAlign='center';ctx.globalAlpha=Math.min(1,f.life*2);ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillText(f.text,(f.x+1)|0,(f.y+1)|0);ctx.fillStyle=f.color;ctx.fillText(f.text,f.x|0,f.y|0);ctx.restore();
    }

    drawHud() {
      const ctx=this.ctx,p=this.player;
      ctx.save();ctx.font='7px "Press Start 2P", monospace';ctx.textBaseline='top';
      ctx.fillStyle='rgba(7,8,12,.72)';ctx.fillRect(6,6,138,30);ctx.fillStyle='#d9dde3';ctx.fillText(`SCORE ${Math.floor(this.score).toString().padStart(6,'0')}`,12,11);ctx.fillText(`KILLS ${this.kills}`,12,22);
      // hearts
      for(let i=0;i<this.hearts;i++)this.drawHeart(160+i*15,10);
      // GTA-style five-star wanted meter
      ctx.textAlign='right';ctx.fillStyle='#aeb6c0';ctx.fillText('WANTED',C.W-10,8);
      ctx.font='13px sans-serif';ctx.fillStyle='#4f5660';ctx.fillText('★★★★★',C.W-10,19);
      ctx.fillStyle='#e3c363';ctx.fillText('★'.repeat(this.wanted),C.W-10,19);
      ctx.font='7px "Press Start 2P", monospace';
      // boost meter
      ctx.textAlign='left';ctx.fillStyle='rgba(7,8,12,.72)';ctx.fillRect(8,C.H-18,132,10);ctx.fillStyle='#303942';ctx.fillRect(12,C.H-15,118,4);ctx.fillStyle='#d7bd72';ctx.fillRect(12,C.H-15,118*(p.boostEnergy/100),4);ctx.fillStyle='#d9dde3';ctx.fillText('STARRDRIVE',145,C.H-18);
      // track progress
      if(this.mode==='song'){
        ctx.fillStyle='rgba(7,8,12,.72)';ctx.fillRect(C.W-124,C.H-18,116,10);ctx.fillStyle='#34303f';ctx.fillRect(C.W-119,C.H-15,104,4);ctx.fillStyle=this.palette.accent;ctx.fillRect(C.W-119,C.H-15,104*this.audio.progress,4);
      }
      if(p.shield){ctx.fillStyle='#8fd2d2';ctx.fillText('SHIELD',C.W-118,39);}
      if(this.jammer>0){ctx.fillStyle='#cf8b8b';ctx.fillText('JAMMER',C.W-118,49);}
      if(this.hyper>0){ctx.fillStyle=this.palette.laser;ctx.fillText('HYPER',C.W-118,59);}
      ctx.restore();
    }

    drawHeart(x,y) {
      const ctx=this.ctx;ctx.fillStyle='#df6679';ctx.fillRect(x,y+2,4,4);ctx.fillRect(x+6,y+2,4,4);ctx.fillRect(x+2,y,6,8);ctx.fillRect(x+3,y+8,4,2);
    }

    drawCountdown() {
      const ctx=this.ctx;const v=Math.ceil(this.countdown);
      ctx.fillStyle='rgba(8,8,12,.36)';ctx.fillRect(0,0,C.W,C.H);
      ctx.font='28px "Press Start 2P", monospace';ctx.textAlign='center';ctx.fillStyle='#f0e6c9';ctx.fillText(v>0?String(v):'GO',C.W/2,C.H/2-10);
      ctx.font='7px "Press Start 2P", monospace';ctx.fillStyle='#e0c86f';ctx.fillText('ALEAN! — MAX STARR',C.W/2,C.H/2+18);
      ctx.fillStyle='#a9b5b0';ctx.fillText('HOVER ENGINE ONLINE',C.W/2,C.H/2+31);
    }
  }

  window.AleanGame = AleanGame;
})();
