import React from 'react';
import { Check } from 'lucide-react';
import {
  VIDEO_TEMPLATE_PRESETS,
  VideoTemplateId,
} from '../../utils/mobileVideoStudioUtils';

interface StudioTemplateGridProps {
  selectedTemplate: VideoTemplateId;
  onSelect: (id: VideoTemplateId) => void;
  isLandscape?: boolean;
}

const TemplateWireframe: React.FC<{
  id: VideoTemplateId;
  active: boolean;
  isLandscape?: boolean;
}> = ({ id, active, isLandscape }) => {
  const accent = active ? '#FBBF24' : '#94A3B8';
  const muted = active ? 'rgba(251, 191, 36, 0.35)' : 'rgba(148, 163, 184, 0.25)';

  return (
    <div
      className={`relative rounded-lg overflow-hidden border transition-colors ${
        isLandscape ? 'w-16 h-10' : 'w-12 h-14'
      } shrink-0 flex items-center justify-center ${
        active
          ? 'bg-neutral-950 border-amber-400/70'
          : 'bg-black/60 border-white/10 group-hover:border-white/25'
      }`}
    >
      <svg viewBox="0 0 64 44" className="w-full h-full" aria-hidden="true">
        {id === 'teleprompter' && (
          <>
            <rect x="14" y="6" width="36" height="4" rx="2" fill={muted} />
            <rect x="10" y="18" width="44" height="6" rx="2" fill={accent} />
            <rect x="16" y="27" width="32" height="3" rx="1.5" fill={muted} />
            <rect x="18" y="36" width="28" height="3" rx="1.5" fill={muted} />
          </>
        )}
        {id === 'stream' && (
          <>
            <rect x="10" y="6" width="44" height="5" rx="2" fill={muted} />
            <rect x="10" y="15" width="44" height="6" rx="2" fill={accent} />
            <rect x="12" y="25" width="40" height="5" rx="2" fill={muted} />
            <rect x="14" y="34" width="36" height="4" rx="2" fill={muted} />
          </>
        )}
        {id === 'spotlight_card' && (
          <>
            <rect
              x="8"
              y="6"
              width="48"
              height="32"
              rx="3"
              fill="rgba(255,255,255,0.03)"
              stroke={accent}
              strokeWidth="1.4"
            />
            <path d="M11 12 V9 H15 M49 9 H53 V12 M11 32 V35 H15 M49 35 H53 V32" stroke={accent} strokeWidth="1.8" fill="none" />
            <rect x="18" y="15" width="28" height="5" rx="2" fill={accent} />
            <rect x="16" y="24" width="32" height="3.5" rx="1.5" fill={muted} />
          </>
        )}
        {id === 'cinema_subtitles' && (
          <>
            <rect x="15" y="12" width="34" height="7" rx="2" fill={accent} />
            <rect x="7" y="27" width="50" height="11" rx="2" fill="rgba(0,0,0,0.85)" stroke={muted} strokeWidth="1" />
            <line x1="7" y1="27" x2="57" y2="27" stroke={accent} strokeWidth="1.6" />
            <rect x="14" y="31" width="36" height="3.5" rx="1.5" fill="#E2E8F0" />
          </>
        )}
        {id === 'mushaf_split' && (
          <>
            <rect x="6" y="7" width="23" height="30" rx="2" fill="rgba(255,255,255,0.04)" />
            <line x1="32" y1="7" x2="32" y2="37" stroke={accent} strokeWidth="1.4" />
            <rect x="10" y="15" width="15" height="3.5" rx="1.5" fill={muted} />
            <rect x="9" y="22" width="17" height="3.5" rx="1.5" fill="#E2E8F0" />
            <rect x="37" y="16" width="20" height="6" rx="2" fill={accent} />
            <rect x="40" y="25" width="14" height="3.5" rx="1.5" fill={muted} />
          </>
        )}
        {id === 'meditation_minimal' && (
          <>
            <polygon points="32,5 36,9 32,13 28,9" stroke={accent} strokeWidth="1.2" fill="none" />
            <rect x="14" y="17" width="36" height="6" rx="2" fill={accent} />
            <rect x="18" y="26" width="28" height="3" rx="1.5" fill={muted} />
            <rect x="21" y="34" width="2" height="5" fill={accent} />
            <rect x="26" y="32" width="2" height="8" fill={accent} />
            <rect x="31" y="30" width="2" height="10" fill={accent} />
            <rect x="36" y="32" width="2" height="8" fill={accent} />
            <rect x="41" y="34" width="2" height="5" fill={accent} />
          </>
        )}
      </svg>
    </div>
  );
};

export const StudioTemplateGrid: React.FC<StudioTemplateGridProps> = ({
  selectedTemplate,
  onSelect,
  isLandscape = true,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" data-testid="studio-template-grid">
      {VIDEO_TEMPLATE_PRESETS.map((tpl) => {
        const active = selectedTemplate === tpl.id;
        return (
          <button
            key={tpl.id}
            type="button"
            data-testid={`studio-template-${tpl.id}`}
            onClick={() => onSelect(tpl.id)}
            className={`group text-left p-3 rounded-xl border transition-colors duration-150 cursor-pointer flex items-start gap-3 min-h-[76px] ${
              active
                ? 'bg-amber-400/[0.11] border-amber-400/60'
                : 'bg-white/[0.025] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/20'
            }`}
          >
            <TemplateWireframe id={tpl.id} active={active} isLandscape={isLandscape} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-1.5">
                <span
                  className={`text-[13px] font-semibold leading-snug ${
                    active ? 'text-amber-300' : 'text-white'
                  }`}
                >
                  {tpl.name}
                </span>
                {active && (
                  <Check className="w-4 h-4 text-amber-300 shrink-0 stroke-[2.5] mt-0.5" />
                )}
              </div>
              <p className="text-xs text-neutral-400 leading-snug line-clamp-2">
                {tpl.subtitle}
              </p>
              <div className="text-[11px] text-neutral-500 truncate pt-0.5">
                {tpl.recommendedFor}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
