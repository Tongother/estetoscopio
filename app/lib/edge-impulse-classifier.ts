const API_BASE = process.env.NEXT_PUBLIC_ESTETO_API || "";

/**
 * Envía un File/Blob a /classify y devuelve el resultado tipado.
 * No maneja estados de UI: solo lanza errores o retorna datos.
 */
export async function classifyAudio( file: File | Blob, { fileName = "recording.wav", contentType = "audio/wav", signal }: ClassifyOptions): Promise<ApiResult> {
  
  if (!API_BASE) throw new Error("Falta apiBase.");

  const fd = new FormData();
  const namedFile = file instanceof File ? file : new File([file], fileName, { type: file.type || contentType });
  
  fd.append("file", namedFile);

  const res = await fetch(`${API_BASE}/classify`, {
    method: "POST",
    body: fd,
    signal,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${msg || "Error"}`);
  }

  // Si tu backend devuelve un envoltorio, ajusta aquí
  const data = (await res.json()) as ApiResult;
  return data;
}