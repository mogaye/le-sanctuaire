import { getEffectiveResScale, VideoCanvasRenderOptions } from './canvasVideoRenderer';

export type QuizIslamicMotifKind =
  | 'crescent_stars'
  | 'fanous_lanterns'
  | 'khatam_rosette'
  | 'arabesque_medallions'
  | 'mihrab_arches'
  | 'olive_constellation'
  | 'parchment_rosettes'
  | 'mint_crescents';

export interface QuizAnimatedBgPreset {
  id: string;
  name: string;
  subtitle: string;
  polarity: 'dark' | 'light';
  baseColor: string;
  deepBlobColor: string;
  glowOrbColor: string;
  motifColor: string;
  motifAccentColor: string;
  motifKind: QuizIslamicMotifKind;
}

export const QUIZ_ANIMATED_BACKGROUNDS: QuizAnimatedBgPreset[] = [
  {
    id: 'quiz_emeraude_croissants',
    name: 'Émeraude & Croissants',
    subtitle: 'Croissants et étoiles flottantes',
    polarity: 'dark',
    baseColor: '#117A70',
    deepBlobColor: '#0B4F4A',
    glowOrbColor: 'rgba(45, 212, 191, 0.24)',
    motifColor: '#99F6E4',
    motifAccentColor: '#FDE68A',
    motifKind: 'crescent_stars',
  },
  {
    id: 'quiz_saphir_fanous',
    name: 'Saphir & Fanous',
    subtitle: 'Lanternes oscillantes dorées',
    polarity: 'dark',
    baseColor: '#0F315E',
    deepBlobColor: '#071A36',
    glowOrbColor: 'rgba(56, 189, 248, 0.24)',
    motifColor: '#FCD34D',
    motifAccentColor: '#BAE6FD',
    motifKind: 'fanous_lanterns',
  },
  {
    id: 'quiz_or_khatam',
    name: 'Or Royal & Khatam',
    subtitle: 'Étoiles à 8 branches mouvantes',
    polarity: 'dark',
    baseColor: '#1E160A',
    deepBlobColor: '#0E0A04',
    glowOrbColor: 'rgba(212, 175, 55, 0.24)',
    motifColor: '#F5D061',
    motifAccentColor: '#FEF3C7',
    motifKind: 'khatam_rosette',
  },
  {
    id: 'quiz_rubis_arabesque',
    name: 'Rubis & Arabesques',
    subtitle: 'Rosaces célestes en rotation',
    polarity: 'dark',
    baseColor: '#5B1431',
    deepBlobColor: '#34091B',
    glowOrbColor: 'rgba(251, 113, 133, 0.24)',
    motifColor: '#FDE68A',
    motifAccentColor: '#FDA4AF',
    motifKind: 'arabesque_medallions',
  },
  {
    id: 'quiz_turquoise_mihrab',
    name: 'Turquoise & Mihrab',
    subtitle: 'Arches mauresques et étoiles',
    polarity: 'dark',
    baseColor: '#0E5E6F',
    deepBlobColor: '#073844',
    glowOrbColor: 'rgba(34, 211, 238, 0.24)',
    motifColor: '#A5F3FC',
    motifAccentColor: '#FDE68A',
    motifKind: 'mihrab_arches',
  },
  {
    id: 'quiz_olive_medine',
    name: 'Olive & Constellations',
    subtitle: 'Croissants et géométrie de Médine',
    polarity: 'dark',
    baseColor: '#1F4A33',
    deepBlobColor: '#112B1D',
    glowOrbColor: 'rgba(110, 231, 183, 0.22)',
    motifColor: '#A7F3D0',
    motifAccentColor: '#FDE68A',
    motifKind: 'olive_constellation',
  },
  {
    id: 'quiz_parchemin_rosaces',
    name: 'Parchemin & Rosaces',
    subtitle: 'Ivoire doux et mandalas dorés',
    polarity: 'light',
    baseColor: '#F5EFE2',
    deepBlobColor: '#E5D8BF',
    glowOrbColor: 'rgba(16, 185, 129, 0.14)',
    motifColor: '#047857',
    motifAccentColor: '#B45309',
    motifKind: 'parchment_rosettes',
  },
  {
    id: 'quiz_menthe_croissants',
    name: 'Menthe & Croissants',
    subtitle: 'Éclat clair et croissants mobiles',
    polarity: 'light',
    baseColor: '#E7F5EE',
    deepBlobColor: '#C9E8D9',
    glowOrbColor: 'rgba(20, 184, 166, 0.18)',
    motifColor: '#0F766E',
    motifAccentColor: '#D97706',
    motifKind: 'mint_crescents',
  },
  {
    id: 'quiz_lagon_andalou',
    name: 'Lagon Andalou',
    subtitle: 'Croissants océan et étoiles dorées',
    polarity: 'dark',
    baseColor: '#0D6E6E',
    deepBlobColor: '#08494C',
    glowOrbColor: 'rgba(94, 234, 212, 0.24)',
    motifColor: '#CCFBF1',
    motifAccentColor: '#FDE68A',
    motifKind: 'crescent_stars',
  },
  {
    id: 'quiz_nuit_qamar',
    name: 'Nuit du Qamar',
    subtitle: 'Lanternes célestes indigo',
    polarity: 'dark',
    baseColor: '#1A1E4D',
    deepBlobColor: '#0D1030',
    glowOrbColor: 'rgba(129, 140, 248, 0.24)',
    motifColor: '#FDE68A',
    motifAccentColor: '#C7D2FE',
    motifKind: 'fanous_lanterns',
  },
  {
    id: 'quiz_jade_aqsa',
    name: 'Jade Al-Aqsa',
    subtitle: 'Arches vertes et lumières douces',
    polarity: 'dark',
    baseColor: '#14533C',
    deepBlobColor: '#0B3325',
    glowOrbColor: 'rgba(52, 211, 153, 0.23)',
    motifColor: '#A7F3D0',
    motifAccentColor: '#FCD34D',
    motifKind: 'mihrab_arches',
  },
  {
    id: 'quiz_prune_damas',
    name: 'Prune de Damas',
    subtitle: 'Rosaces pourpres et éclats dorés',
    polarity: 'dark',
    baseColor: '#43194D',
    deepBlobColor: '#280C30',
    glowOrbColor: 'rgba(232, 121, 249, 0.22)',
    motifColor: '#FDE68A',
    motifAccentColor: '#F5D0FE',
    motifKind: 'arabesque_medallions',
  },
  {
    id: 'quiz_bronze_alhambra',
    name: 'Bronze & Alhambra',
    subtitle: 'Étoiles géométriques chaleureuses',
    polarity: 'dark',
    baseColor: '#4A2C16',
    deepBlobColor: '#2C180B',
    glowOrbColor: 'rgba(245, 158, 11, 0.24)',
    motifColor: '#FCD34D',
    motifAccentColor: '#FEF3C7',
    motifKind: 'khatam_rosette',
  },
  {
    id: 'quiz_ardoise_celeste',
    name: 'Ardoise Céleste',
    subtitle: 'Croissants nocturnes bleu ciel',
    polarity: 'dark',
    baseColor: '#1E293B',
    deepBlobColor: '#0F172A',
    glowOrbColor: 'rgba(56, 189, 248, 0.22)',
    motifColor: '#7DD3FC',
    motifAccentColor: '#FDE68A',
    motifKind: 'crescent_stars',
  },
  {
    id: 'quiz_petrole_coupoles',
    name: 'Pétrole & Coupoles',
    subtitle: 'Arches profondes et constellations',
    polarity: 'dark',
    baseColor: '#124559',
    deepBlobColor: '#082936',
    glowOrbColor: 'rgba(45, 212, 191, 0.22)',
    motifColor: '#99F6E4',
    motifAccentColor: '#FDE68A',
    motifKind: 'mihrab_arches',
  },
  {
    id: 'quiz_grenade_etoiles',
    name: 'Grenade & Étoiles',
    subtitle: 'Lanternes rubis et scintillements',
    polarity: 'dark',
    baseColor: '#6B1D28',
    deepBlobColor: '#3E0E15',
    glowOrbColor: 'rgba(251, 146, 60, 0.22)',
    motifColor: '#FDE68A',
    motifAccentColor: '#FECDD3',
    motifKind: 'fanous_lanterns',
  },
  {
    id: 'quiz_sable_doux',
    name: 'Sable & Or Doux',
    subtitle: 'Nuances crème et géométrie fine',
    polarity: 'light',
    baseColor: '#F3EBDC',
    deepBlobColor: '#E2D3B9',
    glowOrbColor: 'rgba(217, 119, 6, 0.14)',
    motifColor: '#065F46',
    motifAccentColor: '#B45309',
    motifKind: 'olive_constellation',
  },
  {
    id: 'quiz_azur_matin',
    name: 'Azur du Matin',
    subtitle: 'Ciel clair et rosaces apaisantes',
    polarity: 'light',
    baseColor: '#E8F2FA',
    deepBlobColor: '#CCE0F2',
    glowOrbColor: 'rgba(14, 165, 233, 0.16)',
    motifColor: '#0369A1',
    motifAccentColor: '#D97706',
    motifKind: 'parchment_rosettes',
  },
];

