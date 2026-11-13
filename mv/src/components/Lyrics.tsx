import React from 'react';
import lyrics from '../data/lyrics.json';
import {GLOW, LAYOUT, Layout} from '../data/lyricStyle';
import {clamp, easeOut, ramp} from '../lib/util';

type Line = {section: string; text: string; start: number; end: number; chars: {c: string; t: number}[]};
const LINES = lyrics as Line[];

const IN = 0.5;
const OUT = 0.75;

/** When each line starts leaving the screen. */
const exitAt = LINES.map((l, i) => {
  const next = LINES[i + 1];
  const hold = l.end + 1.2;
  return next ? Math.max(l.end + 0.2, Math.min(hold, next.start - 0.25)) : hold + 2;
});

const isHan = (c: string) => /[\u4e00-\u9fff]/.test(c);

type Box = {
  style: React.CSSProperties;
  vertical?: boolean;
  size: number;
  phraseGap?: number;
  stagger?: number;
  font?: string;
  smallFirst?: boolean;
};

const box = (layout: Layout): Box => {
  switch (layout) {
    case 'bottom':
      return {style: {left: 0, right: 0, bottom: 150, textAlign: 'center'}, size: 54, phraseGap: 46};
    case 'bottom-l':
      return {style: {left: 150, bottom: 150}, size: 54, stagger: 90};
    case 'top-l':
      return {style: {left: 150, top: 120}, size: 54, stagger: 90};
    case 'top-r':
      return {style: {right: 150, top: 120, textAlign: 'right'}, size: 54, stagger: -90};
    case 'v-right':
      return {style: {right: 150, top: 120}, size: 54, vertical: true, stagger: 110};
    case 'v-left':
      return {style: {left: 150, top: 120}, size: 54, vertical: true, stagger: 110};
    case 'center':
      return {style: {left: 0, right: 0, top: 460, textAlign: 'center'}, size: 64, phraseGap: 56};
    case 'center-big':
      return {style: {left: 0, right: 0, top: 380, textAlign: 'center'}, size: 108, smallFirst: true};
    case 'dialog-l':
      return {style: {left: 170, bottom: 230}, size: 52, font: 'LXGW', stagger: 70};
    case 'dialog-r':
      return {style: {right: 170, top: 170, textAlign: 'right'}, size: 52, font: 'LXGW', stagger: -70};
    case 'soft':
      return {style: {left: 0, right: 0, top: 470, textAlign: 'center'}, size: 58, font: 'LXGW', phraseGap: 40};
  }
};

const Glyph: React.FC<{c: string; ct: number; t: number; out: number; i: number; big: boolean; glow: string; vertical?: boolean}> = ({
  c,
  ct,
  t,
  out,
  i,
  big,
  glow,
  vertical,
}) => {
  const a = ramp(t, ct - 0.1, ct - 0.1 + IN);
  const o = ramp(t, out + i * 0.025, out + i * 0.025 + OUT);
  const op = a * (1 - o);
  const flash = Math.exp(-Math.max(0, t - ct) * 2.6) * a;
  const rise = (1 - easeOut(a)) * 16 - o * 22;
  const blur = (1 - a) * 7 + o * 9;
  const scale = big ? 1 + (1 - easeOut(a)) * 0.35 : 1;
  return (
    <span
      style={{
        display: 'inline-block',
        opacity: op,
        filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
        transform: vertical ? `translateX(${-rise * 0.3}px) translateY(${rise}px) scale(${scale})` : `translateY(${rise}px) scale(${scale})`,
        textShadow: `0 0 ${10 + flash * 30}px rgba(${glow},${0.55 + flash * 0.4}), 0 0 ${34 + flash * 40}px rgba(${glow},${0.22 + flash * 0.3}), 0 2px 6px rgba(0,0,0,0.6), 0 0 22px rgba(0,0,0,0.32)`,
      }}
    >
      {c === ' ' ? '\u3000' : c}
    </span>
  );
};

export const Lyrics: React.FC<{t: number}> = ({t}) => (
  <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
    {LINES.map((line, li) => {
      if (t < line.start - 0.5 || t > exitAt[li] + OUT + 0.9) return null;
      const layout = LAYOUT[li];
      const b = box(layout);
      const glow = GLOW[line.section] ?? '255,220,180';
      const out = exitAt[li];
      const phrases: {c: string; t: number}[][] = [[]];
      for (const ch of line.chars) {
        if (ch.c === ' ') phrases.push([]);
        else phrases[phrases.length - 1].push(ch);
      }
      let gi = 0;
      const dialog = layout === 'dialog-l' || layout === 'dialog-r';
      return (
        <React.Fragment key={li}>
          <div
            style={{
              position: 'absolute',
              ...b.style,
              fontFamily: b.font ?? 'Noto Serif SC',
              fontWeight: 500,
              fontSize: b.size,
              color: dialog ? '#fff3e0' : '#fdf7ee',
              letterSpacing: b.vertical ? '0.18em' : '0.12em',
              lineHeight: 1.55,
              writingMode: b.vertical ? 'vertical-rl' : undefined,
              display: b.vertical ? 'flex' : 'block',
              flexDirection: b.vertical ? 'row-reverse' : undefined,
              gap: b.vertical ? 34 : undefined,
              whiteSpace: 'nowrap',
            }}
          >
            {phrases.map((ph, pi) => {
              const small = b.smallFirst && pi === 0 && phrases.length > 1;
              const offset = b.stagger ? pi * b.stagger : 0;
              return (
                <div
                  key={pi}
                  style={{
                    display: b.vertical ? 'block' : b.phraseGap ? 'inline-block' : 'block',
                    marginLeft: !b.vertical && b.stagger && b.stagger > 0 ? offset : undefined,
                    marginRight: !b.vertical && b.stagger && b.stagger < 0 ? -offset : undefined,
                    marginTop: b.vertical ? offset : undefined,
                    marginInline: b.phraseGap && !b.vertical ? b.phraseGap / 2 : undefined,
                    fontSize: small ? b.size * 0.42 : undefined,
                    letterSpacing: small ? '0.6em' : undefined,
                    marginBottom: small ? 18 : undefined,
                    opacity: small ? 0.9 : 1,
                  }}
                >
                  {ph.map((ch) => {
                    const i = gi++;
                    return (
                      <Glyph
                        key={i}
                        c={ch.c}
                        ct={isHan(ch.c) ? ch.t : ch.t + 0.05}
                        t={t}
                        out={out}
                        i={i}
                        big={layout === 'center-big' && !small}
                        glow={glow}
                        vertical={b.vertical}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </React.Fragment>
      );
    })}
  </div>
);
