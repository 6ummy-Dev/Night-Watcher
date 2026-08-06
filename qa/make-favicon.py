#!/usr/bin/env python3
"""Build docs/favicon.ico from docs/icon.png.

WHY THIS FILE EXISTS AT ALL. Every modern browser prefers the SVG, and Google
documents support for any served icon with a content type. This is for the
crawlers and tools that still ask the root for /favicon.ico first and accept
nothing else. A 404 there is not a documented penalty and should not be claimed
as one — the reason to have it is coverage, not a fix.

WHY IT IS GENERATED RATHER THAN DRAWN. icon.png is the bat that already ships,
so an ico derived from it cannot disagree with the app the way a fifth
hand-drawn copy could. Guard 115 holds the four VECTOR copies in agreement;
this is a raster derived from one of them, the same category as icon-192.png.

WHY THREE SIZES. A tab asks for 16 or 32 depending on display scaling, and the
tools that want this path historically expect 48 to be there. Three layers cost
a few kilobytes once, on a file that is not in the offline shell and is fetched
at most once per visitor.

Run: python3 qa/make-favicon.py   (from the repository root)
"""

import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is not installed. pip install Pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "docs", "icon.png")
OUT = os.path.join(ROOT, "docs", "favicon.ico")
SIZES = [(16, 16), (32, 32), (48, 48)]

if not os.path.exists(SRC):
    sys.exit("docs/icon.png is missing — it is the source this is derived from")

src = Image.open(SRC).convert("RGBA")
if src.size != (512, 512):
    sys.exit("docs/icon.png is %dx%d, expected 512x512 — the downscale ratios "
             "were chosen for that source" % src.size)

# LANCZOS rather than the default: at 16px a bat silhouette loses its ears to a
# box filter, and the ears are the whole glyph.
src.save(OUT, format="ICO", sizes=SIZES)

b = open(OUT, "rb").read()
assert b[:4] == b"\x00\x00\x01\x00", "written file is not an ICO"
print("docs/favicon.ico — %d layers %s, %d bytes"
      % (b[4], ", ".join("%dx%d" % s for s in SIZES), len(b)))
