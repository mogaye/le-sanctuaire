import React, { useState, useMemo, useEffect } from 'react';
import {
  MapPin,
  Search,
  X,
  Check,
  Globe2,
  Clock,
  Compass,
  Sparkles,
} from 'lucide-react';
import { CityData } from '../types';
import { CITIES, WORLD_REGIONS, WorldRegion } from '../data/islamicData';
import { getCityCurrentDate } from '../utils/timeUtils';

interface CitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: CityData;
  onSelectCity: (city: CityData) => void;
  cities?: CityData[];
}

export const CitySelectorModal: React.FC<CitySelectorModalProps> = ({
  isOpen,
  onClose,
  selectedCity,
  onSelectCity,
  cities = CITIES,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<WorldRegion>('Tous');

  // Reset search when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedRegion('Tous');
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Filter cities by search query and region
  const filteredCities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return cities.filter((city) => {
      // Region check
      if (selectedRegion !== 'Tous' && city.region !== selectedRegion) {
        return false;
      }
      if (!q) return true;

      const matchesName = city.name.toLowerCase().includes(q);
      const matchesCountry = city.country.toLowerCase().includes(q);
      const matchesTz = (city.timezone || '').toLowerCase().includes(q);
      const matchesUtc = (city.utcOffset || '').toLowerCase().includes(q);
      const matchesRegion = (city.region || '').toLowerCase().includes(q);

      return (
        matchesName ||
        matchesCountry ||
        matchesTz ||
        matchesUtc ||
        matchesRegion
      );
    });
  }, [cities, searchQuery, selectedRegion]);

  // Helper to format live time in a city's timezone
  const getCityLiveTime = (timezone?: string): string => {
    try {
      const date = getCityCurrentDate(timezone);
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return '--:--';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-[#193226] rounded-3xl shadow-2xl border border-[#D5E2D9] dark:border-emerald-500/25 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in zoom-in-95 duration-200 transition-colors"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-emerald-800/40 bg-[#F7FAF8] dark:bg-[#14281E] flex items-center justify-between shrink-0 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-2xs">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-extrabold text-[#112A1B] dark:text-white">
                  Villes du Monde & Fuseaux Horaires
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  {cities.length}
                </span>
              </div>
              <p className="text-xs text-[#526B5C] dark:text-neutral-400">
                Toutes les villes avec leurs vrais fuseaux horaires et horaires de prière
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 rounded-full bg-white dark:bg-[#193226] hover:bg-neutral-100 dark:hover:bg-[#102018] border border-neutral-200 dark:border-emerald-500/20 flex items-center justify-center text-neutral-500 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 pb-2 border-b border-neutral-100 dark:border-emerald-800/40 shrink-0 space-y-3 bg-white dark:bg-[#193226] transition-colors">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une ville, un pays, fuseau (ex: Dakar, Tokyo, UTC+3)..."
              autoFocus
              className="w-full pl-9 pr-9 py-2.5 rounded-2xl bg-neutral-50 dark:bg-[#14281E] hover:bg-neutral-100/70 dark:hover:bg-[#102018] focus:bg-white dark:focus:bg-[#102018] border border-neutral-200 dark:border-emerald-500/20 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm text-neutral-800 dark:text-white placeholder:text-neutral-400 outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
            {WORLD_REGIONS.map((region) => {
              const isActive = selectedRegion === region;
              return (
                <button
                  key={region}
                  type="button"
                  onClick={() => setSelectedRegion(region)}
                  className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition cursor-pointer text-xs ${
                    isActive
                      ? 'bg-emerald-800 dark:bg-emerald-700 text-white shadow-2xs'
                      : 'bg-neutral-100 dark:bg-[#14281E] hover:bg-neutral-200/80 dark:hover:bg-[#102018] text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {region}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Selected City Preview Pill */}
        <div className="px-4 py-2 bg-[#EBF3ED]/70 dark:bg-[#14281E] border-b border-[#D5E2D9] dark:border-emerald-800/40 flex items-center justify-between text-xs shrink-0 transition-colors">
          <div className="flex items-center gap-2 text-[#183524] dark:text-neutral-200 font-medium truncate">
            <MapPin className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="truncate">
              Actuellement sélectionnée :{' '}
              <strong className="font-bold">{selectedCity.name}</strong>,{' '}
              {selectedCity.country}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#193226] border border-[#CFDFD4] dark:border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-300">
              {selectedCity.utcOffset || 'UTC'}
            </span>
            <span className="text-[11px] font-mono font-bold text-[#183524] dark:text-emerald-300 hidden sm:inline">
              {getCityLiveTime(selectedCity.timezone)}
            </span>
          </div>
        </div>

        {/* Cities List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5 divide-y divide-neutral-50 dark:divide-emerald-950/40">
          {filteredCities.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-[#14281E] flex items-center justify-center mx-auto text-neutral-400">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-neutral-700 dark:text-neutral-200">
                Aucune ville trouvée pour "{searchQuery}"
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
                Essayez de rechercher par nom de pays (ex: Sénégal, France, Maroc, Algérie, Canada, Japon) ou effacez les filtres.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRegion('Tous');
                }}
                className="mt-2 px-4 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-full cursor-pointer transition"
              >
                Réinitialiser la recherche
              </button>
            </div>
          ) : (
            filteredCities.map((city) => {
              const isSelected = selectedCity.id === city.id || selectedCity.name === city.name;
              const liveTime = getCityLiveTime(city.timezone);

              return (
                <button
                  key={`${city.id}-${city.name}`}
                  type="button"
                  onClick={() => {
                    onSelectCity(city);
                    onClose();
                  }}
                  className={`w-full text-left p-3 rounded-2xl flex items-center justify-between gap-3 transition cursor-pointer group ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-500/40 shadow-2xs'
                      : 'hover:bg-[#F4F8F5] dark:hover:bg-[#14281E] border border-transparent text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition ${
                        isSelected
                          ? 'bg-emerald-700 text-white'
                          : 'bg-neutral-100 dark:bg-[#14281E] text-neutral-500 dark:text-neutral-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950 group-hover:text-emerald-800 dark:group-hover:text-emerald-300'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-emerald-900 dark:group-hover:text-emerald-300 truncate">
                          {city.name}
                        </span>
                        {city.utcOffset && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                              isSelected
                                ? 'bg-emerald-200/70 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200'
                                : 'bg-neutral-100 dark:bg-[#14281E] text-neutral-600 dark:text-neutral-400'
                            }`}
                          >
                            {city.utcOffset}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5 truncate">
                        <span>{city.country}</span>
                        {city.region && (
                          <>
                            <span>•</span>
                            <span className="text-[10px] text-neutral-400">
                              {city.region}
                            </span>
                          </>
                        )}
                        {city.qiblaAngle !== undefined && (
                          <>
                            <span>•</span>
                            <span className="text-[10px] text-neutral-400 flex items-center gap-0.5">
                              <Compass className="w-2.5 h-2.5" />
                              {city.qiblaAngle}°
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Live Time & Selected status */}
                  <div className="flex items-center gap-2.5 shrink-0 text-right">
                    <div className="hidden sm:block">
                      <div className="text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        {liveTime}
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate max-w-[120px]">
                        {city.timezone}
                      </div>
                    </div>
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-neutral-200 dark:border-neutral-700 group-hover:border-emerald-300 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition">
                        <Check className="w-3 h-3 text-emerald-600" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-50 dark:bg-[#14281E] border-t border-neutral-100 dark:border-emerald-800/40 text-center shrink-0 text-[11px] text-neutral-500 dark:text-neutral-400 transition-colors">
          Affichage de <strong>{filteredCities.length}</strong> ville{filteredCities.length > 1 ? 's' : ''} • Calculs astronomiques et fuseaux horaires certifiés
        </div>
      </div>
    </div>
  );
};
