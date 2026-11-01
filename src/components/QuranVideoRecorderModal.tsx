import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Video,
  Download,
  Sparkles,
  ShieldCheck,
  Check,
  Smartphone,
  Tv,
  Square,
  Loader2,
  Film,
  Camera,
  Layers,
} from 'lucide-react';
import { Reciter } from '../types';
import { CINEMATIC_THEMES, CinematicThemeId } from './QuranCinematicReader';
import { parseTajweedTokens } from '../utils/tajweedColorizer';

interface QuranVideoRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  surahNum: number;
  surahName: string;
  totalAyahs: number;
  currentAyahNum: number;
  ayahs: { num: number; ar: string; tr: string; fr: string }[];
  selectedReciter: Reciter;
  getAyahAudioUrl: (surahNum: number, ayahNum: number, reciterId: string) => string;
  themeId: CinematicThemeId;
}

type VideoAspectRatio = 'story' | 'landscape' | 'square';

export const QuranVideoRecorderModal: React.FC<QuranVideoRecorderModalProps> = ({
  isOpen,
  onClose,
  surahNum,
  surahName,
  totalAyahs,
  currentAyahNum,
  ayahs,
  selectedReciter,
  getAyahAudioUrl,
  themeId,
}) => {
  // Range selection (de tel verset à un autre)
  const [fromAyah, setFromAyah] = useState<number>(currentAyahNum);
  const [toAyah, setToAyah] = useState<number>(Math.min(totalAyahs, currentAyahNum));

  // Format selection
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('story');

  // Visual options
  const [activeThemeId, setActiveThemeId] = useState<CinematicThemeId>(themeId);
  const [includeTranslation, setIncludeTranslation] = useState<boolean>(true);
  const [includePhonetics, setIncludePhonetics] = useState<boolean>(false);
  const [includeTajweed, setIncludeTajweed] = useState<boolean>(true);
  const [includeWatermark, setIncludeWatermark] = useState<boolean>(true);

  // Recording pipeline states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);
  const [_currentRecordingAyah, setCurrentRecordingAyah] = useState<number>(fromAyah);
  const [recordingStatusText, setRecordingStatusText] = useState<string>('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  // Reset range when opened or currentAyahNum changes
  useEffect(() => {
    if (isOpen) {
      setFromAyah(currentAyahNum);
      setToAyah(Math.min(totalAyahs, currentAyahNum));
      setGeneratedVideoUrl(null);
      setGeneratedBlob(null);
      setIsRecording(false);
      setRecordingProgress(0);
    }
  }, [isOpen, currentAyahNum, totalAyahs]);

  // Clean up on unmount or close
  useEffect(() => {
    return () => {
      cancelGeneration();
    };
  }, []);

  const cancelGeneration = () => {
    isCancelledRef.current = true;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
    setIsRecording(false);
  };

  if (!isOpen) return null;

  const currentTheme = CINEMATIC_THEMES[activeThemeId] || CINEMATIC_THEMES.emerald;

  // Selected ayahs slice
  const selectedAyahs = ayahs.filter((a) => a.num >= fromAyah && a.num <= toAyah);
  const totalSelected = selectedAyahs.length;

  // Canvas Dimensions based on aspect ratio
  const getCanvasDimensions = () => {
    switch (aspectRatio) {
      case 'story':
        return { width: 1080, height: 1920 }; // 9:16
      case 'square':
        return { width: 1080, height: 1080 }; // 1:1
      case 'landscape':
      default:
        return { width: 1920, height: 1080 }; // 16:9
    }
  };

  // =========================================================================
  // 1. BASE SCENE (Background, ambient light, card frame, official watermark)
  // =========================================================================
  const drawBaseScene = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();

    // Radial gradient background
    const bgGrad = ctx.createRadialGradient(
      width / 2,
      height * 0.35,
      width * 0.05,
      width / 2,
      height / 2,
      width * 0.85
    );
    bgGrad.addColorStop(0, currentTheme.swatch);
    bgGrad.addColorStop(0.65, '#050e09');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Ambient soft glow
    const glowGrad = ctx.createRadialGradient(
      width / 2,
      height * 0.32,
      20,
      width / 2,
      height * 0.32,
      width * 0.48
    );
    glowGrad.addColorStop(0, currentTheme.glow1.replace(/[\d\.]+\)$/, '0.25)'));
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, width, height);

    // Official Authentication Watermark Badge (Le Sanctuaire) - Frameless, clean top-right pill
    if (includeWatermark) {
      const isPortrait = aspectRatio === 'story';
      const badgeW = isPortrait ? 300 : 360;
      const badgeH = 40;
      const badgeX = width - badgeW - 32;
      const badgeY = 28;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 20);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#FCD34D';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('☪ Le Sanctuaire', badgeX + 16, badgeY + badgeH / 2);

      ctx.font = 'normal 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#A7F3D0';
      ctx.fillText('• Récitation Authentifiée', badgeX + 146, badgeY + badgeH / 2);
    }

    ctx.restore();
  };

  // =========================================================================
  // 2. AYAH ELEMENTS (Pure Frameless Typography matching Image 2)
  // Renders with opacity and vertical offset for silky smooth crossfading!
  // =========================================================================
  const drawAyahElements = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    ayah: { num: number; ar: string; tr: string; fr: string },
    opacity: number,
    offsetY: number = 0
  ) => {
    if (opacity <= 0.005) return;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
    ctx.translate(0, offsetY);

    // Stable anchor coordinates
    const isPortrait = aspectRatio === 'story';
    const topZoneY = isPortrait ? height * 0.14 : height * 0.13;

    // Top Verse Pill: Sourate [Name] • Verset [X] / [Y] (matching Image 2)
    const pillY = topZoneY;
    const pillW = isPortrait ? 340 : 400;
    const pillH = 38;
    const pillX = (width - pillW) / 2;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 19);
    ctx.fill();
    ctx.stroke();

    ctx.font = '500 15px "Plus Jakarta Sans", monospace, sans-serif';
    ctx.fillStyle = '#FCD34D';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `Sourate ${surahName}  •  Verset ${ayah.num} / ${totalAyahs}`,
      width / 2,
      pillY + pillH / 2
    );

    // Giant Arabic Verse with Tajweed Colors (Borderless, pure calligraphy)
    const arabicMaxWidth = width * 0.86;
    const arabicFontSize = isPortrait
      ? ayah.ar.length > 250
        ? 34
        : ayah.ar.length > 130
          ? 44
          : 54
      : ayah.ar.length > 250
        ? 40
        : ayah.ar.length > 130
          ? 50
          : 62;

    ctx.font = `${arabicFontSize}px "Amiri", "Traditional Arabic", serif`;
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';

    const words = ayah.ar.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const w of words) {
      const testLine = currentLine ? `${currentLine} ${w}` : w;
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > arabicMaxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = w;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = arabicFontSize * 2.0;
    const totalArabicHeight = lines.length * lineHeight;

    // Center anchor for Arabic verse
    const arabicCenterAnchorY = isPortrait ? height * 0.43 : height * 0.44;
    const startArabicY = arabicCenterAnchorY - totalArabicHeight / 2;

    lines.forEach((line, idx) => {
      const lineY = startArabicY + idx * lineHeight;

      if (!includeTajweed) {
        ctx.fillStyle = '#FEF3C7';
        ctx.fillText(line, width / 2, lineY);
      } else {
        const tokens = parseTajweedTokens(line);
        let totalLineWidth = 0;
        tokens.forEach((t) => {
          totalLineWidth += ctx.measureText(t.text).width;
        });

        let startX = width / 2 + totalLineWidth / 2;
        ctx.textAlign = 'right';

        tokens.forEach((token) => {
          if (token.type === 'madd') ctx.fillStyle = '#F87171';
          else if (token.type === 'ghunnah') ctx.fillStyle = '#34D399';
          else if (token.type === 'qalqalah') ctx.fillStyle = '#38BDF8';
          else if (token.type === 'tafkhim') ctx.fillStyle = '#FBBF24';
          else if (token.type === 'silent') ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
          else ctx.fillStyle = '#FEF3C7';

          ctx.fillText(token.text, startX, lineY);
          startX -= ctx.measureText(token.text).width;
        });

        ctx.textAlign = 'center';
      }
    });

    // Subtle thin single horizontal divider line (matching Image 2)
    const lineY = isPortrait ? height * 0.64 : height * 0.66;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width * 0.12, lineY);
    ctx.lineTo(width * 0.88, lineY);
    ctx.stroke();

    // French Translation: Pure clean white typography without any box (matching Image 2)
    ctx.direction = 'ltr';
    if (includeTranslation && ayah.fr) {
      const transFontSize = isPortrait ? 22 : 24;
      ctx.font = `normal ${transFontSize}px "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif`;

      const tWords = ayah.fr.split(' ');
      const tLines: string[] = [];
      let tLine = '';
      const textMaxW = width * 0.80;

      for (let n = 0; n < tWords.length; n++) {
        const testT = tLine ? `${tLine} ${tWords[n]}` : tWords[n];
        if (ctx.measureText(testT).width > textMaxW && n > 0) {
          tLines.push(tLine);
          tLine = tWords[n];
        } else {
          tLine = testT;
        }
      }
      if (tLine) tLines.push(tLine);

      const tLineHeight = transFontSize * 1.55;
      const transStartY = lineY + 28;

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      tLines.forEach((tl, i) => {
        ctx.fillText(tl, width / 2, transStartY + i * tLineHeight);
      });
    }

    ctx.restore();
  };

  // =========================================================================
  // 3. BOTTOM BAR (Waveform + Progress Bar)
  // =========================================================================
  const drawBottomBar = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    audioProgress: number,
    analyserData?: Uint8Array
  ) => {
    ctx.save();
    const bottomBarY = height - 90;

    // Soundwave visualization
    if (analyserData && analyserData.length > 0) {
      const barsCount = 36;
      const barWidth = 6;
      const spacing = 8;
      const totalWaveWidth = barsCount * (barWidth + spacing);
      const waveStartX = (width - totalWaveWidth) / 2;

      ctx.fillStyle = currentTheme.accent;
      for (let b = 0; b < barsCount; b++) {
        const val = analyserData[b * 2] || 0;
        const barHeight = Math.max(6, (val / 255) * 44);
        ctx.fillRect(
          waveStartX + b * (barWidth + spacing),
          bottomBarY - barHeight / 2,
          barWidth,
          barHeight
        );
      }
    }

    // Audio progress bar
    const progW = width * 0.7;
    const progX = (width - progW) / 2;
    const progY = height - 38;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.roundRect(progX, progY, progW, 6, 3);
    ctx.fill();

    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.roundRect(progX, progY, progW * Math.min(1, Math.max(0, audioProgress)), 6, 3);
    ctx.fill();

    ctx.restore();
  };

  // =========================================================================
  // 4. CROSSFADE TRANSITION ANIMATOR (Silky smooth, non-abrupt transition!)
  // =========================================================================
  const animateCrossfadeTransition = async (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    outgoingAyah: { num: number; ar: string; tr: string; fr: string },
    incomingAyah: { num: number; ar: string; tr: string; fr: string },
    durationMs: number = 750
  ) => {
    const startTime = performance.now();

    await new Promise<void>((resolve) => {
      const step = (now: number) => {
        if (isCancelledRef.current) {
          resolve();
          return;
        }

        const elapsed = now - startTime;
        const rawT = Math.min(1, elapsed / durationMs);
        // Cosine easing for ultra-smooth optical acceleration and deceleration
        const t = 0.5 - 0.5 * Math.cos(rawT * Math.PI);

        // 1. Draw persistent base scene
        drawBaseScene(ctx, width, height);

        // 2. Outgoing verse gently fades out & floats upward
        drawAyahElements(ctx, width, height, outgoingAyah, 1 - t, -16 * t);

        // 3. Incoming verse gently fades in & rises from below
        drawAyahElements(ctx, width, height, incomingAyah, t, 16 * (1 - t));

        // 4. Clean bottom bar
        drawBottomBar(ctx, width, height, 0, undefined);

        if (rawT < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(step);
    });
  };

  // Fade-in at start of video
  const animateVerseFadeIn = async (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    ayah: { num: number; ar: string; tr: string; fr: string },
    durationMs: number = 450
  ) => {
    const startTime = performance.now();
    await new Promise<void>((resolve) => {
      const step = (now: number) => {
        if (isCancelledRef.current) {
          resolve();
          return;
        }
        const elapsed = now - startTime;
        const rawT = Math.min(1, elapsed / durationMs);
        const t = 0.5 - 0.5 * Math.cos(rawT * Math.PI);

        drawBaseScene(ctx, width, height);
        drawAyahElements(ctx, width, height, ayah, t, 14 * (1 - t));
        drawBottomBar(ctx, width, height, 0, undefined);

        if (rawT < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  };

  // =========================================================================
  // 5. MAIN RECORDING PIPELINE
  // =========================================================================
  const handleStartRecording = async () => {
    if (isRecording) return;
    isCancelledRef.current = false;
    setIsRecording(true);
    setGeneratedVideoUrl(null);
    setGeneratedBlob(null);
    setRecordingProgress(0);

    const canvas = canvasRef.current;
    if (!canvas) {
      setIsRecording(false);
      return;
    }

    const { width, height } = getCanvasDimensions();
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsRecording(false);
      return;
    }

    try {
      // 1. Setup AudioContext and Web Audio MediaStream destination
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const audioDest = audioCtx.createMediaStreamDestination();

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      const freqData = new Uint8Array(analyser.frequencyBinCount);

      // 2. Setup Canvas stream at 30 fps
      const canvasStream = canvas.captureStream(30);

      // Combine video track + audio track
      const combinedTracks = [
        ...canvasStream.getVideoTracks(),
        ...audioDest.stream.getAudioTracks(),
      ];
      const combinedStream = new MediaStream(combinedTracks);

      // Best supported mimeType
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ];
      const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMime || undefined,
        videoBitsPerSecond: 3500000,
      });
      mediaRecorderRef.current = recorder;

      const recordedChunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (!isCancelledRef.current && recordedChunks.length > 0) {
          const blob = new Blob(recordedChunks, { type: selectedMime || 'video/webm' });
          setGeneratedBlob(blob);
          const url = URL.createObjectURL(blob);
          setGeneratedVideoUrl(url);
          setRecordingProgress(100);
          setRecordingStatusText('Génération réussie ! Prêt au visionnage.');
        }
        setIsRecording(false);
      };

      recorder.start();

      const totalVerses = selectedAyahs.length;

      // Initial smooth fade-in before audio starts
      await animateVerseFadeIn(ctx, width, height, selectedAyahs[0], 500);

      // Loop through verses
      for (let idx = 0; idx < totalVerses; idx++) {
        if (isCancelledRef.current) break;
        const currentAyah = selectedAyahs[idx];
        setCurrentRecordingAyah(currentAyah.num);
        setRecordingStatusText(
          `Récitation du verset ${currentAyah.num} sur ${toAyah} (${idx + 1} / ${totalVerses})...`
        );

        // Load verse audio
        const audioUrl = getAyahAudioUrl(surahNum, currentAyah.num, selectedReciter.id);
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.src = audioUrl;
        audioRef.current = audio;

        // Connect audio node
        const sourceNode = audioCtx.createMediaElementSource(audio);
        sourceNode.connect(analyser);
        analyser.connect(audioDest);
        sourceNode.connect(audioCtx.destination);

        await new Promise<void>((resolve) => {
          let hasEnded = false;

          const renderLoop = () => {
            if (isCancelledRef.current || hasEnded) return;
            analyser.getByteFrequencyData(freqData);

            const currentTime = audio.currentTime || 0;
            const duration = audio.duration || 1;
            const verseProgress = Math.min(1, currentTime / duration);
            const overallProgress = Math.round(
              ((idx + verseProgress) / totalVerses) * 100
            );
            setRecordingProgress(overallProgress);

            drawBaseScene(ctx, width, height);
            drawAyahElements(ctx, width, height, currentAyah, 1.0, 0);
            drawBottomBar(ctx, width, height, verseProgress, freqData);

            animationFrameRef.current = requestAnimationFrame(renderLoop);
          };

          audio.onplay = () => {
            renderLoop();
          };

          audio.onended = () => {
            hasEnded = true;
            sourceNode.disconnect();
            resolve();
          };

          audio.onerror = () => {
            hasEnded = true;
            sourceNode.disconnect();
            resolve();
          };

          audio.play().catch(() => {
            hasEnded = true;
            sourceNode.disconnect();
            resolve();
          });
        });

        if (isCancelledRef.current) break;

        // =====================================================================
        // SILKY SMOOTH CROSSFADE TRANSITION TO NEXT VERSE
        // Eliminates abrupt cuts completely!
        // =====================================================================
        if (idx < totalVerses - 1) {
          const nextAyah = selectedAyahs[idx + 1];
          setRecordingStatusText(`Transition vers le verset ${nextAyah.num}...`);
          // 800ms gentle crossfade transition
          await animateCrossfadeTransition(ctx, width, height, currentAyah, nextAyah, 800);
          // Short 200ms natural breathing pause before the Qari starts reciting next verse
          await new Promise((r) => setTimeout(r, 200));
        } else {
          // Final verse lingering & smooth gentle finish
          await new Promise((r) => setTimeout(r, 800));
        }
      }

      // Stop recorder
      if (!isCancelledRef.current && recorder.state !== 'inactive') {
        recorder.stop();
      }
    } catch (err: any) {
      console.error('Video generation error:', err);
      setRecordingStatusText(`Erreur : ${err?.message || 'Échec de la génération'}`);
      setIsRecording(false);
    }
  };

  const handleDownloadVideo = () => {
    if (!generatedBlob && !generatedVideoUrl) return;
    const a = document.createElement('a');
    a.href = generatedVideoUrl!;
    a.download = `Le_Sanctuaire_Sourate_${surahNum}_Versets_${fromAyah}_a_${toAyah}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = getCanvasDimensions();
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx || selectedAyahs.length === 0) return;

    drawBaseScene(ctx, width, height);
    drawAyahElements(ctx, width, height, selectedAyahs[0], 1.0, 0);
    drawBottomBar(ctx, width, height, 1.0);

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `Le_Sanctuaire_Sourate_${surahNum}_Verset_${selectedAyahs[0].num}_HD.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-neutral-900 border border-white/15 rounded-3xl shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Studio Vidéo &amp; Exportation des Versets
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  Filigrane Authentifié
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Générez une vidéo avec transition fondue douce entre chaque verset, audio et logo certifié
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              cancelGeneration();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Section 1: Selection de la plage de versets */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                1. Sélection des Versets à Enregistrer
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold font-mono">
                {totalSelected} verset{totalSelected > 1 ? 's' : ''} sélectionné{totalSelected > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Du verset (Départ) :
                </label>
                <select
                  value={fromAyah}
                  disabled={isRecording}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFromAyah(val);
                    if (val > toAyah) setToAyah(val);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-white/15 text-white font-bold text-sm focus:outline-hidden focus:border-amber-400"
                >
                  {ayahs.map((a) => (
                    <option key={a.num} value={a.num}>
                      Verset {a.num} : {a.ar.slice(0, 30)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Au verset (Fin) :
                </label>
                <select
                  value={toAyah}
                  disabled={isRecording}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setToAyah(val);
                    if (val < fromAyah) setFromAyah(val);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-white/15 text-white font-bold text-sm focus:outline-hidden focus:border-amber-400"
                >
                  {ayahs
                    .filter((a) => a.num >= fromAyah)
                    .map((a) => (
                      <option key={a.num} value={a.num}>
                        Verset {a.num} : {a.ar.slice(0, 30)}...
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Format & Ratio Vidéo */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <Tv className="w-4 h-4" />
              2. Format &amp; Ratio de la Vidéo
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setAspectRatio('story')}
                disabled={isRecording}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-3 ${
                  aspectRatio === 'story'
                    ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-md font-bold'
                    : 'bg-neutral-800/80 hover:bg-neutral-800 border-white/10 text-neutral-200'
                }`}
              >
                <Smartphone className="w-5 h-5 shrink-0" />
                <div>
                  <div className="text-xs font-bold">Story / Reels (9:16)</div>
                  <div className="text-[10px] opacity-75">TikTok, Instagram, WhatsApp</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAspectRatio('landscape')}
                disabled={isRecording}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-3 ${
                  aspectRatio === 'landscape'
                    ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-md font-bold'
                    : 'bg-neutral-800/80 hover:bg-neutral-800 border-white/10 text-neutral-200'
                }`}
              >
                <Tv className="w-5 h-5 shrink-0" />
                <div>
                  <div className="text-xs font-bold">Cinéma / PC (16:9)</div>
                  <div className="text-[10px] opacity-75">YouTube, Téléviseur</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAspectRatio('square')}
                disabled={isRecording}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-3 ${
                  aspectRatio === 'square'
                    ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-md font-bold'
                    : 'bg-neutral-800/80 hover:bg-neutral-800 border-white/10 text-neutral-200'
                }`}
              >
                <Square className="w-5 h-5 shrink-0" />
                <div>
                  <div className="text-xs font-bold">Carré (1:1)</div>
                  <div className="text-[10px] opacity-75">Post Instagram, Facebook</div>
                </div>
              </button>
            </div>
          </div>

          {/* Section 3: Options Visuelles & Authentification */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              3. Thème de Fond &amp; Options d'Affichage
            </span>

            {/* Theme selector circles */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">
                Fond immersif : <span className="text-amber-300">{currentTheme.name}</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {Object.values(CINEMATIC_THEMES).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveThemeId(t.id)}
                    disabled={isRecording}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                      t.id === activeThemeId
                        ? 'bg-white/20 border-amber-400 text-white shadow-xs'
                        : 'bg-black/30 border-white/10 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/40"
                      style={{ backgroundColor: t.swatch }}
                    />
                    <span>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2.5 text-xs text-neutral-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTajweed}
                  disabled={isRecording}
                  onChange={(e) => setIncludeTajweed(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0 cursor-pointer w-4 h-4"
                />
                <span className="font-semibold">Coloriage Tajweed sur l'arabe (Madd, Ghunnah, etc.)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-neutral-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeWatermark}
                  disabled={isRecording}
                  onChange={(e) => setIncludeWatermark(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0 cursor-pointer w-4 h-4"
                />
                <span className="font-semibold text-amber-200">
                  Logo &amp; Filigrane Authentifié Le Sanctuaire
                </span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-neutral-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTranslation}
                  disabled={isRecording}
                  onChange={(e) => setIncludeTranslation(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0 cursor-pointer w-4 h-4"
                />
                <span>Afficher la Traduction française</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-neutral-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePhonetics}
                  disabled={isRecording}
                  onChange={(e) => setIncludePhonetics(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0 cursor-pointer w-4 h-4"
                />
                <span>Afficher la Phonétique</span>
              </label>
            </div>
          </div>

          {/* Progress state during recording */}
          {isRecording && (
            <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-3 animate-pulse">
              <div className="flex items-center justify-between text-xs font-bold text-amber-200">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  {recordingStatusText}
                </span>
                <span>{recordingProgress} %</span>
              </div>
              <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300 rounded-full"
                  style={{ width: `${recordingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Generated Video Player Preview */}
          {generatedVideoUrl && (
            <div className="p-5 rounded-2xl bg-black/60 border border-emerald-500/40 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Vidéo générée avec succès avec transition douce !
                </span>
                <span className="text-xs text-neutral-400">
                  {totalSelected} verset{totalSelected > 1 ? 's' : ''} • Format {aspectRatio}
                </span>
              </div>

              <div className="w-full max-w-md mx-auto aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
                <video
                  src={generatedVideoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleDownloadVideo}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-neutral-950 font-black text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Télécharger la Vidéo (.webm)
                </button>

                <button
                  onClick={handleDownloadSnapshot}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer border border-white/15"
                >
                  <Camera className="w-4 h-4 text-amber-300" />
                  Capture Image HD (.png)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden Canvas used for real-time rendering */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Modal Footer Controls */}
        <div className="px-5 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <button
            onClick={() => {
              cancelGeneration();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 text-xs font-bold transition cursor-pointer"
          >
            Fermer
          </button>

          <div className="flex items-center gap-3">
            {isRecording ? (
              <button
                onClick={cancelGeneration}
                className="px-4 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold transition cursor-pointer"
              >
                Annuler l'enregistrement
              </button>
            ) : (
              <button
                onClick={handleStartRecording}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-black text-xs flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
              >
                <Video className="w-4 h-4" />
                Lancer l'Enregistrement Vidéo ({totalSelected} verset{totalSelected > 1 ? 's' : ''})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
