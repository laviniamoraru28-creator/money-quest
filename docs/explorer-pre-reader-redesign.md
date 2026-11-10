# Explorer 6–8: pre-reader redesign specification

Status: implementation plan, not completed feature. Scope: all existing Explorer lessons and interactive activities, not Builder or Strategist.

## Non-negotiable acceptance criteria
1. A child unable to read can start, navigate, complete and exit every Explorer lesson and activity with audio and visual controls only.
2. Preserve each existing lesson's financial learning objective and sequence; inventory actual lesson IDs and activity routes before changing content.
3. Replace paragraphs and reading-based quizzes with short spoken prompts, concrete objects, demonstrations, guided practice and one action-based mastery check per concept.
4. Spoken instruction is replayable on every step. Respect mute, reduced motion, focus mode, keyboard navigation and screen readers. Audio must not block interaction and must not autoplay unexpectedly.
5. Use pictorial answers with accessible labels. Never use colour as the sole distinction.
6. Touch controls >=44px; drag-and-drop has equivalent tap-to-select/tap-to-place and keyboard actions.
7. Incorrect attempts trigger supportive corrective feedback and retry, never a penalty or time limit.
8. Provide persistent Back, Next, Replay and Exit. Reset prior overlays/visual objects on step changes.
9. Use age-appropriate denominations, real-world purchase examples and locale-specific currency. Avoid introducing abstract prices before counting with 1–5 objects.
10. Keep existing progress, certificates, settings and 9-language routing; no English fallback for learner-facing spoken prompts.
11. Child-facing rewards are virtual only. Optional home coupons require explicit parent configuration, no automatic screen-time rewards.
12. No new shop promotion; do not alter commerce code.

## Per-lesson pedagogical pattern
- Hook: 1 short spoken scenario with two or three large illustrated objects.
- Show: a concrete animated or static demonstration.
- Try: one guided choice, matching or sorting interaction.
- Practice: two to four varied scenarios, each under 30 seconds.
- Check: independent demonstration of understanding, with replay and retry.
- Celebrate: small visual acknowledgment, with reduced-motion alternative.

Target 3–5 minutes per lesson segment; split longer existing lessons into multiple short scenes without deleting objectives. No mandatory reading or typing.

## Interaction primitives to implement and reuse
- SpokenPrompt: concise localized prompt, replay, captions optional, audio fallback.
- PictureChoice: 2–3 image-led choices with keyboard/touch activation.
- PictureSort: two visual destinations, tap alternative to drag.
- CoinCount: 1–5 manipulable coins with spoken count.
- StoryStep: narrated illustrated scenario and clear navigation.
- GentleFeedback: encouraging feedback, correction and retry.
- ExplorerProgress: stars and progress, never punitive.

## Sample conversion: Needs vs Wants
Scene 1: Puppy is hungry; show food and superhero cape.
Audio: “Cățelușului îi este foame. Ce alegem mai întâi?”
Child taps food. Feedback: “Da! Hrana îl ajută să crească.”
If cape: “Pelerina este distractivă. Dar cățelușului îi este foame. Mai încearcă.”
Scene 2: Two baskets identified by food/home icons and play icon, with spoken labels; sort 4 everyday items.
Scene 3: Change the story (raincoat vs decorative sticker) to check generalization.
Offer tap sorting, replay and keyboard equivalents.

## Work order
1. Inventory every Explorer lesson, minigame, lab and simulator; record objective, reading dependence, current component, localization and test coverage.
2. Implement shared accessible interaction primitives and unit/browser tests.
3. Convert lessons in existing order, keeping all learning objectives.
4. Convert minigames, quizzes, simulator and Explorer lab activities.
5. Test non-reader journeys in all nine languages, mobile touch, desktop keyboard, muted audio, screen readers, reduced motion, and 6/8-year-old comprehension.
6. Keep feature branch isolated; merge only after CI and end-to-end QA.

## Definition of done
Every Explorer lesson and activity has a mapped objective, a spoken/visual-only route, an action-based mastery check, and automated coverage. No unfinished content is exposed to learners.
