"""Procedural film grain tiles and a watercolor paper texture for the post pass."""
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = np.random.default_rng(7)

for i in range(6):
    g = rng.normal(128, 38, (540, 960)).clip(0, 255).astype(np.uint8)
    Image.fromarray(g).filter(ImageFilter.GaussianBlur(0.6)).save(f"{out}/grain{i}.png")


def fbm(h, w, octaves=6):
    acc = np.zeros((h, w), np.float32)
    amp = 1.0
    for o in range(octaves):
        s = 2 ** o
        n = rng.random((max(2, h // (256 // s)), max(2, w // (256 // s)))).astype(np.float32)
        n = np.array(Image.fromarray((n * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC), np.float32) / 255
        acc += n * amp
        amp *= 0.55
    return (acc - acc.min()) / (acc.max() - acc.min())


h, w = 1080, 1920
base = fbm(h, w)
fibers = rng.random((h, w)).astype(np.float32)
fibers = np.array(Image.fromarray((fibers * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)), np.float32) / 255
paper = 0.86 + 0.1 * base + 0.06 * (fibers - 0.5)
rgb = np.stack([paper * 1.0, paper * 0.985, paper * 0.955], -1).clip(0, 1)
Image.fromarray((rgb * 255).astype(np.uint8)).save(f"{out}/paper.jpg", quality=90)
print("textures ok")
