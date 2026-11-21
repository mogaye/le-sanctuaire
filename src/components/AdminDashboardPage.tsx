import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Crown,
  CreditCard,
  Database,
  Film,
  LayoutDashboard,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  UploadCloud,
  Users,
  Video,
  XCircle,
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  adminSetUserPlan,
  adminUpdateReportStatus,
  fetchAdminOverview,
  fetchAdminUsers,
  fetchSupabaseDiagnostics,
  resyncAccountsToSupabase,
  SupabaseDiagnosticReport,
} from '../lib/supabase';
import {
  SubscriptionPlanId,
  VIDEO_PLANS,
  formatDurationFrench,
  formatFcfa,
  isSuperAdminEmail,
} from '../utils/subscriptionPlans';
import {
  SUPABASE_SETUP_SQL,
  SUPABASE_TABLE_NAMES,
} from '../utils/supabaseAdminHelpers';

interface AdminDashboardPageProps {
  currentUser: UserProfile | null;
  isDarkMode: boolean;
  onNavigateHome: () => void;
  onOpenVideoStudio?: () => void;
}

type AdminTab = 'overview' | 'users' | 'statistics' | 'reports' | 'supabase';

interface ManagedUserRow {
  id: string;
  email: string;
  fullName: string;
  cityName: string;
  role: 'admin' | 'user';
  plan: SubscriptionPlanId;
  videosUsedThisMonth: number;
  totalVideosCreated: number;
  remainingVideos: number | null;
  monthlyLimit: number | null;
  totalAmountPaidFcfa: number;
  timeSpentSeconds: number;
  lastConnectedAt: string;
  createdAt: string;
}

interface DailyPoint {
  date: string;
  label: string;
  visits: number;
  signups: number;
  paidUpgrades: number;
  videosCreated: number;
}

interface AdminReportRow {
  id: string;
  reporterEmail: string;
  reporterName: string;
  category: string;
  subject: string;
  description: string;
  pageContext: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
}

interface RecentVideoRow {
  id: string;
  userEmail: string;
  userName: string;
  planAtCreation: SubscriptionPlanId;
  surahSummary: string;
  verseCount: number;
  quality: string;
  aspectRatio: string;
  hadWatermark: boolean;
  createdAt: string;
}

interface EvolutionChartProps {
  title: string;
  subtitle: string;
  series: DailyPoint[];
  primaryKey: keyof Pick<DailyPoint, 'visits' | 'paidUpgrades'>;
  primaryLabel: string;
  primaryColor: string;
  secondaryKey: keyof Pick<DailyPoint, 'signups' | 'videosCreated'>;
  secondaryLabel: string;
  secondaryColor: string;
  isDarkMode: boolean;
}

