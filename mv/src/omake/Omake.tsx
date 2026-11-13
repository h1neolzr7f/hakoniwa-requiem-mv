import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import {Post} from '../components/Post';
import data from '../data/omake.json';
import {FPS, clamp, easeInOut, easeOut, lerp, ramp, window01} from '../lib/util';

const HAND = 'LXGW';
const SERIF = 'Noto Serif SC';
const INK = '#17131c';
const PAPER = '#f4ecdf';

export const OMAKE_FRAMES = Math.round(data.duration * FPS);

type PanelData = (typeof data.panels)[number];
type Bubble = PanelData['bubbles'][number];

/** Overshooting pop used for bubbles and sound effects. */
const pop = (t: number, at: number, dur = 0.32) => {
  const x = clamp((t - at) / dur);
  if (x <= 0) return 0;
  const s = 1.70158 * 1.6;
  const y = x - 1;
  return 1 + (s + 1) * y * y * y + s * y * y;
};

const burst = (w: number, h: number, n = 22) => {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? 0.5 : 0.4 + 0.04 * Math.sin(i * 2.7);
    pts.push(`${(0.5 + Math.cos(a) * r) * w},${(0.5 + Math.sin(a) * r) * h}`);
  }
  return pts.join(' ');
};

const SpeechBubble: React.FC<{b: Bubble; t: number; W: number; H: number; u: number}> = ({b, t, W, H, u}) => {
  const p = pop(t, b.t);
  if (p <= 0) return null;
  const lines = b.text.split('\n');
  const shout = b.style === 'shout';
  const solemn = b.style === 'solemn';
  const happy = b.style === 'happy';
  const fs = (shout ? 50 : 44) * u;
  const w = b.w * W;
  const h = (lines.length * fs * 1.42 + 56 * u) * (shout ? 1.5 : 1);
  const x = b.x * W;
  const y = b.y * H;
  const tx = b.tail[0] * W;
  const ty = b.tail[1] * H;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const ang = Math.atan2(ty - cy, tx - cx);
  const base = 26 * u;
  const nx = -Math.sin(ang) * base;
  const ny = Math.cos(ang) * base;
  const fill = solemn ? 'rgba(18,16,28,0.92)' : '#fffdf8';
  const stroke = happy ? '#e07aa8' : solemn ? '#c9b48a' : INK;
  const sw = (shout ? 6 : 5) * u;
  const reveal = Math.floor(clamp((t - b.t) / Math.max(0.35, b.text.length * 0.05)) * b.text.length);
  let left = reveal;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, pointerEvents: 'none'}}>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <g transform={`translate(${cx} ${cy}) scale(${p}) translate(${-cx} ${-cy})`}>
          {shout ? null : (
            <polygon
              points={`${cx + nx},${cy + ny} ${cx - nx},${cy - ny} ${lerp(cx, tx, 0.92)},${lerp(cy, ty, 0.92)}`}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
              strokeLinejoin="round"
            />
          )}
          {shout ? (
            <g transform={`translate(${x - w * 0.08} ${y - h * 0.02})`}>
              <polygon points={burst(w * 1.16, h * 1.04)} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="miter" />
            </g>
          ) : (
            <rect x={x} y={y} width={w} height={h} rx={solemn ? 10 * u : h / 2.4} fill={fill} stroke={stroke} strokeWidth={sw} />
          )}
          {shout ? null : (
            <polygon
              points={`${cx + nx * 0.8},${cy + ny * 0.8} ${cx - nx * 0.8},${cy - ny * 0.8} ${lerp(cx, tx, 0.86)},${lerp(cy, ty, 0.86)}`}
              fill={fill}
            />
          )}
        </g>
      </svg>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: w,
          height: h,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: solemn ? SERIF : HAND,
          fontWeight: solemn ? 600 : 700,
          fontSize: fs,
          lineHeight: 1.42,
          color: solemn ? '#f3e7c8' : INK,
          transform: `scale(${p})`,
          transformOrigin: `${w / 2}px ${h / 2}px`,
          whiteSpace: 'nowrap',
          letterSpacing: shout ? '0.02em' : '0.04em',
        }}
      >
        {lines.map((l, i) => {
          const n = Math.max(0, Math.min(l.length, left));
          left -= l.length;
          return (
            <div key={i}>
              <span>{l.slice(0, n)}</span>
              <span style={{opacity: 0}}>{l.slice(n)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Sfx: React.FC<{s: PanelData['sfx'][number]; t: number; W: number; H: number; u: number}> = ({s, t, W, H, u}) => {
  const p = pop(t, s.t, 0.26);
  if (p <= 0) return null;
  const shake = t - s.t < 0.5 ? Math.sin((t - s.t) * 70) * 5 * u * (1 - (t - s.t) / 0.5) : 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: s.x * W,
        top: s.y * H,
        fontFamily: HAND,
        fontWeight: 700,
        fontSize: s.size * u,
        color: '#fff',
        WebkitTextStroke: `${7 * u}px ${INK}`,
        paintOrder: 'stroke fill',
        transform: `translate(${shake}px, 0) rotate(${s.rot}deg) scale(${p})`,
        transformOrigin: 'center',
        whiteSpace: 'nowrap',
        textShadow: `${5 * u}px ${5 * u}px 0 rgba(0,0,0,0.25)`,
      }}
    >
      {s.text}
    </div>
  );
};

export const PanelView: React.FC<{panel: PanelData; t: number; W: number; H: number; cam: number}> = ({panel, t, W, H, cam}) => {
  const u = W / 1920;
  const [a, b] = panel.cam;
  const k = easeInOut(cam);
  const z = lerp(a[0], b[0], k);
  const cx = lerp(a[1], b[1], k);
  const cy = lerp(a[2], b[2], k);
  const tf = `translate(${(0.5 - cx) * W * z}px, ${(0.5 - cy) * H * z}px) scale(${z})`;
  const patch = 'patch' in panel ? panel.patch : undefined;
  const err = 'error' in panel ? panel.error : undefined;
  const cap = 'caption' in panel ? panel.caption : undefined;
  const ep = err ? pop(t, err.t, 0.3) : 0;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#000'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transform: tf, transformOrigin: '50% 50%'}}>
        <Img src={staticFile(`hd/${panel.img}.jpg`)} style={{position: 'absolute', left: 0, top: 0, width: W, height: H}} />
        {patch ? (
          <div
            style={{
              position: 'absolute',
              left: patch.x * W,
              top: patch.y * H,
              width: patch.w * W,
              height: patch.h * H,
              background: 'linear-gradient(170deg, #fbf6ea, #ece2cc)',
              transform: `rotate(${patch.rot}deg)`,
              boxShadow: `0 ${2 * u}px ${8 * u}px rgba(0,0,0,0.25)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: HAND,
              color: '#3a2c22',
            }}
          >
            <div style={{fontSize: 40 * u, fontWeight: 700}}>{patch.lines[0]}</div>
            <div style={{fontSize: 52 * u, fontWeight: 700, color: '#b0302c'}}>{patch.lines[1]}</div>
            <div style={{fontSize: 22 * u, opacity: 0.7}}>{patch.lines[2]}</div>
          </div>
        ) : null}
        {panel.sfx.map((s, i) => (
          <Sfx key={i} s={s} t={t} W={W} H={H} u={u} />
        ))}
        {panel.bubbles.map((bb, i) => (
          <SpeechBubble key={i} b={bb} t={t} W={W} H={H} u={u} />
        ))}
        {err && ep > 0 ? (
          <div
            style={{
              position: 'absolute',
              left: err.x * W,
              top: err.y * H,
              width: 520 * u,
              transform: `scale(${ep})`,
              transformOrigin: '0 0',
              borderRadius: 10 * u,
              overflow: 'hidden',
              boxShadow: `0 ${10 * u}px ${30 * u}px rgba(0,0,0,0.5)`,
              border: `${3 * u}px solid #2a2a2a`,
            }}
          >
            <div style={{background: '#d33a3a', color: '#fff', fontFamily: SERIF, fontWeight: 600, fontSize: 24 * u, padding: `${8 * u}px ${16 * u}px`}}>⚠ 错误</div>
            <div style={{background: '#f7f7f7', color: '#222', fontFamily: SERIF, fontSize: 28 * u, lineHeight: 1.5, padding: `${16 * u}px ${20 * u}px`, whiteSpace: 'pre'}}>
              {err.text}
            </div>
          </div>
        ) : null}
      </div>
      {cap && t >= cap.t ? (
        <div
          style={{
            position: 'absolute',
            left: cap.x * W,
            top: cap.y * H,
            padding: `${10 * u}px ${22 * u}px`,
            background: PAPER,
            border: `${4 * u}px solid ${INK}`,
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 34 * u,
            color: INK,
            opacity: easeOut(clamp((t - cap.t) / 0.4)),
          }}
        >
          {cap.text}
        </div>
      ) : null}
    </div>
  );
};

const Framed: React.FC<{children: React.ReactNode; W: number; H: number; border?: number}> = ({children, W, H, border = 7}) => (
  <div style={{position: 'relative', width: W, height: H, boxShadow: `0 0 0 ${border}px ${INK}, 0 18px 40px rgba(0,0,0,0.35)`, overflow: 'hidden'}}>
    {children}
  </div>
);

const TitleCard: React.FC<{t: number}> = ({t}) => {
  const d = data.title;
  const a = window01(t, d.start, d.end, 0.4, 0.4);
  if (a <= 0) return null;
  const sp = pop(t, d.start + 0.7, 0.4);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: a}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 46}}>
        <div
          style={{
            width: 150,
            height: 150,
            borderRadius: 75,
            border: '7px solid #c0392b',
            color: '#c0392b',
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `rotate(-12deg) scale(${sp})`,
          }}
        >
          {d.kicker}
        </div>
        <div style={{fontFamily: HAND, fontWeight: 700, fontSize: 120, color: INK, letterSpacing: '0.08em', opacity: easeOut(ramp(t, d.start, d.start + 0.6))}}>
          {d.text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const FW = 1840;
const FH = 1035;

export const Omake: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const panels = data.panels;
  const g = data.grid;
  const gridK = easeInOut(ramp(t, g.start, g.start + 1.3));
  const end = data.duration;
  return (
    <AbsoluteFill style={{background: PAPER}}>
      <Audio src={staticFile('audio/omake.wav')} />
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(23,19,28,0.09) 2px, transparent 2.5px)',
          backgroundSize: '26px 26px',
          backgroundPosition: `${(t * 12) % 26}px ${(t * 6) % 26}px`,
        }}
      />
      <TitleCard t={t} />
      {gridK < 1
        ? panels.map((p, i) => {
            const next = panels[i + 1]?.start ?? g.start + 1.3;
            if (t < p.start || t > next + 0.5) return null;
            const inK = easeOut(clamp((t - p.start) / 0.5));
            const x = (1 - inK) * 1920 * (i === 0 ? 0 : 1);
            const op = i === 0 ? inK : 1;
            const shrink = i === panels.length - 1 ? 1 - gridK : 1;
            const s = lerp(GW / FW, 1, shrink);
            const tx = lerp(GW / 2 + 22, 0, shrink);
            const ty = lerp(112 + GH + 36 + GH / 2 - 540, 0, shrink);
            return (
              <AbsoluteFill
                key={p.img}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: op * (1 - gridK),
                  transform: `translate(${x + tx}px, ${ty}px) rotate(${(1 - inK) * 3}deg) scale(${s})`,
                }}
              >
                <Framed W={FW} H={FH}>
                  <PanelView panel={p} t={t} W={FW} H={FH} cam={ramp(t, p.start, next + 0.5)} />
                </Framed>
              </AbsoluteFill>
            );
          })
        : null}
      {gridK > 0 ? <Grid t={t} k={gridK} /> : null}
      <AbsoluteFill style={{background: '#000', opacity: Math.max(1 - ramp(t, 0, 0.6), ramp(t, end - 1.0, end - 0.05))}} />
      <Post frame={frame} grain={0.05} paper={0.1} />
    </AbsoluteFill>
  );
};

