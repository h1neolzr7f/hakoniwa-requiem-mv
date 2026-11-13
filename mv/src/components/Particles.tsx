import React, {useLayoutEffect, useRef} from 'react';
import {H, W, hash, noise1} from '../lib/util';

export type ParticleKind = 'snow' | 'rain' | 'embers' | 'dust' | 'motes' | 'petals' | 'ash' | 'bokeh';

export type ParticleSpec = {
  kind: ParticleKind;
  count: number;
  seed?: number;
  intensity?: number;
  /** Horizontal drift in px/s (scaled by depth). */
  wind?: number;
  speed?: number;
  size?: number;
  /** Spawn origin (0..1) and horizontal spread (fraction of width) for embers. */
  origin?: [number, number];
  spread?: number;
  /** Clip rectangle in 0..1 screen units. */
  clip?: [number, number, number, number];
  color?: [number, number, number];
  /** Effective (possibly warped) time in seconds; defaults to the shot-local time. */
  time?: number;
  /** 1 = normal streaks; 0 = rain frozen in mid-air. */
  motion?: number;
};

const sprites = new Map<string, HTMLCanvasElement>();
const sprite = (r: number, g: number, b: number, hard = 0.25) => {
  const key = `${r},${g},${b},${hard}`;
  let c = sprites.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d')!;
    const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, `rgba(${r},${g},${b},1)`);
    grd.addColorStop(hard, `rgba(${r},${g},${b},0.75)`);
    grd.addColorStop(0.6, `rgba(${r},${g},${b},0.18)`);
    grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 64, 64);
    sprites.set(key, c);
  }
  return c;
};

const wrap = (v: number, m: number) => ((v % m) + m) % m;

