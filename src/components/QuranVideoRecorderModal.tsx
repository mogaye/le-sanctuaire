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
import { parseTajweedTokens, cleanAyahArabic } from '../utils/tajweedColorizer';

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
  bgImageUrl?: string;
  onOpenVideoStudio?: () => void;
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
  bgImageUrl,
  onOpenVideoStudio,
}) => {
  // Free Mode: Maximum 5 consecutive verses allowed
  const [fromAyah, setFromAyah] = useState<number>(currentAyahNum);
  const [toAyah, setToAyah] = useState<number>(Math.min(totalAyahs, currentAyahNum + Math.min(2, Math.max(0, 5 - 1))));

  const handleFromAyahChange = (val: number) => {
    const from = Math.max(1, Math.min(val, totalAyahs));
    setFromAyah(from);
    if (toAyah < from) {
      setToAyah(from);
    } else if (toAyah - from + 1 > 5) {
      setToAyah(from + 4);
    }
  };

  const handleToAyahChange = (val: number) => {
    let to = Math.max(fromAyah, Math.min(val, totalAyahs));
    if (to - fromAyah + 1 > 5) {
      to = fromAyah + 4;
    }
    setToAyah(to);
  };

  // Format selection
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('story');

  // Background style: wallpaper (4K), oled (black), chroma (green #00FF00 for editing), gradient
  const [bgStyle, setBgStyle] = useState<'wallpaper' | 'oled' | 'chroma' | 'gradient'>('wallpaper');
  const [darkShieldOpacity, setDarkShieldOpacity] = useState<number>(0.75);

  // Visual options (Watermark always enabled on free mode)
  const [activeThemeId, setActiveThemeId] = useState<CinematicThemeId>(themeId);
  const [includeTranslation, setIncludeTranslation] = useState<boolean>(true);
  const [includePhonetics, setIncludePhonetics] = useState<boolean>(true);
  const [includeTajweed, setIncludeTajweed] = useState<boolean>(true);
  const includeWatermark = true; // Mandatory watermark for free reader recorder

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
  const bgImageObjRef = useRef<HTMLImageElement | null>(null);

  // Preload background image if provided
  useEffect(() => {
    if (bgImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = bgImageUrl;
      img.onload = () => {
        bgImageObjRef.current = img;
      };
    } else {
      bgImageObjRef.current = null;
    }
  }, [bgImageUrl]);

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
  // =========================================================================
  // 1. BASE SCENE (Background, ambient light, card frame, official watermark)
  // =========================================================================
  const drawBaseScene = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();

    // 1. CHROMA KEY GREEN (for CapCut / Premiere export)
    if (bgStyle === 'chroma') {
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      return;
    }

    // 2. NOIR ABSOLU OLED
    if (bgStyle === 'oled') {
      ctx.fillStyle = '#030504';
      ctx.fillRect(0, 0, width, height);
    } else if (bgStyle === 'wallpaper' && bgImageObjRef.current && bgImageObjRef.current.complete) {
      // 3. 4K WALLPAPER WITH ASPECT-COVER (NO STRETCHING)
      const img = bgImageObjRef.current;
      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;
      let drawW = width;
      let drawH = height;
      let drawX = 0;
      let drawY = 0;

      if (imgAspect > canvasAspect) {
        drawH = height;
        drawW = height * imgAspect;
        drawX = (width - drawW) / 2;
      } else {
        drawW = width;
        drawH = width / imgAspect;
        drawY = (height - drawH) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // Global soft ambient tint
      ctx.fillStyle = '#000000';
      ctx.globalAlpha = 0.42;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1.0;

      // Intelligent Central Radial Darkening Shield (eliminates bright lantern glare behind text)
      const isPortrait = aspectRatio === 'story';
      const shieldY = isPortrait ? height * 0.44 : height * 0.45;
      const shieldGrad = ctx.createRadialGradient(
        width / 2,
        shieldY,
        width * 0.1,
        width / 2,
        shieldY,
        width * 0.78
      );
      shieldGrad.addColorStop(0, `rgba(4, 8, 12, ${Math.min(0.96, darkShieldOpacity + 0.16)})`);
      shieldGrad.addColorStop(0.55, `rgba(4, 8, 12, ${darkShieldOpacity})`);
      shieldGrad.addColorStop(1, 'rgba(4, 8, 12, 0.40)');
      ctx.fillStyle = shieldGrad;
      ctx.fillRect(0, 0, width, height);
    } else {
      // 4. SPIRITUAL DEEP GRADIENT
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
    }

    // Ambient soft golden/emerald glow
    if (bgStyle !== 'oled') {
      const glowGrad = ctx.createRadialGradient(
        width / 2,
        height * 0.30,
        20,
        width / 2,
        height * 0.30,
        width * 0.50
      );
      glowGrad.addColorStop(0, currentTheme.glow1.replace(/[\d\.]+\)$/, '0.22)'));
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // Official Authentication Watermark Badge (Le Sanctuaire) - Placed safely outside TikTok top notch
    if (includeWatermark && bgStyle !== 'chroma') {
      const isPortrait = aspectRatio === 'story';
      const badgeW = isPortrait ? 300 : 360;
      const badgeH = 40;
      const badgeX = width - badgeW - 32;
      const badgeY = isPortrait ? 68 : 32;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
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
  // 2. AYAH ELEMENTS (Majestic Typography & Frosted Subtitle Capsule)
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
    const topZoneY = isPortrait ? height * 0.12 : height * 0.11;

    // Top Verse Pill: Sourate [Name] • Verset [X] / [Y]
    if (bgStyle !== 'chroma') {
      const pillY = topZoneY;
      const pillW = isPortrait ? 360 : 420;
      const pillH = 40;
      const pillX = (width - pillW) / 2;

      ctx.fillStyle = 'rgba(6, 12, 16, 0.65)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 20);
      ctx.fill();
      ctx.stroke();

      ctx.font = '600 15px "Plus Jakarta Sans", monospace, sans-serif';
      ctx.fillStyle = '#FCD34D';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `Sourate ${surahName}  •  Verset ${ayah.num} / ${totalAyahs}`,
        width / 2,
        pillY + pillH / 2
      );
    }

    // Majestic Large Arabic Verse Calligraphy
    const arabicMaxWidth = width * 0.88;
    const arabicFontSize = isPortrait
      ? ayah.ar.length < 45
        ? 82
        : ayah.ar.length < 90
          ? 68
          : ayah.ar.length < 160
            ? 56
            : 46
      : ayah.ar.length < 45
        ? 74
        : ayah.ar.length < 90
          ? 62
          : ayah.ar.length < 160
            ? 52
            : 44;

    ctx.font = `${arabicFontSize}px "Amiri", "Traditional Arabic", serif`;
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';

    const cleanAr = cleanAyahArabic(ayah.ar);
    const words = cleanAr.split(' ');
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

    // Calligraphy Drop Shadow for pristine contrast
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    lines.forEach((line, idx) => {
      const lineY = startArabicY + idx * lineHeight;

      if (bgStyle === 'chroma') {
        // Chroma Key Mode: Pure white text with thick black stroke for easy CapCut keying
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 6;
        ctx.strokeText(line, width / 2, lineY);
        ctx.fillText(line, width / 2, lineY);
        ctx.restore();
      } else if (!includeTajweed) {
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
          else if (token.type === 'silent') ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
          else ctx.fillStyle = '#FEF3C7';

          ctx.fillText(token.text, startX, lineY);
          startX -= ctx.measureText(token.text).width;
        });

        ctx.textAlign = 'center';
      }
    });

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Subtle horizontal divider line
    if (bgStyle !== 'chroma') {
      const divY = isPortrait ? height * 0.63 : height * 0.65;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width * 0.14, divY);
      ctx.lineTo(width * 0.86, divY);
      ctx.stroke();
    }

    // Subtitles (French Translation & Phonetics) in Frosted Glassmorphism Card
    ctx.direction = 'ltr';
    if ((includeTranslation && ayah.fr) || (includePhonetics && ayah.tr)) {
      const transFontSize = isPortrait ? 24 : 22;
      const phonFontSize = isPortrait ? 20 : 18;
      ctx.font = `500 ${transFontSize}px "Plus Jakarta Sans", sans-serif`;

      const tWords = (ayah.fr || '').split(' ');
      const tLines: string[] = [];
      let tLine = '';
      const textMaxW = width * 0.78;

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

      const tLineHeight = transFontSize * 1.5;
      const phonLineHeight = phonFontSize * 1.4;
      const totalTextH =
        (includePhonetics && ayah.tr ? phonLineHeight + 12 : 0) +
        (includeTranslation ? tLines.length * tLineHeight : 0);
      const cardPadX = 36;
      const cardPadY = 20;
      const cardW = Math.min(width * 0.88, textMaxW + cardPadX * 2);
      const cardH = totalTextH + cardPadY * 2;
      const cardX = (width - cardW) / 2;
      const cardY = isPortrait ? height * 0.66 : height * 0.68;

      if (bgStyle !== 'chroma') {
        // High-contrast frosted glass container
        ctx.fillStyle = 'rgba(6, 12, 16, 0.80)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 20);
        ctx.fill();
        ctx.stroke();
      }

      let textCursorY = cardY + cardPadY;

      // Phonetics Line
      if (includePhonetics && ayah.tr) {
        ctx.save();
        ctx.font = `italic ${phonFontSize}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = bgStyle === 'chroma' ? '#000000' : '#A7F3D0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        if (bgStyle === 'chroma') {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3;
          ctx.strokeText(`« ${ayah.tr} »`, width / 2, textCursorY);
        }
        ctx.fillText(`« ${ayah.tr} »`, width / 2, textCursorY);
        ctx.restore();
        textCursorY += phonLineHeight + 12;
      }

      // French Translation Lines
      if (includeTranslation && ayah.fr) {
        ctx.save();
        ctx.font = `500 ${transFontSize}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 8;

        tLines.forEach((tl) => {
          if (bgStyle === 'chroma') {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.strokeText(tl, width / 2, textCursorY);
          }
          ctx.fillText(tl, width / 2, textCursorY);
          textCursorY += tLineHeight;
        });
        ctx.restore();
      }
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
  // 5. MAIN RECORDING PIPELINE WITH PRELOADED AUDIO & DYNAMICS COMPRESSION
  // =========================================================================
  const handleStartRecording = async () => {
    if (isRecording) return;
    isCancelledRef.current = false;
    setIsRecording(true);
    setGeneratedVideoUrl(null);
    setGeneratedBlob(null);
    setRecordingProgress(0);
    setRecordingStatusText('Pré-chargement des pistes audio et initialisation...');

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
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      const audioDest = audioCtx.createMediaStreamDestination();

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      const freqData = new Uint8Array(analyser.frequencyBinCount);

      // Studio Quality Dynamics Processing (eliminates low-volume and clipping)
      const compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-18, audioCtx.currentTime);
      compressor.knee.setValueAtTime(10, audioCtx.currentTime);
      compressor.ratio.setValueAtTime(4, audioCtx.currentTime);
      compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
      compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

      const masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(1.18, audioCtx.currentTime);

      // Signal chain: source -> analyser -> compressor -> masterGain -> destination
      analyser.connect(compressor);
      compressor.connect(masterGain);
      masterGain.connect(audioDest);
      masterGain.connect(audioCtx.destination);

      // 2. CRITICAL FIX: Preload ALL selected verses' audio BEFORE recorder.start()!
      // This completely eliminates dead silence, freezing, and audio gaps during recording!
      setRecordingStatusText('Téléchargement des récitations haute fidélité...');
      const audioBuffers: (AudioBuffer | null)[] = await Promise.all(
        selectedAyahs.map(async (ayah, idx) => {
          try {
            const url = getAyahAudioUrl(surahNum, ayah.num, selectedReciter.id);
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const arrayBuf = await resp.arrayBuffer();
            return await audioCtx.decodeAudioData(arrayBuf);
          } catch (e) {
            console.warn(`Pré-chargement audio échoué verset ${ayah.num}`, e);
            return null;
          }
        })
      );

      if (isCancelledRef.current) {
        setIsRecording(false);
        return;
      }

      // 3. Setup Canvas stream at 30 fps
      const canvasStream = canvas.captureStream(30);

      // Combine video track + studio audio track
      const combinedTracks = [
        ...canvasStream.getVideoTracks(),
        ...audioDest.stream.getAudioTracks(),
      ];
      const combinedStream = new MediaStream(combinedTracks);

      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ];
      const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMime || undefined,
        videoBitsPerSecond: 4500000,
        audioBitsPerSecond: 192000,
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

      // 4. Start recording NOW (zero dead air!)
      recorder.start();

      const totalVerses = selectedAyahs.length;

      // Initial smooth 250ms fade-in
      await animateVerseFadeIn(ctx, width, height, selectedAyahs[0], 250);

      // 5. Loop through verses with preloaded audio
      for (let idx = 0; idx < totalVerses; idx++) {
        if (isCancelledRef.current) break;
        const currentAyah = selectedAyahs[idx];
        const audioBuffer = audioBuffers[idx];
        setCurrentRecordingAyah(currentAyah.num);
        setRecordingStatusText(
          `Récitation du verset ${currentAyah.num} sur ${toAyah} (${idx + 1} / ${totalVerses})...`
        );

        await new Promise<void>((resolve) => {
          let hasEnded = false;

          if (audioBuffer) {
            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(analyser);

            const startTime = audioCtx.currentTime;
            const duration = audioBuffer.duration;

            const renderLoop = () => {
              if (isCancelledRef.current || hasEnded) return;
              analyser.getByteFrequencyData(freqData);

              const elapsed = audioCtx.currentTime - startTime;
              const verseProgress = Math.min(1, elapsed / duration);
              const overallProgress = Math.round(
                ((idx + verseProgress) / totalVerses) * 100
              );
              setRecordingProgress(overallProgress);

              drawBaseScene(ctx, width, height);
              drawAyahElements(ctx, width, height, currentAyah, 1.0, 0);
              drawBottomBar(ctx, width, height, verseProgress, freqData);

              if (elapsed < duration) {
                animationFrameRef.current = requestAnimationFrame(renderLoop);
              } else {
                hasEnded = true;
                source.disconnect();
                resolve();
              }
            };

            source.start(0);
            renderLoop();
          } else {
            // Instant fallback if audio buffer was null
            let timer = 0;
            const fallbackDuration = 3.5;
            const startFallback = performance.now();
            const fallbackLoop = () => {
              if (isCancelledRef.current || hasEnded) return;
              const elapsed = (performance.now() - startFallback) / 1000;
              const verseProgress = Math.min(1, elapsed / fallbackDuration);
              setRecordingProgress(Math.round(((idx + verseProgress) / totalVerses) * 100));

              drawBaseScene(ctx, width, height);
              drawAyahElements(ctx, width, height, currentAyah, 1.0, 0);
              drawBottomBar(ctx, width, height, verseProgress, freqData);

              if (elapsed < fallbackDuration) {
                animationFrameRef.current = requestAnimationFrame(fallbackLoop);
              } else {
                hasEnded = true;
                resolve();
              }
            };
            fallbackLoop();
          }
        });

        if (isCancelledRef.current) break;

        // Natural breath pause between verses (300ms crossfade without extra waiting)
        if (idx < totalVerses - 1) {
          const nextAyah = selectedAyahs[idx + 1];
          await animateCrossfadeTransition(ctx, width, height, currentAyah, nextAyah, 320);
        } else {
          await new Promise((r) => setTimeout(r, 350));
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
          {/* Studio Pro Promo Banner */}
          {onOpenVideoStudio && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/15 to-amber-500/10 border border-amber-400/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="text-left">
                  <span className="text-xs font-black text-amber-300 block">
                    Envie de créer des vidéos TikTok / Reels jusqu'à 10 versets ?
                  </span>
                  <span className="text-[11px] text-neutral-300">
                    Mode sans fond (Fond Vert Chroma), formats 9:16 & 1:1, et 16 fonds 4K sur la page dédiée.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  cancelGeneration();
                  onClose();
                  onOpenVideoStudio();
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-black text-xs shrink-0 transition shadow-md cursor-pointer"
              >
                Ouvrir le Studio Vidéo Pro →
              </button>
            </div>
          )}

          {/* Section 1: Selection de la plage de versets (Max 5 versets) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                1. Sélection des Versets (Gratuit : Max 5 versets)
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold font-mono">
                {totalSelected} verset{totalSelected > 1 ? 's' : ''} (max 5)
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
                  onChange={(e) => handleFromAyahChange(Number(e.target.value))}
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
                  Au verset (Fin, max {fromAyah + 4}) :
                </label>
                <select
                  value={toAyah}
                  disabled={isRecording}
                  onChange={(e) => handleToAyahChange(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-white/15 text-white font-bold text-sm focus:outline-hidden focus:border-amber-400"
                >
                  {ayahs
                    .filter((a) => a.num >= fromAyah && a.num <= fromAyah + 4)
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

          {/* Section 3: Options Visuelles & Fond */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              3. Style d'Arrière-Plan &amp; Lisibilité
            </span>

            {/* Background Style Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => setBgStyle('wallpaper')}
                disabled={isRecording}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                  bgStyle === 'wallpaper'
                    ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-md font-bold'
                    : 'bg-neutral-800/80 hover:bg-neutral-800 border-white/10 text-neutral-200'
                }`}
              >
                <span className="text-xs font-black">🖼️ Fond 4K Masqué</span>
                <span className="text-[10px] opacity-75">Architecture &amp; Voile</span>
              </button>

              <button
                type="button"
                onClick={() => setBgStyle('oled')}
                disabled={isRecording}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                  bgStyle === 'oled'
                    ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-md font-bold'
                    : 'bg-neutral-800/80 hover:bg-neutral-800 border-white/10 text-neutral-200'
                }`}
              >
                <span className="text-xs font-black">🌑 Noir Absolu OLED</span>
                <span className="text-[10px] opacity-75">Viral TikTok / Épuré</span>
              </button>

              <button
                type="button"
                onClick={() => setBgStyle('chroma')}
                disabled={isRecording}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                  bgStyle === 'chroma'
                    ? 'bg-emerald-400 text-neutral-950 border-emerald-300 shadow-md font-bold'
                    : 'bg-neutral-800/80 hover:bg-neutral-800 border-white/10 text-neutral-200'
                }`}
              >
                <span className="text-xs font-black">🟩 Fond Vert Chroma</span>
                <span className="text-[10px] opacity-75">Pour CapCut / Montage</span>
              </button>

              <button
                type="button"
                onClick={() => setBgStyle('gradient')}
                disabled={isRecording}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                  bgStyle === 'gradient'
                    ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-md font-bold'
                    : 'bg-neutral-800/80 hover:bg-neutral-800 border-white/10 text-neutral-200'
                }`}
              >
                <span className="text-xs font-black">✨ Dégradé Nuit</span>
                <span className="text-[10px] opacity-75">Ambiance spirituelle</span>
              </button>
            </div>

            {/* Voile d'ombrage slider when wallpaper is active */}
            {bgStyle === 'wallpaper' && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-300 font-medium">
                    Masque d'ombrage central anti-reflet :
                  </span>
                  <span className="text-amber-400 font-bold font-mono">
                    {Math.round(darkShieldOpacity * 100)} %
                  </span>
                </div>
                <input
                  type="range"
                  min="0.30"
                  max="0.95"
                  step="0.05"
                  value={darkShieldOpacity}
                  disabled={isRecording}
                  onChange={(e) => setDarkShieldOpacity(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <p className="text-[10px] text-neutral-400">
                  Assombrit doucement le centre pour masquer les lanternes trop lumineuses derrière la calligraphie.
                </p>
              </div>
            )}

            {/* Theme selector circles when not in chroma */}
            {bgStyle !== 'chroma' && bgStyle !== 'oled' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  Ambiance lumineuse : <span className="text-amber-300">{currentTheme.name}</span>
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
            )}

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

              <div className="flex items-center justify-between text-xs text-neutral-200 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    readOnly
                    className="rounded text-amber-500 focus:ring-0 w-4 h-4 cursor-not-allowed opacity-80"
                  />
                  <span className="font-semibold text-amber-200">
                    Logo &amp; Filigrane Authentifié Le Sanctuaire
                  </span>
                </div>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Obligatoire (Mode Gratuit)
                </span>
              </div>

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
