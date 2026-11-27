"""Lightweight performance report and the revised calendar proposal.

Only numbers that were actually collected are reported. Buffer exposes
views, likes, comments and shares for sent posts (experimental API). Saves,
average watch time, completion rate, profile visits and website clicks are
only in TikTok's own analytics; they are marked unavailable unless the owner
imports them with `python -m studio metrics-import file.csv`.
"""
from __future__ import annotations

import datetime as dt
from pathlib import Path

from . import quotes, shorts
from .common import STUDIO_ROOT

REPORT_PATH = STUDIO_ROOT / "reports" / "WEEKLY_REPORT.md"
NOTES_PATH = STUDIO_ROOT / "reports" / "notes.md"
PROPOSAL_PATH = STUDIO_ROOT / "CAMPAIGN_CALENDAR_PROPOSAL.md"
MIN_VIDEOS_FOR_CONCLUSIONS = 10
MANUAL_ONLY = ["Saves", "Average watch time", "Completion rate", "Profile visits", "Website clicks"]


def _label(v: dict) -> str:
    return v.get("video_id") or v.get("topic_id") or v["run"]


def _engagement(m: dict) -> float:
    views = m.get("view_count") or 0
    return (m.get("like_count", 0) + m.get("comment_count", 0) + m.get("share_count", 0)) / views if views else 0.0


def _snapshot(v: dict, hours: int) -> dict | None:
    """The first metrics snapshot taken at least `hours` after the post went out."""
    sent = v.get("published_at") or v.get("reminder_sent_at") or v.get("submitted_at")
    if not sent:
        return None
    start = dt.datetime.fromisoformat(sent.replace("Z", "+00:00"))
    for snap in v.get("metric_snapshots", []):
        if dt.datetime.fromisoformat(snap["at"]) - start >= dt.timedelta(hours=hours):
            return snap
    return None


def write_report(history: dict) -> Path:
    sent = [v for v in history["videos"] if v.get("status") in ("published", "reminder_sent", "sent_to_phone", "queued_in_buffer")]
    measured = [v for v in sent if (v.get("metrics") or {}).get("view_count")]
    out = [f"# Money Quest Education: weekly TikTok report", "",
           f"Generated {dt.date.today().isoformat()} by `python -m studio report`. Only collected numbers are shown; nothing is estimated.", "",
           f"- Videos sent to Buffer so far: {len(sent)}",
           f"- Videos with measured results: {len(measured)}", ""]
    if NOTES_PATH.exists():
        out += ["## Notes recorded by hand", "", NOTES_PATH.read_text(encoding="utf-8").strip(), ""]
    out += ["## Results per video", ""]
    if not measured:
        out += ["No measured results yet. Buffer has not returned metrics for any video, or none were imported.", ""]
    else:
        out += ["| Video | Category | Hook | Views | Likes | Comments | Shares | Engagement | Views at 48 h | Views at 7 days |", "|---|---|---|---|---|---|---|---|---|---|"]
        for v in sorted(measured, key=lambda x: -x["metrics"]["view_count"]):
            m = v["metrics"]
            s48, s7 = _snapshot(v, 48), _snapshot(v, 168)
            out.append(f"| {_label(v)} | {v.get('category', '')} | {v.get('hook', '')} | {m['view_count']} | {m.get('like_count', 0)} | {m.get('comment_count', 0)} | "
                       f"{m.get('share_count', 0)} | {_engagement(m):.1%} | {s48['view_count'] if s48 else 'not yet'} | {s7['view_count'] if s7 else 'not yet'} |")
        out.append("")
        ranked = sorted(measured, key=lambda x: -x["metrics"]["view_count"])
        out += ["## Best and weakest", "",
                "Best by views: " + ", ".join(f"{_label(v)} ({v['metrics']['view_count']})" for v in ranked[:3]) + ".",
                "Weakest by views: " + ", ".join(f"{_label(v)} ({v['metrics']['view_count']})" for v in ranked[-3:][::-1]) + ".", ""]
        by_cat: dict[str, list] = {}
        for v in measured:
            by_cat.setdefault(v.get("category", "unknown"), []).append(v["metrics"]["view_count"])
        out += ["## By content category", "", "| Category | Videos | Average views |", "|---|---|---|"]
        out += [f"| {c} | {len(vals)} | {sum(vals) / len(vals):.0f} |" for c, vals in sorted(by_cat.items())] + [""]
    out += ["## Not available automatically", "",
            "These exist only in TikTok's own analytics (TikTok app or TikTok Studio > Analytics > Content, open a video):", ""]
    out += [f"- {name}: unavailable through Buffer. Check by hand, or export and import a CSV." for name in MANUAL_ONLY]
    out += ["", "## What should change next week", ""]
    if len(measured) < MIN_VIDEOS_FOR_CONCLUSIONS:
        out.append(f"Nothing yet. {len(measured)} of the {MIN_VIDEOS_FOR_CONCLUSIONS} measured videos needed for a recommendation are in. "
                   "One or two low-view videos are not evidence about the format, so the plan stays as it is.")
    else:
        best = max(by_cat.items(), key=lambda kv: sum(kv[1]) / len(kv[1]))
        out.append(f"With {len(measured)} measured videos, the category with the highest average views is **{best[0]}**. "
                   "Treat this as a lead to test, not a conclusion: check the experiment log in CAMPAIGN_PLAN.md before changing the mix.")
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text("\n".join(out) + "\n", encoding="utf-8")
    return REPORT_PATH


