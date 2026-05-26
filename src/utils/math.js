export const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

export const lcm = (a, b) => (a * b) / gcd(a, b);

export const lcmMultiple = (numbers) => numbers.reduce(lcm, 1);

export const beatToAngle = (beat, totalBeats) => {
  const phase = totalBeats > 0 ? beat / totalBeats : 0;
  return phase * Math.PI * 2 - Math.PI / 2;
};

export const phaseToAngle = (phase) => phase * Math.PI * 2 - Math.PI / 2;

export const polarToCartesian = (cx, cy, radius, angle) => ({
  x: cx + radius * Math.cos(angle),
  y: cy + radius * Math.sin(angle),
});

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
