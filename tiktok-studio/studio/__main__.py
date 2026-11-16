"""Command line: python -m studio <command>

  quote-check                  QA for every quotation (verification, wording, CTA route)
  quote-make [--id N]          render + QA one quote video (default: next verified, unused)
  quote-calendar               write QUOTE_CALENDAR.md from curriculum/quotes.json
  topics                       list the topic bank and what has been used
  check                        content QA for every topic (no rendering)
  make [--topic ID]            script + render + full QA (default: next topic)
  approve RUN                  mark a rendered video as approved by a human
  buffer-setup                 find your TikTok channel in Buffer + verify Buffer's live API schema
  host RUN                     upload the video to a public GitHub Release URL and verify it
  publish RUN --mode M         M = buffer-notify | buffer-auto | tiktok-drafts | tiktok-private
  sync                         update Buffer post status (scheduled -> published)
  metrics                      pull performance numbers (Buffer, experimental)
  metrics-import FILE.csv      import numbers from a TikTok Studio export / hand-made CSV
  scheduled                    what the Mon/Wed/Fri workflow runs
  cleanup-hosting              delete hosting releases of videos published 14+ days ago
  auth-url / auth-code CODE    only for the optional direct TikTok API (private posts)

Publish modes
  review          render + QA only (default; nothing leaves GitHub)
  buffer-draft    saved in Buffer's Drafts for review; not scheduled (not yet tested live)
  buffer-notify   Buffer sends you a phone reminder; YOU tap to post. Safe test mode.
  buffer-auto     Buffer posts publicly at the scheduled time. Requires the
                  PUBLIC_POSTING_APPROVED=true repository variable.
  tiktok-drafts   direct TikTok API: video lands in your TikTok inbox
  tiktok-private  direct TikTok API: private (SELF_ONLY) post
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import os
import sys

from . import buffer, hosting, qa, quotes, script, select, tiktok
from .common import OUTPUT_DIR, get_topic, load_config, load_history, load_topics, now_iso, save_history

MODES = ("buffer-draft", "buffer-notify", "buffer-auto", "tiktok-drafts", "tiktok-private")


def _entry(history: dict, run: str) -> dict:
    for v in history["videos"]:
        if v["run"] == run:
            return v
    raise SystemExit(f"Unknown run {run}. See state/history.json.")


def _flag(name: str) -> bool:
    return os.environ.get(name, "").strip().lower() == "true"


def _gh_output(**kv):
    path = os.environ.get("GITHUB_OUTPUT")
    if path:
        with open(path, "a") as f:
            for k, v in kv.items():
                f.write(f"{k}={v}\n")


# -- content -----------------------------------------------------------------
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
        failed += bool(res["errors"])
        print(f"{'PASS' if not res['errors'] else 'FAIL'} {t['id']:<28} {plan['duration']:5.2f}s")
        for e in res["errors"]:
            print(f"     - {e}")
    print(f"\n{len(load_topics()) - failed} passed, {failed} failed")
    return 1 if failed else 0


def make_video(topic: dict, config: dict) -> tuple[str, dict]:
    from . import render  # needs Pillow + ffmpeg

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
        "run": run, "topic_id": topic["id"], "category": topic["category"],
        "status": "rendered" if result["passed"] else "qa_failed",
        "rendered_at": now_iso(), "duration": plan["duration"],
    })
    save_history(history)
    return run, result


def make_quote_video(q: dict, config: dict) -> tuple[str, dict]:
    plan = quotes.build_plan(q)
    run = f"{dt.date.today().isoformat()}-quote-{q['id']:02d}-{q['slug']}"
    out_dir = OUTPUT_DIR / run
    out_dir.mkdir(parents=True, exist_ok=True)
    content = quotes.check_content(q, plan, config)
    render_res = None
    if not content["errors"]:
        quotes.render(q, plan, config, out_dir)
        render_res = qa.check_render(out_dir, plan, config, contrast_pairs=quotes.contrast_pairs(), min_font=60, limits=(9, 18))
    result = qa.report(out_dir, content, render_res)
    history = load_history()
    history["videos"] = [v for v in history["videos"] if v["run"] != run]
    history["videos"].append({
        "run": run, "topic_id": plan["topic_id"], "category": q["pillar"], "series": "quotes",
        "status": "rendered" if result["passed"] else "qa_failed",
        "rendered_at": now_iso(), "duration": plan["duration"],
    })
    save_history(history)
    return run, result


def _used_topics() -> set[str]:
    return {v["topic_id"] for v in load_history()["videos"] if v.get("status") in select.USED_STATUSES}


def cmd_quote_check(_):
    config = load_config()
    ready = 0
    for q in quotes.load_quotes():
        res = quotes.check_content(q, quotes.build_plan(q), config)
        ready += not res["errors"]
        print(f"{'READY ' if not res['errors'] else 'HOLD  '} {q['id']:>2} {q['author']:<22} {quotes.build_plan(q)['duration']:5.2f}s  {q['verification']}")
        for e in res["errors"]:
            print(f"        - {e}")
    print(f"\n{ready} ready for production, {len(quotes.load_quotes()) - ready} on hold")


def cmd_quote_make(args):
    config = load_config()
    q = quotes.get_quote(args.id) if args.id else quotes.next_quote(_used_topics())
    if not q:
        print("No verified, unused quotation left: verify more entries in curriculum/quotes.json")
        return 1
    run, result = make_quote_video(q, config)
    _print_result(run, result)
    _gh_output(run=run, qa_passed=str(result["passed"]).lower())
    return 0 if result["passed"] else 1


def cmd_quote_calendar(_):
    print("Wrote", quotes.write_calendar(load_history()))


def _print_result(run, result):
    print(f"\nRun: {run}  ->  output/{run}/")
    for section in ("content", "render"):
        r = result.get(section)
        if r:
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
    _gh_output(run=run, qa_passed=str(result["passed"]).lower())
    return 0 if result["passed"] else 1


def cmd_approve(args):
    history = load_history()
    e = _entry(history, args.run)
    if e["status"] != "rendered":
        raise SystemExit(f"Run is '{e['status']}'; only a QA-passed 'rendered' video can be approved")
    e["status"], e["approved_at"] = "approved", now_iso()
    save_history(history)
    print(f"Approved {args.run}")


# -- hosting & Buffer ----------------------------------------------------------
def cmd_buffer_setup(_):
    """Read-only: lists TikTok channels and checks Buffer's live API. Posts nothing."""
    chans = buffer.tiktok_channels()
    rc = 0
    if not chans:
        print("No TikTok channel found in this Buffer account. Connect TikTok in Buffer first (Channels > Connect > TikTok).")
        rc = 1
    else:
        print("TikTok channels in Buffer:")
        for c in chans:
            print(f"  {c['name']:<30} id={c['id']}  queuePaused={c.get('isQueuePaused')}")
        if len(chans) > 1:
            print("More than one TikTok channel: set the BUFFER_CHANNEL_ID repository variable to the right id.")
    try:
        problems, lines = buffer.schema_report()
    except buffer.BufferError as err:
        print(f"\nCould not read Buffer's API schema ({err}); the notification test will show whether posting works.")
        return rc
    print("\nBuffer live API (parts this client uses):")
    for line in lines:
        print("  " + line)
    if problems:
        print("\nDifferences from what this client expects:")
        for p in problems:
            print("  -", p)
        return 1
    print("\nBuffer API schema check: OK")
    return rc


