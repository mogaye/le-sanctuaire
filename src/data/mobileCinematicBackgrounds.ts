import mobileNoirMinimalImg from '../assets/images/mobile_noir_minimal_916_1794914415661.webp';
import mobileNoirVelvetImg from '../assets/images/mobile_noir_velvet_916_1794914417829.webp';
import mobileNoirEclipseImg from '../assets/images/mobile_noir_eclipse_1794914966498.webp';
import mobileNoirArchImg from '../assets/images/mobile_noir_arch_1794914966883.webp';
import mobileNoirLanternImg from '../assets/images/mobile_noir_lantern_1794914967189.webp';
import mobileNoirRosetteImg from '../assets/images/mobile_noir_rosette_1794914967451.webp';
import mobileNoirStarsImg from '../assets/images/mobile_noir_stars_1794914968495.webp';
import mobileNoirSilkImg from '../assets/images/mobile_noir_silk_1794914968556.webp';
import mobileNoirMihrabImg from '../assets/images/mobile_noir_mihrab_1794914969126.webp';
import mobileNoirEmeraldImg from '../assets/images/mobile_noir_emerald_1794914969548.webp';

import mobileNoirMinimalThumb from '../assets/images/thumbs/mobile_noir_minimal_916_1794914415661.webp';
import mobileNoirVelvetThumb from '../assets/images/thumbs/mobile_noir_velvet_916_1794914417829.webp';
import mobileNoirEclipseThumb from '../assets/images/thumbs/mobile_noir_eclipse_1794914966498.webp';
import mobileNoirArchThumb from '../assets/images/thumbs/mobile_noir_arch_1794914966883.webp';
import mobileNoirLanternThumb from '../assets/images/thumbs/mobile_noir_lantern_1794914967189.webp';
import mobileNoirRosetteThumb from '../assets/images/thumbs/mobile_noir_rosette_1794914967451.webp';
import mobileNoirStarsThumb from '../assets/images/thumbs/mobile_noir_stars_1794914968495.webp';
import mobileNoirSilkThumb from '../assets/images/thumbs/mobile_noir_silk_1794914968556.webp';
import mobileNoirMihrabThumb from '../assets/images/thumbs/mobile_noir_mihrab_1794914969126.webp';
import mobileNoirEmeraldThumb from '../assets/images/thumbs/mobile_noir_emerald_1794914969548.webp';

import mobileBlancMinimalImg from '../assets/images/mobile_blanc_minimal_916_1794914417723.webp';
import mobileBlancMarbreImg from '../assets/images/mobile_blanc_marbre_916_1794914417486.webp';
import mobileBlancSilkImg from '../assets/images/mobile_blanc_silk_1794914989560.webp';
import mobileBlancArchImg from '../assets/images/mobile_blanc_arch_1794914971377.webp';
import mobileBlancCrescentImg from '../assets/images/mobile_blanc_crescent_1794914972035.webp';
import mobileBlancPlasterImg from '../assets/images/mobile_blanc_plaster_1794914972199.webp';
import mobileBlancRosetteImg from '../assets/images/mobile_blanc_rosette_1794914972458.webp';
import mobileBlancAndalousImg from '../assets/images/mobile_blanc_andalous_1794914973505.webp';
import mobileBlancCottonImg from '../assets/images/mobile_blanc_cotton_1794914973620.webp';
import mobileBlancLinenImg from '../assets/images/mobile_blanc_linen_1794914988918.webp';

import mobileBlancMinimalThumb from '../assets/images/thumbs/mobile_blanc_minimal_916_1794914417723.webp';
import mobileBlancMarbreThumb from '../assets/images/thumbs/mobile_blanc_marbre_916_1794914417486.webp';
import mobileBlancSilkThumb from '../assets/images/thumbs/mobile_blanc_silk_1794914989560.webp';
import mobileBlancArchThumb from '../assets/images/thumbs/mobile_blanc_arch_1794914971377.webp';
import mobileBlancCrescentThumb from '../assets/images/thumbs/mobile_blanc_crescent_1794914972035.webp';
import mobileBlancPlasterThumb from '../assets/images/thumbs/mobile_blanc_plaster_1794914972199.webp';
import mobileBlancRosetteThumb from '../assets/images/thumbs/mobile_blanc_rosette_1794914972458.webp';
import mobileBlancAndalousThumb from '../assets/images/thumbs/mobile_blanc_andalous_1794914973505.webp';
import mobileBlancCottonThumb from '../assets/images/thumbs/mobile_blanc_cotton_1794914973620.webp';
import mobileBlancLinenThumb from '../assets/images/thumbs/mobile_blanc_linen_1794914988918.webp';

