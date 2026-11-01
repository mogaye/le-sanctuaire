import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Download,
  Share2,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  Smartphone,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { CityData, Method } from '../types';
import { getWeeklyAutomatedPrayers, AutomatedPrayerScheduleResult } from '../services/automatedPrayerService';

interface PrayerShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: CityData;
  selectedMethod: Method;
}

export const PrayerShareCardModal: React.FC<PrayerShareCardModalProps> = ({
  isOpen,
  onClose,
  selectedCity,
  selectedMethod,
}) => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute reference date according to week offset
  const referenceDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  // Compute live accurate weekly times from backend calculation service
  const schedule: AutomatedPrayerScheduleResult = useMemo(() => {
    return getWeeklyAutomatedPrayers(
      selectedCity.id || selectedCity.name,
      selectedMethod.id || 'muslim',
      'standard',
      referenceDate
    );
  }, [selectedCity, selectedMethod, referenceDate]);

  // Default to current day when week changes
  useEffect(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;
    const foundIdx = schedule.days.findIndex((d) => d.date === todayStr);
    setSelectedDayIndex(foundIdx >= 0 ? foundIdx : 0);
  }, [schedule]);

  const activeDay = schedule.days[selectedDayIndex] || schedule.days[0];

  // Draw the customized creative poster onto canvas for crystal-clear export
  const renderToCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Load background Mecca template image
    const bgImage = new Image();
    bgImage.crossOrigin = 'anonymous';
    bgImage.src = '/images/prayer_template_makkah.png';

    await new Promise((resolve, reject) => {
      if (bgImage.complete) {
        resolve(true);
      } else {
        bgImage.onload = () => resolve(true);
        bgImage.onerror = () => reject(new Error('Failed to load template image'));
      }
    });

    const W = bgImage.naturalWidth || 1122;
    const H = bgImage.naturalHeight || 1402;
    canvas.width = W;
    canvas.height = H;

    // 1. Draw background
    ctx.drawImage(bgImage, 0, 0, W, H);

    // 2. White Container Area (Left Side of template: roughly X: 60..580, Y: 120..1200)
    // Add subtle ambient shadow behind card overlay
    ctx.save();
    ctx.shadowColor = 'rgba(10, 35, 20, 0.12)';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 15;

    const boxX = 64;
    const boxY = 110;
    const boxW = 530;
    const boxH = 1140;
    const radius = 28;

    // Rounded rectangle card
    ctx.beginPath();
    ctx.moveTo(boxX + radius, boxY);
    ctx.lineTo(boxX + boxW - radius, boxY);
    ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + radius);
    ctx.lineTo(boxX + boxW, boxY + boxH - radius);
    ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - radius, boxY + boxH);
    ctx.lineTo(boxX + radius, boxY + boxH);
    ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - radius);
    ctx.lineTo(boxX, boxY + radius);
    ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.fill();
    ctx.restore();

    // Subtle border
    ctx.save();
    ctx.strokeStyle = 'rgba(16, 85, 48, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // --- Header Section ---
    // Badge "LE SANCTUAIRE • HORAIRES OFFICIELS"
    ctx.save();
    ctx.fillStyle = '#0F3E26';
    ctx.beginPath();
    const badgeX = boxX + 30;
    const badgeY = boxY + 35;
    const badgeW = 280;
    const badgeH = 34;
    const bRadius = 17;
    ctx.moveTo(badgeX + bRadius, badgeY);
    ctx.lineTo(badgeX + badgeW - bRadius, badgeY);
    ctx.quadraticCurveTo(badgeX + badgeW, badgeY, badgeX + badgeW, badgeY + bRadius);
    ctx.lineTo(badgeX + badgeW, badgeY + badgeH - bRadius);
    ctx.quadraticCurveTo(badgeX + badgeW, badgeY + badgeH, badgeX + badgeW - bRadius, badgeY + badgeH);
    ctx.lineTo(badgeX + bRadius, badgeY + badgeH);
    ctx.quadraticCurveTo(badgeX, badgeY + badgeH, badgeX, badgeY + bRadius);
    ctx.lineTo(badgeX, badgeY + bRadius);
    ctx.quadraticCurveTo(badgeX, badgeY, badgeX + bRadius, badgeY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FBBF24'; // Gold
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.fillText('LE SANCTUAIRE', badgeX + 18, badgeY + 22);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillText('• HEURES DE PRIÈRE', badgeX + 130, badgeY + 22);
    ctx.restore();

    // City Name
    ctx.save();
    ctx.fillStyle = '#062817';
    ctx.font = '900 38px system-ui, -apple-system, sans-serif';
    ctx.fillText(selectedCity.name, boxX + 30, boxY + 115);

    // Country & Region Subtitle
    ctx.fillStyle = '#106B3E';
    ctx.font = '600 16px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${selectedCity.country} • ${selectedCity.region || 'Afrique'}`, boxX + 30, boxY + 140);

    // Date Range / Period
    ctx.fillStyle = '#4B5563';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    if (viewMode === 'daily') {
      ctx.fillText(activeDay.dayName, boxX + 30, boxY + 170);
      ctx.fillStyle = '#D97706'; // Amber
      ctx.font = '600 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(activeDay.hijriFormatted, boxX + 30, boxY + 192);
    } else {
      ctx.fillText(schedule.weekRangeFormatted, boxX + 30, boxY + 170);
      ctx.fillStyle = '#D97706';
      ctx.font = '600 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Semaine #${schedule.currentWeekNumber} • Calendrier Hégirien 1448 AH`, boxX + 30, boxY + 192);
    }
    ctx.restore();

    // Divider line
    ctx.save();
    ctx.strokeStyle = 'rgba(16, 85, 48, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(boxX + 30, boxY + 215);
    ctx.lineTo(boxX + boxW - 30, boxY + 215);
    ctx.stroke();
    ctx.restore();

    // --- Content: Daily or Weekly View ---
    if (viewMode === 'daily') {
      // 5 Major Prayers Cards + Shuruq
      const prayers = [
        { key: 'Fajr', ar: 'الفجر', fr: "Aube (Fajr)", time: activeDay.fajr, desc: '2 Rakats à voix haute', color: '#1E40AF', bg: '#EFF6FF' },
        { key: 'Shuruq', ar: 'الشروق', fr: 'Lever du Soleil', time: activeDay.shuruq, desc: 'Fin de l’heure du Fajr', color: '#B45309', bg: '#FEF3C7' },
        { key: 'Dhuhr', ar: 'الظهر', fr: 'Midi (Dhuhr)', time: activeDay.dhuhr, desc: '4 Rakats silencieuses', color: '#047857', bg: '#ECFDF5' },
        { key: 'Asr', ar: 'العصر', fr: 'Après-Midi (Asr)', time: activeDay.asr, desc: '4 Rakats silencieuses', color: '#C2410C', bg: '#FFF7ED' },
        { key: 'Maghrib', ar: 'المغرب', fr: 'Coucher (Maghrib)', time: activeDay.maghrib, desc: '3 Rakats (2 haute, 1 basse)', color: '#BE123C', bg: '#FFF1F2' },
        { key: 'Isha', ar: 'العشاء', fr: 'Nuit (Isha)', time: activeDay.isha, desc: '4 Rakats (2 haute, 2 basse)', color: '#4338CA', bg: '#EEF2FF' },
      ];

      const startY = boxY + 235;
      const rowHeight = 100;
      const rowGap = 16;

      prayers.forEach((p, idx) => {
        const ry = startY + idx * (rowHeight + rowGap);
        const rx = boxX + 30;
        const rw = boxW - 60;
        const rRadius = 18;

        // Row background
        ctx.save();
        ctx.fillStyle = p.bg;
        ctx.beginPath();
        ctx.moveTo(rx + rRadius, ry);
        ctx.lineTo(rx + rw - rRadius, ry);
        ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rRadius);
        ctx.lineTo(rx + rw, ry + rowHeight - rRadius);
        ctx.quadraticCurveTo(rx + rw, ry + rowHeight, rx + rw - rRadius, ry + rowHeight);
        ctx.lineTo(rx + rRadius, ry + rowHeight);
        ctx.quadraticCurveTo(rx, ry + rowHeight, rx, ry + rowHeight - rRadius);
        ctx.lineTo(rx, ry + rRadius);
        ctx.quadraticCurveTo(rx, ry, rx + rRadius, ry);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = p.color + '33';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Left vertical indicator bar
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.rect(rx + 2, ry + 16, 5, rowHeight - 32);
        ctx.fill();

        // French & Arabic Name
        ctx.fillStyle = '#062817';
        ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
        ctx.fillText(p.fr, rx + 24, ry + 38);

        ctx.fillStyle = '#6B7280';
        ctx.font = '500 13px system-ui, -apple-system, sans-serif';
        ctx.fillText(p.desc, rx + 24, ry + 68);

        // Arabic Calligraphy
        ctx.fillStyle = p.color;
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(p.ar, rx + rw - 24, ry + 36);

        // Digital Time
        ctx.fillStyle = '#062817';
        ctx.font = 'bold 30px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillText(p.time, rx + rw - 24, ry + 74);
        ctx.textAlign = 'left';
        ctx.restore();
      });

      // Bottom Spiritual Hadith Quote
      ctx.save();
      const quoteY = boxY + boxH - 120;
      ctx.fillStyle = '#0A3B22';
      ctx.font = 'italic 13px Georgia, serif';
      const quote = '« La prière en son temps est la meilleure des œuvres auprès d’Allah. »';
      ctx.fillText(quote, boxX + 30, quoteY);
      ctx.fillStyle = '#106B3E';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillText('LE SANCTUAIRE • Horaires astronomiques exacts synchronisés', boxX + 30, quoteY + 24);
      ctx.restore();

    } else {
      // Weekly Timetable View (Compact 7 rows table)
      const tableX = boxX + 24;
      const tableW = boxW - 48;
      const startY = boxY + 235;

      // Table Header row
      ctx.save();
      ctx.fillStyle = '#0F3E26';
      ctx.fillRect(tableX, startY, tableW, 40);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
      ctx.fillText('JOUR', tableX + 12, startY + 25);
      ctx.fillText('FAJR', tableX + 105, startY + 25);
      ctx.fillText('DHUHR', tableX + 175, startY + 25);
      ctx.fillText('ASR', tableX + 250, startY + 25);
      ctx.fillText('MAGHRIB', tableX + 325, startY + 25);
      ctx.fillText('ISHA', tableX + 415, startY + 25);
      ctx.restore();

      const rowH = 75;
      schedule.days.forEach((day, idx) => {
        const ry = startY + 40 + idx * rowH;
        ctx.save();
        ctx.fillStyle = idx % 2 === 0 ? '#FFFFFF' : '#F6F9F7';
        ctx.fillRect(tableX, ry, tableW, rowH);

        // Highlight Friday (Vendredi)
        if (day.dayName.toLowerCase().startsWith('ven')) {
          ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
          ctx.fillRect(tableX, ry, tableW, rowH);
        }

        ctx.strokeStyle = 'rgba(16, 85, 48, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(tableX, ry, tableW, rowH);

        // Day name & Hijri
        ctx.fillStyle = '#062817';
        ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
        const shortDay = day.dayName.split(' ').slice(0, 2).join(' ');
        ctx.fillText(shortDay, tableX + 10, ry + 32);

        ctx.fillStyle = '#D97706';
        ctx.font = '500 10px system-ui, -apple-system, sans-serif';
        ctx.fillText(`Lev. ${day.shuruq}`, tableX + 10, ry + 52);

        // Prayer columns
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 15px ui-monospace, monospace';
        ctx.fillText(day.fajr, tableX + 100, ry + 42);
        ctx.fillText(day.dhuhr, tableX + 172, ry + 42);
        ctx.fillText(day.asr, tableX + 245, ry + 42);
        ctx.fillText(day.maghrib, tableX + 325, ry + 42);
        ctx.fillText(day.isha, tableX + 410, ry + 42);
        ctx.restore();
      });

      // Bottom Note
      ctx.save();
      const quoteY = boxY + boxH - 120;
      ctx.fillStyle = '#0A3B22';
      ctx.font = 'italic 13px Georgia, serif';
      ctx.fillText('« Quiconque accomplit ses prières avec assiduité aura une lumière au Jour Dernier. »', boxX + 30, quoteY);
      ctx.fillStyle = '#106B3E';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Heures exactes calculées selon ${schedule.methodName}`, boxX + 30, quoteY + 24);
      ctx.restore();
    }

    return canvas;
  };

  const handleDownloadImage = async () => {
    try {
      setIsGeneratingImage(true);
      const canvas = await renderToCanvas();
      if (!canvas) throw new Error('Canvas rendering failed');

      const dataUrl = canvas.toDataURL('image/png', 0.95);
      const link = document.createElement('a');
      const filename = `Horaires_Priere_${selectedCity.name.replace(/\s+/g, '_')}_${viewMode === 'daily' ? activeDay.date : 'Semaine'}.png`;
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating prayer card image:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleShare = async () => {
    try {
      const canvas = await renderToCanvas();
      if (canvas && navigator.share) {
        canvas.toBlob(async (blob) => {
          if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'horaires-priere.png', { type: 'image/png' })] })) {
            const file = new File([blob], `Horaires_${selectedCity.name}.png`, { type: 'image/png' });
            await navigator.share({
              title: `Horaires de prière - ${selectedCity.name}`,
              text: `Découvrez les horaires authentiques des 5 prières pour ${selectedCity.name} sur Le Sanctuaire.`,
              files: [file],
            });
            return;
          }
          // Fallback share link
          navigator.share({
            title: `Horaires de prière - ${selectedCity.name}`,
            text: `Horaires officiels des 5 prières pour ${selectedCity.name} sur Le Sanctuaire :`,
            url: window.location.href,
          }).catch(() => {});
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      {/* Hidden high-res canvas used for crystal clear PNG export */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative w-full max-w-4xl bg-[#0D2418] border border-emerald-500/30 rounded-3xl shadow-2xl text-white overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#0A1A11] border-b border-emerald-500/25 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-neutral-950 font-black flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Modèle Makkah Horloge
                </span>
                <span className="text-xs text-amber-300 font-bold hidden sm:inline">
                  Automatisé chaque semaine
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Partager les Horaires • {selectedCity.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Controls Bar */}
        <div className="px-5 py-3 bg-[#0E2C1D] border-b border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Format Selector: Daily vs Weekly */}
          <div className="flex items-center p-1 bg-black/30 rounded-xl border border-emerald-500/20">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'daily'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              Format Journalier
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'weekly'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              Format Semaine Complète
            </button>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Semaine précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-emerald-200">
              {weekOffset === 0 ? 'Semaine actuelle' : weekOffset > 0 ? `+${weekOffset} semaine` : `${weekOffset} semaine`}
            </span>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Semaine suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Interactive Poster Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#09170E] flex flex-col lg:flex-row gap-6 items-center justify-center">
          
          {/* Poster Visual Representation (Direct faithful replica of the final image) */}
          <div
            className="relative w-full max-w-[420px] aspect-[1122/1402] rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/30 flex shrink-0"
            style={{
              backgroundImage: 'url(/images/prayer_template_makkah.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* White card container on left */}
            <div className="absolute left-[5.5%] top-[8%] w-[51%] bottom-[8%] bg-white/95 rounded-2xl shadow-xl p-3.5 sm:p-4 flex flex-col justify-between border border-emerald-900/15 overflow-hidden text-neutral-900">
              
              {/* Header inside card */}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0F3E26] text-white text-[9px] font-extrabold tracking-wider">
                  <span className="text-amber-300">LE SANCTUAIRE</span>
                  <span>• PRIÈRES</span>
                </div>

                <div className="pt-1">
                  <h3 className="text-lg sm:text-xl font-black text-neutral-900 leading-tight">
                    {selectedCity.name}
                  </h3>
                  <p className="text-[10px] font-semibold text-emerald-700">
                    {selectedCity.country} • {selectedCity.region || 'Afrique'}
                  </p>
                </div>

                <p className="text-[10px] font-bold text-neutral-600 border-b border-emerald-700/20 pb-1.5">
                  {viewMode === 'daily' ? activeDay.dayName : schedule.weekRangeFormatted}
                </p>
              </div>

              {/* Body inside card */}
              {viewMode === 'daily' ? (
                <div className="space-y-1.5 py-1 flex-1 flex flex-col justify-center">
                  {[
                    { label: 'Fajr', time: activeDay.fajr, bg: 'bg-blue-50 text-blue-900', ar: 'الفجر' },
                    { label: 'Shuruq', time: activeDay.shuruq, bg: 'bg-amber-50 text-amber-900', ar: 'الشروق' },
                    { label: 'Dhuhr', time: activeDay.dhuhr, bg: 'bg-emerald-50 text-emerald-900', ar: 'الظهر' },
                    { label: 'Asr', time: activeDay.asr, bg: 'bg-orange-50 text-orange-900', ar: 'العصر' },
                    { label: 'Maghrib', time: activeDay.maghrib, bg: 'bg-rose-50 text-rose-900', ar: 'المغرب' },
                    { label: 'Isha', time: activeDay.isha, bg: 'bg-indigo-50 text-indigo-900', ar: 'العشاء' },
                  ].map((p) => (
                    <div
                      key={p.label}
                      className={`px-2.5 py-1.5 rounded-xl flex items-center justify-between text-xs font-bold ${p.bg} border border-neutral-200/50 shadow-2xs`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{p.label}</span>
                        <span className="text-[10px] opacity-70 font-serif">{p.ar}</span>
                      </div>
                      <span className="font-mono font-black text-xs sm:text-sm">{p.time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1 py-1 flex-1 flex flex-col justify-center text-[9px]">
                  <div className="grid grid-cols-6 font-extrabold text-[8px] bg-emerald-900 text-white p-1 rounded-md text-center">
                    <span>JR</span>
                    <span>FAJ</span>
                    <span>DHU</span>
                    <span>ASR</span>
                    <span>MAG</span>
                    <span>ISH</span>
                  </div>
                  {schedule.days.map((day) => (
                    <div
                      key={day.date}
                      className="grid grid-cols-6 py-1 px-0.5 rounded-sm border-b border-neutral-100 text-center font-bold items-center"
                    >
                      <span className="truncate text-[8px] text-left font-black">{day.dayName.split(' ')[0].slice(0, 3)}</span>
                      <span className="font-mono">{day.fajr}</span>
                      <span className="font-mono">{day.dhuhr}</span>
                      <span className="font-mono">{day.asr}</span>
                      <span className="font-mono">{day.maghrib}</span>
                      <span className="font-mono">{day.isha}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer inside card */}
              <div className="pt-1.5 border-t border-emerald-700/20 text-[9px] text-emerald-900/80 font-medium leading-tight">
                <p className="italic line-clamp-1">« La prière en son temps est la meilleure des œuvres. »</p>
                <p className="font-bold text-[8px] text-emerald-700 mt-0.5">Le Sanctuaire • le-sanctuaire.pro</p>
              </div>
            </div>
          </div>

          {/* Right Action Panel */}
          <div className="w-full lg:w-80 space-y-4 text-left">
            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Horaires 100% Automatisés</span>
              </span>
              <h3 className="text-xl font-black text-white">
                Prêt pour WhatsApp, Statut & Réseaux
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Cette affiche utilise le modèle officiel de la Tour de l'Horloge de La Mecque avec les horaires astronomiques exacts de votre région.
              </p>
            </div>

            {viewMode === 'daily' && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-neutral-300">Choisir le jour :</span>
                <div className="grid grid-cols-7 gap-1">
                  {schedule.days.map((d, idx) => (
                    <button
                      key={d.date}
                      onClick={() => setSelectedDayIndex(idx)}
                      className={`p-1.5 rounded-xl text-center text-xs font-bold transition cursor-pointer border ${
                        selectedDayIndex === idx
                          ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm'
                          : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                      }`}
                    >
                      <span className="block text-[9px] opacity-80">{d.dayName.slice(0, 2)}</span>
                      <span>{d.dayNumber}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={isGeneratingImage}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-98 cursor-pointer disabled:opacity-60"
              >
                {isGeneratingImage ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Création de l'image en cours...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Télécharger l'Image PNG (HD)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 border border-emerald-500/40 transition active:scale-98 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Lien copié dans le presse-papier !</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Partager directement</span>
                  </>
                )}
              </button>
            </div>

            {/* Contact details notice matching the template footer */}
            <div className="p-3.5 rounded-2xl bg-[#07170E] border border-emerald-500/20 text-xs text-neutral-400 space-y-1">
              <div className="flex items-center justify-between text-neutral-300 font-bold">
                <span>Site : le-sanctuaire.pro</span>
                <span>WhatsApp : 789139036</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Calculé selon la méthode {schedule.methodName} ({schedule.timezone}).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
