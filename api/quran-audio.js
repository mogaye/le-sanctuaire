const SURAH_AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53,
  89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12,
  12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26,
  30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

const RECITER_BASE = {
  abdulbasit: 'https://everyayah.com/data/AbdulSamad_64kbps_QuranExplorer.Com',
  abdulbasit_mujawwad: 'https://everyayah.com/data/Abdul_Basit_Mujawwad_128kbps',
  husary: 'https://everyayah.com/data/Husary_128kbps',
  ghamdi: 'https://everyayah.com/data/Ghamadi_40kbps',
  sudais: 'https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps',
  shuraym: 'https://everyayah.com/data/Saood_ash-Shuraym_128kbps',
  minshawi: 'https://everyayah.com/data/Minshawy_Murattal_128kbps',
  minshawi_mujawwad: 'https://everyayah.com/data/Minshawy_Mujawwad_192kbps',
  muaiqly: 'https://everyayah.com/data/MaherAlMuaiqly128kbps',
  shatri: 'https://everyayah.com/data/Abu_Bakr_Ash-Shaatree_128kbps',
  rifai: 'https://everyayah.com/data/Hani_Rifai_192kbps',
  hudhaify: 'https://everyayah.com/data/Hudhaify_128kbps',
  dussary: 'https://everyayah.com/data/Yasser_Ad-Dussary_128kbps',
  qatami: 'https://everyayah.com/data/Nasser_Alqatami_128kbps',
  jaber: 'https://everyayah.com/data/Ali_Jaber_64kbps',
  ayyoub: 'https://everyayah.com/data/Muhammad_Ayyoub_128kbps',
  sowaid: 'https://everyayah.com/data/Ayman_Sowaid_64kbps',
  tablawi: 'https://everyayah.com/data/Mohammad_al_Tablaway_128kbps',
  juhayny: 'https://everyayah.com/data/Abdullaah_3awwaad_Al-Juhaynee_128kbps',
  basfar: 'https://everyayah.com/data/Abdullah_Basfar_192kbps',
  akhdar: 'https://everyayah.com/data/Ibrahim_Akhdar_32kbps',
  budair: 'https://everyayah.com/data/Salah_Al_Budair_128kbps',
  matroud: 'https://everyayah.com/data/Abdullah_Matroud_128kbps',
  abbad: 'https://everyayah.com/data/Fares_Abbad_64kbps',
  mishary: 'https://everyayah.com/data/Alafasy_128kbps',
};

function resolveTargetUrl(surah, ayah, reciter) {
  if (reciter === 'leclerc_fr') {
    let offset = 0;
    for (let i = 0; i < surah - 1; i++) offset += SURAH_AYAH_COUNTS[i] || 0;
    return `https://cdn.islamic.network/quran/audio/128/fr.leclerc/${offset + ayah}.mp3`;
  }
  const sPad = String(surah).padStart(3, '0');
  const aPad = String(ayah).padStart(3, '0');
  const base = RECITER_BASE[reciter] || RECITER_BASE.mishary;
  return `${base}/${sPad}${aPad}.mp3`;
}

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

    const targetUrl = resolveTargetUrl(surah, ayah, reciter);
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
