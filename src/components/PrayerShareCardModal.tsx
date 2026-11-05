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
  Layers,
  Languages,
} from 'lucide-react';
import { CityData, Method } from '../types';
import { getWeeklyAutomatedPrayers, AutomatedPrayerScheduleResult } from '../services/automatedPrayerService';
import QRCode from 'qrcode';

interface PrayerShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: CityData;
  selectedMethod: Method;
}

export type PosterTemplateType = 'salat' | 'makkah';

export interface PosterArtBg {
  id: string;
  name: string;
  url: string;
}

export const POSTER_ART_BACKGROUNDS: PosterArtBg[] = [
  { id: 'mosque_royale', name: 'Grande Mosquée Céleste', url: '/images/prayer_template_salat.png' },
  { id: 'emerald_arch', name: 'Arches & Fanous Émeraude', url: '/images/fonds-islamiques/emerald_fanous_archway_4k.webp' },
  { id: 'sapphire_night', name: 'Nuit Saphir & Minarets', url: '/images/fonds-islamiques/sapphire_lantern_night_4k.webp' },
  { id: 'twilight_dunes', name: 'Crépuscule Doré', url: '/images/fonds-islamiques/golden_twilight_dunes_4k.webp' },
  { id: 'ivory_palace', name: 'Palais d’Ivoire & Or', url: '/images/fonds-islamiques/ivory_gold_palace_4k.webp' },
];

