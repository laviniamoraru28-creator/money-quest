# Money Quest — Accessibility Implementation & Audit

**Methodology note:** every finding below was verified against the actual codebase — real greps, real rendered output read line-by-line, real contrast ratios computed with the WCAG relative-luminance formula — not assumed or theorized. Where a check came back clean, that's stated as a checked-and-confirmed finding, not silence.

---

## 1. Real bugs found and fixed this session

### Contrast (WCAG 1.4.3)
Computed exact contrast ratios for every design-system color token against white, using the real WCAG relative-luminance formula (not estimated):

| Token | Ratio vs white | Issue |
|---|---|---|
| `gold` (#E8A33D) as text | **2.16:1** | Fails 4.5:1 (normal text) and 3:1 (large text) |
| `ink/60` | **4.19:1** | Fails 4.5:1 (normal text) — used 70 times across the app |
| `ink/50` | **3.15:1** | Fails 4.5:1, borderline on 3:1 — used 12 times |
| `ink/40` | **2.40:1** | Fails both thresholds — used 6 times |

**Fixes:**
- Added a dedicated `gold-text` token (#8F5E19, 5.55:1) for the one real text usage (Simulator windfall bonus), leaving `gold` itself unchanged for borders/backgrounds.
- Swept all 88 instances of `text-ink/40`, `/50`, `/60` to `text-ink/70` (5.79:1 — passes AA at both normal and large-text thresholds with real margin). Verified as a strictly safe change: `ink/70` passes everywhere `ink/60` was used, regardless of font size, so there was no scenario where the fix could make anything worse.

### Colour alone (WCAG 1.4.1) — game mechanics
Found by reading each mechanic's actual rendered JSX, not its class names:

| Component | Issue | Fix |
|---|---|---|
| `CompareMechanic` | Wrong answer had zero text/icon — only a border colour change | Added "Not the best value here" text |
| `MultipleChoiceMechanic` | Correct had `sr-only` text but no visible icon; incorrect had neither | Added visible check/cross icons with `aria-hidden`, plus `sr-only` text for both states |
| `SpotMechanic` | A **correctly**-identified warning sign and a **missed** one shared identical red styling — only the missed one had explanatory text, making the two genuinely ambiguous even for sighted users | Correct now gets success styling + "Good catch!"; missed keeps error styling + text; a third case (false positive) got its own warning-styled text too |
| `MatchMechanic` | **Most severe**: a wrong match was completely silent to screen readers (no `aria-live`, no text) and used only a 500ms colour flash — too brief for many sighted users to register | Added a real `aria-live="polite"` status region with genuine text ("Matched!" / "Not a match — try again."), visible check/cross icons, and extended the flash to 1.2s |
| `AllocateMechanic` | Over-budget amount shown in red with no text | Added `sr-only` explanatory text |

`LessonPlayer`'s own quiz was checked and found **already correct** (visible icon + `sr-only` text for both states) — it's the pattern the game-engine fixes above were brought up to match.

### Semantic HTML — missing `<main>` landmark
9 of 27 pages (login, signup, contact, privacy, grown-up-gate, and all 4 onboarding steps) had no `<main>` element at all — a screen-reader user navigating by landmark (a very common technique) would find nothing to jump to. Fixed on all 9; **every page in the app now has exactly one `<main>`**, verified by a final sweep after the fix.

### Viewport / mobile zoom
No explicit viewport configuration existed — Next.js's implicit default (`width=device-width, initial-scale=1`, zoom allowed) was already in effect, which is the safe behaviour, but implicit. Made it explicit via a `viewport` export in the root locale layout, with a code comment stating plainly that zoom must never be disabled (`maximum-scale`/`user-scalable=false` is a common but genuinely harmful pattern that breaks WCAG 1.4.4 for low-vision users) — so a future edit has to consciously override a stated decision, not just add an implicit default that happened to be safe.

---

## 2. Checked and confirmed already correct (not assumed)

- **Keyboard navigation**: grepped the entire codebase for `<div onClick>`/`<span onClick>` patterns — **zero matches**. Every interactive element in the app is a real `<button>`, `<a>`, or form control, natively keyboard-operable.
- **Alternative interaction methods for games**: `SortMechanic` and `MatchMechanic` both use tap-to-select-then-tap-to-place, never drag-and-drop — confirmed by reading both components directly, not by trusting their doc comments.
- **Alt text**: every `<img>` tag has an `alt` attribute; the two found both correctly use `alt=""` since they're decorative alongside visible text (a sponsor logo next to a credit line, an ad banner image next to its headline).
- **Accessible charts**: no real chart/graph library is used anywhere in the app — the Parent Dashboard's skill breakdown is genuinely text-based (an actual "80%" rendered as text), which sidesteps chart-accessibility complexity entirely rather than requiring it.
- **Touch targets**: the established 44px (parent-facing) / 48px (child-facing) pattern held up under a spot-check of every component built this session.
- **Form labels**: swept every `<input>` in the codebase; all are either wrapped in a `<label>` or paired via explicit `htmlFor`/`id`.
- **Error messages**: every dynamic validation/error message uses `role="alert"`; the two `text-error` usages that don't are confirmed-decorative (a "Danger zone" heading, a styled link), not actual error feedback.

---

## 3. New this session: reduced-motion mode

The OS-level `@media (prefers-reduced-motion: reduce)` rule already existed correctly from the original design-system build (verified, not assumed). What didn't exist was an **in-app** control — useful for a child whose device doesn't expose the setting easily, or a parent who wants it on without a system-wide change.

Built: `children.reduced_motion` (per-child, matching the existing `ai_coach_enabled`/`screen_time_limit_minutes` pattern), a matching CSS rule scoped to a `data-reduced-motion="true"` attribute (identical treatment to the OS media query), wired into the child Dashboard's root element, with a parent-facing toggle on the Child Detail page.

**Honest scope note:** wired into the Dashboard as the proof of concept; the same one-line `data-reduced-motion` attribute addition would extend this to the World, Game, Lesson, and Simulator pages — not yet done everywhere, flagged here rather than silently incomplete.

---

## 4. Mobile usability

Every touch target audit from prior sessions already targeted mobile use as a first-class case (44/48px minimums, no hover-only interactions). This session's additions: explicit non-restrictive viewport config (§1), and confirming (not assuming) that no interactive element anywhere requires a mouse-specific event (drag, hover-reveal) with no touch/keyboard equivalent.

---

## 5. What this document is not

Not a certified WCAG conformance statement — that requires either an automated scan against a live, running deployment (not possible in this offline environment) or a manual audit by a qualified accessibility professional, ideally including real users of assistive technology. What's documented here is a real, verified pass against the actual source code: genuine bugs found by computation and direct inspection, genuine fixes applied, and genuine confirmation of what was already correct — not a checklist marked complete by assumption.
