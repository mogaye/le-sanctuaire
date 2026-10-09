import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  X,
  ChevronRight,
  ChevronLeft,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  PUITS_DE_NOUR_CHARACTERS,
  PUITS_DE_NOUR_LOCATIONS,
  PUITS_DE_NOUR_HERO_IMAGE,
  BookCharacter,
} from '../data/puitsDeNourCharacters';
import { PUITS_DE_NOUR_CHAPTERS, BookChapter } from '../data/puitsDeNourText';
import { CharacterPortrait } from './CharacterPortrait';

interface PuitsDeNourReaderProps {
  onClose?: () => void;
}

// Construit un texte de présentation continu et fluide (sans découpage en parties/rubriques)
function buildContinuousCharacterParagraphs(character: BookCharacter): string[] {
  const paragraphs: string[] = [];

  // Paragraphe 1 : Identité, âge, rôle, présentation générale et parents / famille
  const p1Parts = [
    `${character.name} (${character.age}) — ${character.role}.`,
    character.shortBio,
    character.parentsAndFamily,
  ].filter(Boolean);
  paragraphs.push(p1Parts.join(' '));

  // Paragraphe 2 : Apparence physique et personnalité
  const p2Parts = [character.appearance, character.personality].filter(Boolean);
  if (p2Parts.length > 0) {
    paragraphs.push(p2Parts.join(' '));
  }

  // Paragraphe 3 : Conflit intérieur, blessures et secrets
  const p3Parts: string[] = [];
  if (character.innerConflict) {
    p3Parts.push(`Son questionnement intérieur traverse tout le récit : « ${character.innerConflict} »`);
  }
  if (character.woundsAndSecrets) {
    p3Parts.push(character.woundsAndSecrets);
  }
  if (p3Parts.length > 0) {
    paragraphs.push(p3Parts.join(' '));
  }

  // Paragraphe 4 : Liens et relations avec les autres personnages du village
  if (character.relations && character.relations.length > 0) {
    const relSentences = character.relations
      .map((r) => `Avec ${r.person}, ${r.description.charAt(0).toLowerCase()}${r.description.slice(1)}`)
      .join(' ');
    paragraphs.push(relSentences);
  }

  // Paragraphe 5 : Attitudes dans l'histoire et évolution
  const p5Parts: string[] = [];
  if (character.reactions && character.reactions.length > 0) {
    const reactSentences = character.reactions
      .map(
        (item) =>
          `${item.situation} : ${item.reaction.charAt(0).toLowerCase()}${item.reaction.slice(1)}`
      )
      .join(' ');
    p5Parts.push(reactSentences);
  }
  if (character.evolution) {
    p5Parts.push(character.evolution);
  }
  if (p5Parts.length > 0) {
    paragraphs.push(p5Parts.join(' '));
  }

  return paragraphs;
}