def _channel() -> dict:
    wanted = os.environ.get("BUFFER_CHANNEL_ID", "").strip()
    chans = buffer.tiktok_channels()
    if wanted:
        for c in chans:
            if c["id"] == wanted:
                return c
        raise SystemExit(f"BUFFER_CHANNEL_ID {wanted} is not a TikTok channel in this Buffer account")
    if len(chans) != 1:
        raise SystemExit(f"Found {len(chans)} TikTok channels in Buffer; set BUFFER_CHANNEL_ID")
    return chans[0]


def cmd_host(args):
    history = load_history()
    e = _entry(history, args.run)
    out_dir = OUTPUT_DIR / args.run
    url = hosting.upload(args.run, out_dir)
    check = hosting.check_public(url, (out_dir / "video.mp4").stat().st_size)
    print(json.dumps({"url": url, **check}, indent=2))
    if check["status"] not in (200, 206) or not check["looks_like_mp4"]:
        raise SystemExit("Hosted video is not publicly readable as MP4")
    e["video_url"] = url
    save_history(history)
    _gh_output(video_url=url)


def _publish(run: str, mode: str, *, video_url: str | None, privacy: str, delay_min: int) -> dict:
    if mode not in MODES:
        raise SystemExit(f"Unknown mode {mode}")
    history = load_history()
    e = _entry(history, run)
    out_dir = OUTPUT_DIR / run
    if not json.loads((out_dir / "qa_report.json").read_text())["passed"]:
        raise SystemExit("Refusing to publish: QA did not pass")
    # Gate 1: a human approved this video, or automation was explicitly enabled.
    if e["status"] != "approved" and not _flag("AUTOMATION_ENABLED"):
        raise SystemExit("Refusing: video not approved (python -m studio approve RUN) and AUTOMATION_ENABLED is not true")
    if e["status"] not in ("approved", "rendered"):
        raise SystemExit(f"Refusing: run is already '{e['status']}'")
    # Gate 2: anything that becomes publicly visible needs the owner's standing approval.
    public = mode == "buffer-auto" or (mode == "tiktok-private" and privacy != "SELF_ONLY")
    if public and not _flag("PUBLIC_POSTING_APPROVED"):
        raise SystemExit("Refusing public posting: set the repository variable PUBLIC_POSTING_APPROVED=true to allow it")

    caption = (out_dir / "caption.txt").read_text(encoding="utf-8").strip()
    e.update({"publish_mode": mode, "submitted_at": now_iso()})

    if mode.startswith("buffer"):
        video_url = video_url or e.get("video_url")
        if not video_url:
            raise SystemExit("Buffer needs a public video URL: run `host RUN` first or pass --video-url")
        ch = _channel()
        due = dt.datetime.now(dt.timezone.utc) + dt.timedelta(minutes=delay_min)
        scheduling = "automatic" if mode == "buffer-auto" else "notification"
        post = buffer.create_post(ch["id"], caption, video_url, scheduling, due, draft=(mode == "buffer-draft"))
        try:  # read it back so the log shows what Buffer actually stored
            check = buffer.get_post(post["id"])
            e["buffer_status"] = check.get("status")
            print(f"Buffer stored the post as: status={check.get('status')} type={check.get('schedulingType')} shareMode={check.get('shareMode')} due={check.get('dueAt')}")
            if mode == "buffer-draft" and check.get("status") != "draft":
                print("::warning::Buffer did not store this post as a draft. It is a notification-type post, so it still cannot publish by itself.")
        except buffer.BufferError as err:
            print(f"::warning::Could not read the post back from Buffer: {err}")
        e.update({"buffer_post_id": post["id"], "buffer_channel_id": ch["id"], "buffer_org_id": ch["organizationId"],
                  "due_at": due.isoformat(timespec="seconds"), "video_url": video_url,
                  "status": {"buffer-draft": "draft_in_buffer", "buffer-notify": "sent_to_phone"}.get(mode, "queued_in_buffer")})
    else:
        token = tiktok.access_token()
        video = out_dir / "video.mp4"
        if mode == "tiktok-drafts":
            publish_id = tiktok.send_to_drafts(token, video)
        else:
            publish_id = tiktok.direct_post(token, video, caption, privacy, e["duration"])
        status = tiktok.wait_for_status(token, publish_id)
        e.update({"publish_id": publish_id, "tiktok_status": status.get("status")})
        e["status"] = {"PUBLISH_COMPLETE": "published", "SEND_TO_USER_INBOX": "sent_to_drafts",
                       "FAILED": "publish_failed"}.get(status.get("status"), "scheduled")
        if e["status"] == "published":
            e["post_ids"] = status.get("publicaly_available_post_id") or []
        if e["status"] == "publish_failed":
            e["fail_reason"] = status.get("fail_reason")
    save_history(history)
    return e


