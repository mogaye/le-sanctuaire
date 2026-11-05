import { ALL_114_SURAHS } from '../data/quranSurahs';

// Calculate cumulative global ayah number across the 114 surahs (1 to 6236)
export function getAyahGlobalNumber(surahNum: number, ayahNum: number): number {
  let offset = 0;
  for (let i = 0; i < surahNum - 1; i++) {
    offset += ALL_114_SURAHS[i]?.numberOfAyahs || 0;
  }
  return offset + ayahNum;
}

// EveryAyah and Islamic Network CDN URLs for all reciters by Ayah
export function getAyahAudioUrl(surahNum: number, ayahNum: number, reciterId: string): string {
  const sPad = String(surahNum).padStart(3, '0');
  const aPad = String(ayahNum).padStart(3, '0');
  const file = `${sPad}${aPad}.mp3`;

  // French verse-by-verse translation audio by Youssouf Leclerc
  if (reciterId === 'leclerc_fr') {
    const globalIdx = getAyahGlobalNumber(surahNum, ayahNum);
    return `https://cdn.islamic.network/quran/audio/128/fr.leclerc/${globalIdx}.mp3`;
  }

  switch (reciterId) {
    case 'abdulbasit':
      return `https://everyayah.com/data/AbdulSamad_64kbps_QuranExplorer.Com/${file}`;
    case 'abdulbasit_mujawwad':
      return `https://everyayah.com/data/Abdul_Basit_Mujawwad_128kbps/${file}`;
    case 'husary':
      return `https://everyayah.com/data/Husary_128kbps/${file}`;
    case 'ghamdi':
      return `https://everyayah.com/data/Ghamadi_40kbps/${file}`;
    case 'sudais':
      return `https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/${file}`;
    case 'shuraym':
      return `https://everyayah.com/data/Saood_ash-Shuraym_128kbps/${file}`;
    case 'minshawi':
      return `https://everyayah.com/data/Minshawy_Murattal_128kbps/${file}`;
    case 'minshawi_mujawwad':
      return `https://everyayah.com/data/Minshawy_Mujawwad_192kbps/${file}`;
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
    case 'ayyoub':
      return `https://everyayah.com/data/Muhammad_Ayyoub_128kbps/${file}`;
    case 'sowaid':
      return `https://everyayah.com/data/Ayman_Sowaid_64kbps/${file}`;
    case 'tablawi':
      return `https://everyayah.com/data/Mohammad_al_Tablaway_128kbps/${file}`;
    case 'juhayny':
      return `https://everyayah.com/data/Abdullaah_3awwaad_Al-Juhaynee_128kbps/${file}`;
    case 'basfar':
      return `https://everyayah.com/data/Abdullah_Basfar_192kbps/${file}`;
    case 'akhdar':
      return `https://everyayah.com/data/Ibrahim_Akhdar_32kbps/${file}`;
    case 'budair':
      return `https://everyayah.com/data/Salah_Al_Budair_128kbps/${file}`;
    case 'matroud':
      return `https://everyayah.com/data/Abdullah_Matroud_128kbps/${file}`;
    case 'abbad':
      return `https://everyayah.com/data/Fares_Abbad_64kbps/${file}`;
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
    case 'abdulbasit_mujawwad':
      return `https://download.quranicaudio.com/qdc/abdul_baset/murattal/${surahNum}.mp3`;
    case 'sudais':
      return `https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal/${surahNum}.mp3`;
    case 'shuraym':
      return `https://server7.mp3quran.net/shur/${sPad}.mp3`;
    case 'husary':
      return `https://download.quranicaudio.com/qdc/khalil_al_husary/murattal/${surahNum}.mp3`;
    case 'minshawi':
    case 'minshawi_mujawwad':
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
    case 'ayyoub':
      return `https://server8.mp3quran.net/ayyub/${sPad}.mp3`;
    case 'tablawi':
      return `https://server12.mp3quran.net/tblw/${sPad}.mp3`;
    case 'juhayny':
      return `https://server13.mp3quran.net/jhn/${sPad}.mp3`;
    case 'basfar':
      return `https://server6.mp3quran.net/bsfr/${sPad}.mp3`;
    case 'akhdar':
      return `https://server6.mp3quran.net/akdr/${sPad}.mp3`;
    case 'budair':
      return `https://server6.mp3quran.net/bdr/${sPad}.mp3`;
    case 'matroud':
      return `https://server8.mp3quran.net/mtrod/${sPad}.mp3`;
    case 'abbad':
      return `https://server8.mp3quran.net/frs_a/${sPad}.mp3`;
    case 'sowaid':
      return `https://everyayah.com/data/Ayman_Sowaid_64kbps/${sPad}001.mp3`;
    case 'leclerc_fr':
      return `https://cdn.islamic.network/quran/audio/128/fr.leclerc/${getAyahGlobalNumber(surahNum, 1)}.mp3`;
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
