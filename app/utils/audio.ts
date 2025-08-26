// app/lib/audio.ts
export const CLIENT_UPLOAD_SR = 16000; // SIEMPRE 16k en el cliente

const WAV_MIMES = new Set(["audio/wav","audio/x-wav","audio/wave"]);

export async function prepareAudioForUpload(fileOrBlob: Blob): Promise<File> {
  // Si ya es WAV PCM16 mono @16k, no conviertas
  if (WAV_MIMES.has((fileOrBlob as File).type || "") &&
      await isWavPcm16MonoAt(fileOrBlob, CLIENT_UPLOAD_SR)) {
    return new File([fileOrBlob], "recording.wav", { type: "audio/wav" });
  }
  const wavBlob = await toWavPcm16Mono(fileOrBlob, CLIENT_UPLOAD_SR);
  return new File([wavBlob], "recording.wav", { type: "audio/wav" });
}

export async function isWavPcm16MonoAt(file: Blob, targetSr: number): Promise<boolean> {
  const head = await file.slice(0, 128).arrayBuffer();
  const dv = new DataView(head);
  const str = (o: number, n: number) => String.fromCharCode(...new Uint8Array(head, o, n));
  const u16 = (o: number) => dv.getUint16(o, true);
  const u32 = (o: number) => dv.getUint32(o, true);

  if (str(0,4)!=="RIFF" || str(8,4)!=="WAVE") return false;

  let off = 12;
  while (off + 8 <= dv.byteLength) {
    const id = str(off, 4);
    const size = u32(off + 4);
    if (id === "fmt ") {
      if (off + 8 + size > dv.byteLength) break;
      const audioFormat   = u16(off + 8);   // 1 = PCM
      const numChannels   = u16(off + 10);
      const sampleRate    = u32(off + 12);
      const bitsPerSample = size >= 16 ? u16(off + 22) : 0;
      return audioFormat === 1 && numChannels === 1 && bitsPerSample === 16 && sampleRate === targetSr;
    }
    off += 8 + size;
  }
  return false;
}

export async function toWavPcm16Mono(blob: Blob, targetSampleRate = CLIENT_UPLOAD_SR): Promise<Blob> {
  const arrayBuf = await blob.arrayBuffer();
  const AC: typeof AudioContext = (window).AudioContext;
  if (!AC) throw new Error("Web Audio API no soportada.");
  const ctx = new AC();

  const audioBuf = await new Promise<AudioBuffer>((resolve, reject) =>
    ctx.decodeAudioData(arrayBuf, resolve, reject)
  );

  const src = audioBuf.numberOfChannels > 1 ? mixToMono(audioBuf) : audioBuf.getChannelData(0);

  const OfflineAC: typeof OfflineAudioContext = (window).OfflineAudioContext;
  if (!OfflineAC) throw new Error("OfflineAudioContext no soportado.");

  // targetSampleRate aquí SIEMPRE será 16000
  const length = Math.ceil(src.length * targetSampleRate / audioBuf.sampleRate);
  const offline = new OfflineAC(1, length, targetSampleRate);

  const srcBuf = offline.createBuffer(1, src.length, audioBuf.sampleRate);
  srcBuf.copyToChannel(src, 0);

  const node = offline.createBufferSource();
  node.buffer = srcBuf;
  node.connect(offline.destination);
  node.start(0);

  const resampled = await offline.startRendering();
  const pcm = resampled.getChannelData(0);

  const i16 = new Int16Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    i16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return pcm16ToWav(i16, targetSampleRate);
}

function mixToMono(buf: AudioBuffer) {
  const len = buf.length, out = new Float32Array(len);
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) out[i] += data[i];
  }
  for (let i = 0; i < len; i++) out[i] /= buf.numberOfChannels;
  return out;
}

function pcm16ToWav(samples: Int16Array, sampleRate: number): Blob {
  const blockAlign = 2, byteRate = sampleRate * blockAlign, dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  let p = 0;
  writeStr("RIFF"); write32(36 + dataSize); writeStr("WAVE");
  writeStr("fmt "); write32(16); write16(1); write16(1);
  write32(sampleRate); write32(byteRate); write16(blockAlign); write16(16);
  writeStr("data"); write32(dataSize);
  for (let i = 0; i < samples.length; i++, p += 2) view.setInt16(44 + p, samples[i], true);
  return new Blob([buffer], { type: "audio/wav" });

  function writeStr(s: string) { for (let i = 0; i < s.length; i++) view.setUint8(p++, s.charCodeAt(i)); }
  function write16(v: number) { view.setUint16(p, v, true); p += 2; }
  function write32(v: number) { view.setUint32(p, v, true); p += 4; }
}
