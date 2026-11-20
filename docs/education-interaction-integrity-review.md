# Educational interaction audit, first browser regression

Source reviewed: `src/components/lesson/LessonPlayer.tsx`, `src/components/explorer/ExplorerInteractiveLesson.tsx`, `e2e/journeys/explorer-comic-lessons.spec.ts`, `messages/en.json`.

## Finding: not all authored interactive activities are interactive in the browser
For Builder and Strategist, `LessonPlayer.tsx` displays `activity.content.interactiveActivity` inside a `<details>` element with a text paragraph (around lines 355–362 in the inspected main version). The content may describe an exercise, but this is **not an executable exercise** in the lesson player. The lesson's actual on-page assessment is a multiple-choice question with explanation, retry, and reward on a correct response.

For Explorer, the same component mounts `ExplorerInteractiveLesson` for supported topics. Money Basics implements four stages with controls, and the existing `explorer-comic-lessons.spec.ts` already includes an English and Romanian complete playthrough. Avoid claiming there are no interactive activities or duplicating that test.

## New focused Playwright regression
`e2e/journeys/educational-assessment-integrity.spec.ts` checks:
1. Wrong Builder answer exposes explanation and retry, without completion or XP.
2. Correct answer after retry records one completion and expected 20 XP; reload does not award again.
3. The Builder `interactiveActivity` text is presented as a disclosure without executable inputs inside that disclosure.

Run with a working local website and installed Playwright browsers:
```bash
npx playwright test e2e/journeys/educational-assessment-integrity.spec.ts --project=desktop-chrome
```
These tests have **not yet been executed successfully**. No browser or learning effectiveness claims are made.

## Product recommendation requiring owner approval
First inventory every Builder/Strategist `interactiveActivity` and classify it as (a) existing interactive feature, (b) off-screen reflection/real-life exercise, or (c) misleading description of a missing digital exercise. Only then decide which are worth building as actual interactions. Do not automatically turn every text prompt into a new game; cost and repetition could outweigh learning value.

## Learning limitations
A quiz can verify a selected answer, not necessarily comprehension or transfer. Reward integrity is a technical test, not evidence of motivation or educational impact. No child data is collected and no production content is modified.
