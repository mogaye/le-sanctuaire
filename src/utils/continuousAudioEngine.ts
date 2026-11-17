import { CompleteSurahItem } from '../data/quranSurahs';
import { cleanAyahArabic } from './tajweedColorizer';
import { StudioAyahItem } from './mobileVideoStudioUtils';

export interface LoadedStudioSurah {
  num: number;
  name: string;
  arName: string;
  frName: string;
  ayahs: StudioAyahItem[];
}

export interface DecodedVerseBuffer {
  ayahNum: number;
  buffer: AudioBuffer | null;
  trimStartSec: number;
  effectiveDurationSec: number;
}

export async function fetchSurahVersesForStudio(
  surahMeta: CompleteSurahItem
): Promise<LoadedStudioSurah> {
  const num = surahMeta.number;
  const cacheKey = `quran_surah_full_v4_${num}`;

  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && Array.isArray(parsed.ayahs) && parsed.ayahs.length > 0) {
        return {
          num,
          name: surahMeta.name,
          arName: parsed.arName || `سُورَةُ ${surahMeta.arabicName}`,
          frName: surahMeta.frenchTranslation,
          ayahs: parsed.ayahs.map((a: any) => ({
            num: a.num,
            globalNum: a.globalNum,
            ar: cleanAyahArabic(a.ar || ''),
            tr: a.tr || '',
            fr: a.fr || '',
          })),
        };
      }
    }
  } catch {
    // ignore cache errors
  }

  try {
    const localRes = await fetch(`/data/surahs/${num}.json`);
    if (localRes.ok) {
      const localData = await localRes.json();
      if (localData && Array.isArray(localData.ayahs) && localData.ayahs.length > 0) {
        const ayahs: StudioAyahItem[] = localData.ayahs.map((a: any) => ({
          num: a.num,
          globalNum: a.globalNum,
          ar: cleanAyahArabic(a.ar || ''),
          tr: a.tr || '',
          fr: a.fr || '',
        }));
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ ...localData, ayahs }));
        } catch {}
        return {
          num,
          name: surahMeta.name,
          arName: localData.arName || `سُورَةُ ${surahMeta.arabicName}`,
          frName: surahMeta.frenchTranslation,
          ayahs,
        };
      }
    }
  } catch {
    // fallback to API
  }

  try {
    const apiRes = await fetch(
      `https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,fr.hamidullah,en.transliteration,en.sahih`
    );
    if (apiRes.ok) {
      const apiJson = await apiRes.json();
      if (apiJson.code === 200 && Array.isArray(apiJson.data)) {
        const arSurah = apiJson.data[0];
        const frSurah = apiJson.data[1];
        const trSurah = apiJson.data[2];
        const arAyahs = arSurah?.ayahs || [];
        const frAyahs = frSurah?.ayahs || [];
        const trAyahs = trSurah?.ayahs || [];

        const ayahs: StudioAyahItem[] = arAyahs.map((item: any, idx: number) => ({
          num: item.numberInSurah || idx + 1,
          globalNum: item.number,
          ar: cleanAyahArabic(item.text || ''),
          tr: trAyahs[idx]?.text || '',
          fr: frAyahs[idx]?.text || '',
        }));

        const payload = {
          num,
          name: surahMeta.name,
          arName: arSurah?.name || `سُورَةُ ${surahMeta.arabicName}`,
          frName: surahMeta.frenchTranslation,
          rev: surahMeta.revelationType,
          totalAyahs: surahMeta.numberOfAyahs,
          ayahs,
        };
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(payload));
        } catch {}
        return {
          num,
          name: surahMeta.name,
          arName: payload.arName,
          frName: surahMeta.frenchTranslation,
          ayahs,
        };
      }
    }
  } catch {
    // fallback
  }

  // Fallback synthetic sample so studio never breaks offline
  const count = Math.min(surahMeta.numberOfAyahs || 7, 10);
  const ayahs: StudioAyahItem[] = Array.from({ length: count }, (_, idx) => ({
    num: idx + 1,
    ar:
      idx === 0 && surahMeta.openingAyahArabic
        ? cleanAyahArabic(surahMeta.openingAyahArabic)
        : 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    tr: idx === 0 ? 'Bismillaahir Rahmaanir Raheem' : `Ayah ${idx + 1}`,
    fr:
      idx === 0 && surahMeta.openingAyahFrench
        ? surahMeta.openingAyahFrench
        : `${surahMeta.frenchTranslation} — Verset ${idx + 1}`,
  }));

  return {
    num,
    name: surahMeta.name,
    arName: `سُورَةُ ${surahMeta.arabicName}`,
    frName: surahMeta.frenchTranslation,
    ayahs,
  };
}

/**
 * Finds leading and trailing silence bounds so consecutive recitations concatenate
 * smoothly without jarring pauses ("un verset, un verset, un verset").
 */
