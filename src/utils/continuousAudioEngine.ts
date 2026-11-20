import { CompleteSurahItem } from '../data/quranSurahs';
import { cleanAyahArabic } from './tajweedColorizer';
import { StudioAyahItem, buildSurahPlaceholderAyahs } from './mobileVideoStudioUtils';
import { getAyahAudioUrl } from './quranAudioUtils';

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

const surahMemoryCache = new Map<number, LoadedStudioSurah>();
const surahInflightFetches = new Map<number, Promise<LoadedStudioSurah>>();

async function fetchJsonWithTimeout(url: string, timeoutMs = 10000): Promise<any | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('json') && !ct.includes('text/plain')) {
      return null;
    }
    const raw = await res.text();
    if (!raw || raw.trim().startsWith('<')) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchSurahVersesForStudio(
  surahMeta: CompleteSurahItem
): Promise<LoadedStudioSurah> {
  const num = surahMeta.number;

  const memCached = surahMemoryCache.get(num);
  if (memCached && memCached.ayahs.length >= (surahMeta.numberOfAyahs || 1)) {
    return memCached;
  }

  const inflight = surahInflightFetches.get(num);
  if (inflight) {
    return inflight;
  }

  const run = (async (): Promise<LoadedStudioSurah> => {
    const cacheKey = `quran_surah_full_v4_${num}`;

    try {
      const cached = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(cacheKey) : null;
      if (cached) {
        const parsed = JSON.parse(cached);
        if (
          parsed &&
          Array.isArray(parsed.ayahs) &&
          parsed.ayahs.length >= Math.min(1, surahMeta.numberOfAyahs || 1)
        ) {
          const loaded: LoadedStudioSurah = {
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
          surahMemoryCache.set(num, loaded);
          return loaded;
        }
      }
    } catch {
      // ignore storage errors
    }

    // Primary combined edition fetch (with 1 retry on transient rate-limit / timeout)
    const editionUrls = [
      `https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,fr.hamidullah,en.transliteration`,
      `https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,fr.hamidullah`,
    ];

    for (const url of editionUrls) {
      const apiJson = await fetchJsonWithTimeout(url, 12000);
      if (apiJson?.code === 200 && Array.isArray(apiJson.data) && apiJson.data[0]?.ayahs?.length) {
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
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(cacheKey, JSON.stringify(payload));
          }
        } catch {}

        const loaded: LoadedStudioSurah = {
          num,
          name: surahMeta.name,
          arName: payload.arName,
          frName: surahMeta.frenchTranslation,
          ayahs,
        };
        surahMemoryCache.set(num, loaded);
        return loaded;
      }
    }

    // Offline fallback: preserve FULL verse count of the Surah (never truncate to 10!)
    // and do NOT persist synthetic placeholders in sessionStorage so network recovery works later.
    return {
      num,
      name: surahMeta.name,
      arName: `سُورَةُ ${surahMeta.arabicName}`,
      frName: surahMeta.frenchTranslation,
      ayahs: buildSurahPlaceholderAyahs(surahMeta),
    };
  })();

  surahInflightFetches.set(num, run);
  try {
    return await run;
  } finally {
    surahInflightFetches.delete(num);
  }
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

async function fetchAndDecodeSingleAyah(
  audioCtx: AudioContext,
  surahNum: number,
  ayahNum: number,
  reciterId: string,
  signal?: AbortSignal
): Promise<DecodedVerseBuffer> {
  let decoded: AudioBuffer | null = null;
  const proxyUrl = `/api/quran-audio?surah=${surahNum}&ayah=${ayahNum}&reciter=${encodeURIComponent(reciterId)}`;
  // cdn.islamic.network (fr.leclerc) does not send Access-Control-Allow-Origin headers,
  // so browser fetch must rely on the same-origin proxy first and retry cleanly on transient hiccups.
  const urlsToTry =
    reciterId === 'leclerc_fr'
      ? [proxyUrl, proxyUrl, proxyUrl]
      : [proxyUrl, getAyahAudioUrl(surahNum, ayahNum, reciterId)];

  // Up to 2 passes across fallback URLs for resilience on long full-surah exports
  for (let attempt = 0; attempt < 2 && !decoded; attempt++) {
    for (const url of urlsToTry) {
      if (signal?.aborted || decoded) break;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 14000);
      const onOuterAbort = () => controller.abort();
      signal?.addEventListener('abort', onOuterAbort, { once: true });

      try {
        const resp = await fetch(url, { signal: controller.signal });
        if (resp.ok) {
          const arr = await resp.arrayBuffer();
          if (arr.byteLength > 256) {
            decoded = await audioCtx.decodeAudioData(arr.slice(0));
          }
        }
      } catch {
        decoded = null;
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onOuterAbort);
      }
    }
  }

  if (decoded) {
    const { trimStartSec, effectiveDurationSec } = computeAudioTrimBounds(decoded);
    return {
      ayahNum,
      buffer: decoded,
      trimStartSec,
      effectiveDurationSec,
    };
  }

  return {
    ayahNum,
    buffer: null,
    trimStartSec: 0,
    effectiveDurationSec: 0,
  };
}

