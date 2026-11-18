import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  X,
  Film,
  BookOpen,
  Headphones,
  Image as ImageIcon,
  Sparkles,
  Check,
  Search,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Loader2,
  Upload,
  Video,
  Trash2,
  Plus,
  Layers,
} from 'lucide-react';
import { ALL_114_SURAHS, CompleteSurahItem } from '../data/quranSurahs';
import { RECITERS } from '../data/islamicData';
import { Reciter } from '../types';
import {
  MOBILE_VERTICAL_BACKGROUNDS,
  STUDIO_4K_BACKGROUNDS,
  STUDIO_SOLID_BACKGROUNDS,
} from '../data/mobileCinematicBackgrounds';
import {
  StudioAyahItem,
  StudioSurahSelection,
  VIDEO_FORMAT_PRESETS,
  VIDEO_QUALITY_PRESETS,
  VIDEO_TEMPLATE_PRESETS,
  VideoFormatId,
  VideoQualityId,
  VideoTemplateId,
  buildContinuousTimeline,
  buildMultiSurahVideoSequence,
  buildStudioExportFilename,
  extendSequenceToTargetDuration,
  formatTimeMMSS,
  getVideoFormatPreset,
  inferVideoQualityFromDimensions,
  normalizeVerseRange,
  resolveFormatDimensionsForQuality,
  resolveVideoDownloadLinkState,
  shouldStageVideoDownload,
} from '../utils/mobileVideoStudioUtils';
import {
  DecodedVerseBuffer,
  LoadedStudioSurah,
  ScheduledPlaybackHandle,
  attachAudioStreamKeepalive,
  decodeVerseAudioSequence,
  fetchSurahVersesForStudio,
  scheduleContinuousAudioSequence,
} from '../utils/continuousAudioEngine';
import {
  VideoCanvasRenderOptions,
  loadCanvasBackgroundImage,
  precomputeVideoCanvasLayout,
  renderVideoCanvasFrame,
} from '../utils/canvasVideoRenderer';
import { exportQuranVideoToMp4 } from '../utils/mp4VideoExporter';
import { useWakeLock } from '../hooks/useWakeLock';
import { useMobileDevice } from '../hooks/useMobileDevice';
import {
  deleteStudioMediaItem,
  formatStudioBytes,
  loadStudioBgPreferences,
  loadStudioMediaLibrary,
  saveStudioBgPreferences,
  saveStudioMediaFile,
  STUDIO_TEXT_COLOR_SWATCHES,
  StudioTextColorTarget,
  clampBackgroundAdjustment,
} from '../utils/studioMediaLibrary';
import { StudioTemplateGrid } from './video-studio/StudioTemplateGrid';
import {
  StudioDirectDownloadState,
  StudioLiveMonitor,
} from './video-studio/StudioLiveMonitor';

interface MobileVerseVideoStudioProps {
  isOpen: boolean;
  onClose: () => void;
  initialSurahNum: number;
  initialStartAyah?: number;
  initialReciter: Reciter;
  initialBgId?: string;
  onSyncReciter?: (reciter: Reciter) => void;
}

interface CustomBackgroundMedia {
  id: string;
  name: string;
  kind: 'image' | 'video';
  url: string;
  thumbUrl?: string;
  sizeBytes?: number;
  durationSec?: number;
  syncedToServer?: boolean;
}

type StudioTab = 'verses_audio' | 'style_bg';

const MAX_STAGE_DOWNLOAD_BYTES = 1500 * 1024 * 1024;

