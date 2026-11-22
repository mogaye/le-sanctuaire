import React, { useState } from 'react';
import { Check, Palette, Plus, Sparkles, Trash2 } from 'lucide-react';
import {
  QuizBadgeShape,
  QuizFontStyle,
  QuizOptionShape,
  QuizQuestionBoxStyle,
  QuizTemplateStyle,
  QuizTimerStyle,
  QuizVisualDesign,
  hexToRgba,
  isHexColorDark,
} from '../../utils/quizDesignPresets';

interface QuizDesignPanelProps {
  designs: QuizVisualDesign[];
  activeDesign: QuizVisualDesign;
  onSelectDesign: (design: QuizVisualDesign) => void;
  onChangeActiveDesign: (patch: Partial<QuizVisualDesign>) => void;
  onSaveAsNewDesign: (name: string) => void;
  onDeleteCustomDesign: (id: string) => void;
}

const ACCENT_SWATCHES = ['#10B981', '#D4AF37', '#22D3EE', '#F59E0B', '#EC4899', '#6366F1', '#EF4444'];
const CARD_BG_SWATCHES = ['#0F172A', '#14110B', '#08202C', '#240B14', '#18181B', '#FFFFFF'];
const TEXT_SWATCHES = ['#F8FAFC', '#FEF9E7', '#F0FDFA', '#111827', '#FBBF24'];

