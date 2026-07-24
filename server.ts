import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Serve track list dynamically based on files inside public/musicfiles
  app.get("/api/tracks", async (req, res) => {
    try {
      const musicFilesDir = path.join(process.cwd(), "public", "musicfiles");
      
      // Ensure directory exists
      if (!fs.existsSync(musicFilesDir)) {
        fs.mkdirSync(musicFilesDir, { recursive: true });
      }

      const files = await fs.promises.readdir(musicFilesDir);
      
      const audioExtensions = [".mp3", ".m4a", ".wav", ".ogg", ".flac", ".aac", ".mp4"];
      const audioFiles = files.filter(f => 
        audioExtensions.some(ext => f.toLowerCase().endsWith(ext))
      );

      // Predefined beautiful covers
      const coverImages = [
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=500&auto=format&fit=crop"
      ];

      const mappedTracks = audioFiles.map((file, index) => {
        // Clean name, e.g., "Teri hawayein - BHO.mp3" -> "Teri hawayein"
        let title = file.replace(/\.[^/.]+$/, ""); // strip extension
        
        // Remove trailing " - BHO" or similar if present
        if (title.includes(" - ")) {
          title = title.split(" - ")[0];
        } else if (title.includes("-")) {
          title = title.split("-")[0];
        }
        title = title.trim();

        return {
          id: `local-${index}-${encodeURIComponent(file)}`,
          title: title || "Untitled Track",
          artist: "Bhoomika", // Artist is always "Bhoomika"
          album: "Local Sessions",
          duration: "4:00",
          durationSec: 240,
          coverUrl: coverImages[index % coverImages.length],
          audioUrl: `/musicfiles/${encodeURIComponent(file)}`, // Serves statically from public/musicfiles
        };
      });

      res.json(mappedTracks);
    } catch (err) {
      console.error("Error reading music files:", err);
      res.status(500).json({ error: "Failed to read music files directory" });
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
