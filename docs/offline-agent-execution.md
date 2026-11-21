# Offline agent execution audit

This is a repository-only pilot. It runs shared Python implementations without Search Console, analytics, advertising APIs, Stripe, or child data. It does not deploy or change website content.

Run `python3 -m unittest scripts.test_offline_agent_runner -v`, then `python3 -m scripts.offline_agent_runner`. The GitHub Actions workflow also runs every Monday and on manual dispatch. Download the `offline-agent-execution` artifact to inspect command output and status.

Classification: `eligible_for_offline_execution` means a local script exists and is on the reviewed allowlist; `awaiting_external_data` means the role depends on authorized datasets; `missing_implementation` means the declared path is absent; `manual_review_required` means the script is not approved for this runner.

Multiple named roles may share one script. One successful process is NOT evidence that each named role executed independently. Outputs are candidate findings and require human inspection. The separate certification dashboard intentionally remains at configured until reproducible, role-specific run evidence and human review are supplied. A nonzero exit is retained as a failure, not silently ignored.

Do not add secrets or live child analytics to the workflow. Do not automatically merge, deploy, publish, or mark agents as competent.
