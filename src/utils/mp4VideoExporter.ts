import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import {
  ContinuousTimeline,
  StudioAyahItem,
  getResolutionFallbackTiers,
  selectPreferredVideoMimeType,
} from './mobileVideoStudioUtils';
import {
  DecodedVerseBuffer,
  attachAudioStreamKeepalive,
  scheduleContinuousAudioSequence,
} from './continuousAudioEngine';
import {
  PrecomputedCanvasLayout,
  VideoCanvasRenderOptions,
  precomputeVideoCanvasLayout,
  renderVideoCanvasFrame,
} from './canvasVideoRenderer';

export interface Mp4ExportParams {
  canvas: HTMLCanvasElement;
  canvasCtx: CanvasRenderingContext2D;
  layout: PrecomputedCanvasLayout;
  ayahs?: StudioAyahItem[];
  timeline: ContinuousTimeline;
  renderOpts: VideoCanvasRenderOptions;
  audioCtx: AudioContext;
  decodedBuffers: DecodedVerseBuffer[];
  paceMultiplier: number;
  monitorAudioDuringExport: boolean;
  abortSignal: AbortSignal;
  onProgress: (pct: number, elapsedSec: number, statusText: string) => void;
  onKeepaliveReady?: (keepalive: ReturnType<typeof attachAudioStreamKeepalive>) => void;
  onMediaRecorderReady?: (recorder: MediaRecorder) => void;
  onRecordingChunkAvailable?: () => void;
}

export interface Mp4ExportResult {
  blob: Blob;
  extension: 'mp4' | 'webm';
  mimeType: string;
}

interface ResolvedH264Candidate {
  config: VideoEncoderConfig;
  encodeWidth: number;
  encodeHeight: number;
}

function encodeAudioBufferToWavBytes(audioBuffer: AudioBuffer): Uint8Array {
  const numChannels = Math.min(2, audioBuffer.numberOfChannels || 1);
  const sampleRate = audioBuffer.sampleRate || 48000;
  const numFrames = audioBuffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeAscii = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM
  view.setUint16(20, 1, true); // Linear PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataSize, true);

  const ch0 = audioBuffer.getChannelData(0);
  const ch1 = numChannels > 1 ? audioBuffer.getChannelData(1) : ch0;

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    const s0 = Math.max(-1, Math.min(1, ch0[i] || 0));
    view.setInt16(offset, s0 < 0 ? s0 * 0x8000 : s0 * 0x7fff, true);
    offset += 2;
    if (numChannels > 1) {
      const s1 = Math.max(-1, Math.min(1, ch1[i] || 0));
      view.setInt16(offset, s1 < 0 ? s1 * 0x8000 : s1 * 0x7fff, true);
      offset += 2;
    }
  }

  return new Uint8Array(buffer);
}

async function renderTimelineOfflineAudio(
  decodedBuffers: DecodedVerseBuffer[],
  timeline: ContinuousTimeline,
  paceMultiplier: number,
  sampleRate = 48000,
  numChannels = 2
): Promise<AudioBuffer> {
  const totalSec = Math.max(1.5, timeline.totalDurationSec);
  const frameCount = Math.ceil(totalSec * sampleRate);
  const offlineCtx = new OfflineAudioContext(numChannels, frameCount, sampleRate);

  const segStarts = timeline.segments.map((s) => s.startSec);
  const segDurs = timeline.segments.map((s) => s.durationSec);

  scheduleContinuousAudioSequence(
    offlineCtx,
    decodedBuffers,
    segStarts,
    segDurs,
    0,
    [offlineCtx.destination],
    paceMultiplier
  );

  return offlineCtx.startRendering();
}

