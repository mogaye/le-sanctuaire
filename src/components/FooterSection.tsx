import React from 'react';
import { ArrowUpRight, Heart, ArrowUp, Compass, BookOpen, Clock, Sparkles } from 'lucide-react';

export interface FooterSectionProps {
  onOpenPrayerGuide: () => void;
  onOpenQuran: () => void;
  onOpenQibla: () => void;
  onOpenDhikr: () => void;
  showCta?: boolean;
}

export const FooterSection: React.FC<FooterSectionProps> = ({
  onOpenPrayerGuide,
  onOpenQuran,
  onOpenQibla,
  onOpenDhikr,
  showCta = true,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full relative overflow-hidden bg-[#05170E] text-white mt-10 sm:mt-24 border-t border-emerald-900/40">
      {/* Background Image behind the whole footer and CTA area */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/images/backgrounds/cta_twilight_bg.jpg"
          alt="Arrière-plan sérénité nocturne"
          className="w-full h-full object-cover object-center opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05170E]/95 via-[#061D12]/90 to-[#030E08]" />
      </div>

      <div className={`relative z-10 ${showCta ? 'pt-8 sm:pt-16' : 'pt-6 sm:pt-14'}`}>
        {/* 1. Final Call To Action (CTA) Banner (optional) */}
        {showCta && (
          <div className="w-full max-w-6xl mx-auto px-3.5 sm:px-8 mb-10 sm:mb-16 relative z-20">
            <div className="rounded-2xl sm:rounded-[36px] bg-[#071F15]/90 border border-emerald-400/30 shadow-[0_25px_60px_rgba(0,0,0,0.5)] p-5 sm:p-14 text-center relative overflow-hidden text-white backdrop-blur-xl">
              {/* Spiritual Twilight Sanctuary Background */}
              <div className="absolute inset-0 z-0 pointer-events-none">
                <img
                  src="/images/backgrounds/cta_twilight_bg.jpg"
                  alt="Arrière-plan sérénité nocturne"
                  className="w-full h-full object-cover object-center opacity-40"
                />
                {/* Protective Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#061D12]/92 via-[#072417]/85 to-[#061D12]/92" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#05170E]/80 via-transparent to-[#05170E]/90" />
              </div>

              <div className="relative z-10">
                {/* Subtle Top Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/70 border border-emerald-400/40 text-emerald-200 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-3 sm:mb-5 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Accès Immédiat & Illimité
                </div>

                {/* Heading */}
                <h2 className="text-2xl sm:text-5xl font-extrabold text-white tracking-tight max-w-2xl mx-auto leading-tight mb-2.5 sm:mb-4 drop-shadow-xs">
                  Prêt À Cheminer Vers La Sérénité ?
                </h2>

                {/* Subtitle */}
                <p className="text-emerald-100/90 text-xs sm:text-base max-w-xl mx-auto leading-relaxed mb-6 sm:mb-8 font-medium">
                  Apprenez la prière pas-à-pas, écoutez le Saint Coran avec les plus grands récitateurs et gardez le fil de vos invocations quotidiennes.
                </p>

                {/* Action Buttons with prominent [ Get Started ] button */}
                <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 sm:gap-4 max-w-lg mx-auto sm:max-w-none">
                  <button
                    id="cta-get-started-btn"
                    onClick={onOpenPrayerGuide}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs sm:text-base shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_32px_rgba(16,185,129,0.45)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2 group active:scale-95"
                  >
                    <span>Get Started</span>
                    <ArrowUpRight className="w-4 h-4 text-neutral-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>

                  <button
                    id="cta-open-quran-btn"
                    onClick={onOpenQuran}
                    className="w-full sm:w-auto px-5 sm:px-7 py-2.5 sm:py-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/25 font-bold text-xs sm:text-base transition-all hover:border-white/50 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-300" />
                    <span>Lire le Saint Coran</span>
                  </button>

                  <button
                    id="cta-open-qibla-btn"
                    onClick={onOpenQibla}
                    className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/25 font-bold text-xs sm:text-base transition-all hover:border-white/50 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Compass className="w-4 h-4 text-amber-300" />
                    <span>Boussole Qibla</span>
                  </button>
                </div>

                {/* Guarantee Pills */}
                <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-6 mt-6 sm:mt-8 text-[11px] sm:text-xs font-semibold text-emerald-100/80">
                  <span className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span> 100% Gratuit pour toujours
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span> Sans Publicité
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-amber-300 font-bold">✓</span> Sources Islamiques Authentifiées
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Standard Footer Navigation & Links */}
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 pb-8 sm:pb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 pb-8 sm:pb-12 border-b border-white/15">
            {/* Brand Info Column */}
            <div className="space-y-3.5 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <img
                  src="/images/sanctuaire_logo.jpg"
                  alt="Logo Le Sanctuaire"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-amber-400/40 shadow-xs"
                />
                <span className="font-extrabold text-base text-white tracking-tight">
                  Le Sanctuaire
                </span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                Votre compagnon spirituel musulman moderne, pensé pour l’apprentissage, la récitation et la pratique quotidienne de l'Islam.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-semibold pt-1">
                <span>Fait avec dévouement</span>
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>pour la Oummah</span>
              </div>
            </div>

            {/* Outils & Pratiques */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-200/90">
                Outils & Pratiques
              </h4>
              <ul className="space-y-2 text-xs font-medium text-neutral-300">
                <li>
                  <button
                    onClick={onOpenPrayerGuide}
                    className="hover:text-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5 text-left"
                  >
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    Guide Pas-à-Pas de la Salat
                  </button>
                </li>
                <li>
                  <button
                    onClick={onOpenQuran}
                    className="hover:text-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5 text-left"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    Saint Coran & Récitations
                  </button>
                </li>
                <li>
                  <button
                    onClick={onOpenQibla}
                    className="hover:text-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5 text-left"
                  >
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    Horaires de Prière & Qibla
                  </button>
                </li>
                <li>
                  <button
                    onClick={onOpenDhikr}
                    className="hover:text-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5 text-left"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Invocations & Tasbih Interactif
                  </button>
                </li>
              </ul>
            </div>

            {/* Méthodes de Calcul */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-200/90">
                Méthodes de Calcul
              </h4>
              <ul className="space-y-2 text-xs font-medium text-neutral-300">
                <li>Ligue Islamique Mondiale (MWL)</li>
                <li>Umm al-Qura (Makkah Al-Mukarramah)</li>
                <li>UOIF (Angles 12° / 12° France)</li>
                <li>Autorité Générale d’Égypte (EGAS)</li>
                <li>Société Islamique d'Amérique du Nord (ISNA)</li>
              </ul>
            </div>

            {/* Engagements & Éthique */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-200/90">
                Engagements & Éthique
              </h4>
              <ul className="space-y-2 text-xs font-medium text-neutral-300">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  100% Gratuit et Accessible à tous
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Respect total de la vie privée
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Sources authentiques et vérifiées
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Zéro publicité intrusive
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Row */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400 font-medium">
            <div className="flex items-center gap-2">
              <span>© 2026 Le Sanctuaire. Tous droits réservés.</span>
            </div>

            <div className="font-arabic text-sm text-emerald-200">
              اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا
            </div>

            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 text-neutral-300 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
            >
              <span>Haut de page</span>
              <ArrowUp className="w-3.5 h-3.5 text-neutral-300" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
