import React, { useState } from 'react';
import { BookCharacter } from '../data/puitsDeNourCharacters';

interface CharacterPortraitProps {
  character: BookCharacter;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CharacterPortrait: React.FC<CharacterPortraitProps> = ({
  character,
  className = '',
  size = 'md',
}) => {
  const [imgError, setImgError] = useState(false);

  if (character.imageUrl && !imgError) {
    return (
      <div className={`relative overflow-hidden bg-stone-800 ${className}`}>
        <img
          src={character.imageUrl}
          alt={character.name}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-top"
        />
      </div>
    );
  }

  // Custom illustrated SVG portraits faithful to "Le Puits de Nour — Portraits des personnages"
  const renderCustomSvg = (id: string) => {
    switch (id) {
      case 'imam-abdelkarim':
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <linearGradient id="bg-imam" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#D9A066" />
                <stop offset="100%" stopColor="#78472A" />
              </linearGradient>
            </defs>
            <rect width="200" height="200" fill="url(#bg-imam)" />
            <rect x="10" y="30" width="45" height="170" fill="#9A623D" opacity="0.5" />
            <rect x="150" y="20" width="40" height="180" fill="#855130" opacity="0.5" />
            {/* Shoulders / White Tunic & Shawl */}
            <path d="M25 200 C30 148 170 148 175 200 Z" fill="#F5F2EB" />
            <path d="M55 150 L95 200 L110 200 L145 150" fill="#E5DEC9" />
            {/* Neck & Head */}
            <rect x="84" y="118" width="32" height="36" rx="10" fill="#6E3F23" />
            <ellipse cx="100" cy="88" rx="34" ry="42" fill="#7C4728" />
            {/* Beard & Mustache */}
            <path d="M67 92 C67 125 85 136 100 136 C115 136 133 125 133 92 C127 108 115 114 100 114 C85 114 73 108 67 92 Z" fill="#1F1916" />
            <path d="M84 106 Q100 101 116 106" stroke="#1F1916" strokeWidth="4" fill="none" strokeLinecap="round" />
            {/* Eyes & Brows */}
            <path d="M77 77 Q86 73 93 77" stroke="#1F1916" strokeWidth="2.8" fill="none" strokeLinecap="round" />
            <path d="M107 77 Q114 73 123 77" stroke="#1F1916" strokeWidth="2.8" fill="none" strokeLinecap="round" />
            <circle cx="85" cy="83" r="3.2" fill="#1C1410" />
            <circle cx="115" cy="83" r="3.2" fill="#1C1410" />
            <path d="M100 83 L98 97 L103 99" stroke="#5A3118" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path d="M90 111 Q100 115 110 111" stroke="#472613" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* White Kufi Cap */}
            <path d="M65 70 C65 40 135 40 135 70 Z" fill="#FAF8F5" />
            <rect x="65" y="63" width="70" height="9" rx="3" fill="#EAE4D7" />
          </svg>
        );

      case 'ibrahim':
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <linearGradient id="bg-ibrahim" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#E6B17E" />
                <stop offset="100%" stopColor="#8C5836" />
              </linearGradient>
            </defs>
            <rect width="200" height="200" fill="url(#bg-ibrahim)" />
            {/* Simple Cream Tunic */}
            <path d="M40 200 C45 155 155 155 160 200 Z" fill="#E8DFD1" />
            <path d="M85 156 L100 182 L115 156" stroke="#C7B9A3" strokeWidth="3" fill="none" />
            {/* Neck & Young Round Face */}
            <rect x="88" y="128" width="24" height="30" rx="8" fill="#7D492A" />
            <ellipse cx="100" cy="98" rx="31" ry="34" fill="#8B5332" />
            {/* Curious Big Eyes */}
            <path d="M79 86 Q86 82 93 86" stroke="#241710" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path d="M107 86 Q114 82 121 86" stroke="#241710" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <circle cx="86" cy="93" r="4" fill="#1A110B" />
            <circle cx="114" cy="93" r="4" fill="#1A110B" />
            <circle cx="87.5" cy="91.5" r="1.2" fill="#FFF" />
            <circle cx="115.5" cy="91.5" r="1.2" fill="#FFF" />
            <path d="M97 103 Q100 106 103 103" stroke="#5E351D" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path d="M91 115 Q100 119 109 115" stroke="#4D2B17" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            {/* Small Cream Cap */}
            <path d="M69 82 C70 54 130 54 131 82 Z" fill="#F3ECE1" />
            <path d="M69 78 Q100 72 131 78" stroke="#D6C8B4" strokeWidth="3" fill="none" />
          </svg>
        );

