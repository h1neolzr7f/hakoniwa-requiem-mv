import React from 'react';
import lyrics from './data/lyrics.json';
import {GlassSweep, GodRay, Frost, GoldenThread, Handwriting, MonitorText, TwentyFourEmbers, filmFlicker} from './components/Fx';
import {ParticleSpec} from './components/Particles';
import {loud} from './lib/audio';
import {COOL, Look, LookPatch, MOON, SEPIA, WARM, mixLook, mk, toScreen} from './lib/look';
import {V3, clamp, easeInOut, flicker, lerp, mix3, noise1, ramp, smooth, window01} from './lib/util';

type Line = {start: number; end: number; chars: {c: string; t: number}[]};
const L = lyrics as Line[];
const ls = (i: number) => L[i].start;
const le = (i: number) => L[i].end;
const charT = (i: number, c: string) => L[i].chars.find((x) => x.c === c)?.t ?? L[i].start;
/** Cut a beat before the vocal enters. */
const cutAt = (i: number) => ls(i) - 0.2;

type Ctx = {p: number; t: number; T: number};
export type Shot = {
  id: string;
  from: number;
  to: number;
  media: {img: string} | {video: string; startFrom?: number; rate?: number};
  look: (c: Ctx) => Look;
  fadeIn?: number;
  blurIn?: boolean;
  particles?: (c: Ctx & {look: Look}) => ParticleSpec[];
  fx?: (c: Ctx & {look: Look}) => React.ReactNode;
};

const merge = (a: LookPatch, b: LookPatch): LookPatch => ({...a, ...b, light: {...(a.light ?? {}), ...(b.light ?? {})}});
const cam = (a: LookPatch, b: LookPatch = {}, ease: (x: number) => number = easeInOut) => {
  const la = mk(a);
  const lb = mk(merge(a, b));
  return (p: number) => mixLook(la, lb, ease(p));
};
const withLight = (l: Look, amt: number, extra: Partial<Look['light']> = {}): Look => ({
  ...l,
  light: {...l.light, ...extra, amt},
});
const sc = (l: Look, u: number, v: number): [number, number] => {
  const s = toScreen(l, u, v);
  return [s.x / 1920, s.y / 1080];
};

const FIRE: V3 = [1.0, 0.55, 0.2];
const CANDLE: V3 = [1.0, 0.7, 0.35];
const NIGHT: LookPatch = {tint: COOL, sat: 0.92, exposure: 0.95};

