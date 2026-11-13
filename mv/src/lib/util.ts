export const FPS = 30;
export const W = 1920;
export const H = 1080;

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
export const easeInOut = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);

/** 0→1 over [a, b] with smoothstep. */
export const ramp = (t: number, a: number, b: number) => smooth((t - a) / (b - a));

/** Fade in over [a, a+fi], hold, fade out over [b-fo, b]. */
export const window01 = (t: number, a: number, b: number, fi: number, fo: number) =>
  Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b));

export type V3 = [number, number, number];
export const mix3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** Deterministic hash in [0, 1). */
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
};

export const noise1 = (x: number, seed = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash(i + seed * 101.3);
  const b = hash(i + 1 + seed * 101.3);
  return lerp(a, b, f * f * (3 - 2 * f));
};

/** Firelight flicker in roughly [0.6, 1.15]. */
export const flicker = (t: number, seed = 0) =>
  0.78 + 0.22 * noise1(t * 7.3, seed) + 0.12 * noise1(t * 17.1, seed + 3) - 0.08 * noise1(t * 2.1, seed + 7);
