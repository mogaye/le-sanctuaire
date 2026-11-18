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
        {id === 'arabic_pure_khatt' && (
          <>
            <text
              x="32"
              y="22"
              textAnchor="middle"
              fontSize="20"
              fontWeight="700"
              fontFamily="'Scheherazade New', 'Amiri', serif"
              fill={accent}
            >
              قُرْآن
            </text>
            <rect x="18" y="32" width="28" height="3.5" rx="1.75" fill={muted} />
          </>
        )}
        {id === 'french_pure_poetry' && (
          <>
            <text
              x="32"
              y="21"
              textAnchor="middle"
              fontSize="16"
              fontStyle="italic"
              fontWeight="600"
              fontFamily="'Cormorant Garamond', Georgia, serif"
              fill={accent}
            >
              Aa · Fr
            </text>
            <rect x="14" y="28" width="36" height="2.5" rx="1.25" fill={line} />
            <rect x="19" y="34" width="26" height="2.5" rx="1.25" fill={muted} />
          </>
        )}
        {id === 'cinema_subtitles' && (
          <>
            <rect x="13" y="11" width="38" height="7.5" rx="2.5" fill={accent} />
            <rect x="12" y="29" width="40" height="3.5" rx="1.75" fill={line} />
            <rect x="18" y="35" width="28" height="2.5" rx="1.25" fill={muted} />
          </>
        )}
        {id === 'mushaf_split' && (
          <>
            <rect x="7" y="14" width="18" height="3" rx="1.5" fill={muted} />
            <rect x="7" y="20" width="20" height="3.5" rx="1.5" fill={line} />
            <rect x="7" y="27" width="14" height="3" rx="1.5" fill={muted} />
            <rect x="36" y="14" width="21" height="6.5" rx="2" fill={accent} />
            <rect x="39" y="24" width="18" height="4" rx="1.5" fill={muted} />
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
        {id === 'karaoke_glow' && (
          <>
            <rect x="18" y="6" width="28" height="2.5" rx="1.2" fill={muted} />
            <rect x="18" y="6" width="17" height="2.5" rx="1.2" fill={accent} />
            <rect x="13" y="13" width="38" height="5.5" rx="2" fill={accent} />
            <rect x="15" y="21" width="34" height="4.5" rx="2" fill={accent} opacity="0.7" />
            <rect x="17" y="29" width="30" height="3.5" rx="1.5" fill={muted} />
            <rect x="20" y="35" width="24" height="3" rx="1.5" fill={muted} />
          </>
        )}
        {id === 'editorial_magazine' && (
          <>
            <rect x="11" y="8" width="16" height="3" rx="1.5" fill={accent} />
            <line x1="11" y1="14" x2="29" y2="14" stroke={accent} strokeWidth="1.6" />
            <rect x="11" y="19" width="38" height="6" rx="2" fill={line} />
            <rect x="11" y="28" width="32" height="3" rx="1.5" fill={muted} />
            <rect x="11" y="34" width="24" height="3" rx="1.5" fill={muted} />
          </>
        )}
        {id === 'night_lantern' && (
          <>
            <circle cx="32" cy="22" r="15" fill={muted} opacity="0.55" />
            <rect x="14" y="12" width="36" height="5.5" rx="2" fill={accent} />
            <polygon points="32,20 34.5,22.5 32,25 29.5,22.5" fill={accent} />
            <rect x="17" y="28" width="30" height="3.5" rx="1.5" fill={line} />
            <rect x="21" y="34" width="22" height="3" rx="1.5" fill={muted} />
          </>
        )}
        {id === 'dual_ribbon' && (
          <>
            <rect x="7" y="7" width="22" height="4" rx="1.5" fill={muted} />
            <rect x="35" y="7" width="22" height="4.5" rx="1.5" fill={muted} />
            <rect x="7" y="18" width="22" height="4.5" rx="1.5" fill={line} />
            <rect x="35" y="17" width="22" height="6" rx="2" fill={accent} />
            <rect x="7" y="30" width="22" height="4" rx="1.5" fill={muted} />
            <rect x="35" y="30" width="22" height="4.5" rx="1.5" fill={muted} />
          </>
        )}
        {id === 'verse_ticker' && (
          <>
            <text x="32" y="31" textAnchor="middle" fontSize="26" fontWeight="800" fill={muted}>
              2
            </text>
            <rect x="13" y="15" width="38" height="6" rx="2" fill={accent} />
            <rect x="17" y="25" width="30" height="3.5" rx="1.5" fill={line} />
          </>
        )}
        {id === 'arabic_ruqaa_modern' && (
          <>
            <text
              x="32"
              y="20"
              textAnchor="middle"
              fontSize="16"
              fontWeight="700"
              fontFamily="'Aref Ruqaa', 'Amiri', serif"
              fill={accent}
            >
              نُور
            </text>
            <rect x="14" y="27" width="36" height="2.2" rx="1.1" fill={line} />
            <rect x="19" y="33" width="26" height="2.2" rx="1.1" fill={muted} />
          </>
        )}
        {id === 'kufi_editorial' && (
          <>
            <text
              x="32"
              y="11"
              textAnchor="middle"
              fontSize="6.5"
              fontWeight="700"
              letterSpacing="1.6"
              fontFamily="'Cinzel', Georgia, serif"
              fill={accent}
            >
              AYAH I
            </text>
            <rect x="12" y="16" width="40" height="5.5" rx="0.5" fill={accent} />
            <rect x="16" y="26" width="32" height="3" rx="0.5" fill={line} />
            <rect x="20" y="32" width="24" height="2.5" rx="0.5" fill={muted} />
          </>
        )}
        {id === 'phonetics_focus' && (
          <>
            <rect x="19" y="8" width="26" height="3.5" rx="1.75" fill={muted} />
            <text
              x="32"
              y="24"
              textAnchor="middle"
              fontSize="11"
              fontStyle="italic"
              fontWeight="600"
              fontFamily="'Cormorant Garamond', Georgia, serif"
              fill={accent}
            >
              Al-Hamdu
            </text>
            <rect x="16" y="31" width="32" height="3" rx="1.5" fill={line} />
          </>
        )}
        {id === 'arabic_giant_whisper_fr' && (
          <>
            <rect x="9" y="9" width="46" height="9" rx="3" fill={accent} />
            <rect x="13" y="21" width="38" height="5" rx="2" fill={accent} opacity="0.75" />
            <rect x="18" y="33" width="28" height="2" rx="1" fill={muted} />
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

