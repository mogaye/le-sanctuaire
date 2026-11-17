import mobileNoirMinimalImg from '../assets/images/mobile_noir_minimal_916_1794914415661.jpg';
import mobileNoirVelvetImg from '../assets/images/mobile_noir_velvet_916_1794914417829.jpg';
import mobileNoirEclipseImg from '../assets/images/mobile_noir_eclipse_1794914966498.jpg';
import mobileNoirArchImg from '../assets/images/mobile_noir_arch_1794914966883.jpg';
import mobileNoirLanternImg from '../assets/images/mobile_noir_lantern_1794914967189.jpg';
import mobileNoirRosetteImg from '../assets/images/mobile_noir_rosette_1794914967451.jpg';
import mobileNoirStarsImg from '../assets/images/mobile_noir_stars_1794914968495.jpg';
import mobileNoirSilkImg from '../assets/images/mobile_noir_silk_1794914968556.jpg';
import mobileNoirMihrabImg from '../assets/images/mobile_noir_mihrab_1794914969126.jpg';
import mobileNoirEmeraldImg from '../assets/images/mobile_noir_emerald_1794914969548.jpg';

import mobileBlancMinimalImg from '../assets/images/mobile_blanc_minimal_916_1794914417723.jpg';
import mobileBlancMarbreImg from '../assets/images/mobile_blanc_marbre_916_1794914417486.jpg';
import mobileBlancSilkImg from '../assets/images/mobile_blanc_silk_1794914989560.jpg';
import mobileBlancArchImg from '../assets/images/mobile_blanc_arch_1794914971377.jpg';
import mobileBlancCrescentImg from '../assets/images/mobile_blanc_crescent_1794914972035.jpg';
import mobileBlancPlasterImg from '../assets/images/mobile_blanc_plaster_1794914972199.jpg';
import mobileBlancRosetteImg from '../assets/images/mobile_blanc_rosette_1794914972458.jpg';
import mobileBlancAndalousImg from '../assets/images/mobile_blanc_andalous_1794914973505.jpg';
import mobileBlancCottonImg from '../assets/images/mobile_blanc_cotton_1794914973620.jpg';
import mobileBlancLinenImg from '../assets/images/mobile_blanc_linen_1794914988918.jpg';

export interface MobileVerticalBackgroundItem {
  id: string;
  name: string;
  category: 'noir' | 'blanc';
  url: string;
  recommendedTheme: 'oled' | 'pure_white';
  polarity: 'dark' | 'light';
}

