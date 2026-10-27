/**
 * Web Audio API Sound Synthesizer for Tetris
 * High-performance, zero external assets, instant responsive sound effects.
 */

class SoundController {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.35;
    
    // Load mute preference from storage
    try {
      const savedMute = localStorage.getItem('tetris_muted');
      if (savedMute !== null) {
        this.muted = savedMute === 'true';
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem('tetris_muted', String(this.muted));
    } catch {
      // Ignore
    }
    return this.muted;
  }

  setMute(state) {
    this.muted = Boolean(state);
    try {
      localStorage.setItem('tetris_muted', String(this.muted));
    } catch {
      // Ignore
    }
  }

  playTone(freq, type = 'sine', duration = 0.08, gainVal = 0.3, pitchDrop = 0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (pitchDrop !== 0) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + pitchDrop), now + duration);
      }

      const peakGain = gainVal * this.volume;
      gain.gain.setValueAtTime(peakGain, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignore audio synthesis errors
    }
  }

  playMove() {
    this.playTone(220, 'triangle', 0.04, 0.15);
  }

  playRotate() {
    this.playTone(380, 'square', 0.06, 0.18, 80);
  }

  playSoftDrop() {
    this.playTone(180, 'sine', 0.03, 0.12);
  }

  playHardDrop() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Low punchy bass impact
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

      gain.gain.setValueAtTime(0.4 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Ignore
    }
  }

  playHold() {
    this.playTone(440, 'triangle', 0.08, 0.25, 120);
  }

  playLineClear(lines = 1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    if (lines === 4) {
      // Tetris clear arpeggio fanfare!
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'triangle', 0.22, 0.35);
        }, idx * 60);
      });
    } else {
      // Standard 1-3 lines chord
      const chords = {
        1: [440, 554.37],
        2: [440, 659.25],
        3: [523.25, 659.25, 783.99]
      };
      const freqs = chords[lines] || chords[1];
      freqs.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'triangle', 0.16, 0.25);
        }, idx * 35);
      });
    }
  }

  playCombo(combo) {
    if (this.muted || combo <= 0) return;
    const baseFreq = 300 + Math.min(combo * 60, 600);
    this.playTone(baseFreq, 'sine', 0.1, 0.25, 50);
  }

  playLevelUp() {
    if (this.muted) return;
    const notes = [392, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.2, 0.3);
      }, idx * 70);
    });
  }

  playGameOver() {
    if (this.muted) return;
    const notes = [440, 392, 349.23, 311.13, 261.63];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sawtooth', 0.25, 0.2, -40);
      }, idx * 110);
    });
  }
}

export const sound = new SoundController();
