// public/pcm-recorder.worklet.js
class PCMRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._isRecording = false;
    this.port.onmessage = (e) => {
      if (e.data === 'start') this._isRecording = true;
      if (e.data === 'stop')  this._isRecording = false;
    };
  }
  process(inputs) {
    if (!this._isRecording) return true;
    const input = inputs[0];
    if (input && input[0]) {
      // Mono: canal 0
      const ch0 = input[0];
      // Copiamos para no soltar una view que se reutiliza
      this.port.postMessage(ch0.slice(0));
    }
    return true; // keep alive
  }
}
registerProcessor('pcm-recorder-processor', PCMRecorderProcessor);