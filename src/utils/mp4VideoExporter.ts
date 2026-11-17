import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { ContinuousTimeline, selectPreferredVideoMimeType } from './mobileVideoStudioUtils';
import {
  DecodedVerseBuffer,
  attachAudioStreamKeepalive,
  scheduleContinuousAudioSequence,
} from './continuousAudioEngine';
import {
  PrecomputedCanvasLayout,
  VideoCanvasRenderOptions,
  renderVideoCanvasFrame,
} from './canvasVideoRenderer';

export interface Mp4ExportParams {
  canvas: HTMLCanvasElement;
  canvasCtx: CanvasRenderingContext2D;
  layout: PrecomputedCanvasLayout;
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
}

export interface Mp4ExportResult {
  blob: Blob;
  extension: 'mp4' | 'webm';
  mimeType: string;
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
  sampleRate = 48000
): Promise<AudioBuffer> {
  const totalSec = Math.max(1.5, timeline.totalDurationSec);
  const frameCount = Math.ceil(totalSec * sampleRate);
  const offlineCtx = new OfflineAudioContext(2, frameCount, sampleRate);

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
  width: number,
  height: number,
  fps: number,
  bitrate: number
): Promise<VideoEncoderConfig | null> {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') {
    return null;
  }

  // Main Profile L4.2 first: 35% faster software encoding than High Profile and universally playable on mobile/desktop
  const codecs = [
    'avc1.4d402a', // Main Profile L4.2 (1080p)
    'avc1.64002a', // High Profile L4.2
    'avc1.42e02a', // Baseline L4.2
    'avc1.42002a',
  ];

  for (const codec of codecs) {
    try {
      const candidate: VideoEncoderConfig = {
        codec,
        width,
        height,
        bitrate,
        framerate: fps,
        avc: { format: 'avc' },
      };
      const support = await VideoEncoder.isConfigSupported(candidate);
      if (support.supported) {
        return support.config || candidate;
      }
    } catch {
      // try next profile
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
  try {
    const candidate: AudioEncoderConfig = {
      codec: 'mp4a.40.2',
      sampleRate,
      numberOfChannels,
      bitrate: 192_000,
    };
    const support = await AudioEncoder.isConfigSupported(candidate);
    if (support.supported) {
      return support.config || candidate;
    }
  } catch {
    // unsupported
  }
  return null;
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
 * Tier 1: Deterministic offline WebCodecs H.264 1080x1920 encoding (8 Mbps).
 * Uses in-browser AudioEncoder (AAC) when supported, or pairs with server-side lossless H.264+WAV->AAC muxing.
 */
async function tryWebCodecsMp4Export(params: Mp4ExportParams): Promise<Mp4ExportResult | null> {
  // Video background needs real-time/seek playback; let MediaRecorder handle looping user bg videos smoothly
  if (params.renderOpts.bgVideo) {
    return null;
  }

  const { width, height } = params.renderOpts;
  const fps = 30;
  const videoBitrate = 8_000_000;

  const videoConfig = await resolveSupportedH264Config(width, height, fps, videoBitrate);
  if (!videoConfig) return null;

  const renderedAudio = await renderTimelineOfflineAudio(
    params.decodedBuffers,
    params.timeline,
    params.paceMultiplier,
    48000
  );
  if (params.abortSignal.aborted) return null;

  const aacConfig = await resolveSupportedAacConfig(
    renderedAudio.sampleRate,
    renderedAudio.numberOfChannels
  );

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: {
      codec: 'avc',
      width,
      height,
    },
    audio: aacConfig
      ? {
          codec: 'aac',
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
  if (aacConfig) {
    audioEncoder = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (err) => {
        encoderError = err instanceof Error ? err : new Error(String(err));
      },
    });
    audioEncoder.configure(aacConfig);
  }

  const totalSec = Math.max(1.5, params.timeline.totalDurationSec);
  const totalFrames = Math.max(1, Math.ceil(totalSec * fps));
  const frameDurationUs = Math.round(1_000_000 / fps);

  try {
    // Encode audio chunks first if client-side AAC AudioEncoder is available
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

    // Reset progress clock right as video frame encoding begins
    const videoLoopStartAt = Date.now();
    lastChunkAdvanceAt = videoLoopStartAt;

    // Encode Full HD 1080x1920 frames deterministically
    for (let f = 0; f < totalFrames; f++) {
      if (params.abortSignal.aborted || encoderError) break;
      const tSec = f / fps;
      renderVideoCanvasFrame(
        params.canvasCtx,
        params.layout,
        params.timeline,
        tSec,
        params.renderOpts
      );

      const frame = new VideoFrame(params.canvas, {
        timestamp: f * frameDurationUs,
        duration: frameDurationUs,
      });

      const keyFrame = f % (fps * 2) === 0;
      videoEncoder.encode(frame, { keyFrame });
      frame.close();

      // Throttle backpressure at queue >= 3 so software OpenH264 encodes steadily without overflowing memory
      while (videoEncoder.encodeQueueSize >= 3 && !params.abortSignal.aborted && !encoderError) {
        if (Date.now() - lastChunkAdvanceAt > 6000) {
          throw new Error('VideoEncoder stalled without output for 6s');
        }
        await new Promise((r) => setTimeout(r, 15));
      }

      // Fail fast only if zero chunks arrive within 5s of starting frame emission
      if (videoChunkCount === 0 && Date.now() - videoLoopStartAt > 5000) {
        throw new Error('VideoEncoder produced no initial output within 5s');
      }

      if (f % 2 === 0 || f === totalFrames - 1) {
        const pct = 25 + Math.round(((f + 1) / totalFrames) * 65);
        params.onProgress(
          Math.min(90, pct),
          tSec,
          `Encodage MP4 Full HD 1080×1920 (${Math.round(((f + 1) / totalFrames) * 100)}%)...`
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

    await withTimeout(videoEncoder.flush(), 15000, 'videoEncoder.flush');
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

  // If browser encoded both H.264 video and AAC audio directly
  if (aacConfig) {
    params.onProgress(98, totalSec, 'Finalisation MP4 Full HD...');
    return {
      blob: new Blob([mp4Bytes], { type: 'video/mp4' }),
      extension: 'mp4',
      mimeType: 'video/mp4',
    };
  }

  // Otherwise send lossless H.264 MP4 track + WAV PCM to /api/video/mux-mp4 for fast AAC muxing (-c:v copy)
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

  params.onProgress(100, totalSec, 'Vidéo MP4 Full HD 1080×1920 prête !');
  return {
    blob: new Blob([outBuf], { type: 'video/mp4' }),
    extension: 'mp4',
    mimeType: 'video/mp4',
  };
}

/**
 * Tier 2: Reliable MediaRecorder capture + server-side ffmpeg H.264+AAC MP4 transcode when needed.
 */
async function exportViaMediaRecorderToMp4(params: Mp4ExportParams): Promise<Mp4ExportResult> {
  const { canvas, canvasCtx, layout, timeline, renderOpts, audioCtx, decodedBuffers } = params;

  if (typeof (canvas as any).captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
    throw new Error(
      'Votre navigateur ne supporte pas l’enregistrement vidéo. Essayez Safari/Chrome récent.'
    );
  }

  // Paint initial frame synchronously before starting captureStream
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

  // Cap VP9 software MediaRecorder bitrate at 4 Mbps (10 Mbps on 1080x1920 causes 0-byte stalls in Chromium);
  // /api/video/convert-mp4 re-encodes WebM captures to crisp libx264 CRF 18 Full HD MP4.
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
  recorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) {
      chunks.push(ev.data);
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

  recorder.start(250);

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
      `Capture vidéo Full HD 1080×1920 (${Math.round((elapsed / totalSec) * 100)}%)...`
    );
    if (elapsed >= totalSec) {
      if (recorder.state === 'recording') {
        try {
          recorder.requestData();
        } catch {}
      }
      recorder.stop();
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

  // If browser recorded genuine H.264 + AAC MP4 natively (Safari/iOS), return directly
  if (rawMime.includes('mp4') && rawMime.includes('mp4a')) {
    return {
      blob: rawBlob,
      extension: 'mp4',
      mimeType: 'video/mp4',
    };
  }

  // Convert recorded WebM/fallback stream to crisp H.264 + AAC MP4 via server ffmpeg
  params.onProgress(92, totalSec, 'Conversion en MP4 H.264 + AAC haute qualité...');
  const convRes = await fetch('/api/video/convert-mp4', {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: rawBlob,
    signal: params.abortSignal,
  });

  if (!convRes.ok) {
    throw new Error(`Conversion MP4 impossible (${convRes.status}).`);
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
