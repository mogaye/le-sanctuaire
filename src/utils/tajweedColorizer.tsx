import React from 'react';

export interface TajweedRuleInfo {
  id: string;
  name: string;
  arabicName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  duration: string;
  description: string;
  example: string;
}

export const TAJWEED_RULES_EXPLANATIONS: TajweedRuleInfo[] = [
  {
    id: 'madd',
    name: 'Prolongation (Madd)',
    arabicName: 'المَدّ',
    color: '#F87171', // Red / Coral
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    duration: '4 à 6 temps',
    description:
      'Étire le son de la voyelle (Alif, Waw, Ya). Requis sur les lettres surmontées du signe de prolongation ondulé (~ ou ۤ).',
    example: 'السَّمَآء • جَآءَ • الضَّآلِّينَ',
  },
  {
    id: 'ghunnah',
    name: 'Nasalisation (Ghunnah & Ikhfâ)',
    arabicName: 'الغُنَّة والإخفاء',
    color: '#34D399', // Emerald Green
    bgColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
    duration: '2 temps',
    description:
      'Fait résonner doucement le son dans le nez (cavité nasale). S’applique sur le Nûn (نّ) et le Mîm (مّ) doublés ou le Tanween.',
    example: 'إِنَّ • عَمَّ • مِن قَبْلِكَ',
  },
  {
    id: 'qalqalah',
    name: 'Écho & Rebond (Qalqalah)',
    arabicName: 'القَلْقَلَة',
    color: '#38BDF8', // Sky Blue
    bgColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    duration: 'Rebond sec',
    description:
      'Donne un rebondissement clair et vibrant sans voyelle aux 5 lettres de "Qutb Jad" (ق, ط, ب, ج, د) lorsqu’elles portent un Sukûn.',
    example: 'قُلْ هُوَ اللَّهُ أَحَدْ • الفَلَقْ • حَبْلٌ',
  },
  {
    id: 'tafkhim',
    name: 'Lettres Emphatiques (Tafkhîm)',
    arabicName: 'التَفْخِيم',
    color: '#FBBF24', // Amber Gold
    bgColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: 'rgba(251, 191, 36, 0.4)',
    duration: 'Pleine bouche',
    description:
      'Prononciation pleine, grave et solennelle dans la cavité buccale pour les 7 lettres d’élévation (خ, ص, ض, غ, ط, ق, ظ).',
    example: 'الصِّرَاطَ • خَالِدِينَ • غَفُورٌ',
  },
  {
    id: 'silent',
    name: 'Lettres Muettes (Assimilées)',
    arabicName: 'الحروف الساقطة',
    color: '#94A3B8', // Discret Slate / Grey
    bgColor: 'rgba(148, 163, 184, 0.15)',
    borderColor: 'rgba(148, 163, 184, 0.3)',
    duration: 'Non prononcées',
    description:
      'Lettres écrites dans le texte mais omises à la récitation orale pour préserver la fluidité (ex : Alif de liaison ٱ, lettres solaires).',
    example: 'وَٱلصَّلَاة • قَالُواْ • ٱلرَّحْمَٰنِ',
  },
];

// Qalqalah letters
const QALQALAH_CHARS = new Set(['ق', 'ط', 'ب', 'ج', 'د']);
// Emphatic letters
const EMPHATIC_CHARS = new Set(['ص', 'ض', 'ط', 'ظ', 'خ', 'غ', 'ق']);
// Madd marks & carriers
const MADD_MARKS = new Set(['ۤ', 'ٓ', '~']);
// Sukun marks
const SUKUN_CHARS = new Set(['ْ', 'ۡ']);
// Shaddah mark
const SHADDAH = 'ّ';
// Tanween marks
const TANWEEN_CHARS = new Set(['ً', 'ٍ', 'ٌ']);

