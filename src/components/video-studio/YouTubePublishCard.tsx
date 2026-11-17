import React, { useMemo, useState } from 'react';
import { Check, Copy, Youtube } from 'lucide-react';
import {
  ContinuousTimeline,
  generateYouTubePublishPack,
} from '../../utils/mobileVideoStudioUtils';

interface YouTubePublishCardProps {
  surahName: string;
  surahArabicName?: string;
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  totalAyahsInSurah: number;
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

  return (
    <div
      data-testid="youtube-publish-pack-card"
      className="w-full max-w-2xl mx-auto rounded-2xl bg-[#0E1512] border border-white/15 p-4 text-left space-y-3"
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-400/30 text-rose-400 flex items-center justify-center shrink-0">
            <Youtube className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-white">
              Pack Publication YouTube (Titre &amp; Chapitres)
            </h3>
            <p className="text-[11px] text-neutral-400">
              Copiez directement le titre optimisé et les chapitres horodatés pour YouTube
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-neutral-300">Titre suggéré</span>
          <button
            type="button"
            data-testid="copy-yt-title-btn"
            onClick={() => copyText('title', pack.title)}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-amber-400 hover:text-neutral-950 text-[11px] font-bold text-neutral-200 inline-flex items-center gap-1 cursor-pointer transition whitespace-nowrap"
          >
            {copiedField === 'title' ? (
              <>
                <Check className="w-3 h-3" />
                <span>Copié</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copier le titre</span>
              </>
            )}
          </button>
        </div>
        <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs font-semibold text-amber-200 select-all">
          {pack.title}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-neutral-300">
            Description &amp; Chapitres ({timeline.segments.length} versets)
          </span>
          <button
            type="button"
            data-testid="copy-yt-desc-btn"
            onClick={() => copyText('desc', pack.description)}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-amber-400 hover:text-neutral-950 text-[11px] font-bold text-neutral-200 inline-flex items-center gap-1 cursor-pointer transition whitespace-nowrap"
          >
            {copiedField === 'desc' ? (
              <>
                <Check className="w-3 h-3" />
                <span>Copié</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copier chapitres</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-[11px] text-neutral-300 font-mono max-h-36 overflow-y-auto whitespace-pre-wrap select-all">
          {pack.description}
        </pre>
      </div>
    </div>
  );
};
