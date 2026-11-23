import {
  ISLAMIC_QUIZ_BANK,
  QuizCategoryId,
  QuizQuestionItem,
} from '../data/islamicQuizBank';
import { ALL_114_SURAHS, CompleteSurahItem } from '../data/quranSurahs';
import { normalizeQuizQuestion } from './quizVideoUtils';

const CATEGORY_TITLE_MAP: Record<QuizCategoryId | 'all', string> = {
  all: 'Quiz Islam',
  piliers: 'Quiz Piliers & Pratique',
  sira: 'Quiz Vie du Prophète ﷺ',
  prophetes: 'Quiz Les Prophètes',
  coran: 'Quiz Noble Coran',
  histoire: 'Quiz Compagnons & Culture',
};

export function getSuggestedQuizTitleForCategory(
  category: QuizCategoryId | 'all'
): string {
  return CATEGORY_TITLE_MAP[category] || 'Quiz Islam';
}

function shuffleWithRng<T>(items: T[], rng: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function deterministicPick<T>(
  pool: T[],
  seed: number,
  count: number,
  excludeFn: (item: T) => boolean
): T[] {
  const valid = pool.filter((item) => !excludeFn(item));
  if (valid.length <= count) return valid;
  const picked: T[] = [];
  const step = Math.max(1, Math.floor(valid.length / (count + 1)));
  let idx = Math.abs(seed) % valid.length;
  let guard = 0;
  while (picked.length < count && guard < valid.length * 2) {
    const candidate = valid[idx];
    if (!picked.includes(candidate)) {
      picked.push(candidate);
    }
    idx = (idx + step + 1) % valid.length;
    guard++;
  }
  return picked;
}

function buildOptionsWithCorrectIndex(
  correctOption: string,
  distractors: string[],
  seed: number
): { options: [string, string, string, string]; correctIndex: 0 | 1 | 2 | 3 } {
  const uniqueDistractors: string[] = [];
  for (const d of distractors) {
    const clean = d.trim();
    if (
      clean &&
      clean.toLowerCase() !== correctOption.trim().toLowerCase() &&
      !uniqueDistractors.some((u) => u.toLowerCase() === clean.toLowerCase())
    ) {
      uniqueDistractors.push(clean);
    }
    if (uniqueDistractors.length === 3) break;
  }

  const slot = ((Math.abs(seed) % 4) as 0 | 1 | 2 | 3);
  const options: [string, string, string, string] = ['', '', '', ''];
  options[slot] = correctOption.trim();
  let dIdx = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) continue;
    options[i] = uniqueDistractors[dIdx] || `Autre choix ${i + 1}`;
    dIdx++;
  }
  return { options, correctIndex: slot };
}

/**
 * Generates deterministic, verified Quran quiz questions directly from the
 * 114-surah reference table (no AI or external network call required).
 */
