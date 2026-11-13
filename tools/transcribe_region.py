"""Re-transcribe a sub-region of the song with a targeted prompt."""
import subprocess
import sys

import numpy as np
from faster_whisper import WhisperModel

audio, start, end, prompt = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
pcm = subprocess.run(
    ["ffmpeg", "-v", "error", "-ss", str(start), "-to", str(end), "-i", audio,
     "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
    capture_output=True, check=True,
).stdout
samples = np.frombuffer(pcm, dtype=np.float32)
model = WhisperModel("medium", device="cpu", compute_type="int8", cpu_threads=4)
segments, _ = model.transcribe(samples, language="zh", word_timestamps=True,
                               initial_prompt=prompt, condition_on_previous_text=False)
for s in segments:
    print(f"{s.start + start:7.2f} {s.end + start:7.2f} {s.text}")
    for w in s.words or []:
        print(f"    {w.start + start:7.2f} {w.end + start:7.2f} {w.word}")
