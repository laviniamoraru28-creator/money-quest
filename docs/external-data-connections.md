# Money Quest external data connections

## Verified 2026-11-21

- Google Search Console property `sc-domain:moneyquesteducation.com` was queried successfully via the **ChatGPT Windsor.ai connection** (14–19 Nov: 12 clicks, 180 impressions). This **does not grant GitHub Actions access**.
- `.github/workflows/learning-intelligence.yml` and `tools/learning-intelligence/search_console.py` provide an optional **read-only** Google Search Console ingestion route. The workflow runs without GSC data if credentials are absent. A green CI result is not proof that GSC was fetched.
- GA4, Google Trends, TikTok, YouTube and research feeds have **not** been verified as connected to GitHub Actions.

## Priority and ownership

| Source | Consumers | Required authentication | GitHub integration status |
| --- | --- | --- | --- |
| Google Search Console | Learning Intelligence, SEO research | Read-only service account with property access | Code available; credential and live scheduled-run evidence pending |
| Google Analytics 4 | Business Analyst, Growth Intelligence | GA4 property + read-only API access | Not implemented or verified |
| Google Trends | Future Skills Radar, Learning Intelligence | Review permitted public data access and terms | Not implemented or verified |
| TikTok / YouTube | Social Growth Scientist, content research | Authorized analytics APIs or approved exports | Not implemented or verified |
| Educational research | Research-to-Lesson, SEND specialist | Public primary sources with dated provenance | Source-specific verification pending |
| GitHub | Engineering and quality roles | Built-in Actions permissions | Some read-only workflows already execute; check artifacts per agent |

## Enable Search Console on GitHub Actions

1. In Google Cloud, create a dedicated service account for **read-only Search Console reporting** and enable the Search Console API.
2. In Search Console, add that service account email as a restricted user of the domain property.
3. In GitHub repository Settings > Secrets and variables > Actions, create secret `GSC_SERVICE_ACCOUNT_JSON` containing the complete JSON credentials. Never commit or paste the private key in a chat.
4. In Actions variables, set `GSC_SITE_URL` to `sc-domain:moneyquesteducation.com`.
5. Run the **Learning Intelligence (research only)** workflow manually from the default branch. Confirm the log explicitly says `Search Console fetched` and that the report marks the source as `provided`. A workflow success without these statements means it ran in offline mode.
6. Inspect the report artifact for data date range, topic coverage and source limitations before labeling the connector operational.

## Security and data governance

- Keep credentials out of pull-request workflows. Do not send raw child data or personal identifiers to marketing providers.
- Do not reuse a personal Google login or broad editor permission for automated reports.
- Store dated, aggregate outputs with source provenance and an explicit `not_connected` state when data is absent.
- Agents may propose recommendations, but must not autonomously publish content, merge code or change production.
- GSC measures search visibility for this website, not overall market demand; GA4 measures site behavior, not children's learning outcomes.
