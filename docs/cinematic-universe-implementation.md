# Money Quest Cinematic Universe: implementation contract

Status: foundation in draft PR. This document does not authorize production rollout.

## Decisions
- Remove girl-and-dog guide from child-facing experience after auditing all references. Child-selected avatar is protagonist.
- Journey: age portal (Explorer 6–8, Builder 9–11, Strategist 12–14) → choose one of six avatars → world map → Money → Entrepreneur → Leadership → AI.
- Preserve all nine locales, existing lesson/game logic, localStorage progress and certificates. Previously completed content remains reachable.
- Reuse existing Explorer comics with consistent art direction, not an educational rewrite.
- No autoplay audio, no unskippable video, no video-only navigation, no rewards solely for clicks.
- Implement incrementally; no deployment until tests and owner acceptance.

## Tokens
| Quest | Accent | Soft | Surface |
| --- | --- | --- | --- |
| money | #C9953D | #F2D79B | #FFF5DF |
| entrepreneur | #C77938 | #F1B66C | #FFF0DE |
| leadership | #287E80 | #A5D2C8 | #EAF6F2 |
| ai | #5867B7 | #A79BDB | #F0EEFF |

Text #243448; secondary #586779; neutral surface #FFFCF6; background #F7F5F0; dark chrome #14263E; success #287D64; error #B64C50; focus #2457D6. Gold is decorative, not normal text on white.

## Components
- CinematicHeader and BottomQuestHUD: frosted dark panels, explicit keyboard focus and touch targets >=44px; mobile actions remain reachable.
- AgePortal: static poster with actual semantic buttons overlayed on a video; fallback list when motion disabled.
- AvatarPicker: six named, keyboard-selectable avatars with still-image fallback, choice saved locally, no account.
- WorldMap: semantic links for four quests, visible status and progression; use static poster and positioned interactive elements, never video pixels as sole navigation.
- QuestIntro: optional video with Skip, sound off, reduced-motion still; returning users skip long intro.
- RewardCelebration: coin/star/competency badge/crystal events from verified progress, idempotent award ledger, never per click.
- LessonFrame: shared readable surfaces, Quest accent, Explorer large visual/audio choices, Builder scenarios, Strategist reasoning.
- Presentation preference: cinematic/balanced/calm, default balanced on mobile, always respect prefers-reduced-motion and existing reduced-motion/focus/night controls.

## Asset inventory (original upload prefixes)
Avatars: AQO_iSm, AQORW5Y, AQOuz5r, AQNqDzh, AQN3wxx, AQNyM-u.
Age portals: AQOx1n.
World entrance: AQONKICf. Vertical world variant: AQNxGxm.
Quest intros: AQN2Bs7q (Money), AQObjwZar (Entrepreneur), AQPOrCTT (Leadership), AQPnj39f (AI).
Transitions: AQPmr1C (golden road), AQOACz1 (blue portal), AQPV_go (progress).
Rewards: AQNy1Bz (star), AQPBneD (particles).
Still rewards: gold star, gold coin, decision/building/AI/curiosity badges, crystal.

Uploaded assets currently live in conversation storage, NOT in GitHub. Connector text-file APIs do not upload binary video. Before integrating, prepare actual optimized media, verify licensing and exact video/character mapping, preserve original files, export WebM alpha plus still fallbacks where supported, inspect magenta key edges frame-by-frame and compare sizes.
Never ship unverified placeholder asset paths.

## Acceptance
1. No girl/dog guide remains in child UI; no broken references.
2. Avatar choice persists; can be changed; six options work with keyboard/screen reader.
3. Age portal and all four Quest links navigate to the right localized content.
4. Existing progress migrates without reset; old completed quests remain accessible.
5. No content is hidden solely behind a video or hover.
6. Reduced motion, calm mode, focus mode and night view remain usable.
7. All 9 locales, 3 age bands, 320px viewport, screen reader and keyboard checked.
8. Lint, typecheck, unit, e2e, production build and media budget verified in CI.
9. Keep main and production untouched until approval and green CI.

## Release order
1. Inventory actual route/components and guide references, establish baselines.
2. Prepare original media locally; create static posters and alpha videos.
3. Opt-in tokens and reusable components.
4. Pilot Explorer end-to-end (portal → avatar → world → Money lesson → reward).
5. Extend Builder and Strategist, then all quests and locales.
6. Regression, performance and accessibility audits; rollout behind feature flag.
