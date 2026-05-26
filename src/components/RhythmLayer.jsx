import { LAYER_COLORS } from './RhythmVisualizer';

const FREQUENCIES = [880, 660, 587, 440, 554, 740, 494, 330];
const INSTRUMENTS = ['Kick', 'Snare', 'Hi-Hat', 'Tom', 'Clap', 'Rim', 'Shaker', 'Bell'];

function RhythmLayer({ layer, index, onUpdate, onRemove, canRemove }) {
  const color = LAYER_COLORS[index % LAYER_COLORS.length];

  return (
    <div className={`rhythm-layer ${layer.muted ? 'muted' : ''}`}>
      <div className="layer-header">
        <span className="layer-dot" style={{ backgroundColor: color }} />
        <span className="layer-name">{INSTRUMENTS[index % INSTRUMENTS.length]}</span>
        <button
          className={`layer-mute-btn ${layer.muted ? 'is-muted' : ''}`}
          onClick={() => onUpdate(layer.id, { muted: !layer.muted })}
          title={layer.muted ? 'Unmute' : 'Mute'}
        >
          {layer.muted ? '◌' : '◉'}
        </button>
        {canRemove && (
          <button
            className="layer-remove-btn"
            onClick={() => onRemove(layer.id)}
            title="Remove layer"
          >
            ×
          </button>
        )}
      </div>
      <div className="layer-controls">
        <label className="layer-beats-label">
          <span className="label-text">Beats</span>
          <span className="label-value">{layer.beats}</span>
        </label>
        <input
          type="range"
          className="layer-beats-slider"
          min={2}
          max={16}
          step={1}
          value={layer.beats}
          onChange={(e) => onUpdate(layer.id, { beats: Number(e.target.value) })}
        />
      </div>
      <div className="layer-preview">
        {Array.from({ length: layer.beats }, (_, i) => (
          <span
            key={i}
            className="beat-marker"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
}

export default RhythmLayer;
export { FREQUENCIES };
