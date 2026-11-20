import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SUPER_ADMIN_EMAIL,
  VIDEO_PLANS,
  clampQualityForPlan,
  enforceVerseRangeForPlan,
  evaluateVideoCreationAccess,
  formatDurationFrench,
  formatFcfa,
  getEffectivePlanId,
  getPlanRules,
  getRemainingVideos,
  isQualityAllowedForPlan,
  isSuperAdminEmail,
} from './subscriptionPlans.ts';

describe('subscriptionPlans & quota rules', () => {
  it('identifies super admin email case-insensitively and grants unlimited admin rules', () => {
    assert.equal(isSuperAdminEmail('mgaye60000@gmail.com'), true);
    assert.equal(isSuperAdminEmail('  MGAYE60000@GMAIL.COM '), true);
    assert.equal(isSuperAdminEmail('user@example.com'), false);

    assert.equal(getEffectivePlanId(SUPER_ADMIN_EMAIL, 'test'), 'admin');
    const adminRules = getPlanRules('test', SUPER_ADMIN_EMAIL);
    assert.equal(adminRules.id, 'admin');
    assert.equal(adminRules.hasWatermark, false);
    assert.equal(adminRules.allowCustomLogo, true);
    assert.equal(adminRules.maxQuality, '4k');
    assert.equal(adminRules.monthlyLimit, Number.POSITIVE_INFINITY);
  });

  it('matches exact PDF tier matrix for Test, Basique, Pro, and MAX', () => {
    assert.equal(VIDEO_PLANS.test.priceFcfa, 0);
    assert.equal(VIDEO_PLANS.test.monthlyLimit, 3);
    assert.equal(VIDEO_PLANS.test.hasWatermark, true);
    assert.equal(VIDEO_PLANS.test.maxVerses, 3);
    assert.equal(VIDEO_PLANS.test.allowCustomLogo, false);
    assert.equal(VIDEO_PLANS.test.maxQuality, '720p');

    assert.equal(VIDEO_PLANS.basique.priceFcfa, 3000);
    assert.equal(VIDEO_PLANS.basique.monthlyLimit, 30);
    assert.equal(VIDEO_PLANS.basique.hasWatermark, true);
    assert.equal(VIDEO_PLANS.basique.maxVerses, Number.POSITIVE_INFINITY);
    assert.equal(VIDEO_PLANS.basique.allowCustomLogo, true);
    assert.equal(VIDEO_PLANS.basique.maxQuality, '720p');

    assert.equal(VIDEO_PLANS.pro.priceFcfa, 5000);
    assert.equal(VIDEO_PLANS.pro.monthlyLimit, 60);
    assert.equal(VIDEO_PLANS.pro.hasWatermark, false);
    assert.equal(VIDEO_PLANS.pro.maxVerses, Number.POSITIVE_INFINITY);
    assert.equal(VIDEO_PLANS.pro.allowCustomLogo, true);
    assert.equal(VIDEO_PLANS.pro.maxQuality, '1080p');

    assert.equal(VIDEO_PLANS.max.priceFcfa, 10000);
    assert.equal(VIDEO_PLANS.max.monthlyLimit, Number.POSITIVE_INFINITY);
    assert.equal(VIDEO_PLANS.max.hasWatermark, false);
    assert.equal(VIDEO_PLANS.max.maxVerses, Number.POSITIVE_INFINITY);
    assert.equal(VIDEO_PLANS.max.allowCustomLogo, true);
    assert.equal(VIDEO_PLANS.max.maxQuality, '4k');
  });

  it('requires authentication before video creation', () => {
    const res = evaluateVideoCreationAccess({
      email: null,
      planId: 'test',
      videosUsedThisMonth: 0,
      verseCount: 2,
      qualityId: '720p',
    });
    assert.equal(res.allowed, false);
    assert.equal(res.reasonCode, 'AUTH_REQUIRED');
  });

  it('enforces Test tier countdown, 3-verse cap, no custom logo, and 720p cap', () => {
    assert.equal(getRemainingVideos('test', 0, 'a@b.com'), 3);
    assert.equal(getRemainingVideos('test', 2, 'a@b.com'), 1);
    assert.equal(getRemainingVideos('test', 3, 'a@b.com'), 0);

    const quotaExhausted = evaluateVideoCreationAccess({
      email: 'a@b.com',
      planId: 'test',
      videosUsedThisMonth: 3,
      verseCount: 2,
      qualityId: '720p',
    });
    assert.equal(quotaExhausted.allowed, false);
    assert.equal(quotaExhausted.reasonCode, 'QUOTA_EXHAUSTED');

    const tooManyVerses = evaluateVideoCreationAccess({
      email: 'a@b.com',
      planId: 'test',
      videosUsedThisMonth: 1,
      verseCount: 4,
      qualityId: '720p',
    });
    assert.equal(tooManyVerses.allowed, false);
    assert.equal(tooManyVerses.reasonCode, 'VERSE_LIMIT_EXCEEDED');

    const customLogoBlocked = evaluateVideoCreationAccess({
      email: 'a@b.com',
      planId: 'test',
      videosUsedThisMonth: 1,
      verseCount: 3,
      qualityId: '720p',
      hasCustomLogo: true,
    });
    assert.equal(customLogoBlocked.allowed, false);
    assert.equal(customLogoBlocked.reasonCode, 'LOGO_LOCKED');

    const quality1080Blocked = evaluateVideoCreationAccess({
      email: 'a@b.com',
      planId: 'test',
      videosUsedThisMonth: 1,
      verseCount: 3,
      qualityId: '1080p',
    });
    assert.equal(quality1080Blocked.allowed, false);
    assert.equal(quality1080Blocked.reasonCode, 'QUALITY_LOCKED');
  });

  it('enforces quality clamping and verse range capping accurately', () => {
    assert.equal(isQualityAllowedForPlan('720p', 'basique'), true);
    assert.equal(isQualityAllowedForPlan('1080p', 'basique'), false);
    assert.equal(clampQualityForPlan('4k', 'basique'), '720p');
    assert.equal(clampQualityForPlan('4k', 'pro'), '1080p');
    assert.equal(clampQualityForPlan('4k', 'max'), '4k');
    assert.equal(clampQualityForPlan('4k', 'test', SUPER_ADMIN_EMAIL), '4k');

    const capped = enforceVerseRangeForPlan(1, 7, 7, 'test', 'user@example.com', 0);
    assert.deepEqual(capped, { startAyah: 1, endAyah: 3, wasCapped: true });

    const unlimited = enforceVerseRangeForPlan(1, 7, 7, 'basique', 'user@example.com', 0);
    assert.deepEqual(unlimited, { startAyah: 1, endAyah: 7, wasCapped: false });
  });

  it('formats FCFA amounts and French durations cleanly', () => {
    assert.equal(formatFcfa(3000), '3 000 FCFA');
    assert.equal(formatFcfa(10000), '10 000 FCFA');
    assert.equal(formatDurationFrench(45), '45s');
    assert.equal(formatDurationFrench(125), '2m 05s');
    assert.equal(formatDurationFrench(3720), '1h 02m');
  });
});