export const DEFAULT_QUIZ_ANIMATED_BG_ID = QUIZ_ANIMATED_BACKGROUNDS[0].id;

export function getQuizAnimatedBgPreset(id?: string | null): QuizAnimatedBgPreset {
  if (id) {
    const found = QUIZ_ANIMATED_BACKGROUNDS.find((bg) => bg.id === id);
    if (found) return found;
  }
  return QUIZ_ANIMATED_BACKGROUNDS[0];
}

export function resolveValidQuizBgId(id?: string | null): string {
  return getQuizAnimatedBgPreset(id).id;
}

function hexToRgbTuple(hex: string): [number, number, number] {
  const clean = (hex || '#117A70').replace('#', '').trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16) || 17,
      parseInt(clean[1] + clean[1], 16) || 122,
      parseInt(clean[2] + clean[2], 16) || 112,
    ];
  }
  if (clean.length >= 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if ([r, g, b].every((n) => Number.isFinite(n))) {
      return [r, g, b];
    }
  }
  return [17, 122, 112];
}

function colorWithAlpha(hexOrRgba: string, alpha: number): string {
  const safeA = Math.max(0, Math.min(1, alpha));
  if (hexOrRgba.startsWith('#')) {
    const [r, g, b] = hexToRgbTuple(hexOrRgba);
    return `rgba(${r}, ${g}, ${b}, ${safeA.toFixed(3)})`;
  }
  return hexOrRgba;
}

