import "dotenv/config";
import express from "express";
import path from "path";
import { Readable } from "stream";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  const DEFAULT_WORKER_BASE_URL =
    "https://cw-resource.official-ronit-codewizard.workers.dev";

  const getWorkerBaseUrl = (): string => {
    const candidate = process.env.BHO_WORKER_BASE_URL?.trim();
    if (candidate) {
      try {
        const parsed = new URL(candidate);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
          return candidate.replace(/\/+$/, "");
        }
      } catch {
        // Not a valid URL (e.g. key or token accidentally pasted into BHO_WORKER_BASE_URL)
      }
    }
    return DEFAULT_WORKER_BASE_URL;
  };

  const getBhoomifyKey = (): string => {
    // 1. Primary: BHOOMIFY_KEY
    const primaryKey = process.env.BHOOMIFY_KEY?.trim();
    if (primaryKey) return primaryKey;

    // 2. Legacy server variable fallback: BHO_WORKER_ACCESS_KEY
    const legacyKey = process.env.BHO_WORKER_ACCESS_KEY?.trim();
    if (legacyKey) return legacyKey;

    // 3. Fallback if the user accidentally configured their BHO key under BHO_WORKER_BASE_URL
    const misconfiguredEnv = process.env.BHO_WORKER_BASE_URL?.trim();
    if (
      misconfiguredEnv &&
      !misconfiguredEnv.startsWith("http://") &&
      !misconfiguredEnv.startsWith("https://")
    ) {
      return misconfiguredEnv;
    }

    return "";
  };

  // 1. Health check endpoint for Cloudflare Worker & server integration
  app.get("/api/bho/health", async (_req, res) => {
    const workerUrl = getWorkerBaseUrl();
    try {
      const upstreamRes = await fetch(`${workerUrl}/`, {
        method: "GET",
        headers: { "cache-control": "no-cache" },
      });
      const data = await upstreamRes.json().catch(() => null);
      const accessKeyConfigured = Boolean(getBhoomifyKey());

      return res.json({
        status: "ok",
        workerOnline: upstreamRes.ok,
        workerStatus: upstreamRes.status,
        workerUrl,
        accessKeyConfigured,
        workerData: data,
      });
    } catch (err: any) {
      return res.status(502).json({
        status: "error",
        workerOnline: false,
        workerUrl,
        accessKeyConfigured: Boolean(getBhoomifyKey()),
        error: err.message || String(err),
      });
    }
  });

  // Fallback list of GitHub repository files if GitHub web is temporarily unreachable
  const BHO_GITHUB_TRACK_FILES = [
    {
      name: "Chahun Main Ya Naa - BHO.mp3",
      filename: "Chahun Main Ya Naa - BHO.mp3",
      title: "Chahun Main Ya Naa",
      artist: "BHOOMIKA",
      author: "BHOOMIKA",
      size: 563796,
      streamUrl: "/api/song?name=" + encodeURIComponent("Chahun Main Ya Naa - BHO.mp3"),
    },
    {
      name: "Ik Mulaqaat - BHO.mp3",
      filename: "Ik Mulaqaat - BHO.mp3",
      title: "Ik Mulaqaat",
      artist: "BHOOMIKA",
      author: "BHOOMIKA",
      size: 164039,
      streamUrl: "/api/song?name=" + encodeURIComponent("Ik Mulaqaat - BHO.mp3"),
    },
    {
      name: "Ishq Mubarak - BHO.mp3",
      filename: "Ishq Mubarak - BHO.mp3",
      title: "Ishq Mubarak",
      artist: "BHOOMIKA",
      author: "BHOOMIKA",
      size: 641026,
      streamUrl: "/api/song?name=" + encodeURIComponent("Ishq Mubarak - BHO.mp3"),
    },
    {
      name: "Jeena Jeena - BHO.mp3",
      filename: "Jeena Jeena - BHO.mp3",
      title: "Jeena Jeena",
      artist: "BHOOMIKA",
      author: "BHOOMIKA",
      size: 459949,
      streamUrl: "/api/song?name=" + encodeURIComponent("Jeena Jeena - BHO.mp3"),
    },
    {
      name: "Nazar Na Lag Jaaye - BHO.mp3",
      filename: "Nazar Na Lag Jaaye - BHO.mp3",
      title: "Nazar Na Lag Jaaye",
      artist: "BHOOMIKA",
      author: "BHOOMIKA",
      size: 495413,
      streamUrl: "/api/song?name=" + encodeURIComponent("Nazar Na Lag Jaaye - BHO.mp3"),
    },
    {
      name: "Rata Lambiya Kaliya Ni Samiye - BHO.mp3",
      filename: "Rata Lambiya Kaliya Ni Samiye - BHO.mp3",
      title: "Rata Lambiya Kaliya Ni Samiye",
      artist: "BHOOMIKA",
      author: "BHOOMIKA",
      size: 123021,
      streamUrl: "/api/song?name=" + encodeURIComponent("Rata Lambiya Kaliya Ni Samiye - BHO.mp3"),
    },
    {
      name: "Saiyaara - BHO.mp3",
      filename: "Saiyaara - BHO.mp3",
      title: "Saiyaara",
      artist: "BHOOMIKA",
      author: "BHOOMIKA",
      size: 913893,
      streamUrl: "/api/song?name=" + encodeURIComponent("Saiyaara - BHO.mp3"),
    },
    {
      name: "Tum Ho Toh - BHO.mp3",
      filename: "Tum Ho Toh - BHO.mp3",
      title: "Tum Ho Toh",
      artist: "BHOOMIKA",
      author: "BHOOMIKA",
      size: 477909,
      streamUrl: "/api/song?name=" + encodeURIComponent("Tum Ho Toh - BHO.mp3"),
    },
  ];

  let githubSongsCache: any[] | null = null;
  let githubCacheTime = 0;
  const GITHUB_CACHE_TTL_MS = 60 * 1000;

  const fetchSongsDirectlyFromGithub = async () => {
    const now = Date.now();
    if (githubSongsCache && now - githubCacheTime < GITHUB_CACHE_TTL_MS) {
      return githubSongsCache;
    }

    try {
      const url = "https://github.com/Ronit-CodeWizard/wizard-resources/tree/main/Musics/BHO";
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (!res.ok) {
        throw new Error(`GitHub returned HTTP ${res.status}`);
      }

      const html = await res.text();
      const regex = /href="\/Ronit-CodeWizard\/wizard-resources\/blob\/main\/Musics\/BHO\/([^"]+\.mp3)"/gi;
      let match;
      const files = new Set<string>();
      while ((match = regex.exec(html)) !== null) {
        files.add(decodeURIComponent(match[1]));
      }

      const songs = Array.from(files)
        .map((filename) => {
          const cleanTitle = filename
            .replace(/\s*-\s*bho(?:\.mp3)?$/i, "")
            .replace(/\.mp3$/i, "")
            .trim();

          return {
            name: filename,
            filename,
            title: cleanTitle,
            artist: "BHOOMIKA",
            author: "BHOOMIKA",
            streamUrl: `/api/song?name=${encodeURIComponent(filename)}`,
          };
        });

      if (songs.length > 0) {
        githubSongsCache = songs;
        githubCacheTime = now;
        return songs;
      }
    } catch (err: any) {
      console.warn("Error dynamically fetching catalogue from GitHub:", err?.message || err);
      if (githubSongsCache && githubSongsCache.length > 0) {
        return githubSongsCache;
      }
    }

    return BHO_GITHUB_TRACK_FILES;
  };

  const resolveBhoSongFilename = (rawName: string): string => {
    const decoded = decodeURIComponent(rawName).trim();
    // Direct match
    const exact = BHO_GITHUB_TRACK_FILES.find(
      (f) => f.filename.toLowerCase() === decoded.toLowerCase() || f.name.toLowerCase() === decoded.toLowerCase()
    );
    if (exact) return exact.filename;

    // Stripped match
    const clean = decoded
      .replace(/\s*-\s*bho(?:\.mp3)?$/i, "")
      .replace(/\.mp3$/i, "")
      .replace(/-/g, " ")
      .trim()
      .toLowerCase();

    const matched = BHO_GITHUB_TRACK_FILES.find((f) => {
      const fClean = f.filename
        .replace(/\s*-\s*bho(?:\.mp3)?$/i, "")
        .replace(/\.mp3$/i, "")
        .replace(/-/g, " ")
        .trim()
        .toLowerCase();
      return fClean === clean;
    });

    if (matched) return matched.filename;
    return decoded.endsWith(".mp3") ? decoded : `${decoded} - BHO.mp3`;
  };

  // 2. Music catalogue proxy endpoint: GET /api/songs and GET /api/tracks
  const handleGetSongs = async (_req: express.Request, res: express.Response) => {
    try {
      // Exclusively fetch the songs dynamically from GitHub
      const songs = await fetchSongsDirectlyFromGithub();

      return res.json({
        repository: "Ronit-CodeWizard/wizard-resources",
        folder: "Musics/BHO",
        source: "github-only",
        songs,
      });
    } catch (err: any) {
      console.error("Failed to load songs from GitHub:", err);
      return res.json({
        repository: "Ronit-CodeWizard/wizard-resources",
        folder: "Musics/BHO",
        source: "github-only",
        songs: BHO_GITHUB_TRACK_FILES,
      });
    }
  };

  app.get("/api/songs", handleGetSongs);
  app.get("/api/tracks", handleGetSongs);

  // 3. Audio streaming proxy endpoint: GET /api/song?name=... and GET /api/stream?name=...
  const handleStreamSong = async (req: express.Request, res: express.Response) => {
    const rawSongName = (req.query.name || req.query.song || req.query.title) as string | undefined;

    if (!rawSongName || typeof rawSongName !== "string" || !rawSongName.trim()) {
      return res.status(400).json({ error: "Missing required 'name' query parameter." });
    }

    const songName = rawSongName.trim();
    const accessKey = getBhoomifyKey();
    const workerUrl = getWorkerBaseUrl();
    const resolvedFilename = resolveBhoSongFilename(songName);

    // 1. First attempt streaming via Cloudflare Worker if access key is configured
    if (accessKey) {
      const targetUrl = `${workerUrl}/song?name=${encodeURIComponent(songName)}`;
      try {
        const headers: Record<string, string> = {
          "x-access-key": accessKey,
        };
        if (req.headers.range) {
          headers["range"] = req.headers.range;
        }

        let upstreamRes = await fetch(targetUrl, { method: "GET", headers });

        if (upstreamRes.status === 404 && resolvedFilename !== songName) {
          const altTargetUrl = `${workerUrl}/song?name=${encodeURIComponent(resolvedFilename)}`;
          const altRes = await fetch(altTargetUrl, { method: "GET", headers });
          if (altRes.ok || altRes.status === 206) {
            upstreamRes = altRes;
          }
        }

        if (upstreamRes.ok || upstreamRes.status === 206) {
          res.status(upstreamRes.status);
          const forwardHeaders = [
            "content-type",
            "content-length",
            "content-range",
            "accept-ranges",
            "cache-control",
            "etag",
            "last-modified",
          ];
          for (const h of forwardHeaders) {
            const val = upstreamRes.headers.get(h);
            if (val) res.setHeader(h, val);
          }
          if (!res.getHeader("content-type")) res.setHeader("content-type", "audio/mpeg");
          if (!res.getHeader("accept-ranges")) res.setHeader("accept-ranges", "bytes");

          if (!upstreamRes.body) return res.end();
          const stream = Readable.fromWeb(upstreamRes.body as any);
          stream.on("error", (streamErr) => {
            console.error("Stream error while piping audio from Worker:", streamErr);
            if (!res.headersSent) res.status(500).end();
          });
          return stream.pipe(res);
        }
      } catch (err: any) {
        console.warn("Worker streaming failed, falling back to GitHub raw storage:", err?.message || err);
      }
    }

    // 2. Stream directly from GitHub Musics/BHO repository
    try {
      const githubRawUrl = `https://raw.githubusercontent.com/Ronit-CodeWizard/wizard-resources/main/Musics/BHO/${encodeURIComponent(resolvedFilename)}`;
      const githubHeaders: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 Bhoomify/1.0",
      };
      if (req.headers.range) {
        githubHeaders["range"] = req.headers.range;
      }

      const githubRes = await fetch(githubRawUrl, {
        method: "GET",
        headers: githubHeaders,
      });

      if (!githubRes.ok && githubRes.status !== 206) {
        return res.status(githubRes.status).json({
          error: "NOT_FOUND",
          message: `Track '${songName}' (${resolvedFilename}) could not be retrieved from Musics/BHO.`,
          status: githubRes.status,
        });
      }

      res.status(githubRes.status);
      const forwardHeaders = [
        "content-type",
        "content-length",
        "content-range",
        "accept-ranges",
        "cache-control",
        "etag",
        "last-modified",
      ];
      for (const h of forwardHeaders) {
        const val = githubRes.headers.get(h);
        if (val) res.setHeader(h, val);
      }

      if (!res.getHeader("content-type")) res.setHeader("content-type", "audio/mpeg");
      if (!res.getHeader("accept-ranges")) res.setHeader("accept-ranges", "bytes");

      if (!githubRes.body) return res.end();
      const stream = Readable.fromWeb(githubRes.body as any);
      stream.on("error", (streamErr) => {
        console.error("Stream error while piping audio from GitHub:", streamErr);
        if (!res.headersSent) res.status(500).end();
      });
      return stream.pipe(res);
    } catch (err: any) {
      console.error("Error streaming audio from GitHub Musics/BHO:", err);
      if (!res.headersSent) {
        return res.status(502).json({
          error: "STREAM_ERROR",
          message: `Failed to stream audio for '${songName}': ${err.message || String(err)}`,
        });
      }
    }
  };

  app.get("/api/song", handleStreamSong);
  app.get("/api/stream", handleStreamSong);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

