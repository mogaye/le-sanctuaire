import { QuizCategoryId, QuizQuestionItem } from '../data/islamicQuizBank';
import {
  ContinuousTimeline,
  ContinuousTimelineSegment,
} from './mobileVideoStudioUtils';
import { DecodedVerseBuffer } from './continuousAudioEngine';
import { SubscriptionPlanId, getPlanRules } from './subscriptionPlans';
import {
  QuizNarrationStep,
  QuizNarratorSettings,
  QuizTimelineStep,
  buildOrderedQuizSteps,
  buildTimelineFromQuizSteps,
} from './quizNarration';

export type StudioContentMode = 'quran' | 'quiz';

export interface QuizFrameState {
  stepKind: 'question' | 'narration';
  narrationStep?: QuizNarrationStep;
  narrationProgress?: number;
  activeIndex: number;
  question: QuizQuestionItem;
  phase: 'question' | 'reveal';
  localTimeSec: number;
  segmentDurationSec: number;
  thinkSec: number;
  revealSec: number;
  countdownRemainingSec: number;
  countdownFraction: number;
  revealProgress: number;
  totalQuestions: number;
}

export function clampQuizThinkSec(raw: number): number {
  if (!Number.isFinite(raw)) return 5;
  return Math.max(2, Math.min(15, Math.round(raw)));
}

export function clampQuizRevealSec(raw: number): number {
  if (!Number.isFinite(raw)) return 3;
  return Math.max(2, Math.min(8, Math.round(raw)));
}

export function normalizeQuizQuestion(
  input: Partial<QuizQuestionItem>,
  index: number = 0
): QuizQuestionItem {
  const safeId =
    typeof input.id === 'string' && input.id.trim()
      ? input.id.trim()
      : `quiz_q_${index + 1}`;
  const validCategories: QuizCategoryId[] = [
    'piliers',
    'sira',
    'prophetes',
    'coran',
    'histoire',
  ];
  const category: QuizCategoryId = validCategories.includes(
    input.category as QuizCategoryId
  )
    ? (input.category as QuizCategoryId)
    : 'coran';
  const rawOptions = Array.isArray(input.options) ? input.options : [];
  const options: [string, string, string, string] = [
    String(rawOptions[0] ?? 'Réponse A').trim() || 'Réponse A',
    String(rawOptions[1] ?? 'Réponse B').trim() || 'Réponse B',
    String(rawOptions[2] ?? 'Réponse C').trim() || 'Réponse C',
    String(rawOptions[3] ?? 'Réponse D').trim() || 'Réponse D',
  ];
  const idxNum = Number(input.correctIndex);
  const correctIndex: 0 | 1 | 2 | 3 =
    idxNum === 0 || idxNum === 1 || idxNum === 2 || idxNum === 3
      ? idxNum
      : 0;
  const question =
    typeof input.question === 'string' && input.question.trim()
      ? input.question.trim()
      : `Question islamique ${index + 1}`;
  const explanation =
    typeof input.explanation === 'string' && input.explanation.trim()
      ? input.explanation.trim()
      : undefined;

  return {
    id: safeId,
    category,
    question,
    options,
    correctIndex,
    explanation,
  };
}

export function buildQuizTimeline(
  questions: QuizQuestionItem[],
  thinkSec: number,
  revealSec: number,
  paceMultiplier: number = 1,
  narratorOrSteps?: QuizNarratorSettings | QuizTimelineStep[]
): ContinuousTimeline {
  if (Array.isArray(narratorOrSteps)) {
    return buildTimelineFromQuizSteps(narratorOrSteps, paceMultiplier);
  }
  if (narratorOrSteps && narratorOrSteps.enabled) {
    const steps = buildOrderedQuizSteps(
      questions,
      narratorOrSteps,
      thinkSec,
      revealSec
    );
    return buildTimelineFromQuizSteps(steps, paceMultiplier);
  }
  if (!Array.isArray(questions) || questions.length === 0) {
    return { segments: [], totalDurationSec: 0 };
  }

  const safeThink = clampQuizThinkSec(thinkSec);
  const safeReveal = clampQuizRevealSec(revealSec);
  const safePace = Math.max(0.75, Math.min(1.5, Number(paceMultiplier) || 1));
  const rawPerQuestionSec = safeThink + safeReveal;
  const durationSec = Number((rawPerQuestionSec / safePace).toFixed(2));

  let cursor = 0;
  const segments: ContinuousTimelineSegment[] = questions.map((q, idx) => {
    const startSec = Number(cursor.toFixed(3));
    const endSec = Number((cursor + durationSec).toFixed(3));
    cursor = endSec;
    return {
      index: idx,
      ayahNum: idx + 1,
      surahName: q.category,
      startSec,
      endSec,
      durationSec,
    };
  });

  return {
    segments,
    totalDurationSec: Number(cursor.toFixed(3)),
  };
}

