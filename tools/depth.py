"""Generate depth maps (Depth Anything V2) for every still, used for 2.5D parallax.

Usage: python tools/depth.py mv/public/img mv/public/depth
"""
import os
import sys

import numpy as np
from PIL import Image, ImageFilter
from transformers import pipeline

src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
pipe = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device="cpu")
for name in sorted(os.listdir(src)):
    if not name.endswith(".jpg"):
        continue
    out = os.path.join(dst, name.replace(".jpg", ".png"))
    if os.path.exists(out):
        continue
    img = Image.open(os.path.join(src, name)).convert("RGB")
    d = np.array(pipe(img)["predicted_depth"].squeeze(), dtype=np.float32)
    d = (d - d.min()) / (d.max() - d.min() + 1e-6)
    im = Image.fromarray((d * 255).astype(np.uint8)).resize(img.size, Image.BICUBIC)
    # Soften edges so displacement does not tear silhouettes.
    im = im.filter(ImageFilter.GaussianBlur(3))
    im.save(out)
    print("depth", name, flush=True)
