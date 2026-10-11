import React, { useState, useEffect } from 'react';
import { Star, Quote, Sparkles, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import {
  DonorReviewItem,
  DEFAULT_DONOR_REVIEWS,
  fetchDonorReviews,
  submitDonorReview,
  hasUserDonatedLocally,
} from '../lib/supabase';
import { UserProfile } from '../types';

interface DonorReviewsSectionProps {
  currentUser?: UserProfile | null;
  hasMadeDonation?: boolean;
  cityName?: string;
  onOpenAuth?: () => void;
}

export const DonorReviewsSection: React.FC<DonorReviewsSectionProps> = ({
  currentUser,
  hasMadeDonation = false,
  cityName = 'Dakar',
  onOpenAuth,
}) => {
  const [reviews, setReviews] = useState<DonorReviewItem[]>(DEFAULT_DONOR_REVIEWS);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);

  const [authorName, setAuthorName] = useState<string>(currentUser?.name || '');
  const [authorCity, setAuthorCity] = useState<string>(cityName || 'Dakar');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser?.name) {
      setAuthorName(currentUser.name);
    }
  }, [currentUser?.name]);

  useEffect(() => {
    if (!currentUser?.email && showReviewForm) {
      setShowReviewForm(false);
    }
  }, [currentUser?.email, showReviewForm]);

  useEffect(() => {
    let isMounted = true;
    const loadReviews = async () => {
      const list = await fetchDonorReviews();
      if (isMounted && list.length > 0) {
        setReviews(list);
      }
    };
    loadReviews();

    const handleUpdated = () => {
      loadReviews();
    };
    window.addEventListener('sanctuaire-reviews-updated', handleUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('sanctuaire-reviews-updated', handleUpdated);
    };
  }, []);

  // Scroll into view if user arrived from a review link (?avis=donateur or ?avis=1)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('avis') === 'donateur' || params.get('avis') === '1') {
        if (currentUser?.email) {
          setShowReviewForm(true);
        }
        setTimeout(() => {
          const el = document.getElementById('avis-donateurs');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 400);
      }
    }
  }, [currentUser?.email]);

  const handleOpenReviewForm = () => {
    if (!currentUser?.email) {
      onOpenAuth?.();
      return;
    }
    setShowReviewForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.email) {
      onOpenAuth?.();
      return;
    }
    if (!comment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const resolvedName = (authorName || currentUser.name || 'Membre du Sanctuaire').trim();
      const isCurrentUserDonor = Boolean(
        hasMadeDonation ||
          hasUserDonatedLocally({
            email: currentUser.email,
            name: resolvedName,
          })
      );

      const created = await submitDonorReview({
        name: resolvedName,
        email: currentUser.email,
        city: (authorCity || cityName || 'Dakar').trim(),
        rating,
        comment: comment.trim(),
        isDonor: isCurrentUserDonor,
      });
      setReviews((prev) => [created, ...prev]);
      setComment('');
      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        setShowReviewForm(false);
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="avis-donateurs"
      className="w-full relative overflow-hidden py-10 sm:py-20 border-b border-emerald-200/60 dark:border-emerald-900/40 bg-[#EFF5F1] dark:bg-[#112219]"
    >
      <div className="relative z-10 w-full max-w-6xl mx-auto px-3.5 sm:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-900 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-3.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-500/40 inline-flex items-center gap-1.5 mb-2.5">
            <MessageSquare className="w-3 h-3" />
            <span>TÉMOIGNAGES DE LA COMMUNAUTÉ</span>
          </span>
          <h2 className="text-xl sm:text-3xl font-extrabold text-emerald-950 dark:text-white tracking-tight mb-2">
            Avis des Membres du Sanctuaire
          </h2>
          <p className="text-emerald-900/80 dark:text-emerald-100/80 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Découvrez les témoignages et retours d'expérience des membres utilisant Le Sanctuaire au quotidien.
          </p>

          {!showReviewForm && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleOpenReviewForm}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Partager mon avis</span>
              </button>
            </div>
          )}
        </div>

        {/* Review Form (only rendered when user has an authenticated account) */}
        {showReviewForm && Boolean(currentUser?.email) && (
          <div className="max-w-xl mx-auto mb-10 rounded-3xl bg-white dark:bg-[#183124] border border-emerald-400/40 p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                    Publier votre avis sur la page d'accueil
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-emerald-200/75">
                    Partagez votre expérience et votre message avec la communauté du Sanctuaire.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
              >
                Fermer
              </button>
            </div>

            {submittedSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-400/40 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>BarakAllahu Fikum ! Votre avis a été ajouté sur la page d'accueil.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-emerald-200 mb-1">
                      Votre nom
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Ex: Mamadou Gaye"
                      className="w-full rounded-xl px-3 py-2 text-xs bg-neutral-50 dark:bg-emerald-950/70 border border-neutral-200 dark:border-emerald-800/60 text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-emerald-200 mb-1">
                      Ville
                    </label>
                    <input
                      type="text"
                      value={authorCity}
                      onChange={(e) => setAuthorCity(e.target.value)}
                      placeholder="Ex: Dakar"
                      className="w-full rounded-xl px-3 py-2 text-xs bg-neutral-50 dark:bg-emerald-950/70 border border-neutral-200 dark:border-emerald-800/60 text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-700 dark:text-emerald-200">
                    Note d'appréciation :
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-0.5 cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            star <= rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-neutral-300 dark:text-neutral-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <textarea
                    rows={3}
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Écrivez votre avis et votre message d'encouragement pour la communauté..."
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-neutral-50 dark:bg-emerald-950/70 border border-neutral-200 dark:border-emerald-800/60 text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!comment.trim() || isSubmitting}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Publication...' : 'Publier mon avis'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {reviews.slice(0, 6).map((item) => {
            const isAuthorDonor = Boolean(
              item.isDonor ||
                (item.email &&
                  item.email !== 'membre@sanctuaire.app' &&
                  item.email !== 'donateur@sanctuaire.app' &&
                  hasUserDonatedLocally({ email: item.email })) ||
                (hasMadeDonation &&
                  currentUser &&
                  ((currentUser.email &&
                    item.email &&
                    currentUser.email.toLowerCase() === item.email.toLowerCase()) ||
                    (currentUser.name &&
                      item.name &&
                      currentUser.name.toLowerCase() === item.name.toLowerCase())))
            );

            return (
              <div
                key={item.id}
                className="rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-[#183022]/95 border border-emerald-200/80 dark:border-emerald-500/25 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`w-3.5 h-3.5 ${
                            idx < (item.rating || 5)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-neutral-300 dark:text-neutral-600'
                          }`}
                        />
                      ))}
                    </div>
                    <Quote className="w-4 h-4 text-emerald-500/40" />
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-700 dark:text-emerald-50/90 leading-relaxed italic">
                    « {item.comment} »
                  </p>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-emerald-800/40 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-extrabold text-neutral-900 dark:text-white">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80 font-medium">
                      {item.city || 'Sénégal'}
                    </p>
                  </div>
                  {isAuthorDonor && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/30">
                      Sadaqah
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
