# Money Quest agent operational certification

The dashboard has four evidence-gated levels: configured, executed, validated, effective. These are *reporting labels*, not proof of independent AI competence.

- Configured: registered role only. All agents start here until evidence is supplied.
- Executed: a successful, dated run within 45 days, implementation revision and reproducible artifact link.
- Validated: execution plus at least five benchmark cases, zero false positives/missed issues in the submitted benchmark, dated human review, scope limits and linked benchmark. This threshold is a minimum screening gate, not statistical proof.
- Effective: validated plus dated, reviewed before/after metric with a measured improvement and supporting link. Correlation alone does not establish causality.

Run weekly on Monday and on PRs. Inspect the GitHub Actions artifact `agent-operational-health`. The report does not invoke agents, scrape their run history, verify external URLs or validate reviewer qualifications. Evidence records are intentionally empty. Reviewers must inspect actual logs, tests and domain-specific benchmark fixtures before adding any record. Never put child personal data in evidence.

For every role, build at least one controlled execution and five relevant tests, including negative cases. Education and child-safety outputs require appropriately qualified human review. Record false positives and missed issues. Compare baseline and post-change metrics with consistent sampling; document confounders. Repeat monthly, investigate stale runs, and revoke certification when evidence expires.

No auto-merge, auto-deploy, public publishing, financial changes or access to children's personal data is granted. Owner approval remains required.

Local commands:
```bash
python3 -m unittest scripts.test_agent_operational_health -v
python3 -m scripts.agent_operational_health
```
