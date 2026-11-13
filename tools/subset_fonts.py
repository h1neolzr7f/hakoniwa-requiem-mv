"""Subset the CJK fonts to the glyphs the MV actually uses (woff2).

Usage: python tools/subset_fonts.py <noto_otf_dir> <lxgw.ttf> mv/public/fonts
"""
import glob
import os
import sys

from fontTools import subset

noto_dir, lxgw, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)

text = set()
for path in glob.glob("mv/src/**/*", recursive=True):
    if path.endswith((".ts", ".tsx", ".json")):
        text |= set(open(path, encoding="utf-8").read())
text |= {chr(c) for c in range(0x20, 0x7F)}
text |= set("　，。、？！…—“”‘’「」『』·▍")
chars = "".join(sorted(text))

jobs = [
    (f"{noto_dir}/NotoSerifCJKsc-Light.otf", "NotoSerifSC-Light.woff2"),
    (f"{noto_dir}/NotoSerifCJKsc-Medium.otf", "NotoSerifSC-Medium.woff2"),
    (f"{noto_dir}/NotoSerifCJKsc-SemiBold.otf", "NotoSerifSC-SemiBold.woff2"),
    (lxgw, "LXGWWenKai.woff2"),
]
for src, name in jobs:
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    font = subset.load_font(src, opts)
    sub = subset.Subsetter(opts)
    sub.populate(text=chars)
    sub.subset(font)
    subset.save_font(font, os.path.join(out, name), opts)
    print(name, os.path.getsize(os.path.join(out, name)) // 1024, "KB")
