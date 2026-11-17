# Learning Intelligence MVP

This is a separate, read-only research workflow. It does not change lessons, deploy, merge PRs, collect visitor personal data, or call a paid AI API.

## Sources
- Verified existing curriculum: `src/content/nav-menu-structure.ts` (navigation entries, not a complete count of lessons).
- Optional Google Search Console export: Performance > Search results > Queries > Export CSV. Run locally: `python3 tools/learning-intelligence/analyze.py --search-console-csv /path/to/Queries.csv`. Do not commit raw exports. The workflow does not have access to Google Search Console credentials.
- Google Trends and third-party market volumes are **not** integrated. No invented search counts or demographics.

## Run
`python3 -m unittest discover -s tools/learning-intelligence -p 'test_*.py'`
`python3 tools/learning-intelligence/analyze.py`

The workflow runs weekly on the default branch **only if this PR is merged in the future**. Until then, it can be manually dispatched on this feature branch. Output: artifact `learning-intelligence-evidence` with JSON and Markdown.

## Interpretation
Search Console impressions measure appearances of this site for queries, not all Google searches. A missing export is an explicit no-data result. Keyword categories are provisional and require human review. Educational need, age groups, and new course demand cannot be inferred reliably from keywords alone. Before any course decision, compare with existing lesson content and evidence from educational research.

## Next phase (requires separate authorization)
Connect a read-only Search Console API credential with least privilege; add source-dated research evidence, feedback consent, multilingual topic taxonomy and curriculum coverage mapping. Never commit tokens or raw personal data.
