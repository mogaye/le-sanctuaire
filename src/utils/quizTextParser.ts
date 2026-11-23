import { QuizCategoryId, QuizQuestionItem } from '../data/islamicQuizBank';
import { normalizeQuizQuestion } from './quizVideoUtils';

export interface ParsedQuizTextResult {
  questions: QuizQuestionItem[];
  warnings: string[];
  answersDetectedCount: number;
  unansweredCount: number;
}

const OPTION_PREFIX_RE =
  /^\s*(?:\*{1,2}|•|-|–|—)?\s*(?:\(([A-Da-d])\)|\[([A-Da-d])\]|([A-Da-d])\s*[)\].:\-–])\s*(.+)$/;

const BULLET_OPTION_RE = /^\s*(?:[-•–—]|[*+]\s+|\u25AA|\u25E6)\s+(.+)$/;

const NUMBERED_ITEM_RE = /^\s*(?:\*{1,2})?(?:Q(?:uestion)?\s*)?(\d{1,3})\s*[).:\-–]\s*(.+)$/i;

const QUESTION_LABEL_RE =
  /^\s*(?:\*{1,2})?(?:Question|Q)\s*(\d{1,3})?\s*[:.\-–)]\s*(.+)$/i;

const ANSWER_LINE_RE =
  /^\s*(?:\*{1,2})?(?:✅|✔️|✔|🎯|👉)?\s*(?:R[eé]ponse(?:\s+correcte|\s+exacte)?|Bonne\s+r[eé]ponse|R[eé]p|Correct(?:e|ion)?|Solution|Answer|Ans|Réponse\s+juste)\s*[:=\-–.]?\s*(.+)$/i;

const EXPLANATION_LINE_RE =
  /^\s*(?:\*{1,2})?(?:💡|📖|ℹ️)?\s*(?:Explication|Justification|Source|R[eé]f[eé]rence|Note|D[eé]tail|Commentaire)\s*[:=\-–]\s*(.+)$/i;

const TRAILING_ANSWER_HEADER_RE =
  /^\s*(?:\*{1,2})?(?:R[eé]ponses|Bonnes\s+r[eé]ponses|Corrig[eé]s?|Corrections?|Solutions?|Answers?)\s*[:\-–]?\s*(?:\*{1,2})?$/i;

const INLINE_CORRECT_MARKERS_RE =
  /(?:\s*(?:\((?:bonne\s+r[eé]ponse|correcte?|vrai|juste|exacte?)\)|\[(?:bonne\s+r[eé]ponse|correcte?|vrai|x|✓|✔)\]|✅|✔️|✔|✓|\*(?=\s*$))|\s*^\s*(?:✅|✔️|✔|✓|\*(?!\*)))/gi;

