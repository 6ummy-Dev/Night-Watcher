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

WHY LIMELIGHT SHIPPED WHOLE UNTIL 5.3.1, AND IS "NW DECO" NOW. Its OFL header
reads "with Reserved Font Name Limelight". Under OFL 1.1 a Modified Version may
not carry the reserved name as presented to users, so subsetting it meant
renaming the family in the name table, in @font-face, in --deco and in the
story card's canvas font — "real CSS churn and a licensing judgement, for
10.3 KB", and it was left whole. 4.5.3 then made exactly that judgement for
the Plex faces (below), so 5.3.1 applies the same answer to the one face it
had skipped: subset, renamed "NW Deco" (name IDs 1, 3, 4, 16; "NWDeco" for the
PostScript name, which takes no spaces), 23,080 → 12,792 bytes — the saving is
TrueType hinting, not glyphs, and the face is display-size only. The file
name keeps "limelight", as the Plex files keep "ibm-plex" (a file name is not
the name presented to users), so _headers, sw.js and the manifest address it
unchanged; a returning visitor's year-old immutable copy still renders under
the new family name, and the saving reaches every new visitor now.

WHY THE PLEX FACES ARE RENAMED (4.5.3). IBM's upstream header reserves "Plex"
too — a clause the shipped OFL.txt had dropped, so for two releases the notes
said only Limelight reserved a name. The four Plex subsets are Modified
Versions, and the OFL FAQ (2.6) says subsetting does not normally get to keep
a Reserved Font Name. So RENAME below rewrites name IDs 1, 3, 4, 6, 16 to
"NW Sans" / "NW Mono" after subsetting, and @font-face, --body, --mono and the
story card's canvas font declare the same. The file names keep "ibm-plex":
a file name is not "the name presented to users" (FAQ 5.3 — the font menu
name and the mechanisms that specify a font in a document), and it is what
_headers, sw.js and the manifest address. Guard 106 holds the rename: no
subset file, and no @font-face for one, may carry a name OFL.txt reserves.
Zero bytes; the same rule Limelight got, with the answer that costs nothing.

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

KEEP_WHOLE = []   # 5.3.1: nothing ships whole; every reserved name is renamed below

# Regenerate one face without re-subsetting the others (the others are
# already subsets, and re-subsetting a subset moves bytes for nothing):
#     python3 qa/subset-fonts.py --only limelight
ONLY = [a for a in sys.argv[1:] if not a.startswith("--")]

# Family renames for subset faces whose upstream reserves the name. Applied to
# name IDs 1 (family), 4 (full), 6 (PostScript), 16 (typographic family) and
# the family half of 3 (unique id); the subfamily, copyright, version and
# licence records are untouched, as OFL requires the copyright notice to stay.
RENAME = {
    "ibm-plex-sans-": [("IBM Plex Sans", "NW Sans"), ("IBMPlexSans", "NWSans")],
    "ibm-plex-mono-": [("IBM Plex Mono", "NW Mono"), ("IBMPlexMono", "NWMono")],
    "limelight-":     [("Limelight", "NW Deco")],
}


def rename_family(path, pairs):
    from fontTools.ttLib import TTFont
    font = TTFont(path)
    for rec in font["name"].names:
        if rec.nameID not in (1, 3, 4, 6, 16):
            continue
        txt = rec.toUnicode()
        for old, new in pairs:
            txt = txt.replace(old, new)
        if rec.nameID == 6:
            txt = txt.replace(" ", "")   # a PostScript name takes no spaces
        rec.string = txt
    font.flavor = "woff2"
    font.save(path)


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
        if ONLY and not any(f.startswith(o) for o in ONLY):
            print("kept as is  %-42s %6d" % (f, os.path.getsize(p)))
            continue
        before = os.path.getsize(p)
        subprocess.check_call([
            "pyftsubset", p,
            "--unicodes=" + ",".join(RANGES),
            "--flavor=woff2", "--layout-features=", "--no-hinting",
            "--desubroutinize", "--output-file=" + p + ".sub",
        ])
        os.replace(p + ".sub", p)
        for prefix, pairs in RENAME.items():
            if f.startswith(prefix):
                rename_family(p, pairs)
                print("renamed     %-42s %s" % (f, " / ".join(n for _, n in pairs)))
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