export const PrayerShareCardModal: React.FC<PrayerShareCardModalProps> = ({
  isOpen,
  onClose,
  selectedCity,
  selectedMethod,
}) => {
  // 1. Template selection: 'salat' is the FIRST background with gorgeous mosque art
  const [selectedTemplate, setSelectedTemplate] = useState<PosterTemplateType>('salat');
  const [selectedArtBgId, setSelectedArtBgId] = useState<string>('mosque_royale');
  const currentArtBg = POSTER_ART_BACKGROUNDS.find((b) => b.id === selectedArtBgId) || POSTER_ART_BACKGROUNDS[0];

  // 2. Senegal / Wolof local prayer names toggle (Suba, Tisbar, Takussan, Timis, Guéé)
  const isSenegaleseCity = useMemo(() => {
    const c = (selectedCity.country || '').toLowerCase();
    const n = (selectedCity.name || '').toLowerCase();
    return c.includes('sénégal') || c.includes('senegal') || n === 'dakar' || n === 'touba' || n === 'thiès' || n === 'saint-louis';
  }, [selectedCity]);

  const [useWolofNames, setUseWolofNames] = useState<boolean>(true);

  // Sync default to true for Senegalese cities
  useEffect(() => {
    if (isSenegaleseCity) {
      setUseWolofNames(true);
    }
  }, [isSenegaleseCity]);

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

  // Live accurate weekly times from backend calculation service
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

  // Prayer display labels
  const prayerNames = useMemo(() => {
    return {
      fajr: {
        primary: useWolofNames ? 'Suba' : 'Aube (Fajr)',
        sub: useWolofNames ? `Fajr ${activeDay.fajr}` : '2 Rakats à voix haute',
        ar: 'الفجر',
      },
      shuruq: {
        primary: useWolofNames ? 'Pencc' : 'Lever du Soleil',
        sub: useWolofNames ? 'Chourouq' : 'Fin du Fajr',
        ar: 'الشروق',
      },
      dhuhr: {
        primary: useWolofNames ? 'Tisbar' : 'Midi (Dhuhr)',
        sub: useWolofNames ? 'Dhuhr' : '4 Rakats silencieuses',
        ar: 'الظهر',
      },
      asr: {
        primary: useWolofNames ? 'Takussan' : 'Après-Midi (Asr)',
        sub: useWolofNames ? 'Asr' : '4 Rakats silencieuses',
        ar: 'العصر',
      },
      maghrib: {
        primary: useWolofNames ? 'Timis' : 'Coucher (Maghrib)',
        sub: useWolofNames ? 'Maghrib' : '3 Rakats',
        ar: 'المغرب',
      },
      isha: {
        primary: useWolofNames ? 'Guéé' : 'Nuit (Isha)',
        sub: useWolofNames ? 'Isha' : '4 Rakats',
        ar: 'العشاء',
      },
    };
  }, [useWolofNames, activeDay.fajr]);

  // Draw the customized creative poster onto canvas for crystal-clear export
  const renderToCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (selectedTemplate === 'salat') {
      // =========================================================================
      // TEMPLATE 1: ARTISTIC MOSQUE & CELESTIAL BACKGROUND + TEAL TABLE
      // =========================================================================
      const bgImage = new Image();
      bgImage.crossOrigin = 'anonymous';
      bgImage.src = currentArtBg.url;

      await new Promise((resolve) => {
        if (bgImage.complete && bgImage.naturalWidth > 0) resolve(true);
        else {
          bgImage.onload = () => resolve(true);
          bgImage.onerror = () => {
            console.warn('Poster background image failed to load, continuing with canvas gradient fallback');
            resolve(false);
          };
        }
      });

      const W = 1080;
      const H = 1440;
      canvas.width = W;
      canvas.height = H;

      // 1. Draw rich background
      ctx.fillStyle = '#111814';
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bgImage, 0, 0, W, H);
      ctx.restore();

      // Vignette gradient over lower half to make table perfectly readable while silhouettes remain visible
      const vignette = ctx.createLinearGradient(0, H * 0.38, 0, H);
      vignette.addColorStop(0, 'rgba(12, 22, 17, 0.05)');
      vignette.addColorStop(0.45, 'rgba(9, 24, 18, 0.75)');
      vignette.addColorStop(1, 'rgba(6, 17, 12, 0.96)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, H * 0.38, W, H * 0.62);

      // Top floating pill header
      ctx.save();
      const topBadgeX = (W - 460) / 2;
      const topBadgeY = 48;
      const topBadgeW = 460;
      const topBadgeH = 46;
      ctx.fillStyle = 'rgba(10, 32, 22, 0.88)';
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(topBadgeX, topBadgeY, topBadgeW, topBadgeH, 23);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FBBF24';
      ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LE SANCTUAIRE • HEURES DE PRIÈRE', W / 2, topBadgeY + 29);
      ctx.restore();

      if (viewMode === 'daily') {
        // =========================================================
        // DAILY VIEW: TEAL TABLE (REPLICA OF image_162546d6.png)
        // =========================================================
        const tableW = 740;
        const tableH = 620;
        const tableX = (W - tableW) / 2;
        const tableY = 660;
        const radius = 28;

        // Shadow under teal table
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 35;
        ctx.shadowOffsetY = 15;

        // Teal Card Background (#227060 / #1B5D4F)
        const tealGrad = ctx.createLinearGradient(tableX, tableY, tableX, tableY + tableH);
        tealGrad.addColorStop(0, '#267A69');
        tealGrad.addColorStop(1, '#1A5A4D');
        ctx.fillStyle = tealGrad;
        ctx.beginPath();
        ctx.roundRect(tableX, tableY, tableW, tableH, radius);
        ctx.fill();
        ctx.restore();

        // Border around table (#3A917F)
        ctx.save();
        ctx.strokeStyle = '#3EA08D';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(tableX, tableY, tableW, tableH, radius);
        ctx.stroke();
        ctx.restore();

        // Table Top Header Banner
        ctx.save();
        ctx.fillStyle = 'rgba(13, 48, 40, 0.55)';
        ctx.beginPath();
        ctx.roundRect(tableX, tableY, tableW, 90, [radius, radius, 0, 0]);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 28px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(selectedCity.name, tableX + 32, tableY + 42);

        ctx.fillStyle = '#9FE2D3';
        ctx.font = '600 15px system-ui, -apple-system, sans-serif';
        ctx.fillText(
          `${activeDay.dayName} • ${activeDay.hijriFormatted}`,
          tableX + 32,
          tableY + 70
        );

        ctx.fillStyle = '#FDE68A';
        ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(selectedCity.country, tableX + tableW - 32, tableY + 54);
        ctx.restore();

        // Header divider
        ctx.save();
        ctx.strokeStyle = '#3EA08D';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tableX, tableY + 90);
        ctx.lineTo(tableX + tableW, tableY + 90);
        ctx.stroke();
        ctx.restore();

        // Vertical column separator divider (at 60% of table width)
        const colSplitX = tableX + tableW * 0.58;
        ctx.save();
        ctx.strokeStyle = '#3EA08D';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(colSplitX, tableY + 90);
        ctx.lineTo(colSplitX, tableY + tableH);
        ctx.stroke();
        ctx.restore();

        // Rows for the 5 prayers: Suba, Tisbar, Takussan, Timis, Guéé
        const rows = [
          { name: prayerNames.fajr.primary, sub: prayerNames.fajr.sub, time: activeDay.fajr },
          { name: prayerNames.dhuhr.primary, sub: prayerNames.dhuhr.sub, time: activeDay.dhuhr },
          { name: prayerNames.asr.primary, sub: prayerNames.asr.sub, time: activeDay.asr },
          { name: prayerNames.maghrib.primary, sub: prayerNames.maghrib.sub, time: activeDay.maghrib },
          { name: prayerNames.isha.primary, sub: prayerNames.isha.sub, time: activeDay.isha },
        ];

        const rowHeight = (tableH - 90) / 5;

        rows.forEach((r, idx) => {
          const ry = tableY + 90 + idx * rowHeight;

          // Horizontal row divider (except last)
          if (idx > 0) {
            ctx.save();
            ctx.strokeStyle = '#3EA08D';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(tableX, ry);
            ctx.lineTo(tableX + tableW, ry);
            ctx.stroke();
            ctx.restore();
          }

          // Left Column: Prayer Name & Subtitle
          ctx.save();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 32px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(r.name, tableX + 32, ry + 44);

          // Subtitle (e.g. "Fajr 05h 44" as shown in image_162546d6)
          ctx.fillStyle = '#A7EAD9';
          ctx.font = '600 16px system-ui, -apple-system, sans-serif';
          ctx.fillText(r.sub, tableX + 32, ry + 74);

          // Right Column: Digital Time (e.g. "06h 02" format)
          const timeFormatted = r.time.replace(':', 'h ');
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 38px ui-monospace, SFMono-Regular, Menlo, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(timeFormatted, colSplitX + (tableX + tableW - colSplitX) / 2, ry + 62);
          ctx.restore();
        });

      } else {
        // =========================================================
        // WEEKLY VIEW ON SALAT TEMPLATE
        // =========================================================
        const tableW = 860;
        const tableH = 630;
        const tableX = (W - tableW) / 2;
        const tableY = 650;
        const radius = 24;

        ctx.save();
        ctx.fillStyle = '#1F695A';
        ctx.beginPath();
        ctx.roundRect(tableX, tableY, tableW, tableH, radius);
        ctx.fill();

        ctx.strokeStyle = '#3EA08D';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();

        // Table Header
        const colW = tableW / 6;
        ctx.save();
        ctx.fillStyle = '#13473D';
        ctx.beginPath();
        ctx.roundRect(tableX, tableY, tableW, 55, [radius, radius, 0, 0]);
        ctx.fill();

        ctx.fillStyle = '#FDE68A';
        ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('JOUR', tableX + colW * 0.5, tableY + 34);
        ctx.fillText(useWolofNames ? 'SUBA' : 'FAJR', tableX + colW * 1.5, tableY + 34);
        ctx.fillText(useWolofNames ? 'TISBAR' : 'DHUHR', tableX + colW * 2.5, tableY + 34);
        ctx.fillText(useWolofNames ? 'TAKUSSAN' : 'ASR', tableX + colW * 3.5, tableY + 34);
        ctx.fillText(useWolofNames ? 'TIMIS' : 'MAGHRIB', tableX + colW * 4.5, tableY + 34);
        ctx.fillText(useWolofNames ? 'GUÉÉ' : 'ISHA', tableX + colW * 5.5, tableY + 34);
        ctx.restore();

        const rowH = (tableH - 55) / 7;
        schedule.days.forEach((day, idx) => {
          const ry = tableY + 55 + idx * rowH;

          ctx.save();
          if (idx % 2 === 1) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(tableX, ry, tableW, rowH);
          }

          // Highlight Friday
          if (day.dayName.toLowerCase().startsWith('ven')) {
            ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
            ctx.fillRect(tableX, ry, tableW, rowH);
          }

          ctx.strokeStyle = '#2D8170';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(tableX, ry);
          ctx.lineTo(tableX + tableW, ry);
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          const shortDay = day.dayName.split(' ').slice(0, 2).join(' ');
          ctx.fillText(shortDay, tableX + colW * 0.5, ry + rowH / 2 + 6);

          ctx.font = 'bold 17px ui-monospace, monospace';
          ctx.fillText(day.fajr, tableX + colW * 1.5, ry + rowH / 2 + 6);
          ctx.fillText(day.dhuhr, tableX + colW * 2.5, ry + rowH / 2 + 6);
          ctx.fillText(day.asr, tableX + colW * 3.5, ry + rowH / 2 + 6);
          ctx.fillText(day.maghrib, tableX + colW * 4.5, ry + rowH / 2 + 6);
          ctx.fillText(day.isha, tableX + colW * 5.5, ry + rowH / 2 + 6);
          ctx.restore();
        });
      }

      // Bottom Official Contacts & QR Code Banner
      try {
        const qrDataUrl = await QRCode.toDataURL('https://le-sanctuaire.pro', {
          margin: 1,
          width: 140,
          color: { dark: '#062817', light: '#FFFFFF' },
        });
        const qrImg = new Image();
        qrImg.src = qrDataUrl;
        await new Promise((res) => {
          qrImg.onload = res;
          qrImg.onerror = res;
        });

        const logoImg = new Image();
        logoImg.src = '/images/sanctuaire_logo.jpg';
        await new Promise((res) => {
          logoImg.onload = res;
          logoImg.onerror = res;
        });

        ctx.save();
        const footerY = H - 105;
        const footerH = 75;
        const footerW = W - 140;
        const footerX = 70;
        ctx.fillStyle = 'rgba(8, 26, 18, 0.96)';
        ctx.strokeStyle = '#3EA08D';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(footerX, footerY, footerW, footerH, 24);
        ctx.fill();
        ctx.stroke();

        // Draw Logo
        if (logoImg.complete && logoImg.naturalWidth) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(footerX + 45, footerY + 38, 24, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(logoImg, footerX + 21, footerY + 14, 48, 48);
          ctx.restore();
        }

        ctx.fillStyle = '#FDE68A';
        ctx.font = '900 20px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('LE SANCTUAIRE', footerX + 80, footerY + 34);

        ctx.fillStyle = '#9FE2D3';
        ctx.font = 'bold 15px ui-monospace, SFMono-Regular, monospace';
        ctx.fillText('le-sanctuaire.pro', footerX + 80, footerY + 58);

        // QR Code Container on right
        const qrBoxSize = 58;
        const qrX = footerX + footerW - qrBoxSize - 18;
        const qrY = footerY + (footerH - qrBoxSize) / 2;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(qrX - 4, qrY - 4, qrBoxSize + 8, qrBoxSize + 8, 8);
        ctx.fill();
        ctx.drawImage(qrImg, qrX, qrY, qrBoxSize, qrBoxSize);

        ctx.fillStyle = '#E5E7EB';
        ctx.font = '600 12px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('Scannez pour accéder au site', qrX - 14, footerY + 35);
        ctx.fillStyle = '#34D399';
        ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        ctx.fillText('Coran, Prières & Outils', qrX - 14, footerY + 54);

        ctx.restore();
      } catch (err) {
        console.error('Error drawing QR code in template 1:', err);
      }

      return canvas;

    } else {
      // =========================================================================
      // TEMPLATE 2: MAKKAH CLOCK TOWER TEMPLATE
      // =========================================================================
      const bgImage = new Image();
      bgImage.crossOrigin = 'anonymous';
      bgImage.src = '/images/prayer_template_makkah.png';

      await new Promise((resolve, reject) => {
        if (bgImage.complete) resolve(true);
        else {
          bgImage.onload = () => resolve(true);
          bgImage.onerror = () => reject(new Error('Failed to load Makkah image'));
        }
      });

      const W = bgImage.naturalWidth || 1122;
      const H = bgImage.naturalHeight || 1402;
      canvas.width = W;
      canvas.height = H;

      // Draw background
      ctx.drawImage(bgImage, 0, 0, W, H);

      // White Container Area on Left
      ctx.save();
      ctx.shadowColor = 'rgba(10, 35, 20, 0.12)';
      ctx.shadowBlur = 35;
      ctx.shadowOffsetY = 15;

      const boxX = 64;
      const boxY = 110;
      const boxW = 530;
      const boxH = 1140;
      const radius = 28;

      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, radius);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = 'rgba(16, 85, 48, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, radius);
      ctx.stroke();
      ctx.restore();

      // Badge
      ctx.save();
      const badgeX = boxX + 30;
      const badgeY = boxY + 35;
      const badgeW = 280;
      const badgeH = 34;
      ctx.fillStyle = '#0F3E26';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 17);
      ctx.fill();

      ctx.fillStyle = '#FBBF24';
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

      ctx.fillStyle = '#106B3E';
      ctx.font = '600 16px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${selectedCity.country} • ${selectedCity.region || 'Afrique'}`, boxX + 30, boxY + 140);

      // Date Range
      ctx.fillStyle = '#4B5563';
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      if (viewMode === 'daily') {
        ctx.fillText(activeDay.dayName, boxX + 30, boxY + 170);
        ctx.fillStyle = '#D97706';
        ctx.font = '600 13px system-ui, -apple-system, sans-serif';
        ctx.fillText(activeDay.hijriFormatted, boxX + 30, boxY + 192);
      } else {
        ctx.fillText(schedule.weekRangeFormatted, boxX + 30, boxY + 170);
        ctx.fillStyle = '#D97706';
        ctx.font = '600 13px system-ui, -apple-system, sans-serif';
        ctx.fillText(`Semaine #${schedule.currentWeekNumber} • Calendrier Hégirien`, boxX + 30, boxY + 192);
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

      if (viewMode === 'daily') {
        const prayers = [
          { key: 'Fajr', primary: prayerNames.fajr.primary, ar: prayerNames.fajr.ar, time: activeDay.fajr, desc: prayerNames.fajr.sub, color: '#1E40AF', bg: '#EFF6FF' },
          { key: 'Shuruq', primary: prayerNames.shuruq.primary, ar: prayerNames.shuruq.ar, time: activeDay.shuruq, desc: prayerNames.shuruq.sub, color: '#B45309', bg: '#FEF3C7' },
          { key: 'Dhuhr', primary: prayerNames.dhuhr.primary, ar: prayerNames.dhuhr.ar, time: activeDay.dhuhr, desc: prayerNames.dhuhr.sub, color: '#047857', bg: '#ECFDF5' },
          { key: 'Asr', primary: prayerNames.asr.primary, ar: prayerNames.asr.ar, time: activeDay.asr, desc: prayerNames.asr.sub, color: '#C2410C', bg: '#FFF7ED' },
          { key: 'Maghrib', primary: prayerNames.maghrib.primary, ar: prayerNames.maghrib.ar, time: activeDay.maghrib, desc: prayerNames.maghrib.sub, color: '#BE123C', bg: '#FFF1F2' },
          { key: 'Isha', primary: prayerNames.isha.primary, ar: prayerNames.isha.ar, time: activeDay.isha, desc: prayerNames.isha.sub, color: '#4338CA', bg: '#EEF2FF' },
        ];

        const startY = boxY + 235;
        const rowHeight = 100;
        const rowGap = 16;

        prayers.forEach((p, idx) => {
          const ry = startY + idx * (rowHeight + rowGap);
          const rx = boxX + 30;
          const rw = boxW - 60;
          const rRadius = 18;

          ctx.save();
          ctx.fillStyle = p.bg;
          ctx.beginPath();
          ctx.roundRect(rx, ry, rw, rowHeight, rRadius);
          ctx.fill();

          ctx.strokeStyle = p.color + '33';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.rect(rx + 2, ry + 16, 5, rowHeight - 32);
          ctx.fill();

          ctx.fillStyle = '#062817';
          ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
          ctx.fillText(p.primary, rx + 24, ry + 38);

          ctx.fillStyle = '#6B7280';
          ctx.font = '500 13px system-ui, -apple-system, sans-serif';
          ctx.fillText(p.desc, rx + 24, ry + 68);

          ctx.fillStyle = p.color;
          ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(p.ar, rx + rw - 24, ry + 36);

          ctx.fillStyle = '#062817';
          ctx.font = 'bold 30px ui-monospace, SFMono-Regular, Menlo, monospace';
          ctx.fillText(p.time, rx + rw - 24, ry + 74);
          ctx.textAlign = 'left';
          ctx.restore();
        });

        // Bottom quote
        ctx.save();
        const quoteY = boxY + boxH - 120;
        ctx.fillStyle = '#0A3B22';
        ctx.font = 'italic 13px Georgia, serif';
        ctx.fillText('« La prière en son temps est la meilleure des œuvres auprès d’Allah. »', boxX + 30, quoteY);
        ctx.fillStyle = '#106B3E';
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.fillText('LE SANCTUAIRE • Horaires astronomiques exacts synchronisés', boxX + 30, quoteY + 24);
        ctx.restore();

      } else {
        const tableX = boxX + 24;
        const tableW = boxW - 48;
        const startY = boxY + 235;

        ctx.save();
        ctx.fillStyle = '#0F3E26';
        ctx.fillRect(tableX, startY, tableW, 40);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        ctx.fillText('JOUR', tableX + 12, startY + 25);
        ctx.fillText(useWolofNames ? 'SUBA' : 'FAJR', tableX + 100, startY + 25);
        ctx.fillText(useWolofNames ? 'TISBAR' : 'DHUHR', tableX + 172, startY + 25);
        ctx.fillText(useWolofNames ? 'TAKUSSAN' : 'ASR', tableX + 245, startY + 25);
        ctx.fillText(useWolofNames ? 'TIMIS' : 'MAGHRIB', tableX + 325, startY + 25);
        ctx.fillText(useWolofNames ? 'GUÉÉ' : 'ISHA', tableX + 415, startY + 25);
        ctx.restore();

        const rowH = 75;
        schedule.days.forEach((day, idx) => {
          const ry = startY + 40 + idx * rowH;
          ctx.save();
          ctx.fillStyle = idx % 2 === 0 ? '#FFFFFF' : '#F6F9F7';
          ctx.fillRect(tableX, ry, tableW, rowH);

          if (day.dayName.toLowerCase().startsWith('ven')) {
            ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
            ctx.fillRect(tableX, ry, tableW, rowH);
          }

          ctx.strokeStyle = 'rgba(16, 85, 48, 0.08)';
          ctx.lineWidth = 1;
          ctx.strokeRect(tableX, ry, tableW, rowH);

          ctx.fillStyle = '#062817';
          ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
          const shortDay = day.dayName.split(' ').slice(0, 2).join(' ');
          ctx.fillText(shortDay, tableX + 10, ry + 32);

          ctx.fillStyle = '#D97706';
          ctx.font = '500 10px system-ui, -apple-system, sans-serif';
          ctx.fillText(`Lev. ${day.shuruq}`, tableX + 10, ry + 52);

          ctx.fillStyle = '#111827';
          ctx.font = 'bold 15px ui-monospace, monospace';
          ctx.fillText(day.fajr, tableX + 100, ry + 42);
          ctx.fillText(day.dhuhr, tableX + 172, ry + 42);
          ctx.fillText(day.asr, tableX + 245, ry + 42);
          ctx.fillText(day.maghrib, tableX + 325, ry + 42);
          ctx.fillText(day.isha, tableX + 410, ry + 42);
          ctx.restore();
        });

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

      // Template 2 Bottom QR Code badge
      try {
        const qrDataUrl = await QRCode.toDataURL('https://le-sanctuaire.pro', {
          margin: 1,
          width: 120,
          color: { dark: '#062817', light: '#FFFFFF' },
        });
        const qrImg = new Image();
        qrImg.src = qrDataUrl;
        await new Promise((res) => {
          qrImg.onload = res;
          qrImg.onerror = res;
        });

        const qrBoxX = W - 260;
        const qrBoxY = H - 150;
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.strokeStyle = '#3EA08D';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(qrBoxX, qrBoxY, 210, 80, 16);
        ctx.fill();
        ctx.stroke();

        ctx.drawImage(qrImg, qrBoxX + 10, qrBoxY + 10, 60, 60);

        ctx.fillStyle = '#062817';
        ctx.font = '900 13px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('LE SANCTUAIRE', qrBoxX + 80, qrBoxY + 30);
        ctx.fillStyle = '#0D6846';
        ctx.font = 'bold 12px ui-monospace, monospace';
        ctx.fillText('le-sanctuaire.pro', qrBoxX + 80, qrBoxY + 48);
        ctx.fillStyle = '#6B7280';
        ctx.font = '600 10px system-ui, -apple-system, sans-serif';
        ctx.fillText('Scannez pour le site', qrBoxX + 80, qrBoxY + 64);
        ctx.restore();
      } catch (e) {
        // ignore
      }

      return canvas;
    }
  };

  const handleDownloadImage = async () => {
    try {
      setIsGeneratingImage(true);
      const canvas = await renderToCanvas();
      if (!canvas) throw new Error('Canvas rendering failed');

      const dataUrl = canvas.toDataURL('image/png', 0.95);
      const link = document.createElement('a');
      const filename = `Horaires_Priere_${selectedTemplate}_${selectedCity.name.replace(/\s+/g, '_')}_${viewMode === 'daily' ? activeDay.date : 'Semaine'}.png`;
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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      {/* Hidden high-res canvas used for crystal clear PNG export */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative w-full max-w-5xl bg-[#0D2418] border border-emerald-500/30 rounded-3xl shadow-2xl text-white overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#0A1A11] border-b border-emerald-500/25 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-neutral-950 font-black flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {selectedTemplate === 'salat' ? '1er Modèle : Grande Mosquée & Noms Sénégal' : '2e Modèle : Horloge Makkah'}
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

        {/* Modal Toolbar: Template Choice & Naming Options */}
        <div className="px-5 py-3 bg-[#0E2C1D] border-b border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          
          {/* Template Switcher (Grande Mosquée vs MAKKAH) */}
          <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-2xl border border-emerald-500/20">
            <button
              onClick={() => setSelectedTemplate('salat')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                selectedTemplate === 'salat'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>1. Grande Mosquée (Art)</span>
            </button>
            <button
              onClick={() => setSelectedTemplate('makkah')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                selectedTemplate === 'makkah'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2. Modèle Makkah</span>
            </button>
          </div>

          {/* Background Selector for Template 1 */}
          {selectedTemplate === 'salat' && (
            <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-2xl border border-emerald-500/20 overflow-x-auto max-w-full">
              <span className="text-[10px] uppercase font-bold text-amber-300/80 px-1.5 hidden md:inline">
                Fond :
              </span>
              {POSTER_ART_BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setSelectedArtBgId(bg.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                    selectedArtBgId === bg.id
                      ? 'bg-amber-400 text-neutral-950 shadow-xs'
                      : 'text-neutral-300 hover:text-white bg-white/5'
                  }`}
                >
                  <span>{bg.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Wolof / Sénégal Names Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-2xl border border-emerald-500/20">
            <button
              onClick={() => setUseWolofNames(true)}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                useWolofNames
                  ? 'bg-emerald-500 text-neutral-950 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Noms traditionnels sénégalais (Suba, Tisbar, Takussan, Timis, Guéé)"
            >
              🇸🇳 Suba, Tisbar, Takussan...
            </button>
            <button
              onClick={() => setUseWolofNames(false)}
              className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                !useWolofNames
                  ? 'bg-emerald-500 text-neutral-950 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Noms classiques (Fajr, Dhuhr, Asr, Maghrib, Isha)"
            >
              Fajr, Dhuhr, Asr...
            </button>
          </div>

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
              Journalier
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'weekly'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              Semaine
            </button>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Semaine précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-semibold text-emerald-200 px-1">
              {weekOffset === 0 ? 'Cette semaine' : weekOffset > 0 ? `+${weekOffset} sem.` : `${weekOffset} sem.`}
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

        {/* Modal Body: Interactive Poster Preview & Controls */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#09170E] flex flex-col lg:flex-row gap-6 items-center justify-center">
          
          {/* =========================================================================
              LIVE POSTER PREVIEW (EXACT FAITHFUL REPRESENTATION)
             ========================================================================= */}
          {selectedTemplate === 'salat' ? (
            /* TEMPLATE 1: ARTISTIC MOSQUE BACKGROUND WITH THE TEAL TABLE */
            <div
              className="relative w-full max-w-[420px] aspect-[1080/1440] rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/30 flex flex-col justify-between p-4 shrink-0 transition-all duration-300"
              style={{
                backgroundImage: `url(${currentArtBg.url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Vignette overlay on lower half to keep table readable while upper mosque & crescent are radiant */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#05130A]/95 via-[#081C10]/60 to-transparent pointer-events-none" />

              {/* Top brand badge */}
              <div className="relative z-10 self-center">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0A2016]/90 border border-amber-400/60 shadow-md text-[10px] font-black tracking-wider text-amber-300">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>LE SANCTUAIRE • HEURES DE PRIÈRE</span>
                </div>
              </div>

              {/* Center / Lower: Teal prayer table replica */}
              <div className="relative z-10 w-full bg-[#206E5D] border-2 border-[#398E7B] rounded-2xl shadow-2xl overflow-hidden text-white mt-auto mb-3">
                {/* Table Header */}
                <div className="p-2.5 bg-[#144D41]/80 border-b border-[#398E7B] flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-white leading-tight">
                      {selectedCity.name}
                    </h3>
                    <p className="text-[10px] text-teal-200 font-medium">
                      {activeDay.dayName} • {activeDay.hijriFormatted}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-amber-300">
                    {selectedCity.country}
                  </span>
                </div>

                {/* Table Rows (image_162546d6 style) */}
                {viewMode === 'daily' ? (
                  <div className="divide-y divide-[#398E7B]">
                    {[
                      { name: prayerNames.fajr.primary, sub: prayerNames.fajr.sub, time: activeDay.fajr },
                      { name: prayerNames.dhuhr.primary, sub: prayerNames.dhuhr.sub, time: activeDay.dhuhr },
                      { name: prayerNames.asr.primary, sub: prayerNames.asr.sub, time: activeDay.asr },
                      { name: prayerNames.maghrib.primary, sub: prayerNames.maghrib.sub, time: activeDay.maghrib },
                      { name: prayerNames.isha.primary, sub: prayerNames.isha.sub, time: activeDay.isha },
                    ].map((row) => (
                      <div key={row.name} className="grid grid-cols-12 items-center px-3 py-1.5">
                        <div className="col-span-7">
                          <span className="text-sm font-black block text-white">{row.name}</span>
                          <span className="text-[10px] text-teal-200/90 font-medium block">{row.sub}</span>
                        </div>
                        <div className="col-span-5 text-right border-l border-[#398E7B]/80 pl-2">
                          <span className="font-mono font-black text-sm text-white">
                            {row.time.replace(':', 'h ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-1.5 space-y-1 text-[9px]">
                    <div className="grid grid-cols-6 font-extrabold text-[8px] bg-[#144D41] text-amber-300 p-1 rounded text-center">
                      <span>JOUR</span>
                      <span>{useWolofNames ? 'SUB' : 'FAJ'}</span>
                      <span>{useWolofNames ? 'TIS' : 'DHU'}</span>
                      <span>{useWolofNames ? 'TAK' : 'ASR'}</span>
                      <span>{useWolofNames ? 'TIM' : 'MAG'}</span>
                      <span>{useWolofNames ? 'GUÉ' : 'ISH'}</span>
                    </div>
                    {schedule.days.map((day) => (
                      <div
                        key={day.date}
                        className="grid grid-cols-6 py-0.5 px-0.5 text-center font-bold border-b border-[#398E7B]/40 items-center"
                      >
                        <span className="truncate text-[8px] text-left font-black">{day.dayName.slice(0, 3)}</span>
                        <span className="font-mono">{day.fajr}</span>
                        <span className="font-mono">{day.dhuhr}</span>
                        <span className="font-mono">{day.asr}</span>
                        <span className="font-mono">{day.maghrib}</span>
                        <span className="font-mono">{day.isha}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Official Contact Bar */}
              <div className="relative z-10 w-full py-1.5 px-3 rounded-full bg-[#081A12]/95 border border-[#3EA08D] flex items-center justify-between text-[10px] font-bold text-amber-200 shadow-lg">
                <span>🌐 le-sanctuaire.pro</span>
                <span className="text-emerald-300">WhatsApp : 789139036</span>
              </div>
            </div>
          ) : (
            /* TEMPLATE 2: MAKKAH CLOCK TOWER TEMPLATE */
            <div
              className="relative w-full max-w-[420px] aspect-[1122/1402] rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/30 flex shrink-0"
              style={{
                backgroundImage: 'url(/images/prayer_template_makkah.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute left-[5.5%] top-[8%] w-[51%] bottom-[8%] bg-white/95 rounded-2xl shadow-xl p-3.5 sm:p-4 flex flex-col justify-between border border-emerald-900/15 overflow-hidden text-neutral-900">
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

                {viewMode === 'daily' ? (
                  <div className="space-y-1.5 py-1 flex-1 flex flex-col justify-center">
                    {[
                      { label: prayerNames.fajr.primary, time: activeDay.fajr, bg: 'bg-blue-50 text-blue-900', ar: prayerNames.fajr.ar },
                      { label: prayerNames.shuruq.primary, time: activeDay.shuruq, bg: 'bg-amber-50 text-amber-900', ar: prayerNames.shuruq.ar },
                      { label: prayerNames.dhuhr.primary, time: activeDay.dhuhr, bg: 'bg-emerald-50 text-emerald-900', ar: prayerNames.dhuhr.ar },
                      { label: prayerNames.asr.primary, time: activeDay.asr, bg: 'bg-orange-50 text-orange-900', ar: prayerNames.asr.ar },
                      { label: prayerNames.maghrib.primary, time: activeDay.maghrib, bg: 'bg-rose-50 text-rose-900', ar: prayerNames.maghrib.ar },
                      { label: prayerNames.isha.primary, time: activeDay.isha, bg: 'bg-indigo-50 text-indigo-900', ar: prayerNames.isha.ar },
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
                      <span>{useWolofNames ? 'SUB' : 'FAJ'}</span>
                      <span>{useWolofNames ? 'TIS' : 'DHU'}</span>
                      <span>{useWolofNames ? 'TAK' : 'ASR'}</span>
                      <span>{useWolofNames ? 'TIM' : 'MAG'}</span>
                      <span>{useWolofNames ? 'GUÉ' : 'ISH'}</span>
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

                <div className="pt-1.5 border-t border-emerald-700/20 text-[9px] text-emerald-900/80 font-medium leading-tight">
                  <p className="italic line-clamp-1">« La prière en son temps est la meilleure des œuvres. »</p>
                  <p className="font-bold text-[8px] text-emerald-700 mt-0.5">Le Sanctuaire • le-sanctuaire.pro</p>
                </div>
              </div>
            </div>
          )}

          {/* Right Action & Options Panel */}
          <div className="w-full lg:w-80 space-y-4 text-left">
            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Horaires 100% Automatisés</span>
              </span>
              <h3 className="text-xl font-black text-white">
                Prêt pour WhatsApp, Statut & Impression
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {selectedTemplate === 'salat'
                  ? 'Modèle artistique SALAT avec tableau vert d’eau et noms sénégalais authentiques (Suba, Tisbar, Takussan, Timis, Guéé).'
                  : 'Modèle officiel avec la Tour de l’Horloge de La Mecque et coordonnées de contact officielles.'}
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
