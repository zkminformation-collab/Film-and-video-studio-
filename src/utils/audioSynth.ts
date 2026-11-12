// Studio Web Audio Synthesizer, Orchestral Score Engine & ADR Speech
class AudioEngine {
  private ctx: AudioContext | null = null;
  private isUnlocked = false;
  private scoreNodes: { oscs: OscillatorNode[]; gain: GainNode } | null = null;
  private scoreInterval: any = null;

  constructor() {
    // Proactively attach user gesture listener to unlock AudioContext
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.unlock();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
      window.addEventListener('click', unlockAudio, { once: true });
      window.addEventListener('keydown', unlockAudio, { once: true });
      window.addEventListener('touchstart', unlockAudio, { once: true });
    }
  }

  public unlock() {
    try {
      const ctx = this.getContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      this.isUnlocked = true;
    } catch (e) {
      // Ignore initial user-gesture constraints
    }
  }

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // 1kHz Studio Clapper Slate Beep (Industry Standard 1000Hz calibration tone)
  playSlateBeep() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Camera mechanical shutter click
  playShutterSound() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Cinematic Trailer Sub-Boom / Impact
  playCinematicImpact() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 1.2);

      gain.gain.setValueAtTime(0.65, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.6);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Sci-Fi Scanner Tone
  playScannerBeep() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Foley Whoosh / Swish
  playWhoosh() {
    try {
      const ctx = this.getContext();
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.15);
      filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + 0.31);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Cinematic Low-Brass Trailer Braam (Inception / Hans Zimmer style)
  playTrailerBraam() {
    try {
      const ctx = this.getContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc3.type = 'triangle';

      const baseFreq = 55; // A1
      osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc2.frequency.setValueAtTime(baseFreq * 1.01, ctx.currentTime);
      osc3.frequency.setValueAtTime(baseFreq * 2, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.25);
      filter.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 2.0);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);

      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc3.start();
      osc1.stop(ctx.currentTime + 2.25);
      osc2.stop(ctx.currentTime + 2.25);
      osc3.stop(ctx.currentTime + 2.25);
    } catch (e) {
      console.warn('Braam play error:', e);
    }
  }

  // 808 Style Cinematic Sub-Bass Drop (80Hz down to 24Hz)
  playSubBassDrop() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(85, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(24, ctx.currentTime + 1.8);

      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 2.1);
    } catch (e) {
      console.warn('Sub bass error:', e);
    }
  }

  // Metallic Heavy Slam / Industrial Hit
  playMetallicSlam() {
    try {
      const ctx = this.getContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(320, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.6);

      osc2.frequency.setValueAtTime(780, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.0);
      osc2.stop(ctx.currentTime + 1.0);
    } catch (e) {
      console.warn('Metallic slam error:', e);
    }
  }

  // Dark Suspense Riser / Tension Swell
  playDarkRiser() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(60, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 2.5);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(150, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 2.5);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.65, ctx.currentTime + 2.3);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 2.65);
    } catch (e) {
      console.warn('Dark riser error:', e);
    }
  }

  // Cybernetic Glitch Stutter
  playGlitchTransition() {
    try {
      const ctx = this.getContext();
      const count = 8;
      for (let i = 0; i < count; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i % 2 === 0 ? 'square' : 'sawtooth';
        osc.frequency.setValueAtTime(200 + Math.random() * 1800, ctx.currentTime + i * 0.035);

        gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.035);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.035 + 0.03);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.035);
        osc.stop(ctx.currentTime + i * 0.035 + 0.035);
      }
    } catch (e) {
      console.warn('Glitch error:', e);
    }
  }

  // Vintage Cassette / Reel-to-Reel Tape Rewind
  playTapeRewind() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 0.4);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.7);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.warn('Tape rewind error:', e);
    }
  }

  // Retro Sci-Fi Blaster / PEW
  playSciFiLaser() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(2400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.22);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } catch (e) {
      console.warn('Laser error:', e);
    }
  }

  // Anatomical Heartbeat Pulse (Double Thump)
  playHeartbeat() {
    try {
      const ctx = this.getContext();
      // First thump (lub)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(75, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.12);
      gain1.gain.setValueAtTime(0.6, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.17);

      // Second thump (dub) 180ms later
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(65, ctx.currentTime + 0.18);
      osc2.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.32);
      gain2.gain.setValueAtTime(0.45, ctx.currentTime + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.36);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.18);
      osc2.stop(ctx.currentTime + 0.37);
    } catch (e) {
      console.warn('Heartbeat error:', e);
    }
  }

  // 33 RPM Vintage Vinyl Record Surface Noise & Scratches
  playVinylCrackle() {
    try {
      const ctx = this.getContext();
      const bufferSize = ctx.sampleRate * 1.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Intermittent pops and low hiss
      for (let i = 0; i < bufferSize; i++) {
        const isPop = Math.random() < 0.003;
        data[i] = isPop ? (Math.random() > 0.5 ? 0.8 : -0.8) : (Math.random() * 0.06 - 0.03);
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start();
      source.stop(ctx.currentTime + 1.55);
    } catch (e) {
      console.warn('Vinyl error:', e);
    }
  }

  // Celestial Orchestral Chime / Stinger
  playOrchestralChime() {
    try {
      const ctx = this.getContext();
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 1.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.06);
        osc.stop(ctx.currentTime + idx * 0.06 + 1.9);
      });
    } catch (e) {
      console.warn('Chime error:', e);
    }
  }

  // Horror Tension Tritone Drone
  playHorrorDrone() {
    try {
      const ctx = this.getContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(110, ctx.currentTime); // A2
      osc2.frequency.setValueAtTime(155.56, ctx.currentTime); // Eb3 (Devil's Tritone)

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 2.6);
      osc2.stop(ctx.currentTime + 2.6);
    } catch (e) {
      console.warn('Horror drone error:', e);
    }
  }

  // Thunderclap Atmospheric Rumble
  playThunderClap() {
    try {
      const ctx = this.getContext();
      const bufferSize = ctx.sampleRate * 2.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 2.0);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.7, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + 2.25);
    } catch (e) {
      console.warn('Thunder error:', e);
    }
  }

  // Custom Procedural Synthesizer for Interactive Sound Designer
  playCustomSynth(config: {
    waveType: OscillatorType;
    frequency: number;
    attack: number;
    decay: number;
    sustain: number;
    release: number;
    filterCutoff?: number;
    filterType?: BiquadFilterType;
  }) {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = config.waveType;
      osc.frequency.setValueAtTime(config.frequency, ctx.currentTime);

      filter.type = config.filterType || 'lowpass';
      filter.frequency.setValueAtTime(config.filterCutoff || 2000, ctx.currentTime);

      const now = ctx.currentTime;
      const a = Math.max(0.01, config.attack);
      const d = Math.max(0.01, config.decay);
      const s = Math.max(0.01, Math.min(1, config.sustain));
      const r = Math.max(0.01, config.release);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.5, now + a);
      gain.gain.exponentialRampToValueAtTime(s * 0.5, now + a + d);
      gain.gain.exponentialRampToValueAtTime(0.001, now + a + d + 0.3 + r);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      const totalDuration = a + d + 0.3 + r + 0.05;
      osc.start(now);
      osc.stop(now + totalDuration);
    } catch (e) {
      console.warn('Custom synth error:', e);
    }
  }

  // Real Real-time Orchestral Score Synthesizer for Timeline Playback
  startScorePlayback(volume: number = 0.5) {
    if (this.scoreNodes) return; // Already playing
    try {
      const ctx = this.getContext();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(Math.min(1, Math.max(0, volume)), ctx.currentTime);
      masterGain.connect(ctx.destination);

      // Low pass warm cinematic filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, ctx.currentTime);
      filter.connect(masterGain);

      // Chord progression: Dm -> F -> C -> Bb (in Hz)
      const chordProgressions = [
        [146.83, 174.61, 220.00, 293.66], // Dm (D3, F3, A3, D4)
        [174.61, 220.00, 261.63, 349.23], // F  (F3, A3, C4, F4)
        [130.81, 164.81, 196.00, 261.63], // C  (C3, E3, G3, C4)
        [116.54, 146.83, 174.61, 233.08], // Bb (Bb2, D3, F3, Bb3)
      ];

      const oscs: OscillatorNode[] = [];
      let chordIndex = 0;

      // Create 4 harmonic oscillators for lush pad
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        osc.type = i === 0 ? 'triangle' : i === 1 ? 'sine' : 'sawtooth';
        osc.frequency.setValueAtTime(chordProgressions[0][i], ctx.currentTime);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.12, ctx.currentTime);

        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();
        oscs.push(osc);
      }

      // Progression timer every 3.5 seconds
      this.scoreInterval = setInterval(() => {
        if (!this.scoreNodes) return;
        chordIndex = (chordIndex + 1) % chordProgressions.length;
        const currentChord = chordProgressions[chordIndex];
        const now = ctx.currentTime;

        oscs.forEach((osc, idx) => {
          osc.frequency.exponentialRampToValueAtTime(currentChord[idx], now + 0.8);
        });

        // Gentle filter sweep
        filter.frequency.exponentialRampToValueAtTime(500 + Math.random() * 350, now + 1.5);
      }, 3500);

      this.scoreNodes = { oscs, gain: masterGain };
    } catch (e) {
      console.warn('Score playback error:', e);
    }
  }

  stopScorePlayback() {
    if (this.scoreInterval) {
      clearInterval(this.scoreInterval);
      this.scoreInterval = null;
    }
    if (this.scoreNodes) {
      try {
        const ctx = this.getContext();
        this.scoreNodes.gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        setTimeout(() => {
          if (this.scoreNodes) {
            this.scoreNodes.oscs.forEach((osc) => {
              try {
                osc.stop();
                osc.disconnect();
              } catch (_) {}
            });
            this.scoreNodes = null;
          }
        }, 160);
      } catch (e) {
        this.scoreNodes = null;
      }
    }
  }

  isScorePlaying(): boolean {
    return this.scoreNodes !== null;
  }

  // Audition specific studio track (Dialogue, Foley, SFX, Score) in AudioStudio
  playTrackAudition(trackType: string, volume: number = 0.8, pan: number = 0) {
    try {
      const ctx = this.getContext();
      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (panner) {
        panner.pan.setValueAtTime(Math.min(1, Math.max(-1, pan / 50)), ctx.currentTime);
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime((volume / 100) * 0.4, ctx.currentTime);

      if (panner) {
        gain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        gain.connect(ctx.destination);
      }

      if (trackType.toLowerCase().includes('score')) {
        // Orchestral sting
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'triangle';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(220, ctx.currentTime); // A3
        osc2.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
        osc1.connect(gain);
        osc2.connect(gain);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 1.3);
        osc2.stop(ctx.currentTime + 1.3);
      } else if (trackType.toLowerCase().includes('dialogue') || trackType.toLowerCase().includes('voice')) {
        // Formant voice harmonic pulse
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        osc.connect(filter);
        filter.connect(gain);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start();
        osc.stop(ctx.currentTime + 0.85);
      } else if (trackType.toLowerCase().includes('foley')) {
        // Impact footsteps / mechanical gear clicks
        this.playShutterSound();
      } else {
        // SFX Sci-fi sweep
        this.playCinematicImpact();
      }
    } catch (e) {
      console.warn('Track audition error:', e);
    }
  }

  // Robust Text-to-Speech synthesizer with speech synthesis + audio carrier tone
  speakDialogue(
    text: string, 
    lang: string = 'en-US', 
    pitch: number = 1.0, 
    rate: number = 1.0, 
    onEnd?: () => void
  ) {
    this.unlock();

    // Play subtle audio carrier chime so the user immediately hears sound
    this.playScannerBeep();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = Math.max(0.5, Math.min(2.0, pitch));
        utterance.rate = Math.max(0.5, Math.min(2.0, rate));

        // Auto-detect language voice
        const isKannada = lang.toLowerCase().includes('kannada') || lang.includes('kn');
        utterance.lang = isKannada ? 'kn-IN' : 'en-US';

        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const matchingVoice = voices.find((v) => 
            isKannada ? v.lang.startsWith('kn') || v.name.includes('Kannada') : v.lang.startsWith('en')
          );
          if (matchingVoice) {
            utterance.voice = matchingVoice;
          }
        }

        utterance.onend = () => {
          if (onEnd) onEnd();
        };

        utterance.onerror = () => {
          if (onEnd) onEnd();
        };

        window.speechSynthesis.speak(utterance);
        return;
      } catch (err) {
        console.warn('SpeechSynthesis error:', err);
      }
    }

    // Fallback: Web Audio melodic vocal simulation
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(240 * pitch, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.3);
      setTimeout(() => {
        if (onEnd) onEnd();
      }, 1300);
    } catch (_) {
      if (onEnd) onEnd();
    }
  }
}

export const soundFx = new AudioEngine();
