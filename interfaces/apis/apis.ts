// Opciones para la API de clasificación de audio. Ruta donde se usa: app/page.tsx
interface ClassifyOptions {
  fileName?: string;
  contentType?: string;      // mime para blobs (default: "audio/wav")
  signal?: AbortSignal;      // para cancelar la petición si hace falta
}

type ApiResult = {
  ok: boolean;
  sample_rate: number;
  window_size: number;
  start_index: number;
  results: { label: string; value: number }[];
  anomaly: number;
};