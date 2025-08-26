"use client";

import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";

type AudioContextCtor = new (contextOptions?: AudioContextOptions) => AudioContext;
interface WebAudioWindow extends Window {
  AudioContext?: AudioContextCtor;
  webkitAudioContext?: AudioContextCtor;
}

function pcm16ToWav(samples: Int16Array, sampleRate: number): Blob {
  const blockAlign = 2;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  let p = 0;
  const writeStr = (s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(p++, s.charCodeAt(i)); };
  const write16 = (v: number) => { view.setUint16(p, v, true); p += 2; };
  const write32 = (v: number) => { view.setUint32(p, v, true); p += 4; };

  writeStr("RIFF"); write32(36 + dataSize); writeStr("WAVE");
  writeStr("fmt "); write32(16); write16(1); write16(1);
  write32(sampleRate); write32(byteRate); write16(blockAlign); write16(16);
  writeStr("data"); write32(dataSize);
  for (let i = 0; i < samples.length; i++, p += 2) view.setInt16(44 + p, samples[i], true);
  return new Blob([buffer], { type: "audio/wav" });
}

function floatToI16(f32: Float32Array): Int16Array {
  const i16 = new Int16Array(f32.length);
  for (let i = 0; i < f32.length; i++) {
    const s = Math.max(-1, Math.min(1, f32[i]));
    i16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return i16;
}

type Props = {
  onAudioReady: (audioBlob: Blob, audioUrl: string) => void;
  targetSampleRate?: number; // audioContext; backend remuestrea a 1150 Hz
};

export default function AudioRecorder({ onAudioReady, targetSampleRate = 16000 }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Worklet path
  const WORKLET_URL = "/pcm-recorder.worklet.js";

  // Worklet refs
  const acRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);

  // Fallback MediaRecorder refs
  const mrRef = useRef<MediaRecorder | null>(null);
  const mrChunksRef = useRef<Blob[]>([]);

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
      sourceRef.current?.disconnect();
      nodeRef.current?.disconnect();
      acRef.current?.close();
    } catch {}
    sourceRef.current = null;
    nodeRef.current = null;
    acRef.current = null;
    chunksRef.current = [];
  }

  function cleanupMediaRecorder() {
    try { mrRef.current?.stop(); } catch {}
    mrRef.current = null;
    mrChunksRef.current = [];
  }

  async function startWithWorklet() {
    const win = window as WebAudioWindow;
    const AC = win.AudioContext ?? win.webkitAudioContext;
    if (!AC) throw new Error("Web Audio API no soportada.");

    const ac = new AC({ sampleRate: targetSampleRate });
    acRef.current = ac;

    console.log("[REC] Cargando worklet:", WORKLET_URL);
    await ac.audioWorklet.addModule(WORKLET_URL);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = ac.createMediaStreamSource(stream);
    sourceRef.current = source;

    const node = new AudioWorkletNode(ac, "pcm-recorder-processor");
    nodeRef.current = node;

    chunksRef.current = [];
    node.port.onmessage = (e) => {
      const f32 = e.data as Float32Array;
      chunksRef.current.push(f32);
    };

    source.connect(node);
    node.connect(ac.destination);
    node.port.postMessage("start");
  }

  async function startWithMediaRecorder() {
    console.warn("[REC] Fallback a MediaRecorder.");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime =
      MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" :
      MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" :
      "";

    const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    mrRef.current = mr;
    mrChunksRef.current = [];

    mr.ondataavailable = (ev) => { if (ev.data.size > 0) mrChunksRef.current.push(ev.data); };
    mr.onstop = async () => {
      const blob = new Blob(mrChunksRef.current, { type: mime || "audio/webm" });

      // Convertir a WAV en el main thread (decodificar y empaquetar)
      const arrayBuf = await blob.arrayBuffer();
      const ctx = new (window.AudioContext)();
      const decoded = await ctx.decodeAudioData(arrayBuf);
      const ch0 = decoded.numberOfChannels > 1 ? mixToMono(decoded) : decoded.getChannelData(0);
      const i16 = floatToI16(ch0);
      const wav = pcm16ToWav(i16, decoded.sampleRate);
      const url = URL.createObjectURL(wav);
      onAudioReady(wav, url);

      // cortar micrófono
      stream.getTracks().forEach(t => t.stop());
    };

    mr.start();
  }

  function mixToMono(buf: AudioBuffer): Float32Array {
    const len = buf.length;
    const out = new Float32Array(len);
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      out.set(buf.getChannelData(ch).map((v, i) => v + out[i]));
    }
    for (let i = 0; i < len; i++) out[i] /= buf.numberOfChannels;
    return out;
  }

  const startRecording = async () => {
    try {
      // intenta worklet primero
      await startWithWorklet();
      console.log("[REC] Worklet OK, grabando…");
    } catch (e) {
      console.warn("[REC] Worklet falló:", e);
      // fallback
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

    // worklet en uso
    if (nodeRef.current && acRef.current) {
      try {
        nodeRef.current.port.postMessage("stop");
        // concatenar y entregar
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
        // corta el micro
        try {
          const tracks = (sourceRef.current?.mediaStream as MediaStream | undefined)?.getTracks?.() || [];
          tracks.forEach((t) => t.stop());
        } catch {}
        cleanupWorklet();
      }
      return;
    }

    // si estábamos en fallback MediaRecorder
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
        Si el worklet no está disponible, usamos fallback a MediaRecorder. Salida final: WAV PCM16 mono.
      </p>
    </div>
  );
}
