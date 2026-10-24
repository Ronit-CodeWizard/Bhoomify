import { useEffect, useRef, useState } from 'react';
import { Sliders, Volume2, ArrowLeft } from 'lucide-react';
import { PlayerState, Track } from '../types';

interface EqualizerScreenProps {
  state: PlayerState;
  currentTrack: Track | null;
  analyserNode: AnalyserNode | null;
  onBackToPlayer?: () => void;
}

type VisualizerStyle = 'bars' | 'wave' | 'radial';
type EqPreset = 'Flat' | 'Bass Boost' | 'Electronic' | 'Acoustic' | 'Vocal';

export function EqualizerScreen({ state, currentTrack, analyserNode, onBackToPlayer }: EqualizerScreenProps) {
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
        return freqIndex < totalBands * 0.25 ? 1.6 : 0.8;
      case 'Electronic':
        if (freqIndex < totalBands * 0.2 || freqIndex > totalBands * 0.8) return 1.4;
        return 0.7;
      case 'Acoustic':
        const midPoint = totalBands / 2;
        const distFromMid = Math.abs(freqIndex - midPoint) / midPoint;
        return 1.4 - distFromMid * 0.8;
      case 'Vocal':
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

    const bandCount = style === 'bars' ? 36 : 64;
    const frequencies = new Array(bandCount).fill(0);
    const targetFrequencies = new Array(bandCount).fill(0);
    
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const smoothFactor = 0.16;

      let dataArray: Uint8Array | null = null;
      let bufferLength = 0;
      if (analyserNode && isPlaying) {
        bufferLength = analyserNode.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteFrequencyData(dataArray as any);
      }

      for (let i = 0; i < bandCount; i++) {
        if (dataArray) {
          const percent = i / bandCount;
          const dataIndex = Math.floor(percent * bufferLength * 0.85);
          const rawValue = dataArray[dataIndex] || 0;

          const amplitudeMultiplier = getPresetMultiplier(i, bandCount);
          let targetVal = (rawValue / 255) * height * 0.85 * volume * amplitudeMultiplier;
          targetVal = Math.max(4, targetVal);
          targetFrequencies[i] = targetVal;
        } else if (isPlaying) {
          // Simulation fallback
          const wave = Math.sin(phase + i * 0.28) * 0.5 + 0.5;
          const noise = Math.sin(phase * 1.5 + i * 0.5) * 0.3;
          const simulatedVal = (wave + noise) * height * 0.45 * volume;
          targetFrequencies[i] = Math.max(6, simulatedVal);
        } else {
          // Idle low ambient wave
          targetFrequencies[i] = Math.sin(phase * 0.5 + i * 0.2) * 5 + 8;
        }

        frequencies[i] += (targetFrequencies[i] - frequencies[i]) * smoothFactor;
      }

      phase += isPlaying ? 0.08 : 0.02;

      // Inverted Monochromatic Black-on-White Rendering
      if (style === 'bars') {
        const barWidth = width / bandCount;
        const gap = 3;

        for (let i = 0; i < bandCount; i++) {
          const barHeight = frequencies[i];
          const x = i * barWidth;
          const y = height - barHeight - 12;

          // Inverted gradient: soft charcoal bottom -> rich deep black top
          const gradient = ctx.createLinearGradient(x, height, x, y);
          gradient.addColorStop(0, 'rgba(0, 0, 0, 0.12)');
          gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.65)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');

          ctx.fillStyle = gradient;
          
          ctx.beginPath();
          const r = Math.min(barWidth / 2 - gap / 2, 4);
          const w = Math.max(1, barWidth - gap);
          ctx.roundRect(x + gap / 2, y, w, barHeight, [r, r, 0, 0]);
          ctx.fill();

          // Black peak dots
          if (isPlaying && i % 2 === 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.beginPath();
            ctx.arc(x + barWidth / 2, y - 6, 1.5, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      } else if (style === 'wave') {
        const layers = 3;
        for (let l = 0; l < layers; l++) {
          ctx.beginPath();
          ctx.lineWidth = l === 0 ? 3 : 1.5;
          
          if (l === 0) ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
          else if (l === 1) ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
          else ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';

          const speedMultiplier = (l + 1) * 0.4;
          const amplitudeFactor = (3 - l) * 0.35;

          ctx.moveTo(0, height / 2);

          for (let x = 0; x < width; x += 5) {
            const freqIndex = Math.floor((x / width) * bandCount);
            const freqVal = frequencies[freqIndex] || 10;
            
            const sinY = Math.sin(x * 0.015 - phase * speedMultiplier) * freqVal * amplitudeFactor;
            const cosY = Math.cos(x * 0.008 + phase * speedMultiplier * 0.5) * 12;
            
            ctx.lineTo(x, height / 2 + sinY + cosY);
          }

          ctx.stroke();
        }

        if (isPlaying) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
          for (let i = 0; i < 5; i++) {
            const nodeX = (width / 6) * (i + 1) + Math.sin(phase + i) * 15;
            const nodeY = height / 2 + Math.cos(phase * 1.2 + i) * 35;
            ctx.beginPath();
            ctx.arc(nodeX, nodeY, 3 + i, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      } else if (style === 'radial') {
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.22;

        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        const pulseAmt = isPlaying ? frequencies[4] * 0.2 : 5;
        const radialGradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, baseRadius + pulseAmt);
        radialGradient.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
        radialGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.04)');
        radialGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = radialGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius + pulseAmt, 0, 2 * Math.PI);
        ctx.fill();

        // Inverted radial spikes in deep black
        const spikes = 54;
        for (let i = 0; i < spikes; i++) {
          const angle = (i / spikes) * Math.PI * 2 + phase * 0.15;
          const freqIndex = Math.floor((i / spikes) * bandCount);
          const val = frequencies[freqIndex] * 0.65;

          const startX = centerX + Math.cos(angle) * baseRadius;
          const startY = centerY + Math.sin(angle) * baseRadius;
          const endX = centerX + Math.cos(angle) * (baseRadius + val);
          const endY = centerY + Math.sin(angle) * (baseRadius + val);

          const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
          gradient.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2;
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
    <div id="equalizer-screen" className="flex flex-col h-full text-black px-5 pt-6 pb-28 overflow-y-auto custom-scrollbar bg-transparent">
      {/* Equalizer Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {onBackToPlayer && (
            <button
              onClick={onBackToPlayer}
              className="p-2.5 rounded-full bg-black/5 hover:bg-black/10 border border-black/10 text-black flex items-center justify-center cursor-pointer active:scale-95 transition-all mr-1"
              title="Back"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold font-display tracking-tight text-black">Spectral Analyzer</h2>
            <p className="text-xs text-black/50 mt-0.5">Monochromatic frequency visualization</p>
          </div>
        </div>
        <div className="flex gap-1 bg-black/5 p-1 rounded-xl border border-black/10">
          {(['bars', 'wave', 'radial'] as VisualizerStyle[]).map((vStyle) => (
            <button
              key={vStyle}
              onClick={() => setStyle(vStyle)}
              className={`text-xs px-3 py-1.5 font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                style === vStyle
                  ? 'bg-black text-white shadow-md'
                  : 'text-black/50 hover:text-black hover:bg-black/5'
              }`}
            >
              {vStyle}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas Window Container (Crisp White/Off-white frame) */}
      <div className="relative min-h-[220px] flex-1 bg-black/[0.02] border border-black/10 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center p-2 mb-4">
        {/* Track Title Watermark overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-2 text-black/60 z-15 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-black/10 shadow-sm">
          <Volume2 className="w-3.5 h-3.5 text-black" />
          <span className="text-[10px] font-mono tracking-widest uppercase font-semibold">
            {isPlaying ? `Track: ${currentTrack?.title}` : 'Spectral Idle'}
          </span>
        </div>

        <canvas ref={canvasRef} className="w-full h-full block min-h-[200px]" />
      </div>

      {/* Presets Grid */}
      <div className="bg-black/[0.03] border border-black/10 rounded-2xl p-4">
        <h3 className="text-xs font-mono font-bold text-black/60 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-black" />
          DSP Equalizer Curve
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(['Flat', 'Bass Boost', 'Electronic', 'Acoustic', 'Vocal'] as EqPreset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`text-[10px] py-2.5 px-2 font-mono font-bold rounded-xl transition-all cursor-pointer border ${
                preset === p
                  ? 'bg-black text-white border-black shadow-md'
                  : 'bg-white border-black/10 text-black/60 hover:text-black hover:bg-black/5'
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
