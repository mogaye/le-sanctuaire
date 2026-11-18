import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Check } from 'lucide-react';
import {
  ContinuousTimeline,
  StudioAyahItem,
  VideoFormatPreset,
  VideoTemplateId,
  formatTimeMMSS,
} from '../../utils/mobileVideoStudioUtils';
import {
  MANDATORY_WATERMARK_BRAND,
  VideoCanvasRenderOptions,
  loadCanvasBackgroundImage,
  precomputeVideoCanvasLayout,
  renderVideoCanvasFrame,
} from '../../utils/canvasVideoRenderer';

interface StudioLiveMonitorProps {
  format: VideoFormatPreset;
  ayahs: StudioAyahItem[];
  timeline: ContinuousTimeline;
  surahName: string;
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  selectedSurahsCount?: number;
  reciterName: string;
  activeMediaKind: 'video' | 'image' | 'solid';
  activeMediaUrl: string | null;
  activeMediaName: string;
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
}

export const StudioLiveMonitor: React.FC<StudioLiveMonitorProps> = ({
  format,
  ayahs,
  timeline,
  surahName,
  surahNumber,
  startAyah,
  endAyah,
  selectedSurahsCount = 1,
  reciterName,
  activeMediaKind,
  activeMediaUrl,
  activeMediaName,
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
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);

  const [bgReadyTick, setBgReadyTick] = useState(0);
  const [selectedVerseIdx, setSelectedVerseIdx] = useState(0);
  const [isAnimatingPreview, setIsAnimatingPreview] = useState(false);
  const [previewSec, setPreviewSec] = useState(0);

  // Snap preview to opening frame when sequence structure resets to a different primary surah/start
  useEffect(() => {
    setSelectedVerseIdx(0);
    setIsAnimatingPreview(false);
    const firstSeg = timeline.segments[0];
    setPreviewSec(firstSeg ? firstSeg.startSec + Math.min(1.0, firstSeg.durationSec * 0.35) : 0);
  }, [surahNumber, startAyah]);

  // Clamp selected verse index when total sequence shrinks
  useEffect(() => {
    setSelectedVerseIdx((prev) => {
      const next = Math.min(Math.max(0, prev), Math.max(0, ayahs.length - 1));
      const seg = timeline.segments[next];
      if (seg) {
        setPreviewSec(seg.startSec + Math.min(1.0, seg.durationSec * 0.35));
      }
      return next;
    });
  }, [ayahs.length, endAyah, selectedSurahsCount]);

  // Load background image or video for true WYSIWYG canvas preview
  useEffect(() => {
    let active = true;
    bgImageRef.current = null;
    if (bgVideoRef.current) {
      try {
        bgVideoRef.current.pause();
        bgVideoRef.current.removeAttribute('src');
        bgVideoRef.current.load();
      } catch {}
      bgVideoRef.current = null;
    }

    if (activeMediaKind === 'image' && activeMediaUrl) {
      loadCanvasBackgroundImage(activeMediaUrl).then((img) => {
        if (!active) return;
        bgImageRef.current = img;
        setBgReadyTick((t) => t + 1);
      });
    } else if (activeMediaKind === 'video' && activeMediaUrl) {
      const vid = document.createElement('video');
      vid.src = activeMediaUrl;
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.crossOrigin = 'anonymous';
      vid.preload = 'auto';
      vid.onloadeddata = () => {
        if (!active) return;
        bgVideoRef.current = vid;
        vid.play().catch(() => {});
        setBgReadyTick((t) => t + 1);
      };
      vid.load();
    } else {
      setBgReadyTick((t) => t + 1);
    }

    return () => {
      active = false;
      if (bgVideoRef.current) {
        try {
          bgVideoRef.current.pause();
          bgVideoRef.current.removeAttribute('src');
          bgVideoRef.current.load();
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

  // Precompute layout whenever verses, format, or template changes
  const layout = useMemo(() => {
    const canvas = canvasRef.current;
    if (!canvas || ayahs.length === 0) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return precomputeVideoCanvasLayout(ctx, ayahs, renderOpts);
  }, [ayahs, renderOpts]);

  // Draw current frame whenever layout, clock, or options change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const optsWithMedia: VideoCanvasRenderOptions = {
      ...renderOpts,
      bgImage: bgImageRef.current,
      bgVideo: bgVideoRef.current,
    };
    renderVideoCanvasFrame(ctx, layout, timeline, previewSec, optsWithMedia);
  }, [layout, timeline, previewSec, renderOpts, bgReadyTick]);

  // Animated silent preview loop when Play Preview is toggled OR when background video is looping
  useEffect(() => {
    if (!isAnimatingPreview && activeMediaKind !== 'video') return;
    let rafId = 0;
    let lastTs = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastTs) / 1000);
      lastTs = now;
      if (isAnimatingPreview && timeline.totalDurationSec > 0) {
        setPreviewSec((prev) => {
          const next = prev + dt;
          return next >= timeline.totalDurationSec ? 0 : next;
        });
      } else if (activeMediaKind === 'video' && canvasRef.current && layout) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          renderVideoCanvasFrame(ctx, layout, timeline, previewSec, {
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
  }, [isAnimatingPreview, activeMediaKind, timeline, layout, renderOpts, previewSec]);

  const jumpToVerse = (nextIdx: number) => {
    if (ayahs.length === 0) return;
    const clamped = Math.max(0, Math.min(ayahs.length - 1, nextIdx));
    setSelectedVerseIdx(clamped);
    setIsAnimatingPreview(false);
    const seg = timeline.segments[clamped];
    if (seg) {
      setPreviewSec(seg.startSec + Math.min(1.2, seg.durationSec * 0.35));
    }
  };

  const aspectClass =
    format.aspectLabel === '16:9'
      ? 'aspect-video w-full max-w-[580px]'
      : format.aspectLabel === '1:1'
      ? 'aspect-square h-full max-h-[430px]'
      : 'aspect-[9/16] h-full max-h-[460px]';

  const activeItem = ayahs[selectedVerseIdx];
  const verseStepLabel = activeItem
    ? `${selectedSurahsCount > 1 && activeItem.surahName ? `${activeItem.surahName} · ` : ''}${
        activeItem.isBismillah ? 'Bismillah' : `Verset ${activeItem.num}`
      }`
    : `Verset ${startAyah}`;

  return (
    <aside
      data-testid="studio-desktop-916-preview"
      className="hidden md:flex flex-col justify-between min-h-0 p-5 rounded-2xl bg-[#0A110E] border border-white/[0.08]"
    >
      {/* Monitor Top Spec Bar */}
      <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-white/[0.08] shrink-0">
        <div className="min-w-0 space-y-0.5">
          <div className="text-[13px] font-bold text-white tracking-tight flex items-center gap-2">
            <span>Aperçu en direct</span>
            <span className="text-neutral-500" aria-hidden="true">·</span>
            <span className="text-xs font-mono text-amber-300 tabular-nums">
              {format.aspectLabel} ({format.width}×{format.height})
            </span>
          </div>
          <div className="text-xs text-neutral-400 truncate flex items-center gap-1.5 tabular-nums">
            <span className="truncate">{activeMediaName}</span>
            <span aria-hidden="true">·</span>
            <span>{selectedSurahsCount} sourate{selectedSurahsCount > 1 ? 's' : ''}</span>
            <span aria-hidden="true">·</span>
            <span>Durée {formatTimeMMSS(timeline.totalDurationSec)}</span>
          </div>
        </div>

        <button
          type="button"
          data-testid="studio-monitor-animate-btn"
          onClick={() => setIsAnimatingPreview((v) => !v)}
          className={`h-9 px-3.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition duration-150 ${
            isAnimatingPreview
              ? 'bg-amber-400 text-neutral-950 border-amber-300'
              : 'bg-white/[0.05] hover:bg-white/[0.1] text-neutral-100 border-white/10'
          }`}
        >
          {isAnimatingPreview ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current text-amber-300" />
              <span>Animer</span>
            </>
          )}
        </button>
      </div>

      {/* Centered Live Canvas Stage */}
      <div className="flex-1 min-h-0 flex items-center justify-center py-4">
        <div
          className={`relative ${aspectClass} rounded-xl overflow-hidden border border-white/15 bg-black shadow-[0_24px_60px_rgba(0,0,0,0.7)] flex items-center justify-center`}
        >
          <canvas
            ref={canvasRef}
            data-testid="studio-monitor-canvas"
            width={format.previewWidth}
            height={format.previewHeight}
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Interactive Verse Scrubber + Mandatory Watermark Info */}
      <div className="space-y-3 pt-3.5 border-t border-white/[0.08] shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={() => jumpToVerse(selectedVerseIdx - 1)}
              disabled={selectedVerseIdx <= 0}
              aria-label="Séquence précédente dans l'aperçu"
              className="w-9 h-9 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 flex items-center justify-center text-neutral-200 disabled:opacity-35 cursor-pointer shrink-0 transition duration-150"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span
              data-testid="studio-monitor-verse-label"
              className="text-xs font-semibold text-neutral-200 px-2 tabular-nums truncate"
            >
              {verseStepLabel} ({selectedVerseIdx + 1}/{Math.max(1, ayahs.length)})
            </span>
            <button
              type="button"
              onClick={() => jumpToVerse(selectedVerseIdx + 1)}
              disabled={selectedVerseIdx >= ayahs.length - 1}
              aria-label="Séquence suivante dans l'aperçu"
              className="w-9 h-9 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 flex items-center justify-center text-neutral-200 disabled:opacity-35 cursor-pointer shrink-0 transition duration-150"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-xs font-mono text-amber-300 tabular-nums whitespace-nowrap shrink-0">
            {formatTimeMMSS(previewSec)} / {formatTimeMMSS(timeline.totalDurationSec)}
          </span>
        </div>

        <div
          data-testid="studio-mandatory-watermark-notice"
          className="flex items-center justify-between gap-2 text-xs text-emerald-200/90 pt-1"
        >
          <span className="inline-flex items-center gap-1.5 truncate">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">
              Signature « {MANDATORY_WATERMARK_BRAND} » incluse en pied de vidéo
            </span>
          </span>
          <span className="text-[11px] font-medium text-emerald-300 shrink-0">
            Actif
          </span>
        </div>
      </div>
    </aside>
  );
};

