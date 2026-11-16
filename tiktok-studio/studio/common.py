"""Shared paths, loading helpers and text utilities."""
from __future__ import annotations

import datetime as _dt
import json
import re
from pathlib import Path

STUDIO_ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = STUDIO_ROOT / "config.json"
TOPICS_PATH = STUDIO_ROOT / "curriculum" / "topics.json"
STATE_DIR = STUDIO_ROOT / "state"
HISTORY_PATH = STATE_DIR / "history.json"
OUTPUT_DIR = STUDIO_ROOT / "output"

CATEGORY_LABELS = {
    "financial_education": "Financial education",
    "saving_spending": "Saving and spending",
    "needs_wants": "Needs and wants",
    "budgeting_planning": "Budgeting and planning",
    "entrepreneurship": "Entrepreneurship",
    "leadership": "Leadership",
    "decision_making": "Decision-making",
    "emotional_intelligence": "Emotional intelligence",
    "critical_thinking": "Critical thinking",
    "giving": "Giving",
}


def load_json(path: Path, default=None):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def load_config() -> dict:
    return load_json(CONFIG_PATH)


def load_topics() -> list[dict]:
    return load_json(TOPICS_PATH)["topics"]


def get_topic(topic_id: str) -> dict:
    for t in load_topics():
        if t["id"] == topic_id:
            return t
    raise SystemExit(f"Unknown topic id: {topic_id}")


PENDING_PATH = STATE_DIR / "pending.json"


def load_history() -> dict:
    history = load_json(HISTORY_PATH, {"videos": []})
    # Recovery: entries a run produced but could not save to the state branch
    # are recorded in state/pending.json and merged here until they are saved.
    known = {v["run"] for v in history["videos"]}
    for entry in load_json(PENDING_PATH, {"videos": []})["videos"]:
        if entry["run"] not in known:
            history["videos"].append(entry)
    return history


def save_history(history: dict) -> None:
    save_json(HISTORY_PATH, history)


def website_root(config: dict) -> Path:
    return (STUDIO_ROOT / config.get("website_repo_root", "..")).resolve()


def now_iso() -> str:
    return _dt.datetime.now(_dt.timezone.utc).replace(microsecond=0).isoformat()


_MARK = re.compile(r"\*([^*]+)\*")


def plain(text: str) -> str:
    """Strip *highlight* markup."""
    return _MARK.sub(r"\1", text)


def word_count(text: str) -> int:
    return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'\-]*", plain(text)))


def parse_highlights(text: str) -> list[tuple[str, bool]]:
    """Split text into (word, highlighted) tokens, preserving punctuation on words."""
    tokens: list[tuple[str, bool]] = []
    pos = 0
    for m in _MARK.finditer(text):
        for w in text[pos:m.start()].split():
            tokens.append((w, False))
        for w in m.group(1).split():
            tokens.append((w, True))
        pos = m.end()
    for w in text[pos:].split():
        tokens.append((w, False))
    # Attach punctuation that immediately followed a closing '*' (e.g. "*save money*?")
    merged: list[tuple[str, bool]] = []
    for w, h in tokens:
        if merged and re.fullmatch(r"[.,!?:;\"')]+", w):
            pw, ph = merged[-1]
            merged[-1] = (pw + w, ph)
        else:
            merged.append((w, h))
    return merged
