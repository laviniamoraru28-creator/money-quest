# Money Quest — Gamification System & Ethics

## 1. What exists

| System | Status | Where |
|---|---|---|
| XP | Pre-existing (original MVP) | `children.xp_total`, `complete_activity()` |
| Levels | Pre-existing | `children.level` = `floor(xp_total / 100) + 1` |
| Badges | **New this increment** | `badges`, `child_badges`, `check_and_award_badges()` |
| Achievements | **New this increment** | `badges.badge_type = 'milestone'` (Getting Started, Ten in a Row, Level Five) |
| Streaks | **New this increment** | `children.current_streak_days`/`longest_streak_days`, `record_daily_streak()` |
| Challenges | **New this increment** | `src/lib/domain/weekly-challenge.ts` — personalised, rule-based |
| Goals | **New child-facing UI this increment** | `savings_goals`, `contribute_to_goal()` (both existed since the original MVP; no UI called them until now) |

## 2. An honest tension, and how it was resolved

XP is currently awarded on activity **completion**, not gated on correctness — `quiz_correct` is recorded on every completion but doesn't affect the XP amount (`complete_activity()`, unchanged since the original MVP build). This sits in some tension with this brief's "progression system based on demonstrated skills."

This increment deliberately did **not** rewrite that core, widely-depended-on function. Instead: **badges are the system that concretely enforces "demonstrated skill."** Every single badge criterion in `check_and_award_badges()` requires `quiz_correct = true` on the relevant activity — a child who completes a game without getting it right earns no badge for it, regardless of how much XP the completion itself awarded. Streak advancement has the same requirement (`record_daily_streak()` is only ever called from a correct completion — see `complete-activity.ts`). This is a real, stated design trade-off, not a claim that every system in the app is equally strict about correctness.

## 3. Anti-patterns explicitly avoided, and the actual mechanism

| Prohibition | Mechanism |
|---|---|
| No gambling mechanics | Every reward (XP, badge, streak day, goal progress) is a deterministic function of real, checkable data — no code path anywhere generates a random outcome for a reward. |
| No loot boxes | There is no "mystery reward" concept anywhere in the schema or UI. A badge is either earned (criterion met) or not shown at all — see `BadgesGrid.tsx`'s own comment on why locked/mystery badges are deliberately never displayed, since a grid of tempting locked icons is itself a mild engagement-bait pattern. |
| No random paid rewards | There is no payment system anywhere in this codebase (verified in the child-safety audit two increments ago) — nothing to spend real money on, randomly or otherwise. |
| No compulsive-behaviour encouragement | Streaks reset gently (current streak resets to 1, not 0, on a missed day; the longest-streak record is never erased) rather than punitively. There is no "streak freeze" purchase, no countdown timer, no "you're about to lose your streak" messaging anywhere. |
| No manipulative notifications | There is no push-notification system for children anywhere in this codebase. Streaks and challenges are shown passively, only when the child is already using the app — never used as a hook to pull them back. (The AI Coach flagged-interaction email alert, `parents.notification_preferences`, is parent-facing and safety-oriented — a different thing entirely, unrelated to gamification.) |
| Rewards reinforce learning, not screen time | Badges and streaks are gated on `quiz_correct = true`, never on session duration, login count, or time-on-page — nothing in this schema even has a duration/time-spent column that could be used this way. |
| No reward for spending more time on the site | Same mechanism — there is no code path anywhere that reads elapsed time, page views, or session length and turns it into a reward of any kind. |

## 4. The 9 named badges — real criteria, not decorative names

Every badge criterion checks against real game keys and topic data verified against the actual seeded content before being written (not invented):

- **First Saver** — correct completion of the Save or Spend game
- **Smart Shopper** — correct completion of the Smart Shopper game
- **Goal Getter** — fully funding a savings goal (`savings_goals.achieved_at`)
- **Budget Builder** — correct completion of the Build a Budget game
- **Price Detective** — correct completion of the Price Detective game
- **Money Explorer** — correct completion of at least one activity in 3+ different Worlds (rewards breadth of exploration, not depth of grinding one topic)
- **Scam Detective** — correct completion of the Scam Detective game
- **Currency Explorer** — correct completion of the Currency Explorer game
- **Future Thinker** — reaching the savings goal within a Money Life Simulator scenario

## 5. Challenges: personalised, not generic engagement bait

"This week, try: [topic]" is computed by reusing the exact same `computeSkillBreakdown()`/`summarizeStrengths()` functions already built and tested for the Parent Dashboard (`progress-analysis.ts`) — the child's challenge and their parent's "could use more practice" card point at the same topic, computed once, not two systems that could disagree. No challenge is shown at all until there's enough real data (2+ attempts in some topic) for a confident recommendation — never fabricated to have something to display.

## 6. Goals: closing a long-standing gap honestly

The `savings_goals` table and `contribute_to_goal()` RPC have existed since the very first build session, explicitly flagged as "schema exists, no UI" in every Parent Dashboard summary since. This increment finally builds the child-facing UI: create a goal, see progress, contribute from the wallet. Every amount is the family's own fictional currency, formatted through the same `formatCurrency` pipeline used everywhere else — never real money.

## 7. What this document is not

Not a claim that gamification research is settled or that this system is risk-free for every child — reasonable people disagree about streaks specifically, even gentle ones, for some children. What's documented here is what was deliberately built and deliberately avoided, and why, so a reviewer can evaluate the actual design rather than take "ethical gamification" as a label on faith.
