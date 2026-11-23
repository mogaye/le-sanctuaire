import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  Eye,
  EyeOff,
  Library,
  Lock,
  Mic,
  Play,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  ISLAMIC_QUIZ_BANK,
  ISLAMIC_QUIZ_PACKS,
  QUIZ_CATEGORIES,
  QuizCategoryId,
  QuizQuestionItem,
  getQuizCategoryLabel,
} from '../../data/islamicQuizBank';
import {
  QUIZ_NARRATOR_VOICES,
  QuizNarrationBlock,
  QuizNarrationSlotType,
  QuizNarratorSettings,
  QuizNarratorVoiceId,
  createQuizNarrationBlock,
  getNarrationSlotLabel,
  moveNarrationBlockToSlot,
} from '../../utils/quizNarration';
import {
  getAutoFillPool,
  isBlankOrPlaceholderQuizQuestion,
} from '../../utils/quizAutoFill';
import {
  SAMPLE_PASTE_QUIZ_TEXT,
  parsePastedQuizText,
} from '../../utils/quizTextParser';

interface QuizBuilderPanelProps {
  quizTitle: string;
  onChangeQuizTitle: (title: string) => void;
  questions: QuizQuestionItem[];
  onApplyPack: (packId: string) => void;
  onAddBankQuestion: (q: QuizQuestionItem) => void;
  onAddBlankQuestion: () => void;
  onUpdateQuestion: (id: string, patch: Partial<QuizQuestionItem>) => void;
  onMoveQuestion: (index: number, delta: -1 | 1) => void;
  onRemoveQuestion: (id: string) => void;
  thinkSec: number;
  onChangeThinkSec: (sec: number) => void;
  revealSec: number;
  onChangeRevealSec: (sec: number) => void;
  showExplanation: boolean;
  onToggleShowExplanation: () => void;
  soundEnabled: boolean;
  onToggleSoundEnabled: () => void;
  maxQuestions: number;
  activePlanName: string;
  onJumpToQuestion?: (index: number) => void;
  narrator: QuizNarratorSettings;
  onChangeNarrator: (
    updater: QuizNarratorSettings | ((prev: QuizNarratorSettings) => QuizNarratorSettings)
  ) => void;
  onPreviewVoice?: (text: string, voiceId: QuizNarratorVoiceId, blockId?: string) => void;
  previewingBlockId?: string | null;
  onJumpToStepId?: (stepId: string) => void;
  onAutoFillQuiz?: (opts: {
    mode: 'replace' | 'append' | 'fill_blanks';
    category: QuizCategoryId | 'all';
    count: number;
  }) => number;
  onAutoFillSingleQuestion?: (id: string, category?: QuizCategoryId | 'all') => void;
  onApplyParsedQuestions?: (
    parsedQuestions: QuizQuestionItem[],
    mode: 'replace' | 'append'
  ) => number;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

interface NarrationCardProps {
  block: QuizNarrationBlock;
  questions: QuizQuestionItem[];
  voiceId: QuizNarratorVoiceId;
  previewingBlockId?: string | null;
  onUpdateText: (id: string, text: string) => void;
  onToggleShowOnScreen: (id: string) => void;
  onMoveSlot: (
    id: string,
    slot: QuizNarrationSlotType,
    targetQuestionId?: string,
    questionIndex?: number
  ) => void;
  onDelete: (id: string) => void;
  onPreview: (id: string, text: string) => void;
  onFocusBlock?: (blockId: string) => void;
}

const NarrationBlockCard: React.FC<NarrationCardProps> = ({
  block,
  questions,
  previewingBlockId,
  onUpdateText,
  onToggleShowOnScreen,
  onMoveSlot,
  onDelete,
  onPreview,
  onFocusBlock,
}) => {
  const relatedIdx =
    block.slot === 'before_question' || block.slot === 'after_question'
      ? Math.max(
          0,
          questions.findIndex((q) => q.id === block.targetQuestionId)
        )
      : null;

  const slotLabel = getNarrationSlotLabel(
    block.slot,
    relatedIdx !== null && relatedIdx >= 0 ? relatedIdx : block.questionIndex
  );

  const currentSelectValue =
    block.slot === 'video_opening' || block.slot === 'video_closing'
      ? block.slot
      : `${block.slot}:${block.targetQuestionId || questions[block.questionIndex ?? 0]?.id || ''}`;

  const isPreviewing = previewingBlockId === block.id;

  return (
    <div
      data-testid={`studio-quiz-narration-block-${block.id}`}
      data-slot={block.slot}
      className="rounded-2xl border border-[#1B573E]/25 bg-[#EAF3EE]/80 p-3 space-y-2.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-6 h-6 rounded-full bg-[#1B573E] text-white flex items-center justify-center shrink-0">
            <Mic className="w-3 h-3" />
          </span>
          <button
            type="button"
            onClick={() => onFocusBlock?.(`step_narr_${block.id}`)}
            className="text-xs font-extrabold text-[#1B573E] hover:underline cursor-pointer truncate"
          >
            Narration · {slotLabel}
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            data-testid={`studio-quiz-narration-screen-toggle-${block.id}`}
            aria-pressed={block.showOnScreen}
            onClick={() => onToggleShowOnScreen(block.id)}
            title={
              block.showOnScreen
                ? 'Afficher ce texte à l’écran pendant que la voix le lit'
                : 'Voix seule (sans texte à l’écran)'
            }
            className={`h-7 px-2.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap ${
              block.showOnScreen
                ? 'studio-pill-mint'
                : 'studio-pill-raised text-[#565C58]'
            }`}
          >
            {block.showOnScreen ? (
              <Eye className="w-3 h-3 shrink-0" />
            ) : (
              <EyeOff className="w-3 h-3 shrink-0" />
            )}
            <span>{block.showOnScreen ? 'À l’écran' : 'Voix seule'}</span>
          </button>

          <button
            type="button"
            data-testid={`studio-quiz-narration-preview-${block.id}`}
            disabled={!block.text.trim()}
            onClick={() => onPreview(block.id, block.text)}
            className="h-7 px-2.5 rounded-full studio-pill-raised text-[11px] font-semibold text-[#1F2421] inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 whitespace-nowrap"
          >
            <Play className="w-3 h-3 fill-current shrink-0" />
            <span>{isPreviewing ? 'Lecture...' : 'Écouter'}</span>
          </button>

          <button
            type="button"
            data-testid={`studio-quiz-narration-delete-${block.id}`}
            aria-label="Supprimer cette narration"
            onClick={() => onDelete(block.id)}
            className="w-7 h-7 rounded-full studio-pill-raised hover:bg-[#EE9B98]/40 text-[#9B3431] flex items-center justify-center cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <textarea
        rows={2}
        data-testid={`studio-quiz-narration-input-${block.id}`}
        aria-label={`Texte narrateur (${slotLabel})`}
        value={block.text}
        onFocus={() => onFocusBlock?.(`step_narr_${block.id}`)}
        onChange={(e) => onUpdateText(block.id, e.target.value)}
        placeholder="Écrivez le texte que le narrateur va lire..."
        className="w-full px-3 py-2 rounded-xl bg-white/85 border border-[#C6D5CD] text-xs font-semibold text-[#1F2421] placeholder:text-[#787E7A] resize-none leading-snug"
      />

      <div className="flex items-center justify-between gap-2 text-[11px]">
        <label
          htmlFor={`studio-quiz-narration-slot-${block.id}`}
          className="font-semibold text-[#47564E] whitespace-nowrap"
        >
          Position :
        </label>
        <select
          id={`studio-quiz-narration-slot-${block.id}`}
          data-testid={`studio-quiz-narration-slot-select-${block.id}`}
          value={currentSelectValue}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'video_opening' || val === 'video_closing') {
              onMoveSlot(block.id, val);
              return;
            }
            const [slotPart, qId] = val.split(':');
            const qIdx = questions.findIndex((q) => q.id === qId);
            if (
              (slotPart === 'before_question' || slotPart === 'after_question') &&
              qId
            ) {
              onMoveSlot(
                block.id,
                slotPart,
                qId,
                qIdx >= 0 ? qIdx : 0
              );
            }
          }}
          className="flex-1 min-w-0 h-7 px-2.5 rounded-lg bg-white/85 border border-[#C6D5CD] text-[11px] font-semibold text-[#1F2421] cursor-pointer"
        >
          <option value="video_opening">Ouverture vidéo (début)</option>
          {questions.map((q, qIdx) => (
            <React.Fragment key={q.id}>
              <option value={`before_question:${q.id}`}>
                Avant Question {qIdx + 1}
              </option>
              <option value={`after_question:${q.id}`}>
                Après Question {qIdx + 1}
              </option>
            </React.Fragment>
          ))}
          <option value="video_closing">Fin de vidéo (clôture)</option>
        </select>
      </div>
    </div>
  );
};

