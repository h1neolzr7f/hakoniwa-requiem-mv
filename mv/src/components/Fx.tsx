import React, {useLayoutEffect, useRef} from 'react';
import {Look, toScreen} from '../lib/look';
import {H, W, clamp, easeInOut, easeOut, hash, lerp, ramp, smooth} from '../lib/util';

const full: React.CSSProperties = {position: 'absolute', inset: 0, pointerEvents: 'none'};

/** Soft volumetric beam from a point, screen-blended. */
export const GodRay: React.FC<{x: number; y: number; angle: number; width: number; amt: number; color?: string}> = ({
  x,
  y,
  angle,
  width,
  amt,
  color = '255,226,170',
}) => (
  <div style={{...full, mixBlendMode: 'screen', opacity: clamp(amt)}}>
    {[0, 1, 2].map((k) => (
      <div
        key={k}
        style={{
          position: 'absolute',
          left: x * W,
          top: y * H,
          width: 2600,
          height: width * (0.6 + k * 0.45),
          transformOrigin: '0 50%',
          transform: `translateY(-50%) rotate(${angle + (k - 1) * 4}deg)`,
          background: `linear-gradient(90deg, rgba(${color},${0.55 - k * 0.14}) 0%, rgba(${color},${0.18 - k * 0.04}) 45%, rgba(${color},0) 100%)`,
          filter: 'blur(28px)',
          borderRadius: '50%',
        }}
      />
    ))}
  </div>
);

/** Frost creeping in from the frame edges (amt 0..1). */
export const Frost: React.FC<{amt: number}> = ({amt}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    if (amt <= 0) return;
    ctx.strokeStyle = 'rgba(225,238,255,0.55)';
    ctx.lineCap = 'round';
    const branch = (x: number, y: number, a: number, len: number, depth: number, seed: number) => {
      if (depth > 4 || len < 4) return;
      const steps = 6;
      let px = x;
      let py = y;
      ctx.lineWidth = Math.max(0.5, 2.2 - depth * 0.45);
      ctx.beginPath();
      ctx.moveTo(px, py);
      for (let s = 1; s <= steps; s++) {
        const aa = a + (hash(seed + s) - 0.5) * 0.5;
        px += (Math.cos(aa) * len) / steps;
        py += (Math.sin(aa) * len) / steps;
        ctx.lineTo(px, py);
        if (hash(seed * 3 + s) > 0.55) {
          const side = hash(seed + s * 7) > 0.5 ? 1 : -1;
          branch(px, py, aa + side * (0.6 + hash(seed + s) * 0.5), len * 0.45, depth + 1, seed * 1.7 + s);
        }
      }
      ctx.stroke();
    };
    for (let i = 0; i < 70; i++) {
      const edge = i % 4;
      const u = hash(i * 1.3);
      const [x, y, a] =
        edge === 0 ? [u * W, 0, Math.PI / 2] : edge === 1 ? [u * W, H, -Math.PI / 2] : edge === 2 ? [0, u * H, 0] : [W, u * H, Math.PI];
      const len = (60 + hash(i * 2.7) * 220) * easeOut(amt) * (edge >= 2 ? 1.3 : 1);
      branch(x, y, a + (hash(i) - 0.5) * 0.9, len, 0, i + 1);
    }
  });
  return (
    <>
      <div
        style={{
          ...full,
          mixBlendMode: 'screen',
          opacity: amt,
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0) 48%, rgba(150,185,230,0.35) 82%, rgba(220,235,255,0.75) 100%)',
        }}
      />
      <canvas ref={ref} width={W} height={H} style={{...full, opacity: Math.min(1, amt * 1.4), filter: 'blur(0.6px)'}} />
    </>
  );
};

