import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Download,
  Bell,
  Check,
  Clock,
  Sparkles,
  Info,
  HelpCircle,
  Smartphone,
  Radio,
} from 'lucide-react';
import { CityData, PrayerTime } from '../types';

interface AdhanAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: CityData;
}

export interface AdhanTrack {
  id: string;
  name: string;
  location: string;
  muezzin: string;
  url: string;
  durationText: string;
  isFajrOnly?: boolean;
}

export const ADHAN_TRACKS: AdhanTrack[] = [
  {
    id: 'makkah',
    name: 'Adhan de La Mecque (Al-Haram)',
    location: 'Masjid Al-Haram, Makkah',
    muezzin: 'Sheikh Ali Ahmad Mullah',
    url: '/audio/adhan/adhan_makkah.mp3',
    durationText: '03:57',
  },
  {
    id: 'madinah',
    name: 'Adhan de Médine (An-Nabawi)',
    location: 'Masjid An-Nabawi, Médine',
    muezzin: 'Sheikh Surayhi',
    url: '/audio/adhan/adhan_madinah.mp3',
    durationText: '04:14',
  },
  {
    id: 'fajr_makkah',
    name: "Adhan de l'Aube (Fajr) La Mecque",
    location: 'Masjid Al-Haram, Makkah',
    muezzin: 'Sheikh Ali Mullah (avec « As-Salatu khayrun minan-nawm »)',
    url: '/audio/adhan/adhan_makkah_fajr.mp3',
    durationText: '04:02',
    isFajrOnly: true,
  },
];