export function generateSurahQuizPool(): QuizQuestionItem[] {
  const generated: QuizQuestionItem[] = [];

  const meaningfulSurahs = ALL_114_SURAHS.filter(
    (s) =>
      s.frenchTranslation &&
      s.frenchTranslation.trim().length > 2 &&
      s.frenchTranslation.trim().toLowerCase() !== s.name.trim().toLowerCase()
  );

  // 1. Surah name meaning questions
  for (const surah of meaningfulSurahs) {
    const distractors = deterministicPick(
      meaningfulSurahs,
      surah.number * 7 + 3,
      6,
      (cand) =>
        cand.number === surah.number ||
        cand.frenchTranslation.trim().toLowerCase() ===
          surah.frenchTranslation.trim().toLowerCase()
    ).map((d) => d.frenchTranslation);

    if (distractors.length < 3) continue;
    const { options, correctIndex } = buildOptionsWithCorrectIndex(
      surah.frenchTranslation,
      distractors,
      surah.number * 3 + 1
    );

    generated.push({
      id: `auto_coran_meaning_${surah.number}`,
      category: 'coran',
      question: `Que signifie en français le nom de la sourate ${surah.name} (${surah.arabicName}) ?`,
      options,
      correctIndex,
      explanation: `Sourate ${surah.name} (n°${surah.number}) signifie « ${surah.frenchTranslation} » et compte ${surah.numberOfAyahs} versets.`,
    });
  }

  // 2. Number of verses (ayahs) for iconic/distinct surahs
  const distinctAyahSurahs = ALL_114_SURAHS.filter(
    (s) => s.number <= 36 || s.number >= 67
  );
  for (const surah of distinctAyahSurahs) {
    const correctLabel = `${surah.numberOfAyahs} ${
      surah.numberOfAyahs > 1 ? 'versets' : 'verset'
    }`;
    const distractorCandidates = deterministicPick(
      ALL_114_SURAHS,
      surah.number * 11 + 5,
      8,
      (cand) => cand.numberOfAyahs === surah.numberOfAyahs
    ).map(
      (d) =>
        `${d.numberOfAyahs} ${d.numberOfAyahs > 1 ? 'versets' : 'verset'}`
    );

    if (distractorCandidates.length < 3) continue;
    const { options, correctIndex } = buildOptionsWithCorrectIndex(
      correctLabel,
      distractorCandidates,
      surah.number * 5 + 2
    );

    generated.push({
      id: `auto_coran_ayahs_${surah.number}`,
      category: 'coran',
      question: `Combien de versets compte la sourate ${surah.name} (${surah.arabicName}) ?`,
      options,
      correctIndex,
      explanation: `La sourate ${surah.name} (« ${surah.frenchTranslation} ») est la ${surah.number}ᵉ sourate et compte ${surah.numberOfAyahs} versets.`,
    });
  }

  // 3. Surah order number in the Mushaf
  const milestoneSurahs = ALL_114_SURAHS.filter(
    (s) =>
      [1, 2, 3, 9, 12, 18, 19, 36, 55, 56, 67, 78, 96, 97, 103, 108, 112, 113, 114].includes(
        s.number
      )
  );
  for (const surah of milestoneSurahs) {
    const correctLabel = `Sourate n°${surah.number}`;
    const distractorCandidates = deterministicPick(
      ALL_114_SURAHS,
      surah.number * 13 + 7,
      8,
      (cand) => cand.number === surah.number
    ).map((d) => `Sourate n°${d.number}`);

    const { options, correctIndex } = buildOptionsWithCorrectIndex(
      correctLabel,
      distractorCandidates,
      surah.number * 9 + 3
    );

    generated.push({
      id: `auto_coran_order_${surah.number}`,
      category: 'coran',
      question: `Quel est le numéro d’ordre de la sourate ${surah.name} dans le Noble Coran ?`,
      options,
      correctIndex,
      explanation: `Sourate ${surah.name} (« ${surah.frenchTranslation} ») occupe la position n°${surah.number} sur 114.`,
    });
  }

  // 4. Revelation type (Mecquoise vs Médinoise) as 4-option MCQ
  const meccanSurahs: CompleteSurahItem[] = ALL_114_SURAHS.filter(
    (s) => s.revelationType === 'Mecquoise'
  );
  const medinanSurahs: CompleteSurahItem[] = ALL_114_SURAHS.filter(
    (s) => s.revelationType === 'Médinoise'
  );

  for (let i = 0; i < medinanSurahs.length; i++) {
    const target = medinanSurahs[i];
    const distractors = deterministicPick(
      meccanSurahs,
      target.number * 17 + i,
      3,
      () => false
    ).map((s) => `${s.name} (${s.arabicName})`);

    if (distractors.length < 3) continue;
    const correctLabel = `${target.name} (${target.arabicName})`;
    const { options, correctIndex } = buildOptionsWithCorrectIndex(
      correctLabel,
      distractors,
      target.number + i
    );

    generated.push({
      id: `auto_coran_medinan_${target.number}`,
      category: 'coran',
      question: 'Parmi ces sourates du Noble Coran, laquelle est une sourate médinoise ?',
      options,
      correctIndex,
      explanation: `Sourate ${target.name} (n°${target.number}) a été révélée à Médine, contrairement aux trois autres qui sont mecquoises.`,
    });
  }

  for (let i = 0; i < Math.min(20, meccanSurahs.length); i++) {
    const target = meccanSurahs[(i * 4) % meccanSurahs.length];
    const distractors = deterministicPick(
      medinanSurahs,
      target.number * 19 + i,
      3,
      () => false
    ).map((s) => `${s.name} (${s.arabicName})`);

    if (distractors.length < 3) continue;
    const correctLabel = `${target.name} (${target.arabicName})`;
    const { options, correctIndex } = buildOptionsWithCorrectIndex(
      correctLabel,
      distractors,
      target.number + i + 2
    );

    generated.push({
      id: `auto_coran_meccan_${target.number}`,
      category: 'coran',
      question: 'Parmi ces sourates du Noble Coran, laquelle est une sourate mecquoise ?',
      options,
      correctIndex,
      explanation: `Sourate ${target.name} (n°${target.number}) a été révélée à La Mecque, tandis que les autres ont été révélées à Médine.`,
    });
  }

  return generated;
}