function stripMarkdownFormatting(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/^\s*[*_]+\s*|\s*[*_]+\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanInlineCorrectMarker(rawText: string): {
  text: string;
  isMarkedCorrect: boolean;
} {
  let isMarkedCorrect = false;
  let working = rawText.trim();

  if (
    /^\s*(?:✅|✔️|✔|✓|\*(?!\*))/.test(working) ||
    /(?:✅|✔️|✔|✓)\s*$/.test(working) ||
    /\((?:bonne\s+r[eé]ponse|correcte?|vrai|juste|exacte?)\)/i.test(working) ||
    /\[(?:bonne\s+r[eé]ponse|correcte?|vrai|x|✓|✔)\]/i.test(working) ||
    /\s+\*\s*$/.test(working)
  ) {
    isMarkedCorrect = true;
  }

  working = working
    .replace(INLINE_CORRECT_MARKERS_RE, ' ')
    .replace(/^\s*\*\s+/, '')
    .trim();

  return {
    text: stripMarkdownFormatting(working),
    isMarkedCorrect,
  };
}

/**
 * Splits lines that pack multiple lettered options or an answer onto a single line, e.g.:
 * "Quelle sourate ? A) Al-Fatiha B) Al-Baqarah C) Al-Ikhlas D) An-Nas Réponse : A"
 * or "A) Oui | B) Non | C) Peut-être | D) Aucun"
 */
function preprocessQuizText(rawText: string): string[] {
  const normalizedNewlines = rawText
    .replace(/\r\n?/g, '\n')
    .replace(/\u00A0/g, ' ');

  const rawLines = normalizedNewlines.split('\n');
  const expandedLines: string[] = [];

  for (const rawLine of rawLines) {
    let line = rawLine.trim();
    if (!line) {
      expandedLines.push('');
      continue;
    }

    // Step 1: Split pipe-delimited inline segments first if pipe-separated options/answers are present
    const candidateSegments =
      line.includes('|') &&
      /(?:\||^)\s*(?:\(?[A-Da-d]\)|[A-Da-d][).:\-]|(?:Bonne\s+)?R[eé]ponse)/i.test(
        line
      )
        ? line
            .split(/\s*\|\s*/)
            .map((p) => p.trim())
            .filter(Boolean)
        : [line];

    for (const seg of candidateSegments) {
      // Split inline A) ... B) ... C) ... D) ... and inline Réponse : ...
      let splitLine = seg;
      const hasInlineAB =
        /(?:^|[?:.»!\s])(?:\*{1,2})?(?:\([Aa]\)|\[[Aa]\]|[Aa][).])\s+/.test(
          splitLine
        ) &&
        /\s+(?:\*{1,2})?(?:\([Bb]\)|\[[Bb]\]|[Bb][).])\s+/.test(splitLine);

      // Also split question ending with ? or : followed directly by A) ... (even when B) is in the next pipe segment)
      if (hasInlineAB) {
        splitLine = splitLine
          .replace(
            /([?:.»!\s])((?:\*{1,2})?(?:\([Aa]\)|\[[Aa]\]|[Aa][).]))\s+/g,
            '$1\n$2 '
          )
          .replace(
            /(?:\s{1,}|;\s*)((?:\*{1,2})?(?:\([B-Db-d]\)|\[[B-Db-d]\]|[B-Db-d][).]))\s+/g,
            '\n$1 '
          );
      } else {
        splitLine = splitLine.replace(
          /([?:.»!])\s+((?:\*{1,2})?(?:\([Aa]\)|\[[Aa]\]|[Aa][).]))\s+/g,
          '$1\n$2 '
        );
      }

      if (!ANSWER_LINE_RE.test(splitLine)) {
        splitLine = splitLine
          // Insert newline before inline Réponse:/Bonne réponse:/Answer:
          .replace(
            /\s+((?:✅\s*)?(?:\*{1,2})?(?:(?:Bonne\s+)?R[eé]ponse(?:\s+correcte|\s+exacte|\s+juste)?|Correct(?:e|ion)?|Solution|Answer)\s*[:=])/gi,
            '\n$1'
          );
      }
      if (!EXPLANATION_LINE_RE.test(splitLine)) {
        splitLine = splitLine
          // Insert newline before inline Explication:/Source:
          .replace(
            /\s+((?:\*{1,2})?(?:Explication|Justification|Source)\s*[:=])/gi,
            '\n$1'
          );
      }

      const subLines = splitLine
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      expandedLines.push(...subLines);
    }
  }

  return expandedLines;
}

