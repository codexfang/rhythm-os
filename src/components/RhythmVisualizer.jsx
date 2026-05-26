import { useRef, useEffect, useCallback } from 'react';
import { phaseToAngle, polarToCartesian } from '../utils/math';

const LAYER_COLORS = [
  '#ff6b6b', '#4ecdc4', '#ffd93d', '#6bcb77',
  '#a66cff', '#ff9ff3', '#54a0ff', '#ff6348',
];

function RhythmVisualizer({ phaseData, layers, isPlaying }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const phaseRef = useRef(phaseData);
  const layersRef = useRef(layers);
  const playingRef = useRef(isPlaying);

  phaseRef.current = phaseData;
  layersRef.current = layers;
  playingRef.current = isPlaying;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const cx = w / 2;
    const cy = h / 2;
    const maxRadius = Math.min(w, h) * 0.4;
    const layers = layersRef.current;
    const currentPhase = phaseRef.current;
    const isPlaying = playingRef.current;

    ctx.clearRect(0, 0, w, h);

    if (layers.length === 0) {
      ctx.fillStyle = '#666';
      ctx.font = '14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Add a rhythm layer to begin', cx, cy + 40);
      return;
    }

    const layerRadius = maxRadius / Math.max(layers.length, 1);
    layers.forEach((layer, index) => {
      const radius = layerRadius * (index + 1) * 0.85;
      const color = LAYER_COLORS[index % LAYER_COLORS.length];
      const phase = currentPhase[layer.id];
      const totalBeats = layer.beats;

      ctx.save();

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

      if (isPlaying && phase) {
        const orbAngle = phaseToAngle(phase.phase);
        const orbPos = polarToCartesian(cx, cy, radius, orbAngle);

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
