import React, { useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Sparkles,
  Check,
  Volume2,
  BookOpen,
  Sunrise,
  Sunset,
  Moon,
  ShieldCheck,
} from 'lucide-react';
import { DHIKR_LIST } from '../data/islamicData';
import { DhikrItem } from '../types';
import { recordDhikrLogInSupabase } from '../lib/supabase';
import { getActiveUserEmail, formatDateKey } from '../utils/prayerTrackerUtils';

interface DhikrModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'tasbih' | 'invocations';
}

interface PropheticInvocation {
  id: string;
  category: 'matin' | 'soir' | 'apres_priere' | 'protection';
  title: string;
  arabic: string;
  phonetic: string;
  french: string;
  source: string;
  repetitions: number;
}

const PROPHETIC_INVOCATIONS: PropheticInvocation[] = [
  {
    id: 'sayyid-istighfar',
    category: 'matin',
    title: 'Sayyid Al-Istighfar (La Reine des Demandes de Pardon)',
    arabic:
      'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    phonetic:
      'Allahumma Anta Rabbi la ilaha illa Anta, khalaqtani wa ana abduka, wa ana ala ahdika wa wadika mastatatu, audhu bika min sharri ma sanatu, abuu laka binimatika alayya, wa abuu laka bidhanbi faghfir li fa innahu la yaghfirudh-dhunuba illa Anta.',
    french:
      '« Ô Allah, Tu es mon Seigneur, il n’y a de divinité que Toi. Tu m’as créé et je suis Ton serviteur. Je me tiens sur Ton pacte et Ta promesse autant que je le puis. Je cherche refuge auprès de Toi contre le mal que j’ai commis. Je reconnais Tes bienfaits sur moi et je reconnais mon péché. Pardonne-moi donc, car nul ne pardonne les péchés si ce n’est Toi. »',
    source: 'Rapporté par Al-Bukhari (6306) — Celui qui la dit le matin avec conviction fait partie des gens du Paradis.',
    repetitions: 1,
  },
  {
    id: 'matin-asbahna',
    category: 'matin',
    title: 'Invocation de l’aube (Asbahna wa asbahal-mulku lillah)',
    arabic:
      'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    phonetic:
      'Asbahna wa asbahal-mulku lillah, wal-hamdu lillah, la ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa Huwa ala kulli shay’in Qadir.',
    french:
      '« Nous voici au matin et le règne appartient à Allah. Louange à Allah. Il n’y a de divinité qu’Allah Seul, sans associé. À Lui la royauté, à Lui la louange et Il est Omnipotent. »',
    source: 'Rapporté par Muslim (2723)',
    repetitions: 1,
  },
  {
    id: 'matin-raditu',
    category: 'matin',
    title: 'Agrément d’Allah, de l’Islam et du Prophète ﷺ',
    arabic: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا',
    phonetic: 'Raditu billahi Rabban, wa bil-Islami dinan, wa bi-Muhammadin (ﷺ) nabiyyan.',
    french:
      '« J’agrée Allah comme Seigneur, l’Islam comme religion et Muhammad ﷺ comme Prophète. »',
    source: 'Authentifié — Allah se doit de le satisfaire au Jour de la Résurrection.',
    repetitions: 3,
  },
  {
    id: 'soir-amsayna',
    category: 'soir',
    title: 'Invocation du soir (Amsayna wa amsal-mulku lillah)',
    arabic:
      'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    phonetic:
      'Amsayna wa amsal-mulku lillah, wal-hamdu lillah, la ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa Huwa ala kulli shay’in Qadir.',
    french:
      '« Nous voici au soir et le règne appartient à Allah. Louange à Allah. Il n’y a de divinité qu’Allah Seul, sans associé. À Lui la royauté, à Lui la louange et Il est Omnipotent. »',
    source: 'Rapporté par Muslim (2723)',
    repetitions: 1,
  },
  {
    id: 'soir-bismillah-ladhi',
    category: 'soir',
    title: 'Protection contre tout mal terrestre et céleste',
    arabic:
      'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    phonetic:
      'Bismillahil-ladhi la yadurru ma’asmihi shay’un fil-ardi wa la fis-sama’i wa Huwas-Sami’ul-’Alim.',
    french:
      '« Au nom d’Allah avec le Nom Duquel rien sur terre ni dans le ciel ne peut nuire, et Il est l’Audient, l’Omniscient. »',
    source: 'Rapporté par Abu Dawud et At-Tirmidhi — Rien ne lui nuira.',
    repetitions: 3,
  },
  {
    id: 'apres-priere-salam',
    category: 'apres_priere',
    title: 'Après la salutation finale (Allahumma Antas-Salam)',
    arabic:
      'أَسْتَغْفِرُ اللَّهَ (ثَلَاثًا) اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    phonetic:
      'Astaghfirullah (3 fois). Allahumma Antas-Salam wa minkas-salam, tabarakta ya Dhal-Jalali wal-Ikram.',
    french:
      '« Je demande pardon à Allah (3 fois). Ô Allah, Tu es la Paix et la paix vient de Toi. Béni sois-Tu, ô Détenteur de la Majesté et de la Générosité. »',
    source: 'Rapporté par Muslim (591)',
    repetitions: 1,
  },
  {
    id: 'apres-priere-muadh',
    category: 'apres_priere',
    title: 'Recommandation du Prophète ﷺ à Mu’adh ibn Jabal',
    arabic: 'اللَّهُمَّ أَعِنِّي عَلَىٰ ذِكْرِكَ، وَشُكْرِكَ، وَحُسْنِ عِبَادَتِكَ',
    phonetic: 'Allahumma a’inni ala dhikrika, wa shukrika, wa husni ibadatik.',
    french:
      '« Ô Allah, aide-moi à T’évoquer, à Te remercier et à T’adorer de la meilleure manière. »',
    source: 'Rapporté par Abu Dawud (1522)',
    repetitions: 1,
  },
  {
    id: 'protection-ayat-kursi',
    category: 'protection',
    title: 'Verset du Trône (Ayat Al-Kursi — Sourate Al-Baqarah 2:255)',
    arabic:
      'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    phonetic:
      'Allahu la ilaha illa Huwal-Hayyul-Qayyum, la ta’khudhuhu sinatun wa la nawm, lahu ma fis-samawati wa ma fil-ard...',
    french:
      '« Allah ! Point de divinité à part Lui, le Vivant, Celui qui subsiste par Lui-même. Ni somnolence ni sommeil ne Le saisissent. À Lui appartient tout ce qui est dans les cieux et sur la terre... »',
    source: 'Al-Bukhari — Protection complète d’Allah jusqu’au matin et après chaque prière obligatoire.',
    repetitions: 1,
  },
  {
    id: 'protection-sommeil',
    category: 'protection',
    title: 'Invocation avant de dormir',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    phonetic: 'Bismika Allahumma amutu wa ahya.',
    french: '« C’est en Ton nom, ô Allah, que je meurs (m’endors) et que je vis. »',
    source: 'Rapporté par Al-Bukhari (6324)',
    repetitions: 1,
  },
];

