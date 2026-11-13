import React from 'react';
import {AbsoluteFill, Audio, Composition, Sequence, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {DepthImage} from './components/DepthImage';
import {Lyrics} from './components/Lyrics';
import {Particles} from './components/Particles';
import {Black, Flash, Post} from './components/Post';
import {ChapterLabel, EndCard, TitleCard} from './components/Titles';
import {VideoShot} from './components/VideoShot';
import {pulse} from './lib/audio';
import {FPS, H, W, clamp, easeInOut, ramp} from './lib/util';
import {CHAPTERS, CHORUS, END_CARD, FLASHES, LETTERBOX, SHOTS, Shot, TITLE, blackAt} from './timeline';

const DURATION = 278.4;

const fontHandle = delayRender('fonts');
Promise.all(
  [
    new FontFace('Noto Serif SC', `url(${staticFile('fonts/NotoSerifSC-Light.woff2')})`, {weight: '300'}),
    new FontFace('Noto Serif SC', `url(${staticFile('fonts/NotoSerifSC-Medium.woff2')})`, {weight: '500'}),
    new FontFace('Noto Serif SC', `url(${staticFile('fonts/NotoSerifSC-SemiBold.woff2')})`, {weight: '600'}),
    new FontFace('LXGW', `url(${staticFile('fonts/LXGWWenKai.woff2')})`),
  ].map((f) => f.load().then((ff) => (document.fonts as unknown as Set<FontFace>).add(ff))),
)
  .then(() => continueRender(fontHandle))
  .catch((e) => {
    console.error(e);
    continueRender(fontHandle);
  });

const ShotView: React.FC<{shot: Shot}> = ({shot}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const T = shot.from + t;
  const p = clamp(t / (shot.to - shot.from));
  const ctx = {p, t, T};
  let look = shot.look(ctx);
  if (CHORUS.some(([a, b]) => T >= a && T <= b)) {
    look = {...look, exposure: look.exposure * (1 + 0.07 * pulse(T))};
  }
  const fi = shot.fadeIn ?? 0.6;
  const op = fi <= 0 ? 1 : easeInOut(t / fi);
  const blur = shot.blurIn ? (1 - op) * 16 : 0;
  const m = shot.media;
  return (
    <AbsoluteFill style={{opacity: op, filter: blur > 0.2 ? `blur(${blur}px)` : undefined}}>
      {'img' in m ? (
        <DepthImage name={m.img} look={look} />
      ) : (
        <VideoShot name={m.video} startFrom={m.startFrom ?? 0} rate={m.rate ?? 1} look={look} />
      )}
      {shot.particles && <Particles specs={shot.particles({...ctx, look})} t={T} />}
      {shot.fx?.({...ctx, look})}
    </AbsoluteFill>
  );
};

const Letterbox: React.FC<{T: number}> = ({T}) => {
  const [a, b] = LETTERBOX;
  const h = 72 * Math.min(easeInOut((T - a) / 1.6), 1 - ramp(T, b - 0.05, b + 0.25));
  if (h <= 0.5) return null;
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: h, background: '#000'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: h, background: '#000'}} />
    </>
  );
};

export const HakoniwaRequiem: React.FC = () => {
  const frame = useCurrentFrame();
  const T = frame / FPS;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Audio src={staticFile('audio/requiem.mp3')} />
      {SHOTS.map((s, i) => {
        const next = SHOTS[i + 1];
        const end = next ? Math.max(s.to, next.from + (next.fadeIn ?? 0.6)) + 0.05 : s.to;
        const from = Math.round(s.from * FPS);
        return (
          <Sequence key={s.id} from={from} durationInFrames={Math.max(1, Math.round(end * FPS) - from)} layout="none">
            <ShotView shot={s} />
          </Sequence>
        );
      })}
      <Flash t={T} flashes={FLASHES} />
      <Letterbox T={T} />
      <Black amt={blackAt(T)} />
      <TitleCard t={T} start={TITLE.start} end={TITLE.end} />
      {CHAPTERS.map((c) => (
        <ChapterLabel key={c.num} t={T} at={c.at} num={c.num} name={c.name} />
      ))}
      <Lyrics t={T} />
      <EndCard t={T} start={END_CARD} />
      <Post frame={frame} />
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="HakoniwaRequiem"
    component={HakoniwaRequiem}
    durationInFrames={Math.round(DURATION * FPS)}
    fps={FPS}
    width={W}
    height={H}
  />
);
