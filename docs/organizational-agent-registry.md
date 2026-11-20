# Money Quest Organizational Agent Registry

**Source of truth:** [governance/agent-registry.json](../governance/agent-registry.json).

This register records **35 named roles**: 30 enumerated in the seven-group coordination document and five pilot roles from PR #98 and PR #99. The older coordination heading says **26**, which contradicts its actual enumeration. Do not silently change either source; this register records the discrepancy.

The coordination hub is listed separately as shared infrastructure, not an additional agent. Claude's human-directed development workflows are not counted as a new named agent. Deferred proposals are not counted as implemented agents.

## Fields
- `department`, `purpose`: accountable domain and expected value.
- `implementation.path`: documented code location; a path may be absent on main while a PR remains in review.
- `implementation.reference_pr`: historical implementation reference, **not** proof the PR is currently open, merged, or deployed.
- `declared_capability`: read-only/data-dependent or pilot, not proof of autonomous work.
- `operational_status`: defaults to `unverified`. Only mark `verified_running` after a dated, successful workflow execution and a reviewed useful artifact.
- `last_successful_run`: null until verified with GitHub Actions.
- `impact_metric`: null until evidence of meaningful outcomes exists.
- `owner`: final decision authority.

## Verification
```bash
python3 -m unittest scripts.test_agent_registry -v
python3 scripts/agent_registry.py --output artifacts/agent-registry/report.json
```
The script validates IDs, required fields, evidence requirements and whether documented paths exist **on the checked-out branch**. It does not call GitHub, claim a schedule is active, infer production deployment or edit files.

## Maintenance protocol
1. Update the JSON in a separate PR when adding, merging or retiring an agent.
2. Compare with `docs/agent-coordination.md`, active GitHub PRs and the existing coordination digest.
3. Review recent Actions run status and artifacts before marking a role operational.
4. Record overlap, cost and measurable value before approving a new standalone agent.
5. Keep security and release reviews independent; no automatic merge/deploy.

## Departments
Education & Research; Child Experience; Technology; Quality & Security; Growth & Marketing; Content & Community; Strategy & Operations; Visual Design.

## Known limitations
No current live execution evidence is embedded in the register. Many existing agents are static scanners or require external approved data. PR #98 and PR #99 contain pilots, not complete autonomous roles. A future authenticated read-only GitHub sync may add verified run timestamps without modifying agent code.

## Live GitHub Actions evidence (added 2026-11-20)
`scripts/agent_registry_live.py` reads GitHub Actions run history through the repository's read-only `GITHUB_TOKEN`. It writes a dated JSON snapshot and a Markdown report as GitHub Actions artifacts. It never commits status back to the registry, creates issues, merges, deploys, or uses paid APIs.

The workflow runs every Monday at 07:40 UTC **only after this workflow is merged into the default branch**, and can be manually dispatched from Actions when available. Pull request runs only validate offline tests and registry structure.

The snapshot distinguishes successful scheduled/manual workflow runs from PR test runs. A successful group workflow is **not** evidence that every named subagent completed meaningful work; all per-agent execution fields remain unverified until independently audited. PR #98 has no verified dedicated workflow mapping. API errors and missing workflows are explicitly recorded instead of treated as success.

View the artifact named `organizational-agent-registry` under the latest workflow run. It contains `report.json`, `live-evidence.json`, and `live-evidence.md` for scheduled or manual runs.
