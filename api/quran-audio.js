import { getAyahAudioUrl } from '../src/utils/quranAudioUtils.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const surah = Math.floor(Number(req.query?.surah));
    const ayah = Math.floor(Number(req.query?.ayah));
    const reciter = String(req.query?.reciter || 'mishary').trim();

    if (!Number.isFinite(surah) || surah < 1 || surah > 114) {
      return res.status(400).json({ error: 'Invalid surah number (1-114)' });
    }
    if (!Number.isFinite(ayah) || ayah < 1 || ayah > 286) {
      return res.status(400).json({ error: 'Invalid ayah number (1-286)' });
    }
    if (!/^[a-z0-9_]{1,40}$/.test(reciter)) {
      return res.status(400).json({ error: 'Invalid reciter id' });
    }

    const targetUrl = getAyahAudioUrl(surah, ayah, reciter);
    const upstream = await fetch(targetUrl);
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'Upstream audio fetch failed' });
    }

    const arrayBuf = await upstream.arrayBuffer();
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(Buffer.from(arrayBuf));
  } catch (error) {
    return res.status(502).json({ error: error?.message || 'Failed to fetch quran audio' });
  }
}