const CACHED_SURAH_POOL: QuizQuestionItem[] = generateSurahQuizPool();

export function getAutoFillPool(
  category: QuizCategoryId | 'all' = 'all'
): QuizQuestionItem[] {
  const combined = [...ISLAMIC_QUIZ_BANK, ...CACHED_SURAH_POOL];
  const filtered =
    category === 'all'
      ? combined
      : combined.filter((q) => q.category === category);

  // Deduplicate by normalized question text
  const seenQuestions = new Set<string>();
  const unique: QuizQuestionItem[] = [];
  for (const item of filtered) {
    const normKey = item.question.trim().toLowerCase();
    if (!seenQuestions.has(normKey)) {
      seenQuestions.add(normKey);
      unique.push(item);
    }
  }
  return unique;
}

export function isBlankOrPlaceholderQuizQuestion(
  q: Partial<QuizQuestionItem> | null | undefined
): boolean {
  if (!q) return true;
  const text = String(q.question || '').trim();
  const isDefaultQuestion =
    !text || /^question\s+islamique\s+\d*\s*\??$/i.test(text);
  const opts = Array.isArray(q.options) ? q.options : [];
  const areAllDefaultOptions =
    opts.length < 4 ||
    opts.every((opt, idx) => {
      const clean = String(opt || '').trim();
      const letter = ['A', 'B', 'C', 'D'][idx];
      return !clean || new RegExp(`^réponse\\s+${letter}$`, 'i').test(clean);
    });
  return isDefaultQuestion || areAllDefaultOptions;
}

export function generateAutoFillQuestions(options: {
  count: number;
  category?: QuizCategoryId | 'all';
  excludeQuestions?: QuizQuestionItem[];
  rng?: () => number;
}): QuizQuestionItem[] {
  const requestedCount = Math.max(1, Math.min(50, Math.round(options.count || 5)));
  const category = options.category || 'all';
  const rng = options.rng || Math.random;

  const excludedIds = new Set(
    (options.excludeQuestions || []).map((q) => q.id.trim().toLowerCase())
  );
  const excludedTexts = new Set(
    (options.excludeQuestions || []).map((q) => q.question.trim().toLowerCase())
  );

  // Prioritize curated bank questions first, then mix in generated Surah questions
  const bankItems = ISLAMIC_QUIZ_BANK.filter(
    (q) => category === 'all' || q.category === category
  );
  const surahItems =
    category === 'all' || category === 'coran' ? CACHED_SURAH_POOL : [];

  const filterAvailable = (list: QuizQuestionItem[]) =>
    list.filter(
      (q) =>
        !excludedIds.has(q.id.trim().toLowerCase()) &&
        !excludedTexts.has(q.question.trim().toLowerCase())
    );

  const availableBank = shuffleWithRng(filterAvailable(bankItems), rng);
  const availableSurah = shuffleWithRng(filterAvailable(surahItems), rng);

  // When 'all' is selected, blend curated bank questions (all 5 themes) + Surah questions
  const orderedCandidates: QuizQuestionItem[] = [];
  if (category === 'all') {
    const bankQuota = Math.min(
      availableBank.length,
      Math.max(1, Math.ceil(requestedCount * 0.7))
    );
    orderedCandidates.push(...availableBank.slice(0, bankQuota));
    orderedCandidates.push(...availableSurah);
    orderedCandidates.push(...availableBank.slice(bankQuota));
  } else {
    orderedCandidates.push(...availableBank, ...availableSurah);
  }

  // Deduplicate selected list cleanly
  const picked: QuizQuestionItem[] = [];
  const usedKeys = new Set<string>();
  for (const cand of orderedCandidates) {
    const key = cand.question.trim().toLowerCase();
    if (usedKeys.has(key)) continue;
    usedKeys.add(key);
    picked.push(
      normalizeQuizQuestion(
        {
          ...cand,
          options: [...cand.options] as [string, string, string, string],
        },
        picked.length
      )
    );
    if (picked.length >= requestedCount) break;
  }

  return picked;
}