export const AdhanAlertModal: React.FC<AdhanAlertModalProps> = ({
  isOpen,
  onClose,
  selectedCity,
}) => {
  // Alert Configuration State
  const [isAdhanAlertEnabled, setIsAdhanAlertEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sanctuaire_adhan_alert_enabled') === 'true';
    } catch {
      return false;
    }
  });

  const [alertTimingMinutes, setAlertTimingMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sanctuaire_adhan_alert_timing');
      return saved ? Number(saved) : 0; // 0 = exactly at prayer time, 5, 10, 15
    } catch {
      return 0;
    }
  });

  const [selectedAdhanId, setSelectedAdhanId] = useState<string>(() => {
    try {
      return localStorage.getItem('sanctuaire_selected_adhan') || 'makkah';
    } catch {
      return 'makkah';
    }
  });

  // Audio Player State
  const [playingAdhanId, setPlayingAdhanId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [showHowToGuide, setShowHowToGuide] = useState<boolean>(false);

  // Save settings
  const handleToggleAlert = () => {
    setIsAdhanAlertEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sanctuaire_adhan_alert_enabled', String(next));
      } catch {}
      return next;
    });
  };

  const handleSelectTiming = (mins: number) => {
    setAlertTimingMinutes(mins);
    try {
      localStorage.setItem('sanctuaire_adhan_alert_timing', String(mins));
    } catch {}
  };

  const handleSelectAdhan = (id: string) => {
    setSelectedAdhanId(id);
    try {
      localStorage.setItem('sanctuaire_selected_adhan', id);
    } catch {}
  };

  // Play audio
  const handleTogglePlay = (track: AdhanTrack) => {
    if (playingAdhanId === track.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingAdhanId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const audio = new Audio(track.url);
    audioPlayerRef.current = audio;
    audio.onended = () => setPlayingAdhanId(null);
    audio.onerror = () => setPlayingAdhanId(null);
    audio.play().then(() => {
      setPlayingAdhanId(track.id);
    }).catch(() => {
      setPlayingAdhanId(null);
    });
  };

  // Stop audio on close or unmount
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#06180E] border border-emerald-500/30 rounded-3xl p-6 shadow-2xl text-white space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Configuration de l'Adhan (الأذان)</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Alerte avant la prière & téléchargement gratuit des appels sacrés
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Toggle Alert Switch */}
        <div className="p-4 rounded-2xl bg-neutral-900/90 border border-emerald-500/25 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${isAdhanAlertEnabled ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-white/5 text-neutral-400 border-white/10'}`}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm block">Alerte Sonore & Notification Adhan</span>
              <span className="text-xs text-neutral-400">
                Fait retentir l'Adhan ou un signal pour {selectedCity.name}
              </span>
            </div>
          </div>

          <button
            onClick={handleToggleAlert}
            className={`w-14 h-8 rounded-full transition-colors relative cursor-pointer border ${
              isAdhanAlertEnabled ? 'bg-emerald-500 border-emerald-400' : 'bg-neutral-800 border-white/20'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform absolute top-0.5 ${
                isAdhanAlertEnabled ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* 2. Timing Options (Exact / 5m / 10m / 15m avant) */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
            Quand souhaitez-vous être prévenu ?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { mins: 0, label: "À l'heure exacte", sub: "Au moment de l'Adhan" },
              { mins: 5, label: '5 min avant', sub: 'Pour faire les ablutions' },
              { mins: 10, label: '10 min avant', sub: 'Pour se préparer' },
              { mins: 15, label: '15 min avant', sub: 'Pour rejoindre la mosquée' },
            ].map((opt) => {
              const isSel = alertTimingMinutes === opt.mins;
              return (
                <button
                  key={opt.mins}
                  onClick={() => handleSelectTiming(opt.mins)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    isSel
                      ? 'bg-amber-400 text-neutral-950 border-amber-300 font-bold shadow-md'
                      : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border-white/10'
                  }`}
                >
                  <span className="text-xs font-bold block">{opt.label}</span>
                  <span className={`text-[10px] ${isSel ? 'text-neutral-800' : 'text-neutral-400'}`}>
                    {opt.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Audio Tracks Collection (Play & Free Download) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
              Choix de la Récitation de l'Adhan
            </label>
            <span className="text-xs text-amber-400 font-bold">100% Gratuit & Libre</span>
          </div>

          <div className="space-y-2.5">
            {ADHAN_TRACKS.map((track) => {
              const isSelected = selectedAdhanId === track.id;
              const isPlaying = playingAdhanId === track.id;

              return (
                <div
                  key={track.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-neutral-900/90 border-amber-400/80 shadow-md'
                      : 'bg-neutral-900/50 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => handleTogglePlay(track)}
                      className="p-3 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 transition cursor-pointer shrink-0 shadow-sm"
                      title={isPlaying ? 'Pause' : 'Écouter'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-white truncate">
                          {track.name}
                        </span>
                        {track.isFajrOnly && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30 font-semibold">
                            Fajr
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 truncate">
                        {track.muezzin} • {track.durationText}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={track.url}
                      download={`${track.id}_adhan.mp3`}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-300 hover:text-white transition cursor-pointer"
                      title="Télécharger l'Adhan gratuitement (MP3)"
                    >
                      <Download className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => handleSelectAdhan(track.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm'
                          : 'bg-white/5 hover:bg-white/10 text-neutral-300 border-white/10'
                      }`}
                    >
                      {isSelected ? 'Sélectionné' : 'Choisir'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Educational Notice: How to get all Adhans for free on your phone */}
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
              <Smartphone className="w-4 h-4" />
              <span>Comment avoir tous les Adhans gratuitement sur son téléphone ?</span>
            </div>
            <button
              onClick={() => setShowHowToGuide((v) => !v)}
              className="text-xs text-amber-400 underline font-bold cursor-pointer"
            >
              {showHowToGuide ? 'Masquer' : 'Voir le guide'}
            </button>
          </div>

          {showHowToGuide && (
            <div className="pt-2 text-xs text-neutral-300 space-y-2 leading-relaxed animate-in fade-in">
              <p>
                <strong>1. Téléchargement direct :</strong> Cliquez sur l'icône de téléchargement verte <Download className="w-3.5 h-3.5 inline mx-1 text-emerald-300" /> à droite de chaque Adhan ci-dessus. Le fichier MP3 est instantanément enregistré sur votre appareil en haute qualité.
              </p>
              <p>
                <strong>2. Sur Android :</strong> Ouvrez l'application <em>Horloge / Réveil</em> de votre téléphone, modifiez l'alarme, touchez <em>Son de l'alarme</em>, puis sélectionnez le fichier MP3 téléchargé dans votre dossier Téléchargements.
              </p>
              <p>
                <strong>3. Sur iPhone (iOS) :</strong> Vous pouvez définir le fichier audio via GarageBand ou l'ajouter à vos sonneries iTunes gratuitement pour l'utiliser comme sonnerie ou réveil de l'aube.
              </p>
              <p>
                <strong>4. Dans Le Sanctuaire :</strong> En gardant cet onglet ouvert ou en l'installant comme application, le site vous préviendra automatiquement aux heures calculées pour votre ville ({selectedCity.name}).
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition cursor-pointer shadow-md"
          >
            Enregistrer mes Préférences
          </button>
        </div>
      </div>
    </div>
  );
};
