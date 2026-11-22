import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_QUIZ_NARRATOR_SETTINGS,
  QUIZ_NARRATOR_VOICES,
  QuizNarrationBlock,
  QuizNarratorSettings,
  buildOrderedQuizSteps,
  buildTimelineFromQuizSteps,
  loadInitialQuizNarratorSettings,
  mixAudioOverlaysIntoBuffer,
  moveNarrationBlockToSlot,
  normalizeTextForFrenchNarration,
  resolveValidNarratorVoiceId,
  splitTextForTtsChunks,
} from './quizNarration';
import { QuizQuestionItem } from '../data/islamicQuizBank';

function createMockAudioCtx(sampleRate: number = 22050) {
  return {
    sampleRate,
    createBuffer(_channels: number, length: number, sr: number) {
      const channelData = new Float32Array(length);
      return {
        sampleRate: sr,
        length,
        duration: length / sr,
        numberOfChannels: 1,
        getChannelData: () => channelData,
      };
    },
  } as unknown as BaseAudioContext;
}

const SAMPLE_QUESTIONS: QuizQuestionItem[] = [
  {
    id: 'q1',
    category: 'piliers',
    question: 'Combien de piliers compte l’Islam ?',
    options: ['3', '5', '6', '7'],
    correctIndex: 1,
    explanation: 'Les 5 piliers fondamentaux.',
  },
  {
    id: 'q2',
    category: 'sira',
    question: 'Dans quelle grotte le Prophète ﷺ reçut-il la Révélation ?',
    options: ['Thawr', 'Hirâ', 'Uhud', 'Safa'],
    correctIndex: 1,
  },
];

test('normalizeTextForFrenchNarration converts honorifics, symbols, and percentages cleanly', () => {
  const out = normalizeTextForFrenchNarration('Le Prophète ﷺ a enseigné 2,5 % de Zakât !');
  assert.equal(out.includes('ﷺ'), false);
  assert.equal(out.includes('salla Allahou alayhi wa sallam'), true);
  assert.equal(out.includes('2,5 pour cent'), true);
});

test('splitTextForTtsChunks splits long paragraphs cleanly under maxChars without losing words', () => {
  const long =
    'Assalamou alaykoum chers frères et sœurs. Aujourd’hui nous allons tester vos connaissances sur la Sîra du Prophète. Préparez-vous bien pour la première question qui arrive dans un instant.';
  const chunks = splitTextForTtsChunks(long, 90);
  assert.equal(chunks.length >= 2, true);
  for (const chunk of chunks) {
    assert.equal(chunk.length <= 90, true);
  }
  assert.equal(chunks.join(' ').includes('première question'), true);
});

test('buildOrderedQuizSteps places video_opening, before_question, question, after_question, and video_closing in exact order', () => {
  const blocks: QuizNarrationBlock[] = [
    {
      id: 'b_open',
      slot: 'video_opening',
      text: 'Bienvenue au quiz !',
      showOnScreen: true,
    },
    {
      id: 'b_after1',
      slot: 'after_question',
      targetQuestionId: 'q1',
      questionIndex: 0,
      text: 'Bravo si tu as trouvé 5 !',
      showOnScreen: true,
    },
    {
      id: 'b_before2',
      slot: 'before_question',
      targetQuestionId: 'q2',
      questionIndex: 1,
      text: 'Question suivante sur la Sîra.',
      showOnScreen: false,
    },
    {
      id: 'b_close',
      slot: 'video_closing',
      text: 'Abonne-toi pour la suite !',
      showOnScreen: true,
    },
    {
      id: 'b_empty',
      slot: 'before_question',
      targetQuestionId: 'q1',
      text: '   ',
      showOnScreen: true,
    },
  ];

  const narrator: QuizNarratorSettings = {
    ...DEFAULT_QUIZ_NARRATOR_SETTINGS,
    enabled: true,
    readQuestions: true,
    readAnswers: true,
    blocks,
  };

  const steps = buildOrderedQuizSteps(SAMPLE_QUESTIONS, narrator, 5, 3, {
    'block:b_open': 2.0,
    'q:q1': 6.0, // longer than base 5s -> extends thinkSec cleanly so voice never cuts off
  });

  assert.equal(steps.length, 6);
  assert.equal(steps[0].kind, 'narration');
  assert.equal(steps[0].id, 'step_narr_b_open');

  assert.equal(steps[1].kind, 'question');
  if (steps[1].kind === 'question') {
    assert.equal(steps[1].question.id, 'q1');
    assert.equal(steps[1].thinkSec >= 6.5, true);
  }

  assert.equal(steps[2].kind, 'narration');
  assert.equal(steps[2].id, 'step_narr_b_after1');

  assert.equal(steps[3].kind, 'narration');
  assert.equal(steps[3].id, 'step_narr_b_before2');

  assert.equal(steps[4].kind, 'question');
  if (steps[4].kind === 'question') {
    assert.equal(steps[4].question.id, 'q2');
  }

  assert.equal(steps[5].kind, 'narration');
  assert.equal(steps[5].id, 'step_narr_b_close');

  const tl = buildTimelineFromQuizSteps(steps, 1);
  assert.equal(tl.segments.length, 6);
  assert.equal(tl.totalDurationSec > 20, true);
});

