import React from 'react';
import { ArrowUpRight, Heart, ArrowUp, Compass, BookOpen, Clock, Sparkles, QrCode } from 'lucide-react';
import portraitSereinVertBg from '../assets/images/hero/portrait_serein_vert.webp';

export interface FooterSectionProps {
  onOpenPrayerGuide: () => void;
  onOpenQuran: () => void;
  onOpenQibla: () => void;
  onOpenDhikr: () => void;
  onOpenQrCode?: () => void;
  showCta?: boolean;
}

export const FooterSection: React.FC<FooterSectionProps> = ({
  onOpenPrayerGuide,
  onOpenQuran,
  onOpenQibla,
  onOpenDhikr,
  onOpenQrCode,
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
          src={portraitSereinVertBg}
          alt="Portrait serein au Coran sur fond vert"
          className="w-full h-full object-cover object-center opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05170E]/95 via-[#061D12]/90 to-[#030E08]" />
      </div>

      <div className={`relative z-10 ${showCta ? 'pt-8 sm:pt-16' : 'pt-6 sm:pt-14'}`}>
        {/* 1. Final Call To Action (CTA) Banner (optional) */}
        {showCta && (
          <div className="w-full max-w-6xl mx-auto px-3.5 sm:px-8 mb-10 sm:mb-16 relative z-20">
            <div className="rounded-2xl sm:rounded-[36px] bg-[#071F15]/90 border border-emerald-400/30 shadow-[0_25px_60px_rgba(0,0,0,0.5)] p-5 sm:p-14 text-center relative overflow-hidden text-white">
              {/* Portrait serein au Coran sur fond vert Background */}
              <div className="absolute inset-0 z-0 pointer-events-none">
                <img
                  src={portraitSereinVertBg}
                  alt="Portrait serein au Coran sur fond vert"
                  className="w-full h-full object-cover object-center"
                />
                {/* Subtle protective gradient so the portrait and text both remain clear */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#041D11]/75 via-[#052918]/45 to-[#041D11]/65" />
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
                    <span>Commencer maintenant</span>
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
                {onOpenQrCode && (
                  <li>
                    <button
                      onClick={onOpenQrCode}
                      className="hover:text-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5 text-left text-amber-300 hover:text-amber-200 font-bold"
                    >
                      <QrCode className="w-3.5 h-3.5 text-amber-400" />
                      QR Code d'Accès au Site
                    </button>
                  </li>
                )}
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

          {/* Social Media Links Row */}
          <div className="py-6 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                Suivez Le Sanctuaire :
              </span>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@le_sanctuaire"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-black text-white hover:text-white border border-white/15 hover:border-white/40 text-xs font-bold transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-xs"
                title="Suivez-nous sur TikTok"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
                <span>TikTok</span>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/le_sanctuaire_officiel"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-gradient-to-tr hover:from-amber-600 hover:via-rose-600 hover:to-purple-600 text-white border border-white/15 hover:border-white/40 text-xs font-bold transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-xs"
                title="Suivez-nous sur Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span>Instagram</span>
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/lesanctuaire.officiel"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-[#1877F2] text-white border border-white/15 hover:border-white/40 text-xs font-bold transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-xs"
                title="Suivez-nous sur Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Facebook</span>
              </a>

              {/* WhatsApp (direct link, phone number omitted from UI text) */}
              <a
                href="https://wa.me/221705908725"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-[#25D366] hover:text-neutral-950 text-emerald-200 border border-emerald-400/30 hover:border-emerald-300 text-xs font-bold transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-xs"
                title="Rejoindre notre communauté WhatsApp"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <span>WhatsApp Officiel</span>
              </a>
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
