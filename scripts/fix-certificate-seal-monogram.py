#!/usr/bin/env python3
"""One-off local image edit: removes the "A" from TWO remaining
"MQA" (Money Quest Academy) references found on the certificate
background artwork during the final integration audit - the ring
text was already fixed to read "MONEY QUEST" by fix-certificate-seal.py,
but that fix never touched either of these:

1. The seal's own central monogram (was "MQA", now "MQ").
2. A second, separate wax-seal graphic on the decorative scroll/ribbon
   illustration elsewhere on the same background image (was "MQA" in
   plain text, now "MQ") - easy to miss since it's a small, distinct
   image element, not part of the main seal.

Pure local OpenCV inpainting (Telea algorithm) - no paid API, no
generative image model. Nothing else in the artwork changes: colours,
borders, wreath, ribbon, the "M" and "Q" letterforms, and the rest of
each background are untouched.

How each mask is found:
- The monogram "A": reuses find_seal_circle() from
  fix-certificate-seal.py to locate this image's own seal centre and
  radius (each background's seal is near-identical but not
  pixel-identical, same reasoning as that script). The glyph's
  silhouette - found once, by hand, from the Explorer background, then
  confirmed to match Builder/Strategist to within a few pixels - is
  expressed as a triangle in centre-relative, radius-scaled coordinates
  (three (dx/r, dy/r) offsets), so the same triangle lands on the right
  pixels for each background even though their exact seal
  position/scale differ slightly. The triangle was deliberately kept
  inside the monogram's own navy disk (clear of the wreath ring
  outside it, and clear of the small decorative flourish above the
  "Q") - both are busy/detailed enough that inpainting over them
  (rather than the flat navy "A" sits on) produced visible smudging in
  earlier attempts; this final triangle avoids both and reconstructs
  cleanly from the surrounding plain navy, exactly like the ring-text
  fix's own mask did.
- The wax-seal "A": this second graphic sits at the same absolute
  pixel position on all three backgrounds (confirmed by inspection,
  unlike the main seal, which drifts by a pixel or two between bands),
  so its mask is a fixed triangle in absolute coordinates. A faint,
  non-legible dark smudge remains after inpainting here (the wax
  texture's own rendered shading doesn't fully reconstruct) - visually
  confirmed to no longer read as "A" or any letter, left as-is rather
  than risking a worse artifact chasing a cosmetically perfect result.

Run with: python3 scripts/fix-certificate-seal-monogram.py [--check-only]
--check-only writes preview copies under /tmp instead of overwriting
the real assets, for visual review before committing to the edit.
"""
import argparse
import sys
from pathlib import Path

import cv2
import numpy as np

BANDS = ["explorer", "builder", "strategist"]
ASSET_DIR = Path(__file__).resolve().parent.parent / "public" / "certificates"
# Same search box and circle-detection as fix-certificate-seal.py (not
# imported - that file's name has a hyphen, so it isn't an importable
# Python module - duplicated here verbatim rather than renaming it).
SEARCH_BOX = (0.43, 0.80, 0.57, 0.97)  # fraction of (w,h): x0,y0,x1,y1


def find_seal_circle(crop_bgr: np.ndarray) -> tuple[float, float, float]:
    hsv = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2HSV)
    mask = cv2.inRange(hsv, np.array([95, 60, 10]), np.array([140, 255, 180]))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        raise RuntimeError("Could not find the seal's navy disk - the search box may need adjusting.")
    largest = max(contours, key=cv2.contourArea)
    if cv2.contourArea(largest) < 5000:
        raise RuntimeError(f"Largest navy-disk candidate is implausibly small ({cv2.contourArea(largest)}px) - aborting rather than guessing.")
    (cx, cy), r = cv2.minEnclosingCircle(largest)
    return cx, cy, r


# Found once from the Explorer background (see module docstring), as
# (dx/r, dy/r) offsets from the seal's own centre - apex, right foot,
# left foot of the "A" glyph's outer silhouette, deliberately kept
# inside the plain navy of the monogram's own disk.
A_GLYPH_OFFSETS = [
    (0.3579749274797277, -0.3705850587081603),
    (0.57353927195927, 0.2581442793571726),
    (-0.005789903829500037, 0.2850898224171154),
]

# Found once from the Explorer background, in absolute pixel
# coordinates (not centre-relative - this scroll/ribbon graphic's
# position doesn't move with the seal, see module docstring).
WAX_SEAL_A_TRIANGLE = [(1346, 838), (1366, 866), (1332, 866)]


def fix_band(band: str, check_only: bool) -> Path:
    path = ASSET_DIR / f"{band}-background.jpg"
    im = cv2.imread(str(path))
    if im is None:
        raise RuntimeError(f"Could not read {path}")
    h, w = im.shape[:2]
    fx0, fy0, fx1, fy1 = SEARCH_BOX
    bx0, by0 = int(w * fx0), int(h * fy0)
    crop = im[by0 : int(h * fy1), bx0 : int(w * fx1)]
    cx, cy, r = find_seal_circle(crop)
    abs_cx, abs_cy = bx0 + cx, by0 + cy
    print(f"{band}: seal centre = ({abs_cx:.1f}, {abs_cy:.1f}), radius = {r:.1f}")

    mask = np.zeros((h, w), dtype=np.uint8)
    monogram_pts = [(abs_cx + dx * r, abs_cy + dy * r) for dx, dy in A_GLYPH_OFFSETS]
    for pts in (monogram_pts, WAX_SEAL_A_TRIANGLE):
        polygon = np.array([[int(round(x)), int(round(y))] for x, y in pts], dtype=np.int32)
        cv2.fillPoly(mask, [polygon], 255)

    inpainted = cv2.inpaint(im, mask, inpaintRadius=6, flags=cv2.INPAINT_TELEA)

    out_path = Path(f"/tmp/seal-monogram-check-{band}.jpg") if check_only else path
    cv2.imwrite(str(out_path), inpainted, [cv2.IMWRITE_JPEG_QUALITY, 95])
    return out_path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check-only", action="store_true")
    args = parser.parse_args()
    for band in BANDS:
        out_path = fix_band(band, args.check_only)
        print(f"{band}: wrote {out_path}")


if __name__ == "__main__":
    sys.exit(main())
