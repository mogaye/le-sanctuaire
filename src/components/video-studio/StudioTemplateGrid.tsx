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
  const accent = active ? '#136F4E' : '#5E6460';
  const muted = active ? 'rgba(19, 111, 78, 0.25)' : 'rgba(94, 100, 96, 0.22)';
  const line = active ? '#1F2421' : '#737975';

  return (
    <div
      className={`relative rounded-xl overflow-hidden transition-all ${
        isLandscape ? 'w-16 h-10' : 'w-12 h-14'
      } shrink-0 flex items-center justify-center ${
        active
          ? 'bg-[#EAE8E2] shadow-[inset_0_1px_3px_rgba(19,37,29,0.14)] ring-1 ring-emerald-700/20'
          : 'bg-[#DCDAD2] shadow-[inset_0_1.5px_3px_rgba(24,28,26,0.13)]'
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
              fill="rgba(255,255,255,0.65)"
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
            <rect x="7" y="27" width="50" height="11" rx="2" fill="#232926" stroke={muted} strokeWidth="1" />
            <line x1="7" y1="27" x2="57" y2="27" stroke={accent} strokeWidth="1.6" />
            <rect x="14" y="31" width="36" height="3.5" rx="1.5" fill="#F4F3EE" />
          </>
        )}
        {id === 'mushaf_split' && (
          <>
            <rect x="6" y="7" width="23" height="30" rx="2" fill="rgba(255,255,255,0.75)" />
            <line x1="32" y1="7" x2="32" y2="37" stroke={accent} strokeWidth="1.4" />
            <rect x="10" y="15" width="15" height="3.5" rx="1.5" fill={muted} />
            <rect x="9" y="22" width="17" height="3.5" rx="1.5" fill={line} />
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
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5" data-testid="studio-template-grid">
      {VIDEO_TEMPLATE_PRESETS.map((tpl) => {
        const active = selectedTemplate === tpl.id;
        return (
          <button
            key={tpl.id}
            type="button"
            data-testid={`studio-template-${tpl.id}`}
            title={tpl.subtitle}
            onClick={() => onSelect(tpl.id)}
            className={`group text-left p-2.5 rounded-2xl transition-all duration-150 cursor-pointer flex flex-col gap-2 ${
              active
                ? 'studio-pill-mint ring-2 ring-[#9CE2C5]/60'
                : 'studio-pill-raised'
            }`}
          >
            <div className="w-full flex items-center justify-between gap-2">
              <TemplateWireframe id={tpl.id} active={active} isLandscape={isLandscape} />
              {active && (
                <span className="w-5 h-5 rounded-full bg-white/85 flex items-center justify-center shadow-sm shrink-0">
                  <Check className="w-3 h-3 text-[#13251D] stroke-[2.75]" />
                </span>
              )}
            </div>
            <span
              className={`text-xs font-semibold leading-tight truncate w-full ${
                active ? 'text-[#13251D]' : 'text-[#1F2421]'
              }`}
            >
              {tpl.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

