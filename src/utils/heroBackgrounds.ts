// 5 Fonds Mode Vert (Sombre / Émeraude)
import greenPortraitSereinVertBg from '../Portrait serein avec Coran sur fond vert.png';
import greenFemmeVoileeLisantBg from '../Femme voilée lisant le Coran sur fond vert.png';
import greenLectureEcrinVertBg from '../Lecture coranique dans un écrin vert.png';
import greenFemmeAgeeEnPaixBg from '../Femme âgée lisant le Coran en paix.png';
import greenLecturePaisibleVertBg from '../Lecture paisible du Coran sur fond vert.png';

// 5 Fonds Mode Blanc (Clair / Studio Blanc)
import whiteLectureSereineHijabBg from '../Lecture sereine du Coran en hijab.png';
import whiteFemmeVoileeCoranOrneBg from '../Femme voilée tenant un Coran orné.png';
import whiteLectureSereineStudioBg from '../Lecture sereine du Coran en studio.png';
import whiteFemmeAgeeBlancBg from '../Femme âgée lisant le Coran encadrée de blanc.png';
import whiteLecturePaisibleStudioBg from '../Lecture paisible du Coran en studio.png';

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
  name: 'Portrait serein avec Coran sur fond vert.png',
};

/**
 * 5 Fonds Hero pour le Mode Vert (Sombre) :
 * Commence par "Portrait serein au Coran sur fond vert" suivi des 4 autres images sur fond vert émeraude.
 */
export const GREEN_HERO_BACKGROUNDS: AnalyzedHeroBg[] = [
  DEFAULT_GIRL_HERO_BG,
  {
    id: 'green-2-femme-voilee-lisant',
    src: greenFemmeVoileeLisantBg,
    mode: 'green',
    name: 'Femme voilée lisant le Coran sur fond vert.png',
  },
  {
    id: 'green-3-lecture-ecrin-vert',
    src: greenLectureEcrinVertBg,
    mode: 'green',
    name: 'Lecture coranique dans un écrin vert.png',
  },
  {
    id: 'green-4-femme-agee-paix-vert',
    src: greenFemmeAgeeEnPaixBg,
    mode: 'green',
    name: 'Femme âgée lisant le Coran en paix.png',
  },
  {
    id: 'green-5-lecture-paisible-vert',
    src: greenLecturePaisibleVertBg,
    mode: 'green',
    name: 'Lecture paisible du Coran sur fond vert.png',
  },
];

/**
 * 5 Fonds Hero pour le Mode Blanc (Clair) :
 * Les 5 nouvelles images sur fond blanc pur de studio.
 */
export const WHITE_HERO_BACKGROUNDS: AnalyzedHeroBg[] = [
  {
    id: 'white-1-lecture-sereine-hijab',
    src: whiteLectureSereineHijabBg,
    mode: 'white',
    name: 'Lecture sereine du Coran en hijab.png',
  },
  {
    id: 'white-2-femme-voilee-coran-orne',
    src: whiteFemmeVoileeCoranOrneBg,
    mode: 'white',
    name: 'Femme voilée tenant un Coran orné.png',
  },
  {
    id: 'white-3-lecture-sereine-studio',
    src: whiteLectureSereineStudioBg,
    mode: 'white',
    name: 'Lecture sereine du Coran en studio.png',
  },
  {
    id: 'white-4-femme-agee-blanc',
    src: whiteFemmeAgeeBlancBg,
    mode: 'white',
    name: 'Femme âgée lisant le Coran encadrée de blanc.png',
  },
  {
    id: 'white-5-lecture-paisible-studio',
    src: whiteLecturePaisibleStudioBg,
    mode: 'white',
    name: 'Lecture paisible du Coran en studio.png',
  },
];

export const ALL_HERO_BACKGROUNDS: AnalyzedHeroBg[] = [
  ...GREEN_HERO_BACKGROUNDS,
  ...WHITE_HERO_BACKGROUNDS,
];