/** Ink handwriting revealed glyph by glyph, anchored to image coordinates. */
export const Handwriting: React.FC<{
  look: Look;
  t: number;
  lines: {text: string; u: number; v: number; start: number; dur: number; rot?: number; size?: number}[];
  color?: string;
}> = ({look, t, lines, color = 'rgba(48,30,18,0.88)'}) => (
  <div style={full}>
    {lines.map((ln, i) => {
      const p = toScreen(look, ln.u, ln.v);
      const chars = [...ln.text];
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            transform: `rotate(${ln.rot ?? -4}deg) scale(${look.zoom / 1.1})`,
            transformOrigin: '0 0',
            fontFamily: 'LXGW',
            fontSize: ln.size ?? 46,
            color,
            mixBlendMode: 'multiply',
            whiteSpace: 'nowrap',
          }}
        >
          {chars.map((c, j) => {
            const ct = ln.start + (ln.dur * j) / chars.length;
            const a = ramp(t, ct, ct + 0.35);
            return (
              <span key={j} style={{opacity: a, filter: `blur(${(1 - a) * 3}px)`}}>
                {c}
              </span>
            );
          })}
        </div>
      );
    })}
  </div>
);

/** Twenty-four embers lifted from a matchbox one by one into a crown of light. */
export const TwentyFourEmbers: React.FC<{
  look: Look;
  t: number;
  origin: [number, number];
  start: number;
  end: number;
  /** 0 = gathering; 1 = all consumed and drifting away. */
  release?: number;
}> = ({look, t, origin, start, end, release = 0}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    const o = toScreen(look, origin[0], origin[1]);
    ctx.globalCompositeOperation = 'lighter';
    const glow = (x: number, y: number, r: number, a: number, inner = 'rgba(255,248,225,') => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `${inner}${a})`);
      g.addColorStop(0.18, `rgba(255,200,110,${a * 0.75})`);
      g.addColorStop(0.5, `rgba(255,140,50,${a * 0.18})`);
      g.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };
    for (let k = 0; k < 24; k++) {
      const born = start + ((end - start) * k) / 24;
      const age = t - born;
      if (age < 0) continue;
      const ang = Math.PI * (1.08 + (0.84 * k) / 23);
      const tx = W * 0.5 + Math.cos(ang) * W * 0.36;
      const ty = H * 0.47 + Math.sin(ang) * H * 0.32;
      const fly = easeInOut(age / 1.1);
      const cx = lerp(o.x, tx, fly);
      const cy = lerp(o.y, ty, fly) - Math.sin(fly * Math.PI) * 120;
      const bob = Math.sin(t * 2 + k) * 6 * fly;
      const rel = clamp(release);
      const drift = rel * (240 + hash(k) * 300);
      const x = cx + Math.sin(t * 0.7 + k) * 10 * rel;
      const y = cy + bob - drift;
      const a = (0.9 + 0.1 * Math.sin(t * 9 + k * 3)) * (1 - smooth(rel * 1.2 - hash(k) * 0.2));
      for (let s = 1; s <= 6 && fly < 1; s++) {
        const f2 = easeInOut((age - s * 0.05) / 1.1);
        if (f2 <= 0) continue;
        glow(lerp(o.x, tx, f2), lerp(o.y, ty, f2) - Math.sin(f2 * Math.PI) * 120, 22, 0.16 * a * (1 - s / 7));
      }
      glow(x, y, 46 + 18 * Math.exp(-age * 3), a);
      if (age < 0.25) glow(o.x, o.y, 120 * (1 - age / 0.25), 0.5);
    }
  });
  return <canvas ref={ref} width={W} height={H} style={full} />;
};

const measured = new Map<string, SVGPathElement>();
const measurePath = (d: string) => {
  let el = measured.get(d);
  if (!el) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('style', 'position:absolute;width:0;height:0;visibility:hidden');
    el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    el.setAttribute('d', d);
    svg.appendChild(el);
    document.body.appendChild(svg);
    measured.set(d, el);
  }
  return el;
};

