import { Track } from '../types';

export interface BhoWorkerSong {
  title?: string;
  name?: string;
  filename?: string;
  path?: string;
  size?: number;
  streamUrl?: string;
  url?: string;
  download_url?: string;
  artist?: string;
  album?: string;
  type?: string;
}

export interface BhoHealthResponse {
  status: string;
  workerOnline: boolean;
  workerStatus?: number;
  workerUrl: string;
  accessKeyConfigured: boolean;
  workerData?: any;
  error?: string;
}

export interface FetchCatalogueResult {
  tracks: Track[];
  rawCount: number;
  repository?: string;
  folder?: string;
  error?: string | null;
  diagnostic?: string;
  requiresKey?: boolean;
  status: number | null;
  endpoint: string;
}

export interface NormalizedPayload {
  songs: any[];
  repository: string;
  folder: string;
  error?: string;
  isRecognized: boolean;
  isEmpty: boolean;
  diagnostic: string;
}

// In-memory cache to prevent repeated fetches across rapid component re-renders
let cachedResult: FetchCatalogueResult | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

/**
 * Normalizes any variation of Cloudflare Worker / GitHub catalogue responses:
 * - Top-level JSON array ([ ... ])
 * - Common properties: songs, tracks, files, items, catalogue, catalog, playlist, music, data, result
 * - Dictionary objects with song-like items
 * - Error objects and unrecognized structures with clear diagnostics
 */
export function normalizeCataloguePayload(data: any): NormalizedPayload {
  const defaultRepo = 'Ronit-CodeWizard/wizard-resources';
  const defaultFolder = 'Musics/BHO';

  if (!data) {
    return {
      songs: [],
      repository: defaultRepo,
      folder: defaultFolder,
      error: 'Received empty or null response from server.',
      isRecognized: false,
      isEmpty: true,
      diagnostic: 'Null or undefined payload received.',
    };
  }

  // 1. Direct top-level array: e.g. [ { name: "..." }, ... ] or [ "Song1 - BHO.mp3", ... ]
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return {
        songs: [],
        repository: defaultRepo,
        folder: defaultFolder,
        error: 'Cloudflare Worker returned an empty array ([]). 0 songs were found in Musics/BHO.',
        isRecognized: true,
        isEmpty: true,
        diagnostic: 'Top-level array is empty (0 songs found).',
      };
    }
    return {
      songs: data,
      repository: defaultRepo,
      folder: defaultFolder,
      isRecognized: true,
      isEmpty: false,
      diagnostic: `Successfully found ${data.length} items in top-level array.`,
    };
  }

  // 2. Object responses
  if (typeof data === 'object') {
    const repo = data.repository || data.repo || defaultRepo;
    const folder = data.folder || data.path || data.directory || defaultFolder;

    // Check for error properties
    if (data.error && typeof data.error === 'string') {
      return {
        songs: [],
        repository: repo,
        folder,
        error: `Cloudflare Worker returned error: ${data.error}`,
        isRecognized: true,
        isEmpty: true,
        diagnostic: `Error object received from Worker: "${data.error}"`,
      };
    }

    // Check common song-array property names
    const candidateProps = [
      'songs',
      'tracks',
      'files',
      'items',
      'catalogue',
      'catalog',
      'playlist',
      'music',
      'data',
      'result',
    ];

    for (const prop of candidateProps) {
      if (Array.isArray(data[prop])) {
        const list = data[prop];
        if (list.length === 0) {
          return {
            songs: [],
            repository: repo,
            folder,
            error: `Cloudflare Worker returned 0 songs in '${prop}' array for folder '${folder}'.`,
            isRecognized: true,
            isEmpty: true,
            diagnostic: `Property '${prop}' contains an empty array (0 items).`,
          };
        }
        return {
          songs: list,
          repository: repo,
          folder,
          isRecognized: true,
          isEmpty: false,
          diagnostic: `Found ${list.length} song(s) in property '${prop}'.`,
        };
      }
    }

    // Check nested data properties (e.g. data.songs, data.tracks, data.files)
    if (data.data && typeof data.data === 'object') {
      for (const nestedProp of ['songs', 'tracks', 'files', 'items']) {
        if (Array.isArray(data.data[nestedProp])) {
          const list = data.data[nestedProp];
          if (list.length === 0) {
            return {
              songs: [],
              repository: repo,
              folder,
              error: `Cloudflare Worker returned 0 songs in 'data.${nestedProp}'.`,
              isRecognized: true,
              isEmpty: true,
              diagnostic: `'data.${nestedProp}' contains an empty array.`,
            };
          }
          return {
            songs: list,
            repository: repo,
            folder,
            isRecognized: true,
            isEmpty: false,
            diagnostic: `Found ${list.length} song(s) in 'data.${nestedProp}'.`,
          };
        }
      }
    }

    // Check if data is an object dictionary where values are song items
    const values = Object.values(data);
    const looksLikeSongDict =
      values.length > 0 &&
      values.every(
        (v) =>
          v &&
          typeof v === 'object' &&
          ('name' in v || 'title' in v || 'filename' in v || 'path' in v)
      );

    if (looksLikeSongDict) {
      return {
        songs: values,
        repository: repo,
        folder,
        isRecognized: true,
        isEmpty: false,
        diagnostic: `Parsed dictionary of ${values.length} song items.`,
      };
    }

    // Check message field if present
    if (data.message && typeof data.message === 'string') {
      return {
        songs: [],
        repository: repo,
        folder,
        error: `Cloudflare Worker returned message: ${data.message}`,
        isRecognized: true,
        isEmpty: true,
        diagnostic: `Message received without song array: "${data.message}"`,
      };
    }

    // Unrecognized object structure
    const keys = Object.keys(data);
    return {
      songs: [],
      repository: repo,
      folder,
      error: `Unrecognized Cloudflare Worker response structure. Received fields: [${keys.join(', ')}]. Expected an array or 'songs'/'tracks'/'files' property.`,
      isRecognized: false,
      isEmpty: true,
      diagnostic: `Unrecognized response keys: [${keys.join(', ')}]`,
    };
  }

  // Primitive response
  return {
    songs: [],
    repository: defaultRepo,
    folder: defaultFolder,
    error: `Unexpected response type from Cloudflare Worker: ${typeof data}. Expected JSON array or object.`,
    isRecognized: false,
    isEmpty: true,
    diagnostic: `Non-object primitive received: ${String(data).slice(0, 50)}`,
  };
}

