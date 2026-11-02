# English child-facing copy review — first pass

Reviewed source: `messages/en.json` on `feature/inclusive-future-skills`. This is a targeted editorial review, not a complete audit of all 1,118+ translated keys or other locales.

## Principles
- Preserve interpolation tokens exactly (e.g. `{weeks}`, `{goalName}`).
- Avoid changing keys in only one locale while nine languages remain routable.
- Do not rewrite legal, privacy, parent-facing or technical text as child dialogue.
- Never simplify away safety information.

## Suggested child-facing English rewrites (pending coordinated localization)
| Key | Current | Proposed | Reason |
| --- | --- | --- | --- |
| play.chooseYourLevel | Choose your learning level | Pick your level! | Shorter, more inviting |
| play.levelChoiceHint | This just changes how the lessons are written - nothing about your choice is saved anywhere except this device. | Pick what feels right. You can change it later. Your choice stays on this device. | Simpler while preserving local storage claim |
| play.yourWorldMap | Your World Map | Your adventure map | More playful |
| play.noGoalsYet | No goals yet - start one above! | Got a goal? Add it above! | Positive invitation |
| play.whatAreYouSavingFor | What are you saving for? | What would you love to save for? | Inviting, not pushy |
| play.planYourSavingTitle | Plan it out | Make a saving plan! | Clear action |
| play.planYourSavingPrompt | Try a weekly amount to see how long it might take. | How much could you save each week? Let's find out! | Concrete and conversational |
| play.worldSequenceComplete | Great work - you have completed every activity here for now! | Wow! You've tried everything here. Great work! | Short and friendly |
| play.lessonNotAvailable | That lesson isn't available. | This lesson isn't ready yet. | Friendly; verify availability meaning |
| play.gameNotAvailable | That game isn't available. | This game isn't ready yet. | Friendly; verify availability meaning |

## Important cautions
- `play.resetConfirm` is a destructive confirmation; keep the full warning explicit.
- `play.virtualMoneyExplainer` is a financial safety disclosure; do not shorten away the distinction from real money.
- `play.levelChoiceHint` refers to local storage; re-verify the storage implementation before using a shortened version.
- Labels like `Early Learner` may feel age-based or stigmatizing; consider neutral skill tiers (Explorer, Builder, Strategist) but do not change them without reviewing level selection UX and all translations.

## Next review
Audit child-facing lesson bodies, quizzes and feedback for sentence length, vocabulary, tone, inclusivity and safeguarding. Then update every published locale together or keep the public experience English-only until translation QA is complete.