/** A thread of light stitching across the frame. progress 0..1 */
export const GoldenThread: React.FC<{progress: number; t: number; amt: number}> = ({progress, t, amt}) => {
  const d =
    'M -60 820 C 260 640, 420 980, 700 760 S 1020 520, 990 640 S 900 760, 1060 640 S 1400 300, 1640 420 S 1900 200, 2000 160';
  const len = 3200;
  const p = clamp(progress);
  const el = measurePath(d);
  const pt = el.getPointAtLength(el.getTotalLength() * p);
  return (
    <svg width={W} height={H} style={{...full, opacity: amt, mixBlendMode: 'screen'}}>
      <path d={d} fill="none" stroke="rgba(255,190,90,0.35)" strokeWidth={14} strokeDasharray={`${len * p} ${len}`} style={{filter: 'blur(10px)'}} />
      <path d={d} fill="none" stroke="rgba(255,226,160,0.9)" strokeWidth={3.2} strokeDasharray={`${len * p} ${len}`} style={{filter: 'blur(0.8px)'}} />
      {[...Array(28)].map((_, i) => {
        const q = (i + 1) / 29;
        if (q > p) return null;
        const pp = el.getPointAtLength(el.getTotalLength() * q);
        const tw = 0.5 + 0.5 * Math.sin(t * 4 + i * 1.7);
        return <circle key={i} cx={pp.x} cy={pp.y} r={2.5 + tw * 2} fill={`rgba(255,240,200,${0.4 + tw * 0.5})`} />;
      })}
      <circle cx={pt.x} cy={pt.y} r={34} fill="rgba(255,210,130,0.35)" style={{filter: 'blur(12px)'}} />
      <circle cx={pt.x} cy={pt.y} r={7} fill="rgba(255,250,235,0.95)" />
    </svg>
  );
};

/** A specular sweep across glass (snow globe). */
export const GlassSweep: React.FC<{look: Look; center: [number, number]; radius: number; phase: number; amt: number}> = ({
  look,
  center,
  radius,
  phase,
  amt,
}) => {
  const c = toScreen(look, center[0], center[1]);
  const r = radius * H * look.zoom;
  const x = lerp(-0.8, 0.8, phase);
  return (
    <div
      style={{
        position: 'absolute',
        left: c.x - r,
        top: c.y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: '50%',
        overflow: 'hidden',
        mixBlendMode: 'screen',
        opacity: amt,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '-30%',
          transform: `translateX(${x * 100}%) rotate(25deg)`,
          background: 'linear-gradient(90deg, rgba(255,255,255,0) 35%, rgba(220,235,255,0.45) 48%, rgba(255,255,255,0.75) 50%, rgba(220,235,255,0.45) 52%, rgba(255,255,255,0) 65%)',
          filter: 'blur(6px)',
        }}
      />
    </div>
  );
};

/** Terminal text typed onto the monitor in the real-world room. */
export const MonitorText: React.FC<{look: Look; t: number; start: number; lines: string[]}> = ({look, t, start, lines}) => {
  const a = toScreen(look, 0.652, 0.272);
  const b = toScreen(look, 0.836, 0.512);
  const w = b.x - a.x;
  const all = lines.join('\n');
  const n = Math.floor(clamp((t - start) / (all.length * 0.16)) * all.length);
  const shown = all.slice(0, n);
  const cursor = Math.floor(t * 2) % 2 === 0;
  const panel = clamp((t - start + 0.9) / 0.6);
  return (
    <div
      style={{
        position: 'absolute',
        left: a.x,
        top: a.y,
        width: w,
        height: b.y - a.y,
        opacity: panel,
        background: 'radial-gradient(ellipse at 50% 45%, rgba(14,24,42,0.97), rgba(6,10,20,0.97))',
        boxShadow: `0 0 ${w * 0.12}px rgba(110,170,255,0.35)`,
        borderRadius: w * 0.008,
        padding: `${w * 0.07}px ${w * 0.08}px`,
        boxSizing: 'border-box',
        fontFamily: 'Noto Serif SC',
        fontWeight: 500,
        fontSize: w * 0.085,
        lineHeight: 1.7,
        color: 'rgba(205,230,255,0.96)',
        textShadow: `0 0 ${w * 0.03}px rgba(120,190,255,0.9)`,
        whiteSpace: 'pre',
      }}
    >
      {shown}
      <span style={{opacity: cursor ? 1 : 0}}>▍</span>
    </div>
  );
};

/** Gentle film-projector flicker multiplier for memory scenes. */
export const filmFlicker = (t: number) => 0.94 + 0.06 * hash(Math.floor(t * 12)) + 0.03 * Math.sin(t * 31);