export function computeQuizFrameState(
  questions: QuizQuestionItem[],
  timeline: ContinuousTimeline,
  currentSec: number,
  thinkSec: number,
  revealSec: number,
  steps?: QuizTimelineStep[]
): QuizFrameState | null {
  if (!Array.isArray(questions) || questions.length === 0) return null;
  if (!timeline.segments.length) return null;

  const total = Math.max(0.01, timeline.totalDurationSec);
  const clampedSec = Math.max(0, Math.min(total - 0.001, Number(currentSec) || 0));

  let segIdx = timeline.segments.length - 1;
  for (let i = 0; i < timeline.segments.length; i++) {
    const seg = timeline.segments[i];
    if (clampedSec < seg.endSec || i === timeline.segments.length - 1) {
      segIdx = i;
      break;
    }
  }

  const seg = timeline.segments[segIdx];
  const segDur = Math.max(0.5, seg.durationSec);
  const localTimeSec = Math.max(0, Math.min(segDur, clampedSec - seg.startSec));

  const matchedStep =
    Array.isArray(steps) && steps.length === timeline.segments.length
      ? steps[segIdx]
      : undefined;

  if (matchedStep && matchedStep.kind === 'narration') {
    const refIdx = Math.max(
      0,
      Math.min(questions.length - 1, matchedStep.relatedQuestionIndex ?? 0)
    );
    const refQuestion = normalizeQuizQuestion(questions[refIdx] || questions[0], refIdx);
    return {
      stepKind: 'narration',
      narrationStep: matchedStep,
      narrationProgress: Math.max(0, Math.min(1, localTimeSec / segDur)),
      activeIndex: refIdx,
      question: refQuestion,
      phase: 'question',
      localTimeSec,
      segmentDurationSec: segDur,
      thinkSec: clampQuizThinkSec(thinkSec),
      revealSec: clampQuizRevealSec(revealSec),
      countdownRemainingSec: 0,
      countdownFraction: 1,
      revealProgress: 0,
      totalQuestions: questions.length,
    };
  }

  const activeIndex =
    matchedStep && matchedStep.kind === 'question'
      ? matchedStep.questionIndex
      : segIdx;
  const question = normalizeQuizQuestion(
    (matchedStep && matchedStep.kind === 'question'
      ? matchedStep.question
      : questions[activeIndex]) || questions[0],
    activeIndex
  );

  const safeThink =
    matchedStep && matchedStep.kind === 'question'
      ? Math.max(2, matchedStep.thinkSec)
      : clampQuizThinkSec(thinkSec);
  const safeReveal =
    matchedStep && matchedStep.kind === 'question'
      ? Math.max(2, matchedStep.revealSec)
      : clampQuizRevealSec(revealSec);
  const thinkFraction = safeThink / Math.max(1, safeThink + safeReveal);
  const effectiveThinkDur = segDur * thinkFraction;
  const effectiveRevealDur = Math.max(0.1, segDur - effectiveThinkDur);

  const isReveal = localTimeSec >= effectiveThinkDur - 0.001;
  const countdownProgress = Math.min(1, localTimeSec / Math.max(0.1, effectiveThinkDur));
  const countdownFraction = Math.max(0, 1 - countdownProgress);
  const countdownRemainingSec = isReveal
    ? 0
    : Math.max(1, Math.min(Math.ceil(safeThink), Math.ceil((1 - countdownProgress) * safeThink)));
  const revealProgress = isReveal
    ? Math.max(0, Math.min(1, (localTimeSec - effectiveThinkDur) / effectiveRevealDur))
    : 0;

  return {
    stepKind: 'question',
    activeIndex,
    question,
    phase: isReveal ? 'reveal' : 'question',
    localTimeSec,
    segmentDurationSec: segDur,
    thinkSec: safeThink,
    revealSec: safeReveal,
    countdownRemainingSec,
    countdownFraction,
    revealProgress,
    totalQuestions: questions.length,
  };
}

export function enforceQuizQuestionsForPlan(
  questions: QuizQuestionItem[],
  planId: SubscriptionPlanId,
  email?: string | null
): {
  questions: QuizQuestionItem[];
  wasCapped: boolean;
  maxQuestions: number;
} {
  const rules = getPlanRules(planId, email);
  const safeList = Array.isArray(questions)
    ? questions.map((q, idx) => normalizeQuizQuestion(q, idx))
    : [];

  if (!Number.isFinite(rules.maxVerses)) {
    return {
      questions: safeList,
      wasCapped: false,
      maxQuestions: Number.POSITIVE_INFINITY,
    };
  }

  const cap = Math.max(1, rules.maxVerses);
  return {
    questions: safeList.slice(0, cap),
    wasCapped: safeList.length > cap,
    maxQuestions: cap,
  };
}

