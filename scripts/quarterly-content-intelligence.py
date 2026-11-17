#!/usr/bin/env python3
"""Free, evidence-gated quarterly TikTok planning. No network or paid APIs."""
import argparse
import datetime as dt
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "research" / "tiktok-content-signals.json"
TOPICS = [
    ("money", "Cum îi explici copilului diferența dintre nevoie și dorință?", "O întrebare simplă despre cumpărături"),
    ("saving", "Cum poate copilul să înceapă să economisească?", "Un obiectiv mic de economisire"),
    ("entrepreneurship", "Ce învață copilul când inventează o mică afacere?", "O idee, un client, un preț"),
    ("leadership", "Cum exersăm deciziile în echipă?", "Alege, ascultă, explică"),
    ("emotions", "Ce facem când o cumpărătură ne dezamăgește?", "Pauză, numește emoția, alege"),
    ("future-skills", "Cum exersăm gândirea critică?", "Întreabă, compară, verifică"),
]
VALID_SOURCES = {"google-trends", "search-console", "tiktok-creative-center",
                 "tiktok-creator-search-insights", "tiktok-analytics", "manual-research"}
def read_signals():
    if not INPUT.exists():
        return [], ["No approved signal dataset supplied. Do not claim current trends or audience demand."]
    data = json.loads(INPUT.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("Signals must be a JSON array")
    approved, problems = [], []
    for n, s in enumerate(data):
        if not isinstance(s, dict):
            problems.append(f"Signal {n+1}: not an object")
            continue
        source = s.get("source")
        if source not in VALID_SOURCES:
            problems.append(f"Signal {n+1}: unsupported source")
            continue
        if not all(isinstance(s.get(k), str) and s[k].strip() for k in ("topic", "observed_at", "evidence", "url")):
            problems.append(f"Signal {n+1}: missing topic/date/evidence/source URL")
            continue
        try:
            dt.date.fromisoformat(s["observed_at"])
        except ValueError:
            problems.append(f"Signal {n+1}: invalid date")
            continue
        if not s["url"].startswith("https://"):
            problems.append(f"Signal {n+1}: source URL must use HTTPS")
            continue
        approved.append(s)
    return approved, problems

def make_plan(signals, count):
    rows = []
    for i in range(count):
        tag, question, takeaway = TOPICS[i % len(TOPICS)]
        matching = [s for s in signals if tag in s["topic"].lower()]
        signal = matching[0] if matching else None
        # No fabricated performance numbers, and no automatic publishing.
        hook = question
        lines = [
            f"0–3s: {hook}",
            f"3–8s: {takeaway}.",
            "8–13s: Încearcă această idee împreună cu copilul.",
            "13–15s: Money Quest Academy | link în bio",
        ]
        rows.append({"slot": i+1, "topic": tag, "hook_a": hook,
            "hook_b": f"Știai că poți exersa asta acasă? {question}",
            "screen_text": lines, "music": "instrumental background only, licensed/royalty-cleared",
            "voice": "none", "status": "draft_needs_claude_and_owner_review",
            "signal": signal, "evidence_level": "documented_signal" if signal else "evergreen_hypothesis"})
    return rows

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--slots", type=int, default=39)
    parser.add_argument("--output", default="quarterly-tiktok-content-report.md")
    args = parser.parse_args()
    if not 1 <= args.slots <= 100:
        parser.error("--slots must be 1..100")
    signals, problems = read_signals()
    plan = make_plan(signals, args.slots)
    lines = ["# Money Quest Quarterly TikTok Content Intelligence", "",
        "Generated UTC: " + dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"), "",
        "PROPOSAL ONLY. No voiceover. Instrumental music plus on-screen text. No video generated or published.",
        "Existing three-month scripts and publishing schedules are unchanged.", "",
        f"Valid documented signals: {len(signals)}. Draft video slots: {len(plan)}.", "",
        "## Data coverage and limitations", ""]
    lines += [f"- {p}" for p in problems] if problems else ["- No input validation problems."]
    lines += ["", "TikTok search data may require manual authorized export. No scraping, fake trends or invented metrics.", "",
              "## Proposed scripts (Romanian drafts, translate and fact-check before use)", ""]
    for p in plan:
        lines += [f"### Video {p['slot']} | {p['topic']}", "",
                  f"Evidence: {p['evidence_level']}", "",
                  f"Hook A: {p['hook_a']}", "", f"Hook B: {p['hook_b']}", "",
                  *[f"- {line}" for line in p["screen_text"]], "",
                  "Audio: instrumental music only, no narration.", ""]
        if p["signal"]:
            lines += [f"Source: {p['signal']['source']} | {p['signal']['url']}", "",
                      f"Observation: {p['signal']['evidence']}", ""]
    lines += ["## Claude handoff", "",
        "Verify factual claims, compare against existing 3-month scripts, eliminate duplicates, check child-appropriate tone and copyrighted music rights.",
        "Evaluate hooks as hypotheses, not guaranteed views. Request user approval before replacing calendar or generating/publishing videos.",
        "Do not add voice, ElevenLabs, paid APIs, automated TikTok scraping, or live posting. Do not merge or deploy.", ""]
    Path(args.output).write_text("\n".join(lines), encoding="utf-8")
    Path("quarterly-tiktok-content-plan.json").write_text(json.dumps(plan, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(f"Created {len(plan)} draft slots; {len(signals)} sourced signals; {len(problems)} input warnings")

if __name__ == "__main__":
    main()
