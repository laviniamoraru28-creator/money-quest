# Money Quest — Analytics Event Catalog

Every event this codebase can currently record, in one place, per the brief's explicit "document all events being collected" requirement. If an event exists in code but isn't listed here, that's a documentation bug — this file should be kept in sync with `src/lib/analytics/types.ts`.

---

## Stream 1 — Learning metrics (tied to a specific child)

Stored via the existing `child_activity_progress` table (0001_init_schema.sql) — no separate analytics table. `recordLearningMetric()` is currently a no-op write for this reason (see `first-party-provider.ts`).

| Event name | Fired when | Fields |
|---|---|---|
| `lesson_completed` | A child finishes a Lesson | childId, ageBand, topicId, durationSeconds* |
| `game_completed` | A child finishes a Game | childId, ageBand, topicId, durationSeconds* |
| `challenge_completed` | A child finishes a Challenge (incl. the Money Life Simulator) | childId, ageBand, topicId, durationSeconds* |
| `quiz_answered` | A child submits a quiz/round answer | childId, ageBand, topicId |
| `topic_mastered` | A child crosses the mastery threshold for a topic (3+ attempts, 80%+ correct — see `learning-metrics.ts`) | childId, ageBand, topicId |
| `world_unlocked` | A new World becomes available to a child | childId, ageBand |

\* `durationSeconds` is defined in the type but not yet populated by any real code path — see `analytics-architecture.md` §5 for the honest gap.

**Used for:** that child's own Parent Dashboard (progress, skill breakdown, weekly report, "objectives mastered," "progress through curriculum"). **Never used for:** advertising, any cross-child aggregation resolvable back to an individual, or anything sent to a third party.

## Stream 2 — Usage metrics (tied to a signed-in parent, anonymous at storage)

Stored in `anonymous_events` (`stream = 'usage'`, 0015_analytics.sql). The event knows which parent triggered it at the moment it's recorded (for the consent opt-out check) but the identity is discarded before the row is written — only the event name and locale are stored.

| Event name | Fired when | Currently wired into |
|---|---|---|
| `parent_dashboard_viewed` | The Parent Dashboard hub loads | `/parent` (this increment) |
| `weekly_report_viewed` | A child's weekly report page loads | Not yet wired — planned |
| `screen_time_setting_changed` | A parent sets/changes a child's screen-time limit | Not yet wired — planned |
| `child_profile_added` | Onboarding completes for a new child | Not yet wired — planned |
| `child_profile_removed` | A parent removes a child profile | Not yet wired — planned |
| `data_export_requested` | A parent downloads their data export | Not yet wired — planned |
| `account_deletion_completed` | An account deletion finishes | Not yet wired — planned |

**Consent:** subject to the `usage_analytics_opt_out` toggle (Privacy settings) — `recordUsageMetricIfConsented()` is the only path that should ever call this stream.

## Stream 3 — Business metrics (fully anonymous, no account association at all)

Stored in `anonymous_events` (`stream = 'business'`).

| Event name | Fired when | Currently wired into |
|---|---|---|
| `page_view` | Any page render on the public site | `/` (landing page, this increment) |
| `signup_started` | A visitor begins the signup form | Not yet wired — planned |
| `signup_completed` | A parent account is successfully created | Not yet wired — planned |
| `ad_impression_recorded` | Mirrors an entry already written to `ad_impressions` (0013_ad_impressions.sql) — a business-metrics-friendly duplicate for unified reporting, not a second source of truth for the impression itself | Not yet wired — planned; `ad_impressions` is already the real record |
| `sponsorship_credit_viewed` | A `SponsorCredit` renders on a World page | Not yet wired — planned |

**Fields:** `pagePath`, `trafficSourceCategory` (coarse — see `traffic-source.ts`, raw referrer URL is discarded at collection time), `locale`, `countryCode` (optional, coarse). No identifier of any kind.

---

## What is never an event field, anywhere

Per `scripts/test-analytics-child-firewall.ts` (checked, not just stated): no `childId`, `parentId`, `userId`, `accountId`, `sessionId`, `cookie`, `deviceId`, or `fingerprint` field exists on `UsageMetricEvent` or `BusinessMetricEvent`, and no such column exists on `anonymous_events`.
