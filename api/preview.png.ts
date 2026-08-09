import fs from 'fs';
import path from 'path';

export default function handler(req: any, res: any) {
  try {
    // Attempt to locate preview.png in public or dist directory
    const posibles = [
      path.join(process.cwd(), 'public', 'preview.png'),
      path.join(process.cwd(), 'dist', 'preview.png'),
      path.join(__dirname, '..', 'public', 'preview.png'),
      path.join(__dirname, '..', 'dist', 'preview.png')
    ];

    let filePath = posibles.find(p => fs.existsSync(p));

    if (filePath) {
      const stat = fs.statSync(filePath);
      const imgBuffer = fs.readFileSync(filePath);

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).send(imgBuffer);
    } else {
      return res.status(404).json({ error: "preview.png file not found" });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
