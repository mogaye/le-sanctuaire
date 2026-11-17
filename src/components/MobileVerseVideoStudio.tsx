import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  RotateCcw,
  Square,
  SlidersHorizontal,
  Loader2,
} from 'lucide-react';
import { ALL_114_SURAHS, CompleteSurahItem } from '../data/quranSurahs';
import { RECITERS } from '../data/islamicData';
import { Reciter } from '../types';
import { MOBILE_VERTICAL_BACKGROUNDS } from '../data/mobileCinematicBackgrounds';
import { TajweedText, cleanAyahArabic } from '../utils/tajweedColorizer';
import {
  StudioAyahItem,
  buildContinuousTimeline,
  findActiveTimelineEntry,
  formatTimeMMSS,
  normalizeVerseRange,
  sliceSelectedAyahs,
} from '../utils/mobileVideoStudioUtils';
import {
  DecodedVerseBuffer,
  ScheduledPlaybackHandle,
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
import { useWakeLock } from '../hooks/useWakeLock';

interface MobileVerseVideoStudioProps {
  isOpen: boolean;
  onClose: () => void;
  initialSurahNum: number;
  initialStartAyah?: number;
  initialReciter: Reciter;
  initialBgId?: string;
  onSyncReciter?: (reciter: Reciter) => void;
}

type StudioStage = 'setup' | 'player' | 'export';

export const MobileVerseVideoStudio: React.FC<MobileVerseVideoStudioProps> = ({
  isOpen,
  onClose,
  initialSurahNum,
  initialStartAyah = 1,
  initialReciter,
  initialBgId = 'mobile_noir_minimal',
  onSyncReciter,
}) => {
  // Configuration State
  const [surahNum, setSurahNum] = useState<number>(initialSurahNum || 1);
  const [surahVerses, setSurahVerses] = useState<StudioAyahItem[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState<boolean>(false);

  const [startAyah, setStartAyah] = useState<number>(initialStartAyah || 1);
  const [endAyah, setEndAyah] = useState<number>(() => Math.min(7, Math.max(initialStartAyah || 1, 5)));
  const [reciterId, setReciterId] = useState<string>(initialReciter?.id || 'mishary');
  const [bgId, setBgId] = useState<string>(() => {
    if (
      initialBgId === 'none_noir' ||
      initialBgId === 'none_blanc' ||
      MOBILE_VERTICAL_BACKGROUNDS.some((b) => b.id === initialBgId)
    ) {
      return initialBgId;
    }
    return 'mobile_noir_minimal';
  });
  const [bgFilter, setBgFilter] = useState<'all' | 'noir' | 'blanc'>('all');

  const [showArabic, setShowArabic] = useState<boolean>(true);
  const [useTajweed, setUseTajweed] = useState<boolean>(true);
  const [showPhonetics, setShowPhonetics] = useState<boolean>(true);
  const [showFrench, setShowFrench] = useState<boolean>(true);
  const [showSurahHeader, setShowSurahHeader] = useState<boolean>(true);
  const [textScale, setTextScale] = useState<'compact' | 'standard' | 'grand'>('standard');
  const [flowMode, setFlowMode] = useState<'teleprompter' | 'stream'>('teleprompter');
  const [paceMultiplier, setPaceMultiplier] = useState<number>(1.0);

  // Pickers inside Setup
  const [isSurahPickerOpen, setIsSurahPickerOpen] = useState<boolean>(false);
  const [surahQuery, setSurahQuery] = useState<string>('');
  const [isReciterPickerOpen, setIsReciterPickerOpen] = useState<boolean>(false);

  // Active Stage ('setup' | 'player' | 'export')
  const [stage, setStage] = useState<StudioStage>('setup');

  // Continuous Playback State (for Stage = 'player')
  const [playerStatus, setPlayerStatus] = useState<'loading' | 'playing' | 'paused' | 'ended'>('loading');
  const [playerLoadProgress, setPlayerLoadProgress] = useState<{ loaded: number; total: number }>({
    loaded: 0,
    total: 0,
  });
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [playerHudVisible, setPlayerHudVisible] = useState<boolean>(true);
  const [measuredDurations, setMeasuredDurations] = useState<Array<number | undefined>>([]);

  // Export State (for Stage = 'export')
  const [exportStatus, setExportStatus] = useState<
    'preparing_audio' | 'recording' | 'finalizing' | 'ready' | 'error'
  >('preparing_audio');
  const [exportStatusMessage, setExportStatusMessage] = useState<string>('');
  const [exportProgressPct, setExportProgressPct] = useState<number>(0);
  const [exportElapsedSec, setExportElapsedSec] = useState<number>(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedVideoBlob, setExportedVideoBlob] = useState<Blob | null>(null);
  const [exportedFileExt, setExportedFileExt] = useState<string>('webm');
  const [exportErrorMsg, setExportErrorMsg] = useState<string | null>(null);

  // Refs for audio & animation loops
  const audioCtxRef = useRef<AudioContext | null>(null);
  const decodedBuffersRef = useRef<DecodedVerseBuffer[]>([]);
  const playbackHandleRef = useRef<ScheduledPlaybackHandle | null>(null);
  const playbackStartCtxTimeRef = useRef<number>(0);
  const playbackStartOffsetRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const verseItemRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useWakeLock(isOpen && stage !== 'setup');

  // Sync defaults on open
  useEffect(() => {
    if (!isOpen) return;
    setSurahNum(initialSurahNum || 1);
    const meta = ALL_114_SURAHS.find((s) => s.number === (initialSurahNum || 1)) || ALL_114_SURAHS[0];
    const start = Math.max(1, Math.min(meta.numberOfAyahs, initialStartAyah || 1));
    const end = Math.min(meta.numberOfAyahs, start + 4);
    setStartAyah(start);
    setEndAyah(end);
    setReciterId(initialReciter?.id || 'mishary');
    if (
      initialBgId === 'none_noir' ||
      initialBgId === 'none_blanc' ||
      MOBILE_VERTICAL_BACKGROUNDS.some((b) => b.id === initialBgId)
    ) {
      setBgId(initialBgId);
    }
    setStage('setup');
  }, [isOpen, initialSurahNum, initialStartAyah, initialReciter?.id, initialBgId]);

  const surahMeta: CompleteSurahItem = useMemo(
    () => ALL_114_SURAHS.find((s) => s.number === surahNum) || ALL_114_SURAHS[0],
    [surahNum]
  );

  const selectedReciter: Reciter = useMemo(
    () => RECITERS.find((r) => r.id === reciterId) || RECITERS[0],
    [reciterId]
  );

  // Load verses when surahNum changes
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setIsLoadingVerses(true);
    fetchSurahVersesForStudio(surahMeta)
      .then((data) => {
        if (!active) return;
        setSurahVerses(data.ayahs);
        const maxN = data.ayahs.length || surahMeta.numberOfAyahs;
        const normalized = normalizeVerseRange(startAyah, endAyah, maxN);
        setStartAyah(normalized.startAyah);
        setEndAyah(normalized.endAyah);
      })
      .finally(() => {
        if (active) setIsLoadingVerses(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, surahMeta]);

  const maxAyahNum = surahVerses.length || surahMeta.numberOfAyahs || 1;
  const normalizedRange = useMemo(
    () => normalizeVerseRange(startAyah, endAyah, maxAyahNum),
    [startAyah, endAyah, maxAyahNum]
  );

  const selectedVerses = useMemo(
    () => sliceSelectedAyahs(surahVerses, normalizedRange.startAyah, normalizedRange.endAyah),
    [surahVerses, normalizedRange]
  );

  const selectedBg = useMemo(
    () => MOBILE_VERTICAL_BACKGROUNDS.find((b) => b.id === bgId) || null,
    [bgId]
  );

  const isLightSurface = useMemo(() => {
    if (bgId === 'none_blanc') return true;
    if (bgId === 'none_noir') return false;
    return selectedBg?.polarity === 'light';
  }, [bgId, selectedBg]);

  const filteredMobileBackgrounds = useMemo(() => {
    if (bgFilter === 'all') return MOBILE_VERTICAL_BACKGROUNDS;
    return MOBILE_VERTICAL_BACKGROUNDS.filter((b) => b.category === bgFilter);
  }, [bgFilter]);

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
    () => buildContinuousTimeline(selectedVerses, measuredDurations, paceMultiplier),
    [selectedVerses, measuredDurations, paceMultiplier]
  );

  // Stop all running audio / animation / recording cleanly
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
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopAllMedia();
    }
  }, [isOpen]);

  // =========================================================================
  // CONTINUOUS FULL-RANGE PLAYER (Stage = 'player')
  // Pre-decodes & schedules ALL selected verses as ONE seamless stream
  // =========================================================================
  const startContinuousPlayer = async () => {
    if (selectedVerses.length === 0) return;
    stopAllMedia();
    setStage('player');
    setPlayerStatus('loading');
    setPlayerHudVisible(true);
    setCurrentTimeSec(0);
    setPlayerLoadProgress({ loaded: 0, total: selectedVerses.length });

    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    const AudioContextCtor =
      window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextCtor();
    audioCtxRef.current = ctx;
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    const decoded = await decodeVerseAudioSequence(
      ctx,
      surahNum,
      selectedVerses,
      reciterId,
      (loaded, total) => setPlayerLoadProgress({ loaded, total }),
      abortCtrl.signal
    );

    if (abortCtrl.signal.aborted) return;

    decodedBuffersRef.current = decoded;
    const durations = decoded.map((d) => (d.effectiveDurationSec > 0 ? d.effectiveDurationSec : undefined));
    setMeasuredDurations(durations);

    const exactTimeline = buildContinuousTimeline(selectedVerses, durations, paceMultiplier);
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
        setPlayerStatus('ended');
        setPlayerHudVisible(true);
        playbackHandleRef.current?.stop();
        playbackHandleRef.current = null;
        return;
      }
      setCurrentTimeSec(elapsed);
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
      setPlayerStatus('paused');
    } else if (playerStatus === 'paused' || playerStatus === 'ended') {
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }
      const nextOffset = playerStatus === 'ended' ? 0 : currentTimeSec;
      const exactTimeline = buildContinuousTimeline(selectedVerses, measuredDurations, paceMultiplier);
      beginContinuousAudioFromOffset(ctx, decodedBuffersRef.current, exactTimeline, nextOffset);
    }
  };

  const seekContinuousPlayer = (targetSec: number) => {
    const ctx = audioCtxRef.current;
    const exactTimeline = buildContinuousTimeline(selectedVerses, measuredDurations, paceMultiplier);
    const clamped = Math.max(0, Math.min(exactTimeline.totalDurationSec, targetSec));
    setCurrentTimeSec(clamped);
    if (ctx && playerStatus === 'playing') {
      beginContinuousAudioFromOffset(ctx, decodedBuffersRef.current, exactTimeline, clamped);
    }
  };

  // Smooth continuous teleprompter scroll in Stage = 'player'
  const { activeIndex: activePlayerIndex, totalProgress: playerTotalProgress } = useMemo(
    () => findActiveTimelineEntry(timeline, currentTimeSec),
    [timeline, currentTimeSec]
  );

  useEffect(() => {
    if (stage !== 'player') return;
    const container = scrollContainerRef.current;
    const el = verseItemRefs.current[activePlayerIndex];
    if (container && el) {
      const targetTop =
        el.offsetTop - container.clientHeight * 0.34 + el.clientHeight * 0.22;
      container.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth',
      });
    }
  }, [activePlayerIndex, stage]);

  // =========================================================================
  // REAL 9:16 VERTICAL VIDEO CREATION & EXPORT (Stage = 'export')
  // Renders 720x1280 continuous canvas + continuous audio stream -> MediaRecorder
  // =========================================================================
  const startVideoExport = async () => {
    if (selectedVerses.length === 0) return;
    stopAllMedia();
    if (exportedVideoUrl) {
      URL.revokeObjectURL(exportedVideoUrl);
      setExportedVideoUrl(null);
    }
    setExportedVideoBlob(null);
    setExportErrorMsg(null);
    setExportProgressPct(0);
    setExportElapsedSec(0);
    setStage('export');
    setExportStatus('preparing_audio');
    setExportStatusMessage(
      `Chargement et assemblage audio continu (${selectedVerses.length} versets)...`
    );

    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    try {
      const AudioContextCtor =
        window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextCtor();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }

      // 1. Decode all verses & load background image concurrently
      const [decoded, bgImg] = await Promise.all([
        decodeVerseAudioSequence(
          ctx,
          surahNum,
          selectedVerses,
          reciterId,
          (loaded, total) => {
            setPlayerLoadProgress({ loaded, total });
            setExportProgressPct(Math.round((loaded / Math.max(1, total)) * 25));
          },
          abortCtrl.signal
        ),
        loadCanvasBackgroundImage(selectedBg ? selectedBg.url : null),
      ]);

      if (abortCtrl.signal.aborted) return;

      const durations = decoded.map((d) =>
        d.effectiveDurationSec > 0 ? d.effectiveDurationSec : undefined
      );
      setMeasuredDurations(durations);
      const exactTimeline = buildContinuousTimeline(selectedVerses, durations, paceMultiplier);

      // Ensure font faces are loaded before measuring canvas text
      if (document.fonts?.ready) {
        await document.fonts.ready.catch(() => {});
      }

      const canvas = previewCanvasRef.current;
      if (!canvas) {
        throw new Error('Surface vidéo indisponible.');
      }
      canvas.width = 720;
      canvas.height = 1280;
      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx) {
        throw new Error('Contexte graphique 2D indisponible.');
      }

      const renderOpts: VideoCanvasRenderOptions = {
        width: 720,
        height: 1280,
        surahName: surahMeta.name,
        surahNumber: surahMeta.number,
        startAyah: normalizedRange.startAyah,
        endAyah: normalizedRange.endAyah,
        isLightSurface,
        bgImage: bgImg,
        showArabic,
        useTajweed,
        showPhonetics,
        showFrench,
        showSurahHeader,
        textScale,
        flowMode,
        reciterName: selectedReciter.name,
      };

      const layout = precomputeVideoCanvasLayout(canvasCtx, selectedVerses, renderOpts);

      // Draw frame 0 immediately
      renderVideoCanvasFrame(canvasCtx, layout, exactTimeline, 0, renderOpts);

      if (typeof (canvas as any).captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
        throw new Error(
          'Votre navigateur mobile ne supporte pas MediaRecorder pour exporter un fichier vidéo. Utilisez « Lire en Continu (9:16) » pour la lecture intégrale plein écran.'
        );
      }

      // 2. Compose video + seamless continuous audio tracks
      const videoStream: MediaStream = (canvas as any).captureStream(30);
      const destNode = ctx.createMediaStreamDestination();
      const hasAnyAudio = decoded.some((d) => d.buffer !== null);

      const combinedStream = new MediaStream();
      for (const vt of videoStream.getVideoTracks()) {
        combinedStream.addTrack(vt);
      }
      if (hasAnyAudio) {
        for (const at of destNode.stream.getAudioTracks()) {
          combinedStream.addTrack(at);
        }
      }

      const candidateMimeTypes = [
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      let chosenMime = '';
      for (const mime of candidateMimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          chosenMime = mime;
          break;
        }
      }

      const recorder = chosenMime
        ? new MediaRecorder(combinedStream, {
            mimeType: chosenMime,
            videoBitsPerSecond: 3_500_000,
          })
        : new MediaRecorder(combinedStream);
      mediaRecorderRef.current = recorder;

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunks.push(ev.data);
        }
      };

      recorder.onstop = () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        playbackHandleRef.current?.stop();
        playbackHandleRef.current = null;

        const finalMime = recorder.mimeType || chosenMime || 'video/webm';
        const blob = new Blob(chunks, { type: finalMime });
        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          setExportedVideoBlob(blob);
          setExportedVideoUrl(url);
          setExportedFileExt(finalMime.includes('mp4') ? 'mp4' : 'webm');
          setExportProgressPct(100);
          setExportStatus('ready');
          setExportStatusMessage('Votre vidéo 9:16 continue est prête !');
        } else if (!abortCtrl.signal.aborted) {
          setExportStatus('error');
          setExportErrorMsg('La vidéo générée est vide.');
        }
      };

      // 3. Start recording + continuous scheduled audio simultaneously
      setExportStatus('recording');
      setExportStatusMessage('Création de la vidéo continue en cours...');
      recorder.start(250);

      const segStarts = exactTimeline.segments.map((s) => s.startSec);
      const segDurs = exactTimeline.segments.map((s) => s.durationSec);
      playbackHandleRef.current = scheduleContinuousAudioSequence(
        ctx,
        decoded,
        segStarts,
        segDurs,
        0,
        [destNode],
        paceMultiplier
      );

      const startAudioClock = ctx.currentTime;
      const totalSec = Math.max(2, exactTimeline.totalDurationSec);

      const renderLoop = () => {
        if (abortCtrl.signal.aborted || !audioCtxRef.current || !mediaRecorderRef.current) return;
        const elapsed = Math.max(0, audioCtxRef.current.currentTime - startAudioClock);
        renderVideoCanvasFrame(canvasCtx, layout, exactTimeline, elapsed, renderOpts);
        setExportElapsedSec(elapsed);
        const pct = Math.min(99, 25 + Math.round((elapsed / totalSec) * 74));
        setExportProgressPct(pct);

        if (elapsed >= totalSec) {
          setExportStatus('finalizing');
          setExportStatusMessage('Finalisation du fichier vidéo...');
          if (mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
          return;
        }
        rafRef.current = requestAnimationFrame(renderLoop);
      };
      rafRef.current = requestAnimationFrame(renderLoop);
    } catch (err: any) {
      if (!abortCtrl.signal.aborted) {
        setExportStatus('error');
        setExportErrorMsg(
          err?.message || 'Impossible de générer la vidéo sur cet appareil.'
        );
      }
    }
  };

  const finishRecordingEarly = () => {
    setExportStatus('finalizing');
    setExportStatusMessage('Finalisation de votre extrait vidéo...');
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    playbackHandleRef.current?.stop();
    playbackHandleRef.current = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleShareVideo = async () => {
    if (!exportedVideoBlob) return;
    const filename = `coran-s${surahNum}-v${normalizedRange.startAyah}-${normalizedRange.endAyah}.${exportedFileExt}`;
    const file = new File([exportedVideoBlob], filename, { type: exportedVideoBlob.type });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: `Sourate ${surahMeta.name} (${normalizedRange.startAyah}-${normalizedRange.endAyah})`,
          text: `Récitation continue par ${selectedReciter.name}`,
          files: [file],
        });
      } catch {
        // user cancelled share
      }
    }
  };

  if (!isOpen) return null;

  // =========================================================================
  // RENDER: STAGE 2 — FULLSCREEN 9:16 CONTINUOUS PLAYER (NOT 1-BY-1)
  // =========================================================================
  if (stage === 'player') {
    return (
      <div
        data-testid="mobile-video-continuous-player"
        data-surface={isLightSurface ? 'light' : 'dark'}
        className={`fixed inset-0 z-[10050] w-full h-[100dvh] flex flex-col justify-between overflow-hidden select-none ${
          isLightSurface ? 'bg-[#FCFCFB] text-neutral-950' : 'bg-black text-white'
        }`}
        onClick={() => setPlayerHudVisible((v) => !v)}
      >
        {/* Chosen 9:16 Vertical Background */}
        {selectedBg && (
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src={selectedBg.url}
              alt={selectedBg.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: isLightSurface ? '#FFFFFF' : '#000000',
                opacity: isLightSurface ? 0.14 : 0.25,
              }}
            />
          </div>
        )}

        {/* Minimal Floating Header (Hides cleanly on tap) */}
        <div
          className={`relative z-30 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-2 transition-opacity duration-200 ${
            playerHudVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              stopAllMedia();
              setStage('setup');
            }}
            aria-label="Retour au studio vidéo"
            className="h-9 px-3 rounded-full bg-black/65 text-white border border-white/20 backdrop-blur-md flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300" />
            <span>Studio</span>
          </button>

          <div
            className={`px-3 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md ${
              isLightSurface
                ? 'bg-white/80 text-neutral-900 border-neutral-300'
                : 'bg-black/60 text-amber-300 border-white/20'
            }`}
          >
            Sourate {surahMeta.name} • {normalizedRange.startAyah}–{normalizedRange.endAyah}
          </div>

          <button
            onClick={() => {
              stopAllMedia();
              onClose();
            }}
            aria-label="Fermer le lecteur continu"
            className="w-9 h-9 rounded-full bg-rose-600/85 text-white border border-rose-400/40 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Loading Overlay while assembling continuous audio */}
        {playerStatus === 'loading' && (
          <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
            <Loader2
              className={`w-10 h-10 animate-spin ${
                isLightSurface ? 'text-emerald-700' : 'text-amber-300'
              }`}
            />
            <div className="space-y-1">
              <p className="text-base font-extrabold">
                Préparation de la lecture continue...
              </p>
              <p className="text-xs opacity-75">
                Assemblage sans coupure des versets {normalizedRange.startAyah} à{' '}
                {normalizedRange.endAyah} ({playerLoadProgress.loaded}/{playerLoadProgress.total})
              </p>
            </div>
          </div>
        )}

        {/* Continuous Unified Verse Ribbon (All verses flowing smoothly together!) */}
        {playerStatus !== 'loading' && (
          <div
            ref={scrollContainerRef}
            className="relative z-10 flex-1 overflow-y-auto px-5 pt-20 pb-52 no-scrollbar"
          >
            {showSurahHeader && (
              <div className="text-center mb-10">
                <div
                  className={`text-sm font-extrabold tracking-wide ${
                    isLightSurface ? 'text-emerald-800' : 'text-amber-300'
                  }`}
                >
                  Sourate {surahMeta.name} — {surahMeta.frenchTranslation}
                </div>
                <div className="text-xs opacity-65 mt-0.5">
                  Versets {normalizedRange.startAyah} à {normalizedRange.endAyah} •{' '}
                  {selectedReciter.name}
                </div>
              </div>
            )}

            <div
              data-testid="continuous-verses-ribbon"
              className={`max-w-[440px] mx-auto ${
                flowMode === 'stream' ? 'space-y-6' : 'space-y-9'
              }`}
            >
              {selectedVerses.map((ayah, idx) => {
                const isActive = idx === activePlayerIndex;
                const arSizeClass =
                  textScale === 'compact'
                    ? 'text-[26px] leading-[1.7]'
                    : textScale === 'grand'
                    ? 'text-[36px] leading-[1.8]'
                    : 'text-[31px] leading-[1.75]';
                const subSizeClass =
                  textScale === 'compact'
                    ? 'text-[14px]'
                    : textScale === 'grand'
                    ? 'text-[18px]'
                    : 'text-[16px]';

                return (
                  <div
                    key={ayah.num}
                    ref={(el) => {
                      verseItemRefs.current[idx] = el;
                    }}
                    data-testid={`continuous-verse-item-${ayah.num}`}
                    data-active={isActive ? 'true' : 'false'}
                    onClick={(e) => {
                      e.stopPropagation();
                      const targetStart = timeline.segments[idx]?.startSec ?? 0;
                      seekContinuousPlayer(targetStart);
                    }}
                    className={`transition-all duration-500 cursor-pointer pl-3 border-l-2 ${
                      isActive
                        ? isLightSurface
                          ? 'opacity-100 border-emerald-700'
                          : 'opacity-100 border-amber-400'
                        : flowMode === 'stream'
                        ? 'opacity-65 border-transparent'
                        : 'opacity-35 border-transparent'
                    }`}
                  >
                    {showArabic && (
                      <div
                        dir="rtl"
                        className={`font-arabic text-center ${arSizeClass} ${
                          isLightSurface ? 'text-neutral-950' : 'text-white'
                        }`}
                        style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}
                      >
                        <TajweedText
                          text={cleanAyahArabic(ayah.ar)}
                          enabled={useTajweed}
                          variant={isLightSurface ? 'light' : 'dark'}
                        />{' '}
                        <span
                          className={`text-[0.65em] font-mono ${
                            isLightSurface ? 'text-emerald-700' : 'text-amber-300'
                          }`}
                        >
                          ﴿{ayah.num}﴾
                        </span>
                      </div>
                    )}

                    {showPhonetics && ayah.tr && (
                      <p
                        className={`italic font-serif text-center mt-2 leading-relaxed ${subSizeClass} ${
                          isLightSurface ? 'text-emerald-800' : 'text-slate-300'
                        }`}
                      >
                        « {ayah.tr} »
                      </p>
                    )}

                    {showFrench && ayah.fr && (
                      <p
                        className={`text-center mt-1.5 leading-relaxed font-medium ${subSizeClass} ${
                          isLightSurface ? 'text-neutral-900' : 'text-neutral-100'
                        }`}
                      >
                        {ayah.num}. {ayah.fr}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Continuous Scrubber & Transport (Hides on tap) */}
        <div
          className={`relative z-30 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-2 transition-opacity duration-200 ${
            playerHudVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-black/75 border border-white/20 backdrop-blur-xl rounded-2xl p-3 text-white space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-300">
              <span>
                Verset {selectedVerses[activePlayerIndex]?.num ?? normalizedRange.startAyah} /{' '}
                {normalizedRange.endAyah}
              </span>
              <span>
                {formatTimeMMSS(currentTimeSec)} / {formatTimeMMSS(timeline.totalDurationSec)}
              </span>
            </div>
            <input
              type="range"
              aria-label="Progression de la lecture continue"
              min={0}
              max={Math.max(1, timeline.totalDurationSec)}
              step={0.1}
              value={Math.min(currentTimeSec, timeline.totalDurationSec)}
              onChange={(e) => seekContinuousPlayer(Number(e.target.value))}
              className="w-full accent-amber-400 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex items-center justify-between pt-0.5">
              <button
                onClick={() => seekContinuousPlayer(0)}
                aria-label="Recommencer au début"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlayPauseContinuous}
                aria-label={
                  playerStatus === 'playing'
                    ? 'Mettre en pause la lecture continue'
                    : 'Reprendre la lecture continue'
                }
                className="px-5 py-2 rounded-full bg-amber-400 text-neutral-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                {playerStatus === 'playing' ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>{playerStatus === 'ended' ? 'Rejouer' : 'Continuer'}</span>
                  </>
                )}
              </button>

              <button
                onClick={startVideoExport}
                className="px-3 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Exporter</span>
              </button>
            </div>
          </div>
          {/* Thin ambient line always showing total flow progress when HUD hidden */}
        </div>

        {/* Ultra-discreet bottom hairline progress bar even when HUD is hidden */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-20 pointer-events-none">
          <div
            className={`h-full transition-all duration-150 ${
              isLightSurface ? 'bg-emerald-700' : 'bg-amber-400'
            }`}
            style={{ width: `${Math.round(playerTotalProgress * 100)}%` }}
          />
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: STAGE 3 — VIDEO EXPORT & DOWNLOAD RESULT (Stage = 'export')
  // =========================================================================
  if (stage === 'export') {
    const filename = `coran-s${surahNum}-v${normalizedRange.startAyah}-${normalizedRange.endAyah}.${exportedFileExt}`;
    return (
      <div
        data-testid="mobile-video-export-view"
        className="fixed inset-0 z-[10050] bg-neutral-950 text-white flex flex-col justify-between p-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-black">Export Vidéo 9:16 Continu</h2>
              <p className="text-[11px] text-neutral-400">
                Sourate {surahMeta.name} ({normalizedRange.startAyah}–{normalizedRange.endAyah})
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopAllMedia();
              setStage('setup');
            }}
            aria-label="Retour à la configuration vidéo"
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
          >
            Retour
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-4 gap-4 min-h-0">
          {/* Live 9:16 Canvas Preview during recording OR Ready Video Player */}
          <div className="relative h-[46vh] max-h-[390px] aspect-[9/16] rounded-3xl overflow-hidden border border-white/20 bg-black shadow-2xl shrink-0">
            {exportStatus === 'ready' && exportedVideoUrl ? (
              <video
                data-testid="exported-video-preview"
                src={exportedVideoUrl}
                controls
                playsInline
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
              <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-4 text-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                <span className="text-xs font-bold">
                  Assemblage audio ({playerLoadProgress.loaded}/{playerLoadProgress.total})
                </span>
              </div>
            )}
          </div>

          {/* Progress & Status */}
          <div className="w-full max-w-sm space-y-2 text-center">
            {exportStatus === 'error' ? (
              <div className="p-3 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-200">
                {exportErrorMsg}
              </div>
            ) : (
              <>
                <div className="text-xs font-bold text-amber-300">{exportStatusMessage}</div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-200"
                    style={{ width: `${exportProgressPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span>{exportProgressPct}%</span>
                  <span>
                    {formatTimeMMSS(exportElapsedSec)} / {formatTimeMMSS(timeline.totalDurationSec)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="shrink-0 space-y-2 pt-2 border-t border-white/10">
          {exportStatus === 'recording' && (
            <button
              onClick={finishRecordingEarly}
              className="w-full py-3 rounded-2xl bg-amber-400 text-neutral-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Terminer & Sauvegarder maintenant</span>
            </button>
          )}

          {exportStatus === 'ready' && exportedVideoUrl && (
            <div className="grid grid-cols-2 gap-2">
              <a
                href={exportedVideoUrl}
                download={filename}
                data-testid="download-exported-video-link"
                className="py-3 rounded-2xl bg-amber-400 text-neutral-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger</span>
              </a>
              <button
                onClick={handleShareVideo}
                className="py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Partager</span>
              </button>
            </div>
          )}

          <button
            onClick={() => {
              stopAllMedia();
              setStage('setup');
            }}
            className="w-full py-2.5 rounded-2xl bg-white/10 text-neutral-200 font-bold text-xs cursor-pointer"
          >
            Modifier les réglages
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: STAGE 1 — STUDIO CONFIGURATOR (Mobile-Only)
  // =========================================================================
  return (
    <div
      data-testid="mobile-video-studio-modal"
      className="fixed inset-0 z-[10040] bg-neutral-950 text-white flex flex-col h-[100dvh] overflow-hidden"
    >
      {/* Top Bar */}
      <header className="shrink-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 border-b border-white/10 bg-neutral-900/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black leading-tight">Studio Vidéo Coran (9:16)</h2>
            <p className="text-[11px] text-neutral-400">
              Lecture et vidéo continues d&apos;une plage de versets
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Fermer le studio vidéo"
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Scrollable Settings Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 no-scrollbar">
        {/* 1. Sourate & Plage de Versets */}
        <section className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>1. Sourate &amp; Plage de Versets</span>
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 whitespace-nowrap shrink-0">
              {normalizedRange.count} verset{normalizedRange.count > 1 ? 's' : ''}
            </span>
          </div>

          <button
            type="button"
            data-testid="studio-surah-picker-btn"
            onClick={() => setIsSurahPickerOpen(true)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-black/50 border border-white/15 text-left cursor-pointer"
          >
            <div>
              <div className="text-sm font-bold text-white">
                {surahMeta.number}. {surahMeta.name}
              </div>
              <div className="text-[11px] text-neutral-400">
                {surahMeta.frenchTranslation} • {maxAyahNum} versets
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-arabic text-base text-amber-200" dir="rtl">
                {surahMeta.arabicName}
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </div>
          </button>

          {/* From -> To Verse Range */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label
                htmlFor="studio-start-ayah"
                className="block text-[11px] font-bold text-neutral-300"
              >
                Du verset
              </label>
              <select
                id="studio-start-ayah"
                value={normalizedRange.startAyah}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setStartAyah(val);
                  if (endAyah < val) setEndAyah(val);
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/15 text-sm font-bold text-white"
              >
                {Array.from({ length: maxAyahNum }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    Verset {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="studio-end-ayah"
                className="block text-[11px] font-bold text-neutral-300"
              >
                Au verset
              </label>
              <select
                id="studio-end-ayah"
                value={normalizedRange.endAyah}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setEndAyah(Math.max(normalizedRange.startAyah, val));
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/15 text-sm font-bold text-white"
              >
                {Array.from(
                  { length: maxAyahNum - normalizedRange.startAyah + 1 },
                  (_, i) => normalizedRange.startAyah + i
                ).map((n) => (
                  <option key={n} value={n}>
                    Verset {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Range Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
            {[
              { label: '1 → 3', s: 1, e: Math.min(3, maxAyahNum) },
              { label: '1 → 5', s: 1, e: Math.min(5, maxAyahNum) },
              { label: '1 → 7', s: 1, e: Math.min(7, maxAyahNum) },
              { label: '1 → 10', s: 1, e: Math.min(10, maxAyahNum) },
              { label: `Toute (${maxAyahNum})`, s: 1, e: maxAyahNum },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setStartAyah(preset.s);
                  setEndAyah(preset.e);
                }}
                className={`px-2.5 py-1 rounded-lg shrink-0 border cursor-pointer ${
                  normalizedRange.startAyah === preset.s &&
                  normalizedRange.endAyah === preset.e
                    ? 'bg-amber-400 text-neutral-950 border-amber-300'
                    : 'bg-white/5 text-neutral-300 border-white/10'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {isLoadingVerses && (
            <div className="text-[11px] text-amber-300 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Chargement des versets...</span>
            </div>
          )}
        </section>

        {/* 2. Récitateur */}
        <section className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5" />
            <span>2. Récitateur</span>
          </span>
          <button
            type="button"
            data-testid="studio-reciter-picker-btn"
            onClick={() => setIsReciterPickerOpen(true)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-black/50 border border-white/15 text-left cursor-pointer"
          >
            <div>
              <div className="text-sm font-bold text-white">{selectedReciter.name}</div>
              <div className="text-[11px] text-neutral-400">{selectedReciter.style}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
          </button>
        </section>

        {/* 3. Fond Vertical 9:16 (20 Images + Unis) */}
        <section className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>3. Fond 9:16 ({MOBILE_VERTICAL_BACKGROUNDS.length} images)</span>
            </span>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setBgFilter('all')}
              className={`px-2.5 py-1 rounded-lg shrink-0 cursor-pointer ${
                bgFilter === 'all' ? 'bg-amber-400 text-neutral-950' : 'bg-white/10 text-neutral-300'
              }`}
            >
              Tous ({MOBILE_VERTICAL_BACKGROUNDS.length})
            </button>
            <button
              type="button"
              onClick={() => setBgFilter('noir')}
              className={`px-2.5 py-1 rounded-lg shrink-0 cursor-pointer ${
                bgFilter === 'noir'
                  ? 'bg-neutral-950 text-white border border-white/40'
                  : 'bg-white/10 text-neutral-300'
              }`}
            >
              Noirs (10)
            </button>
            <button
              type="button"
              onClick={() => setBgFilter('blanc')}
              className={`px-2.5 py-1 rounded-lg shrink-0 cursor-pointer ${
                bgFilter === 'blanc' ? 'bg-white text-neutral-950' : 'bg-white/10 text-neutral-300'
              }`}
            >
              Blancs (10)
            </button>
            <button
              type="button"
              onClick={() => setBgId('none_noir')}
              className={`px-2.5 py-1 rounded-lg shrink-0 border cursor-pointer ${
                bgId === 'none_noir'
                  ? 'bg-amber-400 text-neutral-950 border-amber-300'
                  : 'bg-black text-neutral-300 border-white/20'
              }`}
            >
              Noir Uni
            </button>
            <button
              type="button"
              onClick={() => setBgId('none_blanc')}
              className={`px-2.5 py-1 rounded-lg shrink-0 border cursor-pointer ${
                bgId === 'none_blanc'
                  ? 'bg-amber-400 text-neutral-950 border-amber-300'
                  : 'bg-white text-neutral-900 border-neutral-300'
              }`}
            >
              Blanc Uni
            </button>
          </div>

          {/* Horizontal Scroll Strip of 20 Vertical 9:16 Backgrounds */}
          <div
            data-testid="studio-backgrounds-strip"
            className="flex items-stretch gap-2.5 overflow-x-auto pb-1.5 no-scrollbar"
          >
            {filteredMobileBackgrounds.map((bg) => {
              const active = bgId === bg.id;
              return (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => setBgId(bg.id)}
                  className={`relative shrink-0 w-24 aspect-[9/16] rounded-2xl overflow-hidden border text-left flex flex-col justify-end p-2 cursor-pointer transition ${
                    active ? 'border-amber-400 ring-2 ring-amber-400/60' : 'border-white/15'
                  }`}
                >
                  <img
                    src={bg.url}
                    alt={bg.name}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                  <div className="relative z-10 flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-white leading-tight line-clamp-2">
                      {bg.name}
                    </span>
                    {active && (
                      <span className="w-4 h-4 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. Options Texte, Flow Continu & Vitesse */}
        <section className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>4. Style &amp; Options de la Vidéo</span>
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
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
                className={`px-3 py-2 rounded-xl border flex items-center justify-between cursor-pointer ${
                  item.val
                    ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                    : 'bg-black/40 border-white/10 text-neutral-400'
                }`}
              >
                <span>{item.label}</span>
                {item.val && <Check className="w-3.5 h-3.5 text-amber-300" />}
              </button>
            ))}
          </div>

          {/* Style de lecture continue */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-neutral-300">Mode visuel continu</div>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFlowMode('teleprompter')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                  flowMode === 'teleprompter'
                    ? 'bg-amber-400 text-neutral-950 border-amber-300'
                    : 'bg-white/5 text-neutral-300 border-white/10'
                }`}
              >
                <div>Téléprompteur</div>
                <div className="text-[10px] opacity-75">Glissement continu</div>
              </button>
              <button
                type="button"
                onClick={() => setFlowMode('stream')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                  flowMode === 'stream'
                    ? 'bg-amber-400 text-neutral-950 border-amber-300'
                    : 'bg-white/5 text-neutral-300 border-white/10'
                }`}
              >
                <div>Flux Intégral</div>
                <div className="text-[10px] opacity-75">Page unifiée continue</div>
              </button>
            </div>
          </div>

          {/* Taille & Vitesse */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-neutral-300">Taille du texte</div>
              <div className="grid grid-cols-3 gap-1 text-[11px] font-bold">
                {(['compact', 'standard', 'grand'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setTextScale(sz)}
                    className={`py-1.5 rounded-lg border capitalize cursor-pointer ${
                      textScale === sz
                        ? 'bg-amber-400 text-neutral-950 border-amber-300'
                        : 'bg-white/5 text-neutral-300 border-white/10'
                    }`}
                  >
                    {sz === 'compact' ? 'S' : sz === 'standard' ? 'M' : 'L'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-bold text-neutral-300">Cadence</div>
              <div className="grid grid-cols-3 gap-1 text-[11px] font-bold">
                {[0.9, 1.0, 1.15].map((pace) => (
                  <button
                    key={pace}
                    type="button"
                    onClick={() => setPaceMultiplier(pace)}
                    className={`py-1.5 rounded-lg border cursor-pointer ${
                      paceMultiplier === pace
                        ? 'bg-amber-400 text-neutral-950 border-amber-300'
                        : 'bg-white/5 text-neutral-300 border-white/10'
                    }`}
                  >
                    {pace}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Sticky Dual Action Bar */}
      <footer className="shrink-0 p-3.5 pb-[calc(env(safe-area-inset-bottom)+0.85rem)] border-t border-white/10 bg-neutral-900/95 backdrop-blur-xl grid grid-cols-2 gap-2.5">
        <button
          type="button"
          data-testid="studio-play-continuous-btn"
          disabled={isLoadingVerses || selectedVerses.length === 0}
          onClick={startContinuousPlayer}
          className="py-3 px-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          <Play className="w-4 h-4 fill-current text-amber-300 shrink-0" />
          <span>Lire en Continu</span>
        </button>

        <button
          type="button"
          data-testid="studio-create-video-btn"
          disabled={isLoadingVerses || selectedVerses.length === 0}
          onClick={startVideoExport}
          className="py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer disabled:opacity-40"
        >
          <Film className="w-4 h-4 shrink-0" />
          <span>Créer la Vidéo</span>
        </button>
      </footer>

      {/* Searchable Surah Picker Overlay */}
      {isSurahPickerOpen && (
        <div
          className="fixed inset-0 z-[10060] bg-black/80 backdrop-blur-md flex items-center justify-center p-3"
          onClick={() => setIsSurahPickerOpen(false)}
        >
          <div
            className="w-full max-w-md max-h-[82vh] bg-neutral-900 border border-white/20 rounded-3xl p-4 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black">Choisir la Sourate</h3>
              <button
                onClick={() => setIsSurahPickerOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 cursor-pointer"
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
                placeholder="Rechercher..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 no-scrollbar">
              {filteredSurahs.map((s) => (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => {
                    setSurahNum(s.number);
                    setStartAyah(1);
                    setEndAyah(Math.min(5, s.numberOfAyahs));
                    setIsSurahPickerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left border cursor-pointer ${
                    s.number === surahNum
                      ? 'bg-amber-400 text-neutral-950 border-amber-300 font-bold'
                      : 'bg-white/5 text-white border-white/5'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">
                      {s.number}. {s.name}
                    </div>
                    <div className="text-[10px] opacity-75">
                      {s.frenchTranslation} • {s.numberOfAyahs} versets
                    </div>
                  </div>
                  <span className="font-arabic text-base" dir="rtl">
                    {s.arabicName}
                  </span>
                </button>
              ))}
            </div>
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
            className="w-full max-w-md max-h-[82vh] bg-neutral-900 border border-white/20 rounded-3xl p-4 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black">Choisir le Récitateur</h3>
              <button
                onClick={() => setIsReciterPickerOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 no-scrollbar">
              {RECITERS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setReciterId(r.id);
                    onSyncReciter?.(r);
                    setIsReciterPickerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left border cursor-pointer ${
                    r.id === reciterId
                      ? 'bg-amber-400 text-neutral-950 border-amber-300 font-bold'
                      : 'bg-white/5 text-white border-white/5'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{r.name}</div>
                    <div className="text-[10px] opacity-75">{r.style}</div>
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
