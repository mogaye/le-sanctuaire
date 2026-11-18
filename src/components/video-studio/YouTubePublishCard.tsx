import React, { useMemo, useState } from 'react';
import { Check, Copy, Youtube } from 'lucide-react';
import {
  ContinuousTimeline,
  YouTubeSurahSummaryItem,
  generateYouTubePublishPack,
} from '../../utils/mobileVideoStudioUtils';

interface YouTubePublishCardProps {
  surahName: string;
  surahArabicName?: string;
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  totalAyahsInSurah: number;
  selectedSurahs?: YouTubeSurahSummaryItem[];
  reciterName: string;
  timeline: ContinuousTimeline;
}

export const YouTubePublishCard: React.FC<YouTubePublishCardProps> = ({
  surahName,
  surahArabicName,
  surahNumber,
  startAyah,
  endAyah,
  totalAyahsInSurah,
  selectedSurahs,
  reciterName,
  timeline,
}) => {
  const [copiedField, setCopiedField] = useState<'title' | 'desc' | null>(null);

  const pack = useMemo(
    () =>
      generateYouTubePublishPack({
        surahName,
        surahArabicName,
        surahNumber,
        startAyah,
        endAyah,
        totalAyahsInSurah,
        selectedSurahs,
        reciterName,
        timeline,
      }),
    [
      surahName,
      surahArabicName,
      surahNumber,
      startAyah,
      endAyah,
      totalAyahsInSurah,
      selectedSurahs,
      reciterName,
      timeline,
    ]
  );

  const copyText = async (field: 'title' | 'desc', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // ignore clipboard restrictions
    }
  };

  const verseCount = timeline.segments.filter((s) => !s.isBismillah).length;

  return (
    <div
      data-testid="youtube-publish-pack-card"
      className="w-full max-w-2xl mx-auto rounded-2xl bg-[#0B120F] border border-white/[0.1] p-4 sm:p-5 text-left space-y-4"
    >
      <div className="flex items-center gap-3 border-b border-white/[0.08] pb-3">
        <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-400/25 text-rose-400 flex items-center justify-center shrink-0">
          <Youtube className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-[13px] font-bold text-white">
            Publication YouTube · Titre &amp; Chapitres
          </h3>
          <p className="text-xs text-neutral-400 truncate">
            Chapitres horodatés générés automatiquement pour votre vidéo
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-neutral-300">Titre suggéré</span>
          <button
            type="button"
            data-testid="copy-yt-title-btn"
            onClick={() => copyText('title', pack.title)}
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-amber-400 hover:text-neutral-950 text-xs font-semibold text-neutral-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            {copiedField === 'title' ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copié</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copier le titre</span>
              </>
            )}
          </button>
        </div>
        <div className="p-3 rounded-xl bg-black/45 border border-white/[0.08] text-xs font-medium text-amber-200 select-all leading-relaxed">
          {pack.title}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-neutral-300 tabular-nums">
            Description &amp; Chapitres ({verseCount} versets)
          </span>
          <button
            type="button"
            data-testid="copy-yt-desc-btn"
            onClick={() => copyText('desc', pack.description)}
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-amber-400 hover:text-neutral-950 text-xs font-semibold text-neutral-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            {copiedField === 'desc' ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copié</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copier chapitres</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-3 rounded-xl bg-black/45 border border-white/[0.08] text-xs text-neutral-300 font-mono max-h-40 overflow-y-auto whitespace-pre-wrap select-all tabular-nums leading-relaxed">
          {pack.description}
        </pre>
      </div>
    </div>
  );
};
