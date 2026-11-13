import {V3, lerp, mix3} from './util';

/** Camera + grade for one frame. Image-space coordinates are 0..1 from the top-left. */
export type Look = {
  zoom: number;
  cx: number;
  cy: number;
  /** Parallax offset (image units) applied relative to the focal depth. */
  px: number;
  py: number;
  focus: number;
  exposure: number;
  contrast: number;
  sat: number;
  tint: V3;
  lift: V3;
  bloom: number;
  bloomThresh: number;
  vignette: number;
  light: {x: number; y: number; r: number; amt: number; color: V3};
};

export const BASE: Look = {
  zoom: 1.08,
  cx: 0.5,
  cy: 0.5,
  px: 0,
  py: 0,
  focus: 0.35,
  exposure: 1,
  contrast: 1.04,
  sat: 1,
  tint: [1, 1, 1],
  lift: [0, 0, 0],
  bloom: 0.35,
  bloomThresh: 0.55,
  vignette: 0.55,
  light: {x: 0.5, y: 0.5, r: 0.3, amt: 0, color: [1, 0.6, 0.25]},
};

export type LookPatch = Partial<Omit<Look, 'light'>> & {light?: Partial<Look['light']>};

export const mk = (p: LookPatch = {}, base: Look = BASE): Look => ({
  ...base,
  ...p,
  light: {...base.light, ...(p.light ?? {})},
});

export const mixLook = (a: Look, b: Look, t: number): Look => ({
  zoom: lerp(a.zoom, b.zoom, t),
  cx: lerp(a.cx, b.cx, t),
  cy: lerp(a.cy, b.cy, t),
  px: lerp(a.px, b.px, t),
  py: lerp(a.py, b.py, t),
  focus: lerp(a.focus, b.focus, t),
  exposure: lerp(a.exposure, b.exposure, t),
  contrast: lerp(a.contrast, b.contrast, t),
  sat: lerp(a.sat, b.sat, t),
  tint: mix3(a.tint, b.tint, t),
  lift: mix3(a.lift, b.lift, t),
  bloom: lerp(a.bloom, b.bloom, t),
  bloomThresh: lerp(a.bloomThresh, b.bloomThresh, t),
  vignette: lerp(a.vignette, b.vignette, t),
  light: {
    x: lerp(a.light.x, b.light.x, t),
    y: lerp(a.light.y, b.light.y, t),
    r: lerp(a.light.r, b.light.r, t),
    amt: lerp(a.light.amt, b.light.amt, t),
    color: mix3(a.light.color, b.light.color, t),
  },
});

/** Map an image-space point to screen pixels under a look (ignores parallax). */
export const toScreen = (l: Look, u: number, v: number, w = 1920, h = 1080) => ({
  x: ((u - l.cx) * l.zoom + 0.5) * w,
  y: ((v - l.cy) * l.zoom + 0.5) * h,
});

export const COOL: V3 = [0.86, 0.94, 1.1];
export const WARM: V3 = [1.08, 0.98, 0.86];
export const SEPIA: V3 = [1.12, 0.96, 0.74];
export const MOON: V3 = [0.84, 0.92, 1.12];
