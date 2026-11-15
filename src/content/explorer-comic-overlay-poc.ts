/**
 * money_basics' entry in the comic-overlay registry (see
 * explorer-comic-overlay-registry.ts for the method every other topic
 * follows) — the comic this mechanism was proven out and debugged on.
 *
 * Every region below is a rectangle in the ORIGINAL image's pixel
 * space (864x1536 — see public/images/money-quest/lessons/comics/money_basics.webp),
 * found by sampling the actual image and cropping it to inspect each
 * bubble's real boundary (see this round's final report), not
 * estimated. Every bubble in this comic is a ROUNDED RECTANGLE, not a
 * pill/stadium shape — an earlier version of this POC used a 999px
 * border-radius on every region, which drew near-ellipses on
 * near-square boxes: that cut into the bubble's real corners (leaving
 * a sliver of the original art/text exposed) while bulging past its
 * straight edges elsewhere (covering extra background it didn't need
 * to). `radius` below is the ACTUAL corner radius as a fraction of the
 * region's own shorter side, matched to each bubble's real artwork.
 *
 * `bubble4b`'s box is intentionally kept a little inside the comic's
 * true bubble boundary on its lower-right — that bubble's edge curves
 * to hug the girl's hair, and a plain rectangle can't follow that
 * curve without either clipping into the hair or leaving a gap. The
 * conservative box leaves a thin margin of the original (white)
 * bubble showing at that one edge, never the girl's hair, and never
 * any letterforms (there is no original text that close to that edge).
 *
 * Text per language is a direct, segment-matched split of the same
 * already-reviewed full transcript in src/content/explorer-comic-transcripts.ts
 * — not retranslated from scratch — so it stays consistent with the
 * narration every other locale already has.
 *
 * Reading order matches the comic's own panel order exactly, so the
 * Listen button (which just joins every region's text in this array
 * order) reads exactly what is displayed, in the same order a child
 * reads the panels.
 */

import { registerComicOverlay, IMG_W, IMG_H, type OverlayLocale, type ComicOverlayRegion } from "@/content/explorer-comic-overlay-registry";

export type { OverlayLocale } from "@/content/explorer-comic-overlay-registry";
export const OVERLAY_LOCALES: readonly OverlayLocale[] = ["en", "ro", "es", "fr", "de", "it", "pt", "nl", "pl"];

const pct = (px: number, total: number) => Number(((px / total) * 100).toFixed(2));

function region(
  id: string,
  shape: "bubble" | "box",
  box: [number, number, number, number],
  radius: number,
  bg: string,
  textColor: string,
  fontWeight: "normal" | "bold",
  text: Record<OverlayLocale, string>
): ComicOverlayRegion {
  const [x0, y0, x1, y1] = box;
  return {
    id,
    shape,
    left: pct(x0, IMG_W),
    top: pct(y0, IMG_H),
    width: pct(x1 - x0, IMG_W),
    height: pct(y1 - y0, IMG_H),
    radius,
    bg,
    textColor,
    fontWeight,
    text,
  };
}

