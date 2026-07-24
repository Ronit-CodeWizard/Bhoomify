import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Heart, MoreVertical, ChevronDown, Cloud, Music } from 'lucide-react';
import { Track, PlayerState } from '../types';

interface VinylPlayerProps {
  currentTrack: Track;
  tracks: Track[];
  state: PlayerState;
  playError: string | null;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLike: (trackId: string) => void;
  playTrack: (index: number) => void;
  onOpenMenu?: () => void;
  isDownloadingDriveFile?: boolean;
}

export function VinylPlayer({
  currentTrack,
  tracks,
  state,
  playError,
  togglePlay,
  next,
  prev,
  seek,
  toggleShuffle,
  toggleRepeat,
  toggleLike,
  playTrack,
  onOpenMenu,
  isDownloadingDriveFile,
}: VinylPlayerProps) {
  const { isPlaying, currentTime, duration, isShuffle, isRepeat, likedTrackIds, currentTrackIndex } = state;

  const isLiked = likedTrackIds.includes(currentTrack?.id);

  // For the circular progress
  const radius = 100;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const progress = duration > 0 ? currentTime / duration : 0;
  const strokeDashoffset = circumference - progress * circumference;

  const prevTrackIndex = tracks.length > 0 ? (currentTrackIndex - 1 + tracks.length) % tracks.length : 0;
  const nextTrackIndex = tracks.length > 0 ? (currentTrackIndex + 1) % tracks.length : 0;

  const prevTrack = tracks[prevTrackIndex];
  const nextTrack = tracks[nextTrackIndex];

  // Dragging the circular seek indicator
  const progressRingRef = useRef<SVGSVGElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSeekDrag = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (!progressRingRef.current || duration === 0) return;

    const rect = progressRingRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // Calculate angle in radians: from -PI to PI
    // We adjust it so 12 o'clock is 0 or -PI/2
    let angle = Math.atan2(dy, dx) + Math.PI / 2;
    if (angle < 0) angle += 2 * Math.PI;

    // Convert angle to percentage (0 to 1)
    const pct = angle / (2 * Math.PI);
    seek(pct * duration);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  // Format time MM:SS
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (tracks.length === 0) {
    return (
      <div id="vinyl-player-empty" className="flex flex-col items-center justify-center h-full text-center px-6 pb-20 select-none">
        <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 animate-pulse">
          <Music className="w-8 h-8 text-purple-400" />
        </div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-white mb-2">Empty Library</h1>
        <p className="text-sm text-white/50 max-w-xs leading-relaxed mb-8">
          Place your audio files (MP3, M4A, etc.) inside the <code className="bg-white/15 px-1.5 py-0.5 rounded text-purple-300">public/musicfiles</code> directory to scan and load your tracks.
        </p>
      </div>
    );
  }

  return (
    <div id="vinyl-player-screen" className="flex flex-col items-center h-full text-white select-none px-6 pt-6">
      {/* Top Header Row */}
      <div className="w-full flex items-center justify-between mb-8">
        <button className="text-white/70 hover:text-white p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all cursor-pointer">
          <ChevronDown className="w-5 h-5" />
        </button>
        <div className="w-12 h-1.5 bg-white/10 rounded-full" />
        <button 
          onClick={onOpenMenu}
          className="text-white/70 hover:text-white p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all cursor-pointer"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Song Details Header */}
      <div className="w-full flex items-start justify-between mb-8 pr-1">
        <div className="flex flex-col">
          <AnimatePresence mode="wait">
            <motion.h1
              key={currentTrack?.title}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-3xl font-bold tracking-tight text-white font-display"
            >
              {currentTrack?.title}
            </motion.h1>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentTrack?.artist}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="text-base text-white/50 font-medium mt-1"
            >
              {currentTrack?.artist}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Favorite Icon */}
        <motion.button
          onClick={() => toggleLike(currentTrack?.id)}
          whileTap={{ scale: 0.8 }}
          className="p-2 cursor-pointer"
        >
          <Heart
            className={`w-6 h-6 transition-all duration-300 ${
              isLiked 
                ? 'fill-pink-500 text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]' 
                : 'text-white/60 hover:text-white'
            }`}
          />
        </motion.button>
      </div>

      {/* Vinyl Disc & Circular Seek Container with Peeking Covers */}
      <div className="relative w-full flex items-center justify-center my-6 h-[270px] overflow-visible">
        {/* Left Peeking Album Cover */}
        <div 
          onClick={prev}
          className="absolute -left-[140px] w-[180px] h-[180px] rounded-full overflow-hidden border border-white/5 bg-black/40 opacity-20 hover:opacity-40 transition-all duration-300 transform scale-90 cursor-pointer flex-shrink-0 select-none z-10"
        >
          <img
            src={prevTrack?.coverUrl}
            alt={prevTrack?.title}
            className="w-full h-full object-cover pointer-events-none filter blur-[1px]"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Center Vinyl + Acrylic Progress Ring */}
        <div className="relative w-[230px] h-[230px] flex items-center justify-center z-20">
          {/* Glass Inner Rim Shadow */}
          <div className="absolute inset-0 rounded-full border border-white/10 bg-white/5 backdrop-blur-[2px] shadow-[inset_0_4px_20px_rgba(255,255,255,0.05),0_15px_35px_rgba(0,0,0,0.6)]" />

          {/* Glowing Vinyl Track Progress Line Circle */}
          <svg
            ref={progressRingRef}
            className="absolute top-0 left-0 w-full h-full transform -rotate-90 cursor-pointer select-none"
            onMouseDown={(e) => {
              setIsDragging(true);
              handleSeekDrag(e);
            }}
            onMouseMove={(e) => {
              if (isDragging) handleSeekDrag(e);
            }}
            onTouchStart={(e) => {
              setIsDragging(true);
              handleSeekDrag(e);
            }}
            onTouchMove={(e) => {
              if (isDragging) handleSeekDrag(e);
            }}
          >
            {/* Dark track track background */}
            <circle
              cx="115"
              cy="115"
              r={radius}
              fill="transparent"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={strokeWidth}
            />
            {/* Glowing neon-blue progress arc */}
            <circle
              cx="115"
              cy="115"
              r={radius}
              fill="transparent"
              stroke="#00E5FF"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-150 drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]"
            />
          </svg>

          {/* Vinyl Disc Body (Rotating Grooved Disk) */}
          <motion.div
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{
              rotate: {
                repeat: Infinity,
                duration: 12,
                ease: 'linear',
              },
            }}
            className="relative w-[180px] h-[180px] rounded-full bg-[#0d0d0d] border border-neutral-900 flex items-center justify-center shadow-[inset_0_0_15px_rgba(255,255,255,0.05),0_10px_25px_rgba(0,0,0,0.8)] cursor-pointer"
            onClick={togglePlay}
          >
            {/* Vinyl Grooves Texture */}
            <div className="absolute inset-2 rounded-full border border-neutral-800/80 pointer-events-none" />
            <div className="absolute inset-4 rounded-full border border-neutral-800/60 pointer-events-none" />
            <div className="absolute inset-6 rounded-full border border-neutral-800/40 pointer-events-none" />
            <div className="absolute inset-8 rounded-full border border-neutral-800/20 pointer-events-none" />
            <div className="absolute inset-10 rounded-full border border-neutral-800/10 pointer-events-none" />

            {/* Inner Album Artwork Label */}
            <div className="w-[110px] h-[110px] rounded-full overflow-hidden border-[3px] border-[#151515] shadow-lg flex-shrink-0 relative">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentTrack?.coverUrl}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  src={currentTrack?.coverUrl}
                  alt={currentTrack?.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
              {isDownloadingDriveFile && (
                <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-center z-10">
                  <div className="w-5 h-5 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin mb-1 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                  <span className="text-[8px] font-bold text-purple-300 uppercase tracking-widest animate-pulse">Streaming</span>
                </div>
              )}
            </div>

            {/* Central Spindle Hole */}
            <div className="absolute w-4 h-4 rounded-full bg-[#121212] border-2 border-[#1a1a1a] shadow-inner flex items-center justify-center z-10">
              <div className="w-1.5 h-1.5 rounded-full bg-[#e5e5e5]" />
            </div>
          </motion.div>

          {/* Time Display centered underneath the disc, inside the outer ring */}
          <div className="absolute bottom-[16px] text-xs font-semibold tracking-wider text-white/60 select-none">
            {formatTime(currentTime)}
          </div>
        </div>

        {/* Right Peeking Album Cover */}
        <div 
          onClick={next}
          className="absolute -right-[140px] w-[180px] h-[180px] rounded-full overflow-hidden border border-white/5 bg-black/40 opacity-20 hover:opacity-40 transition-all duration-300 transform scale-90 cursor-pointer flex-shrink-0 select-none z-10"
        >
          <img
            src={nextTrack?.coverUrl}
            alt={nextTrack?.title}
            className="w-full h-full object-cover pointer-events-none filter blur-[1px]"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Autoplay blocked error notice */}
      {playError && (
        <div className="text-xs bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 mb-2 text-purple-300 animate-pulse text-center w-full max-w-[280px]">
          Click vinyl/play to enable audio stream
        </div>
      )}

      {/* Main Playback Controls Section */}
      <div className="w-full max-w-[280px] flex items-center justify-between mt-auto mb-28">
        {/* Shuffle Button */}
        <button
          onClick={toggleShuffle}
          className={`p-2 transition-all duration-300 rounded-full cursor-pointer hover:bg-white/5 ${
            isShuffle 
              ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] scale-110' 
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          <Shuffle className="w-5 h-5" />
        </button>

        {/* Previous Track Button */}
        <button
          onClick={prev}
          className="p-3 text-white/70 hover:text-white hover:scale-110 active:scale-95 transition-all rounded-full bg-white/5 hover:bg-white/10 cursor-pointer"
        >
          <SkipBack className="w-5 h-5 fill-current" />
        </button>

        {/* Play / Pause Toggle Button */}
        <button
          onClick={togglePlay}
          className="relative w-14 h-14 rounded-full flex items-center justify-center bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.25)] cursor-pointer"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 fill-black stroke-black" />
          ) : (
            <Play className="w-6 h-6 fill-black stroke-black ml-0.5" />
          )}
        </button>

        {/* Next Track Button */}
        <button
          onClick={next}
          className="p-3 text-white/70 hover:text-white hover:scale-110 active:scale-95 transition-all rounded-full bg-white/5 hover:bg-white/10 cursor-pointer"
        >
          <SkipForward className="w-5 h-5 fill-current" />
        </button>

        {/* Repeat Button */}
        <button
          onClick={toggleRepeat}
          className={`relative p-2 transition-all duration-300 rounded-full cursor-pointer hover:bg-white/5 ${
            isRepeat !== 'none'
              ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] scale-110'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          <Repeat className="w-5 h-5" />
          {isRepeat === 'one' && (
            <span className="absolute -top-1 -right-1 bg-purple-500 text-black font-bold text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center border border-black">
              1
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
