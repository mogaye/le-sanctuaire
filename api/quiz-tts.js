const ttsMemoryCache = new Map();

function normalizeForTts(raw) {
  return String(raw || '')
    .replace(/ﷺ/g, ' salla Allahou alayhi wa sallam ')
    .replace(/[‘’`]/g, "'")
    .replace(/[“”«»]/g, ' ')
    .replace(/(\d+(?:[.,]\d+)?)\s*%/g, '$1 pour cent')
    .replace(/[✓✔•·★☆✨🌙🕌📖❓]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1200);
}

function splitChunks(clean, maxChars) {
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];
  const chunks = [];
  let rem = clean;
  while (rem.length > 0) {
    if (rem.length <= maxChars) {
      chunks.push(rem);
      break;
    }
    const slice = rem.slice(0, maxChars + 1);
    let cut = -1;
    for (let i = slice.length - 1; i >= Math.floor(maxChars * 0.45); i--) {
      if ('.!?;'.includes(slice[i])) {
        cut = i + 1;
        break;
      }
    }
    if (cut === -1) {
      for (let i = slice.length - 1; i >= Math.floor(maxChars * 0.45); i--) {
        if (',:'.includes(slice[i])) {
          cut = i + 1;
          break;
        }
      }
    }
    if (cut === -1) {
      const sp = slice.lastIndexOf(' ');
      cut = sp > Math.floor(maxChars * 0.35) ? sp : maxChars;
    }
    const part = rem.slice(0, cut).trim();
    if (part) chunks.push(part);
    rem = rem.slice(cut).trim();
  }
  return chunks;
}

async function synthesizeChunkTikTok(text, voice) {
  const res = await fetch('https://tiktok-tts.weilnet.workers.dev/api/generation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  if (json?.success && typeof json?.data === 'string' && json.data.length > 64) {
    return json.data;
  }
  return null;
}

async function synthesizeChunkGoogle(text) {
  const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=fr&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  if (!res.ok) return null;
  const arr = await res.arrayBuffer();
  if (arr.byteLength < 128) return null;
  return Buffer.from(arr).toString('base64');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const body = req.method === 'POST' ? req.body || {} : req.query || {};
    const text = normalizeForTts(body.text);
    const rawVoice = String(body.voiceId || 'google_fr').trim();
    const voiceId =
      rawVoice === 'fr_001' || rawVoice === 'fr_002' || rawVoice === 'google_fr'
        ? rawVoice
        : 'google_fr';

    if (!text) {
      return res.status(400).json({ ok: false, error: 'Texte manquant.' });
    }

    const cacheKey = `${voiceId}::${text}`;
    const cached = ttsMemoryCache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ ok: true, voiceId, chunks: cached, cached: true });
    }

    const maxLen = voiceId === 'google_fr' ? 175 : 210;
    const parts = splitChunks(text, maxLen);
    const audioChunks = [];

    for (const part of parts) {
      let b64 = null;
      if (voiceId === 'fr_001' || voiceId === 'fr_002') {
        b64 = await synthesizeChunkTikTok(part, voiceId);
      }
      if (!b64) {
        b64 = await synthesizeChunkGoogle(part);
      }
      if (!b64) {
        return res.status(502).json({ ok: false, error: 'Synthèse vocale temporairement indisponible.' });
      }
      audioChunks.push(b64);
    }

    if (ttsMemoryCache.size > 150) {
      const oldest = ttsMemoryCache.keys().next().value;
      if (oldest) ttsMemoryCache.delete(oldest);
    }
    ttsMemoryCache.set(cacheKey, audioChunks);

    return res.status(200).json({ ok: true, voiceId, chunks: audioChunks });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || 'Erreur synthèse vocale.' });
  }
}
