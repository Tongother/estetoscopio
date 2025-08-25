// lib/esteto.ts
export async function classifyHeartAudio(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("https://backesteto.onrender.com/classify", {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error("API error");
  return res.json() as Promise<{
    ok: boolean;
    sample_rate: number;
    window_size: number;
    start_index: number;
    results: { label: string; value: number }[];
    anomaly: number;
  }>;
}