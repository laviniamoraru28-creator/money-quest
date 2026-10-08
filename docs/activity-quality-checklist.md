# Activity quality checklist

Every major Money Quest World activity must pass this checklist before it
counts as complete.

The checklist lives in code (`ActivityChecklist`). Each activity's
`ActivitySpec` (`data/activities/*_spec.tres`) answers every question in
one of four ways:

- `auto`: an automated scenario in the activity's test harness proves it;
- `manual: <note>`: a person judged it, and the note says what they saw;
- `pending: <note>`: still to be judged by people (for example with children);
- empty: not checked yet. The activity is not complete.

**The design test.** Picture a 9-year-old who cannot read, does not speak,
cannot rely on spoken instructions, may process information slowly, may
need repetition, and may have sensory differences. If this child can
understand the objective, start the activity, make a choice, understand
the result, retry, compare alternatives and finish, the activity works for
many other children too.

Never build a separate version for them. Improve the main interaction.

## The questions

| # | Question | How to check it |
|---|---|---|
| 1 | Can the player understand the objective without reading? | Words off: the mission card shows pictures, and the world points (beacons, a character points). |
| 2 | Can the player complete it without speaking? | Nothing asks for voice. |
| 3 | Can the player complete it without hearing? | Muted run: every sound has a visual equivalent. |
| 4 | Is success visible? | A tick card, a world change, a happy face or emote. |
| 5 | Is failure (not yet) visible? | A "not yet" card showing the reason (e.g. lock, 18). Never a red cross. |
| 6 | Can the player retry? | A Try again button, or the object can be used again. |
| 7 | Can the player see what changed? | Before → after cards, coins, numbers, the world itself. |
| 8 | Can the player compare alternatives? | What if? card (`WhatIf`). |
| 9 | Does it work at different competency levels? | `ActivitySpec.competencies`, and stages chosen by `Competency.challenge_level`. |
| 10 | Does it teach something useful? | A person checks it. |
| 11 | Is it actually fun, even without the explanation? | A person checks it, ideally with children. |
| 12 | Does Reduced Motion work? | RM run: nothing flies, pops or slides, and the information is the same. |
| 13 | Does muted mode work? | Muted run. |
| 14 | Does Words Off work? | Words-off run: no label is required. |
| 15 | Keyboard? | Keyboard run. |
| 16 | Gamepad? | Gamepad run. |
| 17 | Mouse and touch? | Mouse and touch runs. |

If any answer is "no", redesign the activity. Don't add text to patch it.

## Writing a new activity: use the shared pieces

| Need | Use |
|---|---|
| Look here / go there / a character shows how / feelings | `WorldGuide` (beacons, trail, pointing, `express` + `Emote`) |
| Pictures for ideas | `Symbols.token("save")`, drawn by `MissionStrip` |
| The goal as pictures | `ObjectiveManager.set_icons` / `VisualMissions` |
| A choice at an object | `ResourcePurpose.choose` (`PurposeChoiceCard`) |
| Coins in hand for the activity | `PursePanel` |
| Success / not yet / what changed / try again | `Feedback` |
| What if? | `WhatIf.compare` |
| Deeper information (layers 2 and 3) | `InfoLayers` / `InfoStand` / `MoreCard` |
| Real financial products by country | `FinanceLocale` (concept vs product vs terms) |
| Skills and levels | `ActivitySpec` + `Competency` (never age) |
| This checklist | `ActivityChecklist` + a harness with the 6 standard runs (see `_timevault.gd`) |

## Reviewed activities

| Activity | Spec | Auto runs | Manual notes |
|---|---|---|---|
| Time Vault | `time_vault_spec.tres` | child (gamepad, words off, muted), keyboard, touch + RM + strong guidance, mouse + light guidance, locale, model | "teaches" answered; **"fun" pending** a play-test with children, so the activity is not yet complete |
