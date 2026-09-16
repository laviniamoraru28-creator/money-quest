# Money Quest — Performance Budget

Concrete, checkable targets — not aspirational statements. Where a number can't be verified without a live deployment (this audit ran entirely offline against source code), that's stated explicitly rather than presented as measured.

## Core Web Vitals (targets, to be verified against a real deployment)

| Metric | Target | Why this number |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s on a simulated mid-range mobile connection | The standard "good" threshold; the child Dashboard and the public Landing page are the two pages this matters most for — a child waiting to start playing, and a parent's first impression. |
| INP (Interaction to Next Paint) | < 200ms for any game/quiz interaction | "Games should feel responsive" per the brief — a tap-to-select or tap-to-place action in the game engine must never feel laggy, since these are short, frequent interactions a child repeats many times per session. |
| CLS (Cumulative Layout Shift) | < 0.1 | No element should visibly jump — the shared `ProgressBar` component and the avatar SVGs are sized explicitly for this reason. |

## JavaScript bundle

- **Client component count:** 19 (audited this session). No hard cap set, but every addition should be justified — most of this app's interactivity lives in the game engine and Simulator, which genuinely need client-side state; most pages remain Server Components.
- **No third-party library may be imported into a client component** without a specific, documented reason — verified clean this session (every client-component import is React/Next.js built-ins or local app code).
- **The AI SDK (`@anthropic-ai/sdk`) and Supabase admin client must never appear in a client bundle** — already enforced by the `server-only` import guard at build time (not just a convention).

## Images

- No user-uploaded or externally-hosted images exist anywhere in the app (avatars are inline SVG built from a closed local set — see `src/components/onboarding/Avatar.tsx`). The two places a raw `<img>` tag is used (ad/sponsor logos) are both small, local, staff-vetted static assets under this budget's cap.
- **Budget for any future user- or admin-uploaded image:** must go through `next/image` with explicit `width`/`height` (never omitted, to avoid CLS), and must never exceed 200KB per image at the largest rendered size.

## Fonts

- Self-hosted via `next/font/google` (avoids the render-blocking external request a plain `<link>` to Google Fonts would cause) — confirmed, not assumed, by reading the actual import.
- `display: "swap"` set explicitly on both fonts — text renders immediately in a fallback font rather than staying invisible while the real font loads.
- **Budget:** no more than 2 font families, no more than 2 weights of the body font, 1 weight of the display font — already exactly at this budget, a hard ceiling for future additions.

## Database queries

- **No page should issue sequential (non-parallelized) database queries where the queries don't depend on each other's results.** This was violated in 3 real places, found and fixed this session (see the audit report) — this budget line exists specifically because of that finding, so it doesn't recur silently.
- **Per-page query budget** (rough guide, not a hard technical limit): the child Dashboard should not exceed ~6 total round trips even as more gamification features are added — currently at 5, now parallelized.

## Animation

- **Only `transform` and `opacity` may be animated** for anything that runs during user interaction (progress bars, transitions, hover/focus states) — never `width`, `height`, `top`, or `left` directly. Enforced structurally for progress bars via the shared `ProgressBar` component (`src/components/ui/ProgressBar.tsx`); worth checking against this rule for any future animated UI.
- **Reduced motion must be respected everywhere** — both the OS-level `prefers-reduced-motion` media query and the in-app per-child toggle (`children.reduced_motion`, built in the accessibility audit) reduce every animation/transition to near-zero duration.
- **No animation should run continuously/on a loop** anywhere in the child-facing experience while idle. **One legitimate exception, verified by direct inspection**: `Button.tsx`'s loading spinner uses `animate-spin` — but it only renders while `isLoading` is true (never during idle time), is small (16×16px), uses a compositor-friendly `transform: rotate()` under the hood, and is correctly `aria-hidden` as a decorative indicator. No other looping animation exists anywhere in the codebase — checked directly (`animate-spin`/`-pulse`/`-bounce`/`-ping`), not assumed.

## Caching

- Reference data that changes only via a migration (Worlds, Activities, Badges, Currencies) should eventually be cached across requests, not re-queried fresh on every page load. **Not yet implemented** — see the audit report's honest explanation of why this was identified but deferred rather than shipped unverified.

## API requests

- The child Dashboard makes zero client-side API requests on initial load — every piece of data is fetched server-side and rendered directly, meaning there's no client-side loading spinner/waterfall for the core experience.
- The AI Coach is the one feature with real, unavoidable network latency (an LLM call) — already has a visible "Thinking…" state so the wait is communicated, not hidden.