      case 'hadj-mansour':
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <linearGradient id="bg-mansour" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#C88A4B" />
                <stop offset="100%" stopColor="#5C3419" />
              </linearGradient>
            </defs>
            <rect width="200" height="200" fill="url(#bg-mansour)" />
            {/* Rich Boubou & Gold Embroidery */}
            <path d="M20 200 C25 145 175 145 180 200 Z" fill="#2A2421" />
            <path d="M45 152 L100 200 L155 152" fill="#D4AF37" opacity="0.85" />
            <path d="M60 152 L100 194 L140 152" fill="#EFE6D5" />
            {/* Neck & Face */}
            <rect x="84" y="120" width="32" height="35" rx="10" fill="#6B3D22" />
            <ellipse cx="100" cy="90" rx="33" ry="40" fill="#784527" />
            {/* Trimmed Beard & Stern Expression */}
            <path d="M68 95 C69 124 85 134 100 134 C115 134 131 124 132 95 C126 110 115 116 100 116 C85 116 74 110 68 95 Z" fill="#1C1613" />
            <path d="M84 107 L116 107" stroke="#1C1613" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M76 76 L94 80" stroke="#1C1613" strokeWidth="3" strokeLinecap="round" />
            <path d="M124 76 L106 80" stroke="#1C1613" strokeWidth="3" strokeLinecap="round" />
            <circle cx="85" cy="85" r="3.2" fill="#1A120E" />
            <circle cx="115" cy="85" r="3.2" fill="#1A120E" />
            {/* Beige & Gold Merchant Turban */}
            <path d="M60 74 C58 38 142 38 140 74 C125 64 75 64 60 74 Z" fill="#E3C998" />
            <path d="M62 64 Q100 50 138 64" stroke="#B89352" strokeWidth="4" fill="none" />
            <path d="M65 54 Q100 42 135 54" stroke="#C9A769" strokeWidth="3" fill="none" />
          </svg>
        );

      case 'karim':
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <linearGradient id="bg-karim" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#D4955A" />
                <stop offset="100%" stopColor="#693E22" />
              </linearGradient>
            </defs>
            <rect width="200" height="200" fill="url(#bg-karim)" />
            {/* Fine Slate-Blue Tunic with Embroidery */}
            <path d="M30 200 C35 150 165 150 170 200 Z" fill="#283845" />
            <path d="M82 152 L100 190 L118 152" stroke="#D4A359" strokeWidth="3" fill="none" />
            {/* Neck & Adolescent Face */}
            <rect x="86" y="122" width="28" height="34" rx="8" fill="#7A4628" />
            <ellipse cx="100" cy="92" rx="31" ry="38" fill="#874F2F" />
            {/* Expressive Brows & Eyes */}
            <path d="M77 79 Q86 76 94 80" stroke="#1F1510" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M106 80 Q114 76 123 79" stroke="#1F1510" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <circle cx="86" cy="86" r="3.3" fill="#1A110C" />
            <circle cx="114" cy="86" r="3.3" fill="#1A110C" />
            <path d="M100 86 L98 100 L103 102" stroke="#5C331C" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M90 112 Q100 114 110 111" stroke="#4D2A16" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            {/* Patterned Kufi */}
            <path d="M68 72 C68 44 132 44 132 72 Z" fill="#3E4E5E" />
            <rect x="68" y="63" width="64" height="9" fill="#C8964B" />
          </svg>
        );

      case 'oumar':
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <linearGradient id="bg-oumar" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#B86B35" />
                <stop offset="100%" stopColor="#4A2511" />
              </linearGradient>
            </defs>
            <rect width="200" height="200" fill="url(#bg-oumar)" />
            {/* Broad Blacksmith Shoulders & Work Garment */}
            <path d="M12 200 C18 140 182 140 188 200 Z" fill="#3B3734" />
            <path d="M45 148 L155 148 L165 200 L35 200 Z" fill="#524135" />
            {/* Muscular Neck & Head */}
            <rect x="80" y="118" width="40" height="36" rx="10" fill="#5E341B" />
            <ellipse cx="100" cy="88" rx="35" ry="41" fill="#6B3C20" />
            {/* Full Blacksmith Beard */}
            <path d="M65 90 C65 128 84 139 100 139 C116 139 135 128 135 90 C128 108 115 115 100 115 C85 115 72 108 65 90 Z" fill="#1A1412" />
            <path d="M76 76 L94 79" stroke="#1A1412" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M124 76 L106 79" stroke="#1A1412" strokeWidth="3.2" strokeLinecap="round" />
            <circle cx="85" cy="84" r="3.4" fill="#140E0B" />
            <circle cx="115" cy="84" r="3.4" fill="#140E0B" />
            {/* Wrapped Headband / Turban */}
            <path d="M63 72 C63 42 137 42 137 72 Z" fill="#6E5A47" />
            <path d="M63 66 Q100 56 137 66" stroke="#4D3E30" strokeWidth="5" fill="none" />
          </svg>
        );

      case 'khadija':
      case 'fatou':
      case 'aicha-veuve':
      case 'noura': {
        const scarfColor =
          id === 'noura'
            ? '#0F766E'
            : id === 'fatou'
            ? '#B91C1C'
            : id === 'aicha-veuve'
            ? '#9A3412'
            : '#7E22CE';
        const accentColor =
          id === 'noura'
            ? '#34D399'
            : id === 'fatou'
            ? '#F59E0B'
            : id === 'aicha-veuve'
            ? '#FBBF24'
            : '#F59E0B';
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <rect width="200" height="200" fill="#C68B59" />
            {/* Draped Headscarf & Shawl */}
            <path d="M25 200 C30 135 170 135 175 200 Z" fill={scarfColor} />
            <ellipse cx="100" cy="86" rx="46" ry="52" fill={scarfColor} />
            <path d="M58 68 Q100 48 142 68" stroke={accentColor} strokeWidth="5" fill="none" />
            <path d="M62 56 Q100 38 138 56" stroke="#FDE68A" strokeWidth="2.5" fill="none" />
            {/* Neck & Face */}
            <rect x="86" y="122" width="28" height="32" rx="10" fill="#6E3F23" />
            <ellipse cx="100" cy="92" rx="30" ry="36" fill="#7D4829" />
            {/* Eyes & Gentle Expression */}
            <path d="M78 81 Q86 76 93 80" stroke="#1E130D" strokeWidth="2.3" fill="none" strokeLinecap="round" />
            <path d="M107 80 Q114 76 122 81" stroke="#1E130D" strokeWidth="2.3" fill="none" strokeLinecap="round" />
            <circle cx="86" cy="87" r="3.3" fill="#180F0A" />
            <circle cx="114" cy="87" r="3.3" fill="#180F0A" />
            <path d="M100 87 L98 99 L102 101" stroke="#57301A" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M90 111 Q100 116 110 111" stroke="#4A2715" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          </svg>
        );
      }

      case 'souleymane':
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <rect width="200" height="200" fill="#B58352" />
            {/* Desert Shepherd Tagelmust / Chèche */}
            <path d="M22 200 C28 142 172 142 178 200 Z" fill="#475569" />
            <ellipse cx="100" cy="88" rx="45" ry="50" fill="#334155" />
            <ellipse cx="100" cy="92" rx="31" ry="36" fill="#754326" />
            {/* Beard & Calm Eyes */}
            <path d="M72 98 C74 122 86 130 100 130 C114 130 126 122 128 98 C122 110 112 115 100 115 C88 115 78 110 72 98 Z" fill="#1E1815" />
            <circle cx="86" cy="86" r="3.2" fill="#140E0A" />
            <circle cx="114" cy="86" r="3.2" fill="#140E0A" />
            <path d="M56 72 Q100 56 144 72" stroke="#64748B" strokeWidth="6" fill="none" />
            <path d="M58 122 Q100 142 142 122" stroke="#475569" strokeWidth="10" fill="none" />
          </svg>
        );

      case 'cheikh-idriss':
      case 'vieux-sidi':
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <rect width="200" height="200" fill="#A67649" />
            {/* Cloaked Elder / Wise Traveler */}
            <path d="M20 200 C25 140 175 140 180 200 Z" fill="#D6CFC2" />
            <ellipse cx="100" cy="88" rx="46" ry="52" fill="#E5DFD3" />
            <ellipse cx="100" cy="92" rx="32" ry="38" fill="#734226" />
            {/* White/Silver Beard */}
            <path d="M68 94 C69 126 85 138 100 138 C115 138 131 126 132 94 C125 110 114 116 100 116 C86 116 75 110 68 94 Z" fill="#E2E8F0" />
            <path d="M77 78 Q86 74 94 78" stroke="#CBD5E1" strokeWidth="2.8" fill="none" strokeLinecap="round" />
            <path d="M106 78 Q114 74 123 78" stroke="#CBD5E1" strokeWidth="2.8" fill="none" strokeLinecap="round" />
            <circle cx="86" cy="85" r="3.2" fill="#1C130E" />
            <circle cx="114" cy="85" r="3.2" fill="#1C130E" />
            <path d="M90 111 Q100 115 110 111" stroke="#472816" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        );

      default:
        // Moussa / Amadou / Default Sahelian Portrait
        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <rect width="200" height="200" fill="#BA8250" />
            <path d="M32 200 C38 150 162 150 168 200 Z" fill="#52525B" />
            <rect x="86" y="122" width="28" height="32" rx="8" fill="#754326" />
            <ellipse cx="100" cy="92" rx="31" ry="37" fill="#824B2B" />
            <circle cx="86" cy="87" r="3.3" fill="#1A110C" />
            <circle cx="114" cy="87" r="3.3" fill="#1A110C" />
            <path d="M89 112 Q100 116 112 110" stroke="#472715" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path d="M68 74 C68 46 132 46 132 74 Z" fill="#78350F" />
          </svg>
        );
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {renderCustomSvg(character.id)}
    </div>
  );
};
