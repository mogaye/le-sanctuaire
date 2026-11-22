import { QuizQuestionItem } from '../data/islamicQuizBank';
import { DecodedVerseBuffer } from './continuousAudioEngine';
import {
  ContinuousTimeline,
  ContinuousTimelineSegment,
} from './mobileVideoStudioUtils';

export type QuizNarratorVoiceId = 'fr_001' | 'fr_002' | 'google_fr';

export type QuizNarrationSlotType =
  | 'video_opening'
  | 'before_question'
  | 'after_question'
  | 'video_closing';

export interface QuizNarrationBlock {
  id: string;
  slot: QuizNarrationSlotType;
  /** Target question id when slot is 'before_question' or 'after_question' */
  targetQuestionId?: string;
  /** Fallback 0-based index if targetQuestionId is missing */
  questionIndex?: number;
  text: string;
  /** Display this narration text cleanly on the video canvas while speaking */
  showOnScreen: boolean;
}

export interface QuizNarratorSettings {
  enabled: boolean;
  voiceId: QuizNarratorVoiceId;
  /** Automatically read every quiz question text aloud */
  readQuestions: boolean;
  /** Optionally read the correct answer & explanation when revealed */
  readAnswers: boolean;
  /** User-placed custom narration blocks (opening, before/after any question, closing) */
  blocks: QuizNarrationBlock[];
}

export interface QuizNarratorVoiceMeta {
  id: QuizNarratorVoiceId;
  label: string;
  shortLabel: string;
  description: string;
  gender: 'homme' | 'femme';
}

export const QUIZ_NARRATOR_VOICES: QuizNarratorVoiceMeta[] = [
  {
    id: 'fr_001',
    label: 'Narrateur Posé (Homme)',
    shortLabel: 'Homme Posé',
    description: 'Voix naturelle, chaleureuse et claire',
    gender: 'homme',
  },
  {
    id: 'fr_002',
    label: 'Narrateur Dynamique (Homme)',
    shortLabel: 'Homme Dynamique',
    description: 'Voix rythmée idéale TikTok & Reels',
    gender: 'homme',
  },
  {
    id: 'google_fr',
    label: 'Narratrice Claire (Femme)',
    shortLabel: 'Femme Claire',
    description: 'Voix féminine posée et fluide',
    gender: 'femme',
  },
];

export const DEFAULT_QUIZ_NARRATOR_SETTINGS: QuizNarratorSettings = {
  enabled: true,
  voiceId: 'fr_001',
  readQuestions: true,
  readAnswers: false,
  blocks: [],
};

export interface QuizNarrationStep {
  kind: 'narration';
  id: string;
  block: QuizNarrationBlock;
  relatedQuestionIndex: number | null;
  durationSec: number;
}

export interface QuizQuestionStep {
  kind: 'question';
  id: string;
  questionIndex: number;
  question: QuizQuestionItem;
  thinkSec: number;
  revealSec: number;
  durationSec: number;
  questionSpeechText: string;
  answerSpeechText: string;
}

export type QuizTimelineStep = QuizNarrationStep | QuizQuestionStep;

export interface PreparedQuizNarrationPlan {
  steps: QuizTimelineStep[];
  timeline: ContinuousTimeline;
  decodedBuffers: DecodedVerseBuffer[];
  narrationAudioLoadedCount: number;
  narrationAudioRequestedCount: number;
}

export function resolveValidNarratorVoiceId(
  raw: string | undefined | null
): QuizNarratorVoiceId {
  if (raw === 'fr_001' || raw === 'fr_002' || raw === 'google_fr') {
    return raw;
  }
  return 'fr_001';
}

