"""Align the official lyrics to whisper word timestamps; emit per-character timings.

Usage: python tools/align.py /tmp/whisper_medium.json mv/src/data/lyrics.json
"""
import difflib
import json
import re
import sys

from opencc import OpenCC

t2s = OpenCC("t2s")
whisper = json.load(open(sys.argv[1]))
out_path = sys.argv[2]

# Lines whisper could not hear on the full mix; timed from tools/transcribe_region.py.
MANUAL = {
    "把这场漫长的守灵 过成寻常的流年": (166.5, 171.4),
    "呐，主人什么时候才回来呀？": (172.6, 178.0),
    "我们依然活着 替你爱着这世界": (239.0, 245.6),
    "快了哦，等画纸干透，等春天的第一朵花开……": (179.0, 185.4),
    "晚安 我亲爱的造物主": (248.1, 253.4),
    "明天 也会是晴天吧": (253.6, 258.6),
}

sections = []
cur = None
for raw in open("audio/lyrics.txt", encoding="utf-8"):
    line = raw.strip()
    if not line:
        continue
    m = re.match(r"\[(.+)\]", line)
    if m:
        cur = m.group(1)
        continue
    if line.startswith("("):
        continue
    text = re.sub(r"\s*\([a-z]+\)\s*$", "", line).strip("“”\" ")
    sections.append((cur, text))

wchars = []
for seg in whisper:
    for w in seg["words"]:
        cs = [c for c in t2s.convert(w["w"]) if re.match(r"[\u4e00-\u9fff]", c)]
        if not cs or seg["s"] > 268:
            continue
        dur = (w["e"] - w["s"]) / len(cs)
        for i, c in enumerate(cs):
            wchars.append((c, w["s"] + i * dur, w["s"] + (i + 1) * dur))

lchars = []
for li, (_, text) in enumerate(sections):
    for ci, c in enumerate(text):
        if re.match(r"[\u4e00-\u9fff]", c):
            lchars.append((li, ci, c))

sm = difflib.SequenceMatcher(None, [c for c, *_ in wchars], [c for *_, c in lchars], autojunk=False)
times = [None] * len(lchars)
for a, b, n in sm.get_matching_blocks():
    for k in range(n):
        times[b + k] = (wchars[a + k][1], wchars[a + k][2])

result = []
for li, (sec, text) in enumerate(sections):
    idx = [k for k, (l, _, _) in enumerate(lchars) if l == li]
    if text in MANUAL:
        s, e = MANUAL[text]
        hz = [k for k in idx]
        ts = [(s + (e - s) * j / len(hz), s + (e - s) * (j + 1) / len(hz)) for j in range(len(hz))]
    else:
        ts = [times[k] for k in idx]
        known = [j for j, t in enumerate(ts) if t]
        if not known:
            raise SystemExit(f"unaligned line: {text}")
        for j in range(len(ts)):
            if ts[j] is None:
                prev = max([k for k in known if k < j], default=None)
                nxt = min([k for k in known if k > j], default=None)
                if prev is not None and nxt is not None:
                    a, b = ts[prev][1], ts[nxt][0]
                    f = (j - prev) / (nxt - prev)
                    t = a + (b - a) * f
                elif prev is not None:
                    t = ts[prev][1] + 0.25 * (j - prev)
                else:
                    t = ts[nxt][0] - 0.25 * (nxt - j)
                ts[j] = (t, t + 0.25)
    chars = []
    j = 0
    for c in text:
        if re.match(r"[\u4e00-\u9fff]", c):
            chars.append({"c": c, "t": round(ts[j][0], 2)})
            j += 1
        else:
            chars.append({"c": c, "t": round(ts[max(j - 1, 0)][1], 2)})
    result.append({
        "section": sec,
        "text": text,
        "start": round(ts[0][0], 2),
        "end": round(min(ts[-1][1], ts[-1][0] + 1.6), 2),
        "chars": chars,
    })

# Monotonic sanity: a line must not start before the previous one.
for a, b in zip(result, result[1:]):
    if b["start"] < a["start"]:
        print("WARN non-monotonic:", a["text"], b["text"])
json.dump(result, open(out_path, "w"), ensure_ascii=False, indent=1)
for r in result:
    print(f'{r["start"]:7.2f} {r["end"]:7.2f} [{r["section"]}] {r["text"]}')
