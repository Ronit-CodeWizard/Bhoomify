import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../utils/audioEngine';

interface AudioVisualizerProps {
  isPlaying: boolean;
  mode?: 'bars' | 'wave' | 'circle';
  height?: number;
  className?: string;
  accentColor?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  mode = 'bars',
  height = 90,
  className = '',
  accentColor = '#10B981',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, width, h);

      if (mode === 'bars') {
        const data = audioEngine.getVisualizerData();
        const barCount = 42;
        const barWidth = Math.max(3, (width / barCount) - 3);

        for (let i = 0; i < barCount; i++) {
          const index = Math.floor((i / barCount) * (data.length * 0.7));
          let val = data[index] || 0;
          if (!isPlaying) {
            val = Math.sin(Date.now() * 0.003 + i * 0.3) * 6 + 8;
          }
          const percent = Math.min(1, Math.max(0.04, val / 255));
          const barHeight = percent * (h - 10);
          const x = i * (barWidth + 3);
          const y = h - barHeight;

          // Gradient
          const gradient = ctx.createLinearGradient(0, y, 0, h);
          gradient.addColorStop(0, accentColor);
          gradient.addColorStop(1, '#064E3B');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
          ctx.fill();
        }
      } else if (mode === 'wave') {
        const waveData = audioEngine.getWaveformData();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = accentColor;
        ctx.beginPath();

        const sliceWidth = width / waveData.length;
        let x = 0;

        for (let i = 0; i < waveData.length; i++) {
          let v = waveData[i] / 128.0;
          if (!isPlaying) {
            v = 1.0 + Math.sin(Date.now() * 0.002 + i * 0.05) * 0.05;
          }
          const y = (v * h) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, h / 2);
        ctx.stroke();
      } else {
        // Circle / Pulse
        const data = audioEngine.getVisualizerData();
        const centerX = width / 2;
        const centerY = h / 2;
        const radius = Math.min(centerX, centerY) * 0.45;
        const bars = 48;

        for (let i = 0; i < bars; i++) {
          const rad = (i / bars) * Math.PI * 2;
          const dataIdx = Math.floor((i / bars) * (data.length * 0.6));
          let val = data[dataIdx] || 0;
          if (!isPlaying) {
            val = Math.sin(Date.now() * 0.003 + i * 0.5) * 8 + 12;
          }
          const barLength = (val / 255) * (Math.min(centerX, centerY) * 0.45);

          const x1 = centerX + Math.cos(rad) * radius;
          const y1 = centerY + Math.sin(rad) * radius;
          const x2 = centerX + Math.cos(rad) * (radius + barLength);
          const y2 = centerY + Math.sin(rad) * (radius + barLength);

          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, mode, accentColor]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 400;
      canvas.height = height;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [height]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full block ${className}`}
      style={{ height: `${height}px` }}
    />
  );
};