function makeSelectionId(surahNumber: number): string {
  return `s-${surahNumber}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function getSurahMeta(surahNumber: number): CompleteSurahItem {
  return ALL_114_SURAHS.find((s) => s.number === surahNumber) || ALL_114_SURAHS[0];
}

function loadCanvasBackgroundVideo(url: string): Promise<HTMLVideoElement | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    video.style.position = 'fixed';
    video.style.left = '0';
    video.style.bottom = '0';
    video.style.width = '16px';
    video.style.height = '16px';
    video.style.opacity = '0.01';
    video.style.pointerEvents = 'none';
    video.style.zIndex = '-1';
    document.body.appendChild(video);

    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (!ok) {
        try {
          video.pause();
          video.removeAttribute('src');
          video.load();
          video.remove();
        } catch {}
        resolve(null);
        return;
      }
      video.play().catch(() => {});
      resolve(video);
    };

    const timeout = setTimeout(() => finish(video.readyState >= 2), 60000);
    video.onloadeddata = () => finish(true);
    video.oncanplay = () => finish(true);
    video.onerror = () => finish(false);
    video.load();
    if (video.readyState >= 2) {
      finish(true);
    }
  });
}

function isRunningInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

async function stageVideoBlobOnServer(
  blob: Blob,
  filename: string,
  signal?: AbortSignal
): Promise<string | null> {
  if (!blob || blob.size === 0 || blob.size > MAX_STAGE_DOWNLOAD_BYTES) {
    return null;
  }
  const timeoutMs = Math.min(
    60_000,
    Math.max(15_000, Math.round(blob.size / (5 * 1024 * 1024)) * 1000)
  );
  const localCtrl = new AbortController();
  const timer = setTimeout(() => localCtrl.abort(), timeoutMs);
  const onOuterAbort = () => localCtrl.abort();
  signal?.addEventListener('abort', onOuterAbort, { once: true });

  try {
    const res = await fetch('/api/video/stage-download', {
      method: 'POST',
      headers: {
        'Content-Type': blob.type || 'video/mp4',
        'x-download-filename': encodeURIComponent(filename),
        'x-download-mime': blob.type || 'video/mp4',
      },
      body: blob,
      signal: localCtrl.signal,
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return typeof json?.downloadUrl === 'string' ? json.downloadUrl : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onOuterAbort);
  }
}

function triggerFileDownload(url: string, filename: string) {
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        a.remove();
      } catch {}
    }, 1000);
  } catch {}
}

export const MobileVerseVideoStudio: React.FC<MobileVerseVideoStudioProps> = ({
  isOpen,
  onClose,
  initialSurahNum,
  initialStartAyah = 1,
  initialReciter,
  initialBgId = 'mobile_noir_minimal',
  onSyncReciter,
}) => {
  const { isMobile, width: viewportWidth } = useMobileDevice();
  const isPcMode = !isMobile && viewportWidth >= 768;

  // Format (PC-only aspect selectable; Mobile locked to 9:16) & Quality (4K..480p)
  const [videoFormatId, setVideoFormatId] = useState<VideoFormatId>(() => {
    const prefs = loadStudioBgPreferences();
    if (
      prefs.videoFormatId &&
      VIDEO_FORMAT_PRESETS.some((f) => f.id === prefs.videoFormatId)
    ) {
      return prefs.videoFormatId === 'youtube_720p'
        ? 'youtube_1080p'
        : (prefs.videoFormatId as VideoFormatId);
    }
    return 'youtube_1080p';
  });

  const [videoQualityId, setVideoQualityId] = useState<VideoQualityId>(() => {
    const prefs = loadStudioBgPreferences();
    if (
      prefs.videoQualityId &&
      VIDEO_QUALITY_PRESETS.some((q) => q.id === prefs.videoQualityId)
    ) {
      return prefs.videoQualityId as VideoQualityId;
    }
    if (prefs.videoFormatId === 'youtube_720p') {
      return '720p';
    }
    return '1080p';
  });

  const baseAspectFormat = useMemo(
    () => getVideoFormatPreset(videoFormatId, !isPcMode),
    [videoFormatId, isPcMode]
  );

  const activeFormat = useMemo(
    () => resolveFormatDimensionsForQuality(baseAspectFormat, videoQualityId),
    [baseAspectFormat, videoQualityId]
  );

  const [activeTab, setActiveTab] = useState<StudioTab>('verses_audio');

  // Multi-Surah Playlist State
  const [selectedSurahs, setSelectedSurahs] = useState<StudioSurahSelection[]>(() => {
    const num = initialSurahNum || 1;
    const meta = getSurahMeta(num);
    const start = Math.max(1, Math.min(meta.numberOfAyahs, initialStartAyah || 1));
    const end =
      start === 1 && meta.numberOfAyahs <= 15
        ? meta.numberOfAyahs
        : Math.min(meta.numberOfAyahs, start + 4);
    return [{ id: makeSelectionId(num), surahNumber: num, startAyah: start, endAyah: end }];
  });
  const [loadedSurahs, setLoadedSurahs] = useState<Record<number, LoadedStudioSurah>>({});
  const [loadingSurahNums, setLoadingSurahNums] = useState<number[]>([]);
  const [reciterId, setReciterId] = useState<string>(initialReciter?.id || 'mishary');

  // Background Selection + Persistent Media Library
  const [customMedia, setCustomMedia] = useState<CustomBackgroundMedia[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState<boolean>(false);
  const [isSavingMedia, setIsSavingMedia] = useState<boolean>(false);
  const customMediaRef = useRef<CustomBackgroundMedia[]>([]);
  customMediaRef.current = customMedia;

  const [bgId, setBgId] = useState<string>(() => {
    const prefs = loadStudioBgPreferences();
    if (prefs.bgId) return prefs.bgId;
    if (
      STUDIO_SOLID_BACKGROUNDS.some((s) => s.id === initialBgId) ||
      MOBILE_VERTICAL_BACKGROUNDS.some((b) => b.id === initialBgId) ||
      STUDIO_4K_BACKGROUNDS.some((b) => b.id === initialBgId)
    ) {
      return initialBgId;
    }
    return 'mobile_noir_minimal';
  });
  const [bgFilter, setBgFilter] = useState<'all' | 'custom' | 'noir' | 'blanc' | '4k'>('all');
  const [textColorOverride, setTextColorOverride] = useState<'auto' | 'light' | 'dark'>(() => {
    const prefs = loadStudioBgPreferences();
    return prefs.textColorOverride || 'auto';
  });
  const [bgVeilOpacity, setBgVeilOpacity] = useState<number>(() => {
    const prefs = loadStudioBgPreferences();
    return typeof prefs.bgVeilOpacity === 'number' ? prefs.bgVeilOpacity : 0.25;
  });
  const [bgBlackBackdrop, setBgBlackBackdrop] = useState<boolean>(() => {
    const prefs = loadStudioBgPreferences();
    return Boolean(prefs.bgBlackBackdrop);
  });
  const [textShadowBoost, setTextShadowBoost] = useState<boolean>(() => {
    const prefs = loadStudioBgPreferences();
    return typeof prefs.textShadowBoost === 'boolean' ? prefs.textShadowBoost : true;
  });
  const [colorTarget, setColorTarget] = useState<StudioTextColorTarget>(() => {
    const prefs = loadStudioBgPreferences();
    return prefs.colorTarget || 'all';
  });
  const [arabicTextColor, setArabicTextColor] = useState<string | null>(() => {
    const prefs = loadStudioBgPreferences();
    return typeof prefs.arabicTextColor === 'string' ? prefs.arabicTextColor : null;
  });
  const [phoneticsTextColor, setPhoneticsTextColor] = useState<string | null>(() => {
    const prefs = loadStudioBgPreferences();
    return typeof prefs.phoneticsTextColor === 'string' ? prefs.phoneticsTextColor : null;
  });
  const [frenchTextColor, setFrenchTextColor] = useState<string | null>(() => {
    const prefs = loadStudioBgPreferences();
    return typeof prefs.frenchTextColor === 'string' ? prefs.frenchTextColor : null;
  });
  const [bgBrightness, setBgBrightness] = useState<number>(() =>
    clampBackgroundAdjustment(loadStudioBgPreferences().bgBrightness, 50)
  );
  const [bgSharpness, setBgSharpness] = useState<number>(() =>
    clampBackgroundAdjustment(loadStudioBgPreferences().bgSharpness, 50)
  );
  const [bgContrast, setBgContrast] = useState<number>(() =>
    clampBackgroundAdjustment(loadStudioBgPreferences().bgContrast, 50)
  );
  const [bgImageMotion, setBgImageMotion] = useState<boolean>(() => {
    const prefs = loadStudioBgPreferences();
    return Boolean(prefs.bgImageMotion);
  });

  const [showArabic, setShowArabic] = useState<boolean>(true);
  const [useTajweed, setUseTajweed] = useState<boolean>(true);
  const [showPhonetics, setShowPhonetics] = useState<boolean>(true);
  const [showFrench, setShowFrench] = useState<boolean>(true);
  const [showSurahHeader, setShowSurahHeader] = useState<boolean>(true);
  const [textScale, setTextScale] = useState<'compact' | 'standard' | 'grand'>('standard');
  const [flowMode, setFlowMode] = useState<VideoTemplateId>(() => {
    const prefs = loadStudioBgPreferences();
    if (
      prefs.flowMode &&
      VIDEO_TEMPLATE_PRESETS.some((t) => t.id === prefs.flowMode)
    ) {
      return prefs.flowMode as VideoTemplateId;
    }
    return 'teleprompter';
  });
  const [paceMultiplier, setPaceMultiplier] = useState<number>(1.0);
  const [durationMode, setDurationMode] = useState<'verses' | 'match_video'>('verses');

  // Surah Picker Overlay
  const [isSurahPickerOpen, setIsSurahPickerOpen] = useState<boolean>(false);
  const [surahQuery, setSurahQuery] = useState<string>('');
  const [draftPickerSurahNums, setDraftPickerSurahNums] = useState<number[]>([]);

  // Inline Simulation Playback State
  const [simStatus, setSimStatus] = useState<
    'idle' | 'loading' | 'playing' | 'paused' | 'ended'
  >('idle');
  const [simTimeSec, setSimTimeSec] = useState<number>(0);
  const [measuredDurations, setMeasuredDurations] = useState<Array<number | undefined>>([]);

  // In-Place Direct Download State
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'preparing' | 'ready' | 'error'>(
    'idle'
  );
  const [downloadProgressPct, setDownloadProgressPct] = useState<number>(0);
  const [downloadStatusLabel, setDownloadStatusLabel] = useState<string>('');
  const [downloadErrorMsg, setDownloadErrorMsg] = useState<string | null>(null);
  const [preparedDownload, setPreparedDownload] = useState<{
    blob: Blob;
    objectUrl: string;
    stagedUrl: string | null;
    filename: string;
    sizeBytes: number;
    downloaded: boolean;
  } | null>(null);

  // Refs
  const wasOpenRef = useRef<boolean>(false);
  const loadedSurahsRef = useRef<Record<number, LoadedStudioSurah>>({});
  loadedSurahsRef.current = loadedSurahs;
  const preparedDownloadRef = useRef(preparedDownload);
  preparedDownloadRef.current = preparedDownload;

  const audioCtxRef = useRef<AudioContext | null>(null);
  const decodedBuffersRef = useRef<DecodedVerseBuffer[]>([]);
  const decodedSimKeyRef = useRef<string>('');
  const playbackHandleRef = useRef<ScheduledPlaybackHandle | null>(null);
  const keepaliveRef = useRef<ReturnType<typeof attachAudioStreamKeepalive> | null>(null);
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const simLayoutRef = useRef<ReturnType<typeof precomputeVideoCanvasLayout> | null>(null);
  const simRenderOptsRef = useRef<VideoCanvasRenderOptions | null>(null);
  const simMediaRef = useRef<{
    bgImage: HTMLImageElement | null;
    bgVideo: HTMLVideoElement | null;
  }>({ bgImage: null, bgVideo: null });
  const exportBgVideoRef = useRef<HTMLVideoElement | null>(null);
  const simTimelineRef = useRef<ReturnType<typeof buildContinuousTimeline> | null>(null);
  const playbackStartCtxTimeRef = useRef<number>(0);
  const playbackStartOffsetRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const simAbortRef = useRef<AbortController | null>(null);
  const downloadAbortRef = useRef<AbortController | null>(null);
  const mediaFileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useWakeLock(isOpen && (simStatus === 'playing' || downloadStatus === 'preparing'));

  // Load persistent media library when studio opens
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setIsLoadingLibrary(true);
    loadStudioMediaLibrary()
      .then((items) => {
        if (!active) {
          for (const it of items) {
            try {
              URL.revokeObjectURL(it.url);
              if (it.thumbUrl) URL.revokeObjectURL(it.thumbUrl);
            } catch {}
          }
          return;
        }
        for (const prev of customMediaRef.current) {
          try {
            URL.revokeObjectURL(prev.url);
            if (prev.thumbUrl) URL.revokeObjectURL(prev.thumbUrl);
          } catch {}
        }
        setCustomMedia(items);
        const prefs = loadStudioBgPreferences();
        if (prefs.bgId) {
          const matchedCustom = items.find((m) => m.id === prefs.bgId);
          const existsInBuiltIn =
            STUDIO_SOLID_BACKGROUNDS.some((s) => s.id === prefs.bgId) ||
            MOBILE_VERTICAL_BACKGROUNDS.some((b) => b.id === prefs.bgId) ||
            STUDIO_4K_BACKGROUNDS.some((b) => b.id === prefs.bgId);
          if (matchedCustom || existsInBuiltIn) {
            setBgId(prefs.bgId);
            if (matchedCustom?.kind === 'video') {
              setDurationMode('match_video');
            }
          }
        }
      })
      .finally(() => {
        if (active) setIsLoadingLibrary(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen]);

  // Persist user preferences
  useEffect(() => {
    saveStudioBgPreferences({
      bgId,
      textColorOverride,
      bgVeilOpacity,
      bgBlackBackdrop,
      textShadowBoost,
      arabicTextColor,
      phoneticsTextColor,
      frenchTextColor,
      colorTarget,
      bgBrightness,
      bgSharpness,
      bgContrast,
      bgImageMotion,
      videoFormatId,
      videoQualityId,
      flowMode,
    });
  }, [
    bgId,
    textColorOverride,
    bgVeilOpacity,
    bgBlackBackdrop,
    textShadowBoost,
    arabicTextColor,
    phoneticsTextColor,
    frenchTextColor,
    colorTarget,
    bgBrightness,
    bgSharpness,
    bgContrast,
    bgImageMotion,
    videoFormatId,
    videoQualityId,
    flowMode,
  ]);

  // Initialize selection strictly on closed -> open transition
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      const num = initialSurahNum || 1;
      const meta = getSurahMeta(num);
      const start = Math.max(1, Math.min(meta.numberOfAyahs, initialStartAyah || 1));
      const end =
        start === 1 && meta.numberOfAyahs <= 15
          ? meta.numberOfAyahs
          : Math.min(meta.numberOfAyahs, start + 4);
      setSelectedSurahs([
        { id: makeSelectionId(num), surahNumber: num, startAyah: start, endAyah: end },
      ]);
      setReciterId(initialReciter?.id || 'mishary');
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, initialSurahNum, initialStartAyah, initialReciter?.id]);

  // Non-destructive Surah verse loader
  const selectedSurahNumbersKey = useMemo(
    () =>
      Array.from(new Set<number>(selectedSurahs.map((s) => s.surahNumber)))
        .sort((a, b) => a - b)
        .join(','),
    [selectedSurahs]
  );

  useEffect(() => {
    if (!isOpen || !selectedSurahNumbersKey) return;
    let active = true;
    const nums = selectedSurahNumbersKey
      .split(',')
      .map(Number)
      .filter((n) => n > 0 && !loadedSurahsRef.current[n]);

    if (nums.length === 0) return;
    setLoadingSurahNums((prev) => Array.from(new Set([...prev, ...nums])));

    Promise.all(
      nums.map(async (num) => {
        const meta = getSurahMeta(num);
        const loaded = await fetchSurahVersesForStudio(meta);
        return { num, loaded };
      })
    )
      .then((results) => {
        if (!active) return;
        setLoadedSurahs((prev) => {
          const next = { ...prev };
          for (const item of results) {
            next[item.num] = item.loaded;
          }
          return next;
        });
      })
      .finally(() => {
        if (!active) return;
        setLoadingSurahNums((prev) => prev.filter((n) => !nums.includes(n)));
      });

    return () => {
      active = false;
    };
  }, [isOpen, selectedSurahNumbersKey]);

  const isLoadingVerses = loadingSurahNums.length > 0;

  const loadedVersesMap = useMemo(() => {
    const map: Record<number, StudioAyahItem[]> = {};
    for (const [key, val] of Object.entries(loadedSurahs) as Array<[string, LoadedStudioSurah]>) {
      map[Number(key)] = val.ayahs;
    }
    return map;
  }, [loadedSurahs]);

  const primarySelection = selectedSurahs[0] || {
    id: 'fallback',
    surahNumber: initialSurahNum || 1,
    startAyah: 1,
    endAyah: 5,
  };
  const primarySurahMeta = useMemo(
    () => getSurahMeta(primarySelection.surahNumber),
    [primarySelection.surahNumber]
  );
  const primaryNormalizedRange = useMemo(
    () =>
      normalizeVerseRange(
        primarySelection.startAyah,
        primarySelection.endAyah,
        primarySurahMeta.numberOfAyahs
      ),
    [primarySelection.startAyah, primarySelection.endAyah, primarySurahMeta.numberOfAyahs]
  );

  const selectedReciter: Reciter = useMemo(
    () => RECITERS.find((r) => r.id === reciterId) || RECITERS[0],
    [reciterId]
  );

  const baseVideoSequence = useMemo(
    () => buildMultiSurahVideoSequence(selectedSurahs, loadedVersesMap, ALL_114_SURAHS),
    [selectedSurahs, loadedVersesMap]
  );

  const totalSelectedVerses = useMemo(
    () => baseVideoSequence.filter((v) => !v.isBismillah).length,
    [baseVideoSequence]
  );

  const playlistSummaryLabel = useMemo(() => {
    if (selectedSurahs.length === 1) {
      const meta = getSurahMeta(selectedSurahs[0].surahNumber);
      const norm = normalizeVerseRange(
        selectedSurahs[0].startAyah,
        selectedSurahs[0].endAyah,
        meta.numberOfAyahs
      );
      const isFull = norm.startAyah === 1 && norm.endAyah === meta.numberOfAyahs;
      return isFull
        ? `${meta.name} (complète)`
        : `${meta.name} (${norm.startAyah}–${norm.endAyah})`;
    }
    const first = getSurahMeta(selectedSurahs[0].surahNumber).name;
    const last = getSurahMeta(selectedSurahs[selectedSurahs.length - 1].surahNumber).name;
    return `${selectedSurahs.length} sourates (${first} → ${last})`;
  }, [selectedSurahs]);

  const sequenceSignature = useMemo(
    () =>
      selectedSurahs
        .map((s) => `${s.surahNumber}:${s.startAyah}-${s.endAyah}`)
        .join('|'),
    [selectedSurahs]
  );

  // Playlist mutation helpers
  const updateSurahRange = useCallback(
    (selectionId: string, startAyah: number, endAyah: number) => {
      setSelectedSurahs((prev) =>
        prev.map((item) => {
          if (item.id !== selectionId) return item;
          const meta = getSurahMeta(item.surahNumber);
          const norm = normalizeVerseRange(startAyah, endAyah, meta.numberOfAyahs);
          return { ...item, startAyah: norm.startAyah, endAyah: norm.endAyah };
        })
      );
    },
    []
  );

  const moveSurahItem = useCallback((index: number, delta: -1 | 1) => {
    setSelectedSurahs((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(target, 0, moved);
      return copy;
    });
  }, []);

  const removeSurahItem = useCallback((selectionId: string) => {
    setSelectedSurahs((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item.id !== selectionId);
    });
  }, []);

  const applySurahCompilation = useCallback((surahNumbers: number[]) => {
    const uniqueNums = Array.from(new Set(surahNumbers)).filter((n) => n >= 1 && n <= 114);
    if (uniqueNums.length === 0) return;
    setSelectedSurahs((prev) =>
      uniqueNums.map((num) => {
        const existing = prev.find((p) => p.surahNumber === num);
        if (existing) return existing;
        const meta = getSurahMeta(num);
        return {
          id: makeSelectionId(num),
          surahNumber: num,
          startAyah: 1,
          endAyah: meta.numberOfAyahs,
        };
      })
    );
  }, []);

  const openSurahPicker = () => {
    setDraftPickerSurahNums(selectedSurahs.map((s) => s.surahNumber));
    setIsSurahPickerOpen(true);
  };

  const toggleDraftSurah = (surahNumber: number) => {
    setDraftPickerSurahNums((prev) => {
      if (prev.includes(surahNumber)) {
        return prev.length > 1 ? prev.filter((n) => n !== surahNumber) : prev;
      }
      return [...prev, surahNumber];
    });
  };

  const confirmSurahPicker = () => {
    applySurahCompilation(draftPickerSurahNums);
    setIsSurahPickerOpen(false);
  };

  // Resolve Active Background
  const activeCustomMedia = useMemo(
    () => customMedia.find((m) => m.id === bgId) || null,
    [customMedia, bgId]
  );
  const activeVerticalBg = useMemo(
    () => MOBILE_VERTICAL_BACKGROUNDS.find((b) => b.id === bgId) || null,
    [bgId]
  );
  const active4kBg = useMemo(
    () => STUDIO_4K_BACKGROUNDS.find((b) => b.id === bgId) || null,
    [bgId]
  );
  const activeSolidBg = useMemo(
    () => STUDIO_SOLID_BACKGROUNDS.find((s) => s.id === bgId) || null,
    [bgId]
  );

  const activeMediaKind: 'video' | 'image' | 'solid' = activeCustomMedia
    ? activeCustomMedia.kind
    : activeVerticalBg || active4kBg
    ? 'image'
    : 'solid';
  const activeMediaUrl: string | null = activeCustomMedia
    ? activeCustomMedia.url
    : activeVerticalBg?.url || active4kBg?.url || null;

  const isLightSurface = useMemo(() => {
    if (textColorOverride === 'dark') return true;
    if (textColorOverride === 'light') return false;
    if (bgBlackBackdrop) return false;
    if (activeSolidBg) return activeSolidBg.polarity === 'light';
    if (activeVerticalBg) return activeVerticalBg.polarity === 'light';
    if (active4kBg) return active4kBg.polarity === 'light';
    return false;
  }, [textColorOverride, bgBlackBackdrop, activeSolidBg, activeVerticalBg, active4kBg]);

  const bgSurfaceColor = useMemo(() => {
    if (activeSolidBg) return activeSolidBg.color;
    return isLightSurface ? '#FCFCFB' : '#050505';
  }, [activeSolidBg, isLightSurface]);

  const visibleBackgroundCards = useMemo(() => {
    const customCards = customMedia.map((m) => ({
      id: m.id,
      name: m.name,
      url: m.url,
      thumbUrl: m.thumbUrl || m.url,
      kind: m.kind,
      durationSec: m.durationSec,
      isCustom: true,
    }));
    const verticalCards = MOBILE_VERTICAL_BACKGROUNDS.map((b) => ({
      id: b.id,
      name: b.name,
      url: b.url,
      thumbUrl: b.thumbUrl,
      category: b.category,
      kind: 'image' as const,
      isCustom: false,
    }));
    const fourKCards = STUDIO_4K_BACKGROUNDS.map((b) => ({
      id: b.id,
      name: b.name,
      url: b.url,
      thumbUrl: b.thumbUrl,
      kind: 'image' as const,
      isCustom: false,
    }));

    if (bgFilter === 'custom') return customCards;
    if (bgFilter === 'noir') return verticalCards.filter((b) => b.category === 'noir');
    if (bgFilter === 'blanc') return verticalCards.filter((b) => b.category === 'blanc');
    if (bgFilter === '4k') return fourKCards;
    return [...customCards, ...verticalCards, ...fourKCards];
  }, [bgFilter, customMedia]);

  const applyCustomTextColor = useCallback(
    (hex: string | null) => {
      if (colorTarget === 'all') {
        setArabicTextColor(hex);
        setPhoneticsTextColor(hex);
        setFrenchTextColor(hex);
      } else if (colorTarget === 'arabic') {
        setArabicTextColor(hex);
      } else if (colorTarget === 'phonetics') {
        setPhoneticsTextColor(hex);
      } else if (colorTarget === 'french') {
        setFrenchTextColor(hex);
      }
    },
    [colorTarget]
  );

  const activeTargetColorHex = useMemo(() => {
    if (colorTarget === 'arabic') return arabicTextColor || (isLightSurface ? '#0A0A0A' : '#FFFFFF');
    if (colorTarget === 'phonetics') return phoneticsTextColor || (isLightSurface ? '#065F46' : '#CBD5E1');
    if (colorTarget === 'french') return frenchTextColor || (isLightSurface ? '#171717' : '#F8FAFC');
    return arabicTextColor || frenchTextColor || phoneticsTextColor || (isLightSurface ? '#0A0A0A' : '#FFFFFF');
  }, [colorTarget, arabicTextColor, phoneticsTextColor, frenchTextColor, isLightSurface]);

  const hasCustomTextColors = Boolean(arabicTextColor || phoneticsTextColor || frenchTextColor);

  const filteredSurahs = useMemo(() => {
    const q = surahQuery.toLowerCase().trim();
    if (!q) return ALL_114_SURAHS;
    return ALL_114_SURAHS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.arabicName.includes(q) ||
        s.frenchTranslation.toLowerCase().includes(q) ||
        String(s.number).includes(q)
    );
  }, [surahQuery]);

  const targetCustomVideoDurationSec = useMemo(() => {
    if (
      durationMode === 'match_video' &&
      activeCustomMedia?.kind === 'video' &&
      typeof activeCustomMedia.durationSec === 'number' &&
      activeCustomMedia.durationSec > 0
    ) {
      return activeCustomMedia.durationSec;
    }
    return 0;
  }, [durationMode, activeCustomMedia]);

  const extendedPlan = useMemo(() => {
    if (targetCustomVideoDurationSec > 0 && baseVideoSequence.length > 0) {
      return extendSequenceToTargetDuration(
        baseVideoSequence,
        [],
        measuredDurations,
        targetCustomVideoDurationSec,
        paceMultiplier
      );
    }
    return {
      sequence: baseVideoSequence,
      decodedItems: [] as never[],
      measuredDurationsSec: measuredDurations,
    };
  }, [baseVideoSequence, measuredDurations, targetCustomVideoDurationSec, paceMultiplier]);

  const videoSequence = extendedPlan.sequence;

  const baseTimeline = useMemo(
    () => buildContinuousTimeline(baseVideoSequence, measuredDurations, paceMultiplier),
    [baseVideoSequence, measuredDurations, paceMultiplier]
  );

  const timeline = useMemo(
    () =>
      buildContinuousTimeline(
        extendedPlan.sequence,
        extendedPlan.measuredDurationsSec,
        paceMultiplier
      ),
    [extendedPlan.sequence, extendedPlan.measuredDurationsSec, paceMultiplier]
  );

  simTimelineRef.current = timeline;

  const currentSimKey = useMemo(
    () => `${sequenceSignature}__${reciterId}__${durationMode}__${targetCustomVideoDurationSec}`,
    [sequenceSignature, reciterId, durationMode, targetCustomVideoDurationSec]
  );

  const clearPreparedDownload = useCallback(() => {
    setPreparedDownload((prev) => {
      if (prev?.objectUrl) {
        try {
          URL.revokeObjectURL(prev.objectUrl);
        } catch {}
      }
      return null;
    });
    setDownloadStatus((prev) => (prev === 'preparing' ? prev : 'idle'));
    setDownloadErrorMsg(null);
  }, []);

  const stopSimulationPlayback = useCallback(() => {
    if (simAbortRef.current) {
      simAbortRef.current.abort();
      simAbortRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (playbackHandleRef.current) {
      playbackHandleRef.current.stop();
      playbackHandleRef.current = null;
    }
    if (simMediaRef.current.bgVideo) {
      try {
        simMediaRef.current.bgVideo.pause();
      } catch {}
    }
  }, []);

  const stopAllMedia = useCallback(() => {
    stopSimulationPlayback();
    if (downloadAbortRef.current) {
      downloadAbortRef.current.abort();
      downloadAbortRef.current = null;
    }
    if (keepaliveRef.current) {
      keepaliveRef.current.dispose();
      keepaliveRef.current = null;
    }
    if (exportBgVideoRef.current) {
      try {
        exportBgVideoRef.current.pause();
        exportBgVideoRef.current.removeAttribute('src');
        exportBgVideoRef.current.load();
        exportBgVideoRef.current.remove();
      } catch {}
      exportBgVideoRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    mediaRecorderRef.current = null;
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
  }, [stopSimulationPlayback]);

  // Reset audio cache & simulation position when sequence or reciter changes
  useEffect(() => {
    stopSimulationPlayback();
    decodedBuffersRef.current = [];
    decodedSimKeyRef.current = '';
    setMeasuredDurations([]);
    setSimStatus('idle');
    setSimTimeSec(0);
  }, [sequenceSignature, reciterId, durationMode, targetCustomVideoDurationSec, stopSimulationPlayback]);

  // Invalidate any previously built download whenever any video setting changes
  const configSignature = useMemo(
    () =>
      [
        currentSimKey,
        videoFormatId,
        videoQualityId,
        bgId,
        textColorOverride,
        bgVeilOpacity,
        bgBlackBackdrop ? '1' : '0',
        textShadowBoost ? '1' : '0',
        arabicTextColor || '',
        phoneticsTextColor || '',
        frenchTextColor || '',
        bgBrightness,
        bgSharpness,
        bgContrast,
        bgImageMotion ? '1' : '0',
        showArabic,
        useTajweed,
        showPhonetics,
        showFrench,
        showSurahHeader,
        textScale,
        flowMode,
        paceMultiplier,
      ].join('|'),
    [
      currentSimKey,
      videoFormatId,
      videoQualityId,
      bgId,
      textColorOverride,
      bgVeilOpacity,
      bgBlackBackdrop,
      textShadowBoost,
      arabicTextColor,
      phoneticsTextColor,
      frenchTextColor,
      bgBrightness,
      bgSharpness,
      bgContrast,
      bgImageMotion,
      showArabic,
      useTajweed,
      showPhonetics,
      showFrench,
      showSurahHeader,
      textScale,
      flowMode,
      paceMultiplier,
    ]
  );

  useEffect(() => {
    clearPreparedDownload();
  }, [configSignature, clearPreparedDownload]);

  // Cleanup on unmount / close
  useEffect(() => {
    return () => {
      stopAllMedia();
      if (preparedDownloadRef.current?.objectUrl) {
        try {
          URL.revokeObjectURL(preparedDownloadRef.current.objectUrl);
        } catch {}
      }
      for (const item of customMediaRef.current) {
        try {
          URL.revokeObjectURL(item.url);
          if (item.thumbUrl) URL.revokeObjectURL(item.thumbUrl);
        } catch {}
      }
    };
  }, [stopAllMedia]);

  useEffect(() => {
    if (!isOpen) {
      stopAllMedia();
      setSimStatus('idle');
      setDownloadStatus('idle');
    }
  }, [isOpen, stopAllMedia]);

  const handleImportDeviceMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsSavingMedia(true);
    try {
      const added: CustomBackgroundMedia[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const saved = await saveStudioMediaFile(file, i);
        if (saved) added.push(saved);
      }

      if (added.length > 0) {
        setCustomMedia((prev) => [...added, ...prev]);
        setBgId(added[0].id);
        setBgFilter('custom');
        if (added[0].kind === 'video') {
          setDurationMode('match_video');
        }
      }
    } finally {
      setIsSavingMedia(false);
      e.target.value = '';
    }
  };

  const handleRemoveCustomMedia = (id: string) => {
    setCustomMedia((prev) => {
      const target = prev.find((m) => m.id === id);
      if (target) {
        URL.revokeObjectURL(target.url);
        if (target.thumbUrl) URL.revokeObjectURL(target.thumbUrl);
      }
      return prev.filter((m) => m.id !== id);
    });
    deleteStudioMediaItem(id).catch(() => {});
    if (bgId === id) setBgId('mobile_noir_minimal');
  };

  // =========================================================================
  // INLINE SIMULATION ENGINE (plays directly inside StudioLiveMonitor)
  // =========================================================================
  const drawSimFrameAt = useCallback((atSec: number) => {
    const canvas = simCanvasRef.current;
    const layout = simLayoutRef.current;
    const opts = simRenderOptsRef.current;
    const activeTimeline = simTimelineRef.current;
    if (!canvas || !layout || !opts || !activeTimeline) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;
    renderVideoCanvasFrame(ctx2d, layout, activeTimeline, atSec, {
      ...opts,
      bgImage: simMediaRef.current.bgImage,
      bgVideo: simMediaRef.current.bgVideo,
    });
  }, []);

  const beginInlineSimulationFromOffset = useCallback(
    (
      ctx: AudioContext,
      decoded: DecodedVerseBuffer[],
      exactTimeline: ReturnType<typeof buildContinuousTimeline>,
      offsetSec: number
    ) => {
      if (playbackHandleRef.current) {
        playbackHandleRef.current.stop();
        playbackHandleRef.current = null;
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      simTimelineRef.current = exactTimeline;

      if (simMediaRef.current.bgVideo) {
        try {
          const dur = simMediaRef.current.bgVideo.duration;
          if (Number.isFinite(dur) && dur > 0) {
            simMediaRef.current.bgVideo.currentTime = offsetSec % dur;
          }
          simMediaRef.current.bgVideo.play().catch(() => {});
        } catch {}
      }

      const segStarts = exactTimeline.segments.map((s) => s.startSec);
      const segDurs = exactTimeline.segments.map((s) => s.durationSec);

      const handle = scheduleContinuousAudioSequence(
        ctx,
        decoded,
        segStarts,
        segDurs,
        offsetSec,
        [ctx.destination],
        paceMultiplier
      );
      playbackHandleRef.current = handle;
      playbackStartCtxTimeRef.current = ctx.currentTime;
      playbackStartOffsetRef.current = offsetSec;
      const wallStartMs = performance.now();
      setSimStatus('playing');

      const tick = () => {
        if (!audioCtxRef.current) return;
        const audioDelta =
          audioCtxRef.current.currentTime - playbackStartCtxTimeRef.current;
        const wallDelta = (performance.now() - wallStartMs) / 1000;
        const delta = audioDelta > 0.02 ? audioDelta : wallDelta;
        const elapsed = playbackStartOffsetRef.current + delta;
        if (elapsed >= exactTimeline.totalDurationSec) {
          setSimTimeSec(exactTimeline.totalDurationSec);
          drawSimFrameAt(exactTimeline.totalDurationSec);
          if (simMediaRef.current.bgVideo) {
            try {
              simMediaRef.current.bgVideo.pause();
            } catch {}
          }
          setSimStatus('ended');
          playbackHandleRef.current?.stop();
          playbackHandleRef.current = null;
          return;
        }
        setSimTimeSec(elapsed);
        drawSimFrameAt(elapsed);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [paceMultiplier, drawSimFrameAt]
  );

  const handleToggleSimulationPlay = async () => {
    if (baseVideoSequence.length === 0 || downloadStatus === 'preparing') return;

    if (simStatus === 'playing') {
      stopSimulationPlayback();
      setSimStatus('paused');
      return;
    }

    if (simStatus === 'loading') {
      stopSimulationPlayback();
      setSimStatus('idle');
      return;
    }

    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContextCtor();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    const startOffset = simStatus === 'ended' ? 0 : simTimeSec;

    if (decodedSimKeyRef.current === currentSimKey && decodedBuffersRef.current.length > 0) {
      beginInlineSimulationFromOffset(ctx, decodedBuffersRef.current, timeline, startOffset);
      return;
    }

    stopSimulationPlayback();
    setSimStatus('loading');
    const abortCtrl = new AbortController();
    simAbortRef.current = abortCtrl;

    try {
      const decodedBase = await decodeVerseAudioSequence(
        ctx,
        primarySelection.surahNumber,
        baseVideoSequence,
        reciterId,
        () => {},
        abortCtrl.signal
      );

      if (abortCtrl.signal.aborted) return;

      const baseDurations = decodedBase.map((d) =>
        d.effectiveDurationSec > 0 ? d.effectiveDurationSec : undefined
      );
      setMeasuredDurations(baseDurations);

      const detectedBgDurationSec =
        targetCustomVideoDurationSec > 0
          ? targetCustomVideoDurationSec
          : durationMode === 'match_video' &&
            simMediaRef.current.bgVideo &&
            Number.isFinite(simMediaRef.current.bgVideo.duration) &&
            simMediaRef.current.bgVideo.duration > 0
          ? simMediaRef.current.bgVideo.duration
          : 0;

      const expanded =
        detectedBgDurationSec > 0
          ? extendSequenceToTargetDuration(
              baseVideoSequence,
              decodedBase,
              baseDurations,
              detectedBgDurationSec,
              paceMultiplier
            )
          : {
              sequence: baseVideoSequence,
              decodedItems: decodedBase,
              measuredDurationsSec: baseDurations,
            };

      decodedBuffersRef.current = expanded.decodedItems;
      decodedSimKeyRef.current = currentSimKey;

      const exactTimeline = buildContinuousTimeline(
        expanded.sequence,
        expanded.measuredDurationsSec,
        paceMultiplier
      );
      simTimelineRef.current = exactTimeline;

      if (document.fonts?.ready) {
        await document.fonts.ready.catch(() => {});
      }
      if (abortCtrl.signal.aborted) return;

      beginInlineSimulationFromOffset(
        ctx,
        expanded.decodedItems,
        exactTimeline,
        Math.min(startOffset, Math.max(0, exactTimeline.totalDurationSec - 0.1))
      );
    } catch {
      if (!abortCtrl.signal.aborted) {
        setSimStatus('idle');
      }
    }
  };

  const handleSeekSimulation = (targetSec: number) => {
    const activeTimeline = simTimelineRef.current || timeline;
    const clamped = Math.max(0, Math.min(activeTimeline.totalDurationSec, targetSec));
    setSimTimeSec(clamped);
    if (simMediaRef.current.bgVideo) {
      try {
        const dur = simMediaRef.current.bgVideo.duration;
        if (Number.isFinite(dur) && dur > 0) {
          simMediaRef.current.bgVideo.currentTime = clamped % dur;
        }
      } catch {}
    }
    drawSimFrameAt(clamped);
    if (
      simStatus === 'playing' &&
      audioCtxRef.current &&
      decodedSimKeyRef.current === currentSimKey
    ) {
      beginInlineSimulationFromOffset(
        audioCtxRef.current,
        decodedBuffersRef.current,
        activeTimeline,
        clamped
      );
    } else if (simStatus === 'ended') {
      setSimStatus('paused');
    }
  };

  const handleJumpToSegmentIndex = (nextIndex: number) => {
    const activeTimeline = simTimelineRef.current || timeline;
    if (activeTimeline.segments.length === 0) return;
    const clampedIdx = Math.max(0, Math.min(activeTimeline.segments.length - 1, nextIndex));
    const seg = activeTimeline.segments[clampedIdx];
    if (seg) {
      handleSeekSimulation(seg.startSec + Math.min(0.6, seg.durationSec * 0.2));
    }
  };

  // =========================================================================
  // IN-PLACE DIRECT MP4 DOWNLOAD (NO SEPARATE EXPORT PAGE)
  // =========================================================================
  const handleCancelDownload = () => {
    if (downloadAbortRef.current) {
      downloadAbortRef.current.abort();
      downloadAbortRef.current = null;
    }
    if (keepaliveRef.current) {
      keepaliveRef.current.dispose();
      keepaliveRef.current = null;
    }
    if (exportBgVideoRef.current) {
      try {
        exportBgVideoRef.current.pause();
        exportBgVideoRef.current.removeAttribute('src');
        exportBgVideoRef.current.load();
        exportBgVideoRef.current.remove();
      } catch {}
      exportBgVideoRef.current = null;
    }
    setDownloadStatus('idle');
    setDownloadProgressPct(0);
    setDownloadStatusLabel('');
  };

  const startDirectDownload = async () => {
    if (baseVideoSequence.length === 0 || downloadStatus === 'preparing') return;

    stopSimulationPlayback();
    if (simStatus === 'playing' || simStatus === 'loading') {
      setSimStatus('paused');
    }

    clearPreparedDownload();
    setDownloadErrorMsg(null);
    setDownloadStatus('preparing');
    setDownloadProgressPct(0);
    setDownloadStatusLabel('Préparation...');

    const abortCtrl = new AbortController();
    downloadAbortRef.current = abortCtrl;

    try {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContextCtor();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }

      const bgImgPromise =
        activeMediaKind === 'image' && activeMediaUrl
          ? loadCanvasBackgroundImage(activeMediaUrl)
          : Promise.resolve(null);
      const bgVideoPromise =
        activeMediaKind === 'video' && activeMediaUrl
          ? loadCanvasBackgroundVideo(activeMediaUrl)
          : Promise.resolve(null);

      const [decodedBase, bgImg, bgVideo] = await Promise.all([
        decodeVerseAudioSequence(
          ctx,
          primarySelection.surahNumber,
          baseVideoSequence,
          reciterId,
          (loaded, total) => {
            setDownloadProgressPct(Math.round((loaded / Math.max(1, total)) * 20));
          },
          abortCtrl.signal
        ),
        bgImgPromise,
        bgVideoPromise,
      ]);

      exportBgVideoRef.current = bgVideo;

      if (abortCtrl.signal.aborted) {
        if (bgVideo) {
          try {
            bgVideo.pause();
            bgVideo.remove();
          } catch {}
          exportBgVideoRef.current = null;
        }
        return;
      }

      const okAudioCount = decodedBase.filter((d) => d.buffer !== null).length;
      if (okAudioCount === 0) {
        throw new Error('Audio indisponible pour ces versets.');
      }

      const baseDurations = decodedBase.map((d) =>
        d.effectiveDurationSec > 0 ? d.effectiveDurationSec : undefined
      );
      setMeasuredDurations(baseDurations);

      const detectedBgDurationSec =
        targetCustomVideoDurationSec > 0
          ? targetCustomVideoDurationSec
          : durationMode === 'match_video' &&
            bgVideo &&
            Number.isFinite(bgVideo.duration) &&
            bgVideo.duration > 0
          ? bgVideo.duration
          : 0;

      const expanded =
        detectedBgDurationSec > 0
          ? extendSequenceToTargetDuration(
              baseVideoSequence,
              decodedBase,
              baseDurations,
              detectedBgDurationSec,
              paceMultiplier
            )
          : {
              sequence: baseVideoSequence,
              decodedItems: decodedBase,
              measuredDurationsSec: baseDurations,
            };

      decodedBuffersRef.current = expanded.decodedItems;
      decodedSimKeyRef.current = currentSimKey;

      const exportSeq = expanded.sequence;
      const exportDecoded = expanded.decodedItems;
      const exactTimeline = buildContinuousTimeline(
        exportSeq,
        expanded.measuredDurationsSec,
        paceMultiplier
      );

      if (document.fonts?.ready) {
        await document.fonts.ready.catch(() => {});
      }

      const canvas = exportCanvasRef.current;
      if (!canvas) {
        throw new Error('Surface vidéo indisponible.');
      }
      const exportW = activeFormat.width;
      const exportH = activeFormat.height;
      canvas.width = exportW;
      canvas.height = exportH;
      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx) {
        throw new Error('Contexte graphique indisponible.');
      }

      const renderOpts: VideoCanvasRenderOptions = {
        width: exportW,
        height: exportH,
        surahName: primarySurahMeta.name,
        surahNumber: primarySurahMeta.number,
        startAyah: primaryNormalizedRange.startAyah,
        endAyah: primaryNormalizedRange.endAyah,
        selectedSurahsCount: selectedSurahs.length,
        isLightSurface,
        bgSurfaceColor,
        bgVeilOpacity,
        bgBlackBackdrop,
        bgBrightness,
        bgSharpness,
        bgContrast,
        bgImageMotion,
        textShadowBoost,
        arabicTextColor,
        phoneticsTextColor,
        frenchTextColor,
        bgImage: bgImg,
        bgVideo,
        showArabic,
        useTajweed,
        showPhonetics,
        showFrench,
        showSurahHeader,
        textScale,
        flowMode,
        reciterName: selectedReciter.name,
      };

      const layout = precomputeVideoCanvasLayout(canvasCtx, exportSeq, renderOpts);
      renderVideoCanvasFrame(canvasCtx, layout, exactTimeline, 0, renderOpts);

      if (ctx.state !== 'running') {
        await ctx.resume().catch(() => {});
      }

      const exportResult = await exportQuranVideoToMp4({
        canvas,
        canvasCtx,
        layout,
        ayahs: exportSeq,
        timeline: exactTimeline,
        renderOpts,
        audioCtx: ctx,
        decodedBuffers: exportDecoded,
        paceMultiplier,
        monitorAudioDuringExport: false,
        abortSignal: abortCtrl.signal,
        onProgress: (pct, _elapsedSec, statusText) => {
          setDownloadProgressPct(Math.max(20, Math.min(99, pct)));
          setDownloadStatusLabel(statusText);
        },
        onKeepaliveReady: (ka) => {
          keepaliveRef.current = ka;
        },
        onMediaRecorderReady: (rec) => {
          mediaRecorderRef.current = rec;
        },
      });

      if (abortCtrl.signal.aborted) return;

      const actualQualityId = inferVideoQualityFromDimensions(
        exportResult.width,
        exportResult.height
      );
      const objectUrl = URL.createObjectURL(exportResult.blob);
      const nextFilename = buildStudioExportFilename({
        selections: selectedSurahs,
        aspectLabel: activeFormat.aspectLabel,
        extension: exportResult.extension,
        qualityId: actualQualityId,
      });

      const inIframe = isRunningInIframe();
      let readyStagedUrl: string | null = null;
      if (shouldStageVideoDownload(exportResult.blob.size, inIframe, MAX_STAGE_DOWNLOAD_BYTES)) {
        readyStagedUrl = await stageVideoBlobOnServer(
          exportResult.blob,
          nextFilename,
          abortCtrl.signal
        );
      }

      if (abortCtrl.signal.aborted) {
        URL.revokeObjectURL(objectUrl);
        return;
      }

      if (exportBgVideoRef.current) {
        try {
          exportBgVideoRef.current.pause();
          exportBgVideoRef.current.removeAttribute('src');
          exportBgVideoRef.current.load();
          exportBgVideoRef.current.remove();
        } catch {}
        exportBgVideoRef.current = null;
      }

      const linkState = resolveVideoDownloadLinkState({
        inIframe,
        stagedDownloadUrl: readyStagedUrl,
        objectUrl,
        filename: nextFilename,
      });

      setPreparedDownload({
        blob: exportResult.blob,
        objectUrl,
        stagedUrl: readyStagedUrl,
        filename: linkState.filename,
        sizeBytes: exportResult.blob.size,
        downloaded: true,
      });
      setDownloadProgressPct(100);
      setDownloadStatus('ready');
      setDownloadStatusLabel('');

      if (linkState.href) {
        triggerFileDownload(linkState.href, linkState.filename);
      }
    } catch (err: any) {
      if (!abortCtrl.signal.aborted) {
        setDownloadStatus('error');
        setDownloadErrorMsg(
          err?.message || 'Téléchargement impossible sur cet appareil.'
        );
      }
    }
  };

  const handleSharePreparedVideo = async () => {
    if (!preparedDownload) return;
    const file = new File([preparedDownload.blob], preparedDownload.filename, {
      type: preparedDownload.blob.type,
    });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: playlistSummaryLabel,
          files: [file],
        });
      } catch {}
    }
  };

  if (!isOpen) return null;

  const inIframe = isRunningInIframe();
  const activeDownloadHref = preparedDownload
    ? resolveVideoDownloadLinkState({
        inIframe,
        stagedDownloadUrl: preparedDownload.stagedUrl,
        objectUrl: preparedDownload.objectUrl,
        filename: preparedDownload.filename,
      }).href
    : null;

  const downloadState: StudioDirectDownloadState = {
    status: downloadStatus,
    progressPct: downloadProgressPct,
    statusLabel: downloadStatusLabel,
    errorMsg: downloadErrorMsg,
    url: activeDownloadHref,
    filename: preparedDownload?.filename || null,
    sizeBytes: preparedDownload?.sizeBytes || null,
    downloaded: Boolean(preparedDownload?.downloaded),
    canShare:
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      Boolean(preparedDownload?.blob),
  };

  const switchTab = (tab: StudioTab) => {
    setActiveTab(tab);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      data-testid="mobile-video-studio-modal"
      className="fixed inset-0 z-[10040] studio-paper-canvas text-[#1F2421] flex flex-col h-[100dvh] overflow-hidden"
    >
      {/* Hidden offscreen canvas strictly for full-res MP4 file generation */}
      <canvas ref={exportCanvasRef} className="hidden" aria-hidden="true" />

      <input
        ref={mediaFileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        data-testid="studio-media-file-input"
        onChange={handleImportDeviceMedia}
        className="hidden"
      />

      {/* Clean Minimal Top Bar */}
      <header className="shrink-0 flex items-center justify-between gap-4 px-4 md:px-6 pt-[calc(env(safe-area-inset-top)+0.55rem)] pb-2.5 border-b border-[#CECBC2] bg-[#EAE8E1]/95 backdrop-blur-sm shadow-[0_2px_10px_rgba(24,28,26,0.06)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl studio-pill-mint flex items-center justify-center shrink-0">
            <Film className="w-4 h-4 text-[#11221A]" />
          </div>
          <h2 className="text-sm md:text-[15px] font-bold tracking-tight text-[#1F2421] whitespace-nowrap truncate">
            Studio Le Sanctuaire
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            stopAllMedia();
            onClose();
          }}
          aria-label="Fermer le studio"
          className="w-9 h-9 rounded-full studio-pill-raised text-[#1F2421] flex items-center justify-center cursor-pointer shrink-0 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Unified Workspace: Desktop Left Controls + Right Simulation | Mobile Top Simulation + Bottom Controls */}
      <div className="flex-1 min-h-0 flex flex-col md:grid md:grid-cols-[0.92fr_1.08fr] md:max-w-7xl md:w-full md:mx-auto md:gap-6 md:px-6 md:py-5 overflow-hidden">
        {/* Video Simulation & Direct Download Theater */}
        <div className="order-1 md:order-2 flex flex-col min-h-0">
          <StudioLiveMonitor
            canvasRef={simCanvasRef}
            isPcMode={isPcMode}
            format={activeFormat}
            onSelectFormat={(id) => setVideoFormatId(id)}
            qualityId={videoQualityId}
            onSelectQuality={(id) => setVideoQualityId(id)}
            ayahs={videoSequence}
            timeline={timeline}
            surahName={primarySurahMeta.name}
            surahNumber={primarySurahMeta.number}
            startAyah={primaryNormalizedRange.startAyah}
            endAyah={primaryNormalizedRange.endAyah}
            selectedSurahsCount={selectedSurahs.length}
            reciterName={selectedReciter.name}
            activeMediaKind={activeMediaKind}
            activeMediaUrl={activeMediaUrl}
            isLightSurface={isLightSurface}
            bgSurfaceColor={bgSurfaceColor}
            bgVeilOpacity={bgVeilOpacity}
            bgBlackBackdrop={bgBlackBackdrop}
            bgBrightness={bgBrightness}
            bgSharpness={bgSharpness}
            bgContrast={bgContrast}
            bgImageMotion={bgImageMotion}
            textShadowBoost={textShadowBoost}
            arabicTextColor={arabicTextColor}
            phoneticsTextColor={phoneticsTextColor}
            frenchTextColor={frenchTextColor}
            showArabic={showArabic}
            useTajweed={useTajweed}
            showPhonetics={showPhonetics}
            showFrench={showFrench}
            showSurahHeader={showSurahHeader}
            textScale={textScale}
            flowMode={flowMode}
            simStatus={simStatus}
            simTimeSec={simTimeSec}
            isLoadingVerses={isLoadingVerses}
            onTogglePlay={handleToggleSimulationPlay}
            onSeek={handleSeekSimulation}
            onJumpToSegmentIndex={handleJumpToSegmentIndex}
            onDetectedVideoDurationSec={(durSec) => {
              if (!activeCustomMedia || activeCustomMedia.kind !== 'video') return;
              if (
                !activeCustomMedia.durationSec ||
                Math.abs(activeCustomMedia.durationSec - durSec) > 0.5
              ) {
                const targetId = activeCustomMedia.id;
                setCustomMedia((prev) =>
                  prev.map((m) => (m.id === targetId ? { ...m, durationSec: durSec } : m))
                );
              }
            }}
            onMediaElementsChange={(media) => {
              simMediaRef.current = media;
            }}
            onLayoutReady={({ layout, renderOpts }) => {
              simLayoutRef.current = layout;
              simRenderOptsRef.current = renderOpts;
            }}
            downloadState={downloadState}
            onStartDownload={startDirectDownload}
            onCancelDownload={handleCancelDownload}
            onDirectLinkClicked={() => {
              setPreparedDownload((prev) => (prev ? { ...prev, downloaded: true } : prev));
            }}
            onShareVideo={handleSharePreparedVideo}
          />
        </div>

        {/* Left Controls Rail (Sourate & Récitateur | Modèle & Fond) */}
        <div className="order-2 md:order-1 flex-1 min-h-0 flex flex-col overflow-hidden md:rounded-3xl md:studio-surface-stacked bg-[#EAE8E1]/85">
          {/* Tactile Segmented Recessed Tab Track (2 Unified Tabs) */}
          <div className="shrink-0 px-3 pt-3 pb-2">
            <nav
              aria-label="Réglages du studio"
              className="grid grid-cols-2 items-center gap-1 p-1 rounded-full studio-well-inset"
            >
              {[
                {
                  id: 'verses_audio' as const,
                  testId: 'jump-verses-audio',
                  label: 'Sourate & Récitateur',
                  icon: BookOpen,
                },
                {
                  id: 'style_bg' as const,
                  testId: 'jump-style-bg',
                  label: 'Modèle & Fond',
                  icon: Sparkles,
                },
              ].map((tab) => {
                const isCurrent = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    data-testid={`studio-${tab.testId}-btn`}
                    onClick={() => switchTab(tab.id)}
                    className={`min-h-[38px] px-2.5 sm:px-3.5 rounded-full flex items-center justify-center gap-1.5 text-[11.5px] sm:text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isCurrent
                        ? 'studio-pill-mint'
                        : 'text-[#4F5551] hover:text-[#1F2421]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Scrollable Tab Body — Clean Whitespace & Hairline Dividers */}
          <div
            ref={scrollContainerRef}
            data-testid="studio-settings-scroll"
            className="flex-1 min-h-0 overflow-y-auto no-scrollbar overscroll-contain touch-pan-y px-4 pb-5 pt-2 space-y-5"
          >
            {/* TAB 1: SOURATES, VERSETS & RÉCITATEUR */}
            {activeTab === 'verses_audio' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    data-testid="studio-surah-picker-btn"
                    onClick={openSurahPicker}
                    className="flex-1 min-w-0 h-11 px-3.5 rounded-2xl studio-pill-raised flex items-center justify-between gap-2 cursor-pointer transition-all"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-xl studio-pill-mint flex items-center justify-center shrink-0">
                        <Layers className="w-3.5 h-3.5 text-[#13251D]" />
                      </span>
                      <span className="text-xs font-bold text-[#1F2421] truncate">
                        {playlistSummaryLabel}
                      </span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#565C58] shrink-0" />
                  </button>

                  {isLoadingVerses && (
                    <Loader2 className="w-4 h-4 animate-spin text-[#1B573E] shrink-0" />
                  )}
                </div>

                {/* Compact Tactile Chips */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    data-testid="studio-preset-3qul"
                    onClick={() => applySurahCompilation([112, 113, 114])}
                    className="h-8 px-3 rounded-full studio-pill-raised font-semibold cursor-pointer transition-all whitespace-nowrap"
                  >
                    3 Qul
                  </button>
                  <button
                    type="button"
                    data-testid="studio-preset-fatiha-ikhlas"
                    onClick={() => applySurahCompilation([1, 112])}
                    className="h-8 px-3 rounded-full studio-pill-raised font-semibold cursor-pointer transition-all whitespace-nowrap"
                  >
                    Fatiha + Ikhlas
                  </button>
                  <button
                    type="button"
                    data-testid="studio-range-full-surah-btn"
                    onClick={() =>
                      setSelectedSurahs((prev) =>
                        prev.map((item) => ({
                          ...item,
                          startAyah: 1,
                          endAyah: getSurahMeta(item.surahNumber).numberOfAyahs,
                        }))
                      )
                    }
                    className={`h-8 px-3 rounded-full font-semibold cursor-pointer transition-all whitespace-nowrap ${
                      selectedSurahs.every(
                        (s) =>
                          s.startAyah === 1 &&
                          s.endAyah === getSurahMeta(s.surahNumber).numberOfAyahs
                      )
                        ? 'studio-pill-mint'
                        : 'studio-pill-raised'
                    }`}
                  >
                    Toute
                  </button>
                </div>

                {/* Clean Hairline-Divided Surah Playlist */}
                <div
                  data-testid="studio-playlist-list"
                  className="divide-y divide-[#D4D1C8] border-t border-[#D4D1C8]"
                >
                  {selectedSurahs.map((sel, index) => {
                    const meta = getSurahMeta(sel.surahNumber);
                    const maxN = meta.numberOfAyahs;
                    const norm = normalizeVerseRange(sel.startAyah, sel.endAyah, maxN);
                    const presets: Array<{ label: string; s: number; e: number }> = [
                      { label: '1→5', s: 1, e: Math.min(5, maxN) },
                    ];
                    if (maxN > 5 && maxN <= 15) {
                      presets.push({ label: `1→${maxN}`, s: 1, e: maxN });
                    } else if (maxN > 15) {
                      presets.push({ label: '1→15', s: 1, e: Math.min(15, maxN) });
                      presets.push({ label: `1→${maxN}`, s: 1, e: maxN });
                    }

                    return (
                      <div
                        key={sel.id}
                        data-testid={`studio-playlist-item-${sel.surahNumber}`}
                        className="py-3.5 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-mono font-bold text-[#1B573E] tabular-nums shrink-0">
                              {meta.number}.
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-[#1F2421] truncate">
                              {meta.name}
                            </span>
                            <span className="font-arabic text-base text-[#1B573E] shrink-0" dir="rtl">
                              {meta.arabicName}
                            </span>
                          </div>

                          {selectedSurahs.length > 1 && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => moveSurahItem(index, -1)}
                                disabled={index === 0}
                                aria-label={`Monter ${meta.name}`}
                                className="w-7 h-7 rounded-full studio-pill-raised flex items-center justify-center text-[#565C58] disabled:opacity-35 cursor-pointer"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveSurahItem(index, 1)}
                                disabled={index === selectedSurahs.length - 1}
                                aria-label={`Descendre ${meta.name}`}
                                className="w-7 h-7 rounded-full studio-pill-raised flex items-center justify-center text-[#565C58] disabled:opacity-35 cursor-pointer"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeSurahItem(sel.id)}
                                aria-label={`Retirer ${meta.name}`}
                                className="w-7 h-7 rounded-full studio-pill-raised hover:bg-[#EE9B98]/40 text-[#9B3431] flex items-center justify-center cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <select
                            id={`studio-start-ayah-${sel.id}`}
                            aria-label={`Premier verset de ${meta.name}`}
                            value={norm.startAyah}
                            onChange={(e) => {
                              const nextStart = Number(e.target.value);
                              updateSurahRange(
                                sel.id,
                                nextStart,
                                Math.max(nextStart, norm.endAyah)
                              );
                            }}
                            className="w-full h-9 px-3 rounded-xl studio-input-inset text-xs font-semibold text-[#1F2421] tabular-nums cursor-pointer"
                          >
                            {Array.from({ length: maxN }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n} className="bg-white text-[#1F2421]">
                                Du verset {n}
                              </option>
                            ))}
                          </select>

                          <select
                            id={`studio-end-ayah-${sel.id}`}
                            aria-label={`Dernier verset de ${meta.name}`}
                            value={norm.endAyah}
                            onChange={(e) => {
                              const nextEnd = Number(e.target.value);
                              updateSurahRange(sel.id, norm.startAyah, nextEnd);
                            }}
                            className="w-full h-9 px-3 rounded-xl studio-input-inset text-xs font-semibold text-[#1F2421] tabular-nums cursor-pointer"
                          >
                            {Array.from(
                              { length: maxN - norm.startAyah + 1 },
                              (_, i) => norm.startAyah + i
                            ).map((n) => (
                              <option key={n} value={n} className="bg-white text-[#1F2421]">
                                Au verset {n}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          {presets.map((preset) => {
                            const active =
                              norm.startAyah === preset.s && norm.endAyah === preset.e;
                            return (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => updateSurahRange(sel.id, preset.s, preset.e)}
                                className={`h-7 px-3 rounded-full font-semibold cursor-pointer transition-all whitespace-nowrap tabular-nums ${
                                  active ? 'studio-pill-mint' : 'studio-pill-raised'
                                }`}
                              >
                                {preset.label}
                              </button>
                            );
                          })}
                          {norm.endAyah < maxN && (
                            <button
                              type="button"
                              onClick={() =>
                                updateSurahRange(
                                  sel.id,
                                  norm.startAyah,
                                  Math.min(maxN, norm.endAyah + 10)
                                )
                              }
                              aria-label="Ajouter 10 versets"
                              className="h-7 px-2.5 rounded-full studio-pill-raised text-[#165C41] font-semibold inline-flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
                            >
                              <Plus className="w-3 h-3" />
                              <span>10</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Récitateur (Unified in Sourate & Récitateur Tab) */}
                <section
                  data-testid="studio-reciter-section"
                  className="pt-4 border-t border-[#D4D1C8] space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#1F2421]">
                      <Headphones className="w-3.5 h-3.5 text-[#1B573E] shrink-0" />
                      <span>Récitateur</span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#1B573E] truncate max-w-[60%]">
                      {selectedReciter.name}
                    </span>
                  </div>

                  <div className="divide-y divide-[#D4D1C8] rounded-2xl studio-input-inset px-2 py-1 max-h-[260px] overflow-y-auto no-scrollbar">
                    {RECITERS.map((r) => {
                      const active = r.id === reciterId;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          data-testid={`studio-reciter-${r.id}`}
                          onClick={() => {
                            setReciterId(r.id);
                            onSyncReciter?.(r);
                          }}
                          className={`w-full py-2.5 px-2.5 flex items-center justify-between gap-2 text-left cursor-pointer transition-all rounded-xl my-0.5 ${
                            active
                              ? 'studio-pill-mint'
                              : 'text-[#1F2421] hover:bg-white/75'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold truncate">{r.name}</div>
                            <div
                              className={`text-[11px] truncate ${
                                active ? 'text-[#214637]' : 'text-[#565C58]'
                              }`}
                            >
                              {r.style}
                            </div>
                          </div>
                          {active && (
                            <span className="w-6 h-6 rounded-full bg-white/85 flex items-center justify-center shadow-sm shrink-0">
                              <Check className="w-3.5 h-3.5 text-[#13251D] stroke-[2.75]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* TAB 2: MODÈLE DE LECTURE & FOND */}
            {activeTab === 'style_bg' && (
              <div className="space-y-5">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#1F2421]">
                      <Sparkles className="w-3.5 h-3.5 text-[#1B573E] shrink-0" />
                      <span>Modèle de lecture</span>
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-[#565C58] tabular-nums">
                      {VIDEO_TEMPLATE_PRESETS.length} styles
                    </span>
                  </div>
                  <StudioTemplateGrid
                    selectedTemplate={flowMode}
                    onSelect={setFlowMode}
                    isLandscape={activeFormat.aspectLabel !== '9:16'}
                  />
                </div>

                <div className="pt-4 border-t border-[#D4D1C8] flex flex-wrap gap-2 text-xs font-semibold">
                  {[
                    { label: 'Arabe', val: showArabic, toggle: () => setShowArabic((v) => !v) },
                    { label: 'Tajweed', val: useTajweed, toggle: () => setUseTajweed((v) => !v) },
                    { label: 'Phonétique', val: showPhonetics, toggle: () => setShowPhonetics((v) => !v) },
                    { label: 'Français', val: showFrench, toggle: () => setShowFrench((v) => !v) },
                    { label: 'Titre', val: showSurahHeader, toggle: () => setShowSurahHeader((v) => !v) },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      aria-pressed={item.val}
                      onClick={item.toggle}
                      className={`h-8 px-3.5 rounded-full inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                        item.val
                          ? 'studio-pill-mint'
                          : 'studio-pill-raised text-[#565C58]'
                      }`}
                    >
                      {item.val && <Check className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#D4D1C8]">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-[#565C58]">Taille</div>
                    <div className="grid grid-cols-3 gap-1 p-1 rounded-full studio-well-inset text-xs font-semibold">
                      {(['compact', 'standard', 'grand'] as const).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          data-testid={`studio-text-scale-${sz}`}
                          onClick={() => setTextScale(sz)}
                          className={`h-8 rounded-full cursor-pointer transition-all ${
                            textScale === sz
                              ? 'studio-pill-mint'
                              : 'text-[#4F5551] hover:text-[#1F2421]'
                          }`}
                        >
                          {sz === 'compact' ? 'S' : sz === 'standard' ? 'M' : 'L'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-[#565C58]">Vitesse</div>
                    <div className="grid grid-cols-3 gap-1 p-1 rounded-full studio-well-inset text-xs font-semibold tabular-nums">
                      {([0.9, 1.0, 1.15] as const).map((pace) => (
                        <button
                          key={pace}
                          type="button"
                          data-testid={`studio-pace-${pace}`}
                          onClick={() => setPaceMultiplier(pace)}
                          className={`h-8 rounded-full cursor-pointer transition-all ${
                            paceMultiplier === pace
                              ? 'studio-pill-mint'
                              : 'text-[#4F5551] hover:text-[#1F2421]'
                          }`}
                        >
                          {pace}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {/* FOND & SURFACE (Unified in Modèle & Fond Tab) */}
                <section
                  data-testid="studio-bg-section"
                  className="pt-4 border-t border-[#D4D1C8] space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#1F2421]">
                      <ImageIcon className="w-3.5 h-3.5 text-[#1B573E] shrink-0" />
                      <span>Fond & Surface</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                    {[
                      { id: 'all' as const, label: 'Tous' },
                      { id: 'custom' as const, label: `Médias (${customMedia.length})`, testId: 'studio-bg-filter-custom' },
                      { id: 'noir' as const, label: 'Noir' },
                      { id: 'blanc' as const, label: 'Blanc' },
                      { id: '4k' as const, label: '4K' },
                    ].map((flt) => (
                      <button
                        key={flt.id}
                        type="button"
                        data-testid={flt.testId}
                        onClick={() => setBgFilter(flt.id)}
                        className={`h-8 px-3 rounded-full cursor-pointer transition-all whitespace-nowrap ${
                          bgFilter === flt.id ? 'studio-pill-mint' : 'studio-pill-raised'
                        }`}
                      >
                        {flt.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    data-testid="studio-upload-media-btn"
                    aria-label="Importer une photo ou vidéo"
                    title="Importer une photo ou vidéo"
                    disabled={isSavingMedia}
                    onClick={() => mediaFileInputRef.current?.click()}
                    className="w-9 h-9 rounded-full studio-pill-mint flex items-center justify-center cursor-pointer transition-all disabled:opacity-60 shrink-0"
                  >
                    {isSavingMedia ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Tactile Soft-3D Color Circles */}
                <div className="flex items-center gap-3 py-1">
                  {STUDIO_SOLID_BACKGROUNDS.map((swatch) => {
                    const active = bgId === swatch.id;
                    return (
                      <button
                        key={swatch.id}
                        type="button"
                        aria-label={swatch.name}
                        title={swatch.name}
                        onClick={() => setBgId(swatch.id)}
                        className={`w-8 h-8 rounded-full cursor-pointer transition-transform shadow-[0_4px_10px_rgba(24,28,26,0.18),inset_0_1px_1px_rgba(255,255,255,0.5)] ${
                          active
                            ? 'ring-[3px] ring-[#82C4A9] ring-offset-2 ring-offset-[#EAE8E1] scale-110'
                            : 'ring-1 ring-[#C2BFB6] hover:scale-105'
                        }`}
                        style={{ backgroundColor: swatch.color }}
                      />
                    );
                  })}
                  {isLoadingLibrary && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#565C58] ml-auto" />
                  )}
                </div>

                {activeCustomMedia?.kind === 'video' && (
                  <div
                    data-testid="studio-video-duration-mode-panel"
                    className="grid grid-cols-2 gap-1.5 p-1 rounded-full studio-well-inset text-xs font-semibold"
                  >
                    <button
                      type="button"
                      data-testid="studio-duration-mode-match-video"
                      onClick={() => setDurationMode('match_video')}
                      className={`h-8 px-2 rounded-full cursor-pointer transition-all tabular-nums truncate ${
                        durationMode === 'match_video'
                          ? 'studio-pill-mint'
                          : 'text-[#4F5551] hover:text-[#1F2421]'
                      }`}
                    >
                      Vidéo complète
                      {activeCustomMedia.durationSec
                        ? ` (${formatTimeMMSS(activeCustomMedia.durationSec)})`
                        : ''}
                    </button>
                    <button
                      type="button"
                      data-testid="studio-duration-mode-verses"
                      onClick={() => setDurationMode('verses')}
                      className={`h-8 px-2 rounded-full cursor-pointer transition-all tabular-nums truncate ${
                        durationMode === 'verses'
                          ? 'studio-pill-mint'
                          : 'text-[#4F5551] hover:text-[#1F2421]'
                      }`}
                    >
                      Versets ({formatTimeMMSS(baseTimeline.totalDurationSec)})
                    </button>
                  </div>
                )}

                {bgFilter === 'custom' && customMedia.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => mediaFileInputRef.current?.click()}
                    className="w-full py-8 rounded-2xl studio-input-inset border-dashed border-2 border-[#CFCBC2] hover:border-[#9CE2C5] text-center space-y-1.5 cursor-pointer transition-colors"
                  >
                    <Upload className="w-5 h-5 text-[#1B573E] mx-auto" />
                    <div className="text-xs font-semibold text-[#1F2421]">
                      Importer photo ou vidéo
                    </div>
                  </button>
                ) : (
                  <div
                    data-testid="studio-backgrounds-strip"
                    className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[250px] overflow-y-auto no-scrollbar pr-0.5 py-0.5"
                  >
                    {visibleBackgroundCards.map((bg) => {
                      const active = bgId === bg.id;
                      return (
                        <div
                          key={bg.id}
                          onClick={() => {
                            setBgId(bg.id);
                            if (bg.kind === 'video') {
                              setDurationMode('match_video');
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={bg.name}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setBgId(bg.id);
                              if (bg.kind === 'video') {
                                setDurationMode('match_video');
                              }
                            }
                          }}
                          data-testid={`studio-bg-card-${bg.id}`}
                          className={`relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer transition-all ${
                            active
                              ? 'ring-[3px] ring-[#82C4A9] shadow-[0_6px_14px_rgba(68,140,110,0.3)]'
                              : 'ring-1 ring-[#C6C3BA] shadow-[0_3px_8px_rgba(24,28,26,0.09)] hover:ring-[#9E9B92]'
                          }`}
                        >
                          {bg.kind === 'video' ? (
                            <video
                              src={bg.url}
                              muted
                              loop
                              playsInline
                              autoPlay
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={bg.thumbUrl || bg.url}
                              alt={bg.name}
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          )}

                          <div className="relative z-10 p-1.5 flex items-start justify-between">
                            {bg.kind === 'video' ? (
                              <span className="px-1.5 py-0.5 rounded-full bg-white/90 text-[#13251D] text-[10px] font-bold inline-flex items-center gap-0.5 tabular-nums shadow-sm">
                                <Video className="w-2.5 h-2.5" />
                                {'durationSec' in bg && bg.durationSec
                                  ? formatTimeMMSS(bg.durationSec)
                                  : ''}
                              </span>
                            ) : (
                              <span />
                            )}
                            {bg.isCustom && (
                              <button
                                type="button"
                                aria-label={`Supprimer ${bg.name}`}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  handleRemoveCustomMedia(bg.id);
                                }}
                                className="w-6 h-6 rounded-full bg-white/90 text-[#9B3431] hover:bg-[#EE9B98] hover:text-[#591A18] flex items-center justify-center cursor-pointer shadow-sm"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Image / Video Background Adjustments (0 - 100) */}
                {activeMediaKind !== 'solid' && (
                  <div
                    data-testid="studio-bg-adjustments-panel"
                    className="pt-3 border-t border-[#D4D1C8] space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-[#1F2421]">
                        Réglages du fond (0–100)
                      </span>
                      {(bgBrightness !== 50 || bgSharpness !== 50 || bgContrast !== 50) && (
                        <button
                          type="button"
                          data-testid="studio-bg-adjustments-reset-btn"
                          onClick={() => {
                            setBgBrightness(50);
                            setBgSharpness(50);
                            setBgContrast(50);
                          }}
                          className="h-6 px-2.5 rounded-full studio-pill-raised text-[10.5px] font-semibold text-[#1B573E] cursor-pointer"
                        >
                          Réinitialiser
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {[
                        {
                          id: 'brightness',
                          label: 'Luminosité',
                          val: bgBrightness,
                          onChange: setBgBrightness,
                        },
                        {
                          id: 'sharpness',
                          label: 'Netteté',
                          val: bgSharpness,
                          onChange: setBgSharpness,
                        },
                        {
                          id: 'contrast',
                          label: 'Contraste',
                          val: bgContrast,
                          onChange: setBgContrast,
                        },
                      ].map((ctrl) => (
                        <label
                          key={ctrl.id}
                          className="grid grid-cols-[76px_1fr_32px] items-center gap-2.5 cursor-pointer"
                        >
                          <span className="text-[11px] font-semibold text-[#4F5551]">
                            {ctrl.label}
                          </span>
                          <input
                            type="range"
                            data-testid={`studio-bg-slider-${ctrl.id}`}
                            aria-label={ctrl.label}
                            min={0}
                            max={100}
                            step={1}
                            value={ctrl.val}
                            onChange={(e) => ctrl.onChange(Number(e.target.value))}
                            className="w-full studio-range-mint cursor-pointer"
                          />
                          <span className="text-[11px] font-mono font-bold text-[#1F2421] tabular-nums text-right">
                            {ctrl.val}
                          </span>
                        </label>
                      ))}
                    </div>

                    {activeMediaKind === 'image' && (
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={bgImageMotion}
                        data-testid="studio-bg-motion-checkbox"
                        onClick={() => setBgImageMotion((prev) => !prev)}
                        className={`w-full mt-1 px-3 py-2.5 rounded-2xl flex items-center gap-3 text-left cursor-pointer transition-all ${
                          bgImageMotion ? 'studio-pill-mint' : 'studio-pill-raised'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
                            bgImageMotion
                              ? 'bg-[#1B573E] text-white shadow-sm'
                              : 'bg-white/85 border border-[#B8B5AC] text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.75]" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11.5px] font-bold text-[#1F2421] leading-tight">
                            Mouvement doux (zoom / dézoom)
                          </div>
                          <div className="text-[10px] text-[#565C58] leading-tight mt-0.5">
                            Légers va-et-vient lents sur l&apos;image jusqu&apos;à la fin de la vidéo
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                )}

                {/* Bottom Readability & Color Controls */}
                <div
                  data-testid="studio-bottom-readability-panel"
                  className="pt-3 border-t border-[#D4D1C8] space-y-3.5"
                >
                  {/* Row 1: Polarity + Contre-fond noir + Ombre */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-[#565C58]">Texte</div>
                      <div className="grid grid-cols-3 gap-1 p-1 rounded-full studio-well-inset text-xs font-semibold">
                        {[
                          { id: 'auto' as const, label: 'Auto' },
                          { id: 'light' as const, label: 'Blanc' },
                          { id: 'dark' as const, label: 'Noir' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            data-testid={`studio-text-polarity-${opt.id}`}
                            onClick={() => {
                              setTextColorOverride(opt.id);
                              setArabicTextColor(null);
                              setPhoneticsTextColor(null);
                              setFrenchTextColor(null);
                            }}
                            className={`h-7 rounded-full cursor-pointer transition-all ${
                              textColorOverride === opt.id && !hasCustomTextColors
                                ? 'studio-pill-mint'
                                : 'text-[#4F5551] hover:text-[#1F2421]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-[#565C58]">Lisibilité</div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
                        <button
                          type="button"
                          data-testid="studio-black-backdrop-btn"
                          aria-pressed={bgBlackBackdrop}
                          onClick={() => {
                            setBgBlackBackdrop((prev) => {
                              const next = !prev;
                              if (next && bgVeilOpacity < 0.35) {
                                setBgVeilOpacity(0.45);
                              }
                              return next;
                            });
                          }}
                          className={`h-9 px-2.5 rounded-full cursor-pointer transition-all truncate ${
                            bgBlackBackdrop ? 'studio-pill-mint' : 'studio-pill-raised text-[#4F5551]'
                          }`}
                        >
                          Contre-fond noir
                        </button>
                        <button
                          type="button"
                          data-testid="studio-text-shadow-btn"
                          aria-pressed={textShadowBoost}
                          onClick={() => setTextShadowBoost((v) => !v)}
                          className={`h-9 px-2.5 rounded-full cursor-pointer transition-all truncate ${
                            textShadowBoost ? 'studio-pill-mint' : 'studio-pill-raised text-[#4F5551]'
                          }`}
                        >
                          Ombre texte
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Assombrissement / Voile (0 -> 100%) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-[#565C58]">
                        {bgBlackBackdrop ? 'Contre-fond noir (opacité)' : 'Voile'}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-[#1F2421] tabular-nums">
                        {Math.round(bgVeilOpacity * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="range"
                        data-testid="studio-veil-slider"
                        aria-label="Intensité du voile noir"
                        min={0}
                        max={90}
                        step={1}
                        value={Math.round(bgVeilOpacity * 100)}
                        onChange={(e) => setBgVeilOpacity(Number(e.target.value) / 100)}
                        className="flex-1 min-w-0 studio-range-mint cursor-pointer"
                      />
                      <div className="flex items-center gap-1 p-0.5 rounded-full studio-well-inset text-[10.5px] font-semibold tabular-nums shrink-0">
                        {[0, 0.25, 0.45, 0.65].map((alpha) => (
                          <button
                            key={alpha}
                            type="button"
                            onClick={() => setBgVeilOpacity(alpha)}
                            className={`h-6 px-2 rounded-full cursor-pointer transition-all ${
                              Math.abs(bgVeilOpacity - alpha) < 0.02
                                ? 'studio-pill-mint'
                                : 'text-[#4F5551] hover:text-[#1F2421]'
                            }`}
                          >
                            {Math.round(alpha * 100)}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Custom Text Colors (Target + 10 Swatches BEFORE Color Wheel Circle) */}
                  <div className="space-y-2 pt-2 border-t border-[#D4D1C8]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-[#565C58]">
                        Couleur d’écriture
                      </span>
                      {hasCustomTextColors && (
                        <button
                          type="button"
                          data-testid="studio-text-color-reset-btn"
                          onClick={() => {
                            setArabicTextColor(null);
                            setPhoneticsTextColor(null);
                            setFrenchTextColor(null);
                          }}
                          className="h-6 px-2.5 rounded-full studio-pill-raised text-[10.5px] font-semibold text-[#1B573E] cursor-pointer"
                        >
                          Couleur auto
                        </button>
                      )}
                    </div>

                    {/* Target Switcher: Tout / Arabe / Transcrit / Français */}
                    <div
                      data-testid="studio-color-target-group"
                      className="grid grid-cols-4 gap-1 p-1 rounded-full studio-well-inset text-[11px] font-semibold"
                    >
                      {[
                        { id: 'all' as const, label: 'Tout', dotColor: null },
                        { id: 'arabic' as const, label: 'Arabe', dotColor: arabicTextColor },
                        { id: 'phonetics' as const, label: 'Transcrit', dotColor: phoneticsTextColor },
                        { id: 'french' as const, label: 'Français', dotColor: frenchTextColor },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          data-testid={`studio-color-target-${t.id}`}
                          onClick={() => setColorTarget(t.id)}
                          className={`h-7 px-1.5 rounded-full inline-flex items-center justify-center gap-1 cursor-pointer transition-all truncate ${
                            colorTarget === t.id
                              ? 'studio-pill-mint'
                              : 'text-[#4F5551] hover:text-[#1F2421]'
                          }`}
                        >
                          <span>{t.label}</span>
                          {t.dotColor && (
                            <span
                              className="w-2 h-2 rounded-full ring-1 ring-black/20 shrink-0"
                              style={{ backgroundColor: t.dotColor }}
                            />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* 10 Curated Color Swatches BEFORE the Color Wheel Circle */}
                    <div
                      data-testid="studio-text-color-swatches"
                      className="flex flex-wrap items-center gap-2 pt-0.5"
                    >
                      {STUDIO_TEXT_COLOR_SWATCHES.map((sw, idx) => {
                        const isSelected =
                          activeTargetColorHex.toUpperCase() === sw.hex.toUpperCase() &&
                          (colorTarget === 'all'
                            ? arabicTextColor?.toUpperCase() === sw.hex.toUpperCase() &&
                              frenchTextColor?.toUpperCase() === sw.hex.toUpperCase()
                            : colorTarget === 'arabic'
                            ? arabicTextColor?.toUpperCase() === sw.hex.toUpperCase()
                            : colorTarget === 'phonetics'
                            ? phoneticsTextColor?.toUpperCase() === sw.hex.toUpperCase()
                            : frenchTextColor?.toUpperCase() === sw.hex.toUpperCase());
                        return (
                          <button
                            key={sw.hex}
                            type="button"
                            data-testid={`studio-color-swatch-${idx}`}
                            aria-label={`Couleur ${sw.label}`}
                            title={sw.label}
                            onClick={() => applyCustomTextColor(sw.hex)}
                            className={`w-6 h-6 rounded-full cursor-pointer transition-transform shadow-[0_2px_6px_rgba(24,28,26,0.18)] ${
                              isSelected
                                ? 'ring-[2.5px] ring-[#1B573E] ring-offset-2 ring-offset-[#EAE8E1] scale-110'
                                : 'ring-1 ring-[#B8B5AC] hover:scale-110'
                            }`}
                            style={{ backgroundColor: sw.hex }}
                          />
                        );
                      })}

                      {/* Rainbow Color Wheel Circle positioned AFTER the 10 color presets */}
                      <label
                        data-testid="studio-color-wheel-label"
                        title="Cercle des couleurs"
                        aria-label="Cercle des couleurs personnalisé"
                        className="relative w-7 h-7 rounded-full cursor-pointer flex items-center justify-center shadow-[0_2px_8px_rgba(24,28,26,0.22)] ring-1 ring-white/70 hover:scale-110 transition-transform shrink-0"
                        style={{
                          background:
                            'conic-gradient(#EF4444, #F59E0B, #EAB308, #22C55E, #06B6D4, #3B82F6, #A855F7, #EC4899, #EF4444)',
                        }}
                      >
                        <span
                          className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm pointer-events-none"
                          style={{ backgroundColor: activeTargetColorHex }}
                        />
                        <input
                          type="color"
                          data-testid="studio-color-wheel-input"
                          aria-label="Choisir une couleur dans le cercle"
                          value={activeTargetColorHex}
                          onChange={(e) => applyCustomTextColor(e.target.value)}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>
                </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Surah Picker Overlay */}
      {isSurahPickerOpen && (
        <div
          className="fixed inset-0 z-[10060] bg-[#1F2421]/30 backdrop-blur-sm flex items-center justify-center p-3"
          onClick={() => setIsSurahPickerOpen(false)}
        >
          <div
            data-testid="studio-multi-surah-picker-modal"
            className="w-full max-w-lg max-h-[85vh] studio-surface-stacked rounded-3xl p-4 sm:p-5 flex flex-col gap-3 text-[#1F2421]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#1F2421]">
                Sourates ({draftPickerSurahNums.length})
              </h3>
              <button
                type="button"
                onClick={() => setIsSurahPickerOpen(false)}
                aria-label="Fermer la sélection des sourates"
                className="w-8 h-8 rounded-full studio-pill-raised flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 text-[#1F2421]" />
              </button>
            </div>

            <div className="shrink-0 p-1 rounded-full studio-well-inset">
              <div className="relative">
                <Search className="w-4 h-4 text-[#565C58] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={surahQuery}
                  onChange={(e) => setSurahQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full h-9 pl-9 pr-4 rounded-full studio-input-inset text-xs text-[#1F2421] placeholder:text-[#787E7A]"
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar divide-y divide-[#D4D1C8] rounded-2xl studio-input-inset p-1">
              {filteredSurahs.map((s) => {
                const checked = draftPickerSurahNums.includes(s.number);
                return (
                  <button
                    key={s.number}
                    type="button"
                    data-testid={`surah-picker-option-${s.number}`}
                    aria-pressed={checked}
                    onClick={() => toggleDraftSurah(s.number)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left cursor-pointer transition-colors ${
                      checked
                        ? 'bg-[#9ED9C1]/50 text-[#11221A]'
                        : 'hover:bg-[#DFDDD5]/70 text-[#1F2421]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          checked
                            ? 'bg-[#83C6AA] border-[#5BB68F] text-[#11221A]'
                            : 'border-[#B8B5AC] bg-[#F2F0EA]'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                      <span className="text-xs font-semibold truncate">
                        {s.number}. {s.name}
                      </span>
                    </div>
                    <span className="font-arabic text-base text-[#1B573E] shrink-0 pl-2" dir="rtl">
                      {s.arabicName}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              data-testid="surah-picker-confirm-btn"
              onClick={confirmSurahPicker}
              className="shrink-0 w-full h-11 rounded-full studio-pill-mint font-bold text-xs cursor-pointer transition-all"
            >
              Valider ({draftPickerSurahNums.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};