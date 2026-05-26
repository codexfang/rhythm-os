let audioCtx = null;

export const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
};

export const resumeAudioContext = async () => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  return ctx;
};

export const scheduleClick = (ctx, time, frequency, gain = 0.25) => {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, time);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(frequency * 4, 8000), time);

  gainNode.gain.setValueAtTime(gain, time);
  gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.08);
};

export const scheduleAccentClick = (ctx, time, frequency, gain = 0.4) => {
  scheduleClick(ctx, time, frequency, gain);
};
