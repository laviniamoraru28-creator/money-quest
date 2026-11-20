# Money Quest: competency framework for all registered agents

This framework covers **every agent currently recorded in** `governance/agent-registry.json`. The registry is the source of truth; no agent is invented. `scripts/agent_competency_framework.py` generates a role profile and an evidence assessment for each entry, and `scripts/test_agent_competency_framework.py` tests conservative defaults.

## What is implemented
- Department-specific competency dimensions for education, child experience, technology, quality/security, marketing, content/community, strategy, and visual design.
- Higher review priority for safety, privacy, AI cost, release readiness, translation, inclusion, pedagogy, SEO and educational content.
- A common minimum evidence contract: reproducible artifact, explicit scope and limitations, human-reviewed sample, at least five scored cases, false-positive count and missed-issue count.
- Explicit prohibitions on automatic publication, merges, deployment, payment changes, AI spending cap changes, external messages and collection of children's personal data.
- Machine-readable read-only report, tests, and GitHub Actions artifact.

## What is NOT implemented
No model fine-tuning, RAG, domain-specific expert knowledge base, verified citations, professional credential assessment, autonomous agent runtime or actual human-scored benchmark. Registry entries remain unverified unless independently evidenced. An agent's title is not a professional qualification. A structurally complete evidence record does not prove competence.

## Operational adoption plan
1. **Safety-critical**: independently test Security Sentinel, Privacy Guardian, AI Cost Controller and Release Guardian against real safe test cases and enforce server-side controls in the application, not only in agent reports.
2. **Education and localisation**: qualified educators assess age progression, financial accuracy, SEND, translations and AI literacy on representative real lessons. Keep child data out of test fixtures.
3. **Content and growth**: fact-check article references, test SEO metadata and accessibility, require provenance for analytics claims and avoid invented search volumes.
4. **Experience and engineering**: benchmark reproducible browser journeys, keyboard and screen-reader support, performance budgets and error reproduction.
5. **Strategy and reporting**: measure source traceability, duplicate findings, actionable recommendations and false alarms.

For each agent, build a scored reference set of at least 20 to 30 cases before asserting reliable competence. A qualified reviewer must confirm correct decisions and document disagreement. The five-case structural threshold in the script is a minimal guard against empty evidence, not a sufficient validation benchmark.

## Verification
```bash
python3 -m unittest scripts.test_agent_registry scripts.test_agent_competency_framework -v
python3 scripts/agent_competency_framework.py --output artifacts/agents/competency-audit.json
```

No code is merged or deployed by this script. Do not infer real-world impact from successful governance tests.
