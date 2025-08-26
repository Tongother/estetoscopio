"use client";

import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";

type AudioContextCtor = new (contextOptions?: AudioContextOptions) => AudioContext;
interface WebAudioWindow extends Window {
  AudioContext?: AudioContextCtor;
  webkitAudioContext?: AudioContextCtor;
}

type Props = {
  onAudioReady: (audioBlob: Blob, audioUrl: string) => void;
  /** Frecuencia objetivo para el AudioContext del worklet (tu backend remuestrea luego si quiere) */
  targetSampleRate?: number; // default 16000
};

/** Float32 [-1,1] -> Int16 PCM */
function floatToI16(f32: Float32Array): Int16Array {
  const i16 = new Int16Array(f32.length);
  for (let i = 0; i < f32.length; i++) {
    const s = Math.max(-1, Math.min(1, f32[i]));
    i16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return i16;
}

/** Empaqueta PCM16 mono a WAV (header RIFF correcto) */
function pcm16ToWav(samples: Int16Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  let p = 0;
  const writeStr = (s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(p++, s.charCodeAt(i)); };
  const write16 = (v: number) => { view.setUint16(p, v, true); p += 2; };
  const write32 = (v: number) => { view.setUint32(p, v, true); p += 4; };

  // RIFF header
  writeStr("RIFF");
  write32(36 + dataSize);
  writeStr("WAVE");

  // fmt subchunk
  writeStr("fmt ");
  write32(16);          // PCM
  write16(1);           // AudioFormat = PCM
  write16(numChannels); // Mono
  write32(sampleRate);
  write32(byteRate);
  write16(blockAlign);
  write16(16);          // BitsPerSample

  // data subchunk
  writeStr("data");
  write32(dataSize);

  // Escribir datos PCM16 desde el puntero actual (p == 44)
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(p, samples[i], true);
    p += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

/** Mezcla N canales a mono promediando */
function mixToMono(buf: AudioBuffer): Float32Array {
  const len = buf.length;
  const out = new Float32Array(len);
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) out[i] += data[i];
  }
  for (let i = 0; i < len; i++) out[i] /= buf.numberOfChannels || 1;
  return out;
}

/** decodeAudioData que funciona en navegadores con callback/promesa */
async function decodeAudio(ctx: AudioContext, arrayBuf: ArrayBuffer): Promise<AudioBuffer> {
  return await new Promise<AudioBuffer>((resolve, reject) => {
    const r = (ctx as any).decodeAudioData(arrayBuf, resolve, reject);
    if (r && typeof (r as Promise<AudioBuffer>).then === "function") {
      (r as Promise<AudioBuffer>).then(resolve, reject);
    }
  });
}

