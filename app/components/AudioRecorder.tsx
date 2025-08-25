"use client";

import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";

type Props = {
  onAudioReady: (audioBlob: Blob, audioUrl: string) => void;
};

export default function AudioRecorder({ onAudioReady }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        onAudioReady(audioBlob, audioUrl);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      intervalRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    }
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60)
      .toString()
      .padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-white transition ${
            isRecording
              ? "bg-red-600 animate-[pulse-ring_1.5s_infinite]"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          <Mic className="h-5 w-5" />
          {isRecording ? "Detener Grabación" : "Grabar Audio"}
        </button>

        {isRecording && (
          <div className="flex items-center gap-2 font-mono text-red-600">
            <span className="h-3 w-3 rounded-full bg-red-600 animate-pulse" />
            {fmt(recordingTime)}
          </div>
        )}
      </div>
    </div>
  );
}