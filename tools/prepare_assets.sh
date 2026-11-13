#!/usr/bin/env bash
# Copies stills and upscales the Veo clips into mv/public for the Remotion renderer.
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p mv/public/img mv/public/video
cp assets/scenes/*.jpg assets/keyframes/*.jpg assets/props/*.jpg mv/public/img/

for f in videos/video-*.mp4; do
  out="mv/public/video/$(basename "$f")"
  [ -f "$out" ] && continue
  # Source clips are 736x400; upscale to cover 1920x1080 with light sharpening.
  ffmpeg -v error -y -i "$f" -an \
    -vf "scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,unsharp=5:5:0.6:5:5:0.0,format=yuv420p" \
    -c:v libx264 -preset slow -crf 16 -r 24 "$out"
  echo "video $out"
done