export function fillBlankQuizQuestions(
  currentQuestions: QuizQuestionItem[],
  options?: { category?: QuizCategoryId | 'all'; rng?: () => number }
): { questions: QuizQuestionItem[]; filledCount: number } {
  const safeList = Array.isArray(currentQuestions) ? currentQuestions : [];
  const blankIndices: number[] = [];
  const nonBlankQuestions: QuizQuestionItem[] = [];

  safeList.forEach((q, idx) => {
    if (isBlankOrPlaceholderQuizQuestion(q)) {
      blankIndices.push(idx);
    } else {
      nonBlankQuestions.push(q);
    }
  });

  if (blankIndices.length === 0) {
    return { questions: safeList, filledCount: 0 };
  }

  const replacements = generateAutoFillQuestions({
    count: blankIndices.length,
    category: options?.category || 'all',
    excludeQuestions: nonBlankQuestions,
    rng: options?.rng,
  });

  const nextQuestions = [...safeList];
  let filledCount = 0;
  blankIndices.forEach((targetIdx, rIdx) => {
    const rep = replacements[rIdx];
    if (rep) {
      nextQuestions[targetIdx] = rep;
      filledCount++;
    }
  });

  return { questions: nextQuestions, filledCount };
}

export function autoFillSingleQuestion(
  currentQuestions: QuizQuestionItem[],
  targetId: string,
  options?: { category?: QuizCategoryId | 'all'; rng?: () => number }
): { questions: QuizQuestionItem[]; updatedQuestion: QuizQuestionItem | null } {
  const safeList = Array.isArray(currentQuestions) ? currentQuestions : [];
  const targetIdx = safeList.findIndex((q) => q.id === targetId);
  if (targetIdx < 0) {
    return { questions: safeList, updatedQuestion: null };
  }

  const targetQuestion = safeList[targetIdx];
  const desiredCategory = options?.category || 'all';

  let [candidate] = generateAutoFillQuestions({
    count: 1,
    category: desiredCategory,
    excludeQuestions: safeList,
    rng: options?.rng,
  });

  // Fallback to 'all' if category pool was completely exhausted in current list
  if (!candidate && desiredCategory !== 'all') {
    [candidate] = generateAutoFillQuestions({
      count: 1,
      category: 'all',
      excludeQuestions: safeList,
      rng: options?.rng,
    });
  }

  // Final fallback: pick any item other than the exact target question itself
  if (!candidate) {
    [candidate] = generateAutoFillQuestions({
      count: 1,
      category: 'all',
      excludeQuestions: [targetQuestion],
      rng: options?.rng,
    });
  }

  if (!candidate) {
    return { questions: safeList, updatedQuestion: null };
  }

  const next = [...safeList];
  next[targetIdx] = candidate;
  return { questions: next, updatedQuestion: candidate };
}
