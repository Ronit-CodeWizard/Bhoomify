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
}

export type TabType = 'home' | 'playlist' | 'now-playing' | 'equalizer' | 'profile';

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