export async function decodeVerseAudioSequence(
  audioCtx: AudioContext,
  surahNum: number,
  ayahs: StudioAyahItem[],
  reciterId: string,
  onProgress?: (loaded: number, total: number) => void,
  signal?: AbortSignal
): Promise<DecodedVerseBuffer[]> {
  if (ayahs.length === 0) return [];

  const results: DecodedVerseBuffer[] = new Array(ayahs.length);
  const concurrency = Math.min(4, ayahs.length);
  let nextIndex = 0;
  let completed = 0;

  const runWorker = async () => {
    while (true) {
      if (signal?.aborted) return;
      const idx = nextIndex++;
      if (idx >= ayahs.length) return;
      const ayah = ayahs[idx];
      results[idx] = await fetchAndDecodeSingleAyah(
        audioCtx,
        ayah.audioSurahNum ?? surahNum,
        ayah.audioAyahNum ?? ayah.num,
        reciterId,
        signal
      );
      completed++;
      onProgress?.(completed, ayahs.length);
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => runWorker()));

  for (let i = 0; i < ayahs.length; i++) {
    if (!results[i]) {
      results[i] = {
        ayahNum: ayahs[i].num,
        buffer: null,
        trimStartSec: 0,
        effectiveDurationSec: 0,
      };
    }
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
  audioCtx: BaseAudioContext,
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

/**
 * Keeps the WebAudio MediaStreamAudioDestinationNode actively pulling continuous samples
 * across Chromium/Android/Safari during MediaRecorder export.
 */
export function attachAudioStreamKeepalive(
  audioCtx: AudioContext,
  destNode: MediaStreamAudioDestinationNode,
  monitorToSpeakers: boolean = false
): {
  feedNode: GainNode;
  setMonitorEnabled: (enabled: boolean) => void;
  dispose: () => void;
} {
  const feedNode = audioCtx.createGain();
  feedNode.gain.value = 1.0;

  // Wire recitation bus to recorded stream destination
  feedNode.connect(destNode);

  // Wire monitor gain to hardware destination so browser never suspends pulling audio frames
  const monitorGain = audioCtx.createGain();
  monitorGain.gain.value = monitorToSpeakers ? 1.0 : 0.0;
  feedNode.connect(monitorGain);
  monitorGain.connect(audioCtx.destination);

  // Sub-audible ultra-low carrier (-96dB) ensures MediaRecorder always receives live audio frames from t=0
  const carrier = audioCtx.createOscillator();
  const carrierGain = audioCtx.createGain();
  carrier.frequency.value = 1;
  carrierGain.gain.value = 0.00002;
  carrier.connect(carrierGain);
  carrierGain.connect(destNode);
  try {
    carrier.start();
  } catch {}

  return {
    feedNode,
    setMonitorEnabled: (enabled: boolean) => {
      try {
        monitorGain.gain.setTargetAtTime(enabled ? 1.0 : 0.0, audioCtx.currentTime, 0.02);
      } catch {
        monitorGain.gain.value = enabled ? 1.0 : 0.0;
      }
    },
    dispose: () => {
      try {
        carrier.stop();
        carrier.disconnect();
        carrierGain.disconnect();
        monitorGain.disconnect();
        feedNode.disconnect();
      } catch {}
    },
  };
}

