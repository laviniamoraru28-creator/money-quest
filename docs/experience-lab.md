# Money Quest Innovation & Child Experience Lab

Two complementary read-only report generators. They do not duplicate the existing Imagination & Innovation Scout (external research), Engagement Designer (reward vocabulary), or Child Journey Detective (generic UX flow scan).

## Responsibilities
- **Innovation & UX Designer**: prioritize age-specific interface design, learning transfer, accessible interaction and proposals with explicit evidence confidence.
- **Child Experience Lab**: six simulated user profiles (ages 6, 8, 10, 13, AAC/access needs and low persistence), with repeatable test protocols.

## Execution
`python3 scripts/experience_lab.py`
`python3 -m unittest discover -s scripts -p 'test_experience_lab.py' -v`

GitHub Actions runs Wednesday at 09:17 UTC, manually, or on PR changes. Reports are JSON artifacts, not code edits. No paid APIs, analytics, personal data, live-site browser testing, or automatic publication.

## Critical limitation
These are **source-level heuristic review agents**, not actual child simulations in a browser. They cannot determine enjoyment, motivation, or learning outcomes. Future phase: Playwright scripted journeys against staging, screenshots, accessible-name assertions, six profile-specific test scripts, and consent-based real-child usability research. Do not describe those capabilities as implemented.

## Review and approval
Check each source reference and reproduce the issue before accepting a finding. Have the owner approve any proposed implementation. Create a separate draft PR, run existing CI and accessibility checks, then request approval before merge or deployment. Coordination Hub registration can follow after reviewing existing workflow responsibilities.
