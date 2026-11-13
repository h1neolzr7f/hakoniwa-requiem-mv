import React from 'react';
import {Img, staticFile} from 'remotion';
import {clamp} from '../lib/util';

/** Film grain + watercolor paper texture, applied over everything. */
export const Post: React.FC<{frame: number; grain?: number; paper?: number}> = ({frame, grain = 0.09, paper = 0.07}) => {
  const tile = frame % 6;
  const ox = ((frame * 37) % 7) * 13;
  const oy = ((frame * 53) % 5) * 11;
  return (
    <>
      <Img
        src={staticFile('fx/paper.jpg')}
        style={{position: 'absolute', inset: 0, width: 1920, height: 1080, mixBlendMode: 'multiply', opacity: paper}}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${staticFile(`fx/grain${tile}.png`)})`,
          backgroundPosition: `${ox}px ${oy}px`,
          backgroundSize: '960px 540px',
          mixBlendMode: 'overlay',
          opacity: grain,
        }}
      />
    </>
  );
};

/** Full-frame flash (white / gold) with a fast attack and exponential decay. */
export const Flash: React.FC<{t: number; flashes: {t: number; peak: number; decay: number; color: string}[]}> = ({t, flashes}) => {
  let best = 0;
  let color = '255,255,255';
  for (const f of flashes) {
    const d = t - f.t;
    const v = d < 0 ? f.peak * clamp(1 + d / 0.12) : f.peak * Math.exp(-d / f.decay);
    if (v > best) {
      best = v;
      color = f.color;
    }
  }
  if (best < 0.003) return null;
  return <div style={{position: 'absolute', inset: 0, background: `rgb(${color})`, opacity: clamp(best), mixBlendMode: 'screen'}} />;
};

export const Black: React.FC<{amt: number}> = ({amt}) =>
  amt > 0.001 ? <div style={{position: 'absolute', inset: 0, background: '#000', opacity: clamp(amt)}} /> : null;
