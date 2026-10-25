import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { VinylPlayer } from './components/VinylPlayer';
import { PlaylistScreen } from './components/PlaylistScreen';
import { MiniPlayer } from './components/MiniPlayer';
import { EqualizerScreen } from './components/EqualizerScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { PasswordGate } from './components/PasswordGate';
import { TabType } from './types';
import { MonochromeDiscLabel } from './components/MonochromeDiscLabel';
import {
  Sparkles,
  Compass,
  Flame,
  Leaf,
  Volume2,
  VolumeX,
  Keyboard,
  ListMusic,
  Activity,
  Radio,
  Sliders,
  ArrowLeft,
} from 'lucide-react';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    const saved = sessionStorage.getItem('aura_unlocked');
    const savedTime = sessionStorage.getItem('aura_unlocked_time');
    if (saved === 'true' && savedTime) {
      const elapsed = Date.now() - parseInt(savedTime, 10);
      if (elapsed < 10 * 60 * 1000) {
        return true;
      }
    }
    sessionStorage.removeItem('aura_unlocked');
    sessionStorage.removeItem('aura_unlocked_time');
    return false;
  });

  const handleUnlock = () => {
    sessionStorage.setItem('aura_unlocked', 'true');
    sessionStorage.setItem('aura_unlocked_time', Date.now().toString());
    setIsUnlocked(true);
  };

  const handleLock = () => {
    sessionStorage.removeItem('aura_unlocked');
    sessionStorage.removeItem('aura_unlocked_time');
    setIsUnlocked(false);
  };

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
  const [desktopRightTab, setDesktopRightTab] = useState<TabType>('playlist');
  const [showShortcutOverlay, setShowShortcutOverlay] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
          if (currentTrack) {
            toggleLike(currentTrack.id);
          }
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
    if (tracks.length === 0) return;
    let targetIndex = -1;
    if (moodType === 'chill') {
      targetIndex = tracks.findIndex(
        (t) =>
          t.id === 'saiyaara' ||
          t.id.includes('saiyaara') ||
          t.id === 'ishq-mubarak' ||
          t.id.includes('ishq-mubarak')
      );
    } else if (moodType === 'energy') {
      targetIndex = tracks.findIndex(
        (t) =>
          t.id === 'tum-ho-toh' ||
          t.id.includes('tum-ho-toh') ||
          t.id === 'nazar-na-lag-jaaye' ||
          t.id.includes('nazar-na-lag-jaaye')
      );
    } else if (moodType === 'focus') {
      targetIndex = tracks.findIndex(
        (t) =>
          t.id === 'chahun-main-ya-naa' ||
          t.id.includes('chahun-main-ya-naa') ||
          t.id === 'jeena-jeena' ||
          t.id.includes('jeena-jeena')
      );
    }
    if (targetIndex !== -1) {
      playTrack(targetIndex);
    } else if (tracks.length > 0) {
      playTrack(0);
    }
  };

  const renderTabContent = (tab: TabType, isMobile = false) => {
    switch (tab) {
      case 'home':
        return (
          <div id="home-dashboard" className="flex flex-col h-full text-black px-6 pt-6 pb-28 overflow-y-auto custom-scrollbar bg-transparent">
            {isMobile && (
              <div className="mb-4">
                <button
                  onClick={() => setActiveTab('now-playing')}
                  className="p-2.5 rounded-full bg-black/5 hover:bg-black/10 border border-black/10 text-black flex items-center justify-center cursor-pointer active:scale-95 transition-all w-fit"
                  title="Back"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="mb-6">
              <span className="text-[10px] font-mono tracking-widest text-black uppercase bg-black/5 border border-black/10 px-3 py-1 rounded-full font-semibold">
                DISCOVERY ARCHIVE
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight mt-3 text-black">
                Bhoomika Sessions
              </h2>
              <p className="text-xs text-black/50 mt-1">
                Monochromatic high-fidelity acoustics and original audio masterings.
              </p>
            </div>

            {/* Mood Selectors */}
            <h3 className="text-xs font-mono font-bold text-black/50 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-black" />
              Sonic Mood Selectors
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div
                onClick={() => playMood('chill')}
                className="bg-black/[0.02] border border-black/10 hover:border-black/30 hover:bg-black/[0.05] p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-black/5 border border-black/10 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Leaf className="w-4 h-4 text-black" />
                </div>
                <span className="text-xs font-bold text-black">Chill</span>
                <span className="text-[9px] font-mono text-black/40 mt-1 uppercase font-semibold">Saiyaara</span>
              </div>

              <div
                onClick={() => playMood('energy')}
                className="bg-black/[0.02] border border-black/10 hover:border-black/30 hover:bg-black/[0.05] p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-black/5 border border-black/10 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Flame className="w-4 h-4 text-black" />
                </div>
                <span className="text-xs font-bold text-black">Energy</span>
                <span className="text-[9px] font-mono text-black/40 mt-1 uppercase font-semibold">Tum Ho Toh</span>
              </div>

              <div
                onClick={() => playMood('focus')}
                className="bg-black/[0.02] border border-black/10 hover:border-black/30 hover:bg-black/[0.05] p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-black/5 border border-black/10 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4 text-black" />
                </div>
                <span className="text-xs font-bold text-black">Focus</span>
                <span className="text-[9px] font-mono text-black/40 mt-1 uppercase font-semibold">Jeena Jeena</span>
              </div>
            </div>

            {/* Featured Track Showcase in Inverted Monochrome */}
            {tracks.length > 0 && (
              <>
                <h3 className="text-xs font-mono font-bold text-black/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-black" />
                  Spotlight Master Track
                </h3>
                <div className="relative bg-black/[0.03] border border-black/10 rounded-2xl p-4 flex items-center justify-between shadow-sm mb-6">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-black/15 shadow-sm flex-shrink-0">
                      <MonochromeDiscLabel track={tracks[0]} size="sm" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-mono font-bold text-black/60 uppercase tracking-widest">
                        A-SIDE LEAD
                      </h4>
                      <h3 className="text-sm font-bold text-black mt-0.5">{tracks[0].title}</h3>
                      <p className="text-xs text-black/50 mt-0.5">{tracks[0].artist}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => playTrack(0)}
                    className="bg-black hover:bg-black/90 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-105"
                  >
                    PLAY
                  </button>
                </div>
              </>
            )}

            {/* Studio Note */}
            <div className="bg-black/[0.02] border border-black/10 rounded-2xl p-4 text-center mt-auto">
              <Keyboard className="w-5 h-5 text-black mx-auto mb-2 opacity-80" />
              <h4 className="text-xs font-bold text-black">Monochrome Keyboard Controls</h4>
              <p className="text-[11px] text-black/50 mt-1 max-w-sm mx-auto">
                Press <span className="font-mono bg-black/5 text-black px-1.5 py-0.5 rounded border border-black/15 font-semibold">Space</span> to play/pause, <span className="font-mono bg-black/5 text-black px-1.5 py-0.5 rounded border border-black/15 font-semibold">← / →</span> to seek, and <span className="font-mono bg-black/5 text-black px-1.5 py-0.5 rounded border border-black/15 font-semibold">M</span> to mute.
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
            onBackToPlayer={isMobile ? () => setActiveTab('now-playing') : undefined}
            onAddTracks={player.addCustomTracks}
            onRemoveTrack={player.removeTrack}
            isLoadingCatalogue={player.isLoadingCatalogue}
            catalogueError={player.catalogueError}
            requiresAccessKey={player.requiresAccessKey}
            bhoMeta={player.bhoMeta}
            catalogueDiagnostic={player.catalogueDiagnostic}
            onRefreshCatalogue={() => player.refreshCatalogue(true)}
          />
        );
      case 'equalizer':
        return (
          <EqualizerScreen
            state={state}
            currentTrack={currentTrack}
            analyserNode={player.analyserNode}
            onBackToPlayer={isMobile ? () => setActiveTab('now-playing') : undefined}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            state={state}
            tracks={tracks}
            playTrack={playTrack}
            setVolume={setVolume}
            totalPlays={player.totalPlays}
            timeStreamedSec={player.timeStreamedSec}
            onBackToPlayer={isMobile ? () => setActiveTab('now-playing') : undefined}
          />
        );
      default:
        return null;
    }
  };

  if (!isUnlocked) {
    return <PasswordGate onUnlock={handleUnlock} />;
  }

  return (
    <div className="w-full h-screen min-h-screen bg-white text-black flex flex-col overflow-hidden relative select-none font-sans selection:bg-black selection:text-white">
      {/* Background subtle radial lighting */}
      <div className="absolute inset-0 bg-radial from-black/[0.015] via-transparent to-transparent pointer-events-none" />

      <div className="absolute top-4 right-5 z-40 flex items-center gap-2 pointer-events-auto">
        {/* Quick volume toggle / slider */}
        <div className="hidden sm:flex items-center gap-2 bg-white/80 backdrop-blur-md border border-black/10 rounded-full px-2.5 py-1 shadow-sm">
          <button
            onClick={toggleMute}
            className="text-black/60 hover:text-black transition-colors cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 text-black" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-black" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 h-1 cursor-pointer accent-black"
            title={`Master Volume: ${Math.round(volume * 100)}%`}
          />
        </div>
      </div>

      {/* DESKTOP FULL SCREEN STUDIO WORKSPACE (Navbar-free split layout, White Background) */}
      <main className="hidden lg:flex flex-1 w-full h-full overflow-hidden divide-x divide-black/10">
        {/* Left Turntable Stage (Full Height, Expanded Vinyl Deck) */}
        <section className="w-1/2 h-full flex flex-col items-center justify-center relative p-8 bg-white">
          <div className="w-full max-w-lg h-full flex flex-col justify-between py-6">
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
              onOpenMenu={() => setDesktopRightTab('profile')}
              onTogglePlaylist={() => setDesktopRightTab(desktopRightTab === 'playlist' ? 'equalizer' : 'playlist')}
              onAddTracks={player.addCustomTracks}
              volume={volume}
              setVolume={setVolume}
              toggleMute={toggleMute}
              isMuted={isMuted}
            />
          </div>
        </section>

        {/* Right Studio Dashboard Stage (Full Height Tabs: Tracks, Spectrum, Discovery, Activity) */}
        <section className="w-1/2 h-full flex flex-col bg-[#fafafa] relative pt-14">
          {/* Studio Panel Tabs Switcher */}
          <div className="w-full border-b border-black/10 bg-white/70 backdrop-blur-md px-6 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1 bg-black/5 p-1 rounded-2xl border border-black/10">
              <button
                onClick={() => setDesktopRightTab('playlist')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer ${
                  desktopRightTab === 'playlist'
                    ? 'bg-black text-white shadow-md'
                    : 'text-black/50 hover:text-black'
                }`}
              >
                <ListMusic className="w-3.5 h-3.5" />
                PLAYLIST ({tracks.length})
              </button>
              <button
                onClick={() => setDesktopRightTab('equalizer')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer ${
                  desktopRightTab === 'equalizer'
                    ? 'bg-black text-white shadow-md'
                    : 'text-black/50 hover:text-black'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                SPECTRUM
              </button>
              <button
                onClick={() => setDesktopRightTab('home')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer ${
                  desktopRightTab === 'home'
                    ? 'bg-black text-white shadow-md'
                    : 'text-black/50 hover:text-black'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                DISCOVERY
              </button>
              <button
                onClick={() => setDesktopRightTab('profile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer ${
                  desktopRightTab === 'profile'
                    ? 'bg-black text-white shadow-md'
                    : 'text-black/50 hover:text-black'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                ACTIVITY
              </button>
            </div>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={desktopRightTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderTabContent(desktopRightTab)}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* MOBILE FULL SCREEN VIEW (Navbar-Free, Pure Edge-to-Edge) */}
      <main className="lg:hidden flex-1 w-full h-full relative overflow-hidden bg-white flex flex-col pt-2">
        {/* Active Tab Screen */}
        <div className="flex-1 w-full h-full relative overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'now-playing' ? (
              <motion.div
                key="now-playing-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full"
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
                  onTogglePlaylist={() => setActiveTab('playlist')}
                  onAddTracks={player.addCustomTracks}
                  volume={volume}
                  setVolume={setVolume}
                  toggleMute={toggleMute}
                  isMuted={isMuted}
                />
              </motion.div>
            ) : (
              <motion.div
                key={`${activeTab}-tab`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full"
              >
                {renderTabContent(activeTab, true)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Mini Player (only when browsing other tabs and track is loaded) */}
        {activeTab !== 'now-playing' && (
          <MiniPlayer
            currentTrack={currentTrack}
            state={state}
            togglePlay={togglePlay}
            next={next}
            onExpand={() => setActiveTab('now-playing')}
          />
        )}
      </main>

      {/* Muted Notification Banner */}
      {isMuted && (
        <div className="fixed bottom-6 left-6 z-50 bg-white/95 border border-black/20 px-4 py-2 rounded-full flex items-center gap-2 text-xs text-black shadow-xl backdrop-blur-md">
          <VolumeX className="w-4 h-4 text-black animate-pulse" />
          <span className="font-mono text-[11px] font-bold">AUDIO MUTED (PRESS M)</span>
        </div>
      )}

      {/* Inverted Monochromatic Keyboard Shortcuts Cheat Sheet Modal */}
      <AnimatePresence>
        {showShortcutOverlay && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-black/15 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-[0_25px_70px_rgba(0,0,0,0.2)] relative text-black"
            >
              <h3 className="text-xl font-bold font-display text-black mb-1">
                Studio Hotkeys
              </h3>
              <p className="text-xs text-black/50 mb-5 font-mono">
                Keyboard control bindings for Bhoomify
              </p>
              
              <div className="space-y-2 mb-6">
                {shortcuts.map((sh, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-black/10 last:border-none">
                    <span className="text-black/70 font-medium">{sh.desc}</span>
                    <span className="px-2.5 py-1 bg-black/5 border border-black/15 text-[10px] font-mono font-bold rounded-lg text-black">
                      {sh.key}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowShortcutOverlay(false)}
                className="w-full bg-black hover:bg-black/90 active:scale-95 text-white font-bold text-xs py-3 rounded-2xl transition-all cursor-pointer shadow-md"
              >
                CLOSE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const shortcuts = [
  { key: 'Space', desc: 'Play / Pause audio track' },
  { key: '→', desc: 'Skip forward 5 seconds' },
  { key: '←', desc: 'Rewind back 5 seconds' },
  { key: '↑', desc: 'Increase master volume' },
  { key: '↓', desc: 'Decrease master volume' },
  { key: 'M', desc: 'Toggle audio mute' },
  { key: 'N', desc: 'Next track' },
  { key: 'P', desc: 'Previous track' },
  { key: 'L', desc: 'Like / Save track' },
];
