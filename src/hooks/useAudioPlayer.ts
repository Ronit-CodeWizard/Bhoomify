import { useState, useEffect, useRef } from 'react';
import { Track, PlayerState } from '../types';
import { tracks as initialTracks } from '../data/tracks';

export function useAudioPlayer() {
  const [tracks, setTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem('aura_tracks');
    if (saved) {
      try {
        const parsed: Track[] = JSON.parse(saved);
        const initialIdsSet = new Set(initialTracks.map((t) => t.id));
        const matches = parsed.length === initialTracks.length && parsed.every((t) => initialIdsSet.has(t.id));
        if (matches) {
          return parsed;
        }
      } catch (e) {
        console.warn('Error parsing cached tracks:', e);
      }
    }
    return initialTracks;
  });

  const [totalPlays, setTotalPlays] = useState<number>(() => {
    const saved = localStorage.getItem('aura_total_plays');
    return saved ? parseInt(saved, 10) : 1482;
  });

  const [timeStreamedSec, setTimeStreamedSec] = useState<number>(() => {
    const saved = localStorage.getItem('aura_time_streamed_sec');
    return saved ? parseInt(saved, 10) : Math.floor(38.4 * 3600); // 138240 seconds
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
    return {
      isPlaying: false,
      currentTime: 0,
      duration: 180, // Fallback duration
      volume: savedVolume ? parseFloat(savedVolume) : 0.8,
      isMuted: false,
      isShuffle: false,
      isRepeat: 'all',
      currentTrackIndex: 0,
      likedTrackIds: savedLiked ? JSON.parse(savedLiked) : [],
      queue: [],
    };
  });

  const [playError, setPlayError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Web Audio refs for spectral visualizer
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

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
      handleTrackEnded();
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
      try {
        const response = await fetch('/api/tracks');
        if (response.ok) {
          const localTracks = await response.json();
          if (localTracks && localTracks.length > 0) {
            setTracks(localTracks);
          }
        }
      } catch (err) {
        console.error('Error fetching local tracks:', err);
      }
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
    setState((prev) => ({ ...prev, currentTime: 0, duration: currentTrack.durationSec }));

    if (wasPlaying) {
      setTimeout(() => {
        playAudio();
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
          setTimeout(() => handleTrackEnded(), 100);
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

  const playAudio = async () => {
    if (!audioRef.current) return;
    setPlayError(null);
    try {
      // Initialize analyser on user gesture
      initAnalyser();

      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      stopSimulation();
      setState((prev) => {
        if (!prev.isPlaying) {
          setTotalPlays((p) => p + 1);
        }
        return { ...prev, isPlaying: true };
      });
      await audioRef.current.play();
    } catch (err: any) {
      console.warn('Playback block or issue:', err);
      if (err.name === 'NotAllowedError') {
        setPlayError('Interaction required to play audio');
      }
      // Start simulated playback so the circular vinyl and seekbar still animate!
      setState((prev) => {
        if (!prev.isPlaying) {
          setTotalPlays((p) => p + 1);
        }
        return { ...prev, isPlaying: true };
      });
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

  const playTrack = (index: number) => {
    if (index < 0 || index >= tracks.length) return;
    setTotalPlays((p) => p + 1);
    setState((prev) => ({ ...prev, currentTrackIndex: index, isPlaying: true }));
    // Source useEffect will trigger loading and playback
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
      const randIndex = Math.floor(Math.random() * tracks.length);
      playTrack(randIndex);
    } else {
      const nextIndex = (state.currentTrackIndex + 1) % tracks.length;
      playTrack(nextIndex);
    }
  };

  const prev = () => {
    if (tracks.length === 0) return;
    const prevIndex = (state.currentTrackIndex - 1 + tracks.length) % tracks.length;
    playTrack(prevIndex);
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