export const PuitsDeNourReader: React.FC<PuitsDeNourReaderProps> = () => {
  const [activeTab, setActiveTab] = useState<'lecture' | 'personnages' | 'lieux'>('lecture');
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(0);
  const [selectedCharacter, setSelectedCharacter] = useState<BookCharacter | null>(null);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('lg');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const readerTopRef = useRef<HTMLDivElement>(null);

  // Stop speech synthesis on unmount or character change
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [selectedCharacter]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeech = (character: BookCharacter) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const fullText = buildContinuousCharacterParagraphs(character).join(' ');
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.96;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Build sorted alias map for inline character detection without altering a single character of the text
  const aliasData = useMemo(() => {
    const entries: { alias: string; character: BookCharacter }[] = [];
    for (const char of PUITS_DE_NOUR_CHARACTERS) {
      for (const alias of char.aliases) {
        if (alias && alias.trim().length > 2) {
          entries.push({ alias: alias.trim(), character: char });
        }
      }
    }
    entries.sort((a, b) => b.alias.length - a.alias.length);
    return entries;
  }, []);

  const aliasRegex = useMemo(() => {
    if (aliasData.length === 0) return null;
    const escaped = aliasData.map((item) =>
      item.alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    return new RegExp(`(${escaped.join('|')})`, 'g');
  }, [aliasData]);

  const findCharacterByTextMatch = (matchText: string): BookCharacter | undefined => {
    return aliasData.find((item) => item.alias === matchText)?.character;
  };

  // Render a line of text 100% verbatim while making character names clickable to open the lateral drawer
  const renderInteractiveLine = (line: string, lineKey: string) => {
    if (!aliasRegex) {
      return line;
    }

    const parts = line.split(aliasRegex);
    if (parts.length === 1) return line;

    return parts.map((part, idx) => {
      const matchedChar = findCharacterByTextMatch(part);
      if (matchedChar) {
        return (
          <button
            key={`${lineKey}-match-${idx}`}
            type="button"
            onClick={() => setSelectedCharacter(matchedChar)}
            className="inline font-semibold text-emerald-800 dark:text-amber-300 decoration-emerald-600/70 dark:decoration-amber-400/70 underline decoration-dotted underline-offset-4 hover:decoration-solid transition-colors cursor-pointer"
            title={`Voir la présentation de ${matchedChar.name}`}
          >
            {part}
          </button>
        );
      }
      return <React.Fragment key={`${lineKey}-part-${idx}`}>{part}</React.Fragment>;
    });
  };

  // Group unwrapped lines into paragraphs exactly as written in the manuscript
  const parseChapterBlocks = (chapter: BookChapter) => {
    const rawLines = chapter.rawText.split('\n');
    const blocks: {
      type: 'chapter-title' | 'section-title' | 'divider' | 'paragraph';
      text: string;
    }[] = [];

    let currentParagraphLines: string[] = [];

    const flushParagraph = () => {
      if (currentParagraphLines.length > 0) {
        blocks.push({
          type: 'paragraph',
          text: currentParagraphLines.join('\n'),
        });
        currentParagraphLines = [];
      }
    };

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        continue;
      }

      if (
        trimmed.startsWith('Chapitre 1 ---') ||
        trimmed.startsWith('Chapitre 2 ---') ||
        trimmed.startsWith('Chapitre 3 ---') ||
        trimmed.startsWith('Chapitre 4 ---') ||
        trimmed.startsWith('Épilogue ---') ||
        trimmed === 'Le Puits de Nour'
      ) {
        flushParagraph();
        blocks.push({ type: 'chapter-title', text: line });
        continue;
      }

      if (trimmed === '---') {
        flushParagraph();
        blocks.push({ type: 'divider', text: line });
        continue;
      }

      const isNumberedSection = /^\d+\.\s+[A-ZÉÈÊÀÂÎÏÔÙÛÇŒ]/.test(trimmed);
      const isNamedSubheader =
        !trimmed.startsWith('---') &&
        !trimmed.startsWith('«') &&
        trimmed.length < 48 &&
        !/[.!?:,;»]$/.test(trimmed) &&
        (i === 1 ||
          rawLines[i - 1]?.trim().startsWith('Chapitre ') ||
          (/^[A-ZÉÈÊÀÂÎÏÔÙÛÇŒ][a-zéèêàâîïôùûçœ']+\s/.test(trimmed) &&
            currentParagraphLines.length > 0 &&
            /[.!?»"]$/.test(currentParagraphLines[currentParagraphLines.length - 1].trim())));

      if (isNumberedSection || isNamedSubheader) {
        flushParagraph();
        blocks.push({ type: 'section-title', text: line });
        continue;
      }

      if (trimmed.startsWith('--- ')) {
        flushParagraph();
        currentParagraphLines.push(line);
        continue;
      }

      if (currentParagraphLines.length > 0) {
        const prevTrimmed = currentParagraphLines[currentParagraphLines.length - 1].trim();
        const prevEndsSentence = /[.!?»"]$/.test(prevTrimmed);
        const currentStartsSentence = /^[A-ZÉÈÊÀÂÎÏÔÙÛÇŒ«]/.test(trimmed);
        if (prevEndsSentence && currentStartsSentence) {
          flushParagraph();
        }
      }

      currentParagraphLines.push(line);
    }

    flushParagraph();
    return blocks;
  };

  const filteredCharacters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return PUITS_DE_NOUR_CHARACTERS;
    return PUITS_DE_NOUR_CHARACTERS.filter(
      (char) =>
        char.name.toLowerCase().includes(q) ||
        char.role.toLowerCase().includes(q) ||
        char.shortBio.toLowerCase().includes(q) ||
        char.parentsAndFamily.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const fontSizeClass = {
    sm: 'text-sm sm:text-base leading-relaxed',
    base: 'text-base sm:text-lg leading-relaxed',
    lg: 'text-lg sm:text-xl leading-[1.9]',
    xl: 'text-xl sm:text-2xl leading-[1.95]',
  }[fontSize];

  const currentChapter = PUITS_DE_NOUR_CHAPTERS[selectedChapterIndex];
  const currentBlocks = useMemo(() => parseChapterBlocks(currentChapter), [currentChapter]);

  const handleSelectChapter = (idx: number) => {
    setSelectedChapterIndex(idx);
    setActiveTab('lecture');
    readerTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div ref={readerTopRef} className="relative w-full">
      {/* ==============================================================
          EN-TÊTE ÉDITORIAL DU LIVRE "LE PUITS DE NOUR" (FORMAT CLAIR DOUX & SOMBRE)
         ============================================================== */}
      <div className="relative rounded-3xl overflow-hidden bg-[#E6DEC8] dark:bg-stone-900 border border-amber-700/25 dark:border-amber-500/30 shadow-lg dark:shadow-2xl mb-6">
        <div className="absolute inset-0">
          <img
            src={PUITS_DE_NOUR_HERO_IMAGE}
            alt="Le Puits de Nour - Village de Dar-Salam"
            className="w-full h-full object-cover opacity-55 dark:opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#EAE2CE]/90 via-[#EFE9DA]/75 to-[#E6DEC8]/45 dark:from-stone-950 dark:via-stone-950/80 dark:to-stone-900/40" />
        </div>

        <div className="relative z-10 p-6 sm:p-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-900/15 dark:bg-amber-500/20 border border-amber-800/30 dark:border-amber-400/40 text-amber-950 dark:text-amber-300 text-xs font-bold tracking-wide uppercase mb-4 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-800 dark:text-amber-300" />
            <span>Livre d'Aujourd'hui • Édition Intégrale Interactive</span>
          </div>

          <div className="max-w-3xl space-y-3">
            <div className="font-serif text-amber-900 dark:text-amber-300/90 text-sm sm:text-base tracking-widest font-bold">
              بِئْرُ نُور — دَارُ السَّلَام
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-stone-900 dark:text-white tracking-tight font-serif">
              Le Puits de Nour
            </h1>
            <p className="text-sm sm:text-base text-stone-800 dark:text-stone-200/90 leading-relaxed font-medium">
              Texte intégral original en 4 chapitres et épilogue. Cliquez sur le nom d'un personnage dans le texte pour ouvrir sa{' '}
              <strong className="text-emerald-900 dark:text-amber-300 font-bold">
                fenêtre latérale de présentation complète
              </strong>{' '}
              avec sa photo et son histoire complète.
            </p>
          </div>
        </div>
      </div>

      {/* ==============================================================
          BARRE DE NAVIGATION SIMPLE (ÉCRITE, SANS ENCADRÉS, CLAIR & SOMBRE)
         ============================================================== */}
      <div className="sticky top-16 z-30 bg-[#F2EFE9]/95 dark:bg-[#12241A]/95 backdrop-blur-md py-3 border-b border-stone-300/80 dark:border-emerald-500/20 mb-8 flex flex-wrap items-center justify-between gap-6">
        {/* Liens écrits simples */}
        <nav className="flex items-center gap-6 sm:gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('lecture')}
            className={`pb-1 text-sm sm:text-base transition-colors cursor-pointer border-b-2 ${
              activeTab === 'lecture'
                ? 'font-bold text-emerald-800 dark:text-amber-300 border-emerald-700 dark:border-amber-400'
                : 'font-medium text-neutral-500 dark:text-stone-400 hover:text-neutral-900 dark:hover:text-white border-transparent'
            }`}
          >
            Texte du Livre
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('personnages')}
            className={`pb-1 text-sm sm:text-base transition-colors cursor-pointer border-b-2 ${
              activeTab === 'personnages'
                ? 'font-bold text-emerald-800 dark:text-amber-300 border-emerald-700 dark:border-amber-400'
                : 'font-medium text-neutral-500 dark:text-stone-400 hover:text-neutral-900 dark:hover:text-white border-transparent'
            }`}
          >
            Personnages ({PUITS_DE_NOUR_CHARACTERS.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lieux')}
            className={`pb-1 text-sm sm:text-base transition-colors cursor-pointer border-b-2 ${
              activeTab === 'lieux'
                ? 'font-bold text-emerald-800 dark:text-amber-300 border-emerald-700 dark:border-amber-400'
                : 'font-medium text-neutral-500 dark:text-stone-400 hover:text-neutral-900 dark:hover:text-white border-transparent'
            }`}
          >
            Lieux ({PUITS_DE_NOUR_LOCATIONS.length})
          </button>
        </nav>

        {/* Taille du texte écrite simplement */}
        {activeTab === 'lecture' && (
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            {(['sm', 'base', 'lg', 'xl'] as const).map((sz, idx) => (
              <button
                key={sz}
                type="button"
                onClick={() => setFontSize(sz)}
                className={`cursor-pointer transition-colors ${
                  fontSize === sz
                    ? 'font-bold text-emerald-800 dark:text-amber-300 underline underline-offset-4'
                    : 'text-neutral-400 dark:text-stone-500 hover:text-neutral-800 dark:hover:text-stone-200'
                }`}
              >
                A{idx === 0 ? '-' : idx === 3 ? '++' : idx === 2 ? '+' : ''}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ==============================================================
          ONGLET 1 : LECTURE PAR CHAPITRE & TEXTE JUSTIFIÉ (SANS CADRE)
         ============================================================== */}
      {activeTab === 'lecture' && (
        <div>
          {/* Navigation simple par chapitre (écrite, sans boutons encadrés) */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pb-6 mb-8 border-b border-neutral-200 dark:border-emerald-500/15 text-sm sm:text-base font-serif">
            {PUITS_DE_NOUR_CHAPTERS.map((chap, idx) => {
              const isActive = selectedChapterIndex === idx;
              return (
                <button
                  key={chap.id}
                  type="button"
                  onClick={() => handleSelectChapter(idx)}
                  className={`cursor-pointer transition-colors ${
                    isActive
                      ? 'font-bold text-emerald-800 dark:text-amber-300 underline underline-offset-8 decoration-2'
                      : 'text-neutral-500 dark:text-stone-400 hover:text-neutral-900 dark:hover:text-stone-200'
                  }`}
                >
                  {chap.number}
                </button>
              );
            })}
          </div>

          {/* Texte du chapitre sélectionné, justifié et sans cadre */}
          <article className="py-2 text-neutral-900 dark:text-stone-100">
            {currentChapter.epigraph && (
              <p className="italic text-emerald-900 dark:text-amber-200/90 font-serif text-base sm:text-lg mb-8 text-justify">
                {currentChapter.epigraph}
              </p>
            )}

            <div className={`font-serif space-y-6 text-justify ${fontSizeClass}`}>
              {currentBlocks.map((block, bIdx) => {
                const key = `${currentChapter.id}-blk-${bIdx}`;

                if (block.type === 'chapter-title') {
                  return (
                    <h2
                      key={key}
                      className="text-2xl sm:text-3xl font-bold text-emerald-900 dark:text-amber-300 pt-2 pb-3 font-serif text-left"
                    >
                      {block.text}
                    </h2>
                  );
                }

                if (block.type === 'section-title') {
                  return (
                    <h3
                      key={key}
                      className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-amber-200 pt-6 pb-1 font-serif text-left"
                    >
                      {renderInteractiveLine(block.text, key)}
                    </h3>
                  );
                }

                if (block.type === 'divider') {
                  return (
                    <div
                      key={key}
                      className="py-4 flex items-center justify-center text-emerald-700/70 dark:text-amber-400/70 font-mono tracking-widest"
                    >
                      {block.text}
                    </div>
                  );
                }

                const lines = block.text.split('\n');
                return (
                  <p key={key} className="text-neutral-800 dark:text-stone-100/95 text-justify">
                    {lines.map((line, lIdx) => (
                      <React.Fragment key={`${key}-ln-${lIdx}`}>
                        {lIdx > 0 && ' '}
                        {renderInteractiveLine(line, `${key}-ln-${lIdx}`)}
                      </React.Fragment>
                    ))}
                  </p>
                );
              })}
            </div>
          </article>

          {/* Navigation bas de chapitre (écrite simplement) */}
          <div className="flex items-center justify-between pt-10 mt-10 border-t border-neutral-200 dark:border-emerald-500/20 text-sm sm:text-base font-serif">
            <button
              type="button"
              disabled={selectedChapterIndex === 0}
              onClick={() => handleSelectChapter(Math.max(0, selectedChapterIndex - 1))}
              className="inline-flex items-center gap-1.5 font-bold text-neutral-700 dark:text-stone-200 hover:text-emerald-700 dark:hover:text-amber-300 disabled:opacity-30 transition cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Chapitre précédent</span>
            </button>

            <span className="text-xs sm:text-sm text-neutral-500 dark:text-stone-400">
              {selectedChapterIndex + 1} / {PUITS_DE_NOUR_CHAPTERS.length}
            </span>

            <button
              type="button"
              disabled={selectedChapterIndex === PUITS_DE_NOUR_CHAPTERS.length - 1}
              onClick={() =>
                handleSelectChapter(
                  Math.min(PUITS_DE_NOUR_CHAPTERS.length - 1, selectedChapterIndex + 1)
                )
              }
              className="inline-flex items-center gap-1.5 font-bold text-emerald-800 dark:text-amber-300 hover:underline disabled:opacity-30 transition cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Chapitre suivant</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==============================================================
          ONGLET 2 : LISTE DES 19 PERSONNAGES
         ============================================================== */}
      {activeTab === 'personnages' && (
        <div className="space-y-8">
          <div className="border-b border-neutral-300 dark:border-emerald-500/30 pb-2.5 flex items-center gap-3">
            <Search className="w-4 h-4 text-neutral-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un personnage (ex: Yassine, Setti Aïcha, Bilal, Maryam, Hadj Mansour...)"
              className="w-full bg-transparent text-sm text-neutral-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="divide-y divide-neutral-200 dark:divide-emerald-500/20">
            {filteredCharacters.map((char) => {
              const continuousText = buildContinuousCharacterParagraphs(char).join(' ');
              return (
                <div
                  key={char.id}
                  onClick={() => setSelectedCharacter(char)}
                  className="group py-6 flex flex-col sm:flex-row items-start gap-5 cursor-pointer"
                >
                  <CharacterPortrait
                    character={char}
                    className="w-24 h-24 rounded-2xl border border-emerald-500/30 dark:border-amber-500/40 shadow-sm shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="text-xl font-bold font-serif text-neutral-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-amber-300 transition-colors">
                        {char.name}
                      </h3>
                      <p className="text-xs sm:text-sm font-medium text-emerald-800 dark:text-amber-300/90">
                        {char.role} ({char.age})
                      </p>
                    </div>

                    <p className="text-sm sm:text-base font-serif text-neutral-700 dark:text-stone-200 leading-relaxed text-justify line-clamp-3">
                      {continuousText}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==============================================================
          ONGLET 3 : LES 7 LIEUX CLÉS DE L'HISTOIRE
         ============================================================== */}
      {activeTab === 'lieux' && (
        <div className="divide-y divide-neutral-200 dark:divide-emerald-500/20">
          {PUITS_DE_NOUR_LOCATIONS.map((loc, index) => (
            <div key={loc.id} className="py-6 space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-amber-400">
                {index + 1}. {loc.subtitle}
              </div>
              <h3 className="text-xl font-bold font-serif text-neutral-900 dark:text-white">
                {loc.name}
              </h3>
              <p className="text-sm sm:text-base font-serif text-neutral-700 dark:text-stone-200/90 leading-relaxed text-justify">
                {loc.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ==============================================================
          FENÊTRE LATÉRALE (SLIDE-OVER DRAWER) : IMAGE + TEXTE JUSTIFIÉ
         ============================================================== */}
      {selectedCharacter && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setSelectedCharacter(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />

          {/* Contenu de la fenêtre latérale */}
          <aside className="relative z-10 w-full max-w-xl bg-[#F5F1E8] dark:bg-[#12241A] text-stone-900 dark:text-stone-100 h-full overflow-y-auto shadow-2xl border-l border-stone-300 dark:border-amber-500/30 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Barre supérieure collante */}
            <div className="sticky top-0 z-20 bg-[#F5F1E8]/95 dark:bg-[#12241A]/95 backdrop-blur-md px-6 py-4 border-b border-stone-300/80 dark:border-emerald-500/25 flex items-center justify-between gap-3">
              <h2 className="text-base sm:text-lg font-bold font-serif text-neutral-900 dark:text-white truncate">
                {selectedCharacter.name}
              </h2>

              <div className="flex items-center gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleSpeech(selectedCharacter)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-amber-300 hover:underline cursor-pointer"
                  title="Écouter la présentation du personnage"
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>Arrêter</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>Écouter</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCharacter(null)}
                  className="p-1.5 text-neutral-600 dark:text-stone-300 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
                  title="Fermer la fenêtre latérale"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Corps de la fenêtre latérale : Photo + Texte simple continu et justifié */}
            <div className="p-6 sm:p-8 space-y-6 flex-1">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-neutral-200 dark:border-emerald-500/20">
                <CharacterPortrait
                  character={selectedCharacter}
                  className="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl border border-emerald-500/40 dark:border-amber-400/60 shadow-lg shrink-0"
                />
                <div className="space-y-1.5 text-center sm:text-left">
                  <h3 className="text-2xl sm:text-3xl font-bold font-serif text-neutral-900 dark:text-white">
                    {selectedCharacter.name}
                  </h3>
                  <p className="text-sm font-medium text-emerald-700 dark:text-amber-300">
                    {selectedCharacter.role}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-emerald-200/70">
                    {selectedCharacter.age}
                  </p>
                </div>
              </div>

              {/* Présentation en simple texte fluide, continu et justifié */}
              <div className="space-y-4 font-serif text-base sm:text-lg leading-relaxed text-neutral-800 dark:text-stone-100 text-justify">
                {buildContinuousCharacterParagraphs(selectedCharacter).map((paragraph, idx) => (
                  <p key={idx} className="text-justify">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Pied de la fenêtre latérale : Navigation simple écrite entre les personnages */}
            <div className="sticky bottom-0 z-20 bg-[#F5F1E8]/95 dark:bg-[#12241A]/95 backdrop-blur-md px-6 py-4 border-t border-stone-300/80 dark:border-emerald-500/25 flex items-center justify-between gap-2 text-xs sm:text-sm font-serif">
              {(() => {
                const currentIdx = PUITS_DE_NOUR_CHARACTERS.findIndex(
                  (c) => c.id === selectedCharacter.id
                );
                const prevChar =
                  PUITS_DE_NOUR_CHARACTERS[
                    (currentIdx - 1 + PUITS_DE_NOUR_CHARACTERS.length) %
                      PUITS_DE_NOUR_CHARACTERS.length
                  ];
                const nextChar =
                  PUITS_DE_NOUR_CHARACTERS[
                    (currentIdx + 1) % PUITS_DE_NOUR_CHARACTERS.length
                  ];

                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedCharacter(prevChar)}
                      className="inline-flex items-center gap-1.5 font-semibold text-neutral-700 dark:text-stone-200 hover:text-emerald-700 dark:hover:text-amber-300 transition cursor-pointer truncate max-w-[45%]"
                    >
                      <ChevronLeft className="w-4 h-4 shrink-0" />
                      <span className="truncate">{prevChar.name}</span>
                    </button>

                    <span className="text-xs text-neutral-400">
                      {currentIdx + 1} / {PUITS_DE_NOUR_CHARACTERS.length}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedCharacter(nextChar)}
                      className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-amber-300 hover:underline transition cursor-pointer truncate max-w-[45%]"
                    >
                      <span className="truncate">{nextChar.name}</span>
                      <ChevronRight className="w-4 h-4 shrink-0" />
                    </button>
                  </>
                );
              })()}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
