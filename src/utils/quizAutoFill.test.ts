import test from 'node:test';
import assert from 'node:assert/strict';
import {
  autoFillSingleQuestion,
  fillBlankQuizQuestions,
  generateAutoFillQuestions,
  generateSurahQuizPool,
  getAutoFillPool,
  isBlankOrPlaceholderQuizQuestion,
} from './quizAutoFill';
import { QuizQuestionItem } from '../data/islamicQuizBank';

function makeDeterministicRng(seed = 42): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

test('generateSurahQuizPool produces rich verified 4-choice questions from 114 surahs without AI', () => {
  const pool = generateSurahQuizPool();
  assert.ok(pool.length >= 150, `Expected >= 150 generated questions, got ${pool.length}`);

  for (const q of pool) {
    assert.equal(q.category, 'coran');
    assert.ok(q.question.trim().length > 10);
    assert.equal(q.options.length, 4);
    assert.ok(q.correctIndex >= 0 && q.correctIndex <= 3);
    const uniqueOpts = new Set(q.options.map((o) => o.trim().toLowerCase()));
    assert.equal(uniqueOpts.size, 4, `Duplicate options found in ${q.id}: ${q.options.join(', ')}`);
    assert.ok(q.options[q.correctIndex].trim().length > 0);
  }
});

test('generateAutoFillQuestions returns exact count without duplicates across categories', () => {
  const rng = makeDeterministicRng(123);
  const all15 = generateAutoFillQuestions({ count: 15, category: 'all', rng });
  assert.equal(all15.length, 15);

  const uniqueQuestions = new Set(all15.map((q) => q.question.toLowerCase()));
  assert.equal(uniqueQuestions.size, 15);

  const piliers10 = generateAutoFillQuestions({ count: 10, category: 'piliers', rng });
  assert.equal(piliers10.length, 10);
  assert.ok(piliers10.every((q) => q.category === 'piliers'));

  const coran20 = generateAutoFillQuestions({ count: 20, category: 'coran', rng });
  assert.equal(coran20.length, 20);
  assert.ok(coran20.every((q) => q.category === 'coran'));
});

test('generateAutoFillQuestions excludes already-present questions when appending', () => {
  const rng = makeDeterministicRng(99);
  const initial = generateAutoFillQuestions({ count: 5, category: 'all', rng });
  const appended = generateAutoFillQuestions({
    count: 5,
    category: 'all',
    excludeQuestions: initial,
    rng,
  });
  assert.equal(appended.length, 5);
  const initialTexts = new Set(initial.map((q) => q.question.toLowerCase()));
  for (const item of appended) {
    assert.equal(initialTexts.has(item.question.toLowerCase()), false);
  }
});

test('isBlankOrPlaceholderQuizQuestion detects blank/default cards accurately', () => {
  assert.equal(
    isBlankOrPlaceholderQuizQuestion({
      id: 'custom_1',
      category: 'coran',
      question: 'Question islamique 4 ?',
      options: ['Réponse A', 'Réponse B', 'Réponse C', 'Réponse D'],
      correctIndex: 0,
    }),
    true
  );

  assert.equal(
    isBlankOrPlaceholderQuizQuestion({
      id: 'custom_2',
      category: 'coran',
      question: 'Combien de piliers compte l’Islam ?',
      options: ['3', '5', '6', '7'],
      correctIndex: 1,
    }),
    false
  );
});

test('fillBlankQuizQuestions fills only blank questions while preserving custom ones', () => {
  const rng = makeDeterministicRng(7);
  const custom: QuizQuestionItem = {
    id: 'my_custom_q',
    category: 'sira',
    question: 'Ma question personnalisée sur la Sîra ?',
    options: ['Choix 1', 'Choix 2', 'Choix 3', 'Choix 4'],
    correctIndex: 2,
  };
  const blank1: QuizQuestionItem = {
    id: 'blank_1',
    category: 'coran',
    question: 'Question islamique 2 ?',
    options: ['Réponse A', 'Réponse B', 'Réponse C', 'Réponse D'],
    correctIndex: 0,
  };
  const blank2: QuizQuestionItem = {
    id: 'blank_2',
    category: 'coran',
    question: '',
    options: ['Réponse A', 'Réponse B', 'Réponse C', 'Réponse D'],
    correctIndex: 0,
  };

  const result = fillBlankQuizQuestions([custom, blank1, blank2], {
    category: 'piliers',
    rng,
  });

  assert.equal(result.filledCount, 2);
  assert.equal(result.questions.length, 3);
  assert.equal(result.questions[0].id, 'my_custom_q');
  assert.equal(result.questions[0].question, custom.question);
  assert.equal(isBlankOrPlaceholderQuizQuestion(result.questions[1]), false);
  assert.equal(isBlankOrPlaceholderQuizQuestion(result.questions[2]), false);
  assert.equal(result.questions[1].category, 'piliers');
});

test('autoFillSingleQuestion replaces target card without duplicating existing questions', () => {
  const rng = makeDeterministicRng(55);
  const initial = generateAutoFillQuestions({ count: 3, category: 'all', rng });
  const blank: QuizQuestionItem = {
    id: 'blank_single',
    category: 'coran',
    question: 'Question islamique 4 ?',
    options: ['Réponse A', 'Réponse B', 'Réponse C', 'Réponse D'],
    correctIndex: 0,
  };

  const { questions, updatedQuestion } = autoFillSingleQuestion(
    [...initial, blank],
    'blank_single',
    { category: 'coran', rng }
  );

  assert.ok(updatedQuestion);
  assert.equal(questions.length, 4);
  assert.equal(isBlankOrPlaceholderQuizQuestion(questions[3]), false);
  assert.equal(questions[3].category, 'coran');
  const poolSize = getAutoFillPool('all').length;
  assert.ok(poolSize >= 200);
});
