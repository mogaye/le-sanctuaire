import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export type PrayerPostureKey =
  | 'niyyah'
  | 'standing_full'
  | 'takbir'
  | 'qiyam'
  | 'ruku'
  | 'itidal'
  | 'sujud'
  | 'julus'
  | 'tashahhud'
  | 'taslim';

export const POSTURE_IMAGES: Record<
  PrayerPostureKey,
  { webp: string; jpg: string; alt: string; name: string }
> = {
  niyyah: {
    webp: '/images/prayer/standing_niyyah.webp',
    jpg: '/images/prayer/standing_niyyah.jpg',
    alt: 'Position debout (Qiyam) - Intention de la prière',
    name: "L'Intention Sincère (An-Niyyah)",
  },
  standing_full: {
    webp: '/images/prayer/standing_full.webp',
    jpg: '/images/prayer/standing_full.jpg',
    alt: 'Fidèle en plein pied - Tenue Sunnah',
    name: 'Fidèle en Plein Pied (Sunnah)',
  },
  takbir: {
    webp: '/images/prayer/takbir.webp',
    jpg: '/images/prayer/takbir.jpg',
    alt: 'Takbirat Al-Ihram - Mains levées aux oreilles',
    name: "Le Takbir d'Ouverture (Takbirat Al-Ihram)",
  },
  qiyam: {
    webp: '/images/prayer/qiyam.webp',
    jpg: '/images/prayer/qiyam.jpg',
    alt: 'Qiyam - Mains posées sur la poitrine',
    name: 'Station Debout (Qiyam) & Récitation',
  },
  ruku: {
    webp: '/images/prayer/ruku.webp',
    jpg: '/images/prayer/ruku.jpg',
    alt: 'Ar-Ruku - Inclinaison sacrée à 90°',
    name: "L'Inclinaison Sacrée (Ar-Ruku')",
  },
  itidal: {
    webp: '/images/prayer/itidal.webp',
    jpg: '/images/prayer/itidal.jpg',
    alt: "Al-I'tidal - Redressement après le Ruku",
    name: "Le Redressement du Ruku' (Al-I'tidal)",
  },
  sujud: {
    webp: '/images/prayer/sujud.webp',
    jpg: '/images/prayer/sujud.jpg',
    alt: 'As-Sujud - Prosternation au sol avec 7 points d’appui',
    name: 'La Prosternation (As-Sujud)',
  },
  julus: {
    webp: '/images/prayer/julus.webp',
    jpg: '/images/prayer/julus.jpg',
    alt: 'Julus - Assise sereine entre deux prosternations',
    name: 'Assise entre deux Prosternations (Julus)',
  },
  tashahhud: {
    webp: '/images/prayer/tashahhud.webp',
    jpg: '/images/prayer/tashahhud.jpg',
    alt: 'At-Tashahhud - Assise finale avec attestation de foi',
    name: 'Le Témoignage de Foi (At-Tashahhud)',
  },
  taslim: {
    webp: '/images/prayer/taslim.webp',
    jpg: '/images/prayer/taslim.jpg',
    alt: 'At-Taslim - Salutation finale à droite et à gauche',
    name: 'La Salutation Finale (At-Taslim)',
  },
};

interface PrayerIllustrationProps {
  posture: PrayerPostureKey;
  className?: string;
  accentColor?: string;
  isAnimated?: boolean;
  showSandals?: boolean;
  showPrayerRug?: boolean;
  viewMode?: '3d' | 'vector';
  onEnlarge?: () => void;
}

