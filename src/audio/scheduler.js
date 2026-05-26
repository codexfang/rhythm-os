import { scheduleClick, scheduleAccentClick } from './soundEngine';
import { lcmMultiple } from '../utils/math';

export class Scheduler {
  constructor(audioCtx) {
    this.audioCtx = audioCtx;
    this.bpm = 120;
    this.layers = [];
    this.lcm = 1;
    this.subdivisionDuration = 60 / this.bpm;
    this.isRunning = false;
    this.timerId = null;
    this.nextEventTime = 0;
    this.currentSubdivisionIndex = 0;
    this.onPhaseUpdate = null;
  }

  setBpm(bpm) {
    const oldDuration = this.subdivisionDuration;
    this.bpm = bpm;
    this.subdivisionDuration = 60 / bpm;

    if (this.isRunning) {
      const currentTime = this.audioCtx.currentTime;
      const lastTime = this.nextEventTime - oldDuration;
      const withinSubPhase = Math.max(0, Math.min(1,
        (currentTime - lastTime) / oldDuration
      ));
      this.nextEventTime = currentTime + (1 - withinSubPhase) * this.subdivisionDuration;
    }
  }

  setLayers(layers) {
    this.layers = layers;
    const beatCounts = layers.map(l => l.beats);
    this.lcm = beatCounts.length > 0 ? lcmMultiple(beatCounts) : 1;
  }

  start() {
    if (this.isRunning) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    this.isRunning = true;
    this.currentSubdivisionIndex = 0;
    this.nextEventTime = this.audioCtx.currentTime;
    this.scheduleLoop();
  }

  stop() {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  reset() {
    this.stop();
    this.currentSubdivisionIndex = 0;
    this.nextEventTime = 0;
    if (this.onPhaseUpdate) {
      this.onPhaseUpdate({});
    }
  }

  scheduleLoop() {
    if (!this.isRunning) return;

    const currentTime = this.audioCtx.currentTime;
    const lookAhead = 0.2;

    while (this.nextEventTime < currentTime + lookAhead) {
      for (const layer of this.layers) {
        if (layer.muted) continue;
        const step = this.lcm / layer.beats;
        if (this.currentSubdivisionIndex % step === 0) {
          const isFirstBeat = this.currentSubdivisionIndex === 0;
          if (isFirstBeat) {
            scheduleAccentClick(this.audioCtx, this.nextEventTime, layer.frequency, layer.gain ?? 0.3);
          } else {
            scheduleClick(this.audioCtx, this.nextEventTime, layer.frequency, layer.gain ?? 0.2);
          }
        }
      }

      this.currentSubdivisionIndex = (this.currentSubdivisionIndex + 1) % this.lcm;
      this.nextEventTime += this.subdivisionDuration;
    }

    this.emitPhase(currentTime);
    this.timerId = setTimeout(() => this.scheduleLoop(), 50);
  }

  emitPhase(currentTime) {
    if (!this.onPhaseUpdate) return;

    const lastIndex = ((this.currentSubdivisionIndex - 1) % this.lcm + this.lcm) % this.lcm;
    const lastTime = this.nextEventTime - this.subdivisionDuration;
    const withinSubPhase = Math.max(0, Math.min(1,
      (currentTime - lastTime) / this.subdivisionDuration
    ));
    const cyclePhase = ((lastIndex + withinSubPhase) % this.lcm) / this.lcm;

    const phaseData = {};
    for (const layer of this.layers) {
      const beatIndex = Math.floor(cyclePhase * layer.beats) % layer.beats;
      const phase = (cyclePhase * layer.beats) % 1;
      phaseData[layer.id] = {
        phase: cyclePhase,
        beatIndex,
        totalBeats: layer.beats,
        layerPhase: phase,
      };
    }
    this.onPhaseUpdate(phaseData);
  }

  getPhaseEstimate(currentTime) {
    const lastIndex = ((this.currentSubdivisionIndex - 1) % this.lcm + this.lcm) % this.lcm;
    const lastTime = this.nextEventTime - this.subdivisionDuration;
    const withinSubPhase = Math.max(0, Math.min(1,
      (currentTime - lastTime) / this.subdivisionDuration
    ));
    const cyclePhase = ((lastIndex + withinSubPhase) % this.lcm) / this.lcm;

    const result = {};
    for (const layer of this.layers) {
      const beatIndex = Math.floor(cyclePhase * layer.beats) % layer.beats;
      result[layer.id] = {
        phase: cyclePhase,
        beatIndex,
        totalBeats: layer.beats,
        layerPhase: (cyclePhase * layer.beats) % 1,
      };
    }
    return result;
  }
}
