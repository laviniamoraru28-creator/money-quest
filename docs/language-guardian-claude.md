# Language Guardian: Claude handoff

The structural checker runs on changes to `messages/**`, weekly on the default branch, and by manual dispatch once this workflow is merged. Its report is an Actions artifact.

## Claude handoff

The manual workflow input `send_to_claude=true` creates a GitHub issue containing an `@claude` request and a link to the audit report. **This is not proof that Claude will receive or execute it.** It requires an independently installed and authorized Claude GitHub integration that listens to issue mentions. Without that integration, the issue is a human-readable handoff only.

Before enabling the handoff, verify the Claude GitHub App is installed for this repository, authorized for issue comments and pull requests, and configured to react to `@claude` mentions. Test with a non-production issue. Never place API keys in issues, workflow logs or PR comments.

The handoff is opt-in to avoid unrequested issues and AI usage. It does not use an Anthropic API key or incur AI charges by itself. The external Claude integration may have usage or billing implications.

## Scope and safety

The automated script checks JSON keys, empty translations and interpolation placeholders. It cannot assess native fluency, meaning, age suitability, images or audio. Claude should propose localized changes on a separate branch and draft PR, preserve source meaning and placeholders, run `npm run check:multilingual`, and never merge or deploy automatically.

The existing multilingual release checker remains the authority for release coverage; Language Guardian is supplementary.

## Integration acceptance test

1. Confirm the Claude GitHub App is installed and has access to this repository.
2. Create a disposable test issue manually, with no sensitive information.
3. From a human GitHub account, comment `@claude Please acknowledge this issue without changing files.` and confirm a real Claude response.
4. Only then test the workflow's optional `send_to_claude` dispatch on a non-production issue. GitHub Actions comments are authored by `github-actions[bot]`; some integrations ignore bot-originated events to prevent automation loops.
5. If bot comments are ignored, use a supported Claude integration trigger instead of adding a paid API key or bypassing bot protections.
6. Confirm the response links to the audit, uses a separate branch and draft PR, and never merges or deploys.
7. Keep the workflow handoff disabled unless these tests pass. The scheduled and pull-request audits never invoke Claude.

**Status:** No Claude acknowledgement has been observed or verified. Passing structural CI is not proof of Claude connectivity.
