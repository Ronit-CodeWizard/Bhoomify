import React from 'react';
import { Disc } from 'lucide-react';
import { Track } from '../types';

interface MonochromeDiscLabelProps {
  track?: Track;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showDetails?: boolean;
}

export const MonochromeDiscLabel: React.FC<MonochromeDiscLabelProps> = ({
  track,
  size = 'lg',
  className = '',
  showDetails = true,
}) => {
  const isMd = size === 'md';
  const isSm = size === 'sm';

  if (isSm) {
    return (
      <div
        className={`w-full h-full rounded-full bg-[#111] border border-black/20 flex items-center justify-center relative overflow-hidden select-none ${className}`}
      >
        {/* Vinyl micro-grooves */}
        <div className="absolute inset-1 rounded-full border border-white/10" />
        <div className="absolute inset-2 rounded-full border border-white/15" />
        {/* Center label */}
        <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center font-bold text-[8px] border border-black/30 shadow-sm">
          <Disc className="w-3 h-3 text-black animate-spin [animation-duration:8s]" />
        </div>
      </div>
    );
  }

  if (isMd) {
    return (
      <div
        className={`w-full h-full rounded-full bg-[#141414] border border-black/30 flex items-center justify-center relative overflow-hidden select-none shadow-xl ${className}`}
      >
        {/* Vinyl Grooves */}
        <div className="absolute inset-2 rounded-full border border-white/10" />
        <div className="absolute inset-4 rounded-full border border-white/10" />
        <div className="absolute inset-6 rounded-full border border-white/10" />

        {/* Center White Label with stark black typography */}
        <div className="w-[88px] h-[88px] rounded-full bg-white border-2 border-black/20 flex flex-col items-center justify-center text-center p-2 relative shadow-md">
          <div className="absolute inset-1 rounded-full border border-black/10" />
          <span className="text-[9px] font-bold text-black truncate max-w-[70px]">
            {track?.title || ''}
          </span>
          <div className="w-2.5 h-2.5 rounded-full bg-black border border-white/80 my-1.5" />
          <span className="text-[7.5px] font-medium text-black/60 truncate max-w-[70px]">
            {track?.artist || ''}
          </span>
        </div>
      </div>
    );
  }

  // Large size for the main Vinyl Player Center
  return (
    <div
      className={`w-full h-full rounded-full bg-white border-2 border-black/20 flex flex-col items-center justify-center text-center p-2 relative overflow-hidden select-none shadow-[inset_0_0_15px_rgba(0,0,0,0.08),0_2px_12px_rgba(0,0,0,0.15)] ${className}`}
    >
      {/* Concentric hairline rings */}
      <div className="absolute inset-1 rounded-full border border-black/10 pointer-events-none" />
      <div className="absolute inset-2 rounded-full border border-black/15 pointer-events-none" />
      <div className="absolute inset-[18px] rounded-full border border-black/10 pointer-events-none" />

      {/* Central Spindle hole with black center and silver ring */}
      <div className="relative my-2 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-black border-2 border-white flex items-center justify-center shadow-md">
          <div className="w-2.5 h-2.5 rounded-full bg-white border border-black/30" />
        </div>
      </div>

      {/* Song details in stark, clean black typography */}
      {showDetails && track && (
        <div className="flex flex-col items-center max-w-[100px] px-1">
          <span className="text-[11px] font-bold text-black tracking-tight truncate w-full text-center">
            {track.title}
          </span>
          <span className="text-[9px] text-black/60 tracking-wider truncate w-full text-center mt-0.5 font-medium">
            {track.artist}
          </span>
        </div>
      )}
    </div>
  );
};