/**
 * Cleans Arabic verse text for immaculate typography:
 * - Strips ARABIC SMALL LOW MEEM (\u06ED) which Tanzil adds after tanween and renders as a rogue floating 'م' underneath words
 * - Removes misplaced small meem after tanween
 * - Binds waqf stop marks (\u06DA, \u06D6, \u06D7, \u06D8, \u06DB, \u06DC) to preceding words with non-breaking space
 * - Removes any dangling trailing waqf at the end of single ayah
 */
export function cleanAyahArabic(ar: string): string {
  if (!ar) return '';
  return ar
    .replace(/\u06ED/g, '') // remove small low meem rogue character
    .replace(/([ًٌٍ])[\u06ED\u06E2]/g, '$1') // remove misplaced small meem after tanween
    .replace(/\s*[ۣۚۖۗۘۛۜۢ]\s*$/, '') // remove trailing waqf mark at end of verse
    .replace(/\s+([ۚۖۗۘۛۜۢ])/g, '\u00A0$1') // glue waqf mark to preceding word so it never wraps alone
    .replace(/\s+[ۭۘ]\s*/g, ' ') // remove standalone floating waqf marks
    .trim();
}

interface TajweedToken {
  text: string;
  type: 'madd' | 'ghunnah' | 'qalqalah' | 'tafkhim' | 'silent' | 'normal';
}

/**
 * Tokenizes Arabic verse text into colored Tajweed segments
 */
export function parseTajweedTokens(arabicText: string): TajweedToken[] {
  if (!arabicText) return [];

  const cleaned = cleanAyahArabic(arabicText);
  const tokens: TajweedToken[] = [];
  const chars = Array.from(cleaned);
  let i = 0;

  while (i < chars.length) {
    const char = chars[i];
    const nextChar = chars[i + 1] || '';
    const nextNextChar = chars[i + 2] || '';

    // 1. Silent Hamzat Wasl (ٱ)
    if (char === 'ٱ') {
      tokens.push({ text: char, type: 'silent' });
      i++;
      continue;
    }

    // 2. Silent final Alif after plural Waw (واْ)
    if (char === 'ا' && SUKUN_CHARS.has(nextChar)) {
      tokens.push({ text: char + nextChar, type: 'silent' });
      i += 2;
      continue;
    }

    // 3. Madd (Prolongation) with explicit madda sign (ۤ / ٓ)
    if (MADD_MARKS.has(nextChar) || MADD_MARKS.has(nextNextChar)) {
      let maddChunk = char;
      let j = i + 1;
      while (j < chars.length && !/\s/.test(chars[j]) && j <= i + 3) {
        maddChunk += chars[j];
        if (MADD_MARKS.has(chars[j])) {
          j++;
          break;
        }
        j++;
      }
      tokens.push({ text: maddChunk, type: 'madd' });
      i = j;
      continue;
    }

    // 4. Noon or Meem Mushaddadah (نّ, مّ) -> Ghunnah
    if ((char === 'ن' || char === 'م') && (nextChar === SHADDAH || nextNextChar === SHADDAH)) {
      let chunk = char + nextChar;
      if (nextNextChar && (nextNextChar === 'َ' || nextNextChar === 'ِ' || nextNextChar === 'ُ')) {
        chunk += nextNextChar;
        i += 3;
      } else {
        i += 2;
      }
      tokens.push({ text: chunk, type: 'ghunnah' });
      continue;
    }

    // 5. Tanween -> Ghunnah (bind with preceding base character so combining mark never floats alone in a span)
    if (TANWEEN_CHARS.has(char)) {
      const lastToken = tokens[tokens.length - 1];
      if (lastToken && lastToken.type === 'normal' && lastToken.text.length > 0) {
        const baseChar = lastToken.text.slice(-1);
        lastToken.text = lastToken.text.slice(0, -1);
        if (lastToken.text.length === 0) {
          tokens.pop();
        }
        tokens.push({ text: baseChar + char, type: 'ghunnah' });
      } else {
        tokens.push({ text: char, type: 'ghunnah' });
      }
      i++;
      continue;
    }

    // 6. Qalqalah (ق, ط, ب, ج, د with Sukun or at word boundary)
    if (QALQALAH_CHARS.has(char)) {
      if (SUKUN_CHARS.has(nextChar)) {
        tokens.push({ text: char + nextChar, type: 'qalqalah' });
        i += 2;
        continue;
      }
      // If at end of word or verse without vowel
      if (!nextChar || /\s/.test(nextChar) || nextChar === '۝') {
        tokens.push({ text: char, type: 'qalqalah' });
        i++;
        continue;
      }
    }

    // 7. Emphatic letters (Tafkhim)
    if (EMPHATIC_CHARS.has(char)) {
      let chunk = char;
      let j = i + 1;
      // include harakah if any
      if (j < chars.length && !/[\s\u0600-\u064A]/.test(chars[j]) && !SUKUN_CHARS.has(chars[j])) {
        chunk += chars[j];
        j++;
      }
      tokens.push({ text: chunk, type: 'tafkhim' });
      i = j;
      continue;
    }

    // Default normal character / symbol
    tokens.push({ text: char, type: 'normal' });
    i++;
  }

  // Merge consecutive normal tokens to keep DOM lightweight
  const merged: TajweedToken[] = [];
  for (const token of tokens) {
    const last = merged[merged.length - 1];
    if (last && last.type === 'normal' && token.type === 'normal') {
      last.text += token.text;
    } else {
      merged.push({ ...token });
    }
  }

  return merged;
}

