import BPMControl from './BPMControl';

const PRESETS = [
  { name: '3:2', label: '3:2', layers: [{ beats: 3 }, { beats: 2 }] },
  { name: '4:3', label: '4:3', layers: [{ beats: 4 }, { beats: 3 }] },
  { name: '5:4', label: '5:4', layers: [{ beats: 5 }, { beats: 4 }] },
  { name: '5:3', label: '5:3', layers: [{ beats: 5 }, { beats: 3 }] },
];

function Controls({
  isPlaying,
  onPlay,
  onPause,
  onReset,
  bpm,
  onBpmChange,
  onPreset,
  onExport,
  onImport,
}) {
  return (
    <div className="controls-panel">
      <div className="transport-controls">
        {isPlaying ? (
          <button className="control-btn pause-btn" onClick={onPause} title="Pause">
            <span className="btn-icon">■</span>
            <span className="btn-label">Pause</span>
          </button>
        ) : (
          <button className="control-btn play-btn" onClick={onPlay} title="Play">
            <span className="btn-icon">▶</span>
            <span className="btn-label">Play</span>
          </button>
        )}
        <button className="control-btn reset-btn" onClick={onReset} title="Reset">
          <span className="btn-icon">↺</span>
          <span className="btn-label">Reset</span>
        </button>
      </div>

      <BPMControl bpm={bpm} onChange={onBpmChange} />

      <div className="preset-controls">
        <span className="preset-label">Presets</span>
        <div className="preset-buttons">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              className="preset-btn"
              onClick={() => onPreset(preset.layers)}
              title={`${preset.name} polyrhythm`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="io-controls">
        <button className="io-btn" onClick={onExport} title="Export configuration">
          <span className="btn-icon">↓</span>
          <span className="btn-label">Export</span>
        </button>
        <button className="io-btn" onClick={onImport} title="Import configuration">
          <span className="btn-icon">↑</span>
          <span className="btn-label">Import</span>
        </button>
      </div>
    </div>
  );
}

export default Controls;