export function createQuizNarrationBlock(
  slot: QuizNarrationSlotType,
  opts?: {
    targetQuestionId?: string;
    questionIndex?: number;
    text?: string;
    showOnScreen?: boolean;
  }
): QuizNarrationBlock {
  const defaultText =
    slot === 'video_opening'
      ? 'Assalamou alaykoum ! Teste tes connaissances sur l’Islam avec ce quiz.'
      : slot === 'video_closing'
      ? 'Qu’Allah augmente notre science ! Dis ton score en commentaire.'
      : '';

  return {
    id: `narr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    slot,
    targetQuestionId: opts?.targetQuestionId,
    questionIndex: opts?.questionIndex,
    text: typeof opts?.text === 'string' ? opts.text : defaultText,
    showOnScreen: opts?.showOnScreen ?? true,
  };
}

export function normalizeQuizNarratorSettings(
  raw: Partial<QuizNarratorSettings> | undefined | null
): QuizNarratorSettings {
  if (!raw || typeof raw !== 'object') {
    return {
      ...DEFAULT_QUIZ_NARRATOR_SETTINGS,
      blocks: [],
    };
  }
  const blocks: QuizNarrationBlock[] = Array.isArray(raw.blocks)
    ? raw.blocks
        .filter((b): b is QuizNarrationBlock => Boolean(b && typeof b === 'object'))
        .map((b, idx) => ({
          id:
            typeof b.id === 'string' && b.id.trim()
              ? b.id.trim()
              : `narr_restored_${idx + 1}`,
          slot:
            b.slot === 'video_opening' ||
            b.slot === 'before_question' ||
            b.slot === 'after_question' ||
            b.slot === 'video_closing'
              ? b.slot
              : 'video_opening',
          targetQuestionId:
            typeof b.targetQuestionId === 'string' && b.targetQuestionId.trim()
              ? b.targetQuestionId.trim()
              : undefined,
          questionIndex:
            typeof b.questionIndex === 'number' && Number.isFinite(b.questionIndex)
              ? Math.max(0, Math.floor(b.questionIndex))
              : undefined,
          text: typeof b.text === 'string' ? b.text : '',
          showOnScreen: b.showOnScreen !== false,
        }))
    : [];

  return {
    enabled: raw.enabled !== false,
    voiceId: resolveValidNarratorVoiceId(raw.voiceId),
    readQuestions: raw.readQuestions !== false,
    readAnswers: Boolean(raw.readAnswers),
    blocks,
  };
}

/**
 * Prepares French quiz/narration text so neural voices pronounce Arabic honorifics,
 * Islamic terms, percentages, and punctuation naturally without awkward symbol skips.
 */
export function normalizeTextForFrenchNarration(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/ﷺ/g, ' salla Allahou alayhi wa sallam ')
    .replace(/[‘’`]/g, "'")
    .replace(/[“”«»]/g, ' ')
    .replace(/(\d+(?:[.,]\d+)?)\s*%/g, '$1 pour cent')
    .replace(/[✓✔•·★☆✨🌙🕌📖❓]+/g, ' ')
    .replace(/['’]s\b/gi, "'s")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Splits longer French narration texts into TTS-safe chunks (<= maxChars)
 * breaking cleanly on sentence boundaries, commas, or whitespace.
 */
export function splitTextForTtsChunks(
  rawText: string,
  maxChars: number = 210
): string[] {
  const clean = normalizeTextForFrenchNarration(rawText);
  if (!clean) return [];
  const limit = Math.max(40, Math.floor(maxChars));
  if (clean.length <= limit) return [clean];

  const chunks: string[] = [];
  let remaining = clean;

  while (remaining.length > 0) {
    if (remaining.length <= limit) {
      chunks.push(remaining);
      break;
    }

    const slice = remaining.slice(0, limit + 1);
    let cut = -1;

    // Prefer sentence ending (. ! ? ;)
    for (let i = slice.length - 1; i >= Math.floor(limit * 0.45); i--) {
      if (slice[i] === '.' || slice[i] === '!' || slice[i] === '?' || slice[i] === ';') {
        cut = i + 1;
        break;
      }
    }

    // Fallback to comma or colon
    if (cut === -1) {
      for (let i = slice.length - 1; i >= Math.floor(limit * 0.45); i--) {
        if (slice[i] === ',' || slice[i] === ':') {
          cut = i + 1;
          break;
        }
      }
    }

    // Fallback to last space
    if (cut === -1) {
      const lastSpace = slice.lastIndexOf(' ');
      if (lastSpace > Math.floor(limit * 0.35)) {
        cut = lastSpace;
      } else {
        cut = limit;
      }
    }

    const part = remaining.slice(0, cut).trim();
    if (part) chunks.push(part);
    remaining = remaining.slice(cut).trim();
  }

  return chunks;
}

/**
 * Estimates natural French speech duration in seconds for layout & timeline previews
 * before live neural TTS audio buffers are decoded.
 */
export function estimateNarrationDurationSec(rawText: string): number {
  const clean = normalizeTextForFrenchNarration(rawText);
  if (!clean) return 0;
  const words = clean.split(/\s+/).filter(Boolean).length;
  // ~2.55 words/sec for realistic French narration + 0.65s lead/tail breathing room
  return Number(Math.max(1.8, words / 2.55 + 0.65).toFixed(2));
}

export function getNarrationSlotLabel(
  slot: QuizNarrationSlotType,
  questionIndex?: number | null
): string {
  if (slot === 'video_opening') return 'Ouverture vidéo';
  if (slot === 'video_closing') return 'Fin de vidéo';
  const qNum = typeof questionIndex === 'number' && questionIndex >= 0 ? questionIndex + 1 : 1;
  return slot === 'before_question'
    ? `Avant Question ${qNum}`
    : `Après Question ${qNum}`;
}

export function buildAnswerNarrationText(question: QuizQuestionItem): string {
  const answerText = question.options[question.correctIndex] || '';
  if (!answerText) return '';
  if (question.explanation && question.explanation.trim()) {
    return `La bonne réponse est : ${answerText}. ${question.explanation.trim()}`;
  }
  return `La bonne réponse est : ${answerText}.`;
}

export function moveNarrationBlockToSlot(
  blocks: QuizNarrationBlock[],
  blockId: string,
  targetSlot: QuizNarrationSlotType,
  targetQuestionId?: string,
  questionIndex?: number
): QuizNarrationBlock[] {
  return blocks.map((b) => {
    if (b.id !== blockId) return b;
    return {
      ...b,
      slot: targetSlot,
      targetQuestionId:
        targetSlot === 'before_question' || targetSlot === 'after_question'
          ? targetQuestionId
          : undefined,
      questionIndex:
        targetSlot === 'before_question' || targetSlot === 'after_question'
          ? questionIndex
          : undefined,
    };
  });
}

function matchesQuestionAnchor(
  block: QuizNarrationBlock,
  question: QuizQuestionItem,
  index: number
): boolean {
  if (block.targetQuestionId) {
    return block.targetQuestionId === question.id;
  }
  return block.questionIndex === index;
}

/**
 * Builds the exact ordered sequence of Quiz timeline steps:
 * [video_opening blocks] -> for each question [before_question blocks, question step, after_question blocks] -> [video_closing blocks].
 */
export function buildOrderedQuizSteps(
  questions: QuizQuestionItem[],
  narrator: QuizNarratorSettings,
  baseThinkSec: number,
  baseRevealSec: number,
  measuredSpeechDurations?: Record<string, number>
): QuizTimelineStep[] {
  if (!Array.isArray(questions) || questions.length === 0) {
    return [];
  }

  const safeThink = Math.max(2, Math.min(15, Math.round(baseThinkSec || 5)));
  const safeReveal = Math.max(2, Math.min(8, Math.round(baseRevealSec || 3)));
  const steps: QuizTimelineStep[] = [];
  const narratorOn = Boolean(narrator?.enabled);
  const validBlocks = narratorOn
    ? (narrator.blocks || []).filter((b) => Boolean(b.text && b.text.trim()))
    : [];

  const getBlockDuration = (block: QuizNarrationBlock): number => {
    const measured = measuredSpeechDurations?.[`block:${block.id}`];
    if (typeof measured === 'number' && Number.isFinite(measured) && measured > 0) {
      return Number(Math.max(1.8, measured + 0.55).toFixed(2));
    }
    return estimateNarrationDurationSec(block.text);
  };

  // 1. Opening blocks
  for (const block of validBlocks) {
    if (block.slot === 'video_opening') {
      steps.push({
        kind: 'narration',
        id: `step_narr_${block.id}`,
        block,
        relatedQuestionIndex: null,
        durationSec: getBlockDuration(block),
      });
    }
  }

  // 2. Questions + before/after blocks
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    for (const block of validBlocks) {
      if (block.slot === 'before_question' && matchesQuestionAnchor(block, q, i)) {
        steps.push({
          kind: 'narration',
          id: `step_narr_${block.id}`,
          block,
          relatedQuestionIndex: i,
          durationSec: getBlockDuration(block),
        });
      }
    }

    const qSpeechText =
      narratorOn && narrator.readQuestions ? q.question.trim() : '';
    const aSpeechText =
      narratorOn && narrator.readAnswers ? buildAnswerNarrationText(q) : '';

    const measuredQDur = measuredSpeechDurations?.[`q:${q.id}`];
    const qDurNeeded =
      typeof measuredQDur === 'number' && measuredQDur > 0
        ? measuredQDur + 0.65
        : qSpeechText
        ? estimateNarrationDurationSec(qSpeechText) + 0.4
        : 0;

    const measuredADur = measuredSpeechDurations?.[`a:${q.id}`];
    const aDurNeeded =
      typeof measuredADur === 'number' && measuredADur > 0
        ? measuredADur + 0.5
        : aSpeechText
        ? estimateNarrationDurationSec(aSpeechText) + 0.25
        : 0;

    const effectiveThinkSec = Number(
      Math.max(safeThink, qDurNeeded).toFixed(2)
    );
    const effectiveRevealSec = Number(
      Math.max(safeReveal, aDurNeeded).toFixed(2)
    );

    steps.push({
      kind: 'question',
      id: `step_q_${q.id}`,
      questionIndex: i,
      question: q,
      thinkSec: effectiveThinkSec,
      revealSec: effectiveRevealSec,
      durationSec: Number((effectiveThinkSec + effectiveRevealSec).toFixed(2)),
      questionSpeechText: qSpeechText,
      answerSpeechText: aSpeechText,
    });

    for (const block of validBlocks) {
      if (block.slot === 'after_question' && matchesQuestionAnchor(block, q, i)) {
        steps.push({
          kind: 'narration',
          id: `step_narr_${block.id}`,
          block,
          relatedQuestionIndex: i,
          durationSec: getBlockDuration(block),
        });
      }
    }
  }

  // 3. Closing blocks
  for (const block of validBlocks) {
    if (block.slot === 'video_closing') {
      steps.push({
        kind: 'narration',
        id: `step_narr_${block.id}`,
        block,
        relatedQuestionIndex: null,
        durationSec: getBlockDuration(block),
      });
    }
  }

  return steps;
}

export function buildTimelineFromQuizSteps(
  steps: QuizTimelineStep[],
  paceMultiplier: number = 1
): ContinuousTimeline {
  if (!Array.isArray(steps) || steps.length === 0) {
    return { segments: [], totalDurationSec: 0 };
  }
  const safePace = Math.max(0.75, Math.min(1.5, Number(paceMultiplier) || 1));
  let cursor = 0;

  const segments: ContinuousTimelineSegment[] = steps.map((step, idx) => {
    const dur = Number((step.durationSec / safePace).toFixed(3));
    const startSec = Number(cursor.toFixed(3));
    const endSec = Number((cursor + dur).toFixed(3));
    cursor = endSec;
    return {
      index: idx,
      ayahNum: step.kind === 'question' ? step.questionIndex + 1 : 0,
      surahName:
        step.kind === 'question'
          ? step.question.category
          : getNarrationSlotLabel(step.block.slot, step.relatedQuestionIndex),
      startSec,
      endSec,
      durationSec: dur,
    };
  });

  return {
    segments,
    totalDurationSec: Number(cursor.toFixed(3)),
  };
}

/**
 * Pure PCM float mixer: overlays speech AudioBuffers onto a segment AudioBuffer
 * at exact timeline offsets while gently ducking background ticks if overlapping.
 */
export function mixAudioOverlaysIntoBuffer(
  baseBuffer: AudioBuffer,
  audioCtx: BaseAudioContext,
  overlays: Array<{ buffer: AudioBuffer | null | undefined; startAtSec: number; gain?: number }>
): AudioBuffer {
  const sr = Math.max(8000, baseBuffer.sampleRate || audioCtx.sampleRate || 48000);
  const frameCount = baseBuffer.length;
  const out = audioCtx.createBuffer(1, frameCount, sr);
  const outData = out.getChannelData(0);
  const baseData = baseBuffer.getChannelData(0);

  // Determine active speech windows so countdown ticks duck gently underneath voice
  const speechActiveMask = new Uint8Array(frameCount);
  for (const ov of overlays) {
    if (!ov?.buffer) continue;
    const startSample = Math.max(0, Math.round(ov.startAtSec * sr));
    const len = Math.min(ov.buffer.length, frameCount - startSample);
    for (let i = 0; i < len; i++) {
      speechActiveMask[startSample + i] = 1;
    }
  }

  for (let i = 0; i < frameCount; i++) {
    const duck = speechActiveMask[i] ? 0.35 : 1.0;
    outData[i] = baseData[i] * duck;
  }

  for (const ov of overlays) {
    if (!ov?.buffer) continue;
    const gain = ov.gain ?? 1.0;
    const startSample = Math.max(0, Math.round(ov.startAtSec * sr));
    const srcData = ov.buffer.getChannelData(0);
    const len = Math.min(srcData.length, frameCount - startSample);
    for (let i = 0; i < len; i++) {
      outData[startSample + i] += srcData[i] * gain;
    }
  }

  // Soft limiter to guarantee zero clipping
  for (let i = 0; i < frameCount; i++) {
    if (outData[i] > 0.92) outData[i] = 0.92;
    else if (outData[i] < -0.92) outData[i] = -0.92;
  }

  return out;
}

// =========================================================================
// CLIENT TTS CACHE, DECODING & PREVIEW PLAYER
// =========================================================================

const decodedTtsCache = new Map<string, AudioBuffer>();
const inflightTtsFetches = new Map<string, Promise<AudioBuffer | null>>();

function decodeBase64ToArrayBuffer(b64: string): ArrayBuffer {
  const binaryStr = atob(b64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes.buffer;
}

function concatDecodedAudioChunks(
  audioCtx: BaseAudioContext,
  chunks: AudioBuffer[],
  gapSec: number = 0.06
): AudioBuffer | null {
  if (chunks.length === 0) return null;
  if (chunks.length === 1) return chunks[0];

  const sr = chunks[0].sampleRate || audioCtx.sampleRate || 48000;
  const gapFrames = Math.round(gapSec * sr);
  let totalFrames = 0;
  for (let i = 0; i < chunks.length; i++) {
    totalFrames += chunks[i].length;
    if (i < chunks.length - 1) totalFrames += gapFrames;
  }

  const merged = audioCtx.createBuffer(1, Math.max(1, totalFrames), sr);
  const out = merged.getChannelData(0);
  let cursor = 0;
  for (let i = 0; i < chunks.length; i++) {
    const src = chunks[i].getChannelData(0);
    out.set(src, cursor);
    cursor += src.length + (i < chunks.length - 1 ? gapFrames : 0);
  }
  return merged;
}

export async function fetchQuizTtsAudioBuffer(
  audioCtx: BaseAudioContext,
  rawText: string,
  voiceId: QuizNarratorVoiceId,
  signal?: AbortSignal
): Promise<AudioBuffer | null> {
  const normalized = normalizeTextForFrenchNarration(rawText);
  if (!normalized) return null;

  const sr = audioCtx.sampleRate || 48000;
  const cacheKey = `${voiceId}::${sr}::${normalized}`;
  const cached = decodedTtsCache.get(cacheKey);
  if (cached) return cached;

  const inflight = inflightTtsFetches.get(cacheKey);
  if (inflight) return inflight;

  const run = (async (): Promise<AudioBuffer | null> => {
    try {
      const res = await fetch('/api/quiz-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: normalized, voiceId }),
        signal,
      });
      if (!res.ok) return null;
      const json = await res.json().catch(() => null);
      const rawChunks: string[] = Array.isArray(json?.chunks) ? json.chunks : [];
      if (rawChunks.length === 0) return null;

      const decodedChunks: AudioBuffer[] = [];
      for (const b64 of rawChunks) {
        if (signal?.aborted) return null;
        if (!b64 || typeof b64 !== 'string') continue;
        const arr = decodeBase64ToArrayBuffer(b64);
        if (arr.byteLength < 128) continue;
        const buf = await audioCtx.decodeAudioData(arr.slice(0));
        if (buf && buf.length > 0) {
          decodedChunks.push(buf);
        }
      }

      const combined = concatDecodedAudioChunks(audioCtx, decodedChunks);
      if (combined) {
        if (decodedTtsCache.size > 160) {
          const oldest = decodedTtsCache.keys().next().value;
          if (oldest) decodedTtsCache.delete(oldest);
        }
        decodedTtsCache.set(cacheKey, combined);
      }
      return combined;
    } catch {
      return null;
    } finally {
      inflightTtsFetches.delete(cacheKey);
    }
  })();

  inflightTtsFetches.set(cacheKey, run);
  return run;
}

let activePreviewSource: AudioBufferSourceNode | null = null;
let activePreviewCtx: AudioContext | null = null;

export function stopNarrationPreviewAudio(): void {
  if (activePreviewSource) {
    try {
      activePreviewSource.stop();
    } catch {}
    activePreviewSource = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

export async function previewSingleNarrationAudio(
  rawText: string,
  voiceId: QuizNarratorVoiceId
): Promise<boolean> {
  stopNarrationPreviewAudio();
  const text = normalizeTextForFrenchNarration(rawText);
  if (!text) return false;

  try {
    const AudioContextCtor =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!activePreviewCtx || activePreviewCtx.state === 'closed') {
      activePreviewCtx = new AudioContextCtor();
    }
    if (activePreviewCtx.state === 'suspended') {
      await activePreviewCtx.resume().catch(() => {});
    }
    const buf = await fetchQuizTtsAudioBuffer(activePreviewCtx, text, voiceId);
    if (buf) {
      const src = activePreviewCtx.createBufferSource();
      src.buffer = buf;
      src.connect(activePreviewCtx.destination);
      activePreviewSource = src;
      src.onended = () => {
        if (activePreviewSource === src) {
          activePreviewSource = null;
        }
      };
      src.start();
      return true;
    }
  } catch {}

  // Offline / fallback browser speech synthesis preview
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'fr-FR';
      window.speechSynthesis.speak(utter);
      return true;
    } catch {}
  }
  return false;
}

