function BPMControl({ bpm, onChange, disabled }) {
  return (
    <div className="bpm-control">
      <label className="bpm-label">
        <span className="bpm-value">{Math.round(bpm)}</span>
        <span className="bpm-unit">BPM</span>
      </label>
      <input
        type="range"
        className="bpm-slider"
        min={40}
        max={200}
        step={1}
        value={bpm}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
      />
      <div className="bpm-range">
        <span>40</span>
        <span>200</span>
      </div>
    </div>
  );
}

export default BPMControl;
