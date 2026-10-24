export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const defaultSongs = [
    {
      name: "Chahun Main Ya Naa - BHO.mp3",
      filename: "Chahun Main Ya Naa - BHO.mp3",
      title: "Chahun Main Ya Naa",
      artist: "BHOOMIKA",
      author: "BHOOMIKA",
      size: 563796,
      streamUrl: "https://raw.githubusercontent.com/Ronit-CodeWizard/wizard-resources/main/Musics/BHO/Chahun%20Main%20Ya%20Naa%20-%20BHO.mp3",
    },
    {
      name: "Ik Mulaqaat - BHO.mp3",
      filename: "Ik Mulaqaat - BHO.mp3",
      title: "Ik Mulaqaat",
      artist: "BHOOMIKA",
      author: "BHOOMIKA",
      size: 164039,
      streamUrl: "https://raw.githubusercontent.com/Ronit-CodeWizard/wizard-resources/main/Musics/BHO/Ik%20Mulaqaat%20-%20BHO.mp3",
    },
    {
      name: "Ishq Mubarak - BHO.mp3",
      filename: "Ishq Mubarak - BHO.mp3",
      title: "Ishq Mubarak",
      artist: "BHOOMIKA",
      author: "BHOOMIKA",
      size: 641026,
      streamUrl: "https://raw.githubusercontent.com/Ronit-CodeWizard/wizard-resources/main/Musics/BHO/Ishq%20Mubarak%20-%20BHO.mp3",
    },
    {
      name: "Jeena Jeena - BHO.mp3",
      filename: "Jeena Jeena - BHO.mp3",
      title: "Jeena Jeena",
      artist: "BHOOMIKA",
      author: "BHOOMIKA",
      size: 459949,
      streamUrl: "https://raw.githubusercontent.com/Ronit-CodeWizard/wizard-resources/main/Musics/BHO/Jeena%20Jeena%20-%20BHO.mp3",
    },
    {
      name: "Nazar Na Lag Jaaye - BHO.mp3",
      filename: "Nazar Na Lag Jaaye - BHO.mp3",
      title: "Nazar Na Lag Jaaye",
      artist: "BHOOMIKA",
      author: "BHOOMIKA",
      size: 495413,
      streamUrl: "https://raw.githubusercontent.com/Ronit-CodeWizard/wizard-resources/main/Musics/BHO/Nazar%20Na%20Lag%20Jaaye%20-%20BHO.mp3",
    },
    {
      name: "Rata Lambiya Kaliya Ni Samiye - BHO.mp3",
      filename: "Rata Lambiya Kaliya Ni Samiye - BHO.mp3",
      title: "Rata Lambiya Kaliya Ni Samiye",
      artist: "BHOOMIKA",
      author: "BHOOMIKA",
      size: 123021,
      streamUrl: "https://raw.githubusercontent.com/Ronit-CodeWizard/wizard-resources/main/Musics/BHO/Rata%20Lambiya%20Kaliya%20Ni%20Samiye%20-%20BHO.mp3",
    },
    {
      name: "Saiyaara - BHO.mp3",
      filename: "Saiyaara - BHO.mp3",
      title: "Saiyaara",
      artist: "BHOOMIKA",
      author: "BHOOMIKA",
      size: 913893,
      streamUrl: "https://raw.githubusercontent.com/Ronit-CodeWizard/wizard-resources/main/Musics/BHO/Saiyaara%20-%20BHO.mp3",
    },
    {
      name: "Tum Ho Toh - BHO.mp3",
      filename: "Tum Ho Toh - BHO.mp3",
      title: "Tum Ho Toh",
      artist: "BHOOMIKA",
      author: "BHOOMIKA",
      size: 477909,
      streamUrl: "https://raw.githubusercontent.com/Ronit-CodeWizard/wizard-resources/main/Musics/BHO/Tum%20Ho%20Toh%20-%20BHO.mp3",
    },
  ];

  try {
    const ghRes = await fetch("https://api.github.com/repos/Ronit-CodeWizard/wizard-resources/contents/Musics/BHO", {
      headers: { "User-Agent": "Bhoomify/1.0" },
    });
    if (ghRes.ok) {
      const data = await ghRes.json();
      if (Array.isArray(data) && data.length > 0) {
        const songs = data
          .filter((f: any) => f.name && f.name.toLowerCase().endsWith(".mp3"))
          .map((f: any) => {
            const cleanTitle = f.name.replace(/\s*-\s*bho(?:\.mp3)?$/i, "").replace(/\.mp3$/i, "").trim();
            return {
              name: f.name,
              filename: f.name,
              title: cleanTitle,
              artist: "BHOOMIKA",
              author: "BHOOMIKA",
              size: f.size,
              streamUrl: f.download_url || `https://raw.githubusercontent.com/Ronit-CodeWizard/wizard-resources/main/Musics/BHO/${encodeURIComponent(f.name)}`,
            };
          });
        return res.status(200).json({
          repository: "Ronit-CodeWizard/wizard-resources",
          folder: "Musics/BHO",
          source: "github-api",
          songs,
        });
      }
    }
  } catch {
    // Fall back to default verified list
  }

  return res.status(200).json({
    repository: "Ronit-CodeWizard/wizard-resources",
    folder: "Musics/BHO",
    source: "github-fallback",
    songs: defaultSongs,
  });
}