export const moneyBasicsOverlayRegions: ComicOverlayRegion[] = [
  region("title", "box", [180, 15, 665, 95], 0.4, "#f6d9a8", "#5b3a1e", "bold", {
    en: "What Is Money?", ro: "Ce este banul?", es: "¿Qué es el dinero?", fr: "Qu'est-ce que l'argent ?",
    de: "Was ist Geld?", it: "Cos'è il denaro?", pt: "O que é o dinheiro?", nl: "Wat is geld?", pl: "Czym są pieniądze?",
  }),
  // Trimmed the closing filler word ("really"/"really"-equivalent) —
  // this bubble didn't fit even the English original at a readable
  // size on a narrow phone (confirmed live). The question's meaning is
  // unchanged; only the emphasis word is gone.
  region("bubble1", "bubble", [166, 118, 346, 270], 0.28, "#ffffff", "#2b2b2b", "normal", {
    en: "Coins jingle. Notes rustle. But what is money?",
    ro: "Monedele zornăie. Bancnotele foșnesc. Dar ce sunt banii?",
    es: "Las monedas tintinean. Los billetes crujen. ¿Qué es el dinero?",
    fr: "Les pièces tintent. Les billets froissent. Qu'est-ce que l'argent ?",
    de: "Münzen klimpern. Scheine rascheln. Aber was ist Geld?",
    it: "Le monete tintinnano. Le banconote frusciano. Cos'è il denaro?",
    pt: "As moedas tilintam. As notas fazem barulho. O que é o dinheiro?",
    nl: "Munten rinkelen. Briefjes ritselen. Maar wat is geld?",
    pl: "Monety brzęczą. Banknoty szeleszczą. Czym są pieniądze?",
  }),
  region("bubble2", "bubble", [695, 122, 839, 243], 0.3, "#ffffff", "#2b2b2b", "normal", {
    en: "Let's find out together!", ro: "Hai să aflăm împreună!", es: "¡Vamos a descubrirlo juntos!",
    fr: "Découvrons-le ensemble !", de: "Lass es uns gemeinsam herausfinden!", it: "Scopriamolo insieme!",
    pt: "Vamos descobrir juntos!", nl: "Laten we het samen ontdekken!", pl: "Odkryjmy to razem!",
  }),
  region("keyIdeaPill", "bubble", [34, 446, 222, 504], 0.45, "#fddc7d", "#5b3a1e", "bold", {
    en: "KEY IDEA", ro: "IDEE CHEIE", es: "IDEA CLAVE", fr: "IDÉE CLÉ", de: "KERNIDEE",
    it: "IDEA CHIAVE", pt: "IDEIA-CHAVE", nl: "KERNIDEE", pl: "NAJWAŻNIEJSZA MYŚL",
  }),
  region("keyIdeaBody", "box", [258, 428, 822, 544], 0.12, "#fdeecb", "#2b2b2b", "normal", {
    en: "Money is something we trade for the things we want or need, instead of swapping items directly.",
    ro: "Banii sunt ceva ce schimbăm pentru lucrurile pe care ni le dorim sau de care avem nevoie, în loc să facem schimb de obiecte direct.",
    es: "El dinero es algo que intercambiamos por las cosas que queremos o necesitamos, en lugar de intercambiar objetos directamente.",
    fr: "L'argent est quelque chose que l'on échange contre les choses que l'on veut ou dont on a besoin, au lieu d'échanger des objets directement.",
    de: "Geld ist etwas, das wir gegen die Dinge eintauschen, die wir wollen oder brauchen, statt Gegenstände direkt zu tauschen.",
    it: "Il denaro è qualcosa che scambiamo per le cose che vogliamo o di cui abbiamo bisogno, invece di scambiare direttamente gli oggetti.",
    pt: "O dinheiro é algo que trocamos pelas coisas que queremos ou de que precisamos, em vez de trocar objetos diretamente.",
    nl: "Geld is iets dat we ruilen voor de dingen die we willen of nodig hebben, in plaats van spullen rechtstreeks te ruilen.",
    pl: "Pieniądze to coś, co wymieniamy na rzeczy, których chcemy lub potrzebujemy, zamiast wymieniać się przedmiotami bezpośrednio.",
  }),
  region("panel2Bubble", "bubble", [4, 548, 302, 718], 0.3, "#fdfbf4", "#2b2b2b", "normal", {
    en: "A long, long time ago, people used to swap things directly.",
    ro: "Cu mult, mult timp în urmă, oamenii făceau schimb de lucruri direct.",
    es: "Hace mucho, mucho tiempo, la gente intercambiaba cosas directamente.",
    fr: "Il y a très, très longtemps, les gens échangeaient des objets directement.",
    de: "Vor sehr, sehr langer Zeit haben die Menschen Dinge direkt getauscht.",
    it: "Tanto, tanto tempo fa, le persone scambiavano le cose direttamente.",
    pt: "Há muito, muito tempo, as pessoas trocavam coisas diretamente.",
    nl: "Heel, heel lang geleden ruilden mensen spullen rechtstreeks.",
    pl: "Bardzo, bardzo dawno temu ludzie wymieniali się rzeczami bezpośrednio.",
  }),
  region("bubble3a", "bubble", [32, 862, 244, 958], 0.3, "#ffffff", "#2b2b2b", "normal", {
    en: "A chicken for some bread, maybe?", ro: "O găină pentru niște pâine, poate?",
    es: "¿Una gallina por un poco de pan, tal vez?", fr: "Une poule contre un peu de pain, peut-être ?",
    de: "Ein Huhn für etwas Brot, vielleicht?", it: "Una gallina per un po' di pane, forse?",
    pt: "Uma galinha por um pouco de pão, talvez?", nl: "Een kip voor wat brood, misschien?",
    pl: "Kura za trochę chleba, może?",
  }),
  region("bubble3b", "bubble", [677, 867, 829, 974], 0.32, "#ffffff", "#2b2b2b", "normal", {
    en: "That got tricky fast!", ro: "S-a complicat repede!", es: "¡Eso se complicó rápido!",
    fr: "Ça s'est vite compliqué !", de: "Das wurde schnell kompliziert!", it: "La cosa si è complicata in fretta!",
    pt: "Isso complicou-se depressa!", nl: "Dat werd al snel ingewikkeld!", pl: "To szybko się skomplikowało!",
  }),
  region("bubble4a", "bubble", [121, 1152, 300, 1261], 0.3, "#ffffff", "#2b2b2b", "normal", {
    en: "Money made it much simpler!", ro: "Banii au simplificat totul!", es: "¡El dinero lo hizo todo mucho más sencillo!",
    fr: "L'argent a tout simplifié !", de: "Geld hat alles viel einfacher gemacht!", it: "Il denaro ha reso tutto molto più semplice!",
    pt: "O dinheiro tornou tudo muito mais simples!", nl: "Geld maakte alles veel eenvoudiger!", pl: "Pieniądze znacznie to uprościły!",
  }),
  // Shortened from the full transcript sentence — even in English, the
  // original wording didn't fit this bubble at a readable size at any
  // width (confirmed live: see this round's final report). Every
  // language below keeps both ideas (agreed value; usable for almost
  // anything) and drops only the redundant wordiness.
  region("bubble4b", "bubble", [281, 1169, 494, 1391], 0.22, "#ffffff", "#2b2b2b", "normal", {
    en: "Everyone agrees coins and notes have value, so you can use them for almost anything.",
    ro: "Toată lumea e de acord că banii au valoare, așa că poți cumpăra aproape orice cu ei.",
    es: "Todos coinciden en que el dinero tiene valor, así que puedes comprar casi cualquier cosa con él.",
    fr: "Tout le monde reconnaît que l'argent a de la valeur, donc tu peux l'utiliser pour acheter presque tout.",
    de: "Alle sind sich einig, dass Geld einen Wert hat, also kannst du damit fast alles kaufen.",
    it: "Tutti sono d'accordo che il denaro ha un valore, quindi puoi comprarci quasi tutto.",
    pt: "Toda a gente concorda que o dinheiro tem valor, por isso podes comprar quase tudo com ele.",
    nl: "Iedereen is het erover eens dat geld waarde heeft, dus je kunt er bijna alles mee kopen.",
    pl: "Wszyscy zgadzają się, że pieniądze mają wartość, więc można za nie kupić prawie wszystko.",
  }),
  region("footerLabel", "box", [95, 1452, 300, 1502], 0.3, "#fdecd2", "#2b2b2b", "normal", {
    en: "New word:", ro: "Cuvânt nou:", es: "Palabra nueva:", fr: "Nouveau mot :", de: "Neues Wort:",
    it: "Parola nuova:", pt: "Palavra nova:", nl: "Nieuw woord:", pl: "Nowe słowo:",
  }),
  region("footerPill", "bubble", [302, 1448, 432, 1506], 0.45, "#fad551", "#3a2a00", "bold", {
    en: "MONEY", ro: "BANI", es: "DINERO", fr: "ARGENT", de: "GELD", it: "DENARO", pt: "DINHEIRO", nl: "GELD", pl: "PIENIĄDZE",
  }),
  region("footerDef", "box", [436, 1452, 822, 1502], 0.3, "#fdecd2", "#2b2b2b", "normal", {
    en: "– Coins and notes we use to buy things.",
    ro: "– monedele și bancnotele pe care le folosim ca să cumpărăm lucruri.",
    es: "– las monedas y los billetes que usamos para comprar cosas.",
    fr: "– les pièces et les billets qu'on utilise pour acheter des choses.",
    de: "– die Münzen und Scheine, mit denen wir Dinge kaufen.",
    it: "– le monete e le banconote che usiamo per comprare le cose.",
    pt: "– as moedas e as notas que usamos para comprar coisas.",
    nl: "– de munten en briefjes die we gebruiken om dingen te kopen.",
    pl: "– monety i banknoty, których używamy, żeby coś kupić.",
  }),
];

