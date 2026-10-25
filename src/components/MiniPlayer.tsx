import { motion } from 'motion/react';
import { Play, Pause, SkipForward, Maximize2 } from 'lucide-react';
import { Track, PlayerState } from '../types';
import { MonochromeDiscLabel } from './MonochromeDiscLabel';

interface MiniPlayerProps {
  currentTrack: Track | null;
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
      className="absolute bottom-[66px] sm:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[420px] bg-white/95 backdrop-blur-2xl border border-black/15 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.15)] overflow-hidden z-30 group text-black"
    >
      {/* Inverted Black Progress Indicator */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-black/10">
        <div
          className="h-full bg-black drop-shadow-[0_0_5px_rgba(0,0,0,0.4)] transition-all duration-200"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between p-3">
        {/* Click to expand area */}
        <div
          onClick={onExpand}
          className="flex items-center flex-1 min-w-0 cursor-pointer"
        >
          {/* Rotating Monochromatic Disc thumbnail */}
          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 shadow-md border border-black/15">
            <motion.div
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{
                rotate: { repeat: Infinity, duration: 10, ease: 'linear' },
              }}
              className="w-full h-full"
            >
              <MonochromeDiscLabel track={currentTrack} size="sm" />
            </motion.div>
          </div>

          {/* Title & Artist info */}
          <div className="ml-3 flex-1 min-w-0 pr-2">
            <h4 className="text-xs font-bold text-black truncate">{currentTrack?.title}</h4>
            <p className="text-[10px] text-black/50 truncate mt-0.5">{currentTrack?.artist}</p>
          </div>
        </div>

        {/* Media Controls for MiniPlayer */}
        <div className="flex items-center gap-1.5 ml-1">
          {/* Play / Pause Toggle */}
          <button
            onClick={togglePlay}
            className="p-2 text-black hover:bg-black/10 active:scale-90 transition-all rounded-full cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
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
            className="p-2 text-black/70 hover:text-black hover:bg-black/10 active:scale-90 transition-all rounded-full cursor-pointer"
            title="Next Track"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          {/* Maximize Icon */}
          <button
            onClick={onExpand}
            className="p-2 text-black/40 hover:text-black group-hover:text-black/80 hover:bg-black/10 active:scale-90 transition-all rounded-full cursor-pointer"
            title="Open Full Player"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