def cmd_publish(args):
    e = _publish(args.run, args.mode, video_url=args.video_url, privacy=args.privacy, delay_min=args.delay_min)
    print(json.dumps(e, indent=2))
    return 0 if e["status"] != "publish_failed" else 1


def cmd_sync(_):
    history = load_history()
    changed = 0
    for e in history["videos"]:
        if e.get("buffer_post_id") and e["status"] in ("queued_in_buffer", "sent_to_phone", "draft_in_buffer"):
            try:
                p = buffer.get_post(e["buffer_post_id"])
            except buffer.BufferError as err:
                print(f"{e['run']}: {err}")
                continue
            e["buffer_status"] = p.get("status")
            print(f"{e['run']}: Buffer status={p.get('status')} type={p.get('schedulingType')} notification={p.get('notificationStatus')} due={p.get('dueAt')} sent={p.get('sentAt')} link={p.get('externalLink')}")
            if p.get("sentAt"):
                # For notification posts "sent" means Buffer sent the reminder;
                # only the account owner knows whether it was then posted in TikTok.
                reminder = e.get("publish_mode") == "buffer-notify" and not p.get("externalLink")
                e.update({"status": "reminder_sent" if reminder else "published", "published_at": None if reminder else p["sentAt"],
                          "reminder_sent_at": p["sentAt"] if reminder else None, "external_link": p.get("externalLink")})
                changed += 1
            elif str(p.get("status")).lower() in ("error", "failed"):
                e["status"] = "publish_failed"
                changed += 1
    save_history(history)
    print(f"Synced Buffer status; {changed} change(s)")