export const DhikrModal: React.FC<DhikrModalProps> = ({ isOpen, onClose, initialTab }) => {
  const [activeView, setActiveView] = useState<'tasbih' | 'invocations'>(() => {
    if (initialTab) return initialTab;
    try {
      const saved = localStorage.getItem('sanctuaire_dhikr_initial_tab');
      if (saved === 'invocations' || saved === 'tasbih') return saved;
    } catch {
      // ignore
    }
    return 'tasbih';
  });

  const [selectedDhikr, setSelectedDhikr] = useState<DhikrItem>(DHIKR_LIST[0]);
  const [count, setCount] = useState<number>(0);
  const [totalCompleted, setTotalCompleted] = useState<number>(0);
  const [targetCount, setTargetCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sanctuaire_tasbih_target');
      const parsed = saved ? parseInt(saved, 10) : NaN;
      return !isNaN(parsed) && parsed >= 0 ? parsed : DHIKR_LIST[0].targetCount;
    } catch {
      return DHIKR_LIST[0].targetCount;
    }
  });
  const [customTargetInput, setCustomTargetInput] = useState<string>(() =>
    targetCount > 0 ? String(targetCount) : ''
  );

  // Invocations tab state
  const [selectedCategory, setSelectedCategory] = useState<
    'tous' | 'matin' | 'soir' | 'apres_priere' | 'protection'
  >('tous');
  const [invocationProgress, setInvocationProgress] = useState<Record<string, number>>({});
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('sanctuaire_dhikr_initial_tab');
        if (saved === 'invocations' || saved === 'tasbih') {
          setActiveView(saved);
        }
      } catch {
        // ignore
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleTabEvent = (e: Event) => {
      const custom = e as CustomEvent<'tasbih' | 'invocations'>;
      if (custom.detail === 'tasbih' || custom.detail === 'invocations') {
        setActiveView(custom.detail);
      }
    };
    window.addEventListener('sanctuaire-dhikr-tab', handleTabEvent);
    return () => window.removeEventListener('sanctuaire-dhikr-tab', handleTabEvent);
  }, []);

  if (!isOpen) return null;

  const isUnlimited = targetCount === 0;

  const applyNewTarget = (newTarget: number) => {
    const valid = Math.max(0, Math.min(999999, newTarget));
    setTargetCount(valid);
    setCustomTargetInput(valid > 0 ? String(valid) : '');
    setCount(0);
    try {
      localStorage.setItem('sanctuaire_tasbih_target', String(valid));
    } catch {
      // ignore
    }
  };

  const handleIncrement = () => {
    const todayStr = formatDateKey(new Date());
    const userId = getActiveUserEmail();

    if (!isUnlimited && count + 1 >= targetCount) {
      setCount(0);
      setTotalCompleted((prev) => prev + 1);
      recordDhikrLogInSupabase({
        userId,
        date: todayStr,
        dhikrPhrase: selectedDhikr.transliteration,
        count: targetCount,
        target: targetCount,
        completed: true,
      });
      try {
        const audioCtx = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = 650;
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch {
        // audio context ignored if blocked
      }
    } else {
      const nextCount = count + 1;
      setCount(nextCount);
      recordDhikrLogInSupabase({
        userId,
        date: todayStr,
        dhikrPhrase: selectedDhikr.transliteration,
        count: nextCount,
        target: isUnlimited ? nextCount : targetCount,
        completed: false,
      });
    }
  };

  const handleReset = () => {
    setCount(0);
    recordDhikrLogInSupabase({
      userId: getActiveUserEmail(),
      date: formatDateKey(new Date()),
      dhikrPhrase: selectedDhikr.transliteration,
      count: 0,
      target: targetCount,
      completed: false,
    });
  };

  const playArabicSpeech = (id: string, arabicText: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (playingId === id) {
      setPlayingId(null);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(arabicText);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.85;
    setPlayingId(id);
    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);
    window.speechSynthesis.speak(utterance);
  };

  const filteredInvocations =
    selectedCategory === 'tous'
      ? PROPHETIC_INVOCATIONS
      : PROPHETIC_INVOCATIONS.filter((item) => item.category === selectedCategory);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[92vh] bg-white dark:bg-[#193226] rounded-2xl sm:rounded-[32px] border border-neutral-200 dark:border-emerald-500/25 shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden transition-colors"
      >
        {/* Header with Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-8 py-3.5 sm:py-4 border-b border-neutral-200 dark:border-emerald-800/40 gap-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-bold text-neutral-900 dark:text-white truncate">
                  {activeView === 'invocations'
                    ? 'Citadelle du Croyant (Douas & Adhkar)'
                    : 'Chapelet Digital (Compteur Tasbih)'}
                </h2>
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-300 mt-0.5 font-medium truncate">
                {activeView === 'invocations'
                  ? 'Invocations prophétiques authentiques du matin, du soir et après la prière.'
                  : 'Compteur de Zikr interactif avec objectif de décompte libre.'}
              </p>
            </div>

            <button
              onClick={onClose}
              className="sm:hidden w-8 h-8 rounded-full bg-neutral-100 dark:bg-[#14281E] hover:bg-neutral-200 dark:hover:bg-[#102018] flex items-center justify-center text-neutral-800 dark:text-white transition cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* Switcher between the 2 distinct pages */}
            <div className="flex items-center p-1 rounded-full bg-neutral-100 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/25 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveView('invocations');
                  try {
                    localStorage.setItem('sanctuaire_dhikr_initial_tab', 'invocations');
                  } catch {
                    // ignore
                  }
                }}
                className={`px-3 py-1.5 rounded-full font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'invocations'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-neutral-600 dark:text-emerald-200/80 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Invocations & Douas</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveView('tasbih');
                  try {
                    localStorage.setItem('sanctuaire_dhikr_initial_tab', 'tasbih');
                  } catch {
                    // ignore
                  }
                }}
                className={`px-3 py-1.5 rounded-full font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'tasbih'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-neutral-600 dark:text-emerald-200/80 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <span>☪</span>
                <span>Compteur Tasbih</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="hidden sm:flex w-9 h-9 rounded-full bg-neutral-100 dark:bg-[#14281E] hover:bg-neutral-200 dark:hover:bg-[#102018] items-center justify-center text-neutral-800 dark:text-white transition cursor-pointer active:scale-95 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================
            VIEW 1: INVOCATIONS & DOUAS QUOTIDIENNES (Sparkles icon)
           ======================================================== */}
        {activeView === 'invocations' ? (
          <div className="p-4 sm:p-7 overflow-y-auto space-y-5 flex-1 no-scrollbar">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'tous' as const, label: 'Toutes les Douas', icon: BookOpen },
                { id: 'matin' as const, label: 'Matin (Sabah)', icon: Sunrise },
                { id: 'soir' as const, label: 'Soir (Masa’)', icon: Sunset },
                { id: 'apres_priere' as const, label: 'Après la Prière', icon: Sparkles },
                { id: 'protection' as const, label: 'Protection & Sommeil', icon: ShieldCheck },
              ].map((cat) => {
                const Icon = cat.icon;
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                      active
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-neutral-100 dark:bg-[#14281E] text-neutral-700 dark:text-emerald-200 border-neutral-200 dark:border-emerald-500/20 hover:bg-neutral-200 dark:hover:bg-[#1E3B2E]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Invocations Cards List */}
            <div className="space-y-4">
              {filteredInvocations.map((inv) => {
                const currentRep = invocationProgress[inv.id] || 0;
                const isDone = currentRep >= inv.repetitions;
                return (
                  <div
                    key={inv.id}
                    className={`rounded-2xl p-4 sm:p-5 border transition-all space-y-3 ${
                      isDone
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400/60'
                        : 'bg-neutral-50 dark:bg-[#14281E] border-neutral-200 dark:border-emerald-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-white">
                        {inv.title}
                      </h3>
                      <button
                        type="button"
                        onClick={() => playArabicSpeech(inv.id, inv.arabic)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
                          playingId === inv.id
                            ? 'bg-emerald-600 text-white animate-pulse'
                            : 'bg-white dark:bg-[#193226] text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-50'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{playingId === inv.id ? 'Lecture...' : 'Écouter'}</span>
                      </button>
                    </div>

                    <p
                      dir="rtl"
                      className="font-arabic text-lg sm:text-2xl text-emerald-950 dark:text-amber-200 leading-loose text-right bg-white dark:bg-[#193226] p-3.5 rounded-xl border border-neutral-200/70 dark:border-emerald-500/20"
                    >
                      {inv.arabic}
                    </p>

                    <p className="text-xs text-emerald-800 dark:text-emerald-300/90 font-semibold italic">
                      {inv.phonetic}
                    </p>

                    <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-200 leading-relaxed">
                      {inv.french}
                    </p>

                    <div className="pt-2 border-t border-neutral-200/80 dark:border-emerald-500/20 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-neutral-500 dark:text-emerald-300/70 font-medium">
                        {inv.source}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setInvocationProgress((prev) => {
                            const cur = prev[inv.id] || 0;
                            return {
                              ...prev,
                              [inv.id]: cur >= inv.repetitions ? 0 : cur + 1,
                            };
                          })
                        }
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                        }`}
                      >
                        {isDone ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Complété ({inv.repetitions}/{inv.repetitions})</span>
                          </>
                        ) : (
                          <span>
                            Réciter ({currentRep}/{inv.repetitions})
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ========================================================
              VIEW 2: CHAPELET DIGITAL / COMPTEUR TASBIH (☪ icon)
             ======================================================== */
          <div className="p-3.5 sm:p-8 overflow-y-auto space-y-4 sm:space-y-8 flex-1 no-scrollbar">
            {/* Interactive Digital Tasbih Counter Widget */}
            <div className="rounded-2xl sm:rounded-3xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 p-4 sm:p-8 flex flex-col items-center justify-center text-center relative">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-500/30 px-2.5 sm:px-3 py-0.5 rounded-full mb-1 sm:mb-2">
                Chapelet Digital
              </span>

              {/* Arabic selected formula */}
              <p className="font-arabic text-xl sm:text-3xl text-neutral-900 dark:text-white font-medium my-1 sm:my-2">
                {selectedDhikr.arabic}
              </p>
              <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                {selectedDhikr.transliteration}
              </p>
              <p className="text-[11px] sm:text-xs text-neutral-700 dark:text-neutral-300 italic mt-0.5 max-w-md font-medium">
                {selectedDhikr.translation}
              </p>

              {/* Free Target Number Selector (Presets + Free Input + Unlimited) */}
              <div className="mt-4 w-full max-w-md bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 rounded-2xl p-2.5 sm:p-3 shadow-2xs space-y-2">
                <div className="text-[11px] font-bold text-neutral-600 dark:text-emerald-200/90">
                  Nombre de décompte (libre au choix) :
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {[33, 99, 100, 500, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => applyNewTarget(preset)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        targetCount === preset
                          ? 'bg-emerald-700 text-white border-emerald-700 dark:bg-emerald-500 dark:text-neutral-950 dark:border-emerald-400 shadow-2xs'
                          : 'bg-neutral-100 dark:bg-[#14281E] text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-emerald-500/20 hover:bg-neutral-200 dark:hover:bg-[#1E3B2E]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => applyNewTarget(0)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      isUnlimited
                        ? 'bg-emerald-700 text-white border-emerald-700 dark:bg-emerald-500 dark:text-neutral-950 dark:border-emerald-400 shadow-2xs'
                        : 'bg-neutral-100 dark:bg-[#14281E] text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-emerald-500/20 hover:bg-neutral-200 dark:hover:bg-[#1E3B2E]'
                    }`}
                  >
                    Libre (∞)
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const parsed = parseInt(customTargetInput, 10);
                    if (!isNaN(parsed) && parsed > 0) {
                      applyNewTarget(parsed);
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 pt-0.5"
                >
                  <input
                    type="number"
                    min={1}
                    max={999999}
                    value={customTargetInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomTargetInput(val);
                      const parsed = parseInt(val, 10);
                      if (!isNaN(parsed) && parsed > 0) {
                        setTargetCount(Math.min(999999, parsed));
                        try {
                          localStorage.setItem(
                            'sanctuaire_tasbih_target',
                            String(Math.min(999999, parsed))
                          );
                        } catch {
                          // ignore
                        }
                      }
                    }}
                    placeholder="Autre nombre (ex: 70, 313...)"
                    className="w-44 sm:w-52 px-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/30 text-xs font-bold text-neutral-900 dark:text-white text-center focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shrink-0"
                  >
                    Choisir
                  </button>
                </form>
              </div>

              {/* Giant Circular Click Button */}
              <div className="mt-4 sm:mt-6 mb-3 sm:mb-4 relative">
                <button
                  onClick={handleIncrement}
                  className="w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white shadow-[0_12px_36px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center transition-transform transform active:scale-95 cursor-pointer select-none group border-4 border-white dark:border-emerald-950/60"
                >
                  <span className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                    {count}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-200 mt-1">
                    {isUnlimited ? 'MODE LIBRE (∞)' : `Sur ${targetCount}`}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-white/80 mt-0.5 sm:mt-1">
                    Appuyer
                  </span>
                </button>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 sm:gap-4 mt-1 sm:mt-2">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#193226] transition cursor-pointer border border-neutral-300 dark:border-emerald-500/30 bg-white dark:bg-[#14281E] active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                  <span>Réinitialiser</span>
                </button>

                {totalCompleted > 0 && (
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 px-2.5 sm:px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                    Complétées : {totalCompleted}
                  </span>
                )}
              </div>
            </div>

            {/* Adhkar Selector List */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-2 sm:mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Sélectionner une formule de Tasbih
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {DHIKR_LIST.map((item) => {
                  const isSelected = selectedDhikr.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedDhikr(item);
                        setCount(0);
                      }}
                      className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition cursor-pointer active:scale-98 ${
                        isSelected
                          ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-800 dark:border-emerald-600 shadow-xs ring-2 ring-purple-500'
                          : 'bg-white dark:bg-[#193226] border-neutral-200 dark:border-emerald-500/20 text-neutral-900 dark:text-white hover:border-emerald-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold">{item.transliteration}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-white/20 text-white border border-white/30'
                              : 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30'
                          }`}
                        >
                          {isUnlimited ? '∞' : `${targetCount}x`}
                        </span>
                      </div>
                      <p className="font-arabic text-lg my-1">{item.arabic}</p>
                      <p
                        className={`text-xs line-clamp-1 font-medium ${
                          isSelected
                            ? 'opacity-90 text-white'
                            : 'text-neutral-600 dark:text-neutral-300'
                        }`}
                      >
                        {item.translation}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