function wrapCoord(val: number, minVal: number, maxVal: number): number {
  const span = Math.max(1, maxVal - minVal);
  const norm = ((val - minVal) % span + span) % span;
  return minVal + norm;
}

function rotPt(
  cx: number,
  cy: number,
  lx: number,
  ly: number,
  angle: number
): [number, number] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [cx + lx * cos - ly * sin, cy + lx * sin + ly * cos];
}

export interface QuizBgAnimatedEntity {
  x: number;
  y: number;
  radius: number;
  angle: number;
}

export interface QuizBgMotionSnapshot {
  blobs: QuizBgAnimatedEntity[];
  motifs: QuizBgAnimatedEntity[];
  latticeOffsetX: number;
  latticeOffsetY: number;
}

/**
 * Pure deterministic motion computation for all organic blobs, tile lattice, and Islamic motifs.
 * Guarantees continuous smooth movement over timeSec across live preview, seek, and MP4 export.
 */
export function computeQuizBgMotionSnapshot(
  bgId: string | undefined,
  timeSec: number,
  width: number,
  height: number
): QuizBgMotionSnapshot {
  const t = Number.isFinite(timeSec) ? timeSec : 0;
  const minDim = Math.max(120, Math.min(width, height));
  const resScale = getEffectiveResScale(width, height);
  const presetIndex = Math.max(
    0,
    QUIZ_ANIMATED_BACKGROUNDS.findIndex((b) => b.id === resolveValidQuizBgId(bgId))
  );
  const phaseShift = presetIndex * 0.85;

  // 4 organic color-field blobs (2 deep, 2 luminous orbs) moving smoothly along Lissajous orbits
  const blobs: QuizBgAnimatedEntity[] = [
    {
      x: width * (0.14 + 0.08 * Math.sin(t * 0.42 + phaseShift)),
      y: height * (0.16 + 0.07 * Math.cos(t * 0.36 + phaseShift)),
      radius: minDim * (0.34 + 0.03 * Math.sin(t * 0.55 + 0.4)),
      angle: t * 0.15,
    },
    {
      x: width * (0.86 + 0.08 * Math.cos(t * 0.39 + phaseShift + 1.1)),
      y: height * (0.84 + 0.07 * Math.sin(t * 0.44 + phaseShift + 0.7)),
      radius: minDim * (0.38 + 0.032 * Math.cos(t * 0.48 + 1.2)),
      angle: -t * 0.14,
    },
    {
      x: width * (0.80 + 0.10 * Math.sin(t * 0.52 + phaseShift + 2.0)),
      y: height * (0.28 + 0.09 * Math.cos(t * 0.47 + phaseShift + 0.5)),
      radius: minDim * (0.22 + 0.025 * Math.sin(t * 0.65 + 2.1)),
      angle: t * 0.22,
    },
    {
      x: width * (0.20 + 0.10 * Math.cos(t * 0.49 + phaseShift + 2.7)),
      y: height * (0.72 + 0.09 * Math.sin(t * 0.41 + phaseShift + 1.4)),
      radius: minDim * (0.21 + 0.024 * Math.cos(t * 0.61 + 0.9)),
      angle: -t * 0.2,
    },
  ];

  // 6 Islamic motif anchors drifting & rotating/swaying across the background canvas
  const margin = Math.round(70 * resScale);
  const driftSpeedBase = 24 * resScale;
  const motifSpecs = [
    { xf: 0.15, yf: 0.22, vy: 1.0, ax: 24, wx: 0.72, rot: 0.34, rf: 0.068, ph: 0.2 },
    { xf: 0.85, yf: 0.19, vy: 0.85, ax: 28, wx: 0.64, rot: -0.30, rf: 0.060, ph: 1.4 },
    { xf: 0.12, yf: 0.58, vy: 1.12, ax: 22, wx: 0.78, rot: 0.28, rf: 0.052, ph: 2.5 },
    { xf: 0.88, yf: 0.62, vy: 0.92, ax: 26, wx: 0.69, rot: -0.36, rf: 0.056, ph: 3.3 },
    { xf: 0.24, yf: 0.86, vy: 1.05, ax: 20, wx: 0.82, rot: 0.32, rf: 0.048, ph: 4.1 },
    { xf: 0.76, yf: 0.88, vy: 0.96, ax: 25, wx: 0.75, rot: -0.26, rf: 0.062, ph: 5.0 },
  ];

  const motifs: QuizBgAnimatedEntity[] = motifSpecs.map((spec) => {
    const rawY = height * spec.yf - t * driftSpeedBase * spec.vy;
    const y = wrapCoord(rawY, -margin, height + margin);
    const x =
      width * spec.xf +
      spec.ax * resScale * Math.sin(t * spec.wx + spec.ph + phaseShift);
    return {
      x,
      y,
      radius: minDim * spec.rf,
      angle: spec.ph + t * spec.rot,
    };
  });

  const cellSize = Math.max(48, Math.round(92 * resScale));
  const latticeOffsetX = ((t * 18 * resScale) % cellSize + cellSize) % cellSize;
  const latticeOffsetY = ((t * 11 * resScale) % cellSize + cellSize) % cellSize;

  return {
    blobs,
    motifs,
    latticeOffsetX,
    latticeOffsetY,
  };
}

