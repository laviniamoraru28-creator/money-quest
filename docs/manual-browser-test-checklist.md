# Money Quest — Manual Browser Test Checklist

For you to run after deployment, or locally with `npm install && npm run dev`. I cannot perform any of these myself in this environment (no network access to install dependencies, no browser tool) — every item below is genuinely untested until you run it. Each is a simple PASS / FAIL.

| # | Test | How to check | PASS / FAIL |
|---|---|---|---|
| 1 | Homepage loads | Open `/`. Hero, "Get started" button, and footer all visible, no visible errors | |
| 2 | Language selector opens | Click the globe button in the header. A dropdown list of 9 languages appears | |
| 3 | All 9 languages switch correctly | Select each language in turn. Confirm the page text visibly changes each time (not just the flag/label) | |
| 4 | Level selection works | Click "Get started", choose a level (Early Learner / Primary / Older Learner). You land on the World Map | |
| 5 | All 7 Worlds are visible | On the World Map, confirm 7 world cards are shown | |
| 6 | All 21 lessons reachable | Click into each World at each of the 3 levels; confirm a lesson opens for each combination that should have one | |
| 7 | A lesson's quiz works | Open any lesson, select a wrong answer (see feedback, can retry), then select the right answer (see success + XP/coins awarded) | |
| 8 | A game works end to end | Open any game, play through all rounds, confirm a completion screen with a score appears | |
| 9 | Money Life Simulator works | From the World Map, click "Money Life Simulator". Play through all weeks and confirm a final report appears | |
| 10 | Scam Detective works (Early Learner) | In Guardian Gate, Early Learner level, open Scam Detective and confirm it plays correctly | |
| 11 | Progress persists after refresh | Complete one lesson, refresh the page (F5). Confirm the lesson still shows as completed and your coin/XP total is unchanged | |
| 12 | Progress persists after closing the browser | Complete one lesson, fully close the browser, reopen it, navigate back to the site. Confirm progress is still there | |
| 13 | Reset Progress works | Click "Reset Progress", confirm the warning dialog, confirm. You should return to the level-selection screen with zero progress | |
| 14 | Savings goal can be created and funded | Go to "My Savings Goals", create a goal, add coins to it, confirm the progress bar updates | |
| 15 | Mobile layout — no horizontal scroll | Resize the browser to ~375px wide (or use a real phone). Confirm no horizontal scrollbar appears anywhere | |
| 16 | Mobile layout — nothing cut off or overlapping | At the same width, check the World Map, a lesson, and a game for cut-off text or overlapping buttons | |
| 17 | Mobile touch targets | Confirm buttons are comfortably tappable with a finger, not cramped together | |
| 18 | Desktop layout — no excessive empty space | Resize to ~1440px wide. Confirm content is reasonably centered, not stretched oddly thin or leaving huge gaps | |
| 19 | All navigation links work | Click every header/footer link (Learn, Privacy, Contact, Parent Information, For Parents) and confirm each loads the right page | |
| 20 | No console errors during normal use | Open the browser's developer console (F12), click through the full journey above, confirm no red errors appear | |

## If anything fails

Note the exact test number, what you saw, what browser/device you used, and — if possible — any red text from the developer console. That's the fastest path to a real fix.
