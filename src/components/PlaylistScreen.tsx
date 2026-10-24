import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Play,
  Pause,
  GripVertical,
  Plus,
  Heart,
  ListOrdered,
  Cloud,
  ArrowLeft,
  Disc3,
  Sparkles,
  Upload,
  RotateCw,
  AlertCircle,
  KeyRound,
  Radio,
  Terminal,
} from 'lucide-react';
import { Track, PlayerState } from '../types';
import { MonochromeDiscLabel } from './MonochromeDiscLabel';
import { CloudPopup } from './CloudPopup';

export interface CatalogueDiagnosticInfo {
  endpoint: string;
  status: number | null;
  songCount: number;
  error: string | null;
  diagnostic: string | null;
}

interface PlaylistScreenProps {
  tracks: Track[];
  currentTrack?: Track | null;
  state: PlayerState;
  playTrack: (index: number) => void;
  togglePlay: () => void;
  reorderPlaylist: (startIndex: number, endIndex: number) => void;
  toggleLike: (trackId: string) => void;
  addToQueue: (trackId: string) => void;
  removeFromQueue: (trackId: string) => void;
  onBackToPlayer?: () => void;
  onAddTracks?: (tracks: Track[]) => void;
  onRemoveTrack?: (trackId: string) => void;
  isLoadingCatalogue?: boolean;
  catalogueError?: string | null;
  requiresAccessKey?: boolean;
  bhoMeta?: { repository?: string; folder?: string; count?: number } | null;
  catalogueDiagnostic?: CatalogueDiagnosticInfo;
  onRefreshCatalogue?: () => void;
}

