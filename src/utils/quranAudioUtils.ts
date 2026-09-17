// EveryAyah CDN URLs for all reciters by Ayah
export function getAyahAudioUrl(surahNum: number, ayahNum: number, reciterId: string): string {
  const sPad = String(surahNum).padStart(3, '0');
  const aPad = String(ayahNum).padStart(3, '0');
  const file = `${sPad}${aPad}.mp3`;

  switch (reciterId) {
    case 'abdulbasit':
      return `https://everyayah.com/data/AbdulSamad_64kbps_QuranExplorer.Com/${file}`;
    case 'husary':
      return `https://everyayah.com/data/Husary_128kbps/${file}`;
    case 'ghamdi':
      return `https://everyayah.com/data/Ghamadi_40kbps/${file}`;
    case 'sudais':
      return `https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/${file}`;
    case 'minshawi':
      return `https://everyayah.com/data/Minshawy_Murattal_128kbps/${file}`;
    case 'muaiqly':
      return `https://everyayah.com/data/MaherAlMuaiqly128kbps/${file}`;
    case 'shatri':
      return `https://everyayah.com/data/Abu_Bakr_Ash-Shaatree_128kbps/${file}`;
    case 'rifai':
      return `https://everyayah.com/data/Hani_Rifai_192kbps/${file}`;
    case 'hudhaify':
      return `https://everyayah.com/data/Hudhaify_128kbps/${file}`;
    case 'dussary':
      return `https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/${file}`;
    case 'qatami':
      return `https://everyayah.com/data/Nasser_Alqatami_128kbps/${file}`;
    case 'jaber':
      return `https://everyayah.com/data/Ali_Jaber_64kbps/${file}`;
    case 'sowaid':
      return `https://everyayah.com/data/Ayman_Sowaid_64kbps/${file}`;
    case 'mishary':
    default:
      return `https://everyayah.com/data/Alafasy_128kbps/${file}`;
  }
}

// Full Surah recitation URLs for all reciters
export function getSurahAudioUrl(surahNum: number, reciterId: string): string {
  const sPad = String(surahNum).padStart(3, '0');

  switch (reciterId) {
    case 'abdulbasit':
      return `https://download.quranicaudio.com/qdc/abdul_baset/murattal/${surahNum}.mp3`;
    case 'sudais':
      return `https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal/${surahNum}.mp3`;
    case 'husary':
      return `https://download.quranicaudio.com/qdc/khalil_al_husary/murattal/${surahNum}.mp3`;
    case 'minshawi':
      return `https://download.quranicaudio.com/qdc/siddiq_minshawi/murattal/${surahNum}.mp3`;
    case 'shatri':
      return `https://download.quranicaudio.com/qdc/abu_bakr_shatri/murattal/${surahNum}.mp3`;
    case 'rifai':
      return `https://download.quranicaudio.com/qdc/hani_ar_rifai/murattal/${surahNum}.mp3`;
    case 'ghamdi':
      return `https://download.quranicaudio.com/quran/sa3d_al-ghaamidi/complete/${sPad}.mp3`;
    case 'muaiqly':
      return `https://server12.mp3quran.net/maher/${sPad}.mp3`;
    case 'hudhaify':
      return `https://server9.mp3quran.net/hthfi/${sPad}.mp3`;
    case 'dussary':
      return `https://server11.mp3quran.net/yasser/${sPad}.mp3`;
    case 'qatami':
      return `https://server6.mp3quran.net/qtm/${sPad}.mp3`;
    case 'jaber':
      return `https://server11.mp3quran.net/a_jbr/${sPad}.mp3`;
    case 'sowaid':
      return `https://everyayah.com/data/Ayman_Sowaid_64kbps/${sPad}001.mp3`;
    case 'mishary':
    default:
      return `https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/${surahNum}.mp3`;
  }
}

export function formatAudioSeconds(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
