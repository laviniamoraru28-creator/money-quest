/**
 * Proof of concept ONLY — covers a single comic (money_basics) in two
 * locales (en, ro) to test whether localized dialogue can be displayed
 * as HTML/CSS overlays on top of the existing, unmodified comic image,
 * instead of generating 80 separate localized raster images.
 *
 * Every region below is a rectangle in the ORIGINAL image's pixel
 * space (864x1536 — see public/images/money-quest/lessons/comics/money_basics.webp),
 * found by sampling the actual image (see the investigation in this
 * round's final report), not estimated. `shape: "bubble"` renders a
 * fully rounded pill (matches the comic's speech bubbles); `shape: "box"`
 * renders a rounded rectangle (matches the title sign, the key-idea
 * panel and the footer). `bg` is the region's own sampled fill color,
 * so the overlay blends into the surrounding artwork instead of
 * floating as a visibly different patch.
 *
 * Reading order matches the comic's own panel order exactly, so the
 * Listen button (which just joins every region's text in this array
 * order) reads exactly what is displayed, in the same order a child
 * reads the panels.
 */

export interface ComicOverlayRegion {
  id: string;
  shape: "bubble" | "box";
  /** Percent of the 864x1536 image, so the overlay scales with the responsive image. */
  left: number;
  top: number;
  width: number;
  height: number;
  bg: string;
  textColor: string;
  fontWeight: "normal" | "bold";
  text: Record<"en" | "ro", string>;
}

const IMG_W = 864;
const IMG_H = 1536;
const pct = (px: number, total: number) => Number(((px / total) * 100).toFixed(2));

function region(
  id: string,
  shape: "bubble" | "box",
  box: [number, number, number, number],
  bg: string,
  textColor: string,
  fontWeight: "normal" | "bold",
  en: string,
  ro: string
): ComicOverlayRegion {
  const [x0, y0, x1, y1] = box;
  return {
    id,
    shape,
    left: pct(x0, IMG_W),
    top: pct(y0, IMG_H),
    width: pct(x1 - x0, IMG_W),
    height: pct(y1 - y0, IMG_H),
    bg,
    textColor,
    fontWeight,
    text: { en, ro },
  };
}

export const moneyBasicsOverlayRegions: ComicOverlayRegion[] = [
  region("title", "box", [180, 15, 665, 95], "#f6d9a8", "#5b3a1e", "bold",
    "What Is Money?", "Ce Sunt Banii?"),
  region("bubble1", "bubble", [168, 120, 344, 268], "#ffffff", "#2b2b2b", "normal",
    "Coins jingle. Notes rustle. But what IS money, really?",
    "Monedele zornăie. Bancnotele foșnesc. Dar ce SUNT banii, de fapt?"),
  region("bubble2", "bubble", [697, 124, 837, 241], "#ffffff", "#2b2b2b", "normal",
    "Let's find out together!", "Hai să aflăm împreună!"),
  region("keyIdeaPill", "bubble", [34, 446, 222, 504], "#fddc7d", "#5b3a1e", "bold",
    "KEY IDEA", "IDEE CHEIE"),
  region("keyIdeaBody", "box", [258, 428, 822, 562], "#fdeecb", "#2b2b2b", "normal",
    "Money is something we trade for the things we want or need, instead of swapping items directly.",
    "Banii sunt ceva cu care facem schimb pentru lucrurile pe care le vrem sau de care avem nevoie, în loc să schimbăm obiecte direct."),
  region("panel2Bubble", "bubble", [4, 550, 300, 718], "#fdfbf4", "#2b2b2b", "normal",
    "A long, long time ago, people used to swap things directly.",
    "Cu foarte mult timp în urmă, oamenii schimbau lucruri direct."),
  region("bubble3a", "bubble", [34, 864, 242, 956], "#ffffff", "#2b2b2b", "normal",
    "A chicken for some bread, maybe?", "O găină pentru pâine, poate?"),
  region("bubble3b", "bubble", [679, 869, 827, 972], "#ffffff", "#2b2b2b", "normal",
    "That got tricky fast!", "Asta s-a complicat repede!"),
  region("bubble4a", "bubble", [123, 1154, 298, 1259], "#ffffff", "#2b2b2b", "normal",
    "Money made it much simpler!", "Banii au făcut totul mult mai simplu!"),
  region("bubble4b", "bubble", [279, 1171, 512, 1393], "#ffffff", "#2b2b2b", "normal",
    "Everyone agrees that coins and notes are worth something, so you can use them to get almost anything.",
    "Toată lumea e de acord că monedele și bancnotele au valoare, așa că le poți folosi ca să obții aproape orice."),
  region("footerLabel", "box", [95, 1452, 300, 1502], "#fdecd2", "#2b2b2b", "normal",
    "New words:", "Cuvinte noi:"),
  region("footerPill", "bubble", [302, 1448, 432, 1506], "#fad551", "#3a2a00", "bold",
    "MONEY", "BANI"),
  region("footerDef", "box", [436, 1452, 822, 1502], "#fdecd2", "#2b2b2b", "normal",
    "– Coins and notes we use to buy things.",
    "– Monedele și bancnotele pe care le folosim ca să cumpărăm lucruri."),
];