async function resolveSupportedH264Config(
  requestedWidth: number,
  requestedHeight: number,
  fps: number
): Promise<ResolvedH264Candidate | null> {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') {
    return null;
  }

  // Try crisp requested resolution first, then gracefully step down while preserving aspect ratio (16:9, 9:16, or 1:1)
  const resolutionTiers = getResolutionFallbackTiers(requestedWidth, requestedHeight);

  const codecs = [
    'avc1.4d402a', // Main Profile L4.2
    'avc1.64002a', // High Profile L4.2
    'avc1.42e02a', // Constrained Baseline L4.2
    'avc1.4d401f', // Main Profile L3.1 (universal mobile hardware)
    'avc1.42e01f', // Constrained Baseline L3.1 (universal Android/iOS)
    'avc1.42001f', // Baseline L3.1
    'avc1.42002a',
  ];

  const hwModes: HardwareAcceleration[] = ['prefer-software', 'no-preference'];

  for (const tier of resolutionTiers) {
    for (const hardwareAcceleration of hwModes) {
      for (const codec of codecs) {
        try {
          const candidate: VideoEncoderConfig = {
            codec,
            width: tier.w,
            height: tier.h,
            bitrate: tier.bitrate,
            framerate: fps,
            hardwareAcceleration,
            avc: { format: 'avc' },
          };
          const support = await VideoEncoder.isConfigSupported(candidate);
          if (support.supported) {
            return {
              config: support.config || candidate,
              encodeWidth: tier.w,
              encodeHeight: tier.h,
            };
          }
        } catch {
          // try next profile
        }
      }
    }
  }
  return null;
}

async function resolveSupportedAacConfig(
  sampleRate: number,
  numberOfChannels: number
): Promise<AudioEncoderConfig | null> {
  if (typeof AudioEncoder === 'undefined' || typeof AudioData === 'undefined') {
    return null;
  }
  for (const bitrate of [192_000, 128_000]) {
    try {
      const candidate: AudioEncoderConfig = {
        codec: 'mp4a.40.2',
        sampleRate,
        numberOfChannels,
        bitrate,
      };
      const support = await AudioEncoder.isConfigSupported(candidate);
      if (support.supported) {
        return support.config || candidate;
      }
    } catch {
      // unsupported
    }
  }
  return null;
}

async function canServerMuxMp4(abortSignal: AbortSignal): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const onOuterAbort = () => controller.abort();
    abortSignal.addEventListener('abort', onOuterAbort, { once: true });
    try {
      const res = await fetch('/api/video/health', {
        method: 'GET',
        signal: controller.signal,
      });
      if (!res.ok) return false;
      const json = await res.json().catch(() => null);
      return Boolean(json?.ffmpeg);
    } finally {
      clearTimeout(timer);
      abortSignal.removeEventListener('abort', onOuterAbort);
    }
  } catch {
    return false;
  }
}

async function muxVideoBlobWithOfflineAudio(
  videoBytes: Uint8Array,
  decodedBuffers: DecodedVerseBuffer[],
  timeline: ContinuousTimeline,
  paceMultiplier: number,
  abortSignal: AbortSignal
): Promise<Uint8Array | null> {
  const isLongVideo = timeline.totalDurationSec > 180;
  const renderedAudio = await renderTimelineOfflineAudio(
    decodedBuffers,
    timeline,
    paceMultiplier,
    isLongVideo ? 44100 : 48000,
    isLongVideo ? 1 : 2
  );
  if (abortSignal.aborted) return null;

  const wavBytes = encodeAudioBufferToWavBytes(renderedAudio);
  const packet = new Uint8Array(4 + videoBytes.byteLength + wavBytes.byteLength);
  new DataView(packet.buffer).setUint32(0, videoBytes.byteLength, false);
  packet.set(videoBytes, 4);
  packet.set(wavBytes, 4 + videoBytes.byteLength);

  const resp = await fetch('/api/video/mux-mp4', {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: packet,
    signal: abortSignal,
  });

  if (!resp.ok) {
    throw new Error(`Muxage MP4 échoué (${resp.status})`);
  }

  const outBuf = await resp.arrayBuffer();
  if (outBuf.byteLength < 1024) {
    throw new Error('Fichier MP4 généré invalide.');
  }
  return new Uint8Array(outBuf);
}

