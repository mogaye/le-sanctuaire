import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Library,
  Lock,
  Plus,
  SlidersHorizontal,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  ISLAMIC_QUIZ_BANK,
  ISLAMIC_QUIZ_PACKS,
  QUIZ_CATEGORIES,
  QuizCategoryId,
  QuizQuestionItem,
  getQuizCategoryLabel,
} from '../../data/islamicQuizBank';

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
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

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
}) => {
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [bankCategory, setBankCategory] = useState<QuizCategoryId | 'all'>('all');

  const isCapped = Number.isFinite(maxQuestions);
  const atLimit = isCapped && questions.length >= maxQuestions;

  const filteredBank = useMemo(() => {
    if (bankCategory === 'all') return ISLAMIC_QUIZ_BANK;
    return ISLAMIC_QUIZ_BANK.filter((q) => q.category === bankCategory);
  }, [bankCategory]);

  const existingIds = useMemo(() => new Set(questions.map((q) => q.id)), [questions]);

  return (
    <div data-testid="studio-quiz-builder" className="space-y-4">
      {/* Compact Top Bar: Count + Secondary Drawers (Banque & Packs / Minuteur & Options) */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              data-testid="studio-quiz-toggle-bank-btn"
              aria-expanded={isBankOpen}
              onClick={() => {
                setIsBankOpen((v) => !v);
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
                setIsBankOpen(false);
              }}
              className={`h-8 px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                isOptionsOpen ? 'studio-pill-mint' : 'studio-pill-raised text-[#1F2421]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span>Minuteur · {thinkSec}s</span>
            </button>
          </div>

          <span className="text-[11px] font-semibold text-[#565C58] tabular-nums whitespace-nowrap">
            {questions.length} {questions.length > 1 ? 'questions' : 'question'}
            {isCapped ? ` / max ${maxQuestions} (${activePlanName})` : ''}
          </span>
        </div>

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

      {/* Simple Question Spaces + Choices Stacked Directly Below Each Question */}
      <div
        data-testid="studio-quiz-questions-list"
        className="space-y-3.5"
      >
        {questions.map((q, index) => (
          <div
            key={q.id}
            data-testid={`studio-quiz-item-${index}`}
            className="rounded-2xl border border-[#D4D1C8] bg-[#FAF8F3]/80 p-3.5 space-y-3"
          >
            {/* Question Header */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onJumpToQuestion?.(index)}
                className="text-xs font-extrabold text-[#1B573E] hover:underline cursor-pointer whitespace-nowrap tabular-nums"
                title="Voir cette question dans l'aperçu vidéo"
              >
                Question {index + 1}
              </button>

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

            {/* Sous l'espace question : Réponses de choix empilées */}
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
                        {isCorrect ? <Check className="w-3.5 h-3.5 stroke-[2.75]" /> : letter}
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
        ))}
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
