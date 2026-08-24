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
# goes behind the bat here.
#
# 4.0.0: SCALE THE INK, NOT THE CANVAS. The first cut pasted the 512 canvas
# at 78% and trusted its proportions — but the bat is a wide, short glyph
# sitting on a square with its own margins, so the visible silhouette landed
# at ~56% × 42% of the tile and the installed icon read as a small mark
# floating on a dark square (the owner's 16 Aug report, next to an X icon
# that fills its tile). The glyph's real ink bounding box is measured and
# THAT is scaled to 80% of the tile's width, centred; the canvas's margins
# no longer get a vote.
# The ground is SAMPLED from the source tile rather than declared: the crop
# below carries icon.png's own dark ground with it, and a tile filled with
# any other dark reads as a faint rectangle around the bat (seen in the
# first preview of this block — two near-blacks are still two blacks).
tile_ground = Image.open(SRC).convert("RGBA").getpixel((40, 40))
tile = Image.new("RGBA", (180, 180), tile_ground)
# The bbox is found by COLOUR, not by alpha: icon.png is not a bat on
# transparency, it is an opaque dark tile with rounded corners and the bat
# inside it — 95% of its pixels carry alpha, so getbbox() answers the TILE
# and the first 4.0.0 cut of this block scaled the tile's margins along
# with the bat. The bat is the signal-yellow ink; find that.
# Read as raw bytes rather than through getdata(), which Pillow deprecated
# and later removed. The chroma key is the same one qa/make-share-card.mjs
# uses for the same bat (r > 150, g > 120, b < 120), plus an alpha floor the
# card does not need because icon.png is the opaque tile.
w, h = src.size
xs, ys = [], []
raw = src.convert("RGBA").tobytes()
for i in range(0, len(raw), 4):
    r, g, b, a = raw[i], raw[i + 1], raw[i + 2], raw[i + 3]
    if a > 64 and r > 150 and g > 120 and b < 120:
        p = i // 4
        xs.append(p % w)
        ys.append(p // w)
if not xs:
    sys.exit("no signal-yellow ink found in docs/icon.png — the bat has "
             "changed colour and this crop needs re-aiming, not guessing")
PAD = 4
ink_box = (max(0, min(xs) - PAD), max(0, min(ys) - PAD),
           min(w, max(xs) + 1 + PAD), min(h, max(ys) + 1 + PAD))
bat = src.crop(ink_box)
tw = 144  # 80% of 180
th = max(1, round(bat.size[1] * tw / bat.size[0]))
if th > 144:  # a taller-than-wide source would overflow; fit the long side
    th = 144
    tw = max(1, round(bat.size[0] * th / bat.size[1]))
glyph = bat.resize((tw, th), Image.LANCZOS)
tile.paste(glyph, ((180 - tw) // 2, (180 - th) // 2), glyph)
atp = os.path.join(ROOT, "docs", "apple-touch-icon.png")
tile.convert("RGB").save(atp, format="PNG", optimize=True)
print("docs/apple-touch-icon.png — %d bytes, glyph %dx%d of 180 (%.0f%% wide)"
      % (os.path.getsize(atp), tw, th, 100.0 * tw / 180))

# mstile: 144×144, transparent — Windows paints msapplication-TileColor
# behind it, and that meta pins the same surface the theme-color declares.
ms = os.path.join(ROOT, "docs", "mstile-144x144.png")
src.resize((144, 144), Image.LANCZOS).save(ms, format="PNG", optimize=True)
print("docs/mstile-144x144.png — %d bytes" % os.path.getsize(ms))