export const PrayerIllustration: React.FC<PrayerIllustrationProps> = ({
  posture,
  className = 'w-64 h-80 sm:w-72 sm:h-96',
  accentColor = '#059669',
  isAnimated = true,
  showSandals = false,
  showPrayerRug = true,
  viewMode = '3d',
  onEnlarge,
}) => {
  const [imageError, setImageError] = React.useState(false);

  // If standing_full, show sandals like the reference photo by default
  const displaySandals = showSandals || posture === 'standing_full';
  // If standing_full, don't show the prayer rug so it looks like the clean reference showcase
  const displayRug = showPrayerRug && posture !== 'standing_full';

  const photoData = POSTURE_IMAGES[posture] || POSTURE_IMAGES.niyyah;

  // If 3D render mode is selected and no image error occurred, render authentic 3D model frame
  if (viewMode === '3d' && !imageError) {
    return (
      <div
        onClick={onEnlarge}
        className={`relative flex items-center justify-center select-none ${className} ${
          isAnimated ? 'transition-transform duration-300 hover:scale-[1.02]' : ''
        } ${onEnlarge ? 'cursor-zoom-in' : ''}`}
        title={photoData.name}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={posture}
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(3px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.01, filter: 'blur(2px)' }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full flex items-center justify-center relative"
          >
            <picture className="w-full h-full flex items-center justify-center">
              <source srcSet={photoData.webp} type="image/webp" />
              <img
                src={photoData.jpg}
                alt={photoData.alt}
                className="w-full h-full object-contain select-none mix-blend-multiply"
                style={{
                  WebkitMaskImage:
                    'radial-gradient(ellipse 92% 90% at 50% 50%, black 72%, transparent 100%)',
                  maskImage:
                    'radial-gradient(ellipse 92% 90% at 50% 50%, black 72%, transparent 100%)',
                }}
                onError={() => setImageError(true)}
                loading="lazy"
              />
            </picture>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className} ${
        isAnimated ? 'transition-transform duration-300 hover:scale-[1.015]' : ''
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={posture}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.01 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-full h-full flex items-center justify-center"
        >
          <svg
        viewBox="0 0 320 420"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle Ambient Ground / Mat Shadow */}
          <radialGradient id="charFloorShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0B132B" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#0B132B" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0B132B" stopOpacity="0" />
          </radialGradient>

          {/* Ornate Velvet Prayer Rug (Sajjadah) Gradient */}
          <linearGradient id="sajjadahVelvet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#044E38" />
            <stop offset="50%" stopColor="#065F46" />
            <stop offset="100%" stopColor="#022C22" />
          </linearGradient>

          <linearGradient id="sajjadahGoldBorder" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          {/* Realistic Skin Gradient (Warm Tan / Mediterranean Tone) */}
          <linearGradient id="charSkinTone" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#F9D7BC" />
            <stop offset="50%" stopColor="#E5B28B" />
            <stop offset="100%" stopColor="#C98B63" />
          </linearGradient>

          {/* Skin Shadows & Anatomical Depth */}
          <linearGradient id="charSkinShadow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#B3734D" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8C4E2D" stopOpacity="0.9" />
          </linearGradient>

          {/* Manicured Jet-Black Beard Gradient with Silky Sheen */}
          <linearGradient id="charBeardShine" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#222831" />
            <stop offset="40%" stopColor="#181D24" />
            <stop offset="85%" stopColor="#0F141C" />
            <stop offset="100%" stopColor="#070A0F" />
          </linearGradient>

          {/* White Saudi/Emirati Thobe (Qamis) - Realistic Fabric Volume & Draping */}
          <linearGradient id="thobeFabricLight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EDF2F7" />
            <stop offset="25%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#F8FAFC" />
            <stop offset="85%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          {/* Deep fabric crease shadows */}
          <linearGradient id="thobeDeepShadow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#CBD5E1" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#64748B" stopOpacity="0.4" />
          </linearGradient>

          {/* Kufi / Taqiyah Prayer Skullcap */}
          <linearGradient id="kufiCapDome" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#DDE3EA" />
          </linearGradient>

          {/* Black Leather Sandals (as in the reference image) */}
          <linearGradient id="sandalLeather" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2D3748" />
            <stop offset="40%" stopColor="#1A202C" />
            <stop offset="100%" stopColor="#0D1117" />
          </linearGradient>

          {/* Spiritual Light Radiance */}
          <radialGradient id="spiritualAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#10B981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* =========================================================
            BACKGROUND: ELEGANT PRAYER RUG (SAJJADAH) OR STUDIO SHADOW
           ========================================================= */}
        {displayRug && (
          <g id="prayer-rug-perspective">
            {/* Ground shadow beneath rug */}
            <ellipse cx="160" cy="385" rx="142" ry="18" fill="url(#charFloorShadow)" />

            {/* Velvet Prayer Carpet */}
            <polygon
              points="30,368 290,368 306,404 14,404"
              fill="url(#sajjadahVelvet)"
              stroke="#047857"
              strokeWidth="1.6"
            />

            {/* Gold Embroidered Border & Mihrab Tip */}
            <polygon
              points="38,372 282,372 296,400 24,400"
              fill="none"
              stroke="url(#sajjadahGoldBorder)"
              strokeWidth="1.6"
            />
            <path
              d="M 120 372 Q 160 362 200 372"
              stroke="url(#sajjadahGoldBorder)"
              strokeWidth="1.4"
              fill="none"
            />

            {/* Silk carpet fringe tassels */}
            <path
              d="M 14 404 L 10 409 M 18 404 L 15 409 M 22 404 L 20 409 M 298 404 L 301 409 M 302 404 L 305 409 M 306 404 L 310 409"
              stroke="#FDE68A"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>
        )}

        {!displayRug && (
          /* Subtle clean ground shadow for standing demonstration */
          <ellipse cx="160" cy="398" rx="85" ry="12" fill="url(#charFloorShadow)" />
        )}

        {/* =========================================================
            COMMON REUSABLE CHARACTER ASSETS (Used across postures)
           ========================================================= */}

        {/* =========================================================
            POSTURE: STANDING FULL / AN-NIYYAH (Identique à l'Image Fournie)
           ========================================================= */}
        {(posture === 'niyyah' || posture === 'standing_full') && (
          <g id="character-standing-full" className="animate-in fade-in duration-300">
            {/* Shadow under feet / sandals */}
            <ellipse cx="132" cy="396" rx="22" ry="5" fill="#0B132B" fillOpacity="0.4" />
            <ellipse cx="188" cy="396" rx="22" ry="5" fill="#0B132B" fillOpacity="0.4" />

            {/* FEET OR AUTHENTIC BLACK LEATHER SANDALS (From reference image) */}
            {displaySandals ? (
              <g id="reference-black-sandals">
                {/* Left Sandal (Viewer's left) */}
                <g id="left-sandal">
                  {/* Bare toes poking out */}
                  <ellipse cx="120" cy="394" rx="3" ry="2.5" fill="url(#charSkinTone)" />
                  <ellipse cx="125" cy="395" rx="3.2" ry="2.8" fill="url(#charSkinTone)" />
                  <ellipse cx="130" cy="395" rx="3.5" ry="3" fill="url(#charSkinTone)" />
                  {/* Thick contoured black sole */}
                  <path
                    d="M 114 394 C 114 391, 148 390, 150 393 C 150 398, 146 401, 132 401 C 118 401, 114 398, 114 394 Z"
                    fill="url(#sandalLeather)"
                    stroke="#4A5568"
                    strokeWidth="0.8"
                  />
                  {/* Double wide black leather straps */}
                  <path
                    d="M 118 392 C 122 380, 142 380, 146 391 L 140 393 C 137 385, 126 385, 122 393 Z"
                    fill="url(#sandalLeather)"
                    stroke="#1A202C"
                    strokeWidth="0.8"
                  />
                  {/* Second instep strap */}
                  <path
                    d="M 124 388 C 128 377, 145 378, 148 387 L 144 388 C 141 381, 131 381, 128 388 Z"
                    fill="#2D3748"
                  />
                </g>

                {/* Right Sandal (Viewer's right) */}
                <g id="right-sandal">
                  {/* Bare toes poking out */}
                  <ellipse cx="200" cy="394" rx="3" ry="2.5" fill="url(#charSkinTone)" />
                  <ellipse cx="195" cy="395" rx="3.2" ry="2.8" fill="url(#charSkinTone)" />
                  <ellipse cx="190" cy="395" rx="3.5" ry="3" fill="url(#charSkinTone)" />
                  {/* Thick contoured black sole */}
                  <path
                    d="M 170 393 C 172 390, 206 391, 206 394 C 206 398, 202 401, 188 401 C 174 401, 170 398, 170 393 Z"
                    fill="url(#sandalLeather)"
                    stroke="#4A5568"
                    strokeWidth="0.8"
                  />
                  {/* Double wide black leather straps */}
                  <path
                    d="M 174 391 C 178 380, 198 380, 202 392 L 198 393 C 194 385, 183 385, 180 393 Z"
                    fill="url(#sandalLeather)"
                    stroke="#1A202C"
                    strokeWidth="0.8"
                  />
                  {/* Second instep strap */}
                  <path
                    d="M 172 387 C 175 378, 192 377, 196 388 L 192 388 C 189 381, 179 381, 176 388 Z"
                    fill="#2D3748"
                  />
                </g>
              </g>
            ) : (
              /* Bare anatomical feet on the prayer rug */
              <g id="bare-feet-standing">
                <path d="M 125 365 L 124 390 C 124 393, 142 393, 142 390 L 135 365 Z" fill="url(#charSkinTone)" />
                <path d="M 185 365 L 178 390 C 178 393, 196 393, 196 390 L 195 365 Z" fill="url(#charSkinTone)" />
              </g>
            )}

            {/* =========================================================
                THE WHITE THOBE / QAMIS - HIGH FIDELITY TAILORED DRAPING
               ========================================================= */}
            <g id="reference-thobe-drape">
              {/* Main Silhouette of the Thobe (Flowing from shoulders to above ankles) */}
              <path
                d="M 116 114 
                   C 128 102, 192 102, 204 114 
                   C 209 135, 212 185, 216 260 
                   C 220 305, 222 355, 220 368 
                   C 200 371, 120 371, 100 368 
                   C 98 355, 100 305, 104 260 
                   C 108 185, 111 135, 116 114 Z"
                fill="url(#thobeFabricLight)"
                stroke="#94A3B8"
                strokeWidth="1.2"
              />

              {/* Precise Dimensional Vertical Creases (Matching Reference Image) */}
              {/* Central Pleat running down from the placket */}
              <path
                d="M 160 215 
                   C 161 250, 162 310, 164 368"
                stroke="#94A3B8"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M 162 215 
                   C 163 250, 164 310, 166 368"
                stroke="#FFFFFF"
                strokeWidth="1.2"
                strokeLinecap="round"
              />

              {/* Left flowing folds & shadow gradients */}
              <path
                d="M 132 120 
                   C 130 180, 125 280, 122 368"
                stroke="#CBD5E1"
                strokeWidth="2"
                strokeOpacity="0.8"
              />
              <path
                d="M 144 140 
                   C 142 200, 138 290, 136 368"
                stroke="#94A3B8"
                strokeWidth="1.2"
              />

              {/* Right flowing folds & shadow gradients */}
              <path
                d="M 188 120 
                   C 190 180, 196 280, 200 368"
                stroke="#CBD5E1"
                strokeWidth="2"
                strokeOpacity="0.8"
              />
              <path
                d="M 176 180 
                   C 178 230, 182 300, 184 368"
                stroke="#94A3B8"
                strokeWidth="1.2"
              />

              {/* Subtle diagonal ripple folds on flanks (as seen in photo) */}
              <path d="M 108 240 Q 116 260 112 280" stroke="#CBD5E1" strokeWidth="1.2" fill="none" />
              <path d="M 106 295 Q 115 315 110 335" stroke="#CBD5E1" strokeWidth="1.2" fill="none" />
              <path d="M 212 240 Q 204 260 208 280" stroke="#CBD5E1" strokeWidth="1.2" fill="none" />
              <path d="M 214 295 Q 205 315 210 335" stroke="#CBD5E1" strokeWidth="1.2" fill="none" />

              {/* Bottom Hem Stitch Line */}
              <path d="M 100 364 Q 160 367 220 364" stroke="#CBD5E1" strokeWidth="1.5" />

              {/* =========================================================
                  CENTRAL PLACKET & BUTTONS (Mandarin Shirt Placket)
                 ========================================================= */}
              {/* Placket Band */}
              <rect
                x="154"
                y="112"
                width="12"
                height="85"
                rx="1"
                fill="#FFFFFF"
                stroke="#94A3B8"
                strokeWidth="1"
              />
              {/* Stitched seam inside placket */}
              <line x1="160" y1="114" x2="160" y2="195" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="2 1" />
              {/* Clean buttons along placket */}
              <circle cx="160" cy="126" r="1.8" fill="#475569" />
              <circle cx="160" cy="144" r="1.8" fill="#475569" />
              <circle cx="160" cy="162" r="1.8" fill="#475569" />
              <circle cx="160" cy="180" r="1.8" fill="#475569" />
              {/* Placket bottom tab */}
              <path d="M 154 197 L 160 202 L 166 197 Z" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />

              {/* =========================================================
                  CHEST POCKET (Wearer's Left / Viewer's Right)
                 ========================================================= */}
              <g id="chest-pocket">
                {/* Pocket outline with rounded bottom (Exact match to reference photo) */}
                <path
                  d="M 174 136 
                     L 194 136 
                     L 194 156 
                     C 194 162, 174 162, 174 156 Z"
                  fill="#FFFFFF"
                  stroke="#94A3B8"
                  strokeWidth="1.2"
                />
                {/* Top welt stitching */}
                <line x1="174" y1="140" x2="194" y2="140" stroke="#CBD5E1" strokeWidth="1" />
                {/* Subtle pen slit shadow */}
                <line x1="184" y1="138" x2="184" y2="152" stroke="#E2E8F0" strokeWidth="1.5" />
              </g>
            </g>

            {/* =========================================================
                ARMS & HANDS WITH CUFFS (In natural standing position)
               ========================================================= */}
            {/* Left Arm (Viewer's left) */}
            <g id="left-arm-standing">
              <path
                d="M 116 114 
                   C 106 130, 98 165, 96 215 
                   L 106 215 
                   C 108 175, 114 140, 122 118 Z"
                fill="url(#thobeFabricLight)"
                stroke="#94A3B8"
                strokeWidth="1.2"
              />
              {/* Sleeve folds around elbow */}
              <path d="M 97 185 Q 104 180 106 186" stroke="#94A3B8" strokeWidth="1" />
              <path d="M 96 198 Q 103 194 106 200" stroke="#94A3B8" strokeWidth="1" />

              {/* Sleeve Shirt Cuff (Crisp buttoned cuff as in photo) */}
              <path
                d="M 96 215 L 106 215 L 106 230 L 96 230 Z"
                fill="#FFFFFF"
                stroke="#94A3B8"
                strokeWidth="1.2"
              />
              <circle cx="101" cy="223" r="1.5" fill="#475569" />

              {/* Left Hand & Anatomical Fingers (Natural relaxed posture) */}
              <path
                d="M 98 230 
                   L 98 248 
                   C 97 258, 100 266, 103 268 
                   C 106 268, 108 260, 107 248 
                   L 107 230 Z"
                fill="url(#charSkinTone)"
                stroke="#B45309"
                strokeWidth="0.5"
              />
              {/* Defined fingers and thumb */}
              <path d="M 100 248 L 99 262 M 102 248 L 102 265 M 104 248 L 105 264 M 106 248 L 107 258" stroke="#9A3412" strokeWidth="0.7" strokeLinecap="round" />
            </g>

            {/* Right Arm (Viewer's right) */}
            <g id="right-arm-standing">
              <path
                d="M 204 114 
                   C 214 130, 222 165, 224 215 
                   L 214 215 
                   C 212 175, 206 140, 198 118 Z"
                fill="url(#thobeFabricLight)"
                stroke="#94A3B8"
                strokeWidth="1.2"
              />
              {/* Sleeve folds */}
              <path d="M 223 185 Q 216 180 214 186" stroke="#94A3B8" strokeWidth="1" />
              <path d="M 224 198 Q 217 194 214 200" stroke="#94A3B8" strokeWidth="1" />

              {/* Sleeve Shirt Cuff */}
              <path
                d="M 214 215 L 224 215 L 224 230 L 214 230 Z"
                fill="#FFFFFF"
                stroke="#94A3B8"
                strokeWidth="1.2"
              />
              <circle cx="219" cy="223" r="1.5" fill="#475569" />

              {/* Right Hand & Anatomical Fingers */}
              <path
                d="M 213 230 
                   L 213 248 
                   C 212 260, 214 268, 217 268 
                   C 220 266, 223 258, 222 248 
                   L 222 230 Z"
                fill="url(#charSkinTone)"
                stroke="#B45309"
                strokeWidth="0.5"
              />
              {/* Defined fingers and thumb */}
              <path d="M 214 248 L 213 258 M 216 248 L 215 264 M 218 248 L 218 265 M 220 248 L 221 262" stroke="#9A3412" strokeWidth="0.7" strokeLinecap="round" />
            </g>

            {/* =========================================================
                MANDARIN COLLAR, NECK, HEAD, KUFI CAP & BEARD
               ========================================================= */}
            <g id="head-collar-group">
              {/* Strong Neck */}
              <path d="M 152 92 L 152 114 L 168 114 L 168 92 Z" fill="url(#charSkinTone)" />
              {/* Throat / Adam's apple shadow */}
              <path d="M 156 100 Q 160 106 164 100" stroke="#C98B63" strokeWidth="1.5" fill="none" />

              {/* Mandarin Collar Band (Col Officier) */}
              <path
                d="M 144 114 
                   C 148 104, 172 104, 176 114 
                   L 172 118 
                   C 168 110, 152 110, 148 118 Z"
                fill="#FFFFFF"
                stroke="#94A3B8"
                strokeWidth="1.2"
              />
              {/* Collar Notch & Top Button */}
              <line x1="160" y1="106" x2="160" y2="114" stroke="#94A3B8" strokeWidth="1.2" />
              <circle cx="160" cy="110" r="1.4" fill="#475569" />

              {/* EARS WITH REALISTIC ANATOMICAL CARTILAGE (As in photo) */}
              {/* Left Ear */}
              <g id="left-ear">
                <path
                  d="M 142 55 C 137 55, 137 72, 142 74 Z"
                  fill="url(#charSkinTone)"
                  stroke="#B45309"
                  strokeWidth="0.8"
                />
                <path d="M 141 59 Q 139 64 141 70" stroke="#C98B63" strokeWidth="1.2" fill="none" />
              </g>

              {/* Right Ear */}
              <g id="right-ear">
                <path
                  d="M 178 55 C 183 55, 183 72, 178 74 Z"
                  fill="url(#charSkinTone)"
                  stroke="#B45309"
                  strokeWidth="0.8"
                />
                <path d="M 179 59 Q 181 64 179 70" stroke="#C98B63" strokeWidth="1.2" fill="none" />
              </g>

              {/* FULL PROFILE BEARD BASE (Jet Black, manicured, wrapping chin) */}
              <path
                d="M 142 56 
                   C 140 75, 145 96, 160 100 
                   C 175 96, 180 75, 178 56 
                   Z"
                fill="url(#charBeardShine)"
              />

              {/* FACE SHAPE & NOSE CONTOUR */}
              <path
                d="M 144 50 
                   C 144 64, 148 76, 160 78 
                   C 172 76, 176 64, 176 50 
                   Z"
                fill="url(#charSkinTone)"
              />

              {/* FRONT MANICURED BEARD & MUSTACHE (Exact match to reference photo) */}
              {/* Mustache */}
              <path
                d="M 150 72 
                   C 155 70, 165 70, 170 72 
                   C 172 75, 166 76, 160 76 
                   C 154 76, 148 75, 150 72 Z"
                fill="url(#charBeardShine)"
              />
              {/* Soul Patch under lower lip */}
              <path d="M 158 79 L 162 79 L 161 84 L 159 84 Z" fill="url(#charBeardShine)" />
              {/* Lower Beard Contour with soft hair detailing */}
              <path
                d="M 144 65 
                   C 144 82, 150 96, 160 98 
                   C 170 96, 176 82, 176 65 
                   C 172 74, 167 86, 160 87 
                   C 153 86, 148 74, 144 65 Z"
                fill="url(#charBeardShine)"
              />

              {/* Serene downward-gazing facial features (Humble contemplation) */}
              {/* Eyebrows */}
              <path d="M 148 54 Q 154 52 158 54" stroke="#0F141C" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M 162 54 Q 166 52 172 54" stroke="#0F141C" strokeWidth="1.8" strokeLinecap="round" />
              {/* Serene downcast eyelids (Khushu') */}
              <path d="M 150 58 Q 154 62 157 59" stroke="#334155" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              <path d="M 163 59 Q 166 62 170 58" stroke="#334155" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              {/* Nose Bridge and Tip */}
              <path d="M 160 54 L 160 66 L 163 67" stroke="#B45309" strokeWidth="1.2" fill="none" strokeLinecap="round" />

              {/* =========================================================
                  WHITE KUFI / TAQIYAH PRAYER SKULLCAP (From reference image)
                 ========================================================= */}
              <g id="white-kufi-cap">
                {/* Main Dome */}
                <path
                  d="M 143 51 
                     C 143 32, 177 32, 177 51 
                     Z"
                  fill="url(#kufiCapDome)"
                  stroke="#CBD5E1"
                  strokeWidth="1.2"
                />
                {/* Lower Stitched Rim Band wrapping around forehead (Distinct in photo) */}
                <path
                  d="M 143 47 Q 160 51 177 47 L 177 52 Q 160 56 143 52 Z"
                  fill="#FFFFFF"
                  stroke="#94A3B8"
                  strokeWidth="1"
                />
                {/* Micro-texture vertical ribbing on the cap */}
                <line x1="149" y1="38" x2="149" y2="48" stroke="#CBD5E1" strokeWidth="0.8" strokeDasharray="1 2" />
                <line x1="154" y1="35" x2="154" y2="49" stroke="#CBD5E1" strokeWidth="0.8" strokeDasharray="1 2" />
                <line x1="160" y1="34" x2="160" y2="50" stroke="#CBD5E1" strokeWidth="0.8" strokeDasharray="1 2" />
                <line x1="166" y1="35" x2="166" y2="49" stroke="#CBD5E1" strokeWidth="0.8" strokeDasharray="1 2" />
                <line x1="171" y1="38" x2="171" y2="48" stroke="#CBD5E1" strokeWidth="0.8" strokeDasharray="1 2" />
              </g>
            </g>

            {/* Spiritual Calligraphic Medallion for An-Niyyah (Replacing comic bubble) */}
            {posture === 'niyyah' && (
              <g id="spiritual-niyyah-medallion">
                <circle cx="236" cy="70" r="34" fill="url(#spiritualAura)" />
                <circle cx="236" cy="70" r="26" fill="#FFFFFF" stroke="#059669" strokeWidth="1.6" className="drop-shadow-xs" />
                <circle cx="236" cy="70" r="23" fill="#F0FDF4" stroke="#D97706" strokeWidth="0.8" strokeDasharray="2 2" />
                <text x="236" y="68" fontSize="13" fontFamily="'Amiri', serif" textAnchor="middle" fill="#065F46" fontWeight="bold">
                  النِّيَّةُ
                </text>
                <text x="236" y="79" fontSize="7.5" fontFamily="sans-serif" textAnchor="middle" fill="#047857" fontWeight="600">
                  Dans le Cœur
                </text>
                {/* Connecting subtle spiritual ray to chest */}
                <path d="M 212 80 Q 185 100 170 120" stroke="#10B981" strokeWidth="1.2" strokeDasharray="3 3" fill="none" opacity="0.8" />
                <circle cx="168" cy="122" r="2.5" fill="#10B981" />
              </g>
            )}
          </g>
        )}

        {/* =========================================================
            POSTURE: TAKBIRAT AL-IHRAM (Mains Levées aux Épaules / Oreilles)
           ========================================================= */}
        {posture === 'takbir' && (
          <g id="character-takbir" className="animate-in fade-in duration-300">
            {/* Floor shadow */}
            <ellipse cx="160" cy="385" rx="42" ry="6" fill="#0B132B" fillOpacity="0.4" />

            {/* Feet */}
            <path d="M 132 365 L 126 390 C 126 393, 144 393, 144 390 L 138 365 Z" fill="url(#charSkinTone)" />
            <path d="M 188 365 L 182 390 C 182 393, 200 393, 200 390 L 194 365 Z" fill="url(#charSkinTone)" />

            {/* Thobe Body */}
            <path
              d="M 116 114 C 128 102, 192 102, 204 114 C 209 135, 212 185, 216 260 C 220 305, 222 355, 220 368 C 200 371, 120 371, 100 368 C 98 355, 100 305, 104 260 C 108 185, 111 135, 116 114 Z"
              fill="url(#thobeFabricLight)"
              stroke="#94A3B8"
              strokeWidth="1.2"
            />
            {/* Center Placket & Buttons */}
            <rect x="154" y="112" width="12" height="85" rx="1" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
            <circle cx="160" cy="126" r="1.8" fill="#475569" />
            <circle cx="160" cy="144" r="1.8" fill="#475569" />
            <circle cx="160" cy="162" r="1.8" fill="#475569" />
            {/* Chest Pocket */}
            <path d="M 174 136 L 194 136 L 194 156 C 194 162, 174 162, 174 156 Z" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.2" />

            {/* Vertical Drapes */}
            <path d="M 160 215 C 161 250, 162 310, 164 368" stroke="#94A3B8" strokeWidth="1.5" />
            <path d="M 132 140 C 130 200, 125 290, 122 368" stroke="#CBD5E1" strokeWidth="1.5" />
            <path d="M 188 140 C 190 200, 196 290, 200 368" stroke="#CBD5E1" strokeWidth="1.5" />

            {/* RAISED ARMS WITH BUTTONED CUFFS & OPEN PALMS FACING QIBLA */}
            {/* Left Arm Raised */}
            <g id="left-arm-takbir">
              <path
                d="M 116 114 C 98 126, 84 145, 80 165 L 92 168 C 98 148, 108 132, 122 118 Z"
                fill="url(#thobeFabricLight)"
                stroke="#94A3B8"
                strokeWidth="1.2"
              />
              {/* Forearm angled up toward ear */}
              <path d="M 82 165 L 88 105 L 98 105 L 92 168 Z" fill="url(#charSkinTone)" />
              {/* Sleeve cuff at forearm */}
              <rect x="80" y="160" width="14" height="8" rx="1.5" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
              <circle cx="87" cy="164" r="1.4" fill="#475569" />
              {/* Open Palm facing Qibla with 5 straight fingers */}
              <g id="left-palm-qibla">
                <rect x="82" y="75" width="16" height="28" rx="4" fill="url(#charSkinTone)" stroke="#9A3412" strokeWidth="0.8" />
                <path d="M 98 90 C 102 90, 104 85, 102 81 L 98 83 Z" fill="url(#charSkinTone)" stroke="#9A3412" strokeWidth="0.6" />
                <line x1="86" y1="75" x2="86" y2="88" stroke="#9A3412" strokeWidth="0.7" />
                <line x1="90" y1="75" x2="90" y2="89" stroke="#9A3412" strokeWidth="0.7" />
                <line x1="94" y1="75" x2="94" y2="88" stroke="#9A3412" strokeWidth="0.7" />
              </g>
            </g>

            {/* Right Arm Raised */}
            <g id="right-arm-takbir">
              <path
                d="M 204 114 C 222 126, 236 145, 240 165 L 228 168 C 222 148, 212 132, 198 118 Z"
                fill="url(#thobeFabricLight)"
                stroke="#94A3B8"
                strokeWidth="1.2"
              />
              {/* Forearm angled up */}
              <path d="M 238 165 L 232 105 L 222 105 L 228 168 Z" fill="url(#charSkinTone)" />
              {/* Sleeve cuff */}
              <rect x="226" y="160" width="14" height="8" rx="1.5" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
              <circle cx="233" cy="164" r="1.4" fill="#475569" />
              {/* Open Palm facing Qibla */}
              <g id="right-palm-qibla">
                <rect x="222" y="75" width="16" height="28" rx="4" fill="url(#charSkinTone)" stroke="#9A3412" strokeWidth="0.8" />
                <path d="M 222 90 C 218 90, 216 85, 218 81 L 222 83 Z" fill="url(#charSkinTone)" stroke="#9A3412" strokeWidth="0.6" />
                <line x1="226" y1="75" x2="226" y2="88" stroke="#9A3412" strokeWidth="0.7" />
                <line x1="230" y1="75" x2="230" y2="89" stroke="#9A3412" strokeWidth="0.7" />
                <line x1="234" y1="75" x2="234" y2="88" stroke="#9A3412" strokeWidth="0.7" />
              </g>
            </g>

            {/* Collar & Head with Kufi and Beard */}
            <path d="M 152 92 L 152 114 L 168 114 L 168 92 Z" fill="url(#charSkinTone)" />
            <path d="M 144 114 C 148 104, 172 104, 176 114 L 172 118 C 168 110, 152 110, 148 118 Z" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.2" />
            <path d="M 142 56 C 140 75, 145 96, 160 100 C 175 96, 180 75, 178 56 Z" fill="url(#charBeardShine)" />
            <path d="M 144 50 C 144 64, 148 76, 160 78 C 172 76, 176 64, 176 50 Z" fill="url(#charSkinTone)" />
            <path d="M 150 72 C 155 70, 165 70, 170 72 C 172 75, 166 76, 160 76 C 154 76, 148 75, 150 72 Z" fill="url(#charBeardShine)" />
            <path d="M 150 58 Q 154 62 157 59" stroke="#334155" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d="M 163 59 Q 166 62 170 58" stroke="#334155" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            {/* Kufi */}
            <path d="M 143 51 C 143 32, 177 32, 177 51 Z" fill="url(#kufiCapDome)" stroke="#CBD5E1" strokeWidth="1.2" />
            <path d="M 143 47 Q 160 51 177 47 L 177 52 Q 160 56 143 52 Z" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />

            {/* Sacred Takbir Banner */}
            <g id="takbir-banner">
              <rect x="120" y="16" width="80" height="24" rx="12" fill="#065F46" stroke="#F59E0B" strokeWidth="1.4" />
              <text x="160" y="32" fontSize="12" fontFamily="'Amiri', serif" textAnchor="middle" fill="#FFFFFF" fontWeight="bold">
                اللَّهُ أَكْبَرُ
              </text>
            </g>
          </g>
        )}

        {/* =========================================================
            POSTURE: AL-QIYAM (Station Debout, Mains Croisées sur la Poitrine)
           ========================================================= */}
        {posture === 'qiyam' && (
          <g id="character-qiyam" className="animate-in fade-in duration-300">
            <ellipse cx="160" cy="385" rx="42" ry="6" fill="#0B132B" fillOpacity="0.4" />

            {/* Feet */}
            <path d="M 132 365 L 126 390 C 126 393, 144 393, 144 390 L 138 365 Z" fill="url(#charSkinTone)" />
            <path d="M 188 365 L 182 390 C 182 393, 200 393, 200 390 L 194 365 Z" fill="url(#charSkinTone)" />

            {/* Thobe Body */}
            <path
              d="M 116 114 C 128 102, 192 102, 204 114 C 209 135, 212 185, 216 260 C 220 305, 222 355, 220 368 C 200 371, 120 371, 100 368 C 98 355, 100 305, 104 260 C 108 185, 111 135, 116 114 Z"
              fill="url(#thobeFabricLight)"
              stroke="#94A3B8"
              strokeWidth="1.2"
            />
            {/* Pocket */}
            <path d="M 174 136 L 194 136 L 194 156 C 194 162, 174 162, 174 156 Z" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.2" />
            <path d="M 160 215 C 161 250, 162 310, 164 368" stroke="#94A3B8" strokeWidth="1.5" />

            {/* CROSSED ARMS ON CHEST (Right hand grasping Left wrist / forearm - Sunnah) */}
            <g id="arms-crossed-chest">
              {/* Left arm sloping in to chest */}
              <path
                d="M 116 114 C 104 132, 102 160, 112 176 L 152 176 L 152 164 L 126 160 C 118 146, 118 132, 120 118 Z"
                fill="url(#thobeFabricLight)"
                stroke="#94A3B8"
                strokeWidth="1.2"
              />
              {/* Right arm sloping in to chest */}
              <path
                d="M 204 114 C 216 132, 218 160, 208 176 L 168 176 L 168 164 L 194 160 C 202 146, 202 132, 200 118 Z"
                fill="url(#thobeFabricLight)"
                stroke="#94A3B8"
                strokeWidth="1.2"
              />

              {/* Left Wrist resting under */}
              <rect x="144" y="164" width="22" height="11" rx="3" fill="url(#charSkinTone)" stroke="#B45309" strokeWidth="0.5" />

              {/* Right Hand Grasping Left Wrist (Sunnah) */}
              <g id="right-hand-grasp-wrist">
                <rect x="148" y="160" width="20" height="15" rx="3.5" fill="url(#charSkinTone)" stroke="#9A3412" strokeWidth="0.8" />
                {/* 4 Fingers grasping the left forearm */}
                <line x1="152" y1="160" x2="152" y2="173" stroke="#9A3412" strokeWidth="0.8" />
                <line x1="156" y1="160" x2="156" y2="174" stroke="#9A3412" strokeWidth="0.8" />
                <line x1="160" y1="160" x2="160" y2="174" stroke="#9A3412" strokeWidth="0.8" />
                <line x1="164" y1="160" x2="164" y2="173" stroke="#9A3412" strokeWidth="0.8" />
                {/* Thumb wrapped underneath */}
                <path d="M 168 164 Q 170 167 168 171" stroke="#9A3412" strokeWidth="0.8" fill="none" />
              </g>
            </g>

            {/* Collar & Head with Kufi and Beard */}
            <path d="M 152 92 L 152 114 L 168 114 L 168 92 Z" fill="url(#charSkinTone)" />
            <path d="M 144 114 C 148 104, 172 104, 176 114 L 172 118 C 168 110, 152 110, 148 118 Z" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.2" />
            <path d="M 142 56 C 140 75, 145 96, 160 100 C 175 96, 180 75, 178 56 Z" fill="url(#charBeardShine)" />
            <path d="M 144 50 C 144 64, 148 76, 160 78 C 172 76, 176 64, 176 50 Z" fill="url(#charSkinTone)" />
            <path d="M 150 72 C 155 70, 165 70, 170 72 C 172 75, 166 76, 160 76 C 154 76, 148 75, 150 72 Z" fill="url(#charBeardShine)" />
            {/* Humble downcast eyes looking at the place of Sujud */}
            <path d="M 150 59 Q 154 64 157 60" stroke="#334155" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M 163 60 Q 166 64 170 59" stroke="#334155" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* Kufi */}
            <path d="M 143 51 C 143 32, 177 32, 177 51 Z" fill="url(#kufiCapDome)" stroke="#CBD5E1" strokeWidth="1.2" />
            <path d="M 143 47 Q 160 51 177 47 L 177 52 Q 160 56 143 52 Z" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />

            {/* Recitation Pill */}
            <rect x="105" y="18" width="110" height="22" rx="11" fill="#F0FDF4" stroke="#059669" strokeWidth="1.2" />
            <text x="160" y="33" fontSize="10" fontFamily="sans-serif" textAnchor="middle" fill="#065F46" fontWeight="bold">
              الْقِيَام • Al-Fatiha
            </text>
          </g>
        )}

        {/* =========================================================
            POSTURE: AR-RUKU' (Inclinaison à 90°, Dos Plat Parfait)
           ========================================================= */}
        {posture === 'ruku' && (
          <g id="character-ruku" className="animate-in fade-in duration-300">
            <ellipse cx="160" cy="385" rx="65" ry="8" fill="#0B132B" fillOpacity="0.4" />

            {/* Straight legs & feet */}
            <path d="M 98 280 L 98 390 C 98 393, 88 393, 88 390 L 92 280 Z" fill="url(#charSkinTone)" />
            <path d="M 124 280 L 124 390 C 124 393, 114 393, 114 390 L 118 280 Z" fill="url(#charSkinTone)" />

            {/* Thobe Draping Horizontally with Vertical Gravity Creases */}
            <path
              d="M 86 195 
                 C 82 225, 82 270, 88 340 
                 L 142 340 
                 C 136 290, 134 240, 142 195 
                 C 175 195, 215 195, 235 195 
                 C 235 175, 215 170, 142 170 
                 C 108 170, 90 178, 86 195 Z"
              fill="url(#thobeFabricLight)"
              stroke="#94A3B8"
              strokeWidth="1.2"
            />
            {/* Gravity vertical fabric pleats */}
            <path d="M 148 195 L 140 330" stroke="#CBD5E1" strokeWidth="1.5" />
            <path d="M 175 195 L 168 280" stroke="#CBD5E1" strokeWidth="1.5" />

            {/* 90° Straight Back Sunnah Guideline */}
            <line x1="82" y1="170" x2="258" y2="170" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="262" y="174" fontSize="8.5" fill="#D97706" fontWeight="bold">
              90° Dos Plat
            </text>

            {/* Head in alignment with spine (Sunnah: with Kufi & Black Beard) */}
            <g id="head-ruku-horizontal">
              <path d="M 235 174 L 248 174 L 248 190 L 235 190 Z" fill="url(#charSkinTone)" />
              {/* Beard pointing downward */}
              <ellipse cx="258" cy="182" rx="16" ry="14" fill="url(#charBeardShine)" />
              <path d="M 250 174 C 258 170, 270 176, 270 186 C 265 194, 252 194, 248 186 Z" fill="url(#charSkinTone)" />
              {/* Kufi on head */}
              <path d="M 248 176 C 252 165, 268 165, 271 176 Z" fill="url(#kufiCapDome)" stroke="#CBD5E1" strokeWidth="1" />
            </g>

            {/* Arms acting like pillars, gripping knees with spread fingers */}
            <g id="arms-gripping-knees">
              <path d="M 228 190 L 144 260 L 134 256 L 218 185 Z" fill="url(#thobeFabricLight)" stroke="#94A3B8" strokeWidth="1.2" />
              {/* Hands gripping kneecaps with spread fingers */}
              <path d="M 132 256 C 126 262, 126 272, 134 278 C 142 278, 144 270, 138 260 Z" fill="url(#charSkinTone)" stroke="#9A3412" strokeWidth="0.8" />
              <path d="M 128 266 L 134 268 M 128 271 L 134 272 M 130 275 L 136 275" stroke="#9A3412" strokeWidth="0.8" />
            </g>

            {/* Dhikr Badge */}
            <rect x="100" y="85" width="130" height="24" rx="12" fill="#FFFFFF" stroke="#059669" strokeWidth="1.4" />
            <text x="165" y="101" fontSize="11" fontFamily="'Amiri', serif" textAnchor="middle" fill="#065F46" fontWeight="bold">
              سُبْحَانَ رَبِّيَ الْعَظِيمِ (3x)
            </text>
          </g>
        )}

        {/* =========================================================
            POSTURE: AL-I'TIDAL (Redressement Complet)
           ========================================================= */}
        {posture === 'itidal' && (
          <g id="character-itidal" className="animate-in fade-in duration-300">
            <ellipse cx="160" cy="385" rx="42" ry="6" fill="#0B132B" fillOpacity="0.4" />

            {/* Feet */}
            <path d="M 132 365 L 126 390 C 126 393, 144 393, 144 390 L 138 365 Z" fill="url(#charSkinTone)" />
            <path d="M 188 365 L 182 390 C 182 393, 200 393, 200 390 L 194 365 Z" fill="url(#charSkinTone)" />

            {/* Thobe */}
            <path
              d="M 116 114 C 128 102, 192 102, 204 114 C 209 135, 212 185, 216 260 C 220 305, 222 355, 220 368 C 200 371, 120 371, 100 368 C 98 355, 100 305, 104 260 C 108 185, 111 135, 116 114 Z"
              fill="url(#thobeFabricLight)"
              stroke="#94A3B8"
              strokeWidth="1.2"
            />
            {/* Placket */}
            <rect x="154" y="112" width="12" height="85" rx="1" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
            <path d="M 174 136 L 194 136 L 194 156 C 194 162, 174 162, 174 156 Z" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.2" />

            {/* Arms at sides */}
            <g id="arms-itidal">
              <path d="M 116 114 C 106 135, 100 175, 102 225 L 112 225 C 110 180, 116 145, 122 118 Z" fill="url(#thobeFabricLight)" stroke="#94A3B8" strokeWidth="1.2" />
              <rect x="100" y="225" width="12" height="15" rx="2" fill="url(#charSkinTone)" />
              <path d="M 204 114 C 214 135, 220 175, 218 225 L 208 225 C 210 180, 204 145, 198 118 Z" fill="url(#thobeFabricLight)" stroke="#94A3B8" strokeWidth="1.2" />
              <rect x="208" y="225" width="12" height="15" rx="2" fill="url(#charSkinTone)" />
            </g>

            {/* Head, Collar, Kufi & Beard */}
            <path d="M 152 92 L 152 114 L 168 114 L 168 92 Z" fill="url(#charSkinTone)" />
            <path d="M 144 114 C 148 104, 172 104, 176 114 L 172 118 C 168 110, 152 110, 148 118 Z" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.2" />
            <path d="M 142 56 C 140 75, 145 96, 160 100 C 175 96, 180 75, 178 56 Z" fill="url(#charBeardShine)" />
            <path d="M 144 50 C 144 64, 148 76, 160 78 C 172 76, 176 64, 176 50 Z" fill="url(#charSkinTone)" />
            <path d="M 143 51 C 143 32, 177 32, 177 51 Z" fill="url(#kufiCapDome)" stroke="#CBD5E1" strokeWidth="1.2" />

            {/* Invocation Banner */}
            <rect x="75" y="22" width="170" height="24" rx="12" fill="#FFFFFF" stroke="#059669" strokeWidth="1.4" />
            <text x="160" y="38" fontSize="11" fontFamily="'Amiri', serif" textAnchor="middle" fill="#065F46" fontWeight="bold">
              سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ
            </text>
          </g>
        )}

        {/* =========================================================
            POSTURE: AS-SUJUD (Prosternation sur les 7 Parties du Corps)
           ========================================================= */}
        {posture === 'sujud' && (
          <g id="character-sujud" className="animate-in fade-in duration-300">
            <ellipse cx="160" cy="388" rx="95" ry="10" fill="#0B132B" fillOpacity="0.45" />

            {/* The 7 Sacred Points of Sujud highlighted with golden beacons */}
            <circle cx="242" cy="380" r="5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx="206" cy="380" r="5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx="138" cy="380" r="5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx="68" cy="378" r="5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />

            {/* Toes flexed 90° towards Qibla */}
            <path d="M 58 358 L 68 358 L 68 380 L 58 380 Z" fill="url(#charSkinTone)" />
            <ellipse cx="68" cy="380" rx="5" ry="3" fill="#C98B63" />

            {/* Lower legs */}
            <path d="M 68 368 L 138 378" stroke="url(#charSkinTone)" strokeWidth="15" strokeLinecap="round" />

            {/* Thighs rising up to hips */}
            <path d="M 138 378 L 112 280" stroke="#CBD5E1" strokeWidth="20" strokeLinecap="round" />

            {/* Thobe Body draping over arched back */}
            <path
              d="M 108 275 
                 C 135 272, 180 295, 218 348 
                 L 200 376 
                 C 162 355, 138 345, 135 378 
                 L 120 376 
                 C 102 338, 98 305, 108 275 Z"
              fill="url(#thobeFabricLight)"
              stroke="#94A3B8"
              strokeWidth="1.2"
            />

            {/* Arms in Sujud: Elbows elevated and spaced away from flanks (Sunnah) */}
            <path d="M 194 325 L 182 300 L 198 295 L 210 320 Z" fill="url(#thobeFabricLight)" stroke="#94A3B8" strokeWidth="1" />
            <path d="M 182 300 L 206 378" stroke="url(#charSkinTone)" strokeWidth="8" strokeLinecap="round" />
            <rect x="202" y="375" width="16" height="7" rx="2" fill="url(#charSkinTone)" stroke="#9A3412" strokeWidth="0.8" />

            {/* Head in Sujud: Forehead and nose pressing firmly into the carpet */}
            <circle cx="236" cy="366" r="14" fill="url(#charBeardShine)" />
            <path d="M 230 356 C 240 354, 250 362, 246 376 C 240 382, 232 380, 228 374 Z" fill="url(#charSkinTone)" />
            {/* Nose contact point */}
            <path d="M 244 374 L 246 380" stroke="#C98B63" strokeWidth="2" strokeLinecap="round" />
            {/* Kufi on crown */}
            <path d="M 225 358 C 229 350, 241 350, 245 358 Z" fill="url(#kufiCapDome)" stroke="#CBD5E1" strokeWidth="1" />

            {/* 7 Points of Sujud Badge */}
            <rect x="95" y="210" width="135" height="26" rx="13" fill="#065F46" stroke="#F59E0B" strokeWidth="1.4" />
            <text x="162" y="227" fontSize="10.5" fontFamily="sans-serif" textAnchor="middle" fill="#FFFFFF" fontWeight="bold">
              7 Points d'Appui (السجود)
            </text>
          </g>
        )}

        {/* =========================================================
            POSTURE: AL-JULUS (Assise entre les deux prosternations)
           ========================================================= */}
        {posture === 'julus' && (
          <g id="character-julus" className="animate-in fade-in duration-300">
            <ellipse cx="160" cy="388" rx="68" ry="9" fill="#0B132B" fillOpacity="0.4" />

            {/* Folded legs in Iftirash (Sitting on left foot, right foot upright) */}
            <path d="M 85 365 L 92 384 L 100 384 L 94 365 Z" fill="url(#charSkinTone)" />
            <ellipse cx="118" cy="384" rx="22" ry="6" fill="#CBD5E1" />

            {/* Seated Thobe Body */}
            <path
              d="M 128 225 
                 C 140 216, 180 216, 192 225 
                 C 196 250, 202 300, 214 365 
                 C 205 384, 95 384, 88 365 
                 C 102 300, 114 250, 128 225 Z"
              fill="url(#thobeFabricLight)"
              stroke="#94A3B8"
              strokeWidth="1.2"
            />
            {/* Placket */}
            <rect x="156" y="224" width="10" height="60" rx="1" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />

            {/* Hands resting flat on thighs above knees */}
            <rect x="130" y="286" width="18" height="9" rx="3" fill="url(#charSkinTone)" stroke="#9A3412" strokeWidth="0.7" />
            <rect x="174" y="286" width="18" height="9" rx="3" fill="url(#charSkinTone)" stroke="#9A3412" strokeWidth="0.7" />

            {/* Head with Kufi & Black Beard */}
            <path d="M 152 205 L 152 225 L 168 225 L 168 205 Z" fill="url(#charSkinTone)" />
            <path d="M 144 225 C 148 216, 172 216, 176 225 L 172 229 C 168 222, 152 222, 148 229 Z" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
            <ellipse cx="160" cy="186" rx="16" ry="19" fill="url(#charBeardShine)" />
            <path d="M 146 178 C 145 190, 149 200, 160 204 C 171 200, 175 190, 174 178 Z" fill="url(#charSkinTone)" />
            <path d="M 150 184 Q 154 188 157 185" stroke="#334155" strokeWidth="1.3" fill="none" strokeLinecap="round" />
            <path d="M 163 185 Q 166 188 170 184" stroke="#334155" strokeWidth="1.3" fill="none" strokeLinecap="round" />
            <path d="M 144 178 C 144 162, 176 162, 176 178 Z" fill="url(#kufiCapDome)" stroke="#CBD5E1" strokeWidth="1" />

            {/* Invocation Badge */}
            <rect x="85" y="110" width="150" height="24" rx="12" fill="#FFFFFF" stroke="#059669" strokeWidth="1.4" />
            <text x="160" y="126" fontSize="10.5" fontFamily="'Amiri', serif" textAnchor="middle" fill="#065F46" fontWeight="bold">
              رَبِّ اغْفِرْ لِي ، رَبِّ اغْفِرْ لِي
            </text>
          </g>
        )}

        {/* =========================================================
            POSTURE: AT-TASHAHHUD (Index Droit Pointé vers la Qibla)
           ========================================================= */}
        {posture === 'tashahhud' && (
          <g id="character-tashahhud" className="animate-in fade-in duration-300">
            <ellipse cx="160" cy="388" rx="68" ry="9" fill="#0B132B" fillOpacity="0.4" />

            {/* Seated Thobe Body */}
            <path
              d="M 128 225 C 140 216, 180 216, 192 225 C 196 250, 202 300, 214 365 C 205 384, 95 384, 88 365 C 102 300, 114 250, 128 225 Z"
              fill="url(#thobeFabricLight)"
              stroke="#94A3B8"
              strokeWidth="1.2"
            />
            {/* Left Hand Flat on knee */}
            <rect x="130" y="286" width="18" height="9" rx="3" fill="url(#charSkinTone)" stroke="#9A3412" strokeWidth="0.7" />

            {/* RIGHT HAND IN CLENCHED FIST WITH INDEX FINGER POINTING TO QIBLA (Tawhid) */}
            <g id="tashahhud-pointing-finger">
              {/* Clenched fist on thigh */}
              <circle cx="184" cy="286" r="8" fill="url(#charSkinTone)" stroke="#9A3412" strokeWidth="0.9" />
              {/* Index Finger Extended Forward and Slightly Elevated */}
              <path
                d="M 184 282 
                   L 208 273 
                   C 212 271, 213 268, 209 267 
                   C 206 266, 203 269, 184 278 Z"
                fill="url(#charSkinTone)"
                stroke="#9A3412"
                strokeWidth="0.9"
              />
              {/* Golden Tawhid Beam */}
              <circle cx="212" cy="269" r="4" fill="#F59E0B" />
              <line x1="214" y1="268" x2="242" y2="256" stroke="#F59E0B" strokeWidth="1.6" strokeDasharray="3 2" />
              <text x="246" y="260" fontSize="10" fill="#D97706" fontWeight="bold">
                التَّوْحِيد
              </text>
            </g>

            {/* Head focused on the pointing finger */}
            <ellipse cx="160" cy="186" rx="16" ry="19" fill="url(#charBeardShine)" />
            <path d="M 146 178 C 145 190, 149 200, 160 204 C 171 200, 175 190, 174 178 Z" fill="url(#charSkinTone)" />
            {/* Eyes looking down towards the index finger */}
            <path d="M 152 186 L 156 189" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 163 186 L 167 189" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 144 178 C 144 162, 176 162, 176 178 Z" fill="url(#kufiCapDome)" stroke="#CBD5E1" strokeWidth="1" />
          </g>
        )}

        {/* =========================================================
            POSTURE: AT-TASLIM (Salutation Finale vers la Droite)
           ========================================================= */}
        {posture === 'taslim' && (
          <g id="character-taslim" className="animate-in fade-in duration-300">
            <ellipse cx="160" cy="388" rx="68" ry="9" fill="#0B132B" fillOpacity="0.4" />

            {/* Turning Head Motion Indicator Arc */}
            <path
              d="M 165 160 C 182 160, 200 168, 208 178 M 208 172 L 208 178 L 202 178"
              stroke="#10B981"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />

            {/* Seated Thobe Body */}
            <path
              d="M 128 225 C 140 216, 180 216, 192 225 C 196 250, 202 300, 214 365 C 205 384, 95 384, 88 365 C 102 300, 114 250, 128 225 Z"
              fill="url(#thobeFabricLight)"
              stroke="#94A3B8"
              strokeWidth="1.2"
            />
            <rect x="130" y="286" width="18" height="9" rx="3" fill="url(#charSkinTone)" stroke="#9A3412" strokeWidth="0.7" />
            <rect x="174" y="286" width="18" height="9" rx="3" fill="url(#charSkinTone)" stroke="#9A3412" strokeWidth="0.7" />

            {/* REALISTIC HEAD TURNED TO RIGHT SHOULDER (Profile of Beard & Kufi) */}
            <g id="turned-head-profile">
              <path d="M 156 208 L 160 225 L 174 225 L 170 208 Z" fill="url(#charSkinTone)" />
              {/* Back of Head & Hair */}
              <ellipse cx="166" cy="188" rx="15" ry="18" fill="url(#charBeardShine)" />
              {/* Profile Face pointing right */}
              <path
                d="M 166 176 
                   C 176 176, 188 180, 192 188 
                   L 198 190 L 192 194 
                   C 190 202, 184 208, 174 210 
                   C 166 206, 162 196, 166 176 Z"
                fill="url(#charSkinTone)"
              />
              {/* Profile Beard wrapping jaw */}
              <path d="M 182 198 C 190 200, 188 210, 176 211 Z" fill="url(#charBeardShine)" />
              {/* Profile Kufi */}
              <path d="M 158 178 C 163 166, 182 166, 187 178 Z" fill="url(#kufiCapDome)" stroke="#CBD5E1" strokeWidth="1" />
            </g>

            {/* Peace Greeting Banner */}
            <rect x="150" y="90" width="155" height="26" rx="13" fill="#065F46" stroke="#10B981" strokeWidth="1.4" />
            <text x="227" y="107" fontSize="10" fontFamily="'Amiri', serif" textAnchor="middle" fill="#FFFFFF" fontWeight="bold">
              السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ
            </text>
          </g>
        )}
      </svg>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
