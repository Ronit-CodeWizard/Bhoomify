import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Play, Pause, GripVertical, Plus, Heart, Trash2, ListOrdered, ChevronUp, Cloud } from 'lucide-react';
import { Track, PlayerState } from '../types';

interface PlaylistScreenProps {
  tracks: Track[];
  currentTrack: Track;
  state: PlayerState;
  playTrack: (index: number) => void;
  togglePlay: () => void;
  reorderPlaylist: (startIndex: number, endIndex: number) => void;
  toggleLike: (trackId: string) => void;
  addToQueue: (trackId: string) => void;
  removeFromQueue: (trackId: string) => void;
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
}: PlaylistScreenProps) {
  const { isPlaying, currentTrackIndex, likedTrackIds, queue } = state;
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);

  // Search filter
  const filteredTracks = tracks.map((track, originalIndex) => ({ track, originalIndex }))
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

  const handleDragOver = (e: React.DragEvent, index: number) => {
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

  return (
    <div id="playlist-screen" className="flex flex-col h-full text-white px-5 pt-6 relative overflow-hidden">
      {/* Search Header */}
      <div className="relative mb-6">
        <span className="absolute inset-y-0 left-4 flex items-center text-white/30 pointer-events-none">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Search songs or artists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/5 hover:border-white/10 focus:border-purple-500/50 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-white/20 focus:outline-none transition-all duration-300 shadow-inner"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white"
          >
            clear
          </button>
        )}
      </div>

      {/* Playlist Heading */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold font-display tracking-tight text-white/90 flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-purple-400" />
          Tracks
        </h2>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/10">
          {tracks.length} Available
        </span>
      </div>

      {/* Scrollable Track List */}
      <div className="flex-1 overflow-y-auto pr-1 pb-44 space-y-2.5 custom-scrollbar">
        {filteredTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/30">
            <p className="text-sm">No songs match your search.</p>
          </div>
        ) : (
          filteredTracks.map(({ track, originalIndex }, listIdx) => {
            const isCurrent = currentTrack?.id === track.id;
            const isLiked = likedTrackIds.includes(track.id);
            const inQueue = queue.includes(track.id);

            return (
              <motion.div
                key={track.id}
                draggable
                onDragStart={(e) => handleDragStart(e, originalIndex)}
                onDragOver={(e) => handleDragOver(e, originalIndex)}
                onDrop={(e) => handleDrop(e, originalIndex)}
                className={`relative flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 select-none group ${
                  isCurrent
                    ? 'bg-purple-500/15 border-purple-500/30 shadow-[0_4px_15px_rgba(168,85,247,0.15)]'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 hover:shadow-md'
                }`}
              >
                {/* Drag handle */}
                <div 
                  className="cursor-grab active:cursor-grabbing p-1 text-white/20 hover:text-white/40 transition-colors mr-1"
                  title="Drag to reorder"
                >
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Track Details Wrapper */}
                <div 
                  onClick={() => playTrack(originalIndex)}
                  className="flex items-center flex-1 min-w-0 cursor-pointer"
                >
                  {/* Rounded Thumbnail */}
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {/* Hover Play/Pause overlay */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isCurrent && isPlaying ? (
                        <Pause className="w-4 h-4 text-white fill-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      )}
                    </div>
                  </div>

                  {/* Title & Artist info */}
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className={`text-sm font-semibold truncate ${
                        isCurrent ? 'text-purple-300' : 'text-white/90'
                      }`}>
                        {track.title}
                      </h3>
                      {track.googleDriveFileId && (
                        <Cloud className="w-3.5 h-3.5 text-green-400 shrink-0" title="Synced with Google Drive" />
                      )}
                    </div>
                    <p className="text-xs text-white/40 truncate mt-0.5">{track.artist}</p>
                  </div>
                </div>

                {/* Track duration and quick action controls */}
                <div className="flex items-center gap-2.5 ml-2">
                  <span className="text-xs font-medium text-white/30 group-hover:text-white/50 transition-colors">
                    {track.duration}
                  </span>

                  <button
                    onClick={() => toggleLike(track.id)}
                    className="p-1 cursor-pointer"
                  >
                    <Heart
                      className={`w-4 h-4 transition-all ${
                        isLiked 
                          ? 'fill-pink-500 text-pink-500 drop-shadow-[0_0_5px_rgba(236,72,153,0.6)]' 
                          : 'text-white/20 hover:text-white/60'
                      }`}
                    />
                  </button>

                  {/* Action Sheets/Menu triggers */}
                  <button
                    onClick={(e) => toggleActionMenu(track.id, e)}
                    className="p-1 text-white/20 hover:text-white/60 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Inline Popover Options Sheet */}
                <AnimatePresence>
                  {activeMenuTrackId === track.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-2 top-14 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl p-1.5 shadow-2xl z-30 flex flex-col min-w-[140px]"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (inQueue) {
                            removeFromQueue(track.id);
                          } else {
                            addToQueue(track.id);
                          }
                          setActiveMenuTrackId(null);
                        }}
                        className="flex items-center gap-2 text-left text-xs px-2.5 py-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-purple-400" />
                        {inQueue ? 'Remove queue' : 'Add to queue'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playTrack(originalIndex);
                          setActiveMenuTrackId(null);
                        }}
                        className="flex items-center gap-2 text-left text-xs px-2.5 py-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 text-green-400" />
                        Play Now
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Backdrop overlay to close floating action popups */}
      {activeMenuTrackId && (
        <div 
          className="absolute inset-0 z-20" 
          onClick={() => setActiveMenuTrackId(null)}
        />
      )}
    </div>
  );
}
