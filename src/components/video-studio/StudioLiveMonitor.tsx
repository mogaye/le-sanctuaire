import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Monitor,
  Pause,
  Play,
  Share2,
  Smartphone,
  Square,
  X,
} from 'lucide-react';
import {
  ContinuousTimeline,
  StudioAyahItem,
  VIDEO_QUALITY_PRESETS,
  VideoFormatId,
  VideoFormatPreset,
  VideoQualityId,
  VideoTemplateId,
  findActiveTimelineEntry,
  formatTimeMMSS,
} from '../../utils/mobileVideoStudioUtils';
import {
  VideoCanvasRenderOptions,
  loadCanvasBackgroundImage,
  precomputeVideoCanvasLayout,
  renderVideoCanvasFrame,
} from '../../utils/canvasVideoRenderer';
import { formatStudioBytes } from '../../utils/studioMediaLibrary';

export interface StudioDirectDownloadState {
  status: 'idle' | 'preparing' | 'ready' | 'error';
  progressPct: number;
  statusLabel: string;
  errorMsg: string | null;
  url: string | null;
  filename: string | null;
  sizeBytes: number | null;
  downloaded: boolean;
  canShare: boolean;
}

interface StudioLiveMonitorProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isPcMode: boolean;
  format: VideoFormatPreset;
  onSelectFormat: (id: VideoFormatId) => void;
  qualityId: VideoQualityId;
  onSelectQuality: (id: VideoQualityId) => void;
  ayahs: StudioAyahItem[];
  timeline: ContinuousTimeline;
  surahName: string;
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  selectedSurahsCount: number;
  reciterName: string;
  activeMediaKind: 'video' | 'image' | 'solid';
  activeMediaUrl: string | null;
  isLightSurface: boolean;
  bgSurfaceColor: string;
  bgVeilOpacity: number;
  showArabic: boolean;
  useTajweed: boolean;
  showPhonetics: boolean;
  showFrench: boolean;
  showSurahHeader: boolean;
  textScale: 'compact' | 'standard' | 'grand';
  flowMode: VideoTemplateId;
  simStatus: 'idle' | 'loading' | 'playing' | 'paused' | 'ended';
  simTimeSec: number;
  isLoadingVerses: boolean;
  onTogglePlay: () => void;
  onSeek: (sec: number) => void;
  onJumpToSegmentIndex: (index: number) => void;
  onDetectedVideoDurationSec?: (durationSec: number) => void;
  onMediaElementsChange?: (media: {
    bgImage: HTMLImageElement | null;
    bgVideo: HTMLVideoElement | null;
  }) => void;
  onLayoutReady?: (data: {
    layout: ReturnType<typeof precomputeVideoCanvasLayout> | null;
    renderOpts: VideoCanvasRenderOptions;
  }) => void;
  downloadState: StudioDirectDownloadState;
  onStartDownload: () => void;
  onCancelDownload: () => void;
  onDirectLinkClicked: () => void;
  onShareVideo: () => void;
}

