import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePastedQuizText, SAMPLE_PASTE_QUIZ_TEXT } from './quizTextParser';

test('parsePastedQuizText parses sample multi-format quiz accurately', () => {
  const result = parsePastedQuizText(SAMPLE_PASTE_QUIZ_TEXT);
  assert.equal(result.questions.length, 3);
  assert.equal(result.answersDetectedCount, 3);
  assert.equal(result.unansweredCount, 0);

  assert.equal(
    result.questions[0].question,
    'Quelle sourate est appelée « le cœur du Coran » selon une tradition répandue ?'
  );
  assert.deepEqual(result.questions[0].options, [
    'Al-Fatiha',
    'Yâ-Sîn',
    'Al-Mulk',
    'Ar-Rahman',
  ]);
  assert.equal(result.questions[0].correctIndex, 1);
  assert.ok(result.questions[0].explanation?.includes('Yâ-Sîn'));

  assert.equal(result.questions[1].correctIndex, 1);
  assert.deepEqual(result.questions[1].options, [
    '3 prières',
    '5 prières',
    '7 prières',
    '2 prières',
  ]);

  assert.equal(result.questions[2].correctIndex, 2);
  assert.deepEqual(result.questions[2].options, [
    'La Mecque',
    'Jérusalem',
    'Médine',
    'Taëf',
  ]);
});

test('parsePastedQuizText supports single-line inline options and Markdown formatting', () => {
  const input = `
**Q1 : Quel prophète a construit l'arche ?** A) Moussa B) Nouh C) Ibrahim D) Issa Réponse : Nouh
2. Quel mois précède Chawwâl ? A) Rajab | B) Cha'ban | C) Ramadan | D) Muharram | Bonne réponse : C
`;
  const result = parsePastedQuizText(input);
  assert.equal(result.questions.length, 2);
  assert.equal(result.questions[0].question, "Quel prophète a construit l'arche ?");
  assert.deepEqual(result.questions[0].options, ['Moussa', 'Nouh', 'Ibrahim', 'Issa']);
  assert.equal(result.questions[0].correctIndex, 1);

  assert.equal(result.questions[1].question, 'Quel mois précède Chawwâl ?');
  assert.deepEqual(result.questions[1].options, [
    'Rajab',
    "Cha'ban",
    'Ramadan',
    'Muharram',
  ]);
  assert.equal(result.questions[1].correctIndex, 2);
});

test('parsePastedQuizText supports trailing answer key section (Corrigé)', () => {
  const input = `
1. Combien de sourates compte le Coran ?
A) 110
B) 114
C) 120
D) 99

2. Quelle est la première sourate du Coran ?
A) Al-Baqarah
B) An-Nas
C) Al-Fatiha
D) Al-Ikhlas

Corrigé :
1. B
2. C
`;
  const result = parsePastedQuizText(input);
  assert.equal(result.questions.length, 2);
  assert.equal(result.answersDetectedCount, 2);
  assert.equal(result.questions[0].correctIndex, 1);
  assert.equal(result.questions[1].correctIndex, 2);
});

test('parsePastedQuizText handles numbered sub-options and inline asterisk marker', () => {
  const input = `
Quel ange a transmis la Révélation au Prophète ﷺ ?
1) Mikail
2) Israfil
3) Jibril *
4) Malik
`;
  const result = parsePastedQuizText(input);
  assert.equal(result.questions.length, 1);
  assert.deepEqual(result.questions[0].options, [
    'Mikail',
    'Israfil',
    'Jibril',
    'Malik',
  ]);
  assert.equal(result.questions[0].correctIndex, 2);
  assert.equal(result.answersDetectedCount, 1);
});

test('parsePastedQuizText returns empty result for blank text without crashing', () => {
  const result = parsePastedQuizText('   \n  ');
  assert.equal(result.questions.length, 0);
  assert.equal(result.warnings.length, 0);
});
