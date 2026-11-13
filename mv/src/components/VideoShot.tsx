import React from 'react';
import {OffthreadVideo, staticFile} from 'remotion';
import {Look} from '../lib/look';
import {H, W} from '../lib/util';

/** Upscaled Veo clip with the same camera/grade vocabulary as DepthImage (approximated in CSS). */
export const VideoShot: React.FC<{name: string; startFrom: number; rate: number; look: Look}> = ({
  name,
  startFrom,
  rate,
  look,
}) => {
  const tx = (0.5 - look.cx) * W * look.zoom;
  const ty = (0.5 - look.cy) * H * look.zoom;
  const [tr, tg, tb] = look.tint;
  const avgTint = (tr + tg + tb) / 3;
  const l = look.light;
  const lx = ((l.x - look.cx) * look.zoom + 0.5) * 100;
  const ly = ((l.y - look.cy) * look.zoom + 0.5) * 100;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${tx}px, ${ty}px) scale(${look.zoom})`,
          filter: `brightness(${look.exposure * avgTint}) contrast(${look.contrast}) saturate(${look.sat})`,
        }}
      >
        <OffthreadVideo
          src={staticFile(`hdvideo/${name}.mp4`)}
          startFrom={Math.round(startFrom * 30)}
          playbackRate={rate}
          muted
          style={{width: W, height: H, objectFit: 'cover'}}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          mixBlendMode: 'multiply',
          background: `rgb(${Math.min(255, (tr / avgTint) * 255)}, ${Math.min(255, (tg / avgTint) * 255)}, ${Math.min(255, (tb / avgTint) * 255)})`,
        }}
      />
      {l.amt > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            mixBlendMode: 'screen',
            opacity: Math.min(1, l.amt * 0.6),
            background: `radial-gradient(circle at ${lx}% ${ly}%, rgba(${l.color.map((c) => Math.round(Math.min(1, c) * 255)).join(',')},0.55) 0%, rgba(0,0,0,0) ${l.r * 100 * 1.6}%)`,
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${look.vignette * 0.75}) 100%)`,
        }}
      />
    </div>
  );
};
