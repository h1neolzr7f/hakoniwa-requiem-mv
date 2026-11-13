import React from 'react';
import {easeOut, ramp, window01} from '../lib/util';

const glyphStyle = (a: number, o: number): React.CSSProperties => ({
  display: 'inline-block',
  opacity: a * (1 - o),
  filter: `blur(${(1 - a) * 10 + o * 8}px)`,
  transform: `translateY(${(1 - easeOut(a)) * 18 - o * 10}px)`,
});

export const TitleCard: React.FC<{t: number; start: number; end: number}> = ({t, start, end}) => {
  if (t < start - 0.1 || t > end + 1.5) return null;
  const title = [...'箱庭的镇魂曲'];
  const o = ramp(t, end, end + 1.4);
  const line = easeOut(ramp(t, start + 0.6, start + 2.6));
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          fontFamily: 'Noto Serif SC',
          fontWeight: 300,
          fontSize: 112,
          letterSpacing: '0.42em',
          marginRight: '-0.42em',
          color: '#fbf5ea',
          textShadow: '0 0 24px rgba(200,220,255,0.55), 0 0 60px rgba(160,190,255,0.3), 0 3px 8px rgba(0,0,0,0.5)',
        }}
      >
        {title.map((c, i) => (
          <span key={i} style={glyphStyle(ramp(t, start + i * 0.28, start + i * 0.28 + 1.2), o)}>
            {c}
          </span>
        ))}
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 28, marginTop: 26, opacity: 1 - o}}>
        <div style={{width: 260 * line, height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.8))'}} />
        <div
          style={{
            fontFamily: 'Noto Serif SC',
            fontWeight: 500,
            fontSize: 26,
            letterSpacing: '0.5em',
            color: 'rgba(244,246,255,0.95)',
            textShadow: '0 0 3px rgba(0,0,0,0.8), 0 0 18px rgba(0,0,0,0.6)',
            opacity: ramp(t, start + 1.8, start + 3),
          }}
        >
          二十四根火柴　一场漫长的守灵
        </div>
        <div style={{width: 260 * line, height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.8), rgba(255,255,255,0))'}} />
      </div>
    </div>
  );
};

export const ChapterLabel: React.FC<{t: number; at: number; num: string; name: string}> = ({t, at, num, name}) => {
  const a = window01(t, at, at + 4.6, 1, 1.2);
  if (a <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        right: 92,
        top: 86,
        display: 'flex',
        flexDirection: 'row-reverse',
        alignItems: 'flex-start',
        gap: 16,
        opacity: a,
        filter: `blur(${(1 - a) * 4}px)`,
        color: '#f6efe2',
        textShadow: '0 0 14px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{fontFamily: 'Noto Serif SC', fontWeight: 600, fontSize: 40, writingMode: 'vertical-rl'}}>{num}</div>
      <div style={{width: 1, height: 190 * easeOut(a), background: 'rgba(255,255,255,0.65)', marginTop: 6}} />
      <div style={{fontFamily: 'Noto Serif SC', fontWeight: 300, fontSize: 22, letterSpacing: '0.5em', writingMode: 'vertical-rl', marginTop: 8}}>
        {name}
      </div>
    </div>
  );
};

export const EndCard: React.FC<{t: number; start: number}> = ({t, start}) => {
  if (t < start) return null;
  const a = (d: number, len = 1.6) => ramp(t, start + d, start + d + len);
  const out = ramp(t, start + 7.2, start + 8.2);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f5eee2',
        opacity: 1 - out,
      }}
    >
      <div style={{fontFamily: 'Noto Serif SC', fontWeight: 300, fontSize: 64, letterSpacing: '0.5em', marginRight: '-0.5em', opacity: a(0.3), filter: `blur(${(1 - a(0.3)) * 8}px)`}}>
        箱庭的镇魂曲
      </div>
      <div style={{width: 360 * easeOut(a(1, 2)), height: 1, background: 'rgba(255,255,255,0.5)', margin: '34px 0'}} />
      <div style={{fontFamily: 'LXGW', fontSize: 34, letterSpacing: '0.3em', opacity: a(1.6), filter: `blur(${(1 - a(1.6)) * 6}px)`}}>
        我们依然活着　替你爱着这世界
      </div>
      <div style={{fontFamily: 'Noto Serif SC', fontWeight: 300, fontSize: 24, letterSpacing: '0.4em', marginTop: 22, opacity: a(2.4) * 0.75}}>
        献给每一个替人守着灯火的你
      </div>
      <div style={{fontFamily: 'Noto Serif SC', fontWeight: 300, fontSize: 18, letterSpacing: '0.8em', marginTop: 70, opacity: a(3.6) * 0.7}}>
        — 终 —
      </div>
    </div>
  );
};
