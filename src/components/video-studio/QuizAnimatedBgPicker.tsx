import React, { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import {
  QUIZ_ANIMATED_BACKGROUNDS,
  QuizAnimatedBgPreset,
} from '../../utils/quizAnimatedBackgrounds';

interface QuizAnimatedBgPickerProps {
  selectedBgId: string;
  onSelectBgId: (id: string) => void;
}

type PolarityFilter = 'all' | 'dark' | 'light';

const AnimatedPresetThumb: React.FC<{ preset: QuizAnimatedBgPreset }> = ({
  preset,
}) => {
  const isLight = preset.polarity === 'light';

  return (
    <svg
      viewBox="0 0 120 150"
      className="w-full h-full block"
      aria-hidden="true"
    >
      {/* Rich color-field base */}
      <rect x="0" y="0" width="120" height="150" fill={preset.baseColor} />

      {/* Orbiting organic blobs (inspired by emeraude_cadre) */}
      <circle
        cx="18"
        cy="24"
        r="40"
        fill={preset.deepBlobColor}
        className="quiz-thumb-orbit-a"
      />
      <circle
        cx="104"
        cy="128"
        r="45"
        fill={preset.deepBlobColor}
        className="quiz-thumb-orbit-b"
      />
      <circle
        cx="96"
        cy="42"
        r="24"
        fill={preset.glowOrbColor}
        className="quiz-thumb-orbit-b"
      />
      <circle
        cx="24"
        cy="108"
        r="22"
        fill={preset.glowOrbColor}
        className="quiz-thumb-orbit-a"
      />

      {/* Subtle geometric diamond grid */}
      <g
        stroke={preset.motifColor}
        strokeOpacity={isLight ? 0.14 : 0.12}
        strokeWidth="1"
        fill="none"
      >
        <polygon points="60,18 92,50 60,82 28,50" />
        <polygon points="60,68 92,100 60,132 28,100" />
      </g>

      {/* Islamic Motif Layer */}
      {preset.motifKind === 'fanous_lanterns' ? (
        <g className="quiz-thumb-sway">
          <line
            x1="60"
            y1="8"
            x2="60"
            y2="44"
            stroke={preset.motifAccentColor}
            strokeOpacity="0.6"
            strokeWidth="1.4"
          />
          <polygon
            points="60,44 71,54 75,62 71,94 60,106 49,94 45,62 49,54"
            fill={preset.motifColor}
            fillOpacity="0.24"
            stroke={preset.motifColor}
            strokeOpacity="0.72"
            strokeWidth="1.6"
          />
          <polyline
            points="53,90 60,66 67,90"
            fill="none"
            stroke={preset.motifAccentColor}
            strokeOpacity="0.7"
            strokeWidth="1.3"
          />
        </g>
      ) : preset.motifKind === 'mihrab_arches' ? (
        <g className="quiz-thumb-float">
          <path
            d="M36 112 L36 66 Q38 42 60 32 Q82 42 84 66 L84 112 Z"
            fill={preset.motifColor}
            fillOpacity="0.16"
            stroke={preset.motifColor}
            strokeOpacity="0.62"
            strokeWidth="1.8"
          />
          <g className="quiz-thumb-spin">
            <rect
              x="51"
              y="62"
              width="18"
              height="18"
              fill="none"
              stroke={preset.motifAccentColor}
              strokeOpacity="0.75"
              strokeWidth="1.4"
            />
            <rect
              x="51"
              y="62"
              width="18"
              height="18"
              transform="rotate(45 60 71)"
              fill="none"
              stroke={preset.motifAccentColor}
              strokeOpacity="0.75"
              strokeWidth="1.4"
            />
          </g>
        </g>
      ) : preset.motifKind === 'khatam_rosette' ||
        preset.motifKind === 'arabesque_medallions' ||
        preset.motifKind === 'parchment_rosettes' ? (
        <g className="quiz-thumb-spin">
          <rect
            x="41"
            y="56"
            width="38"
            height="38"
            fill={preset.motifColor}
            fillOpacity="0.14"
            stroke={preset.motifColor}
            strokeOpacity="0.65"
            strokeWidth="1.6"
          />
          <rect
            x="41"
            y="56"
            width="38"
            height="38"
            transform="rotate(45 60 75)"
            fill={preset.motifAccentColor}
            fillOpacity="0.14"
            stroke={preset.motifAccentColor}
            strokeOpacity="0.65"
            strokeWidth="1.6"
          />
          <circle
            cx="60"
            cy="75"
            r="10"
            fill="none"
            stroke={preset.motifColor}
            strokeOpacity="0.72"
            strokeWidth="1.4"
          />
        </g>
      ) : (
        <g className="quiz-thumb-float">
          {/* Crescent Moon (Hilal) */}
          <path
            d="M66 44 A24 24 0 1 0 66 92 A19 19 0 1 1 66 44 Z"
            fill={preset.motifAccentColor}
            fillOpacity="0.72"
          />
          {/* Rotating Rub el Hizb star */}
          <g className="quiz-thumb-spin">
            <rect
              x="71"
              y="55"
              width="14"
              height="14"
              fill={preset.motifColor}
              fillOpacity="0.28"
              stroke={preset.motifColor}
              strokeOpacity="0.82"
              strokeWidth="1.3"
            />
            <rect
              x="71"
              y="55"
              width="14"
              height="14"
              transform="rotate(45 78 62)"
              fill="none"
              stroke={preset.motifColor}
              strokeOpacity="0.82"
              strokeWidth="1.3"
            />
          </g>
        </g>
      )}

      {/* Drifting Noor sparkles */}
      <g className="quiz-thumb-orbit-a" fill={preset.motifAccentColor} fillOpacity="0.7">
        <circle cx="28" cy="40" r="2.2" />
        <circle cx="94" cy="96" r="2.4" />
        <circle cx="38" cy="122" r="1.8" />
      </g>
    </svg>
  );
};

export const QuizAnimatedBgPicker: React.FC<QuizAnimatedBgPickerProps> = ({
  selectedBgId,
  onSelectBgId,
}) => {
  const [filter, setFilter] = useState<PolarityFilter>('all');

  const visiblePresets = useMemo(() => {
    if (filter === 'dark') {
      return QUIZ_ANIMATED_BACKGROUNDS.filter((b) => b.polarity === 'dark');
    }
    if (filter === 'light') {
      return QUIZ_ANIMATED_BACKGROUNDS.filter((b) => b.polarity === 'light');
    }
    return QUIZ_ANIMATED_BACKGROUNDS;
  }, [filter]);

  const darkCount = useMemo(
    () => QUIZ_ANIMATED_BACKGROUNDS.filter((b) => b.polarity === 'dark').length,
    []
  );
  const lightCount = useMemo(
    () => QUIZ_ANIMATED_BACKGROUNDS.filter((b) => b.polarity === 'light').length,
    []
  );

  return (
    <div data-testid="studio-quiz-animated-bg-picker" className="space-y-3">
      {/* Polarity Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
        {[
          { id: 'all' as const, label: `Tous (${QUIZ_ANIMATED_BACKGROUNDS.length})` },
          { id: 'dark' as const, label: `Sombres (${darkCount})` },
          { id: 'light' as const, label: `Clairs (${lightCount})` },
        ].map((flt) => (
          <button
            key={flt.id}
            type="button"
            data-testid={`studio-quiz-bg-filter-${flt.id}`}
            onClick={() => setFilter(flt.id)}
            className={`h-8 px-3 rounded-full cursor-pointer transition-all whitespace-nowrap ${
              filter === flt.id ? 'studio-pill-mint' : 'studio-pill-raised'
            }`}
          >
            {flt.label}
          </button>
        ))}
      </div>

      {/* Animated Islamic Procedural Backgrounds Grid */}
      <div
        data-testid="studio-quiz-backgrounds-grid"
        className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-0.5"
      >
        {visiblePresets.map((preset) => {
          const active = selectedBgId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              data-testid={`studio-quiz-bg-card-${preset.id}`}
              aria-pressed={active}
              onClick={() => onSelectBgId(preset.id)}
              className={`group relative rounded-2xl overflow-hidden text-left cursor-pointer transition-all flex flex-col ${
                active
                  ? 'ring-[3px] ring-[#82C4A9] shadow-[0_6px_14px_rgba(68,140,110,0.3)]'
                  : 'ring-1 ring-[#C6C3BA] shadow-[0_3px_8px_rgba(24,28,26,0.09)] hover:ring-[#9E9B92]'
              }`}
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <AnimatedPresetThumb preset={preset} />
                {active && (
                  <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white/95 flex items-center justify-center shadow-sm">
                    <Check className="w-3 h-3 text-[#13251D] stroke-[2.75]" />
                  </span>
                )}
              </div>
              <div className="px-2 py-1.5 bg-[#EAE8E1] border-t border-[#D4D1C8] w-full flex-1 flex items-center">
                <div className="text-[10.5px] font-bold text-[#1F2421] leading-tight line-clamp-2">
                  {preset.name}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
