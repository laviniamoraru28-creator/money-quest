# Money Quest Education Guardians

Three read-only, no-API-cost MVP agents:

- Inclusive Experience Guardian scans TSX components for potential missing image alternatives and icon-only button labels. These are review candidates, not accessibility certification.
- Learning Architect flags potentially randomized lesson flow and requests human review of learning progression across Explorer (6-8), Builder (9-11), Strategist (12-14). It does not claim to assess learning outcomes automatically.
- Future Skills Radar reads only curated, dated evidence from `research/future-skills-evidence.json`. Without verified evidence, it explicitly reports an evidence gap rather than inventing trends.

Run locally: `python3 scripts/education-guardians.py`.

The GitHub workflow runs weekly on Tuesday 08:00 UTC once merged to the default branch, and on demand. Pull requests only generate an artifact for validation. On scheduled/manual runs, the full report is included in a GitHub Issue with a separate `@claude` comment. This is the handoff mechanism, but GitHub App behavior must be tested: some Claude integrations ignore bot-authored issue comments. Until Claude acknowledges, delivery to Claude cannot be certified.

Future research format: JSON array with `title`, `url` (direct HTTPS primary source), `published` (ISO date), `evidence`, `limitation`. Verify sources independently before adding them.

Safety: no production changes, no merge, no user tracking, no paid model calls, no secrets. Claude should work on a separate draft PR and seek owner approval.
