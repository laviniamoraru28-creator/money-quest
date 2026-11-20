# Agent coordination, evaluation and release policy

## Single source of truth
`governance/agent-registry.json` lists all named agents. `scripts/agent_competency_framework.py` produces department profiles. `scripts/agent_scorecards.py` produces a scorecard for every registry entry. No script creates autonomous workers or proves a person-level qualification.

## Practical review cycle
1. **Intake:** a source-grounded finding identifies the exact page, lesson, code path, or report, its date and the impact on children or adults. Never submit child personal data.
2. **Triage:** Security Sentinel, Privacy Guardian, AI Cost Controller and Release Guardian take priority when safety, data handling, API costs or deployment may be affected.
3. **Specialist review:** Education & Research evaluates age suitability and curriculum; Child Experience evaluates accessibility and interaction; Technology evaluates feasibility and reliability; Content & Community evaluates factual and editorial claims; Growth & Marketing evaluates source-grounded discoverability.
4. **Cross-check:** a second, relevant role challenges assumptions and checks false positives. Example: a reward redesign from Engagement Designer needs Educational Psychology and Inclusive Experience Guardian review.
5. **Proposal:** include the problem, source, affected age bands and languages, options, expected benefit, risks, cost, acceptance criteria, tests and rollback plan.
6. **Human approval:** product owner decides whether to implement. No agent may automatically publish, merge, deploy, change payments or increase AI spending.
7. **Validation:** tests and evidence are linked to a PR. Mark status verified only after checking the actual execution and its output.

## Measurable acceptance criteria
- **Security and privacy:** zero unauthorised disclosure or unsafe change in the test suite; manual review of any critical issue.
- **Educational:** age-specific learning goals and checks, qualified human scoring, accessible alternatives and clear limitations. No claims of improved learning without learner evidence.
- **Language:** record/key parity is necessary but not sufficient; human language review and UI checks are required.
- **SEO/content:** no fabricated studies or search volume; metadata and URLs validated against actual site output.
- **Engineering:** reproduce defects, run regression and browser tests, inspect CI and rollback readiness.
- **Analytics/strategy:** use dated, attributable source data; missing metrics remain null.

## Evidence format for each agent
Store a reviewed evidence record outside the production site with: `artifact_path`, `human_reviewed`, `tested_cases`, `false_positives`, `missed_issues`, `scope_limits_documented`. Use only non-sensitive test fixtures. A structurally complete record is a candidate for validation, not proof of expertise.

## Remaining work requiring genuine evidence
Create representative test sets for all 40 roles, run their actual implementations, capture reproducible outputs, obtain qualified reviews for educational and child-safety cases, and measure precision/recall against a reference set. Add external source verification only with appropriate credentials, permissions and budget. Do not claim this work is already completed.

## Commands
```bash
python3 -m unittest scripts.test_agent_registry scripts.test_agent_competency_framework scripts.test_agent_scorecards -v
python3 -m scripts.agent_competency_framework
python3 -m scripts.agent_scorecards
```
