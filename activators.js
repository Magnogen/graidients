export const clamp = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const sigmoid = (x) => {
  if (x >= 0) return 1 / (1 + Math.exp(-x));
  const ex = Math.exp(x);
  return ex / (1 + ex);
};

export const wrap = (x) => ((x % 1) + 1) % 1;
export const fold = (n) => {
  const x = Math.abs(n % 2);
  return x > 1 ? 2 - x : x;
};
export const valleys = (n) => {
  const x = ((n + 1) % 2 + 2) % 2 - 1;
  return Math.pow(Math.abs(x), 2 / 3);
};

let fractal_octaves = 5;

const normalizeOctaves = (octaves) => {
  const parsed = Number(octaves);
  if (!Number.isFinite(parsed)) return fractal_octaves;
  return Math.max(1, Math.round(parsed));
};

export const setFractalOctaves = (octaves) => {
  fractal_octaves = normalizeOctaves(octaves);
  return fractal_octaves;
};

const hashNoise = (x, seed = 0.5) => {
  const h = Math.sin(x * 12.9898 + seed * 78.233) * 43758.5453123;
  return h - Math.floor(h);
};

export const value_noise = (n) => {
  const scale = 2;
  const pos = scale * n;
  const i = Math.floor(pos);
  const f = pos - i;
  const a = hashNoise(i);
  const b = hashNoise(i + 1);
  return a * (1 - f) + b * f;
};
export const smooth_value_noise = (n) => {
  const scale = 2;
  const pos = scale * n;
  const i = Math.floor(pos);
  const f = pos - i;
  const eased = f * f * (3 - 2 * f);
  const a = hashNoise(i);
  const b = hashNoise(i + 1);
  return a * (1 - eased) + b * eased;
};

const fractal_sample = (func, n, octaves) => {
  const falloff = 2;
  const shift = 437.585453123;
  let value = 0;
  let amplitude = 1 / falloff;
  let x = n;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * func(x);
    x = falloff * x + shift;
    amplitude /= falloff;
  }
  return value;
};

export const fractal_func = (func, octaves = fractal_octaves) => {
  const resolvedOctaves = normalizeOctaves(octaves);
  return (n) => fractal_sample(func, n, resolvedOctaves);
};
export const fractal_sin = (n) => fractal_sample(sin, n, fractal_octaves);
export const fractal_fold = (n) => fractal_sample(fold, n, fractal_octaves);
export const fractal_value_noise = (n) => fractal_sample(value_noise, n * 0.75, fractal_octaves) * 1.75;
export const fractal_smooth_value_noise = (n) => fractal_sample(smooth_value_noise, n * 0.75, fractal_octaves) * 1.75;

export const sin = (n) => 0.5 * (Math.sin(Math.PI * (n - 0.5)) + 1);
export const tan = (n) => clamp(0.5 * (Math.tan(n * 0.9) + 1));
export const invSin = (n) => {
  const s = Math.max(sin(n), 1e-6);
  return clamp(1 / Math.pow(s, 0.2) - 1);
};
export const tanh = (n) => {
  const x = ((n + 2) % 4) - 2;
  return clamp(0.5 * (Math.tanh(x) + 1));
};
export const splitHalf = (n) => (n < 0 ? 0 : 1);
export const steps = (n) => {
  const x = clamp(n);
  return Math.min(1, Math.max(0, Math.floor(8 * x) / 7));
};

export const activators = [sin];

export const activator_options = {
  clamp,
  sigmoid,
  fold,
  sin,
  tan,
  invSin,
  valleys,
  splitHalf,
  steps,
  tanh,
  wrap,
  value_noise,
  smooth_value_noise,
  fractal_sin,
  fractal_fold,
  fractal_value_noise,
  fractal_smooth_value_noise
};