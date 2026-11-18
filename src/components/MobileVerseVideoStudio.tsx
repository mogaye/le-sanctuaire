import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  X,
  Film,
  Play,
  Pause,
  Download,
  Share2,
  BookOpen,
  Headphones,
  Image as ImageIcon,
  Sparkles,
  Check,
  Search,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Square,
  SlidersHorizontal,
  Loader2,
  Upload,
  Video,
  Trash2,
  Volume2,
  VolumeX,
  Monitor,
  Smartphone,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
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
import { TajweedText, cleanAyahArabic } from '../utils/tajweedColorizer';
import {
  StudioAyahItem,
  StudioSurahSelection,
  VIDEO_FORMAT_PRESETS,
  VIDEO_TEMPLATE_PRESETS,
  VideoFormatId,
  VideoTemplateId,
  YouTubeSurahSummaryItem,
  buildContinuousTimeline,
  buildMultiSurahVideoSequence,
  buildStudioExportFilename,
  formatTimeMMSS,
  getVideoFormatPreset,
  normalizeVerseRange,
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
  MANDATORY_WATERMARK_BRAND,
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
} from '../utils/studioMediaLibrary';
import { StudioTemplateGrid } from './video-studio/StudioTemplateGrid';
import { StudioLiveMonitor } from './video-studio/StudioLiveMonitor';
import { YouTubePublishCard } from './video-studio/YouTubePublishCard';

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
  sizeBytes?: number;
  syncedToServer?: boolean;
}

type StudioStage = 'setup' | 'player' | 'export';
type StudioTab = 'verses' | 'style' | 'bg' | 'audio';
type DownloadStatus = 'idle' | 'preparing' | 'done' | 'error';

const MAX_STAGE_DOWNLOAD_BYTES = 150 * 1024 * 1024;

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
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    video.style.position = 'fixed';
    video.style.left = '-9999px';
    video.style.width = '2px';
    video.style.height = '2px';
    video.style.opacity = '0.001';
    video.style.pointerEvents = 'none';
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

    const timeout = setTimeout(() => finish(video.readyState >= 2), 6000);
    video.onloadeddata = () => finish(true);
    video.oncanplay = () => finish(true);
    video.onerror = () => finish(false);
    video.load();
  });
}

