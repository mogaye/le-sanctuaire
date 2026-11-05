import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Video,
  Play,
  Pause,
  Download,
  Share2,
  Sparkles,
  Smartphone,
  Tv,
  Square,
  Check,
  Crown,
  Layers,
  Palette,
  Volume2,
  VolumeX,
  Type,
  Music,
  ShieldCheck,
  MessageCircle,
  CreditCard,
  Sliders,
  ExternalLink,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { ALL_114_SURAHS, CompleteSurahItem } from '../data/quranSurahs';
import { RECITERS } from '../data/islamicData';
import { Reciter } from '../types';
import { CINEMATIC_BACKGROUNDS, CinematicBackground } from './QuranCinematicReader';
import { parseTajweedTokens, cleanAyahArabic } from '../utils/tajweedColorizer';
import { getAyahAudioUrl } from '../utils/quranAudioUtils';

interface AyahData {
  num: number;
  ar: string;
  tr: string;
  fr: string;
}

interface QuranVideoStudioPageProps {
  onBack: () => void;
  initialSurahNum?: number;
  selectedReciter: Reciter;
  onSelectReciter: (r: Reciter) => void;
}

export type VideoFormat = '9:16' | '1:1' | '16:9' | '4:5';
export type BgStyleType = 'chroma' | 'oled' | 'cinematic' | 'gradient';

