# Money Quest — Advertising Architecture

**Status: architecture only.** Per the brief's explicit final instruction, this codebase does not integrate a real advertising provider. Every ad-bearing surface currently renders either nothing or a static "house" message (`src/lib/advertising/providers/null-provider.ts`) — no third-party ad network call exists anywhere in this codebase yet. This document describes what's built, why, and exactly what would need review before a real provider is ever registered.

---

## 1. Why this exists

Money Quest is free for families, funded by advertising — but the product's own architecture (see `money-quest-architecture-spec.md`, written in the first build session) has always stated advertising must be parent-side only, never inside the child experience. This turn builds the actual technical architecture that makes that a structural guarantee rather than a promise: the type system, the validation layer, and the component boundaries are built so that a child-facing surface *cannot* show personalised, profiling-based, or clickable advertising — not because a developer remembered the rule, but because the code has no path that would let it happen.

## 2. The abstraction layer

```
src/lib/advertising/
  types.ts                     — AdvertisingProvider interface, AdRequest/AdResponse, zone & category types
  config.ts                     — AD_ZONE_CONFIG: every ad zone, its audience, allowed categories, enabled flag
  placement-rules.ts             — validatePlacement(): re-checks every response before render, regardless of provider
  ad-service.ts                   — getAdForZone(): the one entry point pages use (provider call + validation + fallback)
  reporting.ts                     — recordImpression(): privacy-safe, anonymous logging
  ad-blocker-detection.ts           — parent-surface only, informational, never blocking
  providers/
    null-provider.ts                 — the only concrete implementation shipped
    provider-registry.ts              — the one line that would change to add a real provider
src/components/advertising/
  ParentAdSlot.tsx    — parent-facing rendering component
  ChildAdSlot.tsx     — child-facing rendering component (structurally non-interactive, see §5)
```

**No page or component anywhere imports a provider SDK directly.** Everything goes through `getAdForZone()`, which calls whichever provider `provider-registry.ts` currently returns. Adding a real provider later means: write a class implementing `AdvertisingProvider`, change one line in `provider-registry.ts`. Nothing else in the codebase needs to know a provider changed — proven by the fact that `ParentAdSlot`/`ChildAdSlot` have zero references to "the null provider" anywhere in their own code; they only know about the interface.

## 3. The `AdvertisingProvider` interface

```typescript
interface AdvertisingProvider {
  readonly providerName: string;
  requestAd(request: AdRequest): Promise<AdResponse>;
  reportImpression(creativeId: string, zoneId: AdZoneId, audience: AdAudience): Promise<void>;
  isConfigured(): boolean;
}
```

Three points worth calling out:
- `AdRequest` is a discriminated union (`ParentAdRequest | ChildAdRequest`) — a `ChildAdRequest` has no field for a child id, age band, topic, or any behavioural signal. This isn't a runtime filter that strips fields before sending; the type doesn't have the fields in the first place, so a future provider integration would have to deliberately widen this type (and be caught in code review doing so) to add child targeting — see §6 for the full data-sharing accounting.
- `isConfigured()` lets the rest of the system know whether responses are real paid placements or house/fallback content, independent of what any individual response claims.
- Every provider's response is re-validated by `validatePlacement()` regardless of what the provider itself claims to have already filtered — see §5.

## 4. Ad zones

| Zone | Audience | Enabled | Placement |
|---|---|---|---|
| `parent-dashboard-sidebar` | parent | yes | Parent Dashboard side column |
| `parent-dashboard-footer` | parent | yes | Below all Parent Dashboard content — wired into `/parent` this increment |
| `parent-settings-footer` | parent | yes | Below settings forms (excludes `educational-products` category — see config.ts) |
| `parent-report-footer` | parent | yes | Below the Weekly Report's content |
| `child-dashboard-footer-banner` | **child** | **no — off by default** | Below the child Dashboard's quick-access tiles — never inside a World, Lesson, Game, or Simulator |

The child zone is the one lever a human reviewer would flip. Its code, its rendering component, and its test coverage are all complete and passing (`scripts/test-ad-placement-rules.ts`) — it is switched off in configuration, not left unbuilt, so review can focus on the actual policy decision (should this ever be on) rather than on unfinished code.

## 5. How each prohibition is enforced, concretely

