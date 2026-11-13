"""Transcribe the song with word timestamps (faster-whisper) for lyric alignment."""
import json
import subprocess
import sys

import numpy as np
from faster_whisper import WhisperModel

audio = sys.argv[1]
model_name = sys.argv[2] if len(sys.argv) > 2 else "small"
out = sys.argv[3] if len(sys.argv) > 3 else f"/tmp/whisper_{model_name}.json"

prompt = "窗台上的钟 停在雨落的那天 小鱼还在画着 未干的晴天 壁炉里的柴火 我为你塑造的一切的一切"

pcm = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", audio, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
    capture_output=True, check=True,
).stdout
samples = np.frombuffer(pcm, dtype=np.float32)

model = WhisperModel(model_name, device="cpu", compute_type="int8", cpu_threads=4)
segments, info = model.transcribe(
    samples,
    language="zh",
    word_timestamps=True,
    vad_filter=False,
    initial_prompt=prompt,
    condition_on_previous_text=False,
    beam_size=5,
)
res = []
for s in segments:
    words = [{"w": w.word, "s": round(w.start, 2), "e": round(w.end, 2)} for w in (s.words or [])]
    res.append({"s": round(s.start, 2), "e": round(s.end, 2), "text": s.text, "words": words})
    print(f"{s.start:7.2f} {s.end:7.2f} {s.text}", flush=True)
json.dump(res, open(out, "w"), ensure_ascii=False, indent=1)
