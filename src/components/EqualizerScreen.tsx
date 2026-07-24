import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Sliders, Play, Volume2 } from 'lucide-react';
import { PlayerState, Track } from '../types';

interface EqualizerScreenProps {
  state: PlayerState;
  currentTrack: Track;
  analyserNode: AnalyserNode | null;
}

type VisualizerStyle = 'bars' | 'wave' | 'radial';
type EqPreset = 'Flat' | 'Bass Boost' | 'Electronic' | 'Acoustic' | 'Vocal';

export function EqualizerScreen({ state, currentTrack, analyserNode }: EqualizerScreenProps) {
  const { isPlaying, volume } = state;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [style, setStyle] = useState<VisualizerStyle>('bars');
  const [preset, setPreset] = useState<EqPreset>('Bass Boost');

  // Animation frame reference
  const animationRef = useRef<number | null>(null);

  // Equalizer presets scaling factors for visualizer
  const getPresetMultiplier = (freqIndex: number, totalBands: number) => {
    switch (preset) {
      case 'Bass Boost':
        // Boost low frequencies (left side)
        return freqIndex < totalBands * 0.25 ? 1.6 : 0.8;
      case 'Electronic':
        // Boost low and high, scoop mid
        if (freqIndex < totalBands * 0.2 || freqIndex > totalBands * 0.8) return 1.4;
        return 0.7;
      case 'Acoustic':
        // Smooth mid boost
        const midPoint = totalBands / 2;
        const distFromMid = Math.abs(freqIndex - midPoint) / midPoint;
        return 1.4 - distFromMid * 0.8;
      case 'Vocal':
        // Boost high-mids
        if (freqIndex > totalBands * 0.4 && freqIndex < totalBands * 0.7) return 1.5;
        return 0.6;
      case 'Flat':
      default:
        return 1.0;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Simulate 40 frequency bands
    const bandCount = style === 'bars' ? 32 : 64;
    const frequencies = new Array(bandCount).fill(0);
    const targetFrequencies = new Array(bandCount).fill(0);
    
    // Wave variables
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth interpolation values
      const smoothFactor = 0.15;

      // Update frequency bands
      let dataArray: Uint8Array | null = null;
      let bufferLength = 0;
      if (analyserNode && isPlaying) {
        bufferLength = analyserNode.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteFrequencyData(dataArray);
      }

      for (let i = 0; i < bandCount; i++) {
        if (dataArray) {
          // Map to LOWER 80% of frequency spectrum where actual audible music resides (avoiding high-freq static)
          const percent = i / bandCount;
          const dataIndex = Math.floor(percent * bufferLength * 0.85);
          const rawValue = dataArray[dataIndex] || 0;

          const amplitudeMultiplier = getPresetMultiplier(i, bandCount);
          // Scale from [0, 255] to canvas height
          let targetVal = (rawValue / 255) * height * 0.85 * volume * amplitudeMultiplier;
          targetVal = Math.max(4, targetVal); // Keep small active baseline
          targetFrequencies[i] = targetVal;
        } else if (isPlaying) {
          // Generate realistic floating noise based on time, index, and volume
          const noiseFreq = 0.05 + (i * 0.02);
          const time = Date.now() * 0.005;
          const amplitudeMultiplier = getPresetMultiplier(i, bandCount);
          
          // Realistic audio wave simulation with octave noise
          const baseNoise = Math.sin(time * 0.8 + i * 0.3) * 0.3 + 0.4;
          const details = Math.sin(time * 2.3 + i * 0.9) * 0.15;
          const bassPunch = i < bandCount * 0.2 && Math.sin(time * 4) > 0.8 ? 0.3 : 0;

          let targetVal = (baseNoise + details + bassPunch) * height * 0.65 * volume * amplitudeMultiplier;
          targetVal = Math.max(4, targetVal); // Keep a small active baseline
          targetFrequencies[i] = targetVal;
        } else {
          // Flatten when paused
          targetFrequencies[i] = 4 + Math.sin(Date.now() * 0.001 + i * 0.5) * 2;
        }

        // Lerp to target
        frequencies[i] += (targetFrequencies[i] - frequencies[i]) * smoothFactor;
      }

      phase += isPlaying ? 0.08 : 0.02;

      // Render Styles
      if (style === 'bars') {
        const barWidth = width / bandCount;
        const gap = 2.5;

        for (let i = 0; i < bandCount; i++) {
          const barHeight = frequencies[i];
          const x = i * barWidth;
          const y = height - barHeight - 10;

          // Multi-stop neon gradient: Purple -> Pink -> Cyan
          const gradient = ctx.createLinearGradient(x, height, x, y);
          gradient.addColorStop(0, 'rgba(168, 85, 247, 0.2)'); // Violet/Purple
          gradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.85)'); // Hot Pink
          gradient.addColorStop(1, 'rgba(0, 229, 255, 1)'); // Electric Cyan

          ctx.fillStyle = gradient;
          
          // Draw rounded bar top manually to be ultra premium
          ctx.beginPath();
          const r = Math.min(barWidth / 2 - gap / 2, 4);
          const w = barWidth - gap;
          ctx.roundRect(x + gap / 2, y, w, barHeight, [r, r, 0, 0]);
          ctx.fill();

          // Mirror top dots
          if (isPlaying && i % 2 === 0) {
            ctx.fillStyle = 'rgba(0, 229, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(x + barWidth / 2, y - 6, 1.5, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      } else if (style === 'wave') {
        // High-fidelity smooth sine oscilloscopes (multiple overlapping transparent curves)
        const layers = 3;
        for (let l = 0; l < layers; l++) {
          ctx.beginPath();
          ctx.lineWidth = l === 0 ? 3.5 : 1.5;
          
          // Shift opacity and colors for each layer
          if (l === 0) ctx.strokeStyle = 'rgba(0, 229, 255, 0.95)'; // Cyan
          else if (l === 1) ctx.strokeStyle = 'rgba(236, 72, 153, 0.6)'; // Pink
          else ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)'; // Purple

          const speedMultiplier = (l + 1) * 0.4;
          const amplitudeFactor = (3 - l) * 0.35;

          ctx.moveTo(0, height / 2);

          for (let x = 0; x < width; x += 5) {
            // Sample frequency visual state to deform the wave dynamically where the beat is active
            const freqIndex = Math.floor((x / width) * bandCount);
            const freqVal = frequencies[freqIndex] || 10;
            
            const sinY = Math.sin(x * 0.015 - phase * speedMultiplier) * freqVal * amplitudeFactor;
            const cosY = Math.cos(x * 0.008 + phase * speedMultiplier * 0.5) * 15;
            
            ctx.lineTo(x, height / 2 + sinY + cosY);
          }

          ctx.stroke();
        }

        // Render ambient floating nodes
        if (isPlaying) {
          ctx.fillStyle = 'rgba(236, 72, 153, 0.2)';
          for (let i = 0; i < 5; i++) {
            const nodeX = (width / 6) * (i + 1) + Math.sin(phase + i) * 15;
            const nodeY = height / 2 + Math.cos(phase * 1.2 + i) * 40;
            ctx.beginPath();
            ctx.arc(nodeX, nodeY, 4 + i, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      } else if (style === 'radial') {
        // Radial pulsating ring visualizer
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = 65;

        // Draw multiple rings representing frequencies
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Pulsating glowing core
        const pulseAmt = isPlaying ? frequencies[4] * 0.2 : 5;
        const radialGradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, baseRadius + pulseAmt);
        radialGradient.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
        radialGradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.1)');
        radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = radialGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius + pulseAmt, 0, 2 * Math.PI);
        ctx.fill();

        // Draw radial spikes
        const spikes = 60;
        for (let i = 0; i < spikes; i++) {
          const angle = (i / spikes) * Math.PI * 2 + phase * 0.15;
          const freqIndex = Math.floor((i / spikes) * bandCount);
          const val = frequencies[freqIndex] * 0.65;

          const startX = centerX + Math.cos(angle) * baseRadius;
          const startY = centerY + Math.sin(angle) * baseRadius;
          const endX = centerX + Math.cos(angle) * (baseRadius + val);
          const endY = centerY + Math.sin(angle) * (baseRadius + val);

          const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
          gradient.addColorStop(0, 'rgba(236, 72, 153, 0.6)');
          gradient.addColorStop(1, 'rgba(0, 229, 255, 1)');

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [style, preset, isPlaying, volume, analyserNode]);

  return (
    <div id="equalizer-screen" className="flex flex-col h-full text-white px-5 pt-6 pb-40">
      {/* Equalizer Title */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight text-white/90">Acoustic Spectrum</h2>
          <p className="text-xs text-white/40 mt-1">Real-time spectral visualization</p>
        </div>
        <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
          {(['bars', 'wave', 'radial'] as VisualizerStyle[]).map((vStyle) => (
            <button
              key={vStyle}
              onClick={() => setStyle(vStyle)}
              className={`text-xs px-2.5 py-1.5 font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                style === vStyle
                  ? 'bg-purple-500/25 text-purple-300 border border-purple-500/20'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              {vStyle}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas Window Container */}
      <div className="relative flex-1 bg-black/35 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center p-2 mb-4">
        {/* Track Title Watermark overlay */}
        <div className="absolute top-4 left-4 flex items-center gap-2.5 text-white/30 z-15 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
          <Volume2 className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold tracking-widest uppercase">
            {isPlaying ? `Playing: ${currentTrack?.title}` : 'Spectral Idle'}
          </span>
        </div>

        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Presets Grid */}
      <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          DSP Equalizer Presets
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {(['Flat', 'Bass Boost', 'Electronic', 'Acoustic', 'Vocal'] as EqPreset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`text-[10px] py-2.5 font-bold rounded-xl transition-all cursor-pointer ${
                preset === p
                  ? 'bg-purple-500 text-black shadow-[0_4px_12px_rgba(168,85,247,0.4)]'
                  : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
