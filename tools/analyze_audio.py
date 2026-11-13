"""Extract a per-frame loudness envelope, onset strength and beat times for the renderer.

Usage: python tools/analyze_audio.py audio/箱庭的镇魂曲.mp3 mv/src/data/audio.json 30
"""
import json
import subprocess
import sys

import librosa
import numpy as np

path, out, fps = sys.argv[1], sys.argv[2], int(sys.argv[3])
sr = 22050
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                     capture_output=True, check=True).stdout
y = np.frombuffer(pcm, dtype=np.float32)
hop = sr // fps

rms = librosa.feature.rms(y=y, frame_length=hop * 2, hop_length=hop)[0]
rms = rms / np.percentile(rms, 99)

onset = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
onset = onset / np.percentile(onset, 99.5)

# Low band energy approximates kick/timpani hits, used for flashes.
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop))
freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
low = S[freqs < 150].sum(axis=0)
low = low / np.percentile(low, 99)

tempo, beats = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop)
beat_times = librosa.frames_to_time(beats, sr=sr, hop_length=hop)

n = int(len(y) / sr * fps)
def fit(a):
    a = np.clip(np.nan_to_num(a), 0, 1.5)
    return [round(float(v), 3) for v in np.resize(a, n)]

json.dump({
    "fps": fps,
    "tempo": float(np.atleast_1d(tempo)[0]),
    "rms": fit(rms),
    "onset": fit(onset),
    "low": fit(low),
    "beats": [round(float(t), 3) for t in beat_times],
}, open(out, "w"))
print("tempo", tempo, "frames", n, "beats", len(beat_times))
