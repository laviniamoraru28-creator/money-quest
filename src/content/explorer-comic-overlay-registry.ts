/**
 * Generic registry for the comic text-overlay mechanism proven out on
 * money_basics (see explorer-comic-overlay-poc.ts and this round's
 * final report for the full method and the bugs it caught). Every
 * other Explorer comic topic adds one entry here, following the exact
 * same method:
 *
 * 1. Crop and sample the real image (public/images/money-quest/lessons/comics/<topic>.webp,
 *    864x1536) to find each bubble/box's true pixel boundary and fill
 *    color — never estimate from a thumbnail. Every bubble is a
 *    rounded RECTANGLE (set `radius` to its real corner radius as a
 *    fraction of the region's shorter side), not a pill — 999px
 *    radius on a near-square box draws a circle that cuts the real
 *    corners and bulges past the real edges, confirmed wrong on
 *    money_basics.
 * 2. Split that topic's own already-reviewed 9-language prose in
 *    src/content/explorer-comic-transcripts.ts into the same regions,
 *    in the comic's own panel reading order — don't retranslate from
 *    scratch, reuse that wording so narration stays consistent.
 * 3. Group the regions into contiguous, non-overlapping vertical
 *    sections (title, each illustrated panel, footer, etc.) covering
 *    0 to 1536 with no gaps, each section's boundary the midpoint
 *    between its own regions' extents and its neighbor's — not a
 *    guess from eyeballing a thumbnail; crop the actual candidate seam
 *    and look, exactly like money_basics' panel-C/D boundary, which a
 *    first guess put through the middle of the real gap.
 * 4. Render it with ExplorerComicOverlay (topicId=...), test at
 *    360/390/768/1280px in all 9 languages, and visually inspect the
 *    screenshots yourself — an automated "no overflow" pass is not
 *    sufficient, since the caption mechanism makes overflow
 *    structurally impossible but says nothing about whether a box
 *    actually sits on its bubble or clips a character.
 */

export type OverlayLocale = "en" | "ro" | "es" | "fr" | "de" | "it" | "pt" | "nl" | "pl";

export const OVERLAY_LOCALES: readonly OverlayLocale[] = ["en", "ro", "es", "fr", "de", "it", "pt", "nl", "pl"];

export interface ComicOverlayRegion {
  id: string;
  shape: "bubble" | "box";
  /** Percent of the 864x1536 image, so the overlay scales with the responsive image. */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Corner radius as a fraction (0-0.5) of the region's shorter side. */
  radius: number;
  bg: string;
  textColor: string;
  fontWeight: "normal" | "bold";
  text: Record<OverlayLocale, string>;
}

export interface ComicSection {
  id: string;
  yStart: number;
  yEnd: number;
}

export interface ComicTopicOverlay {
  /** File under public/images/money-quest/lessons/comics/ */
  imageFile: string;
  regions: ComicOverlayRegion[];
  sections: ComicSection[];
  /** regionId -> sectionId */
  regionSection: Record<string, string>;
}

export const IMG_W = 864;
export const IMG_H = 1536;

export const comicOverlays: Partial<Record<string, ComicTopicOverlay>> = {};

export function registerComicOverlay(topicId: string, data: ComicTopicOverlay) {
  comicOverlays[topicId] = data;
}
