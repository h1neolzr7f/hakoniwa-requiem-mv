"""Synthesize the prologue / omake soundtracks from the same timing JSON the visuals use.

Usage: python tools/make_sfx.py   (writes mv/public/audio/prologue.wav and omake.wav)
"""
import json
import os
import subprocess
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def buf(sec):
    return np.zeros(int(sec * SR))


def add(dst, at, sig, gain=1.0):
    i = int(at * SR)
    if i >= len(dst):
        return
    n = min(len(sig), len(dst) - i)
    dst[i:i + n] += sig[:n] * gain


def tt(sec):
    return np.arange(int(sec * SR)) / SR


def env(sec, a=0.005, d=None):
    t = tt(sec)
    e = np.minimum(t / max(a, 1e-4), 1)
    if d:
        e *= np.exp(-t / d)
    return e


def onepole(x, k):
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += k * (v - acc)
        y[i] = acc
    return y


def lowpass(x, cutoff):
    k = 1 - np.exp(-2 * np.pi * cutoff / SR)
    return onepole(x, k)


def tone(f, sec, harm=(1, 0.5, 0.25, 0.12), d=0.6, a=0.004):
    t = tt(sec)
    s = sum(h * np.sin(2 * np.pi * f * (i + 1) * t) * np.exp(-t * (i + 1) * 0.8 / d) for i, h in enumerate(harm))
    return s * env(sec, a)


def bell(f, sec=3.0):
    t = tt(sec)
    parts = [(1, 1, 1.6), (2.76, 0.5, 0.9), (5.4, 0.25, 0.5), (8.9, 0.12, 0.3)]
    return sum(g * np.sin(2 * np.pi * f * r * t) * np.exp(-t / dd) for r, g, dd in parts) * env(sec, 0.002)


def click():
    n = int(0.012 * SR)
    s = rng.standard_normal(n) * np.exp(-np.arange(n) / (0.0018 * SR))
    s = np.diff(np.concatenate([[0], s]))
    return s * 0.5


def pop_snd(f0=700, f1=1300, sec=0.09):
    t = tt(sec)
    f = f0 + (f1 - f0) * (t / sec)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.03)


def buzz(sec=0.7):
    t = tt(sec)
    sq = np.sign(np.sin(2 * np.pi * 118 * t)) * 0.5 + rng.standard_normal(len(t)) * 0.35
    gate = (np.floor(t * 28) % 3 != 0).astype(float)
    crushed = np.round(sq * 6) / 6
    return crushed * gate * env(sec, 0.002) * np.exp(-t / 0.5)


def pad(freqs, sec, lfo=0.13, cutoff=900):
    t = tt(sec)
    s = np.zeros(len(t))
    for i, f in enumerate(freqs):
        for det in (-0.6, 0.6):
            s += np.sin(2 * np.pi * (f + det) * t + i) / len(freqs)
    s *= 0.75 + 0.25 * np.sin(2 * np.pi * lfo * t)
    return lowpass(s, cutoff)


def fade(sig, fi, fo):
    n = len(sig)
    e = np.ones(n)
    a, b = int(fi * SR), int(fo * SR)
    if a:
        e[:a] = np.linspace(0, 1, a)
    if b:
        e[-b:] = np.minimum(e[-b:], np.linspace(1, 0, b))
    return sig * e


