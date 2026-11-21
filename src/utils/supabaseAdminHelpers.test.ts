import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SUPABASE_SETUP_SQL,
  SUPABASE_TABLE_NAMES,
  mergeAccountSources,
} from './supabaseAdminHelpers';

test('SUPABASE_SETUP_SQL declares all 10 tables, columns and API grants idempotently', () => {
  assert.equal(SUPABASE_TABLE_NAMES.length, 10);
  for (const tableName of SUPABASE_TABLE_NAMES) {
    assert.ok(
      SUPABASE_SETUP_SQL.includes(`public.${tableName}`),
      `Missing table public.${tableName} in SUPABASE_SETUP_SQL`
    );
  }
  assert.ok(SUPABASE_SETUP_SQL.includes('DROP POLICY IF EXISTS'));
  assert.ok(SUPABASE_SETUP_SQL.includes('GRANT ALL ON ALL TABLES IN SCHEMA public'));
  assert.ok(SUPABASE_SETUP_SQL.includes('videos_used_this_month'));
  assert.ok(SUPABASE_SETUP_SQL.includes('total_videos_created'));
  assert.ok(SUPABASE_SETUP_SQL.includes('total_amount_paid_fcfa'));
  assert.ok(SUPABASE_SETUP_SQL.includes('time_spent_seconds'));
  assert.ok(SUPABASE_SETUP_SQL.includes('mgaye60000@gmail.com'));
});

test('mergeAccountSources deduplicates by lowercase email and preserves admin/paid plans', () => {
  const merged = mergeAccountSources({
    localAccounts: [
      {
        id: 'acct_nouveau@test.sn',
        email: 'Nouveau@Test.SN ',
        fullName: 'Nouveau Compte',
        createdAt: '2026-11-20T10:00:00.000Z',
        lastConnectedAt: '2026-11-20T10:05:00.000Z',
      },
      {
        id: 'acct_payer@test.sn',
        email: 'payer@test.sn',
        fullName: 'Payer Local',
        plan: 'pro',
        totalAmountPaidFcfa: 5000,
        lastConnectedAt: '2026-11-20T09:00:00.000Z',
      },
    ],
    supabaseProfiles: [
      {
        id: 'uuid-1',
        email: 'mgaye60000@gmail.com',
        full_name: 'Mamadou Gaye',
        plan: 'test',
        role: 'user',
        videos_used_this_month: 2,
        last_connected_at: '2026-11-21T08:00:00.000Z',
      },
      {
        id: 'uuid-2',
        email: 'payer@test.sn',
        full_name: 'Payer Supabase',
        plan: 'test',
        videos_used_this_month: 4,
        last_connected_at: '2026-11-21T09:00:00.000Z',
      },
    ],
    serverUsers: [
      {
        id: 'acct_autre@test.sn',
        email: 'autre@test.sn',
        fullName: 'Autre Utilisateur',
        plan: 'basique',
        lastConnectedAt: '2026-11-19T12:00:00.000Z',
      },
    ],
  });

  assert.equal(merged.length, 4);

  const adminRow = merged.find((u) => u.email === 'mgaye60000@gmail.com');
  assert.ok(adminRow);
  assert.equal(adminRow.role, 'admin');
  assert.equal(adminRow.plan, 'admin');

  const nouveauRow = merged.find((u) => u.email === 'nouveau@test.sn');
  assert.ok(nouveauRow);
  assert.equal(nouveauRow.plan, 'test');
  assert.equal(nouveauRow.remainingVideos, 3);

  const payerRow = merged.find((u) => u.email === 'payer@test.sn');
  assert.ok(payerRow);
  assert.equal(payerRow.plan, 'pro');
  assert.equal(payerRow.totalAmountPaidFcfa, 5000);
  assert.equal(payerRow.videosUsedThisMonth, 4);
});
