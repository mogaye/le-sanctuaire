import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Send, X } from 'lucide-react';
import { UserProfile } from '../types';
import { submitUserReport } from '../lib/supabase';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  currentUser: UserProfile | null;
  pageContext: string;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  currentUser,
  pageContext,
}) => {
  const [category, setCategory] = useState<'bug' | 'audio' | 'horaires' | 'paiement' | 'autre'>('bug');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!subject.trim() || !description.trim()) {
      setErrorMsg('Merci de renseigner un objet et une description.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitUserReport({
        reporterEmail: currentUser?.email,
        reporterName: currentUser?.name,
        category,
        subject: subject.trim(),
        description: description.trim(),
        pageContext,
      });
      if (!res?.ok) {
        setErrorMsg(res?.error || 'Impossible d’envoyer le signalement.');
        return;
      }
      setSubmitted(true);
      setSubject('');
      setDescription('');
    } catch {
      setErrorMsg('Erreur réseau lors de l’envoi du signalement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      data-testid="report-issue-modal"
      className="fixed inset-0 z-[10066] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden ${
          isDarkMode
            ? 'bg-[#0F1814] border-white/15 text-[#F2F5F3]'
            : 'bg-white border-[#D4D1C8] text-[#18221D]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isDarkMode ? 'border-white/10' : 'border-[#EAE6DD]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#D97706]" />
            <h3 className="text-base font-bold">Signaler un problème</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              onClose();
            }}
            aria-label="Fermer"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-6 text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-[#16A34A] mx-auto" />
            <div className="space-y-1">
              <h4 className="text-base font-bold">Signalement envoyé</h4>
              <p className={`text-xs ${isDarkMode ? 'text-white/70' : 'text-[#565C58]'}`}>
                L’équipe du Sanctuaire a bien reçu votre message et l’examinera rapidement dans le tableau de bord administrateur.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="h-10 px-6 rounded-full bg-[#1B573E] text-white text-xs font-bold cursor-pointer"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {errorMsg && (
              <div className="rounded-xl px-3 py-2 bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold">Catégorie</label>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'bug', label: 'Bug technique' },
                    { id: 'audio', label: 'Audio / Récitation' },
                    { id: 'horaires', label: 'Horaires' },
                    { id: 'paiement', label: 'Forfait / Paiement' },
                    { id: 'autre', label: 'Autre' },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`h-8 px-3 rounded-full text-xs font-semibold cursor-pointer border transition-colors ${
                      category === c.id
                        ? 'bg-[#1B573E] text-white border-[#1B573E]'
                        : isDarkMode
                        ? 'border-white/15 text-white/75 hover:bg-white/10'
                        : 'border-[#D4D1C8] text-[#4F5551] hover:bg-[#F5F3EE]'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="report-subject" className="block text-xs font-bold">
                Objet
              </label>
              <input
                id="report-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex : Problème d'export vidéo 720p..."
                className={`w-full h-10 px-3.5 rounded-xl border text-sm outline-none ${
                  isDarkMode
                    ? 'bg-white/5 border-white/15 text-white placeholder:text-white/40'
                    : 'bg-[#F8F6F1] border-[#D4D1C8] text-[#18221D] placeholder:text-[#787E7A]'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="report-description" className="block text-xs font-bold">
                Détails
              </label>
              <textarea
                id="report-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez précisément ce qui s'est produit..."
                className={`w-full p-3.5 rounded-xl border text-sm outline-none resize-none ${
                  isDarkMode
                    ? 'bg-white/5 border-white/15 text-white placeholder:text-white/40'
                    : 'bg-[#F8F6F1] border-[#D4D1C8] text-[#18221D] placeholder:text-[#787E7A]'
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className={`h-10 px-4 rounded-full text-xs font-semibold cursor-pointer ${
                  isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'
                }`}
              >
                Annuler
              </button>
              <button
                type="submit"
                data-testid="report-submit-btn"
                disabled={submitting}
                className="h-10 px-5 rounded-full bg-[#1B573E] hover:bg-[#154631] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Envoyer</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
