# Money Quest — Analytics Architecture

**Not legal advice, not a compliance certification** — same posture as every other architecture document in this project. This describes what's built and why; `legal-review-checklist.md` remains the list of what needs a qualified lawyer's sign-off.

---

## 1. Why three streams, not one

Money Quest's business model depends on advertising, sponsorship, and educational partnerships — all of which need business metrics (traffic, ad/sponsorship performance) to function commercially. The product also needs to track a child's own learning progress to work at all, and needs to understand how parents use the dashboard to improve it. These are three genuinely different kinds of data, with three different relationships to an identifiable person — treating them as one undifferentiated "analytics" system would either over-restrict the business-critical stream or under-protect the child-critical one. So they're kept structurally separate:

| Stream | Tied to | Storage | Ever sent externally? |
|---|---|---|---|
| Learning metrics | A specific child, necessarily | Existing `child_activity_progress` (no new table) | Never |
| Usage metrics | A parent, but anonymised before storage | `anonymous_events` (stream='usage') | Never |
| Business metrics | Nobody — no identifier at all | `anonymous_events` (stream='business') | Never (first-party only, see §3) |

## 2. The `AnalyticsProvider` interface

```typescript
interface AnalyticsProvider {
  readonly providerName: string;
  recordLearningMetric(event: LearningMetricEvent): Promise<void>;
  recordUsageMetric(event: UsageMetricEvent): Promise<void>;
  recordBusinessMetric(event: BusinessMetricEvent): Promise<void>;
  isConfigured(): boolean;
}
```

Same pattern as `AdvertisingProvider` (advertising-architecture.md) and the sponsorship system: no page or component anywhere calls a specific provider's code directly, everything goes through `getActiveAnalyticsProvider()` (`providers/provider-registry.ts`). Swapping the provider for one stream — most plausibly business metrics, if a genuinely anonymous, cookieless third-party tool is ever reviewed and approved — is a one-line change there, not a rewrite of every page that records an event.

Unlike the advertising and sponsorship systems, **the shipped first-party provider isn't a placeholder for something else** — keeping everything first-party is the actual, intended long-term design for learning and usage metrics specifically, not a "not implemented yet" stand-in.

## 3. Learning metrics never leave this product

`FirstPartyAnalyticsProvider.recordLearningMetric()` is a deliberate no-op write. A child's learning data already exists in `child_activity_progress` (built for gameplay itself, not as a separate analytics layer) and is used only to serve that child's own experience and their own parent's dashboard. It is never sent to any third-party analytics SDK, never joined with `anonymous_events`, and never aggregated in a way that could function as a behavioural or advertising profile — `scripts/test-analytics-child-firewall.ts` checks this as a structural property of the schema and code (15 checks, covering the migration's column list, the type definitions, and the provider's own insert statements), not merely a stated intention.

## 4. Where business/usage tracking does and doesn't run

Mirroring the advertising system's child-area boundary exactly: `recordPageView()` and `recordUsageEvent()` are wired into public and parent-facing pages only (`/` and `/parent` so far — see `analytics-event-catalog.md` for the full "wired vs. planned" state). Neither is called from any child-facing route (`/dashboard`, `/world`, `/coach`, `/simulator`, `/map`). This isn't a policy a developer has to remember — it's simply true today because no call to either function exists in any file under those routes, verifiable by the same kind of grep this project has used to check every other boundary.

## 5. Honest limitations

- **"Time spent learning"** has no real data source yet. The type (`LearningMetricEvent.durationSeconds`) and the aggregation function (`computeTimeSpentSeconds`, tested) exist, but no code in `GameShell`, `LessonPlayer`, or `SimulatorShell` currently measures and submits elapsed time on activity completion. This is real, scoped follow-up work, not something silently faked — the aggregation returns 0 against today's real data rather than a fabricated number.
- **Most catalog events are defined but not yet wired into a real page** — see `analytics-event-catalog.md`'s "currently wired into" column. `parent_dashboard_viewed` and `page_view` are the two genuinely live integration points this increment; the rest are documented, typed, and ready to wire in as those features get instrumented.
- **`ad_impression_recorded`/`sponsorship_credit_viewed`** business events would duplicate information already captured in `ad_impressions` and could be wired up for unified business reporting later — `ad_impressions` remains the actual source of truth for ad performance either way.

## 6. Consent and jurisdiction

See `src/lib/analytics/consent.ts` for the full per-stream reasoning (learning: necessary for the service; usage: legitimate interest with an opt-out, now live in Privacy settings; business: likely outside consent-requiring tracking because it carries no identifier). This reasoning was written with UK GDPR and the UK Children's Code in mind, consistent with `legal-review-checklist.md`'s existing scope — that checklist should be read alongside this document, and two items are worth adding to it specifically for analytics:
- Confirmation that `anonymous_events`' genuine lack of any identifier is sufficient, in the applicable jurisdiction(s), to avoid needing a cookie-consent banner for the business-metrics stream.
- Confirmation that the usage-metrics legitimate-interest basis (rather than opt-in consent) is appropriate once this product has real, non-test traffic to assess.

## 7. Advertising and sponsorship performance reporting

The brief asks for "advertising performance where legally permitted" and "sponsorship performance" as business metrics. Both already have their own privacy-safe, identifier-free tables (`ad_impressions`, and the read-only sponsorship tables) built in earlier increments — this analytics system doesn't duplicate them, it can report ON them. A future dashboard answering "what's our ad fill rate this month" or "how many views did the Money Around the World sponsorship credit get" queries `ad_impressions`/`anonymous_events` directly; no new table was needed to make that possible, since both were already designed with aggregate, non-identifying reporting as a first-class use case.
