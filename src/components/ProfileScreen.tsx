import { useState } from 'react';
import { Clock, Music, Heart, Volume2, Keyboard, Check, User, ArrowLeft } from 'lucide-react';
import { PlayerState, Track } from '../types';

interface ProfileScreenProps {
  state: PlayerState;
  tracks: Track[];
  playTrack: (index: number) => void;
  setVolume: (vol: number) => void;
  totalPlays: number;
  timeStreamedSec: number;
  onBackToPlayer?: () => void;
}

export function ProfileScreen({
  state,
  tracks,
  playTrack,
  setVolume,
  totalPlays,
  timeStreamedSec,
  onBackToPlayer,
}: ProfileScreenProps) {
  const { likedTrackIds, volume } = state;
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const likedTracks = tracks.filter((t) => likedTrackIds.includes(t.id));

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause music' },
    { key: '→ / ←', desc: 'Seek forward / backward 5s' },
    { key: '↑ / ↓', desc: 'Raise / Lower volume' },
    { key: 'M', desc: 'Toggle instant Mute' },
    { key: 'N', desc: 'Skip to next song' },
    { key: 'P', desc: 'Go back to previous' },
  ];

  const formatTimeStreamed = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (seconds < 3600) {
      const remainingSecs = seconds % 60;
      return `${minutes}m ${remainingSecs}s`;
    }
    const hours = seconds / 3600;
    if (hours < 10) {
      return `${hours.toFixed(1)} hrs`;
    }
    return `${Math.floor(hours)} hrs`;
  };

  const stats = [
    { label: 'Time Streamed', value: formatTimeStreamed(timeStreamedSec), icon: Clock },
    { label: 'Saved Tracks', value: likedTrackIds.length.toString(), icon: Heart },
    { label: 'Total Plays', value: totalPlays.toLocaleString(), icon: Music },
  ];

  const handleCopy = (keyText: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(keyText);
    setTimeout(() => setCopiedKey(null), 1000);
  };

  return (
    <div id="profile-screen" className="flex flex-col h-full text-black px-5 pt-6 pb-28 overflow-y-auto custom-scrollbar bg-transparent">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-6">
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
        <div className="relative w-14 h-14 rounded-2xl bg-black/5 border border-black/15 flex items-center justify-center text-black shadow-inner">
          <User className="w-7 h-7 text-black" />
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-black border-2 border-white rounded-full" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight text-black truncate max-w-[200px]">Rohan</h2>
          <p className="text-xs font-mono text-black/50 mt-0.5 uppercase tracking-wider font-semibold">
            BHOOMIFY VIP LISTENER
          </p>
        </div>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-black/[0.03] border border-black/10 p-3 rounded-2xl flex flex-col items-center text-center shadow-sm hover:bg-black/[0.06] transition-colors"
            >
              <Icon className="w-4 h-4 text-black mb-1.5" />
              <span className="text-sm font-bold text-black font-mono">{stat.value}</span>
              <span className="text-[9px] font-mono text-black/50 uppercase tracking-widest mt-1">
                {stat.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Master Volume Controller */}
      <div className="bg-black/[0.03] border border-black/10 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold text-black/70 uppercase tracking-wider flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-black" />
            Master Audio Output
          </span>
          <span className="text-xs font-mono font-bold text-black">
            {Math.round(volume * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full h-1.5 cursor-pointer accent-black"
        />
      </div>

      {/* Liked Tracks list */}
      <div className="mb-6">
        <h3 className="text-xs font-mono font-bold text-black/60 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-black" />
          Saved Bhoomika Tracks ({likedTracks.length})
        </h3>
        {likedTracks.length === 0 ? (
          <div className="bg-black/[0.02] border border-black/5 rounded-2xl p-4 text-center text-xs text-black/40">
            Tap the heart icon on any track to save it here.
          </div>
        ) : (
          <div className="space-y-2">
            {likedTracks.map((track) => (
              <div
                key={track.id}
                onClick={() => {
                  const idx = tracks.findIndex((t) => t.id === track.id);
                  if (idx !== -1) playTrack(idx);
                }}
                className="flex items-center justify-between p-2.5 bg-black/[0.03] border border-black/10 hover:border-black/20 rounded-xl cursor-pointer transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-black truncate">{track.title}</p>
                  <p className="text-[10px] text-black/50 truncate">{track.artist}</p>
                </div>
                <span className="text-xs font-mono text-black/50 ml-2">{track.duration}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Reference */}
      <div className="bg-black/[0.03] border border-black/10 rounded-2xl p-4">
        <h3 className="text-xs font-mono font-bold text-black/60 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Keyboard className="w-3.5 h-3.5 text-black" />
          Hotkeys Quick Reference
        </h3>
        <div className="space-y-2 text-xs">
          {shortcuts.map((sc, i) => (
            <div key={i} className="flex items-center justify-between py-1 border-b border-black/5 last:border-none">
              <span className="text-black/70">{sc.desc}</span>
              <button
                onClick={() => handleCopy(sc.key)}
                className="px-2 py-0.5 bg-white border border-black/20 rounded text-[10px] font-mono font-bold text-black hover:border-black/50 transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                title="Click to copy shortcut"
              >
                {copiedKey === sc.key ? (
                  <Check className="w-3 h-3 text-black" />
                ) : (
                  sc.key
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