def campaign_slots(weeks: int = 13) -> list[str]:
    slots = []
    for w in range(weeks):
        wed = "question" if w % 2 == 0 else "activity"
        if w % 4 == 3:
            fri = "mistake"
        elif w % 4 == 1:
            fri = "quotation"
        else:
            fri = "activity" if (w // 2) % 2 == 0 else "question"
        slots += ["quotation", wed, fri]
    return slots


def build_calendar() -> list[str]:
    """Publishing order for the scripted videos: category pattern by week, ids in order within a category."""
    videos = shorts.load_shorts()
    pool = {c: sorted((v["id"] for v in videos if v["category"] == c)) for c in shorts.CATEGORIES}
    order = []
    for cat in campaign_slots():
        if pool[cat]:
            order.append(pool[cat].pop(0))
    return order + [i for c in shorts.CATEGORIES for i in pool[c]]


def write_proposal(config: dict, history: dict, start: dt.date = dt.date(2026, 11, 23)) -> Path:
    """The version 2 calendar with dates, generated from curriculum/shorts.json."""
    skip = set(config.get("publishing", {}).get("skip_dates", []))
    by_topic = {v["topic_id"]: v for v in history["videos"]}
    by_id = {v["id"]: v for v in shorts.load_shorts()}
    day, rows, counts = start, [], {}
    for n, ident in enumerate(shorts.calendar(), 1):
        v = by_id[ident]
        while day.weekday() not in (0, 2, 4) or day.isoformat() in skip:
            day += dt.timedelta(days=1)
        status = {"reminder_sent": "Reminder sent", "sent_to_phone": "Reminder sent", "published": "Published"}.get(by_topic.get(ident, {}).get("status"), "Scripted, checks pass")
        counts[v["category"]] = counts.get(v["category"], 0) + 1
        rows.append(f"| {n} | {day.strftime('%a %d %b %Y')} | {v['category']} | {ident} | {v['cover_title']} | {shorts.build_plan(v)['duration']:.0f} s | {status} |")
        day += dt.timedelta(days=1)
    total = len(rows)
    placed = {s["quote_id"] for v in by_id.values() for s in v["scenes"] if s["kind"] == "quote"}
    library = [q for q in quotes.load_quotes() if q["id"] not in placed and quotes.topic_id(q) not in by_topic]
    out = ["# Money Quest Education: version 2 calendar", "",
           "Generated by `python -m studio campaign-proposal` from `curriculum/shorts.json`. The scheduled run follows this order from 23 November 2026.", "",
           "Mix: " + ", ".join(f"{c} {n} ({n / total:.0%})" for c, n in counts.items()) + ".", "",
           f"{len(library)} verified quotations are not placed here. They stay in `curriculum/quotes.json` and are used, in the approved quote format, once this calendar is finished.", "",
           "| # | Date | Category | Video id | Cover title and hook | Length | Status |", "|---|---|---|---|---|---|---|"] + rows
    PROPOSAL_PATH.write_text("\n".join(out) + "\n", encoding="utf-8")
    return PROPOSAL_PATH
