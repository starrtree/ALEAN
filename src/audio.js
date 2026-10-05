(function () {
  'use strict';

  class AleanAudio {
    constructor(config) {
      this.config = config;
      this.musicVolume = +(localStorage.getItem('alean_music_volume') || 0.72);
      this.engineVolume = +(localStorage.getItem('alean_engine_volume') || 0.38);
      this.sfxVolume = +(localStorage.getItem('alean_sfx_volume') || 0.74);
      this.muted = localStorage.getItem('alean_muted') === '1';
      this.unlocked = false;
      this.onTrackEnded = null;
      this.onEngineIntroEnded = null;
      this._makeElements();
    }

    _makeElements() {
      const A = this.config.audio;
      this.menu = new Audio(A.menu);
      this.song = new Audio(A.song);
      this.engineIntro = new Audio(A.engineIntro);
      this.engineLoop = new Audio(A.engineLoop);
      this.laser = new Audio(A.laser);
      this.bomb = new Audio(A.bomb);

      this.menu.loop = true;
      this.engineLoop.loop = true;
      this.song.preload = this.menu.preload = 'auto';
      this.engineIntro.preload = this.engineLoop.preload = 'auto';
      this.laser.preload = this.bomb.preload = 'auto';

      this.song.addEventListener('ended', () => {
        if (typeof this.onTrackEnded === 'function') this.onTrackEnded();
      });
      this.engineIntro.addEventListener('ended', () => {
        this.engineLoop.currentTime = 0;
        this._safePlay(this.engineLoop);
        if (typeof this.onEngineIntroEnded === 'function') this.onEngineIntroEnded();
      });
      this._applyVolumes();
    }

    _safePlay(el) {
      if (this.muted) return Promise.resolve();
      const p = el.play();
      if (p && typeof p.catch === 'function') return p.catch(() => {});
      return Promise.resolve();
    }

    async unlock() {
      this.unlocked = true;
      try {
        this.menu.volume = 0;
        await this.menu.play();
        this.menu.pause();
        this.menu.currentTime = 0;
      } catch (_) {}
      this._applyVolumes();
    }

    _applyVolumes() {
      const mute = this.muted ? 0 : 1;
      this.menu.volume = this.musicVolume * 0.82 * mute;
      this.song.volume = this.musicVolume * mute;
      this.engineIntro.volume = this.engineVolume * mute;
      this.engineLoop.volume = this.engineVolume * mute;
      this.laser.volume = this.sfxVolume * mute;
      this.bomb.volume = this.sfxVolume * mute;
    }

    setVolumes({ music, engine, sfx }) {
      if (music != null) this.musicVolume = +music;
      if (engine != null) this.engineVolume = +engine;
      if (sfx != null) this.sfxVolume = +sfx;
      localStorage.setItem('alean_music_volume', this.musicVolume);
      localStorage.setItem('alean_engine_volume', this.engineVolume);
      localStorage.setItem('alean_sfx_volume', this.sfxVolume);
      this._applyVolumes();
    }

    setMuted(v) {
      this.muted = !!v;
      localStorage.setItem('alean_muted', this.muted ? '1' : '0');
      this._applyVolumes();
      if (!this.muted && this.unlocked && this.menu.paused && this.song.paused) this.playMenu();
    }

    stopAll() {
      [this.menu, this.song, this.engineIntro, this.engineLoop].forEach(a => {
        a.pause();
        try { a.currentTime = 0; } catch (_) {}
      });
    }

    playMenu() {
      this.song.pause();
      this.engineIntro.pause();
      this.engineLoop.pause();
      try { this.menu.currentTime = this.menu.currentTime || 0; } catch (_) {}
      if (this.unlocked) this._safePlay(this.menu);
    }

    startRun({ endless = false } = {}) {
      this.menu.pause();
      this.song.pause();
      this.engineIntro.pause();
      this.engineLoop.pause();
      this.song.loop = !!endless;
      this.song.currentTime = 0;
      this.engineIntro.currentTime = 0;
      this.engineLoop.currentTime = 0;
      this._applyVolumes();
      this._safePlay(this.song);
      this._safePlay(this.engineIntro);
    }

    pauseRun() {
      [this.song, this.engineIntro, this.engineLoop].forEach(a => a.pause());
    }

    resumeRun() {
      if (!this.song.ended) this._safePlay(this.song);
      if (!this.engineIntro.ended && this.engineIntro.currentTime > 0) this._safePlay(this.engineIntro);
      else this._safePlay(this.engineLoop);
    }

    stopRun({ returnToMenu = false } = {}) {
      [this.song, this.engineIntro, this.engineLoop].forEach(a => {
        a.pause();
        try { a.currentTime = 0; } catch (_) {}
      });
      if (returnToMenu) this.playMenu();
    }

    playLaser() { this._playOneShot(this.laser, this.sfxVolume); }
    playBomb() { this._playOneShot(this.bomb, this.sfxVolume * 0.9); }

    _playOneShot(base, volume) {
      if (this.muted) return;
      const a = base.cloneNode();
      a.volume = Math.max(0, Math.min(1, volume));
      a.play().catch(() => {});
    }

    get progress() {
      if (!this.song.duration || !isFinite(this.song.duration)) return 0;
      return Math.max(0, Math.min(1, this.song.currentTime / this.song.duration));
    }
  }

  window.AleanAudio = AleanAudio;
})();
