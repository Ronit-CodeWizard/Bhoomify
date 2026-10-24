export default async function handler(req: any, res: any) {
  const songName = (req.query.name || req.query.song || req.query.title) as string | undefined;

  if (!songName || typeof songName !== 'string' || !songName.trim()) {
    return res.status(400).json({ error: "Missing required 'name' query parameter." });
  }

  const rawFilename = songName.trim();
  const filename = rawFilename.endsWith('.mp3') ? rawFilename : `${rawFilename} - BHO.mp3`;
  const rawUrl = `https://raw.githubusercontent.com/Ronit-CodeWizard/wizard-resources/main/Musics/BHO/${encodeURIComponent(filename)}`;

  // Redirect to direct raw GitHub CDN which handles Range requests and CORS headers automatically
  res.setHeader('Location', rawUrl);
  return res.status(302).end();
}
