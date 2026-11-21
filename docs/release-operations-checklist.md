# Money Quest release and operations controls

## Private dashboard

GitHub Actions workflow `Private Operations Dashboard` generates a read-only report every Monday at 08:15 UTC after approved merge. Manual runs supported. Download the `private-operations-dashboard` artifact from the Actions run. This is **not** a public Next.js route and has no login surface or visitor data.

The report shows GitHub agent workflow status, open PRs and agent handoff Issues. A successful draft PR run does not imply scheduled automation is active. Google Search Console, TikTok, Stripe, OpenAI API spending and Namecheap production version are explicitly marked unconnected. Do not infer values from GitHub alone. GitHub artifacts are subject to repository access controls; confirm repository visibility and Actions permissions before putting sensitive data in artifacts.

## Pre-release checklist

1. Freeze the set of approved PRs; avoid merging unrelated branches or duplicating agent workflows.
2. Confirm Claude handoff independently. An `@claude` bot comment does not prove a Claude session was started.
3. Run lint, typecheck, unit tests, production build, Playwright journeys, WCAG checks and multilingual smoke tests.
4. Verify navigation, Back/Next progression, Explorer/Builder/Strategist content, certificates, audio controls and mobile layouts.
5. Keep contributions disabled until Stripe live and HMRC/compliance review; keep AI assistant disabled until privacy/ZDR, safe content controls, per-user quotas and hard server-side £5/month cap are validated.
6. Back up Namecheap application, configuration and previous deployment artifact. Never put secrets in GitHub artifacts.
7. Record release commit SHA and package hash, then deploy only with explicit approval.
8. Verify homepage, all nine languages, lesson flow, AI and contribution flags, HTTP health, errors and mobile accessibility.
9. If a critical regression occurs, stop changes, restore the previous verified deployment and confirm recovery.

## After release

Review GitHub CI, error reports and actual site behavior. Connect analytics only through approved, data-minimized sources; do not collect identifiable child activity. The private dashboard does not modify production and does not trigger merges or deployments.

## Scope

This PR deliberately avoids a new publicly reachable `/admin` page. A browser-based private dashboard requires authenticated access, authorization tests, CSRF protection and safe handling of secrets. It should be a separately reviewed project, not an unprotected route.
