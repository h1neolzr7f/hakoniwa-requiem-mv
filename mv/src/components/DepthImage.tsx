import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {Look} from '../lib/look';
import {H, W} from '../lib/util';

const VS = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FS = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uImg, uDep;
uniform float uZoom, uFocus, uExp, uCon, uSat, uBloom, uBT, uVig;
uniform vec2 uC, uP;
uniform vec3 uTint, uLift, uLightCol;
uniform vec4 uLight;
void main(){
  vec2 uv = (vUv - 0.5) / (uZoom * 1.04) + uC;
  vec2 p = uv;
  for (int i = 0; i < 5; i++) { float d = texture(uDep, p).r; p = uv + uP * (d - uFocus); }
  p = 1.0 - abs(1.0 - abs(p));
  p = clamp(p, vec2(0.001), vec2(0.999));
  vec3 c = texture(uImg, p).rgb;
  vec3 b = textureLod(uImg, p, 5.0).rgb * 0.45 + textureLod(uImg, p, 6.5).rgb * 0.55;
  c += max(b - uBT, 0.0) * uBloom * 1.6;
  vec2 d2 = (p - uLight.xy) * vec2(1.7778, 1.0);
  float fall = exp(-dot(d2, d2) / max(uLight.z * uLight.z, 1e-4));
  c *= 1.0 + uLightCol * uLight.w * fall;
  c += uLightCol * uLight.w * fall * 0.05;
  c *= uExp;
  c = (c - 0.5) * uCon + 0.5;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, uSat);
  c = c * uTint + uLift;
  vec2 q = vUv - 0.5;
  c *= 1.0 - uVig * dot(q, q) * 2.0;
  o = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

type GLState = {
  gl: WebGL2RenderingContext;
  prog: WebGLProgram;
  loc: Record<string, WebGLUniformLocation | null>;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load ${src}`));
    img.src = src;
  });

const compile = (gl: WebGL2RenderingContext, type: number, src: string) => {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
  return s;
};

const texture = (gl: WebGL2RenderingContext, img: HTMLImageElement, unit: number, mip: boolean) => {
  const t = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  if (mip) {
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
  return t;
};

export const DepthImage: React.FC<{name: string; look: Look}> = ({name, look}) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef<GLState | null>(null);
  const [handle] = useState(() => delayRender(`depth image ${name}`));
  const [ready, setReady] = useState(false);
  const released = useRef(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadImage(staticFile(`hd/${name}.jpg`)), loadImage(staticFile(`depth/${name}.png`))])
      .then(([img, dep]) => {
        if (cancelled || !canvas.current) return;
        const gl = canvas.current.getContext('webgl2', {preserveDrawingBuffer: true, antialias: false})!;
        const prog = gl.createProgram()!;
        gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
        gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
        gl.linkProgram(prog);
        gl.useProgram(prog);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const aPos = gl.getAttribLocation(prog, 'aPos');
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
        texture(gl, img, 0, true);
        texture(gl, dep, 1, false);
        const names = ['uImg', 'uDep', 'uZoom', 'uFocus', 'uExp', 'uCon', 'uSat', 'uBloom', 'uBT', 'uVig', 'uC', 'uP', 'uTint', 'uLift', 'uLightCol', 'uLight'];
        const loc: GLState['loc'] = {};
        for (const n of names) loc[n] = gl.getUniformLocation(prog, n);
        gl.uniform1i(loc.uImg, 0);
        gl.uniform1i(loc.uDep, 1);
        state.current = {gl, prog, loc};
        setReady(true);
      })
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
    return () => {
      cancelled = true;
      state.current?.gl.getExtension('WEBGL_lose_context')?.loseContext();
      state.current = null;
    };
  }, [name, handle]);

  useLayoutEffect(() => {
    const s = state.current;
    if (!ready || !s) return;
    const {gl, loc} = s;
    gl.viewport(0, 0, W, H);
    gl.uniform1f(loc.uZoom, look.zoom);
    gl.uniform1f(loc.uFocus, look.focus);
    gl.uniform1f(loc.uExp, look.exposure);
    gl.uniform1f(loc.uCon, look.contrast);
    gl.uniform1f(loc.uSat, look.sat);
    gl.uniform1f(loc.uBloom, look.bloom);
    gl.uniform1f(loc.uBT, look.bloomThresh);
    gl.uniform1f(loc.uVig, look.vignette);
    gl.uniform2f(loc.uC, look.cx, 1 - look.cy);
    gl.uniform2f(loc.uP, look.px, -look.py);
    gl.uniform3f(loc.uTint, ...look.tint);
    gl.uniform3f(loc.uLift, ...look.lift);
    gl.uniform3f(loc.uLightCol, ...look.light.color);
    gl.uniform4f(loc.uLight, look.light.x, 1 - look.light.y, look.light.r, look.light.amt);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.finish();
    if (!released.current) {
      released.current = true;
      continueRender(handle);
    }
  });

  return <canvas ref={canvas} width={W} height={H} style={{position: 'absolute', inset: 0, width: W, height: H}} />;
};
