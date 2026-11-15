"""Turns a verified topic into a timed scene plan and a TikTok caption."""
from __future__ import annotations

from .common import CATEGORY_LABELS, plain, word_count

# Hook (a real-life problem) -> warm reframe -> analogy from the child's world
# -> 3-step exercise -> why it works -> question for the comments -> brand CTA.
SCENES = [
    ("hook", None),
    ("reframe", None),
    ("analogy", "THINK OF IT LIKE THIS"),
    ("steps", "TRY THIS TODAY"),
    ("why", "WHY IT WORKS"),
    ("question", "TELL US"),
]
STEP_BREAK = "\u00b6"  # marks a forced line break between steps

# Reading-time model: a short lead-in, then ~3.1 words/second, with a
# per-scene minimum so nothing flashes past. Steps get extra time because
# they appear one by one.
LEAD_IN = 0.6
READ_WPS = 3.1
MIN_SCENE = {"hook": 2.8, "reframe": 3.0, "analogy": 3.6, "steps": 7.5, "why": 3.2, "question": 3.4}
EXTRA = {"steps": 1.6}
CTA_SECONDS = 3.2


def scene_text(topic: dict, kind: str) -> str:
    if kind == "steps":
        return f" {STEP_BREAK} ".join(f"*{i}.* {step}" for i, step in enumerate(topic["steps"], 1))
    return topic[kind]


def scene_duration(kind: str, text: str) -> float:
    return round(max(MIN_SCENE[kind], LEAD_IN + EXTRA.get(kind, 0) + word_count(text) / READ_WPS), 2)


def build_plan(topic: dict, config: dict) -> dict:
    scenes = []
    t = 0.0
    for i, (kind, label) in enumerate(SCENES):
        text = scene_text(topic, kind)
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
    steps = " ".join(f"{i}) {plain(step)}" for i, step in enumerate(topic["steps"], 1))
    lines = [
        plain(topic["hook"]),
        "",
        f"Try this today: {steps}",
        f"Why it works: {plain(topic['why'])}",
        f"What your child learns: {plain(topic['learn'])}",
        "",
        plain(topic["question"]) + " Tell us in the comments.",
        "",
        f"Explore further on Money Quest ({topic['explore']}). Link in bio.",
        "",
        " ".join(tags[:6]),
    ]
    return "\n".join(lines)


def describe(plan: dict) -> str:
    out = [f"{plan['topic_id']} ({CATEGORY_LABELS.get(plan['category'], plan['category'])}) - {plan['duration']}s"]
    for s in plan["scenes"]:
        out.append(f"  {s['start']:5.2f}s +{s['duration']:.2f}s  {s['kind']:<5} {plain(s['text']).replace(STEP_BREAK, '|')}")
    return "\n".join(out)
