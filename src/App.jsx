import { useState, useRef, useEffect, useCallback } from 'react';
import RhythmVisualizer from './components/RhythmVisualizer';
import Controls from './components/Controls';
import RhythmLayer from './components/RhythmLayer';
import { Scheduler } from './audio/scheduler';
import { getAudioContext, resumeAudioContext } from './audio/soundEngine';
import { saveState, loadState, exportConfig, importConfig } from './utils/storage';
import { FREQUENCIES } from './components/RhythmLayer';
import './index.css';

let nextLayerId = 1;
const createLayer = (beats = 4) => ({
  id: nextLayerId++,
  beats,
  muted: false,
  frequency: FREQUENCIES[(nextLayerId - 2) % FREQUENCIES.length],
});

const DEFAULT_LAYERS = [
  createLayer(3),
  createLayer(2),
];

function App() {
  const [layers, setLayers] = useState(() => {
    const saved = loadState();
    if (saved && saved.layers && saved.layers.length > 0) {
      nextLayerId = Math.max(...saved.layers.map(l => l.id), 0) + 1;
      return saved.layers;
    }
    return DEFAULT_LAYERS.map(l => ({ ...l }));
  });
  const [bpm, setBpmState] = useState(() => {
    const saved = loadState();
    return saved?.bpm ?? 120;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [phaseData, setPhaseData] = useState({});

  const schedulerRef = useRef(null);
  const layersRef = useRef(layers);
  const bpmRef = useRef(bpm);

  layersRef.current = layers;
  bpmRef.current = bpm;

  useEffect(() => {
    saveState({ layers, bpm });
  }, [layers, bpm]);

  useEffect(() => {
    const audioCtx = getAudioContext();
    const scheduler = new Scheduler(audioCtx);
    scheduler.setBpm(bpm);
    scheduler.setLayers(layers);
    scheduler.onPhaseUpdate = (data) => {
      setPhaseData({ ...data });
    };
    schedulerRef.current = scheduler;

    return () => {
      scheduler.stop();
    };
  }, []);

  const syncScheduler = useCallback(() => {
    const s = schedulerRef.current;
    if (!s) return;
    s.setBpm(bpmRef.current);
    s.setLayers(layersRef.current);
  }, []);

  useEffect(() => {
    syncScheduler();
  }, [layers, syncScheduler]);

  const handlePlay = useCallback(async () => {
    const ctx = await resumeAudioContext();
    const s = schedulerRef.current;
    if (!s) return;
    s.setBpm(bpm);
    s.setLayers(layers);
    s.start();
    setIsPlaying(true);
  }, [bpm, layers]);

  const handlePause = useCallback(() => {
    const s = schedulerRef.current;
    if (!s) return;
    s.stop();
    setIsPlaying(false);
  }, []);

  const handleReset = useCallback(() => {
    const s = schedulerRef.current;
    if (!s) return;
    s.stop();
    s.setBpm(bpm);
    s.setLayers(layers);
    setIsPlaying(false);
    setPhaseData({});
  }, [bpm, layers]);

  const handleBpmChange = useCallback((newBpm) => {
    setBpmState(newBpm);
    if (schedulerRef.current) {
      schedulerRef.current.setBpm(newBpm);
    }
  }, []);

  const handleLayerUpdate = useCallback((id, updates) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  }, []);

  const handleLayerRemove = useCallback((id) => {
    setLayers(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(l => l.id !== id);
    });
  }, []);

  const handleAddLayer = useCallback(() => {
    setLayers(prev => {
      if (prev.length >= 8) return prev;
      const existingIds = new Set(prev.map(l => l.id));
      let newId = nextLayerId;
      while (existingIds.has(newId)) newId++;
      nextLayerId = newId + 1;
      return [...prev, { id: newId, beats: 4, muted: false, frequency: FREQUENCIES[(newId - 1) % FREQUENCIES.length] }];
    });
  }, []);

  const handlePreset = useCallback((presetLayers) => {
    handlePause();
    const newLayers = presetLayers.map((pl, i) => ({
      id: nextLayerId++,
      beats: pl.beats,
      muted: false,
      frequency: FREQUENCIES[i % FREQUENCIES.length],
    }));
    setLayers(newLayers);
    setPhaseData({});
  }, [handlePause]);

  const handleExport = useCallback(() => {
    const json = exportConfig(layers, bpm);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rhythm-os-config.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [layers, bpm]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const config = importConfig(ev.target?.result);
        if (config) {
          handlePause();
          const newLayers = config.layers.map((pl, i) => ({
            id: nextLayerId++,
            beats: pl.beats,
            muted: pl.muted ?? false,
            frequency: FREQUENCIES[i % FREQUENCIES.length],
          }));
          setLayers(newLayers.length > 0 ? newLayers : DEFAULT_LAYERS.map(l => ({ ...l })));
          if (config.bpm) {
            setBpmState(config.bpm);
          }
          setPhaseData({});
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [handlePause]);

  return (
    <div className="app">
      <div className="app-main">
        <RhythmVisualizer
          phaseData={phaseData}
          layers={layers}
          isPlaying={isPlaying}
        />
      </div>
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="app-title">Rhythm OS</h1>
          <span className="app-subtitle">Polyrhythm Generator</span>
        </div>
        <div className="layers-section">
          <div className="layers-header">
            <h2>Rhythms</h2>
            <button
              className="add-layer-btn"
              onClick={handleAddLayer}
              disabled={layers.length >= 8}
              title="Add rhythm layer"
            >
              + Add Layer
            </button>
          </div>
          <div className="layers-list">
            {layers.map((layer, index) => (
              <RhythmLayer
                key={layer.id}
                layer={layer}
                index={index}
                onUpdate={handleLayerUpdate}
                onRemove={handleLayerRemove}
                canRemove={layers.length > 1}
              />
            ))}
          </div>
        </div>
        <Controls
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onPause={handlePause}
          onReset={handleReset}
          bpm={bpm}
          onBpmChange={handleBpmChange}
          onPreset={handlePreset}
          onExport={handleExport}
          onImport={handleImport}
        />
      </aside>
    </div>
  );
}

export default App;
