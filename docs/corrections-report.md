# Money Quest — Corrections Report

Not deployed. Everything below is verified through source-code inspection, automated tests, and TypeScript's strict checker — no browser was used, per your instruction.

## Files changed

- `src/app/[locale]/learn/page.tsx` — wired to translation system
- `src/app/[locale]/learn/[slug]/page.tsx` — wired to translation system; fixed a hardcoded `en-GB` date format
- `src/lib/seo/get-article.ts` — unchanged (documented limitation, see below)
- `src/components/marketing/Breadcrumbs.tsx` — added translatable `ariaLabel` prop
- `src/app/[locale]/play/page.tsx` — virtual-money label + explainer
- `src/app/[locale]/play/simulator/page.tsx` — virtual-money explainer
- `src/components/lesson/LessonPlayer.tsx` — virtual-coins label on reward
- `src/game-engine/GameShell.tsx` — virtual-coins label on reward
- `src/simulator/components/FinalReportCard.tsx` — virtual-coins label on reward
- `src/data/currencies.ts` — added RON
- `src/lib/currency/format.ts` — added literal-symbol formatting path (RON only)
- `src/data/countries.ts` — added Romania (unused file, kept consistent)
- `src/content/articles.ts` — fixed stale "seven currencies" claim; em dashes
- `src/content/worlds.ts` — em dash
- `src/simulator/engine.ts` — em dash
- `src/app/[locale]/error.tsx`, `not-found.tsx`, `contact/page.tsx`, `layout.tsx`, `src/game-engine/mechanics/AllocateMechanic.tsx`, `MatchMechanic.tsx` — em dashes
- `messages/*.json` (all 9 languages) — new/changed keys, em dashes

## 1–2. Learn section translation status

**Root cause confirmed, not assumed**: `getLocalizedArticle()` explicitly discarded its `locale` parameter (`void locale;`), and both `/learn` templates were fully hardcoded English with no translation calls at all. This fully explains what you saw.

**Fixed**: all page chrome — navigation, headings, breadcrumbs, FAQ/related-reading labels, CTAs, and the "Updated" date (previously always British-English-formatted regardless of language) — is now wired through next-intl and translated into all 9 languages.

**Not fixed, and I want to be direct about it rather than let it look finished**: the 6 SEO articles' actual body paragraphs (long-form prose for parents) are still English-only in every language, because `getLocalizedArticle()` still returns the same English content regardless of locale — I only fixed the page shell around it. This is a real, large content-translation task (313 lines of dense prose) I did not attempt, distinct from everything else in this pass. `/play` — the actual 21 lessons, 12 games, and 4 Simulator scenarios — was not affected by any of this; I re-confirmed all three are still intact and complete.

**Also found, not fixed**: `error.tsx`, `not-found.tsx`, and `contact/page.tsx` are similarly hardcoded English-only pages, discovered while doing the em-dash sweep. I only touched their em dash characters, not their translation status — flagging this as a further, separate gap for you to decide on.

## 3. Virtual-money wording

Traced every reward/balance path to its actual rendering point rather than guessing:

