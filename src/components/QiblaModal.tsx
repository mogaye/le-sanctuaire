import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Compass,
  MapPin,
  Clock,
  Navigation,
  Sparkles,
  Volume2,
  VolumeX,
  ChevronRight,
  Settings2,
  CheckCircle2,
  Globe2,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  ShieldAlert,
} from 'lucide-react';
import { CityData, Method, PrayerTime } from '../types';
import { PRAYERS, CITIES } from '../data/islamicData';
import {
  calculatePrayerSchedule,
  getCityCurrentDate,
  formatTimeDigits,
  PrayerKey,
} from '../utils/timeUtils';
import { CitySelectorModal } from './CitySelectorModal';

interface QiblaModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: CityData;
  selectedMethod: Method;
  onSelectCity?: (city: CityData) => void;
  onOpenPrayerSettings?: () => void;
}

// Coordinates of the Holy Kaaba in Makkah Al-Mukarramah
const MAKKAH_LAT = 21.422487;
const MAKKAH_LNG = 39.826206;

/**
 * Calculates accurate Qibla bearing (in degrees, 0-360) from geographical coordinates
 * using spherical trigonometry (Great Circle bearing formula).
 */
function calculateTrueQibla(lat: number, lng: number): number {
  const phiK = (MAKKAH_LAT * Math.PI) / 180;
  const lambdaK = (MAKKAH_LNG * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  const lambda = (lng * Math.PI) / 180;
  const deltaLambda = lambdaK - lambda;

  const y = Math.sin(deltaLambda);
  const x = Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(deltaLambda);
  let qibla = (Math.atan2(y, x) * 180) / Math.PI;
  qibla = (qibla + 360) % 360;
  return Math.round(qibla * 10) / 10;
}

/**
 * Calculates Great Circle distance to Makkah in kilometers.
 */
function calculateDistanceToMakkah(lat: number, lng: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((MAKKAH_LAT - lat) * Math.PI) / 180;
  const dLon = ((MAKKAH_LNG - lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat * Math.PI) / 180) *
      Math.cos((MAKKAH_LAT * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Converts degree angle into a French cardinal direction string.
 */
function getCardinalDirectionFr(deg: number): string {
  const normalized = (deg + 360) % 360;
  const directions = [
    { label: 'Nord (N)', min: 348.75, max: 360 },
    { label: 'Nord (N)', min: 0, max: 11.25 },
    { label: 'Nord-Nord-Est (NNE)', min: 11.25, max: 33.75 },
    { label: 'Nord-Est (NE)', min: 33.75, max: 56.25 },
    { label: 'Est-Nord-Est (ENE)', min: 56.25, max: 78.75 },
    { label: 'Est (E)', min: 78.75, max: 101.25 },
    { label: 'Est-Sud-Est (ESE)', min: 101.25, max: 123.75 },
    { label: 'Sud-Est (SE)', min: 123.75, max: 146.25 },
    { label: 'Sud-Sud-Est (SSE)', min: 146.25, max: 168.75 },
    { label: 'Sud (S)', min: 168.75, max: 191.25 },
    { label: 'Sud-Sud-Ouest (SSO)', min: 191.25, max: 213.75 },
    { label: 'Sud-Ouest (SO)', min: 213.75, max: 236.25 },
    { label: 'Ouest-Sud-Ouest (OSO)', min: 236.25, max: 258.75 },
    { label: 'Ouest (O)', min: 258.75, max: 281.25 },
    { label: 'Ouest-Nord-Ouest (ONO)', min: 281.25, max: 303.75 },
    { label: 'Nord-Ouest (NO)', min: 303.75, max: 326.25 },
    { label: 'Nord-Nord-Ouest (NNO)', min: 326.25, max: 348.75 },
  ];

  for (const d of directions) {
    if (normalized >= d.min && normalized < d.max) {
      return d.label;
    }
  }
  return 'Nord-Est';
}

/**
 * Soft synthetic chime using Web Audio API when user aligns with Kaaba
 */
function playAlignmentChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, ctx.currentTime); // 528 Hz pleasant harmonic
    osc.frequency.exponentialRampToValueAtTime(792, ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.55);
  } catch {
    // AudioContext blocked or not supported - silently ignore
  }
}

export const QiblaModal: React.FC<QiblaModalProps> = ({
  isOpen,
  onClose,
  selectedCity,
  selectedMethod,
  onSelectCity,
  onOpenPrayerSettings,
}) => {
  // Device compass state
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [hasSensor, setHasSensor] = useState<boolean>(false);
  const [sensorPermission, setSensorPermission] = useState<
    'granted' | 'denied' | 'prompt' | 'unsupported'
  >('prompt');
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isCityModalOpen, setIsCityModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'compass' | 'prayers'>('compass');

  // Drag interaction for manual rotation on desktop
  const isDraggingRef = useRef<boolean>(false);
  const compassCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dialRef = useRef<HTMLDivElement>(null);
  const prevAlignedRef = useRef<boolean>(false);

  // Compute exact Qibla angle from coordinates if available, or fallback to city data
  const trueQiblaAngle = useMemo(() => {
    if (selectedCity.latitude !== undefined && selectedCity.longitude !== undefined) {
      return calculateTrueQibla(selectedCity.latitude, selectedCity.longitude);
    }
    return selectedCity.qiblaAngle || 74;
  }, [selectedCity]);

  // Distance to Makkah in km
  const distanceKm = useMemo(() => {
    if (selectedCity.latitude !== undefined && selectedCity.longitude !== undefined) {
      return calculateDistanceToMakkah(selectedCity.latitude, selectedCity.longitude);
    }
    return 6050;
  }, [selectedCity]);

  const cardinalDirection = useMemo(() => {
    return getCardinalDirectionFr(trueQiblaAngle);
  }, [trueQiblaAngle]);

  // Live city clock
  const [cityDate, setCityDate] = useState<Date>(() => getCityCurrentDate(selectedCity.timezone));
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCityDate(getCityCurrentDate(selectedCity.timezone));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, selectedCity.timezone]);

  // Prayer schedule (current & next prayer)
  const prayerSchedule = useMemo(() => {
    try {
      return calculatePrayerSchedule(selectedCity.prayers, cityDate);
    } catch {
      return null;
    }
  }, [selectedCity.prayers, cityDate]);

  // Handle device orientation events (mobile gyro/compass)
  useEffect(() => {
    if (!isOpen || isManualMode) return;

    let mounted = true;

    // Check if DeviceOrientationEvent exists
    if (!window.DeviceOrientationEvent) {
      setSensorPermission('unsupported');
      setIsManualMode(true);
      return;
    }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (!mounted) return;

      let heading: number | null = null;

      // 1. iOS Safari webkitCompassHeading (0 = Magnetic North, clockwise)
      const iosEvent = e as unknown as { webkitCompassHeading?: number };
      if (typeof iosEvent.webkitCompassHeading === 'number' && !isNaN(iosEvent.webkitCompassHeading)) {
        heading = iosEvent.webkitCompassHeading;
      }
      // 2. Android / standard alpha
      else if (e.alpha !== null && typeof e.alpha === 'number' && !isNaN(e.alpha)) {
        if (e.absolute) {
          heading = (360 - e.alpha) % 360;
        } else {
          heading = (360 - e.alpha) % 360;
        }
      }

      if (heading !== null) {
        setHasSensor(true);
        setSensorPermission('granted');
        // Smooth heading updates
        setDeviceHeading(Math.round(heading * 10) / 10);
      }
    };

    // Try absolute orientation first (Android Chrome)
    const hasAbsolute = typeof (window as unknown as { ondeviceorientationabsolute?: unknown }).ondeviceorientationabsolute !== 'undefined';
    if (hasAbsolute) {
      window.addEventListener('deviceorientationabsolute' as unknown as keyof WindowEventMap, handleOrientation as EventListener, true);
    } else {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      mounted = false;
      if (hasAbsolute) {
        window.removeEventListener(
          'deviceorientationabsolute' as unknown as keyof WindowEventMap,
          handleOrientation as EventListener,
          true
        );
      }
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [isOpen, isManualMode]);

  // Request iOS permission explicitly on user gesture
  const requestCompassPermission = async () => {
    try {
      const DeviceOrientationEventAny = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };

      if (typeof DeviceOrientationEventAny.requestPermission === 'function') {
        const state = await DeviceOrientationEventAny.requestPermission();
        if (state === 'granted') {
          setSensorPermission('granted');
          setIsManualMode(false);
        } else {
          setSensorPermission('denied');
          setIsManualMode(true);
        }
      } else {
        // Non-iOS or permission already granted
        setSensorPermission('granted');
        setIsManualMode(false);
      }
    } catch {
      setSensorPermission('denied');
      setIsManualMode(true);
    }
  };

  // Difference between current heading and Qibla angle (-180 to +180)
  const angleDelta = useMemo(() => {
    const rawDiff = ((deviceHeading - trueQiblaAngle + 540) % 360) - 180;
    return Math.round(rawDiff * 10) / 10;
  }, [deviceHeading, trueQiblaAngle]);

  const isAligned = Math.abs(angleDelta) <= 4;

  // Trigger feedback when newly aligned
  useEffect(() => {
    if (isAligned && !prevAlignedRef.current) {
      if (soundEnabled) {
        playAlignmentChime();
      }
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([40, 60, 40]);
        } catch {
          // ignore vibration errors
        }
      }
    }
    prevAlignedRef.current = isAligned;
  }, [isAligned, soundEnabled]);

  // Mouse & Touch Dragging for interactive manual dial rotation
  const handleDialStart = (clientX: number, clientY: number) => {
    if (dialRef.current) {
      const rect = dialRef.current.getBoundingClientRect();
      compassCenterRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      isDraggingRef.current = true;
    }
  };

  const handleDialMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const dx = clientX - compassCenterRef.current.x;
    const dy = clientY - compassCenterRef.current.y;
    // Calculate angle from center (0 at top / North)
    let rad = Math.atan2(dx, -dy);
    let deg = (rad * 180) / Math.PI;
    deg = (deg + 360) % 360;
    setIsManualMode(true);
    setDeviceHeading(Math.round(deg));
  };

  const handleDialEnd = () => {
    isDraggingRef.current = false;
  };

  // Prayer card celestial icons
  const getPrayerIcon = (key: PrayerKey) => {
    switch (key) {
      case 'F':
        return <Sunrise className="w-4 h-4 text-amber-500" />;
      case 'D':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'A':
        return <Sun className="w-4 h-4 text-amber-600" />;
      case 'M':
        return <Sunset className="w-4 h-4 text-orange-500" />;
      case 'I':
        return <Moon className="w-4 h-4 text-indigo-400" />;
      default:
        return <Clock className="w-4 h-4 text-emerald-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/65 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] bg-gradient-to-b from-[#0F291E] via-[#143224] to-[#0A1F16] text-white rounded-3xl sm:rounded-[36px] border border-emerald-500/30 shadow-[0_25px_70px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* ========================================================
            MODAL TOP BAR
           ======================================================== */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-emerald-800/40 bg-[#0c2219]/90 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-amber-400/20 to-emerald-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
              <Compass className="w-5 h-5 animate-[spin_20s_linear_infinite]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                  Boussole Qibla & Horaires
                </h2>
                <span className="font-arabic text-xs sm:text-sm text-amber-300/90 hidden sm:inline">
                  القبلة ومواقيت الصلاة
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-200/70 truncate">
                <span>{selectedCity.name}, {selectedCity.country}</span>
                <span>•</span>
                <span className="font-mono text-[11px] font-bold text-amber-300">
                  {formatTimeDigits(cityDate, false)}
                </span>
                {selectedCity.utcOffset && (
                  <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-900/60 text-emerald-300 font-mono">
                    {selectedCity.utcOffset}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Audio Mute Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Désactiver le son d’alignement' : 'Activer le son d’alignement'}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-900/50 hover:bg-emerald-800/70 border border-emerald-700/40 flex items-center justify-center text-emerald-200 transition cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition cursor-pointer active:scale-95 shrink-0"
            >
              <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>

        {/* ========================================================
            SUB-HEADER: CITY SWITCHER & VIEW TABS
           ======================================================== */}
        <div className="px-4 sm:px-6 py-2.5 bg-black/25 border-b border-emerald-900/40 flex items-center justify-between gap-2 shrink-0 flex-wrap">
          {/* Clickable City Pill with Globe Icon */}
          <button
            type="button"
            onClick={() => setIsCityModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/50 hover:bg-emerald-800/60 border border-emerald-600/40 text-xs font-semibold text-emerald-100 transition cursor-pointer active:scale-95 group"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate max-w-[140px] sm:max-w-none">
              {selectedCity.name}, {selectedCity.country}
            </span>
            <span className="text-[10px] text-amber-300 font-bold underline decoration-amber-400/50 ml-0.5">
              Changer
            </span>
          </button>

          {/* Quick View Tabs */}
          <div className="flex items-center p-0.5 rounded-full bg-emerald-950/70 border border-emerald-800/50 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('compass')}
              className={`px-3 py-1 rounded-full font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'compass'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                  : 'text-emerald-300/80 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Boussole</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('prayers')}
              className={`px-3 py-1 rounded-full font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'prayers'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                  : 'text-emerald-300/80 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>5 Prières</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            MAIN SCROLLABLE CONTENT
           ======================================================== */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6 no-scrollbar">

          {/* ========================================================
              COMPASS SECTION
             ======================================================== */}
          {activeTab === 'compass' && (
            <div className="space-y-4">
              {/* Dynamic Status Alert / Guidance Banner */}
              <div
                className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 ${
                  isAligned
                    ? 'bg-emerald-500/20 border-amber-400/80 text-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
                    : 'bg-black/30 border-emerald-800/40 text-emerald-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                      isAligned
                        ? 'bg-amber-400 text-neutral-950 text-base shadow-lg animate-pulse'
                        : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                    }`}
                  >
                    {isAligned ? '🕋' : <Compass className="w-5 h-5 text-amber-300" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-extrabold flex items-center gap-1.5">
                      {isAligned ? (
                        <span className="text-amber-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                          PARFAITEMENT ALIGNÉ AVEC LA KAABA !
                        </span>
                      ) : (
                        <span>
                          {angleDelta > 0
                            ? `Tournez de ${Math.abs(Math.round(angleDelta))}° vers la gauche`
                            : `Tournez de ${Math.abs(Math.round(angleDelta))}° vers la droite`}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-emerald-200/70 truncate">
                      Angle Qibla : <strong className="text-white font-bold">{trueQiblaAngle}°</strong> ({cardinalDirection}) • Distance : {distanceKm.toLocaleString('fr-FR')} km
                    </p>
                  </div>
                </div>

                {/* Direct Alignment Button (for testing or manual alignment) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsManualMode(true);
                    setDeviceHeading(trueQiblaAngle);
                  }}
                  title="Aligner directement l'aiguille sur la Kaaba"
                  className="px-2.5 py-1 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 text-[11px] font-bold shrink-0 transition cursor-pointer active:scale-95"
                >
                  Aligner
                </button>
              </div>

              {/* Astrolabe Digital Compass Stage */}
              <div className="relative bg-gradient-to-b from-black/40 via-emerald-950/30 to-black/50 rounded-3xl border border-emerald-500/25 p-4 sm:p-8 flex flex-col items-center justify-center overflow-hidden">
                
                {/* Background Decorative Rings */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)] pointer-events-none" />
                
                {/* Compass Dial Container (supports touch/mouse drag for manual rotation) */}
                <div
                  ref={dialRef}
                  onMouseDown={(e) => handleDialStart(e.clientX, e.clientY)}
                  onMouseMove={(e) => handleDialMove(e.clientX, e.clientY)}
                  onMouseUp={handleDialEnd}
                  onTouchStart={(e) => {
                    if (e.touches[0]) handleDialStart(e.touches[0].clientX, e.touches[0].clientY);
                  }}
                  onTouchMove={(e) => {
                    if (e.touches[0]) handleDialMove(e.touches[0].clientX, e.touches[0].clientY);
                  }}
                  onTouchEnd={handleDialEnd}
                  className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full select-none cursor-grab active:cursor-grabbing touch-none flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-[#245239]/80 bg-[#0B1E16]"
                >
                  {/* Subtle Aligned Glow Ring */}
                  {isAligned && (
                    <div className="absolute -inset-3 rounded-full border-2 border-amber-400/80 animate-ping pointer-events-none opacity-40" />
                  )}

                  {/* 1. ROTATING COMPASS ROSE (Rotates with device heading) */}
                  <div
                    className="absolute inset-0 rounded-full transition-transform duration-200 ease-out"
                    style={{
                      transform: `rotate(${-deviceHeading}deg)`,
                    }}
                  >
                    {/* Dial Degree SVG with ticks every 5° and major ticks every 30° */}
                    <svg className="w-full h-full" viewBox="0 0 300 300">
                      <circle
                        cx="150"
                        cy="150"
                        r="142"
                        fill="none"
                        stroke="#1D4330"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="150"
                        cy="150"
                        r="128"
                        fill="none"
                        stroke="#2B5F45"
                        strokeWidth="1"
                        strokeDasharray="2,4"
                      />

                      {/* Graduations every 10 degrees */}
                      {Array.from({ length: 36 }).map((_, i) => {
                        const deg = i * 10;
                        const isMajor = deg % 30 === 0;
                        const isCardinal = deg % 90 === 0;
                        const tickLength = isCardinal ? 14 : isMajor ? 10 : 5;
                        const rOuter = 142;
                        const rInner = rOuter - tickLength;
                        const rad = ((deg - 90) * Math.PI) / 180;
                        const x1 = 150 + rOuter * Math.cos(rad);
                        const y1 = 150 + rOuter * Math.sin(rad);
                        const x2 = 150 + rInner * Math.cos(rad);
                        const y2 = 150 + rInner * Math.sin(rad);

                        return (
                          <line
                            key={deg}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={isCardinal ? '#F59E0B' : isMajor ? '#6EE7B7' : '#2A5C43'}
                            strokeWidth={isCardinal ? 2.5 : isMajor ? 1.5 : 1}
                          />
                        );
                      })}

                      {/* Degree Numbers every 30° */}
                      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
                        const rad = ((deg - 90) * Math.PI) / 180;
                        const r = 114;
                        const x = 150 + r * Math.cos(rad);
                        const y = 150 + r * Math.sin(rad) + 3;
                        return (
                          <text
                            key={deg}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            fontSize="8"
                            fill="#86EFAC"
                            fontFamily="monospace"
                            opacity="0.75"
                          >
                            {deg}°
                          </text>
                        );
                      })}
                    </svg>

                    {/* Cardinal Direction Points inside the dial */}
                    {/* NORTH (N) in high-contrast red */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                      <span className="text-xs font-black text-rose-500 tracking-wider">N</span>
                      <div className="w-1.5 h-1.5 bg-rose-500 rotate-45 mt-0.5" />
                    </div>
                    {/* EAST (E) */}
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      <span className="text-xs font-bold text-amber-300">E</span>
                    </div>
                    {/* SOUTH (S) */}
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2">
                      <span className="text-xs font-bold text-emerald-300">S</span>
                    </div>
                    {/* WEST (O / Ouest) */}
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                      <span className="text-xs font-bold text-emerald-300">O</span>
                    </div>

                    {/* Intercardinals */}
                    <span className="absolute top-9 right-9 text-[9px] font-bold text-emerald-500/70">NE</span>
                    <span className="absolute bottom-9 right-9 text-[9px] font-bold text-emerald-500/70">SE</span>
                    <span className="absolute bottom-9 left-9 text-[9px] font-bold text-emerald-500/70">SO</span>
                    <span className="absolute top-9 left-9 text-[9px] font-bold text-emerald-500/70">NO</span>

                    {/* Fixed Qibla Target Point on the Dial (True Bearing from North) */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        transform: `rotate(${trueQiblaAngle}deg)`,
                      }}
                    >
                      {/* Kaaba Marker icon at the outer rim */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center -translate-y-1">
                        <div className="relative group">
                          <div className="w-8 h-8 rounded-lg bg-neutral-950 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                            {/* SVG Kaaba illustration */}
                            <svg className="w-5 h-5 text-amber-300" viewBox="0 0 24 24" fill="currentColor">
                              <rect x="3" y="4" width="18" height="17" rx="1.5" fill="#171717" stroke="#F59E0B" strokeWidth="1.5" />
                              {/* Gold Kiswah Belt */}
                              <rect x="3" y="7.5" width="18" height="2.5" fill="#F59E0B" />
                              {/* Golden Door (Bab al-Kaaba) */}
                              <rect x="13" y="11.5" width="4" height="7" rx="0.5" fill="#F59E0B" stroke="#B45309" strokeWidth="0.5" />
                            </svg>
                          </div>
                          {/* Mini label */}
                          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[8px] font-bold px-1 rounded bg-amber-400 text-black whitespace-nowrap shadow-xs">
                            KAABA
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. CENTER NEEDLE: Points towards the Kaaba relative to device heading */}
                  <div
                    className="absolute w-full h-full flex items-center justify-center transition-transform duration-150 ease-out pointer-events-none"
                    style={{
                      transform: `rotate(${trueQiblaAngle - deviceHeading}deg)`,
                    }}
                  >
                    <div className="flex flex-col items-center -translate-y-6 sm:-translate-y-8">
                      {/* Vibrant pointer arrow directed towards Kaaba */}
                      <div className="relative">
                        <Navigation
                          className={`w-10 h-10 sm:w-12 sm:h-12 drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)] ${
                            isAligned
                              ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_16px_rgba(245,158,11,0.8)]'
                              : 'text-emerald-400 fill-emerald-500'
                          }`}
                        />
                      </div>
                      <div className="w-1 sm:w-1.5 h-14 sm:h-18 bg-gradient-to-b from-amber-400 via-emerald-400 to-transparent rounded-full opacity-80" />
                    </div>
                  </div>

                  {/* 3. Center Jewel / Pivot */}
                  <div className="absolute w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 via-emerald-700 to-neutral-900 border-2 border-amber-300 shadow-lg flex items-center justify-center z-10 pointer-events-none">
                    <div className="w-2 h-2 rounded-full bg-amber-200" />
                  </div>

                  {/* Fixed Smartphone Forward Direction Indicator (Top 12 o'clock notch) */}
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-3 bg-amber-400 [clip-path:polygon(50%_100%,0_0,100%_0)] pointer-events-none z-20 shadow-md" />
                </div>

                {/* Compass HUD info bar */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs">
                  <div className="px-3 py-1 rounded-xl bg-black/40 border border-emerald-800/50 flex items-center gap-1.5">
                    <span className="text-neutral-400 text-[11px]">Cap :</span>
                    <span className="font-mono font-bold text-amber-300 text-sm">
                      {deviceHeading}°
                    </span>
                  </div>

                  <div className="px-3 py-1 rounded-xl bg-black/40 border border-emerald-800/50 flex items-center gap-1.5">
                    <span className="text-neutral-400 text-[11px]">Qibla :</span>
                    <span className="font-mono font-bold text-emerald-300 text-sm">
                      {trueQiblaAngle}°
                    </span>
                  </div>

                  <div className="px-3 py-1 rounded-xl bg-black/40 border border-emerald-800/50 flex items-center gap-1.5">
                    <span className="text-neutral-400 text-[11px]">Écart :</span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        isAligned ? 'text-amber-400' : 'text-rose-400'
                      }`}
                    >
                      {Math.abs(Math.round(angleDelta))}°
                    </span>
                  </div>
                </div>

                {/* Sensor vs Manual Control Bar */}
                <div className="mt-3 flex items-center gap-2 text-xs">
                  {sensorPermission === 'prompt' && !hasSensor && (
                    <button
                      type="button"
                      onClick={requestCompassPermission}
                      className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Compass className="w-3.5 h-3.5 text-black" />
                      <span>Activer le gyroscope (Smartphone)</span>
                    </button>
                  )}

                  {hasSensor && !isManualMode && (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Capteur d'orientation actif
                    </span>
                  )}

                  {isManualMode && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-neutral-400">
                        Mode manuel : faites glisser la boussole
                      </span>
                      {hasSensor && (
                        <button
                          type="button"
                          onClick={() => setIsManualMode(false)}
                          className="px-2 py-0.5 rounded-md bg-emerald-800/60 hover:bg-emerald-700/70 text-[10px] text-emerald-200 cursor-pointer"
                        >
                          Repasser au capteur
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              PRAYER TIMES SECTION
             ======================================================== */}
          {(activeTab === 'prayers' || true) && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Horaires des 5 Prières d’Aujourd’hui
                </h3>

                {prayerSchedule && (
                  <span className="text-[11px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                    Prochaine : {prayerSchedule.nextPrayerKey} dans {prayerSchedule.hoursRemaining}h {prayerSchedule.minutesRemaining}m
                  </span>
                )}
              </div>

              {/* 5 Daily Prayer Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                {PRAYERS.map((prayer) => {
                  const time = selectedCity.prayers[prayer.key];
                  const isCurrent = prayerSchedule?.currentPrayerKey === prayer.key;
                  const isNext = prayerSchedule?.nextPrayerKey === prayer.key;

                  return (
                    <div
                      key={prayer.key}
                      className={`relative p-3.5 rounded-2xl border transition-all duration-200 text-center flex flex-col justify-between ${
                        isNext
                          ? 'bg-gradient-to-b from-amber-500/20 via-emerald-900/30 to-emerald-950/40 border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.2)] scale-[1.02]'
                          : isCurrent
                          ? 'bg-emerald-900/40 border-emerald-500/50 shadow-xs'
                          : 'bg-black/30 border-emerald-800/35 hover:border-emerald-700/60'
                      }`}
                    >
                      {/* Active / Next Badge */}
                      {isNext && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-amber-400 text-black text-[9px] font-black tracking-wider uppercase shadow-xs">
                          Prochaine
                        </div>
                      )}
                      {isCurrent && !isNext && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-emerald-500 text-black text-[9px] font-bold tracking-wider uppercase shadow-xs">
                          En cours
                        </div>
                      )}

                      <div className="flex items-center justify-between text-neutral-400 mb-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/90">
                          {prayer.name}
                        </div>
                        {getPrayerIcon(prayer.key)}
                      </div>

                      <div className="font-arabic text-sm text-amber-200/90 my-0.5">
                        {prayer.arabicName}
                      </div>

                      <div className="text-xl sm:text-2xl font-black text-white tracking-tight my-1 font-mono">
                        {time}
                      </div>

                      <div className="mt-1 flex items-center justify-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-200">
                          {prayer.rakats} Rakats
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================
              CALCULATION METHOD & ACCURACY FOOTER
             ======================================================== */}
          <div className="p-3.5 rounded-2xl bg-black/30 border border-emerald-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold text-white">Méthode de calcul :</span>{' '}
                <span className="text-emerald-200">{selectedMethod.fullName || selectedMethod.name}</span>
              </div>
            </div>

            {onOpenPrayerSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrayerSettings();
                }}
                className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-bold transition cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Ajuster les angles & offsets</span>
              </button>
            )}
          </div>
        </div>

        {/* City Selector Modal overlay */}
        {onSelectCity && (
          <CitySelectorModal
            isOpen={isCityModalOpen}
            onClose={() => setIsCityModalOpen(false)}
            selectedCity={selectedCity}
            onSelectCity={(city) => {
              onSelectCity(city);
              setIsCityModalOpen(false);
            }}
            cities={CITIES}
          />
        )}
      </div>
    </div>
  );
};
