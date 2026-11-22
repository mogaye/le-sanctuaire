export type QuizQuestionBoxStyle = 'framed' | 'banner' | 'minimal' | 'double_gold';
export type QuizOptionShape = 'rounded' | 'pill' | 'sharp' | 'outline';
export type QuizBadgeShape = 'circle' | 'rounded_square' | 'solid_pill';
export type QuizTimerStyle = 'bar_circle' | 'bar_only' | 'pill_badge';
export type QuizFontStyle = 'modern' | 'serif' | 'bold_display';

export interface QuizVisualDesign {
  id: string;
  name: string;
  isCustom?: boolean;
  questionBoxStyle: QuizQuestionBoxStyle;
  optionShape: QuizOptionShape;
  badgeShape: QuizBadgeShape;
  timerStyle: QuizTimerStyle;
  fontStyle: QuizFontStyle;
  accentColor: string;
  goldColor: string;
  questionTextColor: string;
  cardBgColor: string;
  borderColor: string;
  cardOpacity: number; // 0.25 .. 0.96
}

export const BUILT_IN_QUIZ_DESIGNS: QuizVisualDesign[] = [
  {
    id: 'sanctuaire_emeraude',
    name: 'Sanctuaire Émeraude',
    questionBoxStyle: 'framed',
    optionShape: 'rounded',
    badgeShape: 'circle',
    timerStyle: 'bar_circle',
    fontStyle: 'modern',
    accentColor: '#10B981',
    goldColor: '#FBBF24',
    questionTextColor: '#F8FAFC',
    cardBgColor: '#0F172A',
    borderColor: '#FBBF24',
    cardOpacity: 0.8,
  },
  {
    id: 'or_royal',
    name: 'Or Royal',
    questionBoxStyle: 'double_gold',
    optionShape: 'sharp',
    badgeShape: 'rounded_square',
    timerStyle: 'bar_circle',
    fontStyle: 'serif',
    accentColor: '#D4AF37',
    goldColor: '#F5D061',
    questionTextColor: '#FEF9E7',
    cardBgColor: '#14110B',
    borderColor: '#D4AF37',
    cardOpacity: 0.86,
  },
  {
    id: 'nuit_turquoise',
    name: 'Nuit Turquoise',
    questionBoxStyle: 'banner',
    optionShape: 'pill',
    badgeShape: 'solid_pill',
    timerStyle: 'pill_badge',
    fontStyle: 'bold_display',
    accentColor: '#22D3EE',
    goldColor: '#67E8F9',
    questionTextColor: '#F0FDFA',
    cardBgColor: '#08202C',
    borderColor: '#22D3EE',
    cardOpacity: 0.78,
  },
  {
    id: 'lumiere_parchemin',
    name: 'Lumière & Parchemin',
    questionBoxStyle: 'framed',
    optionShape: 'rounded',
    badgeShape: 'circle',
    timerStyle: 'bar_circle',
    fontStyle: 'serif',
    accentColor: '#047857',
    goldColor: '#B45309',
    questionTextColor: '#111827',
    cardBgColor: '#FFFDF7',
    borderColor: '#047857',
    cardOpacity: 0.92,
  },
  {
    id: 'minimal_epure',
    name: 'Épuré Moderne',
    questionBoxStyle: 'minimal',
    optionShape: 'outline',
    badgeShape: 'circle',
    timerStyle: 'bar_only',
    fontStyle: 'modern',
    accentColor: '#34D399',
    goldColor: '#E2E8F0',
    questionTextColor: '#FFFFFF',
    cardBgColor: '#0B111E',
    borderColor: '#E2E8F0',
    cardOpacity: 0.55,
  },
  {
    id: 'ambre_ramadan',
    name: 'Ambre & Rubis',
    questionBoxStyle: 'banner',
    optionShape: 'rounded',
    badgeShape: 'rounded_square',
    timerStyle: 'pill_badge',
    fontStyle: 'bold_display',
    accentColor: '#F59E0B',
    goldColor: '#FDE68A',
    questionTextColor: '#FFFBEB',
    cardBgColor: '#240B14',
    borderColor: '#F59E0B',
    cardOpacity: 0.82,
  },
];

export const DEFAULT_QUIZ_DESIGN: QuizVisualDesign = BUILT_IN_QUIZ_DESIGNS[0];

const CUSTOM_DESIGNS_STORAGE_KEY = 'sanctuaire_custom_quiz_designs_v1';

