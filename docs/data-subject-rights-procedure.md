# Money Quest — Data Subject Rights Procedure

The parent is the account holder and exercises these rights on behalf of both themselves and their child — matching the account architecture (the parent as account holder and decision maker wherever possible).

| Right | How it's exercised today | Implemented? |
|---|---|---|
| Access | `/parent/settings/data` — full account data export as a downloadable file | Yes |
| Rectification | Child Detail page — correct a nickname or age band directly. Parent's own email/password managed through normal Supabase Auth flows. | Yes (child fields — new this session) |
| Erasure (one child) | `RemoveChildButton` on the Child Detail page — cascades to every table tied to that child | Yes |
| Erasure (whole account) | `/parent/settings/account` — requires typing an exact confirmation phrase, tested against wrong/near-miss/empty input | Yes |
| Restriction of processing | Not implemented as a distinct mechanism — the closest equivalent available today is disabling the AI Coach per child, or the usage-analytics opt-out | Partial |
| Data portability | The data export (above) is a structured JSON file, which satisfies portability in substance even though there's no separate "portability" button | Yes, in substance |
| Object to processing | Marketing opt-out and usage-analytics opt-out exist; there is no separate general "object" mechanism beyond account deletion | Partial |

## What a parent should actually do

1. To see or download everything held: Data Management -> Export.
2. To fix a mistake in a child's details: that child's own page -> "Correct their details."
3. To remove one child but keep the account: that child's own page -> Remove.
4. To leave entirely: Account Settings -> type the confirmation phrase -> Permanently delete.

## Genuine gaps

"Restriction of processing" and "objection" as distinct, granular rights (separate from full account deletion) are only partially implemented — a parent who wants processing paused without losing their account entirely has fewer options than a parent who wants everything gone. This is a real, honestly-stated gap, not something to build a fake toggle for just to check a box.
