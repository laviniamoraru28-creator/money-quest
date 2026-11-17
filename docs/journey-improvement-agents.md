# Journey Detective, Experiment Designer and Improvement Engine

This is a free, read-only MVP. It reuses existing source code and GitHub Actions, without tracking children, collecting personal data, or calling paid APIs.

- Child Journey Detective reviews UI disabled actions and local progress persistence. It cannot measure abandonment or user clicks without approved, privacy-preserving aggregate analytics.
- Experiment Designer generates hypotheses and test plans for existing learning journeys. It does not run experiments on children or claim causal effects.
- Improvement Engine ranks candidates using impact x confidence / effort. These scores are subjective planning aids, not measured business impact.

Run: `python3 scripts/journey-improvement-agents.py`.

Reports: `journey-improvement-report.md` and `journey-improvement-findings.json`. Every scheduled or manually dispatched workflow run opens a GitHub Issue with the complete report and adds a separate `@claude` comment. PR runs upload artifacts but do not contact Claude, preventing duplicate AI requests.

The workflow becomes scheduled only after a reviewed merge to the default branch. Claude integration must acknowledge bot-authored issue comments before handoff is considered verified. Claude may propose a separate draft PR for confirmed issues but must not merge or deploy.

Before adding analytics or A/B tests, obtain a child privacy impact assessment and an approved consent, retention and data-minimization design. No live experiment is enabled by this PR.
