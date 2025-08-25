"use client";

import { useRef, useState } from "react";
import { Download, Pause, Play } from "lucide-react";

type Props = {
  audioUrl: string;
  onDownload: () => void;
};

export default function AudioPlayer({ audioUrl, onDownload }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-4 rounded-md border border-slate-200 bg-white p-4">
      <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
      <button
        onClick={toggle}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </button>

      <div className="flex-1">
        <p className="text-sm font-medium">Audio grabado</p>
        <p className="text-xs text-slate-500">Listo para análisis</p>
      </div>

      <button
        onClick={onDownload}
        className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-3 py-2 text-sm text-white hover:bg-teal-700"
      >
        <Download className="h-4 w-4" />
        Descargar
      </button>
    </div>
  );
}