import {
  parseRequestBody,
  supabaseUpsert,
  upsertUserAndProfileInSupabase,
} from './_supabase.js';
import {
  VIDEO_PLANS,
  buildStatusDTO,
  evaluateVideoCreationAccess,
  incrementDailyAnalytics,
  isSuperAdminEmail,
  normalizePlanId,
  persistSubStateToProfileAndFallback,
  resolveUserState,
} from './_analytics.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = String(req.query?.action || '').trim().toLowerCase();
  const urlStr = String(req.url || '').toLowerCase();

  try {
    // 1. GET /api/subscription/status
    if (
      req.method === 'GET' &&
      (!action || action === 'status' || urlStr.includes('/status'))
    ) {
      const rawEmail = typeof req.query?.email === 'string' ? req.query.email : '';
      const cleanEmail = rawEmail.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return res.status(200).json({
          ok: true,
          status: buildStatusDTO({ email: null }),
        });
      }

      const state = await resolveUserState(cleanEmail);
      return res.status(200).json({
        ok: true,
        status: buildStatusDTO(state),
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    const body = await parseRequestBody(req);

    // 2. POST /api/subscription/record-video
    if (action === 'record-video' || urlStr.includes('/record-video')) {
      const cleanEmail = String(body.email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return res.status(401).json({
          ok: false,
          reasonCode: 'AUTH_REQUIRED',
          error: 'Créez ou connectez votre compte pour créer une vidéo.',
        });
      }

      const state = await resolveUserState(cleanEmail);
      const check = evaluateVideoCreationAccess({
        email: cleanEmail,
        planId: state.plan,
        videosUsedThisMonth: state.videosUsedThisMonth,
        verseCount: Number(body.verseCount) || 1,
        qualityId: String(body.quality || '720p').toLowerCase(),
        hasCustomLogo: Boolean(body.hasCustomLogo),
      });

      const currentStatus = buildStatusDTO(state);
      if (!check.allowed) {
        return res.status(403).json({
          ok: false,
          error: check.message || 'Création vidéo non autorisée pour ce forfait.',
          reasonCode: check.reasonCode,
          status: currentStatus,
        });
      }

      state.videosUsedThisMonth = (state.videosUsedThisMonth || 0) + 1;
      state.totalVideosCreated = (state.totalVideosCreated || 0) + 1;
      state.lastConnectedAt = new Date().toISOString();

      const record = {
        id: `vid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userEmail: cleanEmail,
        userName: String(body.userName || state.fullName || cleanEmail.split('@')[0]),
        planAtCreation: currentStatus.plan,
        surahSummary: String(body.surahSummary || 'Saint Coran').slice(0, 140),
        verseCount: Math.max(1, Math.floor(Number(body.verseCount) || 1)),
        quality: String(body.quality || '720p'),
        aspectRatio: String(body.aspectRatio || '9:16'),
        hadWatermark: Boolean(check.plan.hasWatermark),
        durationSec: Math.max(0, Math.floor(Number(body.durationSec) || 0)),
        createdAt: new Date().toISOString(),
      };

      await persistSubStateToProfileAndFallback(cleanEmail, state);

      const vidRes = await supabaseUpsert('video_creations', {
        user_email: record.userEmail,
        user_name: record.userName,
        plan_at_creation: record.planAtCreation,
        surah_summary: record.surahSummary,
        verse_count: record.verseCount,
        quality: record.quality,
        aspect_ratio: record.aspectRatio,
        had_watermark: record.hadWatermark,
        duration_sec: record.durationSec,
      });

      if (!vidRes.ok) {
        await supabaseUpsert('email_logs', {
          sender_email: cleanEmail,
          recipient_email: 'video_creations',
          subject: JSON.stringify(record),
          body_preview: `${record.surahSummary} (${record.quality})`,
          email_type: 'video_creation',
          status: 'recorded',
        });
      }

      await incrementDailyAnalytics('videosCreated', 1);

      return res.status(200).json({
        ok: true,
        record,
        status: buildStatusDTO(state),
      });
    }

    // 3. POST /api/subscription/upgrade
    if (action === 'upgrade' || urlStr.includes('/upgrade')) {
      const cleanEmail = String(body.email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return res.status(401).json({
          ok: false,
          error: 'Connexion au compte requise avant activation.',
        });
      }

      const targetPlan = normalizePlanId(body.plan);
      if (targetPlan !== 'basique' && targetPlan !== 'pro' && targetPlan !== 'max') {
        return res.status(400).json({
          ok: false,
          error: 'Forfait payant invalide (basique, pro ou max).',
        });
      }

      const planSpec = VIDEO_PLANS[targetPlan];
      const state = await resolveUserState(cleanEmail);
      const nowIso = new Date().toISOString();
      const previousPlan = state.plan;

      state.plan = isSuperAdminEmail(cleanEmail) ? 'admin' : targetPlan;
      state.role = isSuperAdminEmail(cleanEmail) ? 'admin' : 'user';
      state.planUpdatedAt = nowIso;
      if (previousPlan !== state.plan) {
        state.videosUsedThisMonth = 0;
        state.planPeriodStart = nowIso;
      }
      state.totalAmountPaidFcfa = (state.totalAmountPaidFcfa || 0) + planSpec.priceFcfa;
      state.lastConnectedAt = nowIso;

      await upsertUserAndProfileInSupabase({
        id: state.id,
        email: cleanEmail,
        fullName: state.fullName,
        cityName: state.cityName,
      });

      await persistSubStateToProfileAndFallback(cleanEmail, state);

      const txRef =
        body.transactionReference ||
        `SUB-${targetPlan.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

      await supabaseUpsert('donations', {
        user_id: state.id,
        amount: planSpec.priceFcfa,
        currency: 'XOF',
        provider: String(body.provider || 'wave').toLowerCase().includes('orange')
          ? 'direct_transfer'
          : 'wave',
        status: 'succeeded',
        cause: `Abonnement Vidéo ${planSpec.name} - Le Sanctuaire`,
        donor_name: state.fullName,
        donor_email: cleanEmail,
        transaction_reference: txRef,
      });

      if (previousPlan !== targetPlan) {
        await incrementDailyAnalytics('paidUpgrades', 1);
      }

      const nextStatus = buildStatusDTO(state);
      return res.status(200).json({
        ok: true,
        user: {
          ...state,
          remainingVideos: nextStatus.remainingVideos,
          monthlyLimit: nextStatus.monthlyLimit,
        },
        status: nextStatus,
        transactionReference: txRef,
      });
    }

    return res.status(400).json({ ok: false, error: 'Action abonnement inconnue.' });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Erreur serveur lors de la gestion d’abonnement.',
    });
  }
}
