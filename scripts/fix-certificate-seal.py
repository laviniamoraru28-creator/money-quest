#!/usr/bin/env python3
"""One-off local image edit: removes "ACADEMY" from the certificate
seal's curved ring text, leaving "MONEY QUEST" alone (task: finalize
certificate branding, requirement 1). Pure local OpenCV inpainting
(Telea algorithm) - no paid API, no generative image model, and no
change to anything else in the artwork: colours, borders, wreath,
monogram, illustrations and the rest of each background are untouched.

How the mask is found, per background image (their seals are near-
identical but not pixel-identical, so each is detected independently):
1. Threshold for the seal's navy background colour and fit a circle to
   the resulting disk - its radius lands exactly on the inner edge of
   the gold border ring (verified visually), giving a reliable centre
   and scale for this specific image.
2. The "ACADEMY" word occupies a known angular/radial band of that
   ring (found once, by hand, from a polar-grid overlay on the
   Explorer background, then confirmed to match Builder/Strategist to
   within a pixel) - comfortably clear of the gold border ring on one
   side and the inner wreath on the other, so inpainting never erases
   either.
3. cv2.inpaint reconstructs that masked arc from the surrounding
   navy - which already has long bare, text-free stretches elsewhere
   on the same ring (decorated only with small stars), so the result
   matches the artwork's own existing style rather than introducing a
   visibly different patch.

Run with: python3 scripts/fix-certificate-seal.py [--check-only]
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

# Found once from the Explorer background's polar-grid overlay, then
# confirmed against Builder/Strategist (see module docstring).
SEARCH_BOX = (0.43, 0.80, 0.57, 0.97)  # fraction of (w,h): x0,y0,x1,y1
ACADEMY_ANGLE_DEG = (289, 353)
ACADEMY_RADIUS = (50, 76.5)


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


def build_academy_mask(shape: tuple[int, int], cx: float, cy: float) -> np.ndarray:
    mask = np.zeros(shape, dtype=np.uint8)
    pts = []
    for a in np.linspace(*ACADEMY_ANGLE_DEG, 80):
        rad = np.radians(a)
        pts.append((cx + ACADEMY_RADIUS[1] * np.cos(rad), cy + ACADEMY_RADIUS[1] * np.sin(rad)))
    for a in np.linspace(ACADEMY_ANGLE_DEG[1], ACADEMY_ANGLE_DEG[0], 80):
        rad = np.radians(a)
        pts.append((cx + ACADEMY_RADIUS[0] * np.cos(rad), cy + ACADEMY_RADIUS[0] * np.sin(rad)))
    polygon = np.array([[int(round(x)), int(round(y))] for x, y in pts], dtype=np.int32)
    cv2.fillPoly(mask, [polygon], 255)
    return mask


def fix_band(band: str, check_only: bool) -> Path:
    path = ASSET_DIR / f"{band}-background.jpg"
    im = cv2.imread(str(path))
    if im is None:
        raise RuntimeError(f"Could not read {path}")
    h, w = im.shape[:2]
    fx0, fy0, fx1, fy1 = SEARCH_BOX
    x0, y0, x1, y1 = int(w * fx0), int(h * fy0), int(w * fx1), int(h * fy1)
    crop = im[y0:y1, x0:x1]
    cx, cy, r = find_seal_circle(crop)
    print(f"{band}: seal centre (crop-relative) = ({cx:.1f}, {cy:.1f}), radius = {r:.1f}")

    mask_crop = build_academy_mask(crop.shape[:2], cx, cy)
    inpainted_crop = cv2.inpaint(crop, mask_crop, inpaintRadius=3, flags=cv2.INPAINT_TELEA)

    result = im.copy()
    result[y0:y1, x0:x1] = inpainted_crop

    out_path = Path(f"/tmp/seal-check-{band}.jpg") if check_only else path
    cv2.imwrite(str(out_path), result, [cv2.IMWRITE_JPEG_QUALITY, 95])
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
