"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Heart,
  Mic,
  Shield,
  Users,
} from "lucide-react";
import Navigation from "./components/Navegation";
import AudioRecorder from "./components/AudioRecorder";
import AudioPlayer from "./components/AudioPlayer";

type ApiResult = {
  ok: boolean;
  sample_rate: number;
  window_size: number;
  start_index: number;
  results: { label: string; value: number }[];
  anomaly: number;
};

export default function Page() {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiResult, setApiResult] = useState<ApiResult | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const API_BASE = process.env.NEXT_PUBLIC_ESTETO_API || "";

  async function classifyFile(file: File | Blob) {
    const fd = new FormData();
    // El backend espera el campo 'file'
    // Si es Blob (grabación), le damos un nombre por si algún proxy lo requiere.
    const namedFile =
      file instanceof File ? file : new File([file], "recording.wav", { type: file.type || "audio/wav" });
    fd.append("file", namedFile);

    setIsSending(true);
    setApiError(null);
    setApiResult(null);

    try {
      const res = await fetch(`${API_BASE}/classify`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`API ${res.status}: ${msg || "Error"}`);
      }
      const data = (await res.json()) as ApiResult;
      setApiResult(data);
    } catch (e: unknown) {
      setApiError((e as Error)?.message || "Fallo al enviar el audio");
    } finally {
      setIsSending(false);
    }
  }

  // 1) Subir archivo: envía automáticamente al seleccionar
  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith("audio/")) {
      setApiError("Selecciona un archivo de audio válido.");
      return;
    }
    // Vista previa local
    const url = URL.createObjectURL(f);
    setAudioBlob(f);
    setAudioUrl(url);

    // Enviar en caliente
    await classifyFile(f);
  };

  // 2) Grabación: guarda blob y vista previa
  const onAudioReady = (b: Blob, url: string) => {
    setAudioBlob(b);
    setAudioUrl(url);
    // Si quieres enviar automáticamente también desde la grabación,
    // descomenta la siguiente línea:
    // classifyFile(b);
  };

  const onDownload = () => {
    if (!audioBlob) return;
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ritmo-cardiaco-${new Date().toISOString().slice(0, 10)}.wav`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const conditions = [
    {
      title: "Arritmias Cardíacas",
      desc: "Alteraciones del ritmo (irregular, muy rápido o muy lento).",
      symptoms: ["Palpitaciones", "Mareos", "Fatiga", "Dificultad para respirar"],
      icon: "💓",
    },
    {
      title: "Enfermedad Coronaria",
      desc: "Estrechamiento de arterias coronarias que nutren el corazón.",
      symptoms: ["Dolor en el pecho", "Falta de aire", "Fatiga", "Náuseas"],
      icon: "🫀",
    },
    {
      title: "Insuficiencia Cardíaca",
      desc: "El corazón no bombea lo suficiente para el cuerpo.",
      symptoms: ["Hinchazón en piernas", "Fatiga extrema", "Tos", "Disnea"],
      icon: "💔",
    },
    {
      title: "Hipertensión Arterial",
      desc: "Presión elevada que daña arterias y eleva riesgos.",
      symptoms: ["Cefalea", "Visión borrosa", "Mareos", "Epistaxis"],
      icon: "📈",
    },
  ];

  // Helper UI para resultados
  function renderResults() {
    if (isSending) {
      return (
        <div className="mt-4 rounded-md border border-slate-200 bg-white p-4 text-sm">
          Enviando audio… procesando modelo…
        </div>
      );
    }
    if (apiError) {
      return (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" />
          <span>{apiError}</span>
        </div>
      );
    }
    if (!apiResult) return null;

    const present = apiResult.results.find((r) => /present/i.test(r.label));
    const absent = apiResult.results.find((r) => /absent/i.test(r.label));
    const presentPct = present ? (present.value * 100).toFixed(1) : "0.0";
    const absentPct = absent ? (absent.value * 100).toFixed(1) : "0.0";

    return (
      <div className="mt-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-2 text-sm text-slate-600">
          <span className="font-medium">SR:</span> {apiResult.sample_rate} Hz ·{" "}
          <span className="font-medium">Ventana:</span> {apiResult.window_size} muestras
        </div>
        <div className="space-y-3">
          {apiResult.results.map((r, i) => (
            <div key={i}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{r.label}</span>
                <span className="font-semibold">{(r.value * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded bg-slate-200">
                <div
                  className={`h-2 ${
                    /present/i.test(r.label) ? "bg-orange-500" : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, r.value * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 text-sm">
          {present && Number(presentPct) >= 50 ? (
            <div className="inline-flex items-center gap-2 rounded-md bg-orange-50 px-2 py-1 text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              Posible soplo detectado ({presentPct}%)
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-md bg-green-50 px-2 py-1 text-green-700">
              ✅ Sonido normal ({absentPct}%)
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navigation />

      {/* Hero */}
      <header id="inicio" className="mt-16 bg-gradient-to-br from-blue-600 to-teal-600 py-20 text-white">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-white/10 p-4">
              <Heart className="h-16 w-16" />
            </div>
          </div>
          <h1 className="mb-3 text-4xl font-bold">Salud Cardíaca</h1>
          <p className="mx-auto max-w-3xl text-lg/7 opacity-90">
            Graba o sube un audio; lo enviamos a tu modelo en la nube y te devolvemos el resultado.
          </p>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4">
        {/* Intro */}
        <section className="mt-12 mb-10">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-2xl font-semibold">Cuidando tu Salud Cardiovascular</h2>
            <p className="text-lg text-slate-600">
              Las enfermedades cardiovasculares son la principal causa de muerte a nivel mundial. La detección temprana y
              el cuidado preventivo son clave.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section id="estadisticas" className="mb-12">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/10 text-blue-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-semibold text-blue-600">17.9M</h3>
              <p className="text-slate-600">Muertes anuales por enfermedades cardiovasculares</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600/10 text-teal-600">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-semibold text-teal-600">80%</h3>
              <p className="text-slate-600">Prevenibles con hábitos saludables</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-600/10 text-cyan-600">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-semibold text-cyan-600">520M</h3>
              <p className="text-slate-600">Personas viven con enfermedades cardíacas</p>
            </div>
          </div>
        </section>

        {/* Conditions */}
        <section id="condiciones" className="mb-12">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold">Principales Problemas Cardíacos</h2>
            <p className="mx-auto mt-1 max-w-3xl text-slate-600">
              Conoce los síntomas y características de las condiciones más comunes.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {conditions.map((c, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-start gap-3">
                  <div className="text-3xl">{c.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold">{c.title}</h3>
                    <p className="text-slate-600">{c.desc}</p>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-blue-600">Síntomas principales:</h4>
                  <ul className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                    {c.symptoms.map((s, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-teal-600" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Prevention */}
        <section id="prevencion" className="mb-12">
          <div className="rounded-xl bg-slate-100 p-6">
            <h2 className="mb-6 text-center text-2xl font-semibold">Prevención y Cuidados</h2>
            <div className="grid gap-6 md:grid-cols-4">
              {[
                { icon: "🏃‍♂️", t: "Ejercicio Regular", d: "≥ 150 min/semana de actividad moderada" },
                { icon: "🥗", t: "Dieta Saludable", d: "Frutas, verduras y baja en grasas" },
                { icon: "🚭", t: "No Fumar", d: "Evitar tabaco y humo" },
                { icon: "🩺", t: "Chequeos", d: "Monitorea presión y colesterol" },
              ].map((p, idx) => (
                <div key={idx} className="text-center">
                  <div className="mb-2 text-3xl">{p.icon}</div>
                  <h3 className="font-medium">{p.t}</h3>
                  <p className="text-sm text-slate-600">{p.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Audio */}
        <section id="audio" className="mb-12">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/10 text-blue-600">
                <Mic className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-semibold">Grabación de Audio Cardíaco</h2>
              <p className="mx-auto mt-1 max-w-2xl text-slate-600">
                Graba o sube un audio del ritmo cardíaco; lo enviamos a tu API y mostramos el resultado.
              </p>
            </div>

            <div className="mx-auto max-w-md">
              <div className="mb-4 rounded-md bg-slate-100 p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <BookOpen className="h-4 w-4" /> Instrucciones:
                </h3>
                <ol className="list-decimal space-y-1 pl-6 text-sm text-slate-600">
                  <li>Ambiente silencioso.</li>
                  <li>Micrófono cerca del pecho/estetoscopio.</li>
                  <li>Graba ≥ 30s.</li>
                  <li>Comparte con tu médico.</li>
                </ol>
              </div>

              <div className="flex flex-col gap-6">
                <AudioRecorder onAudioReady={onAudioReady} />

                {/* Subir y ENVIAR automáticamente */}
                <div className="text-center">
                  <div className="mb-3 flex items-center gap-4">
                    <span className="h-px flex-1 bg-slate-200" />
                    <span className="text-sm text-slate-500">o</span>
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="audio/*"
                    onChange={onUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700"
                    disabled={isSending}
                  >
                    {isSending ? "Enviando..." : "Subir Archivo de Audio"}
                  </button>
                </div>

                {/* Opcional: botón Analizar para una grabación ya hecha */}
                {audioBlob && !isSending && (
                  <button
                    onClick={() => classifyFile(audioBlob)}
                    className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                  >
                    Analizar grabación actual
                  </button>
                )}

                {audioUrl && (
                  <div className="mt-2">
                    <AudioPlayer audioUrl={audioUrl} onDownload={onDownload} />
                  </div>
                )}

                {renderResults()}
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mb-8">
          <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-red-600 font-semibold">Aviso Médico Importante</h3>
              <p className="text-sm text-slate-600">
                Esta información es educativa y no sustituye el consejo médico profesional. Si tienes síntomas,
                busca atención médica inmediata.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-100 py-8">
        <div className="container mx-auto max-w-6xl px-4 text-center text-slate-600">
          <div className="mb-3 flex justify-center text-blue-600">
            <Heart className="h-8 w-8" />
          </div>
          © 2024 Centro de Salud Cardíaca.
        </div>
      </footer>
    </div>
  );
}
