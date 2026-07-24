import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { NavigationBar } from './components/NavigationBar';
import { VinylPlayer } from './components/VinylPlayer';
import { PlaylistScreen } from './components/PlaylistScreen';
import { MiniPlayer } from './components/MiniPlayer';
import { EqualizerScreen } from './components/EqualizerScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { TabType, Track } from './types';
import { Sparkles, Compass, Flame, Leaf, VolumeX, Keyboard } from 'lucide-react';

export default function App() {
  const player = useAudioPlayer();
  const {
    tracks,
    currentTrack,
    state,
    playError,
    togglePlay,
    playTrack,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    reorderPlaylist,
    addToQueue,
    removeFromQueue,
  } = player;

  const { isPlaying, currentTime, volume, isMuted } = state;

  const [activeTab, setActiveTab] = useState<TabType>('now-playing');
  const [rightPanelTab, setRightPanelTab] = useState<TabType>('playlist');
  const [showShortcutOverlay, setShowShortcutOverlay] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if the user is typing in search input
      if (document.activeElement?.tagName === 'INPUT') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(currentTime + 5);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(currentTime - 5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'KeyN':
          next();
          break;
        case 'KeyP':
          prev();
          break;
        case 'KeyL':
          toggleLike(currentTrack?.id);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, seek, currentTime, setVolume, volume, toggleMute, next, prev, toggleLike, currentTrack]);

  // Mood filter utility for Home screen
  const playMood = (moodType: 'chill' | 'energy' | 'focus') => {
    let targetIndex = 0;
    if (moodType === 'chill') {
      // Find Saiyaara or Ishq Mubarak
      targetIndex = tracks.findIndex((t) => t.id === 'saiyaara' || t.id === 'ishq-mubarak');
    } else if (moodType === 'energy') {
      // Find Tum Ho Toh or Nazar Na Lag Jaaye
      targetIndex = tracks.findIndex((t) => t.id === 'tum-ho-toh' || t.id === 'nazar-na-lag-jaaye');
    } else if (moodType === 'focus') {
      // Find Chahun Main Ya Naa or Jeena Jeena
      targetIndex = tracks.findIndex((t) => t.id === 'chahun-main-ya-naa' || t.id === 'jeena-jeena');
    }
    if (targetIndex !== -1) {
      playTrack(targetIndex);
    }
  };

  const renderTabContent = (tab: TabType) => {
    switch (tab) {
      case 'home':
        return (
          <div id="home-dashboard" className="flex flex-col h-full text-white px-5 pt-6 pb-40 overflow-y-auto custom-scrollbar">
            <div className="mb-6">
              <span className="text-[10px] font-bold tracking-widest text-purple-400 uppercase bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full">
                Discovery Hub
              </span>
              <h2 className="text-2xl font-bold font-display tracking-tight mt-2.5">
                Hello, Ronit
              </h2>
              <p className="text-xs text-white/40 mt-1">Ready for some modern premium sounds?</p>
            </div>

            {/* Premium Mood Selectors */}
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              Tune Your Mood
            </h3>
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              <div
                onClick={() => playMood('chill')}
                className="bg-gradient-to-br from-violet-900/40 to-black/40 border border-violet-500/10 hover:border-violet-500/30 p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <Leaf className="w-4 h-4 text-violet-400" />
                </div>
                <span className="text-xs font-bold text-white">Chill</span>
                <span className="text-[9px] text-white/40 mt-1">Ambient Beats</span>
              </div>

              <div
                onClick={() => playMood('energy')}
                className="bg-gradient-to-br from-pink-900/40 to-black/40 border border-pink-500/10 hover:border-pink-500/30 p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group"
              >
                <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <Flame className="w-4 h-4 text-pink-400" />
                </div>
                <span className="text-xs font-bold text-white">Energy</span>
                <span className="text-[9px] text-white/40 mt-1">High-Tempo</span>
              </div>

              <div
                onClick={() => playMood('focus')}
                className="bg-gradient-to-br from-cyan-900/40 to-black/40 border border-cyan-500/10 hover:border-cyan-500/30 p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group"
              >
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-xs font-bold text-white">Focus</span>
                <span className="text-[9px] text-white/40 mt-1">Post-Rock Ambient</span>
              </div>
            </div>

            {/* Featured Track Showcase */}
            {tracks.length > 0 ? (
              <>
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Spotlight Sound
                </h3>
                <div className="relative bg-gradient-to-r from-purple-950/40 to-pink-950/20 border border-white/5 rounded-2xl p-4 overflow-hidden flex items-center justify-between shadow-lg mb-6">
                  {/* Light beams */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
                  <div className="flex items-center gap-3.5 z-10">
                    <img
                      src={tracks[0].coverUrl}
                      alt={tracks[0].title}
                      className="w-12 h-12 rounded-xl object-cover shadow-md"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">Featured Hit</h4>
                      <h3 className="text-sm font-bold text-white mt-0.5">{tracks[0].title}</h3>
                      <p className="text-[11px] text-white/50 mt-0.5">{tracks[0].artist}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => playTrack(0)}
                    className="relative z-10 bg-white hover:bg-white/90 text-black text-[10px] font-bold px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    Listen
                  </button>
                </div>
              </>
            ) : (
              <div className="relative bg-white/5 border border-white/5 rounded-2xl p-5 text-center shadow-lg mb-6">
                <p className="text-xs text-white/50">
                  Your music files folder is currently empty. Put some audio files in <code className="bg-white/10 px-1.5 py-0.5 rounded text-purple-300 text-[11px]">/public/musicfiles</code> to scan them automatically.
                </p>
              </div>
            )}

            {/* Helper tips card */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
              <Keyboard className="w-5 h-5 text-purple-400 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-white">Pro Tip: Desktop Shortcuts</h4>
              <p className="text-[11px] text-white/40 mt-1 max-w-[220px] mx-auto">
                Press <span className="text-purple-300 font-bold bg-black/40 px-1 py-0.5 rounded">Space</span> to toggle play/pause or use arrow keys to control seek and volume.
              </p>
            </div>
          </div>
        );
      case 'playlist':
        return (
          <PlaylistScreen
            tracks={tracks}
            currentTrack={currentTrack}
            state={state}
            playTrack={playTrack}
            togglePlay={togglePlay}
            reorderPlaylist={reorderPlaylist}
            toggleLike={toggleLike}
            addToQueue={addToQueue}
            removeFromQueue={removeFromQueue}
          />
        );
      case 'equalizer':
        return <EqualizerScreen state={state} currentTrack={currentTrack} analyserNode={player.analyserNode} />;
      case 'profile':
        return (
          <ProfileScreen
            state={state}
            tracks={tracks}
            playTrack={playTrack}
            setVolume={setVolume}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none antialiased">
      {/* Background radial atmosphere color blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-900/20 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-pink-900/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-[35%] left-[45%] w-[45%] h-[45%] rounded-full bg-violet-800/10 blur-[120px] pointer-events-none animate-pulse" />

      {/* Keyboard cheat-sheet floating button */}
      <button
        onClick={() => setShowShortcutOverlay(!showShortcutOverlay)}
        className="fixed top-4 right-4 z-50 bg-black/40 border border-white/10 hover:border-white/20 p-2.5 rounded-xl cursor-pointer hover:scale-105 active:scale-95 transition-all text-white/60 hover:text-white flex items-center gap-2 text-xs shadow-md"
        title="Show Keyboard Shortcuts"
      >
        <Keyboard className="w-4 h-4" />
        <span className="hidden sm:inline font-semibold">Shortcuts</span>
      </button>

      {/* Main layout container (dual panel on desktop, single mockup panel on mobile) */}
      <div className="w-full max-w-5xl flex items-center justify-center gap-10 z-10 h-auto">
        
        {/* DESKTOP ONLY: Left Side Now Playing Panel (Fixed device) */}
        <div className="hidden lg:block w-[390px] h-[760px] rounded-[48px] bg-black/60 border border-white/15 shadow-[0_30px_70px_rgba(0,0,0,0.8)] relative overflow-hidden">
          {/* Glass Gradient Sheet top-half background */}
          <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-purple-900/35 via-pink-900/10 to-transparent pointer-events-none" />

          {/* Core Player Content */}
          <VinylPlayer
            currentTrack={currentTrack}
            tracks={tracks}
            state={state}
            playError={playError}
            togglePlay={togglePlay}
            next={next}
            prev={prev}
            seek={seek}
            toggleShuffle={toggleShuffle}
            toggleRepeat={toggleRepeat}
            toggleLike={toggleLike}
            playTrack={playTrack}
            onOpenMenu={() => setRightPanelTab('profile')}
          />

          {/* Navigation bar fixed on left panel */}
          <NavigationBar
            activeTab="now-playing"
            setActiveTab={(tab) => {
              if (tab !== 'now-playing') {
                setRightPanelTab(tab);
              }
            }}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
          />
        </div>

        {/* DESKTOP ONLY: Right Side Dashboard Tabs Panel (Fixed device) */}
        <div className="hidden lg:block w-[390px] h-[760px] rounded-[48px] bg-black/60 border border-white/15 shadow-[0_30px_70px_rgba(0,0,0,0.8)] relative overflow-hidden">
          {/* Glass Gradient Sheet top-half background */}
          <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-purple-950/20 via-neutral-950/10 to-transparent pointer-events-none" />

          {/* Right Panel View Switching */}
          <div className="h-full relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={rightPanelTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                {renderTabContent(rightPanelTab)}
              </motion.div>
            </AnimatePresence>

            {/* Sync floating mini player on right device screen if playing and NOT on playlist */}
            {rightPanelTab !== 'playlist' && isPlaying && (
              <MiniPlayer
                currentTrack={currentTrack}
                state={state}
                togglePlay={togglePlay}
                next={next}
                onExpand={() => setRightPanelTab('playlist')}
              />
            )}

            {/* Navigation tabs row */}
            <NavigationBar
              activeTab={rightPanelTab}
              setActiveTab={(tab) => {
                if (tab === 'now-playing') {
                  // Scroll action or ignore
                } else {
                  setRightPanelTab(tab);
                }
              }}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
            />
          </div>
        </div>

        {/* RESPONSIVE MOBILE VIEWPORT (Single Device Frame) */}
        <div className="block lg:hidden w-full max-w-[390px] h-[760px] rounded-[48px] bg-black/60 border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
          {/* Glass Gradient background */}
          <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-purple-900/30 via-neutral-950/10 to-transparent pointer-events-none" />

          {/* Active View content */}
          <div className="h-full relative">
            <AnimatePresence mode="wait">
              {activeTab === 'now-playing' ? (
                <motion.div
                  key="now-playing-tab"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="h-full"
                >
                  <VinylPlayer
                    currentTrack={currentTrack}
                    tracks={tracks}
                    state={state}
                    playError={playError}
                    togglePlay={togglePlay}
                    next={next}
                    prev={prev}
                    seek={seek}
                    toggleShuffle={toggleShuffle}
                    toggleRepeat={toggleRepeat}
                    toggleLike={toggleLike}
                    playTrack={playTrack}
                    onOpenMenu={() => setActiveTab('profile')}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={`${activeTab}-tab`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.25 }}
                  className="h-full"
                >
                  {renderTabContent(activeTab)}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating Mini Player (only when NOT on 'now-playing' screen) */}
            {activeTab !== 'now-playing' && (
              <MiniPlayer
                currentTrack={currentTrack}
                state={state}
                togglePlay={togglePlay}
                next={next}
                onExpand={() => setActiveTab('now-playing')}
              />
            )}

            {/* Navigation tab bar */}
            <NavigationBar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
            />
          </div>
        </div>

      </div>

      {/* Muted indicator overlay if muted */}
      {isMuted && (
        <div className="fixed bottom-4 left-4 z-40 bg-purple-500/20 border border-purple-500/40 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]">
          <VolumeX className="w-3.5 h-3.5 animate-bounce" />
          <span>Muted</span>
        </div>
      )}

      {/* Floating Keyboard Shortcuts Cheat Sheet Modal */}
      <AnimatePresence>
        {showShortcutOverlay && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b0a0f] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <h3 className="text-lg font-bold font-display text-white mb-1">Keyboard Shortcuts</h3>
              <p className="text-xs text-white/40 mb-4">Master control commands for Aura Player</p>
              
              <div className="space-y-2.5 mb-6">
                {shortcuts.map((sh, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-none">
                    <span className="text-white/60">{sh.desc}</span>
                    <span className="px-2.5 py-1 bg-black border border-white/10 text-[10px] font-bold rounded-lg text-purple-300 tracking-wider">
                      {sh.key}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowShortcutOverlay(false)}
                className="w-full bg-purple-500 hover:bg-purple-600 active:scale-95 text-black font-bold text-xs py-3 rounded-2xl transition-all cursor-pointer shadow-[0_4px_12px_rgba(168,85,247,0.3)]"
              >
                Close Panel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const shortcuts = [
  { key: 'Space', desc: 'Play / Pause track' },
  { key: '→', desc: 'Skip forward 5 seconds' },
  { key: '←', desc: 'Rewind back 5 seconds' },
  { key: '↑', desc: 'Increase master volume' },
  { key: '↓', desc: 'Decrease master volume' },
  { key: 'M', desc: 'Toggle instant mute state' },
  { key: 'N', desc: 'Skip track' },
  { key: 'P', desc: 'Previous track' },
  { key: 'L', desc: 'Like / Favourite track' },
];