const draw = (ctx: CanvasRenderingContext2D, s: ParticleSpec, t: number) => {
  const seed = s.seed ?? 1;
  const k = s.intensity ?? 1;
  const sz = s.size ?? 1;
  const sp = s.speed ?? 1;
  const wind = s.wind ?? 0;
  const tt = s.time ?? t;
  const h = (i: number, j: number) => hash(i * 13.37 + j * 7.11 + seed * 91.7);

  if (s.kind === 'snow' || s.kind === 'ash') {
    const ash = s.kind === 'ash';
    const col = s.color ?? (ash ? [190, 185, 180] : [255, 255, 255]);
    const spr = sprite(col[0], col[1], col[2], 0.35);
    for (let i = 0; i < s.count; i++) {
      const z = 0.15 + 0.85 * h(i, 1);
      const r = (1.2 + z * 4.2) * sz * (z > 0.93 ? 2.6 : 1);
      const vy = (ash ? 14 + z * 26 : 35 + z * 85) * sp;
      const y = wrap(h(i, 2) * (H + 120) + tt * vy, H + 120) - 60;
      const x =
        wrap(h(i, 3) * (W + 200) + Math.sin(tt * (0.4 + h(i, 4)) + i) * 26 * z + wind * tt * z, W + 200) - 100;
      ctx.globalAlpha = Math.min(1, (0.25 + 0.7 * z) * k * (z > 0.93 ? 0.45 : 1));
      ctx.drawImage(spr, x - r * 2, y - r * 2, r * 4, r * 4);
    }
  } else if (s.kind === 'rain') {
    const motion = s.motion ?? 1;
    ctx.lineCap = 'round';
    for (let i = 0; i < s.count; i++) {
      const z = 0.2 + 0.8 * h(i, 1);
      const vy = (900 + z * 900) * sp;
      const y = wrap(h(i, 2) * (H + 200) + tt * vy, H + 200) - 100;
      const x = wrap(h(i, 3) * W + (wind * y) / 600, W);
      const len = (20 + z * 55) * motion + 3;
      ctx.globalAlpha = (0.12 + 0.3 * z) * k;
      ctx.strokeStyle = `rgb(205,222,255)`;
      ctx.lineWidth = 0.8 + z * 1.4 + (1 - motion) * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (wind * len) / 600, y + len);
      ctx.stroke();
    }
  } else if (s.kind === 'embers' || s.kind === 'motes') {
    const motes = s.kind === 'motes';
    const [ox, oy] = s.origin ?? [0.5, 1.02];
    const spread = s.spread ?? (motes ? 1.1 : 0.08);
    const col = s.color ?? (motes ? [255, 214, 140] : [255, 150, 60]);
    const spr = sprite(col[0], col[1], col[2], 0.2);
    const core = sprite(255, 245, 220, 0.5);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < s.count; i++) {
      const life = motes ? 6 + h(i, 1) * 6 : 1.8 + h(i, 1) * 2.4;
      const ph = tt + h(i, 2) * life;
      const cyc = Math.floor(ph / life);
      const age = ph - cyc * life;
      const r1 = hash(i * 3.1 + cyc * 17.7 + seed);
      const r2 = hash(i * 5.3 + cyc * 29.1 + seed);
      const vy = (motes ? 28 + r2 * 60 : 55 + r2 * 110) * sp;
      const x =
        (ox + (r1 - 0.5) * spread) * W +
        Math.sin(age * (motes ? 0.9 : 3.2) + i) * (motes ? 30 : 14) +
        wind * age;
      const y = oy * H - age * vy - (motes ? r2 * H * 0.2 : 0);
      const fade = Math.sin((Math.PI * age) / life);
      const fl = motes ? 0.75 + 0.25 * Math.sin(tt * 3 + i) : 0.55 + 0.45 * noise1(tt * 9 + i, i);
      const r = (motes ? 2 + r1 * 4.5 : 1.2 + r1 * 2.4) * sz;
      ctx.globalAlpha = Math.max(0, fade * fl * k);
      ctx.drawImage(spr, x - r * 4, y - r * 4, r * 8, r * 8);
      ctx.globalAlpha = Math.max(0, fade * fl * k * 0.9);
      ctx.drawImage(core, x - r, y - r, r * 2, r * 2);
    }
  } else if (s.kind === 'dust') {
    const col = s.color ?? [255, 236, 200];
    const spr = sprite(col[0], col[1], col[2], 0.3);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < s.count; i++) {
      const x = h(i, 1) * W + Math.sin(tt * 0.17 * (1 + h(i, 2)) + i) * 60 + wind * tt;
      const y = wrap(h(i, 3) * H + Math.cos(tt * 0.21 * (1 + h(i, 4)) + i) * 40 - tt * 6 * sp, H);
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(tt * (1 + 2 * h(i, 5)) + i * 2.3));
      const r = (0.8 + 2.2 * h(i, 6)) * sz;
      ctx.globalAlpha = tw * k * 0.8;
      ctx.drawImage(spr, wrap(x, W) - r * 3, y - r * 3, r * 6, r * 6);
    }
  } else if (s.kind === 'petals') {
    for (let i = 0; i < s.count; i++) {
      const z = 0.3 + 0.7 * h(i, 1);
      const vy = (40 + z * 70) * sp;
      const y = wrap(h(i, 2) * (H + 160) + tt * vy, H + 160) - 80;
      const x = wrap(h(i, 3) * (W + 300) + tt * (60 + wind) * z + Math.sin(tt + i) * 40, W + 300) - 150;
      const rot = tt * (1 + h(i, 4) * 2) + i;
      const r = (5 + z * 9) * sz;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(1, Math.abs(Math.cos(tt * 1.7 + i)) * 0.8 + 0.2);
      ctx.globalAlpha = (0.45 + 0.5 * z) * k;
      ctx.fillStyle = h(i, 5) > 0.5 ? 'rgb(255,228,236)' : 'rgb(255,246,250)';
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (s.kind === 'bokeh') {
    const col = s.color ?? [255, 220, 170];
    const spr = sprite(col[0], col[1], col[2], 0.55);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < s.count; i++) {
      const x = wrap(h(i, 1) * W + tt * (8 + 14 * h(i, 2)) * (h(i, 3) > 0.5 ? 1 : -1) + wind * tt, W);
      const y = h(i, 4) * H + Math.sin(tt * 0.3 + i) * 30;
      const r = (26 + 60 * h(i, 5)) * sz;
      ctx.globalAlpha = (0.05 + 0.12 * h(i, 6)) * k * (0.7 + 0.3 * Math.sin(tt * 0.8 + i));
      ctx.drawImage(spr, x - r, y - r, r * 2, r * 2);
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
};

/** Deterministic particle layers drawn on a single canvas. */
export const Particles: React.FC<{specs: ParticleSpec[]; t: number}> = ({specs, t}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    for (const s of specs) {
      ctx.save();
      if (s.clip) {
        const [x0, y0, x1, y1] = s.clip;
        ctx.beginPath();
        ctx.rect(x0 * W, y0 * H, (x1 - x0) * W, (y1 - y0) * H);
        ctx.clip();
      }
      draw(ctx, s, t);
      ctx.restore();
    }
  });
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}} />;
};
