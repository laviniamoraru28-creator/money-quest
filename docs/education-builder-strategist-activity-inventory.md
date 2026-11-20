# Builder and Strategist activity inventory: initial findings

Inspected `messages/en.json`, `src/components/lesson/LessonPlayer.tsx` and `src/game-engine/structures.ts` on main, 2026-11-20.

## Verified source facts
- All 20 Builder/Strategist English lesson records (10 per band) include an `interactiveActivity` description.
- In `LessonPlayer.tsx`, these descriptions render as plain text within a collapsible `details` disclosure, not executable interactions. A separate quiz is executable.
- Only four of these 20 lesson records have an age-band-compatible game in `GAME_STRUCTURES` with the exact same `topicId`: Builder and Strategist `needs_wants` (`needs-or-wants`) and `scams` (`scam-detective`). This is an exact topic-key match, not proof of prompt coverage.
- Additional games with other topic IDs may exercise related skills, including `digital-money-explorer` and `smart-shopping-detective`. They are not automatically linked to lesson prompts by this inventory.

## Editorial examples, NOT confirmed feature gaps
| Band | Topic | Authored activity | Recommended review |
|---|---|---|---|
| Builder | money_basics | Match ways of earning to scenario cards | Verify whether another existing game supports scenario matching |
| Builder | saving | Set and track a savings goal | Check existing goal tools before adding a new tracker |
| Strategist | saving | Compare savings scenarios and interest over time | Check existing savings/investing labs and accuracy of assumptions |
| Strategist | currencies | Convert prices using an exchange rate | Consider a small reusable calculation widget only if no equivalent exists |
| Builder | scams | Highlight warning signs in sample messages | Compare with `scam-detective` game and avoid duplication |
| Strategist | digital_money | Inspect wallet history and a suspicious payment message | Check whether existing digital-money content already supports transaction review |
| Strategist | investing_basics | Compare two portfolios in Investing Lab | Inspect Investing Lab before alleging missing functionality |
| Strategist | junior_isa | Order age milestones 16 and 18 | May be a short guided reflection, not a new game |

## Decision gate
Do not build 20 new games. First classify each prompt as:
1. Existing equivalent interaction, with verified route and age-band access.
2. Intentional off-screen discussion/reflection, clearly labeled for the learner.
3. A genuine missing on-screen activity, prioritized by learning benefit, reusability and implementation cost.

The generated report `builder-strategist-activity-inventory.json` deliberately leaves these human categories unset. It lists all 20 exact source prompts, topic-matched games and source pointers. It does not claim runtime behavior or educational impact.
