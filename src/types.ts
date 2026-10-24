export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string; // MM:SS formatted string
  durationSec: number; // Duration in seconds
  coverUrl: string;
  audioUrl: string;
  googleDriveFileId?: string;
  blobUrl?: string;
  filename?: string;
  size?: number;
  source?: 'worker' | 'custom' | 'local';
}

export type TabType = 'playlist' | 'now-playing' | 'equalizer' | 'home' | 'profile';

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  isRepeat: 'none' | 'all' | 'one';
  currentTrackIndex: number;
  likedTrackIds: string[];
  queue: string[]; // List of track IDs
}
