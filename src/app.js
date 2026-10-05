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

  function show(id) {
    screens.forEach(s => s.classList.toggle('active', s.id === id));
    overlay.classList.toggle('hidden', !id);
  }

  async function unlockAndMenu() {
    if (!audio.unlocked) await audio.unlock();
    audio.playMenu();
    soundGate.classList.add('hidden');
  }

  document.addEventListener('pointerdown', unlockAndMenu, { once:true });
  document.addEventListener('keydown', unlockAndMenu, { once:true });

  // Autoplay attempt. Browsers may reject; the sound gate remains visible until interaction.
  audio.unlock().then(() => audio.playMenu()).catch(() => {});

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

  document.getElementById('pauseButton').addEventListener('click', () => game.externalAction('pause'));
  document.getElementById('resumeBtn').addEventListener('click', () => game.resume());
  document.getElementById('quitBtn').addEventListener('click', () => game.quitToMenu());
  document.getElementById('replayBtn').addEventListener('click', () => {
    show(null); mobile.classList.remove('hidden'); game.start(game.mode);
  });
  document.getElementById('resultsMenuBtn').addEventListener('click', () => game.quitToMenu());
  document.getElementById('resultsStreamBtn').addEventListener('click', () => openStreamHub());

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

  function syncSettings() {
    musicSlider.value = audio.musicVolume;
    engineSlider.value = audio.engineVolume;
    sfxSlider.value = audio.sfxVolume;
    muteToggle.checked = audio.muted;
    shakeToggle.checked = game.settings.shake;
    fxToggle.checked = game.settings.reducedFx;
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

  window.addEventListener('alean:runstart', () => {
    show(null); mobile.classList.remove('hidden');
  });
  window.addEventListener('alean:paused', () => show('pauseScreen'));
  window.addEventListener('alean:resumed', () => show(null));
  window.addEventListener('alean:menu', () => {
    mobile.classList.add('hidden');
    show('homeScreen');
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
  show('homeScreen');
})();
