import data from '../data/audio.json';

type AudioData = {fps: number; rms: number[]; onset: number[]; low: number[]; beats: number[]};
const a = data as AudioData;

const at = (arr: number[], t: number) => {
  const i = Math.floor(t * a.fps);
  return arr[Math.max(0, Math.min(arr.length - 1, i))] ?? 0;
};

/** Smoothed loudness around time t (seconds). */
export const loud = (t: number) => (at(a.rms, t - 0.05) + at(a.rms, t) + at(a.rms, t + 0.05)) / 3;

/** Low-band hit envelope with a short decay, for pulses. */
export const pulse = (t: number) => {
  let v = 0;
  for (let k = 0; k < 6; k++) {
    v = Math.max(v, at(a.low, t - k / a.fps) * Math.exp(-k * 0.45));
  }
  return Math.min(1, v);
};
