import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BookOpen,
  Info,
  Shield,
  Eye,
  CheckCircle2,
  Sparkles,
  Layers,
  Moon,
  Sun,
  Palette,
} from 'lucide-react';
import { PdfIslamicBook } from '../data/islamicLibraryData';

interface PdfBookViewerProps {
  book: PdfIslamicBook;
  onClose: () => void;
}

export const PdfBookViewer: React.FC<PdfBookViewerProps> = ({ book, onClose }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showInfoSidebar, setShowInfoSidebar] = useState<boolean>(false);
  const [readingTheme, setReadingTheme] = useState<'dark' | 'sepia' | 'light'>('dark');
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // Prevent keyboard shortcuts for download/print (Ctrl+S, Ctrl+P, Cmd+S, Cmd+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === 'Escape' && !isFullscreen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isFullscreen]);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (!viewerContainerRef.current) return;

    if (!document.fullscreenElement) {
      viewerContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 15, 180));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 15, 75));
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  // Build secure in-app PDF URL with disabled toolbar & download options
  const securePdfUrl = `${book.pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;

  return (
    <div
      ref={viewerContainerRef}
      onContextMenu={(e) => e.preventDefault()}
      className={`fixed inset-0 z-50 flex flex-col transition-colors duration-200 select-none ${
        readingTheme === 'dark'
          ? 'bg-[#0B1710] text-emerald-50'
          : readingTheme === 'sepia'
          ? 'bg-[#F4ECE1] text-[#3D2E1E]'
          : 'bg-[#F9FAF9] text-neutral-900'
      }`}
    >
      {/* TOP READER BAR */}
      <header
        className={`shrink-0 h-16 border-b px-3 sm:px-6 flex items-center justify-between gap-3 z-30 transition-colors backdrop-blur-md ${
          readingTheme === 'dark'
            ? 'bg-[#0F2218]/95 border-emerald-900/60'
            : readingTheme === 'sepia'
            ? 'bg-[#EAE0D2]/95 border-[#D8C9B4]'
            : 'bg-white/95 border-neutral-200'
        }`}
      >
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              readingTheme === 'dark'
                ? 'bg-emerald-950/70 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/80 hover:text-white'
                : readingTheme === 'sepia'
                ? 'bg-[#E3D6C3] border-[#CDBC9F] text-[#4A3824] hover:bg-[#D9C9B1]'
                : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200'
            }`}
            title="Retour à la bibliothèque"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Bibliothèque</span>
          </button>

          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-extrabold truncate max-w-[190px] sm:max-w-md md:max-w-xl">
              {book.title}
            </h1>
            <p
              className={`text-[10px] sm:text-[11px] font-medium truncate ${
                readingTheme === 'dark'
                  ? 'text-emerald-400/90'
                  : readingTheme === 'sepia'
                  ? 'text-[#7D5E3C]'
                  : 'text-neutral-500'
              }`}
            >
              {book.author} • {book.pagesCount} pages • Lecture protégée intégrée
            </p>
          </div>
        </div>

        {/* Right: Controls (Zoom, Theme, Info, Fullscreen) — Strictly NO Download Button */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Zoom controls */}
          <div
            className={`hidden md:flex items-center rounded-xl p-0.5 border ${
              readingTheme === 'dark'
                ? 'bg-emerald-950/80 border-emerald-800/60'
                : readingTheme === 'sepia'
                ? 'bg-[#E2D5C2] border-[#CCBBA0]'
                : 'bg-neutral-100 border-neutral-200'
            }`}
          >
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:opacity-80 transition cursor-pointer"
              title="Zoom arrière (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              className="px-2 text-[11px] font-bold font-mono min-w-[42px] text-center cursor-pointer"
              title="Réinitialiser le zoom"
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg hover:opacity-80 transition cursor-pointer"
              title="Zoom avant (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Theme switcher */}
          <div
            className={`flex items-center rounded-xl p-0.5 border ${
              readingTheme === 'dark'
                ? 'bg-emerald-950/80 border-emerald-800/60'
                : readingTheme === 'sepia'
                ? 'bg-[#E2D5C2] border-[#CCBBA0]'
                : 'bg-neutral-100 border-neutral-200'
            }`}
          >
            <button
              type="button"
              onClick={() => setReadingTheme('dark')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                readingTheme === 'dark'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-emerald-400/80 hover:text-white'
              }`}
              title="Mode Nuit (Émeraude)"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setReadingTheme('sepia')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                readingTheme === 'sepia'
                  ? 'bg-[#C4A482] text-[#2C1D11] font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="Mode Sépia (Papier)"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setReadingTheme('light')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                readingTheme === 'light'
                  ? 'bg-white shadow-xs text-emerald-800 font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="Mode Jour (Clair)"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Info Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowInfoSidebar(!showInfoSidebar)}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
              showInfoSidebar
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : readingTheme === 'dark'
                ? 'bg-emerald-950/70 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/80'
                : readingTheme === 'sepia'
                ? 'bg-[#E3D6C3] border-[#CDBC9F] text-[#4A3824] hover:bg-[#D9C9B1]'
                : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200'
            }`}
            title="Détails & Fiche du livre"
          >
            <Info className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline">Détails</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              readingTheme === 'dark'
                ? 'bg-emerald-950/70 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/80 hover:text-white'
                : readingTheme === 'sepia'
                ? 'bg-[#E3D6C3] border-[#CDBC9F] text-[#4A3824] hover:bg-[#D9C9B1]'
                : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200'
            }`}
            title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* VIEWER BODY + OPTIONAL INFO DRAWER */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Main PDF Frame Container */}
        <div className="flex-1 relative h-full flex flex-col items-center justify-center overflow-auto p-1 sm:p-3">
          <div
            style={{
              width: `${zoomLevel}%`,
              maxWidth: zoomLevel <= 100 ? '1100px' : 'none',
              height: '100%',
              transition: 'width 200ms ease-out',
            }}
            className="relative flex flex-col h-full rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-emerald-900/30 bg-black/40"
          >
            {/* Embedded Native PDF Viewer */}
            <iframe
              src={securePdfUrl}
              title={book.title}
              className="w-full h-full border-0 select-none"
              style={{
                pointerEvents: 'auto',
              }}
            />

            {/* Subtle View-Only Security Watermark badge at bottom-left */}
            <div className="absolute bottom-3 left-3 pointer-events-none z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/85 backdrop-blur-md border border-emerald-500/30 text-[10px] font-bold text-emerald-200 shadow-lg">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Le Sanctuaire • Consultation en ligne protégée</span>
            </div>
          </div>
        </div>

        {/* SIDEBAR DRAWER (Details / Summary / Highlights) */}
        {showInfoSidebar && (
          <aside
            className={`w-full sm:w-88 md:w-96 border-l flex flex-col h-full z-20 overflow-y-auto p-5 sm:p-6 transition-all ${
              readingTheme === 'dark'
                ? 'bg-[#0E2017] border-emerald-900/60 text-emerald-50'
                : readingTheme === 'sepia'
                ? 'bg-[#EFE5D6] border-[#D8C7AF] text-[#3D2E1E]'
                : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-emerald-800/30 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">
                  Fiche de l'ouvrage
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoSidebar(false)}
                className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
              >
                Fermer
              </button>
            </div>

            <div className="space-y-4">
              {/* Arabic Calligraphy Header */}
              {book.arabicTitle && (
                <div
                  className={`p-3.5 rounded-2xl text-center border ${
                    readingTheme === 'dark'
                      ? 'bg-emerald-950/60 border-emerald-800/50 text-emerald-200'
                      : readingTheme === 'sepia'
                      ? 'bg-[#E3D4BF] border-[#CDBC9F] text-[#4A3824]'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <p className="font-arabic text-xl sm:text-2xl leading-relaxed text-amber-400">
                    {book.arabicTitle}
                  </p>
                </div>
              )}

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500 block mb-1">
                  Titre Intégral
                </span>
                <p className="text-sm font-bold leading-snug">{book.title}</p>
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500 block mb-1">
                  Auteur & Référence
                </span>
                <p className="text-xs font-extrabold">{book.author}</p>
                {book.authorTitle && (
                  <p className="text-[11px] opacity-75 mt-0.5">{book.authorTitle}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <div
                  className={`p-2.5 rounded-xl border text-center ${
                    readingTheme === 'dark'
                      ? 'bg-emerald-950/40 border-emerald-800/40'
                      : readingTheme === 'sepia'
                      ? 'bg-[#E4D6C2] border-[#CBB89B]'
                      : 'bg-neutral-100 border-neutral-200'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold opacity-75 block">Pagination</span>
                  <span className="text-xs font-black text-amber-400">{book.pagesCount} pages</span>
                </div>
                <div
                  className={`p-2.5 rounded-xl border text-center ${
                    readingTheme === 'dark'
                      ? 'bg-emerald-950/40 border-emerald-800/40'
                      : readingTheme === 'sepia'
                      ? 'bg-[#E4D6C2] border-[#CBB89B]'
                      : 'bg-neutral-100 border-neutral-200'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold opacity-75 block">Thématique</span>
                  <span className="text-xs font-black truncate block">{book.categoryLabel}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500 block mb-1">
                  Présentation
                </span>
                <p className="text-xs leading-relaxed opacity-90">{book.description}</p>
              </div>

              {book.highlights && book.highlights.length > 0 && (
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500 block mb-2">
                    Points Clés Abordés
                  </span>
                  <ul className="space-y-2">
                    {book.highlights.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="opacity-90">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Protection notice */}
              <div
                className={`p-3 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2 ${
                  readingTheme === 'dark'
                    ? 'bg-emerald-950/60 border-emerald-700/40 text-emerald-300'
                    : readingTheme === 'sepia'
                    ? 'bg-[#E4D7C4] border-[#CDBC9F] text-[#4A3824]'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Ce document est proposé en consultation directe exclusive pour préserver l'intégrité de l'édition et favoriser la lecture spirituelle sur place.
                </span>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
