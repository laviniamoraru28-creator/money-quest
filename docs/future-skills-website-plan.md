> Historical planning record. The combined implementation and current scope are recorded in `website-integration-record.md`. Consult the final QA record for executed checks.

# Web-only Future Skills Hub — proposed content architecture

This is separate from Godot and Real Life Quests. No game engine required.

## First six micro-activities
1. **Fact Detective** — "Is that true? Let's check!" Compare two claims and identify a reliable source.
2. **AI Can Make Mistakes** — "A robot said it. Is it right?" Verify a simple answer using a trusted reference.
3. **Two Good Choices** — "Which works best for you?" Compare options and explain a preference.
4. **Try Another Way** — "Oops! New plan!" Explore a low-stakes mistake and try a different approach.
5. **My Calm Plan** — "Too much going on? Choose a break." Offer multiple non-judgemental regulation strategies.
6. **Digital Safety Detective** — "Someone asks for your password. What now?" Practise asking a trusted adult.

## Suggested record schema
- id, title, skill, age-independent difficulty tier
- shortPrompt, plainLanguagePrompt, optionalAudioText
- visualChoiceLabels, choices, feedbackPerChoice
- realWorldTryIt, adultTip, observableGoal
- estimatedTime (non-binding), no timer, sources and reviewDate
- accessibilityNotes, translationStatus, safeguardingNotes

## Implementation principles
- One idea per screen, optional listening and enlarged text.
- Non-verbal participation and choice-based answers where possible.
- Local-only progress, no account, no personal data collection.
- Avoid diagnosis-specific claims or promises of clinical benefit.
- Do not publish until editorial, accessibility, safeguarding and browser reviews pass.

## Dependencies
First complete the audit of existing UI and translations. Reuse components where safe; do not duplicate Claude's quests.
