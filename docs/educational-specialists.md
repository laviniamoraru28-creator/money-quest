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
