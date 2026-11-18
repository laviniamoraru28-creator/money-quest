#!/usr/bin/env python3
"""Read-only Money Quest growth-agent MVP. No visitor tracking or paid APIs."""
import json
import re
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "growth-agents"
OUT.mkdir(parents=True, exist_ok=True)
NOW = datetime.now(timezone.utc).isoformat()
def files(glob):
    return [p for p in ROOT.glob(glob) if p.is_file() and not any(x in p.parts for x in ("node_modules", ".next", ".git"))]
def read(p):
    try: return p.read_text(encoding="utf-8")
    except (UnicodeError, OSError): return ""
def finding(key, title, evidence, action, priority="medium"):
    return dict(id=key,title=title,evidence=evidence,recommended_action=action,priority=priority,status="candidate_requires_validation")
def report(agent, findings, limitations):
    data=dict(schema_version=1,agent=agent,generated_at=NOW,mode="read_only",findings=findings,limitations=limitations,automatic_claude_activation_verified=False)
    (OUT / (agent + ".json")).write_text(json.dumps(data,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    return data

pages=files("src/app/**/page.tsx")+files("src/app/**/page.ts")
layout=files("src/app/**/layout.tsx")
page_text="\n".join(read(p) for p in pages)
seo=[]
if not any("sitemap" in p.name for p in files("src/app/**/sitemap.*")) and not files("public/sitemap.xml"):
    seo.append(finding("seo-sitemap-review","Check sitemap availability","No sitemap file found in scanned conventional paths","Verify dynamic sitemap routes and production sitemap before proposing a fix"))
if not any("robots" in p.name for p in files("src/app/**/robots.*")) and not files("public/robots.txt"):
    seo.append(finding("seo-robots-review","Check robots configuration","No robots file found in scanned conventional paths","Verify deployed robots.txt and route generation"))
if not any("metadata" in read(p) or "generateMetadata" in read(p) for p in layout+pages):
    seo.append(finding("seo-metadata-review","Review page metadata","No metadata declarations found in scanned app layouts/pages","Check other metadata sources and per-locale SEO"))
report("seo-technical-guardian",seo,["Static source scan only; no live crawl, Search Console, indexing or Core Web Vitals data."])
search=[]
report("search-opportunity-hunter",search,["No verified Google Search Console or keyword dataset connected. Agent cannot claim search demand or rankings. Connect authorized aggregated GSC export when Work integration is ready."])
first=[]
if not pages:
    first.append(finding("first-visit-routes","Inspect initial visitor journey","No Next.js app router pages found in conventional path","Locate actual router and add Playwright journey coverage"))
else:
    first.append(finding("first-visit-manual-review","Validate new visitor path",f"Found {len(pages)} app-router pages; static code cannot establish real usability","Run accessible first-visit journey tests and moderated parent/teacher review","low"))
report("first-visit-experience-agent",first,["No simulated child behaviour or real user analytics. Findings are test candidates, not usability conclusions."])
report("growth-intelligence-director",[],["No consent-appropriate aggregate traffic or campaign dataset connected. Do not infer visitors, conversion or retention."])
combined=seo+first
rank={"critical":0,"high":1,"medium":2,"low":3}
ordered=sorted(combined,key=lambda x:(rank.get(x["priority"],4),x["id"]))
report("opportunity-prioritizer",ordered,["Only ranks locally evidenced candidate checks; does not approve implementation, merge or deployment."])
print(json.dumps({"agents":5,"candidate_findings":len(combined),"output":str(OUT.relative_to(ROOT))}))
