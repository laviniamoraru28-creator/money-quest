"""Chooses the next topic: never repeats a published topic, rotates
categories, and gently favours categories that perform well."""
from __future__ import annotations

from .common import load_config, load_history, load_topics

USED_STATUSES = {"approved", "scheduled", "published", "sent_to_drafts", "queued_in_buffer", "sent_to_phone", "reminder_sent"}  # a Buffer draft is a test copy, so its topic stays available


def category_scores(history: dict, bounds=(0.7, 1.3)) -> dict[str, float]:
    """Engagement rate per category relative to the channel average, clamped.

    engagement = (likes + comments + shares) / views. Needs at least one
    measured video in a category; unknown categories score 1.0 (neutral),
    which also keeps exploring topics that have not been tried yet.
    """
    per_cat: dict[str, list[float]] = {}
    for v in history["videos"]:
        m = v.get("metrics") or {}
        views = m.get("view_count") or 0
        if views < 50:  # too little data to judge
            continue
        rate = (m.get("like_count", 0) + m.get("comment_count", 0) + m.get("share_count", 0)) / views
        per_cat.setdefault(v["category"], []).append(rate)
    if not per_cat:
        return {}
    means = {c: sum(r) / len(r) for c, r in per_cat.items()}
    overall = sum(means.values()) / len(means) or 1e-9
    lo, hi = bounds
    return {c: max(lo, min(hi, m / overall)) for c, m in means.items()}


def next_topic(exclude: set[str] | None = None) -> dict | None:
    config = load_config()
    history = load_history()
    topics = load_topics()
    used = {v["topic_id"] for v in history["videos"] if v.get("status") in USED_STATUSES}
    used |= exclude or set()
    candidates = [t for t in topics if t["id"] not in used]
    if not candidates:
        return None

    published = [v for v in history["videos"] if v.get("status") in USED_STATUSES]
    window = config["selection"]["avoid_category_repeat_within"]
    recent_cats = [v["category"] for v in published[-window:]]
    counts: dict[str, int] = {}
    for v in published:
        counts[v["category"]] = counts.get(v["category"], 0) + 1
    scores = category_scores(history, tuple(config["selection"]["performance_weight_bounds"]))
    order = {t["id"]: i for i, t in enumerate(topics)}

    def rank(t):
        recent_penalty = 1 if t["category"] in recent_cats else 0
        # Fewer uses first, then better-performing categories, then bank order.
        return (recent_penalty, counts.get(t["category"], 0) / scores.get(t["category"], 1.0), order[t["id"]])

    return sorted(candidates, key=rank)[0]