const GW = 736;
const GH = 414;

const Grid: React.FC<{t: number; k: number}> = ({t, k}) => {
  const g = data.grid;
  return (
    <AbsoluteFill style={{opacity: k}}>
      <div style={{position: 'absolute', top: 30, left: 0, right: 0, textAlign: 'center', fontFamily: HAND, fontWeight: 700, fontSize: 52, color: INK, letterSpacing: '0.1em'}}>
        四格漫画 · 死讯是假的
      </div>
      {data.panels.map((p, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const pk = easeOut(clamp((t - g.start - i * 0.12) / 0.6));
        return (
          <div
            key={p.img}
            style={{
              position: 'absolute',
              left: 960 - GW - 22 + col * (GW + 44),
              top: 112 + row * (GH + 36),
              transform: `scale(${0.9 + 0.1 * pk})`,
              opacity: pk,
            }}
          >
            <Framed W={GW} H={GH} border={5}>
              <PanelView panel={p} t={999} W={GW} H={GH} cam={1} />
            </Framed>
            <div
              style={{
                position: 'absolute',
                left: -14,
                top: -14,
                width: 44,
                height: 44,
                borderRadius: 22,
                background: INK,
                color: PAPER,
                fontFamily: SERIF,
                fontWeight: 600,
                fontSize: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {i + 1}
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          bottom: 34,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 34,
          color: INK,
          letterSpacing: '0.2em',
          opacity: easeOut(ramp(t, g.start + 1.2, g.start + 2)),
        }}
      >
        {g.footer}
      </div>
    </AbsoluteFill>
  );
};

/** Vertical 4-koma strip for posting as a single image. */
export const STRIP_W = 1080;
export const STRIP_H = 2900;

export const ComicStrip: React.FC = () => {
  const PW = 1000;
  const PH = 562;
  return (
    <AbsoluteFill style={{background: PAPER}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(23,19,28,0.08) 2px, transparent 2.5px)', backgroundSize: '24px 24px'}} />
      <div style={{position: 'absolute', top: 56, left: 0, right: 0, textAlign: 'center'}}>
        <div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 30, letterSpacing: '0.5em', color: '#c0392b'}}>《箱庭的镇魂曲》彩蛋</div>
        <div style={{fontFamily: HAND, fontWeight: 700, fontSize: 92, color: INK, letterSpacing: '0.1em', marginTop: 10}}>死讯是假的</div>
      </div>
      {data.panels.map((p, i) => (
        <div key={p.img} style={{position: 'absolute', left: (STRIP_W - PW) / 2, top: 260 + i * (PH + 46)}}>
          <Framed W={PW} H={PH} border={6}>
            <PanelView panel={p} t={999} W={PW} H={PH} cam={1} />
          </Framed>
        </div>
      ))}
      <div
        style={{
          position: 'absolute',
          bottom: 70,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 34,
          letterSpacing: '0.18em',
          color: INK,
        }}
      >
        {data.grid.footer}
      </div>
    </AbsoluteFill>
  );
};
