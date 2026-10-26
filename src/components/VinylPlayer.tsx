import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  Heart,
  MoreVertical,
  ChevronDown,
  ListMusic,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Track, PlayerState } from '../types';
import { MonochromeDiscLabel } from './MonochromeDiscLabel';
import { CloudPopup } from './CloudPopup';

interface VinylPlayerProps {
  currentTrack?: Track | null;
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
  onTogglePlaylist?: () => void;
  isDownloadingDriveFile?: boolean;
  onAddTracks?: (tracks: Track[]) => void;
  volume?: number;
  setVolume?: (vol: number) => void;
  toggleMute?: () => void;
  isMuted?: boolean;
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
  onTogglePlaylist,
  isDownloadingDriveFile,
  onAddTracks,
  volume,
  setVolume,
  toggleMute,
  isMuted,
}: VinylPlayerProps) {
  const { isPlaying, currentTime, duration, isShuffle, isRepeat, likedTrackIds, currentTrackIndex } = state;

  // Favorite state: always true by default, flips to false briefly on click before snapping back to true
  const [isTemporarilyUnliked, setIsTemporarilyUnliked] = useState(false);
  const [showCloud, setShowCloud] = useState(false);
  const [isLowered, setIsLowered] = useState(false);
  const unlikedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cloudTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const newTracks: Track[] = files.map((file, i) => {
      const url = URL.createObjectURL(file);
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      let title = fileName;
      let artist = 'Local Audio';
      if (fileName.includes(' - ')) {
        const parts = fileName.split(' - ');
        artist = parts[0].trim();
        title = parts[1].trim();
      }
      return {
        id: `user-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`,
        title: title || 'Untitled Audio',
        artist: artist || 'Local Track',
        album: 'My Collection',
        duration: '0:00',
        durationSec: 0,
        coverUrl: '',
        audioUrl: url,
        blobUrl: url,
      };
    });
    onAddTracks?.(newTracks);
    e.target.value = '';
  };

  useEffect(() => {
    return () => {
      if (unlikedTimerRef.current) clearTimeout(unlikedTimerRef.current);
      if (cloudTimerRef.current) clearTimeout(cloudTimerRef.current);
    };
  }, []);

  const effectiveIsLiked = isTemporarilyUnliked ? false : true;

  const handleFavoriteClick = () => {
    if (unlikedTimerRef.current) clearTimeout(unlikedTimerRef.current);
    if (cloudTimerRef.current) clearTimeout(cloudTimerRef.current);

    // 1. Immediately pop up the cloud warning
    setShowCloud(true);

    // 2. Visually show toggling to false/unfavourite
    setIsTemporarilyUnliked(true);
    if (currentTrack?.id) {
      toggleLike(currentTrack.id);
    }

    // 3. Automatically turn back to true after 650ms
    unlikedTimerRef.current = setTimeout(() => {
      setIsTemporarilyUnliked(false);
    }, 650);

    // 4. Automatically dismiss cloud after 3.8s
    cloudTimerRef.current = setTimeout(() => {
      setShowCloud(false);
    }, 3800);
  };

  // Circular progress calculation
  const radius = 100;
  const strokeWidth = 3.5;
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

    let angle = Math.atan2(dy, dx) + Math.PI / 2;
    if (angle < 0) angle += 2 * Math.PI;

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

  return (
    <div
      id="vinyl-player"
      className="relative flex flex-col items-center justify-between h-full w-full px-4 sm:px-6 pt-2 sm:pt-4 pb-2 sm:pb-5 text-black select-none overflow-hidden"
    >
      {/* Top Bar Header Buttons Section */}
      <div className="w-full flex items-center justify-between mb-1 sm:mb-2 shrink-0">
        <motion.button
          onClick={() => setIsLowered((prev) => !prev)}
          className={`p-2 rounded-full transition-all cursor-pointer border ${
            isLowered
              ? 'bg-black text-white border-black shadow-md'
              : 'text-black/60 hover:text-black bg-black/5 hover:bg-black/10 border-black/10'
          }`}
          title={isLowered ? 'Raise Player' : 'Lower Player'}
          aria-label={isLowered ? 'Raise Player' : 'Lower Player'}
          animate={{ rotate: isLowered ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.button>
        <div />
        <div className="flex items-center gap-2">
          {onTogglePlaylist && (
            <button
              onClick={onTogglePlaylist}
              className="text-black/60 hover:text-black p-2 bg-black/5 hover:bg-black/10 rounded-full transition-all cursor-pointer border border-black/10"
              title="Toggle Tracks Playlist"
            >
              <ListMusic className="w-4 h-4" />
            </button>
          )}
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="text-black/25 p-2 bg-black/5 rounded-full border border-black/10 cursor-default select-none transition-none"
            aria-label="Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Space created UNDER the top header buttons section showing MADE BY RONIT MAJHI */}
      <AnimatePresence>
        {isLowered && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="w-full flex items-center justify-center overflow-hidden mb-2 shrink-0 z-40"
          >
            <span className="text-xs sm:text-[13px] font-mono font-bold tracking-[0.22em] text-black uppercase select-all py-0.5">
              MADE BY RONIT MAJHI
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Song Details Header */}
      <div className="w-full flex items-start justify-between mb-1 sm:mb-2 px-1 relative z-30 shrink-0">
        <div className="flex flex-col min-w-0 pr-3">
          <AnimatePresence mode="wait">
            <motion.h1
              key={currentTrack?.title}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-black font-display truncate"
            >
              {currentTrack?.title || 'No Track Selected'}
            </motion.h1>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentTrack?.artist}
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 2 }}
              className="text-xs sm:text-sm text-black/55 font-medium mt-0.5 truncate"
            >
              {currentTrack?.artist || 'BHOOMIKA'}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Favorite Icon with Cloud Warning Popup */}
        <div className="relative shrink-0 z-30">
          <motion.button
            onClick={handleFavoriteClick}
            whileTap={{ scale: 0.82 }}
            animate={
              isTemporarilyUnliked
                ? { scale: 0.85, rotate: -4 }
                : { scale: [0.85, 1.35, 1], rotate: 0 }
            }
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="p-2 sm:p-2.5 rounded-full bg-black/5 hover:bg-black/10 border border-black/10 cursor-pointer shrink-0 transition-colors"
            title={effectiveIsLiked ? 'Favorited' : 'Unfavorited'}
          >
            <Heart
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${
                effectiveIsLiked 
                  ? 'fill-black text-black drop-shadow-[0_0_8px_rgba(0,0,0,0.35)]' 
                  : 'fill-transparent text-black/25'
              }`}
            />
          </motion.button>

          {/* Cloud Container Pop-up */}
          <AnimatePresence>
            {showCloud && (
              <div className="absolute right-0 top-10 z-50">
                <CloudPopup
                  tailDirection="up"
                  onClose={() => setShowCloud(false)}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Vinyl Disc & Circular Seek Container with Peeking Discs */}
      <div className="relative w-full flex items-center justify-center my-auto py-1 sm:py-2 overflow-visible shrink min-h-0">
        {/* Left Peeking Monochromatic Disc (desktop only to prevent side overflow on mobile) */}
        {tracks.length > 1 && prevTrack && (
          <div 
            onClick={prev}
            className="hidden sm:block absolute -left-[110px] sm:-left-[130px] w-[140px] sm:w-[170px] h-[140px] sm:h-[170px] rounded-full overflow-hidden border border-black/10 opacity-30 hover:opacity-60 transition-all duration-300 transform scale-90 cursor-pointer flex-shrink-0 select-none z-10 shadow-lg"
            title={`Previous: ${prevTrack?.title}`}
          >
            <MonochromeDiscLabel track={prevTrack} size="md" showDetails={false} />
          </div>
        )}

        {/* Center Vinyl + Acrylic Progress Ring (Responsive size: 170px on mobile, 240px on tablet/desktop) */}
        <div className="relative w-[170px] xs:w-[190px] sm:w-[230px] md:w-[250px] h-[170px] xs:h-[190px] sm:h-[230px] md:h-[250px] flex items-center justify-center z-20 shrink-0">
          {/* Glass Inner Rim Shadow */}
          <div className="absolute inset-0 rounded-full border border-black/10 bg-black/[0.02] shadow-[inset_0_4px_25px_rgba(0,0,0,0.03),0_20px_45px_rgba(0,0,0,0.08)]" />

          {/* Glowing Vinyl Track Progress Line Circle in Pure Black */}
          <svg
            ref={progressRingRef}
            className="absolute top-0 left-0 w-full h-full transform -rotate-90 cursor-pointer select-none"
            viewBox="0 0 230 230"
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
            {/* Background track circle */}
            <circle
              cx="115"
              cy="115"
              r={radius}
              fill="transparent"
              stroke="rgba(0, 0, 0, 0.1)"
              strokeWidth={strokeWidth}
            />
            {/* Glowing Pure Black progress arc */}
            <circle
              cx="115"
              cy="115"
              r={radius}
              fill="transparent"
              stroke="#000000"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-150 drop-shadow-[0_0_6px_rgba(0,0,0,0.35)]"
            />
          </svg>

          {/* Vinyl Disc Body (Rotating Grooved Disk with MonochromeDiscLabel) */}
          <motion.div
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{
              rotate: {
                repeat: Infinity,
                duration: 12,
                ease: 'linear',
              },
            }}
            className="relative w-[130px] xs:w-[150px] sm:w-[180px] md:w-[195px] h-[130px] xs:h-[150px] sm:h-[180px] md:h-[195px] rounded-full bg-[#111111] border border-black/80 flex items-center justify-center shadow-[inset_0_0_20px_rgba(255,255,255,0.05),0_15px_35px_rgba(0,0,0,0.25)] cursor-pointer"
            onClick={togglePlay}
          >
            {/* Vinyl Grooves Texture */}
            <div className="absolute inset-2 rounded-full border border-white/[0.08] pointer-events-none" />
            <div className="absolute inset-4 rounded-full border border-white/[0.08] pointer-events-none" />
            <div className="absolute inset-6 rounded-full border border-white/[0.08] pointer-events-none" />
            <div className="absolute inset-8 rounded-full border border-white/[0.06] pointer-events-none" />
            <div className="absolute inset-10 rounded-full border border-white/[0.06] pointer-events-none" />

            {/* Inner Monochrome Label */}
            <div className="w-[82px] xs:w-[95px] sm:w-[115px] md:w-[125px] h-[82px] xs:h-[95px] sm:h-[115px] md:h-[125px] rounded-full overflow-hidden flex-shrink-0 relative">
              <MonochromeDiscLabel track={currentTrack || undefined} size="lg" />

              {isDownloadingDriveFile && (
                <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center text-center z-10 rounded-full">
                  <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin mb-1 drop-shadow-[0_0_8px_rgba(0,0,0,0.3)]" />
                  <span className="text-[7px] font-mono text-black tracking-widest uppercase font-bold animate-pulse">STREAMING</span>
                </div>
              )}
            </div>

            {/* Central Spindle Hole with black accent */}
            <div className="absolute w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-white border-2 border-black/50 shadow-inner flex items-center justify-center z-20 pointer-events-none">
              <div className="w-1 h-1 rounded-full bg-black" />
            </div>
          </motion.div>

          {/* Time Display centered underneath the disc, inside the outer ring */}
          <div className="absolute bottom-2 sm:bottom-3 text-[10px] sm:text-xs font-mono font-bold tracking-widest text-black/70 select-none">
            {formatTime(currentTime)}
          </div>
        </div>

        {/* Right Peeking Monochromatic Disc (desktop only to prevent side overflow on mobile) */}
        {tracks.length > 1 && nextTrack && (
          <div 
            onClick={next}
            className="hidden sm:block absolute -right-[110px] sm:-right-[130px] w-[140px] sm:w-[170px] h-[140px] sm:h-[170px] rounded-full overflow-hidden border border-black/10 opacity-30 hover:opacity-60 transition-all duration-300 transform scale-90 cursor-pointer flex-shrink-0 select-none z-10 shadow-lg"
            title={`Next: ${nextTrack?.title}`}
          >
            <MonochromeDiscLabel track={nextTrack} size="md" showDetails={false} />
          </div>
        )}
      </div>

      {/* Playback error notice */}
      {playError && (
        <div className="text-xs bg-black/5 border border-black/20 rounded-2xl px-4 py-1.5 my-1 text-black/90 text-center w-full max-w-[340px] font-mono leading-tight shrink-0">
          {playError}
        </div>
      )}

      {/* Primary Linear Track Seekbar with Current Time and Total Duration */}
      <div className="w-full max-w-[340px] px-1 flex flex-col gap-1 shrink-0 z-30 pt-1">
        <div className="relative w-full flex items-center group cursor-pointer py-1">
          <input
            type="range"
            min={0}
            max={duration > 0 ? duration : 100}
            step={0.1}
            value={duration > 0 ? currentTime : 0}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-black/10 rounded-full appearance-none cursor-pointer accent-black focus:outline-none"
            title={`Seek: ${formatTime(currentTime)} / ${duration > 0 ? formatTime(duration) : '--:--'}`}
          />
        </div>
        <div className="w-full flex items-center justify-between text-[11px] font-mono font-medium text-black/50 select-none px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
        </div>
      </div>

      {/* Main Playback Controls Bar */}
      <div className="w-full max-w-[340px] flex items-center justify-between pt-1 sm:pt-2 pb-1 sm:pb-2 shrink-0 z-30">
        {/* Shuffle Button */}
        <button
          onClick={toggleShuffle}
          className={`p-2 transition-all duration-200 rounded-full cursor-pointer hover:bg-black/5 active:scale-90 ${
            isShuffle 
              ? 'text-black drop-shadow-[0_0_8px_rgba(0,0,0,0.5)] scale-105' 
              : 'text-black/35 hover:text-black'
          }`}
          title={isShuffle ? 'Shuffle On' : 'Shuffle Off'}
          aria-label="Toggle Shuffle"
        >
          <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Previous Track Button */}
        <button
          onClick={prev}
          className="p-2.5 sm:p-3 text-black/80 hover:text-black hover:scale-105 active:scale-95 transition-all rounded-full bg-black/5 hover:bg-black/10 border border-black/10 cursor-pointer"
          title="Previous Track"
          aria-label="Previous Track"
        >
          <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
        </button>

        {/* Play / Pause Toggle Button */}
        <button
          onClick={togglePlay}
          className="relative w-13 h-13 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-black text-white hover:scale-105 active:scale-95 transition-all shadow-[0_4px_25px_rgba(0,0,0,0.35)] cursor-pointer shrink-0"
          title={isPlaying ? 'Pause' : 'Play'}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-white stroke-white" />
          ) : (
            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white stroke-white ml-0.5" />
          )}
        </button>

        {/* Next Track Button */}
        <button
          onClick={next}
          className="p-2.5 sm:p-3 text-black/80 hover:text-black hover:scale-105 active:scale-95 transition-all rounded-full bg-black/5 hover:bg-black/10 border border-black/10 cursor-pointer"
          title="Next Track"
          aria-label="Next Track"
        >
          <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
        </button>

        {/* Repeat Button */}
        <button
          onClick={toggleRepeat}
          className={`relative p-2 transition-all duration-200 rounded-full cursor-pointer hover:bg-black/5 active:scale-90 ${
            isRepeat !== 'none'
              ? 'text-black drop-shadow-[0_0_8px_rgba(0,0,0,0.4)] scale-105'
              : 'text-black/35 hover:text-black'
          }`}
          title={
            isRepeat === 'all'
              ? 'Repeat All'
              : isRepeat === 'one'
              ? 'Repeat Song (1)'
              : 'Repeat Off'
          }
          aria-label={
            isRepeat === 'all'
              ? 'Repeat All'
              : isRepeat === 'one'
              ? 'Repeat Current Track'
              : 'Repeat Off'
          }
        >
          <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
          {isRepeat === 'one' && (
            <span className="absolute -top-0.5 -right-0.5 bg-black text-white font-mono font-bold text-[8.5px] rounded-full w-3.5 h-3.5 flex items-center justify-center border border-white shadow-sm pointer-events-none select-none">
              1
            </span>
          )}
        </button>
      </div>

      {/* Volume Bar Slider Control */}
      {setVolume && (
        <div className="w-full max-w-[260px] flex items-center gap-2 pt-0 pb-1 sm:pb-2 shrink-0 z-30">
          <button
            onClick={toggleMute}
            className="text-black/50 hover:text-black transition-colors cursor-pointer p-1"
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || (volume ?? 0.8) === 0 ? (
              <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : (volume ?? 0.8)}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-black/10 rounded-full appearance-none cursor-pointer accent-black"
            title={`Master Volume: ${Math.round((isMuted ? 0 : (volume ?? 0.8)) * 100)}%`}
          />
          <span className="text-[10px] font-mono text-black/40 min-w-[28px] text-right">
            {Math.round((isMuted ? 0 : (volume ?? 0.8)) * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