def write(path, mono, width=0.25):
    mono = mono / max(1e-6, np.max(np.abs(mono))) * 0.85
    delay = int(0.011 * SR)
    right = np.concatenate([np.zeros(delay), mono[:-delay]])
    st = np.stack([mono * (1 - width) + right * width, right * (1 - width) + mono * width], axis=1)
    pcm = (np.clip(st, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(path, len(mono) / SR, "s")


def reverb(x, mix=0.25):
    out = x.copy()
    for d, g in [(0.029, 0.5), (0.037, 0.45), (0.053, 0.4), (0.071, 0.33), (0.113, 0.25), (0.173, 0.18)]:
        n = int(d * SR)
        y = np.zeros_like(x)
        y[n:] = x[:-n] * g
        out += y * mix * 2
    return out


def prologue():
    d = json.load(open("mv/src/data/prologue.json", encoding="utf-8"))
    T = d["duration"]
    mus = buf(T)
    sfx = buf(T)
    out_start = d["outro"]["start"]
    cold = fade(pad([55, 110, 164.8, 220, 261.6], out_start + 1.5, lfo=0.09, cutoff=700), 3.0, 2.0)
    add(mus, 0, cold, 0.55)
    wind = fade(lowpass(rng.standard_normal(int(T * SR)), 260), 3, 3)
    add(mus, 0, wind, 0.25)
    warm = fade(pad([87.3, 130.8, 220, 261.6, 349.2], T - out_start + 0.5, lfo=0.11, cutoff=1300), 2.5, 2.0)
    add(mus, out_start - 0.5, warm, 0.6)
    add(sfx, d["intro"]["start"], bell(880, 4), 0.25)

    term = d["terminal"]
    for line in term["lines"]:
        for i, ch in enumerate(line["text"]):
            if ch != " ":
                add(sfx, line["t"] + i / term["cps"] + rng.uniform(-0.006, 0.006), click(), rng.uniform(0.28, 0.5))
        if line["kind"] == "warn":
            for k in range(4):
                add(sfx, line["t"] + 0.2 + k * 0.35, tone(1320, 0.18, harm=(1, 0.3), d=0.08), 0.22)
        if line["kind"] == "gold":
            add(sfx, line["t"] + 0.6, bell(659.3, 2.5), 0.3)
    add(sfx, term["caption"]["t"], tone(220, 3, d=1.2), 0.3)

    for m in d["chat"]["messages"]:
        if m["who"] == "error":
            add(sfx, m["t"], buzz(0.8), 0.6)
        else:
            add(sfx, m["t"], pop_snd(), 0.5 if m["who"] == "hakimi" else 0.35)

    for i, c in enumerate(d["cast"]["cards"]):
        root = [261.6, 293.7][i]
        for k, r in enumerate([1, 1.26, 1.5]):
            add(sfx, c["t"] + k * 0.12, tone(root * r, 3, d=1.4), 0.22)

    box = [783.99, 659.25, 587.33, 523.25, 587.33, 659.25, 523.25, 440.0]
    for i, l in enumerate(d["outro"]["lines"]):
        for k in range(4):
            add(sfx, l["t"] + k * 0.42, bell(box[(i * 3 + k) % len(box)], 2.2), 0.22)
    g = d["outro"]["globe"]
    for k, f in enumerate([1046.5, 1318.5, 1568, 2093]):
        add(sfx, g + k * 0.09, bell(f, 4), 0.18)
    swell = fade(lowpass(rng.standard_normal(int(3 * SR)), 2000), 2.5, 0.5) * 0.3
    add(sfx, g - 2.4, swell, 0.5)

    mix = reverb(mus * 0.9 + sfx, 0.22)
    mix = fade(mix, 0.3, 1.6)
    write("mv/public/audio/prologue.wav", mix)


def omake():
    d = json.load(open("mv/src/data/omake.json", encoding="utf-8"))
    T = d["duration"]
    P = d["panels"]
    mus = buf(T)
    sfx = buf(T)

    add(sfx, d["title"]["start"] + 0.7, pop_snd(400, 900, 0.12), 0.6)
    add(sfx, d["title"]["start"] + 0.2, bell(1046.5, 2), 0.25)

    sad_end = P[1]["start"] + 0.5
    sad = fade(pad([110, 164.8, 220, 261.6], sad_end - P[0]["start"] + 0.2, cutoff=900), 1.0, 0.15)
    add(mus, P[0]["start"], sad, 0.6)
    for k, f in enumerate([440, 523.25, 659.25, 523.25, 587.33, 493.88]):
        add(mus, P[0]["start"] + 0.6 + k * 0.95, tone(f, 1.6, d=0.9), 0.3)

    t = tt(0.45)
    scratch = rng.standard_normal(len(t)) * np.sin(2 * np.pi * (6 + 30 * t) * t) * np.exp(-t / 0.18)
    add(sfx, sad_end - 0.05, lowpass(scratch, 3000), 0.8)

    bpm = 132
    beat = 60 / bpm
    scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]
    melody = [0, 2, 4, 2, 3, 2, 1, 0, 2, 4, 5, 4, 3, 1, 2, -1]
    bass = [130.8, 130.8, 174.6, 196.0]

    def happy(t0, t1, gain=1.0):
        n = 0
        tcur = t0
        while tcur < t1:
            step = n % 16
            deg = melody[step]
            if deg >= 0:
                add(mus, tcur, tone(scale[deg], 0.5, harm=(1, 0.6, 0.3, 0.2, 0.1), d=0.18, a=0.002), 0.28 * gain)
            if step % 2 == 0:
                add(mus, tcur, tone(bass[(n // 8) % 4], 0.5, harm=(1, 0.4), d=0.25), 0.35 * gain)
            sh = rng.standard_normal(int(0.03 * SR)) * np.exp(-np.arange(int(0.03 * SR)) / (0.006 * SR))
            add(mus, tcur, np.diff(np.concatenate([[0], sh])), (0.1 if step % 2 else 0.05) * gain)
            n += 1
            tcur += beat / 2

    happy(sad_end + 0.25, P[2]["start"] + 0.35)
    t = tt(1.6)
    f = 330 * np.power(0.5, t / 1.6 * 0.75) * (1 + 0.02 * np.sin(2 * np.pi * 6 * t))
    wah = np.sin(2 * np.pi * np.cumsum(f) / SR)
    wah = (wah + 0.4 * np.sign(wah)) * env(1.6, 0.03) * np.exp(-t / 1.3)
    add(sfx, P[2]["start"] + 1.0, lowpass(wah, 1200), 0.6)
    happy(P[3]["start"] + 0.1, T - 0.6, 1.1)

    for p in P:
        for b in p["bubbles"]:
            add(sfx, b["t"], pop_snd(600, 1200), 0.45)
        for s in p["sfx"]:
            txt = s["text"]
            if "咔" in txt:
                for k in range(3):
                    n = rng.standard_normal(int(0.08 * SR)) * np.exp(-np.arange(int(0.08 * SR)) / (0.012 * SR))
                    add(sfx, s["t"] + k * 0.13, n, 0.6)
            elif "咚" in txt:
                for k in range(5):
                    add(sfx, s["t"] + k * 0.14, tone(80, 0.25, harm=(1, 0.5), d=0.07), 0.9)
            elif "！" in txt:
                tb = tt(0.5)
                fb = 300 + 500 * np.sin(np.pi * tb / 0.5) + 60 * np.sin(2 * np.pi * 14 * tb)
                add(sfx, s["t"], np.sin(2 * np.pi * np.cumsum(fb) / SR) * np.exp(-tb / 0.3), 0.5)
            else:
                add(sfx, s["t"], pop_snd(500, 800, 0.1), 0.3)
        if "error" in p:
            add(sfx, p["error"]["t"], buzz(0.6), 0.5)
    g = d["grid"]["start"]
    for k, fq in enumerate([1046.5, 1318.5, 1568, 2093]):
        add(sfx, g + 0.1 + k * 0.08, bell(fq, 3), 0.2)

    mix = reverb(mus + sfx, 0.12)
    mix = fade(mix, 0.05, 1.0)
    write("mv/public/audio/omake.wav", mix)


def loudnorm(path, target):
    tmp = path + ".tmp.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-af", f"loudnorm=I={target}:TP=-1.5:LRA=11",
                    "-ar", str(SR), tmp], check=True)
    os.replace(tmp, path)


prologue()
omake()
loudnorm("mv/public/audio/prologue.wav", -17)
loudnorm("mv/public/audio/omake.wav", -16)