export const SHOTS: Shot[] = [
  // ── Intro ────────────────────────────────────────────────────────────────
  {
    id: 'globe-video',
    from: 0,
    to: 6.2,
    media: {video: 'video-07', startFrom: 0, rate: 1},
    fadeIn: 2.2,
    look: ({p}) => cam({zoom: 1.02, ...NIGHT, vignette: 0.8}, {zoom: 1.12})(p),
    particles: () => [{kind: 'bokeh', count: 10, intensity: 0.6, color: [200, 220, 255]}],
  },
  {
    id: 'globe-enter',
    from: 6.2,
    to: 10.0,
    media: {img: 'B01'},
    fadeIn: 1.0,
    look: ({p, T}) => {
      const l = cam({zoom: 1.42, cx: 0.6, cy: 0.47, ...NIGHT, focus: 0.6}, {zoom: 2.7, cy: 0.5, px: 0.01}, (x) => x * x * x)(p);
      return {...l, exposure: l.exposure * (1 + 0.9 * ramp(T, 9.0, 10.0)), bloom: 0.5 + ramp(T, 8.6, 10) * 0.8};
    },
    particles: () => [{kind: 'snow', count: 120, size: 0.8, speed: 0.6, intensity: 0.8}],
  },
  {
    id: 'room-reveal',
    from: 10.0,
    to: cutAt(0),
    media: {img: 'B02'},
    fadeIn: 0.9,
    blurIn: true,
    look: ({p, T}) => withLight(cam({zoom: 1.28, cx: 0.5, cy: 0.52, ...NIGHT, focus: 0.5, py: 0.008}, {zoom: 1.12, px: -0.012})(p), 0.55 * flicker(T), {x: 0.8, y: 0.72, r: 0.28, color: FIRE}),
    particles: () => [{kind: 'dust', count: 40, intensity: 0.5}],
  },

  // ── Verse 1 ──────────────────────────────────────────────────────────────
  {
    id: 'clock-freeze',
    from: cutAt(0),
    to: cutAt(1),
    media: {img: 'P01'},
    look: ({p, T}) => {
      const fz = ramp(T, charT(0, '停') - 0.05, charT(0, '停') + 0.6);
      const l = cam({zoom: 1.12, cx: 0.45, cy: 0.5, ...NIGHT, focus: 0.55}, {zoom: 1.24, px: 0.014})(p);
      return {...l, sat: lerp(l.sat, 0.5, fz), tint: mix3(l.tint, MOON, fz), exposure: l.exposure * (1 - 0.08 * fz)};
    },
    particles: ({T}) => {
      const tf = charT(0, '停');
      const time = T < tf ? T : tf + (1 - Math.exp(-(T - tf) * 3.2)) / 3.2;
      const motion = 1 - ramp(T, tf - 0.05, tf + 0.7);
      return [{kind: 'rain', count: 170, clip: [0.69, 0, 1, 0.68], time, motion, intensity: 1.2, wind: -60}];
    },
  },
  {
    id: 'fish-painting',
    from: cutAt(1),
    to: cutAt(3),
    media: {img: 'K01'},
    look: ({p, T}) =>
      withLight(cam({zoom: 1.36, cx: 0.34, cy: 0.46, ...NIGHT, focus: 0.45, px: 0.012}, {zoom: 1.16, cx: 0.56, cy: 0.47, px: -0.01})(p), 0.55 * flicker(T, 2), {
        x: 0.08,
        y: 0.85,
        r: 0.3,
        color: CANDLE,
      }),
    particles: ({look}) => [
      {kind: 'rain', count: 120, clip: [sc(look, 0.67, 0)[0], 0, 1, sc(look, 0, 0.72)[1]], intensity: 0.8, wind: -40},
      {kind: 'dust', count: 30, intensity: 0.45},
    ],
  },
  {
    id: 'door-hope',
    from: cutAt(3),
    to: cutAt(4),
    media: {img: 'B02'},
    look: ({p, T}) => withLight(cam({zoom: 1.1, cx: 0.45, cy: 0.55, ...NIGHT, focus: 0.5}, {zoom: 1.2, px: 0.01})(p), 0.5 * flicker(T, 5), {x: 0.8, y: 0.72, r: 0.3, color: FIRE}),
    particles: () => [{kind: 'dust', count: 60, intensity: 0.7, clip: [0, 0, 0.6, 1]}],
    fx: ({T}) => <GodRay x={-0.05} y={0.22} angle={16} width={460} amt={0.75 * window01(T, cutAt(3) + 0.6, cutAt(4), 1.3, 1.6)} />,
  },
  {
    id: 'diary-goodnight',
    from: cutAt(4),
    to: cutAt(6),
    media: {img: 'P02'},
    look: ({p, T}) => withLight(cam({zoom: 1.12, cx: 0.6, cy: 0.48, focus: 0.5, tint: WARM, exposure: 0.95}, {zoom: 1.2, cy: 0.52, py: 0.006})(p), 0.45 * flicker(T, 7), {x: 0.97, y: 0.25, r: 0.4, color: CANDLE}),
    fx: ({t, look}) => (
      <Handwriting
        look={look}
        t={t}
        lines={[
          {text: '晚安。', u: 0.6, v: 0.26, start: 0.8, dur: 0.9},
          {text: '今天也画了晴天', u: 0.585, v: 0.37, start: 2.2, dur: 2.0},
          {text: '晚安。', u: 0.61, v: 0.48, start: ls(5) - cutAt(4) + 0.3, dur: 0.9},
          {text: '主人，晚安。', u: 0.6, v: 0.59, start: ls(5) - cutAt(4) + 2.0, dur: 1.6},
          {text: '晚安。', u: 0.64, v: 0.7, start: ls(5) - cutAt(4) + 3.6, dur: 0.9},
        ]}
      />
    ),
    particles: () => [{kind: 'dust', count: 30, intensity: 0.5}],
  },
  {
    id: 'fish-asks',
    from: cutAt(6),
    to: cutAt(7),
    media: {img: 'K12'},
    look: ({p}) => cam({zoom: 1.9, cx: 0.42, cy: 0.56, tint: MOON, sat: 0.6, focus: 0.5}, {zoom: 1.62, cx: 0.56, cy: 0.34, py: -0.01})(p),
    particles: () => [{kind: 'dust', count: 40, intensity: 0.5, color: [210, 225, 255]}],
  },
  {
    id: 'candle-out',
    from: cutAt(7),
    to: cutAt(7) + 1.6,
    media: {img: 'P07'},
    fadeIn: 0.25,
    look: ({p}) => cam({zoom: 1.14, cx: 0.42, cy: 0.42, tint: COOL, exposure: 0.92, focus: 0.5}, {zoom: 1.26, cy: 0.36})(p),
    particles: ({look, t}) => [{kind: 'embers', count: 8, origin: sc(look, 0.4, 0.4), spread: 0.01, intensity: 1 - ramp(t, 0, 1.4), size: 0.7}],
  },
  {
    id: 'moonlight-blanket',
    from: cutAt(7) + 1.6,
    to: cutAt(8),
    media: {video: 'video-08', startFrom: 0.7},
    fadeIn: 0.4,
    look: ({p}) => cam({zoom: 1.0, tint: MOON, sat: 0.92, vignette: 0.6}, {zoom: 1.06})(p),
    particles: () => [{kind: 'dust', count: 35, intensity: 0.5, color: [215, 230, 255]}],
  },

  // ── Pre-Chorus ───────────────────────────────────────────────────────────
  {
    id: 'three-nights',
    from: cutAt(8),
    to: cutAt(10),
    media: {img: 'K03'},
    look: ({p, T}) => {
      const cold = ramp(T, ls(9), ls(10));
      const l = cam({zoom: 1.15, cx: 0.45, cy: 0.5, focus: 0.5, px: 0.012}, {zoom: 1.32, cx: 0.42, cy: 0.52, px: -0.008})(p);
      return withLight(
        {...l, tint: mix3(WARM, COOL, cold), sat: lerp(1, 0.62, cold), exposure: lerp(1, 0.82, cold)},
        (0.95 - 0.7 * cold) * flicker(T, 11),
        {x: 0.22, y: 0.6, r: 0.36, color: FIRE},
      );
    },
    particles: ({look, T}) => [
      {kind: 'embers', count: 26, origin: sc(look, 0.22, 0.66), spread: 0.06, intensity: 1 - 0.75 * ramp(T, ls(9), ls(10))},
    ],
    fx: ({T}) => <Frost amt={0.85 * ramp(T, ls(9) + 0.8, ls(10))} />,
  },
  {
    id: 'god-closes-eyes',
    from: cutAt(10),
    to: cutAt(11),
    media: {img: 'K07'},
    look: ({p, T}) => {
      const off = ramp(T, le(10) - 1.0, le(10) - 0.2);
      const l = cam({zoom: 1.1, cx: 0.5, cy: 0.46, tint: SEPIA, sat: 0.55, focus: 0.45, bloom: 0.6}, {zoom: 1.2, px: 0.01})(p);
      return withLight({...l, exposure: filmFlicker(T) * lerp(1, 0.32, off)}, 0.7 * (1 - off), {x: 0.73, y: 0.2, r: 0.35, color: [1, 0.8, 0.5]});
    },
    particles: ({T}) => [{kind: 'dust', count: 50, intensity: 0.7 * (1 - ramp(T, le(10) - 1, le(10))), color: [255, 225, 170]}],
  },
  {
    id: 'guard-the-roof',
    from: cutAt(11),
    to: ls(12) - 0.05,
    media: {img: 'B01'},
    look: ({p, T}) => {
      const l = cam({zoom: 1.0, cx: 0.6, cy: 0.46, ...NIGHT, focus: 0.6}, {zoom: 1.75, px: 0.012}, (x) => x * x)(p);
      return {...l, exposure: l.exposure * (1 + 0.8 * ramp(T, ls(12) - 0.9, ls(12))), bloom: 0.45 + 0.9 * ramp(T, ls(12) - 1.5, ls(12))};
    },
    particles: ({T}) => [
      {kind: 'snow', count: 110, size: 0.9, speed: 0.7, intensity: 0.85},
      {kind: 'motes', count: 40, intensity: ramp(T, cutAt(11) + 1, ls(12))},
    ],
    fx: ({look, p}) => <GlassSweep look={look} center={[0.6, 0.47]} radius={0.27} phase={p} amt={0.5} />,
  },

  // ── Chorus 1 ─────────────────────────────────────────────────────────────
  {
    id: 'look-everything',
    from: ls(12) - 0.05,
    to: cutAt(13),
    media: {video: 'video-06', startFrom: 1.1},
    fadeIn: 0.1,
    look: ({p}) => cam({zoom: 1.0, exposure: 1.05, sat: 1.05, vignette: 0.45}, {zoom: 1.08})(p),
    particles: ({T}) => [
      {kind: 'snow', count: 70, size: 1.1, speed: 0.8, intensity: 0.7, wind: 40},
      {kind: 'motes', count: 50, intensity: 0.6 + loud(T) * 0.5},
    ],
  },
  {
    id: 'promised-seasons',
    from: cutAt(13),
    to: cutAt(14),
    media: {img: 'B06'},
    blurIn: true,
    look: ({p}) => cam({zoom: 1.26, cx: 0.4, cy: 0.62, tint: WARM, exposure: 1.12, bloom: 0.85, bloomThresh: 0.42, focus: 0.7}, {zoom: 1.1, cy: 0.56, py: -0.012})(p),
    particles: () => [
      {kind: 'petals', count: 34, intensity: 0.85, wind: 40},
      {kind: 'bokeh', count: 14, intensity: 1},
    ],
  },
  {
    id: 'long-silence',
    from: cutAt(14),
    to: cutAt(15),
    media: {img: 'B05'},
    look: ({p}) => cam({zoom: 1.1, cx: 0.5, cy: 0.5, tint: COOL, sat: 0.72, focus: 0.5}, {zoom: 1.2, py: 0.01})(p),
    particles: () => [{kind: 'snow', count: 260, speed: 0.45, intensity: 0.9}],
  },
  {
    id: 'kiss',
    from: cutAt(15),
    to: cutAt(16),
    media: {video: 'video-04', startFrom: 0.5},
    look: ({p}) => cam({zoom: 1.0, tint: WARM, vignette: 0.6}, {zoom: 1.05})(p),
    particles: () => [{kind: 'dust', count: 25, intensity: 0.5}],
  },
  {
    id: 'drawer',
    from: cutAt(16),
    to: cutAt(17),
    media: {img: 'K05'},
    look: ({p, T}) =>
      withLight(cam({zoom: 1.14, cx: 0.5, cy: 0.5, focus: 0.5}, {zoom: 1.45, cx: 0.42, cy: 0.62, px: 0.01})(p), 0.7 * (0.85 + 0.15 * Math.sin(T * 3)), {
        x: 0.36,
        y: 0.68,
        r: 0.26,
        color: [1, 0.72, 0.4],
      }),
    particles: () => [{kind: 'dust', count: 40, intensity: 0.6}],
  },
  {
    id: 'twenty-four-embers',
    from: cutAt(17),
    to: cutAt(18),
    media: {img: 'P04'},
    look: ({p, T}) => withLight(cam({zoom: 1.1, cx: 0.55, cy: 0.56, exposure: 0.82, focus: 0.5}, {zoom: 1.17, cy: 0.52})(p), 0.6 + 0.2 * Math.sin(T * 4), {x: 0.82, y: 0.66, r: 0.3, color: [1, 0.7, 0.35]}),
    fx: ({look, t}) => <TwentyFourEmbers look={look} t={t} origin={[0.82, 0.66]} start={ls(17) - cutAt(17)} end={le(17) - cutAt(17)} />,
  },
  {
    id: 'hollow-forever',
    from: cutAt(18),
    to: cutAt(19),
    media: {img: 'B01'},
    blurIn: true,
    look: ({p}) => cam({zoom: 1.62, cx: 0.6, cy: 0.46, ...NIGHT, focus: 0.6}, {zoom: 1.06, cx: 0.55, cy: 0.5})(p),
    particles: () => [{kind: 'snow', count: 90, speed: 0.6, intensity: 0.75}],
    fx: ({look, p}) => <GlassSweep look={look} center={[0.6, 0.47]} radius={0.27} phase={p} amt={0.6} />,
  },
  {
    id: 'if-we-go-out',
    from: cutAt(19),
    to: 104.4,
    media: {img: 'K04'},
    look: ({p, T}) => {
      const l = cam({zoom: 1.1, cx: 0.5, cy: 0.45, focus: 0.5, bloom: 0.6}, {zoom: 1.32, cy: 0.38, px: 0.016})(p);
      const dim = ramp(T, le(19) - 3.2, 104.2);
      return {...l, exposure: lerp(1.02, 0.25, dim), sat: lerp(1, 0.6, dim)};
    },
    particles: ({T}) => [
      {kind: 'snow', count: 80, intensity: 0.7, wind: 30},
      {kind: 'motes', count: 60, intensity: 0.9 * (1 - ramp(T, le(19) - 2.5, 104))},
    ],
  },

  // ── Interlude ────────────────────────────────────────────────────────────
  {
    id: 'creator-memory',
    from: 104.7,
    to: 111.6,
    media: {img: 'K07'},
    fadeIn: 1.4,
    look: ({p, T}) => {
      const l = cam({zoom: 1.12, cx: 0.5, cy: 0.42, tint: SEPIA, sat: 0.7, focus: 0.5, bloom: 0.6}, {zoom: 1.48, cx: 0.53, cy: 0.42, px: 0.012})(p);
      return withLight({...l, exposure: filmFlicker(T)}, 0.6, {x: 0.73, y: 0.2, r: 0.4, color: [1, 0.82, 0.5]});
    },
    particles: () => [{kind: 'dust', count: 60, intensity: 0.8, color: [255, 228, 180]}],
    fx: ({t}) => (
      <div
        style={{
          position: 'absolute',
          left: 140,
          bottom: 150,
          fontFamily: 'LXGW',
          fontSize: 40,
          letterSpacing: '0.3em',
          color: 'rgba(255,240,214,0.92)',
          textShadow: '0 0 18px rgba(255,200,120,0.6)',
          opacity: window01(t, 1.8, 6.6, 1.2, 1.2),
          filter: `blur(${(1 - ramp(t, 1.8, 3)) * 6}px)`,
        }}
      >
        致　我的小小箱庭
      </div>
    ),
  },
  {
    id: 'music-box',
    from: 111.6,
    to: 118.3,
    media: {img: 'P06'},
    blurIn: true,
    look: ({p}) => cam({zoom: 1.12, cx: 0.5, cy: 0.55, tint: MOON, sat: 0.8, focus: 0.5, bloom: 0.5}, {zoom: 1.32, cx: 0.44, cy: 0.6, px: -0.014})(p),
    particles: () => [
      {kind: 'dust', count: 50, intensity: 0.9, color: [255, 236, 200]},
      {kind: 'motes', count: 18, intensity: 0.5, size: 0.7},
    ],
  },
  {
    id: 'sea-foreshadow',
    from: 118.3,
    to: 124.3,
    media: {img: 'B07'},
    blurIn: true,
    look: ({p}) => cam({zoom: 1.08, cx: 0.6, cy: 0.55, bloom: 0.75, focus: 0.5}, {zoom: 1.26, py: -0.01})(p),
    particles: () => [{kind: 'motes', count: 55, intensity: 0.8}],
  },
  {
    id: 'empty-room',
    from: 124.3,
    to: 129.9,
    media: {img: 'B02'},
    look: ({p, T}) => withLight(cam({zoom: 1.22, cx: 0.48, cy: 0.5, ...NIGHT, focus: 0.5}, {zoom: 1.1, px: 0.012})(p), 0.35 * flicker(T, 13), {x: 0.8, y: 0.72, r: 0.25, color: FIRE}),
    particles: ({look}) => [
      {kind: 'rain', count: 110, clip: [0, sc(look, 0, 0.06)[1], sc(look, 0.245, 0)[0], sc(look, 0, 0.64)[1]], intensity: 1, wind: 30},
      {kind: 'dust', count: 25, intensity: 0.4},
    ],
  },
  {
    id: 'dawn-creek',
    from: 129.9,
    to: cutAt(20),
    media: {img: 'B05'},
    blurIn: true,
    look: ({p}) => cam({zoom: 1.26, cx: 0.55, cy: 0.5, tint: [1.04, 0.97, 1.02], focus: 0.5, bloom: 0.6}, {zoom: 1.1, px: -0.01})(p),
    particles: () => [{kind: 'snow', count: 70, speed: 0.4, intensity: 0.6}],
  },

  // ── Verse 2 ──────────────────────────────────────────────────────────────
  {
    id: 'paper-boat-video',
    from: cutAt(20),
    to: cutAt(20) + 5.9,
    media: {video: 'video-03', startFrom: 0},
    look: ({p}) => cam({zoom: 1.0, bloom: 0}, {zoom: 1.05})(p),
    particles: () => [{kind: 'snow', count: 40, speed: 0.4, intensity: 0.5}],
  },
  {
    id: 'paper-boat-drift',
    from: cutAt(20) + 5.9,
    to: cutAt(22),
    media: {img: 'P05'},
    look: ({p}) => cam({zoom: 1.3, cx: 0.72, cy: 0.66, bloom: 0.7, focus: 0.6}, {zoom: 1.36, cx: 0.8, cy: 0.65, px: 0.012})(p),
    particles: () => [{kind: 'dust', count: 30, intensity: 0.6, color: [255, 220, 230]}],
  },
  {
    id: 'flickering-hearth',
    from: cutAt(22),
    to: cutAt(23),
    media: {img: 'B02'},
    look: ({p, T}) => {
      const f = Math.pow(noise1(T * 5.5, 21), 2) * 1.4 + 0.15 * noise1(T * 23, 4);
      const l = cam({zoom: 1.15, cx: 0.6, cy: 0.56, ...NIGHT, focus: 0.5}, {zoom: 1.32, cx: 0.72, cy: 0.6})(p);
      return withLight({...l, exposure: l.exposure * (0.85 + f * 0.18)}, 0.2 + f, {x: 0.8, y: 0.72, r: 0.4, color: FIRE});
    },
    particles: ({look}) => [{kind: 'embers', count: 20, origin: sc(look, 0.8, 0.75), spread: 0.05, intensity: 0.8}],
  },
  {
    id: 'frozen-fingers',
    from: cutAt(23),
    to: cutAt(24),
    media: {video: 'video-02', startFrom: 0.6},
    look: ({p}) => cam({zoom: 1.0, tint: [0.96, 0.98, 1.04]}, {zoom: 1.06})(p),
    particles: () => [{kind: 'snow', count: 90, wind: -320, speed: 0.7, intensity: 0.8, size: 0.9}],
  },
  {
    id: 'her-part-my-part',
    from: cutAt(24),
    to: cutAt(26),
    media: {img: 'K10'},
    look: ({T}) => {
      const k = easeInOut((T - (ls(25) - 0.6)) / 1.3);
      const push = clamp((T - cutAt(24)) / (cutAt(26) - cutAt(24)));
      const l = mk({zoom: 1.55 + push * 0.12, cx: lerp(0.28, 0.72, k), cy: 0.5, focus: 0.5, px: lerp(0.012, -0.012, k)});
      return withLight(l, 0.5 * k * flicker(T, 17), {x: 0.76, y: 0.42, r: 0.2, color: CANDLE});
    },
    particles: ({T}) => {
      const k = smooth((T - (ls(25) - 0.6)) / 1.3);
      return [
        {kind: 'dust', count: 40, intensity: 0.8 * (1 - k), color: [255, 230, 170]},
        {kind: 'snow', count: 70, intensity: 0.8 * k, speed: 0.5},
      ];
    },
  },
  {
    id: 'mend-time',
    from: cutAt(26),
    to: cutAt(27),
    media: {img: 'K11'},
    look: ({p}) => cam({zoom: 1.12, cx: 0.52, cy: 0.55, focus: 0.5, bloom: 0.55}, {zoom: 1.26, cy: 0.58, px: 0.01})(p),
    fx: ({T, t}) => <GoldenThread progress={ramp(T, ls(26) - 0.1, le(26) + 0.3)} t={t} amt={1} />,
    particles: () => [{kind: 'dust', count: 40, intensity: 0.8, color: [255, 230, 180]}],
  },
  {
    id: 'ordinary-years',
    from: cutAt(27),
    to: ls(28) - 0.3,
    media: {img: 'B02'},
    look: ({T}) => {
      const c = (T - cutAt(27)) / (ls(28) - 0.3 - cutAt(27));
      const day = 0.5 - 0.5 * Math.cos(c * Math.PI * 2 * 3);
      const l = mk({zoom: 1.12, cx: 0.5, cy: 0.52, focus: 0.5, px: lerp(-0.01, 0.01, c)});
      return withLight(
        {...l, tint: mix3([0.78, 0.88, 1.15], [1.1, 1.0, 0.86], day), exposure: lerp(0.62, 1.25, day), sat: lerp(0.75, 1.05, day), bloom: 0.3 + day * 0.6},
        0.9 * day,
        {x: lerp(0.0, 0.45, (c * 3) % 1), y: 0.5, r: 0.45, color: [1, 0.85, 0.6]},
      );
    },
    particles: () => [{kind: 'dust', count: 50, intensity: 0.7}],
  },

  // ── Bridge ───────────────────────────────────────────────────────────────
  {
    id: 'when-is-master-coming',
    from: ls(28) - 0.3,
    to: 183.1,
    media: {img: 'K12'},
    fadeIn: 1.2,
    look: ({p}) => cam({zoom: 1.08, cx: 0.5, cy: 0.5, tint: MOON, sat: 0.12, exposure: 0.9, focus: 0.5, vignette: 0.8}, {zoom: 1.32, cy: 0.42, px: 0.01})(p),
    particles: () => [{kind: 'dust', count: 45, intensity: 0.5, color: [220, 230, 255]}],
  },
  {
    id: 'first-flower',
    from: 183.1,
    to: 189.3,
    media: {img: 'B06'},
    blurIn: true,
    look: ({p, T}) => {
      const l = cam({zoom: 1.42, cx: 0.36, cy: 0.7, focus: 0.75, bloom: 0.7, bloomThresh: 0.45}, {zoom: 1.16, cy: 0.62, py: -0.01})(p);
      const col = ramp(T, 183.4, 186.4);
      return {...l, sat: lerp(0.1, 1.05, col), tint: mix3(MOON, WARM, col), exposure: lerp(0.85, 1.1, col)};
    },
    particles: ({T}) => [{kind: 'motes', count: 30, intensity: ramp(T, 184, 187), size: 0.7}],
  },
  {
    id: 'other-shore',
    from: 189.3,
    to: cutAt(31),
    media: {img: 'B07'},
    blurIn: true,
    look: ({p, T}) => {
      const l = cam({zoom: 1.08, cx: 0.6, cy: 0.55, focus: 0.5}, {zoom: 1.55, cx: 0.63, cy: 0.58, py: -0.012})(p);
      return {...l, bloom: 0.6 + 0.5 * loud(T)};
    },
    particles: ({T}) => [
      {kind: 'motes', count: 70 + Math.round(60 * ramp(T, 189.3, 198)), intensity: 0.6 + 0.5 * loud(T)},
      {kind: 'bokeh', count: 10, intensity: 0.8},
    ],
  },
  {
    id: 'sing-to-the-shore',
    from: cutAt(31),
    to: ls(32) - 0.05,
    media: {img: 'K13'},
    look: ({p, T}) => {
      const l = cam({zoom: 1.5, cx: 0.4, cy: 0.32, focus: 0.5, bloom: 0.85, bloomThresh: 0.5, px: 0.014}, {zoom: 1.08, cx: 0.5, cy: 0.5, px: -0.014})(p);
      return {...l, exposure: l.exposure * (1 + 0.7 * ramp(T, ls(32) - 0.8, ls(32)))};
    },
    particles: ({T}) => [
      {kind: 'motes', count: 150, intensity: 0.7 + 0.5 * loud(T), size: 1.1},
      {kind: 'bokeh', count: 14, intensity: 1},
    ],
    fx: ({look}) => {
      const b = toScreen(look, 0.72, 0.64);
      return <GodRay x={b.x / 1920} y={b.y / 1080} angle={-160} width={380} amt={0.45} />;
    },
  },

  // ── Final Chorus ─────────────────────────────────────────────────────────
  {
    id: 'listen-everything',
    from: ls(32) - 0.05,
    to: cutAt(33),
    media: {video: 'video-06', startFrom: 0.2},
    fadeIn: 0.1,
    look: ({p}) => cam({zoom: 1.0, exposure: 1.06, sat: 1.06, vignette: 0.45}, {zoom: 1.06})(p),
    particles: ({T}) => [
      {kind: 'snow', count: 70, size: 1.1, intensity: 0.7, wind: 40},
      {kind: 'motes', count: 60, intensity: 0.6 + loud(T) * 0.5},
    ],
  },
  {
    id: 'last-farewell',
    from: cutAt(33),
    to: cutAt(34),
    media: {img: 'K07'},
    look: ({p, T}) => withLight(cam({zoom: 1.2, cx: 0.5, cy: 0.44, tint: WARM, focus: 0.5, bloom: 0.6}, {zoom: 1.5, cx: 0.53, cy: 0.43, px: 0.012})(p), 0.6, {x: 0.73, y: 0.2, r: 0.4, color: [1, 0.82, 0.5]}),
    particles: () => [{kind: 'dust', count: 50, intensity: 0.8}],
  },
  {
    id: 'wear-your-coat',
    from: cutAt(34),
    to: cutAt(35),
    media: {img: 'K14'},
    look: ({p, T}) => withLight(cam({zoom: 1.12, cx: 0.55, cy: 0.45, focus: 0.5}, {zoom: 1.28, cx: 0.5, cy: 0.5, px: 0.012})(p), 0.6 * flicker(T, 19), {x: 0.05, y: 0.6, r: 0.3, color: CANDLE}),
    particles: () => [{kind: 'dust', count: 40, intensity: 0.6}],
  },
  {
    id: 'write-on',
    from: cutAt(35),
    to: cutAt(36),
    media: {img: 'P02'},
    look: ({p, T}) => withLight(cam({zoom: 1.14, cx: 0.62, cy: 0.5, tint: WARM, focus: 0.5}, {zoom: 1.22, py: 0.006})(p), 0.45 * flicker(T, 23), {x: 0.97, y: 0.25, r: 0.4, color: CANDLE}),
    fx: ({t, look}) => (
      <Handwriting
        look={look}
        t={t}
        lines={[
          {text: '十二月三日　雪', u: 0.585, v: 0.27, start: 0.2, dur: 1.0},
          {text: '她画完了第七幅晴天', u: 0.57, v: 0.39, start: 1.2, dur: 1.3},
          {text: '炉火很好　她笑了', u: 0.58, v: 0.51, start: 2.5, dur: 1.1},
          {text: '替你说　晚安', u: 0.6, v: 0.63, start: 3.6, dur: 0.9},
        ]}
      />
    ),
  },
  {
    id: 'trade-the-embers',
    from: cutAt(36),
    to: cutAt(37),
    media: {img: 'P04'},
    look: ({p, T}) => withLight(cam({zoom: 1.16, cx: 0.55, cy: 0.52, exposure: 0.85, focus: 0.5}, {zoom: 1.1, cy: 0.5})(p), 0.7 * (1 - ramp(T, ls(36), le(36))), {x: 0.82, y: 0.66, r: 0.3, color: [1, 0.7, 0.35]}),
    fx: ({look, t, T}) => <TwentyFourEmbers look={look} t={t} origin={[0.82, 0.66]} start={-4} end={-3} release={ramp(T, ls(36) + 0.2, le(36) + 0.2)} />,
  },
  {
    id: 'every-morning',
    from: cutAt(37),
    to: cutAt(38),
    media: {img: 'K15'},
    look: ({p, T}) => withLight(cam({zoom: 1.1, cx: 0.5, cy: 0.5, focus: 0.5, bloom: 0.5}, {zoom: 1.22, cx: 0.58, cy: 0.46, px: 0.012})(p), 0.85 * flicker(T, 29), {x: 0.08, y: 0.72, r: 0.3, color: CANDLE}),
    particles: () => [{kind: 'dust', count: 45, intensity: 0.7}],
  },
  {
    id: 'ash-and-memory',
    from: cutAt(38),
    to: ls(39) - 0.05,
    media: {img: 'B03'},
    look: ({p, T}) => {
      const fade = ramp(T, ls(38) + 1.8, le(38) + 0.3);
      const l = cam({zoom: 1.1, cx: 0.5, cy: 0.5, focus: 0.5, bloom: 0.5}, {zoom: 1.26, cx: 0.7, cy: 0.58})(p);
      return {...l, sat: lerp(1, 0.3, fade), exposure: lerp(1, 1.35, fade), bloom: lerp(0.5, 1.2, fade)};
    },
    particles: ({look}) => [{kind: 'embers', count: 40, origin: sc(look, 0.82, 0.82), spread: 0.12, color: [200, 195, 190], intensity: 0.7, speed: 0.4, size: 1.2}],
  },
  {
    id: 'we-are-still-alive',
    from: ls(39) - 0.05,
    to: 247.6,
    media: {img: 'K16'},
    fadeIn: 0.15,
    look: ({p, T}) => {
      const l = cam({zoom: 1.3, cx: 0.55, cy: 0.56, focus: 0.55, bloom: 0.9, bloomThresh: 0.5, exposure: 1.05, py: 0.01}, {zoom: 1.08, cx: 0.55, cy: 0.5, py: -0.01})(p);
      const dusk = ramp(T, 245.4, 247.6);
      return {...l, exposure: lerp(l.exposure, 0.7, dusk), tint: mix3(WARM, [1.05, 0.9, 0.85], dusk)};
    },
    particles: ({T}) => [
      {kind: 'petals', count: 40, intensity: 0.9, wind: 80},
      {kind: 'motes', count: 70, intensity: 0.7 + 0.4 * loud(T)},
      {kind: 'dust', count: 40, intensity: 0.8},
    ],
    fx: ({look, T}) => {
      const s = toScreen(look, 0.8, 0.25);
      return <GodRay x={s.x / 1920} y={s.y / 1080} angle={152} width={520} amt={0.7 * (1 - ramp(T, 245, 247.6))} />;
    },
  },

  // ── Outro ────────────────────────────────────────────────────────────────
  {
    id: 'good-night-creator',
    from: 247.6,
    to: ls(41) - 0.15,
    media: {video: 'video-01', startFrom: 0},
    fadeIn: 1.0,
    look: ({p}) => cam({zoom: 1.0, vignette: 0.7}, {zoom: 1.05})(p),
    particles: () => [{kind: 'dust', count: 30, intensity: 0.5}],
  },
  {
    id: 'sunny-tomorrow',
    from: ls(41) - 0.15,
    to: 259.4,
    media: {img: 'K18'},
    blurIn: true,
    fadeIn: 1.0,
    look: ({p}) => cam({zoom: 1.1, cx: 0.5, cy: 0.5, focus: 0.5, bloom: 0.8, bloomThresh: 0.5, tint: WARM}, {zoom: 1.2, cx: 0.62, cy: 0.46, px: 0.012})(p),
    particles: () => [{kind: 'dust', count: 70, intensity: 0.9, clip: [0.4, 0, 0.75, 1]}],
  },
  {
    id: 'pull-out-globe',
    from: 259.4,
    to: 265.3,
    media: {img: 'B01'},
    fadeIn: 1.2,
    blurIn: true,
    look: ({p}) => cam({zoom: 2.1, cx: 0.6, cy: 0.47, ...NIGHT, focus: 0.6}, {zoom: 1.04, cx: 0.52, cy: 0.5}, (x) => 1 - Math.pow(1 - x, 2.4))(p),
    particles: () => [{kind: 'snow', count: 90, speed: 0.5, intensity: 0.7}],
    fx: ({look, p}) => <GlassSweep look={look} center={[0.6, 0.47]} radius={0.27} phase={p} amt={0.5} />,
  },
  {
    id: 'reality',
    from: 265.3,
    to: 273.2,
    media: {img: 'B08'},
    fadeIn: 1.4,
    look: ({p}) => cam({zoom: 1.05, cx: 0.5, cy: 0.5, tint: COOL, sat: 0.55, focus: 0.5, bloom: 0.5}, {zoom: 1.34, cx: 0.74, cy: 0.42, px: -0.012})(p),
    particles: () => [{kind: 'dust', count: 60, intensity: 0.6, clip: [0, 0, 0.5, 1], color: [210, 225, 255]}],
    fx: ({look, t}) => <MonitorText look={look} t={t} start={1.8} lines={['> 晚安。', '> 明天也会是晴天吧。']} />,
  },
];

