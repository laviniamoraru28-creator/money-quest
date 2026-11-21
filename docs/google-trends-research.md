# Google Trends for Money Quest

Status: **manual CSV importer only**. This repository has no approved Google Trends API credentials. The CI workflow validates the parser but does not fetch live Trends data.

Google's official Trends API is alpha / application-based as of November 2026. See https://developers.google.com/search/apis/trends and https://support.google.com/trends/answer/4365538 .

## Reproducible research workflow
1. In https://trends.google.com/trends/explore compare a small set of educational search terms in the same chart, with a consistent geography (e.g. United Kingdom) and date range.
2. Export the interest-over-time chart as CSV. Record the selected terms, country, search type, date window and export date in research notes.
3. Run `python3 tools/learning-intelligence/trends_csv.py --csv path/to/export.csv --output path/to/report.json` locally.
4. Review output and compare only series from the **same** export. Google Trends indices represent relative interest, not counts. Low volume may be suppressed.
5. Compare directionally with site-specific Search Console evidence; do not combine the two as if they shared units. No automatic course creation or publication.

## Next integration gate
Apply for the official API alpha if needed; review access, quotas and terms before implementing any authenticated connector. Avoid undocumented endpoints, scraping and paid providers until the cost and reliability are justified.