function drawRotatedPolygon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  sides: number,
  angle: number
) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = angle + (i * Math.PI * 2) / sides;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawIslamicRubElHizb(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number,
  strokeColor: string,
  fillColor: string,
  lineWidth: number
) {
  ctx.save();
  // Two interlocking squares rotated by 45deg
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;

  drawRotatedPolygon(ctx, cx, cy, r, 4, angle);
  ctx.fill();
  ctx.stroke();

  drawRotatedPolygon(ctx, cx, cy, r, 4, angle + Math.PI / 4);
  ctx.fill();
  ctx.stroke();

  // Inner circle jewel
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.36, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.14, 0, Math.PI * 2);
  ctx.fillStyle = strokeColor;
  ctx.fill();
  ctx.restore();
}

function drawIslamicRosette(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number,
  strokeColor: string,
  accentColor: string,
  lineWidth: number
) {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;

  // Outer 12-point star wave
  const pts = 12;
  ctx.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.56;
    const a = angle + (i * Math.PI) / pts;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // Counter-rotating inner 8-point star
  ctx.strokeStyle = accentColor;
  drawRotatedPolygon(ctx, cx, cy, r * 0.52, 4, -angle * 1.2);
  ctx.stroke();
  drawRotatedPolygon(ctx, cx, cy, r * 0.52, 4, -angle * 1.2 + Math.PI / 4);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawIslamicCrescentWithStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  tiltAngle: number,
  fillColor: string,
  starColor: string
) {
  ctx.save();
  const offX = Math.cos(tiltAngle) * (r * 0.42) - Math.sin(tiltAngle) * (-r * 0.1);
  const offY = Math.sin(tiltAngle) * (r * 0.42) + Math.cos(tiltAngle) * (-r * 0.1);

  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0.34 * Math.PI + tiltAngle, 1.66 * Math.PI + tiltAngle, false);
  ctx.arc(
    cx + offX,
    cy + offY,
    r * 0.78,
    1.56 * Math.PI + tiltAngle,
    0.44 * Math.PI + tiltAngle,
    true
  );
  ctx.closePath();
  ctx.fill();

  // Companion twinkling star inside crescent mouth
  const [sx, sy] = rotPt(cx, cy, r * 0.58, -r * 0.08, tiltAngle);
  const sr = r * 0.28;
  ctx.fillStyle = starColor;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? sr : sr * 0.42;
    const a = tiltAngle * 1.4 + (i * Math.PI) / 5;
    const px = sx + Math.cos(a) * rad;
    const py = sy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawIslamicFanousLantern(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scaleR: number,
  swayAngle: number,
  frameColor: string,
  glowColor: string,
  lineWidth: number
) {
  ctx.save();
  // Hanging cord upwards
  const [cordTopX, cordTopY] = rotPt(cx, cy, 0, -scaleR * 1.9, swayAngle * 0.45);
  const [ringX, ringY] = rotPt(cx, cy, 0, -scaleR * 1.05, swayAngle);
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = Math.max(1, lineWidth * 0.75);
  ctx.beginPath();
  ctx.moveTo(cordTopX, cordTopY);
  ctx.lineTo(ringX, ringY);
  ctx.stroke();

  // Top suspension ring
  ctx.beginPath();
  ctx.arc(ringX, ringY, scaleR * 0.14, 0, Math.PI * 2);
  ctx.stroke();

  // Soft warm inner glow inside lantern chamber
  if (typeof ctx.createRadialGradient === 'function') {
    const [gx, gy] = rotPt(cx, cy, 0, scaleR * 0.05, swayAngle);
    const grad = ctx.createRadialGradient(gx, gy, scaleR * 0.08, gx, gy, scaleR * 0.95);
    grad.addColorStop(0, glowColor);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(gx, gy, scaleR * 0.95, 0, Math.PI * 2);
    ctx.fill();
  }

  // Lantern silhouette: dome + hexagonal glass body + tapered base
  const pts: Array<[number, number]> = [
    [0, -scaleR * 0.9],
    [scaleR * 0.26, -scaleR * 0.56],
    [scaleR * 0.5, -scaleR * 0.36],
    [scaleR * 0.38, scaleR * 0.48],
    [scaleR * 0.48, scaleR * 0.68],
    [scaleR * 0.18, scaleR * 0.86],
    [0, scaleR * 1.06],
    [-scaleR * 0.18, scaleR * 0.86],
    [-scaleR * 0.48, scaleR * 0.68],
    [-scaleR * 0.38, scaleR * 0.48],
    [-scaleR * 0.5, -scaleR * 0.36],
    [-scaleR * 0.26, -scaleR * 0.56],
  ];

  ctx.strokeStyle = frameColor;
  ctx.fillStyle = colorWithAlpha(glowColor.startsWith('#') ? glowColor : '#FDE68A', 0.22);
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  pts.forEach(([lx, ly], idx) => {
    const [wx, wy] = rotPt(cx, cy, lx, ly, swayAngle);
    if (idx === 0) ctx.moveTo(wx, wy);
    else ctx.lineTo(wx, wy);
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner pointed mihrab window struts inside lantern
  const [topArchX, topArchY] = rotPt(cx, cy, 0, -scaleR * 0.28, swayAngle);
  const [botArchLX, botArchLY] = rotPt(cx, cy, -scaleR * 0.22, scaleR * 0.42, swayAngle);
  const [botArchRX, botArchRY] = rotPt(cx, cy, scaleR * 0.22, scaleR * 0.42, swayAngle);
  ctx.beginPath();
  ctx.moveTo(botArchLX, botArchLY);
  ctx.lineTo(topArchX, topArchY);
  ctx.lineTo(botArchRX, botArchRY);
  ctx.stroke();

  ctx.restore();
}

function drawIslamicMihrabArch(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  swayAngle: number,
  strokeColor: string,
  fillColor: string,
  lineWidth: number
) {
  ctx.save();
  const w = r * 1.35;
  const h = r * 1.85;
  const apex: [number, number] = rotPt(cx, cy, 0, -h * 0.55, swayAngle * 0.25);
  const shoulderL: [number, number] = rotPt(cx, cy, -w * 0.5, -h * 0.1, swayAngle * 0.25);
  const shoulderR: [number, number] = rotPt(cx, cy, w * 0.5, -h * 0.1, swayAngle * 0.25);
  const ctrlL: [number, number] = rotPt(cx, cy, -w * 0.48, -h * 0.42, swayAngle * 0.25);
  const ctrlR: [number, number] = rotPt(cx, cy, w * 0.48, -h * 0.42, swayAngle * 0.25);
  const baseL: [number, number] = rotPt(cx, cy, -w * 0.5, h * 0.5, swayAngle * 0.25);
  const baseR: [number, number] = rotPt(cx, cy, w * 0.5, h * 0.5, swayAngle * 0.25);

  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(baseL[0], baseL[1]);
  ctx.lineTo(shoulderL[0], shoulderL[1]);
  ctx.quadraticCurveTo(ctrlL[0], ctrlL[1], apex[0], apex[1]);
  ctx.quadraticCurveTo(ctrlR[0], ctrlR[1], shoulderR[0], shoulderR[1]);
  ctx.lineTo(baseR[0], baseR[1]);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Hanging inner star inside the Mihrab arch
  drawIslamicRubElHizb(
    ctx,
    cx,
    cy - r * 0.1,
    r * 0.24,
    swayAngle * 1.5,
    strokeColor,
    fillColor,
    Math.max(1, lineWidth * 0.8)
  );
  ctx.restore();
}

function drawFourPointSparkle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fillColor: string
) {
  ctx.save();
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMovingGirihLattice(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
  cellSize: number,
  strokeColor: string,
  lineWidth: number
) {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  const half = cellSize / 2;

  for (let gx = -cellSize + offsetX; gx < width + cellSize; gx += cellSize) {
    for (let gy = -cellSize + offsetY; gy < height + cellSize; gy += cellSize) {
      // Subtle diamond lattice tile
      ctx.beginPath();
      ctx.moveTo(gx, gy - half);
      ctx.lineTo(gx + half, gy);
      ctx.lineTo(gx, gy + half);
      ctx.lineTo(gx - half, gy);
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * Renders an animated, purely procedural Islamic background tailored to Quiz Mode
 * (zero raster background images). Every blob, geometric grid, and Islamic motif
 * continuously translates, orbits, sways, or rotates as a smooth function of timeSec.
 */
export function renderQuizAnimatedIslamicBackground(
  ctx: CanvasRenderingContext2D,
  timeSec: number,
  width: number,
  height: number,
  bgId?: string | null,
  opts?: Partial<
    Pick<
      VideoCanvasRenderOptions,
      'bgBlackBackdrop' | 'bgVeilOpacity' | 'isLightSurface'
    >
  >
): number {
  const resScale = getEffectiveResScale(width, height);
  const preset = getQuizAnimatedBgPreset(bgId);
  const t = Number.isFinite(timeSec) ? timeSec : 0;
  const motion = computeQuizBgMotionSnapshot(preset.id, t, width, height);

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Rich color-field base
  ctx.fillStyle = preset.baseColor;
  ctx.fillRect(0, 0, width, height);

  // 2. Orbiting deep organic corner/field blobs (signature emeraude_cadre style, animated)
  ctx.fillStyle = preset.deepBlobColor;
  for (let i = 0; i < 2; i++) {
    const blob = motion.blobs[i];
    ctx.beginPath();
    ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Drifting translucent luminous accent orbs
  ctx.fillStyle = preset.glowOrbColor;
  for (let i = 2; i < 4; i++) {
    const blob = motion.blobs[i];
    ctx.beginPath();
    ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Slow-gliding geometric Islamic Girih diamond lattice
  const cellSize = Math.max(48, Math.round(92 * resScale));
  drawMovingGirihLattice(
    ctx,
    width,
    height,
    motion.latticeOffsetX,
    motion.latticeOffsetY,
    cellSize,
    colorWithAlpha(preset.motifColor, preset.polarity === 'light' ? 0.08 : 0.065),
    Math.max(1, 1.1 * resScale)
  );

  // 5. Moving Islamic Motifs (rotating stars, swaying lanterns, drifting crescents, rosettes, mihrabs)
  const strokeLw = Math.max(1.4, 2.0 * resScale);
  const primaryStroke = colorWithAlpha(
    preset.motifColor,
    preset.polarity === 'light' ? 0.24 : 0.28
  );
  const primaryFill = colorWithAlpha(
    preset.motifColor,
    preset.polarity === 'light' ? 0.14 : 0.18
  );
  const accentStroke = colorWithAlpha(
    preset.motifAccentColor,
    preset.polarity === 'light' ? 0.26 : 0.30
  );
  const accentFill = colorWithAlpha(
    preset.motifAccentColor,
    preset.polarity === 'light' ? 0.15 : 0.20
  );

  motion.motifs.forEach((m, idx) => {
    const isEven = idx % 2 === 0;
    switch (preset.motifKind) {
      case 'fanous_lanterns':
        if (idx % 3 === 0) {
          drawIslamicCrescentWithStar(
            ctx,
            m.x,
            m.y,
            m.radius * 0.85,
            0.22 * Math.sin(t * 0.9 + idx),
            accentFill,
            primaryStroke
          );
        } else {
          drawIslamicFanousLantern(
            ctx,
            m.x,
            m.y,
            m.radius * 0.9,
            0.16 * Math.sin(t * 1.25 + idx * 1.1),
            isEven ? accentStroke : primaryStroke,
            preset.motifColor,
            strokeLw
          );
        }
        break;

      case 'khatam_rosette':
      case 'parchment_rosettes':
        if (isEven) {
          drawIslamicRubElHizb(
            ctx,
            m.x,
            m.y,
            m.radius * 0.95,
            m.angle,
            primaryStroke,
            primaryFill,
            strokeLw
          );
        } else {
          drawIslamicRosette(
            ctx,
            m.x,
            m.y,
            m.radius,
            m.angle,
            accentStroke,
            primaryStroke,
            strokeLw
          );
        }
        break;

      case 'arabesque_medallions':
        if (idx % 3 === 1) {
          drawIslamicCrescentWithStar(
            ctx,
            m.x,
            m.y,
            m.radius * 0.88,
            0.28 * Math.cos(t * 0.85 + idx),
            primaryFill,
            accentStroke
          );
        } else {
          drawIslamicRosette(
            ctx,
            m.x,
            m.y,
            m.radius * 1.02,
            m.angle * 1.1,
            primaryStroke,
            accentStroke,
            strokeLw
          );
        }
        break;

      case 'mihrab_arches':
        if (isEven) {
          drawIslamicMihrabArch(
            ctx,
            m.x,
            m.y,
            m.radius * 0.92,
            Math.sin(t * 0.9 + idx) * 0.25,
            primaryStroke,
            primaryFill,
            strokeLw
          );
        } else {
          drawIslamicRubElHizb(
            ctx,
            m.x,
            m.y,
            m.radius * 0.82,
            m.angle,
            accentStroke,
            accentFill,
            strokeLw
          );
        }
        break;

      case 'olive_constellation':
      case 'mint_crescents':
      case 'crescent_stars':
      default:
        if (isEven) {
          drawIslamicCrescentWithStar(
            ctx,
            m.x,
            m.y,
            m.radius * 0.92,
            0.24 * Math.sin(t * 0.9 + idx),
            idx === 0 ? accentFill : primaryFill,
            idx === 0 ? primaryStroke : accentStroke
          );
        } else {
          drawIslamicRubElHizb(
            ctx,
            m.x,
            m.y,
            m.radius * 0.84,
            m.angle,
            primaryStroke,
            accentFill,
            strokeLw
          );
        }
        break;
    }
  });

  // 6. Floating Noor spiritual sparkles rising smoothly across the scene
  const moteCount = 12;
  const moteMargin = Math.round(28 * resScale);
  for (let i = 0; i < moteCount; i++) {
    const seedX = ((i * 0.173 + 0.08) % 0.92) + 0.04;
    const speedY = (26 + (i % 4) * 8) * resScale;
    const baseY = ((i * 0.291) % 1) * height;
    const my = wrapCoord(baseY - t * speedY, -moteMargin, height + moteMargin);
    const mx =
      width * seedX +
      Math.sin(t * (0.9 + (i % 3) * 0.25) + i * 1.3) * (16 * resScale);
    const pulse = 0.24 + 0.34 * (0.5 + 0.5 * Math.sin(t * 1.9 + i * 0.9));
    const mr = (3.5 + (i % 3) * 2.1) * resScale;
    drawFourPointSparkle(
      ctx,
      mx,
      my,
      mr,
      colorWithAlpha(
        i % 2 === 0 ? preset.motifAccentColor : preset.motifColor,
        pulse
      )
    );
  }

  // 7. Optional user-toggled Contre-fond noir scrim for extra text contrast
  if (opts?.bgBlackBackdrop) {
    const rawVeil =
      typeof opts.bgVeilOpacity === 'number'
        ? Math.max(0.25, Math.min(0.92, opts.bgVeilOpacity))
        : 0.45;
    ctx.fillStyle = `rgba(0, 0, 0, ${rawVeil.toFixed(2)})`;
    ctx.fillRect(0, 0, width, height);

    if (typeof ctx.createRadialGradient === 'function') {
      const cx = width / 2;
      const cy = height / 2;
      const scrimGrad = ctx.createRadialGradient(
        cx,
        cy,
        Math.min(width, height) * 0.14,
        cx,
        cy,
        Math.max(width, height) * 0.72
      );
      scrimGrad.addColorStop(0, `rgba(0, 0, 0, ${Math.min(0.55, rawVeil * 0.65).toFixed(2)})`);
      scrimGrad.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
      ctx.fillStyle = scrimGrad;
      ctx.fillRect(0, 0, width, height);
    }
  }

  ctx.restore();
  return resScale;
}
