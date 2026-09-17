import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Sun, Moon, Sparkles } from 'lucide-react';

interface FloatingThemeButtonProps {
  isDarkMode: boolean;
  onToggle: () => void;
}

export const FloatingThemeButton: React.FC<FloatingThemeButtonProps> = ({
  isDarkMode,
  onToggle,
}) => {
  const isDraggingRef = useRef(false);

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      onDragStart={() => {
        isDraggingRef.current = true;
      }}
      onDragEnd={() => {
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 200);
      }}
      whileDrag={{ scale: 1.05, cursor: 'grabbing', zIndex: 60 }}
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 10 }}
      transition={{ duration: 0.3 }}
      className="fixed z-50 bottom-[72px] right-2 sm:bottom-6 sm:right-6 cursor-grab select-none touch-none group"
    >
      <div className="relative flex items-center">
        {/* Bulle info dépliante au survol (hover sur grand écran) */}
        <div className="hidden sm:block absolute right-full mr-2.5 pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto translate-x-1.5 group-hover:translate-x-0 transition-all duration-300 ease-out whitespace-nowrap z-50">
          <div className="bg-[#0B1E13]/95 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-amber-400/30 shadow-[0_6px_20px_rgba(0,0,0,0.35)] flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-amber-400' : 'bg-sky-400'} animate-ping`} />
            <div>
              <p className="text-[11px] font-bold text-amber-200">
                {isDarkMode ? 'Passer en Mode Clair' : 'Passer en Mode Sombre'}
              </p>
              <p className="text-[9px] text-emerald-100/70">Appuyez pour basculer le thème</p>
            </div>
            <div className="text-[9px] bg-amber-400/20 text-amber-300 px-1 py-0.5 rounded font-mono">
              Glisser ↔
            </div>
          </div>
        </div>

        {/* Bouton d'icône principal */}
        <motion.button
          id="btn-floating-theme-toggle"
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={(e) => {
            if (isDraggingRef.current) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            onToggle();
          }}
          className={`relative w-8 h-8 sm:w-11 sm:h-11 rounded-full p-[1px] sm:p-[1.5px] transition-transform flex items-center justify-center cursor-pointer select-none opacity-90 hover:opacity-100 sm:opacity-100 ${
            isDarkMode
              ? 'bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-500 shadow-md sm:shadow-[0_4px_16px_rgba(245,158,11,0.45),0_0_0_1px_rgba(255,255,255,0.25)] hover:shadow-[0_6px_22px_rgba(245,158,11,0.6)]'
              : 'bg-gradient-to-br from-indigo-400 via-sky-500 to-emerald-600 shadow-md sm:shadow-[0_4px_16px_rgba(56,189,248,0.45),0_0_0_1px_rgba(255,255,255,0.25)] hover:shadow-[0_6px_22px_rgba(56,189,248,0.6)]'
          } hover:scale-105 active:scale-95`}
          title={isDarkMode ? 'Passer en Mode Clair' : 'Passer en Mode Sombre'}
          aria-label={isDarkMode ? 'Passer en Mode Clair' : 'Passer en Mode Sombre'}
        >
          {/* Pulsation lumineuse subtile */}
          <span
            className={`hidden sm:block absolute inset-0 rounded-full animate-ping pointer-events-none opacity-25 ${
              isDarkMode ? 'bg-amber-300/40' : 'bg-sky-300/40'
            }`}
          />

          {/* Disque intérieur avec dégradé sombre sanctuaire */}
          <div className="w-full h-full rounded-full bg-gradient-to-br from-[#122E1F] via-[#091B11] to-[#041009] flex items-center justify-center border border-amber-400/40">
            {isDarkMode ? (
              <Sun className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-amber-300 fill-amber-400/25 stroke-[1.8] group-hover:scale-110 group-hover:text-amber-200 transition-transform animate-[spin_16s_linear_infinite]" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-sky-200 fill-sky-300/25 stroke-[1.8] group-hover:scale-110 group-hover:text-white transition-transform" />
            )}
          </div>

          {/* Badge miniature supérieur droit */}
          <span
            className={`absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full text-[7px] sm:text-[8px] font-black flex items-center justify-center shadow-xs border border-white ${
              isDarkMode
                ? 'bg-gradient-to-r from-amber-300 to-yellow-400 text-[#0E1E14]'
                : 'bg-gradient-to-r from-sky-300 to-indigo-300 text-[#07131F]'
            }`}
          >
            <Sparkles className="w-1.5 h-1.5 sm:w-2 sm:h-2" />
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
};