function DesignCardPreview({ design }: { design: QuizVisualDesign }) {
  const darkCard = isHexColorDark(design.cardBgColor);

  if (design.templateStyle === 'flash_list') {
    return (
      <div className="rounded-xl p-2 space-y-1.5 border border-white/15 bg-[#111827]">
        <div
          className="h-3 w-4/5 mx-auto rounded-md flex items-center justify-center text-[7px] font-black text-white tracking-wider"
          style={{ backgroundColor: design.accentColor || '#EF4444' }}
        >
          QUIZ
        </div>
        <div className="h-1.5 w-3/4 mx-auto rounded-full bg-white/90" />
        <div className="space-y-0.5 pt-0.5 px-1 font-mono text-[8px] font-bold leading-tight text-white/90">
          <div className="flex items-center gap-1">
            <span>1)</span>
            <span className="h-1 flex-1 rounded-full bg-[#86EFAC]" />
          </div>
          <div className="flex items-center gap-1">
            <span>2)</span>
            <span className="h-1 w-2/3 rounded-full bg-white/75" />
          </div>
          <div className="flex items-center gap-1 opacity-65">
            <span>3)</span>
            <span className="h-1 w-1/3 rounded-full bg-white/40" />
          </div>
        </div>
      </div>
    );
  }

  if (design.templateStyle === 'carte_blanche') {
    return (
      <div className="rounded-xl p-2 space-y-1.5 border border-[#CBD5E1] bg-[#334155]">
        <div className="relative pt-1.5">
          <div
            className="w-3 h-3 rounded-full bg-[#3F3A36] border border-white text-white text-[7px] font-black flex items-center justify-center mx-auto -mb-1.5 relative z-10"
          >
            ?
          </div>
          <div
            className="rounded-md py-1.5 px-2 border border-black/10"
            style={{ backgroundColor: design.cardBgColor || '#FFFFFF' }}
          >
            <div
              className="h-1.5 w-4/5 mx-auto rounded-full"
              style={{ backgroundColor: design.questionTextColor || '#111827' }}
            />
          </div>
        </div>
        <div className="space-y-1">
          <div
            className="h-2 w-full rounded-full"
            style={{ backgroundColor: design.accentColor || '#22C55E' }}
          />
          <div
            className="h-2 w-full rounded-full opacity-90"
            style={{ backgroundColor: design.cardBgColor || '#FFFFFF' }}
          />
        </div>
        <div className="w-3 h-3 rounded-full border border-white/90 bg-white/25 mx-auto flex items-center justify-center text-[6px] font-black text-white">
          3
        </div>
      </div>
    );
  }

  if (design.templateStyle === 'emeraude_cadre') {
    return (
      <div className="rounded-xl p-2 space-y-1 border border-[#2DD4BF]/50 bg-[#0F766E]">
        <div
          className="rounded-md py-1 px-1.5 border-[1.5px]"
          style={{
            backgroundColor: design.cardBgColor || '#FFFFFF',
            borderColor: design.borderColor || '#2DD4BF',
          }}
        >
          <div
            className="h-1.5 w-4/5 mx-auto rounded-full"
            style={{ backgroundColor: design.questionTextColor || '#0F172A' }}
          />
        </div>
        <div className="relative h-4 w-3/4 mx-auto rounded border border-white bg-[#0F172A]/45 flex items-center justify-center">
          <span className="text-[6px] font-bold text-[#99F6E4]">1/3</span>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white border border-[#0F172A] text-[5.5px] font-black text-[#0F172A] flex items-center justify-center">
            5
          </span>
        </div>
        <div className="space-y-0.5">
          <div
            className="h-2 w-full rounded-full border"
            style={{
              backgroundColor: design.accentColor || '#14B8A6',
              borderColor: '#FFFFFF',
            }}
          />
          <div
            className="h-2 w-full rounded-full border"
            style={{
              backgroundColor: design.cardBgColor || '#FFFFFF',
              borderColor: design.borderColor || '#2DD4BF',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-2 space-y-1.5 border"
      style={{
        backgroundColor: hexToRgba(design.cardBgColor, 0.94),
        borderColor: hexToRgba(design.borderColor, 0.5),
      }}
    >
      <div
        className="h-2 w-4/5 mx-auto rounded-full"
        style={{ backgroundColor: design.questionTextColor, opacity: 0.9 }}
      />
      <div
        className="h-1.5 w-3/5 mx-auto rounded-full"
        style={{ backgroundColor: design.accentColor }}
      />
      <div className="space-y-1 pt-0.5">
        <div
          className={`h-2.5 w-full flex items-center gap-1 px-1 ${
            design.optionShape === 'pill'
              ? 'rounded-full'
              : design.optionShape === 'sharp'
                ? 'rounded-sm'
                : 'rounded-md'
          }`}
          style={{
            backgroundColor: design.accentColor,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: isHexColorDark(design.accentColor)
                ? '#FFFFFF'
                : '#0F172A',
            }}
          />
        </div>
        <div
          className={`h-2.5 w-full border ${
            design.optionShape === 'pill'
              ? 'rounded-full'
              : design.optionShape === 'sharp'
                ? 'rounded-sm'
                : 'rounded-md'
          }`}
          style={{
            borderColor: hexToRgba(design.borderColor, 0.4),
            backgroundColor: darkCard
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(15,23,42,0.06)',
          }}
        />
      </div>
    </div>
  );
}

export const QuizDesignPanel: React.FC<QuizDesignPanelProps> = ({
  designs,
  activeDesign,
  onSelectDesign,
  onChangeActiveDesign,
  onSaveAsNewDesign,
  onDeleteCustomDesign,
}) => {
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [newDesignName, setNewDesignName] = useState('');

  const handleSave = () => {
    const label = newDesignName.trim() || `Design ${designs.length + 1}`;
    onSaveAsNewDesign(label);
    setNewDesignName('');
  };

  return (
    <div data-testid="studio-quiz-design-panel" className="space-y-3.5">
      {/* Header + Toggle Creator */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1F2421]">
          <Palette className="w-3.5 h-3.5 text-[#1B573E] shrink-0" />
          <span>Modèles & Design ({designs.length})</span>
        </div>

        <button
          type="button"
          data-testid="studio-quiz-toggle-design-creator-btn"
          aria-expanded={isCreatorOpen}
          onClick={() => setIsCreatorOpen((v) => !v)}
          className={`h-8 px-3 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
            isCreatorOpen ? 'studio-pill-mint' : 'studio-pill-raised text-[#1B573E]'
          }`}
        >
          <Sparkles className="w-3 h-3 shrink-0" />
          <span>{isCreatorOpen ? 'Fermer créateur' : 'Créer un design'}</span>
        </button>
      </div>

      {/* Design Cards Grid (Built-in + User Created) */}
      <div
        data-testid="studio-quiz-design-grid"
        className="grid grid-cols-2 sm:grid-cols-3 gap-2"
      >
        {designs.map((design) => {
          const isSelected = activeDesign.id === design.id;

          return (
            <div
              key={design.id}
              data-testid={`studio-quiz-design-card-${design.id}`}
              onClick={() => onSelectDesign(design)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectDesign(design);
                }
              }}
              className={`relative rounded-2xl p-2.5 cursor-pointer transition-all text-left space-y-2 ${
                isSelected
                  ? 'ring-[2.5px] ring-[#1B573E] bg-[#E3F3EC]/70 shadow-sm'
                  : 'studio-input-inset hover:ring-1 hover:ring-[#9E9B92]'
              }`}
            >
              {/* Live Mini Visual Preview */}
              <DesignCardPreview design={design} />

              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-[#1F2421] truncate">
                  {design.name}
                </span>
                {design.isCustom ? (
                  <button
                    type="button"
                    aria-label={`Supprimer le design ${design.name}`}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onDeleteCustomDesign(design.id);
                    }}
                    className="w-5 h-5 rounded-full bg-white/80 hover:bg-[#EE9B98]/50 text-[#9B3431] flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                ) : isSelected ? (
                  <Check className="w-3.5 h-3.5 text-[#1B573E] stroke-[2.75] shrink-0" />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Design Creator & Live Customizer */}
      {isCreatorOpen && (
        <div
          data-testid="studio-quiz-design-creator"
          className="rounded-2xl studio-input-inset p-3.5 space-y-3"
        >
          <div className="text-xs font-extrabold text-[#1F2421]">
            Personnaliser et créer un design
          </div>

          {/* 0. Modèle de mise en page vidéo */}
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-[#565C58]">
              Modèle de vidéo
            </div>
            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl studio-well-inset text-[10.5px] font-bold">
              {(
                [
                  { id: 'classic', label: 'Classique' },
                  { id: 'flash_list', label: 'Liste 1→N' },
                  { id: 'carte_blanche', label: 'Carte ?' },
                  { id: 'emeraude_cadre', label: 'Émeraude' },
                ] as { id: QuizTemplateStyle; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`studio-quiz-template-style-${item.id}`}
                  onClick={() => onChangeActiveDesign({ templateStyle: item.id })}
                  className={`h-7 rounded-lg cursor-pointer transition-all whitespace-nowrap ${
                    activeDesign.templateStyle === item.id
                      ? 'studio-pill-mint'
                      : 'text-[#4F5551] hover:text-[#1F2421]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {activeDesign.templateStyle === 'classic' && (
            <>
              {/* 1. Style de l'espace question */}
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-[#565C58]">
                  Style espace question
                </div>
                <div className="grid grid-cols-4 gap-1 p-1 rounded-xl studio-well-inset text-[10.5px] font-bold">
                  {(
                    [
                      { id: 'framed', label: 'Encadré' },
                      { id: 'banner', label: 'Bannière' },
                      { id: 'double_gold', label: 'Double Or' },
                      { id: 'minimal', label: 'Épuré' },
                    ] as { id: QuizQuestionBoxStyle; label: string }[]
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`studio-quiz-box-style-${item.id}`}
                      onClick={() => onChangeActiveDesign({ questionBoxStyle: item.id })}
                      className={`h-7 rounded-lg cursor-pointer transition-all whitespace-nowrap ${
                        activeDesign.questionBoxStyle === item.id
                          ? 'studio-pill-mint'
                          : 'text-[#4F5551] hover:text-[#1F2421]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Forme des réponses au choix */}
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-[#565C58]">
                  Forme des choix
                </div>
                <div className="grid grid-cols-4 gap-1 p-1 rounded-xl studio-well-inset text-[10.5px] font-bold">
                  {(
                    [
                      { id: 'rounded', label: 'Arrondi' },
                      { id: 'pill', label: 'Pilule' },
                      { id: 'sharp', label: 'Carré' },
                      { id: 'outline', label: 'Contour' },
                    ] as { id: QuizOptionShape; label: string }[]
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`studio-quiz-option-shape-${item.id}`}
                      onClick={() => onChangeActiveDesign({ optionShape: item.id })}
                      className={`h-7 rounded-lg cursor-pointer transition-all whitespace-nowrap ${
                        activeDesign.optionShape === item.id
                          ? 'studio-pill-mint'
                          : 'text-[#4F5551] hover:text-[#1F2421]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Pastilles + Chronomètre + Typo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-[#565C58]">Pastilles</div>
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-xl studio-well-inset text-[10px] font-bold">
                    {(
                      [
                        { id: 'circle', label: 'Rond' },
                        { id: 'rounded_square', label: 'Carré' },
                        { id: 'solid_pill', label: 'Plein' },
                      ] as { id: QuizBadgeShape; label: string }[]
                    ).map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => onChangeActiveDesign({ badgeShape: b.id })}
                        className={`h-6 rounded-lg cursor-pointer transition-all ${
                          activeDesign.badgeShape === b.id
                            ? 'studio-pill-mint'
                            : 'text-[#4F5551]'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-[#565C58]">Chrono</div>
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-xl studio-well-inset text-[10px] font-bold">
                    {(
                      [
                        { id: 'bar_circle', label: 'Anneau' },
                        { id: 'bar_only', label: 'Barre' },
                        { id: 'pill_badge', label: 'Badge' },
                      ] as { id: QuizTimerStyle; label: string }[]
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onChangeActiveDesign({ timerStyle: t.id })}
                        className={`h-6 rounded-lg cursor-pointer transition-all ${
                          activeDesign.timerStyle === t.id
                            ? 'studio-pill-mint'
                            : 'text-[#4F5551]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-[#565C58]">Police</div>
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-xl studio-well-inset text-[10px] font-bold">
                    {(
                      [
                        { id: 'modern', label: 'Sans' },
                        { id: 'serif', label: 'Serif' },
                        { id: 'bold_display', label: 'Gras' },
                      ] as { id: QuizFontStyle; label: string }[]
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => onChangeActiveDesign({ fontStyle: f.id })}
                        className={`h-6 rounded-lg cursor-pointer transition-all ${
                          activeDesign.fontStyle === f.id
                            ? 'studio-pill-mint'
                            : 'text-[#4F5551]'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 4. Color Pickers (Accent, Card Fill, Text) */}
          <div className="space-y-2 pt-1">
            {[
              {
                label: 'Couleur d’accent',
                value: activeDesign.accentColor,
                swatches: ACCENT_SWATCHES,
                onChange: (hex: string) =>
                  onChangeActiveDesign({ accentColor: hex, borderColor: hex }),
              },
              {
                label: 'Fond des blocs',
                value: activeDesign.cardBgColor,
                swatches: CARD_BG_SWATCHES,
                onChange: (hex: string) => {
                  const isDark = isHexColorDark(hex);
                  onChangeActiveDesign({
                    cardBgColor: hex,
                    questionTextColor: isDark ? '#F8FAFC' : '#111827',
                  });
                },
              },
              {
                label: 'Couleur du texte',
                value: activeDesign.questionTextColor,
                swatches: TEXT_SWATCHES,
                onChange: (hex: string) =>
                  onChangeActiveDesign({ questionTextColor: hex }),
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-[11px] font-semibold text-[#4F5551]">
                  {row.label}
                </span>
                <div className="flex items-center gap-1.5">
                  {row.swatches.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      aria-label={`${row.label} ${hex}`}
                      onClick={() => row.onChange(hex)}
                      className={`w-5 h-5 rounded-full cursor-pointer transition-transform border border-[#B8B5AC] ${
                        row.value.toLowerCase() === hex.toLowerCase()
                          ? 'ring-2 ring-[#1B573E] scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                  <input
                    type="color"
                    aria-label={`Couleur personnalisée ${row.label}`}
                    value={row.value}
                    onChange={(e) => row.onChange(e.target.value)}
                    className="w-6 h-6 rounded-full cursor-pointer border-0 bg-transparent p-0"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 5. Opacity Slider */}
          <label className="grid grid-cols-[90px_1fr_36px] items-center gap-2 cursor-pointer">
            <span className="text-[11px] font-semibold text-[#4F5551]">
              Opacité blocs
            </span>
            <input
              type="range"
              min={30}
              max={96}
              step={2}
              value={Math.round(activeDesign.cardOpacity * 100)}
              onChange={(e) =>
                onChangeActiveDesign({
                  cardOpacity: Number(e.target.value) / 100,
                })
              }
              className="w-full studio-range-mint cursor-pointer"
            />
            <span className="text-[11px] font-mono font-bold text-[#1F2421] tabular-nums text-right">
              {Math.round(activeDesign.cardOpacity * 100)}%
            </span>
          </label>

          {/* 6. Save As New Reusable Custom Design */}
          <div className="pt-2 border-t border-[#D4D1C8] flex items-center gap-2">
            <input
              type="text"
              data-testid="studio-quiz-new-design-name-input"
              maxLength={32}
              value={newDesignName}
              onChange={(e) => setNewDesignName(e.target.value)}
              placeholder="Nom du nouveau design..."
              className="flex-1 min-w-0 h-8 px-3 rounded-xl bg-white/85 border border-[#CECBC2] text-xs font-semibold text-[#1F2421] placeholder:text-[#787E7A]"
            />
            <button
              type="button"
              data-testid="studio-quiz-save-design-btn"
              onClick={handleSave}
              className="h-8 px-3.5 rounded-full studio-pill-mint text-xs font-bold inline-flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enregistrer</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
