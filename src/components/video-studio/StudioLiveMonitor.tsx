import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Maximize2,
  Minimize2,
  Monitor,
  Pause,
  Play,
  Share2,
  Smartphone,
  Square,
  Tablet,
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
  getDeviceSimulationMeta,
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
  bgBlackBackdrop: boolean;
  bgBrightness: number;
  bgSharpness: number;
  bgContrast: number;
  textShadowBoost: boolean;
  arabicTextColor: string | null;
  phoneticsTextColor: string | null;
  frenchTextColor: string | null;
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
  bgBlackBackdrop,
  bgBrightness,
  bgSharpness,
  bgContrast,
  textShadowBoost,
  arabicTextColor,
  phoneticsTextColor,
  frenchTextColor,
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
  const [isFullscreenSim, setIsFullscreenSim] = useState(false);

  useEffect(() => {
    if (!isFullscreenSim) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreenSim(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreenSim]);

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
      bgBlackBackdrop,
      bgBrightness,
      bgSharpness,
      bgContrast,
      textShadowBoost,
      arabicTextColor,
      phoneticsTextColor,
      frenchTextColor,
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
      bgBlackBackdrop,
      bgBrightness,
      bgSharpness,
      bgContrast,
      textShadowBoost,
      arabicTextColor,
      phoneticsTextColor,
      frenchTextColor,
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
  }, [ayahs, renderOpts, fontsReadyTick, isFullscreenSim]);

  useEffect(() => {
    onLayoutReady?.({ layout, renderOpts });
  }, [layout, renderOpts]);

  // Auto-render canvas frame immediately whenever verses/style/time/fullscreen mode change
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
  }, [
    layout,
    timeline,
    simTimeSec,
    renderOpts,
    bgReadyTick,
    format.previewWidth,
    format.previewHeight,
    isFullscreenSim,
  ]);

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
  }, [simStatus, activeMediaKind, layout, timeline, simTimeSec, renderOpts, isFullscreenSim]);

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

  const activeSimMeta = useMemo(
    () => getDeviceSimulationMeta(format.aspectLabel),
    [format.aspectLabel]
  );

  const isPlaying = simStatus === 'playing';
  const isBufferingSim = simStatus === 'loading';
  const isPreparingDownload = downloadState.status === 'preparing';
  const isDownloadReady = downloadState.status === 'ready' && Boolean(downloadState.url);

  const renderLiveCanvasElement = () => (
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
  );

  const renderFullscreenDeviceStage = () => {
    if (activeSimMeta.deviceType === 'pc') {
      return (
        <div
          data-testid="studio-sim-device-pc"
          className="flex flex-col items-center justify-center w-full max-w-[min(88vw,calc((100dvh-250px)*16/9))]"
        >
          <div className="w-full p-2 sm:p-3 rounded-2xl sm:rounded-[20px] bg-gradient-to-b from-[#262B28] to-[#111412] ring-1 ring-white/20 shadow-[0_22px_55px_rgba(17,22,19,0.42)] flex flex-col items-center">
            <div className="flex items-center gap-1.5 mb-1.5 shrink-0" aria-hidden="true">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4B534E] ring-1 ring-white/15" />
            </div>
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
              {renderLiveCanvasElement()}
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-center shrink-0" aria-hidden="true">
            <div className="w-14 h-3.5 bg-gradient-to-b from-[#B4B1A8] to-[#949188] shadow-inner" />
            <div className="w-40 h-2 rounded-full bg-gradient-to-b from-[#D2CFC7] to-[#A6A39B] shadow-[0_6px_14px_rgba(24,28,26,0.22)]" />
          </div>
        </div>
      );
    }

    if (activeSimMeta.deviceType === 'tablet') {
      return (
        <div
          data-testid="studio-sim-device-tablet"
          className="p-2.5 sm:p-3.5 rounded-[1.7rem] sm:rounded-[2.1rem] bg-gradient-to-b from-[#262B28] to-[#111412] ring-1 ring-white/20 shadow-[0_22px_55px_rgba(17,22,19,0.42)] flex flex-col items-center"
        >
          <div className="flex items-center justify-center mb-1.5 shrink-0" aria-hidden="true">
            <span className="w-2 h-2 rounded-full bg-[#444B47] ring-1 ring-white/15" />
          </div>
          <div className="relative w-[min(82vw,calc(100dvh-240px),680px)] aspect-square rounded-[1.05rem] sm:rounded-[1.35rem] overflow-hidden bg-black flex items-center justify-center">
            {renderLiveCanvasElement()}
          </div>
          <div className="w-14 h-1 rounded-full bg-white/25 mt-2 shrink-0" aria-hidden="true" />
        </div>
      );
    }

    return (
      <div
        data-testid="studio-sim-device-phone"
        className="p-2.5 sm:p-3 rounded-[2.1rem] sm:rounded-[2.5rem] bg-gradient-to-b from-[#262B28] to-[#0E100F] ring-1 ring-white/25 shadow-[0_24px_60px_rgba(17,22,19,0.46)] flex flex-col items-center"
      >
        <div
          className="w-16 sm:w-20 h-3 rounded-full bg-black/95 border border-white/10 mb-1.5 flex items-center justify-end pr-2 shrink-0"
          aria-hidden="true"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#2B3D36]" />
        </div>
        <div className="relative h-[min(calc(100dvh-235px),760px)] aspect-[9/16] max-w-[82vw] rounded-[1.5rem] sm:rounded-[1.8rem] overflow-hidden bg-black flex items-center justify-center">
          {renderLiveCanvasElement()}
        </div>
        <div className="w-18 h-1 rounded-full bg-white/30 mt-2 shrink-0" aria-hidden="true" />
      </div>
    );
  };

  const renderTransportControls = (compactFullscreen = false) => (
    <div className={`flex items-center gap-2 ${compactFullscreen ? 'flex-1 min-w-0' : ''}`}>
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
        aria-label={isPlaying ? 'Mettre en pause' : 'Lire la vidéo'}
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
        aria-label="Position de lecture"
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

      <button
        type="button"
        data-testid="studio-fullscreen-sim-btn"
        onClick={() => setIsFullscreenSim((v) => !v)}
        aria-label={
          isFullscreenSim ? 'Quitter le plein écran' : 'Voir la vidéo en grand'
        }
        title={
          isFullscreenSim
            ? 'Quitter le plein écran'
            : 'Voir en grand (PC / Téléphone / Tablette)'
        }
        className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shrink-0 transition-all ${
          isFullscreenSim
            ? 'studio-pill-mint'
            : 'studio-pill-raised text-[#1F2421]'
        }`}
      >
        {isFullscreenSim ? (
          <Minimize2 className="w-4 h-4 text-[#13251D]" />
        ) : (
          <Maximize2 className="w-4 h-4 text-[#1F2421]" />
        )}
      </button>
    </div>
  );

  const renderQualityAndDownloadControls = (compactFullscreen = false) => (
    <div
      className={
        compactFullscreen
          ? 'flex items-center justify-between md:justify-end gap-2 flex-wrap md:flex-nowrap shrink-0'
          : 'flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#D4D1C8]'
      }
    >
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        {isPcMode && !isFullscreenSim && (
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
                    active ? 'studio-pill-mint' : 'text-[#4F5551] hover:text-[#1F2421]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{fmt.aspect}</span>
                </button>
              );
            })}
          </div>
        )}

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
                  active ? 'studio-pill-mint' : 'text-[#4F5551] hover:text-[#1F2421]'
                }`}
              >
                {q.shortLabel}
              </button>
            );
          })}
        </div>

        <span
          data-testid="studio-active-resolution-label"
          className={`text-[11px] font-mono font-medium text-[#6B716D] tabular-nums ${
            compactFullscreen ? 'hidden xl:inline' : 'hidden sm:inline'
          }`}
        >
          {format.width}×{format.height}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-auto md:ml-0">
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
  );

  return (
    <aside
      data-testid="studio-desktop-916-preview"
      data-fullscreen-sim={isFullscreenSim ? 'true' : 'false'}
      className={
        isFullscreenSim
          ? 'fixed inset-0 z-[10070] studio-paper-canvas flex flex-col justify-between gap-2 sm:gap-3 px-3.5 py-2.5 sm:px-8 sm:py-3.5 overflow-hidden'
          : 'flex flex-col justify-between min-h-0 px-3.5 py-2.5 md:p-5 studio-surface-raised md:studio-surface-stacked md:rounded-3xl border-b border-[#CECBC2] md:border-none shrink-0 md:shrink'
      }
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

      {/* Fullscreen Header Bar (Same-Page Overlay) */}
      {isFullscreenSim && (
        <div
          data-testid="studio-fullscreen-header"
          className="shrink-0 flex flex-wrap items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-full studio-pill-mint flex items-center justify-center shrink-0">
              {activeSimMeta.deviceType === 'pc' ? (
                <Monitor className="w-4 h-4 text-[#13251D]" />
              ) : activeSimMeta.deviceType === 'tablet' ? (
                <Tablet className="w-4 h-4 text-[#13251D]" />
              ) : (
                <Smartphone className="w-4 h-4 text-[#13251D]" />
              )}
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#1F2421] truncate">
              {activeSimMeta.label}
            </span>
          </div>

          <div
            data-testid="studio-fullscreen-device-switcher"
            role="group"
            aria-label="Format d’écran"
            className="flex items-center gap-1 p-1 rounded-full studio-well-inset"
          >
            {[
              { id: 'youtube_1080p' as VideoFormatId, aspect: '16:9' as const, label: 'PC 16:9', icon: Monitor },
              { id: 'shorts_916' as VideoFormatId, aspect: '9:16' as const, label: 'Téléphone 9:16', icon: Smartphone },
              { id: 'square_1080' as VideoFormatId, aspect: '1:1' as const, label: 'Tablette 1:1', icon: Tablet },
            ].map((dev) => {
              const active = format.aspectLabel === dev.aspect;
              const DevIcon = dev.icon;
              return (
                <button
                  key={dev.id}
                  type="button"
                  data-testid={`studio-sim-switch-${dev.aspect}`}
                  disabled={isPreparingDownload}
                  onClick={() => onSelectFormat(dev.id)}
                  className={`h-8 px-3 rounded-full text-[11px] sm:text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap disabled:opacity-45 ${
                    active ? 'studio-pill-mint' : 'text-[#4F5551] hover:text-[#1F2421]'
                  }`}
                >
                  <DevIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{dev.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            data-testid="studio-fullscreen-close-btn"
            onClick={() => setIsFullscreenSim(false)}
            aria-label="Quitter le plein écran"
            className="h-9 px-3.5 rounded-full studio-pill-raised text-xs font-semibold text-[#1F2421] inline-flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Réduire</span>
          </button>
        </div>
      )}

      {/* Preview Stage */}
      <div className="flex-1 min-h-0 flex items-center justify-center py-2 sm:py-3 overflow-hidden">
        {isFullscreenSim ? (
          renderFullscreenDeviceStage()
        ) : (
          <div
            className={`relative ${aspectBoxClass} p-1 rounded-2xl bg-[#D1CFC7] shadow-[inset_0_2px_6px_rgba(24,28,26,0.18),0_4px_12px_rgba(24,28,26,0.08)] flex items-center justify-center`}
          >
            <div className="relative w-full h-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
              {renderLiveCanvasElement()}
            </div>
          </div>
        )}
      </div>

      {/* Transport & Scrubber + Format/Quality/Download Bar */}
      <div
        data-testid="studio-monitor-bottom-bar"
        className={
          isFullscreenSim
            ? 'w-full max-w-5xl mx-auto studio-surface-raised rounded-2xl px-3.5 py-2 space-y-2 shrink-0'
            : 'space-y-3 pt-2.5 shrink-0'
        }
      >
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

        {isFullscreenSim ? (
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
            {renderTransportControls(true)}
            <div className="hidden md:block w-px h-6 bg-[#CFCBC2] shrink-0" aria-hidden="true" />
            {renderQualityAndDownloadControls(true)}
          </div>
        ) : (
          <>
            {renderTransportControls(false)}
            {renderQualityAndDownloadControls(false)}
          </>
        )}
      </div>
    </aside>
  );
};
