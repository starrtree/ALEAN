(function () {
  'use strict';

  const C = window.ALEAN_CFG;
  const canvas = document.getElementById('game');
  const audio = new window.AleanAudio(C);
  const game = new window.AleanGame(canvas, audio);
  window.ALEAN = { game, audio, config:C };

  const overlay = document.getElementById('overlay');
  const screens = [...document.querySelectorAll('.screen')];
  const soundGate = document.getElementById('soundGate');
  const mobile = document.getElementById('mobileControls');
  const bossPad = document.getElementById('bossPad');
  const flapBtn = document.getElementById('flapBtn');

  function show(id) {
    screens.forEach(s => s.classList.toggle('active', s.id === id));
    overlay.classList.toggle('hidden', !id);
  }

  async function unlockAndMenu() {
    if (!audio.unlocked) await audio.unlock();
    if (game.state === 'menu') audio.playMenu();
    soundGate.classList.add('hidden');
  }

  async function enterFromIntro(e) {
    if (game.state !== 'intro') return;
    if (e && e.type === 'keydown' && ['Shift','Control','Alt','Meta'].includes(e.key)) return;
    if (!audio.unlocked) await audio.unlock();
    game.enterMenuFromIntro();
    audio.playMenu();
    soundGate.classList.add('hidden');
    show('homeScreen');
  }

  document.addEventListener('pointerdown', enterFromIntro, { once:true });
  document.addEventListener('keydown', enterFromIntro, { once:true });

  document.querySelectorAll('[data-screen]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await unlockAndMenu();
      const target = btn.dataset.screen;
      if (target === 'garageScreen') renderGarage();
      if (target === 'recordsScreen') renderRecords();
      if (target === 'settingsScreen') syncSettings();
      show(target);
    });
  });

  document.querySelectorAll('[data-back]').forEach(btn => btn.addEventListener('click', () => show('homeScreen')));

  document.querySelectorAll('[data-play]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await unlockAndMenu();
      show(null);
      mobile.classList.remove('hidden');
      game.start(btn.dataset.play);
    });
  });

  const difficultyDescription = document.getElementById('difficultyDescription');
  const difficultyButtons = [...document.querySelectorAll('[data-difficulty]')];

  function renderDifficulty() {
    difficultyButtons.forEach(btn => btn.classList.toggle('selected', btn.dataset.difficulty === game.difficulty));
    const d=C.difficulties[game.difficulty] || C.difficulties.easy;
    difficultyDescription.textContent = d.description;
    if (difficultySelect) difficultySelect.value = game.difficulty;
  }

  difficultyButtons.forEach(btn => btn.addEventListener('click', () => {
    game.setDifficulty(btn.dataset.difficulty);
    renderDifficulty();
  }));

  document.getElementById('pauseButton').addEventListener('click', () => game.externalAction('pause'));
  document.getElementById('resumeBtn').addEventListener('click', () => game.resume());
  document.getElementById('quitBtn').addEventListener('click', () => game.quitToMenu());
  document.getElementById('replayBtn').addEventListener('click', () => {
    show(null); mobile.classList.remove('hidden'); game.start(game.mode);
  });
  document.getElementById('resultsMenuBtn').addEventListener('click', () => game.quitToMenu());
  document.getElementById('resultsStreamBtn').addEventListener('click', () => openStreamHub());
  document.getElementById('startBossBtn').addEventListener('click', () => {
    show(null);
    mobile.classList.remove('hidden');
    game.startBossMode();
  });

  // Mobile / touch controls.
  const actionMap = {
    flapBtn:'flap', laserBtn:'laser', bombBtn:'bomb', boostBtn:'boost'
  };
  Object.entries(actionMap).forEach(([id, action]) => {
    const el = document.getElementById(id);
    ['pointerdown','touchstart'].forEach(ev => el.addEventListener(ev, e => {
      e.preventDefault(); game.externalAction(action);
    }, { passive:false }));
  });

  const directionMap = {
    bossUpBtn:'up', bossLeftBtn:'left', bossDownBtn:'down', bossRightBtn:'right'
  };
  Object.entries(directionMap).forEach(([id, direction]) => {
    const el = document.getElementById(id);
    const on = e => { e.preventDefault(); game.setBossDirection(direction, true); };
    const off = e => { e.preventDefault(); game.setBossDirection(direction, false); };
    el.addEventListener('pointerdown', on, { passive:false });
    el.addEventListener('pointerup', off, { passive:false });
    el.addEventListener('pointercancel', off, { passive:false });
    el.addEventListener('pointerleave', off, { passive:false });
    el.addEventListener('touchstart', on, { passive:false });
    el.addEventListener('touchend', off, { passive:false });
  });

  // Stream links.
  document.querySelectorAll('[data-stream]').forEach(a => {
    a.addEventListener('click', e => {
      const key = a.dataset.stream;
      const url = C.links[key];
      if (!url) return;
      e.preventDefault();
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  });
  document.querySelectorAll('.streamAnywhere').forEach(btn => btn.addEventListener('click', openStreamHub));
  function openStreamHub() {
    show('streamScreen');
    if (game.state === 'play') game.pause();
  }

  // Garage.
  function renderGarage() {
    const grid = document.getElementById('paletteGrid');
    grid.innerHTML = '';
    C.palettes.forEach(p => {
      const card = document.createElement('button');
      card.className = 'palette-card' + (p.key === game.paletteKey ? ' selected' : '');
      card.innerHTML = `
        <span class="swatches">
          <i style="background:${p.hull}"></i><i style="background:${p.hull2}"></i><i style="background:${p.accent}"></i><i style="background:${p.laser}"></i><i style="background:${p.bomb}"></i>
        </span>
        <b>${p.name}</b>
        <small>${p.lore}</small>
      `;
      card.addEventListener('click', () => {
        game.setPalette(p.key);
        renderGarage();
        document.getElementById('garageLore').textContent = `${p.name} — LASER ${p.laser.toUpperCase()} / NEUROVINE ${p.bomb.toUpperCase()}`;
      });
      grid.appendChild(card);
    });
    document.getElementById('garageLore').textContent = `${game.palette.name} — vehicle, laser, bomb, and engine accents linked.`;
  }

  // Records.
  function renderRecords() {
    const r = game.records;
    document.getElementById('recordScore').textContent = Math.floor(r.bestScore).toLocaleString();
    document.getElementById('recordKills').textContent = r.bestKills;
    document.getElementById('recordChain').textContent = `x${r.bestChain}`;
    document.getElementById('recordTime').textContent = formatTime(r.longest);
    document.getElementById('recordEscapes').textContent = r.escapes;
  }

  // Settings.
  const musicSlider = document.getElementById('musicVolume');
  const engineSlider = document.getElementById('engineVolume');
  const sfxSlider = document.getElementById('sfxVolume');
  const muteToggle = document.getElementById('muteToggle');
  const shakeToggle = document.getElementById('shakeToggle');
  const fxToggle = document.getElementById('fxToggle');
  const lyricsToggle = document.getElementById('lyricsToggle');
  const difficultySelect = document.getElementById('difficultySelect');
  const paletteSelect = document.getElementById('paletteSelect');
  const keybindHint = document.getElementById('keybindHint');
  const keyButtons = {
    laser: document.getElementById('laserKeyBtn'),
    bomb: document.getElementById('bombKeyBtn'),
    boost: document.getElementById('boostKeyBtn')
  };
  let waitingForKey = null;

  Object.entries(C.difficulties).forEach(([key,d]) => {
    const option=document.createElement('option');
    option.value=key; option.textContent=d.label;
    difficultySelect.appendChild(option);
  });

  C.palettes.forEach(p => {
    const option=document.createElement('option');
    option.value=p.key; option.textContent=p.name;
    paletteSelect.appendChild(option);
  });

  function prettyKey(k) {
    if (!k) return '';
    if (k === ' ') return 'SPACE';
    return String(k).toUpperCase();
  }

  function syncSettings() {
    musicSlider.value = audio.musicVolume;
    engineSlider.value = audio.engineVolume;
    sfxSlider.value = audio.sfxVolume;
    muteToggle.checked = audio.muted;
    shakeToggle.checked = game.settings.shake;
    fxToggle.checked = game.settings.reducedFx;
    lyricsToggle.checked = game.settings.lyrics;
    difficultySelect.value = game.difficulty;
    paletteSelect.value = game.paletteKey;
    Object.entries(keyButtons).forEach(([action,btn]) => {
      btn.textContent = prettyKey(game.keybinds[action]);
      btn.classList.toggle('listening', waitingForKey === action);
    });
  }

  [musicSlider,engineSlider,sfxSlider].forEach(el => el.addEventListener('input', () => {
    audio.setVolumes({ music:musicSlider.value, engine:engineSlider.value, sfx:sfxSlider.value });
  }));
  muteToggle.addEventListener('change', () => audio.setMuted(muteToggle.checked));
  shakeToggle.addEventListener('change', () => {
    game.settings.shake = shakeToggle.checked;
    localStorage.setItem('alean_shake', game.settings.shake ? '1' : '0');
  });
  fxToggle.addEventListener('change', () => {
    game.settings.reducedFx = fxToggle.checked;
    localStorage.setItem('alean_reduced_fx', game.settings.reducedFx ? '1' : '0');
  });
  lyricsToggle.addEventListener('change', () => {
    game.settings.lyrics = lyricsToggle.checked;
    localStorage.setItem('alean_lyrics', game.settings.lyrics ? '1' : '0');
  });
  difficultySelect.addEventListener('change', () => {
    game.setDifficulty(difficultySelect.value);
    renderDifficulty();
  });
  paletteSelect.addEventListener('change', () => {
    game.setPalette(paletteSelect.value);
    renderGarage();
  });

  Object.entries(keyButtons).forEach(([action,btn]) => btn.addEventListener('click', () => {
    waitingForKey = action;
    keybindHint.textContent = `Press a key for ${action.toUpperCase()} — ESC cancels. WASD / arrows are reserved for boss flight.`;
    syncSettings();
  }));

  window.addEventListener('keydown', e => {
    if (!waitingForKey) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.key === 'Escape') {
      waitingForKey = null;
      keybindHint.textContent = 'Key change cancelled.';
      syncSettings();
      return;
    }
    const k = e.key === ' ' ? 'Space' : e.key;
    const reserved = ['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','space'];
    if (reserved.includes(String(k).toLowerCase())) {
      keybindHint.textContent = 'That key is reserved for movement / hover. Pick another key.';
      return;
    }
    game.setKeybind(waitingForKey, k);
    keybindHint.textContent = `${waitingForKey.toUpperCase()} mapped to ${prettyKey(k)}.`;
    waitingForKey = null;
    syncSettings();
  }, true);

  window.addEventListener('alean:runstart', () => {
    show(null); mobile.classList.remove('hidden');
    bossPad.classList.add('hidden');
    flapBtn.style.display = '';
  });
  window.addEventListener('alean:bossbrief', e => {
    mobile.classList.add('hidden');
    bossPad.classList.add('hidden');
    const d=e.detail || {};
    const cfg=C.difficulties[d.difficulty] || C.difficulties.easy;
    document.getElementById('bossBriefDifficulty').textContent = `${cfg.label} MOTHERSHIP`;
    document.getElementById('bossLaserKey').textContent = prettyKey(game.keybinds.laser);
    document.getElementById('bossBombKey').textContent = prettyKey(game.keybinds.bomb);
    document.getElementById('bossBoostKey').textContent = prettyKey(game.keybinds.boost);
    show('bossBriefScreen');
  });
  window.addEventListener('alean:bossstart', () => {
    show(null);
    mobile.classList.remove('hidden');
    bossPad.classList.remove('hidden');
    flapBtn.style.display = 'none';
  });
  window.addEventListener('alean:bossend', () => {
    bossPad.classList.add('hidden');
    flapBtn.style.display = '';
  });
  window.addEventListener('alean:paused', () => show('pauseScreen'));
  window.addEventListener('alean:resumed', () => show(null));
  window.addEventListener('alean:introcomplete', () => {
    show('homeScreen');
    renderDifficulty();
  });
  window.addEventListener('alean:difficulty', () => renderDifficulty());
  window.addEventListener('alean:menu', () => {
    mobile.classList.add('hidden');
    bossPad.classList.add('hidden');
    flapBtn.style.display = '';
    show('homeScreen');
    renderDifficulty();
    audio.playMenu();
  });
  window.addEventListener('alean:finished', e => {
    mobile.classList.add('hidden');
    const d=e.detail;
    document.getElementById('resultsTitle').textContent = d.escaped ? 'ALEAN ESCAPED' : 'SYSTEM FAILURE';
    document.getElementById('resultsSubtitle').textContent = d.escaped ? 'TRACK SURVIVED — YOU OUTRAN THE PURSUIT' : 'THE PURSUIT CAUGHT YOU';
    document.getElementById('resultsScore').textContent = d.score.toLocaleString();
    document.getElementById('resultsKills').textContent = d.kills;
    document.getElementById('resultsChain').textContent = `x${d.chain}`;
    document.getElementById('resultsTime').textContent = formatTime(d.time);
    document.getElementById('resultsBest').textContent = Math.floor(d.records.bestScore).toLocaleString();
    show('resultsScreen');
  });

  function formatTime(v) {
    const s=Math.max(0,Math.floor(v||0));
    return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  }

  // Keep browser tab changes from wasting a life.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.state === 'play') game.pause();
  });

  renderGarage();
  renderRecords();
  syncSettings();
  renderDifficulty();
  show(null);
})();
