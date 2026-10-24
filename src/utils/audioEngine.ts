import { EqualizerBands, ProceduralSoundType } from '../types/music';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private audioSourceNode: MediaElementAudioSourceNode | null = null;

  // Equalizer filters
  private filterSubBass: BiquadFilterNode | null = null;
  private filterBass: BiquadFilterNode | null = null;
  private filterMids: BiquadFilterNode | null = null;
  private filterUpperMids: BiquadFilterNode | null = null;
  private filterTreble: BiquadFilterNode | null = null;

  // Procedural Synth scheduler
  private synthIntervalId: number | null = null;
  private isSynthesizing = false;
  private synthStep = 0;
  private currentProceduralType: ProceduralSoundType = 'synthwave';

  private onPlaybackEndCallback: (() => void) | null = null;

  private initContext() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    // Create 5-band Equalizer
    this.filterSubBass = this.ctx.createBiquadFilter();
    this.filterSubBass.type = 'lowshelf';
    this.filterSubBass.frequency.value = 60;

    this.filterBass = this.ctx.createBiquadFilter();
    this.filterBass.type = 'peaking';
    this.filterBass.frequency.value = 250;
    this.filterBass.Q.value = 1;

    this.filterMids = this.ctx.createBiquadFilter();
    this.filterMids.type = 'peaking';
    this.filterMids.frequency.value = 1000;
    this.filterMids.Q.value = 1;

    this.filterUpperMids = this.ctx.createBiquadFilter();
    this.filterUpperMids.type = 'peaking';
    this.filterUpperMids.frequency.value = 4000;
    this.filterUpperMids.Q.value = 1;

    this.filterTreble = this.ctx.createBiquadFilter();
    this.filterTreble.type = 'highshelf';
    this.filterTreble.frequency.value = 12000;

    // Chain: Filters -> MasterGain -> Analyser -> Destination
    this.filterSubBass.connect(this.filterBass);
    this.filterBass.connect(this.filterMids);
    this.filterMids.connect(this.filterUpperMids);
    this.filterUpperMids.connect(this.filterTreble);
    this.filterTreble.connect(this.masterGain);

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Prepare HTML Audio Element for file playback
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';

    try {
      this.audioSourceNode = this.ctx.createMediaElementSource(this.audioElement);
      this.audioSourceNode.connect(this.filterSubBass);
    } catch {
      // Audio element fallback
    }

    this.audioElement.addEventListener('ended', () => {
      if (this.onPlaybackEndCallback) {
        this.onPlaybackEndCallback();
      }
    });
  }

  public async resume(): Promise<void> {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public setOnEnded(callback: () => void) {
    this.onPlaybackEndCallback = callback;
  }

  public setVolume(volume: number, isMuted = false) {
    this.initContext();
    if (!this.masterGain || !this.ctx) return;
    const target = isMuted ? 0 : Math.max(0, Math.min(1, volume));
    this.masterGain.gain.setValueAtTime(target, this.ctx.currentTime);
  }

  public setEqualizer(bands: EqualizerBands) {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.filterSubBass) this.filterSubBass.gain.setValueAtTime(bands.subBass, now);
    if (this.filterBass) this.filterBass.gain.setValueAtTime(bands.bass, now);
    if (this.filterMids) this.filterMids.gain.setValueAtTime(bands.mids, now);
    if (this.filterUpperMids) this.filterUpperMids.gain.setValueAtTime(bands.upperMids, now);
    if (this.filterTreble) this.filterTreble.gain.setValueAtTime(bands.treble, now);
  }

  public getVisualizerData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(64).fill(0);
    }
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  public getWaveformData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(128).fill(128);
    }
    const data = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(data);
    return data;
  }

  // --- Real Audio File Playback ---
  public playAudioUrl(url: string, startTime = 0) {
    this.stopProcedural();
    this.resume();

    if (!this.audioElement) return;
    if (this.audioElement.src !== url) {
      this.audioElement.src = url;
    }
    this.audioElement.currentTime = startTime;
    this.audioElement.play().catch(() => {});
  }

  public pauseAudioUrl() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  public seekAudioUrl(seconds: number) {
    if (this.audioElement) {
      this.audioElement.currentTime = seconds;
    }
  }

  public getAudioCurrentTime(): number {
    return this.audioElement ? this.audioElement.currentTime : 0;
  }

  public getAudioDuration(): number {
    return this.audioElement && !isNaN(this.audioElement.duration) ? this.audioElement.duration : 0;
  }

  // --- Procedural Web Audio Synthesizer ---
  public playProcedural(type: ProceduralSoundType) {
    this.pauseAudioUrl();
    this.resume();
    this.currentProceduralType = type;

    if (this.isSynthesizing) return;
    this.isSynthesizing = true;
    this.synthStep = 0;

    const intervalMs = type === 'ambient' ? 600 : type === 'lofi' ? 360 : 250;

    this.synthIntervalId = window.setInterval(() => {
      this.triggerSynthBeat();
    }, intervalMs);
    this.triggerSynthBeat();
  }

  public pauseProcedural() {
    this.stopProcedural();
  }

  private stopProcedural() {
    this.isSynthesizing = false;
    if (this.synthIntervalId !== null) {
      clearInterval(this.synthIntervalId);
      this.synthIntervalId = null;
    }
  }

  private triggerSynthBeat() {
    if (!this.ctx || !this.filterSubBass || !this.isSynthesizing) return;
    const t = this.ctx.currentTime;
    const step = this.synthStep % 16;
    this.synthStep++;

    const destination = this.filterSubBass;

    if (this.currentProceduralType === 'synthwave') {
      // Bassline arp in D minor: D2, F2, A2, C3
      const notes = [73.42, 87.31, 110.0, 130.81, 73.42, 87.31, 146.83, 110.0];
      const freq = notes[step % notes.length];
      this.playSynthPluck(freq, 'sawtooth', 0.22, 0.2, destination, t);

      // Snare on 4 and 12
      if (step === 4 || step === 12) {
        this.playNoiseSnare(0.18, destination, t);
      }
      // Kick on 0, 8, 10
      if (step === 0 || step === 8 || step === 10) {
        this.playSubKick(0.25, destination, t);
      }
      // Hi-hat
      if (step % 2 === 0) {
        this.playHiHat(0.04, destination, t);
      }
    } else if (this.currentProceduralType === 'lofi') {
      // Warm Rhodes / Lofi 7th Chords (Fmaj7 - Em7 - Dm7 - Cmaj7)
      const chordSets = [
        [174.61, 220.0, 261.63, 329.63], // Fmaj7
        [164.81, 196.0, 246.94, 293.66], // Em7
        [146.83, 174.61, 220.0, 261.63], // Dm7
        [130.81, 164.81, 196.0, 246.94], // Cmaj7
      ];
      if (step % 4 === 0) {
        const chordIndex = Math.floor(step / 4) % chordSets.length;
        chordSets[chordIndex].forEach((freq) => {
          this.playSynthPluck(freq, 'sine', 0.8, 0.1, destination, t);
        });
      }
      // Soft Lofi kick and rimshot
      if (step === 0 || step === 10) {
        this.playSubKick(0.18, destination, t);
      }
      if (step === 4 || step === 12) {
        this.playHiHat(0.06, destination, t);
      }
    } else if (this.currentProceduralType === 'ambient') {
      // Drifting lush harmonic pad
      const ambientPitches = [110, 164.81, 220, 277.18, 329.63, 440];
      const pitch = ambientPitches[step % ambientPitches.length];
      this.playSynthPluck(pitch, 'triangle', 1.8, 0.12, destination, t);
    } else if (this.currentProceduralType === 'bass') {
      // Heavy sub-bass groove
      const bassNotes = [55, 55, 65.41, 73.42, 48.99, 55, 82.41, 73.42];
      const freq = bassNotes[step % bassNotes.length];
      this.playSynthPluck(freq, 'triangle', 0.35, 0.3, destination, t);
      if (step % 4 === 0) {
        this.playSubKick(0.3, destination, t);
      }
      if (step % 2 === 1) {
        this.playHiHat(0.03, destination, t);
      }
    } else {
      // Cyber electronic
      const cyberNotes = [130.81, 155.56, 174.61, 196.0, 233.08, 261.63];
      const freq = cyberNotes[(step * 2) % cyberNotes.length];
      this.playSynthPluck(freq, 'square', 0.15, 0.15, destination, t);
      if (step % 4 === 0) {
        this.playSubKick(0.24, destination, t);
      }
      this.playHiHat(0.03, destination, t);
    }
  }

  private playSynthPluck(freq: number, type: OscillatorType, duration: number, gainVol: number, dest: AudioNode, t: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(gainVol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + duration);
  }

  private playSubKick(gainVol: number, dest: AudioNode, t: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.2);

    gain.gain.setValueAtTime(gainVol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  private playHiHat(gainVol: number, dest: AudioNode, t: number) {
    if (!this.ctx) return;
    // High-pass filtered noise
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    whiteNoise.start(t);
  }

  private playNoiseSnare(gainVol: number, dest: AudioNode, t: number) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(t);
  }
}

export const audioEngine = new AudioEngine();
