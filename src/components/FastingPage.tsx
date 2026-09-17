import React, { useState } from 'react';
import {
  ArrowLeft,
  Moon,
  Sun,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Sparkles,
  Volume2,
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  Heart,
} from 'lucide-react';
import { CityData } from '../types';
import {
  FASTING_CONDITIONS,
  FASTING_PILLARS,
  FASTING_RULES_ACCORDING_TO_IBN_BAZ,
  RAMADAN_SPIRITUAL_PRACTICES,
} from '../data/fastingData';
import { ISLAMIC_BOOKS } from '../data/booksData';

interface FastingPageProps {
  onBackToHome: () => void;
  selectedCity: CityData;
  onOpenBookReader?: (bookId: string) => void;
}

export const FastingPage: React.FC<FastingPageProps> = ({
  onBackToHome,
  selectedCity,
  onOpenBookReader,
}) => {
  const [activeTab, setActiveTab] = useState<'regles' | 'annulatifs' | 'spiritualite' | 'livres'>('regles');
  const [ruleFilter, setRuleFilter] = useState<'all' | 'invalide' | 'autorise'>('all');

  const playDuaAudio = (arabicText: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(arabicText);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const fastingBooks = ISLAMIC_BOOKS.filter((b) => b.category === 'jeune');

  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-[#14261C] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans pb-28 md:pb-16 transition-colors duration-300">
      {/* STICKY TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#193226]/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-emerald-500/25 shadow-2xs transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-2 sm:gap-3">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#14281E] dark:hover:bg-emerald-900/60 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer border border-neutral-200 dark:border-emerald-500/20 hover:border-emerald-500/40 active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
            <span className="hidden sm:inline">Retour au Sanctuaire</span>
            <span className="sm:hidden">Accueil</span>
          </button>

          <div className="flex items-center gap-2 text-left sm:text-center truncate min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 dark:bg-gradient-to-br dark:from-emerald-800 dark:to-emerald-950 text-emerald-800 dark:text-amber-200 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              ص
            </div>
            <div className="min-w-0 truncate">
              <h1 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white leading-tight truncate">
                Le Jeûne & Le Mois Béni de Ramadan
              </h1>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-300/80 font-medium truncate">
                Piliers, Conditions, Fiqh d'Ibn Baz & Invocations
              </p>
            </div>
          </div>

          <div className="text-right hidden sm:block shrink-0">
            <span className="text-xs font-black text-neutral-900 dark:text-white">{selectedCity.name}</span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300/80 block">{selectedCity.country}</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 w-full space-y-4 sm:space-y-6">
        {/* HERO BANNER */}
        <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[32px] bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 text-neutral-900 dark:text-white relative overflow-hidden shadow-xs transition-colors">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-2 sm:space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-400/30 text-[11px] sm:text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300" />
              <span>4ème Pilier de l’Islam • Mois de la Révélation</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
              « Ô vous qui croyez ! On vous a prescrit le jeûne... »
            </h2>
            <p className="text-xs sm:text-sm text-neutral-700 dark:text-emerald-100/80 leading-relaxed">
              « ... ainsi qu'on l'a prescrit à ceux qui vous ont précédés, ainsi atteindrez-vous la piété. » (Sourate Al-Baqarah 2:183).
              Retrouvez ici les conditions obligatoires, les annulatifs scrupuleux selon la Sunnah, et les invocations prophétiques de la rupture.
            </p>
          </div>
        </div>

        {/* IMSAK & IFTAR CARD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                <Moon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider block">
                  Début du Jeûne (Al-Imsâk / Fajr)
                </span>
                <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                  {selectedCity.prayers.F}
                </span>
                <p className="text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-300/80">
                  Cessez de manger dès l’aube vraie
                </p>
              </div>
            </div>
            <span className="px-2.5 sm:px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 text-indigo-800 dark:text-indigo-200 text-xs font-bold">
              Aube
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Sun className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider block">
                  Rupture du Jeûne (Al-Iftâr / Maghrib)
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-200">
                  {selectedCity.prayers.M}
                </span>
                <p className="text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-300/80">
                  Hâter la rupture au coucher du soleil
                </p>
              </div>
            </div>
            <span className="px-2.5 sm:px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-bold">
              Coucher
            </span>
          </div>
        </div>

        {/* INVOCATION DE RUPTURE DU JEÛNE (IFTAR) */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/30 text-neutral-900 dark:text-white shadow-xs space-y-3 sm:space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 dark:text-amber-300" />
              <h3 className="text-sm sm:text-base font-black">Invocation de l’Iftâr</h3>
            </div>
            <button
              onClick={() => playDuaAudio('ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ')}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#14281E] dark:hover:bg-emerald-900/60 border border-neutral-200 dark:border-emerald-500/30 text-xs font-bold cursor-pointer transition-all active:scale-95"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
              <span>Écouter</span>
            </button>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-50/70 dark:bg-[#14281E] border border-amber-200 dark:border-emerald-500/20 text-right">
            <p className="font-arabic text-lg sm:text-2xl text-amber-900 dark:text-amber-200 font-bold leading-relaxed">
              ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold italic">
              « Dhahaba adh-dhama’ou, wabtallatil-‘ouroûqou, wa thabatal-ajrou in shâ’ Allâh. »
            </p>
            <p className="text-xs text-neutral-700 dark:text-emerald-100/90 font-medium">
              « La soif est étanchée, les veines sont humectées et la récompense est assurée, si Allah le veut. »
            </p>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex p-1 rounded-xl sm:rounded-2xl bg-neutral-100 dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 gap-1 shadow-xs max-w-2xl mx-auto overflow-x-auto no-scrollbar transition-colors">
          <button
            onClick={() => setActiveTab('regles')}
            className={`flex-1 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
              activeTab === 'regles'
                ? 'bg-emerald-700 text-white shadow-xs border border-emerald-600 dark:border-emerald-400/40'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#14281E]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Piliers</span>
          </button>

          <button
            onClick={() => setActiveTab('annulatifs')}
            className={`flex-1 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
              activeTab === 'annulatifs'
                ? 'bg-emerald-700 text-white shadow-xs border border-emerald-600 dark:border-emerald-400/40'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#14281E]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Annulatifs</span>
          </button>

          <button
            onClick={() => setActiveTab('spiritualite')}
            className={`flex-1 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
              activeTab === 'spiritualite'
                ? 'bg-emerald-700 text-white shadow-xs border border-emerald-600 dark:border-emerald-400/40'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#14281E]'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Tarâwîh</span>
          </button>

          <button
            onClick={() => setActiveTab('livres')}
            className={`flex-1 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
              activeTab === 'livres'
                ? 'bg-emerald-700 text-white shadow-xs border border-emerald-600 dark:border-emerald-400/40'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#14281E]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Livres</span>
          </button>
        </div>

        {/* TAB 1: PILIERS & CONDITIONS */}
        {activeTab === 'regles' && (
          <div className="space-y-6">
            {/* Les Piliers */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-4 transition-colors">
              <h3 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                <span>Les Deux Piliers Fondamentaux (Arkân As-Siyâm)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FASTING_PILLARS.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 space-y-2 shadow-xs transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-amber-700 dark:text-amber-200">{p.title}</h4>
                      <span className="font-arabic text-base text-amber-800 dark:text-amber-300 font-bold">
                        {p.arabic}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed font-medium">
                      {p.description}
                    </p>
                    <div className="pt-2 border-t border-neutral-200 dark:border-emerald-800/40 text-[11px] text-emerald-700 dark:text-emerald-300 italic font-semibold">
                      {p.hadith}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Les Conditions */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-4 transition-colors">
              <h3 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                <span>Les 6 Conditions d’Obligation et de Validité</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {FASTING_CONDITIONS.map((cond, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 hover:border-emerald-500/40 transition-all space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-neutral-900 dark:text-white">{cond.title}</h4>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                        {cond.badge}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">{cond.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ANNULATIFS & IDÉES REÇUES */}
        {activeTab === 'annulatifs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-neutral-900 dark:text-white">
                La Jurisprudence Authentique de Cheikh Ibn Baz
              </h3>
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/25 text-xs font-bold transition-colors">
                <button
                  onClick={() => setRuleFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    ruleFilter === 'all'
                      ? 'bg-emerald-700 text-white'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Tout
                </button>
                <button
                  onClick={() => setRuleFilter('invalide')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    ruleFilter === 'invalide'
                      ? 'bg-rose-700 text-white border border-rose-600'
                      : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  }`}
                >
                  Ce qui Rompt
                </button>
                <button
                  onClick={() => setRuleFilter('autorise')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    ruleFilter === 'autorise'
                      ? 'bg-emerald-700 text-white border border-emerald-600'
                      : 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  }`}
                >
                  Autorisé
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FASTING_RULES_ACCORDING_TO_IBN_BAZ.flatMap((cat) => cat.items)
                .filter((it) => (ruleFilter === 'all' ? true : it.ruling === ruleFilter))
                .map((item, idx) => {
                  const isBad = item.ruling === 'invalide';
                  return (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl border transition-all space-y-2.5 shadow-xs ${
                        isBad
                          ? 'bg-white dark:bg-[#193226] border-rose-200 dark:border-rose-500/30'
                          : 'bg-white dark:bg-[#193226] border-neutral-200 dark:border-emerald-500/25'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            isBad
                              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-500/40'
                              : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
                          }`}
                        >
                          {item.verdictLabel}
                        </span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold">
                          {item.dalilSource}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white">{item.question}</h4>
                      <p className="text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed font-medium">
                        {item.explanation}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 3: TARÂWÎH & NUIT DU DESTIN */}
        {activeTab === 'spiritualite' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {RAMADAN_SPIRITUAL_PRACTICES.map((prac, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-3 flex flex-col justify-between transition-colors"
                >
                  <div className="space-y-2">
                    <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </span>
                    <h4 className="text-base font-extrabold text-neutral-900 dark:text-white">{prac.title}</h4>
                    <p className="text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed font-medium">
                      {prac.desc}
                    </p>
                  </div>

                  {prac.duaArabic && (
                    <div className="pt-3 border-t border-neutral-200 dark:border-emerald-800/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                          Dou’a Recommandée
                        </span>
                        <button
                          onClick={() => playDuaAudio(prac.duaArabic!)}
                          className="text-amber-600 dark:text-amber-300 hover:text-amber-700 dark:hover:text-amber-200 p-1 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="font-arabic text-sm text-amber-800 dark:text-amber-200 font-bold text-right leading-loose">
                        {prac.duaArabic}
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 italic font-semibold">
                        {prac.duaPhonetic}
                      </p>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-300 font-medium">
                        {prac.duaFrench}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: LES LIVRES SUR LE JEÛNE */}
        {activeTab === 'livres' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-4 transition-colors">
              <h3 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                <span>Ouvrages Authentiques Fournis sur le Jeûne</span>
              </h3>
              <p className="text-xs text-neutral-600 dark:text-emerald-200/70 leading-relaxed">
                Vous pouvez consulter ces précieux ouvrages PDF directement dans l'application ou les télécharger pour une lecture hors-ligne.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {fastingBooks.map((book) => (
                  <div
                    key={book.id}
                    className="p-5 rounded-2xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                          PDF • {book.pageEstimate} pages
                        </span>
                        <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h4 className="text-sm font-black text-neutral-900 dark:text-white">{book.title}</h4>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">{book.author}</p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-3">
                        {book.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-200 dark:border-emerald-800/40">
                      {onOpenBookReader ? (
                        <button
                          onClick={() => onOpenBookReader(book.id)}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs border border-emerald-600 dark:border-emerald-400/30"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                          <span>Lire le Livre</span>
                        </button>
                      ) : (
                        <a
                          href={book.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs border border-emerald-600 dark:border-emerald-400/30"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                          <span>Ouvrir</span>
                        </a>
                      )}
                      <a
                        href={book.pdfUrl}
                        download={book.pdfFileName}
                        className="p-2 rounded-xl bg-neutral-200/80 hover:bg-neutral-300 dark:bg-[#193226] dark:hover:bg-[#1E3B2E] border border-neutral-300 dark:border-emerald-500/20 text-neutral-700 dark:text-neutral-200 transition-all cursor-pointer"
                        title="Télécharger le PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
