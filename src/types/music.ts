export type ProceduralSoundType = 'lofi' | 'synthwave' | 'ambient' | 'bass' | 'cyber';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverGradient: string;
  genre: string;
  audioUrl?: string; // Blob URL for user-uploaded audio
  isProcedural: boolean;
  proceduralType?: ProceduralSoundType;
  isLiked?: boolean;
  bpm?: number;
  dateAdded: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverGradient: string;
  trackIds: string[];
  createdAt: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface EqualizerBands {
  subBass: number; // 60Hz (-12 to +12 dB)
  bass: number;    // 250Hz
  mids: number;    // 1000Hz
  upperMids: number; // 4000Hz
  treble: number;  // 12000Hz
}

export type EqualizerPreset = 'flat' | 'bass-boost' | 'vocal' | 'chill' | 'electronic';
