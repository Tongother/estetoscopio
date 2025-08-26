class PCMRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._recording = false;
    this.port.onmessage = (ev) => {
      if (ev.data === "start") this._recording = true;
      if (ev.data === "stop") this._recording = false;
    };
  }
  process(inputs) {
    if (!this._recording) return true;
    const input = inputs[0];
    if (input && input[0]) {
      // canal 0 mono
      const ch0 = input[0];
      // Copiar a un buffer propio antes de postMessage (evitas soltar referencias internas)
      const copy = new Float32Array(ch0.length);
      copy.set(ch0);
      this.port.postMessage(copy, [copy.buffer]); // transfiero el ArrayBuffer
    }
    return true;
  }
}
registerProcessor("pcm-recorder-processor", PCMRecorderProcessor);