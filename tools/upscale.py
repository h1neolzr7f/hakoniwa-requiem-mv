"""Upscale stills (RealESRGAN anime 6B) and video frames (animevideov3) on CPU.

Usage:
  python tools/upscale.py stills <src_dir> <dst_dir> <model.pth>
  python tools/upscale.py video <in.mp4> <out.mp4> <model.pth>
"""
import os
import subprocess
import sys

import numpy as np
import torch
from PIL import Image
from spandrel import ModelLoader

torch.set_num_threads(4)
mode, src, dst, weights = sys.argv[1:5]
model = ModelLoader().load_from_file(weights).eval()
scale = model.scale


@torch.inference_mode()
def upscale(arr, tile=384, pad=16):
    x = torch.from_numpy(arr).permute(2, 0, 1).float().div(255).unsqueeze(0)
    _, _, h, w = x.shape
    out = torch.zeros(1, 3, h * scale, w * scale)
    for y0 in range(0, h, tile):
        for x0 in range(0, w, tile):
            ya, yb = max(y0 - pad, 0), min(y0 + tile + pad, h)
            xa, xb = max(x0 - pad, 0), min(x0 + tile + pad, w)
            o = model(x[:, :, ya:yb, xa:xb])
            cy, cx = (y0 - ya) * scale, (x0 - xa) * scale
            th, tw = (min(y0 + tile, h) - y0) * scale, (min(x0 + tile, w) - x0) * scale
            out[:, :, y0 * scale:y0 * scale + th, x0 * scale:x0 * scale + tw] = o[:, :, cy:cy + th, cx:cx + tw]
    return (out.clamp(0, 1).squeeze(0).permute(1, 2, 0).numpy() * 255).round().astype(np.uint8)


if mode == "stills":
    os.makedirs(dst, exist_ok=True)
    for name in sorted(os.listdir(src)):
        out = os.path.join(dst, name)
        if not name.endswith(".jpg") or os.path.exists(out):
            continue
        img = np.array(Image.open(os.path.join(src, name)).convert("RGB"))
        up = Image.fromarray(upscale(img)).resize((2560, 1440), Image.LANCZOS)
        up.save(out, quality=93)
        print("still", name, flush=True)
else:
    probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                            "stream=width,height", "-of", "csv=p=0", src], capture_output=True, text=True)
    w, h = map(int, probe.stdout.strip().split(",")[:2])
    dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                           stdout=subprocess.PIPE)
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                            "-s", f"{w * scale}x{h * scale}", "-r", "24", "-i", "-",
                            "-vf", "scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080",
                            "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p", dst],
                           stdin=subprocess.PIPE)
    n = 0
    while True:
        buf = dec.stdout.read(w * h * 3)
        if len(buf) < w * h * 3:
            break
        frame = np.frombuffer(buf, np.uint8).reshape(h, w, 3)
        enc.stdin.write(upscale(frame, tile=512).tobytes())
        n += 1
    enc.stdin.close()
    enc.wait()
    print("video", dst, n, "frames", flush=True)