def cmd_metrics(_):
    history = load_history()
    updated = 0
    pairs = {(e["buffer_org_id"], e["buffer_channel_id"]) for e in history["videos"] if e.get("buffer_post_id")}
    for org, ch in pairs:
        try:
            posts = {p["id"]: p for p in buffer.sent_posts_with_metrics(org, ch)}
        except buffer.BufferError as err:
            print(f"Buffer metrics unavailable ({err}). Use `metrics-import` with a TikTok Studio export instead.")
            continue
        for e in history["videos"]:
            p = posts.get(e.get("buffer_post_id"))
            if p and p["metrics"]:
                e["metrics"], e["metrics_raw"], e["metrics_at"] = buffer.normalise_metrics(p["metrics"]), p["metrics"], now_iso()
                updated += 1
    save_history(history)
    print(f"Updated metrics for {updated} video(s)")
    scores = select.category_scores(history)
    if scores:
        print("Category weighting for future topics:", json.dumps(scores))


def cmd_metrics_import(args):
    """CSV columns: run (or topic_id), views, likes, comments, shares."""
    history = load_history()
    n = 0
    with open(args.file, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            key = (row.get("run") or row.get("topic_id") or "").strip()
            for e in history["videos"]:
                if key in (e["run"], e["topic_id"]):
                    e["metrics"] = {"view_count": int(row.get("views") or 0), "like_count": int(row.get("likes") or 0),
                                    "comment_count": int(row.get("comments") or 0), "share_count": int(row.get("shares") or 0)}
                    e["metrics_at"] = now_iso()
                    n += 1
    save_history(history)
    print(f"Imported metrics for {n} video(s)")


def cmd_cleanup(_):
    history = load_history()
    runs = [e["run"] for e in history["videos"] if e["status"] == "published"]
    print("Deleted:", hosting.cleanup(runs) or "nothing")


# -- the scheduled slot ------------------------------------------------------------
def cmd_scheduled(_):
    """Pick -> render -> QA -> (host + publish, only when enabled)."""
    config = load_config()
    mode = os.environ.get("PUBLISH_MODE", "review").strip() or "review"
    # One video per day: a scheduled run does nothing if a video was already
    # sent to Buffer today (for example by a manual run earlier in the day).
    if os.environ.get("GITHUB_EVENT_NAME") == "schedule" and mode != "review":
        today = dt.datetime.now(dt.timezone.utc).date().isoformat()
        sent_today = [v["run"] for v in load_history()["videos"]
                      if v.get("status") in select.USED_STATUSES and str(v.get("submitted_at", "")).startswith(today)]
        if sent_today:
            print(f"Already sent today ({', '.join(sent_today)}): skipping this scheduled run.")
            return 0
    if config.get("series") == "quotes":
        q = quotes.next_quote(_used_topics())
        if not q:
            print("::error::No verified, unused quotation left")
            return 1
        run, result = make_quote_video(q, config)
    else:
        topic = select.next_topic()
        if not topic:
            print("::error::Topic bank exhausted")
            return 1
        run, result = make_video(topic, config)
    _print_result(run, result)
    _gh_output(run=run, qa_passed=str(result["passed"]).lower())
    if not result["passed"]:
        return 1
    if mode == "review":
        print("Review mode: video rendered and QA-passed; nothing sent anywhere.")
        return 0
    if not _flag("AUTOMATION_ENABLED"):
        print(f"PUBLISH_MODE={mode} but AUTOMATION_ENABLED is not true: stopping after render.")
        return 0
    if mode.startswith("buffer"):
        cmd_host(argparse.Namespace(run=run))
    e = _publish(run, mode, video_url=None, privacy=os.environ.get("TIKTOK_PRIVACY", "SELF_ONLY"),
                 delay_min=int(os.environ.get("PUBLISH_DELAY_MINUTES", "20")))
    print(json.dumps(e, indent=2))
    return 0 if e["status"] != "publish_failed" else 1


# -- optional direct TikTok API ----------------------------------------------------
def cmd_auth_url(_):
    url, state = tiktok.authorize_url()
    print(url)
    print(f"\nCheck the redirect returns state={state}, then: python -m studio auth-code <code>")


def cmd_auth_code(args):
    tok = tiktok.exchange_code(args.code)
    print("Scopes granted:", tok.get("scope"))
    print("Save as the TIKTOK_REFRESH_TOKEN secret (never commit it):")
    print(tok.get("refresh_token"))


def main(argv=None):
    p = argparse.ArgumentParser(prog="studio", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("topics").set_defaults(fn=cmd_topics)
    sub.add_parser("check").set_defaults(fn=cmd_check)
    m = sub.add_parser("make"); m.add_argument("--topic"); m.set_defaults(fn=cmd_make)
    a = sub.add_parser("approve"); a.add_argument("run"); a.set_defaults(fn=cmd_approve)
    sub.add_parser("quote-check").set_defaults(fn=cmd_quote_check)
    qm = sub.add_parser("quote-make"); qm.add_argument("--id"); qm.set_defaults(fn=cmd_quote_make)
    sub.add_parser("quote-calendar").set_defaults(fn=cmd_quote_calendar)
    sub.add_parser("buffer-setup").set_defaults(fn=cmd_buffer_setup)
    h = sub.add_parser("host"); h.add_argument("run"); h.set_defaults(fn=cmd_host)
    pb = sub.add_parser("publish"); pb.add_argument("run"); pb.add_argument("--mode", choices=MODES, required=True)
    pb.add_argument("--video-url"); pb.add_argument("--privacy", default="SELF_ONLY")
    pb.add_argument("--delay-min", type=int, default=20, help="minutes from now until Buffer posts / reminds")
    pb.set_defaults(fn=cmd_publish)
    sub.add_parser("sync").set_defaults(fn=cmd_sync)
    sub.add_parser("metrics").set_defaults(fn=cmd_metrics)
    mi = sub.add_parser("metrics-import"); mi.add_argument("file"); mi.set_defaults(fn=cmd_metrics_import)
    sub.add_parser("cleanup-hosting").set_defaults(fn=cmd_cleanup)
    sub.add_parser("scheduled").set_defaults(fn=cmd_scheduled)
    sub.add_parser("auth-url").set_defaults(fn=cmd_auth_url)
    c = sub.add_parser("auth-code"); c.add_argument("code"); c.set_defaults(fn=cmd_auth_code)
    args = p.parse_args(argv)
    try:
        return args.fn(args) or 0
    except (tiktok.TikTokError, buffer.BufferError) as err:
        print(f"Publishing error: {err}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
