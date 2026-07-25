import { useState, useEffect, useRef } from 'react';
import { Track, PlayerState } from '../types';
import { tracks as initialTracks } from '../data/tracks';

export function useAudioPlayer() {
  const [tracks, setTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem('aura_tracks');
    if (saved) {
      try {
        const parsed: Track[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.warn('Error parsing cached tracks:', e);
      }
    }
    return [];
  });

  const [totalPlays, setTotalPlays] = useState<number>(() => {
    const saved = localStorage.getItem('aura_total_plays');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [timeStreamedSec, setTimeStreamedSec] = useState<number>(() => {
    const saved = localStorage.getItem('aura_time_streamed_sec');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem('aura_total_plays', totalPlays.toString());
  }, [totalPlays]);

  useEffect(() => {
    localStorage.setItem('aura_time_streamed_sec', timeStreamedSec.toString());
  }, [timeStreamedSec]);

  const [state, setState] = useState<PlayerState>(() => {
    const savedLiked = localStorage.getItem('aura_liked');
    const savedVolume = localStorage.getItem('aura_volume');
    const savedShuffle = localStorage.getItem('aura_shuffle');
    const savedRepeat = localStorage.getItem('aura_repeat');
    return {
      isPlaying: false,
      currentTime: 0,
      duration: 180, // Fallback duration
      volume: savedVolume ? parseFloat(savedVolume) : 0.8,
      isMuted: false,
      isShuffle: savedShuffle === 'true',
      isRepeat: (savedRepeat as 'none' | 'all' | 'one') || 'all',
      currentTrackIndex: 0,
      likedTrackIds: savedLiked ? JSON.parse(savedLiked) : [],
      queue: [],
    };
  });

  useEffect(() => {
    localStorage.setItem('aura_shuffle', state.isShuffle.toString());
  }, [state.isShuffle]);

  useEffect(() => {
    localStorage.setItem('aura_repeat', state.isRepeat);
  }, [state.isRepeat]);

  const [playError, setPlayError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Web Audio refs for spectral visualizer
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const handleTrackEndedRef = useRef<() => void>(() => {});

  // Initialize analyser node
  const initAnalyser = () => {
    if (!audioRef.current) return;
    if (analyserRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128; // gives 64 frequency bins, perfect for our spectrum
      analyser.smoothingTimeConstant = 0.75;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch (err) {
      console.warn('Web Audio API is not supported or failed to init:', err);
    }
  };

  // Initialize Audio
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous'; // Important for CORS security with AudioContext
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setState((prev) => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setState((prev) => ({ ...prev, duration: audio.duration }));
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setState((prev) => ({ ...prev, duration: audio.duration }));
      }
    };

    const handleEnded = () => {
      handleTrackEndedRef.current();
    };

    const handleError = () => {
      console.warn('Audio loading failed, switching to simulated playback');
      // If a track fails, we don't crash, we let it simulate so the visualizer and timers still animate
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const currentTrack = tracks[state.currentTrackIndex] || tracks[0];

  // Fetch local music folder tracks on mount
  useEffect(() => {
    const loadLocalTracks = async () => {
      const fallbackTracks: Track[] = [
        {
          id: "github-0-chahun-main-ya-naa",
          title: "Chahun Main Ya Naa",
          artist: "Bhoomika",
          album: "Aura Sessions",
          duration: "4:00",
          durationSec: 240,
          coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop",
          audioUrl: "https://raw.githubusercontent.com/Ronit-CodeWizard/wizard-resources/main/Musics/BHO/Chahun%20Main%20Ya%20Naa%20-%20BHO.mp3",
        },
        {
          id: "github-1-ishq-mubarak",
          title: "Ishq Mubarak",
          artist: "Bhoomika",
          album: "Aura Sessions",
          duration: "4:00",
          durationSec: 240,
          coverUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=500&auto=format&fit=crop",
          audioUrl: "https://raw.githubusercontent.com/Ronit-CodeWizard/wizard-resources/main/Musics/BHO/Ishq%20Mubarak%20-%20BHO.mp3",
        },
        {
          id: "github-2-jeena-jeena",
          title: "Jeena Jeena",
          artist: "Bhoomika",
          album: "Aura Sessions",
          duration: "4:00",
          durationSec: 240,
          coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop",
          audioUrl: "https://raw.githubusercontent.com/Ronit-CodeWizard/wizard-resources/main/Musics/BHO/Jeena%20Jeena%20-%20BHO.mp3",
        },
        {
          id: "github-3-nazar-na-lag-jaaye",
          title: "Nazar Na Lag Jaaye",
          artist: "Bhoomika",
          album: "Aura Sessions",
          duration: "4:00",
          durationSec: 240,
          coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop",
          audioUrl: "https://raw.githubusercontent.com/Ronit-CodeWizard/wizard-resources/main/Musics/BHO/Nazar%20Na%20Lag%20Jaaye%20-%20BHO.mp3",
        },
        {
          id: "github-4-saiyaara",
          title: "Saiyaara",
          artist: "Bhoomika",
          album: "Aura Sessions",
          duration: "4:00",
          durationSec: 240,
          coverUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=500&auto=format&fit=crop",
          audioUrl: "https://raw.githubusercontent.com/Ronit-CodeWizard/wizard-resources/main/Musics/BHO/Saiyaara%20-%20BHO.mp3",
        },
        {
          id: "github-5-tum-ho-toh",
          title: "Tum Ho Toh",
          artist: "Bhoomika",
          album: "Aura Sessions",
          duration: "4:00",
          durationSec: 240,
          coverUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=500&auto=format&fit=crop",
          audioUrl: "https://raw.githubusercontent.com/Ronit-CodeWizard/wizard-resources/main/Musics/BHO/Tum%20Ho%20Toh%20-%20BHO.mp3",
        },
      ];

      let fetchedTracks: Track[] = [];

      try {
        // Step 1: Attempt to fetch from local API endpoint
        const response = await fetch('/api/tracks');
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const localTracks = await response.json() as Track[];
            if (localTracks && localTracks.length > 0) {
              fetchedTracks = localTracks;
            }
          }
        }
      } catch (err) {
        console.warn('Local tracks endpoint not reachable, fetching directly from GitHub...', err);
      }

      // Step 2: If local endpoint didn't return tracks, fetch directly from GitHub
      if (fetchedTracks.length === 0) {
        try {
          const ghResponse = await fetch('https://api.github.com/repos/Ronit-CodeWizard/wizard-resources/contents/Musics/BHO');
          if (ghResponse.ok) {
            const files = await ghResponse.json() as any[];
            if (Array.isArray(files) && files.length > 0) {
              const audioFiles = files.filter(
                (f) => f.type === 'file' && f.name.toLowerCase().endsWith('.mp3')
              );

              const coverImages = [
                "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=500&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=500&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=500&auto=format&fit=crop"
              ];

              fetchedTracks = audioFiles.map((file, index) => {
                let title = file.name.replace(/\.[^/.]+$/, ""); // Strip extension
                if (title.includes(" - ")) {
                  title = title.split(" - ")[0];
                } else if (title.includes("-")) {
                  title = title.split("-")[0];
                }
                title = title.trim();

                return {
                  id: `github-${index}-${encodeURIComponent(file.name)}`,
                  title: title || "Untitled Track",
                  artist: "Bhoomika",
                  album: "Aura Sessions",
                  duration: "4:00",
                  durationSec: 240,
                  coverUrl: coverImages[index % coverImages.length],
                  audioUrl: file.download_url || `https://raw.githubusercontent.com/Ronit-CodeWizard/wizard-resources/main/Musics/BHO/${encodeURIComponent(file.name)}`,
                };
              });
            }
          }
        } catch (ghErr) {
          console.warn('Direct GitHub fetch failed, loading static premium fallbacks', ghErr);
        }
      }

      // Step 3: Use static tracks if both failed
      if (fetchedTracks.length === 0) {
        fetchedTracks = fallbackTracks;
      }

      // Restore custom duration / info from localStorage
      const savedStr = localStorage.getItem('aura_tracks');
      let savedTracks: Track[] = [];
      if (savedStr) {
        try {
          savedTracks = JSON.parse(savedStr);
        } catch (e) {}
      }

      const mergedTracks = fetchedTracks.map((track) => {
        const saved = savedTracks.find((t) => t.id === track.id);
        if (saved) {
          return {
            ...track,
            duration: saved.duration || track.duration,
            durationSec: saved.durationSec || track.durationSec,
          };
        }
        return track;
      });

      setTracks(mergedTracks);

      // Preload metadata to resolve correct audio duration in the background
      mergedTracks.forEach((track) => {
        if (track.audioUrl && (!track.durationSec || track.durationSec === 240)) {
          const tempAudio = new Audio();
          tempAudio.src = track.audioUrl;
          tempAudio.preload = 'metadata';
          tempAudio.addEventListener('loadedmetadata', () => {
            if (tempAudio.duration && !isNaN(tempAudio.duration)) {
              const durationSec = tempAudio.duration;
              const mins = Math.floor(durationSec / 60);
              const secs = Math.floor(durationSec % 60);
              const durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

              setTracks((prevTracks) => {
                const updated = [...prevTracks];
                const trackIdx = updated.findIndex((t) => t.id === track.id);
                if (trackIdx !== -1) {
                  updated[trackIdx] = {
                    ...updated[trackIdx],
                    duration: durationStr,
                    durationSec: Math.floor(durationSec),
                  };
                }
                return updated;
              });
            }
          });
        }
      });
    };

    loadLocalTracks();
  }, []);

  // Update audio source when track index changes
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    const audio = audioRef.current;
    const wasPlaying = state.isPlaying;

    audio.src = currentTrack.audioUrl;
    audio.load();
    
    // Reset timer
    setState((prev) => ({ 
      ...prev, 
      currentTime: 0, 
      duration: currentTrack.durationSec || 240 
    }));

    if (wasPlaying) {
      setTimeout(() => {
        playAudio(true); // Pass true to register play counter for new song
      }, 50);
    }
  }, [state.currentTrackIndex]);

  // Update volume
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = state.isMuted ? 0 : state.volume;
    localStorage.setItem('aura_volume', state.volume.toString());
  }, [state.volume, state.isMuted]);

  // Save liked tracks
  useEffect(() => {
    localStorage.setItem('aura_liked', JSON.stringify(state.likedTrackIds));
  }, [state.likedTrackIds]);

  // Save track ordering
  useEffect(() => {
    localStorage.setItem('aura_tracks', JSON.stringify(tracks));
  }, [tracks]);

  // Track listening time in real-time
  useEffect(() => {
    if (!state.isPlaying) return;
    const interval = setInterval(() => {
      setTimeStreamedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [state.isPlaying]);

  // Simulation fallback for browser-blocked autoplay or dead links
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startSimulation = () => {
    if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    simulationTimerRef.current = setInterval(() => {
      setState((prev) => {
        const nextTime = prev.currentTime + 1;
        if (nextTime >= prev.duration) {
          clearInterval(simulationTimerRef.current!);
          setTimeout(() => handleTrackEndedRef.current(), 100);
          return { ...prev, currentTime: 0 };
        }
        return { ...prev, currentTime: nextTime };
      });
    }, 1000);
  };

  const stopSimulation = () => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
  };

  const playAudio = async (isNewTrack = false) => {
    if (!audioRef.current) return;
    setPlayError(null);
    try {
      // Initialize analyser on user gesture
      initAnalyser();

      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      stopSimulation();
      if (isNewTrack || !state.isPlaying) {
        setTotalPlays((p) => p + 1);
      }
      setState((prev) => ({ ...prev, isPlaying: true }));
      await audioRef.current.play();
    } catch (err: any) {
      console.warn('Playback block or issue:', err);
      if (err.name === 'NotAllowedError') {
        setPlayError('Interaction required to play audio');
      }
      // Start simulated playback so the circular vinyl and seekbar still animate!
      if (isNewTrack || !state.isPlaying) {
        setTotalPlays((p) => p + 1);
      }
      setState((prev) => ({ ...prev, isPlaying: true }));
      startSimulation();
    }
  };

  const pauseAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    stopSimulation();
    setState((prev) => ({ ...prev, isPlaying: false }));
  };

  const togglePlay = () => {
    if (state.isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const playTrack = (index: number, forcePlay = false) => {
    if (index < 0 || index >= tracks.length) return;
    if (index === state.currentTrackIndex && !forcePlay) {
      if (!state.isPlaying) {
        playAudio();
      } else {
        pauseAudio();
      }
    } else {
      setState((prev) => ({ ...prev, currentTrackIndex: index, isPlaying: true }));
      if (index === state.currentTrackIndex && forcePlay) {
        if (audioRef.current) {
          audioRef.current.src = tracks[index].audioUrl;
          audioRef.current.load();
        }
        setState((prev) => ({ 
          ...prev, 
          currentTime: 0, 
          duration: tracks[index].durationSec || 240,
          isPlaying: true
        }));
        setTimeout(() => {
          playAudio(true);
        }, 50);
      }
    }
  };

  const next = () => {
    if (tracks.length === 0) return;
    if (state.queue.length > 0) {
      const nextTrackId = state.queue[0];
      const nextIndex = tracks.findIndex((t) => t.id === nextTrackId);
      setState((prev) => ({
        ...prev,
        queue: prev.queue.slice(1),
        currentTrackIndex: nextIndex !== -1 ? nextIndex : (prev.currentTrackIndex + 1) % tracks.length,
        isPlaying: true,
      }));
      return;
    }

    if (state.isShuffle) {
      if (tracks.length <= 1) {
        playTrack(0, true);
      } else {
        let randIndex = state.currentTrackIndex;
        while (randIndex === state.currentTrackIndex) {
          randIndex = Math.floor(Math.random() * tracks.length);
        }
        playTrack(randIndex, true);
      }
    } else {
      const nextIndex = (state.currentTrackIndex + 1) % tracks.length;
      playTrack(nextIndex, true);
    }
  };

  const prev = () => {
    if (tracks.length === 0) return;
    if (state.isShuffle) {
      if (tracks.length <= 1) {
        playTrack(0, true);
      } else {
        let randIndex = state.currentTrackIndex;
        while (randIndex === state.currentTrackIndex) {
          randIndex = Math.floor(Math.random() * tracks.length);
        }
        playTrack(randIndex, true);
      }
    } else {
      const prevIndex = (state.currentTrackIndex - 1 + tracks.length) % tracks.length;
      playTrack(prevIndex, true);
    }
  };

  const handleTrackEnded = () => {
    if (state.isRepeat === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        playAudio();
      }
    } else if (state.isRepeat === 'all') {
      next();
    } else {
      // none
      if (state.currentTrackIndex < tracks.length - 1) {
        next();
      } else {
        pauseAudio();
      }
    }
  };
  handleTrackEndedRef.current = handleTrackEnded;

  const seek = (time: number) => {
    if (!audioRef.current) return;
    const clampedTime = Math.max(0, Math.min(time, state.duration));
    audioRef.current.currentTime = clampedTime;
    setState((prev) => ({ ...prev, currentTime: clampedTime }));
  };

  const setVolume = (vol: number) => {
    const clampedVol = Math.max(0, Math.min(vol, 1));
    setState((prev) => ({ ...prev, volume: clampedVol, isMuted: clampedVol === 0 }));
  };

  const toggleMute = () => {
    setState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const toggleShuffle = () => {
    setState((prev) => ({ ...prev, isShuffle: !prev.isShuffle }));
  };

  const toggleRepeat = () => {
    setState((prev) => {
      let nextRepeat: 'none' | 'all' | 'one' = 'none';
      if (prev.isRepeat === 'none') nextRepeat = 'all';
      else if (prev.isRepeat === 'all') nextRepeat = 'one';
      return { ...prev, isRepeat: nextRepeat };
    });
  };

  const toggleLike = (trackId: string) => {
    setState((prev) => {
      const isLiked = prev.likedTrackIds.includes(trackId);
      const likedTrackIds = isLiked
        ? prev.likedTrackIds.filter((id) => id !== trackId)
        : [...prev.likedTrackIds, trackId];
      return { ...prev, likedTrackIds };
    });
  };

  const reorderPlaylist = (startIndex: number, endIndex: number) => {
    if (startIndex < 0 || startIndex >= tracks.length || endIndex < 0 || endIndex >= tracks.length) return;
    const result = [...tracks];
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    // Adjust current playing index to maintain playing song
    const currentPlayingTrack = tracks[state.currentTrackIndex];
    const newPlayingIndex = result.findIndex((t) => t.id === currentPlayingTrack.id);

    setTracks(result);
    setState((prev) => ({
      ...prev,
      currentTrackIndex: newPlayingIndex !== -1 ? newPlayingIndex : 0,
    }));
  };

  const addToQueue = (trackId: string) => {
    setState((prev) => {
      if (prev.queue.includes(trackId)) return prev;
      return { ...prev, queue: [...prev.queue, trackId] };
    });
  };

  const removeFromQueue = (trackId: string) => {
    setState((prev) => ({
      ...prev,
      queue: prev.queue.filter((id) => id !== trackId),
    }));
  };

  return {
    tracks,
    currentTrack,
    state,
    playError,
    audioElement: audioRef.current,
    analyserNode: analyserRef.current,
    totalPlays,
    timeStreamedSec,
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
  };
}
export type UseAudioPlayerType = ReturnType<typeof useAudioPlayer>;