// Exactly 20 mobile-only 9:16 vertical backgrounds (10 Noir + 10 Blanc) with spotless center reading fields
export const MOBILE_VERTICAL_BACKGROUNDS: MobileVerticalBackgroundItem[] = [
  // === 10 FONDS NOIRS (9:16) ===
  {
    id: 'mobile_noir_minimal',
    name: 'Noir Pur & Liseré Or',
    category: 'noir',
    url: mobileNoirMinimalImg,
    recommendedTheme: 'oled',
    polarity: 'dark',
  },
  {
    id: 'mobile_noir_velvet',
    name: 'Noir Velours & Arabesques',
    category: 'noir',
    url: mobileNoirVelvetImg,
    recommendedTheme: 'oled',
    polarity: 'dark',
  },
  {
    id: 'mobile_noir_eclipse',
    name: 'Éclipse Noire & Croissant Or',
    category: 'noir',
    url: mobileNoirEclipseImg,
    recommendedTheme: 'oled',
    polarity: 'dark',
  },
  {
    id: 'mobile_noir_arch',
    name: 'Ogive Noire & Filigrane Or',
    category: 'noir',
    url: mobileNoirArchImg,
    recommendedTheme: 'oled',
    polarity: 'dark',
  },
  {
    id: 'mobile_noir_lantern',
    name: 'Nuit Noire & Fanous d’Angle',
    category: 'noir',
    url: mobileNoirLanternImg,
    recommendedTheme: 'oled',
    polarity: 'dark',
  },
  {
    id: 'mobile_noir_rosette',
    name: 'Noir Mat & Rosaces Argent',
    category: 'noir',
    url: mobileNoirRosetteImg,
    recommendedTheme: 'oled',
    polarity: 'dark',
  },
  {
    id: 'mobile_noir_stars',
    name: 'Zénith Noir & Poussière d’Or',
    category: 'noir',
    url: mobileNoirStarsImg,
    recommendedTheme: 'oled',
    polarity: 'dark',
  },
  {
    id: 'mobile_noir_silk',
    name: 'Obsidienne Soie & Double Filet',
    category: 'noir',
    url: mobileNoirSilkImg,
    recommendedTheme: 'oled',
    polarity: 'dark',
  },
  {
    id: 'mobile_noir_mihrab',
    name: 'Mihrab Noir & Frise Bronze',
    category: 'noir',
    url: mobileNoirMihrabImg,
    recommendedTheme: 'oled',
    polarity: 'dark',
  },
  {
    id: 'mobile_noir_emerald',
    name: 'Ombre Profonde & Coins Or',
    category: 'noir',
    url: mobileNoirEmeraldImg,
    recommendedTheme: 'oled',
    polarity: 'dark',
  },

  // === 10 FONDS BLANCS (9:16) ===
  {
    id: 'mobile_blanc_minimal',
    name: 'Blanc Pur & Liseré Or',
    category: 'blanc',
    url: mobileBlancMinimalImg,
    recommendedTheme: 'pure_white',
    polarity: 'light',
  },
  {
    id: 'mobile_blanc_marbre',
    name: 'Blanc Albâtre & Ogive',
    category: 'blanc',
    url: mobileBlancMarbreImg,
    recommendedTheme: 'pure_white',
    polarity: 'light',
  },
  {
    id: 'mobile_blanc_silk',
    name: 'Papier Soie & Double Filet Or',
    category: 'blanc',
    url: mobileBlancSilkImg,
    recommendedTheme: 'pure_white',
    polarity: 'light',
  },
  {
    id: 'mobile_blanc_arch',
    name: 'Blanc Neige & Arche Platine',
    category: 'blanc',
    url: mobileBlancArchImg,
    recommendedTheme: 'pure_white',
    polarity: 'light',
  },
  {
    id: 'mobile_blanc_crescent',
    name: 'Blanc Sacré & Croissant Or',
    category: 'blanc',
    url: mobileBlancCrescentImg,
    recommendedTheme: 'pure_white',
    polarity: 'light',
  },
  {
    id: 'mobile_blanc_plaster',
    name: 'Stuc Médine & Coins Sable',
    category: 'blanc',
    url: mobileBlancPlasterImg,
    recommendedTheme: 'pure_white',
    polarity: 'light',
  },
  {
    id: 'mobile_blanc_rosette',
    name: 'Porcelaine & Étoiles d’Angle',
    category: 'blanc',
    url: mobileBlancRosetteImg,
    recommendedTheme: 'pure_white',
    polarity: 'light',
  },
  {
    id: 'mobile_blanc_andalous',
    name: 'Blanc Andalous & Frise Bronze',
    category: 'blanc',
    url: mobileBlancAndalousImg,
    recommendedTheme: 'pure_white',
    polarity: 'light',
  },
  {
    id: 'mobile_blanc_cotton',
    name: 'Coton Musée & Trait d’Or',
    category: 'blanc',
    url: mobileBlancCottonImg,
    recommendedTheme: 'pure_white',
    polarity: 'light',
  },
  {
    id: 'mobile_blanc_linen',
    name: 'Lin Blanc Pur & Cadre Argent',
    category: 'blanc',
    url: mobileBlancLinenImg,
    recommendedTheme: 'pure_white',
    polarity: 'light',
  },
];
