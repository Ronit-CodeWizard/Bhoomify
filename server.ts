import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Serve track list dynamically by fetching from Ronit-CodeWizard's GitHub repository
  app.get("/api/tracks", async (req, res) => {
    // Robust static fallback representing the exact list from the GitHub repository
    const fallbackTracks = [
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

    try {
      // Fetch dynamic content list from GitHub API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout

      const response = await fetch("https://api.github.com/repos/Ronit-CodeWizard/wizard-resources/contents/Musics/BHO", {
        headers: {
          "User-Agent": "Aura-Player-App",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`GitHub API responded with status ${response.status}`);
      }

      const files = await response.json() as any[];
      if (!Array.isArray(files)) {
        throw new Error("Invalid response format from GitHub");
      }

      const audioFiles = files.filter(
        (f) => f.type === "file" && f.name.toLowerCase().endsWith(".mp3")
      );

      // Predefined covers to assign
      const coverImages = [
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=500&auto=format&fit=crop"
      ];

      const mappedTracks = audioFiles.map((file, index) => {
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

      if (mappedTracks.length > 0) {
        return res.json(mappedTracks);
      }
      return res.json(fallbackTracks);
    } catch (err) {
      console.warn("GitHub fetch failed or rate limited, using premium offline fallback:", err);
      return res.json(fallbackTracks);
    }
  });

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
