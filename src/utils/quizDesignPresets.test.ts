import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILT_IN_QUIZ_DESIGNS,
  DEFAULT_QUIZ_DESIGN,
  createCustomQuizDesign,
  hexToRgba,
  isHexColorDark,
  normalizeQuizDesign,
} from './quizDesignPresets';

test('BUILT_IN_QUIZ_DESIGNS provides 9 distinct themes (3 viral models + 6 classic) with valid colors and styles', () => {
  assert.equal(BUILT_IN_QUIZ_DESIGNS.length, 9);
  const ids = new Set(BUILT_IN_QUIZ_DESIGNS.map((d) => d.id));
  assert.equal(ids.size, 9);
  const templateStyles = new Set(BUILT_IN_QUIZ_DESIGNS.map((d) => d.templateStyle));
  assert.ok(templateStyles.has('flash_list'));
  assert.ok(templateStyles.has('carte_blanche'));
  assert.ok(templateStyles.has('emeraude_cadre'));
  assert.ok(templateStyles.has('classic'));
  for (const d of BUILT_IN_QUIZ_DESIGNS) {
    assert.ok(d.name.length > 0);
    assert.match(d.accentColor, /^#[0-9a-fA-F]{6}$/);
    assert.match(d.cardBgColor, /^#[0-9a-fA-F]{6}$/);
  }
});

test('createCustomQuizDesign produces a normalized custom design with unique id, templateStyle, and overrides', () => {
  const custom = createCustomQuizDesign(
    BUILT_IN_QUIZ_DESIGNS[0],
    '  Mon Super Design  ',
    {
      templateStyle: 'carte_blanche',
      optionShape: 'pill',
      questionBoxStyle: 'double_gold',
      accentColor: '#FF5733',
      cardOpacity: 0.9,
    }
  );

  assert.equal(custom.isCustom, true);
  assert.equal(custom.name, 'Mon Super Design');
  assert.equal(custom.templateStyle, 'carte_blanche');
  assert.equal(custom.optionShape, 'pill');
  assert.equal(custom.questionBoxStyle, 'double_gold');
  assert.equal(custom.accentColor, '#FF5733');
  assert.equal(custom.cardOpacity, 0.9);
  assert.ok(custom.id.startsWith('custom_design_'));
});

test('normalizeQuizDesign falls back cleanly on invalid colors or enum values', () => {
  const clean = normalizeQuizDesign({
    name: '',
    templateStyle: 'invalid_tpl' as any,
    accentColor: 'not-a-color',
    optionShape: 'invalid' as any,
    cardOpacity: 5,
  });
  assert.equal(clean.name, 'Mon design');
  assert.equal(clean.templateStyle, DEFAULT_QUIZ_DESIGN.templateStyle);
  assert.equal(clean.accentColor, DEFAULT_QUIZ_DESIGN.accentColor);
  assert.equal(clean.optionShape, DEFAULT_QUIZ_DESIGN.optionShape);
  assert.equal(clean.cardOpacity, 0.96);
});

test('hexToRgba and isHexColorDark compute accurate RGBA strings and luminance flags', () => {
  assert.equal(hexToRgba('#10B981', 0.5), 'rgba(16, 185, 129, 0.50)');
  assert.equal(isHexColorDark('#0F172A'), true);
  assert.equal(isHexColorDark('#FFFDF7'), false);
});
