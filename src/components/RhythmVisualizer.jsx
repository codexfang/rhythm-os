import { useRef, useEffect, useCallback } from 'react';
import { phaseToAngle, polarToCartesian, lcmMultiple } from '../utils/math';

const LAYER_COLORS = [
  '#ff6b6b', '#4ecdc4', '#ffd93d', '#6bcb77',
  '#a66cff', '#ff9ff3', '#54a0ff', '#ff6348',
];

function RhythmVisualizer({ phaseData, layers, isPlaying, bpm }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const phaseRef = useRef(phaseData);
  const layersRef = useRef(layers);
  const playingRef = useRef(isPlaying);
  const bpmRef = useRef(bpm);
  const lastPhaseTimeRef = useRef(0);
  const lastCyclePhaseRef = useRef(0);
  const trailRef = useRef([]);

  phaseRef.current = phaseData;
  layersRef.current = layers;
  playingRef.current = isPlaying;
  bpmRef.current = bpm;

  useEffect(() => {
    for (const id in phaseData) {
      lastCyclePhaseRef.current = phaseData[id].phase;
      lastPhaseTimeRef.current = performance.now();
      break;
    }
  }, [phaseData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    return () => observer.disconnect();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    const cx = w / 2;
    const cy = h / 2;
    const maxRadius = Math.min(w, h) * 0.4;
    const layers = layersRef.current;
    const currentPhase = phaseRef.current;
    const isPlaying = playingRef.current;
    const bpmVal = bpmRef.current;

    ctx.clearRect(0, 0, w, h);

    if (layers.length === 0) {
      ctx.fillStyle = '#666';
      ctx.font = '14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Add a rhythm layer to begin', cx, cy + 40);
      return;
    }

    let currentCyclePhase = null;
    if (isPlaying) {
      const activeBeats = layers.filter(l => !l.muted).map(l => l.beats);
      if (activeBeats.length > 0) {
        const lcm = lcmMultiple(activeBeats);
        const elapsed = (performance.now() - lastPhaseTimeRef.current) / 1000;
        const period = lcm * (60 / bpmVal);
        const advance = period > 0 ? elapsed / period : 0;
        currentCyclePhase = (lastCyclePhaseRef.current + advance) % 1;
      }
    }

    const layerRadius = maxRadius / Math.max(layers.length, 1);
    const trail = trailRef.current;

    layers.forEach((layer, index) => {
      const radius = layerRadius * (index + 1) * 0.85;
      const color = LAYER_COLORS[index % LAYER_COLORS.length];
      const phase = currentPhase[layer.id];
      const totalBeats = layer.beats;

      ctx.save();

      const orbitAngle = isPlaying && currentCyclePhase !== null
        ? phaseToAngle(currentCyclePhase)
        : null;

      if (orbitAngle !== null && !layer.muted) {
        const orbPos = polarToCartesian(cx, cy, radius, orbitAngle);
        trail.push({ x: orbPos.x, y: orbPos.y, life: 1 });

        ctx.beginPath();
        ctx.arc(orbPos.x, orbPos.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.fill();
      }

      for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].life -= 0.035;
        if (trail[i].life <= 0) {
          trail.splice(i, 1);
        }
      }

      for (const t of trail) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, 1.5 * t.life, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = t.life * 0.25;
        ctx.fill();
      }

      ctx.globalAlpha = layer.muted ? 0.25 : 1;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = (layer.muted ? 0.1 : 0.3);
      ctx.stroke();

      const dotRadius = Math.max(3, 8 - layers.length * 0.5);
      const activeRadius = dotRadius * 2.5;

      for (let b = 0; b < totalBeats; b++) {
        const angle = phaseToAngle(b / totalBeats);
        const pos = polarToCartesian(cx, cy, radius, angle);
        const isActive = phase && phase.beatIndex === b;

        if (isActive) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, activeRadius, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.globalAlpha = layer.muted ? 0.2 : 0.9;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(pos.x, pos.y, activeRadius * 2, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(
            pos.x, pos.y, activeRadius * 0.5,
            pos.x, pos.y, activeRadius * 2
          );
          gradient.addColorStop(0, color + '40');
          gradient.addColorStop(1, color + '00');
          ctx.fillStyle = gradient;
          ctx.globalAlpha = layer.muted ? 0.3 : 0.6;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(cx, cy, radius, angle - 0.05, angle + 0.05);
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.globalAlpha = layer.muted ? 0.2 : 0.5;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.globalAlpha = layer.muted ? 0.1 : 0.35;
          ctx.fill();
        }
      }

      if (isPlaying && orbitAngle !== null) {
        const orbPos = polarToCartesian(cx, cy, radius, orbitAngle);

        ctx.beginPath();
        ctx.arc(orbPos.x, orbPos.y, dotRadius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = layer.muted ? 0.3 : 0.9;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(orbPos.x, orbPos.y, dotRadius * 3, 0, Math.PI * 2);
        const orbGlow = ctx.createRadialGradient(
          orbPos.x, orbPos.y, 0,
          orbPos.x, orbPos.y, dotRadius * 3
        );
        orbGlow.addColorStop(0, color + '60');
        orbGlow.addColorStop(1, color + '00');
        ctx.fillStyle = orbGlow;
        ctx.globalAlpha = layer.muted ? 0.2 : 0.4;
        ctx.fill();
      }

      ctx.restore();
    });

    animFrameRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [draw]);

  return (
    <div className="visualizer-container">
      <canvas ref={canvasRef} className="rhythm-canvas" />
      {!isPlaying && (
        <div className="visualizer-overlay">
          <span className="play-hint">Press Play to start</span>
        </div>
      )}
    </div>
  );
}

export default RhythmVisualizer;
export { LAYER_COLORS };
