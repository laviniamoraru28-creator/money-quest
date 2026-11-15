"""Command line: python -m studio <command>

  topics                      list the topic bank and what has been used
  check                       content QA for every topic (no rendering)
  make [--topic ID]           script + render + full QA for one video (default: next topic)
  approve RUN                 mark a rendered video as approved by a human
  publish RUN --mode M        M = drafts (TikTok inbox) or direct; needs QA pass + approval
  status RUN                  fetch TikTok processing status for a published run
  metrics                     pull view/like/comment/share counts into history
  scheduled                   what the weekly workflow runs (see README)
  auth-url / auth-code CODE   one-time TikTok authorisation helpers
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys
from pathlib import Path

from . import qa, script, select, tiktok
from .common import OUTPUT_DIR, get_topic, load_config, load_history, load_topics, now_iso, save_history


def _entry(history: dict, run: str) -> dict:
    for v in history["videos"]:
        if v["run"] == run:
            return v
    raise SystemExit(f"Unknown run {run}. See state/history.json.")


def cmd_topics(_):
    used = {v["topic_id"]: v["status"] for v in load_history()["videos"]}
    for t in load_topics():
        print(f"{t['id']:<28} {t['category']:<24} {used.get(t['id'], '-')}")


def cmd_check(_):
    config = load_config()
    failed = 0
    for t in load_topics():
        plan = script.build_plan(t, config)
        res = qa.check_content(t, plan, config)
        mark = "PASS" if not res["errors"] else "FAIL"
        failed += bool(res["errors"])
        print(f"{mark} {t['id']:<28} {plan['duration']:5.2f}s")
        for e in res["errors"]:
            print(f"     - {e}")
    print(f"\n{len(load_topics()) - failed} passed, {failed} failed")
    return 1 if failed else 0


def make_video(topic: dict, config: dict) -> tuple[str, dict]:
    from . import render  # imported lazily: needs Pillow/ffmpeg

    plan = script.build_plan(topic, config)
    run = f"{dt.date.today().isoformat()}-{topic['id']}"
    out_dir = OUTPUT_DIR / run
    out_dir.mkdir(parents=True, exist_ok=True)
    content = qa.check_content(topic, plan, config)
    render_res = None
    if not content["errors"]:
        render.render(plan, config, out_dir)
        render_res = qa.check_render(out_dir, plan, config)
    result = qa.report(out_dir, content, render_res)

    history = load_history()
    history["videos"] = [v for v in history["videos"] if v["run"] != run]
    history["videos"].append({
        "run": run,
        "topic_id": topic["id"],
        "category": topic["category"],
        "status": "rendered" if result["passed"] else "qa_failed",
        "rendered_at": now_iso(),
        "duration": plan["duration"],
    })
    save_history(history)
    return run, result


def _print_result(run, result):
    print(f"\nRun: {run}  ->  output/{run}/")
    for section in ("content", "render"):
        r = result.get(section)
        if not r:
            continue
        for e in r["errors"]:
            print(f"  ERROR [{section}] {e}")
        for w in r["warnings"]:
            print(f"  warn  [{section}] {w}")
    print("QA PASSED" if result["passed"] else "QA FAILED")


def cmd_make(args):
    config = load_config()
    topic = get_topic(args.topic) if args.topic else select.next_topic()
    if not topic:
        print("Topic bank exhausted: add new verified topics to curriculum/topics.json")
        return 1
    print(script.describe(script.build_plan(topic, config)))
    run, result = make_video(topic, config)
    _print_result(run, result)
    return 0 if result["passed"] else 1


def cmd_approve(args):
    history = load_history()
    e = _entry(history, args.run)
    if e["status"] != "rendered":
        raise SystemExit(f"Run is '{e['status']}', only a QA-passed 'rendered' video can be approved")
    e["status"] = "approved"
    e["approved_at"] = now_iso()
    save_history(history)
    print(f"Approved {args.run}")


def _publish(run: str, mode: str, privacy: str, require_approval: bool) -> dict:
    history = load_history()
    e = _entry(history, run)
    out_dir = OUTPUT_DIR / run
    qa_res = json.loads((out_dir / "qa_report.json").read_text())
    if not qa_res["passed"]:
        raise SystemExit("Refusing to publish: QA did not pass")
    if require_approval and e["status"] != "approved":
        raise SystemExit("Refusing to publish: video not approved (python -m studio approve RUN)")
    if e["status"] in select.USED_STATUSES - {"approved"}:
        raise SystemExit(f"Already {e['status']}")
    token = tiktok.access_token()
    video = out_dir / "video.mp4"
    if mode == "drafts":
        publish_id = tiktok.send_to_drafts(token, video)
    else:
        caption = (out_dir / "caption.txt").read_text(encoding="utf-8").strip()
        publish_id = tiktok.direct_post(token, video, caption, privacy, e["duration"])
    status = tiktok.wait_for_status(token, publish_id)
    e.update({"publish_id": publish_id, "publish_mode": mode, "privacy": privacy if mode == "direct" else None,
              "tiktok_status": status.get("status"), "submitted_at": now_iso()})
    if status.get("status") == "PUBLISH_COMPLETE":
        e["status"] = "published"
        e["post_ids"] = status.get("publicaly_available_post_id") or status.get("publicly_available_post_id") or []
    elif status.get("status") == "SEND_TO_USER_INBOX":
        e["status"] = "sent_to_drafts"
    elif status.get("status") == "FAILED":
        e["status"] = "publish_failed"
        e["fail_reason"] = status.get("fail_reason")
    else:
        e["status"] = "scheduled"  # still processing; `status` command will update
    save_history(history)
    return e


def cmd_publish(args):
    e = _publish(args.run, args.mode, args.privacy, require_approval=True)
    print(json.dumps(e, indent=2))
    return 0 if e["status"] != "publish_failed" else 1


def cmd_status(args):
    history = load_history()
    e = _entry(history, args.run)
    st = tiktok.publish_status(tiktok.access_token(), e["publish_id"])
    e["tiktok_status"] = st.get("status")
    if st.get("status") == "PUBLISH_COMPLETE":
        e["status"] = "published"
        e["post_ids"] = st.get("publicaly_available_post_id") or e.get("post_ids", [])
    save_history(history)
    print(json.dumps(st, indent=2))


def cmd_metrics(_):
    token = tiktok.access_token()
    videos = {str(v["id"]): v for v in tiktok.list_videos(token)}
    history = load_history()
    updated = 0
    for e in history["videos"]:
        for pid in e.get("post_ids", []):
            v = videos.get(str(pid))
            if v:
                e["metrics"] = {k: v.get(k, 0) for k in ("view_count", "like_count", "comment_count", "share_count")}
                e["metrics_at"] = now_iso()
                e["share_url"] = v.get("share_url")
                updated += 1
    save_history(history)
    print(f"Updated metrics for {updated} video(s)")
    scores = select.category_scores(history)
    if scores:
        print("Category weighting used for future topic choice:", json.dumps(scores, indent=2))


def cmd_scheduled(_):
    """Weekly slot: pick -> render -> QA -> (publish only when authorised)."""
    config = load_config()
    topic = select.next_topic()
    if not topic:
        print("::error::Topic bank exhausted")
        return 1
    run, result = make_video(topic, config)
    _print_result(run, result)
    gh_out = os.environ.get("GITHUB_OUTPUT")
    if gh_out:
        with open(gh_out, "a") as f:
            f.write(f"run={run}\nqa_passed={'true' if result['passed'] else 'false'}\n")
    if not result["passed"]:
        return 1
    automated = os.environ.get("TIKTOK_AUTOMATION_APPROVED", "").lower() == "true"
    mode = os.environ.get("TIKTOK_PUBLISH_MODE", "review")
    if not automated or mode not in ("drafts", "direct"):
        print("Review mode: video rendered and QA-passed; nothing sent to TikTok.")
        return 0
    privacy = os.environ.get("TIKTOK_PRIVACY", "SELF_ONLY")
    e = _publish(run, mode, privacy, require_approval=False)
    print(json.dumps(e, indent=2))
    return 0 if e["status"] != "publish_failed" else 1


def cmd_auth_url(_):
    url, state = tiktok.authorize_url()
    print("Open this URL while logged in to the Money Quest TikTok account:\n")
    print(url)
    print(f"\nCheck that the redirect comes back with state={state}, then run: python -m studio auth-code <code>")


def cmd_auth_code(args):
    tok = tiktok.exchange_code(args.code)
    print("Scopes granted:", tok.get("scope"))
    print("Save this refresh token as the TIKTOK_REFRESH_TOKEN repository secret (do not commit it):")
    print(tok.get("refresh_token"))


def main(argv=None):
    p = argparse.ArgumentParser(prog="studio", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("topics").set_defaults(fn=cmd_topics)
    sub.add_parser("check").set_defaults(fn=cmd_check)
    m = sub.add_parser("make"); m.add_argument("--topic"); m.set_defaults(fn=cmd_make)
    a = sub.add_parser("approve"); a.add_argument("run"); a.set_defaults(fn=cmd_approve)
    pb = sub.add_parser("publish"); pb.add_argument("run"); pb.add_argument("--mode", choices=["drafts", "direct"], required=True)
    pb.add_argument("--privacy", default="SELF_ONLY", help="SELF_ONLY until the TikTok app passes audit"); pb.set_defaults(fn=cmd_publish)
    s = sub.add_parser("status"); s.add_argument("run"); s.set_defaults(fn=cmd_status)
    sub.add_parser("metrics").set_defaults(fn=cmd_metrics)
    sub.add_parser("scheduled").set_defaults(fn=cmd_scheduled)
    sub.add_parser("auth-url").set_defaults(fn=cmd_auth_url)
    c = sub.add_parser("auth-code"); c.add_argument("code"); c.set_defaults(fn=cmd_auth_code)
    args = p.parse_args(argv)
    try:
        return args.fn(args) or 0
    except tiktok.TikTokError as e:
        print(f"TikTok error: {e}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