test('moveNarrationBlockToSlot relocates any text block to a different question or opening/closing slot', () => {
  const blocks: QuizNarrationBlock[] = [
    {
      id: 'b1',
      slot: 'after_question',
      targetQuestionId: 'q1',
      questionIndex: 0,
      text: 'Texte mobile',
      showOnScreen: true,
    },
  ];

  const movedToQ2Before = moveNarrationBlockToSlot(blocks, 'b1', 'before_question', 'q2', 1);
  assert.equal(movedToQ2Before[0].slot, 'before_question');
  assert.equal(movedToQ2Before[0].targetQuestionId, 'q2');
  assert.equal(movedToQ2Before[0].questionIndex, 1);

  const movedToOpening = moveNarrationBlockToSlot(movedToQ2Before, 'b1', 'video_opening');
  assert.equal(movedToOpening[0].slot, 'video_opening');
  assert.equal(movedToOpening[0].targetQuestionId, undefined);
});

test('mixAudioOverlaysIntoBuffer overlays narrator PCM and gently ducks background bed', () => {
  const ctx = createMockAudioCtx(8000);
  const base = ctx.createBuffer(1, 16000, 8000);
  base.getChannelData(0).fill(0.4);

  const speech = ctx.createBuffer(1, 4000, 8000);
  speech.getChannelData(0).fill(0.5);

  const mixed = mixAudioOverlaysIntoBuffer(base, ctx, [
    { buffer: speech, startAtSec: 0.5, gain: 1.0 },
  ]);
  const out = mixed.getChannelData(0);

  // Outside speech window (sample 800 = 0.1s): untouched background
  assert.equal(Math.abs(out[800] - 0.4) < 0.001, true);
  // Inside speech window (sample 4800 = 0.6s): ducked bed (0.4 * 0.35 = 0.14) + speech (0.5) = 0.64
  assert.equal(Math.abs(out[4800] - 0.64) < 0.001, true);
});

test('default quiz narrator voice is Femme Posée (google_fr) and upgrades legacy fr_001 once', () => {
  assert.equal(DEFAULT_QUIZ_NARRATOR_SETTINGS.voiceId, 'google_fr');
  assert.equal(QUIZ_NARRATOR_VOICES[0].id, 'google_fr');
  assert.equal(QUIZ_NARRATOR_VOICES[0].gender, 'femme');
  assert.equal(QUIZ_NARRATOR_VOICES[0].shortLabel, 'Femme Posée');
  assert.equal(resolveValidNarratorVoiceId(undefined), 'google_fr');
  assert.equal(resolveValidNarratorVoiceId('invalid_voice'), 'google_fr');

  // Fresh preferences default to google_fr
  assert.equal(loadInitialQuizNarratorSettings(null).voiceId, 'google_fr');

  // Legacy saved fr_001 without quizFemmeDefaultApplied migrates once to google_fr
  assert.equal(
    loadInitialQuizNarratorSettings({
      quizNarrator: { enabled: true, voiceId: 'fr_001', readQuestions: true, readAnswers: false, blocks: [] },
    }).voiceId,
    'google_fr'
  );

  // Explicit choice after migration is respected
  assert.equal(
    loadInitialQuizNarratorSettings({
      quizFemmeDefaultApplied: true,
      quizNarrator: { enabled: true, voiceId: 'fr_001', readQuestions: true, readAnswers: false, blocks: [] },
    }).voiceId,
    'fr_001'
  );
  assert.equal(
    loadInitialQuizNarratorSettings({
      quizNarrator: { enabled: true, voiceId: 'fr_002', readQuestions: true, readAnswers: false, blocks: [] },
    }).voiceId,
    'fr_002'
  );
});