export interface MobileVerticalBackgroundItem {
  id: string;
  name: string;
  category: 'noir' | 'blanc';
  url: string;
  thumbUrl: string;
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
    thumbUrl: mobileNoirMinimalThumb,
    recommendedTheme: 'oled',
    polarity: 'dark',
  },
  {
    id: 'mobile_noir_velvet',
    name: 'Noir Velours & Arabesques',
    category: 'noir',
    url: mobileNoirVelvetImg,
    thumbUrl: mobileNoirVelvetThumb,
    recommendedTheme: 'oled',
    polarity: 'dark',
  },
  {
    id: 'mobile_noir_eclipse',
    name: 'Éclipse Noire & Croissant Or',
    category: 'noir',
    url: mobileNoirEclipseImg,
    thumbUrl: mobileNoirEclipseThumb,
    recommendedTheme: 'oled',
    polarity: 'dark',
  },
  {
    id: 'mobile_noir_arch',
    name: 'Ogive Noire & Filigrane Or',
    category: 'noir',
    url: mobileNoirArchImg,
    thumbUrl: mobileNoirArchThumb,
    recommendedTheme: 'oled',
    polarity: 'dark',
  },
  {
    id: 'mobile_noir_lantern',
    name: 'Nuit Noire & Fanous d’Angle',
    category: 'noir',
    url: mobileNoirLanternImg,
    thumbUrl: mobileNoirLanternThumb,
    recommendedTheme: 'oled',
    polarity: 'dark',
  },
  {
    id: 'mobile_noir_rosette',
    name: 'Noir Mat & Rosaces Argent',
    category: 'noir',
    url: mobileNoirRosetteImg,
    thumbUrl: mobileNoirRosetteThumb,
    recommendedTheme: 'oled',
    polarity: 'dark',
  },
  {
    id: 'mobile_noir_stars',
    name: 'Zénith Noir & Poussière d’Or',
    category: 'noir',
    url: mobileNoirStarsImg,
    thumbUrl: mobileNoirStarsThumb,
    recommendedTheme: 'oled',
    polarity: 'dark',
  },
  {
    id: 'mobile_noir_silk',
    name: 'Obsidienne Soie & Double Filet',
    category: 'noir',
    url: mobileNoirSilkImg,
    thumbUrl: mobileNoirSilkThumb,
    recommendedTheme: 'oled',
    polarity: 'dark',
  },
  {
    id: 'mobile_noir_mihrab',
    name: 'Mihrab Noir & Frise Bronze',
    category: 'noir',
    url: mobileNoirMihrabImg,
    thumbUrl: mobileNoirMihrabThumb,
    recommendedTheme: 'oled',
    polarity: 'dark',
  },
  {
    id: 'mobile_noir_emerald',
    name: 'Ombre Profonde & Coins Or',
    category: 'noir',
    url: mobileNoirEmeraldImg,
    thumbUrl: mobileNoirEmeraldThumb,
    recommendedTheme: 'oled',
    polarity: 'dark',
  },

  // === 10 FONDS BLANCS (9:16) ===
  {
    id: 'mobile_blanc_minimal',
    name: 'Blanc Pur & Liseré Or',
    category: 'blanc',
    url: mobileBlancMinimalImg,
    thumbUrl: mobileBlancMinimalThumb,
    recommendedTheme: 'pure_white',
    polarity: 'light',
  },
  {
    id: 'mobile_blanc_marbre',
    name: 'Blanc Albâtre & Ogive',
    category: 'blanc',
    url: mobileBlancMarbreImg,
    thumbUrl: mobileBlancMarbreThumb,
    recommendedTheme: 'pure_white',
    polarity: 'light',
  },
  {
    id: 'mobile_blanc_silk',
    name: 'Papier Soie & Double Filet Or',
    category: 'blanc',
    url: mobileBlancSilkImg,
    thumbUrl: mobileBlancSilkThumb,
    recommendedTheme: 'pure_white',
    polarity: 'light',
  },
  {
    id: 'mobile_blanc_arch',
    name: 'Blanc Neige & Arche Platine',
    category: 'blanc',
    url: mobileBlancArchImg,
    thumbUrl: mobileBlancArchThumb,
    recommendedTheme: 'pure_white',
    polarity: 'light',
  },
  {
    id: 'mobile_blanc_crescent',
    name: 'Blanc Sacré & Croissant Or',
    category: 'blanc',
    url: mobileBlancCrescentImg,
    thumbUrl: mobileBlancCrescentThumb,
    recommendedTheme: 'pure_white',
    polarity: 'light',
  },
  {
    id: 'mobile_blanc_plaster',
    name: 'Stuc Médine & Coins Sable',
    category: 'blanc',
    url: mobileBlancPlasterImg,
    thumbUrl: mobileBlancPlasterThumb,
    recommendedTheme: 'pure_white',
    polarity: 'light',
  },
  {
    id: 'mobile_blanc_rosette',
    name: 'Porcelaine & Étoiles d’Angle',
    category: 'blanc',
    url: mobileBlancRosetteImg,
    thumbUrl: mobileBlancRosetteThumb,
    recommendedTheme: 'pure_white',
    polarity: 'light',
  },
  {
    id: 'mobile_blanc_andalous',
    name: 'Blanc Andalous & Frise Bronze',
    category: 'blanc',
    url: mobileBlancAndalousImg,
    thumbUrl: mobileBlancAndalousThumb,
    recommendedTheme: 'pure_white',
    polarity: 'light',
  },
  {
    id: 'mobile_blanc_cotton',
    name: 'Coton Musée & Trait d’Or',
    category: 'blanc',
    url: mobileBlancCottonImg,
    thumbUrl: mobileBlancCottonThumb,
    recommendedTheme: 'pure_white',
    polarity: 'light',
  },
  {
    id: 'mobile_blanc_linen',
    name: 'Lin Blanc Pur & Cadre Argent',
    category: 'blanc',
    url: mobileBlancLinenImg,
    thumbUrl: mobileBlancLinenThumb,
    recommendedTheme: 'pure_white',
    polarity: 'light',
  },
];