const EvolutionLineChart: React.FC<EvolutionChartProps> = ({
  title,
  subtitle,
  series,
  primaryKey,
  primaryLabel,
  primaryColor,
  secondaryKey,
  secondaryLabel,
  secondaryColor,
  isDarkMode,
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 560;
  const height = 210;
  const padL = 34;
  const padR = 14;
  const padT = 16;
  const padB = 30;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const maxVal = useMemo(() => {
    let m = 4;
    for (const p of series) {
      m = Math.max(m, Number(p[primaryKey]) || 0, Number(p[secondaryKey]) || 0);
    }
    return m;
  }, [series, primaryKey, secondaryKey]);

  const toPoints = (key: typeof primaryKey | typeof secondaryKey) =>
    series.map((p, idx) => {
      const x = padL + (series.length > 1 ? (idx / (series.length - 1)) * plotW : plotW / 2);
      const val = Number(p[key]) || 0;
      const y = padT + plotH - (val / maxVal) * plotH;
      return { x, y, val, label: p.label, date: p.date };
    });

  const pts1 = toPoints(primaryKey);
  const pts2 = toPoints(secondaryKey);

  const buildPath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length === 0) return '';
    return pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');
  };

  const buildArea = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length === 0) return '';
    const line = buildPath(pts);
    const lastX = pts[pts.length - 1].x.toFixed(1);
    const firstX = pts[0].x.toFixed(1);
    const baseY = (padT + plotH).toFixed(1);
    return `${line} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  };

  const activePoint = hoverIdx !== null && series[hoverIdx] ? series[hoverIdx] : null;
  const uid = title.replace(/[^a-zA-Z0-9]/g, '');

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 flex flex-col gap-3 ${
        isDarkMode ? 'bg-[#121D18] border-white/10' : 'bg-white border-[#E2DFD7]'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-bold tracking-tight">{title}</h3>
          <p className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-[#565C58]'}`}>{subtitle}</p>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
            <span>{primaryLabel}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
            <span>{secondaryLabel}</span>
          </span>
        </div>
      </div>

      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id={`grad_${uid}_1`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="0.28" />
              <stop offset="100%" stopColor={primaryColor} stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id={`grad_${uid}_2`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.22" />
              <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = padT + plotH * (1 - t);
            const gridVal = Math.round(maxVal * t);
            return (
              <g key={t}>
                <line
                  x1={padL}
                  y1={y}
                  x2={width - padR}
                  y2={y}
                  stroke={isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(24,34,29,0.08)'}
                  strokeDasharray="3 3"
                />
                <text
                  x={padL - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill={isDarkMode ? 'rgba(255,255,255,0.55)' : '#6B716D'}
                  className="tabular-nums"
                >
                  {gridVal}
                </text>
              </g>
            );
          })}

          {pts1.length > 0 && (
            <>
              <path d={buildArea(pts1)} fill={`url(#grad_${uid}_1)`} />
              <path d={buildArea(pts2)} fill={`url(#grad_${uid}_2)`} />
              <path d={buildPath(pts1)} fill="none" stroke={primaryColor} strokeWidth="2.4" strokeLinecap="round" />
              <path d={buildPath(pts2)} fill="none" stroke={secondaryColor} strokeWidth="2.4" strokeLinecap="round" />
            </>
          )}

          {pts1.map((pt, idx) => (
            <g
              key={pt.date}
              onMouseEnter={() => setHoverIdx(idx)}
              onMouseLeave={() => setHoverIdx(null)}
              className="cursor-pointer"
            >
              {(idx === 0 || idx === pts1.length - 1 || idx % 3 === 0) && (
                <text
                  x={pt.x}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill={isDarkMode ? 'rgba(255,255,255,0.55)' : '#6B716D'}
                >
                  {pt.label}
                </text>
              )}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoverIdx === idx ? 4.5 : 2.5}
                fill={primaryColor}
              />
              <circle
                cx={pts2[idx].x}
                cy={pts2[idx].y}
                r={hoverIdx === idx ? 4.5 : 2.5}
                fill={secondaryColor}
              />
              <rect x={pt.x - 14} y={padT} width={28} height={plotH} fill="transparent" />
            </g>
          ))}
        </svg>

        {activePoint && (
          <div
            className={`mt-1 px-3 py-1.5 rounded-xl border text-xs flex items-center justify-between gap-3 tabular-nums ${
              isDarkMode ? 'bg-white/5 border-white/15' : 'bg-[#F8F6F1] border-[#E2DFD7]'
            }`}
          >
            <span className="font-semibold">{activePoint.date}</span>
            <div className="flex items-center gap-4">
              <span>
                {primaryLabel} : <strong>{activePoint[primaryKey]}</strong>
              </span>
              <span>
                {secondaryLabel} : <strong>{activePoint[secondaryKey]}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  currentUser,
  isDarkMode,
  onNavigateHome,
  onOpenVideoStudio,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<ManagedUserRow[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | SubscriptionPlanId>('all');
  const [updatingEmail, setUpdatingEmail] = useState<string | null>(null);
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);
  const [reportFilter, setReportFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [diagReport, setDiagReport] = useState<SupabaseDiagnosticReport | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [resyncing, setResyncing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlPanel, setShowSqlPanel] = useState(false);

  const isAdmin = isSuperAdminEmail(currentUser?.email);

  const loadDashboardData = useCallback(
    async (silent = false) => {
      if (!currentUser?.email || !isSuperAdminEmail(currentUser.email)) {
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setErrorMsg(null);

      try {
        const [ov, usrList, diag] = await Promise.all([
          fetchAdminOverview(currentUser.email),
          fetchAdminUsers(currentUser.email),
          fetchSupabaseDiagnostics().catch(() => null),
        ]);
        setOverview(ov);
        setUsers(usrList);
        if (diag) setDiagReport(diag);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Impossible de charger les données administrateur.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentUser?.email]
  );

  useEffect(() => {
    loadDashboardData(false);
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const handleRunDiagnostics = async () => {
    setDiagLoading(true);
    try {
      const diag = await fetchSupabaseDiagnostics();
      setDiagReport(diag);
      const okCount = SUPABASE_TABLE_NAMES.filter((t) => diag.tables?.[t]?.ok).length;
      setActionToast(
        diag.ok
          ? `Connexion Supabase opérationnelle : ${okCount}/10 tables prêtes.`
          : `Diagnostic terminé : ${okCount}/10 tables accessibles.`
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur lors du test Supabase.');
    } finally {
      setDiagLoading(false);
    }
  };

  const handleResyncAccounts = async () => {
    if (!currentUser?.email) return;
    setResyncing(true);
    setErrorMsg(null);
    try {
      const res = await resyncAccountsToSupabase({
        adminEmail: currentUser.email,
        accounts: users,
      });
      setActionToast(res.message);
      await loadDashboardData(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur lors de la resynchronisation.');
    } finally {
      setResyncing(false);
    }
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
      setCopiedSql(true);
      setActionToast('Script SQL complet (10 tables) copié dans le presse-papiers.');
      setTimeout(() => setCopiedSql(false), 3000);
    } catch {
      setShowSqlPanel(true);
      setActionToast('Copiez le script SQL directement depuis la zone ci-dessous.');
    }
  };

  const handleAuthorizePlan = async (
    targetEmail: string,
    plan: 'test' | 'basique' | 'pro' | 'max'
  ) => {
    if (!currentUser?.email) return;
    setUpdatingEmail(targetEmail);
    setActionToast(null);
    try {
      const updated = await adminSetUserPlan({
        adminEmail: currentUser.email,
        targetEmail,
        plan,
        recordPayment: plan !== 'test',
      });
      setUsers((prev) =>
        prev.map((u) => (u.email === targetEmail ? { ...u, ...updated } : u))
      );
      setActionToast(`Forfait ${VIDEO_PLANS[plan].name} autorisé pour ${targetEmail}.`);
      await loadDashboardData(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur lors de la mise à jour du forfait.');
    } finally {
      setUpdatingEmail(null);
    }
  };

  const handleReportStatusChange = async (
    reportId: string,
    status: 'open' | 'in_progress' | 'resolved'
  ) => {
    if (!currentUser?.email) return;
    setUpdatingReportId(reportId);
    try {
      await adminUpdateReportStatus({
        adminEmail: currentUser.email,
        reportId,
        status,
      });
      await loadDashboardData(true);
      setActionToast(
        status === 'resolved'
          ? 'Signalement marqué comme résolu.'
          : 'Signalement mis en cours de traitement.'
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur lors de la mise à jour du signalement.');
    } finally {
      setUpdatingReportId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter((u) => {
      if (planFilter !== 'all' && u.plan !== planFilter) return false;
      if (!q) return true;
      return (
        u.email.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        u.cityName.toLowerCase().includes(q)
      );
    });
  }, [users, userSearch, planFilter]);

  const reports: AdminReportRow[] = overview?.reports || [];
  const filteredReports = useMemo(() => {
    if (reportFilter === 'all') return reports;
    return reports.filter((r) => r.status === reportFilter);
  }, [reports, reportFilter]);

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 rounded-3xl border border-red-500/30 bg-red-500/10 text-center space-y-4">
        <ShieldCheck className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold">Accès réservé au Super Administrateur</h2>
        <p className="text-sm opacity-80">
          Connectez-vous avec le compte Super Admin pour accéder au tableau de bord analytique.
        </p>
        <button
          type="button"
          onClick={onNavigateHome}
          className="h-10 px-5 rounded-full bg-[#1B573E] text-white text-xs font-bold cursor-pointer"
        >
          Retour à l’Accueil
        </button>
      </div>
    );
  }

  const kpis = overview?.kpis || {
    realTimeVisitors: 1,
    registeredAccounts: users.length,
    paidAccounts: 0,
    totalVideosCreated: 0,
    openReports: 0,
    totalRevenueFcfa: 0,
    avgTimeSpentSeconds: 0,
  };
  const dailySeries: DailyPoint[] = overview?.charts?.dailySeries || [];
  const topCreators: ManagedUserRow[] = overview?.leaderboards?.topCreators || [];
  const topPayers: ManagedUserRow[] = overview?.leaderboards?.topPayers || [];
  const planDist = overview?.statistics?.planDistribution || {
    test: 0,
    basique: 0,
    pro: 0,
    max: 0,
    admin: 0,
  };
  const qualityDist = overview?.statistics?.qualityBreakdown || {
    '480p': 0,
    '720p': 0,
    '1080p': 0,
    '4k': 0,
  };
  const recentVideos: RecentVideoRow[] = overview?.statistics?.recentVideos || [];

  const cardSurface = isDarkMode
    ? 'bg-[#121D18] border-white/10 text-[#F2F5F3]'
    : 'bg-white border-[#E2DFD7] text-[#18221D]';

  const planBadgeClass = (plan: SubscriptionPlanId) => {
    switch (plan) {
      case 'admin':
        return 'bg-[#1B573E] text-white';
      case 'max':
        return 'bg-[#D4A373]/25 text-[#9A6B2F] dark:text-[#F6D399] border border-[#D4A373]/40';
      case 'pro':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30';
      case 'basique':
        return 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30';
      default:
        return isDarkMode
          ? 'bg-white/10 text-white/80'
          : 'bg-[#F0EEE8] text-[#4F5551]';
    }
  };

  return (
    <div
      data-testid="admin-dashboard-page"
      className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6"
    >
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left Sidebar Navigation (Donezo SaaS inspired) */}
        <aside
          className={`w-full lg:w-[252px] shrink-0 rounded-2xl border p-4 flex flex-col justify-between gap-5 ${cardSurface}`}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#1B573E] text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate">Super Admin</div>
                  <div className="text-[11px] opacity-65 truncate">{currentUser?.email}</div>
                </div>
              </div>
            </div>

            <nav aria-label="Navigation administrateur" className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-1 gap-1.5">
              {[
                { id: 'overview' as const, label: "Vue d'ensemble", icon: LayoutDashboard },
                { id: 'users' as const, label: `Utilisateurs (${users.length})`, icon: Users },
                { id: 'statistics' as const, label: 'Statistiques', icon: BarChart3 },
                {
                  id: 'reports' as const,
                  label: `Signalements (${kpis.openReports})`,
                  icon: AlertTriangle,
                },
                {
                  id: 'supabase' as const,
                  label: 'Connexion Supabase',
                  icon: Database,
                },
              ].map((item) => {
                const active = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`admin-tab-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`h-10 px-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition-all whitespace-nowrap ${
                      active
                        ? 'bg-[#1B573E] text-white shadow-sm'
                        : isDarkMode
                        ? 'text-white/75 hover:bg-white/10'
                        : 'text-[#4F5551] hover:bg-[#F3F1EB]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="space-y-2 pt-3 border-t border-black/10 dark:border-white/10">
            {onOpenVideoStudio && (
              <button
                type="button"
                onClick={onOpenVideoStudio}
                className="w-full h-10 px-3 rounded-xl bg-[#D4A373]/20 hover:bg-[#D4A373]/30 text-[#9A6B2F] dark:text-[#F6D399] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
              >
                <Film className="w-4 h-4 shrink-0" />
                <span>Studio Vidéo (Illimité)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onNavigateHome}
              className={`w-full h-10 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
                isDarkMode
                  ? 'border-white/15 hover:bg-white/10'
                  : 'border-[#D4D1C8] hover:bg-[#F3F1EB]'
              }`}
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Retour à l’Accueil</span>
            </button>
          </div>
        </aside>

        {/* Main Viewport */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Top Bar */}
          <div
            className={`rounded-2xl border px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 ${cardSurface}`}
          >
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider opacity-60">
                Le Sanctuaire / Console Super Admin
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight mt-0.5">
                {activeTab === 'overview'
                  ? "Vue d'ensemble en temps réel"
                  : activeTab === 'users'
                  ? 'Gestion des comptes & autorisations manuelles'
                  : activeTab === 'statistics'
                  ? 'Statistiques détaillées & vidéos créées'
                  : activeTab === 'supabase'
                  ? 'Connexion Supabase & Configuration des 10 tables'
                  : 'Signalements utilisateurs'}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {(() => {
                const okTablesCount = SUPABASE_TABLE_NAMES.filter(
                  (t) => diagReport?.tables?.[t]?.ok
                ).length;
                const isConnected = Boolean(
                  diagReport?.environment?.supabaseKeyConfigured || overview?.supabaseConnected
                );
                const allTablesReady = Boolean(diagReport?.ok && okTablesCount === 10);
                return (
                  <button
                    type="button"
                    data-testid="admin-supabase-status-badge"
                    onClick={() => setActiveTab('supabase')}
                    className={`h-9 px-3 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                      allTablesReady
                        ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:text-emerald-300'
                        : isConnected
                        ? 'bg-amber-500/15 border-amber-500/35 text-amber-800 dark:text-amber-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {allTablesReady
                        ? 'Supabase connecté (10/10 tables)'
                        : isConnected
                        ? `Supabase (${okTablesCount}/10 tables)`
                        : 'Supabase non configuré'}
                    </span>
                  </button>
                );
              })()}
              <button
                type="button"
                data-testid="admin-refresh-btn"
                disabled={refreshing}
                onClick={() => loadDashboardData(true)}
                className={`h-9 px-3.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isDarkMode
                    ? 'border-white/15 hover:bg-white/10'
                    : 'border-[#D4D1C8] hover:bg-[#F3F1EB]'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-2xl px-4 py-3 bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {actionToast && (
            <div
              data-testid="admin-action-toast"
              className="rounded-2xl px-4 py-2.5 bg-emerald-500/15 border border-emerald-500/35 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2"
            >
              <span>{actionToast}</span>
              <button
                type="button"
                onClick={() => setActionToast(null)}
                className="text-xs underline cursor-pointer"
              >
                Fermer
              </button>
            </div>
          )}

          {loading ? (
            <div className={`rounded-2xl border p-8 text-center text-sm opacity-75 ${cardSurface}`}>
              Chargement des données en temps réel…
            </div>
          ) : (
            <>
              {/* TAB 1: VUE D'ENSEMBLE */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  {/* 5 KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3.5">
                    {[
                      {
                        testId: 'kpi-realtime-visitors',
                        label: 'Visiteurs en temps réel',
                        value: String(kpis.realTimeVisitors),
                        sub: 'Actifs dans les 45s',
                        icon: Activity,
                        highlight: true,
                      },
                      {
                        testId: 'kpi-registered-accounts',
                        label: 'Comptes inscrits',
                        value: String(kpis.registeredAccounts),
                        sub: 'Synchronisés en base',
                        icon: Users,
                        highlight: false,
                      },
                      {
                        testId: 'kpi-paid-accounts',
                        label: 'Comptes payants',
                        value: String(kpis.paidAccounts),
                        sub: formatFcfa(kpis.totalRevenueFcfa),
                        icon: CreditCard,
                        highlight: false,
                      },
                      {
                        testId: 'kpi-videos-created',
                        label: 'Vidéos créées & sauvées',
                        value: String(kpis.totalVideosCreated),
                        sub: 'Total cumulé',
                        icon: Video,
                        highlight: false,
                      },
                      {
                        testId: 'kpi-open-reports',
                        label: 'Signalements ouverts',
                        value: String(kpis.openReports),
                        sub: `${reports.length} au total`,
                        icon: AlertTriangle,
                        highlight: false,
                      },
                    ].map((card) => {
                      const Icon = card.icon;
                      return (
                        <div
                          key={card.testId}
                          data-testid={card.testId}
                          className={`rounded-2xl border p-4 flex flex-col justify-between gap-2.5 ${
                            card.highlight
                              ? 'bg-[#1B573E] border-[#1B573E] text-white'
                              : cardSurface
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-xs font-semibold ${
                                card.highlight ? 'text-white/85' : 'opacity-70'
                              }`}
                            >
                              {card.label}
                            </span>
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                card.highlight ? 'text-[#6EE7B7]' : 'text-[#1B573E] dark:text-[#6EE7B7]'
                              }`}
                            />
                          </div>
                          <div>
                            <div className="text-2xl font-extrabold tabular-nums tracking-tight">
                              {card.value}
                            </div>
                            <div
                              className={`text-[11px] mt-0.5 tabular-nums ${
                                card.highlight ? 'text-white/75' : 'opacity-65'
                              }`}
                            >
                              {card.sub}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 2 Evolution Charts + Side Top 3 Leaderboards */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                    <div className="xl:col-span-8 grid grid-cols-1 gap-5">
                      <EvolutionLineChart
                        title="Évolution des visites et créations de comptes"
                        subtitle="Tendance journalière sur 14 jours"
                        series={dailySeries}
                        primaryKey="visits"
                        primaryLabel="Visites"
                        primaryColor="#1B573E"
                        secondaryKey="signups"
                        secondaryLabel="Créations de comptes"
                        secondaryColor="#D4A373"
                        isDarkMode={isDarkMode}
                      />

                      <EvolutionLineChart
                        title="Évolution comptes payants & vidéos créées"
                        subtitle="Activations d'abonnements et exports enregistrés"
                        series={dailySeries}
                        primaryKey="videosCreated"
                        primaryLabel="Vidéos créées"
                        primaryColor="#16A34A"
                        secondaryKey="paidUpgrades"
                        secondaryLabel="Comptes payants"
                        secondaryColor="#0284C7"
                        isDarkMode={isDarkMode}
                      />
                    </div>

                    {/* Side Leaderboards (Top 3 Creators + Top 3 Highest Paying Accounts) */}
                    <div className="xl:col-span-4 space-y-5">
                      {/* Top 3 Video Creators */}
                      <div
                        data-testid="admin-top-creators"
                        className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${cardSurface}`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold flex items-center gap-2">
                            <Film className="w-4 h-4 text-[#1B573E] dark:text-[#6EE7B7]" />
                            <span>Top 3 créateurs vidéo</span>
                          </h3>
                          <span className="text-[11px] opacity-60">Par volume</span>
                        </div>

                        {topCreators.length === 0 ? (
                          <div className="text-xs opacity-65 py-4 text-center">
                            Aucune vidéo enregistrée pour le moment.
                          </div>
                        ) : (
                          <div className="divide-y divide-black/10 dark:divide-white/10">
                            {topCreators.map((u, idx) => (
                              <div key={u.email} className="py-2.5 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="w-6 h-6 rounded-full bg-[#1B573E]/15 text-[#1B573E] dark:text-[#6EE7B7] text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                                    {idx + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold truncate">{u.fullName}</div>
                                    <div className="text-[11px] opacity-65 truncate">{u.email}</div>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-xs font-extrabold tabular-nums">
                                    {u.totalVideosCreated} vidéos
                                  </div>
                                  <div className="text-[10px] opacity-65">{VIDEO_PLANS[u.plan]?.name}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Top 3 Highest Paying Accounts */}
                      <div
                        data-testid="admin-top-payers"
                        className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${cardSurface}`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold flex items-center gap-2">
                            <Crown className="w-4 h-4 text-[#D4A373]" />
                            <span>Top 3 comptes payants</span>
                          </h3>
                          <span className="text-[11px] opacity-60">Montant total</span>
                        </div>

                        {topPayers.length === 0 ? (
                          <div className="text-xs opacity-65 py-4 text-center">
                            Aucun paiement enregistré.
                          </div>
                        ) : (
                          <div className="divide-y divide-black/10 dark:divide-white/10">
                            {topPayers.map((u, idx) => (
                              <div key={u.email} className="py-2.5 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="w-6 h-6 rounded-full bg-[#D4A373]/25 text-[#9A6B2F] dark:text-[#F6D399] text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                                    {idx + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold truncate">{u.fullName}</div>
                                    <div className="text-[11px] opacity-65 truncate">{u.email}</div>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-xs font-extrabold tabular-nums">
                                    {formatFcfa(u.totalAmountPaidFcfa)}
                                  </div>
                                  <div className="text-[10px] opacity-65">{VIDEO_PLANS[u.plan]?.name}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: UTILISATEURS & AUTORISATION MANUELLE */}
              {activeTab === 'users' && (
                <div className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${cardSurface}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[220px] max-w-md">
                      <Search className="w-4 h-4 opacity-50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        data-testid="admin-user-search"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Rechercher par nom, email ou ville..."
                        className={`w-full h-10 pl-9 pr-4 rounded-xl border text-xs outline-none ${
                          isDarkMode
                            ? 'bg-white/5 border-white/15 text-white placeholder:text-white/40'
                            : 'bg-[#F8F6F1] border-[#D4D1C8] text-[#18221D] placeholder:text-[#787E7A]'
                        }`}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      {(['all', 'test', 'basique', 'pro', 'max', 'admin'] as const).map((flt) => (
                        <button
                          key={flt}
                          type="button"
                          onClick={() => setPlanFilter(flt)}
                          className={`h-8 px-3 rounded-full font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                            planFilter === flt
                              ? 'bg-[#1B573E] text-white'
                              : isDarkMode
                              ? 'bg-white/5 text-white/75 hover:bg-white/10'
                              : 'bg-[#F3F1EB] text-[#4F5551] hover:bg-[#E7E4DC]'
                          }`}
                        >
                          {flt === 'all' ? 'Tous' : VIDEO_PLANS[flt].name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-black/10 dark:border-white/10 opacity-70">
                          <th className="py-2.5 px-2 font-semibold">Utilisateur</th>
                          <th className="py-2.5 px-2 font-semibold">Forfait</th>
                          <th className="py-2.5 px-2 font-semibold text-right">Vidéos (mois / total)</th>
                          <th className="py-2.5 px-2 font-semibold text-right">Restantes</th>
                          <th className="py-2.5 px-2 font-semibold text-right">Temps sur le site</th>
                          <th className="py-2.5 px-2 font-semibold text-right">Total payé</th>
                          <th className="py-2.5 px-2 font-semibold text-right">Autoriser un forfait</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/10 dark:divide-white/10">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center opacity-65">
                              Aucun compte utilisateur trouvé pour ce filtre.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => {
                            const isRowAdmin = u.plan === 'admin';
                            const isBusy = updatingEmail === u.email;
                            return (
                              <tr
                                key={u.email}
                                data-testid={`admin-user-row-${u.email}`}
                                className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                              >
                                <td className="py-3 px-2">
                                  <div className="font-bold text-xs">{u.fullName}</div>
                                  <div className="text-[11px] opacity-65">{u.email}</div>
                                </td>
                                <td className="py-3 px-2">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${planBadgeClass(
                                      u.plan
                                    )}`}
                                  >
                                    {VIDEO_PLANS[u.plan]?.name || u.plan}
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-right font-mono tabular-nums">
                                  {u.videosUsedThisMonth} / {u.totalVideosCreated}
                                </td>
                                <td className="py-3 px-2 text-right font-mono tabular-nums">
                                  {u.remainingVideos === null ? 'Illimité' : u.remainingVideos}
                                </td>
                                <td className="py-3 px-2 text-right font-mono tabular-nums">
                                  {formatDurationFrench(u.timeSpentSeconds)}
                                </td>
                                <td className="py-3 px-2 text-right font-mono tabular-nums font-semibold">
                                  {formatFcfa(u.totalAmountPaidFcfa)}
                                </td>
                                <td className="py-3 px-2 text-right">
                                  {isRowAdmin ? (
                                    <span className="text-[11px] font-semibold opacity-65">
                                      Super Admin permanent
                                    </span>
                                  ) : (
                                    <div className="inline-flex items-center justify-end gap-1 flex-wrap">
                                      {(['basique', 'pro', 'max'] as const).map((tier) => (
                                        <button
                                          key={tier}
                                          type="button"
                                          data-testid={`admin-auth-${tier}-${u.email}`}
                                          disabled={isBusy}
                                          onClick={() => handleAuthorizePlan(u.email, tier)}
                                          className={`h-7 px-2.5 rounded-lg text-[11px] font-bold cursor-pointer whitespace-nowrap transition-colors disabled:opacity-50 ${
                                            u.plan === tier
                                              ? 'bg-[#1B573E] text-white'
                                              : isDarkMode
                                              ? 'bg-white/10 hover:bg-white/20 text-white'
                                              : 'bg-[#F0EEE8] hover:bg-[#E2DFD7] text-[#18221D]'
                                          }`}
                                        >
                                          {VIDEO_PLANS[tier].name}
                                        </button>
                                      ))}
                                      {u.plan !== 'test' && (
                                        <button
                                          type="button"
                                          disabled={isBusy}
                                          onClick={() => handleAuthorizePlan(u.email, 'test')}
                                          className="h-7 px-2 rounded-lg text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer whitespace-nowrap"
                                        >
                                          Test
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: STATISTIQUES */}
              {activeTab === 'statistics' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`rounded-2xl border p-4 space-y-3 ${cardSurface}`}>
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#1B573E] dark:text-[#6EE7B7]" />
                        <span>Répartition par forfait</span>
                      </h3>
                      <div className="space-y-2 text-xs">
                        {(['test', 'basique', 'pro', 'max', 'admin'] as const).map((p) => {
                          const count = Number(planDist[p] || 0);
                          const pct =
                            users.length > 0 ? Math.round((count / users.length) * 100) : 0;
                          return (
                            <div key={p} className="space-y-1">
                              <div className="flex justify-between tabular-nums">
                                <span className="font-semibold">{VIDEO_PLANS[p].name}</span>
                                <span>
                                  {count} ({pct}%)
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#1B573E]"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className={`rounded-2xl border p-4 space-y-3 ${cardSurface}`}>
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <Video className="w-4 h-4 text-[#D4A373]" />
                        <span>Qualité des vidéos générées</span>
                      </h3>
                      <div className="space-y-2 text-xs">
                        {(['480p', '720p', '1080p', '4k'] as const).map((q) => {
                          const count = Number(qualityDist[q] || 0);
                          const total = Math.max(1, recentVideos.length);
                          const pct = Math.round((count / total) * 100);
                          return (
                            <div key={q} className="space-y-1">
                              <div className="flex justify-between tabular-nums">
                                <span className="font-semibold">{q.toUpperCase()}</span>
                                <span>{count} vidéos</span>
                              </div>
                              <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#D4A373]"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className={`rounded-2xl border p-4 space-y-3 ${cardSurface}`}>
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#0284C7]" />
                        <span>Engagement & Revenus</span>
                      </h3>
                      <div className="space-y-3 text-xs pt-1">
                        <div className="flex justify-between items-center">
                          <span className="opacity-70">Temps moyen par compte</span>
                          <strong className="font-mono tabular-nums">
                            {formatDurationFrench(kpis.avgTimeSpentSeconds || 0)}
                          </strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="opacity-70">Revenu total enregistré</span>
                          <strong className="font-mono tabular-nums">
                            {formatFcfa(kpis.totalRevenueFcfa || 0)}
                          </strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="opacity-70">Sessions actives actuelles</span>
                          <strong className="font-mono tabular-nums">
                            {kpis.realTimeVisitors}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Created Videos */}
                  <div className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${cardSurface}`}>
                    <h3 className="text-sm font-bold">Dernières vidéos créées et enregistrées</h3>
                    {recentVideos.length === 0 ? (
                      <div className="text-xs opacity-65 py-6 text-center">
                        Aucune vidéo exportée enregistrée pour le moment.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-black/10 dark:border-white/10 opacity-70">
                              <th className="py-2 px-2">Créateur</th>
                              <th className="py-2 px-2">Sourate / Versets</th>
                              <th className="py-2 px-2">Forfait</th>
                              <th className="py-2 px-2">Qualité</th>
                              <th className="py-2 px-2">Filigrane</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/10 dark:divide-white/10">
                            {recentVideos.map((v) => (
                              <tr key={v.id}>
                                <td className="py-2.5 px-2">
                                  <div className="font-semibold">{v.userName || v.userEmail}</div>
                                  <div className="text-[11px] opacity-60">{v.userEmail}</div>
                                </td>
                                <td className="py-2.5 px-2">
                                  {v.surahSummary} ({v.verseCount} v.)
                                </td>
                                <td className="py-2.5 px-2">
                                  {VIDEO_PLANS[v.planAtCreation]?.name || v.planAtCreation}
                                </td>
                                <td className="py-2.5 px-2 font-mono tabular-nums">
                                  {v.quality.toUpperCase()} • {v.aspectRatio}
                                </td>
                                <td className="py-2.5 px-2">
                                  {v.hadWatermark ? 'Avec filigrane' : 'Sans filigrane'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: SIGNALEMENTS */}
              {activeTab === 'reports' && (
                <div className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${cardSurface}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-bold">File des signalements</h3>
                    <div className="flex items-center gap-1.5 text-xs">
                      {(
                        [
                          { id: 'all', label: 'Tous' },
                          { id: 'open', label: 'Ouverts' },
                          { id: 'in_progress', label: 'En cours' },
                          { id: 'resolved', label: 'Résolus' },
                        ] as const
                      ).map((flt) => (
                        <button
                          key={flt.id}
                          type="button"
                          onClick={() => setReportFilter(flt.id)}
                          className={`h-8 px-3 rounded-full font-semibold cursor-pointer whitespace-nowrap ${
                            reportFilter === flt.id
                              ? 'bg-[#1B573E] text-white'
                              : isDarkMode
                              ? 'bg-white/5 text-white/75 hover:bg-white/10'
                              : 'bg-[#F3F1EB] text-[#4F5551] hover:bg-[#E7E4DC]'
                          }`}
                        >
                          {flt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredReports.length === 0 ? (
                    <div className="py-8 text-center text-xs opacity-65">
                      Aucun signalement dans cette catégorie.
                    </div>
                  ) : (
                    <div className="divide-y divide-black/10 dark:divide-white/10">
                      {filteredReports.map((rep) => (
                        <div
                          key={rep.id}
                          data-testid={`admin-report-row-${rep.id}`}
                          className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#D4A373]/20 text-[#9A6B2F] dark:text-[#F6D399]">
                                {rep.category}
                              </span>
                              <span className="text-sm font-bold">{rep.subject}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  rep.status === 'resolved'
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                    : rep.status === 'in_progress'
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                    : 'bg-red-500/15 text-red-700 dark:text-red-300'
                                }`}
                              >
                                {rep.status === 'resolved'
                                  ? 'Résolu'
                                  : rep.status === 'in_progress'
                                  ? 'En cours'
                                  : 'Ouvert'}
                              </span>
                            </div>
                            <p className="text-xs opacity-85 leading-relaxed">{rep.description}</p>
                            <div className="text-[11px] opacity-60">
                              Par {rep.reporterName} ({rep.reporterEmail}) • Page : {rep.pageContext}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {rep.status !== 'in_progress' && rep.status !== 'resolved' && (
                              <button
                                type="button"
                                disabled={updatingReportId === rep.id}
                                onClick={() => handleReportStatusChange(rep.id, 'in_progress')}
                                className="h-8 px-3 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-bold cursor-pointer whitespace-nowrap"
                              >
                                En cours
                              </button>
                            )}
                            {rep.status !== 'resolved' && (
                              <button
                                type="button"
                                data-testid={`admin-resolve-report-${rep.id}`}
                                disabled={updatingReportId === rep.id}
                                onClick={() => handleReportStatusChange(rep.id, 'resolved')}
                                className="h-8 px-3 rounded-lg bg-[#1B573E] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Résolu</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: CONNEXION SUPABASE & 10 TABLES */}
              {activeTab === 'supabase' && (
                <div data-testid="admin-supabase-panel" className="space-y-5">
                  {/* Connection Summary & Actions */}
                  <div className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${cardSurface}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                          <Database className="w-4 h-4 text-[#1B573E] dark:text-[#6EE7B7]" />
                          <span>État de la connexion Supabase</span>
                        </h3>
                        <p className="text-xs opacity-70 mt-0.5">
                          Projet cible :{' '}
                          <span className="font-mono font-semibold">
                            {diagReport?.environment?.supabaseUrl || 'https://bkfklfnnturdwtfjoxci.supabase.co'}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          data-testid="admin-test-supabase-btn"
                          disabled={diagLoading}
                          onClick={handleRunDiagnostics}
                          className={`h-9 px-3.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                            isDarkMode
                              ? 'border-white/15 hover:bg-white/10'
                              : 'border-[#D4D1C8] hover:bg-[#F3F1EB]'
                          }`}
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${diagLoading ? 'animate-spin' : ''}`} />
                          <span>Tester la connexion</span>
                        </button>

                        <button
                          type="button"
                          data-testid="admin-resync-supabase-btn"
                          disabled={resyncing}
                          onClick={handleResyncAccounts}
                          className="h-9 px-3.5 rounded-xl bg-[#1B573E] hover:bg-[#154531] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>
                            {resyncing
                              ? 'Synchronisation…'
                              : `Resynchroniser les comptes (${users.length})`}
                          </span>
                        </button>

                        <button
                          type="button"
                          data-testid="admin-copy-sql-btn"
                          onClick={handleCopySql}
                          className="h-9 px-3.5 rounded-xl bg-[#D4A373]/25 hover:bg-[#D4A373]/35 text-[#9A6B2F] dark:text-[#F6D399] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSql ? 'Script SQL copié !' : 'Copier le script SQL (10 tables)'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Environment Indicators */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      {[
                        {
                          label: 'Clé Anon (VITE_SUPABASE_ANON_KEY)',
                          ok: Boolean(diagReport?.environment?.hasAnonKey),
                          value: diagReport?.environment?.hasAnonKey ? 'Configurée' : 'Absente',
                        },
                        {
                          label: 'Clé Service Role (auth.users)',
                          ok: Boolean(diagReport?.environment?.hasServiceRoleKey),
                          value: diagReport?.environment?.hasServiceRoleKey
                            ? `Active (${diagReport?.environment?.authUsersCount ?? 0} auth.users)`
                            : 'Optionnelle / absente',
                        },
                        {
                          label: 'Colonnes Dashboard (profiles)',
                          ok: Boolean(diagReport?.environment?.profilesColumnsOk),
                          value: diagReport?.environment?.profilesColumnsOk
                            ? 'Migrées (plan, role, quotas)'
                            : 'À vérifier via SQL',
                        },
                        {
                          label: 'Client navigateur Supabase',
                          ok: Boolean(diagReport?.environment?.clientSupabaseConfigured),
                          value: diagReport?.environment?.clientSupabaseConfigured
                            ? 'Connecté'
                            : 'Mode local / API',
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className={`rounded-xl border p-3 flex flex-col gap-1 ${
                            isDarkMode ? 'bg-white/[0.03] border-white/10' : 'bg-[#F8F6F1] border-[#E2DFD7]'
                          }`}
                        >
                          <div className="text-[11px] opacity-65">{item.label}</div>
                          <div className="flex items-center gap-1.5 font-bold">
                            {item.ok ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            )}
                            <span>{item.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {diagReport?.advice && diagReport.advice.length > 0 && (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs space-y-1">
                        <div className="font-bold text-amber-800 dark:text-amber-300">
                          Recommandations pour Vercel & Supabase :
                        </div>
                        <ul className="list-disc pl-4 space-y-0.5 opacity-90">
                          {diagReport.advice.map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* All 10 Tables Diagnostic Grid */}
                  <div className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${cardSurface}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold">Statut des 10 tables Supabase (public.*)</h3>
                      <span className="text-xs opacity-70 tabular-nums">
                        {SUPABASE_TABLE_NAMES.filter((t) => diagReport?.tables?.[t]?.ok).length} / 10 prêtes
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                      {(
                        [
                          { name: 'users', desc: 'Tous les comptes utilisateurs inscrits' },
                          { name: 'profiles', desc: 'Profils, rôles, forfaits vidéo et temps passé' },
                          { name: 'donations', desc: 'Dons Sadaqah & paiements Wave / Orange / PayDunya' },
                          { name: 'prayer_logs', desc: 'Suivi quotidien des 5 prières' },
                          { name: 'quran_favorites', desc: 'Favoris et marque-pages du Noble Coran' },
                          { name: 'dhikr_logs', desc: 'Compteurs Tasbih et invocations Adhkar' },
                          { name: 'email_logs', desc: 'Historique e-mails, avis donateurs & sauvegarde' },
                          { name: 'video_creations', desc: 'Historique des vidéos coraniques générées' },
                          { name: 'user_reports', desc: 'Signalements et bugs envoyés au Super Admin' },
                          { name: 'site_analytics_daily', desc: 'Courbes journalières visites / inscriptions / vidéos' },
                        ] as const
                      ).map((tbl) => {
                        const statusObj = diagReport?.tables?.[tbl.name];
                        const isOk = Boolean(statusObj?.ok);
                        return (
                          <div
                            key={tbl.name}
                            data-testid={`supabase-table-row-${tbl.name}`}
                            className={`rounded-xl border px-3.5 py-2.5 flex items-center justify-between gap-3 ${
                              isDarkMode
                                ? 'bg-white/[0.02] border-white/10'
                                : 'bg-[#F8F6F1] border-[#E2DFD7]'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-mono font-bold text-xs truncate">
                                public.{tbl.name}
                              </div>
                              <div className="text-[11px] opacity-65 truncate">{tbl.desc}</div>
                            </div>
                            <div className="shrink-0 text-right">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  isOk
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                                }`}
                              >
                                {isOk ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>
                                      OK
                                      {typeof statusObj?.rowCount === 'number'
                                        ? ` (${statusObj.rowCount})`
                                        : ''}
                                    </span>
                                  </>
                                ) : (
                                  <span>{statusObj?.status ? `HTTP ${statusObj.status}` : 'À configurer'}</span>
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Collapsible Idempotent SQL Script Viewer */}
                  <div className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${cardSurface}`}>
                    <button
                      type="button"
                      data-testid="admin-toggle-sql-btn"
                      onClick={() => setShowSqlPanel((prev) => !prev)}
                      className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
                    >
                      <div>
                        <div className="text-sm font-bold">
                          Script SQL complet & idempotent (10 tables + déclencheurs + permissions)
                        </div>
                        <div className="text-xs opacity-65">
                          À exécuter dans Supabase → SQL Editor → New query si une table ou colonne manque
                        </div>
                      </div>
                      {showSqlPanel ? (
                        <ChevronUp className="w-4 h-4 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 shrink-0" />
                      )}
                    </button>

                    {showSqlPanel && (
                      <pre
                        data-testid="admin-sql-preview"
                        className={`p-3.5 rounded-xl border text-[11px] font-mono overflow-x-auto max-h-80 leading-relaxed ${
                          isDarkMode
                            ? 'bg-black/40 border-white/10 text-emerald-100'
                            : 'bg-[#F8F6F1] border-[#D4D1C8] text-[#18221D]'
                        }`}
                      >
                        {SUPABASE_SETUP_SQL}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
