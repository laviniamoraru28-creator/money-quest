#!/usr/bin/env python3
"""Read-only source-wiring evidence for MQ, EQ, LQ; no browser or learning outcome claims."""
import argparse
import datetime as dt
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CHECKS=[
 ("mq_catalog_age_filter","src/content/catalog.ts",r"l\.ageBand\s*===\s*ageBand",
  "Money Quest lesson catalog filters by selected age band"),
 ("mq_catalog_game_age_filter","src/content/catalog.ts",r"g\.variants\.some\(\(v\)\s*=>\s*v\.ageBand\s*===\s*ageBand\)",
  "Money Quest game catalog filters by selected age band"),
 ("mq_quiz_answer_check","src/components/lesson/LessonPlayer.tsx",r"selectedOption\s*===\s*quiz\.correct_answer",
  "Standard lesson quiz checks the selected answer against the answer key"),
 ("mq_quiz_completion","src/components/lesson/LessonPlayer.tsx",r"onComplete\(activity\.id,\s*true",
  "Standard lesson records successful quiz completion"),
 ("mq_read_aloud","src/components/lesson/LessonPlayer.tsx",r"<ReadAloudButton",
  "LessonPlayer renders a read-aloud control"),
 ("explorer_interactive","src/components/explorer/ExplorerInteractiveLesson.tsx",r"data-explorer-interactive-lesson",
  "Explorer uses a dedicated interactive lesson component"),
 ("explorer_completion","src/components/explorer/ExplorerInteractiveLesson.tsx",r"onComplete\(\)",
  "Explorer component invokes completion callback"),
 ("explorer_audio","src/components/explorer/ExplorerInteractiveLesson.tsx",r"<ReadAloudButton",
  "Explorer interactive component includes read-aloud controls"),
 ("eq_unified_track","src/content/entrepreneur-quest/structures.ts",r"ONE unified 8-14 track",
  "EQ source documentation specifies one unified 8–14 progression"),
 ("eq_structured_stages","src/content/entrepreneur-quest/structures.ts",r"export const EQ_STAGES",
  "EQ defines ordered stage structures"),
 ("lq_structured_missions","src/content/leadership-quest/structures.ts",r"export const LQ_MISSIONS",
  "LQ defines structured missions"),
]
def inspect(root):
    results=[]
    for code,path,pattern,meaning in CHECKS:
        source=root/path
        if not source.is_file():
            results.append({"check":code,"source_path":path,"status":"source_unavailable","interpretation":meaning})
            continue
        content=source.read_text(encoding="utf-8",errors="replace")
        match=re.search(pattern,content,re.S)
        line=content.count("\n",0,match.start())+1 if match else None
        results.append({"check":code,"source_path":path,"line":line,
                        "status":"source_pattern_found" if match else "pattern_not_found",
                        "interpretation":meaning,"verified_runtime":False})
    return results

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--root",type=Path,default=ROOT)
    parser.add_argument("--output",type=Path,default=Path("artifacts/education-specialists/runtime-wiring-evidence.json"))
    args=parser.parse_args()
    findings=inspect(args.root)
    report={"generated_at":dt.datetime.now(dt.timezone.utc).isoformat(),
            "scope":"static_source_wiring_only","checks":findings,
            "review_priorities":[
                {"priority":"high","topic":"Explorer lesson playthrough","action":"Run keyboard, touch, screen-reader and narration tests for each of the four Money Basics stages; verify completion and progression."},
                {"priority":"high","topic":"EQ age suitability","action":"Evaluate the documented unified 8–14 track with age-diverse users; do not label absent ageBand metadata as a defect."},
                {"priority":"medium","topic":"Assessment alignment","action":"Compare rendered quizzes and feedback with learning objectives for Builder and Strategist."}],
            "limitations":["Regex patterns are static indicators; absent patterns do not prove absent functionality.",
                           "No browser, device, child, speech engine or runtime tests executed.",
                           "No source edits, child analytics or educational effectiveness claims."]}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Source wiring checks: {sum(x['status']=='source_pattern_found' for x in findings)}/{len(findings)} matched.")

if __name__=="__main__":
    main()
