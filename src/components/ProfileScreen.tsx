import { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, Music, Heart, Volume2, HelpCircle, Keyboard, Play, Sparkles, LogOut, Check, Cloud, CloudOff, Database, Loader2, AlertCircle } from 'lucide-react';
import { PlayerState, Track } from '../types';

interface ProfileScreenProps {
  state: PlayerState;
  tracks: Track[];
  playTrack: (index: number) => void;
  setVolume: (vol: number) => void;
  totalPlays: number;
  timeStreamedSec: number;
}

export function ProfileScreen({
  state,
  tracks,
  playTrack,
  setVolume,
  totalPlays,
  timeStreamedSec,
}: ProfileScreenProps) {
  const { likedTrackIds, volume } = state;
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Filter out actual liked tracks
  const likedTracks = tracks.filter((t) => likedTrackIds.includes(t.id));

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause music' },
    { key: '→ / ←', desc: 'Seek forward / backward 5s' },
    { key: '↑ / ↓', desc: 'Raise / Lower volume' },
    { key: 'M', desc: 'Toggle instant Mute' },
    { key: 'N', desc: 'Skip to next song' },
    { key: 'P', desc: 'Go back to previous' },
  ];

  const stats = [
    { label: 'Time Streamed', value: (timeStreamedSec / 3600).toFixed(4) + ' hrs', icon: Clock, color: 'text-purple-400' },
    { label: 'Saved Tracks', value: likedTrackIds.length.toString(), icon: Heart, color: 'text-pink-400' },
    { label: 'Total Plays', value: totalPlays.toLocaleString(), icon: Music, color: 'text-cyan-400' },
  ];

  const handleCopy = (keyText: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(keyText);
    setTimeout(() => setCopiedKey(null), 1000);
  };

  const userDisplayName = 'Ronit CodeWizard';
  const userPhotoUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop';

  return (
    <div id="profile-screen" className="flex flex-col h-full text-white px-5 pt-6 pb-40 overflow-y-auto custom-scrollbar">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-purple-500/30 p-0.5">
          <img
            src={userPhotoUrl}
            alt="Profile Avatar"
            className="w-full h-full object-cover rounded-xl"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-0 right-0 w-4.5 h-4.5 bg-green-500 border-[3px] border-black rounded-full" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight text-white/90 truncate max-w-[200px]">{userDisplayName}</h2>
          <p className="text-xs text-purple-400 font-semibold mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Premium Member
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
              className="bg-white/5 border border-white/5 p-3.5 rounded-2xl flex flex-col items-center text-center shadow-inner hover:bg-white/10 transition-colors"
            >
              <Icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <span className="text-sm font-bold text-white">{stat.value}</span>
              <span className="text-[9px] font-semibold text-white/30 uppercase tracking-widest mt-1">
                {stat.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Settings block: Volume control */}
      <div className="bg-white/5 border border-white/5 p-4 rounded-2xl mb-6">
        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-purple-400" />
          Master Volume Control
        </h3>
        <div className="flex items-center gap-3">
          <Volume2 className="w-4 h-4 text-white/40" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 accent-purple-500 h-1 rounded-full cursor-pointer bg-white/10"
          />
          <span className="text-xs font-bold text-white/70 min-w-[24px] text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* Shortcuts cheat sheet */}
      <div className="bg-white/5 border border-white/5 p-4 rounded-2xl mb-6">
        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-purple-400" />
          Keyboard Shortcuts
        </h3>
        <div className="space-y-2.5">
          {shortcuts.map((sh, idx) => (
            <div
              key={idx}
              onClick={() => handleCopy(sh.key)}
              className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-none group cursor-pointer"
            >
              <span className="text-white/60 group-hover:text-white transition-colors">{sh.desc}</span>
              <span className="px-2.5 py-1 bg-black/60 border border-white/10 text-[10px] font-bold rounded-lg text-purple-300 tracking-wider shadow-inner flex items-center gap-1 select-none">
                {copiedKey === sh.key ? <Check className="w-2.5 h-2.5 text-green-400" /> : null}
                {sh.key}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Liked list peek */}
      <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
          Liked Tracks ({likedTracks.length})
        </h3>
        {likedTracks.length === 0 ? (
          <p className="text-xs text-white/30 text-center py-4">No saved tracks yet. Go hit the heart icon!</p>
        ) : (
          <div className="space-y-2.5">
            {likedTracks.map((track) => {
              const trackIdx = tracks.findIndex((t) => t.id === track.id);
              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(trackIdx !== -1 ? trackIdx : 0)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-8 h-8 rounded-lg object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{track.title}</h4>
                      <p className="text-[10px] text-white/40 truncate">{track.artist}</p>
                    </div>
                  </div>
                  <Play className="w-3.5 h-3.5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