async function stageVideoBlobOnServer(
  blob: Blob,
  filename: string,
  signal?: AbortSignal
): Promise<string | null> {
  if (!blob || blob.size === 0 || blob.size > MAX_STAGE_DOWNLOAD_BYTES) {
    return null;
  }
  try {
    const res = await fetch('/api/video/stage-download', {
      method: 'POST',
      headers: {
        'Content-Type': blob.type || 'video/mp4',
        'x-download-filename': filename,
        'x-download-mime': blob.type || 'video/mp4',
      },
      body: blob,
      signal,
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return typeof json?.downloadUrl === 'string' ? json.downloadUrl : null;
  } catch {
    return null;
  }
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

  // Format (PC-only selectable; Mobile strictly locked to 9:16)
  const [videoFormatId, setVideoFormatId] = useState<VideoFormatId>(() => {
    const prefs = loadStudioBgPreferences();
    if (
      prefs.videoFormatId &&
      VIDEO_FORMAT_PRESETS.some((f) => f.id === prefs.videoFormatId)
    ) {
      return prefs.videoFormatId as VideoFormatId;
    }
    return 'youtube_1080p';
  });

  const activeFormat = useMemo(
    () => getVideoFormatPreset(videoFormatId, !isPcMode),
    [videoFormatId, isPcMode]
  );

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<StudioTab>('verses');

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

  // Background Selection + Persistent Site Media Library
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
  const [monitorAudioDuringExport, setMonitorAudioDuringExport] = useState<boolean>(true);

  // Pickers inside Setup
  const [isSurahPickerOpen, setIsSurahPickerOpen] = useState<boolean>(false);
  const [surahQuery, setSurahQuery] = useState<string>('');
  const [draftPickerSurahNums, setDraftPickerSurahNums] = useState<number[]>([]);
  const [isReciterPickerOpen, setIsReciterPickerOpen] = useState<boolean>(false);

  // Active Stage ('setup' | 'player' | 'export')
  const [stage, setStage] = useState<StudioStage>('setup');

  // Continuous Playback State (for Stage = 'player')
  const [playerStatus, setPlayerStatus] = useState<'loading' | 'playing' | 'paused' | 'ended'>(
    'loading'
  );
  const [playerLoadProgress, setPlayerLoadProgress] = useState<{ loaded: number; total: number }>({
    loaded: 0,
    total: 0,
  });
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [playerHudVisible, setPlayerHudVisible] = useState<boolean>(true);
  const [measuredDurations, setMeasuredDurations] = useState<Array<number | undefined>>([]);

  // Export & Download State (for Stage = 'export')
  const [exportStatus, setExportStatus] = useState<
    'preparing_audio' | 'recording' | 'finalizing' | 'ready' | 'error'
  >('preparing_audio');
  const [exportStatusMessage, setExportStatusMessage] = useState<string>('');
  const [exportProgressPct, setExportProgressPct] = useState<number>(0);
  const [exportElapsedSec, setExportElapsedSec] = useState<number>(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedVideoBlob, setExportedVideoBlob] = useState<Blob | null>(null);
  const [exportedFileExt, setExportedFileExt] = useState<string>('mp4');
  const [stagedDownloadUrl, setStagedDownloadUrl] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>('idle');
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);
  const [exportedAudioInfo, setExportedAudioInfo] = useState<{
    okCount: number;
    totalCount: number;
    mime: string;
  } | null>(null);
  const [exportErrorMsg, setExportErrorMsg] = useState<string | null>(null);
  const [canFinishEarly, setCanFinishEarly] = useState<boolean>(false);

  // Refs
  const wasOpenRef = useRef<boolean>(false);
  const loadedSurahsRef = useRef<Record<number, LoadedStudioSurah>>({});
  loadedSurahsRef.current = loadedSurahs;

  const audioCtxRef = useRef<AudioContext | null>(null);
  const decodedBuffersRef = useRef<DecodedVerseBuffer[]>([]);
  const playbackHandleRef = useRef<ScheduledPlaybackHandle | null>(null);
  const keepaliveRef = useRef<ReturnType<typeof attachAudioStreamKeepalive> | null>(null);
  const exportBgVideoRef = useRef<HTMLVideoElement | null>(null);
  const playerBgVideoRef = useRef<HTMLVideoElement | null>(null);
  const playerBgImageRef = useRef<HTMLImageElement | null>(null);
  const playerLayoutRef = useRef<ReturnType<typeof precomputeVideoCanvasLayout> | null>(null);
  const playerRenderOptsRef = useRef<VideoCanvasRenderOptions | null>(null);
  const playerTimelineRef = useRef<ReturnType<typeof buildContinuousTimeline> | null>(null);
  const playbackStartCtxTimeRef = useRef<number>(0);
  const playbackStartOffsetRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const hudHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mediaFileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const playerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const hasRecorderChunkRef = useRef<boolean>(false);

  useWakeLock(isOpen && stage !== 'setup');

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
            } catch {}
          }
          return;
        }
        for (const prev of customMediaRef.current) {
          try {
            URL.revokeObjectURL(prev.url);
          } catch {}
        }
        setCustomMedia(items);
        const prefs = loadStudioBgPreferences();
        if (prefs.bgId) {
          const existsInCustom = items.some((m) => m.id === prefs.bgId);
          const existsInBuiltIn =
            STUDIO_SOLID_BACKGROUNDS.some((s) => s.id === prefs.bgId) ||
            MOBILE_VERTICAL_BACKGROUNDS.some((b) => b.id === prefs.bgId) ||
            STUDIO_4K_BACKGROUNDS.some((b) => b.id === prefs.bgId);
          if (existsInCustom || existsInBuiltIn) {
            setBgId(prefs.bgId);
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

  // Persist background, template & PC format choices
  useEffect(() => {
    saveStudioBgPreferences({
      bgId,
      textColorOverride,
      bgVeilOpacity,
      videoFormatId,
      flowMode,
    });
  }, [bgId, textColorOverride, bgVeilOpacity, videoFormatId, flowMode]);

  // Initialize selection strictly on closed -> open transition so parent ayah updates
  // never overwrite user multi-surah selection or active export/player stage.
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
      setStage('setup');
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, initialSurahNum, initialStartAyah, initialReciter?.id]);

  // Parallel non-destructive loader for all selected Surahs
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

  const videoSequence = useMemo(
    () => buildMultiSurahVideoSequence(selectedSurahs, loadedVersesMap, ALL_114_SURAHS),
    [selectedSurahs, loadedVersesMap]
  );

  const totalSelectedVerses = useMemo(
    () => videoSequence.filter((v) => !v.isBismillah).length,
    [videoSequence]
  );

  const hasBismillahIntro = useMemo(
    () => videoSequence.some((v) => v.isBismillah),
    [videoSequence]
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

  const youtubeSelectedSurahs: YouTubeSurahSummaryItem[] = useMemo(
    () =>
      selectedSurahs.map((sel) => {
        const meta = getSurahMeta(sel.surahNumber);
        const norm = normalizeVerseRange(sel.startAyah, sel.endAyah, meta.numberOfAyahs);
        return {
          surahNumber: sel.surahNumber,
          surahName: meta.name,
          surahArabicName: meta.arabicName,
          startAyah: norm.startAyah,
          endAyah: norm.endAyah,
          totalAyahsInSurah: meta.numberOfAyahs,
        };
      }),
    [selectedSurahs]
  );

  const sequenceSignature = useMemo(
    () =>
      selectedSurahs
        .map((s) => `${s.surahNumber}:${s.startAyah}-${s.endAyah}`)
        .join('|'),
    [selectedSurahs]
  );

  useEffect(() => {
    setMeasuredDurations([]);
  }, [sequenceSignature]);

  // Playlist mutation helpers
  const updateSurahRange = useCallback(
    (selectionId: string, startAyah: number, endAyah: number) => {
      setSelectedSurahs((prev) =>
        prev.map((item) => {
          if (item.id !== selectionId) return item;
          const meta = getSurahMeta(item.surahNumber);
          const norm = normalizeVerseRange(startAyah, endAyah, meta.numberOfAyahs);
          return {
            ...item,
            startAyah: norm.startAyah,
            endAyah: norm.endAyah,
          };
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
  const activeMediaName: string = activeCustomMedia
    ? activeCustomMedia.name
    : activeVerticalBg?.name || active4kBg?.name || activeSolidBg?.name || 'Fond uni';

  const isLightSurface = useMemo(() => {
    if (textColorOverride === 'dark') return true;
    if (textColorOverride === 'light') return false;
    if (activeSolidBg) return activeSolidBg.polarity === 'light';
    if (activeVerticalBg) return activeVerticalBg.polarity === 'light';
    if (active4kBg) return active4kBg.polarity === 'light';
    return false;
  }, [textColorOverride, activeSolidBg, activeVerticalBg, active4kBg]);

  const bgSurfaceColor = useMemo(() => {
    if (activeSolidBg) return activeSolidBg.color;
    return isLightSurface ? '#FCFCFB' : '#050505';
  }, [activeSolidBg, isLightSurface]);

  const visibleBackgroundCards = useMemo(() => {
    const customCards = customMedia.map((m) => ({
      id: m.id,
      name: m.name,
      url: m.url,
      kind: m.kind,
      sizeBytes: m.sizeBytes,
      isCustom: true,
    }));
    const verticalCards = MOBILE_VERTICAL_BACKGROUNDS.map((b) => ({
      id: b.id,
      name: b.name,
      url: b.url,
      category: b.category,
      kind: 'image' as const,
      isCustom: false,
    }));
    const fourKCards = STUDIO_4K_BACKGROUNDS.map((b) => ({
      id: b.id,
      name: b.name,
      url: b.url,
      kind: 'image' as const,
      isCustom: false,
    }));

    if (bgFilter === 'custom') return customCards;
    if (bgFilter === 'noir') return verticalCards.filter((b) => b.category === 'noir');
    if (bgFilter === 'blanc') return verticalCards.filter((b) => b.category === 'blanc');
    if (bgFilter === '4k') return fourKCards;
    return [...customCards, ...verticalCards, ...fourKCards];
  }, [bgFilter, customMedia]);

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

  const timeline = useMemo(
    () => buildContinuousTimeline(videoSequence, measuredDurations, paceMultiplier),
    [videoSequence, measuredDurations, paceMultiplier]
  );

  const exportFilename = useMemo(
    () =>
      buildStudioExportFilename({
        selections: selectedSurahs,
        aspectLabel: activeFormat.aspectLabel,
        extension: exportedFileExt,
      }),
    [selectedSurahs, activeFormat.aspectLabel, exportedFileExt]
  );

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
      }
    } finally {
      setIsSavingMedia(false);
      e.target.value = '';
    }
  };

  const handleRemoveCustomMedia = (id: string) => {
    setCustomMedia((prev) => {
      const target = prev.find((m) => m.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((m) => m.id !== id);
    });
    deleteStudioMediaItem(id).catch(() => {});
    if (bgId === id) setBgId('mobile_noir_minimal');
  };

  const stopAllMedia = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (playbackHandleRef.current) {
      playbackHandleRef.current.stop();
      playbackHandleRef.current = null;
    }
    if (keepaliveRef.current) {
      keepaliveRef.current.dispose();
      keepaliveRef.current = null;
    }
    if (hudHideTimerRef.current) {
      clearTimeout(hudHideTimerRef.current);
      hudHideTimerRef.current = null;
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
    if (playerBgVideoRef.current) {
      try {
        playerBgVideoRef.current.pause();
        playerBgVideoRef.current.removeAttribute('src');
        playerBgVideoRef.current.load();
        playerBgVideoRef.current.remove();
      } catch {}
      playerBgVideoRef.current = null;
    }
    playerBgImageRef.current = null;
    playerLayoutRef.current = null;
    playerRenderOptsRef.current = null;
    playerTimelineRef.current = null;
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
  };

  useEffect(() => {
    return () => {
      stopAllMedia();
      if (exportedVideoUrl) {
        URL.revokeObjectURL(exportedVideoUrl);
      }
      for (const item of customMediaRef.current) {
        try {
          URL.revokeObjectURL(item.url);
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopAllMedia();
    }
  }, [isOpen]);

  useEffect(() => {
    if (hudHideTimerRef.current) {
      clearTimeout(hudHideTimerRef.current);
      hudHideTimerRef.current = null;
    }
    if (stage === 'player' && playerStatus === 'playing' && playerHudVisible) {
      hudHideTimerRef.current = setTimeout(() => {
        setPlayerHudVisible(false);
      }, 3000);
    }
    return () => {
      if (hudHideTimerRef.current) {
        clearTimeout(hudHideTimerRef.current);
        hudHideTimerRef.current = null;
      }
    };
  }, [stage, playerStatus, playerHudVisible]);

  const drawLivePlayerFrame = (atSec: number) => {
    const canvas = playerCanvasRef.current;
    const layout = playerLayoutRef.current;
    const opts = playerRenderOptsRef.current;
    const activeTimeline = playerTimelineRef.current;
    if (!canvas || !layout || !opts || !activeTimeline) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;
    renderVideoCanvasFrame(ctx2d, layout, activeTimeline, atSec, opts);
  };

  // =========================================================================
  // STAGE 2 — REAL-TIME CONTINUOUS VIDEO PLAYER ("Lire le contenu")
  // =========================================================================
  const startContinuousPlayer = async () => {
    if (videoSequence.length === 0) return;
    stopAllMedia();
    setStage('player');
    setPlayerStatus('loading');
    setPlayerHudVisible(true);
    setCurrentTimeSec(0);
    setPlayerLoadProgress({ loaded: 0, total: videoSequence.length });

    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextCtor();
    audioCtxRef.current = ctx;
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

    const [decoded, bgImg, bgVideo] = await Promise.all([
      decodeVerseAudioSequence(
        ctx,
        primarySelection.surahNumber,
        videoSequence,
        reciterId,
        (loaded, total) => setPlayerLoadProgress({ loaded, total }),
        abortCtrl.signal
      ),
      bgImgPromise,
      bgVideoPromise,
    ]);

    if (abortCtrl.signal.aborted) {
      if (bgVideo) {
        try {
          bgVideo.pause();
          bgVideo.remove();
        } catch {}
      }
      return;
    }

    playerBgImageRef.current = bgImg;
    playerBgVideoRef.current = bgVideo;
    decodedBuffersRef.current = decoded;

    const durations = decoded.map((d) =>
      d.effectiveDurationSec > 0 ? d.effectiveDurationSec : undefined
    );
    setMeasuredDurations(durations);

    if (document.fonts?.ready) {
      await document.fonts.ready.catch(() => {});
    }

    const exactTimeline = buildContinuousTimeline(videoSequence, durations, paceMultiplier);
    playerTimelineRef.current = exactTimeline;

    const liveWidth = activeFormat.previewWidth;
    const liveHeight = activeFormat.previewHeight;
    const canvas = playerCanvasRef.current;
    if (canvas) {
      canvas.width = liveWidth;
      canvas.height = liveHeight;
      const canvasCtx = canvas.getContext('2d');
      if (canvasCtx) {
        const renderOpts: VideoCanvasRenderOptions = {
          width: liveWidth,
          height: liveHeight,
          surahName: primarySurahMeta.name,
          surahNumber: primarySurahMeta.number,
          startAyah: primaryNormalizedRange.startAyah,
          endAyah: primaryNormalizedRange.endAyah,
          selectedSurahsCount: selectedSurahs.length,
          isLightSurface,
          bgSurfaceColor,
          bgVeilOpacity,
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
        playerRenderOptsRef.current = renderOpts;
        playerLayoutRef.current = precomputeVideoCanvasLayout(
          canvasCtx,
          videoSequence,
          renderOpts
        );
        renderVideoCanvasFrame(canvasCtx, playerLayoutRef.current, exactTimeline, 0, renderOpts);
      }
    }

    beginContinuousAudioFromOffset(ctx, decoded, exactTimeline, 0);
  };

  const beginContinuousAudioFromOffset = (
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

    playerTimelineRef.current = exactTimeline;

    if (playerBgVideoRef.current) {
      try {
        const dur = playerBgVideoRef.current.duration;
        if (Number.isFinite(dur) && dur > 0) {
          playerBgVideoRef.current.currentTime = offsetSec % dur;
        }
        playerBgVideoRef.current.play().catch(() => {});
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
    setPlayerStatus('playing');

    const tick = () => {
      if (!audioCtxRef.current) return;
      const elapsed =
        playbackStartOffsetRef.current +
        (audioCtxRef.current.currentTime - playbackStartCtxTimeRef.current);
      if (elapsed >= exactTimeline.totalDurationSec) {
        setCurrentTimeSec(exactTimeline.totalDurationSec);
        drawLivePlayerFrame(exactTimeline.totalDurationSec);
        if (playerBgVideoRef.current) {
          try {
            playerBgVideoRef.current.pause();
          } catch {}
        }
        setPlayerStatus('ended');
        setPlayerHudVisible(true);
        playbackHandleRef.current?.stop();
        playbackHandleRef.current = null;
        return;
      }
      setCurrentTimeSec(elapsed);
      drawLivePlayerFrame(elapsed);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const togglePlayPauseContinuous = async () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (playerStatus === 'playing') {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      playbackHandleRef.current?.stop();
      playbackHandleRef.current = null;
      if (playerBgVideoRef.current) {
        try {
          playerBgVideoRef.current.pause();
        } catch {}
      }
      setPlayerStatus('paused');
    } else if (playerStatus === 'paused' || playerStatus === 'ended') {
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }
      const nextOffset = playerStatus === 'ended' ? 0 : currentTimeSec;
      const exactTimeline = buildContinuousTimeline(
        videoSequence,
        measuredDurations,
        paceMultiplier
      );
      beginContinuousAudioFromOffset(ctx, decodedBuffersRef.current, exactTimeline, nextOffset);
    }
  };

  const seekContinuousPlayer = (targetSec: number) => {
    const ctx = audioCtxRef.current;
    const exactTimeline = buildContinuousTimeline(
      videoSequence,
      measuredDurations,
      paceMultiplier
    );
    const clamped = Math.max(0, Math.min(exactTimeline.totalDurationSec, targetSec));
    setCurrentTimeSec(clamped);
    if (playerBgVideoRef.current) {
      try {
        const dur = playerBgVideoRef.current.duration;
        if (Number.isFinite(dur) && dur > 0) {
          playerBgVideoRef.current.currentTime = clamped % dur;
        }
      } catch {}
    }
    drawLivePlayerFrame(clamped);
    if (ctx && playerStatus === 'playing') {
      beginContinuousAudioFromOffset(ctx, decodedBuffersRef.current, exactTimeline, clamped);
    }
  };

  // =========================================================================
  // STAGE 3 — MP4 EXPORT & BULLETPROOF DOWNLOAD HANDLER
  // =========================================================================
  const startVideoExport = async () => {
    if (videoSequence.length === 0) return;
    stopAllMedia();
    if (exportedVideoUrl) {
      URL.revokeObjectURL(exportedVideoUrl);
      setExportedVideoUrl(null);
    }
    setExportedVideoBlob(null);
    setStagedDownloadUrl(null);
    setDownloadStatus('idle');
    setDownloadFeedback(null);
    setExportedAudioInfo(null);
    setExportErrorMsg(null);
    setCanFinishEarly(false);
    setExportProgressPct(0);
    setExportElapsedSec(0);
    setStage('export');
    setExportStatus('preparing_audio');
    setExportStatusMessage(
      `Chargement audio continu (${playlistSummaryLabel} · ${videoSequence.length} séquences)...`
    );

    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    const exportW = activeFormat.width;
    const exportH = activeFormat.height;

    try {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextCtor();
      audioCtxRef.current = ctx;
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

      const [decoded, bgImg, bgVideo] = await Promise.all([
        decodeVerseAudioSequence(
          ctx,
          primarySelection.surahNumber,
          videoSequence,
          reciterId,
          (loaded, total) => {
            setPlayerLoadProgress({ loaded, total });
            setExportProgressPct(Math.round((loaded / Math.max(1, total)) * 25));
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

      const okAudioCount = decoded.filter((d) => d.buffer !== null).length;
      if (okAudioCount === 0) {
        throw new Error(
          'Impossible de charger le son de la récitation pour ces versets. Vérifiez votre connexion internet et réessayez.'
        );
      }

      const durations = decoded.map((d) =>
        d.effectiveDurationSec > 0 ? d.effectiveDurationSec : undefined
      );
      setMeasuredDurations(durations);
      const exactTimeline = buildContinuousTimeline(videoSequence, durations, paceMultiplier);

      if (document.fonts?.ready) {
        await document.fonts.ready.catch(() => {});
      }

      const canvas = previewCanvasRef.current;
      if (!canvas) {
        throw new Error('Surface vidéo indisponible.');
      }
      canvas.width = exportW;
      canvas.height = exportH;
      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx) {
        throw new Error('Contexte graphique 2D indisponible.');
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

      const layout = precomputeVideoCanvasLayout(canvasCtx, videoSequence, renderOpts);
      renderVideoCanvasFrame(canvasCtx, layout, exactTimeline, 0, renderOpts);

      setExportStatus('recording');
      setExportStatusMessage(
        `Encodage ${activeFormat.aspectLabel} (${exportW}×${exportH}) — ${okAudioCount}/${videoSequence.length} séquences...`
      );

      if (ctx.state !== 'running') {
        await ctx.resume().catch(() => {});
      }

      const exportResult = await exportQuranVideoToMp4({
        canvas,
        canvasCtx,
        layout,
        ayahs: videoSequence,
        timeline: exactTimeline,
        renderOpts,
        audioCtx: ctx,
        decodedBuffers: decoded,
        paceMultiplier,
        monitorAudioDuringExport,
        abortSignal: abortCtrl.signal,
        onProgress: (pct, elapsedSec, statusText) => {
          setExportProgressPct(pct);
          setExportElapsedSec(elapsedSec);
          setExportStatusMessage(statusText);
          if (pct >= 90) setExportStatus('finalizing');
        },
        onKeepaliveReady: (ka) => {
          keepaliveRef.current = ka;
        },
        onMediaRecorderReady: (rec) => {
          mediaRecorderRef.current = rec;
          hasRecorderChunkRef.current = false;
        },
        onRecordingChunkAvailable: () => {
          hasRecorderChunkRef.current = true;
          const activeRec = mediaRecorderRef.current;
          if (activeRec && activeRec.state === 'recording') {
            setTimeout(() => {
              if (
                mediaRecorderRef.current === activeRec &&
                activeRec.state === 'recording' &&
                hasRecorderChunkRef.current
              ) {
                setCanFinishEarly(true);
              }
            }, 600);
          }
        },
      });

      if (audioCtxRef.current === ctx) {
        try {
          ctx.close();
        } catch {}
        audioCtxRef.current = null;
      }

      if (abortCtrl.signal.aborted) return;

      if (exportBgVideoRef.current) {
        try {
          exportBgVideoRef.current.pause();
          exportBgVideoRef.current.removeAttribute('src');
          exportBgVideoRef.current.load();
          exportBgVideoRef.current.remove();
        } catch {}
        exportBgVideoRef.current = null;
      }

      const url = URL.createObjectURL(exportResult.blob);
      const nextFilename = buildStudioExportFilename({
        selections: selectedSurahs,
        aspectLabel: activeFormat.aspectLabel,
        extension: exportResult.extension,
      });

      setExportedVideoBlob(exportResult.blob);
      setExportedVideoUrl(url);
      setExportedFileExt(exportResult.extension);
      setExportedAudioInfo({
        okCount: okAudioCount,
        totalCount: videoSequence.length,
        mime: exportResult.mimeType,
      });
      setExportProgressPct(100);
      setExportStatus('ready');
      setExportStatusMessage(
        `Vidéo MP4 ${activeFormat.aspectLabel} prête (${okAudioCount}/${videoSequence.length} séquences)`
      );

      // Background stage for iframe / WebView HTTP Attachment fallback
      stageVideoBlobOnServer(exportResult.blob, nextFilename, abortCtrl.signal).then(
        (stagedUrl) => {
          if (!abortCtrl.signal.aborted && stagedUrl) {
            setStagedDownloadUrl(stagedUrl);
          }
        }
      );
    } catch (err: any) {
      if (!abortCtrl.signal.aborted) {
        setExportStatus('error');
        setExportErrorMsg(
          err?.message || 'Impossible de générer la vidéo MP4 sur cet appareil.'
        );
      }
    }
  };

  const handleDownloadVideo = async () => {
    if (!exportedVideoUrl && !exportedVideoBlob) return;
    setDownloadStatus('preparing');
    setDownloadFeedback('Préparation du fichier...');

    try {
      let blob = exportedVideoBlob;
      if (!blob && exportedVideoUrl) {
        const res = await fetch(exportedVideoUrl);
        blob = await res.blob();
      }
      if (!blob || blob.size === 0) {
        throw new Error('Fichier vidéo introuvable en mémoire.');
      }

      let targetHref: string | null = null;
      let objectUrlToRevoke: string | null = null;
      const inIframe = (() => {
        try {
          return window.self !== window.top;
        } catch {
          return true;
        }
      })();

      // Inside iframes, prefer real HTTP Content-Disposition attachment relay when available
      if (inIframe) {
        let relayUrl = stagedDownloadUrl;
        if (!relayUrl && blob.size <= MAX_STAGE_DOWNLOAD_BYTES) {
          relayUrl = await stageVideoBlobOnServer(blob, exportFilename);
          if (relayUrl) setStagedDownloadUrl(relayUrl);
        }
        if (relayUrl) {
          targetHref = relayUrl;
        }
      }

      if (!targetHref) {
        objectUrlToRevoke = URL.createObjectURL(blob);
        targetHref = objectUrlToRevoke;
      }

      const anchor = document.createElement('a');
      anchor.href = targetHref;
      anchor.download = exportFilename;
      anchor.rel = 'noopener';
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      if (objectUrlToRevoke) {
        setTimeout(() => {
          try {
            URL.revokeObjectURL(objectUrlToRevoke!);
          } catch {}
        }, 60_000);
      }

      setDownloadStatus('done');
      setDownloadFeedback(`Téléchargement lancé (${exportFilename})`);
    } catch (err: any) {
      setDownloadStatus('error');
      setDownloadFeedback(
        err?.message || 'Échec du téléchargement automatique. Utilisez le lien direct ci-dessous.'
      );
    }
  };

  const finishRecordingEarly = () => {
    const rec = mediaRecorderRef.current;
    if (!rec || rec.state === 'inactive' || !hasRecorderChunkRef.current) return;
    setCanFinishEarly(false);
    setExportStatus('finalizing');
    setExportStatusMessage('Finalisation de votre extrait vidéo avec audio...');
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    playbackHandleRef.current?.stop();
    playbackHandleRef.current = null;
    if (rec.state === 'recording') {
      try {
        rec.stop();
      } catch {}
    }
  };

  const handleToggleMonitorAudio = () => {
    setMonitorAudioDuringExport((prev) => {
      const next = !prev;
      keepaliveRef.current?.setMonitorEnabled(next);
      return next;
    });
  };

  const handleShareVideo = async () => {
    if (!exportedVideoBlob) return;
    const file = new File([exportedVideoBlob], exportFilename, { type: exportedVideoBlob.type });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: playlistSummaryLabel,
          text: `Récitation continue par ${selectedReciter.name}`,
          files: [file],
        });
      } catch {
        // user cancelled share
      }
    }
  };

  const switchTab = (tab: StudioTab) => {
    setActiveTab(tab);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isOpen) return null;

  const playerFrameClass =
    activeFormat.aspectLabel === '16:9'
      ? 'w-full max-w-[min(94vw,calc(86dvh*16/9))] aspect-video'
      : activeFormat.aspectLabel === '1:1'
      ? 'w-full max-w-[min(94vw,86dvh)] aspect-square'
      : 'w-full h-full max-w-[calc(100dvh*9/16)] max-h-[calc(100vw*16/9)] md:max-h-[94dvh] aspect-[9/16]';

  const exportPreviewFrameClass =
    activeFormat.aspectLabel === '16:9'
      ? 'w-full max-w-xl aspect-video'
      : activeFormat.aspectLabel === '1:1'
      ? 'h-[40vh] max-h-[360px] aspect-square'
      : 'h-[44vh] max-h-[410px] aspect-[9/16]';

  // =========================================================================
  // RENDER: STAGE 2 — CLEAN VIDEO PLAYER ("Lire le contenu")
  // =========================================================================
  if (stage === 'player') {
    return (
      <div
        data-testid="mobile-video-continuous-player"
        data-surface={isLightSurface ? 'light' : 'dark'}
        data-format={activeFormat.id}
        className="fixed inset-0 z-[10050] w-full h-[100dvh] bg-black flex items-center justify-center overflow-hidden select-none p-0 md:p-4"
        onClick={() => setPlayerHudVisible((v) => !v)}
      >
        <div
          className={`relative ${playerFrameClass} bg-black overflow-hidden flex items-center justify-center md:rounded-2xl md:border md:border-white/15 md:shadow-2xl`}
        >
          <canvas
            ref={playerCanvasRef}
            data-testid="studio-video-player-canvas"
            width={activeFormat.previewWidth}
            height={activeFormat.previewHeight}
            className={`w-full h-full object-contain transition-opacity duration-300 ${
              playerStatus === 'loading' ? 'opacity-0' : 'opacity-100'
            }`}
          />

          {playerStatus === 'loading' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center gap-3 bg-black text-white">
              <Loader2 className="w-10 h-10 animate-spin text-amber-300" />
              <div className="space-y-1">
                <p className="text-sm font-bold">
                  Préparation de la vidéo ({activeFormat.aspectLabel})...
                </p>
                <p className="text-xs text-neutral-400 tabular-nums">
                  {playerLoadProgress.loaded}/{playerLoadProgress.total}{' '}
                  {hasBismillahIntro ? 'séquences (avec Bismillah)' : 'versets'}
                </p>
              </div>
            </div>
          )}

          {/* Minimal Floating Header */}
          <div
            className={`absolute top-0 inset-x-0 z-30 flex items-center justify-between px-3.5 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-2 transition-opacity duration-200 ${
              playerHudVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                stopAllMedia();
                setStage('setup');
              }}
              aria-label="Retour au studio vidéo"
              className="h-10 px-3.5 rounded-xl bg-black/75 hover:bg-black/90 text-white border border-white/15 backdrop-blur-md flex items-center gap-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300" />
              <span>Studio</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopAllMedia();
                onClose();
              }}
              aria-label="Fermer la lecture vidéo"
              className="w-10 h-10 rounded-xl bg-black/75 hover:bg-rose-600/90 text-white border border-white/15 backdrop-blur-md flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Minimal Bottom Transport Bar */}
          <div
            className={`absolute bottom-0 inset-x-0 z-30 px-3.5 pb-[calc(env(safe-area-inset-bottom)+0.9rem)] pt-2 transition-opacity duration-200 ${
              playerHudVisible && playerStatus !== 'loading'
                ? 'opacity-100'
                : 'opacity-0 pointer-events-none'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-xl mx-auto bg-black/80 border border-white/15 backdrop-blur-xl rounded-2xl px-3 py-2 text-white flex items-center gap-2.5 shadow-xl">
              <button
                type="button"
                onClick={togglePlayPauseContinuous}
                aria-label={
                  playerStatus === 'playing' ? 'Mettre en pause la vidéo' : 'Lire la vidéo'
                }
                className="w-9 h-9 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center shrink-0 cursor-pointer transition"
              >
                {playerStatus === 'playing' ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <input
                type="range"
                aria-label="Progression de la vidéo"
                min={0}
                max={Math.max(1, timeline.totalDurationSec)}
                step={0.1}
                value={Math.min(currentTimeSec, timeline.totalDurationSec)}
                onChange={(e) => seekContinuousPlayer(Number(e.target.value))}
                className="flex-1 min-w-0 accent-amber-400 h-1.5 rounded-lg cursor-pointer"
              />

              <span className="text-xs font-mono text-neutral-300 tabular-nums shrink-0">
                {formatTimeMMSS(currentTimeSec)} / {formatTimeMMSS(timeline.totalDurationSec)}
              </span>

              <button
                type="button"
                onClick={startVideoExport}
                aria-label="Exporter en MP4"
                className="h-9 px-3 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>MP4</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: STAGE 3 — VIDEO EXPORT & RELIABLE DOWNLOAD
  // =========================================================================
  if (stage === 'export') {
    const canNativeShare =
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      Boolean(exportedVideoBlob);

    return (
      <div
        data-testid="mobile-video-export-view"
        className="fixed inset-0 z-[10050] bg-[#060A08] text-white flex flex-col h-[100dvh] overflow-hidden"
      >
        <header className="shrink-0 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 border-b border-white/[0.08] bg-[#0B120F]">
          <div className="flex items-center justify-between gap-3 max-w-4xl w-full mx-auto">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-400/12 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
                <Film className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold truncate">
                  Export MP4 · {activeFormat.shortLabel} ({activeFormat.width}×{activeFormat.height})
                </h2>
                <p className="text-xs text-neutral-400 truncate tabular-nums">
                  {playlistSummaryLabel} · {totalSelectedVerses} versets · Audio continu
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                stopAllMedia();
                setStage('setup');
              }}
              aria-label="Retour à la configuration vidéo"
              className="h-10 px-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors"
            >
              Retour au studio
            </button>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-5">
          <div className="max-w-4xl w-full mx-auto flex flex-col items-center gap-4">
            <div
              className={`relative ${exportPreviewFrameClass} rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl shrink-0`}
            >
            {exportStatus === 'ready' && exportedVideoUrl ? (
              <video
                data-testid="exported-video-preview"
                src={exportedVideoUrl}
                controls
                playsInline
                muted={false}
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <canvas
                ref={previewCanvasRef}
                data-testid="export-render-canvas"
                className="w-full h-full object-contain"
              />
            )}

            {exportStatus === 'preparing_audio' && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                <span className="text-xs font-semibold tabular-nums">
                  Assemblage audio ({playerLoadProgress.loaded}/{playerLoadProgress.total})
                </span>
              </div>
            )}
          </div>

          <div className="w-full max-w-md space-y-2.5 text-center">
            {exportStatus === 'error' ? (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/35 text-xs text-rose-200 leading-relaxed">
                {exportErrorMsg}
              </div>
            ) : (
              <>
                <div className="text-xs font-semibold text-amber-300">{exportStatusMessage}</div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-200"
                    style={{ width: `${exportProgressPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400 tabular-nums">
                  <span>{exportProgressPct}%</span>
                  <span>
                    {formatTimeMMSS(exportElapsedSec)} / {formatTimeMMSS(timeline.totalDurationSec)}
                  </span>
                </div>

                {exportStatus === 'recording' && (
                  <button
                    type="button"
                    onClick={handleToggleMonitorAudio}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-neutral-200 cursor-pointer"
                  >
                    {monitorAudioDuringExport ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Son actif pendant l&apos;export (cliquer pour couper l&apos;écoute)</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Écoute coupée (le son reste enregistré dans la vidéo)</span>
                      </>
                    )}
                  </button>
                )}

                {exportStatus === 'ready' && exportedAudioInfo && (
                  <div
                    data-testid="exported-video-audio-badge"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 tabular-nums"
                  >
                    <Volume2 className="w-4 h-4 shrink-0" />
                    <span>
                      Audio continu inclus : {exportedAudioInfo.okCount}/{exportedAudioInfo.totalCount}{' '}
                      séquences
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {exportStatus === 'ready' && (
            <YouTubePublishCard
              surahName={primarySurahMeta.name}
              surahArabicName={primarySurahMeta.arabicName}
              surahNumber={primarySurahMeta.number}
              startAyah={primaryNormalizedRange.startAyah}
              endAyah={primaryNormalizedRange.endAyah}
              totalAyahsInSurah={primarySurahMeta.numberOfAyahs}
              selectedSurahs={youtubeSelectedSurahs}
              reciterName={selectedReciter.name}
              timeline={timeline}
            />
          )}
          </div>
        </div>

        {/* Bottom Export & Download Action Dock */}
        <footer className="shrink-0 border-t border-white/[0.08] bg-[#0B120F]/95 backdrop-blur-xl px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.9rem)]">
          <div className="space-y-2.5 max-w-md w-full mx-auto">
          {exportStatus === 'recording' && canFinishEarly && (
            <button
              type="button"
              data-testid="export-finish-early-btn"
              onClick={finishRecordingEarly}
              className="w-full h-11 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Terminer &amp; Sauvegarder maintenant</span>
            </button>
          )}

          {exportStatus === 'ready' && exportedVideoUrl && (
            <div className="space-y-2">
              <div className={`grid gap-2.5 ${canNativeShare ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <button
                  type="button"
                  data-testid="download-exported-video-link"
                  onClick={handleDownloadVideo}
                  disabled={downloadStatus === 'preparing'}
                  className="h-11 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition disabled:opacity-60 whitespace-nowrap"
                >
                  {downloadStatus === 'preparing' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Préparation...</span>
                    </>
                  ) : downloadStatus === 'done' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Télécharger à nouveau</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Télécharger MP4</span>
                    </>
                  )}
                </button>

                {canNativeShare && (
                  <button
                    type="button"
                    onClick={handleShareVideo}
                    className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Partager</span>
                  </button>
                )}
              </div>

              {downloadFeedback && (
                <div
                  data-testid="download-status-feedback"
                  className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                    downloadStatus === 'error'
                      ? 'bg-rose-950/50 border-rose-500/35 text-rose-200'
                      : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5 truncate">
                    {downloadStatus === 'error' ? (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    )}
                    <span className="truncate">{downloadFeedback}</span>
                  </span>

                  <a
                    href={stagedDownloadUrl || exportedVideoUrl}
                    download={exportFilename}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="download-direct-fallback-link"
                    className="text-amber-300 hover:text-amber-200 font-semibold underline inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
                  >
                    <span>Lien direct</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              stopAllMedia();
              setStage('setup');
            }}
            className="w-full h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-neutral-200 font-semibold text-xs cursor-pointer transition-colors"
          >
            Modifier les réglages
          </button>
          </div>
        </footer>
      </div>
    );
  }

  // =========================================================================
  // RENDER: STAGE 1 — SANCTUARY EDITORIAL STUDIO
  // =========================================================================
  const previewVerses = videoSequence.slice(0, 2);

  return (
    <div
      data-testid="mobile-video-studio-modal"
      className="fixed inset-0 z-[10040] bg-[#060A08] text-white flex flex-col h-[100dvh] overflow-hidden"
    >
      <input
        ref={mediaFileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        data-testid="studio-media-file-input"
        onChange={handleImportDeviceMedia}
        className="hidden"
      />

      {/* Studio Top Bar */}
      <header className="shrink-0 flex items-center justify-between gap-2.5 md:gap-4 px-3.5 md:px-6 pt-[calc(env(safe-area-inset-top)+0.65rem)] pb-2.5 border-b border-white/[0.08] bg-[#0B120F]">
        <div className="flex items-center gap-2.5 md:gap-3 min-w-0 flex-1 md:flex-initial">
          <div className="w-9 h-9 rounded-xl bg-amber-400/12 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
            <Film className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm md:text-[15px] font-bold leading-tight tracking-tight truncate">
              Studio Vidéo Coran
            </h2>
            <p className="text-xs text-neutral-400 truncate tabular-nums">
              {selectedSurahs.length} sourate{selectedSurahs.length > 1 ? 's' : ''} ·{' '}
              {totalSelectedVerses} versets · {formatTimeMMSS(timeline.totalDurationSec)}
            </p>
          </div>
        </div>

        {/* PC-ONLY FORMAT & DIMENSION SWITCHER */}
        {isPcMode && (
          <div
            data-testid="studio-format-selector"
            role="group"
            aria-label="Dimensions vidéo (Mode PC)"
            className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-black/50 border border-white/[0.08]"
          >
            {VIDEO_FORMAT_PRESETS.map((fmt) => {
              const active = activeFormat.id === fmt.id;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  data-testid={`studio-format-${fmt.id}`}
                  onClick={() => setVideoFormatId(fmt.id)}
                  title={fmt.platformHint}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    active
                      ? 'bg-amber-400 text-neutral-950'
                      : 'text-neutral-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {fmt.aspectLabel === '16:9' ? (
                    <Monitor className="w-3.5 h-3.5 shrink-0" />
                  ) : fmt.aspectLabel === '9:16' ? (
                    <Smartphone className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Square className="w-3 h-3 shrink-0" />
                  )}
                  <span>{fmt.shortLabel}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-neutral-300 tabular-nums pr-1">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span data-testid="studio-total-duration">{formatTimeMMSS(timeline.totalDurationSec)}</span>
            <span className="text-neutral-600" aria-hidden="true">·</span>
            <span data-testid="studio-total-verses-count">{totalSelectedVerses} v.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le studio vidéo"
            className="w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-neutral-200 flex items-center justify-center cursor-pointer shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Architectural Navigation Tabs */}
      <nav
        aria-label="Sections du studio vidéo"
        className="shrink-0 grid grid-cols-4 px-2 md:px-6 bg-[#080E0B] border-b border-white/[0.08]"
      >
        {[
          { id: 'verses' as const, testId: 'jump-verses', shortLabel: '1. Sourates', longLabel: '1. Sourates & Versets' },
          { id: 'style' as const, testId: 'jump-style', shortLabel: '2. Style', longLabel: '2. Modèles & Style' },
          { id: 'bg' as const, testId: 'jump-bg', shortLabel: '3. Fond', longLabel: '3. Fond & Médias' },
          { id: 'audio' as const, testId: 'jump-audio', shortLabel: '4. Audio', longLabel: '4. Récitateur & Audio' },
        ].map((tab) => {
          const isCurrent = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`studio-${tab.testId}-btn`}
              onClick={() => switchTab(tab.id)}
              className={`min-h-[44px] px-2 text-xs font-semibold text-center whitespace-nowrap truncate border-b-2 transition-colors cursor-pointer ${
                isCurrent
                  ? 'border-amber-400 text-amber-300 bg-amber-400/[0.04]'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span className="md:hidden">{tab.shortLabel}</span>
              <span className="hidden md:inline">{tab.longLabel}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Responsive Workspace */}
      <div className="flex-1 min-h-0 flex flex-col md:grid md:grid-cols-[1.04fr_0.96fr] md:max-w-7xl md:w-full md:mx-auto md:gap-5 md:px-6 md:py-4 overflow-hidden">
        {/* Left Configurator Column */}
        <div
          ref={scrollContainerRef}
          data-testid="studio-settings-scroll"
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-3.5 py-3.5 pb-8 md:px-0.5 md:py-0 md:pb-4 space-y-4"
        >
          {/* Compact Mobile 9:16 Summary Card */}
          <div className="md:hidden rounded-xl border border-white/[0.08] bg-[#0B120F] p-3 flex items-center gap-3">
            <div
              className="relative w-12 aspect-[9/16] rounded-lg overflow-hidden border border-white/15 shrink-0 flex flex-col justify-between p-1.5 text-center"
              style={{ backgroundColor: bgSurfaceColor }}
            >
              {activeMediaKind === 'image' && activeMediaUrl && (
                <img
                  src={activeMediaUrl}
                  alt={activeMediaName}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div className="relative z-10 text-[6px] font-bold text-amber-300 truncate">
                {primarySurahMeta.name}
              </div>
              {previewVerses[0] && (
                <div className="relative z-10 text-[7px] font-arabic text-white line-clamp-2" dir="rtl">
                  <TajweedText
                    text={cleanAyahArabic(previewVerses[0].ar)}
                    enabled={useTajweed}
                    variant={isLightSurface ? 'light' : 'dark'}
                  />
                </div>
              )}
              <div className="relative z-10 text-[5px] font-semibold text-neutral-300">
                {MANDATORY_WATERMARK_BRAND}
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="text-xs font-bold text-white truncate">
                {playlistSummaryLabel}
              </div>
              <div className="text-xs text-neutral-400 truncate">
                {VIDEO_TEMPLATE_PRESETS.find((t) => t.id === flowMode)?.name} · {activeMediaName}
              </div>
              <div className="text-xs text-emerald-300 font-semibold tabular-nums">
                Durée estimée {formatTimeMMSS(timeline.totalDurationSec)} · {totalSelectedVerses} versets
              </div>
            </div>
          </div>

          {/* TAB 1: MULTI-SURAH PLAYLIST & RANGES */}
          {activeTab === 'verses' && (
            <section className="p-4 sm:p-5 rounded-2xl bg-[#0B120F] border border-white/[0.08] space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Programme de Sourates &amp; Versets</span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Composez une ou plusieurs sourates complètes en une seule vidéo continue.
                  </p>
                </div>

                <div className="text-left sm:text-right tabular-nums shrink-0">
                  <div className="text-xs font-bold text-emerald-300">
                    {selectedSurahs.length} sourate{selectedSurahs.length > 1 ? 's' : ''} · {totalSelectedVerses} verset{totalSelectedVerses > 1 ? 's' : ''}
                  </div>
                  <div className="text-xs font-mono text-neutral-400">
                    Durée ~{formatTimeMMSS(timeline.totalDurationSec)}
                  </div>
                </div>
              </div>

              {/* Primary Multi-Surah Picker Button + Quick Compilations */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  data-testid="studio-surah-picker-btn"
                  onClick={openSurahPicker}
                  className="w-full min-h-[48px] flex items-center justify-between px-3.5 sm:px-4 py-3 rounded-xl bg-[#111C17] hover:bg-[#15231D] border border-amber-400/35 text-left cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-400/15 text-amber-300 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-white truncate">
                        Sourates sélectionnées
                      </div>
                      <div className="text-xs text-neutral-400 truncate">
                        {playlistSummaryLabel}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-amber-300 inline-flex items-center gap-1 whitespace-nowrap shrink-0 pl-2">
                    <span>Modifier</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </button>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    data-testid="studio-preset-3qul"
                    onClick={() => applySurahCompilation([112, 113, 114])}
                    className="h-9 px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-neutral-200 font-medium cursor-pointer transition-colors whitespace-nowrap"
                  >
                    3 Qul (112–114)
                  </button>
                  <button
                    type="button"
                    data-testid="studio-preset-fatiha-ikhlas"
                    onClick={() => applySurahCompilation([1, 112])}
                    className="h-9 px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-neutral-200 font-medium cursor-pointer transition-colors whitespace-nowrap"
                  >
                    Al-Fatiha + Al-Ikhlas
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
                    className="h-9 px-3 rounded-lg bg-emerald-500/12 hover:bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 font-semibold cursor-pointer transition-colors whitespace-nowrap"
                  >
                    Tout en entier
                  </button>
                </div>
              </div>

              {/* Clean Ordered Playlist */}
              <div
                data-testid="studio-playlist-list"
                className="rounded-xl border border-white/[0.08] bg-black/35 divide-y divide-white/[0.07]"
              >
                {selectedSurahs.map((sel, index) => {
                  const meta = getSurahMeta(sel.surahNumber);
                  const maxN = meta.numberOfAyahs;
                  const norm = normalizeVerseRange(sel.startAyah, sel.endAyah, maxN);
                  const isFull = norm.startAyah === 1 && norm.endAyah === maxN;
                  const presets: Array<{ label: string; s: number; e: number }> = [
                    { label: '1→5', s: 1, e: Math.min(5, maxN) },
                  ];
                  if (maxN > 5 && maxN <= 15) {
                    presets.push({ label: `Toute (${maxN})`, s: 1, e: maxN });
                  } else if (maxN > 15) {
                    presets.push({ label: '1→15', s: 1, e: Math.min(15, maxN) });
                    presets.push({ label: `Toute (${maxN})`, s: 1, e: maxN });
                  }

                  return (
                    <div
                      key={sel.id}
                      data-testid={`studio-playlist-item-${sel.surahNumber}`}
                      className="p-3.5 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-white flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="text-amber-300 font-mono text-xs tabular-nums">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <span>
                              {meta.number}. {meta.name}
                            </span>
                            <span className="font-arabic text-base text-amber-200 shrink-0" dir="rtl">
                              {meta.arabicName}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-400 mt-0.5 tabular-nums">
                            {isFull
                              ? `Sourate complète · ${norm.count} versets`
                              : `Versets ${norm.startAyah} à ${norm.endAyah} (${norm.count}/${maxN})`}
                          </div>
                        </div>

                        {selectedSurahs.length > 1 && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => moveSurahItem(index, -1)}
                              disabled={index === 0}
                              aria-label={`Monter ${meta.name}`}
                              className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-neutral-300 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSurahItem(index, 1)}
                              disabled={index === selectedSurahs.length - 1}
                              aria-label={`Descendre ${meta.name}`}
                              className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-neutral-300 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeSurahItem(sel.id)}
                              aria-label={`Retirer ${meta.name}`}
                              className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-rose-500/20 border border-white/10 text-neutral-300 hover:text-rose-300 flex items-center justify-center cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label
                            htmlFor={`studio-start-ayah-${sel.id}`}
                            className="block text-xs font-medium text-neutral-400"
                          >
                            Du verset
                          </label>
                          <select
                            id={`studio-start-ayah-${sel.id}`}
                            value={norm.startAyah}
                            onChange={(e) => {
                              const nextStart = Number(e.target.value);
                              updateSurahRange(
                                sel.id,
                                nextStart,
                                Math.max(nextStart, norm.endAyah)
                              );
                            }}
                            className="w-full h-10 px-2.5 rounded-lg bg-black/60 border border-white/15 text-xs font-semibold text-white tabular-nums"
                          >
                            {Array.from({ length: maxN }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n}>
                                Verset {n}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label
                            htmlFor={`studio-end-ayah-${sel.id}`}
                            className="block text-xs font-medium text-neutral-400"
                          >
                            Au verset
                          </label>
                          <select
                            id={`studio-end-ayah-${sel.id}`}
                            value={norm.endAyah}
                            onChange={(e) => {
                              const nextEnd = Number(e.target.value);
                              updateSurahRange(sel.id, norm.startAyah, nextEnd);
                            }}
                            className="w-full h-10 px-2.5 rounded-lg bg-black/60 border border-white/15 text-xs font-semibold text-white tabular-nums"
                          >
                            {Array.from(
                              { length: maxN - norm.startAyah + 1 },
                              (_, i) => norm.startAyah + i
                            ).map((n) => (
                              <option key={n} value={n}>
                                Verset {n}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        {presets.map((preset) => {
                          const active =
                            norm.startAyah === preset.s && norm.endAyah === preset.e;
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => updateSurahRange(sel.id, preset.s, preset.e)}
                              className={`h-8 px-2.5 rounded-lg border font-semibold cursor-pointer transition-colors whitespace-nowrap tabular-nums ${
                                active
                                  ? 'bg-amber-400 text-neutral-950 border-amber-300'
                                  : 'bg-white/[0.04] hover:bg-white/[0.09] text-neutral-300 border-white/10'
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
                            className="h-8 px-2.5 rounded-lg border border-emerald-400/30 bg-emerald-500/12 hover:bg-emerald-500/20 text-emerald-200 font-medium inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <Plus className="w-3 h-3" />
                            <span>10 versets</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {isPcMode && (
                <div className="px-3.5 py-2.5 rounded-xl bg-black/35 border border-white/[0.07] text-xs text-neutral-300">
                  <span className="font-semibold text-white">Format {activeFormat.label}</span>
                  <span className="text-neutral-500"> · </span>
                  <span>{activeFormat.platformHint}</span>
                </div>
              )}

              {hasBismillahIntro && (
                <div
                  data-testid="studio-bismillah-intro-notice"
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/25 flex items-center justify-between gap-3 text-xs"
                >
                  <span className="font-medium text-emerald-100">
                    Bismillah inclus en ouverture des sourates concernées
                  </span>
                  <span className="font-arabic text-sm text-amber-200 shrink-0" dir="rtl">
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                  </span>
                </div>
              )}

              {isLoadingVerses && (
                <div className="text-xs text-amber-300 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Chargement des textes coraniques sélectionnés...</span>
                </div>
              )}
            </section>
          )}

          {/* TAB 2: 6 MODÈLES DE VIDÉO & STYLE */}
          {activeTab === 'style' && (
            <section className="p-4 sm:p-5 rounded-2xl bg-[#0B120F] border border-white/[0.08] space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Modèles Graphiques &amp; Typographie</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Choisissez la mise en scène adaptée à votre format et observez l&apos;aperçu en direct.
                </p>
              </div>

              <StudioTemplateGrid
                selectedTemplate={flowMode}
                onSelect={setFlowMode}
                isLandscape={activeFormat.aspectLabel !== '9:16'}
              />

              <div className="space-y-2 pt-3 border-t border-white/[0.08]">
                <div className="text-xs font-semibold text-neutral-300">Éléments affichés</div>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  {[
                    { label: 'Calligraphie Arabe', val: showArabic, toggle: () => setShowArabic((v) => !v) },
                    { label: 'Couleurs Tajweed', val: useTajweed, toggle: () => setUseTajweed((v) => !v) },
                    { label: 'Phonétique', val: showPhonetics, toggle: () => setShowPhonetics((v) => !v) },
                    { label: 'Traduction FR', val: showFrench, toggle: () => setShowFrench((v) => !v) },
                    { label: 'Titre Sourate', val: showSurahHeader, toggle: () => setShowSurahHeader((v) => !v) },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.toggle}
                      className={`min-h-[42px] px-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        item.val
                          ? 'bg-amber-400/12 border-amber-400/60 text-amber-200'
                          : 'bg-black/35 border-white/[0.08] text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.val && <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-neutral-300">Taille du texte</div>
                  <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
                    {(['compact', 'standard', 'grand'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        data-testid={`studio-text-scale-${sz}`}
                        onClick={() => setTextScale(sz)}
                        className={`h-10 rounded-lg border cursor-pointer transition-colors ${
                          textScale === sz
                            ? 'bg-amber-400 text-neutral-950 border-amber-300'
                            : 'bg-white/[0.04] text-neutral-300 border-white/10'
                        }`}
                      >
                        {sz === 'compact' ? 'S' : sz === 'standard' ? 'M' : 'L'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-neutral-300">Cadence audio</div>
                  <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
                    {([0.9, 1.0, 1.15] as const).map((pace) => (
                      <button
                        key={pace}
                        type="button"
                        data-testid={`studio-pace-${pace}`}
                        onClick={() => setPaceMultiplier(pace)}
                        className={`h-10 rounded-lg border cursor-pointer transition-colors tabular-nums ${
                          paceMultiplier === pace
                            ? 'bg-amber-400 text-neutral-950 border-amber-300'
                            : 'bg-white/[0.04] text-neutral-300 border-white/10'
                        }`}
                      >
                        {pace}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:hidden px-3 py-2.5 rounded-xl border border-emerald-500/25 bg-emerald-950/30 flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-emerald-100 truncate">
                  Signature « {MANDATORY_WATERMARK_BRAND} » incluse
                </span>
                <span className="text-emerald-300 font-semibold shrink-0">Inclus</span>
              </div>
            </section>
          )}

          {/* TAB 3: FOND & MÉDIAS */}
          {activeTab === 'bg' && (
            <section className="p-4 sm:p-5 rounded-2xl bg-[#0B120F] border border-white/[0.08] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Arrière-Plan &amp; Bibliothèque</span>
                  </h3>
                  <p data-testid="studio-library-status" className="text-xs text-neutral-400 mt-0.5">
                    {isSavingMedia
                      ? 'Enregistrement dans la bibliothèque...'
                      : isLoadingLibrary
                      ? 'Chargement de vos médias enregistrés...'
                      : customMedia.length > 0
                      ? `${customMedia.length} média${customMedia.length > 1 ? 's' : ''} personnel${customMedia.length > 1 ? 's' : ''} (${formatStudioBytes(
                          customMedia.reduce((acc, m) => acc + (m.sizeBytes || 0), 0)
                        )})`
                      : 'Importez vos photos ou vidéos bouclées'}
                  </p>
                </div>

                <button
                  type="button"
                  data-testid="studio-upload-media-btn"
                  disabled={isSavingMedia}
                  onClick={() => mediaFileInputRef.current?.click()}
                  className="h-10 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60 whitespace-nowrap shrink-0"
                >
                  {isSavingMedia ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>Importer Photo / Vidéo</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                {[
                  { id: 'all' as const, label: 'Tous' },
                  { id: 'custom' as const, label: `Mes Médias (${customMedia.length})`, testId: 'studio-bg-filter-custom' },
                  { id: 'noir' as const, label: 'Noirs (10)' },
                  { id: 'blanc' as const, label: 'Blancs (10)' },
                  { id: '4k' as const, label: 'Fonds 4K (16)' },
                ].map((flt) => (
                  <button
                    key={flt.id}
                    type="button"
                    data-testid={flt.testId}
                    onClick={() => setBgFilter(flt.id)}
                    className={`h-9 px-3 rounded-lg shrink-0 cursor-pointer transition-colors whitespace-nowrap ${
                      bgFilter === flt.id
                        ? 'bg-amber-400 text-neutral-950'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300'
                    }`}
                  >
                    {flt.label}
                  </button>
                ))}
              </div>

              {/* Solid Swatches */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                {STUDIO_SOLID_BACKGROUNDS.map((swatch) => (
                  <button
                    key={swatch.id}
                    type="button"
                    onClick={() => setBgId(swatch.id)}
                    className={`h-9 inline-flex items-center gap-2 px-3 rounded-lg border cursor-pointer whitespace-nowrap ${
                      bgId === swatch.id
                        ? 'bg-amber-400 text-neutral-950 border-amber-300'
                        : 'bg-black/35 text-neutral-200 border-white/10'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-white/35 shrink-0"
                      style={{ backgroundColor: swatch.color }}
                    />
                    <span>{swatch.name}</span>
                  </button>
                ))}
              </div>

              {bgFilter === 'custom' && customMedia.length === 0 && (
                <button
                  type="button"
                  onClick={() => mediaFileInputRef.current?.click()}
                  className="w-full py-5 px-4 rounded-xl border border-dashed border-emerald-400/45 bg-emerald-500/5 text-center space-y-1.5 cursor-pointer hover:bg-emerald-500/10 transition-colors"
                >
                  <Upload className="w-5 h-5 text-emerald-400 mx-auto" />
                  <div className="text-xs font-bold text-white">
                    Importer et sauvegarder vos images ou vidéos
                  </div>
                  <div className="text-xs text-neutral-400">
                    Vos fichiers restent sauvegardés pour vos prochaines vidéos.
                  </div>
                </button>
              )}

              {visibleBackgroundCards.length > 0 && (
                <div
                  data-testid="studio-backgrounds-strip"
                  className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[260px] overflow-y-auto pr-1"
                >
                  {visibleBackgroundCards.map((bg) => {
                    const active = bgId === bg.id;
                    return (
                      <div
                        key={bg.id}
                        onClick={() => setBgId(bg.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setBgId(bg.id);
                          }
                        }}
                        data-testid={`studio-bg-card-${bg.id}`}
                        className={`relative aspect-[4/5] rounded-xl overflow-hidden border text-left flex flex-col justify-between p-2 cursor-pointer transition-colors ${
                          active ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-white/15 hover:border-white/35'
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
                            src={bg.url}
                            alt={bg.name}
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent pointer-events-none" />
                        <div className="relative z-10 flex items-center justify-between gap-1">
                          {bg.kind === 'video' ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-neutral-950 text-[10px] font-bold inline-flex items-center gap-0.5">
                              <Video className="w-2.5 h-2.5" />
                              Vidéo
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
                              className="w-6 h-6 rounded-full bg-black/75 text-rose-300 hover:bg-rose-600 hover:text-white flex items-center justify-center cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="relative z-10 flex items-center justify-between gap-1">
                          <span className="text-[11px] font-semibold text-white leading-tight line-clamp-2">
                            {bg.name}
                          </span>
                          {active && (
                            <span className="w-4 h-4 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/[0.08]">
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-neutral-300">Couleur du texte</div>
                  <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
                    {[
                      { id: 'auto' as const, label: 'Auto' },
                      { id: 'light' as const, label: 'Blanc' },
                      { id: 'dark' as const, label: 'Noir' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTextColorOverride(opt.id)}
                        className={`h-9 rounded-lg border cursor-pointer ${
                          textColorOverride === opt.id
                            ? 'bg-amber-400 text-neutral-950 border-amber-300'
                            : 'bg-white/[0.04] text-neutral-300 border-white/10'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-neutral-300">Voile de contraste</div>
                  <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold tabular-nums">
                    {[0, 0.25, 0.45, 0.65].map((alpha) => (
                      <button
                        key={alpha}
                        type="button"
                        onClick={() => setBgVeilOpacity(alpha)}
                        className={`h-9 rounded-lg border cursor-pointer ${
                          Math.abs(bgVeilOpacity - alpha) < 0.02
                            ? 'bg-amber-400 text-neutral-950 border-amber-300'
                            : 'bg-white/[0.04] text-neutral-300 border-white/10'
                        }`}
                      >
                        {Math.round(alpha * 100)}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 4: RÉCITATEUR & AUDIO */}
          {activeTab === 'audio' && (
            <section className="p-4 sm:p-5 rounded-2xl bg-[#0B120F] border border-white/[0.08] space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Récitateur &amp; Qualité Sonore</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Les silences entre versets sont automatiquement ajustés pour un enchaînement sans coupure.
                </p>
              </div>

              <button
                type="button"
                data-testid="studio-reciter-picker-btn"
                onClick={() => setIsReciterPickerOpen(true)}
                className="w-full min-h-[52px] flex items-center justify-between p-3.5 rounded-xl bg-black/35 hover:bg-black/55 border border-white/15 text-left cursor-pointer transition-colors"
              >
                <div>
                  <div className="text-sm font-bold text-white">{selectedReciter.name}</div>
                  <div className="text-xs text-neutral-400">{selectedReciter.style}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
              </button>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-neutral-300">Accès rapide aux récitateurs</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {RECITERS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setReciterId(r.id);
                        onSyncReciter?.(r);
                      }}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        r.id === reciterId
                          ? 'bg-amber-400/12 border-amber-400/70 text-amber-200'
                          : 'bg-white/[0.03] border-white/[0.08] text-neutral-300 hover:bg-white/[0.07]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{r.name}</div>
                        <div className="text-xs opacity-75 truncate">{r.style}</div>
                      </div>
                      {r.id === reciterId && <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMonitorAudioDuringExport((v) => !v)}
                className="w-full p-3.5 rounded-xl bg-black/35 border border-white/[0.08] flex items-center justify-between gap-3 text-left cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-white">Écoute audio pendant l&apos;export</div>
                  <div className="text-xs text-neutral-400">
                    La piste audio continue est toujours incluse dans le fichier MP4.
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 ${
                    monitorAudioDuringExport
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-white/10 text-neutral-400'
                  }`}
                >
                  {monitorAudioDuringExport ? 'Actif' : 'Muet'}
                </span>
              </button>
            </section>
          )}
        </div>

        {/* Right Column (Desktop Only): Live WYSIWYG Canvas Monitor */}
        <StudioLiveMonitor
          format={activeFormat}
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
          activeMediaName={activeMediaName}
          isLightSurface={isLightSurface}
          bgSurfaceColor={bgSurfaceColor}
          bgVeilOpacity={bgVeilOpacity}
          showArabic={showArabic}
          useTajweed={useTajweed}
          showPhonetics={showPhonetics}
          showFrench={showFrench}
          showSurahHeader={showSurahHeader}
          textScale={textScale}
          flowMode={flowMode}
        />
      </div>

      {/* Bottom Sticky Dual Action Bar */}
      <footer className="shrink-0 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] border-t border-white/[0.08] bg-[#0B120F]/95 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-3">
          <button
            type="button"
            data-testid="studio-play-continuous-btn"
            disabled={isLoadingVerses || videoSequence.length === 0}
            onClick={startContinuousPlayer}
            className="h-11 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white font-semibold text-xs md:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 whitespace-nowrap transition-colors"
          >
            <Play className="w-4 h-4 fill-current text-amber-300 shrink-0" />
            <span>Lire le contenu</span>
          </button>

          <button
            type="button"
            data-testid="studio-create-video-btn"
            disabled={isLoadingVerses || videoSequence.length === 0}
            onClick={startVideoExport}
            className="h-11 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-40 whitespace-nowrap transition-colors"
          >
            <Film className="w-4 h-4 shrink-0" />
            <span>
              {isPcMode
                ? `Créer Vidéo MP4 (${activeFormat.aspectLabel})`
                : 'Créer Vidéo MP4 (9:16)'}
            </span>
          </button>
        </div>
      </footer>

      {/* Multi-Surah Picker Modal */}
      {isSurahPickerOpen && (
        <div
          className="fixed inset-0 z-[10060] bg-black/80 backdrop-blur-md flex items-center justify-center p-3"
          onClick={() => setIsSurahPickerOpen(false)}
        >
          <div
            data-testid="studio-multi-surah-picker-modal"
            className="w-full max-w-lg max-h-[85vh] bg-[#0B120F] border border-white/15 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white">Choisir une ou plusieurs sourates</h3>
                <p className="text-xs text-neutral-400 tabular-nums">
                  {draftPickerSurahNums.length} sélectionnée{draftPickerSurahNums.length > 1 ? 's' : ''} (sourate complète par défaut)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSurahPickerOpen(false)}
                aria-label="Fermer la sélection des sourates"
                className="w-9 h-9 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={surahQuery}
                onChange={(e) => setSurahQuery(e.target.value)}
                placeholder="Rechercher par nom, traduction ou numéro..."
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder:text-neutral-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setDraftPickerSurahNums([112, 113, 114])}
                className="h-8 px-2.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-neutral-200 font-medium cursor-pointer whitespace-nowrap"
              >
                3 Qul (112–114)
              </button>
              <button
                type="button"
                onClick={() => setDraftPickerSurahNums([105, 106, 107, 108, 109, 110, 111, 112, 113, 114])}
                className="h-8 px-2.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-neutral-200 font-medium cursor-pointer whitespace-nowrap"
              >
                10 dernières sourates
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-black/30">
              {filteredSurahs.map((s) => {
                const checked = draftPickerSurahNums.includes(s.number);
                return (
                  <button
                    key={s.number}
                    type="button"
                    data-testid={`surah-picker-option-${s.number}`}
                    aria-pressed={checked}
                    onClick={() => toggleDraftSurah(s.number)}
                    className={`w-full flex items-center justify-between p-3 text-left cursor-pointer transition-colors ${
                      checked
                        ? 'bg-amber-400/12 text-white'
                        : 'hover:bg-white/[0.05] text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          checked
                            ? 'bg-amber-400 border-amber-300 text-neutral-950'
                            : 'border-white/25 bg-black/40'
                        }`}
                      >
                        {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {s.number}. {s.name}
                        </div>
                        <div className="text-xs text-neutral-400 truncate tabular-nums">
                          {s.frenchTranslation} · {s.numberOfAyahs} versets
                        </div>
                      </div>
                    </div>
                    <span className="font-arabic text-base text-amber-200 shrink-0 pl-2" dir="rtl">
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
              className="w-full h-11 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs cursor-pointer transition-colors"
            >
              Valider la sélection ({draftPickerSurahNums.length} sourate{draftPickerSurahNums.length > 1 ? 's' : ''})
            </button>
          </div>
        </div>
      )}

      {/* Reciter Picker Overlay */}
      {isReciterPickerOpen && (
        <div
          className="fixed inset-0 z-[10060] bg-black/80 backdrop-blur-md flex items-center justify-center p-3"
          onClick={() => setIsReciterPickerOpen(false)}
        >
          <div
            className="w-full max-w-md max-h-[82vh] bg-[#0B120F] border border-white/15 rounded-2xl p-4 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Choisir le Récitateur</h3>
              <button
                type="button"
                onClick={() => setIsReciterPickerOpen(false)}
                aria-label="Fermer le choix du récitateur"
                className="w-9 h-9 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5">
              {RECITERS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setReciterId(r.id);
                    onSyncReciter?.(r);
                    setIsReciterPickerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left border cursor-pointer transition-colors ${
                    r.id === reciterId
                      ? 'bg-amber-400 text-neutral-950 border-amber-300 font-bold'
                      : 'bg-white/[0.04] text-white border-white/[0.07] hover:bg-white/[0.08]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{r.name}</div>
                    <div className="text-xs opacity-75">{r.style}</div>
                  </div>
                  {r.id === reciterId && <Check className="w-4 h-4 stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};