export const FLASHES = [
  {t: ls(12), peak: 0.85, decay: 0.5, color: '255,255,255'},
  {t: ls(32), peak: 0.9, decay: 0.55, color: '255,255,255'},
  {t: ls(39), peak: 0.6, decay: 0.9, color: '255,232,190'},
];

export const blackAt = (T: number) =>
  Math.max(window01(T, 103.8, 105.4, 0.6, 0.8), ramp(T, 271.6, 273.0));

export const CHAPTERS = [
  {at: 10.4, num: '壹', name: '雨落之日'},
  {at: cutAt(8) + 0.3, num: '贰', name: '余温'},
  {at: 105.4, num: '叁', name: '造物主'},
  {at: 130.4, num: '肆', name: '纸船'},
  {at: ls(28) + 0.2, num: '伍', name: '彼岸'},
  {at: ls(32) + 0.6, num: '陆', name: '镇魂曲'},
  {at: 248.4, num: '终', name: '晴天'},
];

/** Exposure pulse on low-end hits during the choruses. */
export const CHORUS: [number, number][] = [
  [ls(12), 104],
  [ls(32), 247],
];

export const LETTERBOX: [number, number] = [ls(28) - 0.3, ls(32)];
export const TITLE = {start: 1.6, end: 6.6};
export const END_CARD = 273.0;