export const QuizBuilderPanel: React.FC<QuizBuilderPanelProps> = ({
  quizTitle,
  onChangeQuizTitle,
  questions,
  onApplyPack,
  onAddBankQuestion,
  onAddBlankQuestion,
  onUpdateQuestion,
  onMoveQuestion,
  onRemoveQuestion,
  thinkSec,
  onChangeThinkSec,
  revealSec,
  onChangeRevealSec,
  showExplanation,
  onToggleShowExplanation,
  soundEnabled,
  onToggleSoundEnabled,
  maxQuestions,
  activePlanName,
  onJumpToQuestion,
  narrator,
  onChangeNarrator,
  onPreviewVoice,
  previewingBlockId,
  onJumpToStepId,
  onAutoFillQuiz,
  onAutoFillSingleQuestion,
  onApplyParsedQuestions,
}) => {
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [isAutoFillOpen, setIsAutoFillOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isNarratorOpen, setIsNarratorOpen] = useState(true);
  const [bankCategory, setBankCategory] = useState<QuizCategoryId | 'all'>('all');
  const [autoFillTab, setAutoFillTab] = useState<'paste' | 'bank'>('paste');
  const [pasteInputText, setPasteInputText] = useState('');
  const [autoFillCategory, setAutoFillCategory] = useState<QuizCategoryId | 'all'>('all');
  const [autoFillCount, setAutoFillCount] = useState<number>(5);
  const [autoFillNotice, setAutoFillNotice] = useState<string | null>(null);

  const parsedPasteResult = useMemo(
    () => parsePastedQuizText(pasteInputText),
    [pasteInputText]
  );

  const blankQuestionsCount = useMemo(
    () => questions.filter((q) => isBlankOrPlaceholderQuizQuestion(q)).length,
    [questions]
  );

  const autoFillPoolCount = useMemo(
    () => getAutoFillPool(autoFillCategory).length,
    [autoFillCategory]
  );
  const totalBankAutoCount = useMemo(() => getAutoFillPool('all').length, []);

  const isCapped = Number.isFinite(maxQuestions);
  const atLimit = isCapped && questions.length >= maxQuestions;

  const filteredBank = useMemo(() => {
    if (bankCategory === 'all') return ISLAMIC_QUIZ_BANK;
    return ISLAMIC_QUIZ_BANK.filter((q) => q.category === bankCategory);
  }, [bankCategory]);

  const existingIds = useMemo(() => new Set(questions.map((q) => q.id)), [questions]);

  const activeVoiceMeta = useMemo(
    () =>
      QUIZ_NARRATOR_VOICES.find((v) => v.id === narrator.voiceId) ||
      QUIZ_NARRATOR_VOICES[0],
    [narrator.voiceId]
  );

  const openingBlocks = useMemo(
    () => narrator.blocks.filter((b) => b.slot === 'video_opening'),
    [narrator.blocks]
  );

  const closingBlocks = useMemo(
    () => narrator.blocks.filter((b) => b.slot === 'video_closing'),
    [narrator.blocks]
  );

  const getAnchoredBlocks = (
    slot: 'before_question' | 'after_question',
    q: QuizQuestionItem,
    index: number
  ) =>
    narrator.blocks.filter(
      (b) =>
        b.slot === slot &&
        (b.targetQuestionId ? b.targetQuestionId === q.id : b.questionIndex === index)
    );

  const handleAddNarrationBlock = (
    slot: QuizNarrationSlotType,
    targetQuestionId?: string,
    questionIndex?: number
  ) => {
    const newBlock = createQuizNarrationBlock(slot, {
      targetQuestionId,
      questionIndex,
      text:
        slot === 'video_opening'
          ? 'Assalamou alaykoum ! Teste tes connaissances sur l’Islam avec ce quiz.'
          : slot === 'video_closing'
          ? 'Qu’Allah augmente notre science ! Dis ton score en commentaire.'
          : slot === 'before_question'
          ? `Passons à la question ${(questionIndex ?? 0) + 1}.`
          : 'Prends le temps de retenir cette information utile.',
      showOnScreen: true,
    });
    onChangeNarrator((prev) => ({
      ...prev,
      enabled: true,
      blocks: [...prev.blocks, newBlock],
    }));
    onJumpToStepId?.(`step_narr_${newBlock.id}`);
  };

  const handleUpdateBlockText = (id: string, text: string) => {
    onChangeNarrator((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === id ? { ...b, text } : b)),
    }));
  };

  const handleToggleBlockShowOnScreen = (id: string) => {
    onChangeNarrator((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) =>
        b.id === id ? { ...b, showOnScreen: !b.showOnScreen } : b
      ),
    }));
  };

  const handleMoveBlockSlot = (
    id: string,
    slot: QuizNarrationSlotType,
    targetQuestionId?: string,
    questionIndex?: number
  ) => {
    onChangeNarrator((prev) => ({
      ...prev,
      blocks: moveNarrationBlockToSlot(
        prev.blocks,
        id,
        slot,
        targetQuestionId,
        questionIndex
      ),
    }));
  };

  const handleDeleteBlock = (id: string) => {
    onChangeNarrator((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== id),
    }));
  };

  return (
    <div data-testid="studio-quiz-builder" className="space-y-4">
      {/* Compact Top Bar: Count + Drawers (Banque & Packs / Minuteur & Options / Voix Narrateur) */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              data-testid="studio-quiz-toggle-autofill-btn"
              aria-expanded={isAutoFillOpen}
              onClick={() => {
                setIsAutoFillOpen((v) => !v);
                setIsBankOpen(false);
                setIsOptionsOpen(false);
              }}
              className={`h-8 px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                isAutoFillOpen ? 'studio-pill-mint' : 'studio-pill-raised text-[#1F2421]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>Remplir auto</span>
            </button>

            <button
              type="button"
              data-testid="studio-quiz-toggle-bank-btn"
              aria-expanded={isBankOpen}
              onClick={() => {
                setIsBankOpen((v) => !v);
                setIsAutoFillOpen(false);
                setIsOptionsOpen(false);
              }}
              className={`h-8 px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                isBankOpen ? 'studio-pill-mint' : 'studio-pill-raised text-[#1F2421]'
              }`}
            >
              <Library className="w-3.5 h-3.5 shrink-0" />
              <span>Packs &amp; Banque ({ISLAMIC_QUIZ_BANK.length})</span>
            </button>

            <button
              type="button"
              data-testid="studio-quiz-toggle-options-btn"
              aria-expanded={isOptionsOpen}
              onClick={() => {
                setIsOptionsOpen((v) => !v);
                setIsAutoFillOpen(false);
                setIsBankOpen(false);
              }}
              className={`h-8 px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                isOptionsOpen ? 'studio-pill-mint' : 'studio-pill-raised text-[#1F2421]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span>Minuteur · {thinkSec}s</span>
            </button>

            <button
              type="button"
              data-testid="studio-quiz-toggle-narrator-drawer-btn"
              aria-expanded={isNarratorOpen}
              onClick={() => setIsNarratorOpen((v) => !v)}
              className={`h-8 px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                isNarratorOpen && narrator.enabled
                  ? 'studio-pill-mint'
                  : 'studio-pill-raised text-[#1F2421]'
              }`}
            >
              <Mic className="w-3.5 h-3.5 shrink-0" />
              <span>Voix · {narrator.enabled ? activeVoiceMeta.shortLabel : 'Désactivée'}</span>
            </button>
          </div>

          <span className="text-[11px] font-semibold text-[#565C58] tabular-nums whitespace-nowrap">
            {questions.length} {questions.length > 1 ? 'questions' : 'question'}
            {isCapped ? ` / max ${maxQuestions} (${activePlanName})` : ''}
          </span>
        </div>

        {/* Narrator Voice Controls Panel */}
        {isNarratorOpen && (
          <div
            data-testid="studio-quiz-narrator-panel"
            className="rounded-2xl studio-input-inset p-3 space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Mic className="w-3.5 h-3.5 text-[#1B573E] shrink-0" />
                <span className="text-xs font-extrabold text-[#1F2421]">
                  Voix Narration Réaliste (Gratuit)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  data-testid="studio-quiz-narrator-test-btn"
                  onClick={() =>
                    onPreviewVoice?.(
                      questions[0]?.question ||
                        'Assalamou alaykoum ! Bienvenue dans ce quiz islamique.',
                      narrator.voiceId
                    )
                  }
                  className="h-7 px-2.5 rounded-full studio-pill-raised text-[11px] font-semibold text-[#1F2421] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Play className="w-3 h-3 fill-current shrink-0" />
                  <span>
                    {previewingBlockId === '__voice_test__'
                      ? 'Lecture...'
                      : 'Tester la voix'}
                  </span>
                </button>

                <button
                  type="button"
                  data-testid="studio-quiz-narrator-toggle"
                  aria-pressed={narrator.enabled}
                  onClick={() =>
                    onChangeNarrator((prev) => ({
                      ...prev,
                      enabled: !prev.enabled,
                    }))
                  }
                  className={`h-7 px-3 rounded-full text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap ${
                    narrator.enabled
                      ? 'studio-pill-mint'
                      : 'studio-pill-raised text-[#565C58]'
                  }`}
                >
                  {narrator.enabled ? 'Activée' : 'Désactivée'}
                </button>
              </div>
            </div>

            {narrator.enabled && (
              <>
                <div className="grid grid-cols-3 gap-1.5">
                  {QUIZ_NARRATOR_VOICES.map((voice) => {
                    const selected = narrator.voiceId === voice.id;
                    return (
                      <button
                        key={voice.id}
                        type="button"
                        data-testid={`studio-quiz-voice-${voice.id}`}
                        aria-pressed={selected}
                        onClick={() =>
                          onChangeNarrator((prev) => ({
                            ...prev,
                            voiceId: voice.id,
                          }))
                        }
                        className={`h-8 px-2 rounded-xl text-[11px] font-bold cursor-pointer transition-all truncate ${
                          selected
                            ? 'studio-pill-mint'
                            : 'studio-pill-raised text-[#4F5551] hover:text-[#1F2421]'
                        }`}
                        title={voice.description}
                      >
                        {voice.shortLabel}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                  <button
                    type="button"
                    data-testid="studio-quiz-read-questions-toggle"
                    aria-pressed={narrator.readQuestions}
                    onClick={() =>
                      onChangeNarrator((prev) => ({
                        ...prev,
                        readQuestions: !prev.readQuestions,
                      }))
                    }
                    className={`h-7 px-2.5 rounded-full inline-flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap ${
                      narrator.readQuestions
                        ? 'studio-pill-mint'
                        : 'studio-pill-raised text-[#565C58]'
                    }`}
                  >
                    {narrator.readQuestions && (
                      <Check className="w-3 h-3 stroke-[2.5] shrink-0" />
                    )}
                    <span>Lire les questions</span>
                  </button>

                  <button
                    type="button"
                    data-testid="studio-quiz-read-answers-toggle"
                    aria-pressed={narrator.readAnswers}
                    onClick={() =>
                      onChangeNarrator((prev) => ({
                        ...prev,
                        readAnswers: !prev.readAnswers,
                      }))
                    }
                    className={`h-7 px-2.5 rounded-full inline-flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap ${
                      narrator.readAnswers
                        ? 'studio-pill-mint'
                        : 'studio-pill-raised text-[#565C58]'
                    }`}
                  >
                    {narrator.readAnswers && (
                      <Check className="w-3 h-3 stroke-[2.5] shrink-0" />
                    )}
                    <span>Lire les réponses</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Collapsible Non-AI Auto-Fill Drawer (Coller mon texte + Banque auto) */}
        {isAutoFillOpen && (
          <div
            data-testid="studio-quiz-autofill-drawer"
            className="rounded-2xl studio-input-inset p-3.5 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#1B573E] shrink-0" />
                <span className="text-xs font-extrabold text-[#1F2421]">
                  Remplissage automatique (sans IA)
                </span>
              </div>

              <div className="inline-flex items-center gap-1 p-0.5 rounded-full studio-well-inset text-[11px] font-bold">
                <button
                  type="button"
                  data-testid="studio-quiz-autofill-tab-paste"
                  aria-pressed={autoFillTab === 'paste'}
                  onClick={() => {
                    setAutoFillTab('paste');
                    setAutoFillNotice(null);
                  }}
                  className={`h-7 px-2.5 rounded-full inline-flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap ${
                    autoFillTab === 'paste'
                      ? 'studio-pill-mint'
                      : 'text-[#4F5551] hover:text-[#1F2421]'
                  }`}
                >
                  <ClipboardPaste className="w-3 h-3 shrink-0" />
                  <span>Coller mon texte</span>
                </button>
                <button
                  type="button"
                  data-testid="studio-quiz-autofill-tab-bank"
                  aria-pressed={autoFillTab === 'bank'}
                  onClick={() => {
                    setAutoFillTab('bank');
                    setAutoFillNotice(null);
                  }}
                  className={`h-7 px-2.5 rounded-full inline-flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap ${
                    autoFillTab === 'bank'
                      ? 'studio-pill-mint'
                      : 'text-[#4F5551] hover:text-[#1F2421]'
                  }`}
                >
                  <Zap className="w-3 h-3 shrink-0" />
                  <span>Banque auto ({totalBankAutoCount})</span>
                </button>
              </div>
            </div>

            {autoFillTab === 'paste' ? (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="studio-quiz-paste-textarea"
                    className="text-[11px] font-semibold text-[#565C58] leading-snug"
                  >
                    Collez vos questions + choix (A/B/C/D ou tirets -) + réponse (ex : Réponse : B ou ✅) :
                  </label>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      data-testid="studio-quiz-paste-sample-btn"
                      onClick={() => {
                        setPasteInputText(SAMPLE_PASTE_QUIZ_TEXT);
                        setAutoFillNotice(null);
                      }}
                      className="h-6 px-2.5 rounded-full studio-pill-raised text-[10.5px] font-bold text-[#1B573E] cursor-pointer whitespace-nowrap"
                    >
                      Exemple
                    </button>
                    {pasteInputText.trim().length > 0 && (
                      <button
                        type="button"
                        data-testid="studio-quiz-paste-clear-btn"
                        onClick={() => {
                          setPasteInputText('');
                          setAutoFillNotice(null);
                        }}
                        className="h-6 px-2.5 rounded-full studio-pill-raised text-[10.5px] font-semibold text-[#9B3431] cursor-pointer whitespace-nowrap"
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  id="studio-quiz-paste-textarea"
                  rows={6}
                  data-testid="studio-quiz-paste-textarea"
                  value={pasteInputText}
                  onChange={(e) => {
                    setPasteInputText(e.target.value);
                    setAutoFillNotice(null);
                  }}
                  placeholder={`Exemple :\n1. Combien de sourates compte le Coran ?\nA) 110\nB) 114 ✅\nC) 120\nD) 99\n\n2. Quel est le 1er mois du calendrier hégirien ?\nA) Ramadan  B) Rajab  C) Muharram  D) Chawwâl\nRéponse : C`}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/85 border border-[#C6D5CD] text-xs font-medium text-[#1F2421] placeholder:text-[#848A86] leading-relaxed resize-y min-h-[120px]"
                />

                {pasteInputText.trim().length > 0 && (
                  <div
                    data-testid="studio-quiz-paste-preview"
                    className="rounded-xl bg-white/75 border border-[#C6D5CD] p-2.5 space-y-2"
                  >
                    {parsedPasteResult.questions.length > 0 ? (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-extrabold text-[#1B573E] tabular-nums">
                            {parsedPasteResult.questions.length} question
                            {parsedPasteResult.questions.length > 1 ? 's' : ''} détectée
                            {parsedPasteResult.questions.length > 1 ? 's' : ''} ·{' '}
                            {parsedPasteResult.answersDetectedCount} bonne
                            {parsedPasteResult.answersDetectedCount > 1 ? 's' : ''} réponse
                            {parsedPasteResult.answersDetectedCount > 1 ? 's' : ''}
                          </span>
                          {parsedPasteResult.unansweredCount > 0 && (
                            <span className="text-[10.5px] font-semibold text-[#8A6216]">
                              {parsedPasteResult.unansweredCount} sans réponse indiquée (A par défaut)
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 max-h-[150px] overflow-y-auto no-scrollbar pr-0.5">
                          {parsedPasteResult.questions.slice(0, 4).map((pq, pIdx) => (
                            <div
                              key={pq.id}
                              className="rounded-lg bg-[#F5F3EC] border border-[#DFDCD2] px-2.5 py-1.5 space-y-1"
                            >
                              <div className="text-[11px] font-bold text-[#1F2421] line-clamp-1">
                                Q{pIdx + 1}. {pq.question}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {pq.options.map((opt, oIdx) => {
                                  const isRight = pq.correctIndex === oIdx;
                                  return (
                                    <span
                                      key={oIdx}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate max-w-[160px] ${
                                        isRight
                                          ? 'bg-[#1B573E] text-white'
                                          : 'bg-white/80 text-[#4F5551] border border-[#D4D1C8]'
                                      }`}
                                    >
                                      {OPTION_LABELS[oIdx]}. {opt}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          {parsedPasteResult.questions.length > 4 && (
                            <div className="text-[10.5px] font-semibold text-[#565C58] text-center">
                              + {parsedPasteResult.questions.length - 4} autre
                              {parsedPasteResult.questions.length - 4 > 1 ? 's' : ''} question
                              {parsedPasteResult.questions.length - 4 > 1 ? 's' : ''} prête
                              {parsedPasteResult.questions.length - 4 > 1 ? 's' : ''}…
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-[11px] font-semibold text-[#9B3431]">
                        Aucune question avec propositions détectée. Mettez la question sur une ligne et au moins 2 choix en dessous (A), B), C), D) ou - ).
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    data-testid="studio-quiz-paste-replace-btn"
                    disabled={parsedPasteResult.questions.length === 0}
                    onClick={() => {
                      const applied =
                        onApplyParsedQuestions?.(
                          parsedPasteResult.questions,
                          'replace'
                        ) || 0;
                      if (applied > 0) {
                        onJumpToQuestion?.(0);
                        setAutoFillNotice(
                          `${applied} question${applied > 1 ? 's' : ''} répartie${applied > 1 ? 's' : ''} automatiquement dans le quiz !`
                        );
                      }
                    }}
                    className="flex-1 min-w-[180px] h-9 px-3 rounded-full studio-pill-mint text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Répartir et remplacer
                      {parsedPasteResult.questions.length > 0
                        ? ` (${parsedPasteResult.questions.length})`
                        : ''}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="studio-quiz-paste-append-btn"
                    disabled={parsedPasteResult.questions.length === 0}
                    onClick={() => {
                      const prevLen = questions.length;
                      const added =
                        onApplyParsedQuestions?.(
                          parsedPasteResult.questions,
                          'append'
                        ) || 0;
                      if (added > 0) {
                        onJumpToQuestion?.(prevLen);
                        setAutoFillNotice(
                          `${added} question${added > 1 ? 's' : ''} ajoutée${added > 1 ? 's' : ''} à la suite !`
                        );
                      }
                    }}
                    className="h-9 px-3 rounded-full studio-pill-raised text-xs font-semibold text-[#1F2421] inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Ajouter à la suite
                      {parsedPasteResult.questions.length > 0
                        ? ` (+${parsedPasteResult.questions.length})`
                        : ''}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-[#565C58]">
                    Thème des questions
                  </span>
                  <span className="text-[10.5px] font-semibold text-[#1B573E] bg-[#DDE8E2] px-2 py-0.5 rounded-full tabular-nums">
                    {autoFillPoolCount} questions prêtes
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                  <button
                    type="button"
                    data-testid="studio-quiz-autofill-cat-all"
                    aria-pressed={autoFillCategory === 'all'}
                    onClick={() => {
                      setAutoFillCategory('all');
                      setAutoFillNotice(null);
                    }}
                    className={`h-7 px-2.5 rounded-full cursor-pointer transition-all whitespace-nowrap ${
                      autoFillCategory === 'all'
                        ? 'studio-pill-mint'
                        : 'studio-pill-raised text-[#4F5551]'
                    }`}
                  >
                    Toutes
                  </button>
                  {QUIZ_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      data-testid={`studio-quiz-autofill-cat-${cat.id}`}
                      aria-pressed={autoFillCategory === cat.id}
                      onClick={() => {
                        setAutoFillCategory(cat.id);
                        setAutoFillNotice(null);
                      }}
                      className={`h-7 px-2.5 rounded-full cursor-pointer transition-all whitespace-nowrap ${
                        autoFillCategory === cat.id
                          ? 'studio-pill-mint'
                          : 'studio-pill-raised text-[#4F5551]'
                      }`}
                    >
                      {cat.shortLabel}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-[#565C58]">
                    Nombre de questions à générer
                  </div>
                  <div className="grid grid-cols-5 gap-1 p-1 rounded-full studio-well-inset text-[11px] font-bold tabular-nums">
                    {[3, 5, 10, 15, 20].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        data-testid={`studio-quiz-autofill-count-${cnt}`}
                        aria-pressed={autoFillCount === cnt}
                        onClick={() => {
                          setAutoFillCount(cnt);
                          setAutoFillNotice(null);
                        }}
                        className={`h-7 rounded-full cursor-pointer transition-all whitespace-nowrap ${
                          autoFillCount === cnt
                            ? 'studio-pill-mint'
                            : 'text-[#4F5551] hover:text-[#1F2421]'
                        }`}
                      >
                        {cnt} Q
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    data-testid="studio-quiz-autofill-replace-btn"
                    onClick={() => {
                      const filled =
                        onAutoFillQuiz?.({
                          mode: 'replace',
                          category: autoFillCategory,
                          count: autoFillCount,
                        }) || 0;
                      setAutoFillNotice(
                        filled > 0
                          ? `${filled} question${filled > 1 ? 's' : ''} remplie${filled > 1 ? 's' : ''} automatiquement (sans IA).`
                          : 'Aucune nouvelle question disponible pour cette sélection.'
                      );
                    }}
                    className="flex-1 min-w-[165px] h-9 px-3 rounded-full studio-pill-mint text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Remplir {Math.min(autoFillCount, autoFillPoolCount)} question
                      {Math.min(autoFillCount, autoFillPoolCount) > 1 ? 's' : ''}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="studio-quiz-autofill-append-btn"
                    onClick={() => {
                      const added =
                        onAutoFillQuiz?.({
                          mode: 'append',
                          category: autoFillCategory,
                          count: autoFillCount,
                        }) || 0;
                      setAutoFillNotice(
                        added > 0
                          ? `${added} question${added > 1 ? 's' : ''} ajoutée${added > 1 ? 's' : ''} sans doublon.`
                          : 'Toutes les questions de ce thème sont déjà dans votre quiz.'
                      );
                    }}
                    className="h-9 px-3 rounded-full studio-pill-raised text-xs font-semibold text-[#1F2421] inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>Ajouter à la suite</span>
                  </button>

                  {blankQuestionsCount > 0 && (
                    <button
                      type="button"
                      data-testid="studio-quiz-autofill-blanks-btn"
                      onClick={() => {
                        const filled =
                          onAutoFillQuiz?.({
                            mode: 'fill_blanks',
                            category: autoFillCategory,
                            count: blankQuestionsCount,
                          }) || 0;
                        setAutoFillNotice(
                          filled > 0
                            ? `${filled} champ${filled > 1 ? 's' : ''} vide${filled > 1 ? 's' : ''} complété${filled > 1 ? 's' : ''} automatiquement.`
                            : 'Aucun champ vide à compléter.'
                        );
                      }}
                      className="w-full h-8 px-3 rounded-full bg-[#E3F3EC] border border-[#1B573E]/30 text-[11px] font-bold text-[#1B573E] inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <RefreshCw className="w-3 h-3 shrink-0" />
                      <span>
                        {blankQuestionsCount === 1
                          ? 'Compléter la question vide'
                          : `Compléter les ${blankQuestionsCount} questions vides`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {autoFillNotice && (
              <div
                data-testid="studio-quiz-autofill-notice"
                className="rounded-xl bg-[#E3F3EC] border border-[#1B573E]/25 px-3 py-2 text-[11px] font-semibold text-[#1B573E]"
              >
                {autoFillNotice}
              </div>
            )}
          </div>
        )}

        {/* Collapsible Bank & Packs Drawer */}
        {isBankOpen && (
          <div
            data-testid="studio-quiz-bank-drawer"
            className="rounded-2xl studio-input-inset p-3 space-y-3"
          >
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-[#565C58]">
                Packs prêts à l’emploi
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {ISLAMIC_QUIZ_PACKS.map((pack) => (
                  <button
                    key={pack.id}
                    type="button"
                    data-testid={`studio-quiz-pack-${pack.id}`}
                    onClick={() => onApplyPack(pack.id)}
                    className="h-7 px-3 rounded-full studio-pill-raised text-[11px] font-semibold text-[#1F2421] cursor-pointer transition-all whitespace-nowrap shrink-0"
                  >
                    {pack.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#D4D1C8] space-y-2">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setBankCategory('all')}
                  className={`h-7 px-2.5 rounded-full cursor-pointer transition-all whitespace-nowrap ${
                    bankCategory === 'all'
                      ? 'studio-pill-mint'
                      : 'studio-pill-raised text-[#4F5551]'
                  }`}
                >
                  Toutes
                </button>
                {QUIZ_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setBankCategory(cat.id)}
                    className={`h-7 px-2.5 rounded-full cursor-pointer transition-all whitespace-nowrap ${
                      bankCategory === cat.id
                        ? 'studio-pill-mint'
                        : 'studio-pill-raised text-[#4F5551]'
                    }`}
                  >
                    {cat.shortLabel}
                  </button>
                ))}
              </div>

              <div className="max-h-[200px] overflow-y-auto no-scrollbar divide-y divide-[#D4D1C8] pr-1">
                {filteredBank.map((item) => {
                  const alreadyInList = existingIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className="py-2 flex items-center justify-between gap-2.5"
                    >
                      <div className="min-w-0">
                        <div className="text-[10.5px] font-semibold text-[#565C58]">
                          {getQuizCategoryLabel(item.category)} · Rép.{' '}
                          {OPTION_LABELS[item.correctIndex]}
                        </div>
                        <div className="text-xs font-semibold text-[#1F2421] line-clamp-2 leading-snug">
                          {item.question}
                        </div>
                      </div>
                      <button
                        type="button"
                        data-testid={`studio-quiz-bank-add-${item.id}`}
                        onClick={() => onAddBankQuestion(item)}
                        disabled={alreadyInList}
                        className={`h-7 px-2.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 shrink-0 whitespace-nowrap transition-all ${
                          alreadyInList
                            ? 'bg-[#DDE8E2] text-[#1B573E] opacity-75 cursor-default'
                            : 'studio-pill-mint cursor-pointer'
                        }`}
                      >
                        {alreadyInList ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Ajoutée</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Ajouter</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Timing, Title & Audio Options Drawer */}
        {isOptionsOpen && (
          <div
            data-testid="studio-quiz-options-drawer"
            className="rounded-2xl studio-input-inset p-3 space-y-3"
          >
            <div className="space-y-1.5">
              <label
                htmlFor="studio-quiz-title-input"
                className="text-[11px] font-bold text-[#565C58]"
              >
                Titre affiché en haut de la vidéo
              </label>
              <input
                id="studio-quiz-title-input"
                data-testid="studio-quiz-title-input"
                type="text"
                maxLength={44}
                value={quizTitle}
                onChange={(e) => onChangeQuizTitle(e.target.value)}
                placeholder="Ex : Quiz Islam"
                className="w-full h-9 px-3 rounded-xl bg-white/80 border border-[#CECBC2] text-xs font-semibold text-[#1F2421] placeholder:text-[#787E7A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-[#565C58]">
                  Compte à rebours
                </div>
                <div className="grid grid-cols-4 gap-1 p-1 rounded-full studio-well-inset text-[11px] font-bold tabular-nums">
                  {[3, 5, 7, 10].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      data-testid={`studio-quiz-think-${sec}`}
                      onClick={() => onChangeThinkSec(sec)}
                      className={`h-7 rounded-full cursor-pointer transition-all whitespace-nowrap ${
                        thinkSec === sec
                          ? 'studio-pill-mint'
                          : 'text-[#4F5551] hover:text-[#1F2421]'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-[#565C58]">
                  Révélation réponse
                </div>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-full studio-well-inset text-[11px] font-bold tabular-nums">
                  {[2, 3, 4].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      data-testid={`studio-quiz-reveal-${sec}`}
                      onClick={() => onChangeRevealSec(sec)}
                      className={`h-7 rounded-full cursor-pointer transition-all whitespace-nowrap ${
                        revealSec === sec
                          ? 'studio-pill-mint'
                          : 'text-[#4F5551] hover:text-[#1F2421]'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <button
                type="button"
                data-testid="studio-quiz-sound-toggle"
                aria-pressed={soundEnabled}
                onClick={onToggleSoundEnabled}
                className={`h-8 px-3 rounded-full inline-flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                  soundEnabled ? 'studio-pill-mint' : 'studio-pill-raised text-[#565C58]'
                }`}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>Sons tic-tac</span>
              </button>

              <button
                type="button"
                data-testid="studio-quiz-explanation-toggle"
                aria-pressed={showExplanation}
                onClick={onToggleShowExplanation}
                className={`h-8 px-3 rounded-full inline-flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                  showExplanation ? 'studio-pill-mint' : 'studio-pill-raised text-[#565C58]'
                }`}
              >
                {showExplanation && <Check className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />}
                <span>Explication / Source</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Video Opening Narration Blocks + Add CTA */}
      <div className="space-y-2">
        {openingBlocks.map((block) => (
          <NarrationBlockCard
            key={block.id}
            block={block}
            questions={questions}
            voiceId={narrator.voiceId}
            previewingBlockId={previewingBlockId}
            onUpdateText={handleUpdateBlockText}
            onToggleShowOnScreen={handleToggleBlockShowOnScreen}
            onMoveSlot={handleMoveBlockSlot}
            onDelete={handleDeleteBlock}
            onPreview={(id, txt) => onPreviewVoice?.(txt, narrator.voiceId, id)}
            onFocusBlock={onJumpToStepId}
          />
        ))}

        <button
          type="button"
          data-testid="studio-quiz-add-opening-btn"
          onClick={() => handleAddNarrationBlock('video_opening')}
          className="w-full h-8 px-3 rounded-full studio-pill-raised text-[11px] font-bold text-[#1B573E] inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all whitespace-nowrap"
        >
          <Mic className="w-3.5 h-3.5 shrink-0" />
          <span>+ Ajouter une voix d’ouverture vidéo</span>
        </button>
      </div>

      {/* Questions List with Inline Before/After Narration Placement */}
      <div data-testid="studio-quiz-questions-list" className="space-y-3.5">
        {questions.map((q, index) => {
          const beforeBlocks = getAnchoredBlocks('before_question', q, index);
          const afterBlocks = getAnchoredBlocks('after_question', q, index);

          return (
            <div key={q.id} className="space-y-2.5">
              {/* Before-Question Narration Blocks */}
              {beforeBlocks.map((block) => (
                <NarrationBlockCard
                  key={block.id}
                  block={block}
                  questions={questions}
                  voiceId={narrator.voiceId}
                  previewingBlockId={previewingBlockId}
                  onUpdateText={handleUpdateBlockText}
                  onToggleShowOnScreen={handleToggleBlockShowOnScreen}
                  onMoveSlot={handleMoveBlockSlot}
                  onDelete={handleDeleteBlock}
                  onPreview={(id, txt) => onPreviewVoice?.(txt, narrator.voiceId, id)}
                  onFocusBlock={onJumpToStepId}
                />
              ))}

              {/* Question Card */}
              <div
                data-testid={`studio-quiz-item-${index}`}
                className="rounded-2xl border border-[#D4D1C8] bg-[#FAF8F3]/80 p-3.5 space-y-3"
              >
                {/* Question Header + Quick Placement Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onJumpToQuestion?.(index)}
                      className="text-xs font-extrabold text-[#1B573E] hover:underline cursor-pointer whitespace-nowrap tabular-nums"
                      title="Voir cette question dans l'aperçu vidéo"
                    >
                      Question {index + 1}
                    </button>

                    <button
                      type="button"
                      data-testid={`studio-quiz-add-before-${index}`}
                      onClick={() =>
                        handleAddNarrationBlock('before_question', q.id, index)
                      }
                      className="h-6 px-2 rounded-full studio-pill-raised text-[10.5px] font-bold text-[#1B573E] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      title={`Ajouter un texte lu avant la question ${index + 1}`}
                    >
                      <Mic className="w-2.5 h-2.5 shrink-0" />
                      <span>+ Avant Q{index + 1}</span>
                    </button>

                    <button
                      type="button"
                      data-testid={`studio-quiz-add-after-${index}`}
                      onClick={() =>
                        handleAddNarrationBlock('after_question', q.id, index)
                      }
                      className="h-6 px-2 rounded-full studio-pill-raised text-[10.5px] font-bold text-[#1B573E] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      title={`Ajouter un texte lu après la question ${index + 1}`}
                    >
                      <Mic className="w-2.5 h-2.5 shrink-0" />
                      <span>+ Après Q{index + 1}</span>
                    </button>

                    {onAutoFillSingleQuestion && (
                      <button
                        type="button"
                        data-testid={`studio-quiz-autofill-single-${index}`}
                        onClick={() => {
                          onAutoFillSingleQuestion(
                            q.id,
                            isAutoFillOpen ? autoFillCategory : q.category
                          );
                          onJumpToQuestion?.(index);
                        }}
                        aria-label={`Remplir automatiquement la question ${index + 1}`}
                        title="Remplir automatiquement cette question sans IA"
                        className={`h-6 px-2 rounded-full text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap transition-all ${
                          isBlankOrPlaceholderQuizQuestion(q)
                            ? 'studio-pill-mint'
                            : 'studio-pill-raised text-[#1B573E]'
                        }`}
                      >
                        {isBlankOrPlaceholderQuizQuestion(q) ? (
                          <>
                            <Zap className="w-2.5 h-2.5 shrink-0" />
                            <span>Remplir</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-2.5 h-2.5 shrink-0" />
                            <span>Autre</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {questions.length > 1 && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onMoveQuestion(index, -1)}
                        disabled={index === 0}
                        aria-label={`Monter question ${index + 1}`}
                        className="w-7 h-7 rounded-full studio-pill-raised flex items-center justify-center text-[#565C58] disabled:opacity-35 cursor-pointer"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveQuestion(index, 1)}
                        disabled={index === questions.length - 1}
                        aria-label={`Descendre question ${index + 1}`}
                        className="w-7 h-7 rounded-full studio-pill-raised flex items-center justify-center text-[#565C58] disabled:opacity-35 cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveQuestion(q.id)}
                        aria-label={`Supprimer question ${index + 1}`}
                        className="w-7 h-7 rounded-full studio-pill-raised hover:bg-[#EE9B98]/40 text-[#9B3431] flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Espace Question */}
                <div className="space-y-1.5">
                  <label
                    htmlFor={`studio-quiz-question-input-${index}`}
                    className="block text-[11px] font-bold text-[#565C58]"
                  >
                    Espace question
                  </label>
                  <textarea
                    id={`studio-quiz-question-input-${index}`}
                    rows={2}
                    data-testid={`studio-quiz-question-input-${index}`}
                    aria-label={`Texte de la question ${index + 1}`}
                    value={q.question}
                    onFocus={() => onJumpToQuestion?.(index)}
                    onChange={(e) => onUpdateQuestion(q.id, { question: e.target.value })}
                    placeholder="Écrivez votre question ici..."
                    className="w-full px-3 py-2.5 rounded-xl studio-input-inset text-xs font-semibold text-[#1F2421] placeholder:text-[#787E7A] resize-none leading-snug"
                  />
                </div>

                {/* Réponses de choix */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="text-[11px] font-bold text-[#565C58]">
                    Réponses au choix (cliquez sur la bonne réponse)
                  </div>
                  <div className="space-y-2">
                    {OPTION_LABELS.map((letter, optIdx) => {
                      const isCorrect = q.correctIndex === optIdx;
                      return (
                        <div
                          key={letter}
                          className={`flex items-center gap-2 rounded-xl p-1 transition-all ${
                            isCorrect
                              ? 'bg-[#E3F3EC]/85 ring-1 ring-[#1B573E]/30'
                              : 'bg-transparent'
                          }`}
                        >
                          <button
                            type="button"
                            data-testid={`studio-quiz-correct-${index}-${optIdx}`}
                            aria-label={`Définir ${letter} comme bonne réponse pour la question ${index + 1}`}
                            aria-pressed={isCorrect}
                            onClick={() => {
                              onUpdateQuestion(q.id, {
                                correctIndex: optIdx as 0 | 1 | 2 | 3,
                              });
                              onJumpToQuestion?.(index);
                            }}
                            className={`w-8 h-8 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                              isCorrect
                                ? 'bg-[#1B573E] text-white shadow-sm'
                                : 'studio-pill-raised text-[#4F5551] hover:text-[#1F2421]'
                            }`}
                          >
                            {isCorrect ? (
                              <Check className="w-3.5 h-3.5 stroke-[2.75]" />
                            ) : (
                              letter
                            )}
                          </button>

                          <input
                            type="text"
                            data-testid={`studio-quiz-option-${index}-${optIdx}`}
                            aria-label={`Réponse ${letter} question ${index + 1}`}
                            value={q.options[optIdx]}
                            onFocus={() => onJumpToQuestion?.(index)}
                            onChange={(e) => {
                              const nextOpts = [...q.options] as [
                                string,
                                string,
                                string,
                                string,
                              ];
                              nextOpts[optIdx] = e.target.value;
                              onUpdateQuestion(q.id, { options: nextOpts });
                            }}
                            placeholder={`Choix ${letter}...`}
                            className="flex-1 min-w-0 h-8 px-3 rounded-lg studio-input-inset text-xs font-medium text-[#1F2421] placeholder:text-[#848A86]"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {showExplanation && (
                  <input
                    type="text"
                    aria-label={`Explication ou source question ${index + 1}`}
                    value={q.explanation || ''}
                    onChange={(e) =>
                      onUpdateQuestion(q.id, { explanation: e.target.value })
                    }
                    placeholder="Explication courte (optionnel)"
                    className="w-full h-8 px-3 rounded-xl studio-input-inset text-[11px] font-medium text-[#4F5551] placeholder:text-[#848A86]"
                  />
                )}
              </div>

              {/* After-Question Narration Blocks */}
              {afterBlocks.map((block) => (
                <NarrationBlockCard
                  key={block.id}
                  block={block}
                  questions={questions}
                  voiceId={narrator.voiceId}
                  previewingBlockId={previewingBlockId}
                  onUpdateText={handleUpdateBlockText}
                  onToggleShowOnScreen={handleToggleBlockShowOnScreen}
                  onMoveSlot={handleMoveBlockSlot}
                  onDelete={handleDeleteBlock}
                  onPreview={(id, txt) => onPreviewVoice?.(txt, narrator.voiceId, id)}
                  onFocusBlock={onJumpToStepId}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Video Closing Narration Blocks + Add CTA */}
      <div className="space-y-2">
        {closingBlocks.map((block) => (
          <NarrationBlockCard
            key={block.id}
            block={block}
            questions={questions}
            voiceId={narrator.voiceId}
            previewingBlockId={previewingBlockId}
            onUpdateText={handleUpdateBlockText}
            onToggleShowOnScreen={handleToggleBlockShowOnScreen}
            onMoveSlot={handleMoveBlockSlot}
            onDelete={handleDeleteBlock}
            onPreview={(id, txt) => onPreviewVoice?.(txt, narrator.voiceId, id)}
            onFocusBlock={onJumpToStepId}
          />
        ))}

        <button
          type="button"
          data-testid="studio-quiz-add-closing-btn"
          onClick={() => handleAddNarrationBlock('video_closing')}
          className="w-full h-8 px-3 rounded-full studio-pill-raised text-[11px] font-bold text-[#1B573E] inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all whitespace-nowrap"
        >
          <Mic className="w-3.5 h-3.5 shrink-0" />
          <span>+ Ajouter une voix de fin de vidéo</span>
        </button>
      </div>

      {/* Add Question CTA Directly Underneath Questions */}
      <button
        type="button"
        data-testid="studio-quiz-add-custom-btn"
        onClick={onAddBlankQuestion}
        className="w-full h-10 px-4 rounded-full studio-pill-mint text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap"
      >
        {atLimit ? (
          <Lock className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <Plus className="w-3.5 h-3.5 shrink-0" />
        )}
        <span>Ajouter une question</span>
      </button>
    </div>
  );
};
