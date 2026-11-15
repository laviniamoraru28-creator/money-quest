"""Turns a verified topic into a timed scene plan and a TikTok caption."""
from __future__ import annotations

from .common import CATEGORY_LABELS, plain, word_count

# Problem -> solution: a real-life problem a parent recognises, the fix to
# try, why it works, and the skill the child builds. Then the brand CTA.
SCENES = [
    ("hook", None),
    ("tip", "TRY THIS"),
    ("why", "WHY IT WORKS"),
    ("learn", "WHAT YOUR CHILD LEARNS"),
]

# Base reading-time model: a short lead-in, then ~3.4 words/second, with a
# per-scene minimum so nothing flashes past.
LEAD_IN = 0.5
READ_WPS = 3.6
MIN_SCENE = {"hook": 2.6, "learn": 3.0, "why": 3.2, "tip": 3.2}
CTA_SECONDS = 3.2


def scene_duration(kind: str, text: str) -> float:
    return round(max(MIN_SCENE[kind], LEAD_IN + word_count(text) / READ_WPS), 2)


def build_plan(topic: dict, config: dict) -> dict:
    scenes = []
    t = 0.0
    for i, (kind, label) in enumerate(SCENES):
        text = topic[kind]
        dur = scene_duration(kind, text)
        scenes.append({
            "kind": kind,
            "label": label,
            "text": text,
            "start": round(t, 2),
            "duration": dur,
        })
        t += dur
    cta_lines = config["brand"]["cta_lines"]
    scenes.append({
        "kind": "cta",
        "label": None,
        "text": " ".join(cta_lines),
        "lines": cta_lines,
        "explore": topic["explore"],
        "start": round(t, 2),
        "duration": CTA_SECONDS,
    })
    t += CTA_SECONDS
    return {
        "topic_id": topic["id"],
        "category": topic["category"],
        "duration": round(t, 2),
        "scenes": scenes,
        "caption": build_caption(topic, config),
    }


def build_caption(topic: dict, config: dict) -> str:
    tags = list(dict.fromkeys(topic.get("hashtags", []) + config.get("hashtags_base", [])))
    lines = [
        plain(topic["hook"]),
        "",
        f"Try this: {plain(topic['tip'])}",
        f"Why it works: {plain(topic['why'])}",
        f"What your child learns: {plain(topic['learn'])}",
        "",
        f"Explore further on Money Quest ({topic['explore']}). Link in bio.",
        "",
        " ".join(tags[:6]),
    ]
    return "\n".join(lines)


def describe(plan: dict) -> str:
    out = [f"{plan['topic_id']} ({CATEGORY_LABELS.get(plan['category'], plan['category'])}) - {plan['duration']}s"]
    for s in plan["scenes"]:
        out.append(f"  {s['start']:5.2f}s +{s['duration']:.2f}s  {s['kind']:<5} {plain(s['text'])}")
    return "\n".join(out)
