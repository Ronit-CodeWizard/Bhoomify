import { motion } from 'motion/react';
import { Home, ListMusic, Bell, Sparkles } from 'lucide-react';
import { TabType, Track } from '../types';

interface NavigationBarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  currentTrack: Track;
  isPlaying: boolean;
}

export function NavigationBar({
  activeTab,
  setActiveTab,
  currentTrack,
  isPlaying,
}: NavigationBarProps) {
  const tabs = [
    { id: 'home' as TabType, icon: Home, label: 'Home' },
    { id: 'playlist' as TabType, icon: ListMusic, label: 'Playlist' },
    { id: 'now-playing' as TabType, isCenter: true },
    { id: 'equalizer' as TabType, icon: Sparkles, label: 'Visualizer' },
    { id: 'profile' as TabType, icon: Bell, label: 'Activity' },
  ];

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-[360px] z-40">
      <div 
        id="navbar-capsule"
        className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[32px] px-5 py-3 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {tabs.map((tab, idx) => {
          if (tab.isCenter) {
            const isActive = activeTab === 'now-playing';
            return (
              <button
                key={tab.id}
                id={`nav-btn-${tab.id}`}
                onClick={() => setActiveTab('now-playing')}
                className="relative flex items-center justify-center w-12 h-12 focus:outline-none group cursor-pointer"
              >
                {/* 3D Glowing Orb representing current track cover */}
                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <motion.div
                  animate={{
                    rotate: isPlaying ? 360 : 0,
                    scale: isActive ? 1.15 : 1,
                  }}
                  transition={{
                    rotate: { repeat: Infinity, duration: 8, ease: 'linear' },
                    scale: { type: 'spring', stiffness: 300, damping: 20 },
                  }}
                  className={`w-10 h-10 rounded-full overflow-hidden border-2 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)] ${
                    isActive ? 'border-purple-400 scale-110' : 'border-white/20'
                  }`}
                >
                  <img
                    src={currentTrack?.coverUrl}
                    alt={currentTrack?.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>

                {/* Glowing Purple light underneath the center button if active */}
                {isActive && (
                  <motion.div
                    layoutId="nav-glow"
                    className="absolute -bottom-4 w-12 h-5 bg-purple-500/70 rounded-full blur-md -z-10"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          }

          const IconComponent = tab.icon!;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-btn-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center justify-center p-3 focus:outline-none group cursor-pointer"
            >
              <IconComponent
                className={`w-5 h-5 transition-all duration-300 ${
                  isActive
                    ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] scale-110'
                    : 'text-white/40 group-hover:text-white/70'
                }`}
              />

              {/* Glowing Indicator Line or Dot beneath the active item */}
              {isActive && (
                <motion.div
                  layoutId="nav-glow"
                  className="absolute -bottom-3 w-8 h-4 bg-purple-500/60 rounded-full blur-md -z-10"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
