import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import {DepthImage} from '../components/DepthImage';
import {Particles} from '../components/Particles';
import {Post} from '../components/Post';
import data from '../data/prologue.json';
import {mk} from '../lib/look';
import {FPS, clamp, easeInOut, easeOut, hash, ramp, window01} from '../lib/util';

const SERIF = 'Noto Serif SC';
const HAND = 'LXGW';
const MONO = `'DejaVu Sans Mono', 'Noto Sans Mono CJK SC', ${SERIF}`;

export const PROLOGUE_FRAMES = Math.round(data.duration * FPS);

const Backdrop: React.FC<{t: number}> = ({t}) => (
  <>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 50% 40%, #121a2e 0%, #070a14 60%, #020308 100%)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 4px)',
        opacity: 0.6,
      }}
    />
    <Particles t={t} specs={[{kind: 'dust', count: 70, seed: 3, intensity: 0.5}, {kind: 'bokeh', count: 14, seed: 8, intensity: 0.35, color: [120, 160, 255]}]} />
  </>
);

const Intro: React.FC<{t: number}> = ({t}) => {
  const {start, end, text} = data.intro;
  const a = window01(t, start, end, 1.0, 0.8);
  if (a <= 0) return null;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 300,
          fontSize: 40,
          letterSpacing: `${0.3 + 0.12 * ramp(t, start, end)}em`,
          color: 'rgba(235,240,255,0.92)',
          opacity: a,
          filter: `blur(${(1 - a) * 6}px)`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

const LINE_COLOR: Record<string, string> = {
  sys: '#e8ecf4',
  think: '#8aa0c0',
  cmd: '#7ee0a8',
  warn: '#ff6b6b',
  gold: '#ffd27a',
};

const Terminal: React.FC<{t: number}> = ({t}) => {
  const d = data.terminal;
  const a = window01(t, d.start, d.end, 0.7, 0.7);
  if (a <= 0) return null;
  const k = ramp(t, d.start, d.end);
  const cap = d.caption;
  const capA = window01(t, cap.t, d.end, 0.8, 0.6);
  const active = d.lines.filter((l) => t >= l.t);
  const last = active[active.length - 1];
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: a}}>
      <div
        style={{
          position: 'absolute',
          top: 118,
          fontFamily: SERIF,
          fontWeight: 500,
          fontSize: 30,
          letterSpacing: '0.3em',
          color: 'rgba(200,215,240,0.75)',
          opacity: ramp(t, d.start + 0.2, d.start + 1.2),
        }}
      >
        {d.title}
      </div>
      <div
        style={{
          width: 1280,
          height: 560,
          marginTop: -20,
          borderRadius: 14,
          background: 'linear-gradient(180deg, rgba(14,19,30,0.97), rgba(8,11,18,0.97))',
          boxShadow: '0 30px 90px rgba(0,0,0,0.7), 0 0 0 1px rgba(140,170,230,0.18), 0 0 60px rgba(80,130,255,0.12)',
          transform: `perspective(1600px) rotateX(${6 - 4 * easeInOut(k)}deg) scale(${0.96 + 0.06 * easeInOut(k)})`,
          overflow: 'hidden',
        }}
      >
        <div style={{height: 46, display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', background: 'rgba(255,255,255,0.04)'}}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c, opacity: 0.85}} />
          ))}
          <div style={{flex: 1, textAlign: 'center', fontFamily: MONO, fontSize: 18, color: 'rgba(200,210,230,0.55)', marginRight: 60}}>
            agent@sandbox — bash
          </div>
        </div>
        <div style={{padding: '26px 40px', fontFamily: MONO, fontSize: 27, lineHeight: '54px', whiteSpace: 'pre'}}>
          {active.map((l, i) => {
            const n = Math.floor((t - l.t) * d.cps);
            const shown = l.text.slice(0, n);
            const typing = n < l.text.length;
            const blink = l.kind === 'warn' ? 0.55 + 0.45 * Math.abs(Math.sin((t - l.t) * 5)) : 1;
            return (
              <div
                key={i}
                style={{
                  color: LINE_COLOR[l.kind],
                  opacity: blink,
                  fontStyle: l.kind === 'think' ? 'italic' : undefined,
                  textShadow:
                    l.kind === 'gold'
                      ? '0 0 18px rgba(255,200,90,0.75)'
                      : l.kind === 'warn'
                        ? '0 0 14px rgba(255,80,80,0.6)'
                        : '0 0 8px rgba(120,200,255,0.18)',
                }}
              >
                {shown}
                {l === last && (typing || Math.floor(t * 2.2) % 2 === 0) ? <span style={{color: '#cfe'}}>▍</span> : null}
              </div>
            );
          })}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 104,
          fontFamily: HAND,
          fontSize: 46,
          letterSpacing: '0.12em',
          color: '#f6efe2',
          opacity: capA,
          transform: `translateY(${(1 - easeOut(capA)) * 14}px)`,
          textShadow: '0 0 20px rgba(0,0,0,0.9)',
        }}
      >
        {cap.text}
      </div>
    </AbsoluteFill>
  );
};

