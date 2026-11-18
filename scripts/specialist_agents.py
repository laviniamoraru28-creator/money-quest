#!/usr/bin/env python3
"""Read-only specialist agent suite. Candidate findings require independent validation."""
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "specialist-agents"
AGENTS = {
 "social-growth-scientist": "Social channel performance",
 "parent-teacher-community-scout": "Public parent and teacher needs",
 "partnership-discovery-agent": "Potential education partnerships",
 "engagement-designer": "Learning engagement review",
 "accessibility-personalization-agent": "Accessibility adaptation opportunities",
 "feedback-intelligence-agent": "Voluntary feedback themes",
 "learning-gap-detector": "Curriculum coverage review",
 "imagination-innovation-scout": "New learning technology proposals",
 "cultural-learning-adapter": "Cultural and currency consistency",
 "research-to-lesson-agent": "Research-backed activity proposals",
 "performance-optimizer": "Source-level performance review",
 "security-sentinel": "Source-level security review",
 "release-guardian": "Release readiness signals",
 "ai-cost-controller": "AI spend controls review",
 "privacy-guardian": "Data privacy review",
 "weekly-executive-reporter": "Cross-agent status summary",
}
NEEDS_DATA = {
 "social-growth-scientist": "Requires authorized aggregated social performance exports; do not infer views or engagement.",
 "parent-teacher-community-scout": "Requires approved public sources; do not scrape private groups or infer parent preferences.",
 "partnership-discovery-agent": "Requires verified public organization directory; no unsolicited outreach.",
 "feedback-intelligence-agent": "Requires anonymized opt-in feedback; no personal data collection.",
 "imagination-innovation-scout": "Requires vetted research sources before making claims about emerging technology.",
 "research-to-lesson-agent": "Requires reviewed primary research; no unverified educational claims.",
}
def source_files(pattern):
 return [p for p in ROOT.glob(pattern) if p.is_file() and not any(x in p.parts for x in (".git","node_modules",".next"))]
def read(path):
 try: return path.read_text(encoding="utf-8")
 except (OSError,UnicodeError): return ""
def item(key,evidence,action,priority="low"):
 return {"id":key,"evidence":evidence,"recommended_action":action,"priority":priority,"status":"review_candidate"}
def inspect():
 findings={k:[] for k in AGENTS}
 pages=source_files("src/app/**/*.tsx")
 components=source_files("src/components/**/*.tsx")
 code=pages+components
 raw="\n".join(read(p) for p in code)
 if not any(p.name in ("sitemap.ts","sitemap.js") for p in source_files("src/app/**/sitemap.*")) and not (ROOT/"public/sitemap.xml").exists():
  findings["performance-optimizer"].append(item("review-sitemap","No conventional static sitemap path found","Check dynamic routes and deployed sitemap before making changes"))
 if re.search(r"<img\\b",raw) and not re.search(r"loading=|next/image",raw):
  findings["performance-optimizer"].append(item("review-image-loading","Raw image tags found; optimization not established","Inspect rendered images, sizes and lazy loading"))
 if re.search(r"dangerouslySetInnerHTML",raw):
  findings["security-sentinel"].append(item("review-html-injection","dangerouslySetInnerHTML appears in source","Verify each value is sanitized or constant before proposing changes","medium"))
 if re.search(r"localStorage",raw):
  findings["privacy-guardian"].append(item("review-browser-storage","localStorage is referenced in client code","Review storage contents for personal data and retention; do not read user data"))
 if not any("axe" in p.name.lower() for p in source_files("tests/**/*")) and not any("axe" in read(p).lower() for p in source_files("tests/**/*.ts")):
  findings["accessibility-personalization-agent"].append(item("review-axe-coverage","No axe test detected under tests/","Check all existing test locations before recommending additional accessibility coverage"))
 if not (ROOT/".github/workflows/website-quality.yml").exists():
  findings["release-guardian"].append(item("review-release-ci","Website quality workflow not found","Confirm release gating and CI"))
 if (ROOT/"package.json").exists():
  try:
   package=json.loads(read(ROOT/"package.json"))
   if "test:unit" not in package.get("scripts",{}):
    findings["release-guardian"].append(item("review-unit-tests","No test:unit script in package.json","Verify release test suite"))
  except json.JSONDecodeError:
   findings["release-guardian"].append(item("review-package","package.json cannot be parsed","Repair invalid JSON","high"))
 locale_paths=source_files("messages/*.json")
 if locale_paths:
  keys={}
  for p in locale_paths:
   try: keys[p.stem]=set(json.loads(read(p)).keys())
   except json.JSONDecodeError: findings["cultural-learning-adapter"].append(item("locale-invalid-"+p.stem,p.name+" invalid JSON","Validate translation file","high"))
  if keys:
   common=set.intersection(*keys.values())
   for lang,ks in keys.items():
    if ks-common: pass
    missing=set.union(*keys.values())-ks
    if missing: findings["cultural-learning-adapter"].append(item("locale-top-level-"+lang,f"{lang}: {len(missing)} missing top-level keys","Validate nested locale structure and intentional differences"))
 if re.search(r"\bAI\b|assistant",raw,re.I):
  findings["ai-cost-controller"].append(item("review-ai-budget","AI/assistant terms appear in UI code","Inspect server-side API budget caps when assistant is merged; UI text is not evidence of spend"))
 if re.search(r"curriculum|lesson|quest",raw,re.I):
  findings["learning-gap-detector"].append(item("review-curriculum-map","Educational routes or components found","Compare learning objectives with approved age-band curriculum and evidence"))
 if re.search(r"reward|coin|progress",raw,re.I):
  findings["engagement-designer"].append(item("review-reward-loop","Progress or reward language found","Review age-appropriate feedback and avoid compulsive engagement"))
 return findings
def generate():
 OUT.mkdir(parents=True,exist_ok=True)
 found=inspect()
 stamp=datetime.now(timezone.utc).isoformat()
 counts={}
 for agent,description in AGENTS.items():
  candidates=found[agent]
  limitations=[NEEDS_DATA[agent]] if agent in NEEDS_DATA else ["Static repository checks only; validate findings against tests and actual site behavior."]
  status="awaiting_approved_data" if agent in NEEDS_DATA else "read_only_candidate_review"
  if agent=="weekly-executive-reporter":
   candidates=[item("agent-summary",f"{len(AGENTS)-1} specialist agents inventoried","Review each JSON report and existing agent-coordination digest; do not claim deployment or traffic gains")]
   limitations=["Only summarizes generated local reports; does not query external PRs or analytics."]
  report={"schema_version":1,"agent":agent,"description":description,"generated_at":stamp,"status":status,"mode":"read_only","findings":candidates,"limitations":limitations,"claude_auto_activation_verified":False,"safe_to_auto_merge":False}
  (OUT/(agent+".json")).write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
  counts[agent]=len(candidates)
 (OUT/"index.json").write_text(json.dumps({"generated_at":stamp,"agents":counts,"requires_human_validation":True},indent=2)+"\n",encoding="utf-8")
 print(json.dumps({"agents":len(AGENTS),"candidate_findings":sum(counts.values()),"output":str(OUT.relative_to(ROOT))}))
 return counts
if __name__=="__main__": generate()
