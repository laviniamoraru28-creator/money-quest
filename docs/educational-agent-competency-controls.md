# Educational specialist competency controls

## Scope and truthful capability
This project currently has structured, read-only educational review scripts. The five profiles in `scripts/educational_competency_gates.py` are review roles, **not five independently running, professionally qualified AI experts**. The workflow does not invoke an LLM, fetch or fact-check scientific papers, verify reviewer credentials, assess children, change lessons, or publish articles.

## Role-specific checks
- Educational Psychology Specialist: cognitive load, motivation, emotional safety, accessibility, transfer, progression. Never diagnoses a child.
- Financial Education Specialist: concept accuracy, financial risk, real-life decisions. Check calculations and avoid individual financial advice.
- Entrepreneurship Education Specialist: problem validation, costs and value, ethical decisions. Distinguish sales, cost and profit.
- Leadership Education Specialist: collaboration, conflict resolution and inclusive participation. Do not score eye contact or speaking volume.
- AI Literacy Specialist: AI limitations, privacy/safety and critical evaluation. Do not use children's personal data.

Learning Architect retains instructional design ownership. Inclusive Experience Guardian retains independent accessibility responsibility. These are not silently replaced by the five profiles.

## Decision gates
The new checker requires a complete curriculum record, domain and psychology rubrics, a non-placeholder public HTTPS source with a meaningful claim and limitation, a recorded independent source review, a human reviewer role and explicit human approval. Unresolved concerns block the proposal. Even a fully approved record **never** enables automatic publication. Source URLs and reviewer attestations are only structurally checked; their truth and credentials are **not independently verified**.

## Reproducible regression
Run `python3 -m unittest scripts.test_educational_competency_gates -v` and `python3 scripts/educational_competency_gates.py`. The benchmark contains eight synthetic cases: one complete attestation and seven deliberately incomplete or concerning examples. Passing this benchmark measures gate behaviour, **not educational expertise**. The CI workflow uploads `competency-gates.json`.

## What is needed before calling these expert agents
1. Curate versioned primary sources with precise claims, limitations and access dates; independently check URLs and relevance.
2. Develop 20 to 30 human-scored, representative lesson cases across three age bands and all subject domains, including difficult negative examples.
3. Have qualified human reviewers score the cases and resolve disagreements; record their credentials and conflicts of interest outside the automated report.
4. Compare agent recommendations with human reference decisions, including false positives and misses, and define acceptable thresholds before any AI-assisted proposal workflow.
5. Only then consider connecting an LLM with retrieval, bounded permissions, a privacy impact review and a strict human-approval PR process.

## Operational boundaries
No child data, no production changes, no automatic curriculum edits, no claim of certification. Review findings are candidates until validated.
