#!/usr/bin/env python3
"""Build the raster icon set from docs/icon.png.

3.7.2 GROWS THIS FROM ONE FILE TO SEVEN, and the reasoning is unchanged: every
raster is DERIVED from the icon that already ships, so none of them can
disagree with the app the way hand-drawn copies would. Guard 115 holds the
vector copies in agreement; everything here is downstream of one of them.

  favicon.ico          16/32/48 layers — crawlers that ask the root and accept
                       nothing else
  favicon-16x16.png    the tab sizes as plain PNGs, for tools that read <link>
  favicon-32x32.png    tags rather than probing the root path
  favicon-48x48.png
  apple-touch-icon.png 180×180, OPAQUE on the ink ground — iOS ignores the
                       manifest and composites transparency onto black, so the
                       ground is chosen here rather than left to Cupertino
  mstile-144x144.png   transparent — Windows paints msapplication-TileColor
                       behind it

Original header, still true for the ico:

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

# The tab sizes as their own PNGs, same downscale as the ico's layers.
for px in (16, 32, 48):
    out = os.path.join(ROOT, "docs", "favicon-%dx%d.png" % (px, px))
    src.resize((px, px), Image.LANCZOS).save(out, format="PNG", optimize=True)
    print("docs/favicon-%dx%d.png — %d bytes" % (px, px, os.path.getsize(out)))

# apple-touch-icon: 180×180, opaque. iOS composites a transparent PNG onto
# black, so the app's own ink ground (#08090F — manifest background_color)
# goes behind the bat here, with the glyph at 78% so the silhouette is not
# wall-to-wall on a rounded-corner tile.
INK = (8, 9, 15, 255)
tile = Image.new("RGBA", (180, 180), INK)
glyph = src.resize((140, 140), Image.LANCZOS)
tile.paste(glyph, ((180 - 140) // 2, (180 - 140) // 2), glyph)
atp = os.path.join(ROOT, "docs", "apple-touch-icon.png")
tile.convert("RGB").save(atp, format="PNG", optimize=True)
print("docs/apple-touch-icon.png — %d bytes" % os.path.getsize(atp))

# mstile: 144×144, transparent — Windows paints msapplication-TileColor
# behind it, and that meta pins the same surface the theme-color declares.
ms = os.path.join(ROOT, "docs", "mstile-144x144.png")
src.resize((144, 144), Image.LANCZOS).save(ms, format="PNG", optimize=True)
print("docs/mstile-144x144.png — %d bytes" % os.path.getsize(ms))
