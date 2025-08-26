type ApiResult = {
  ok: boolean;
  sample_rate: number;
  window_size: number;
  start_index: number;
  results: { label: string; value: number }[];
  anomaly: number;
};