function resolveAnswerIndex(
  answerRaw: string,
  options: string[]
): 0 | 1 | 2 | 3 | null {
  const cleaned = stripMarkdownFormatting(answerRaw)
    .replace(/^(?:est|is)\s+/i, '')
    .trim();
  if (!cleaned) return null;

  const lower = cleaned.toLowerCase();
  // 0. Exact option text match first (prevents sentences starting with "A " from matching letter A)
  const exactIdx = options.findIndex(
    (opt) => opt.trim().toLowerCase() === lower
  );
  if (exactIdx >= 0) return exactIdx as 0 | 1 | 2 | 3;

  // 1. Starts with letter A/B/C/D (e.g. "B", "B)", "B. Al-Fatiha", "(B)", "Option B")
  const letterMatch = cleaned.match(
    /^(?:option|choix|lettre)?\s*[([]?([A-Da-d])[)\].:\-–\s]*/i
  );
  if (letterMatch) {
    const ch = letterMatch[1].toUpperCase();
    const idx = ch.charCodeAt(0) - 65;
    if (idx >= 0 && idx <= 3) {
      const rest = cleaned.slice(letterMatch[0].length).trim();
      const firstTokenIsExplicitLetter =
        /^(?:option|choix|lettre)?\s*[([]?[A-Da-d](?:[)\].:\-–]|\s|$)/i.test(
          cleaned
        );
      if (firstTokenIsExplicitLetter || !rest) {
        return idx as 0 | 1 | 2 | 3;
      }
    }
  }

  // 2. Numeric 1..4 (only when it matches "1", "2", "2)", etc.)
  const numMatch = cleaned.match(/^(?:option|choix|num[eé]ro)?\s*([1-4])(?:[).:\-\s]|$)/i);
  if (numMatch) {
    const num = Number(numMatch[1]);
    if (num >= 1 && num <= 4) {
      return (num - 1) as 0 | 1 | 2 | 3;
    }
  }

  // 3. Partial option text match
  const partialIdx = options.findIndex((opt) => {
    const optLower = opt.trim().toLowerCase();
    return (
      optLower.length >= 2 &&
      (lower.includes(optLower) || optLower.includes(lower))
    );
  });
  if (partialIdx >= 0) return partialIdx as 0 | 1 | 2 | 3;

  return null;
}

function parseTrailingAnswerKey(lines: string[]): Map<number, string> {
  const map = new Map<number, string>();
  const joined = lines.join('\n');

  // Support compact forms like "1-B, 2-C, 3-A" or "1: B | 2: C" or line-by-line "1. B"
  const pairRegex = /(?:^|[\s,;|])(?:Q(?:uestion)?\s*)?(\d{1,3})\s*[).:\-–=]\s*([A-Da-d1-4]|[^\n,;|]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = pairRegex.exec(joined)) !== null) {
    const qNum = Number(match[1]);
    const val = match[2].trim();
    if (qNum >= 1 && val) {
      map.set(qNum, val);
    }
  }
  return map;
}

interface DraftQuestionBlock {
  numberHint: number | null;
  question: string;
  options: Array<{ text: string; isMarkedCorrect: boolean }>;
  answerRaw: string | null;
  explanation: string | null;
}

function inferCategoryFromText(text: string): QuizCategoryId {
  const lower = text.toLowerCase();
  if (/sourate|verset|coran|ayat|juz|hizb|mecquoise|m[eé]dinoise|fatiha|baqarah/.test(lower)) {
    return 'coran';
  }
  if (/proph[eè]te|mouhammad|muhammad|m[eé]dine|mecque|h[eé]gire|badr|uhud|compagnon|abou bakr|khadija|a[iï]cha/.test(lower)) {
    return 'sira';
  }
  if (/ibrahim|moussa|issa|nouh|youssouf|adam|souleymane|daoud|younous/.test(lower)) {
    return 'prophetes';
  }
  if (/pilier|salat|pri[eè]re|zakat|ramadan|je[uû]ne|hajj|shahada|ablution|wudu/.test(lower)) {
    return 'piliers';
  }
  return 'histoire';
}