export const StudioLiveMonitor: React.FC<StudioLiveMonitorProps> = ({
  canvasRef,
  isPcMode,
  format,
  onSelectFormat,
  qualityId,
  onSelectQuality,
  ayahs,
  timeline,
  surahName,
  surahNumber,
  startAyah,
  endAyah,
  selectedSurahsCount,
  reciterName,
  activeMediaKind,
  activeMediaUrl,
  isLightSurface,
  bgSurfaceColor,
  bgVeilOpacity,
  showArabic,
  useTajweed,
  showPhonetics,
  showFrench,
  showSurahHeader,
  textScale,
  flowMode,
  simStatus,
  simTimeSec,
  isLoadingVerses,
  onTogglePlay,
  onSeek,
  onJumpToSegmentIndex,
  onDetectedVideoDurationSec,
  onMediaElementsChange,
  onLayoutReady,
  downloadState,
  onStartDownload,
  onCancelDownload,
  onDirectLinkClicked,
  onShareVideo,
}) => {
  const videoHostRef = useRef<HTMLDivElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const [bgReadyTick, setBgReadyTick] = useState(0);
  const [fontsReadyTick, setFontsReadyTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    if (typeof document !== 'undefined' && document.fonts) {
      Promise.allSettled([
        document.fonts.load("400 32px 'Amiri'", 'بِسْمِ ٱللَّهِ'),
        document.fonts.load("700 32px 'Amiri'", 'بِسْمِ ٱللَّهِ'),
        document.fonts.load("400 32px 'Scheherazade New'", 'بِسْمِ ٱللَّهِ'),
        document.fonts.load("700 32px 'Scheherazade New'", 'بِسْمِ ٱللَّهِ'),
        document.fonts.load("400 32px 'Aref Ruqaa'", 'بِسْمِ ٱللَّهِ'),
        document.fonts.load("700 32px 'Aref Ruqaa'", 'بِسْمِ ٱللَّهِ'),
        document.fonts.load("400 32px 'Noto Kufi Arabic'", 'بِسْمِ ٱللَّهِ'),
        document.fonts.load("600 32px 'Noto Kufi Arabic'", 'بِسْمِ ٱللَّهِ'),
        document.fonts.load("700 32px 'Noto Kufi Arabic'", 'بِسْمِ ٱللَّهِ'),
        document.fonts.load("400 24px 'Cormorant Garamond'", "Au nom d'Allah"),
        document.fonts.load("600 24px 'Cormorant Garamond'", "Au nom d'Allah"),
        document.fonts.load("italic 400 24px 'Cormorant Garamond'", "Au nom d'Allah"),
        document.fonts.load("italic 600 24px 'Cormorant Garamond'", "Au nom d'Allah"),
        document.fonts.load("600 20px 'Cinzel'", 'VERSET 1'),
        document.fonts.load("500 24px 'Plus Jakarta Sans'", "Au nom d'Allah"),
      ])
        .then(() => document.fonts.ready)
        .then(() => {
          if (mounted) setFontsReadyTick((t) => t + 1);
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, []);

  // Sync background media into canvas renderer cleanly
  useEffect(() => {
    let active = true;
    bgImageRef.current = null;
    if (bgVideoRef.current) {
      try {
        bgVideoRef.current.pause();
        bgVideoRef.current.removeAttribute('src');
        bgVideoRef.current.load();
        bgVideoRef.current.remove();
      } catch {}
      bgVideoRef.current = null;
    }

    if (activeMediaKind === 'image' && activeMediaUrl) {
      loadCanvasBackgroundImage(activeMediaUrl).then((img) => {
        if (!active) return;
        bgImageRef.current = img;
        onMediaElementsChange?.({ bgImage: img, bgVideo: null });
        setBgReadyTick((t) => t + 1);
      });
    } else if (activeMediaKind === 'video' && activeMediaUrl) {
      const vid = document.createElement('video');
      vid.src = activeMediaUrl;
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.autoplay = true;
      vid.crossOrigin = 'anonymous';
      vid.preload = 'auto';
      vid.style.width = '16px';
      vid.style.height = '16px';
      vid.style.pointerEvents = 'none';
      if (videoHostRef.current) {
        videoHostRef.current.appendChild(vid);
      } else {
        document.body.appendChild(vid);
      }

      const markReady = () => {
        if (!active) return;
        bgVideoRef.current = vid;
        if (Number.isFinite(vid.duration) && vid.duration > 0) {
          onDetectedVideoDurationSec?.(Number(vid.duration.toFixed(2)));
        }
        vid.play().catch(() => {});
        onMediaElementsChange?.({ bgImage: null, bgVideo: vid });
        setBgReadyTick((t) => t + 1);
      };
      vid.onloadedmetadata = () => {
        if (!active) return;
        if (Number.isFinite(vid.duration) && vid.duration > 0) {
          onDetectedVideoDurationSec?.(Number(vid.duration.toFixed(2)));
        }
      };
      vid.onloadeddata = markReady;
      vid.oncanplay = markReady;
      vid.load();
    } else {
      onMediaElementsChange?.({ bgImage: null, bgVideo: null });
      setBgReadyTick((t) => t + 1);
    }

    return () => {
      active = false;
      if (bgVideoRef.current) {
        try {
          bgVideoRef.current.pause();
          bgVideoRef.current.removeAttribute('src');
          bgVideoRef.current.load();
          bgVideoRef.current.remove();
        } catch {}
        bgVideoRef.current = null;
      }
    };
  }, [activeMediaKind, activeMediaUrl]);

  const renderOpts: VideoCanvasRenderOptions = useMemo(
    () => ({
      width: format.previewWidth,
      height: format.previewHeight,
      surahName,
      surahNumber,
      startAyah,
      endAyah,
      selectedSurahsCount,
      isLightSurface,
      bgSurfaceColor,
      bgVeilOpacity,
      bgImage: bgImageRef.current,
      bgVideo: bgVideoRef.current,
      showArabic,
      useTajweed,
      showPhonetics,
      showFrench,
      showSurahHeader,
      textScale,
      flowMode,
      reciterName,
    }),
    [
      format.previewWidth,
      format.previewHeight,
      surahName,
      surahNumber,
      startAyah,
      endAyah,
      selectedSurahsCount,
      isLightSurface,
      bgSurfaceColor,
      bgVeilOpacity,
      bgReadyTick,
      showArabic,
      useTajweed,
      showPhonetics,
      showFrench,
      showSurahHeader,
      textScale,
      flowMode,
      reciterName,
    ]
  );

  const layout = useMemo(() => {
    const canvas = canvasRef.current;
    if (!canvas || ayahs.length === 0) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return precomputeVideoCanvasLayout(ctx, ayahs, renderOpts);
  }, [ayahs, renderOpts, fontsReadyTick]);

  useEffect(() => {
    onLayoutReady?.({ layout, renderOpts });
  }, [layout, renderOpts]);

  // Auto-render canvas frame immediately whenever verses/style/time change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout) return;
    if (canvas.width !== format.previewWidth || canvas.height !== format.previewHeight) {
      canvas.width = format.previewWidth;
      canvas.height = format.previewHeight;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderVideoCanvasFrame(ctx, layout, timeline, simTimeSec, {
      ...renderOpts,
      bgImage: bgImageRef.current,
      bgVideo: bgVideoRef.current,
    });
  }, [layout, timeline, simTimeSec, renderOpts, bgReadyTick, format.previewWidth, format.previewHeight]);

  // Keep background video frames updating smoothly when paused/idle
  useEffect(() => {
    if (simStatus === 'playing' || activeMediaKind !== 'video') return;
    let rafId = 0;
    const tick = () => {
      if (bgVideoRef.current && bgVideoRef.current.paused && bgVideoRef.current.readyState >= 2) {
        bgVideoRef.current.play().catch(() => {});
      }
      if (canvasRef.current && layout) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          renderVideoCanvasFrame(ctx, layout, timeline, simTimeSec, {
            ...renderOpts,
            bgImage: bgImageRef.current,
            bgVideo: bgVideoRef.current,
          });
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [simStatus, activeMediaKind, layout, timeline, simTimeSec, renderOpts]);

  const activeEntry = useMemo(
    () => findActiveTimelineEntry(timeline, simTimeSec),
    [timeline, simTimeSec]
  );
  const currentSegIdx = activeEntry.index;

  const aspectBoxClass =
    format.aspectLabel === '16:9'
      ? 'aspect-video w-full max-w-[min(100%,calc(26dvh*16/9))] md:max-w-[min(100%,calc(48dvh*16/9))]'
      : format.aspectLabel === '1:1'
      ? 'aspect-square w-full max-w-[min(100%,24dvh)] md:max-w-[min(100%,44dvh)]'
      : 'aspect-[9/16] h-[25dvh] md:h-[48dvh] max-w-full';

  const isPlaying = simStatus === 'playing';
  const isBufferingSim = simStatus === 'loading';
  const isPreparingDownload = downloadState.status === 'preparing';
  const isDownloadReady = downloadState.status === 'ready' && Boolean(downloadState.url);

  return (
    <aside
      data-testid="studio-desktop-916-preview"
      className="flex flex-col justify-between min-h-0 px-3.5 py-2.5 md:p-5 studio-surface-raised md:studio-surface-stacked md:rounded-3xl border-b border-[#CECBC2] md:border-none shrink-0 md:shrink"
    >
      <div
        ref={videoHostRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: 0,
          bottom: 0,
          width: '16px',
          height: '16px',
          opacity: 0.01,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      {/* Simulation Stage */}
      <div className="flex-1 min-h-0 flex items-center justify-center py-1 md:py-2">
        <div
          className={`relative ${aspectBoxClass} p-1 rounded-2xl bg-[#D1CFC7] shadow-[inset_0_2px_6px_rgba(24,28,26,0.18),0_4px_12px_rgba(24,28,26,0.08)] flex items-center justify-center`}
        >
          <div className="relative w-full h-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
            <canvas
              ref={canvasRef}
              data-testid="studio-monitor-canvas"
              width={format.previewWidth}
              height={format.previewHeight}
              onClick={() => {
                if (!isLoadingVerses && ayahs.length > 0 && !isPreparingDownload) {
                  onTogglePlay();
                }
              }}
              className="w-full h-full object-contain cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Inline Transport & Scrubber + Organized Format/Quality/Download Bar */}
      <div className="space-y-3 pt-2.5 shrink-0">
        {/* Transport Row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentSegIdx <= 0 || isBufferingSim}
            onClick={() => onJumpToSegmentIndex(currentSegIdx - 1)}
            aria-label="Verset précédent"
            className="w-8 h-8 rounded-full studio-pill-raised disabled:opacity-40 flex items-center justify-center cursor-pointer shrink-0 transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-[#1F2421]" />
          </button>

          <button
            type="button"
            data-testid="studio-monitor-animate-btn"
            disabled={isLoadingVerses || ayahs.length === 0 || isPreparingDownload}
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Mettre en pause' : 'Lire la simulation'}
            className={`w-10 h-8 rounded-full flex items-center justify-center cursor-pointer shrink-0 transition-all disabled:opacity-45 ${
              isPlaying ? 'studio-pill-mint' : 'studio-pill-raised'
            }`}
          >
            {isBufferingSim ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#13251D]" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-current text-[#13251D]" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5 text-[#1F2421]" />
            )}
          </button>

          <button
            type="button"
            disabled={currentSegIdx >= ayahs.length - 1 || isBufferingSim}
            onClick={() => onJumpToSegmentIndex(currentSegIdx + 1)}
            aria-label="Verset suivant"
            className="w-8 h-8 rounded-full studio-pill-raised disabled:opacity-40 flex items-center justify-center cursor-pointer shrink-0 transition-all"
          >
            <ChevronRight className="w-4 h-4 text-[#1F2421]" />
          </button>

          <input
            type="range"
            aria-label="Position dans la simulation"
            min={0}
            max={Math.max(0.5, timeline.totalDurationSec)}
            step={0.01}
            value={Math.min(simTimeSec, Math.max(0.5, timeline.totalDurationSec))}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="flex-1 min-w-0 studio-range-mint cursor-pointer"
          />

          <span
            data-testid="studio-monitor-time"
            className="text-[11px] font-mono font-semibold text-[#565C58] tabular-nums whitespace-nowrap shrink-0"
          >
            {formatTimeMMSS(simTimeSec)} / {formatTimeMMSS(timeline.totalDurationSec)}
          </span>
        </div>

        {/* Inline Download Progress / Error Feedback */}
        {isPreparingDownload && (
          <div
            data-testid="studio-download-progress"
            className="flex items-center gap-2.5 pt-0.5"
          >
            <div className="flex-1 h-2.5 rounded-full studio-well-inset overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8ACBB0] to-[#5BB68F] transition-all duration-200"
                style={{ width: `${downloadState.progressPct}%` }}
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-[#1B573E] tabular-nums shrink-0">
              {downloadState.progressPct}%
            </span>
            <button
              type="button"
              onClick={onCancelDownload}
              aria-label="Annuler le téléchargement"
              className="w-7 h-7 rounded-full studio-pill-raised text-[#565C58] hover:text-[#1F2421] flex items-center justify-center cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {downloadState.status === 'error' && downloadState.errorMsg && (
          <div className="px-3 py-1.5 rounded-full bg-[#E3908D]/90 text-[#591A18] text-xs font-semibold shadow-sm truncate">
            {downloadState.errorMsg}
          </div>
        )}

        {/* Organized Format + Quality + Direct Download Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#D4D1C8]">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {/* Aspect Ratio Selector (PC Only, placed cleanly inside recessed track) */}
            {isPcMode && (
              <div
                data-testid="studio-format-selector"
                role="group"
                aria-label="Format vidéo"
                className="flex items-center gap-0.5 p-1 rounded-full studio-well-inset"
              >
                {[
                  { id: 'youtube_1080p' as VideoFormatId, aspect: '16:9' as const, icon: Monitor },
                  { id: 'shorts_916' as VideoFormatId, aspect: '9:16' as const, icon: Smartphone },
                  { id: 'square_1080' as VideoFormatId, aspect: '1:1' as const, icon: Square },
                ].map((fmt) => {
                  const active = format.aspectLabel === fmt.aspect;
                  const Icon = fmt.icon;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      data-testid={`studio-format-${fmt.id}`}
                      aria-label={`Format ${fmt.aspect}`}
                      title={`Format ${fmt.aspect}`}
                      disabled={isPreparingDownload}
                      onClick={() => onSelectFormat(fmt.id)}
                      className={`h-7 px-2.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap disabled:opacity-45 ${
                        active
                          ? 'studio-pill-mint'
                          : 'text-[#4F5551] hover:text-[#1F2421]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{fmt.aspect}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Quality Selector (4K -> 480p) */}
            <div
              data-testid="studio-quality-selector"
              role="group"
              aria-label="Qualité vidéo"
              className="flex items-center gap-0.5 p-1 rounded-full studio-well-inset"
            >
              {VIDEO_QUALITY_PRESETS.map((q) => {
                const active = qualityId === q.id;
                return (
                  <button
                    key={q.id}
                    type="button"
                    data-testid={`studio-quality-${q.id}`}
                    aria-pressed={active}
                    aria-label={`Qualité ${q.label}`}
                    disabled={isPreparingDownload}
                    onClick={() => onSelectQuality(q.id)}
                    className={`h-7 px-2.5 rounded-full text-[11px] font-bold cursor-pointer transition-all whitespace-nowrap disabled:opacity-45 ${
                      active
                        ? 'studio-pill-mint'
                        : 'text-[#4F5551] hover:text-[#1F2421]'
                    }`}
                  >
                    {q.shortLabel}
                  </button>
                );
              })}
            </div>

            <span
              data-testid="studio-active-resolution-label"
              className="hidden sm:inline text-[11px] font-mono font-medium text-[#6B716D] tabular-nums"
            >
              {format.width}×{format.height}
            </span>
          </div>

          {/* Direct Download Action */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {isDownloadReady && downloadState.canShare && (
              <button
                type="button"
                onClick={onShareVideo}
                aria-label="Partager la vidéo"
                title="Partager"
                className="w-9 h-9 rounded-full studio-pill-raised flex items-center justify-center cursor-pointer transition-all"
              >
                <Share2 className="w-4 h-4 text-[#1F2421]" />
              </button>
            )}

            {isDownloadReady && downloadState.url && downloadState.filename ? (
              <a
                data-testid="download-exported-video-link"
                href={downloadState.url}
                download={downloadState.filename}
                aria-label={`Télécharger ${downloadState.filename}`}
                onClick={onDirectLinkClicked}
                className="h-9 px-4 rounded-full studio-pill-mint font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap no-underline"
              >
                {downloadState.downloaded ? (
                  <Check className="w-4 h-4 stroke-[2.5] shrink-0" />
                ) : (
                  <Download className="w-4 h-4 shrink-0" />
                )}
                <span>
                  {downloadState.sizeBytes
                    ? formatStudioBytes(downloadState.sizeBytes)
                    : 'MP4'}
                </span>
              </a>
            ) : (
              <button
                type="button"
                data-testid="studio-create-video-btn"
                aria-label={`Télécharger la vidéo MP4 (${qualityId.toUpperCase()})`}
                disabled={isLoadingVerses || ayahs.length === 0 || isPreparingDownload}
                onClick={onStartDownload}
                className="h-9 px-4 rounded-full studio-pill-mint font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-45 whitespace-nowrap"
              >
                {isPreparingDownload ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <Download className="w-4 h-4 shrink-0" />
                )}
                <span className="hidden sm:inline">
                  {isPreparingDownload ? `${downloadState.progressPct}%` : 'Télécharger'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