/**
 * Fetches & decodes all narrator voice lines needed for the quiz (opening, before/after blocks,
 * questions, and optional answers), measures exact audio durations, builds the final synchronized
 * timeline, and mixes voice + countdown ticks + reveal chimes into ready DecodedVerseBuffer[] tracks.
 */
export async function prepareNarratedQuizAudioAndTimeline(params: {
  audioCtx: BaseAudioContext;
  questions: QuizQuestionItem[];
  narrator: QuizNarratorSettings;
  thinkSec: number;
  revealSec: number;
  paceMultiplier: number;
  soundEnabled: boolean;
  synthesizeQuestionBed: (
    ctx: BaseAudioContext,
    thinkSec: number,
    revealSec: number,
    soundEnabled: boolean
  ) => AudioBuffer | null;
  onProgress?: (loaded: number, total: number) => void;
  signal?: AbortSignal;
}): Promise<PreparedQuizNarrationPlan> {
  const {
    audioCtx,
    questions,
    narrator,
    thinkSec,
    revealSec,
    paceMultiplier,
    soundEnabled,
    synthesizeQuestionBed,
    onProgress,
    signal,
  } = params;

  const speechJobs: Array<{ key: string; text: string }> = [];
  if (narrator.enabled) {
    for (const block of narrator.blocks || []) {
      if (block.text && block.text.trim()) {
        speechJobs.push({ key: `block:${block.id}`, text: block.text.trim() });
      }
    }
    for (const q of questions) {
      if (narrator.readQuestions && q.question.trim()) {
        speechJobs.push({ key: `q:${q.id}`, text: q.question.trim() });
      }
      if (narrator.readAnswers) {
        const ansText = buildAnswerNarrationText(q);
        if (ansText) {
          speechJobs.push({ key: `a:${q.id}`, text: ansText });
        }
      }
    }
  }

  const speechBuffers = new Map<string, AudioBuffer>();
  const measuredDurations: Record<string, number> = {};

  if (speechJobs.length > 0) {
    let completed = 0;
    let nextIdx = 0;
    const concurrency = Math.min(3, speechJobs.length);

    const runWorker = async () => {
      while (true) {
        if (signal?.aborted) return;
        const idx = nextIdx++;
        if (idx >= speechJobs.length) return;
        const job = speechJobs[idx];
        const buf = await fetchQuizTtsAudioBuffer(
          audioCtx,
          job.text,
          narrator.voiceId,
          signal
        );
        if (buf) {
          speechBuffers.set(job.key, buf);
          measuredDurations[job.key] = buf.duration;
        }
        completed++;
        onProgress?.(completed, speechJobs.length);
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => runWorker()));
  }

  const steps = buildOrderedQuizSteps(
    questions,
    narrator,
    thinkSec,
    revealSec,
    measuredDurations
  );
  const timeline = buildTimelineFromQuizSteps(steps, paceMultiplier);
  const sampleRate = Math.max(22050, audioCtx.sampleRate || 48000);

  const decodedBuffers: DecodedVerseBuffer[] = steps.map((step, idx) => {
    if (step.kind === 'narration') {
      const frameCount = Math.max(1, Math.round(step.durationSec * sampleRate));
      const base = audioCtx.createBuffer(1, frameCount, sampleRate);
      const speechBuf = speechBuffers.get(`block:${step.block.id}`) || null;
      const mixed = speechBuf
        ? mixAudioOverlaysIntoBuffer(base, audioCtx, [
            { buffer: speechBuf, startAtSec: 0.14, gain: 1.0 },
          ])
        : base;

      return {
        ayahNum: idx + 1,
        buffer: mixed,
        trimStartSec: 0,
        effectiveDurationSec: step.durationSec,
      };
    }

    const bed =
      synthesizeQuestionBed(
        audioCtx,
        step.thinkSec,
        step.revealSec,
        soundEnabled
      ) ||
      audioCtx.createBuffer(
        1,
        Math.max(1, Math.round(step.durationSec * sampleRate)),
        sampleRate
      );

    const qSpeech = speechBuffers.get(`q:${step.question.id}`) || null;
    const aSpeech = speechBuffers.get(`a:${step.question.id}`) || null;

    const overlays: Array<{
      buffer: AudioBuffer | null | undefined;
      startAtSec: number;
      gain?: number;
    }> = [];
    if (qSpeech) {
      overlays.push({ buffer: qSpeech, startAtSec: 0.12, gain: 1.0 });
    }
    if (aSpeech) {
      overlays.push({ buffer: aSpeech, startAtSec: step.thinkSec + 0.16, gain: 1.0 });
    }

    const mixed =
      overlays.length > 0
        ? mixAudioOverlaysIntoBuffer(bed, audioCtx, overlays)
        : bed;

    return {
      ayahNum: step.questionIndex + 1,
      buffer: mixed,
      trimStartSec: 0,
      effectiveDurationSec: step.durationSec,
    };
  });

  return {
    steps,
    timeline,
    decodedBuffers,
    narrationAudioLoadedCount: speechBuffers.size,
    narrationAudioRequestedCount: speechJobs.length,
  };
}