export function PlaylistScreen({
  tracks,
  currentTrack,
  state,
  playTrack,
  togglePlay,
  reorderPlaylist,
  toggleLike,
  addToQueue,
  removeFromQueue,
  onBackToPlayer,
  onAddTracks,
  onRemoveTrack,
  isLoadingCatalogue = false,
  catalogueError = null,
  requiresAccessKey = false,
  bhoMeta = null,
  catalogueDiagnostic,
  onRefreshCatalogue,
}: PlaylistScreenProps) {
  const { isPlaying, likedTrackIds, queue } = state;
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);
  const [cloudTrackId, setCloudTrackId] = useState<string | null>(null);
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
      if (cloudTimerRef.current) clearTimeout(cloudTimerRef.current);
    };
  }, []);

  const handleTrackLikeClick = (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (cloudTimerRef.current) clearTimeout(cloudTimerRef.current);
    setCloudTrackId(trackId);
    toggleLike(trackId);
    cloudTimerRef.current = setTimeout(() => {
      setCloudTrackId(null);
    }, 3800);
  };

  // Search filter
  const filteredTracks = tracks
    .map((track, originalIndex) => ({ track, originalIndex }))
    .filter(({ track }) => {
      const query = searchQuery.toLowerCase();
      return (
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query)
      );
    });

  // Reordering handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      reorderPlaylist(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
  };

  const toggleActionMenu = (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuTrackId(activeMenuTrackId === trackId ? null : trackId);
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(0);
      if (!isPlaying) {
        togglePlay();
      }
    }
  };

  return (
    <div id="playlist-screen" className="flex flex-col h-full text-black px-5 pt-6 pb-28 relative overflow-hidden bg-transparent">
      {/* Hidden file input for adding custom tracks */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header Section */}
      <div className="flex flex-col gap-4 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToPlayer && (
              <button
                onClick={onBackToPlayer}
                className="p-2.5 rounded-full bg-black/5 hover:bg-black/10 border border-black/10 text-black flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm"
                title="Back"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-black flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-black" />
                Playlist
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefreshCatalogue && (
              <button
                onClick={onRefreshCatalogue}
                disabled={isLoadingCatalogue}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 hover:bg-black/10 border border-black/15 text-black text-[11px] font-mono font-semibold tracking-wider cursor-pointer active:scale-95 transition-all shadow-sm disabled:opacity-50"
                title="Sync music with Cloudflare BHO Worker"
              >
                <RotateCw className={`w-3 h-3 text-black ${isLoadingCatalogue ? 'animate-spin' : ''}`} />
                SYNC
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 hover:bg-black/10 border border-black/15 text-black text-[11px] font-mono font-semibold tracking-wider cursor-pointer active:scale-95 transition-all shadow-sm"
              title="Add audio files from device"
            >
              <Upload className="w-3 h-3 text-black" />
              ADD AUDIO
            </button>
            {tracks.length > 0 && (
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black hover:bg-black/85 text-white text-[11px] font-mono font-semibold tracking-wider cursor-pointer active:scale-95 transition-all shadow-sm"
                title="Play all tracks"
              >
                <Play className="w-3 h-3 fill-white" />
                PLAY ALL
              </button>
            )}
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-black/5 text-black border border-black/10 font-bold hidden sm:inline-block">
              {tracks.length} TRACKS
            </span>
          </div>
        </div>

        {/* Live Diagnostics Section */}
        <div className="bg-black/[0.03] border border-black/15 rounded-2xl p-3.5 text-xs font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-black/10">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-black" />
              <span className="font-bold text-[11px] uppercase tracking-wider text-black">
                Catalogue Diagnostics
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                  catalogueDiagnostic?.status === 200
                    ? 'bg-black/10 text-black border border-black/20'
                    : 'bg-black text-white'
                }`}
              >
                HTTP {catalogueDiagnostic?.status ?? (isLoadingCatalogue ? '...' : '---')}
              </span>
              {onRefreshCatalogue && (
                <button
                  onClick={onRefreshCatalogue}
                  disabled={isLoadingCatalogue}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/5 hover:bg-black/15 border border-black/20 text-black text-[10px] font-bold cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                  title="Retry catalogue fetch & clear cache"
                >
                  <RotateCw className={`w-2.5 h-2.5 ${isLoadingCatalogue ? 'animate-spin' : ''}`} />
                  {isLoadingCatalogue ? 'Retrying...' : 'Retry'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-[10px]">
            <div className="bg-white/60 border border-black/10 rounded-xl p-2 flex flex-col">
              <span className="text-black/50 uppercase font-semibold text-[9px]">Endpoint</span>
              <span className="font-bold text-black truncate mt-0.5">
                {catalogueDiagnostic?.endpoint || '/api/songs'}
              </span>
            </div>
            <div className="bg-white/60 border border-black/10 rounded-xl p-2 flex flex-col">
              <span className="text-black/50 uppercase font-semibold text-[9px]">Songs Returned</span>
              <span className="font-bold text-black mt-0.5">
                {catalogueDiagnostic?.songCount ?? (tracks.length > 0 ? tracks.length : 0)}
              </span>
            </div>
          </div>

          {(catalogueDiagnostic?.error || catalogueError) && (
            <div className="mt-2 text-[10px] bg-white/70 border border-black/15 rounded-xl p-2.5 text-black/80 leading-relaxed">
              <span className="font-bold text-black uppercase text-[9px] block mb-0.5">
                Sanitized Error Message
              </span>
              <p className="font-sans text-black/70">
                {catalogueDiagnostic?.error || catalogueError}
              </p>
              {requiresAccessKey && (
                <p className="mt-1 text-[9px] font-mono text-black/60">
                  Worker API requires <code className="font-bold text-black">BHOOMIFY_KEY</code> server secret to match the Worker&apos;s <code className="font-bold text-black">ACCESS_KEY</code>.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Minimalist Search Box */}
        {tracks.length > 0 && (
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-4 flex items-center text-black/40 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search playlist by title or artist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/[0.03] border border-black/10 hover:border-black/20 focus:border-black/50 focus:ring-1 focus:ring-black/50 rounded-2xl py-2.5 pl-11 pr-14 text-sm text-black placeholder-black/40 focus:outline-none transition-all duration-300"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-black/50 hover:text-black cursor-pointer"
              >
                CLEAR
              </button>
            )}
          </div>
        )}
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
        {isLoadingCatalogue && tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <RotateCw className="w-7 h-7 text-black animate-spin mb-3 opacity-70" />
            <h3 className="text-sm font-bold text-black font-display tracking-tight">Connecting to Cloudflare Worker...</h3>
            <p className="text-xs text-black/50 mt-1 max-w-xs leading-relaxed">
              Fetching music catalogue from Ronit-CodeWizard/wizard-resources
            </p>
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 rounded-full border border-dashed border-black/25 flex items-center justify-center mb-4 bg-black/[0.02]">
              <Disc3 className="w-8 h-8 text-black/40" />
            </div>
            <h3 className="text-base font-bold text-black font-display tracking-tight">Your Playlist is Empty</h3>
            <p className="text-xs text-black/50 mt-1 max-w-xs leading-relaxed">
              Sync with your Cloudflare Worker to discover BHO songs or upload audio files directly from your device.
            </p>
            <div className="flex items-center gap-2 mt-5">
              {onRefreshCatalogue && (
                <button
                  onClick={onRefreshCatalogue}
                  disabled={isLoadingCatalogue}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black hover:bg-black/85 text-white text-xs font-mono font-bold tracking-wider cursor-pointer active:scale-95 transition-all shadow-md disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 text-white ${isLoadingCatalogue ? 'animate-spin' : ''}`} />
                  SYNC WORKER SONGS
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/5 hover:bg-black/10 border border-black/15 text-black text-xs font-mono font-bold tracking-wider cursor-pointer active:scale-95 transition-all"
              >
                <Upload className="w-3.5 h-3.5 text-black" />
                UPLOAD AUDIO
              </button>
            </div>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-black/40">
            <p className="text-sm font-medium">No tracks found matching &ldquo;{searchQuery}&rdquo;</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 text-xs font-mono font-bold text-black underline underline-offset-4 cursor-pointer"
            >
              Reset Search
            </button>
          </div>
        ) : (
          filteredTracks.map(({ track, originalIndex }) => {
            const isCurrent = currentTrack?.id === track.id;
            const isLiked = likedTrackIds.includes(track.id);
            const inQueue = queue.includes(track.id);
            const trackNumber = String(originalIndex + 1).padStart(2, '0');

            return (
              <div
                key={track.id}
                draggable
                onDragStart={(e) => handleDragStart(e, originalIndex)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, originalIndex)}
                className={`relative flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 select-none group ${
                  isCurrent
                    ? 'bg-black/[0.05] border-black/35 shadow-[0_4px_20px_rgba(0,0,0,0.06)] ring-1 ring-black/15'
                    : 'bg-white/70 border-black/10 hover:bg-black/[0.03] hover:border-black/25 shadow-sm'
                }`}
              >
                {/* Drag Handle */}
                <div
                  className="cursor-grab active:cursor-grabbing p-1 text-black/25 hover:text-black/70 transition-colors mr-1"
                  title="Drag to reorder"
                >
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Track Index or Play Action Indicator */}
                <div
                  onClick={() => {
                    if (isCurrent) {
                      togglePlay();
                    } else {
                      playTrack(originalIndex);
                    }
                  }}
                  className="w-7 sm:w-8 flex items-center justify-center cursor-pointer shrink-0"
                >
                  {isCurrent && isPlaying ? (
                    <div className="flex items-end gap-0.5 h-3.5">
                      <span className="w-0.5 h-full bg-black animate-pulse" />
                      <span className="w-0.5 h-2/3 bg-black animate-bounce" />
                      <span className="w-0.5 h-4/5 bg-black animate-pulse" />
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-mono font-bold text-black/40 group-hover:hidden">
                        {trackNumber}
                      </span>
                      <Play className="w-3.5 h-3.5 text-black fill-black hidden group-hover:block" />
                    </>
                  )}
                </div>

                {/* Track Details Wrapper */}
                <div
                  onClick={() => playTrack(originalIndex)}
                  className="flex items-center flex-1 min-w-0 cursor-pointer ml-1 sm:ml-2"
                >
                  {/* Stylized Vinyl Disc Art */}
                  <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 shadow-md border border-black/15 bg-black">
                    {/* Vinyl Grooves texture rings */}
                    <div className="absolute inset-1 rounded-full border border-white/[0.08] pointer-events-none" />
                    <div className="absolute inset-2 rounded-full border border-white/[0.08] pointer-events-none" />
                    
                    {/* Spinning Inner Label */}
                    <div className={`w-full h-full flex items-center justify-center ${isCurrent && isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''}`}>
                      <div className="w-8 h-8 rounded-full overflow-hidden relative border border-black/40">
                        <MonochromeDiscLabel track={track} size="sm" />
                      </div>
                    </div>

                    {/* Hover Play/Pause overlay */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                      {isCurrent && isPlaying ? (
                        <Pause className="w-4 h-4 text-white fill-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      )}
                    </div>
                  </div>

                  {/* Title & Artist info */}
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className={`text-sm sm:text-[14.5px] font-bold truncate tracking-tight ${
                        isCurrent ? 'text-black' : 'text-black/90'
                      }`}>
                        {track.title}
                      </h3>
                      {track.source === 'worker' && (
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 bg-black/5 text-black border border-black/15 rounded font-bold shrink-0 tracking-wider"
                          title="Cloudflare BHO Worker Audio"
                        >
                          BHO
                        </span>
                      )}
                      {track.googleDriveFileId && (
                        <span title="Synced with Google Drive">
                          <Cloud className="w-3.5 h-3.5 text-black/60 shrink-0" />
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[9px] font-mono px-2 py-0.5 bg-black text-white rounded-full font-bold tracking-wider shrink-0">
                          NOW PLAYING
                        </span>
                      )}
                      {inQueue && !isCurrent && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 bg-black/10 text-black rounded font-semibold shrink-0">
                          QUEUED
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 text-xs text-black/50 truncate">
                      {track.artist}
                    </p>
                  </div>
                </div>

                {/* Track duration and quick action controls */}
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span className="text-xs font-mono font-medium text-black/50 group-hover:text-black transition-colors hidden sm:inline-block">
                    {track.duration}
                  </span>

                  {/* Favorite Button */}
                  <div className="relative">
                    <button
                      onClick={(e) => handleTrackLikeClick(track.id, e)}
                      className="p-2 rounded-full hover:bg-black/10 cursor-pointer transition-all active:scale-90"
                      title={isLiked ? 'Favorited' : 'Unfavorited'}
                    >
                      <Heart
                        className={`w-4 h-4 transition-all ${
                          isLiked
                            ? 'fill-black text-black drop-shadow-[0_0_5px_rgba(0,0,0,0.35)]'
                            : 'text-black/25 hover:text-black'
                        }`}
                      />
                    </button>
                    {cloudTrackId === track.id && (
                      <div className="absolute right-0 top-9 z-50">
                        <CloudPopup
                          tailDirection="up"
                          onClose={() => setCloudTrackId(null)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Action Menu Trigger */}
                  <button
                    onClick={(e) => toggleActionMenu(track.id, e)}
                    className="p-2 rounded-full hover:bg-black/10 text-black/40 hover:text-black transition-colors cursor-pointer"
                    title="Queue Actions"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Action Dropdown Menu */}
                {activeMenuTrackId === track.id && (
                  <div className="absolute right-4 top-14 bg-white border border-black/15 rounded-2xl p-1.5 shadow-2xl z-30 min-w-[150px] text-xs">
                    {inQueue ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromQueue(track.id);
                          setActiveMenuTrackId(null);
                        }}
                        className="w-full text-left px-3 py-2 text-black/75 hover:text-black hover:bg-black/5 rounded-xl font-medium cursor-pointer"
                      >
                        Remove from queue
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToQueue(track.id);
                          setActiveMenuTrackId(null);
                        }}
                        className="w-full text-left px-3 py-2 text-black/75 hover:text-black hover:bg-black/5 rounded-xl font-medium cursor-pointer"
                      >
                        Add to queue
                      </button>
                    )}
                    {onRemoveTrack && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveTrack(track.id);
                          setActiveMenuTrackId(null);
                        }}
                        className="w-full text-left px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl font-medium cursor-pointer border-t border-black/5 mt-1"
                      >
                        Delete from playlist
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