export const QuranVideoStudioPage: React.FC<QuranVideoStudioPageProps> = ({
  onBack,
  initialSurahNum = 1,
  selectedReciter,
  onSelectReciter,
}) => {
  // Surah & Verse Range State
  const [selectedSurahNum, setSelectedSurahNum] = useState<number>(initialSurahNum);
  const currentSurahMeta: CompleteSurahItem = useMemo(() => {
    return ALL_114_SURAHS.find((s) => s.number === selectedSurahNum) || ALL_114_SURAHS[0];
  }, [selectedSurahNum]);

  const [fromAyah, setFromAyah] = useState<number>(1);
  const [toAyah, setToAyah] = useState<number>(Math.min(currentSurahMeta.numberOfAyahs, 3));
  const [ayahsList, setAyahsList] = useState<AyahData[]>([]);
  const [isLoadingAyahs, setIsLoadingAyahs] = useState<boolean>(false);

  // Video Settings
  const [format, setFormat] = useState<VideoFormat>('9:16');
  const [bgStyle, setBgStyle] = useState<BgStyleType>('cinematic');
  const [selectedBgId, setSelectedBgId] = useState<string>(CINEMATIC_BACKGROUNDS[0]?.id || 'emerald_fanous_archway');
  const [includeTajweed, setIncludeTajweed] = useState<boolean>(true);
  const [includeTranslation, setIncludeTranslation] = useState<boolean>(true);
  const [includePhonetics, setIncludePhonetics] = useState<boolean>(false);
  const [includeWaveform, setIncludeWaveform] = useState<boolean>(true);
  const [includeWatermark, setIncludeWatermark] = useState<boolean>(false); // Pro toggle
  const [arabicFontSize, setArabicFontSize] = useState<number>(42);
  const [textDarkVeil, setTextDarkVeil] = useState<number>(0.55);

  // Pro Subscription / Pricing Modal
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
  const [isProUser, setIsProUser] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sanctuaire_studio_pro') === 'true';
    } catch {
      return false;
    }
  });

  // Preview & Recording State
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);
  const [previewAyahIdx, setPreviewAyahIdx] = useState<number>(0);
  const [previewProgress, setPreviewProgress] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);
  const [recordingStatusText, setRecordingStatusText] = useState<string>('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);

  // Canvas & Audio Refs
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImageCache = useRef<Record<string, HTMLImageElement>>({});
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const animFrameRef = useRef<number | null>(null);

  // WhatsApp Support Link (without exposing raw phone number in UI copy)
  const whatsappUrl = `https://wa.me/221705908725?text=${encodeURIComponent(
    "Salam alaykoum ! Je souhaite souscrire à l'offre Studio Créateur Vidéo Coran Le Sanctuaire (Pass 1 000 FCFA/semaine ou 3 000 FCFA/mois) via Wave ou Orange Money."
  )}`;

  // Max 10 consecutive verses rule for Studio Pro
  const handleFromAyahChange = (val: number) => {
    const from = Math.max(1, Math.min(val, currentSurahMeta.numberOfAyahs));
    setFromAyah(from);
    if (toAyah < from) {
      setToAyah(from);
    } else if (toAyah - from + 1 > 10) {
      setToAyah(from + 9);
    }
  };

  const handleToAyahChange = (val: number) => {
    let to = Math.max(fromAyah, Math.min(val, currentSurahMeta.numberOfAyahs));
    if (to - fromAyah + 1 > 10) {
      to = fromAyah + 9;
    }
    setToAyah(to);
  };

  // Fetch Surah Ayahs (Arabic text, French translation, phonetics)
  useEffect(() => {
    let isMounted = true;
    setIsLoadingAyahs(true);

    const fetchSurah = async () => {
      try {
        // Fetch Arabic text with Tajweed/Uthmani from AlQuran Cloud
        const resAr = await fetch(`https://api.alquran.cloud/v1/surah/${selectedSurahNum}`);
        const dataAr = await resAr.json();

        // Fetch French translation (Muhammad Hamidullah)
        const resFr = await fetch(`https://api.alquran.cloud/v1/surah/${selectedSurahNum}/fr.hamidullah`);
        const dataFr = await resFr.json();

        // Fetch Phonetics / Transliteration
        const resTr = await fetch(`https://api.alquran.cloud/v1/surah/${selectedSurahNum}/en.transliteration`);
        const dataTr = await resTr.json();

        if (isMounted && dataAr?.data?.ayahs) {
          const list: AyahData[] = dataAr.data.ayahs.map((a: any, i: number) => ({
            num: a.numberInSurah,
            ar: a.text,
            tr: dataTr?.data?.ayahs?.[i]?.text || '',
            fr: dataFr?.data?.ayahs?.[i]?.text || '',
          }));
          setAyahsList(list);
          setFromAyah(1);
          setToAyah(Math.min(list.length, 3));
        }
      } catch (e) {
        console.error('Error fetching surah data for studio:', e);
      } finally {
        if (isMounted) setIsLoadingAyahs(false);
      }
    };

    fetchSurah();

    return () => {
      isMounted = false;
    };
  }, [selectedSurahNum]);

  // Preload selected 4K background image
  const activeBackground = useMemo(() => {
    return CINEMATIC_BACKGROUNDS.find((b) => b.id === selectedBgId) || CINEMATIC_BACKGROUNDS[0];
  }, [selectedBgId]);

  useEffect(() => {
    if (bgStyle === 'cinematic' && activeBackground) {
      if (!bgImageCache.current[activeBackground.url]) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = activeBackground.url;
        img.onload = () => {
          bgImageCache.current[activeBackground.url] = img;
          drawPreviewFrame();
        };
      }
    }
  }, [bgStyle, activeBackground]);

  // Selected ayahs slice
  const selectedAyahs = useMemo(() => {
    return ayahsList.filter((a) => a.num >= fromAyah && a.num <= toAyah);
  }, [ayahsList, fromAyah, toAyah]);

  // Resolution calculation based on format
  const getDimensions = (fmt: VideoFormat) => {
    switch (fmt) {
      case '9:16':
        return { width: 1080, height: 1920 }; // TikTok / Reels / Shorts
      case '1:1':
        return { width: 1080, height: 1080 }; // Instagram Feed
      case '4:5':
        return { width: 1080, height: 1350 }; // Instagram Portrait
      case '16:9':
      default:
        return { width: 1920, height: 1080 }; // YouTube Landscape
    }
  };

  // =========================================================================
  // CANVAS DRAWING ENGINE (Universal, Razor-sharp, Professional)
  // =========================================================================
  const drawScene = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    currentAyah: AyahData | null,
    ayahProgress: number,
    analyserData?: Uint8Array
  ) => {
    ctx.clearRect(0, 0, width, height);

    // 1. Background Layer
    if (bgStyle === 'chroma') {
      // Chroma Key Green #00FF00 for easy video replacement in CapCut / Premiere
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(0, 0, width, height);
    } else if (bgStyle === 'oled') {
      // Pure Pitch Black OLED #000000
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
    } else if (bgStyle === 'cinematic' && activeBackground && bgImageCache.current[activeBackground.url]) {
      // 4K Wallpaper Image
      const img = bgImageCache.current[activeBackground.url];
      ctx.drawImage(img, 0, 0, width, height);

      // Darkening veil for readability
      ctx.fillStyle = `rgba(0, 0, 0, ${textDarkVeil})`;
      ctx.fillRect(0, 0, width, height);

      // Subtle cinematic vignette
      const radGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        width * 0.2,
        width / 2,
        height / 2,
        width * 0.8
      );
      radGrad.addColorStop(0, 'rgba(0,0,0,0)');
      radGrad.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Spiritual Deep Emerald / Midnight Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#06281B');
      grad.addColorStop(0.5, '#03160E');
      grad.addColorStop(1, '#010805');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    if (!currentAyah) return;

    // 2. Watermark (if enabled or if not pro user)
    const showWatermark = includeWatermark || !isProUser;
    if (showWatermark && bgStyle !== 'chroma') {
      ctx.save();
      const badgeW = format === '9:16' ? 320 : 360;
      const badgeH = 40;
      const badgeX = width - badgeW - 32;
      const badgeY = 32;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 20);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#FCD34D';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('☪ Le Sanctuaire', badgeX + 16, badgeY + badgeH / 2);

      ctx.font = 'normal 12px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#A7F3D0';
      ctx.fillText('• le-sanctuaire.pro', badgeX + 152, badgeY + badgeH / 2);
      ctx.restore();
    }

    // 3. Top Surah & Verse Header Pill
    ctx.save();
    const isVertical = format === '9:16' || format === '4:5';
    const topPillY = isVertical ? height * 0.12 : height * 0.10;
    const pillW = isVertical ? 380 : 440;
    const pillH = 42;
    const pillX = (width - pillW) / 2;

    if (bgStyle !== 'chroma') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(pillX, topPillY, pillW, pillH, 21);
      ctx.fill();
      ctx.stroke();
    }

    ctx.font = '600 16px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillStyle = bgStyle === 'chroma' ? '#000000' : '#FCD34D';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `Sourate ${currentSurahMeta.name} (${currentSurahMeta.arabicName}) • Verset ${currentAyah.num}`,
      width / 2,
      topPillY + pillH / 2
    );
    ctx.restore();

    // 4. Large Arabic Verse Calligraphy
    ctx.save();
    const cleanAr = cleanAyahArabic(currentAyah.ar);
    const words = cleanAr.split(' ');
    const maxArWidth = width * 0.88;
    const fSize = isVertical ? arabicFontSize : arabicFontSize * 1.15;

    ctx.font = `${fSize}px "Amiri", "Traditional Arabic", serif`;
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';

    const lines: string[] = [];
    let currentLine = '';

    for (const w of words) {
      const test = currentLine ? `${currentLine} ${w}` : w;
      if (ctx.measureText(test).width > maxArWidth && currentLine) {
        lines.push(currentLine);
        currentLine = w;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineGap = fSize * 1.95;
    const totalArH = lines.length * lineGap;
    const centerArY = isVertical ? height * 0.42 : height * 0.44;
    const startArY = centerArY - totalArH / 2;

    lines.forEach((l, idx) => {
      const ly = startArY + idx * lineGap;

      if (!includeTajweed || bgStyle === 'chroma') {
        ctx.fillStyle = bgStyle === 'chroma' ? '#000000' : '#FEF3C7';
        ctx.fillText(l, width / 2, ly);
      } else {
        const tokens = parseTajweedTokens(l);
        let totalLineWidth = 0;
        tokens.forEach((t) => {
          totalLineWidth += ctx.measureText(t.text).width;
        });

        let startX = width / 2 + totalLineWidth / 2;
        ctx.textAlign = 'right';

        tokens.forEach((token) => {
          if (token.type === 'madd') ctx.fillStyle = '#F87171'; // Red
          else if (token.type === 'ghunnah') ctx.fillStyle = '#34D399'; // Green
          else if (token.type === 'qalqalah') ctx.fillStyle = '#38BDF8'; // Blue
          else if (token.type === 'tafkhim') ctx.fillStyle = '#FBBF24'; // Gold
          else if (token.type === 'silent') ctx.fillStyle = 'rgba(156, 163, 175, 0.7)';
          else ctx.fillStyle = '#FEF3C7';

          ctx.fillText(token.text, startX, ly);
          startX -= ctx.measureText(token.text).width;
        });

        ctx.textAlign = 'center';
      }
    });
    ctx.restore();

    // 5. Divider Line
    const dividerY = isVertical ? height * 0.65 : height * 0.67;
    ctx.save();
    ctx.strokeStyle = bgStyle === 'chroma' ? '#000000' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(width * 0.15, dividerY);
    ctx.lineTo(width * 0.85, dividerY);
    ctx.stroke();
    ctx.restore();

    // 6. Subtitles: French Translation & Phonetics
    ctx.save();
    ctx.direction = 'ltr';
    ctx.textAlign = 'center';
    let subY = dividerY + 30;

    if (includePhonetics && currentAyah.tr) {
      const phonSize = isVertical ? 20 : 22;
      ctx.font = `italic ${phonSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillStyle = bgStyle === 'chroma' ? '#064E3B' : '#A7F3D0';

      const pWords = currentAyah.tr.split(' ');
      let pLine = '';
      for (const pw of pWords) {
        const testP = pLine ? `${pLine} ${pw}` : pw;
        if (ctx.measureText(testP).width > width * 0.82 && pLine) {
          ctx.fillText(pLine, width / 2, subY);
          subY += phonSize * 1.5;
          pLine = pw;
        } else {
          pLine = testP;
        }
      }
      if (pLine) {
        ctx.fillText(pLine, width / 2, subY);
        subY += phonSize * 1.6;
      }
    }

    if (includeTranslation && currentAyah.fr) {
      const transSize = isVertical ? 23 : 25;
      ctx.font = `500 ${transSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillStyle = bgStyle === 'chroma' ? '#000000' : '#FFFFFF';

      const tWords = currentAyah.fr.split(' ');
      let tLine = '';
      for (const tw of tWords) {
        const testT = tLine ? `${tLine} ${tw}` : tw;
        if (ctx.measureText(testT).width > width * 0.84 && tLine) {
          ctx.fillText(tLine, width / 2, subY);
          subY += transSize * 1.55;
          tLine = tw;
        } else {
          tLine = testT;
        }
      }
      if (tLine) {
        ctx.fillText(tLine, width / 2, subY);
      }
    }
    ctx.restore();

    // 7. Audio Waveform & Progress Bar
    ctx.save();
    const bottomBarY = height - 90;

    if (includeWaveform && analyserData && analyserData.length > 0) {
      const barsCount = 38;
      const barW = 6;
      const gap = 8;
      const waveTotalW = barsCount * (barW + gap);
      const waveStartX = (width - waveTotalW) / 2;

      ctx.fillStyle = bgStyle === 'chroma' ? '#047857' : '#FBBF24';
      for (let b = 0; b < barsCount; b++) {
        const val = analyserData[b * 2] || 0;
        const bh = Math.max(6, (val / 255) * 48);
        ctx.fillRect(waveStartX + b * (barW + gap), bottomBarY - bh / 2, barW, bh);
      }
    }

    // Smooth Progress Line
    const progW = width * 0.72;
    const progX = (width - progW) / 2;
    const progY = height - 42;

    ctx.fillStyle = bgStyle === 'chroma' ? 'rgba(0,0,0,0.2)' : 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.roundRect(progX, progY, progW, 6, 3);
    ctx.fill();

    ctx.fillStyle = bgStyle === 'chroma' ? '#047857' : '#F59E0B';
    ctx.beginPath();
    ctx.roundRect(progX, progY, progW * Math.max(0, Math.min(1, ayahProgress)), 6, 3);
    ctx.fill();

    ctx.restore();
  };

  // Redraw preview frame
  const drawPreviewFrame = (analyserData?: Uint8Array) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const { width, height } = getDimensions(format);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ayahToDraw = selectedAyahs[previewAyahIdx] || selectedAyahs[0] || null;
    drawScene(ctx, width, height, ayahToDraw, previewProgress, analyserData);
  };

  useEffect(() => {
    drawPreviewFrame();
  }, [
    format,
    bgStyle,
    selectedBgId,
    includeTajweed,
    includeTranslation,
    includePhonetics,
    includeWaveform,
    includeWatermark,
    isProUser,
    arabicFontSize,
    textDarkVeil,
    selectedAyahs,
    previewAyahIdx,
    previewProgress,
  ]);

  // Audio preview playback
  const togglePreviewAudio = () => {
    if (isPreviewPlaying) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setIsPreviewPlaying(false);
      return;
    }

    const currentAyah = selectedAyahs[previewAyahIdx] || selectedAyahs[0];
    if (!currentAyah) return;

    const url = getAyahAudioUrl(selectedSurahNum, currentAyah.num, selectedReciter.id);
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.src = url;
    previewAudioRef.current = audio;

    audio.onplay = () => setIsPreviewPlaying(true);
    audio.onended = () => {
      setIsPreviewPlaying(false);
      setPreviewProgress(0);
      if (previewAyahIdx < selectedAyahs.length - 1) {
        setPreviewAyahIdx((prev) => prev + 1);
      } else {
        setPreviewAyahIdx(0);
      }
    };
    audio.ontimeupdate = () => {
      if (audio.duration) {
        setPreviewProgress(audio.currentTime / audio.duration);
      }
    };
    audio.onerror = () => setIsPreviewPlaying(false);

    audio.play().catch(() => setIsPreviewPlaying(false));
  };

  // Stop audio on unmount or when changing surah
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [selectedSurahNum]);

  // =========================================================================
  // HIGH-QUALITY FULL RECORDING PIPELINE WITH CRYSTAL CLEAR AUDIO
  // =========================================================================
  const handleStartFullRecording = async () => {
    if (isRecording) return;
    isCancelledRef.current = false;
    setIsRecording(true);
    setGeneratedVideoUrl(null);
    setGeneratedBlob(null);
    setRecordingProgress(0);
    setRecordingStatusText('Initialisation du moteur de rendu vidéo...');

    // Stop any preview audio
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    }

    const canvas = recordingCanvasRef.current || previewCanvasRef.current;
    if (!canvas) {
      setIsRecording(false);
      return;
    }

    const { width, height } = getDimensions(format);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsRecording(false);
      return;
    }

    try {
      // 1. Setup AudioContext with guaranteed resume
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

      // 2. Setup Canvas stream (30 fps)
      const canvasStream = canvas.captureStream(30);

      // 3. Combine Video track + Audio track
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
        audioBitsPerSecond: 192000, // Studio quality 192kbps Opus/AAC audio!
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
          setRecordingStatusText('Vidéo exportée avec succès en qualité studio !');
        }
        setIsRecording(false);
      };

      recorder.start();

      const totalVerses = selectedAyahs.length;

      // Loop through all selected verses
      for (let idx = 0; idx < totalVerses; idx++) {
        if (isCancelledRef.current) break;
        const currentAyah = selectedAyahs[idx];
        setRecordingStatusText(
          `Rendu du verset ${currentAyah.num} sur ${toAyah} (${idx + 1} / ${totalVerses})...`
        );

        // Fetch audio buffer directly for pristine uncompressed studio sound
        const audioUrl = getAyahAudioUrl(selectedSurahNum, currentAyah.num, selectedReciter.id);

        let audioBuffer: AudioBuffer | null = null;
        try {
          const resp = await fetch(audioUrl);
          const arrayBuf = await resp.arrayBuffer();
          audioBuffer = await audioCtx.decodeAudioData(arrayBuf);
        } catch (e) {
          console.warn('Fallback to HTMLAudioElement for ayah', currentAyah.num, e);
        }

        await new Promise<void>((resolve) => {
          let hasEnded = false;

          if (audioBuffer) {
            // Pristine AudioBufferSourceNode
            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(analyser);
            analyser.connect(audioDest);
            source.connect(audioCtx.destination);

            const startTime = audioCtx.currentTime;
            const duration = audioBuffer.duration;

            const renderLoop = () => {
              if (isCancelledRef.current || hasEnded) return;
              analyser.getByteFrequencyData(freqData);

              const elapsed = audioCtx.currentTime - startTime;
              const ayahProg = Math.min(1, elapsed / duration);
              const overallProg = Math.round(((idx + ayahProg) / totalVerses) * 100);
              setRecordingProgress(overallProg);

              drawScene(ctx, width, height, currentAyah, ayahProg, freqData);

              if (elapsed < duration) {
                animFrameRef.current = requestAnimationFrame(renderLoop);
              } else {
                hasEnded = true;
                source.disconnect();
                resolve();
              }
            };

            source.start(0);
            renderLoop();
          } else {
            // HTMLAudioElement Fallback
            const audio = new Audio();
            audio.crossOrigin = 'anonymous';
            audio.src = audioUrl;

            const mediaSource = audioCtx.createMediaElementSource(audio);
            mediaSource.connect(analyser);
            analyser.connect(audioDest);
            mediaSource.connect(audioCtx.destination);

            const renderLoop = () => {
              if (isCancelledRef.current || hasEnded) return;
              analyser.getByteFrequencyData(freqData);

              const cur = audio.currentTime || 0;
              const dur = audio.duration || 1;
              const ayahProg = Math.min(1, cur / dur);
              const overallProg = Math.round(((idx + ayahProg) / totalVerses) * 100);
              setRecordingProgress(overallProg);

              drawScene(ctx, width, height, currentAyah, ayahProg, freqData);
              animFrameRef.current = requestAnimationFrame(renderLoop);
            };

            audio.onplay = () => renderLoop();
            audio.onended = () => {
              hasEnded = true;
              mediaSource.disconnect();
              resolve();
            };
            audio.onerror = () => {
              hasEnded = true;
              mediaSource.disconnect();
              resolve();
            };
            audio.play().catch(() => {
              hasEnded = true;
              mediaSource.disconnect();
              resolve();
            });
          }
        });

        if (isCancelledRef.current) break;

        // Subtle pause between verses
        await new Promise((r) => setTimeout(r, 350));
      }

      if (!isCancelledRef.current && recorder.state !== 'inactive') {
        recorder.stop();
      }
    } catch (err: any) {
      console.error('Studio video recording error:', err);
      setRecordingStatusText(`Erreur : ${err?.message || 'Échec de la génération'}`);
      setIsRecording(false);
    }
  };

  const handleDownload = () => {
    if (!generatedVideoUrl) return;
    const a = document.createElement('a');
    a.href = generatedVideoUrl;
    a.download = `Le_Sanctuaire_Sourate_${selectedSurahNum}_Versets_${fromAyah}_a_${toAyah}_${format.replace(':', 'x')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-[#030B07] text-white flex flex-col">
      {/* Hidden offscreen canvas for final high-res recording */}
      <canvas ref={recordingCanvasRef} className="hidden" />

      {/* Top Studio Header */}
      <header className="sticky top-0 z-40 bg-[#061D12]/95 backdrop-blur-md border-b border-emerald-500/20 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition cursor-pointer border border-white/10"
            title="Retour à la lecture du Coran"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg text-white tracking-tight flex items-center gap-2">
                <Video className="w-5 h-5 text-amber-400" />
                Studio Vidéo Coran
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950">
                PRO
              </span>
            </div>
            <p className="text-xs text-neutral-400 hidden sm:block">
              Créez des vidéos spirituelles haute définition adaptées à TikTok, Reels, Shorts et WhatsApp
            </p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3">
          {!isProUser ? (
            <button
              onClick={() => setIsPricingModalOpen(true)}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
            >
              <Crown className="w-4 h-4 fill-current" />
              <span>Pass Studio (1 000 F / 3 000 F)</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Membre Studio Pro Actif
            </span>
          )}
        </div>
      </header>

      {/* Main Studio Work Area: Split Left Controls / Right Mobile Live Mockup */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* =========================================================================
            LEFT COLUMN: CONTROLS & CUSTOMIZATION (7 COLS)
           ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Surah & Verses Selection (Max 10 verses rule) */}
          <div className="bg-[#06180E]/90 border border-emerald-500/25 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">1. Sélection de la Sourate & des Versets</h3>
              </div>
              <span className="text-xs font-semibold text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                Max 10 versets consécutifs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Surah Dropdown */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">Sourate</label>
                <select
                  value={selectedSurahNum}
                  onChange={(e) => setSelectedSurahNum(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/15 text-white text-sm font-semibold focus:outline-none focus:border-amber-400 transition"
                >
                  {ALL_114_SURAHS.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number}. {s.name} ({s.arabicName}) - {s.numberOfAyahs} versets
                    </option>
                  ))}
                </select>
              </div>

              {/* From Ayah */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">Du Verset</label>
                <input
                  type="number"
                  min={1}
                  max={currentSurahMeta.numberOfAyahs}
                  value={fromAyah}
                  onChange={(e) => handleFromAyahChange(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-sm font-bold text-center focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* To Ayah */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">Au Verset (Max +10)</label>
                <input
                  type="number"
                  min={fromAyah}
                  max={Math.min(currentSurahMeta.numberOfAyahs, fromAyah + 9)}
                  value={toAyah}
                  onChange={(e) => handleToAyahChange(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-white/15 text-white text-sm font-bold text-center focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Verses Count Indicator */}
              <div className="flex flex-col justify-end">
                <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                  <span className="text-xs text-neutral-400 block">Total Versets</span>
                  <span className="text-sm font-black text-amber-400 font-mono">
                    {toAyah - fromAyah + 1} / 10 max
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Format & Aspect Ratio (TikTok 9:16, Instagram 1:1, YouTube 16:9) */}
          <div className="bg-[#06180E]/90 border border-emerald-500/25 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm sm:text-base text-white">2. Format Vidéo Réseaux Sociaux</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: '9:16', name: 'TikTok / Reels / Shorts', sub: '9:16 Vertical', icon: Smartphone },
                { id: '1:1', name: 'Instagram Carré', sub: '1:1 Post', icon: Square },
                { id: '4:5', name: 'Instagram Portrait', sub: '4:5 Feed', icon: Smartphone },
                { id: '16:9', name: 'YouTube / TV', sub: '16:9 Paysage', icon: Tv },
              ].map((item) => {
                const isSel = format === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setFormat(item.id as VideoFormat)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSel
                        ? 'bg-amber-400 text-neutral-950 border-amber-300 font-bold shadow-md'
                        : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-2" />
                    <div>
                      <span className="text-xs font-bold block">{item.name}</span>
                      <span className={`text-[10px] ${isSel ? 'text-neutral-800' : 'text-neutral-400'}`}>
                        {item.sub}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 3: Background & Chroma Key (Sans Fond / Fond Vert / 4K) */}
          <div className="bg-[#06180E]/90 border border-emerald-500/25 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">3. Fond & Incrustation (Sans Fond)</h3>
              </div>
              <span className="text-xs text-amber-300 font-medium">Idéal pour montage CapCut & Premiere</span>
            </div>

            {/* Background Style Switcher */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setBgStyle('chroma')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                  bgStyle === 'chroma'
                    ? 'bg-[#00FF00] text-neutral-950 border-[#00FF00] shadow-sm'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-white/10'
                }`}
              >
                🟩 Fond Vert Chroma
              </button>

              <button
                onClick={() => setBgStyle('oled')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                  bgStyle === 'oled'
                    ? 'bg-white text-neutral-950 border-white shadow-sm'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-white/10'
                }`}
              >
                ⬛ Fond Noir OLED
              </button>

              <button
                onClick={() => setBgStyle('cinematic')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                  bgStyle === 'cinematic'
                    ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-white/10'
                }`}
              >
                🕌 Fonds 4K Ultra-HD
              </button>

              <button
                onClick={() => setBgStyle('gradient')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                  bgStyle === 'gradient'
                    ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-sm'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-white/10'
                }`}
              >
                ✨ Dégradé Spirituel
              </button>
            </div>

            {/* 4K Wallpapers Thumbnails (if cinematic is selected) */}
            {bgStyle === 'cinematic' && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-1 no-scrollbar">
                  {CINEMATIC_BACKGROUNDS.map((bg) => {
                    const isSelected = selectedBgId === bg.id;
                    return (
                      <button
                        key={bg.id}
                        onClick={() => setSelectedBgId(bg.id)}
                        className={`group relative aspect-video rounded-xl overflow-hidden border text-left transition cursor-pointer p-1 flex flex-col justify-end ${
                          isSelected
                            ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-md'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <img
                          src={bg.url}
                          alt={bg.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                        <span className="relative z-10 text-[9px] font-bold text-white line-clamp-1">
                          {bg.name.replace(' (4K)', '')}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Darkening Veil Slider */}
                <div className="flex items-center justify-between text-xs text-neutral-300 pt-1">
                  <span>Voile d'ombrage pour le texte : {Math.round(textDarkVeil * 100)}%</span>
                  <input
                    type="range"
                    min="0.2"
                    max="0.85"
                    step="0.05"
                    value={textDarkVeil}
                    onChange={(e) => setTextDarkVeil(Number(e.target.value))}
                    className="w-36 accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card 4: Reciter Selection (All 25 Reciters + French Recitation) */}
          <div className="bg-[#06180E]/90 border border-emerald-500/25 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">4. Récitateur & Audio Authentifié</h3>
              </div>
              <span className="text-xs text-emerald-300 font-bold">25 Récitateurs Gratuits</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
              {RECITERS.map((r) => {
                const isSel = selectedReciter.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => onSelectReciter(r)}
                    className={`px-3 py-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                      isSel
                        ? 'bg-amber-400 text-neutral-950 border-amber-300 font-bold shadow-sm'
                        : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-white/10'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">{r.name}</span>
                      <span className={`text-[10px] ${isSel ? 'text-neutral-800' : 'text-neutral-400'}`}>
                        {r.style}
                      </span>
                    </div>
                    {isSel && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 5: Typography, Subtitles & Watermark Options */}
          <div className="bg-[#06180E]/90 border border-emerald-500/25 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm sm:text-base text-white">5. Typographie & Sous-titres</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setIncludeTajweed((v) => !v)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                  includeTajweed
                    ? 'bg-amber-400 text-neutral-950 border-amber-300'
                    : 'bg-neutral-900 text-neutral-400 border-white/10'
                }`}
              >
                Couleurs Tajweed
              </button>

              <button
                onClick={() => setIncludeTranslation((v) => !v)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                  includeTranslation
                    ? 'bg-amber-400 text-neutral-950 border-amber-300'
                    : 'bg-neutral-900 text-neutral-400 border-white/10'
                }`}
              >
                Traduction FR
              </button>

              <button
                onClick={() => setIncludePhonetics((v) => !v)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                  includePhonetics
                    ? 'bg-amber-400 text-neutral-950 border-amber-300'
                    : 'bg-neutral-900 text-neutral-400 border-white/10'
                }`}
              >
                Phonétique
              </button>

              <button
                onClick={() => setIncludeWaveform((v) => !v)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                  includeWaveform
                    ? 'bg-amber-400 text-neutral-950 border-amber-300'
                    : 'bg-neutral-900 text-neutral-400 border-white/10'
                }`}
              >
                Ondes Audio
              </button>
            </div>

            {/* Pro Option: Watermark Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-neutral-200 font-semibold">
                  Retirer le filigrane du logo (Fonctionnalité Pro)
                </span>
              </div>
              <button
                onClick={() => {
                  if (!isProUser) {
                    setIsPricingModalOpen(true);
                  } else {
                    setIncludeWatermark((v) => !v);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  !includeWatermark && isProUser
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-neutral-300'
                }`}
              >
                {!includeWatermark && isProUser ? 'Filigrane Désactivé' : 'Activer Pro Sans Filigrane'}
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: INTERACTIVE MOBILE SIMULATOR & EXPORT PANEL (5 COLS)
           ========================================================================= */}
        <div className="lg:col-span-5 sticky top-24 space-y-5">
          <div className="bg-[#05170E]/95 border border-emerald-500/30 rounded-3xl p-5 shadow-2xl flex flex-col items-center">
            {/* Simulator Title */}
            <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-amber-400" />
                Visualisation Mobile Réelle ({format})
              </span>
              <button
                onClick={togglePreviewAudio}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                {isPreviewPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPreviewPlaying ? 'Pause Audio' : 'Écouter'}</span>
              </button>
            </div>

            {/* Smartphone Device Mockup Frame */}
            <div
              className={`relative rounded-[36px] p-2.5 bg-neutral-900 border-4 border-neutral-700 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300 ${
                format === '9:16'
                  ? 'w-[280px] sm:w-[320px] aspect-[9/16]'
                  : format === '1:1'
                  ? 'w-[280px] sm:w-[320px] aspect-square'
                  : format === '4:5'
                  ? 'w-[280px] sm:w-[320px] aspect-[4/5]'
                  : 'w-full aspect-video'
              }`}
            >
              {/* Dynamic Island / Camera Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-20 pointer-events-none" />

              {/* Canvas Preview inside the screen */}
              <canvas
                ref={previewCanvasRef}
                className="w-full h-full rounded-[26px] object-cover bg-black"
              />
            </div>

            {/* Verses Stepper for Preview */}
            <div className="w-full flex items-center justify-between mt-4 px-2 text-xs">
              <button
                disabled={previewAyahIdx <= 0}
                onClick={() => setPreviewAyahIdx((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 cursor-pointer text-white font-bold"
              >
                Verset préc.
              </button>
              <span className="text-amber-400 font-mono font-bold">
                Verset {selectedAyahs[previewAyahIdx]?.num || fromAyah} / {toAyah}
              </span>
              <button
                disabled={previewAyahIdx >= selectedAyahs.length - 1}
                onClick={() => setPreviewAyahIdx((p) => Math.min(selectedAyahs.length - 1, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 cursor-pointer text-white font-bold"
              >
                Verset suiv.
              </button>
            </div>

            {/* Export Button & Progress Bar */}
            <div className="w-full mt-5 pt-4 border-t border-white/10 space-y-3">
              <button
                disabled={isRecording || selectedAyahs.length === 0}
                onClick={handleStartFullRecording}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl hover:shadow-amber-500/25 transition active:scale-98 cursor-pointer disabled:opacity-40"
              >
                <Video className="w-5 h-5 fill-current" />
                <span>{isRecording ? 'Génération en cours...' : 'Exporter la Vidéo HD'}</span>
              </button>

              {isRecording && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-neutral-300">
                    <span className="truncate max-w-[220px]">{recordingStatusText}</span>
                    <span className="font-mono font-bold text-amber-400">{recordingProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                      style={{ width: `${recordingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {generatedVideoUrl && !isRecording && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-center space-y-2.5 animate-in fade-in">
                  <span className="text-xs font-bold text-emerald-300 block">
                    ✓ Vidéo générée avec succès (Haute Fidélité Audio) !
                  </span>
                  <button
                    onClick={handleDownload}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger la Vidéo (.WEBM)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================================
          PRICING & MONETIZATION MODAL (1 000 F / Semaine & 3 000 F / Mois)
         ========================================================================= */}
      {isPricingModalOpen && (
        <div
          onClick={() => setIsPricingModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#06180E] border border-amber-400/40 rounded-3xl p-6 shadow-2xl text-white space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
                  <Crown className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">Pass Studio Créateur Pro</h3>
                  <p className="text-xs text-neutral-400">Export illimité sans filigrane & 4K</p>
                </div>
              </div>
              <button
                onClick={() => setIsPricingModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* The 2 Official Pricing Offers Requested by User */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Offer 1: 1 000 FCFA / Semaine */}
              <div className="p-4 rounded-2xl bg-neutral-900/90 border border-emerald-500/30 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                    Pass Hebdomadaire
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">1 000</span>
                    <span className="text-xs text-neutral-400 font-semibold">FCFA / semaine</span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-neutral-300">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-400" />
                      Vidéos jusqu'à 10 versets
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-400" />
                      Export sans filigrane
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-400" />
                      Format TikTok, Reels & WhatsApp
                    </li>
                  </ul>
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs text-center block transition shadow-md"
                >
                  Payer par Wave / OM
                </a>
              </div>

              {/* Offer 2: 3 000 FCFA / Mois (Best Value) */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-950/40 to-neutral-900 border-2 border-amber-400/80 flex flex-col justify-between space-y-3 relative shadow-lg">
                <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 font-black text-[9px] uppercase tracking-wider">
                  Recommandé
                </span>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block mb-1">
                    Abonnement Mensuel
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-amber-300">3 000</span>
                    <span className="text-xs text-neutral-400 font-semibold">FCFA / mois</span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-neutral-300">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-400" />
                      Création illimitée 30 jours
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-400" />
                      Sans filigrane + Fond Vert
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-400" />
                      Accès tous les 16 fonds 4K
                    </li>
                  </ul>
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs text-center block transition shadow-md"
                >
                  Payer par Wave / OM
                </a>
              </div>
            </div>

            {/* Direct WhatsApp Contact Button (without exposing the raw number) */}
            <div className="pt-2 text-center space-y-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-neutral-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Contacter l'Assistance WhatsApp (Paiement Manuel Wave / Orange Money)</span>
              </a>
              <p className="text-[11px] text-neutral-400">
                Paiement instantané par Wave ou Orange Money avec activation immédiate de votre compte.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
