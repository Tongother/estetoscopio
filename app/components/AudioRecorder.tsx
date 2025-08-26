"use client";

import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";

// Empaqueta Int16 PCM a WAV
function pcm16ToWav(samples: Int16Array, sampleRate: number): Blob {
  const blockAlign = 2; // mono 16-bit
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

type Props = {
  onAudioReady: (audioBlob: Blob, audioUrl: string) => void;
  targetSampleRate?: number; // default 16000
};

export default function AudioRecorder({ onAudioReady, targetSampleRate = 16000 }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const acRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
      cleanup();
    };
  }, []);

  function cleanup() {
    try {
      sourceRef.current?.disconnect();
      nodeRef.current?.disconnect();
      acRef.current?.close();
    } catch {}
    sourceRef.current = null;
    nodeRef.current = null;
    acRef.current = null;
  }

  const startRecording = async () => {
    try {
      const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ac = new AC({ sampleRate: targetSampleRate }); // pedimos 16k al crear el contexto
      acRef.current = ac;

      await ac.audioWorklet.addModule("/pcm-recorder.worklet.js");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = ac.createMediaStreamSource(stream);
      sourceRef.current = source;

      const node = new AudioWorkletNode(ac, "pcm-recorder-processor");
      nodeRef.current = node;

      // recolectar buffers desde el worklet
      chunksRef.current = [];
      node.port.onmessage = (e) => {
        const f32 = e.data as Float32Array;
        chunksRef.current.push(f32);
      };

      source.connect(node);
      node.connect(ac.destination); // o ac.createGain() si no quieres monitorear

      node.port.postMessage('start');
      setIsRecording(true);
      setRecordingTime(0);

      intervalRef.current = window.setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic/worklet error:", err);
      cleanup();
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);

    try {
      nodeRef.current?.port.postMessage('stop');

      // Concatenar Float32 y convertir a Int16
      const totalLen = chunksRef.current.reduce((s, a) => s + a.length, 0);
      const mono = new Float32Array(totalLen);
      let off = 0;
      for (const c of chunksRef.current) { mono.set(c, off); off += c.length; }

      // clamp [-1,1] y map a int16
      const i16 = new Int16Array(mono.length);
      for (let i = 0; i < mono.length; i++) {
        const s = Math.max(-1, Math.min(1, mono[i]));
        i16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      const sr = acRef.current?.sampleRate || 16000;
      const wav = pcm16ToWav(i16, sr);
      const url = URL.createObjectURL(wav);
      onAudioReady(wav, url);
    } catch (e) {
      console.error("Build WAV error:", e);
    } finally {
      // corta el micrófono
      try {
        const tracks = (sourceRef.current?.mediaStream as MediaStream | undefined)?.getTracks?.() || [];
        tracks.forEach((t) => t.stop());
      } catch {}
      cleanup();
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
      <p className="text-xs text-slate-500">Salida: WAV PCM16 mono @ 16 kHz (el backend ya lo adapta a 1150 Hz).</p>
    </div>
  );
}
