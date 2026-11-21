# Money Quest agent operations: evidence and next actions

Updated 2026-11-21. This document is a handover and verification plan, not a claim that 40 agents are autonomous.

## What has been demonstrated

- The registry lists 40 agents in eight departments. All currently declare `operational_status: unverified`. A registration is not proof of execution.
- The registered-agent readiness workflow checks implementation paths and Python syntax. It does not run or evaluate all agents.
- The operational-health workflow uses four evidence levels: configured, executed, validated and effective. Its evidence file is not independently authenticated by that workflow.
- Google Search Console: an owner-observed manually dispatched Learning Intelligence run fetched 58 aggregated search-query rows for 2026-10-22 to 2026-11-18.
- Google Analytics 4: owner-observed manual run of `GA4 aggregate research (read only)` returned `GA4 fetched 0 aggregate page rows` for property 565403700. This verifies API access, **not** website tracking or meaningful visitor data.
- Google Trends: offline CSV importer is on main. The official API application is pending; no live Trends integration.
- No child-facing analytics tag, visitor tracking, autonomous merge, publishing or deployment is authorized by this document.

## Evidence required for each agent

1. **Configured**: implementation path, workflow name, schedule and declared inputs are documented.
2. **Executed**: link to a recent successful workflow run and a downloadable, dated output artifact; confirm that the job actually ran rather than skipping optional collection.
3. **Validated**: independent review of output against at least five representative cases, including limitations, false positives and missed issues.
4. **Effective**: a reviewed before/after metric demonstrates useful improvement, with attribution caveats.

Capture for every agent: registry ID, responsible workflow, last run URL and UTC timestamp, run result, artifact URL, input source and freshness, reviewer, validation evidence, blockers and next action. Mark missing evidence as **unverified**, not success.

## Priority order

1. Link the 40 registry IDs to actual GitHub Actions workflows and output artifacts. Identify agents sharing a script or workflow so they are not counted as independent executions.
2. Verify the five high-value functions first: Learning Intelligence; educational and SEND quality; child experience and accessibility; privacy/security; engineering quality. For each, inspect a real report and reproduce at least one finding.
3. Investigate the `Listen` focus failure seen in PR #120's website-quality run. Reproduce on current main before attributing it to documentation changes.
4. Keep GA4 visitor collection disabled until appropriate UK consent/privacy review. Do not infer child learning outcomes from page views.
5. Use approved Google Trends CSV exports until API access is granted. Keep TikTok/YouTube and educational-research feeds marked unverified until actual authorized data is demonstrated.
6. Coordination Hub should consolidate dated findings, de-duplicate proposals and route decisions to the owner. Changes go through isolated PRs and CI; no automatic production deployment.

## Release gates

- No agent can be called operational solely because a file exists or a CI test is green.
- No evidence file should be upgraded to `executed`, `validated` or `effective` without source links and independent checks.
- Do not expose API keys, child data, user identifiers or raw analytics in artifacts.
- Any agent-driven code change needs reproducible tests, accessibility and multilingual checks where applicable, and human approval before merge.
