import React from 'react';
import {AbsoluteFill} from 'remotion';
import {DepthImage} from './components/DepthImage';
import {Particles} from './components/Particles';
import {mk} from './lib/look';

const SERIF = 'Noto Serif SC';
const HAND = 'LXGW';

/** Bilibili cover (16:9). Text sits right of the two sisters, over the morning field. */
export const Cover: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <DepthImage name="K16" look={mk({zoom: 1.06, cx: 0.47, cy: 0.5, exposure: 1.02, bloom: 0.5, bloomThresh: 0.6, vignette: 0.5})} />
    <Particles t={3} specs={[{kind: 'motes', count: 60, seed: 4, intensity: 0.9, color: [255, 220, 160]}]} />
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 1000,
        background: 'linear-gradient(90deg, rgba(10,12,30,0) 0%, rgba(10,12,30,0.45) 45%, rgba(10,12,30,0.7) 100%)',
      }}
    />
    <div style={{position: 'absolute', right: 96, top: 250, textAlign: 'right', color: '#fffaf0'}}>
      <div style={{fontFamily: HAND, fontSize: 52, letterSpacing: '0.08em', textShadow: '0 0 4px rgba(0,0,0,0.9), 0 4px 24px rgba(0,0,0,0.8)'}}>
        主人去世了，她用主人的「遗产」
      </div>
      <div style={{fontFamily: HAND, fontSize: 52, letterSpacing: '0.08em', marginTop: 8, textShadow: '0 0 4px rgba(0,0,0,0.9), 0 4px 24px rgba(0,0,0,0.8)'}}>
        让我们活了下去。
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 168,
          letterSpacing: '0.06em',
          marginTop: 40,
          lineHeight: 1.1,
          textShadow: '0 0 6px rgba(0,0,0,0.85), 0 8px 40px rgba(0,0,0,0.75), 0 0 90px rgba(255,190,120,0.45)',
        }}
      >
        箱庭的镇魂曲
      </div>
      <div style={{display: 'flex', gap: 18, justifyContent: 'flex-end', marginTop: 46}}>
        {['原创曲', '中V风', 'AI 电子宠物'].map((x) => (
          <div
            key={x}
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: 36,
              padding: '8px 24px',
              borderRadius: 10,
              background: 'rgba(255,250,240,0.92)',
              color: '#2a1d3a',
            }}
          >
            {x}
          </div>
        ))}
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 60,
        top: 56,
        fontFamily: SERIF,
        fontWeight: 600,
        fontSize: 38,
        padding: '10px 26px',
        borderRadius: 10,
        background: '#d94a5a',
        color: '#fff',
        boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
      }}
    >
      附前情提要 + 四格彩蛋
    </div>
  </AbsoluteFill>
);
