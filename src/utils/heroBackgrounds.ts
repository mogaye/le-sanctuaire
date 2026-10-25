// 5 Fonds Mode Vert (Sombre / Émeraude) - Optimisés en WebP ultra-rapides
import greenPortraitSereinVertBg from '../assets/images/hero/portrait_serein_vert.webp';
import greenFemmeVoileeLisantBg from '../assets/images/hero/femme_voilee_lisant_vert.webp';
import greenLectureEcrinVertBg from '../assets/images/hero/lecture_ecrin_vert.webp';
import greenFemmeAgeeEnPaixBg from '../assets/images/hero/femme_agee_paix_vert.webp';
import greenLecturePaisibleVertBg from '../assets/images/hero/lecture_paisible_vert.webp';

// 5 Fonds Mode Blanc (Clair / Studio Blanc) - Optimisés en WebP ultra-rapides
import whiteLectureSereineHijabBg from '../assets/images/hero/lecture_sereine_hijab.webp';
import whiteFemmeVoileeCoranOrneBg from '../assets/images/hero/femme_voilee_coran_orne.webp';
import whiteLectureSereineStudioBg from '../assets/images/hero/lecture_sereine_studio.webp';
import whiteFemmeAgeeBlancBg from '../assets/images/hero/femme_agee_blanc.webp';
import whiteLecturePaisibleStudioBg from '../assets/images/hero/lecture_paisible_studio.webp';

export interface AnalyzedHeroBg {
  id: string;
  src: string;
  mode: 'white' | 'green';
  name: string;
}

export const DEFAULT_GIRL_HERO_BG: AnalyzedHeroBg = {
  id: 'green-1-portrait-serein-vert',
  src: greenPortraitSereinVertBg,
  mode: 'green',
  name: 'portrait_serein_vert.webp',
};

/**
 * 5 Fonds Hero pour le Mode Vert (Sombre)
 */
export const GREEN_HERO_BACKGROUNDS: AnalyzedHeroBg[] = [
  DEFAULT_GIRL_HERO_BG,
  {
    id: 'green-2-femme-voilee-lisant',
    src: greenFemmeVoileeLisantBg,
    mode: 'green',
    name: 'femme_voilee_lisant_vert.webp',
  },
  {
    id: 'green-3-lecture-ecrin-vert',
    src: greenLectureEcrinVertBg,
    mode: 'green',
    name: 'lecture_ecrin_vert.webp',
  },
  {
    id: 'green-4-femme-agee-paix-vert',
    src: greenFemmeAgeeEnPaixBg,
    mode: 'green',
    name: 'femme_agee_paix_vert.webp',
  },
  {
    id: 'green-5-lecture-paisible-vert',
    src: greenLecturePaisibleVertBg,
    mode: 'green',
    name: 'lecture_paisible_vert.webp',
  },
];

/**
 * 5 Fonds Hero pour le Mode Blanc (Clair)
 */
export const WHITE_HERO_BACKGROUNDS: AnalyzedHeroBg[] = [
  {
    id: 'white-1-lecture-sereine-hijab',
    src: whiteLectureSereineHijabBg,
    mode: 'white',
    name: 'lecture_sereine_hijab.webp',
  },
  {
    id: 'white-2-femme-voilee-coran-orne',
    src: whiteFemmeVoileeCoranOrneBg,
    mode: 'white',
    name: 'femme_voilee_coran_orne.webp',
  },
  {
    id: 'white-3-lecture-sereine-studio',
    src: whiteLectureSereineStudioBg,
    mode: 'white',
    name: 'lecture_sereine_studio.webp',
  },
  {
    id: 'white-4-femme-agee-blanc',
    src: whiteFemmeAgeeBlancBg,
    mode: 'white',
    name: 'femme_agee_blanc.webp',
  },
  {
    id: 'white-5-lecture-paisible-studio',
    src: whiteLecturePaisibleStudioBg,
    mode: 'white',
    name: 'lecture_paisible_studio.webp',
  },
];

export const ALL_HERO_BACKGROUNDS: AnalyzedHeroBg[] = [
  ...GREEN_HERO_BACKGROUNDS,
  ...WHITE_HERO_BACKGROUNDS,
];