/**
 * Normalizes title, artist, filename, and lookupName from raw song items.
 * Properly converts filenames ending in " - BHO.mp3" into valid display titles and song lookup names.
 */
export function extractSongDetails(rawItem: any): {
  filename: string;
  lookupName: string;
  cleanTitle: string;
  artist: string;
  displayTitle: string;
  size?: number;
  streamUrl?: string;
  isAudioFile: boolean;
} {
  let rawStr = '';
  let providedTitle = '';
  let streamUrl = '';
  let size: number | undefined;
  let itemType = '';

  if (typeof rawItem === 'string') {
    rawStr = rawItem.trim();
  } else if (rawItem && typeof rawItem === 'object') {
    streamUrl = rawItem.streamUrl || rawItem.url || rawItem.download_url || '';
    size = typeof rawItem.size === 'number' ? rawItem.size : undefined;
    providedTitle = typeof rawItem.title === 'string' ? rawItem.title.trim() : '';
    itemType = typeof rawItem.type === 'string' ? rawItem.type.toLowerCase() : '';
    rawStr = (
      rawItem.filename ||
      rawItem.name ||
      rawItem.path ||
      rawItem.title ||
      ''
    ).trim();
  }

  // If item is explicitly a directory, skip it
  if (itemType === 'dir') {
    return {
      filename: '',
      lookupName: '',
      cleanTitle: '',
      artist: '',
      displayTitle: '',
      isAudioFile: false,
    };
  }

  // Remove any directory path prefix (e.g. "Musics/BHO/01 - Song.mp3" -> "01 - Song.mp3")
  const filename = rawStr.split('/').pop() || rawStr;

  // Filter out non-audio files (e.g. README.md, .gitkeep, metadata JSONs)
  const lowerFile = filename.toLowerCase();
  const nonAudioExtensions = ['.md', '.txt', '.json', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.gitkeep', '.ds_store'];
  if (nonAudioExtensions.some((ext) => lowerFile.endsWith(ext))) {
    return {
      filename,
      lookupName: '',
      cleanTitle: '',
      artist: '',
      displayTitle: '',
      isAudioFile: false,
    };
  }

  // Check if a specific lookup name was embedded in streamUrl (e.g. /song?name=XYZ)
  let lookupName = '';
  if (streamUrl) {
    try {
      const parsed = new URL(streamUrl, 'http://localhost');
      const param =
        parsed.searchParams.get('name') ||
        parsed.searchParams.get('song') ||
        parsed.searchParams.get('title');
      if (param && param.trim()) {
        lookupName = param.trim();
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  // Normalize by stripping " - BHO.mp3", "-BHO.mp3", " - BHO", or ".mp3"
  // Example: "Tum Hi Ho - BHO.mp3" -> "Tum Hi Ho"
  const stripped = filename
    .replace(/\s*-\s*BHO(?:\.mp3)?$/i, '')
    .replace(/\.mp3$/i, '')
    .trim();

  // If lookupName wasn't provided in streamUrl, use the clean song name (or stripped name)
  if (!lookupName) {
    lookupName = stripped || filename;
  }

  // Determine title for display
  let cleanTitle = providedTitle || stripped || filename;
  cleanTitle = cleanTitle
    .replace(/\s*-\s*BHO(?:\.mp3)?$/i, '')
    .replace(/\.mp3$/i, '')
    .trim();

  // Remove leading numbers like "01. " or "01 - " if present
  cleanTitle = cleanTitle.replace(/^\d+[\s.-]+/, '').trim() || cleanTitle;

  // Parse artist if title is formatted as "Artist - Song"
  let artist = 'BHOOMIKA';
  let displayTitle = cleanTitle;
  if (cleanTitle.includes(' - ')) {
    const parts = cleanTitle.split(' - ');
    if (parts.length >= 2) {
      artist = parts[0].trim();
      displayTitle = parts.slice(1).join(' - ').trim();
    }
  }

  // Ensure author name is BHOOMIKA
  if (
    !artist ||
    artist.toLowerCase() === 'ronit-codewizard' ||
    artist.toLowerCase() === 'ronit codewizard' ||
    artist.toLowerCase() === 'ronit'
  ) {
    artist = 'BHOOMIKA';
  }

  return {
    filename,
    lookupName,
    cleanTitle,
    artist,
    displayTitle: displayTitle || 'BHO Track',
    size,
    streamUrl,
    isAudioFile: true,
  };
}

/**
 * Maps a single song item from Cloudflare Worker into the application's Track model
 */
export function mapWorkerSongToTrack(
  song: any,
  index: number,
  meta?: { repository?: string; folder?: string }
): Track {
  const details = extractSongDetails(song);
  const audioUrl = `/api/song?name=${encodeURIComponent(details.lookupName)}`;
  let finalArtist = song.artist || details.artist || 'BHOOMIKA';
  if (
    finalArtist.toLowerCase() === 'ronit-codewizard' ||
    finalArtist.toLowerCase() === 'ronit codewizard' ||
    finalArtist.toLowerCase() === 'ronit'
  ) {
    finalArtist = 'BHOOMIKA';
  }

  return {
    id: `bho-${encodeURIComponent(details.cleanTitle.toLowerCase().replace(/\s+/g, '-'))}-${index}`,
    title: details.displayTitle,
    artist: finalArtist,
    album: meta?.folder || 'Musics/BHO',
    duration: '--:--', // Will update upon metadata load in audio player
    durationSec: 0,
    coverUrl: '',
    audioUrl,
    filename: details.filename,
    size: details.size,
    source: 'worker',
  };
}

export const bhoMusicApi = {
  /**
   * Health check for Cloudflare Worker & server integration
   */
  async checkHealth(): Promise<BhoHealthResponse> {
    try {
      const res = await fetch('/api/bho/health', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      return await res.json();
    } catch (err: any) {
      return {
        status: 'error',
        workerOnline: false,
        workerUrl: 'https://cw-resource.official-ronit-codewizard.workers.dev',
        accessKeyConfigured: false,
        error: err.message || 'Health check failed',
      };
    }
  },

  /**
   * Fetch catalogue from Cloudflare Worker via server proxy
   */
  async fetchCatalogue(forceRefresh = false): Promise<FetchCatalogueResult> {
    const now = Date.now();
    if (!forceRefresh && cachedResult && now - lastFetchTime < CACHE_TTL_MS) {
      return cachedResult;
    }

    try {
      const response = await fetch('/api/songs', {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': forceRefresh ? 'no-cache' : 'default',
        },
      });

      // 1. 401 Unauthorized: Worker requires x-access-key
      if (response.status === 401) {
        const errorJson = await response.json().catch(() => ({}));
        const result: FetchCatalogueResult = {
          tracks: [],
          rawCount: 0,
          requiresKey: true,
          status: 401,
          endpoint: '/api/songs',
          diagnostic:
            'Cloudflare Worker returned HTTP 401 Unauthorized. Server BHOOMIFY_KEY is missing or invalid.',
          error:
            errorJson.message ||
            'Cloudflare Worker requires an access key. Please configure BHOOMIFY_KEY in server secrets.',
        };
        cachedResult = result;
        lastFetchTime = now;
        return result;
      }

      // 2. Non-200 HTTP responses (e.g. 502 Upstream Error)
      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        const diagnosticDetail =
          errorJson.diagnostic ||
          errorJson.message ||
          `HTTP error ${response.status}: ${response.statusText}`;

        const result: FetchCatalogueResult = {
          tracks: [],
          rawCount: 0,
          requiresKey: false,
          status: response.status,
          endpoint: '/api/songs',
          diagnostic: `Cloudflare Worker returned HTTP ${response.status}: ${diagnosticDetail}`,
          error: `Cloudflare Worker service error (HTTP ${response.status}): ${diagnosticDetail}`,
        };
        cachedResult = result;
        lastFetchTime = now;
        return result;
      }

      // 3. HTTP 200 OK: Normalize payload format
      const data = await response.json();
      const normalized = normalizeCataloguePayload(data);

      if (normalized.error || normalized.isEmpty) {
        const result: FetchCatalogueResult = {
          tracks: [],
          rawCount: 0,
          repository: normalized.repository,
          folder: normalized.folder,
          error: normalized.error || 'Cloudflare Worker returned an empty song list.',
          diagnostic: normalized.diagnostic || 'Received response with 0 songs.',
          requiresKey: false,
          status: 200,
          endpoint: '/api/songs',
        };
        cachedResult = result;
        lastFetchTime = now;
        return result;
      }

      // 4. Map valid songs (filtering out Ik Mulaqaat per user request)
      const validSongItems = normalized.songs.filter((song) => {
        const details = extractSongDetails(song);
        if (!details.isAudioFile) return false;
        const norm = details.cleanTitle.toLowerCase().replace(/[\s\-_]/g, '');
        return !norm.includes('ikmulaqaat');
      });

      const mappedTracks: Track[] = validSongItems.map((song, index) =>
        mapWorkerSongToTrack(song, index, {
          repository: normalized.repository,
          folder: normalized.folder,
        })
      );

      if (mappedTracks.length === 0) {
        const result: FetchCatalogueResult = {
          tracks: [],
          rawCount: 0,
          repository: normalized.repository,
          folder: normalized.folder,
          error: 'Cloudflare Worker returned items, but none were recognized as valid audio tracks (.mp3).',
          diagnostic: `Found ${normalized.songs.length} raw items, but 0 audio tracks were matched in Musics/BHO.`,
          requiresKey: false,
          status: 200,
          endpoint: '/api/songs',
        };
        cachedResult = result;
        lastFetchTime = now;
        return result;
      }

      const result: FetchCatalogueResult = {
        tracks: mappedTracks,
        rawCount: mappedTracks.length,
        repository: normalized.repository,
        folder: normalized.folder,
        error: null,
        diagnostic: `Successfully loaded ${mappedTracks.length} tracks from ${normalized.folder}.`,
        requiresKey: false,
        status: 200,
        endpoint: '/api/songs',
      };

      cachedResult = result;
      lastFetchTime = now;
      return result;
    } catch (err: any) {
      const failureResult: FetchCatalogueResult = {
        tracks: [],
        rawCount: 0,
        error: `Failed to connect to proxy endpoint /api/songs: ${err.message || String(err)}`,
        diagnostic: `Network connection error: ${err.message || String(err)}`,
        requiresKey: false,
        status: 502,
        endpoint: '/api/songs',
      };
      return failureResult;
    }
  },

  /**
   * Invalidate cache
   */
  clearCache() {
    cachedResult = null;
    lastFetchTime = 0;
  },
};