interface TajweedTextProps {
  text: string;
  enabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const TajweedText: React.FC<TajweedTextProps> = ({
  text,
  enabled = true,
  className = '',
  style = {},
}) => {
  const sanitized = cleanAyahArabic(text);

  if (!enabled || !sanitized) {
    return (
      <span className={className} style={style}>
        {sanitized || text}
      </span>
    );
  }

  // Split into words and whitespace so each Arabic word stays unbroken on a single line
  const parts = sanitized.split(/(\s+)/);

  return (
    <span className={className} style={style}>
      {parts.map((part, pIdx) => {
        if (/^\s+$/.test(part)) {
          return <span key={pIdx}>{part}</span>;
        }

        const tokens = parseTajweedTokens(part);

        return (
          <span key={pIdx} className="inline-block whitespace-nowrap">
            {tokens.map((token, index) => {
              if (token.type === 'madd') {
                return (
                  <span
                    key={index}
                    style={{
                      color: '#FF6B6B',
                      fontWeight: 600,
                      textShadow: '0 0 14px rgba(255, 107, 107, 0.45)',
                    }}
                    title="Madd : Prolongation 4 à 6 temps"
                  >
                    {token.text}
                  </span>
                );
              }
              if (token.type === 'ghunnah') {
                return (
                  <span
                    key={index}
                    style={{
                      color: '#34D399',
                      fontWeight: 600,
                      textShadow: '0 0 14px rgba(52, 211, 153, 0.45)',
                    }}
                    title="Ghunnah : Nasalisation 2 temps"
                  >
                    {token.text}
                  </span>
                );
              }
              if (token.type === 'qalqalah') {
                return (
                  <span
                    key={index}
                    style={{
                      color: '#38BDF8',
                      fontWeight: 600,
                      textShadow: '0 0 14px rgba(56, 189, 248, 0.45)',
                    }}
                    title="Qalqalah : Rebond sonore sur lettre avec sukoon"
                  >
                    {token.text}
                  </span>
                );
              }
              if (token.type === 'tafkhim') {
                return (
                  <span
                    key={index}
                    style={{
                      color: '#FBBF24',
                      fontWeight: 600,
                      textShadow: '0 0 14px rgba(251, 191, 36, 0.45)',
                    }}
                    title="Tafkhîm : Lettre emphatique prononcée pleine bouche"
                  >
                    {token.text}
                  </span>
                );
              }
              if (token.type === 'silent') {
                return (
                  <span
                    key={index}
                    style={{ opacity: 0.5, color: '#94A3B8' }}
                    title="Lettre muette / assimilée"
                  >
                    {token.text}
                  </span>
                );
              }
              return <span key={index}>{token.text}</span>;
            })}
          </span>
        );
      })}
    </span>
  );
};

