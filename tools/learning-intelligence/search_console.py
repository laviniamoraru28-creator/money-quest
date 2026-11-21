#!/usr/bin/env python3
"""Optional read-only Search Console API export for Learning Intelligence.

Requires google-auth (not needed by the offline MVP).
Set GSC_SERVICE_ACCOUNT_JSON and GSC_SITE_URL in the environment.
Writes aggregated query metrics to a temporary CSV, not the repository.
"""
import argparse
import csv
import datetime as dt
import json
import os
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"

def fetch_rows(credentials_json, site_url, start_date, end_date, limit=1000):
    if not site_url or not (site_url.startswith("https://") or site_url.startswith("sc-domain:")):
        raise ValueError("GSC_SITE_URL must be a verified https:// property or sc-domain: property")
    try:
        from google.oauth2 import service_account
        from google.auth.transport.requests import Request as AuthRequest
    except ImportError as exc:
        raise RuntimeError("Install google-auth to use the optional Search Console connector") from exc
    info = json.loads(credentials_json)
    credentials = service_account.Credentials.from_service_account_info(info, scopes=[SCOPE])
    credentials.refresh(AuthRequest())
    endpoint = "https://www.googleapis.com/webmasters/v3/sites/" + quote(site_url, safe="") + "/searchAnalytics/query"
    body = json.dumps({"startDate": start_date, "endDate": end_date, "dimensions": ["query"], "rowLimit": limit, "dataState": "final"}).encode()
    request = Request(endpoint, data=body, headers={"Authorization": "Bearer " + credentials.token, "Content-Type": "application/json"}, method="POST")
    with urlopen(request, timeout=30) as response:
        data = json.load(response)
    return [{"query": row["keys"][0], "clicks": int(row["clicks"]), "impressions": int(row["impressions"])} for row in data.get("rows", []) if row.get("keys")]

def date_window(today=None):
    today = today or dt.date.today()
    end = today - dt.timedelta(days=3)  # GSC final data can lag
    start = end - dt.timedelta(days=27)
    return start.isoformat(), end.isoformat()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    credentials = os.environ.get("GSC_SERVICE_ACCOUNT_JSON")
    site = os.environ.get("GSC_SITE_URL")
    if not credentials or not site:
        raise SystemExit("Search Console not configured: set GSC_SERVICE_ACCOUNT_JSON and GSC_SITE_URL. No data fetched.")
    start, end = date_window()
    rows = fetch_rows(credentials, site, start, end)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["Query", "Clicks", "Impressions"])
        writer.writeheader()
        writer.writerows([{"Query": r["query"], "Clicks": r["clicks"], "Impressions": r["impressions"]} for r in rows])
    print(f"Search Console fetched {len(rows)} aggregated query rows for {start} to {end}.")
if __name__ == "__main__":
    main()
