const STORAGE_KEY = 'rhythm-os-state';

export const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
  }
};

export const loadState = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

export const clearState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
  }
};

const PRESETS_KEY = 'rhythm-os-presets';

export const savePreset = (name, layers, bpm) => {
  try {
    const presets = loadPresets();
    presets[name] = { layers, bpm };
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    return true;
  } catch (e) {
    return false;
  }
};

export const loadPresets = () => {
  try {
    const data = localStorage.getItem(PRESETS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
};

export const deletePreset = (name) => {
  try {
    const presets = loadPresets();
    delete presets[name];
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    return true;
  } catch (e) {
    return false;
  }
};

export const exportConfig = (layers, bpm) => {
  const config = { bpm, layers: layers.map(l => ({ beats: l.beats, muted: l.muted })) };
  return JSON.stringify(config, null, 2);
};

export const importConfig = (jsonStr) => {
  try {
    const config = JSON.parse(jsonStr);
    if (!config.bpm || !Array.isArray(config.layers)) return null;
    return config;
  } catch (e) {
    return null;
  }
};