async function seekVideoToTime(videoEl: HTMLVideoElement, targetTime: number): Promise<void> {
  const duration = Number.isFinite(videoEl.duration) && videoEl.duration > 0 ? videoEl.duration : 0;
  if (duration <= 0) return;
  const wrapped = Math.max(0, Math.min(duration - 0.01, targetTime % duration));
  if (Math.abs(videoEl.currentTime - wrapped) < 0.015) return;

  await new Promise<void>((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      videoEl.removeEventListener('seeked', done);
      resolve();
    };
    const timer = setTimeout(done, 160);
    videoEl.addEventListener('seeked', done, { once: true });
    try {
      videoEl.currentTime = wrapped;
    } catch {
      done();
    }
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout: ${label}`)), ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * Tier 1: Deterministic offline WebCodecs H.264 9:16 MP4 encoding.
 * Supports:
 *   A) Client H.264 + client AAC -> pure client-side .mp4
 *   B) Client H.264 + server FFmpeg WAV->AAC -> universal H.264+AAC .mp4
 *   C) Client H.264 + client Opus (in MP4 via mp4-muxer) -> pure client-side .mp4 (Android Chrome / Vercel)
 */
async function tryWebCodecsMp4Export(params: Mp4ExportParams): Promise<Mp4ExportResult | null> {
  const fps = 30;
  const resolvedVideo = await resolveSupportedH264Config(
    params.renderOpts.width,
    params.renderOpts.height,
    fps
  );
  if (!resolvedVideo) return null;

  const { config: videoConfig, encodeWidth, encodeHeight } = resolvedVideo;

  // Adapt canvas and precomputed layout cleanly if device hardware capped at 720x1280
  let effectiveRenderOpts = params.renderOpts;
  let effectiveLayout = params.layout;
  if (encodeWidth !== params.renderOpts.width || encodeHeight !== params.renderOpts.height) {
    params.canvas.width = encodeWidth;
    params.canvas.height = encodeHeight;
    effectiveRenderOpts = {
      ...params.renderOpts,
      width: encodeWidth,
      height: encodeHeight,
    };
    if (params.ayahs && params.ayahs.length > 0) {
      effectiveLayout = precomputeVideoCanvasLayout(
        params.canvasCtx,
        params.ayahs,
        effectiveRenderOpts
      );
    }
  }

  const aacConfig = await resolveSupportedAacConfig(48000, 2);

  let serverMuxAvailable = false;
  if (!aacConfig) {
    serverMuxAvailable = await canServerMuxMp4(params.abortSignal);
    if (params.abortSignal.aborted) return null;
  }

  // Never put Opus inside .mp4 (silent on Apple/QuickTime/Windows/WhatsApp/many Android players).
  // Require either native AAC or server FFmpeg AAC muxing; otherwise fall back to Tier 2.
  if (!aacConfig && !serverMuxAvailable) {
    return null;
  }

  const useCompactServerAudio = !aacConfig && params.timeline.totalDurationSec > 180;
  const renderedAudio = await renderTimelineOfflineAudio(
    params.decodedBuffers,
    params.timeline,
    params.paceMultiplier,
    useCompactServerAudio ? 44100 : 48000,
    useCompactServerAudio ? 1 : 2
  );
  if (params.abortSignal.aborted) return null;

  const clientAudioConfig = aacConfig;
  const clientAudioMuxCodec: 'aac' | null = aacConfig ? 'aac' : null;

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: {
      codec: 'avc',
      width: encodeWidth,
      height: encodeHeight,
    },
    audio: clientAudioMuxCodec
      ? {
          codec: clientAudioMuxCodec,
          numberOfChannels: renderedAudio.numberOfChannels,
          sampleRate: renderedAudio.sampleRate,
        }
      : undefined,
    fastStart: 'in-memory',
  });

  let encoderError: Error | null = null;
  let videoChunkCount = 0;
  let lastChunkAdvanceAt = Date.now();
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => {
      videoChunkCount++;
      lastChunkAdvanceAt = Date.now();
      muxer.addVideoChunk(chunk, meta);
    },
    error: (err) => {
      encoderError = err instanceof Error ? err : new Error(String(err));
    },
  });

  videoEncoder.configure(videoConfig);

  let audioEncoder: AudioEncoder | null = null;
  if (clientAudioConfig) {
    audioEncoder = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (err) => {
        encoderError = err instanceof Error ? err : new Error(String(err));
      },
    });
    audioEncoder.configure(clientAudioConfig);
  }

  const totalSec = Math.max(1.5, params.timeline.totalDurationSec);
  const totalFrames = Math.max(1, Math.ceil(totalSec * fps));
  const frameDurationUs = Math.round(1_000_000 / fps);

  if (effectiveRenderOpts.bgVideo) {
    try {
      effectiveRenderOpts.bgVideo.pause();
    } catch {}
  }

  try {
    // Encode audio chunks first if client-side AudioEncoder (AAC or Opus) is active
    if (audioEncoder) {
      const sampleRate = renderedAudio.sampleRate;
      const numChannels = renderedAudio.numberOfChannels;
      const chunkFrames = 4096;
      const ch0 = renderedAudio.getChannelData(0);
      const ch1 = numChannels > 1 ? renderedAudio.getChannelData(1) : ch0;

      for (let startFrame = 0; startFrame < renderedAudio.length; startFrame += chunkFrames) {
        if (params.abortSignal.aborted || encoderError) break;
        const count = Math.min(chunkFrames, renderedAudio.length - startFrame);
        const planar = new Float32Array(count * numChannels);
        planar.set(ch0.subarray(startFrame, startFrame + count), 0);
        if (numChannels > 1) {
          planar.set(ch1.subarray(startFrame, startFrame + count), count);
        }

        const audioData = new AudioData({
          format: 'f32-planar',
          sampleRate,
          numberOfFrames: count,
          numberOfChannels: numChannels,
          timestamp: Math.round((startFrame / sampleRate) * 1_000_000),
          data: planar,
        });
        audioEncoder.encode(audioData);
        audioData.close();
      }
      await withTimeout(audioEncoder.flush(), 8000, 'audioEncoder.flush');
    }

    const videoLoopStartAt = Date.now();
    lastChunkAdvanceAt = videoLoopStartAt;

    for (let f = 0; f < totalFrames; f++) {
      if (params.abortSignal.aborted || encoderError) break;
      const tSec = f / fps;

      if (effectiveRenderOpts.bgVideo) {
        await seekVideoToTime(effectiveRenderOpts.bgVideo, tSec);
      }

      renderVideoCanvasFrame(
        params.canvasCtx,
        effectiveLayout,
        params.timeline,
        tSec,
        effectiveRenderOpts
      );

      const frame = new VideoFrame(params.canvas, {
        timestamp: f * frameDurationUs,
        duration: frameDurationUs,
      });

      const keyFrame = f % (fps * 2) === 0;
      videoEncoder.encode(frame, { keyFrame });
      frame.close();

      while (videoEncoder.encodeQueueSize >= 3 && !params.abortSignal.aborted && !encoderError) {
        if (Date.now() - lastChunkAdvanceAt > 3500) {
          throw new Error('VideoEncoder stalled without output for 3.5s');
        }
        await new Promise((r) => setTimeout(r, 15));
      }

      if (videoChunkCount === 0 && Date.now() - videoLoopStartAt > 2500) {
        throw new Error('VideoEncoder produced no initial output within 2.5s');
      }

      if (f % 2 === 0 || f === totalFrames - 1) {
        const pct = 25 + Math.round(((f + 1) / totalFrames) * 65);
        params.onProgress(
          Math.min(90, pct),
          tSec,
          `Encodage MP4 (${encodeWidth}×${encodeHeight}) ${Math.round(((f + 1) / totalFrames) * 100)}%...`
        );
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    if (params.abortSignal.aborted) {
      return null;
    }
    if (encoderError) {
      throw encoderError;
    }

    await withTimeout(videoEncoder.flush(), 30000, 'videoEncoder.flush');
    muxer.finalize();
  } finally {
    try {
      videoEncoder.close();
    } catch {}
    if (audioEncoder) {
      try {
        audioEncoder.close();
      } catch {}
    }
  }

  const mp4Bytes = new Uint8Array(target.buffer);

  // If browser encoded both H.264 video and audio (AAC or Opus) directly into MP4
  if (clientAudioConfig) {
    params.onProgress(98, totalSec, 'Finalisation de la vidéo MP4...');
    return {
      blob: new Blob([mp4Bytes], { type: 'video/mp4' }),
      extension: 'mp4',
      mimeType: 'video/mp4',
    };
  }

  // Otherwise send lossless H.264 MP4 track + WAV PCM to /api/video/mux-mp4 for fast AAC muxing
  params.onProgress(92, totalSec, 'Assemblage audio AAC haute fidélité dans le fichier MP4...');
  const wavBytes = encodeAudioBufferToWavBytes(renderedAudio);
  const packet = new Uint8Array(4 + mp4Bytes.byteLength + wavBytes.byteLength);
  new DataView(packet.buffer).setUint32(0, mp4Bytes.byteLength, false);
  packet.set(mp4Bytes, 4);
  packet.set(wavBytes, 4 + mp4Bytes.byteLength);

  const resp = await fetch('/api/video/mux-mp4', {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: packet,
    signal: params.abortSignal,
  });

  if (!resp.ok) {
    throw new Error(`Muxage MP4 échoué (${resp.status})`);
  }

  const outBuf = await resp.arrayBuffer();
  if (outBuf.byteLength < 1024) {
    throw new Error('Fichier MP4 généré invalide.');
  }

  params.onProgress(100, totalSec, `Vidéo MP4 (${encodeWidth}×${encodeHeight}) prête !`);
  return {
    blob: new Blob([outBuf], { type: 'video/mp4' }),
    extension: 'mp4',
    mimeType: 'video/mp4',
  };
}

/**
 * Tier 2: MediaRecorder capture (preferring native MP4 on iOS/Safari, or transcoding to MP4 via server FFmpeg).
 * Never silently returns a .webm file when the user expects an .mp4 file.
 */
async function exportViaMediaRecorderToMp4(params: Mp4ExportParams): Promise<Mp4ExportResult> {
  const { canvas, canvasCtx, layout, timeline, renderOpts, audioCtx, decodedBuffers } = params;

  if (typeof (canvas as any).captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
    throw new Error(
      'Votre navigateur ne supporte pas l’enregistrement vidéo MP4. Essayez Chrome Android ou Safari iOS à jour.'
    );
  }

  if (audioCtx.state !== 'running') {
    await audioCtx.resume().catch(() => {});
  }

  renderVideoCanvasFrame(canvasCtx, layout, timeline, 0, renderOpts);

  const videoStream: MediaStream = (canvas as any).captureStream(30);
  const destNode = audioCtx.createMediaStreamDestination();
  const keepalive = attachAudioStreamKeepalive(
    audioCtx,
    destNode,
    params.monitorAudioDuringExport
  );
  params.onKeepaliveReady?.(keepalive);

  const combinedStream = new MediaStream();
  for (const vt of videoStream.getVideoTracks()) {
    combinedStream.addTrack(vt);
  }
  for (const at of destNode.stream.getAudioTracks()) {
    combinedStream.addTrack(at);
  }

  const { mimeType: chosenMime } = selectPreferredVideoMimeType((m) =>
    MediaRecorder.isTypeSupported(m)
  );

  const targetVideoBps = chosenMime.includes('mp4')
    ? 8_000_000
    : chosenMime.includes('vp9')
    ? 4_000_000
    : 6_000_000;

  const recorder = chosenMime
    ? new MediaRecorder(combinedStream, {
        mimeType: chosenMime,
        videoBitsPerSecond: targetVideoBps,
        audioBitsPerSecond: 128_000,
      })
    : new MediaRecorder(combinedStream, {
        videoBitsPerSecond: 4_000_000,
        audioBitsPerSecond: 128_000,
      });
  params.onMediaRecorderReady?.(recorder);

  const chunks: BlobPart[] = [];
  let notifiedFirstChunk = false;
  recorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) {
      chunks.push(ev.data);
      if (!notifiedFirstChunk) {
        notifiedFirstChunk = true;
        params.onRecordingChunkAvailable?.();
      }
    }
  };

  let rafId: number | null = null;
  let playbackHandle: ReturnType<typeof scheduleContinuousAudioSequence> | null = null;

  const stopPromise = new Promise<{ rawBlob: Blob; rawMime: string }>((resolve, reject) => {
    recorder.onstop = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      playbackHandle?.stop();
      keepalive.dispose();
      const rawMime = recorder.mimeType || chosenMime || 'video/webm';
      const rawBlob = new Blob(chunks, { type: rawMime });
      if (rawBlob.size > 0) {
        resolve({ rawBlob, rawMime });
      } else {
        reject(new Error('La vidéo enregistrée est vide.'));
      }
    };
    recorder.onerror = () => reject(new Error('Erreur MediaRecorder lors de la création vidéo.'));
  });

  recorder.start(200);
  renderVideoCanvasFrame(canvasCtx, layout, timeline, 0.01, renderOpts);

  const segStarts = timeline.segments.map((s) => s.startSec);
  const segDurs = timeline.segments.map((s) => s.durationSec);
  playbackHandle = scheduleContinuousAudioSequence(
    audioCtx,
    decodedBuffers,
    segStarts,
    segDurs,
    0,
    [keepalive.feedNode],
    params.paceMultiplier
  );

  if (renderOpts.bgVideo) {
    renderOpts.bgVideo.currentTime = 0;
    renderOpts.bgVideo.play().catch(() => {});
  }

  const startAudioClock = audioCtx.currentTime;
  const totalSec = Math.max(2, timeline.totalDurationSec);

  const onAbort = () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    playbackHandle?.stop();
    if (recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {}
    }
  };
  params.abortSignal.addEventListener('abort', onAbort, { once: true });

  const renderLoop = () => {
    if (params.abortSignal.aborted || recorder.state === 'inactive') return;
    const elapsed = Math.max(0, audioCtx.currentTime - startAudioClock);
    renderVideoCanvasFrame(canvasCtx, layout, timeline, elapsed, renderOpts);
    const pct = Math.min(88, 25 + Math.round((elapsed / totalSec) * 63));
    params.onProgress(
      pct,
      elapsed,
      `Capture vidéo (${renderOpts.width}×${renderOpts.height}) ${Math.round((elapsed / totalSec) * 100)}%...`
    );
    if (elapsed >= totalSec) {
      if (recorder.state === 'recording') {
        recorder.stop();
      }
      return;
    }
    rafId = requestAnimationFrame(renderLoop);
  };
  rafId = requestAnimationFrame(renderLoop);

  const { rawBlob, rawMime } = await stopPromise;
  params.abortSignal.removeEventListener('abort', onAbort);

  if (params.abortSignal.aborted) {
    throw new Error('Export annulé.');
  }

  // Safari / iOS native MP4 recording: mux lossless offline AAC audio onto video via FFmpeg when available
  // so WebKit MediaStreamAudioDestination quirks can never leave the MP4 silent.
  if (rawMime.includes('mp4')) {
    try {
      if (await canServerMuxMp4(params.abortSignal)) {
        params.onProgress(94, totalSec, 'Vérification et assemblage audio AAC dans le MP4...');
        const rawBytes = new Uint8Array(await rawBlob.arrayBuffer());
        const muxedBytes = await muxVideoBlobWithOfflineAudio(
          rawBytes,
          decodedBuffers,
          timeline,
          params.paceMultiplier,
          params.abortSignal
        );
        if (muxedBytes && muxedBytes.byteLength >= 1024) {
          return {
            blob: new Blob([muxedBytes], { type: 'video/mp4' }),
            extension: 'mp4',
            mimeType: 'video/mp4',
          };
        }
      }
    } catch {
      // Fallback to native MediaRecorder MP4 blob if server mux fails
    }
    return {
      blob: rawBlob,
      extension: 'mp4',
      mimeType: 'video/mp4',
    };
  }

  // Convert WebM capture to H.264 + AAC MP4 via server FFmpeg
  params.onProgress(92, totalSec, 'Conversion en MP4 H.264 + AAC haute qualité...');
  const convRes = await fetch('/api/video/convert-mp4', {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: rawBlob,
    signal: params.abortSignal,
  });

  if (!convRes.ok) {
    throw new Error(
      `Conversion MP4 indisponible sur ce serveur (${convRes.status}). Utilisez Chrome Android récent ou Safari iOS pour un export MP4 direct.`
    );
  }

  const mp4Buf = await convRes.arrayBuffer();
  if (mp4Buf.byteLength < 1024) {
    throw new Error('Le fichier MP4 converti est vide.');
  }

  return {
    blob: new Blob([mp4Buf], { type: 'video/mp4' }),
    extension: 'mp4',
    mimeType: 'video/mp4',
  };
}

export async function exportQuranVideoToMp4(params: Mp4ExportParams): Promise<Mp4ExportResult> {
  try {
    const fastResult = await tryWebCodecsMp4Export(params);
    if (fastResult) {
      return fastResult;
    }
  } catch (err) {
    if (params.abortSignal.aborted) throw err;
    console.warn('WebCodecs MP4 export unavailable or failed, falling back to MediaRecorder + FFmpeg MP4:', err);
  }

  return exportViaMediaRecorderToMp4(params);
}
