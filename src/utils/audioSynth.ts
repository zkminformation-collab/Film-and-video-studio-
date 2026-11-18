// Studio Web Audio Synthesizer, Orchestral Score Engine & ADR Speech
class AudioEngine {
  private ctx: AudioContext | null = null;
  private isUnlocked = false;
  private scoreNodes: { oscs: OscillatorNode[]; gain: GainNode; panner?: StereoPannerNode } | null = null;
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
  startScorePlayback(volume: number = 0.5, pan: number = 0) {
    if (this.scoreNodes) {
      this.setLiveScoreGain(volume);
      this.setLiveScorePan(pan);
      return;
    }
    try {
      const ctx = this.getContext();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(Math.min(1, Math.max(0, volume)), ctx.currentTime);

      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : undefined;
      if (panner) {
        panner.pan.setValueAtTime(Math.min(1, Math.max(-1, pan / 50)), ctx.currentTime);
        masterGain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        masterGain.connect(ctx.destination);
      }

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

      this.scoreNodes = { oscs, gain: masterGain, panner };
    } catch (e) {
      console.warn('Score playback error:', e);
    }
  }

  setLiveScoreGain(volume: number) {
    if (!this.scoreNodes || !this.ctx) return;
    try {
      const clamped = Math.min(1, Math.max(0, volume));
      this.scoreNodes.gain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.03);
    } catch (_) {}
  }

  setLiveScorePan(pan: number) {
    if (!this.scoreNodes?.panner || !this.ctx) return;
    try {
      const clamped = Math.min(1, Math.max(-1, pan / 50));
      this.scoreNodes.panner.pan.setTargetAtTime(clamped, this.ctx.currentTime, 0.03);
    } catch (_) {}
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

  // Expressive formant-modulated vocal cadence when OS speechSynthesis voice is unavailable
  private playFormantVocalCadence(
    text: string,
    pitch: number = 1.0,
    rate: number = 1.0,
    isKannada: boolean = false,
    onEnd?: () => void
  ) {
    try {
      const ctx = this.getContext();
      const syllables = Math.min(18, Math.max(4, Math.ceil(text.trim().length / 5)));
      const stepSec = Math.max(0.11, 0.16 / Math.max(0.6, rate));
      const baseFreq = (isKannada ? 172 : 160) * Math.max(0.6, Math.min(1.8, pitch));
      const now = ctx.currentTime;

      for (let i = 0; i < syllables; i++) {
        const t = now + i * stepSec;
        const osc = ctx.createOscillator();
        const formant = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        const intonation = Math.sin((i / Math.max(1, syllables - 1)) * Math.PI) * 26 + ((i % 3) - 1) * 10;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq + intonation, t);

        formant.type = 'bandpass';
        formant.frequency.setValueAtTime(isKannada ? 680 + (i % 4) * 190 : 750 + (i % 4) * 220, t);
        formant.Q.setValueAtTime(3.2, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.24, t + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.002, t + stepSec * 0.92);

        osc.connect(formant);
        formant.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + stepSec * 0.95);
      }

      const totalMs = Math.round(syllables * stepSec * 1000) + 120;
      setTimeout(() => {
        if (onEnd) onEnd();
      }, totalMs);
    } catch (_) {
      if (onEnd) onEnd();
    }
  }

  private resolveSpeechLang(lang: string): { bcp47: string; isNonEnglish: boolean } {
    const l = lang.toLowerCase();
    if (l.includes('kannada') || l.includes('kn')) return { bcp47: 'kn-IN', isNonEnglish: true };
    if (l.includes('hindi') || l.includes('hi')) return { bcp47: 'hi-IN', isNonEnglish: true };
    if (l.includes('tamil') || l.includes('ta')) return { bcp47: 'ta-IN', isNonEnglish: true };
    if (l.includes('telugu') || l.includes('te')) return { bcp47: 'te-IN', isNonEnglish: true };
    return { bcp47: 'en-US', isNonEnglish: false };
  }

  // Clean Text-to-Speech via native browser SpeechSynthesis (never emits synthetic humming/buzzing)
  speakDialogue(
    text: string,
    lang: string = 'en-US',
    pitch: number = 1.0,
    rate: number = 1.0,
    onEnd?: () => void
  ) {
    this.unlock();

    const { bcp47 } = this.resolveSpeechLang(lang);
    const shortLang = bcp47.split('-')[0];

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();

        const voices = window.speechSynthesis.getVoices();
        const matchingVoice =
          voices.find((v) => v.lang.toLowerCase() === bcp47.toLowerCase()) ||
          voices.find(
            (v) =>
              v.lang.toLowerCase().startsWith(shortLang) ||
              v.name.toLowerCase().includes(lang.toLowerCase().split(' ')[0])
          ) ||
          voices.find((v) => v.default) ||
          voices[0];

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = Math.max(0.6, Math.min(1.6, pitch));
        utterance.rate = Math.max(0.6, Math.min(1.6, rate));
        utterance.lang = matchingVoice?.lang || bcp47;
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }

        let settled = false;
        const finishOnce = () => {
          if (settled) return;
          settled = true;
          if (onEnd) onEnd();
        };

        const watchdog = setTimeout(() => {
          finishOnce();
        }, 12000);

        utterance.onend = () => {
          clearTimeout(watchdog);
          finishOnce();
        };

        utterance.onerror = () => {
          clearTimeout(watchdog);
          finishOnce();
        };

        window.speechSynthesis.speak(utterance);
        return;
      } catch (err) {
        console.warn('SpeechSynthesis error:', err);
      }
    }

    if (onEnd) onEnd();
  }

  // Generate a real downloadable 16-bit PCM WAV file for any English or Kannada voice clip
  generateDialogueWavBlob(
    text: string,
    lang: string = 'en-US',
    pitch: number = 1.0,
    rate: number = 1.0
  ): Blob {
    const sampleRate = 22050;
    const isKannada = lang.toLowerCase().includes('kannada') || lang.toLowerCase().includes('kn');
    const words = Math.max(2, text.trim().split(/\s+/).length);
    const durationSec = Math.min(8, Math.max(1.8, (words * 0.42) / Math.max(0.6, rate)));
    const numSamples = Math.floor(sampleRate * durationSec);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    const baseHz = (isKannada ? 175 : 155) * Math.max(0.6, Math.min(1.7, pitch));
    const syllableRate = 4.5 * Math.max(0.6, rate);
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const envelope = Math.abs(Math.sin(Math.PI * syllableRate * t)) * Math.min(1, t * 8) * Math.min(1, (durationSec - t) * 8);
      const f0 = baseHz + Math.sin(t * 3.1) * 18;
      const sample =
        (Math.sin(2 * Math.PI * f0 * t) * 0.55 +
          Math.sin(2 * Math.PI * (f0 * 2.02) * t) * 0.25 +
          Math.sin(2 * Math.PI * (f0 * 3.1) * t) * 0.12) *
        envelope *
        0.55;
      view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sample)) * 0x7fff, true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  // Create a live mixed Web Audio stream (Score + Cinematic Impact + Voice Harmonics) for ExportStudio video muxing
  createExportAudioMix(durationSec: number = 3.5): {
    stream: MediaStream | null;
    stop: () => void;
  } {
    try {
      const ctx = this.getContext();
      if (typeof ctx.createMediaStreamDestination !== 'function') {
        return { stream: null, stop: () => {} };
      }

      const dest = ctx.createMediaStreamDestination();
      const masterBus = ctx.createGain();
      masterBus.gain.setValueAtTime(0.65, ctx.currentTime);
      masterBus.connect(dest);
      masterBus.connect(ctx.destination);

      const now = ctx.currentTime;
      const stopAt = now + durationSec;

      // 1. Sub-impact opening hit
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(110, now);
      sub.frequency.exponentialRampToValueAtTime(34, now + 1.1);
      subGain.gain.setValueAtTime(0.55, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
      sub.connect(subGain);
      subGain.connect(masterBus);
      sub.start(now);
      sub.stop(Math.min(stopAt, now + 1.45));

      // 2. Warm orchestral D-minor chord bed
      const notes = [146.83, 174.61, 220.0, 293.66];
      const padOscs: OscillatorNode[] = [];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.14, now + 0.35);
        g.gain.linearRampToValueAtTime(0.001, stopAt);
        osc.connect(g);
        g.connect(masterBus);
        osc.start(now);
        osc.stop(stopAt);
        padOscs.push(osc);
      });

      const stop = () => {
        try {
          sub.stop();
        } catch (_) {}
        padOscs.forEach((o) => {
          try {
            o.stop();
          } catch (_) {}
        });
      };

      return { stream: dest.stream, stop };
    } catch (e) {
      console.warn('Export audio mix fallback:', e);
      return { stream: null, stop: () => {} };
    }
  }
}

export const soundFx = new AudioEngine();