- Found a shared `MoneyAmount` component used by every coin reward moment (lesson completion, game completion, Simulator's final report) that previously rendered as a bare icon + number, with no accompanying words at all. Added a "Virtual coins earned" label to all three.
- Reworded: `Your coins` → `Your virtual coins`; `Starting/Remaining balance` → `Starting/Remaining virtual balance`; `Balance now: {amount}` → `Virtual balance now: {amount}`; `You receive this week` → `You receive this week in virtual money`; `Your Money Life Report` → `Your Virtual Money Life Report`.
- Added the general explainer sentence ("Money Quest uses virtual money for learning and games...") to the World Map and the Simulator's entry page — the two highest-traffic surfaces where a balance is shown — deliberately not on every single screen, per your own note against unnecessary repetition.
- All of the above translated into all 9 languages and verified (key coverage, no untranslated leftovers).

## 4. Romanian Leu (RON)

**A real bug caught before it could ship silently wrong**: I didn't assume the existing `Intl.NumberFormat`-based formatter would produce "lei" — I tested it directly. It doesn't. `Intl.NumberFormat` renders RON as the literal three-letter code "RON" in every locale I tried, including Romanian itself (confirmed: `ro` → `"5,00 RON"`, not `"5,00 lei"`). Trusting the existing architecture as-is would have violated your explicit requirement.

**Fix**: added a narrow `useLiteralSymbol` flag used only by RON. When set, the formatter builds the number through `Intl.NumberFormat` (still fully locale-aware — decimal and thousands separators still follow the UI language) and attaches the literal "lei" text itself, rather than delegating symbol choice to `Intl`. Every other currency (GBP, USD, EUR, CAD, AUD, CHF, JPY) is completely untouched — they still go through the exact same code path as before.

**Verified empirically** (not assumed): `500` minor units in `ro` → `"5,00 lei"`; `1000` in `en` → `"10.00 lei"`; `5000` in `fr` → `"50,00 lei"`. Matches your examples exactly.

RON is now in the currency selector on the World Map, usable everywhere `formatCurrency()` is called (Goals, Simulator, games, lesson rewards) — since all of those already go through this one shared function, nothing needed touching individually.

Also fixed, found while checking for consistency: one SEO article stated "Money Quest supports seven real currencies" — now correctly says eight and includes RON.

## 5. Em dash count and replacement

**Found**: 2,147 em dash occurrences in genuinely user-facing text:
- 2,082 across `messages/*.json` (all 9 languages, ~231 each — structurally consistent, as expected since every language shares the same key structure)
- 57 in the 6 SEO articles (`src/content/articles.ts`)
- 8 in individual hardcoded strings: `error.tsx`, `not-found.tsx`, `contact/page.tsx`, the browser tab-title template in `layout.tsx`, a screen-reader-only string in `AllocateMechanic.tsx`, a game status message in `MatchMechanic.tsx`, a World description in `worlds.ts`, and a fallback message in `engine.ts`

All replaced with a plain hyphen, character-for-character, with no rewording. I deliberately left em dashes inside code comments and JSDoc untouched (dozens remain) — those aren't user-facing, and touching them wasn't part of what you asked for.

## 6–11. Tests, checks, and what wasn't broken

- **Full automated suite: 10 of 10 pass.** Including `validate-translations.ts` (now checking 1,406 keys across all 9 languages, up from 1,390 — the new Learn/virtual-money keys), `test-content-reachability.ts` (all 21 lessons still reachable), `validate-lesson-content.ts`, `validate-game-feedback.ts`, `test-simulator-engine.ts`, and `test-no-english-fallback.ts`.
- **TypeScript strict check (`noUncheckedIndexedAccess` included): clean, zero errors.**
- **Translation consistency**: ran a literal-`t()`-call scan against every message key across the whole codebase — the only 4 "missing" hits are the same, already-verified false positive (a scoped `getTranslations({namespace: ...})` pattern used in three places, where `t("title")` correctly resolves to the scoped key).
- **Nothing broke**: all 21 lessons, 12 games, and 4 Simulator scenarios pass their respective content and reachability checks unchanged. Currency, locale routing, and navigation all still resolve correctly per the automated checks available to me.

## Anything that still needs your attention

Genuinely new findings from this pass, not previously known:
1. The 6 SEO article bodies under `/learn` remain English-only — page chrome is fixed, the long-form content isn't.
2. `error.tsx`, `not-found.tsx`, and `contact/page.tsx` are entirely unlocalized (discovered, not fixed — only their em dashes were touched).

And, as before: everything above is verified through code, tests, and type-checking, not a browser. When you open the real preview, I'd specifically look at: the Learn section switching language correctly now, the virtual-coins label appearing where a reward is shown, the "lei" currency option and its display, and a general scan for any leftover long dash that a script-based search might have missed inside dynamically-assembled strings.
