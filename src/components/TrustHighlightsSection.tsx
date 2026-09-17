import React from 'react';
import { ShieldCheck, HeartHandshake, BookMarked, Lock, CheckCircle, Sparkles } from 'lucide-react';

export const TrustHighlightsSection: React.FC = () => {
  const highlights = [
    {
      id: 'highlight-free',
      title: '100% Gratuit',
      badge: 'ACCÈS UNIVERSEL',
      badgeStyle: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40',
      icon: HeartHandshake,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      description:
        'Toutes les fonctionnalités, récitations audio, guides pas-à-pas et calculs de prière sont accessibles à tous, sans abonnement, sans achat intégré ni restrictions.',
      benefit: 'Accessible pour l’ensemble de la communauté musulmane.',
    },
    {
      id: 'highlight-ad-free',
      title: 'Sans Publicité',
      badge: 'ZÉRO INTERRUPTION',
      badgeStyle: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/40',
      icon: ShieldCheck,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
      description:
        'Aucune bannière commerciale, aucune coupure publicitaire intempestive et aucun pistage de données. Votre recueillement et votre concentration spirituelle sont respectés.',
      benefit: 'Une atmosphère sereine consacrée à l’essentiel.',
    },
    {
      id: 'highlight-sources',
      title: 'Sources Authentiques',
      badge: 'RÉFÉRENCES CONTRÔLÉES',
      badgeStyle: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40',
      icon: BookMarked,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      description:
        'Textes coraniques conformes au Mushaf Othmani, invocations issues des recueils authentiques (Al-Bukhari, Muslim, Hisn Al-Muslim) et méthodes de calcul reconnues mondialement.',
      benefit: 'Conformité rigoureuse avec la tradition prophétique.',
    },
    {
      id: 'highlight-privacy',
      title: 'Vie Privée & Hors-Ligne',
      badge: 'DONNÉES LOCALES',
      badgeStyle: 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-500/40',
      icon: Lock,
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      description:
        'Vos coordonnées de ville, vos sélections et vos compteurs de chapelet sont enregistrés localement sur votre appareil. Aucune géolocalisation abusive n’est stockée.',
      benefit: 'Total respect de votre confidentialité numérique.',
    },
  ];

  return (
    <section className="w-full relative overflow-hidden py-10 sm:py-28 border-b border-emerald-200/60 dark:border-emerald-900/40">
      {/* Background Image behind Trust & Values elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/images/backgrounds/trust_section_bg.jpg"
          alt="Arrière-plan jardin de sérénité et valeurs"
          className="w-full h-full object-cover object-center opacity-10 dark:opacity-25"
        />
        {/* Harmonizing atmospheric gradient overlay for optimal legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F4F7F5] via-[#EDF5F0] to-[#F4F7F5] dark:from-[#14261C] dark:via-[#172D21]/90 dark:to-[#14261C] backdrop-blur-[1px]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-3.5 sm:px-8">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-14">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-900 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/70 px-3 sm:px-3.5 py-1 rounded-full border border-indigo-300 dark:border-indigo-500/40 inline-block mb-2 sm:mb-3 backdrop-blur-sm">
            ENGAGEMENTS & VALEURS
          </span>
          <h2 className="text-xl sm:text-4xl font-extrabold text-emerald-950 dark:text-white tracking-tight mb-2 sm:mb-3">
            Une Plateforme Éthique, Sincère & Vérifiée
          </h2>
          <p className="text-emerald-900/80 dark:text-emerald-100/80 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed font-normal">
            Notre engagement repose sur trois piliers fondamentaux : la gratuité totale, la sérénité sans publicité et l'authenticité absolue des sources.
          </p>
        </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="rounded-2xl sm:rounded-[28px] bg-white/95 dark:bg-[#193226]/95 backdrop-blur-xl border border-emerald-200/80 dark:border-emerald-500/25 p-4 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)] hover:border-emerald-400/50 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Top Badge & Icon */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl ${item.iconBg} flex items-center justify-center ${item.iconColor} shadow-2xs`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                  </div>
                  <span className={`${item.badgeStyle} border text-[9px] sm:text-[10px] font-bold tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full uppercase`}>
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-sm sm:text-lg font-bold text-neutral-900 dark:text-white mb-1.5 sm:mb-2 tracking-tight">
                  {item.title}
                </h3>

                <p className="text-xs text-neutral-600 dark:text-neutral-200 leading-relaxed font-normal mb-3 sm:mb-4">
                  {item.description}
                </p>
              </div>

              {/* Verified footnote */}
              <div className="pt-3 border-t border-neutral-100 dark:border-white/10 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="line-clamp-1">{item.benefit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust Quote / Assurance Bar */}
      <div className="mt-8 rounded-2xl bg-white/95 dark:bg-[#193226]/90 backdrop-blur-md border border-emerald-200/80 dark:border-emerald-500/25 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-md dark:shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 border border-emerald-300 dark:border-emerald-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
              Approuvé selon les standards islamiques reconnus
            </h4>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-200/80 font-normal">
              Calculs d'angles compatibles Ligue Islamique Mondiale, Umm al-Qura (Makkah) & Union des Organisations Islamiques de France.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-white/10 border border-emerald-200 dark:border-white/15 text-emerald-800 dark:text-emerald-200">
            Vérifié & Sans Biais
          </span>
        </div>
      </div>
      </div>
    </section>
  );
};
