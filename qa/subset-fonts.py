#!/usr/bin/env python3
"""Regenerate the subset webfonts in docs/fonts/ and bless qa/font-subset.json.

    pip install fonttools brotli
    python3 qa/subset-fonts.py

WHY THIS EXISTS. The six faces shipped at 118,860 bytes, 39% of the first-visit
payload, and the weight was glyph coverage rather than dead files — all six are
referenced by @font-face and all six are precached. Subsetting five of them to
Latin-1 plus punctuation takes 55,864 bytes off.

WHY THE RANGE IS WIDER THAN THE CATALOGUE. Subsetting to exactly the characters
the catalogue uses today saves 87 KB instead of 66, and renders tofu the first
time a title arrives with an accent the catalogue has never carried. This
catalogue takes data patches by design. The safe superset costs 21 KB and
removes the failure mode.

WHY LIMELIGHT IS NOT SUBSET. Its OFL header reads "with Reserved Font Name
Limelight" — the other faces' headers do not. Under OFL 1.1 a Modified Version may
not carry the reserved name as presented to users, so subsetting it means
renaming the family in the name table, in @font-face and in --deco. Real CSS
churn and a licensing judgement, for 10.3 KB. Left whole on purpose.

SOURCES. The originals are the @fontsource packages, unmodified:
    @fontsource/ibm-plex-sans   ibm-plex-sans-latin-{400,600}-normal.woff2
    @fontsource/ibm-plex-mono   ibm-plex-mono-latin-{400,600}-normal.woff2
    @fontsource/limelight       limelight-latin-400-normal.woff2
    @fontsource/big-shoulders-display
                                big-shoulders-display-latin-700-normal.woff2
They are not kept in the repo; re-fetch from npm to regenerate.

Guard 106 does not run this. It checks the blessed manifest against the files on
disk and against the catalogue's own characters, so the fonts and the record can
only move together.
"""
import hashlib, io, json, os, subprocess, sys

ROOT   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS  = os.path.join(ROOT, "docs", "fonts")
OUT    = os.path.join(ROOT, "qa", "font-subset.json")

# Basic Latin + Latin-1 Supplement + the punctuation the catalogue reaches for.
RANGES = ["U+0020-007E", "U+00A0-00FF", "U+2010-2015", "U+2018-201F",
          "U+2026", "U+2032-2033", "U+20AC", "U+2122"]

KEEP_WHOLE = ["limelight-latin-400-normal.woff2"]   # Reserved Font Name


def expand(ranges):
    out = set()
    for r in ranges:
        r = r.replace("U+", "")
        if "-" in r:
            a, b = r.split("-")
            out.update(range(int(a, 16), int(b, 16) + 1))
        else:
            out.add(int(r, 16))
    return out


def sha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()


def main():
    files = sorted(f for f in os.listdir(FONTS) if f.endswith(".woff2"))
    if not files:
        sys.exit("no woff2 files in docs/fonts")
    for f in files:
        p = os.path.join(FONTS, f)
        if f in KEEP_WHOLE:
            print("keep whole  %-42s %6d" % (f, os.path.getsize(p)))
            continue
        before = os.path.getsize(p)
        subprocess.check_call([
            "pyftsubset", p,
            "--unicodes=" + ",".join(RANGES),
            "--flavor=woff2", "--layout-features=", "--no-hinting",
            "--desubroutinize", "--output-file=" + p + ".sub",
        ])
        os.replace(p + ".sub", p)
        print("subset      %-42s %6d -> %6d" % (f, before, os.path.getsize(p)))

    manifest = {
        "note": "Blessed by qa/subset-fonts.py. Guard 106 holds it against the "
                "files on disk and against the catalogue's own characters. "
                "Fonts and this record can only move together.",
        "ranges": RANGES,
        "files": {f: {"bytes": os.path.getsize(os.path.join(FONTS, f)),
                      "sha256": sha(os.path.join(FONTS, f)),
                      "subset": f not in KEEP_WHOLE} for f in files},
    }
    io.open(OUT, "w", encoding="utf-8").write(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n")
    total = sum(v["bytes"] for v in manifest["files"].values())
    print("total %d bytes across %d faces; %d codepoints in range"
          % (total, len(files), len(expand(RANGES))))


if __name__ == "__main__":
    main()