/**
 * The image split into contiguous, non-overlapping vertical sections —
 * title, each illustrated panel, and the footer — covering 0 to 1536
 * with no gaps. Found from the regions' own extents (each section's
 * bounds are the midpoint between its own regions and its neighbors'),
 * not from guessing pixel coordinates — an earlier attempt at this
 * from a quick visual estimate put a seam through the middle of
 * panel C/D's actual gap, confirmed wrong by cropping and looking
 * again. Rendering slices this image into (see ExplorerComicOverlay)
 * are what let a caption be inserted in real document flow directly
 * below one specific panel, without touching the image pixels at all.
 */
registerComicOverlay("money_basics", {
  imageFile: "money_basics.webp",
  regions: moneyBasicsOverlayRegions,
  sections: [
    { id: "title", yStart: 0, yEnd: 106 },
    { id: "panelA", yStart: 106, yEnd: 349 },
    { id: "keyIdea", yStart: 349, yEnd: 546 },
    { id: "panelB", yStart: 546, yEnd: 790 },
    { id: "panelC", yStart: 790, yEnd: 1063 },
    { id: "panelD", yStart: 1063, yEnd: 1420 },
    { id: "footer", yStart: 1420, yEnd: 1536 },
  ],
  regionSection: {
    title: "title",
    bubble1: "panelA", bubble2: "panelA",
    keyIdeaPill: "keyIdea", keyIdeaBody: "keyIdea",
    panel2Bubble: "panelB",
    bubble3a: "panelC", bubble3b: "panelC",
    bubble4a: "panelD", bubble4b: "panelD",
    footerLabel: "footer", footerPill: "footer", footerDef: "footer",
  },
});
