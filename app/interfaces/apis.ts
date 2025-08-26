interface ClassifyOptions {
  fileName?: string;
  contentType?: string;      // mime para blobs (default: "audio/wav")
  signal?: AbortSignal;      // para cancelar la petición si hace falta
}