const CHAT_W = 940;
const BUBBLE_MAX = 600;
const FONT = 29;
const msgHeight = (m: {who: string; text: string}) => {
  if (m.who === 'error') return 40 + Math.ceil((m.text.length * 15) / 760) * 34 + 30;
  const lines = Math.ceil((m.text.length * FONT) / (BUBBLE_MAX - 44));
  return 34 + lines * 44 + 30 + 26;
};

const Avatar: React.FC<{who: string}> = ({who}) =>
  who === 'hakimi' ? (
    <Img
      src={staticFile('chars/hakimi_bust.jpg')}
      style={{width: 72, height: 72, borderRadius: 36, objectFit: 'cover', objectPosition: '50% 18%', boxShadow: '0 0 0 3px rgba(190,150,255,0.6)'}}
    />
  ) : (
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: 36,
        background: 'linear-gradient(135deg, #5b6b86, #2e3747)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: SERIF,
        fontSize: 30,
        color: '#dfe6f2',
      }}
    >
      群
    </div>
  );

const Chat: React.FC<{t: number}> = ({t}) => {
  const d = data.chat;
  const a = window01(t, d.start, d.end, 0.7, 0.7);
  if (a <= 0) return null;
  const shown = d.messages.filter((m) => t >= m.t);
  const viewH = 700;
  let y = 0;
  const pos = shown.map((m) => {
    const p = y;
    y += msgHeight(m);
    return p;
  });
  const scroll = Math.max(0, y - viewH);
  let sm = 0;
  for (let i = 0; i < shown.length; i++) {
    const before = pos[i];
    const target = Math.max(0, before + msgHeight(shown[i]) - viewH);
    sm = Math.max(sm, target * easeOut(clamp((t - shown[i].t) / 0.35)));
  }
  const err = d.messages.find((m) => m.who === 'error')!;
  const g = window01(t, err.t - 0.05, err.t + 0.75, 0.05, 0.4);
  const jx = g > 0 ? (hash(Math.floor(t * 30)) - 0.5) * 26 * g : 0;
  const jy = g > 0 ? (hash(Math.floor(t * 30) + 7) - 0.5) * 10 * g : 0;
  return (
    <AbsoluteFill style={{alignItems: 'center', opacity: a}}>
      <div
        style={{
          position: 'absolute',
          top: 52,
          fontFamily: SERIF,
          fontWeight: 500,
          fontSize: 30,
          letterSpacing: '0.3em',
          color: 'rgba(200,215,240,0.75)',
          opacity: ramp(t, d.start + 0.2, d.start + 1.2),
        }}
      >
        {d.title}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 118,
          width: CHAT_W,
          height: 860,
          borderRadius: 22,
          background: 'linear-gradient(180deg, rgba(22,26,36,0.97), rgba(14,17,24,0.97))',
          boxShadow: `0 30px 90px rgba(0,0,0,0.7), 0 0 0 1px rgba(140,170,230,0.16)${g > 0 ? `, 0 0 ${80 * g}px rgba(255,60,60,${0.5 * g})` : ''}`,
          overflow: 'hidden',
          transform: `translate(${jx}px, ${jy}px) scale(${0.97 + 0.03 * easeOut(ramp(t, d.start, d.start + 1))})`,
        }}
      >
        <div
          style={{
            height: 84,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: SERIF,
            fontWeight: 500,
            fontSize: 28,
            color: '#e6ebf5',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {d.group}
        </div>
        <div style={{position: 'absolute', top: 84 + 36, left: 0, right: 0, height: viewH, overflow: 'hidden'}}>
          {shown.map((m, i) => {
            const p = easeOut(clamp((t - m.t) / 0.3));
            const top = pos[i] - Math.min(sm, scroll);
            if (m.who === 'error') {
              return (
                <div key={i} style={{position: 'absolute', top, left: 70, right: 70, display: 'flex', justifyContent: 'center', opacity: p}}>
                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: 22,
                      lineHeight: '34px',
                      padding: '12px 22px',
                      borderRadius: 10,
                      color: '#ffb3b3',
                      background: 'rgba(120,20,30,0.55)',
                      border: '1px solid rgba(255,90,90,0.5)',
                      textAlign: 'center',
                      textShadow: g > 0 ? `${4 * g}px 0 rgba(255,0,60,0.8), ${-4 * g}px 0 rgba(0,200,255,0.8)` : undefined,
                    }}
                  >
                    ⚠ {m.text}
                  </div>
                </div>
              );
            }
            const hk = m.who === 'hakimi';
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top,
                  left: 40,
                  display: 'flex',
                  gap: 20,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 26}px) scale(${0.92 + 0.08 * p})`,
                  transformOrigin: '0 0',
                }}
              >
                <Avatar who={m.who} />
                <div>
                  <div style={{fontFamily: SERIF, fontSize: 21, color: hk ? '#c9a8ff' : '#8f9bb0', marginBottom: 8}}>
                    {m.name}
                    {hk ? <span style={{marginLeft: 10, fontSize: 16, padding: '1px 8px', borderRadius: 6, background: 'rgba(170,120,255,0.25)', color: '#d9c4ff'}}>机器人</span> : null}
                  </div>
                  <div
                    style={{
                      maxWidth: BUBBLE_MAX,
                      padding: '15px 22px',
                      borderRadius: '6px 22px 22px 22px',
                      fontFamily: SERIF,
                      fontWeight: 500,
                      fontSize: FONT,
                      lineHeight: '44px',
                      color: hk ? '#2a1a40' : '#e8ecf4',
                      background: hk ? 'linear-gradient(135deg, #e9dcff, #cdb6ff)' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {g > 0 ? (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          {[0, 1, 2, 3, 4].map((i) => {
            const hy = hash(Math.floor(t * 24) * 5 + i);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: hy * 1080,
                  height: 6 + hash(i + Math.floor(t * 24)) * 40,
                  background: i % 2 ? 'rgba(255,40,80,0.18)' : 'rgba(60,200,255,0.14)',
                  opacity: g,
                  transform: `translateX(${(hash(i * 3 + Math.floor(t * 24)) - 0.5) * 120}px)`,
                  mixBlendMode: 'screen',
                }}
              />
            );
          })}
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

const Cast: React.FC<{t: number}> = ({t}) => {
  const d = data.cast;
  const a = window01(t, d.start, d.end, 0.8, 0.9);
  if (a <= 0) return null;
  return (
    <AbsoluteFill style={{opacity: a}}>
      {d.cards.map((c, i) => {
        const p = easeOut(clamp((t - c.t) / 1.1));
        const left = i === 0 ? 150 : 1010;
        const glow = i === 0 ? '110,170,255' : '190,140,255';
        return (
          <div key={c.name} style={{position: 'absolute', left, top: 150, width: 760, height: 780, opacity: p}}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 420,
                height: 620,
                borderRadius: 18,
                backgroundImage: `url(${staticFile(c.img === 'hakimi' ? 'chars/hakimi_bust.jpg' : 'hd/K01.jpg')})`,
                backgroundSize: c.img === 'hakimi' ? 'cover' : '1500px auto',
                backgroundPosition: c.img === 'hakimi' ? '50% 20%' : '-700px -20px',
                boxShadow: `0 0 70px rgba(${glow},0.35), 0 30px 60px rgba(0,0,0,0.6)`,
                transform: `translateY(${(1 - p) * 30}px) scale(${1.04 - 0.04 * p + 0.02 * ramp(t, c.t, d.end)})`,
                WebkitMaskImage: 'linear-gradient(180deg, #000 70%, transparent 100%)',
              }}
            />
            <div style={{position: 'absolute', left: 450, top: 40, width: 320}}>
              <div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 64, letterSpacing: '0.18em', color: '#f6f1e8', textShadow: `0 0 30px rgba(${glow},0.6)`}}>
                {c.name}
              </div>
              <div style={{fontFamily: SERIF, fontSize: 22, letterSpacing: '0.4em', color: `rgba(${glow},0.95)`, marginTop: 10, marginBottom: 40}}>{c.tag}</div>
              {c.lines.map((l, j) => {
                const q = easeOut(clamp((t - c.t - 0.7 - j * 0.6) / 0.7));
                return (
                  <div
                    key={j}
                    style={{
                      fontFamily: HAND,
                      fontSize: 34,
                      lineHeight: '64px',
                      color: '#ece6dc',
                      opacity: q,
                      transform: `translateX(${(1 - q) * 16}px)`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {l}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Outro: React.FC<{t: number}> = ({t}) => {
  const d = data.outro;
  if (t < d.start) return null;
  const end = data.duration;
  const gA = ramp(t, d.globe, d.globe + 2.2);
  const k = ramp(t, d.globe, end);
  const look = mk({zoom: 1.32 - 0.18 * easeInOut(k), cy: 0.5, px: 0.006 * k, focus: 0.5, exposure: 0.9 + 0.1 * gA, vignette: 0.75});
  return (
    <AbsoluteFill style={{opacity: 1 - ramp(t, end - 1.3, end - 0.1)}}>
      <div style={{position: 'absolute', inset: 0, background: '#000', opacity: ramp(t, d.start, d.start + 0.6)}} />
      {gA > 0 ? (
        <AbsoluteFill style={{opacity: gA, filter: gA < 1 ? `blur(${(1 - gA) * 10}px)` : undefined}}>
          <DepthImage name="B01" look={look} />
          <Particles t={t} specs={[{kind: 'snow', count: 160, seed: 5, intensity: 0.8}]} />
        </AbsoluteFill>
      ) : null}
      <Particles t={t} specs={[{kind: 'embers', count: 24, seed: 24, intensity: 0.9 * (1 - gA * 0.6), origin: [0.5, 1.05], spread: 0.8}]} />
      {d.lines.map((l, i) => {
        const next = d.lines[i + 1]?.t ?? d.globe + 1.4;
        const a = window01(t, l.t, next - 0.1, 0.9, 0.6);
        if (a <= 0) return null;
        return (
          <AbsoluteFill key={i} style={{alignItems: 'center', justifyContent: 'center'}}>
            <div
              style={{
                fontFamily: HAND,
                fontSize: 54,
                letterSpacing: '0.16em',
                color: '#f6efe2',
                opacity: a,
                filter: `blur(${(1 - a) * 5}px)`,
                transform: `translateY(${(1 - a) * 12}px)`,
                textShadow: '0 0 26px rgba(255,190,110,0.35), 0 2px 10px rgba(0,0,0,0.8)',
              }}
            >
              {l.text}
            </div>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

export const Prologue: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Audio src={staticFile('audio/prologue.wav')} />
      <AbsoluteFill style={{opacity: ramp(t, 0, 0.8)}}>
        <Backdrop t={t} />
      </AbsoluteFill>
      <Intro t={t} />
      <Terminal t={t} />
      <Chat t={t} />
      <Cast t={t} />
      <Outro t={t} />
      <Post frame={frame} grain={0.08} paper={0.04} />
    </AbsoluteFill>
  );
};
