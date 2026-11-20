# Money Quest Educational Psychology and Subject Specialists

## Status
Pilot only, evidence-gated and read-only. No autonomous psychological assessment, no child data, no content publication, no external AI/API calls.

## Roles and ownership
- **Educational Psychology Specialist:** cognitive load, motivation, emotional safety, accessibility, transfer of learning, progression across Explorer 6–8, Builder 9–11, Strategist 12–14.
- **Learning Architect:** retains instructional design ownership. No new Instructional Design agent.
- **Financial Education Specialist:** financial concepts and real-world decisions for Money Quest.
- **Entrepreneurship Education Specialist:** idea validation, costs, value and ethical decisions for Entrepreneur Quest.
- **Leadership Education Specialist:** collaboration, conflict resolution, participation and responsibility for Leadership Quest.
- **AI Literacy Specialist:** pilot rubric for future AI Quest; no claim AI Quest is launched.
- **Inclusive Experience Guardian:** separate accessibility review; this pilot does not replace it.

## Pilot workflow
1. A human prepares a JSON array of lesson/activity review records.
2. Each record identifies a domain, age band, learning objective, activity, assessment, source URLs with claims and limitations, and reviewer notes.
3. Human reviewer enters `rubric` and `domain_checks` values (`pass`, `concern`, `not_applicable`).
4. Script checks completeness and flags concerns for a human decision.
5. Human educational reviewer confirms evidence, age suitability and any proposed changes. Code does not edit curriculum or claim effectiveness.

Run:
```bash
python3 -m unittest scripts.test_educational_specialists -v
python3 scripts/educational_specialists.py --input path/to/review-input.json --output artifacts/education-specialists/review.json
```

This is a structured intake and review mechanism, **not** an automated expert that independently reads and evaluates every existing lesson. Its current inputs are supplied by a reviewer; any `pass` reflects the reviewer statement and is not independently verified. No diagnosis, child profiling, autonomous educational certification, automatic merge or production deployment.

## Next gates
Map actual Money Quest / Entrepreneur Quest / Leadership Quest content into structured review records, verify source evidence and rubrics with qualified educators, inspect real lesson experiences, then propose changes in separate PRs. Human review is required before any curriculum changes.

## Connected source inventory (2026-11-20)
`scripts/curriculum_source_inventory.py` now scans actual repository files under `src/` for candidate references to Money Quest, Entrepreneur Quest, Leadership Quest and AI Quest, including age-band markers. It generates `artifacts/education-specialists/curriculum-source-inventory.json` with source paths, matched domains, marker evidence and explicit unverified fields. The workflow uploads this artifact on PR checks and, after merge into main, every Tuesday at 08:20 UTC.

Run locally:
```bash
python3 -m unittest scripts.test_curriculum_source_inventory -v
python3 scripts/curriculum_source_inventory.py
```

This is a source discovery connection, **not** semantic evaluation of actual lesson quality. File-level keyword hits may be shared components, translations or unused code. Human review must map each candidate to a real activity and supply age-specific objectives, evidence sources and rubric answers to `educational_specialists.py`. The source scanner does not automatically fill those fields or invent scientific citations.

## Structured English curriculum bridge (2026-11-20)
Verified source shape in `messages/en.json`: `curriculum` has 30 lesson records; `entrepreneurQuest.stages` has 18 stage records; `leadershipQuest.missions` has 12 mission records. This source represents **60 records**, not necessarily 60 fully distinct, accessible or pedagogically validated activities.

`scripts/structured_curriculum_bridge.py` extracts these exact records with stable JSON pointers, source excerpts, available learning objectives and activity text into `artifacts/education-specialists/structured-curriculum-drafts.json`. The report includes counts by domain and warnings for malformed records. Explorer/Builder/Strategist are parsed only from explicit Money Quest lesson keys. Entrepreneurship and leadership age bands are left null pending verified age mappings. AI Quest records are not invented.

Review drafts deliberately leave research sources, reviewer notes, assessments and psychology/domain rubric scores blank. They are **not automatically passed** to `educational_specialists.py` as approved evidence. The workflow uploads this extraction together with the source inventory, and unit tests cover the actual record structure and missing evidence.

Run:
```bash
python3 -m unittest scripts.test_structured_curriculum_bridge -v
python3 scripts/structured_curriculum_bridge.py
```

Next: a qualified reviewer maps individual mission goals and age differentiation, assesses specific examples and collects primary research sources before any learning-quality conclusions or lesson edits.

## Initial content audit (2026-11-20)
`scripts/education_content_audit.py` analyzes actual English curriculum record fields and generates source-pointer evidence candidates, not clinical or pedagogical verdicts. It checks missing explicit objectives and quiz questions in Money Quest translation records, long introductions for screen/audio review, exact identical objective/activity strings across age bands, and explicit objective/age-band metadata in Entrepreneur Quest and Leadership Quest translation records.

Direct inspection of `messages/en.json` found 30 Money Quest lessons in 10 topics with all three age-band records represented, **zero exact duplicated English objectives/interactiveActivity texts between bands**, 18 Entrepreneur Quest stages and 12 Leadership Quest missions. This does **not** prove sufficient age differentiation or absence of repeated experiences. Entrepreneur Quest and Leadership Quest lack explicit `learningObjective` and `ageBand` fields in the sampled translation records, but these may be defined in application logic; no confirmed defect is claimed.

The script reports every observation as `human_review_candidate`, with `confirmed_defect: false`. It does not inspect rendered screens, audio, real student comprehension or external evidence. The workflow uploads `initial-content-audit.json`.

```bash
python3 -m unittest scripts.test_education_content_audit -v
python3 scripts/education_content_audit.py
```

## Qualitative review packs
`scripts/education_qualitative_pack.py` now prepares side-by-side Explorer/Builder/Strategist comparisons of actual English learning objectives, activities, challenges, quiz questions and text-length counts for all available Money Quest topics. It labels all verdicts `not_assessed` and requires a human reviewer. It uploads `qualitative-review-pack.json` in the workflow.

A first manually inspected, source-grounded comparison of Money Basics and Saving is recorded in [education-initial-comparative-review.md](education-initial-comparative-review.md). It identifies potential assessment-alignment questions, not confirmed defects. No runtime or child testing has occurred.