| Requirement | Enforcement |
|---|---|
| Never interrupt gameplay | Every ad zone is defined on "home base" screens only (Dashboard, Parent Dashboard, settings, reports) — none exist inside `GameShell`, `LessonPlayer`, `SimulatorShell`, or any World/activity route. There is no zone ID a component inside those flows could even reference. |
| Never reward for watching ads | No code path anywhere calls `completeActivity()`, awards XP, or credits the wallet in connection with an ad view. The ad and reward systems don't share any function, event, or table. |
| Never encourage clicking (child) | `ChildAdSlot.tsx` contains no `<a>` tag, no `onClick`, no interactive element of any kind — structurally, not by omission. `validateChildCreative()` additionally strips any creative carrying a `destinationUrl` before it would even reach that component. |
| Never encourage buying (child) | Same mechanism — no clickable element, and the child zone's allowed-category list contains only `general-brand-awareness`, never `educational-products` or anything purchase-oriented. |
| Never personalised/behavioural targeting of children | `ChildAdRequest`'s type has no field to carry any targeting signal — see §6. |
| Never use learning activity for advertising | The ad system and `child_activity_progress`/`ai_coach_interactions` share no code, no shared table, no shared function. Nothing in `src/lib/advertising/` imports from `src/lib/domain/` or vice versa. |
| Never expose child PII to advertisers | See §6 — a `ChildAdRequest` cannot carry it, and `ad_impressions` (the reporting table) has no foreign key to any child or parent by design. |
| Ads clearly separated from content | Every rendered ad carries an explicit "Advertisement" label (`aria-label` and visible text) — never blended into page content styling. |
| Not adjacent to accidental-click buttons | Enforced by placement choice, documented per-zone in `AD_ZONE_CONFIG`'s `placementDescription` field, and reviewable against actual page layout. |

## 6. Exactly what data could be shared with an advertising provider

This is the section the brief specifically asks for. Two audiences, two very different answers.

### Parent-audience requests (`ParentAdRequest`)
| Field | Value | Notes |
|---|---|---|
| `zoneId` | e.g. `"parent-dashboard-footer"` | Which slot, not who's viewing it |
| `locale` | e.g. `"en"`, `"ro"` | Language selection only |
| `countryCode` | e.g. `"GB"` (optional) | Coarse, country-level — the same granularity already used for currency defaults elsewhere in the app, never anything more precise |

**Never included, structurally:** the parent's email, name, any child's data of any kind, account ID, or any behavioural/usage signal from anywhere else in the product.

### Child-audience requests (`ChildAdRequest`)
| Field | Value |
|---|---|
| `zoneId` | e.g. `"child-dashboard-footer-banner"` |
| `locale` | e.g. `"en"` |

**That is the entire request.** No age band, no child ID, no topic, no progress data, no currency, no country — nothing else exists on this type. A provider serving this zone would receive strictly less information than is needed to distinguish one child from another, by construction.

### What impression reporting stores (`ad_impressions`, migration `0013_ad_impressions.sql`)
`zone_id`, `audience`, `creative_id`, `provider_name`, `is_house_creative`, `country_code` (parent-audience only), `created_at`. No foreign key to `parents` or `children` exists in this table, and none should ever be added — a query against this table cannot be joined back to an individual family, because there is no shared key.

### What a real provider's own SDK/script might additionally collect
This document can account for what *this application* sends. It cannot make promises about what a third-party ad network's own client-side script might independently collect (e.g., IP address from the HTTP request itself, browser fingerprint signals) once actually embedded — which is precisely why §8 lists provider vetting as a required pre-launch review step, and why no such script is embedded yet.

## 7. Ad fallback behavior

`getAdForZone()` always returns *something renderable* — never lets a provider error surface as a broken UI:
1. Zone disabled → returns immediately with `noFillReason: "not_configured"`, no provider call at all.
2. Provider throws → falls back to the house provider.
3. Provider returns something that fails `validatePlacement()` (wrong category, child-zone creative with a URL, etc.) → falls back to the house provider, regardless of what the provider claims.
4. House provider has nothing either → components render `null` (nothing), never an empty broken-looking box.

## 8. Ad-blocker detection

`ad-blocker-detection.ts` implements a standard bait-element technique, client-side, with no network call of its own. It is:
- Never imported by `ChildAdSlot.tsx` or anywhere in the child-facing route tree.
- Not currently wired into any parent-facing page's rendering logic either — the utility exists and works, but nothing calls it yet. Any future use must remain informational only (at most, a quiet note explaining why a house message is showing instead of a paid one) — never a modal, never gating functionality, never repeated nagging. This constraint is stated in the function's own doc comment, not left to whoever wires it up later to rediscover.

## 9. Before any real provider is registered — required review

Per the brief's explicit instruction, none of this should go live without review. Concretely, before changing `provider-registry.ts`'s one line:
1. Legal review of the specific provider's own data-processing terms (see `legal-review-checklist.md`, item 8 — this applies to an ad network exactly as it does to the AI provider).
2. Confirmation the provider offers a genuinely non-personalised, contextual-only ad product for any surface this app would use it on — not just a setting labelled "kids mode" whose actual data practices haven't been independently verified.
3. A decision, by a human, on whether `child-dashboard-footer-banner` is ever switched on at all — this document takes no position on that; it only guarantees that *if* it's switched on, the technical constraints in §5 hold.
4. Confirming the provider's own client-side script (if any) doesn't itself set tracking cookies or fire before this app's own consent/privacy controls are satisfied.
