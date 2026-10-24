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
  Sparkles,
  Info,
} from 'lucide-react';
import { IslamicBook } from '../data/booksData';

interface PdfBookReaderProps {
  book: IslamicBook;
  onClose: () => void;
}

export const PdfBookReader: React.FC<PdfBookReaderProps> = ({ book, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
      {/* Top Navigation Bar */}
      <header className="h-16 px-4 sm:px-6 bg-[#0E2016] border-b border-emerald-500/30 flex items-center justify-between text-white shrink-0 shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer shrink-0"
            title="Fermer le livre"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider shrink-0">
                {book.category}
              </span>
              {book.pageEstimate && (
                <span className="text-[11px] text-emerald-200/70 hidden sm:inline">
                  • Env. {book.pageEstimate} pages
                </span>
              )}
            </div>
            <h2 className="text-sm sm:text-base font-extrabold truncate text-white leading-tight">
              {book.title}
            </h2>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2 rounded-xl transition cursor-pointer ${
              showInfo ? 'bg-emerald-600 text-white' : 'bg-white/10 hover:bg-white/20 text-emerald-200'
            }`}
            title="Détails du livre"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 transition cursor-pointer"
            title="Partager"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          {book.pdfUrl && (
            <>
              <a
                href={book.pdfUrl}
                download
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
                title="Télécharger le fichier PDF sur votre appareil"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger</span>
              </a>

              <a
                href={book.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 transition cursor-pointer"
                title="Ouvrir en plein écran dans un nouvel onglet"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden bg-[#0A1710]">
        {/* PDF Viewer frame */}
        <div className="flex-1 h-full relative">
          {book.pdfUrl ? (
            <iframe
              src={`${book.pdfUrl}#toolbar=1&navpanes=0&view=FitH`}
              className="w-full h-full border-0 bg-[#1A261F]"
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

          {/* Floating Mobile Download Bar (visible on small screens) */}
          {book.pdfUrl && (
            <div className="sm:hidden absolute bottom-3 left-3 right-3 z-20 flex items-center gap-2 p-2.5 rounded-2xl bg-[#0E2016]/95 border border-emerald-500/40 backdrop-blur-md shadow-2xl">
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

        {/* Side Info Drawer (collapsible or toggleable) */}
        {showInfo && (
          <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l border-emerald-500/25 bg-[#0D2418] p-5 text-white overflow-y-auto shrink-0 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
              <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-300">
                <BookOpen className="w-4 h-4" />
                <span>À propos de l'ouvrage</span>
              </h3>
              <button
                onClick={() => setShowInfo(false)}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Fermer
              </button>
            </div>

            {book.arabicTitle && (
              <div className="p-3 rounded-xl bg-[#08170F] border border-emerald-500/20 text-right">
                <span className="font-arabic text-lg text-amber-300 block" dir="rtl">
                  {book.arabicTitle}
                </span>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">Auteur</span>
              <p className="text-sm font-bold text-white">{book.author}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">Catégorie</span>
              <p className="text-xs text-neutral-200">{book.category}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">Présentation</span>
              <p className="text-xs text-neutral-300 leading-relaxed">{book.description}</p>
            </div>

            {book.pdfUrl && (
              <div className="pt-2">
                <a
                  href={book.pdfUrl}
                  download
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger le livre (PDF)</span>
                </a>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};