export default function AudioRecorder({ onAudioReady, targetSampleRate = 16000 }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const WORKLET_URL = "/pcm-recorder.worklet.js";

  // Worklet refs
  const acRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);

  // Fallback MediaRecorder refs
  const mrRef = useRef<MediaRecorder | null>(null);
  const mrChunksRef = useRef<Blob[]>([]);
  const mrStreamRef = useRef<MediaStream | null>(null);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
      cleanupWorklet();
      cleanupMediaRecorder();
    };
  }, []);

  function cleanupWorklet() {
    try {
      nodeRef.current?.disconnect();
      sourceRef.current?.disconnect();
      // corta tracks del mic
      const tracks = (sourceRef.current?.mediaStream as MediaStream | undefined)?.getTracks?.() || [];
      tracks.forEach((t) => t.stop());
      acRef.current?.close();
    } catch {}
    nodeRef.current = null;
    sourceRef.current = null;
    acRef.current = null;
    chunksRef.current = [];
  }

  function cleanupMediaRecorder() {
    try { mrRef.current?.stop(); } catch {}
    try {
      mrStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    mrRef.current = null;
    mrStreamRef.current = null;
    mrChunksRef.current = [];
  }

  async function startWithWorklet() {
    const win = window as WebAudioWindow;
    const AC = win.AudioContext ?? win.webkitAudioContext;
    if (!AC) throw new Error("Web Audio API no soportada.");

    const ac = new AC({ sampleRate: targetSampleRate });
    acRef.current = ac;

    // Cargar worklet
    await ac.audioWorklet.addModule(WORKLET_URL);

    // Permisos de micro
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = ac.createMediaStreamSource(stream);
    sourceRef.current = source;

    // Debe coincidir con el nombre registrado en el script del worklet
    const node = new AudioWorkletNode(ac, "pcm-recorder-processor");
    nodeRef.current = node;

    chunksRef.current = [];
    node.port.onmessage = (e) => {
      const f32 = e.data as Float32Array;
      if (f32 && f32.length) chunksRef.current.push(f32);
    };

    // No conectamos a altavoces para evitar eco
    source.connect(node);
    node.port.postMessage("start");
  }

  async function startWithMediaRecorder() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mrStreamRef.current = stream;

    const mime =
      MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" :
      MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";

    const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    mrRef.current = mr;
    mrChunksRef.current = [];

    mr.ondataavailable = (ev) => { if (ev.data && ev.data.size > 0) mrChunksRef.current.push(ev.data); };
    mr.onstop = async () => {
      try {
        const blob = new Blob(mrChunksRef.current, { type: mime || "audio/webm" });

        // Decode → mono → PCM16 → WAV
        const arrayBuf = await blob.arrayBuffer();
        const win = window as WebAudioWindow;
        const AC = win.AudioContext ?? win.webkitAudioContext;
        if (!AC) throw new Error("Web Audio API no soportada.");
        const ctx = new AC();

        const decoded = await decodeAudio(ctx, arrayBuf);
        const monoFloat = decoded.numberOfChannels > 1 ? mixToMono(decoded) : decoded.getChannelData(0);
        const i16 = floatToI16(monoFloat);
        const wav = pcm16ToWav(i16, decoded.sampleRate);

        try { await ctx.close?.(); } catch {}

        const url = URL.createObjectURL(wav);
        onAudioReady(wav, url);
      } catch (err) {
        console.error("[REC] Fallback onstop error:", err);
      } finally {
        try { mrStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
      }
    };

    mr.start();
  }

  const startRecording = async () => {
    try {
      // intenta worklet primero
      await startWithWorklet();
      // Si no lanza, estamos grabando con worklet
    } catch (e) {
      console.warn("[REC] Worklet falló, usando MediaRecorder:", e);
      await startWithMediaRecorder();
    }

    setIsRecording(true);
    setRecordingTime(0);
    intervalRef.current = window.setInterval(() => setRecordingTime((t) => t + 1), 1000);
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);

    // ¿worklet activo?
    if (nodeRef.current && acRef.current) {
      try {
        nodeRef.current.port.postMessage("stop");

        // concatenar buffers float32
        const total = chunksRef.current.reduce((s, a) => s + a.length, 0);
        const mono = new Float32Array(total);
        let off = 0;
        for (const c of chunksRef.current) { mono.set(c, off); off += c.length; }

        const i16 = floatToI16(mono);
        const sr = acRef.current.sampleRate || 16000;
        const wav = pcm16ToWav(i16, sr);
        const url = URL.createObjectURL(wav);
        onAudioReady(wav, url);
      } catch (e) {
        console.error("[REC] Error al finalizar worklet:", e);
      } finally {
        cleanupWorklet();
      }
      return;
    }

    // ¿fallback activo?
    if (mrRef.current) {
      try { mrRef.current.stop(); } catch {}
      return;
    }
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-white transition ${
            isRecording ? "bg-red-600 animate-[pulse-ring_1.5s_infinite]" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          <Mic className="h-5 w-5" />
          {isRecording ? "Detener Grabación" : "Grabar (WAV)"}
        </button>

        {isRecording && (
          <div className="flex items-center gap-2 font-mono text-red-600">
            <span className="h-3 w-3 rounded-full bg-red-600 animate-pulse" />
            {fmt(recordingTime)}
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Primero intenta AudioWorklet (PCM crudo); si no, cae a MediaRecorder y convertimos a WAV (PCM16 mono).
      </p>
    </div>
  );
}
