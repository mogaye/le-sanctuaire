import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Home,
  Bookmark,
  BookOpen,
  Menu,
  Search,
  Check,
  Copy,
  Play,
  Pause,
  MoreHorizontal,
  Sparkles,
  Maximize2,
  X,
  Volume2,
  VolumeX,
  ChevronRight,
  ChevronLeft,
  Share2,
  SlidersHorizontal,
  RotateCcw,
  Repeat,
  Compass,
  ArrowLeft,
  ArrowRight,
  SkipForward,
  SkipBack,
  PanelLeftClose,
  PanelLeft,
  FileText,
  Info,
  Layers,
  BookText,
  Eye,
  Moon,
  Sun,
} from 'lucide-react';
import { CompleteSurahItem, ALL_114_SURAHS } from '../data/quranSurahs';
import { SURAH_ENGLISH_TITLES } from '../data/surahEnglishTitles';
import { RECITERS } from '../data/islamicData';
import { Reciter } from '../types';
import { BismillahCalligraphy } from './BismillahCalligraphy';
import { SurahHeaderBanner } from './SurahHeaderBanner';
import { SidebarAudioControl } from './SidebarAudioControl';
import { getTafsirForAyah, TafsirEntry } from '../data/quranTafsir';

interface AyahData {
  num: number;
  globalNum?: number;
  ar: string;
  tr: string;
  fr: string;
  en?: string;
}

interface FullSurahData {
  num: number;
  name: string;
  enName?: string;
  enMeaning?: string;
  arName: string;
  frName: string;
  rev: string;
  totalAyahs: number;
  ayahs: AyahData[];
}

interface QuranPageProps {
  currentUser?: { name: string; email: string } | null;
  onBackToHome: () => void;
  selectedReciter: Reciter;
  onSelectReciter: (reciter: Reciter) => void;
  initialSurahNumber?: number;
  onOpenPrayerPage?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

// EveryAyah CDN URLs for all reciters
function getAyahAudioUrl(surahNum: number, ayahNum: number, reciterId: string): string {
  const sPad = String(surahNum).padStart(3, '0');
  const aPad = String(ayahNum).padStart(3, '0');
  const file = `${sPad}${aPad}.mp3`;

  switch (reciterId) {
    case 'abdulbasit':
      return `https://everyayah.com/data/AbdulSamad_64kbps_QuranExplorer.Com/${file}`;
    case 'husary':
      return `https://everyayah.com/data/Husary_128kbps/${file}`;
    case 'ghamdi':
      return `https://everyayah.com/data/Ghamadi_40kbps/${file}`;
    case 'sudais':
      return `https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/${file}`;
    case 'minshawi':
      return `https://everyayah.com/data/Minshawy_Murattal_128kbps/${file}`;
    case 'muaiqly':
      return `https://everyayah.com/data/MaherAlMuaiqly128kbps/${file}`;
    case 'shatri':
      return `https://everyayah.com/data/Abu_Bakr_Ash-Shaatree_128kbps/${file}`;
    case 'rifai':
      return `https://everyayah.com/data/Hani_Rifai_192kbps/${file}`;
    case 'hudhaify':
      return `https://everyayah.com/data/Hudhaify_128kbps/${file}`;
    case 'dussary':
      return `https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/${file}`;
    case 'qatami':
      return `https://everyayah.com/data/Nasser_Alqatami_128kbps/${file}`;
    case 'jaber':
      return `https://everyayah.com/data/Ali_Jaber_64kbps/${file}`;
    case 'sowaid':
      return `https://everyayah.com/data/Ayman_Sowaid_64kbps/${file}`;
    case 'mishary':
    default:
      return `https://everyayah.com/data/Alafasy_128kbps/${file}`;
  }
}

// Full Surah recitation URLs for all reciters
function getSurahAudioUrl(surahNum: number, reciterId: string): string {
  const sPad = String(surahNum).padStart(3, '0');

  switch (reciterId) {
    case 'abdulbasit':
      return `https://download.quranicaudio.com/qdc/abdul_baset/murattal/${surahNum}.mp3`;
    case 'sudais':
      return `https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal/${surahNum}.mp3`;
    case 'husary':
      return `https://download.quranicaudio.com/qdc/khalil_al_husary/murattal/${surahNum}.mp3`;
    case 'minshawi':
      return `https://download.quranicaudio.com/qdc/siddiq_minshawi/murattal/${surahNum}.mp3`;
    case 'shatri':
      return `https://download.quranicaudio.com/qdc/abu_bakr_shatri/murattal/${surahNum}.mp3`;
    case 'rifai':
      return `https://download.quranicaudio.com/qdc/hani_ar_rifai/murattal/${surahNum}.mp3`;
    case 'ghamdi':
      return `https://download.quranicaudio.com/quran/sa3d_al-ghaamidi/complete/${sPad}.mp3`;
    case 'muaiqly':
      return `https://server12.mp3quran.net/maher/${sPad}.mp3`;
    case 'hudhaify':
      return `https://server9.mp3quran.net/hthfi/${sPad}.mp3`;
    case 'dussary':
      return `https://server11.mp3quran.net/yasser/${sPad}.mp3`;
    case 'qatami':
      return `https://server6.mp3quran.net/qtm/${sPad}.mp3`;
    case 'jaber':
      return `https://server11.mp3quran.net/a_jbr/${sPad}.mp3`;
    case 'sowaid':
      return `https://everyayah.com/data/Ayman_Sowaid_64kbps/${sPad}001.mp3`;
    case 'mishary':
    default:
      return `https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/${surahNum}.mp3`;
  }
}

export const QuranPage: React.FC<QuranPageProps> = ({
  currentUser,
  onBackToHome,
  selectedReciter,
  onSelectReciter,
  initialSurahNumber = 18,
  onOpenPrayerPage,
  isDarkMode,
  onToggleDarkMode,
}) => {
  // Navigation & Active Surah
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(() => {
    try {
      const savedLastRead = localStorage.getItem('quran_last_read_surah');
      if (savedLastRead && !initialSurahNumber) {
        return parseInt(savedLastRead, 10) || 18;
      }
    } catch {}
    return initialSurahNumber || 18;
  });

  const [sidebarTab, setSidebarTab] = useState<'Surah' | 'Verse' | 'Juz' | 'Page'>('Surah');
  const [searchQuery, setSearchQuery] = useState('');
  const [jumpAyahInput, setJumpAyahInput] = useState('');
  const [activeAyahNum, setActiveAyahNum] = useState<number>(1);

  // Reading Mode: 'verseByVerse' (study view) vs 'mushaf' (continuous page view)
  const [readingMode, setReadingMode] = useState<'verseByVerse' | 'mushaf'>('verseByVerse');

  // Background Theme: 'emeraldDark' (Sanctuaire Sombre) vs 'night' (Nuit Sereine) vs 'parchment' (Crème Ivoire) vs 'pureWhite'
  type QuranTheme = 'emeraldDark' | 'night' | 'parchment' | 'pureWhite';
  const [readingTheme, setReadingTheme] = useState<QuranTheme>(() => {
    if (isDarkMode !== undefined) {
      return isDarkMode ? 'emeraldDark' : 'pureWhite';
    }
    try {
      const saved = localStorage.getItem('quran_reading_theme');
      if (saved && ['emeraldDark', 'night', 'parchment', 'pureWhite'].includes(saved)) {
        return saved as QuranTheme;
      }
    } catch {
      // fallback
    }
    return 'emeraldDark'; // Mode Sombre Émeraude par défaut pour s'adapter au Sanctuaire
  });

  // Sync with global isDarkMode when toggled
  useEffect(() => {
    if (isDarkMode !== undefined) {
      if (!isDarkMode && (readingTheme === 'emeraldDark' || readingTheme === 'night')) {
        setReadingTheme('pureWhite');
      } else if (isDarkMode && (readingTheme === 'pureWhite' || readingTheme === 'parchment')) {
        setReadingTheme('emeraldDark');
      }
    }
  }, [isDarkMode]);

  const updateReadingTheme = (theme: QuranTheme) => {
    setReadingTheme(theme);
    try {
      localStorage.setItem('quran_reading_theme', theme);
    } catch {
      // ignore
    }
  };

  const isDark = readingTheme === 'emeraldDark' || readingTheme === 'night';

  const toggleDarkMode = () => {
    if (onToggleDarkMode) {
      onToggleDarkMode();
    }
    if (isDark) {
      updateReadingTheme('pureWhite');
    } else {
      updateReadingTheme('emeraldDark');
    }
  };

  // Language & View Preferences
  const [showArabic, setShowArabic] = useState<boolean>(true);
  const [showTransliteration, setShowTransliteration] = useState<boolean>(true);
  const [showFrench, setShowFrench] = useState<boolean>(true);
  const [showEnglish, setShowEnglish] = useState<boolean>(false);
  const [arabicFontSize, setArabicFontSize] = useState<number>(26); // px
  const [translationFontSize, setTranslationFontSize] = useState<number>(15); // px

  // Modals & Drawers
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeTafsir, setActiveTafsir] = useState<TafsirEntry | null>(null);

