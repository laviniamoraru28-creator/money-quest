# Educational activity triage, 20 authored prompts

Date: 2026-11-20. Source: `messages/en.json`, inspected on main. This is an editorial prioritization of existing descriptions, not confirmation of rendered activity coverage.

## Decision
Do not implement 20 new games. The lesson's `interactiveActivity` is a text disclosure. Four records have a same-topic age-compatible game structure, but semantic equivalence has not been tested. Before development, check all existing games, labs and goal tools.

| Level | Topic | Priority | Recommended next verification |
|---|---|---|---|
| builder | money_basics | medium | Review existing game coverage; scenario cards could be a reusable 2-minute matching interaction |
| strategist | money_basics | medium | Review existing game coverage; scenario cards could be a reusable 2-minute matching interaction |
| builder | needs_wants | high | Verify existing needs-or-wants game and its age-specific reasoning; no new game until gap confirmed |
| strategist | needs_wants | high | Verify existing needs-or-wants game and its age-specific reasoning; no new game until gap confirmed |
| builder | saving | high | Inspect existing goal tracker or savings lab before proposing another tracker |
| strategist | saving | high | Inspect existing goal tracker or savings lab before proposing another tracker |
| builder | currencies | medium | Check existing currency game and exchange examples; if absent, reuse one exchange-rate widget |
| strategist | currencies | medium | Check existing currency game and exchange examples; if absent, reuse one exchange-rate widget |
| builder | scams | high | Verify scam-detective game covers warning signs and emotion/pressure at both age bands |
| strategist | scams | high | Verify scam-detective game covers warning signs and emotion/pressure at both age bands |
| builder | long_term_thinking | high | Prefer branching consequence scenario; check existing decision-making missions first |
| strategist | long_term_thinking | high | Prefer branching consequence scenario; check existing decision-making missions first |
| builder | giving | low | Prefer guided discussion for Strategist; Builder may use existing spend/save/give jars |
| strategist | giving | low | Prefer guided discussion for Strategist; Builder may use existing spend/save/give jars |
| builder | digital_money | high | Inspect digital-money-explorer and wallet/simulator; validate safe payment examples |
| strategist | digital_money | high | Inspect digital-money-explorer and wallet/simulator; validate safe payment examples |
| builder | investing_basics | high | Inspect Investing Lab before proposing portfolio simulation; check risk caveats |
| strategist | investing_basics | high | Inspect Investing Lab before proposing portfolio simulation; check risk caveats |
| builder | junior_isa | medium | Prefer a short guided timeline/comparison, not a standalone game; fact-check UK rules at publication |
| strategist | junior_isa | medium | Prefer a short guided timeline/comparison, not a standalone game; fact-check UK rules at publication |

## Highest value review sequence
1. Scams and Needs/Wants: verify existing game content and whether Builder and Strategist demand different reasoning. Avoid redundant activities.
2. Saving and Investing: verify whether the website already implements the goal tracker and Investing Lab named in prompts. Confirm calculations and risk explanations.
3. Digital Money: verify the real game and payment simulator against safe transaction examples.
4. Long-term thinking: test whether branching choices explain consequences, rather than reward guessing.
5. Remaining topics: use short reflective prompts or one reusable scenario component when justified by evidence.

## Acceptance criteria before any implementation
- An exact route, component and age-band are recorded for every claimed existing feature.
- A browser test confirms each selected interaction works with keyboard, touch and narration where required.
- A reviewer compares task demand to the lesson's stated objective and quiz.
- A small pilot checks comprehension and transfer, not merely completion or XP.
- No child personal data is collected; no extra game is built where an existing one suffices.

## Evidence limitations
- Priorities are editorial judgements based on authored prompts, not child studies.
- Same-topic game keys do not establish equivalence; different-topic games may teach the same skill.
- This report makes no claim that an activity is missing from production or that its teaching is effective.
- No merge, production change or user testing was performed.
