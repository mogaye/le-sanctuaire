import React, { useState } from 'react';
import {
  X,
  Download,
  ExternalLink,
  BookOpen,
  ArrowLeft,
  Share2,
  Check,
  FileText,
  Info,
  Maximize2,
  SlidersHorizontal,
} from 'lucide-react';
import { IslamicBook } from '../data/booksData';

interface PdfBookReaderProps {
  book: IslamicBook;
  onClose: () => void;
}

export const PdfBookReader: React.FC<PdfBookReaderProps> = ({ book, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showNativeToolbar, setShowNativeToolbar] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${book.title} - Le Sanctuaire`,
          text: `Lisez l'ouvrage « ${book.title} » sur Le Sanctuaire :`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
      {/* ========================================================
          BARRE SUPÉRIEURE ÉPURÉE, CLAIRE ET BIEN ORGANISÉE
         ======================================================== */}
      <header className="h-15 sm:h-16 px-3 sm:px-6 bg-[#0A1A11] border-b border-emerald-500/25 flex items-center justify-between text-white shrink-0 shadow-md">
        
        {/* Côté Gauche : Bouton Retour + Titre du Livre + Pagination */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-100 hover:text-white text-xs sm:text-sm font-bold transition-all cursor-pointer border border-white/10 active:scale-95 shrink-0"
            title="Quitter la lecture et revenir au catalogue"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Retour</span>
          </button>

          <div className="h-5 w-px bg-white/15 hidden sm:block shrink-0" />

          <div className="min-w-0 flex items-center gap-2">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider shrink-0 hidden md:inline">
              {book.category}
            </span>

            <h1 className="text-xs sm:text-sm md:text-base font-extrabold text-white truncate max-w-[180px] sm:max-w-xs md:max-w-md lg:max-w-lg leading-tight">
              {book.title}
            </h1>

            {book.pageEstimate && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 shrink-0 whitespace-nowrap">
                {book.pageEstimate} pages
              </span>
            )}
          </div>
        </div>

        {/* Côté Droit : Actions claires et bien espacées */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Bouton bascule Outils PDF / Mode Lecture Zen */}
          <button
            onClick={() => setShowNativeToolbar(!showNativeToolbar)}
            className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              showNativeToolbar
                ? 'bg-amber-400 text-neutral-950 border-amber-300 font-bold shadow-xs'
                : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
            }`}
            title={
              showNativeToolbar
                ? 'Passer en Mode Lecture Zen (masquer la barre du navigateur)'
                : 'Afficher la barre d’outils du navigateur (zoom, recherche, dessin)'
            }
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showNativeToolbar ? 'Outils Actifs' : 'Outils PDF'}</span>
          </button>

          {/* Bouton Partager */}
          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 transition cursor-pointer"
            title="Partager cet ouvrage"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Bouton Détails & Résumé */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2 rounded-xl transition cursor-pointer ${
              showInfo
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white/10 hover:bg-white/20 text-emerald-200'
            }`}
            title="Afficher les détails de l'ouvrage"
          >
            <Info className="w-4 h-4" />
          </button>

          {book.pdfUrl && (
            <>
              {/* Bouton Télécharger */}
              <a
                href={book.pdfUrl}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
                title="Télécharger le fichier PDF sur votre appareil"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Télécharger</span>
              </a>

              {/* Bouton Plein Écran dans un nouvel onglet */}
              <a
                href={book.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 transition cursor-pointer"
                title="Ouvrir dans un nouvel onglet"
              >
                <Maximize2 className="w-4 h-4" />
              </a>
            </>
          )}

          {/* Bouton Fermer */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 hover:text-white transition cursor-pointer ml-1"
            title="Fermer le lecteur"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ========================================================
          ZONE CENTRALE : LECTEUR DU DOCUMENT PDF
         ======================================================== */}
      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden bg-[#0A1710]">
        <div className="flex-1 h-full relative">
          {book.pdfUrl ? (
            <iframe
              key={showNativeToolbar ? 'with-toolbar' : 'zen-mode'}
              src={`${book.pdfUrl}#toolbar=${showNativeToolbar ? 1 : 0}&navpanes=0&scrollbar=1&view=FitH`}
              className="w-full h-full border-0 bg-[#16221B]"
              title={book.title}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white">
              <FileText className="w-16 h-16 text-emerald-400/60 mb-4" />
              <h3 className="text-xl font-bold">Fichier en cours de préparation</h3>
              <p className="text-sm text-neutral-400 max-w-md mt-2">
                Le document pour cet ouvrage sera bientôt accessible en lecture directe.
              </p>
            </div>
          )}

          {/* Barre flottante mobile simplifiée */}
          {book.pdfUrl && (
            <div className="sm:hidden absolute bottom-3 left-3 right-3 z-20 flex items-center gap-2 p-2 rounded-2xl bg-[#0A1A11]/95 border border-emerald-500/40 backdrop-blur-md shadow-2xl">
              <a
                href={book.pdfUrl}
                download
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger le PDF</span>
              </a>
              <a
                href={book.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl bg-white/10 text-emerald-200 text-xs font-semibold flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ouvrir</span>
              </a>
            </div>
          )}
        </div>

        {/* Tiroir d'informations sur le livre */}
        {showInfo && (
          <aside className="w-full md:w-84 border-t md:border-t-0 md:border-l border-emerald-500/25 bg-[#0D2418] p-5 text-white overflow-y-auto shrink-0 space-y-4 shadow-xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
              <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-300">
                <BookOpen className="w-4 h-4" />
                <span>À propos de l'ouvrage</span>
              </h3>
              <button
                onClick={() => setShowInfo(false)}
                className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                Fermer
              </button>
            </div>

            {book.arabicTitle && (
              <div className="p-3.5 rounded-2xl bg-[#08170F] border border-emerald-500/25 text-right">
                <span className="font-arabic text-lg text-amber-300 block font-bold leading-relaxed" dir="rtl">
                  {book.arabicTitle}
                </span>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-extrabold">Auteur</span>
              <p className="text-sm font-bold text-white">{book.author}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-extrabold">Catégorie</span>
              <p className="text-xs text-neutral-200">{book.category}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-extrabold">Pagination</span>
              <p className="text-xs text-emerald-300 font-semibold">{book.pageEstimate} pages complètes</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-extrabold">Présentation</span>
              <p className="text-xs text-neutral-300 leading-relaxed font-medium">{book.description}</p>
            </div>

            {book.pdfUrl && (
              <div className="pt-2">
                <a
                  href={book.pdfUrl}
                  download
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger le PDF</span>
                </a>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};