export function hexToRgba(hex: string, alpha: number): string {
  const clean = (hex || '#0F172A').replace('#', '').trim();
  const safeAlpha = Math.max(0, Math.min(1, Number.isFinite(alpha) ? alpha : 0.8));
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) || 15;
    const g = parseInt(clean[1] + clean[1], 16) || 23;
    const b = parseInt(clean[2] + clean[2], 16) || 42;
    return `rgba(${r}, ${g}, ${b}, ${safeAlpha.toFixed(2)})`;
  }
  if (clean.length >= 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if ([r, g, b].every((n) => Number.isFinite(n))) {
      return `rgba(${r}, ${g}, ${b}, ${safeAlpha.toFixed(2)})`;
    }
  }
  return `rgba(15, 23, 42, ${safeAlpha.toFixed(2)})`;
}

export function isHexColorDark(hex: string): boolean {
  const clean = (hex || '#0F172A').replace('#', '').trim();
  if (clean.length < 6) return true;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (![r, g, b].every((n) => Number.isFinite(n))) return true;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.54;
}

export function normalizeQuizDesign(
  input: Partial<QuizVisualDesign>,
  fallback: QuizVisualDesign = DEFAULT_QUIZ_DESIGN
): QuizVisualDesign {
  const validBox: QuizQuestionBoxStyle[] = ['framed', 'banner', 'minimal', 'double_gold'];
  const validOpt: QuizOptionShape[] = ['rounded', 'pill', 'sharp', 'outline'];
  const validBadge: QuizBadgeShape[] = ['circle', 'rounded_square', 'solid_pill'];
  const validTimer: QuizTimerStyle[] = ['bar_circle', 'bar_only', 'pill_badge'];
  const validFont: QuizFontStyle[] = ['modern', 'serif', 'bold_display'];

  const sanitizeHex = (val: unknown, fb: string) =>
    typeof val === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(val.trim())
      ? val.trim()
      : fb;

  return {
    id:
      typeof input.id === 'string' && input.id.trim()
        ? input.id.trim()
        : `custom_${Date.now().toString(36)}`,
    name:
      typeof input.name === 'string' && input.name.trim()
        ? input.name.trim().slice(0, 32)
        : 'Mon design',
    isCustom: Boolean(input.isCustom),
    questionBoxStyle: validBox.includes(input.questionBoxStyle as QuizQuestionBoxStyle)
      ? (input.questionBoxStyle as QuizQuestionBoxStyle)
      : fallback.questionBoxStyle,
    optionShape: validOpt.includes(input.optionShape as QuizOptionShape)
      ? (input.optionShape as QuizOptionShape)
      : fallback.optionShape,
    badgeShape: validBadge.includes(input.badgeShape as QuizBadgeShape)
      ? (input.badgeShape as QuizBadgeShape)
      : fallback.badgeShape,
    timerStyle: validTimer.includes(input.timerStyle as QuizTimerStyle)
      ? (input.timerStyle as QuizTimerStyle)
      : fallback.timerStyle,
    fontStyle: validFont.includes(input.fontStyle as QuizFontStyle)
      ? (input.fontStyle as QuizFontStyle)
      : fallback.fontStyle,
    accentColor: sanitizeHex(input.accentColor, fallback.accentColor),
    goldColor: sanitizeHex(input.goldColor, fallback.goldColor),
    questionTextColor: sanitizeHex(input.questionTextColor, fallback.questionTextColor),
    cardBgColor: sanitizeHex(input.cardBgColor, fallback.cardBgColor),
    borderColor: sanitizeHex(input.borderColor, fallback.borderColor),
    cardOpacity:
      typeof input.cardOpacity === 'number' && Number.isFinite(input.cardOpacity)
        ? Math.max(0.25, Math.min(0.96, input.cardOpacity))
        : fallback.cardOpacity,
  };
}

export function createCustomQuizDesign(
  baseDesign: QuizVisualDesign,
  name: string,
  overrides: Partial<QuizVisualDesign> = {}
): QuizVisualDesign {
  const uniqueId = `custom_design_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 6)}`;
  return normalizeQuizDesign(
    {
      ...baseDesign,
      ...overrides,
      id: uniqueId,
      name: name.trim() || 'Design personnalisé',
      isCustom: true,
    },
    baseDesign
  );
}

export function loadSavedCustomQuizDesigns(): QuizVisualDesign[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = window.localStorage.getItem(CUSTOM_DESIGNS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => normalizeQuizDesign({ ...item, isCustom: true }));
  } catch {
    return [];
  }
}

export function saveCustomQuizDesigns(designs: QuizVisualDesign[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const onlyCustom = designs.filter((d) => d.isCustom);
    window.localStorage.setItem(
      CUSTOM_DESIGNS_STORAGE_KEY,
      JSON.stringify(onlyCustom)
    );
  } catch {}
}