export function computeAudioTrimBounds(buffer: AudioBuffer): {
  trimStartSec: number;
  effectiveDurationSec: number;
} {
  const sr = buffer.sampleRate || 44100;
  const channel = buffer.getChannelData(0);
  const threshold = 0.0045;
  const maxTrimSamples = Math.floor(sr * 0.35);

  let startSample = 0;
  while (
    startSample < Math.min(channel.length - 1, maxTrimSamples) &&
    Math.abs(channel[startSample]) < threshold
  ) {
    startSample++;
  }
  startSample = Math.max(0, startSample - Math.floor(sr * 0.02));

  let endSample = channel.length - 1;
  const minEndSample = Math.max(startSample + Math.floor(sr * 0.4), channel.length - maxTrimSamples);
  while (endSample > minEndSample && Math.abs(channel[endSample]) < threshold) {
    endSample--;
  }
  endSample = Math.min(channel.length, endSample + Math.floor(sr * 0.05));

  const trimStartSec = startSample / sr;
  const effectiveDurationSec = Math.max(0.5, (endSample - startSample) / sr);
  return { trimStartSec, effectiveDurationSec };
}

export async function decodeVerseAudioSequence(
  audioCtx: AudioContext,
  surahNum: number,
  ayahs: StudioAyahItem[],
  reciterId: string,
  onProgress?: (loaded: number, total: number) => void,
  signal?: AbortSignal
): Promise<DecodedVerseBuffer[]> {
  const results: DecodedVerseBuffer[] = [];

  for (let i = 0; i < ayahs.length; i++) {
    if (signal?.aborted) break;
    const ayah = ayahs[i];
    let decoded: AudioBuffer | null = null;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);
      const onOuterAbort = () => controller.abort();
      signal?.addEventListener('abort', onOuterAbort, { once: true });

      const resp = await fetch(
        `/api/quran-audio?surah=${surahNum}&ayah=${ayah.num}&reciter=${encodeURIComponent(reciterId)}`,
        { signal: controller.signal }
      );
      clearTimeout(timer);
      signal?.removeEventListener('abort', onOuterAbort);

      if (resp.ok) {
        const arr = await resp.arrayBuffer();
        decoded = await audioCtx.decodeAudioData(arr.slice(0));
      }
    } catch {
      decoded = null;
    }

    if (decoded) {
      const { trimStartSec, effectiveDurationSec } = computeAudioTrimBounds(decoded);
      results.push({
        ayahNum: ayah.num,
        buffer: decoded,
        trimStartSec,
        effectiveDurationSec,
      });
    } else {
      results.push({
        ayahNum: ayah.num,
        buffer: null,
        trimStartSec: 0,
        effectiveDurationSec: 0,
      });
    }

    onProgress?.(i + 1, ayahs.length);
  }

  return results;
}

export interface ScheduledPlaybackHandle {
  stop: () => void;
}

/**
 * Schedules all verse audio buffers seamlessly back-to-back on the AudioContext timeline
 * with micro-crossfade overlap so there is zero audible gap between verses.
 */
export function scheduleContinuousAudioSequence(
  audioCtx: AudioContext,
  decodedBuffers: DecodedVerseBuffer[],
  segmentStartTimesSec: number[],
  segmentDurationsSec: number[],
  startOffsetSec: number,
  targetNodes: AudioNode[],
  paceMultiplier: number = 1
): ScheduledPlaybackHandle {
  const sources: AudioBufferSourceNode[] = [];
  const baseAudioTime = audioCtx.currentTime + 0.04;
  const crossfadeSec = 0.03;
  const safeRate = Math.max(0.5, Math.min(2.0, paceMultiplier || 1));

  for (let i = 0; i < decodedBuffers.length; i++) {
    const item = decodedBuffers[i];
    if (!item?.buffer) continue;

    const segStart = segmentStartTimesSec[i] ?? 0;
    const segDur = segmentDurationsSec[i] ?? item.effectiveDurationSec / safeRate;
    const segEnd = segStart + segDur;

    if (segEnd <= startOffsetSec) {
      continue;
    }

    const offsetIntoSeg = Math.max(0, startOffsetSec - segStart);
    const delaySec = Math.max(0, segStart - startOffsetSec);
    const playDurationTimeline = Math.max(0.05, segDur - offsetIntoSeg);

    const src = audioCtx.createBufferSource();
    src.buffer = item.buffer;
    src.playbackRate.value = safeRate;

    const gain = audioCtx.createGain();
    const whenStart = baseAudioTime + delaySec;
    const whenEnd = whenStart + playDurationTimeline;

    gain.gain.setValueAtTime(0.0001, whenStart);
    gain.gain.linearRampToValueAtTime(1.0, Math.min(whenEnd, whenStart + crossfadeSec));
    if (playDurationTimeline > crossfadeSec * 2) {
      gain.gain.setValueAtTime(1.0, Math.max(whenStart + crossfadeSec, whenEnd - crossfadeSec));
    }
    gain.gain.linearRampToValueAtTime(0.0001, whenEnd);

    src.connect(gain);
    for (const dest of targetNodes) {
      gain.connect(dest);
    }

    const bufOffset = item.trimStartSec + offsetIntoSeg * safeRate;
    const maxReadable = Math.max(0.02, item.buffer.duration - bufOffset);
    const playBufferSeconds = Math.min(maxReadable, playDurationTimeline * safeRate + 0.02);

    try {
      src.start(whenStart, bufOffset, playBufferSeconds);
      sources.push(src);
    } catch {
      // ignore scheduling edge errors
    }
  }

  return {
    stop: () => {
      for (const s of sources) {
        try {
          s.stop();
          s.disconnect();
        } catch {}
      }
    },
  };
}
