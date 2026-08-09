import { PREVIEW_B64 } from '../src/preview_b64';

export default function handler(req: any, res: any) {
  try {
    const imgBuffer = Buffer.from(PREVIEW_B64, 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', imgBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(imgBuffer);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
