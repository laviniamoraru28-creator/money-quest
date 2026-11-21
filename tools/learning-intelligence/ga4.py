#!/usr/bin/env python3
"""Read-only, aggregate Google Analytics 4 report. No user-level dimensions."""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
from urllib.request import Request, urlopen

SCOPE = "https://www.googleapis.com/auth/analytics.readonly"
METRICS = ["sessions", "screenPageViews", "totalUsers"]
DIMENSION = "pagePath"

def fetch_report(credentials_json, property_id, days=28):
    if not property_id.isdecimal():
        raise ValueError("GA4_PROPERTY_ID must be numeric")
    from google.oauth2 import service_account
    from google.auth.transport.requests import Request as AuthRequest
    credentials = service_account.Credentials.from_service_account_info(
        json.loads(credentials_json), scopes=[SCOPE])
    credentials.refresh(AuthRequest())
    payload = {
        "dateRanges": [{"startDate": f"{days}daysAgo", "endDate": "yesterday"}],
        "dimensions": [{"name": DIMENSION}],
        "metrics": [{"name": metric} for metric in METRICS],
        "limit": 1000,
    }
    req = Request(
        f"https://analyticsdata.googleapis.com/v1beta/properties/{property_id}:runReport",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": "Bearer " + credentials.token, "Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(req, timeout=30) as response:
        data = json.load(response)
    results = []
    for row in data.get("rows", []):
        path = row["dimensionValues"][0]["value"]
        metrics = [int(float(v["value"])) for v in row["metricValues"]]
        results.append({"page_path": path, **dict(zip(METRICS, metrics))})
    return {"source": "Google Analytics Data API", "property_id": property_id,
            "days": days, "dimension": DIMENSION, "rows": results,
            "generated_utc": dt.datetime.now(dt.timezone.utc).isoformat()}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    credentials = os.getenv("GA4_SERVICE_ACCOUNT_JSON")
    property_id = os.getenv("GA4_PROPERTY_ID", "")
    if not credentials or not property_id:
        raise SystemExit("GA4 not configured; no data fetched.")
    report = fetch_report(credentials, property_id)
    path = Path(args.output)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"GA4 fetched {len(report['rows'])} aggregate page rows.")

if __name__ == "__main__":
    main()
