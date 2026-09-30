export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { dataUrl, filename, mimeType } = req.body || {};
    if (!dataUrl) {
      return res.status(400).json({ error: "No image data provided" });
    }

    const imageId = "att_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
    const safeFilename = filename || `${imageId}.jpg`;

    // In serverless environment, return dataUrl or reference cleanly
    return res.status(200).json({
      success: true,
      id: imageId,
      url: dataUrl,
      filename: safeFilename,
      contentType: mimeType || 'image/jpeg'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to upload attachment" });
  }
}
