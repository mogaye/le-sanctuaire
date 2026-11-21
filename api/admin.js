import {
  fetchSupabaseAuthUsers,
  getSupabaseCreds,
  parseRequestBody,
  supabasePatch,
  supabaseSelect,
  supabaseUpsert,
  upsertUserAndProfileInSupabase,
} from './_supabase.js';
import {
  VIDEO_PLANS,
  buildStatusDTO,
  formatShortDayLabel,
  getEffectivePlanId,
  getPlanRules,
  getRemainingVideos,
  getTodayDateKey,
  incrementDailyAnalytics,
  isSuperAdminEmail,
  loadSubStateMapFromEmailLogs,
  normalizePlanId,
  persistSubStateToProfileAndFallback,
  resolveUserState,
} from './_analytics.js';

const activeSessionsMem = new Map();
const VISITOR_TTL_MS = 45_000;

function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function pruneActiveSessions(now = Date.now()) {
  for (const [sid, sess] of activeSessionsMem.entries()) {
    if (now - sess.lastSeenMs > VISITOR_TTL_MS) {
      activeSessionsMem.delete(sid);
    }
  }
  return activeSessionsMem.size;
}

async function fetchMergedUsers() {
  const [profiles, users, authUsers, subStateMap, videos, videoLogs, donations] = await Promise.all([
    supabaseSelect('profiles', 'select=*&order=last_connected_at.desc&limit=500'),
    supabaseSelect('users', 'select=*&order=updated_at.desc&limit=500'),
    fetchSupabaseAuthUsers(),
    loadSubStateMapFromEmailLogs(),
    supabaseSelect('video_creations', 'select=*&order=created_at.desc&limit=500'),
    supabaseSelect('email_logs', 'email_type=eq.video_creation&order=created_at.desc&limit=500'),
    supabaseSelect('donations', 'status=neq.failed&select=donor_email,amount&limit=500'),
  ]);

  const userMap = new Map();

  // Seed Super Admin so dashboard always has admin row
  const adminEmail = 'mgaye60000@gmail.com';
  userMap.set(adminEmail, {
    id: 'adf9b87e-cf15-4fcc-a76b-2673c0ee74e4',
    email: adminEmail,
    fullName: 'Mamadou Gaye',
    firstName: 'Mamadou',
    lastName: 'Gaye',
    cityName: 'Dakar',
    role: 'admin',
    plan: 'admin',
    videosUsedThisMonth: 0,
    totalVideosCreated: 0,
    totalAmountPaidFcfa: 0,
    timeSpentSeconds: 0,
    planPeriodStart: new Date().toISOString(),
    planUpdatedAt: new Date().toISOString(),
    lastConnectedAt: new Date().toISOString(),
    createdAt: '2026-09-17T23:01:43.333Z',
  });

  // Merge Supabase Auth (auth.users) when SUPABASE_SERVICE_ROLE_KEY is configured
  for (const au of authUsers) {
    const cleanEmail = String(au?.email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) continue;
    const prev = userMap.get(cleanEmail) || {};
    const meta = au.user_metadata || au.raw_user_meta_data || {};
    const fullName = meta.full_name || meta.name || prev.fullName || cleanEmail.split('@')[0];
    userMap.set(cleanEmail, {
      id: au.id || prev.id || `acct_${cleanEmail}`,
      email: cleanEmail,
      fullName,
      firstName: meta.first_name || prev.firstName || fullName.split(' ')[0] || 'Fidèle',
      lastName: meta.last_name || prev.lastName || fullName.split(' ').slice(1).join(' ') || '',
      cityName: prev.cityName || 'Dakar',
      role: isSuperAdminEmail(cleanEmail) ? 'admin' : 'user',
      plan: getEffectivePlanId(cleanEmail, prev.plan || 'test'),
      videosUsedThisMonth: prev.videosUsedThisMonth || 0,
      totalVideosCreated: prev.totalVideosCreated || 0,
      totalAmountPaidFcfa: prev.totalAmountPaidFcfa || 0,
      timeSpentSeconds: prev.timeSpentSeconds || 0,
      planPeriodStart: prev.planPeriodStart || au.created_at || new Date().toISOString(),
      planUpdatedAt: prev.planUpdatedAt || au.last_sign_in_at || au.created_at || new Date().toISOString(),
      lastConnectedAt: au.last_sign_in_at || au.updated_at || prev.lastConnectedAt || au.created_at || new Date().toISOString(),
      createdAt: au.created_at || prev.createdAt || new Date().toISOString(),
    });
  }

  for (const u of users) {
    const cleanEmail = String(u.email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) continue;
    const prev = userMap.get(cleanEmail) || {};
    userMap.set(cleanEmail, {
      id: u.uid || prev.id || `acct_${cleanEmail}`,
      email: cleanEmail,
      fullName: u.full_name || prev.fullName || cleanEmail.split('@')[0],
      firstName: u.first_name || prev.firstName || 'Fidèle',
      lastName: u.last_name || prev.lastName || '',
      cityName: u.city_name || prev.cityName || 'Dakar',
      role: isSuperAdminEmail(cleanEmail) ? 'admin' : 'user',
      plan: getEffectivePlanId(cleanEmail, prev.plan || 'test'),
      videosUsedThisMonth: prev.videosUsedThisMonth || 0,
      totalVideosCreated: prev.totalVideosCreated || 0,
      totalAmountPaidFcfa: prev.totalAmountPaidFcfa || 0,
      timeSpentSeconds: prev.timeSpentSeconds || 0,
      planPeriodStart: prev.planPeriodStart || u.created_at || new Date().toISOString(),
      planUpdatedAt: prev.planUpdatedAt || u.updated_at || new Date().toISOString(),
      lastConnectedAt: u.updated_at || prev.lastConnectedAt || new Date().toISOString(),
      createdAt: u.created_at || prev.createdAt || new Date().toISOString(),
    });
  }

  for (const p of profiles) {
    const cleanEmail = String(p.email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) continue;
    const prev = userMap.get(cleanEmail) || {};
    const subMeta = subStateMap.get(cleanEmail) || {};

    const profPlan = p.plan ? normalizePlanId(p.plan) : null;
    const metaPlan = subMeta.plan ? normalizePlanId(subMeta.plan) : null;
    let resolvedPlan = 'test';
    if (isSuperAdminEmail(cleanEmail)) {
      resolvedPlan = 'admin';
    } else if (p.plan_updated_at && subMeta.planUpdatedAt) {
      resolvedPlan =
        new Date(subMeta.planUpdatedAt).getTime() > new Date(p.plan_updated_at).getTime()
          ? metaPlan || 'test'
          : profPlan || 'test';
    } else {
      resolvedPlan = (profPlan && profPlan !== 'test' ? profPlan : null) || metaPlan || profPlan || 'test';
    }

    userMap.set(cleanEmail, {
      id: p.id || prev.id || `acct_${cleanEmail}`,
      email: cleanEmail,
      fullName: p.full_name || prev.fullName || cleanEmail.split('@')[0],
      firstName: p.first_name || prev.firstName || 'Fidèle',
      lastName: p.last_name || prev.lastName || '',
      cityName: p.city_name || prev.cityName || 'Dakar',
      role: isSuperAdminEmail(cleanEmail) ? 'admin' : 'user',
      plan: resolvedPlan,
      videosUsedThisMonth: Math.max(
        Number(p.videos_used_this_month) || 0,
        Number(subMeta.videosUsedThisMonth) || 0,
        prev.videosUsedThisMonth || 0
      ),
      totalVideosCreated: Math.max(
        Number(p.total_videos_created) || 0,
        Number(subMeta.totalVideosCreated) || 0,
        prev.totalVideosCreated || 0
      ),
      totalAmountPaidFcfa: Math.max(
        Number(p.total_amount_paid_fcfa) || 0,
        Number(subMeta.totalAmountPaidFcfa) || 0,
        prev.totalAmountPaidFcfa || 0
      ),
      timeSpentSeconds: Math.max(
        Number(p.time_spent_seconds) || 0,
        Number(subMeta.timeSpentSeconds) || 0,
        prev.timeSpentSeconds || 0
      ),
      planPeriodStart:
        p.plan_period_start || subMeta.planPeriodStart || prev.planPeriodStart || new Date().toISOString(),
      planUpdatedAt:
        p.plan_updated_at || subMeta.planUpdatedAt || prev.planUpdatedAt || new Date().toISOString(),
      lastConnectedAt:
        p.last_connected_at || subMeta.lastConnectedAt || p.updated_at || prev.lastConnectedAt || new Date().toISOString(),
      createdAt: p.created_at || prev.createdAt || new Date().toISOString(),
    });
  }

  // Merge donation sums
  const paidByEmail = new Map();
  for (const d of donations) {
    const em = String(d.donor_email || '').trim().toLowerCase();
    if (!em) continue;
    paidByEmail.set(em, (paidByEmail.get(em) || 0) + (Number(d.amount) || 0));
  }
  for (const [em, amt] of paidByEmail.entries()) {
    const u = userMap.get(em);
    if (u && amt > (u.totalAmountPaidFcfa || 0)) {
      u.totalAmountPaidFcfa = amt;
    }
  }

  // Merge video records from both video_creations & email_logs fallback
  const videoMap = new Map();
  for (const v of videos) {
    const id = String(v.id || `vc_${v.created_at}_${v.user_email}`);
    videoMap.set(id, {
      id,
      userEmail: String(v.user_email || '').trim().toLowerCase(),
      userName: String(v.user_name || ''),
      planAtCreation: normalizePlanId(v.plan_at_creation),
      surahSummary: String(v.surah_summary || 'Saint Coran'),
      verseCount: Number(v.verse_count) || 1,
      quality: String(v.quality || '720p'),
      aspectRatio: String(v.aspect_ratio || '9:16'),
      hadWatermark: Boolean(v.had_watermark ?? true),
      durationSec: Number(v.duration_sec) || 0,
      createdAt: String(v.created_at || new Date().toISOString()),
    });
  }
  for (const r of videoLogs) {
    const parsed = safeJsonParse(r.subject, null);
    if (!parsed || typeof parsed !== 'object') continue;
    const id = String(parsed.id || `el_${r.id}`);
    if (!videoMap.has(id)) {
      videoMap.set(id, {
        id,
        userEmail: String(parsed.userEmail || r.sender_email || '').trim().toLowerCase(),
        userName: String(parsed.userName || ''),
        planAtCreation: normalizePlanId(parsed.planAtCreation),
        surahSummary: String(parsed.surahSummary || 'Saint Coran'),
        verseCount: Number(parsed.verseCount) || 1,
        quality: String(parsed.quality || '720p'),
        aspectRatio: String(parsed.aspectRatio || '9:16'),
        hadWatermark: Boolean(parsed.hadWatermark ?? true),
        durationSec: Number(parsed.durationSec) || 0,
        createdAt: String(parsed.createdAt || r.created_at || new Date().toISOString()),
      });
    }
  }

  const allVideos = Array.from(videoMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Sync counts from video records
  const videoCountByEmail = new Map();
  for (const v of allVideos) {
    if (v.userEmail) {
      videoCountByEmail.set(v.userEmail, (videoCountByEmail.get(v.userEmail) || 0) + 1);
    }
  }
  for (const [em, count] of videoCountByEmail.entries()) {
    const u = userMap.get(em);
    if (u && count > (u.totalVideosCreated || 0)) {
      u.totalVideosCreated = count;
    }
  }

  const serializedUsers = Array.from(userMap.values())
    .map((u) => {
      const effectivePlan = getEffectivePlanId(u.email, u.plan);
      const rules = getPlanRules(effectivePlan, u.email);
      const rem = getRemainingVideos(effectivePlan, u.videosUsedThisMonth, u.email);
      return {
        ...u,
        role: isSuperAdminEmail(u.email) ? 'admin' : 'user',
        plan: effectivePlan,
        remainingVideos: Number.isFinite(rem) ? rem : null,
        monthlyLimit: Number.isFinite(rules.monthlyLimit) ? rules.monthlyLimit : null,
      };
    })
    .sort((a, b) => new Date(b.lastConnectedAt).getTime() - new Date(a.lastConnectedAt).getTime());

  return { users: serializedUsers, allVideos };
}

async function fetchMergedReports() {
  const [tableRows, logRows] = await Promise.all([
    supabaseSelect('user_reports', 'select=*&order=created_at.desc&limit=200'),
    supabaseSelect('email_logs', 'email_type=eq.user_report&order=created_at.desc&limit=200'),
  ]);

  const list = [];
  for (const r of tableRows) {
    list.push({
      id: `ur_${r.id}`,
      reporterEmail: r.reporter_email || 'visiteur@sanctuaire.app',
      reporterName: r.reporter_name || 'Visiteur',
      category: r.category || 'bug',
      subject: r.subject || 'Signalement',
      description: r.description || '',
      pageContext: r.page_context || 'accueil',
      status: r.status || 'open',
      adminNote: r.admin_note || undefined,
      createdAt: r.created_at || new Date().toISOString(),
      updatedAt: r.updated_at || r.created_at || new Date().toISOString(),
    });
  }

  for (const l of logRows) {
    const meta = safeJsonParse(l.subject, {}) || {};
    list.push({
      id: `el_${l.id}`,
      reporterEmail: l.sender_email || 'visiteur@sanctuaire.app',
      reporterName: meta.reporterName || 'Visiteur',
      category: meta.category || 'bug',
      subject: meta.subject || 'Signalement',
      description: l.body_preview || meta.description || '',
      pageContext: meta.pageContext || 'accueil',
      status: l.status === 'resolved' || l.status === 'in_progress' || l.status === 'open' ? l.status : 'open',
      adminNote: meta.adminNote || undefined,
      createdAt: l.created_at || new Date().toISOString(),
      updatedAt: l.created_at || new Date().toISOString(),
    });
  }

  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-email');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = String(req.query?.action || '').trim().toLowerCase();
  const urlStr = String(req.url || '').toLowerCase();

  try {
    // 1. POST /api/analytics/heartbeat
    if (action === 'heartbeat' || urlStr.includes('/heartbeat')) {
      if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
      }
      const body = await parseRequestBody(req);
      const now = Date.now();
      const sid = String(body.sessionId || '').trim().slice(0, 80) || `anon_${now}`;
      const cleanEmail = body.email ? String(body.email).trim().toLowerCase() : '';
      const deltaSec = Math.min(30, Math.max(0, Math.floor(Number(body.deltaSec) || 0)));

      activeSessionsMem.set(sid, {
        sessionId: sid,
        email: cleanEmail,
        view: String(body.view || 'accueil').slice(0, 40),
        lastSeenMs: now,
      });

      if (body.isNewVisit) {
        await incrementDailyAnalytics('visits', 1);
      }

      if (cleanEmail && cleanEmail.includes('@') && deltaSec > 0) {
        const state = await resolveUserState(cleanEmail);
        state.timeSpentSeconds = (state.timeSpentSeconds || 0) + deltaSec;
        state.lastConnectedAt = new Date().toISOString();
        await persistSubStateToProfileAndFallback(cleanEmail, state);
      }

      return res.status(200).json({
        ok: true,
        activeVisitors: Math.max(1, pruneActiveSessions(now)),
      });
    }

    // 2. GET /api/reports & POST /api/reports
    if (action === 'reports' || (urlStr.includes('/reports') && req.method !== 'PATCH')) {
      if (req.method === 'GET') {
        const reports = await fetchMergedReports();
        return res.status(200).json({ ok: true, reports });
      }
      if (req.method === 'POST') {
        const body = await parseRequestBody(req);
        const subject = String(body.subject || '').trim();
        const description = String(body.description || '').trim();
        if (!subject || !description) {
          return res.status(400).json({
            ok: false,
            error: 'Veuillez renseigner un objet et une description.',
          });
        }

        const reporterEmail = String(body.reporterEmail || 'visiteur@sanctuaire.app')
          .trim()
          .toLowerCase();
        const reporterName = String(body.reporterName || 'Visiteur').trim();
        const category = String(body.category || 'bug');
        const pageContext = String(body.pageContext || 'accueil').trim().slice(0, 60);

        const ins = await supabaseUpsert('user_reports', {
          reporter_email: reporterEmail,
          reporter_name: reporterName,
          category,
          subject: subject.slice(0, 140),
          description: description.slice(0, 2000),
          page_context: pageContext,
          status: 'open',
        });

        if (ins.ok) {
          const row = Array.isArray(ins.data) ? ins.data[0] : ins.data;
          return res.status(200).json({
            ok: true,
            report: {
              id: row?.id ? `ur_${row.id}` : `ur_${Date.now()}`,
              reporterEmail,
              reporterName,
              category,
              subject: subject.slice(0, 140),
              description: description.slice(0, 2000),
              pageContext,
              status: 'open',
              createdAt: row?.created_at || new Date().toISOString(),
            },
          });
        }

        const logIns = await supabaseUpsert('email_logs', {
          sender_email: reporterEmail,
          recipient_email: 'user_reports',
          subject: JSON.stringify({
            reporterName,
            category,
            subject: subject.slice(0, 140),
            pageContext,
          }),
          body_preview: description.slice(0, 2000),
          email_type: 'user_report',
          status: 'open',
        });

        const logRow = Array.isArray(logIns.data) ? logIns.data[0] : logIns.data;
        return res.status(200).json({
          ok: true,
          report: {
            id: logRow?.id ? `el_${logRow.id}` : `rep_${Date.now()}`,
            reporterEmail,
            reporterName,
            category,
            subject: subject.slice(0, 140),
            description: description.slice(0, 2000),
            pageContext,
            status: 'open',
            createdAt: new Date().toISOString(),
          },
        });
      }
    }

    // 3. PATCH /api/reports/:id
    if (action === 'update-report' || req.method === 'PATCH') {
      const body = await parseRequestBody(req);
      const adminEmail = String(body.adminEmail || req.headers['x-admin-email'] || '');
      if (!isSuperAdminEmail(adminEmail)) {
        return res.status(403).json({ ok: false, error: 'Accès réservé au Super Admin.' });
      }

      const rawId = String(req.query?.id || '').trim();
      const status = String(body.status || 'resolved');
      const adminNote = body.adminNote;

      if (rawId.startsWith('el_')) {
        const numId = rawId.replace(/^el_/, '');
        await supabasePatch('email_logs', `id=eq.${encodeURIComponent(numId)}`, {
          status,
        });
      } else {
        const numId = rawId.replace(/^ur_/, '');
        await supabasePatch('user_reports', `id=eq.${encodeURIComponent(numId)}`, {
          status,
          ...(adminNote !== undefined ? { admin_note: adminNote } : {}),
          updated_at: new Date().toISOString(),
        });
      }

      return res.status(200).json({
        ok: true,
        report: { id: rawId, status, adminNote, updatedAt: new Date().toISOString() },
      });
    }

    // 4. GET /api/admin/overview
    if (action === 'overview' || urlStr.includes('/overview')) {
      const adminEmail = String(req.query?.adminEmail || req.headers['x-admin-email'] || '');
      if (!isSuperAdminEmail(adminEmail)) {
        return res.status(403).json({ ok: false, error: 'Accès réservé au compte Super Admin.' });
      }

      const [{ users, allVideos }, reports, dailyTableRows, dailyLogRows] = await Promise.all([
        fetchMergedUsers(),
        fetchMergedReports(),
        supabaseSelect('site_analytics_daily', 'select=*&order=date.desc&limit=30'),
        supabaseSelect('email_logs', 'email_type=eq.daily_stat&order=created_at.desc&limit=30'),
      ]);

      const dailyMap = new Map();
      for (const r of dailyTableRows) {
        if (r?.date) {
          dailyMap.set(r.date, {
            visits: Number(r.visits) || 0,
            signups: Number(r.signups) || 0,
            paidUpgrades: Number(r.paid_upgrades) || 0,
            videosCreated: Number(r.videos_created) || 0,
          });
        }
      }
      for (const l of dailyLogRows) {
        const dKey = String(l.sender_email || '');
        const parsed = safeJsonParse(l.subject, null);
        if (dKey && parsed && typeof parsed === 'object') {
          const prev = dailyMap.get(dKey) || { visits: 0, signups: 0, paidUpgrades: 0, videosCreated: 0 };
          dailyMap.set(dKey, {
            visits: Math.max(prev.visits, Number(parsed.visits) || 0),
            signups: Math.max(prev.signups, Number(parsed.signups) || 0),
            paidUpgrades: Math.max(prev.paidUpgrades, Number(parsed.paidUpgrades) || 0),
            videosCreated: Math.max(prev.videosCreated, Number(parsed.videosCreated) || 0),
          });
        }
      }

      const dailySeries = [];
      const today = new Date();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = getTodayDateKey(d);
        const bucket = dailyMap.get(key) || { visits: 0, signups: 0, paidUpgrades: 0, videosCreated: 0 };
        const signupsOnDate = users.filter((u) => String(u.createdAt || '').slice(0, 10) === key).length;
        const videosOnDate = allVideos.filter((v) => String(v.createdAt || '').slice(0, 10) === key).length;
        dailySeries.push({
          date: key,
          label: formatShortDayLabel(key),
          visits: bucket.visits,
          signups: Math.max(bucket.signups, signupsOnDate),
          paidUpgrades: bucket.paidUpgrades,
          videosCreated: Math.max(bucket.videosCreated, videosOnDate),
        });
      }

      const paidAccounts = users.filter((u) => u.plan === 'basique' || u.plan === 'pro' || u.plan === 'max');
      const totalVideosCreated = Math.max(
        allVideos.length,
        users.reduce((acc, u) => acc + (u.totalVideosCreated || 0), 0)
      );
      const totalRevenueFcfa = users.reduce((acc, u) => acc + (u.totalAmountPaidFcfa || 0), 0);
      const totalTimeSpentSeconds = users.reduce((acc, u) => acc + (u.timeSpentSeconds || 0), 0);
      const avgTimeSpentSeconds = users.length > 0 ? Math.round(totalTimeSpentSeconds / users.length) : 0;

      const topCreators = [...users]
        .sort((a, b) => (b.totalVideosCreated || 0) - (a.totalVideosCreated || 0))
        .slice(0, 3);

      const topPayers = [...users]
        .sort((a, b) => {
          const diff = (b.totalAmountPaidFcfa || 0) - (a.totalAmountPaidFcfa || 0);
          if (diff !== 0) return diff;
          return (VIDEO_PLANS[b.plan]?.priceFcfa || 0) - (VIDEO_PLANS[a.plan]?.priceFcfa || 0);
        })
        .slice(0, 3);

      const planDistribution = {
        test: users.filter((u) => u.plan === 'test').length,
        basique: users.filter((u) => u.plan === 'basique').length,
        pro: users.filter((u) => u.plan === 'pro').length,
        max: users.filter((u) => u.plan === 'max').length,
        admin: users.filter((u) => u.plan === 'admin').length,
      };

      const qualityBreakdown = {
        '480p': allVideos.filter((v) => v.quality === '480p').length,
        '720p': allVideos.filter((v) => v.quality === '720p').length,
        '1080p': allVideos.filter((v) => v.quality === '1080p').length,
        '4k': allVideos.filter((v) => v.quality === '4k').length,
      };

      const openReportsCount = reports.filter((r) => r.status !== 'resolved').length;
      const activeCount = Math.max(1, pruneActiveSessions());

      return res.status(200).json({
        ok: true,
        supabaseConnected: Boolean(getSupabaseCreds()),
        kpis: {
          realTimeVisitors: activeCount,
          registeredAccounts: users.length,
          paidAccounts: paidAccounts.length,
          totalVideosCreated,
          openReports: openReportsCount,
          totalReports: reports.length,
          totalRevenueFcfa,
          avgTimeSpentSeconds,
          totalTimeSpentSeconds,
        },
        charts: { dailySeries },
        leaderboards: { topCreators, topPayers },
        statistics: {
          planDistribution,
          qualityBreakdown,
          recentVideos: allVideos.slice(0, 20),
          activeSessionsCount: activeCount,
        },
        reports,
        usersCount: users.length,
      });
    }

    // 5. GET /api/admin/users
    if (action === 'users' || urlStr.includes('/admin/users')) {
      if (req.method === 'GET') {
        const adminEmail = String(req.query?.adminEmail || req.headers['x-admin-email'] || '');
        if (!isSuperAdminEmail(adminEmail)) {
          return res.status(403).json({ ok: false, error: 'Accès réservé au compte Super Admin.' });
        }
        const { users } = await fetchMergedUsers();
        return res.status(200).json({ ok: true, users });
      }
    }

    // 6. POST /api/admin/users/:email/plan
    if (action === 'set-plan' || urlStr.includes('/plan')) {
      if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
      }
      const body = await parseRequestBody(req);
      const adminEmail = String(body.adminEmail || req.headers['x-admin-email'] || '');
      if (!isSuperAdminEmail(adminEmail)) {
        return res.status(403).json({ ok: false, error: 'Accès réservé au compte Super Admin.' });
      }

      const rawTarget =
        req.query?.targetEmail ||
        body.targetEmail ||
        '';
      const targetEmail = decodeURIComponent(String(rawTarget)).trim().toLowerCase();
      if (!targetEmail || !targetEmail.includes('@')) {
        return res.status(400).json({ ok: false, error: 'E-mail utilisateur cible invalide.' });
      }

      const normalized = normalizePlanId(body.plan);
      const state = await resolveUserState(targetEmail);
      const previousPlan = state.plan;
      const nowIso = new Date().toISOString();

      state.plan = isSuperAdminEmail(targetEmail) ? 'admin' : normalized;
      state.role = isSuperAdminEmail(targetEmail) ? 'admin' : 'user';
      state.planUpdatedAt = nowIso;
      if (previousPlan !== state.plan) {
        state.videosUsedThisMonth = 0;
        state.planPeriodStart = nowIso;
      }

      const addPaymentFcfa = body.recordPayment ? VIDEO_PLANS[normalized]?.priceFcfa || 0 : 0;
      if (addPaymentFcfa > 0) {
        state.totalAmountPaidFcfa = (state.totalAmountPaidFcfa || 0) + addPaymentFcfa;
      }

      await upsertUserAndProfileInSupabase({
        id: state.id,
        email: targetEmail,
        fullName: state.fullName,
        cityName: state.cityName,
      });

      await persistSubStateToProfileAndFallback(targetEmail, state);

      if (
        (normalized === 'basique' || normalized === 'pro' || normalized === 'max') &&
        previousPlan !== normalized
      ) {
        await incrementDailyAnalytics('paidUpgrades', 1);
      }

      const dto = buildStatusDTO(state);
      return res.status(200).json({
        ok: true,
        user: {
          ...state,
          remainingVideos: dto.remainingVideos,
          monthlyLimit: dto.monthlyLimit,
        },
      });
    }

    // 7. POST /api/admin?action=resync
    if (action === 'resync' || urlStr.includes('/resync')) {
      if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
      }
      const body = await parseRequestBody(req);
      const adminEmail = String(body.adminEmail || req.headers['x-admin-email'] || '');
      if (!isSuperAdminEmail(adminEmail)) {
        return res.status(403).json({ ok: false, error: 'Accès réservé au Super Admin.' });
      }

      const creds = getSupabaseCreds();
      const extraAccounts = Array.isArray(body.accounts) ? body.accounts : [];
      const authUsers = await fetchSupabaseAuthUsers();
      const mergedMap = new Map();

      for (const au of authUsers) {
        const em = String(au?.email || '').trim().toLowerCase();
        if (!em || !em.includes('@')) continue;
        const meta = au.user_metadata || au.raw_user_meta_data || {};
        mergedMap.set(em, {
          id: au.id,
          email: em,
          fullName: meta.full_name || meta.name || em.split('@')[0],
          firstName: meta.first_name,
          lastName: meta.last_name,
          cityName: 'Dakar',
        });
      }

      for (const acc of extraAccounts) {
        const em = String(acc?.email || '').trim().toLowerCase();
        if (!em || !em.includes('@')) continue;
        const prev = mergedMap.get(em) || {};
        mergedMap.set(em, {
          id: acc.id || prev.id,
          email: em,
          fullName: acc.fullName || acc.full_name || prev.fullName || em.split('@')[0],
          firstName: acc.firstName || acc.first_name || prev.firstName,
          lastName: acc.lastName || acc.last_name || prev.lastName,
          cityName: acc.cityName || acc.city_name || prev.cityName || 'Dakar',
          plan: acc.plan || prev.plan,
          role: acc.role || prev.role,
        });
      }

      let syncedToSupabase = 0;
      for (const item of mergedMap.values()) {
        const resUpsert = await upsertUserAndProfileInSupabase(item);
        if (resUpsert?.supabaseUsersSaved || resUpsert?.supabaseProfilesSaved) {
          syncedToSupabase += 1;
        }
      }

      return res.status(200).json({
        ok: true,
        supabaseConnected: Boolean(creds),
        totalProcessed: mergedMap.size,
        syncedToSupabase,
      });
    }

    return res.status(404).json({ ok: false, error: 'Route admin introuvable.' });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Erreur serveur administrateur.',
    });
  }
}