export interface StudioWallpaperItem {
  id: string;
  name: string;
  category: 'emeraude' | 'obsidienne' | 'saphir' | 'ivoire';
  url: string;
  thumbUrl: string;
  polarity: 'dark' | 'light';
}

export const STUDIO_4K_BACKGROUNDS: StudioWallpaperItem[] = [
  {
    id: 'emerald_fanous_archway',
    name: 'Porche Mauresque & Lanternes (4K)',
    category: 'emeraude',
    url: '/images/fonds-islamiques/emerald_fanous_archway_4k.webp',
    thumbUrl: '/images/fonds-islamiques/thumbs/emerald_fanous_archway_4k.webp',
    polarity: 'dark',
  },
  {
    id: 'emerald_celestial_glow',
    name: 'Rayonnement Céleste Émeraude (4K)',
    category: 'emeraude',
    url: '/images/fonds-islamiques/emerald_celestial_glow_4k.webp',
    thumbUrl: '/images/fonds-islamiques/thumbs/emerald_celestial_glow_4k.webp',
    polarity: 'dark',
  },
  {
    id: 'obsidian_gold_rays',
    name: "Marbre Noir & Rais d'Or (4K)",
    category: 'obsidienne',
    url: '/images/fonds-islamiques/obsidian_gold_rays_4k.webp',
    thumbUrl: '/images/fonds-islamiques/thumbs/obsidian_gold_rays_4k.webp',
    polarity: 'dark',
  },
  {
    id: 'midnight_gold_filigree',
    name: 'Mandala Astral Or & Ardoise (4K)',
    category: 'obsidienne',
    url: '/images/fonds-islamiques/midnight_gold_filigree_4k.webp',
    thumbUrl: '/images/fonds-islamiques/thumbs/midnight_gold_filigree_4k.webp',
    polarity: 'dark',
  },
  {
    id: 'midnight_gold_star',
    name: 'Étoile Géométrique 12 Branches (4K)',
    category: 'obsidienne',
    url: '/images/fonds-islamiques/midnight_gold_star_4k.webp',
    thumbUrl: '/images/fonds-islamiques/thumbs/midnight_gold_star_4k.webp',
    polarity: 'dark',
  },
  {
    id: 'obsidian_gold_waves',
    name: "Vagues d'Or Liquide & Marbre (4K)",
    category: 'obsidienne',
    url: '/images/fonds-islamiques/obsidian_gold_waves_4k.webp',
    thumbUrl: '/images/fonds-islamiques/thumbs/obsidian_gold_waves_4k.webp',
    polarity: 'dark',
  },
  {
    id: 'ref_obsidian_gold',
    name: 'Élégance Ombre Dorée (4K)',
    category: 'obsidienne',
    url: '/images/fonds-islamiques/ref_obsidian_gold_4k.webp',
    thumbUrl: '/images/fonds-islamiques/thumbs/ref_obsidian_gold_4k.webp',
    polarity: 'dark',
  },
  {
    id: 'sapphire_gold_mosque',
    name: "Mosquée Saphir & Croissant d'Or (4K)",
    category: 'saphir',
    url: '/images/fonds-islamiques/sapphire_gold_mosque_4k.webp',
    thumbUrl: '/images/fonds-islamiques/thumbs/sapphire_gold_mosque_4k.webp',
    polarity: 'dark',
  },
  {
    id: 'sapphire_lantern_night',
    name: 'Lanterne Indigo & Étoiles (4K)',
    category: 'saphir',
    url: '/images/fonds-islamiques/sapphire_lantern_night_4k.webp',
    thumbUrl: '/images/fonds-islamiques/thumbs/sapphire_lantern_night_4k.webp',
    polarity: 'dark',
  },
  {
    id: 'golden_twilight_dunes',
    name: 'Dunes Dorées sous la Nuit (4K)',
    category: 'saphir',
    url: '/images/fonds-islamiques/golden_twilight_dunes_4k.webp',
    thumbUrl: '/images/fonds-islamiques/thumbs/golden_twilight_dunes_4k.webp',
    polarity: 'dark',
  },
  {
    id: 'ivory_gold_arch',
    name: "Arche d'Ivoire & Stuc d'Or (4K)",
    category: 'ivoire',
    url: '/images/fonds-islamiques/ivory_gold_arch_4k.webp',
    thumbUrl: '/images/fonds-islamiques/thumbs/ivory_gold_arch_4k.webp',
    polarity: 'light',
  },
  {
    id: 'ivory_gold_courtyard',
    name: 'Patio Andalou aux Arches (4K)',
    category: 'ivoire',
    url: '/images/fonds-islamiques/ivory_gold_courtyard_4k.webp',
    thumbUrl: '/images/fonds-islamiques/thumbs/ivory_gold_courtyard_4k.webp',
    polarity: 'light',
  },
  {
    id: 'ivory_gold_palace',
    name: 'Palais Royal Blanc & Or (4K)',
    category: 'ivoire',
    url: '/images/fonds-islamiques/ivory_gold_palace_4k.webp',
    thumbUrl: '/images/fonds-islamiques/thumbs/ivory_gold_palace_4k.webp',
    polarity: 'light',
  },
  {
    id: 'ivory_marble_arch',
    name: 'Marbre de Carrare & Moucharabieh (4K)',
    category: 'ivoire',
    url: '/images/fonds-islamiques/ivory_marble_arch_4k.webp',
    thumbUrl: '/images/fonds-islamiques/thumbs/ivory_marble_arch_4k.webp',
    polarity: 'light',
  },
  {
    id: 'ivory_gold_rosette',
    name: "Rosace Dorée d'Angle (4K)",
    category: 'ivoire',
    url: '/images/fonds-islamiques/ivory_gold_rosette_4k.webp',
    thumbUrl: '/images/fonds-islamiques/thumbs/ivory_gold_rosette_4k.webp',
    polarity: 'light',
  },
  {
    id: 'ref_ivory_gold',
    name: 'Géométrie Ivoire & Doré (4K)',
    category: 'ivoire',
    url: '/images/fonds-islamiques/ref_ivory_gold_4k.webp',
    thumbUrl: '/images/fonds-islamiques/thumbs/ref_ivory_gold_4k.webp',
    polarity: 'light',
  },
];

export const STUDIO_SOLID_BACKGROUNDS: Array<{
  id: string;
  name: string;
  color: string;
  polarity: 'dark' | 'light';
}> = [
  { id: 'none_noir', name: 'Noir Uni', color: '#050505', polarity: 'dark' },
  { id: 'none_blanc', name: 'Blanc Uni', color: '#FCFCFB', polarity: 'light' },
  { id: 'none_emerald', name: 'Émeraude', color: '#06261B', polarity: 'dark' },
  { id: 'none_midnight', name: 'Bleu Nuit', color: '#0A1328', polarity: 'dark' },
];

