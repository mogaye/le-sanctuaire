import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Volume2, Search, Copy, Check, Bookmark, BookmarkCheck } from 'lucide-react';
import { SURAHS } from '../data/islamicData';
import { Reciter, UserProfile } from '../types';
import { fetchQuranFavorites, toggleQuranFavorite, QuranFavoriteRecord } from '../lib/supabase';

interface QuranModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReciter: Reciter;
  currentUser?: UserProfile | null;
}

export const QuranModal: React.FC<QuranModalProps> = ({ isOpen, onClose, selectedReciter, currentUser }) => {
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<QuranFavoriteRecord[]>([]);

  // Load user's favorites from Supabase
  useEffect(() => {
    if (!isOpen) return;
    const userId = currentUser?.id || currentUser?.email || 'guest';
    fetchQuranFavorites(userId).then(setFavorites);
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const currentSurah = SURAHS.find((s) => s.number === selectedSurahNumber) || SURAHS[0];

  const filteredSurahs = SURAHS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.arabicName.includes(searchQuery) ||
      s.englishTranslation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const playAyahAudio = (ayahNumber: number, arabicText: string) => {
    if ('speechSynthesis' in window) {
      if (playingAyah === ayahNumber) {
        window.speechSynthesis.cancel();
        setPlayingAyah(null);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(arabicText);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.8;
      setPlayingAyah(ayahNumber);

      utterance.onend = () => setPlayingAyah(null);
      utterance.onerror = () => setPlayingAyah(null);

      window.speechSynthesis.speak(utterance);
    }
  };

  const copyAyah = (ayahNumber: number, text: string, translation: string) => {
    navigator.clipboard.writeText(`${text}\n« ${translation} »\n[Sourate ${currentSurah.name} : ${ayahNumber}]`).then(() => {
      setCopiedAyah(ayahNumber);
      setTimeout(() => setCopiedAyah(null), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl h-[88vh] bg-white rounded-[32px] border border-neutral-200 shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-black">
                  Le Saint Coran Intégré
                </h2>
                <span className="bg-indigo-50 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                  Récitation : {selectedReciter.name}
                </span>
              </div>
              <p className="text-xs text-black/70 mt-0.5 font-medium">
                Texte en calligraphie arabe soignée, traduction française et récitation audio.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-black transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Sidebar + Main Reading Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Surah List Sidebar */}
          <div className="w-full md:w-72 border-r border-neutral-200 flex flex-col bg-neutral-50">
            {/* Search */}
            <div className="p-4 border-b border-neutral-200">
              <div className="relative">
                <Search className="w-4 h-4 text-indigo-600 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher une sourate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-white border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-indigo-600 text-black font-medium"
                />
              </div>
            </div>

            {/* Surah Items */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredSurahs.map((surah) => (
                <button
                  key={surah.number}
                  onClick={() => {
                    setSelectedSurahNumber(surah.number);
                    setPlayingAyah(null);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition cursor-pointer ${
                    selectedSurahNumber === surah.number
                      ? 'bg-black text-white shadow-sm'
                      : 'hover:bg-neutral-200/70 text-black'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                        selectedSurahNumber === surah.number
                          ? 'bg-white/20 text-white'
                          : 'bg-neutral-200 text-black'
                      }`}
                    >
                      {surah.number}
                    </span>
                    <div>
                      <div className="text-xs font-bold">{surah.name}</div>
                      <div className="text-[10px] opacity-80">{surah.englishTranslation}</div>
                    </div>
                  </div>
                  <span className="font-arabic text-sm">{surah.arabicName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Reading Viewer */}
          <div className="flex-1 flex flex-col overflow-y-auto p-6 sm:p-8 bg-white">
            {/* Surah Header Banner */}
            <div className="rounded-3xl bg-neutral-50 border border-neutral-200 p-6 text-center mb-8 relative">
              <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                {currentSurah.revelationType} • {currentSurah.numberOfAyahs} versets
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-black mt-3">
                {currentSurah.name}
              </h3>
              <p className="font-arabic text-3xl sm:text-4xl text-black font-medium mt-2">
                {currentSurah.arabicName}
              </p>
              <p className="text-xs text-black mt-2 italic font-medium">
                {currentSurah.englishTranslation}
              </p>

              {currentSurah.number !== 9 && (
                <div className="font-arabic text-lg text-black mt-5 select-none font-medium">
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                </div>
              )}
            </div>

            {/* Ayahs List */}
            <div className="space-y-6">
              {currentSurah.ayahs.map((ayah) => {
                const isPlaying = playingAyah === ayah.number;
                const isCopied = copiedAyah === ayah.number;

                return (
                  <div
                    key={ayah.number}
                    className={`p-6 rounded-3xl border transition-all ${
                      isPlaying
                        ? 'bg-indigo-50/50 border-indigo-300 shadow-xs'
                        : 'bg-white border-neutral-200 hover:border-black/30'
                    }`}
                  >
                    {/* Verse actions */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-bold flex items-center justify-center">
                        {ayah.number}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Bookmark / Favorite button (Supabase Synced) */}
                        <button
                          onClick={() => {
                            const isFav = favorites.some(
                              (f) => f.surahNumber === currentSurah.number && f.ayahNumber === ayah.number
                            );
                            const record: QuranFavoriteRecord = {
                              surahNumber: currentSurah.number,
                              ayahNumber: ayah.number,
                              surahName: currentSurah.name,
                              ayahText: ayah.text,
                              ayahTranslation: ayah.translation,
                            };
                            const userId = currentUser?.id || currentUser?.email || 'guest';
                            toggleQuranFavorite(userId, record, !isFav);
                            if (isFav) {
                              setFavorites((prev) =>
                                prev.filter(
                                  (f) =>
                                    !(f.surahNumber === currentSurah.number && f.ayahNumber === ayah.number)
                                )
                              );
                            } else {
                              setFavorites((prev) => [...prev, record]);
                            }
                          }}
                          className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md transition cursor-pointer ${
                            favorites.some(
                              (f) => f.surahNumber === currentSurah.number && f.ayahNumber === ayah.number
                            )
                              ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800'
                              : 'text-neutral-600 hover:text-black'
                          }`}
                          title="Enregistrer dans mes versets favoris"
                        >
                          {favorites.some(
                            (f) => f.surahNumber === currentSurah.number && f.ayahNumber === ayah.number
                          ) ? (
                            <BookmarkCheck className="w-3.5 h-3.5 text-amber-600 fill-current" />
                          ) : (
                            <Bookmark className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {favorites.some(
                              (f) => f.surahNumber === currentSurah.number && f.ayahNumber === ayah.number
                            )
                              ? 'Favori'
                              : 'Sauvegarder'}
                          </span>
                        </button>

                        <button
                          onClick={() => copyAyah(ayah.number, ayah.text, ayah.translation)}
                          className="flex items-center gap-1 text-[11px] font-bold text-neutral-600 hover:text-black px-2.5 py-1 rounded-md transition cursor-pointer"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-neutral-500" />
                          )}
                          <span>{isCopied ? 'Copié' : 'Copier'}</span>
                        </button>

                        <button
                          onClick={() => playAyahAudio(ayah.number, ayah.text)}
                          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition cursor-pointer ${
                            isPlaying
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                          }`}
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="w-3.5 h-3.5" />
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Réciter</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Arabic Text */}
                    <p className="font-arabic text-2xl sm:text-3xl text-black leading-[2.1] text-right my-2">
                      {ayah.text} ۝
                    </p>

                    {/* Translation */}
                    <p className="text-sm text-black leading-relaxed mt-4 pt-3 border-t border-neutral-200 font-medium">
                      {ayah.translation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
