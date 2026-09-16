# Money Quest — Curriculum Content

## 1. What this replaces, honestly

Before this work, the database held exactly **3 lessons**, all for the Explorer (6-8) age band, covering only 3 of the 7 Worlds. Auditing them before writing anything new surfaced a real problem: every quiz's `explanation` field used the identical templated sentence ("The correct answer is '[X]', based on the concept covered in this activity.") with only the answer substituted in — auto-generated filler, not authored content. This document, the 21 real lessons in `src/content/curriculum/`, and `scripts/validate-lesson-content.ts` all exist because of that finding.

## 2. Coverage

**21 lessons — all 7 Worlds x all 3 age bands, one lesson per topic per age band:**

| World | Topic ID | Explorer (6-8) | Builder (9-11) | Strategist (12-14) |
|---|---|---|---|---|
| Coin Cove | `money_basics` | What Is Money? | Where Does Money Come From? | Money as a Tool, Not a Goal |
| Market Town | `needs_wants` | Need It or Want It? | The Grey Area | Needs, Wants, and Social Pressure |
| Golden Vault | `saving` | What Does Saving Mean? | Saving for Something Bigger | Saving vs. Spending: The Real Trade-off |
| Sky Exchange | `currencies` | Money Looks Different Everywhere | Cash, Cards, and Currencies | Understanding Exchange Rates |
| Guardian Gate | `scams` | Some Promises Are Too Good | Spotting a Scam | Scams Target Emotions, Not Logic |
| Horizon Peaks | `long_term_thinking` | Waiting Can Pay Off | Planning a Few Steps Ahead | Big Decisions, Long Timelines |
| Kindness Grove | `giving` | The Joy of Sharing | Giving on Purpose | Giving Thoughtfully |

Topic IDs were checked against `src/lib/domain/topic-labels.ts` — the taxonomy already established for the Parent Dashboard and weekly reports — and two of the newly-written topics were renamed to match it exactly (`currency` -> `currencies`, `safety` -> `scams`) rather than ship a second, inconsistent naming scheme.

## 3. The 11-part structure, mapped to the schema

The brief's 11 required parts map onto the existing `activities` table (columns) and its `content` jsonb column (already flexible enough — no schema migration needed beyond the content itself):

| Brief's part | Where it lives |
|---|---|
| Title | `activities.title` |
| Short introduction | `content.shortIntroduction` (new field) |
| Learning objective | `activities.learning_objective` |
| Story or scenario | `content.story` (new field — replaces the old `example`, which was a single illustrative line rather than a real scenario) |
| Interactive activity | `content.interactiveActivity` |
| Game | `content.gameIdea` — names which real game-engine mechanic/game the lesson ties into |
| Question | `content.quiz` |
| Feedback | `content.feedbackMessage` |
| Challenge | `content.challenge` |
| Reward | `activities.xp_reward` / `coin_reward_minor_units`, narrated by `content.rewardMessage` (new field) |
| Parent learning note | `content.parentNote` (new field) — **never rendered in the child-facing `LessonPlayer`**, surfaced only on the Parent Dashboard's Child Detail page |

## 4. Content rules, and how each is actually enforced

- **Natural English, shorter sentences for younger children**: `scripts/validate-lesson-content.ts` measures average sentence length in each topic's Explorer vs. Strategist explanation/story text and asserts Explorer is measurably shorter — checked as a number, not just eyeballed while writing.
- **Avoid unnecessary jargon**: age-appropriate vocabulary lists are scoped per band — Explorer lessons introduce 2 simple terms; Strategist lessons introduce more precise ones (`opportunity cost`, `emotional manipulation`, `deliberate decision`) appropriate to that age.
- **Never shame children for financial decisions**: every "retry" feedback message is framed as a normal part of learning, never as a wrong or bad choice — checked against a set of shaming-language patterns (`wrong answer`, `you failed`, `bad choice`, `you didn't understand`, etc.) across every lesson.
- **Fictional money**: every narrative uses "coins" generically; the validator checks that no lesson's story/explanation/introduction text contains a hardcoded currency symbol (GBP/USD/EUR/JPY symbols) — actual formatted amounts remain the job of the existing `formatCurrency()` pipeline elsewhere in the app, never hand-written into lesson prose.
- **Culturally neutral, internationally usable**: no lesson names a specific real bank, government scheme, or country-specific product. Checked directly against known UK-only terms (ISA, Premium Bonds, HMRC, National Insurance, NS&I) — zero matches.
- **"Rules can vary by country"**: the Currency lessons (exchange rates) and the Strategist Saving lesson (interest rates) carry an explicit `countryVariesNote` stating plainly that these specifics differ by country and provider and change over time — no specific rate or product is ever presented as universal or current.
- **No personal financial advice**: checked against advice-phrasing patterns ("you should invest," "we recommend buying," "the best bank"). Every lesson that touches a genuinely personal decision (the Strategist long-term-thinking and giving lessons especially) says explicitly, in its own parent note, that this isn't financial advice and that a real decision should be a family conversation, not something this app tells a teenager to do.

## 5. Honest gaps

- **One lesson per topic per age band** — a real, substantive lesson each, but a full curriculum would eventually want multiple lessons per topic (building depth within a topic, not just one pass). This is a deliberate, stated scope for this pass, not a hidden shortfall.
- **The corresponding game/challenge activity this lesson content references by name (e.g. "Coin Catch," "Currency Explorer") is a mix of already-built real games (12 exist in the game engine) and a few narrative-only game ideas not yet built as actual playable content** — `content.gameIdea` describes the tie-in; it doesn't guarantee every named game exists as a literal activity row yet. Cross-referencing `gameIdea` text against the real seeded game catalog (`0005_seed_games.sql`) is a reasonable next validation to add.
- **Deleting and re-inserting the 3 original lesson IDs** (`0019_lesson_content.sql`'s delete-then-insert of the same ids) is safe for this pre-launch, seed-data context, but a real production migration replacing already-completed activity content would need a proper data-migration strategy (e.g. versioning activity content rather than replacing by primary key) so a family's existing completion record isn't affected by a future content update. Noted here rather than silently assumed away.
