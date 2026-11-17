# Money Quest Content Intelligence, free MVP

Runs quarterly on 1 January, 1 April, 1 July, 1 October at 10:00 UTC, after merging the workflow to the default branch. Manual runs are also possible. Pull request runs validate only.

The script reads optional curated research/tiktok-content-signals.json. Format:
```json
[
  {
    "source": "google-trends",
    "topic": "saving",
    "observed_at": "2026-11-17",
    "evidence": "Human-verified observation with region and period",
    "url": "https://trends.google.com/trends/"
  }
]
```

Allowed sources: google-trends, search-console, tiktok-creative-center, tiktok-creator-search-insights, tiktok-analytics, manual-research. Only supply observations actually verified. Never commit private Search Console exports, child data, access tokens, or personal analytics. No TikTok search scraping, API calls, or trend claims without real data.

The free script generates 39 Romanian draft scripts as an evergreen fallback. Missing data is explicitly labelled, not fabricated. These are editorial hypotheses and are NOT personalized to current demand unless source records are provided. The output uses on-screen text and licensed instrumental music ONLY. No voice or ElevenLabs.

Each scheduled/manual run uploads the report and JSON and opens a GitHub Issue containing the report plus @claude comment. This is a handoff queue, NOT proof that Claude automatically receives or executes comments. The Claude coordination mechanism must be independently verified. Existing TikTok scripts, Buffer workflows, videos and publication schedules are untouched. Claude and the owner must approve any change.

Use: `python3 scripts/quarterly-content-intelligence.py`. No paid AI calls, publishing, or deployment.
