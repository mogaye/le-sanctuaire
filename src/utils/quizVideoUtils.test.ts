import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ISLAMIC_QUIZ_BANK,
  ISLAMIC_QUIZ_PACKS,
  getQuestionsByPackId,
} from '../data/islamicQuizBank';
import {
  buildQuizExportFilename,
  buildQuizTimeline,
  computeQuizFrameState,
  enforceQuizQuestionsForPlan,
  normalizeQuizQuestion,
} from './quizVideoUtils';

test('ISLAMIC_QUIZ_BANK contains rich verified questions with valid options and answers', () => {
  assert.ok(ISLAMIC_QUIZ_BANK.length >= 25);
  for (const q of ISLAMIC_QUIZ_BANK) {
    assert.ok(q.question.trim().length > 10);
    assert.equal(q.options.length, 4);
    assert.ok(q.correctIndex >= 0 && q.correctIndex <= 3);
    assert.ok(q.options[q.correctIndex].trim().length > 0);
  }
  const pack = getQuestionsByPackId(ISLAMIC_QUIZ_PACKS[0].id);
  assert.equal(pack.length, 3);
});

test('normalizeQuizQuestion cleans blank inputs and invalid indices', () => {
  const normalized = normalizeQuizQuestion(
    {
      id: '',
      question: '   ',
      options: ['Oui', '', 'Peut-être', 'Jamais'],
      correctIndex: 9 as any,
    },
    2
  );
  assert.equal(normalized.id, 'quiz_q_3');
  assert.equal(normalized.question, 'Question islamique 3');
  assert.equal(normalized.options[1], 'Réponse B');
  assert.equal(normalized.correctIndex, 0);
});

test('buildQuizTimeline builds contiguous segments scaled by paceMultiplier', () => {
  const questions = getQuestionsByPackId('pack_decouverte');
  const tlNormal = buildQuizTimeline(questions, 5, 3, 1);
  assert.equal(tlNormal.segments.length, 3);
  assert.equal(tlNormal.segments[0].startSec, 0);
  assert.equal(tlNormal.segments[0].durationSec, 8);
  assert.equal(tlNormal.segments[1].startSec, 8);
  assert.equal(tlNormal.segments[2].startSec, 16);
  assert.equal(tlNormal.totalDurationSec, 24);

  const tlFast = buildQuizTimeline(questions, 5, 3, 1.15);
  assert.ok(tlFast.totalDurationSec < 24);
  assert.equal(tlFast.segments[0].endSec, tlFast.segments[1].startSec);
});

test('computeQuizFrameState switches cleanly from question countdown to reveal phase', () => {
  const questions = getQuestionsByPackId('pack_decouverte');
  const tl = buildQuizTimeline(questions, 5, 3, 1);

  const startState = computeQuizFrameState(questions, tl, 0.2, 5, 3);
  assert.ok(startState);
  assert.equal(startState.activeIndex, 0);
  assert.equal(startState.phase, 'question');
  assert.equal(startState.countdownRemainingSec, 5);
  assert.equal(startState.revealProgress, 0);

  const midCountdown = computeQuizFrameState(questions, tl, 3.1, 5, 3);
  assert.ok(midCountdown);
  assert.equal(midCountdown.phase, 'question');
  assert.equal(midCountdown.countdownRemainingSec, 2);

  const revealStart = computeQuizFrameState(questions, tl, 5.1, 5, 3);
  assert.ok(revealStart);
  assert.equal(revealStart.activeIndex, 0);
  assert.equal(revealStart.phase, 'reveal');
  assert.equal(revealStart.countdownRemainingSec, 0);
  assert.ok(revealStart.revealProgress > 0 && revealStart.revealProgress < 0.2);

  const secondQuestion = computeQuizFrameState(questions, tl, 8.5, 5, 3);
  assert.ok(secondQuestion);
  assert.equal(secondQuestion.activeIndex, 1);
  assert.equal(secondQuestion.phase, 'question');
  assert.equal(secondQuestion.countdownRemainingSec, 5);
});

test('enforceQuizQuestionsForPlan limits free Test tier to 3 questions and allows unlimited for paid/admin', () => {
  const fiveQuestions = getQuestionsByPackId('pack_coran');
  assert.equal(fiveQuestions.length, 5);

  const testResult = enforceQuizQuestionsForPlan(fiveQuestions, 'test', 'user@example.com');
  assert.equal(testResult.wasCapped, true);
  assert.equal(testResult.questions.length, 3);
  assert.equal(testResult.maxQuestions, 3);

  const proResult = enforceQuizQuestionsForPlan(fiveQuestions, 'pro', 'user@example.com');
  assert.equal(proResult.wasCapped, false);
  assert.equal(proResult.questions.length, 5);

  const adminResult = enforceQuizQuestionsForPlan(
    fiveQuestions,
    'test',
    'mgaye60000@gmail.com'
  );
  assert.equal(adminResult.wasCapped, false);
  assert.equal(adminResult.questions.length, 5);
});

test('buildQuizExportFilename formats slugged quiz filename cleanly', () => {
  const filename = buildQuizExportFilename({
    title: 'Quiz Vie du Prophète ﷺ',
    questionCount: 5,
    aspectLabel: '9:16',
    extension: 'mp4',
    qualityId: '1080p',
  });
  assert.equal(filename, 'sanctuaire-quiz-vie-du-prophete-5q-9x16-1080p.mp4');
});
