export class Synth {
  private context?: AudioContext;
  private master?: GainNode;
  private muted = false;

  unlock(): void {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.12;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') void this.context.resume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.12;
  }

  tone(frequency: number, duration = 0.08, type: OscillatorType = 'square', volume = 0.35, bend = 0): void {
    if (this.muted || !this.context || !this.master) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (bend) oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, frequency + bend), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  burst(): void {
    this.tone(180, 0.18, 'sawtooth', 0.55, -110);
    window.setTimeout(() => this.tone(70, 0.22, 'square', 0.35, -25), 35);
  }
}
