// Convierte cualquier Blob de audio del browser a WAV PCM16 mono 16kHz (ajusta sampleRate si tu modelo usa otro)
export async function toWavPcm16Mono(blob: Blob, targetSampleRate = 16000): Promise<Blob> {
  const arrayBuf = await blob.arrayBuffer();
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuf = await ctx.decodeAudioData(arrayBuf);

  // Mono
  const ch = 0;
  const src = audioBuf.numberOfChannels > 1 ? mixToMono(audioBuf) : audioBuf.getChannelData(ch);

  // Resample a targetSampleRate con OfflineAudioContext
  const offline = new OfflineAudioContext(1, Math.ceil(src.length * targetSampleRate / audioBuf.sampleRate), targetSampleRate);
  const srcBuf = offline.createBuffer(1, src.length, audioBuf.sampleRate);
  srcBuf.copyToChannel(src, 0);
  const source = offline.createBufferSource();
  source.buffer = srcBuf;
  source.connect(offline.destination);
  source.start(0);
  const resampled = await offline.startRendering();

  const pcm = resampled.getChannelData(0);
  // Float32 -> Int16
  const i16 = new Int16Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    i16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  // Empaquetar WAV
  return pcm16ToWav(i16, targetSampleRate);
}

function mixToMono(buf: AudioBuffer) {
  const len = buf.length;
  const out = new Float32Array(len);
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) out[i] += data[i];
  }
  for (let i = 0; i < len; i++) out[i] /= buf.numberOfChannels;
  return out;
}

function pcm16ToWav(samples: Int16Array, sampleRate: number): Blob {
  const blockAlign = 2; // mono 16-bit
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  let p = 0;
  // RIFF header
  writeStr("RIFF"); write32(36 + dataSize); writeStr("WAVE");
  // fmt chunk
  writeStr("fmt "); write32(16); write16(1); write16(1);
  write32(sampleRate); write32(byteRate); write16(blockAlign); write16(16);
  // data chunk
  writeStr("data"); write32(dataSize);
  for (let i = 0; i < samples.length; i++, p += 2) view.setInt16(44 + p, samples[i], true);

  return new Blob([buffer], { type: "audio/wav" });

  function writeStr(s: string) { for (let i = 0; i < s.length; i++) view.setUint8(p++, s.charCodeAt(i)); }
  function write16(v: number) { view.setUint16(p, v, true); p += 2; }
  function write32(v: number) { view.setUint32(p, v, true); p += 4; }
}