export function buildQuizExportFilename(opts: {
  title?: string;
  questionCount: number;
  aspectLabel: string;
  extension: 'mp4' | 'webm';
  qualityId?: '480p' | '720p' | '1080p' | '4k';
}): string {
  const cleanTitle = (opts.title || 'quiz-islam')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);

  const aspectSlug = (opts.aspectLabel || '9:16').replace(':', 'x');
  const qualitySlug = opts.qualityId ? `-${opts.qualityId}` : '';
  const count = Math.max(1, Math.round(opts.questionCount || 1));

  return `sanctuaire-${cleanTitle || 'quiz-islam'}-${count}q-${aspectSlug}${qualitySlug}.${opts.extension}`;
}

/**
 * Generates an in-memory WebAudio AudioBuffer for one quiz question segment:
 * subtle wooden/crystal countdown ticks during reflection + warm harmonic chord chime on reveal.
 * Used both for live studio playback and deterministic offline MP4 encoding.
 */
export function synthesizeQuizQuestionAudioBuffer(
  audioCtx: BaseAudioContext,
  thinkSec: number,
  revealSec: number,
  soundEnabled: boolean
): AudioBuffer | null {
  const safeThink = clampQuizThinkSec(thinkSec);
  const safeReveal = clampQuizRevealSec(revealSec);
  const totalSec = safeThink + safeReveal;
  const sampleRate = Math.max(22050, audioCtx.sampleRate || 48000);
  const frameCount = Math.max(1, Math.round(totalSec * sampleRate));
  const buffer = audioCtx.createBuffer(1, frameCount, sampleRate);

  if (!soundEnabled) {
    return buffer;
  }

  const data = buffer.getChannelData(0);

  // Soft countdown ticks at t = 0, 1, ..., safeThink - 1
  for (let sec = 0; sec < safeThink; sec++) {
    const startSample = Math.round(sec * sampleRate);
    const isFinalTick = sec === safeThink - 1;
    const tickDurSamples = Math.round(0.085 * sampleRate);
    const freq = isFinalTick ? 920 : 720;
    const amp = isFinalTick ? 0.16 : 0.11;

    for (let i = 0; i < tickDurSamples && startSample + i < frameCount; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 42) * Math.min(1, t / 0.004);
      data[startSample + i] += Math.sin(2 * Math.PI * freq * t) * amp * env;
    }
  }

  // Warm two-note chime at exact answer reveal transition (t = safeThink)
  const chimeStart = Math.round(safeThink * sampleRate);
  const notes = [
    { delaySec: 0, freq: 587.33, durSec: 0.55, amp: 0.16 }, // D5
    { delaySec: 0.09, freq: 880.0, durSec: 0.72, amp: 0.18 }, // A5
    { delaySec: 0.18, freq: 1174.66, durSec: 0.78, amp: 0.11 }, // D6
  ];

  for (const note of notes) {
    const offset = chimeStart + Math.round(note.delaySec * sampleRate);
    const len = Math.round(note.durSec * sampleRate);
    for (let i = 0; i < len && offset + i < frameCount; i++) {
      const t = i / sampleRate;
      const attack = Math.min(1, t / 0.012);
      const decay = Math.exp(-t * 5.2);
      const wave =
        Math.sin(2 * Math.PI * note.freq * t) +
        0.25 * Math.sin(2 * Math.PI * note.freq * 2 * t);
      data[offset + i] += wave * note.amp * attack * decay;
    }
  }

  // Gentle soft limiter to avoid clipping
  for (let i = 0; i < frameCount; i++) {
    if (data[i] > 0.85) data[i] = 0.85;
    else if (data[i] < -0.85) data[i] = -0.85;
  }

  return buffer;
}

export function createQuizAudioSequence(
  audioCtx: BaseAudioContext,
  questions: QuizQuestionItem[],
  thinkSec: number,
  revealSec: number,
  soundEnabled: boolean
): DecodedVerseBuffer[] {
  const safeThink = clampQuizThinkSec(thinkSec);
  const safeReveal = clampQuizRevealSec(revealSec);
  const dur = safeThink + safeReveal;
  const sharedBuffer = synthesizeQuizQuestionAudioBuffer(
    audioCtx,
    safeThink,
    safeReveal,
    soundEnabled
  );

  return questions.map((_, idx) => ({
    ayahNum: idx + 1,
    buffer: sharedBuffer,
    trimStartSec: 0,
    effectiveDurationSec: dur,
  }));
}