  // Sidebar Resizing & Collapse state
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('quran_sidebar_width');
      return saved ? Math.max(220, Math.min(600, parseInt(saved, 10))) : 340;
    } catch {
      return 340;
    }
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('quran_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isResizing, setIsResizing] = useState(false);

  // Data fetching state
  const [currentSurahData, setCurrentSurahData] = useState<FullSurahData | null>(null);
  const [isLoadingSurah, setIsLoadingSurah] = useState<boolean>(false);

  // Audio Playback Engine
  const [audioSource, setAudioSource] = useState<'surah' | 'ayah' | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [playingAyahNum, setPlayingAyahNum] = useState<number | null>(null);
  const [isAutoPlayNext, setIsAutoPlayNext] = useState<boolean>(true);
  const [repeatMode, setRepeatMode] = useState<'none' | '1x' | '3x' | 'loop'>('none');
  const [repeatCountCurrent, setRepeatCountCurrent] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Feedback states
  const [copiedAyahNum, setCopiedAyahNum] = useState<number | null>(null);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  // Bookmarks state persisted in localStorage
  const [bookmarkedVerses, setBookmarkedVerses] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('quran_bookmarked_verses');
      return saved ? JSON.parse(saved) : ['18:1', '18:10'];
    } catch {
      return ['18:1', '18:10'];
    }
  });

  // Last Read tracker
  const [lastReadAyah, setLastReadAyah] = useState<{ surah: number; ayah: number } | null>(() => {
    try {
      const s = localStorage.getItem('quran_last_read_surah');
      const a = localStorage.getItem('quran_last_read_ayah');
      if (s && a) {
        return { surah: parseInt(s, 10), ayah: parseInt(a, 10) };
      }
    } catch {}
    return null;
  });

  // Active surah metadata from 114 catalog
  const currentSurahMeta: CompleteSurahItem = useMemo(() => {
    return ALL_114_SURAHS.find((s) => s.number === selectedSurahNumber) || ALL_114_SURAHS[17];
  }, [selectedSurahNumber]);

  // English translation title info
  const englishInfo = useMemo(() => {
    return (
      SURAH_ENGLISH_TITLES[selectedSurahNumber] || {
        englishMeaning: currentSurahMeta.frenchTranslation,
        theme: 'serenity',
      }
    );
  }, [selectedSurahNumber, currentSurahMeta]);

  // Save last read upon surah or ayah view
  const saveLastRead = (surah: number, ayah: number) => {
    try {
      localStorage.setItem('quran_last_read_surah', String(surah));
      localStorage.setItem('quran_last_read_ayah', String(ayah));
      setLastReadAyah({ surah, ayah });
    } catch {}
  };

  // Stop any active audio
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingAudio(false);
    setPlayingAyahNum(null);
    setAudioSource(null);
  };

  // Auto-switch currently playing audio when reciter changes
  const prevReciterIdRef = useRef<string>(selectedReciter.id);
  useEffect(() => {
    if (prevReciterIdRef.current !== selectedReciter.id) {
      prevReciterIdRef.current = selectedReciter.id;
      // If audio was playing, switch to new reciter seamlessly
      if (isPlayingAudio && audioRef.current) {
        if (audioSource === 'ayah' && playingAyahNum) {
          audioRef.current.pause();
          const newUrl = getAyahAudioUrl(selectedSurahNumber, playingAyahNum, selectedReciter.id);
          const newAudio = new Audio(newUrl);
          audioRef.current = newAudio;
          newAudio.ontimeupdate = () => {
            setAudioProgress(newAudio.currentTime);
            setAudioDuration(newAudio.duration || 0);
          };
          newAudio.onended = () => {
            if (isAutoPlayNext && playingAyahNum < currentSurahMeta.numberOfAyahs) {
              const nextAyah = playingAyahNum + 1;
              jumpToAyah(nextAyah);
              playAyahAudio(nextAyah);
            } else {
              setIsPlayingAudio(false);
              setPlayingAyahNum(null);
              setAudioSource(null);
            }
          };
          newAudio.play().catch(() => setIsPlayingAudio(false));
        } else if (audioSource === 'surah') {
          audioRef.current.pause();
          const newUrl = getSurahAudioUrl(selectedSurahNumber, selectedReciter.id);
          const newAudio = new Audio(newUrl);
          audioRef.current = newAudio;
          newAudio.ontimeupdate = () => {
            setAudioProgress(newAudio.currentTime);
            setAudioDuration(newAudio.duration || 0);
          };
          newAudio.onended = () => {
            setIsPlayingAudio(false);
            setAudioSource(null);
            setAudioProgress(0);
          };
          newAudio.play().catch(() => setIsPlayingAudio(false));
        }
      }
    }
  }, [selectedReciter.id]);

  // Load the full text, phonetics and verses of the selected surah
  useEffect(() => {
    let isMounted = true;
    setIsLoadingSurah(true);
    stopAudio();
    setActiveAyahNum(1);

    // Cache key for session
    const cacheKey = `quran_surah_full_v3_${selectedSurahNumber}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.ayahs && parsed.ayahs.length > 0) {
          setCurrentSurahData(parsed);
          setIsLoadingSurah(false);
          saveLastRead(selectedSurahNumber, 1);
          return;
        }
      } catch (e) {}
    }

    const loadSurah = async () => {
      // 1. Try local JSON first if available
      try {
        const localRes = await fetch(`/data/surahs/${selectedSurahNumber}.json`);
        if (localRes.ok) {
          const localData: FullSurahData = await localRes.json();
          if (isMounted && localData && localData.ayahs && localData.ayahs.length > 0) {
            sessionStorage.setItem(cacheKey, JSON.stringify(localData));
            setCurrentSurahData(localData);
            setIsLoadingSurah(false);
            saveLastRead(selectedSurahNumber, 1);
            return;
          }
        }
      } catch (err) {}

      // 2. Fetch full authentic surah with Arabic + French + Transliteration + English
      try {
        const apiRes = await fetch(
          `https://api.alquran.cloud/v1/surah/${selectedSurahNumber}/editions/quran-uthmani,fr.hamidullah,en.transliteration,en.sahih`
        );
        if (apiRes.ok) {
          const apiJson = await apiRes.json();
          if (apiJson.code === 200 && Array.isArray(apiJson.data)) {
            const arSurah = apiJson.data[0];
            const frSurah = apiJson.data[1];
            const trSurah = apiJson.data[2];
            const enSurah = apiJson.data[3];

            const arAyahs = arSurah?.ayahs || [];
            const frAyahs = frSurah?.ayahs || [];
            const trAyahs = trSurah?.ayahs || [];
            const enAyahs = enSurah?.ayahs || [];

            const formattedAyahs: AyahData[] = arAyahs.map((item: any, idx: number) => ({
              num: item.numberInSurah || idx + 1,
              globalNum: item.number,
              ar: item.text,
              tr: trAyahs[idx]?.text || '',
              fr: frAyahs[idx]?.text || '',
              en: enAyahs[idx]?.text || '',
            }));

            const fullData: FullSurahData = {
              num: currentSurahMeta.number,
              name: currentSurahMeta.name,
              arName: arSurah.name || `سُورَةُ ${currentSurahMeta.arabicName}`,
              frName: currentSurahMeta.frenchTranslation,
              rev: currentSurahMeta.revelationType,
              totalAyahs: currentSurahMeta.numberOfAyahs,
              ayahs: formattedAyahs,
            };

            if (isMounted) {
              sessionStorage.setItem(cacheKey, JSON.stringify(fullData));
              setCurrentSurahData(fullData);
              setIsLoadingSurah(false);
              saveLastRead(selectedSurahNumber, 1);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('API fetch failed, falling back:', err);
      }

      // 3. Fallback
      if (isMounted) {
        setCurrentSurahData({
          num: currentSurahMeta.number,
          name: currentSurahMeta.name,
          arName: `سُورَةُ ${currentSurahMeta.arabicName}`,
          frName: currentSurahMeta.frenchTranslation,
          rev: currentSurahMeta.revelationType,
          totalAyahs: currentSurahMeta.numberOfAyahs,
          ayahs: [
            {
              num: 1,
              ar: currentSurahMeta.openingAyahArabic || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
              tr: 'Bismillaahir Rahmaanir Raheem',
              fr: currentSurahMeta.openingAyahFrench || "Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux.",
              en: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
            },
          ],
        });
        setIsLoadingSurah(false);
      }
    };

    loadSurah();

    return () => {
      isMounted = false;
    };
  }, [selectedSurahNumber, currentSurahMeta]);

  // Filtered list of 114 surahs for the sidebar
  const filteredSurahsList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return ALL_114_SURAHS;

    return ALL_114_SURAHS.filter((s) => {
      const en = SURAH_ENGLISH_TITLES[s.number]?.englishMeaning?.toLowerCase() || '';
      return (
        s.number.toString() === q ||
        s.name.toLowerCase().includes(q) ||
        s.arabicName.includes(q) ||
        s.frenchTranslation.toLowerCase().includes(q) ||
        en.includes(q)
      );
    });
  }, [searchQuery]);

  // Jump to Ayah Handler
  const jumpToAyah = (target: string | number) => {
    const ayahNumber = typeof target === 'string' ? parseInt(target.trim(), 10) : target;
    if (isNaN(ayahNumber) || ayahNumber < 1) return;

    setActiveAyahNum(ayahNumber);
    saveLastRead(selectedSurahNumber, ayahNumber);
    
    const scrollToTarget = () => {
      const element = document.getElementById(`ayah-${ayahNumber}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    scrollToTarget();
    setTimeout(scrollToTarget, 60);
  };

  // Count of bookmarks in the currently selected Surah
  const currentSurahBookmarkedCount = useMemo(() => {
    const prefix = `${selectedSurahNumber}:`;
    return bookmarkedVerses.filter((k) => k.startsWith(prefix)).length;
  }, [bookmarkedVerses, selectedSurahNumber]);

  // Toggle Verse Bookmark
  const toggleBookmark = (ayahNum: number) => {
    const key = `${selectedSurahNumber}:${ayahNum}`;
    const updated = bookmarkedVerses.includes(key)
      ? bookmarkedVerses.filter((k) => k !== key)
      : [...bookmarkedVerses, key];

    setBookmarkedVerses(updated);
    try {
      localStorage.setItem('quran_bookmarked_verses', JSON.stringify(updated));
    } catch {}
  };

  // Copy Single Ayah
  const copyAyah = (ayah: AyahData) => {
    const parts: string[] = [];
    if (ayah.ar) parts.push(ayah.ar);
    if (ayah.tr) parts.push(`Prononciation : ${ayah.tr}`);
    if (ayah.fr) parts.push(`Traduction : ${ayah.fr}`);

    const text = `${parts.join('\n\n')}\n\n[Sourate ${currentSurahMeta.name} (${currentSurahMeta.arabicName}) - Verset ${selectedSurahNumber}:${ayah.num}]`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAyahNum(ayah.num);
      setCopiedNotice(`Verset ${selectedSurahNumber}:${ayah.num} copié !`);
      setTimeout(() => {
        setCopiedAyahNum(null);
        setCopiedNotice(null);
      }, 2000);
    });
  };

  // Toggle Sidebar Collapse
  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('quran_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Start Resizing Sidebar with Mouse Drag
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Global mouse listeners for fluid sidebar resizing
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById('quran-main-card');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;

      if (relativeX < 170) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
        const clampedWidth = Math.max(220, Math.min(520, relativeX));
        setSidebarWidth(clampedWidth);
        try {
          localStorage.setItem('quran_sidebar_width', String(clampedWidth));
        } catch {}
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Audio Playback: Play single Ayah or continuous
  const playAyahAudio = (ayahNum: number) => {
    if (!currentSurahData) return;

    // If already playing this verse, pause/resume
    if (audioSource === 'ayah' && playingAyahNum === ayahNum && audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.play();
        setIsPlayingAudio(true);
        jumpToAyah(ayahNum);
      }
      return;
    }

    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const url = getAyahAudioUrl(selectedSurahNumber, ayahNum, selectedReciter.id);
    const audio = new Audio(url);
    audioRef.current = audio;
    setAudioSource('ayah');
    setPlayingAyahNum(ayahNum);
    setActiveAyahNum(ayahNum);
    saveLastRead(selectedSurahNumber, ayahNum);
    jumpToAyah(ayahNum);

    audio.ontimeupdate = () => {
      setAudioProgress(audio.currentTime);
      setAudioDuration(audio.duration || 0);
    };

    audio.onended = () => {
      // Check repeat mode first
      if (repeatMode === 'loop') {
        audio.currentTime = 0;
        audio.play();
        return;
      } else if (repeatMode === '1x' && repeatCountCurrent < 1) {
        setRepeatCountCurrent((c) => c + 1);
        audio.currentTime = 0;
        audio.play();
        return;
      } else if (repeatMode === '3x' && repeatCountCurrent < 3) {
        setRepeatCountCurrent((c) => c + 1);
        audio.currentTime = 0;
        audio.play();
        return;
      }

      setRepeatCountCurrent(0);

      // Auto play next verse
      if (isAutoPlayNext && ayahNum < currentSurahMeta.numberOfAyahs) {
        const nextAyah = ayahNum + 1;
        playAyahAudio(nextAyah);
      } else {
        setIsPlayingAudio(false);
        setPlayingAyahNum(null);
        setAudioSource(null);
      }
    };

    audio
      .play()
      .then(() => setIsPlayingAudio(true))
      .catch((err) => {
        console.warn('Ayah audio play error:', err);
        setIsPlayingAudio(false);
      });
  };

  // Full Surah Audio Recitation (synchronisé en continu avec le texte, défilement et halo glow)
  const toggleSurahAudio = () => {
    // 1. Si la lecture est en cours, mettre en pause
    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    // 2. Si la lecture était en pause sur un verset précis, reprendre
    if (!isPlayingAudio && audioRef.current && playingAyahNum) {
      audioRef.current
        .play()
        .then(() => {
          setIsPlayingAudio(true);
          jumpToAyah(playingAyahNum);
        })
        .catch(() => {
          playAyahAudio(playingAyahNum);
        });
      return;
    }

    // 3. Démarrer la récitation continue depuis le verset actif (ou verset 1)
    const targetAyah = playingAyahNum || activeAyahNum || 1;
    setIsAutoPlayNext(true);
    playAyahAudio(targetAyah);
  };

  // Previous Ayah in Audio Bar
  const handlePreviousAyah = () => {
    const current = playingAyahNum || activeAyahNum;
    if (current > 1) {
      const prev = current - 1;
      jumpToAyah(prev);
      playAyahAudio(prev);
    }
  };

  // Next Ayah in Audio Bar
  const handleNextAyah = () => {
    const current = playingAyahNum || activeAyahNum;
    if (current < currentSurahMeta.numberOfAyahs) {
      const next = current + 1;
      jumpToAyah(next);
      playAyahAudio(next);
    }
  };

  // Previous & Next Surah
  const handlePrevSurah = () => {
    if (selectedSurahNumber > 1) {
      setSelectedSurahNumber(selectedSurahNumber - 1);
    }
  };

  const handleNextSurah = () => {
    if (selectedSurahNumber < 114) {
      setSelectedSurahNumber(selectedSurahNumber + 1);
    }
  };

  // Open Tafsir for Ayah
  const openTafsirModal = (ayahNum: number) => {
    const tafsir = getTafsirForAyah(selectedSurahNumber, ayahNum, currentSurahMeta.name);
    setActiveTafsir(tafsir);
  };

  // Circled Ayah Number helper (matches ① ② ③ ④)
  const formatCircledAyah = (num: number) => {
    if (num >= 1 && num <= 20) {
      return String.fromCharCode(0x245f + num);
    }
    return `(${num})`;
  };

  // Background Theme Styling Classes
  const getThemeClasses = () => {
    switch (readingTheme) {
      case 'emeraldDark':
      default:
        return {
          bg: 'bg-[#14261C]',
          text: 'text-neutral-100',
          headerBg: 'bg-[#193226]/95 border-emerald-500/25',
          card: 'bg-[#193226] border-emerald-500/25',
          cardSub: 'bg-[#14281E] border-emerald-500/20',
          border: 'border-emerald-500/25',
          subtext: 'text-emerald-300/80',
          activeCard: 'bg-emerald-950/70 ring-1 ring-emerald-500/40',
          searchBg: 'bg-[#14281E] border-emerald-500/25 text-white placeholder-emerald-400/50',
          tabContainer: 'bg-[#14281E] text-neutral-300',
          tabActive: 'bg-emerald-800 text-white shadow-xs',
          tabInactive: 'text-neutral-300 hover:text-white',
          itemHover: 'hover:bg-[#14281E]',
          itemActive: 'bg-emerald-950/90 border border-emerald-500/40 text-white font-bold',
          actionPill: 'bg-[#14281E] border-emerald-500/30 text-neutral-200',
          actionBtn: 'text-neutral-300 hover:text-white hover:bg-emerald-900/60',
          mushafFrame: 'border-amber-600/40 bg-[#14281E]/90 text-neutral-100',
          mushafCorners: 'border-amber-500/60',
          mushafText: 'text-neutral-100',
          mushafActive: 'bg-emerald-900/70 text-amber-200 ring-1 ring-emerald-400',
          mushafHover: 'hover:bg-emerald-950/60',
          translationText: 'text-neutral-200',
          phoneticText: 'text-emerald-300/90',
          englishText: 'text-neutral-400 border-emerald-500/30',
        };
      case 'night':
        return {
          bg: 'bg-[#12171E]',
          text: 'text-[#E2E8F0]',
          headerBg: 'bg-[#1A202C]/95 border-neutral-700/60',
          card: 'bg-[#1A202C] border-neutral-700/60',
          cardSub: 'bg-[#141A24] border-neutral-700/40',
          border: 'border-neutral-700/60',
          subtext: 'text-neutral-400',
          activeCard: 'bg-neutral-800/80 ring-1 ring-teal-500/40',
          searchBg: 'bg-[#141A24] border-neutral-700 text-white placeholder-neutral-500',
          tabContainer: 'bg-[#141A24] text-neutral-400',
          tabActive: 'bg-teal-700 text-white shadow-xs',
          tabInactive: 'text-neutral-400 hover:text-white',
          itemHover: 'hover:bg-[#141A24]',
          itemActive: 'bg-teal-950/90 border border-teal-500/40 text-white font-bold',
          actionPill: 'bg-[#141A24] border-neutral-700 text-neutral-200',
          actionBtn: 'text-neutral-300 hover:text-white hover:bg-neutral-800',
          mushafFrame: 'border-neutral-700 bg-[#141A24]/90 text-neutral-100',
          mushafCorners: 'border-teal-500/60',
          mushafText: 'text-neutral-100',
          mushafActive: 'bg-teal-900/70 text-teal-200 ring-1 ring-teal-400',
          mushafHover: 'hover:bg-neutral-800/60',
          translationText: 'text-neutral-200',
          phoneticText: 'text-teal-300/90',
          englishText: 'text-neutral-400 border-neutral-700',
        };
      case 'parchment':
        return {
          bg: 'bg-[#F9F7F1]',
          text: 'text-[#2D2A26]',
          headerBg: 'bg-[#FFFDF9]/95 border-[#E8E2D5]',
          card: 'bg-[#FFFDF9] border-[#E8E2D5]',
          cardSub: 'bg-[#F4EFE6] border-[#E8E2D5]',
          border: 'border-[#E8E2D5]',
          subtext: 'text-[#6D655A]',
          activeCard: 'bg-[#F3EFE6]/70 ring-1 ring-amber-600/30',
          searchBg: 'bg-[#F4EFE6] border-[#E8E2D5] text-[#2D2A26] placeholder-[#A0988A]',
          tabContainer: 'bg-[#EFE9DD] text-[#6D655A]',
          tabActive: 'bg-white text-[#2D2A26] shadow-xs',
          tabInactive: 'text-[#6D655A] hover:text-[#2D2A26]',
          itemHover: 'hover:bg-[#F3EFE6]',
          itemActive: 'bg-[#EFE8DA] border border-[#D8CEB8] text-[#2D2A26] font-bold',
          actionPill: 'bg-[#F3EFE6] border-[#E0D7C6] text-[#2D2A26]',
          actionBtn: 'text-[#6D655A] hover:text-[#2D2A26] hover:bg-[#EAE3D6]',
          mushafFrame: 'border-amber-800/30 bg-linear-to-b from-amber-50/30 via-[#FFFDF9] to-amber-50/20 text-[#2D2A26]',
          mushafCorners: 'border-amber-800/40',
          mushafText: 'text-[#2D2A26]',
          mushafActive: 'bg-amber-100 text-[#2D2A26] ring-1 ring-amber-400',
          mushafHover: 'hover:bg-amber-100/50',
          translationText: 'text-[#2D2A26]',
          phoneticText: 'text-[#7D6B58]',
          englishText: 'text-[#6D655A] border-[#E0D7C6]',
        };
      case 'pureWhite':
        return {
          bg: 'bg-white',
          text: 'text-[#1E293B]',
          headerBg: 'bg-white/95 border-neutral-200/80',
          card: 'bg-white border-neutral-200/80',
          cardSub: 'bg-[#F8FAFC] border-neutral-200/80',
          border: 'border-neutral-200/80',
          subtext: 'text-neutral-500',
          activeCard: 'bg-neutral-50/70 ring-1 ring-teal-500/30',
          searchBg: 'bg-neutral-50 border-neutral-200/90 text-neutral-800 placeholder-neutral-400',
          tabContainer: 'bg-neutral-100 text-neutral-500',
          tabActive: 'bg-white text-neutral-900 shadow-2xs font-semibold',
          tabInactive: 'text-neutral-500 hover:text-neutral-800',
          itemHover: 'hover:bg-neutral-50',
          itemActive: 'bg-teal-50 border border-teal-200/80 font-bold text-teal-950 shadow-2xs',
          actionPill: 'bg-[#F1F5F9] border-neutral-200/80 text-neutral-800',
          actionBtn: 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/70',
          mushafFrame: 'border-amber-800/30 bg-linear-to-b from-amber-50/20 via-white to-amber-50/10 text-neutral-900',
          mushafCorners: 'border-amber-800/40',
          mushafText: 'text-neutral-900',
          mushafActive: 'bg-teal-100 text-teal-950 ring-1 ring-teal-400',
          mushafHover: 'hover:bg-amber-100/50',
          translationText: 'text-neutral-800',
          phoneticText: 'text-stone-500',
          englishText: 'text-neutral-500 border-neutral-200',
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div
      id="quran-main-card"
      className={`min-h-screen w-full ${themeClasses.bg} ${themeClasses.text} flex flex-col font-sans antialiased selection:bg-teal-100 selection:text-teal-900 transition-colors duration-200`}
    >
      {/* Toast Notice */}
      {copiedNotice && (
        <div className="fixed top-6 right-6 z-50 bg-neutral-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 border border-neutral-700 animate-in fade-in slide-in-from-top-2">
          <Check className="w-3.5 h-3.5 text-teal-400" />
          <span>{copiedNotice}</span>
        </div>
      )}

      {/* ========================================================
          TOP NAVIGATION BAR
         ======================================================== */}
      <header
        className={`sticky top-0 z-30 w-full px-2.5 sm:px-6 md:px-8 py-2 sm:py-3 border-b ${themeClasses.border} flex items-center justify-between gap-1.5 sm:gap-4 ${themeClasses.headerBg} backdrop-blur-md select-none shadow-2xs transition-colors`}
      >
          {/* Left: Brand Name, Arabic Calligraphy, Sidebar Toggle & Reading Mode */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Desktop Sidebar Toggle Button */}
            <button
              onClick={toggleSidebarCollapse}
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer shrink-0 ${
                isSidebarCollapsed
                  ? isDark
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/80'
                    : 'bg-[#007A65]/10 text-[#007A65] border-[#007A65]/30 hover:bg-[#007A65]/20'
                  : isDark
                  ? 'text-emerald-300/80 hover:text-white bg-[#14281E] hover:bg-emerald-900/40 border-emerald-500/25'
                  : 'text-neutral-500 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200/80 border-neutral-200/80'
              }`}
              title={isSidebarCollapsed ? 'Afficher le panneau latéral' : 'Réduire le panneau latéral'}
            >
              {isSidebarCollapsed ? (
                <>
                  <PanelLeft className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-[#007A65]'}`} />
                  <span className="hidden xl:inline">Index des Sourates</span>
                  <span className="xl:hidden">Index</span>
                </>
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4" />
                  <span className="hidden xl:inline">Réduire</span>
                </>
              )}
            </button>

            {/* Mobile menu trigger button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className={`lg:hidden p-1.5 rounded-lg cursor-pointer shrink-0 ${
                isDark
                  ? 'bg-[#14281E] text-emerald-300 hover:bg-emerald-950'
                  : 'bg-neutral-100 text-neutral-700'
              }`}
              title="Menu des sourates"
            >
              <Menu className="w-4 h-4" />
            </button>

            <button
              onClick={onBackToHome}
              className={`flex items-baseline gap-1.5 text-lg sm:text-2xl font-bold tracking-tight hover:opacity-90 transition-opacity cursor-pointer group shrink-0 ${
                isDark ? 'text-emerald-400' : 'text-[#007A65]'
              }`}
            >
              <span>Quran</span>
              <span
                dir="rtl"
                className={`text-xs sm:text-sm font-serif font-semibold hidden md:inline transition-colors ${
                  isDark
                    ? 'text-amber-200/80 group-hover:text-amber-200'
                    : 'text-[#007A65]/70 group-hover:text-[#007A65]'
                }`}
                style={{ fontFamily: "'Amiri', serif" }}
              >
                القرآن الكريم
              </span>
            </button>

            {/* Reading Mode Switcher Pill */}
            <div
              className={`flex items-center rounded-xl p-0.5 text-[11px] sm:text-xs font-semibold border shrink-0 ml-0.5 sm:ml-1 ${
                isDark
                  ? 'bg-[#14281E] border-emerald-500/25 text-neutral-300'
                  : 'bg-neutral-100 border-neutral-200/60 text-neutral-600'
              }`}
            >
              <button
                onClick={() => setReadingMode('verseByVerse')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  readingMode === 'verseByVerse'
                    ? isDark
                      ? 'bg-emerald-800 text-white shadow-xs font-bold'
                      : 'bg-white text-teal-900 shadow-2xs font-bold'
                    : isDark
                    ? 'text-emerald-300/80 hover:text-white'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <BookText className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Étude & Traduction</span>
                <span className="sm:hidden">Étude</span>
              </button>
              <button
                onClick={() => setReadingMode('mushaf')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  readingMode === 'mushaf'
                    ? isDark
                      ? 'bg-emerald-800 text-white shadow-xs font-bold'
                      : 'bg-white text-teal-900 shadow-2xs font-bold'
                    : isDark
                    ? 'text-emerald-300/80 hover:text-white'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Page Mushaf</span>
                <span className="sm:hidden">Mushaf</span>
              </button>
            </div>
          </div>

          {/* Right: Quick Controls, Bookmarks, Dark Mode Adapter, Settings */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Last Read Quick Chip */}
            {lastReadAyah && (
              <button
                onClick={() => {
                  setSelectedSurahNumber(lastReadAyah.surah);
                  setTimeout(() => jumpToAyah(lastReadAyah.ayah), 200);
                }}
                className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer border ${
                  isDark
                    ? 'bg-[#14281E] border-emerald-500/30 text-amber-300 hover:bg-emerald-950'
                    : 'bg-teal-50 border-teal-200 text-[#007A65] hover:bg-teal-100'
                }`}
                title="Reprendre votre dernière lecture"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reprendre ({lastReadAyah.surah}:{lastReadAyah.ayah})</span>
              </button>
            )}

            {/* Dark Mode Adapter Quick Toggle Button */}
            <button
              onClick={toggleDarkMode}
              className={`p-1.5 sm:p-2 transition cursor-pointer rounded-lg border shrink-0 ${
                isDark
                  ? 'text-amber-300 hover:text-amber-200 hover:bg-[#14281E] border-emerald-500/30'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 border-neutral-200'
              }`}
              title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Home Icon */}
            <button
              onClick={onBackToHome}
              className={`hidden md:flex relative p-2 transition cursor-pointer flex-col items-center rounded-lg shrink-0 ${
                isDark
                  ? 'text-emerald-300/80 hover:text-white hover:bg-[#14281E]'
                  : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
              }`}
              title="Retour à l'accueil"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Bookmarks Icon */}
            <button
              onClick={() => setIsBookmarksModalOpen(true)}
              className={`relative p-1.5 sm:p-2 transition cursor-pointer rounded-lg shrink-0 ${
                isDark
                  ? 'text-emerald-300/80 hover:text-white hover:bg-[#14281E]'
                  : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
              }`}
              title="Marque-pages enregistrés"
            >
              <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
              {bookmarkedVerses.length > 0 && (
                <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 w-2 h-2 bg-[#007A65] rounded-full ring-2 ring-white" />
              )}
            </button>

            {/* Settings & Preferences Trigger */}
            <button
              onClick={() => setIsSettingsDrawerOpen(true)}
              className={`p-1.5 sm:p-2 transition cursor-pointer rounded-lg shrink-0 ${
                isDark
                  ? 'text-emerald-300/80 hover:text-white hover:bg-[#14281E]'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
              title="Préférences d'affichage et de récitation"
            >
              <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </header>

        {/* ========================================================
            MAIN BODY (2-COLUMN RESIZABLE SPLIT VIEW)
           ======================================================== */}
        <div className="flex-1 w-full flex flex-col lg:flex-row relative">
          
          {/* ========================================================
              LEFT SIDEBAR: Surahs Catalog, Search, Tabs & Juz Index
             ======================================================== */}
          <aside
            style={{
              width: isSidebarCollapsed ? '0px' : `${sidebarWidth}px`,
              minWidth: isSidebarCollapsed ? '0px' : '220px',
              maxWidth: isSidebarCollapsed ? '0px' : '520px',
            }}
            className={`shrink-0 border-r ${themeClasses.border} p-4 sm:p-5 flex flex-col gap-3.5 bg-inherit transition-all lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] lg:overflow-y-auto ${
              isResizing ? 'select-none transition-none' : 'duration-200 ease-in-out'
            } ${
              isSidebarCollapsed
                ? 'hidden overflow-hidden p-0 border-r-0'
                : isMobileSidebarOpen
                ? `fixed inset-0 z-40 p-5 flex flex-col overflow-y-auto ${isDark ? 'bg-[#193226] text-white' : 'bg-white'}`
                : 'hidden lg:flex'
            }`}
          >
            {/* Mobile Sidebar Close Button */}
            {isMobileSidebarOpen && (
              <div className={`lg:hidden flex items-center justify-between pb-3 border-b ${isDark ? 'border-emerald-500/20' : 'border-neutral-200'}`}>
                <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}>Index du Noble Coran</span>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={`p-1 rounded-md ${isDark ? 'text-emerald-300 hover:text-white' : 'text-neutral-500'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Sidebar Controls: Reciter switcher & Surah Play */}
            <SidebarAudioControl
              surah={currentSurahMeta}
              isPlayingAudio={isPlayingAudio}
              onToggleAudio={toggleSurahAudio}
              selectedReciter={selectedReciter}
              onSelectReciter={onSelectReciter}
              bookmarkedCount={currentSurahBookmarkedCount}
              isDark={isDark}
            />

            {/* Search Surah & Ayah no. Jump Bar */}
            <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${themeClasses.searchBg}`}>
              <div className="flex-1 flex items-center gap-1.5 min-w-0">
                <Search className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-emerald-400' : 'text-neutral-400'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une sourate..."
                  className="w-full bg-transparent text-xs placeholder-inherit focus:outline-hidden"
                />
              </div>

              <div className={`w-px h-4 ${isDark ? 'bg-emerald-500/30' : 'bg-neutral-200'}`} />

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  jumpToAyah(jumpAyahInput);
                }}
                className="flex items-center gap-1 shrink-0"
              >
                <input
                  type="number"
                  min={1}
                  max={currentSurahMeta.numberOfAyahs}
                  value={jumpAyahInput}
                  onChange={(e) => setJumpAyahInput(e.target.value)}
                  placeholder="Verset n°"
                  className="w-16 bg-transparent text-xs placeholder-inherit focus:outline-hidden text-right"
                />
                <button
                  type="submit"
                  className={`text-xs font-bold transition cursor-pointer pl-0.5 ${
                    isDark ? 'text-amber-300 hover:text-amber-200' : 'text-teal-700 hover:text-teal-900'
                  }`}
                  title="Aller au verset"
                >
                  →
                </button>
              </form>
            </div>

            {/* Segmented 4-Tab Control: Surah | Verse | Juz | Page */}
            <div className={`flex items-center p-1 rounded-xl text-xs font-semibold select-none ${themeClasses.tabContainer}`}>
              {(['Surah', 'Verse', 'Juz', 'Page'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSidebarTab(tab)}
                  className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                    sidebarTab === tab
                      ? themeClasses.tabActive
                      : themeClasses.tabInactive
                  }`}
                >
                  {tab === 'Surah' ? 'Sourate' : tab === 'Verse' ? 'Verset' : tab}
                </button>
              ))}
            </div>

            {/* Tab 1: Surah List (114 Surahs) */}
            {sidebarTab === 'Surah' && (
              <div className="flex-1 overflow-y-auto max-h-[480px] pr-1 space-y-0.5">
                {filteredSurahsList.map((s) => {
                  const isCurrent = s.number === selectedSurahNumber;

                  return (
                    <button
                      key={s.number}
                      onClick={() => {
                        setSelectedSurahNumber(s.number);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition cursor-pointer text-xs ${
                        isCurrent
                          ? themeClasses.itemActive
                          : themeClasses.itemHover
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-5 font-mono text-xs shrink-0 ${isDark ? 'text-emerald-400/70' : 'text-neutral-400'}`}>
                          {s.number}
                        </span>
                        <div className="truncate">
                          <span className={`font-semibold block truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                            {s.name}
                          </span>
                          <span className={`text-[10px] block truncate ${isDark ? 'text-emerald-300/70' : 'text-neutral-400'}`}>
                            {s.revelationType} • {s.numberOfAyahs} v.
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          dir="rtl"
                          className={`font-serif text-sm font-semibold block ${isDark ? 'text-amber-200' : 'text-neutral-800'}`}
                        >
                          {s.arabicName}
                        </span>
                        <span className={`text-[10px] block truncate max-w-[110px] ${isDark ? 'text-emerald-300/70' : 'text-neutral-400'}`}>
                          {s.frenchTranslation}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tab 2: Verse List for current Surah */}
            {sidebarTab === 'Verse' && (
              <div className="flex-1 overflow-y-auto max-h-[480px] pr-1 space-y-1">
                {currentSurahData?.ayahs.map((a) => (
                  <button
                    key={a.num}
                    onClick={() => {
                      jumpToAyah(a.num);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition cursor-pointer text-xs ${
                      activeAyahNum === a.num
                        ? themeClasses.itemActive
                        : themeClasses.itemHover
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={`w-5 font-mono text-xs ${isDark ? 'text-emerald-400/70' : 'text-neutral-400'}`}>{a.num}</span>
                      <span className={`text-xs truncate ${isDark ? 'text-neutral-200' : 'text-neutral-600'}`}>
                        {a.fr || a.en}
                      </span>
                    </div>
                    <span className={`font-serif text-sm font-normal shrink-0 ml-2 ${isDark ? 'text-amber-300' : 'text-neutral-500'}`}>
                      {formatCircledAyah(a.num)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Tab 3: Juz List (1 to 30) */}
            {sidebarTab === 'Juz' && (
              <div className="flex-1 overflow-y-auto max-h-[480px] pr-1 space-y-1">
                {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNum) => {
                  const surahOfJuz = ALL_114_SURAHS.find((s) => s.juz === juzNum);
                  return (
                    <button
                      key={juzNum}
                      onClick={() => {
                        if (surahOfJuz) {
                          setSelectedSurahNumber(surahOfJuz.number);
                        }
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition cursor-pointer text-xs ${themeClasses.itemHover}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-neutral-400'}`}>Juz {juzNum}</span>
                      </div>
                      <span className={`text-xs truncate max-w-[180px] ${isDark ? 'text-emerald-300/80' : 'text-neutral-500'}`}>
                        {juzNum === 30 ? 'Juz ‘Amma (78-114)' : surahOfJuz?.name ? `Sourate ${surahOfJuz.name}` : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tab 4: Madinah Mushaf Pages */}
            {sidebarTab === 'Page' && (
              <div className="flex-1 overflow-y-auto max-h-[480px] pr-1 p-2 grid grid-cols-4 gap-2 text-center text-xs">
                {Array.from({ length: 60 }, (_, i) => (i + 1) * 10).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => {
                      const approxSurah = Math.min(114, Math.max(1, Math.floor((pageNum / 604) * 114)));
                      setSelectedSurahNumber(approxSurah);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`p-2 rounded-lg border cursor-pointer font-mono ${
                      isDark
                        ? 'bg-[#14281E] border-emerald-500/25 text-neutral-200 hover:bg-emerald-950 hover:border-emerald-400/40'
                        : 'bg-neutral-50 hover:bg-teal-50 hover:border-teal-300 border-neutral-200 text-neutral-700'
                    }`}
                  >
                    p. {pageNum}
                  </button>
                ))}
              </div>
            )}
          </aside>

          {/* ========================================================
              RESIZABLE DRAG SPLITTER & QUICK COLLAPSE
             ======================================================== */}
          <div
            onMouseDown={startResizing}
            className={`hidden lg:flex relative group cursor-col-resize select-none shrink-0 items-center justify-center transition-colors z-20 ${
              isSidebarCollapsed
                ? isDark ? 'w-2 bg-[#14281E] hover:bg-emerald-500/20' : 'w-2 bg-neutral-100 hover:bg-[#007A65]/20'
                : 'w-1.5 hover:bg-[#007A65]/30'
            } ${isResizing ? 'bg-[#007A65]' : 'bg-transparent'}`}
            title="Glisser pour redimensionner ou double-cliquer pour réduire"
            onDoubleClick={toggleSidebarCollapse}
          >
            <div
              className={`w-px h-full transition-colors ${
                isResizing ? 'bg-[#007A65]' : isDark ? 'bg-emerald-500/20 group-hover:bg-emerald-400' : 'bg-neutral-200 group-hover:bg-[#007A65]'
              }`}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSidebarCollapse();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`sticky top-1/2 -translate-y-1/2 w-5 h-8 rounded-full border shadow-xs flex items-center justify-center cursor-pointer transition-all hover:scale-110 z-30 ${
                isDark
                  ? 'bg-[#193226] border-emerald-500/40 text-emerald-300 hover:border-emerald-300 hover:text-white'
                  : 'bg-white border-neutral-300 hover:border-[#007A65] hover:text-[#007A65] text-neutral-400'
              }`}
              title={isSidebarCollapsed ? 'Déplier le menu latéral' : 'Réduire le menu latéral'}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </button>
          </div>

          {/* ========================================================
              RIGHT READING CANVAS
             ======================================================== */}
          <main className="flex-1 min-w-0 p-4 sm:p-7 md:p-10 relative bg-inherit pb-32">
            
            {/* Surah Illuminated Cartouche Header */}
            <SurahHeaderBanner
              surah={currentSurahMeta}
              isPlayingAudio={isPlayingAudio}
              onToggleAudio={toggleSurahAudio}
              reciterName={selectedReciter.name}
              isDark={isDark}
            />

            {/* Centered Classic Bismillah Calligraphy (Shown for all except At-Tawbah 9) */}
            {selectedSurahNumber !== 9 && (
              <div className="mb-8 md:mb-12 flex justify-center text-center">
                <BismillahCalligraphy isDark={isDark} />
              </div>
            )}

            {/* Loading Indicator */}
            {isLoadingSurah && (
              <div className="py-24 flex flex-col items-center justify-center text-neutral-400">
                <div className="w-9 h-9 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs font-medium">Chargement des versets sacrés et de la phonétique...</p>
              </div>
            )}

            {/* ========================================================
                VIEW MODE 1: VERSE BY VERSE (Study, phonetics & translation)
               ======================================================== */}
            {!isLoadingSurah && currentSurahData && readingMode === 'verseByVerse' && (
              <div className="space-y-8 max-w-4xl mx-auto w-full pb-32">
                {currentSurahData.ayahs.map((ayah) => {
                  const isActive = activeAyahNum === ayah.num;
                  const isPlayingThis = audioSource === 'ayah' && playingAyahNum === ayah.num && isPlayingAudio;
                  const isBookmarked = bookmarkedVerses.includes(`${selectedSurahNumber}:${ayah.num}`);

                  return (
                    <article
                      key={ayah.num}
                      id={`ayah-${ayah.num}`}
                      onClick={() => {
                        setActiveAyahNum(ayah.num);
                        saveLastRead(selectedSurahNumber, ayah.num);
                      }}
                      className={`group transition-all duration-300 pt-3 pb-6 border-b ${themeClasses.border} relative rounded-2xl cursor-pointer ${
                        isPlayingThis
                          ? isDark
                            ? 'bg-emerald-900/40 ring-2 ring-emerald-400 border-emerald-400/40 -mx-4 px-4 shadow-[0_0_30px_rgba(16,185,129,0.25)]'
                            : 'bg-emerald-50/90 ring-2 ring-emerald-500 border-emerald-300 -mx-4 px-4 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
                          : isActive
                          ? isDark
                            ? 'bg-emerald-950/60 ring-1 ring-emerald-500/30 -mx-4 px-4 shadow-xs'
                            : `${themeClasses.activeCard} -mx-4 px-4`
                          : isDark
                          ? 'hover:bg-emerald-900/20 -mx-4 px-4'
                          : 'hover:bg-neutral-50/40 -mx-4 px-4'
                      }`}
                    >
                      {/* Barre d'outils d'action - Affichée UNIQUEMENT sur le verset sélectionné ou en cours d'écoute */}
                      {(isActive || isPlayingThis) && (
                        <div className="mb-3 flex items-center justify-between flex-wrap gap-2 animate-in fade-in duration-150">
                          {/* Reference Badge & Action Bar */}
                          <div className={`inline-flex items-center gap-2 border rounded-full px-3 py-1 shadow-2xs ${
                            isDark ? 'bg-[#14281E] border-emerald-500/30' : 'bg-[#F1F5F9] border-neutral-200/80'
                          }`}>
                            <div className="inline-flex items-center gap-1 bg-[#007A65] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>{selectedSurahNumber}:{ayah.num}</span>
                            </div>

                            {/* Action Buttons */}
                            {/* Play Verse Audio Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                playAyahAudio(ayah.num);
                              }}
                              className={`p-1.5 rounded-md transition cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                                isPlayingThis
                                  ? 'bg-teal-600 text-white'
                                  : isDark
                                  ? 'text-emerald-300 hover:text-white hover:bg-emerald-800/40'
                                  : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/70'
                              }`}
                              title={isPlayingThis ? 'Pause' : `Écouter par ${selectedReciter.name}`}
                            >
                              {isPlayingThis ? (
                                <Pause className="w-3.5 h-3.5 fill-current" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                              )}
                            </button>

                            {/* Copy Ayah */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyAyah(ayah);
                              }}
                              className={`p-1.5 rounded-md transition cursor-pointer ${
                                isDark
                                  ? 'text-emerald-300 hover:text-white hover:bg-emerald-800/40'
                                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/70'
                              }`}
                              title="Copier le verset complet"
                            >
                              {copiedAyahNum === ayah.num ? (
                                <Check className="w-3.5 h-3.5 text-teal-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Bookmark Ayah */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(ayah.num);
                              }}
                              className={`p-1.5 rounded-md transition cursor-pointer ${
                                isBookmarked
                                  ? isDark ? 'text-amber-300' : 'text-[#007A65]'
                                  : isDark
                                  ? 'text-emerald-300 hover:text-white hover:bg-emerald-800/40'
                                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/70'
                              }`}
                              title={isBookmarked ? 'Supprimer le marque-page' : 'Enregistrer ce verset'}
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                            </button>

                            {/* Tafsir / Explication du verset */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openTafsirModal(ayah.num);
                              }}
                              className={`p-1.5 rounded-md transition cursor-pointer ${
                                isDark
                                  ? 'text-emerald-300 hover:text-white hover:bg-emerald-800/40'
                                  : 'text-neutral-500 hover:text-teal-800 hover:bg-teal-50'
                              }`}
                              title="Exégèse & Sens du verset (Tafsir)"
                            >
                              <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-amber-300' : 'text-teal-600'}`} />
                            </button>
                          </div>

                          {/* Reciter indicator when playing */}
                          {isPlayingThis && (
                            <span className={`text-[11px] font-semibold animate-pulse flex items-center gap-1.5 ${
                              isDark ? 'text-amber-300' : 'text-teal-700'
                            }`}>
                              <Volume2 className="w-3.5 h-3.5" />
                              Récitation : {selectedReciter.name}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Indicateur discret si le verset est en favori mais non sélectionné */}
                      {!isActive && !isPlayingThis && isBookmarked && (
                        <div className="mb-2 flex items-center justify-end">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 select-none ${
                              isDark
                                ? 'text-amber-300 bg-amber-950/40 border border-amber-500/40'
                                : 'text-[#007A65] bg-teal-50/80 border border-teal-200/60'
                            }`}
                            title="Verset enregistré dans vos marque-pages"
                          >
                            <Bookmark className="w-3 h-3 fill-current" />
                            <span>Favori</span>
                          </span>
                        </div>
                      )}

                      {/* 1. Arabic Text (Right-aligned Uthmani Calligraphy) */}
                      {showArabic && (
                        <div className="w-full text-right mb-3.5">
                          <p
                            dir="rtl"
                            className="font-serif tracking-wide leading-[2.3] select-text"
                            style={{
                              fontFamily: "'Amiri', 'Traditional Arabic', serif",
                              fontSize: `${arabicFontSize}px`,
                            }}
                          >
                            {ayah.ar}
                            <span
                              className={`inline-flex items-center justify-center mx-2 text-sm font-sans select-none ${
                                isDark ? 'text-amber-300' : 'text-teal-700/80'
                              }`}
                              title={`Verset ${ayah.num}`}
                            >
                              {formatCircledAyah(ayah.num)}
                            </span>
                          </p>
                        </div>
                      )}

                      {/* 2. Transcription Phonétique */}
                      {showTransliteration && ayah.tr && (
                        <div className="mb-2">
                          <p className={`text-xs sm:text-[13.5px] italic leading-relaxed select-text font-serif ${
                            isDark ? 'text-emerald-300/80' : 'text-stone-500'
                          }`}>
                            {ayah.tr}
                          </p>
                        </div>
                      )}

                      {/* 3. Traduction Française */}
                      {showFrench && ayah.fr && (
                        <div
                          className="leading-relaxed select-text font-normal mb-1.5"
                          style={{ fontSize: `${translationFontSize}px` }}
                        >
                          <p className={isDark ? 'text-neutral-200' : 'text-neutral-800'}>{ayah.fr}</p>
                        </div>
                      )}

                      {/* 4. Traduction Anglaise (Optionnelle) */}
                      {showEnglish && ayah.en && (
                        <div className={`text-xs sm:text-[13.5px] leading-relaxed select-text font-normal border-l-2 pl-2.5 mt-1.5 ${
                          isDark ? 'text-neutral-400 border-emerald-500/40' : 'text-neutral-500 border-neutral-200'
                        }`}>
                          <p>{ayah.en}</p>
                        </div>
                      )}
                    </article>
                  );
                })}

                {/* Surah Navigation Footer (Previous / Next Surah) */}
                <div className={`pt-8 pb-12 flex items-center justify-between border-t gap-4 ${
                  isDark ? 'border-emerald-500/20' : 'border-neutral-200/80'
                }`}>
                  <button
                    onClick={handlePrevSurah}
                    disabled={selectedSurahNumber <= 1}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      selectedSurahNumber <= 1
                        ? 'opacity-40 cursor-not-allowed text-neutral-500 border-neutral-700'
                        : isDark
                        ? 'border-emerald-500/30 text-emerald-200 hover:bg-[#14281E]'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-800'
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Sourate précédente</span>
                  </button>

                  <div className="text-center hidden sm:block">
                    <span className={`text-xs font-medium ${isDark ? 'text-emerald-400/60' : 'text-neutral-400'}`}>
                      Fin de la sourate {currentSurahMeta.name} ({currentSurahMeta.numberOfAyahs} versets)
                    </span>
                  </div>

                  <button
                    onClick={handleNextSurah}
                    disabled={selectedSurahNumber >= 114}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedSurahNumber >= 114
                        ? 'opacity-40 cursor-not-allowed text-neutral-500 border border-neutral-700'
                        : 'bg-[#007A65] text-white hover:bg-teal-700 shadow-xs'
                    }`}
                  >
                    <span>Sourate suivante</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================
                VIEW MODE 2: MUSHAF CONTINU (Continuous Arabic Layout)
               ======================================================== */}
            {!isLoadingSurah && currentSurahData && readingMode === 'mushaf' && (
              <div className="max-w-4xl mx-auto w-full pb-32">
                {/* Traditional Border Frame */}
                <div className={`p-6 sm:p-10 border-2 rounded-3xl shadow-xs relative ${
                  isDark
                    ? 'border-emerald-500/35 bg-[#14281E]/70 text-white'
                    : 'border-amber-800/30 bg-linear-to-b from-amber-50/20 via-white to-amber-50/10'
                }`}>
                  
                  {/* Decorative Frame Corners */}
                  <div className={`absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 rounded-tl-sm ${isDark ? 'border-emerald-400/50' : 'border-amber-800/40'}`} />
                  <div className={`absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 rounded-tr-sm ${isDark ? 'border-emerald-400/50' : 'border-amber-800/40'}`} />
                  <div className={`absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 rounded-bl-sm ${isDark ? 'border-emerald-400/50' : 'border-amber-800/40'}`} />
                  <div className={`absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 rounded-br-sm ${isDark ? 'border-emerald-400/50' : 'border-amber-800/40'}`} />

                  {/* Flowing justified Arabic text */}
                  <div
                    dir="rtl"
                    className={`text-justify font-serif leading-[2.6] select-text ${isDark ? 'text-neutral-100' : 'text-neutral-900'}`}
                    style={{
                      fontFamily: "'Amiri', 'Traditional Arabic', serif",
                      fontSize: `${arabicFontSize + 4}px`,
                    }}
                  >
                    {currentSurahData.ayahs.map((ayah) => {
                      const isPlayingThis = audioSource === 'ayah' && playingAyahNum === ayah.num && isPlayingAudio;
                      const isActive = activeAyahNum === ayah.num;

                      return (
                        <span
                          key={ayah.num}
                          id={`ayah-${ayah.num}`}
                          onClick={() => {
                            setActiveAyahNum(ayah.num);
                            playAyahAudio(ayah.num);
                          }}
                          className={`inline rounded-lg cursor-pointer transition-all duration-300 px-1 py-0.5 mx-0.5 ${
                            isPlayingThis
                              ? isDark
                                ? 'bg-emerald-800/80 text-white font-semibold ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                                : 'bg-emerald-200 text-emerald-950 font-semibold ring-2 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                              : isActive
                              ? isDark
                                ? 'bg-[#193226] text-amber-200'
                                : 'bg-neutral-100 text-neutral-900'
                              : isDark
                              ? 'hover:bg-emerald-900/40'
                              : 'hover:bg-amber-100/50'
                          }`}
                          title={`Verset ${ayah.num} : Cliquez pour écouter`}
                        >
                          {ayah.ar}
                          <span className={`inline-flex items-center justify-center mx-1.5 font-sans font-bold text-xs select-none ${
                            isDark ? 'text-amber-300' : 'text-amber-700/80'
                          }`}>
                            {formatCircledAyah(ayah.num)}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Active Verse Quick Card in Mushaf Mode */}
                {activeAyahNum && currentSurahData.ayahs[activeAyahNum - 1] && (
                  <div className={`mt-8 p-5 rounded-2xl border shadow-sm space-y-3 animate-in fade-in ${
                    isDark
                      ? 'bg-[#14281E] border-emerald-500/30 text-white'
                      : 'bg-white border-neutral-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#007A65] text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                          Verset {selectedSurahNumber}:{activeAyahNum}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-emerald-300/80' : 'text-neutral-500'}`}>
                          {currentSurahMeta.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => playAyahAudio(activeAyahNum)}
                          className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                            isDark ? 'bg-emerald-800 text-white hover:bg-emerald-700' : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Écouter</span>
                        </button>
                        <button
                          onClick={() => copyAyah(currentSurahData.ayahs[activeAyahNum - 1])}
                          className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                            isDark ? 'bg-[#193226] text-neutral-300 hover:text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                          }`}
                          title="Copier"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openTafsirModal(activeAyahNum)}
                          className={`p-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                            isDark ? 'bg-amber-950/50 text-amber-300 hover:bg-amber-900/50' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                          }`}
                        >
                          Tafsir
                        </button>
                      </div>
                    </div>
                    {currentSurahData.ayahs[activeAyahNum - 1].tr && (
                      <p className={`text-xs italic font-serif ${isDark ? 'text-emerald-300/80' : 'text-stone-500'}`}>
                        {currentSurahData.ayahs[activeAyahNum - 1].tr}
                      </p>
                    )}
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                      {currentSurahData.ayahs[activeAyahNum - 1].fr}
                    </p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        {/* ========================================================
            DOCKED BOTTOM AUDIO PLAYER BAR (When audio is active)
           ======================================================== */}
        {(isPlayingAudio || audioSource !== null) && (
          <div className={`fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,8px))] md:bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t px-3 sm:px-8 py-2 sm:py-3 animate-in slide-in-from-bottom-2 ${
            isDark
              ? 'bg-[#102219]/95 border-emerald-500/25 text-white shadow-2xl'
              : 'bg-white/95 border-neutral-200 text-neutral-900 shadow-xl'
          }`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
              {/* Left info: Surah, Ayah & Reciter */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1 sm:flex-initial">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#007A65] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                </div>
                <div className="truncate min-w-0">
                  <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    {playingAyahNum
                      ? `S.${currentSurahMeta.number} • V.${playingAyahNum}/${currentSurahMeta.numberOfAyahs}`
                      : `Sourate ${currentSurahMeta.name}`}
                  </p>
                  <p className={`text-[10px] sm:text-[11px] font-semibold truncate ${isDark ? 'text-emerald-300' : 'text-teal-700'}`}>
                    {selectedReciter.name}
                  </p>
                </div>
              </div>

              {/* Center controls: Prev, Play/Pause, Next, Repeat */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-3 shrink-0">
                <button
                  onClick={handlePreviousAyah}
                  className={`p-1.5 transition cursor-pointer ${isDark ? 'text-emerald-300/80 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'}`}
                  title="Verset précédent"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleSurahAudio}
                  className="w-10 h-10 rounded-full bg-[#007A65] hover:bg-teal-700 text-white flex items-center justify-center shadow-md transition cursor-pointer"
                  title={isPlayingAudio ? 'Mettre en pause' : 'Reprendre la lecture'}
                >
                  {isPlayingAudio ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={handleNextAyah}
                  className={`p-1.5 transition cursor-pointer ${isDark ? 'text-emerald-300/80 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'}`}
                  title="Verset suivant"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                {/* Repeat Mode Toggle (for Hifdh) */}
                <button
                  onClick={() => {
                    const modes: ('none' | '1x' | '3x' | 'loop')[] = ['none', '1x', '3x', 'loop'];
                    const nextIndex = (modes.indexOf(repeatMode) + 1) % modes.length;
                    setRepeatMode(modes[nextIndex]);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                    repeatMode !== 'none'
                      ? isDark
                        ? 'bg-emerald-950 text-amber-300 border-emerald-500/40'
                        : 'bg-teal-50 text-teal-800 border-teal-300'
                      : isDark
                      ? 'bg-[#14281E] text-neutral-400 border-emerald-500/20'
                      : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                  }`}
                  title="Répétition pour la mémorisation"
                >
                  <Repeat className="w-3 h-3" />
                  <span>{repeatMode === 'none' ? '1x' : repeatMode}</span>
                </button>

                {/* Auto Play Next Toggle */}
                <button
                  onClick={() => setIsAutoPlayNext(!isAutoPlayNext)}
                  className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                    isAutoPlayNext
                      ? isDark
                        ? 'bg-emerald-950 text-amber-300 border-emerald-500/40'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : isDark
                      ? 'bg-[#14281E] text-neutral-400 border-emerald-500/20'
                      : 'bg-neutral-100 text-neutral-400 border-neutral-200'
                  }`}
                  title="Enchaîner automatiquement les versets"
                >
                  <span>Continue</span>
                </button>
              </div>

              {/* Right: Close audio bar */}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={stopAudio}
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    isDark
                      ? 'text-neutral-400 hover:text-white hover:bg-emerald-900/40'
                      : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
                  }`}
                  title="Arrêter la lecture"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

      {/* ========================================================
          TAFSIR & EXÉGÈSE MODAL / DRAWER
         ======================================================== */}
      {activeTafsir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className={`rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 border max-h-[85vh] overflow-y-auto ${
            isDark ? 'bg-[#14281E] text-white border-emerald-500/30' : 'bg-white text-neutral-900 border-neutral-200'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-emerald-500/20' : 'border-neutral-150'}`}>
              <div className="flex items-center gap-2">
                <Sparkles className={`w-5 h-5 ${isDark ? 'text-amber-300' : 'text-teal-700'}`} />
                <div>
                  <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                    Tafsir & Méditation (Tadabbur)
                  </h3>
                  <span className={`text-xs ${isDark ? 'text-emerald-300/70' : 'text-neutral-400'}`}>
                    Sourate {activeTafsir.surahNumber} : Verset {activeTafsir.ayahNumber}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveTafsir(null)}
                className={`p-1 rounded-lg cursor-pointer ${
                  isDark ? 'text-neutral-400 hover:text-white hover:bg-emerald-900/30' : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title & Theme */}
            <div>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide border ${
                isDark ? 'bg-emerald-950/70 text-emerald-200 border-emerald-500/40' : 'bg-teal-50 text-teal-800 border-teal-200'
              }`}>
                {activeTafsir.theme}
              </span>
              <h4 className={`text-base font-bold mt-2 ${isDark ? 'text-amber-200' : 'text-neutral-900'}`}>
                {activeTafsir.title}
              </h4>
            </div>

            {/* Main Explanation Text */}
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#193226] border-emerald-500/25 text-neutral-100' : 'bg-[#F8FAFC] border-neutral-200/80 text-neutral-800'
            }`}>
              <p className="text-xs sm:text-[13.5px] leading-relaxed">
                {activeTafsir.tafsirText}
              </p>
            </div>

            {/* Virtue if applicable */}
            {activeTafsir.virtue && (
              <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                isDark
                  ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Mérite & Hadith :</span>
                  <span>{activeTafsir.virtue}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setActiveTafsir(null)}
              className="w-full py-2.5 rounded-xl bg-[#007A65] hover:bg-teal-700 text-white text-xs font-bold transition cursor-pointer"
            >
              Compris, fermer
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          SETTINGS & AUDIO DRAWER (Slide-over)
         ======================================================== */}
      {isSettingsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className={`w-full max-w-sm h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto ${
            isDark ? 'bg-[#14281E] text-white border-l border-emerald-500/25' : 'bg-white text-neutral-900'
          }`}>
            <div className="space-y-6">
              {/* Header */}
              <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-emerald-500/20' : 'border-neutral-200'}`}>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className={`w-5 h-5 ${isDark ? 'text-amber-300' : 'text-teal-700'}`} />
                  <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-neutral-900'}`}>Préférences de Lecture</h3>
                </div>
                <button
                  onClick={() => setIsSettingsDrawerOpen(false)}
                  className={`p-1.5 rounded-lg cursor-pointer ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-400 hover:text-neutral-800'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode de Lecture (Verset par verset vs Mushaf) */}
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-emerald-300/80' : 'text-neutral-700'}`}>
                  Mode d'affichage
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setReadingMode('verseByVerse')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition ${
                      readingMode === 'verseByVerse'
                        ? isDark
                          ? 'bg-emerald-950 border-emerald-400 text-white'
                          : 'bg-teal-50 border-teal-300 text-teal-900'
                        : isDark
                        ? 'bg-[#193226] border-emerald-500/30 text-neutral-300 hover:bg-[#1f3f30]'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    <BookText className="w-4 h-4" />
                    <span>Ligne par ligne</span>
                  </button>
                  <button
                    onClick={() => setReadingMode('mushaf')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition ${
                      readingMode === 'mushaf'
                        ? isDark
                          ? 'bg-emerald-950 border-emerald-400 text-white'
                          : 'bg-teal-50 border-teal-300 text-teal-900'
                        : isDark
                        ? 'bg-[#193226] border-emerald-500/30 text-neutral-300 hover:bg-[#1f3f30]'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Page Mushaf</span>
                  </button>
                </div>
              </div>

              {/* Ambiance / Thème de lecture */}
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-emerald-300/80' : 'text-neutral-700'}`}>
                  Ambiance du fond
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setReadingTheme('pureWhite')}
                    className={`p-2 rounded-xl border text-[11px] font-bold text-center cursor-pointer transition ${
                      readingTheme === 'pureWhite'
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : isDark
                        ? 'bg-[#193226] text-neutral-300 border-emerald-500/30 hover:bg-[#1f3f30]'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    Blanc Épuré
                  </button>
                  <button
                    onClick={() => setReadingTheme('parchment')}
                    className={`p-2 rounded-xl border text-[11px] font-bold text-center cursor-pointer transition ${
                      readingTheme === 'parchment'
                        ? 'bg-[#EFE8DA] text-[#3D3528] border-[#D8CEB8]'
                        : isDark
                        ? 'bg-[#193226] text-neutral-300 border-emerald-500/30 hover:bg-[#1f3f30]'
                        : 'bg-[#FBF9F4] text-[#6D655A] border-[#E8E2D5] hover:bg-[#F3EFE6]'
                    }`}
                  >
                    Crème Ivoire
                  </button>
                  <button
                    onClick={() => setReadingTheme('night')}
                    className={`p-2 rounded-xl border text-[11px] font-bold text-center cursor-pointer transition ${
                      readingTheme === 'night'
                        ? 'bg-[#15191E] text-white border-teal-500'
                        : isDark
                        ? 'bg-[#193226] text-neutral-300 border-emerald-500/30 hover:bg-[#1f3f30]'
                        : 'bg-[#1E242B] text-neutral-300 border-neutral-700 hover:bg-[#252C34]'
                    }`}
                  >
                    Nuit Sereine
                  </button>
                  <button
                    onClick={() => setReadingTheme('emeraldDark')}
                    className={`p-2 rounded-xl border text-[11px] font-bold text-center cursor-pointer transition ${
                      readingTheme === 'emeraldDark'
                        ? 'bg-[#0B1A12] text-emerald-300 border-emerald-400 shadow-xs'
                        : isDark
                        ? 'bg-[#193226] text-neutral-300 border-emerald-500/30 hover:bg-[#1f3f30]'
                        : 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200'
                    }`}
                  >
                    Émeraude Sombre
                  </button>
                </div>
              </div>

              {/* Contenu affiché */}
              <div className="space-y-2.5">
                <label className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-emerald-300/80' : 'text-neutral-700'}`}>
                  Couches de texte
                </label>

                {/* Arabe */}
                <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
                  isDark ? 'bg-[#193226] border-emerald-500/20' : 'bg-neutral-50 border-neutral-100'
                }`}>
                  <div>
                    <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Texte Arabe (‘Uthmani)</p>
                    <p className={`text-[11px] ${isDark ? 'text-emerald-300/60' : 'text-neutral-400'}`}>Calligraphie sacrée avec médaillons</p>
                  </div>
                  <button
                    onClick={() => setShowArabic(!showArabic)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      showArabic ? 'bg-[#007A65]' : isDark ? 'bg-neutral-700' : 'bg-neutral-200'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        showArabic ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Transcription Phonétique */}
                <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
                  isDark ? 'bg-[#193226] border-emerald-500/20' : 'bg-neutral-50 border-neutral-100'
                }`}>
                  <div>
                    <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Transcription Phonétique</p>
                    <p className={`text-[11px] ${isDark ? 'text-emerald-300/60' : 'text-neutral-400'}`}>Guide de prononciation verset par verset</p>
                  </div>
                  <button
                    onClick={() => setShowTransliteration(!showTransliteration)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      showTransliteration ? 'bg-[#007A65]' : isDark ? 'bg-neutral-700' : 'bg-neutral-200'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        showTransliteration ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Français */}
                <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
                  isDark ? 'bg-[#193226] border-emerald-500/20' : 'bg-neutral-50 border-neutral-100'
                }`}>
                  <div>
                    <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Traduction Française</p>
                    <p className={`text-[11px] ${isDark ? 'text-emerald-300/60' : 'text-neutral-400'}`}>Dr. Muhammad Hamidullah</p>
                  </div>
                  <button
                    onClick={() => setShowFrench(!showFrench)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      showFrench ? 'bg-[#007A65]' : isDark ? 'bg-neutral-700' : 'bg-neutral-200'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        showFrench ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Anglais */}
                <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
                  isDark ? 'bg-[#193226] border-emerald-500/20' : 'bg-neutral-50 border-neutral-100'
                }`}>
                  <div>
                    <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Traduction Anglaise</p>
                    <p className={`text-[11px] ${isDark ? 'text-emerald-300/60' : 'text-neutral-400'}`}>Sahih International</p>
                  </div>
                  <button
                    onClick={() => setShowEnglish(!showEnglish)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      showEnglish ? 'bg-[#007A65]' : isDark ? 'bg-neutral-700' : 'bg-neutral-200'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        showEnglish ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Tailles de police */}
              <div className={`space-y-3 pt-2 border-t ${isDark ? 'border-emerald-500/20' : 'border-neutral-100'}`}>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className={isDark ? 'text-neutral-200' : 'text-neutral-700'}>Taille de l'Arabe</span>
                    <span className={`font-mono font-bold ${isDark ? 'text-amber-300' : 'text-teal-800'}`}>{arabicFontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="42"
                    value={arabicFontSize}
                    onChange={(e) => setArabicFontSize(parseInt(e.target.value, 10))}
                    className="w-full accent-[#007A65] cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className={isDark ? 'text-neutral-200' : 'text-neutral-700'}>Taille de la Traduction</span>
                    <span className={`font-mono font-bold ${isDark ? 'text-amber-300' : 'text-teal-800'}`}>{translationFontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="13"
                    max="22"
                    value={translationFontSize}
                    onChange={(e) => setTranslationFontSize(parseInt(e.target.value, 10))}
                    className="w-full accent-[#007A65] cursor-pointer"
                  />
                </div>
              </div>

              {/* Récitateur Choice */}
              <div className={`space-y-2 pt-2 border-t ${isDark ? 'border-emerald-500/20' : 'border-neutral-100'}`}>
                <label className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-emerald-300/80' : 'text-neutral-700'}`}>
                  Récitateur Audio
                </label>
                <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                  {RECITERS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onSelectReciter(r)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-left cursor-pointer transition ${
                        selectedReciter.id === r.id
                          ? isDark
                            ? 'bg-emerald-950 border border-emerald-400 text-white font-bold'
                            : 'bg-teal-50 border border-teal-200 text-teal-900 font-bold'
                          : isDark
                          ? 'hover:bg-[#193226] text-neutral-300'
                          : 'hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      <div>
                        <span className="block font-semibold">{r.name}</span>
                        <span className={`text-[10px] ${isDark ? 'text-emerald-300/60' : 'text-neutral-400'}`}>{r.style}</span>
                      </div>
                      {selectedReciter.id === r.id && (
                        <Check className={`w-4 h-4 ${isDark ? 'text-amber-300' : 'text-teal-700'}`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsSettingsDrawerOpen(false)}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition cursor-pointer mt-4 ${
                isDark ? 'bg-[#193226] hover:bg-[#204031] text-emerald-200' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
              }`}
            >
              Fermer les paramètres
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          BOOKMARKS MODAL
         ======================================================== */}
      {isBookmarksModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className={`rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border ${
            isDark ? 'bg-[#14281E] text-white border-emerald-500/30' : 'bg-white text-neutral-900 border-neutral-200'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-emerald-500/20' : 'border-neutral-150'}`}>
              <div className="flex items-center gap-2">
                <Bookmark className={`w-5 h-5 fill-current ${isDark ? 'text-amber-300' : 'text-teal-700'}`} />
                <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-neutral-900'}`}>Marque-pages enregistrés</h3>
              </div>
              <button
                onClick={() => setIsBookmarksModalOpen(false)}
                className={`p-1 cursor-pointer rounded-lg ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-400 hover:text-neutral-700'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {bookmarkedVerses.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 space-y-1">
                  <Bookmark className="w-8 h-8 mx-auto text-neutral-500 stroke-1" />
                  <p className="text-xs">Aucun verset marqué pour le moment.</p>
                  <p className="text-[11px]">Cliquez sur l'icône marque-page sur n'importe quel verset pour le retrouver ici.</p>
                </div>
              ) : (
                bookmarkedVerses.map((key) => {
                  const [sNum, aNum] = key.split(':').map(Number);
                  const surah = ALL_114_SURAHS.find((s) => s.number === sNum);

                  return (
                    <div
                      key={key}
                      onClick={() => {
                        setSelectedSurahNumber(sNum);
                        setTimeout(() => jumpToAyah(aNum), 300);
                        setIsBookmarksModalOpen(false);
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition group ${
                        isDark
                          ? 'border-emerald-500/25 hover:border-emerald-400 hover:bg-[#193226]'
                          : 'border-neutral-200 hover:border-teal-300 hover:bg-teal-50/50'
                      }`}
                    >
                      <div>
                        <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                          Sourate {surah?.name} ({sNum}) : Verset {aNum}
                        </p>
                        <p className={`text-[11px] ${isDark ? 'text-emerald-300/70' : 'text-neutral-400'}`}>
                          {surah?.frenchTranslation}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold group-hover:translate-x-0.5 transition-transform ${isDark ? 'text-amber-300' : 'text-teal-700'}`}>
                          Aller →
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(aNum);
                          }}
                          className="p-1 text-neutral-400 hover:text-red-400 transition"
                          title="Supprimer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setIsBookmarksModalOpen(false)}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isDark ? 'bg-[#193226] hover:bg-[#204031] text-emerald-200' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
              }`}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
