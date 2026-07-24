import { motion } from 'motion/react';
import { Play, Pause, SkipForward, Maximize2 } from 'lucide-react';
import { Track, PlayerState } from '../types';

interface MiniPlayerProps {
  currentTrack: Track;
  state: PlayerState;
  togglePlay: () => void;
  next: () => void;
  onExpand: () => void;
}

export function MiniPlayer({
  currentTrack,
  state,
  togglePlay,
  next,
  onExpand,
}: MiniPlayerProps) {
  if (!currentTrack) return null;
  const { isPlaying, currentTime, duration } = state;

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-[360px] bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.6)] overflow-hidden z-30 group"
    >
      {/* Sleek Progress Bar Indicator on top edge */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5">
        <div
          className="h-full bg-cyan-400 drop-shadow-[0_0_4px_rgba(0,229,255,0.7)] transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between p-3">
        {/* Click to expand area */}
        <div
          onClick={onExpand}
          className="flex items-center flex-1 min-w-0 cursor-pointer"
        >
          {/* Cover Art thumbnail */}
          <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
            <motion.img
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{
                rotate: { repeat: Infinity, duration: 10, ease: 'linear' },
              }}
              src={currentTrack?.coverUrl}
              alt={currentTrack?.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 rounded-full border border-black/10 pointer-events-none" />
          </div>

          {/* Title & Artist info */}
          <div className="ml-3 flex-1 min-w-0 pr-2">
            <h4 className="text-xs font-bold text-white truncate">{currentTrack?.title}</h4>
            <p className="text-[10px] text-white/50 truncate mt-0.5">{currentTrack?.artist}</p>
          </div>
        </div>

        {/* Media Controls for MiniPlayer */}
        <div className="flex items-center gap-1.5 ml-1">
          {/* Play / Pause Toggle */}
          <button
            onClick={togglePlay}
            className="p-2 text-white hover:text-purple-400 hover:bg-white/5 active:scale-90 transition-all rounded-full cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Skip Track */}
          <button
            onClick={next}
            className="p-2 text-white/60 hover:text-white hover:bg-white/5 active:scale-90 transition-all rounded-full cursor-pointer"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          {/* Maximize Icon */}
          <button
            onClick={onExpand}
            className="p-2 text-white/40 hover:text-white group-hover:text-white/70 hover:bg-white/5 active:scale-90 transition-all rounded-full cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
