# Money Quest Quality & Improvement System

## Scope
Read-only, evidence-first coordination across education, accessibility, technology, privacy, localisation, content, research, growth and child experience. It complements the existing 40-agent registry; it does not certify the agents as running.

## Workflow
1. Agents and human reviewers submit non-personal findings with source, source_pointer, code, domain, severity and summary.
2. Intake rejects malformed records and explicit child identity fields.
3. Duplicate issues at the same source pointer, code and domain are combined, with the highest severity preserved.
4. Candidate findings are **not** defects until reviewed. Confirmed and resolved statuses require review_evidence.
5. Critical confirmed findings become release blockers for human release review. This script does not change GitHub branch protection or automatically prevent deployment.
6. A designated human reviews cross-department conflicts and approves releases.

## Priorities
P0 critical, P1 high, P2 medium, P3 low. Severity is input from reviewers, not inferred by AI. Impact and effort default to unknown rather than invented scores.

## Initial education pilot
Start with Explorer Money Quest: check objective, activity, assessment, feedback, age appropriateness, non-reader path, audio, keyboard and reduced motion. The existing curriculum audit emits review candidates; it must be mapped and reviewed before adding to quality-findings.json. Extend to Builder, Strategist, Entrepreneur Quest, Leadership Quest and AI Quest after pilot evidence.

## Operational boundaries
No child accounts, child-level analytics, PII, automated publication, merging, payments changes or claims of demonstrated learning. Do not ingest raw visitor text or AI assistant conversations. The registry's operational_status remains unverified until independently evidenced. Use CI artifacts as review inputs, not proof of pedagogical effectiveness.

## Run
`python3 -m unittest scripts.test_quality_improvement -v`
`python3 -m scripts.quality_improvement --output artifacts/quality/quality-improvement-report.json`