export function parsePastedQuizText(
  rawText: string,
  options?: {
    defaultCategory?: QuizCategoryId;
    idPrefix?: string;
  }
): ParsedQuizTextResult {
  const trimmed = (rawText || '').trim();
  if (!trimmed) {
    return {
      questions: [],
      warnings: [],
      answersDetectedCount: 0,
      unansweredCount: 0,
    };
  }

  const lines = preprocessQuizText(trimmed);

  // Separate optional trailing Answer Key section ("Réponses :", "Corrigé :", etc.)
  let mainLines = lines;
  let trailingKey = new Map<number, string>();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (TRAILING_ANSWER_HEADER_RE.test(line)) {
      const rest = lines.slice(i + 1).filter(Boolean);
      if (rest.length > 0) {
        trailingKey = parseTrailingAnswerKey(rest);
        mainLines = lines.slice(0, i);
        break;
      }
    }
    // Also detect inline "Corrigé : 1-B, 2-C" on a single trailing line
    const inlineKeyHeader = line.match(
      /^(?:\*{1,2})?(?:R[eé]ponses|Bonnes\s+r[eé]ponses|Corrig[eé]s?|Corrections?|Solutions?)\s*[:\-–]\s*(.+)$/i
    );
    if (
      inlineKeyHeader &&
      /\d{1,3}\s*[).:\-–=]\s*[A-Da-d1-4]/i.test(inlineKeyHeader[1])
    ) {
      trailingKey = parseTrailingAnswerKey([
        inlineKeyHeader[1],
        ...lines.slice(i + 1).filter(Boolean),
      ]);
      mainLines = lines.slice(0, i);
      break;
    }
  }

  const blocks: DraftQuestionBlock[] = [];
  let current: DraftQuestionBlock | null = null;

  const commitCurrent = () => {
    if (!current) return;
    if (current.question.trim() && current.options.length > 0) {
      blocks.push(current);
    }
    current = null;
  };

  for (let i = 0; i < mainLines.length; i++) {
    const line = mainLines[i];
    if (!line) {
      // Blank line ends current block only if it already has >= 2 options
      if (current && current.options.length >= 2) {
        commitCurrent();
      }
      continue;
    }

    // 1. Answer line ("Réponse : B", "Bonne réponse : ...")
    const ansMatch = line.match(ANSWER_LINE_RE);
    if (ansMatch && current && current.options.length > 0) {
      current.answerRaw = ansMatch[1].trim();
      continue;
    }

    // 2. Explanation line ("Explication : ...", "Source : ...")
    const expMatch = line.match(EXPLANATION_LINE_RE);
    if (expMatch && current) {
      current.explanation = stripMarkdownFormatting(expMatch[1]);
      continue;
    }

    // 3. Explicit lettered option ("A) ...", "B. ...", "(C) ...")
    const optMatch = line.match(OPTION_PREFIX_RE);
    if (optMatch && current) {
      const cleanedOpt = cleanInlineCorrectMarker(optMatch[4]);
      if (current.options.length < 4 && cleanedOpt.text) {
        current.options.push(cleanedOpt);
        continue;
      }
    }

    // 4. Check if line is a bulleted option ("- ...", "• ...") OR numbered option ("1) ..." when current has a question and < 4 options and next lines are also numbered 2,3,4)
    const bulletMatch = line.match(BULLET_OPTION_RE);
    if (bulletMatch && current && current.question && current.options.length < 4 && !current.answerRaw) {
      const cleanedOpt = cleanInlineCorrectMarker(bulletMatch[1]);
      if (cleanedOpt.text) {
        current.options.push(cleanedOpt);
        continue;
      }
    }

    const numMatch = line.match(NUMBERED_ITEM_RE);
    if (
      numMatch &&
      current &&
      current.question &&
      !current.answerRaw &&
      current.options.length < 4 &&
      Number(numMatch[1]) === current.options.length + 1 &&
      !numMatch[2].trim().endsWith('?')
    ) {
      // Numbered sub-options 1..4 inside a question that has no lettered options
      const nextLineIsLetteredOption =
        i + 1 < mainLines.length && OPTION_PREFIX_RE.test(mainLines[i + 1] || '');
      if (!nextLineIsLetteredOption) {
        const cleanedOpt = cleanInlineCorrectMarker(numMatch[2]);
        if (cleanedOpt.text) {
          current.options.push(cleanedOpt);
          continue;
        }
      }
    }

    // 5. Explicit Question label ("Question 1 : ...", "Q2. ...") or Numbered Question ("1. ...")
    const qLabelMatch = line.match(QUESTION_LABEL_RE);
    if (qLabelMatch) {
      commitCurrent();
      current = {
        numberHint: qLabelMatch[1] ? Number(qLabelMatch[1]) : null,
        question: stripMarkdownFormatting(qLabelMatch[2]),
        options: [],
        answerRaw: null,
        explanation: null,
      };
      continue;
    }

    if (numMatch) {
      commitCurrent();
      current = {
        numberHint: Number(numMatch[1]),
        question: stripMarkdownFormatting(numMatch[2]),
        options: [],
        answerRaw: null,
        explanation: null,
      };
      continue;
    }

    // 6. Plain question line (or continuation of question text before options appear)
    if (current && current.options.length === 0 && !current.answerRaw) {
      // Continuation of multi-line question text
      current.question = `${current.question} ${stripMarkdownFormatting(line)}`.trim();
      continue;
    }

    // Otherwise start a fresh question block (e.g., separated by single newline after Réponse/4 options)
    commitCurrent();
    current = {
      numberHint: null,
      question: stripMarkdownFormatting(line),
      options: [],
      answerRaw: null,
      explanation: null,
    };
  }

  commitCurrent();

  const warnings: string[] = [];
  let answersDetectedCount = 0;
  let unansweredCount = 0;
  const idPrefix = options?.idPrefix || `pasted_${Date.now().toString(36)}`;

  const questions: QuizQuestionItem[] = blocks.map((block, idx) => {
    const optionTexts = block.options.map((o) => o.text).slice(0, 4);
    const paddedOptions: [string, string, string, string] = [
      optionTexts[0] || 'Option A',
      optionTexts[1] || 'Option B',
      optionTexts[2] || (optionTexts.length >= 2 ? '—' : 'Option C'),
      optionTexts[3] || (optionTexts.length >= 2 ? '—' : 'Option D'),
    ];

    if (block.options.length < 4) {
      warnings.push(
        `Question ${idx + 1} : ${block.options.length} proposition(s) détectée(s) sur 4.`
      );
    }

    let resolvedCorrect: 0 | 1 | 2 | 3 | null = null;

    // Priority 1: Inline mark on option (e.g. ✅, *, (bonne réponse))
    const inlineIdx = block.options.findIndex((o) => o.isMarkedCorrect);
    if (inlineIdx >= 0 && inlineIdx <= 3) {
      resolvedCorrect = inlineIdx as 0 | 1 | 2 | 3;
    }

    // Priority 2: Separate Réponse line in block
    if (resolvedCorrect === null && block.answerRaw) {
      resolvedCorrect = resolveAnswerIndex(block.answerRaw, optionTexts);
    }

    // Priority 3: Trailing Corrigé / Réponses key at bottom
    if (resolvedCorrect === null) {
      const keyLookupNum = block.numberHint ?? idx + 1;
      const keyVal = trailingKey.get(keyLookupNum);
      if (keyVal) {
        resolvedCorrect = resolveAnswerIndex(keyVal, optionTexts);
      }
    }

    if (resolvedCorrect !== null) {
      answersDetectedCount += 1;
    } else {
      unansweredCount += 1;
      resolvedCorrect = 0;
    }

    const category =
      options?.defaultCategory ||
      inferCategoryFromText(`${block.question} ${optionTexts.join(' ')}`);

    return normalizeQuizQuestion(
      {
        id: `${idPrefix}_${idx + 1}`,
        category,
        question: block.question,
        options: paddedOptions,
        correctIndex: resolvedCorrect,
        explanation: block.explanation || undefined,
      },
      idx
    );
  });

  return {
    questions,
    warnings,
    answersDetectedCount,
    unansweredCount,
  };
}

export const SAMPLE_PASTE_QUIZ_TEXT = `1. Quelle sourate est appelée « le cœur du Coran » selon une tradition répandue ?
A) Al-Fatiha
B) Yâ-Sîn
C) Al-Mulk
D) Ar-Rahman
Réponse : B
Explication : De nombreux savants rappellent l'importance de méditer la sourate Yâ-Sîn.

2. Combien de prières quotidiennes sont obligatoires pour le musulman ?
A) 3 prières
B) 5 prières ✅
C) 7 prières
D) 2 prières

3. Dans quelle ville se trouve la mosquée du Prophète ﷺ (Al-Masjid An-Nabawi) ?
- La Mecque
- Jérusalem
- Médine (Bonne réponse)
- Taëf`;
