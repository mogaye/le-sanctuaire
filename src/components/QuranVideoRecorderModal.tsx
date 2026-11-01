import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Video,
  Download,
  Play,
  Pause,
  Sparkles,
  ShieldCheck,
  Check,
  Smartphone,
  Tv,
  Square,
  RefreshCw,
  Loader2,
  Film,
  Camera,
  Layers,
  Volume2,
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
  const [currentRecordingAyah, setCurrentRecordingAyah] = useState<number>(fromAyah);
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
  // CANVAS DRAWING ENGINE: Renders a single frame for an ayah
  // =========================================================================
  const drawFrame = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    ayah: { num: number; ar: string; tr: string; fr: string },
    audioProgress: number,
    analyserData?: Uint8Array
  ) => {
    // 1. Theme Background
    ctx.save();
    const bgGrad = ctx.createRadialGradient(
      width / 2,
      height * 0.35,
      width * 0.1,
      width / 2,
      height / 2,
      width * 0.8
    );
    bgGrad.addColorStop(0, currentTheme.swatch);
    bgGrad.addColorStop(0.65, '#050c08');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Ambient Soft Glows
    const glowGrad = ctx.createRadialGradient(
      width / 2,
      height * 0.3,
      20,
      width / 2,
      height * 0.3,
      width * 0.45
    );
    glowGrad.addColorStop(0, currentTheme.glow1.replace(/[\d\.]+\)$/, '0.22)'));
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, width, height);

    // 3. Official Authentication Watermark Badge (Le Sanctuaire)
    if (includeWatermark) {
      const padX = width * 0.06;
      const padY = height * 0.05;

      // Badge Container Pill
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 2;
      const badgeW = width > 1200 ? 460 : 380;
      const badgeH = 54;
      const badgeX = width - padX - badgeW;
      const badgeY = padY;

      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 27);
      ctx.fill();
      ctx.stroke();

      // Golden Moon Emblem & Le Sanctuaire Branding
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#FCD34D';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('☪ Le Sanctuaire', badgeX + 22, badgeY + badgeH / 2);

      ctx.font = 'normal 15px sans-serif';
      ctx.fillStyle = '#A7F3D0';
      ctx.fillText('• Récitation Authentifiée', badgeX + 175, badgeY + badgeH / 2);
    }

    // 4. Surah & Reciter Header
    const topY = height * 0.12;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Surah badge
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#FCD34D';
    ctx.fillText(`Sourate ${surahName} (${surahNum}) • Verset ${ayah.num}`, width / 2, topY);

    ctx.font = 'normal 20px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fillText(`Récitateur : ${selectedReciter.name}`, width / 2, topY + 36);

    // Bismillah if Ayah 1 (except At-Tawbah)
    let currentY = topY + 90;
    if (surahNum !== 9 && ayah.num === 1) {
      ctx.font = '36px "Amiri", serif';
      ctx.fillStyle = '#FDE68A';
      ctx.fillText('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', width / 2, currentY);
      currentY += 60;
    }

    // 5. Arabic Verse Text (with or without Tajweed colors)
    const arabicMaxWidth = width * 0.88;
    const arabicFontSize =
      aspectRatio === 'story'
        ? ayah.ar.length > 250
          ? 38
          : ayah.ar.length > 120
            ? 48
            : 60
        : ayah.ar.length > 250
          ? 44
          : ayah.ar.length > 120
            ? 56
            : 70;

    ctx.font = `${arabicFontSize}px "Amiri", "Traditional Arabic", serif`;
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';

    // Wrap Arabic text into lines
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
    currentY = Math.max(currentY + 20, (height * 0.45) - (totalArabicHeight / 2));

    // Render Arabic lines
    lines.forEach((line, idx) => {
      const lineY = currentY + idx * lineHeight;

      if (!includeTajweed) {
        ctx.fillStyle = '#FEF3C7';
        ctx.fillText(line, width / 2, lineY);
      } else {
        // Render with Tajweed colors per token
        const tokens = parseTajweedTokens(line);
        let totalLineWidth = 0;
        tokens.forEach((t) => {
          totalLineWidth += ctx.measureText(t.text).width;
        });

        // Start from left bound in RTL centered calculation
        let startX = width / 2 + totalLineWidth / 2;
        ctx.textAlign = 'right';

        tokens.forEach((token) => {
          if (token.type === 'madd') ctx.fillStyle = '#F87171'; // Coral Red
          else if (token.type === 'ghunnah') ctx.fillStyle = '#34D399'; // Emerald
          else if (token.type === 'qalqalah') ctx.fillStyle = '#38BDF8'; // Sky Blue
          else if (token.type === 'tafkhim') ctx.fillStyle = '#FBBF24'; // Amber Gold
          else if (token.type === 'silent') ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
          else ctx.fillStyle = '#FEF3C7';

          ctx.fillText(token.text, startX, lineY);
          startX -= ctx.measureText(token.text).width;
        });

        ctx.textAlign = 'center';
      }
    });

    // Clean Ayah end ornament symbol without raw numbers
    const ornamentY = currentY + totalArabicHeight + 15;
    ctx.font = '36px "Amiri", serif';
    ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
    ctx.fillText('۝', width / 2, ornamentY);

    // 6. French Translation & Phonetics
    ctx.direction = 'ltr';
    let subY = ornamentY + 50;

    if (includePhonetics && ayah.tr) {
      ctx.font = 'italic 22px Georgia, serif';
      ctx.fillStyle = currentTheme.textTr.includes('emerald')
        ? '#6EE7B7'
        : currentTheme.textTr.includes('sky')
          ? '#7DD3FC'
          : '#FCD34D';
      const maxTransW = width * 0.85;
      wrapAndDrawText(ctx, `« ${ayah.tr} »`, width / 2, subY, maxTransW, 34);
      subY += 45;
    }

    if (includeTranslation && ayah.fr) {
      ctx.font = '500 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      const maxTransW = width * 0.85;
      wrapAndDrawText(ctx, ayah.fr, width / 2, subY, maxTransW, 36);
    }

    // 7. Dynamic Audio Visualizer Waveform at the Bottom
    const bottomBarY = height - 90;
    if (analyserData && analyserData.length > 0) {
      const barsCount = 36;
      const barWidth = 6;
      const spacing = 8;
      const totalWaveWidth = barsCount * (barWidth + spacing);
      const waveStartX = (width - totalWaveWidth) / 2;

      ctx.fillStyle = currentTheme.accent;
      for (let b = 0; b < barsCount; b++) {
        const val = analyserData[b * 2] || 0;
        const barHeight = Math.max(6, (val / 255) * 45);
        ctx.fillRect(
          waveStartX + b * (barWidth + spacing),
          bottomBarY - barHeight / 2,
          barWidth,
          barHeight
        );
      }
    }

    // 8. Progress indicator bar
    const progW = width * 0.7;
    const progX = (width - progW) / 2;
    const progY = height - 35;
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

  const wrapAndDrawText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(' ');
    let line = '';
    let currY = y;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, currY);
        line = words[n] + ' ';
        currY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, currY);
  };

  // =========================================================================
  // VIDEO GENERATION / RECORDING PIPELINE
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

      // 2. Setup Canvas stream
      const canvasStream = canvas.captureStream(30);

      // Combine video track + audio track
      const combinedTracks = [
        ...canvasStream.getVideoTracks(),
        ...audioDest.stream.getAudioTracks(),
      ];
      const combinedStream = new MediaStream(combinedTracks);

      // 3. Setup MediaRecorder with best supported mimeType
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ];
      const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMime || undefined,
        videoBitsPerSecond: 3000000, // 3 Mbps for crisp 1080p
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
          setRecordingStatusText('Génération réussie ! Prêt au téléchargement.');
        }
        setIsRecording(false);
      };

      recorder.start();

      // 4. Sequentially play and record each selected verse
      const totalVerses = selectedAyahs.length;

      for (let idx = 0; idx < totalVerses; idx++) {
        if (isCancelledRef.current) break;
        const ayah = selectedAyahs[idx];
        setCurrentRecordingAyah(ayah.num);
        setRecordingStatusText(
          `Enregistrement du verset ${ayah.num} sur ${toAyah} (${idx + 1} / ${totalVerses})...`
        );

        // Load verse audio
        const audioUrl = getAyahAudioUrl(surahNum, ayah.num, selectedReciter.id);
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.src = audioUrl;
        audioRef.current = audio;

        // Connect audio to destination & analyser
        const sourceNode = audioCtx.createMediaElementSource(audio);
        sourceNode.connect(analyser);
        analyser.connect(audioDest);
        sourceNode.connect(audioCtx.destination); // Let user hear preview while recording

        await new Promise<void>((resolve, reject) => {
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

            drawFrame(ctx, width, height, ayah, verseProgress, freqData);
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
            // Continue even if one audio fails
            resolve();
          };

          audio
            .play()
            .catch((err) => {
              console.warn('Audio play error in video recorder:', err);
              hasEnded = true;
              sourceNode.disconnect();
              resolve();
            });
        });

        // Small pause between verses
        await new Promise((r) => setTimeout(r, 400));
      }

      // Stop recorder once all verses finish
      if (!isCancelledRef.current && recorder.state !== 'inactive') {
        recorder.stop();
      }
    } catch (err: any) {
      console.error('Video generation error:', err);
      setRecordingStatusText(`Erreur : ${err?.message || 'Échec de la génération'}`);
      setIsRecording(false);
    }
  };

  // Download video file
  const handleDownloadVideo = () => {
    if (!generatedBlob && !generatedVideoUrl) return;
    const a = document.createElement('a');
    a.href = generatedVideoUrl!;
    a.download = `Le_Sanctuaire_Sourate_${surahNum}_Versets_${fromAyah}_a_${toAyah}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download high-resolution PNG snapshot of the first selected ayah
  const handleDownloadSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = getCanvasDimensions();
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx || selectedAyahs.length === 0) return;

    drawFrame(ctx, width, height, selectedAyahs[0], 1.0);

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
                Générez une vidéo avec le son de la récitation, le Tajweed et le logo officiel Le Sanctuaire
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
                  Vidéo générée avec succès !
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
