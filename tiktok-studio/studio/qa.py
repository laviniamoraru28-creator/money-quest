"""Quality checks. A video is only eligible for publishing if every check passes.

Content checks (before rendering):
  * spelling (pyspellchecker + a small brand allowlist)
  * educational grounding: every cited quote must still exist in the website source
  * guardrails: no exaggerated scientific claims, no hard-sell language, no financial advice
  * structure: hook, learn, why, tip, explore present; exact brand CTA
  * timing: total 10-20s, on-screen reading speed within limit

Render checks (after rendering):
  * container/codec/resolution/fps/duration/audio
  * every text box inside TikTok's safe zone, minimum font sizes
  * colour contrast of text on the panel
  * sampled frames are not blank; audio is present and not clipping
  * contact sheet for human visual review
"""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

from PIL import Image

from .common import STUDIO_ROOT, load_json, plain, website_root, word_count

ALLOWLIST_PATH = STUDIO_ROOT / "curriculum" / "allowed_words.txt"

# Phrases that would overstate evidence, make promises, or read like an advert.
GUARDRAILS = [
    (r"\bprove[ns]?\b(?! it)", "claims of proof"),
    (r"\bscientifically\b", "scientific overclaim"),
    (r"\bstudies (show|prove)\b|\bresearch (shows|proves)\b", "unsourced research claim"),
    (r"\bguarantee[ds]?\b", "guarantee"),
    (r"\bbrain (development|power|boost)\b|\bboost(s)? (iq|intelligence)\b", "neuro overclaim"),
    (r"\b(smarter|genius|rich|wealthy|millionaire)\b", "outcome promise"),
    (r"\bwill (make|turn) your child\b", "outcome promise"),
    (r"\b(buy now|sign up now|limited time|discount|sale ends|best app)\b", "hard sell"),
    (r"\byou should (invest|buy)\b|\bwe recommend (buying|investing)\b", "financial advice"),
    (r"[£$€¥]", "real currency symbol (site uses fictional coins)"),
]


def _norm(s: str) -> str:
    s = s.replace("—", "-").replace("–", "-").replace("’", "'")
    return re.sub(r"\s+", " ", s).strip()


def _resolve(data, path: str):
    cur = data
    for part in path.split("."):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return None
    return cur


def check_sources(topic: dict, config: dict) -> list[str]:
    errors = []
    root = website_root(config)
    if not topic.get("sources"):
        return ["no sources cited"]
    for src in topic["sources"]:
        f = root / src["file"]
        if not f.exists():
            errors.append(f"source file missing: {src['file']}")
            continue
        if src.get("path"):
            node = _resolve(load_json(f), src["path"])
            if node is None:
                errors.append(f"source path missing: {src['file']}#{src['path']}")
                continue
            haystack = json.dumps(node, ensure_ascii=False) if not isinstance(node, str) else node
            if not isinstance(node, str):
                haystack = " ".join(_strings(node))
        else:
            haystack = f.read_text(encoding="utf-8")
        if _norm(src["quote"]) not in _norm(haystack):
            errors.append(f"quote no longer found in {src['file']}{'#' + src['path'] if src.get('path') else ''}: \"{src['quote'][:60]}...\"")
    return errors


def _strings(node):
    if isinstance(node, str):
        yield node
    elif isinstance(node, dict):
        for v in node.values():
            yield from _strings(v)
    elif isinstance(node, list):
        for v in node:
            yield from _strings(v)


def check_spelling(texts: list[str]) -> list[str]:
    from spellchecker import SpellChecker

    sc = SpellChecker()
    allowed = set()
    if ALLOWLIST_PATH.exists():
        allowed = {w.strip().lower() for w in ALLOWLIST_PATH.read_text().splitlines() if w.strip() and not w.startswith("#")}
    words = []
    for t in texts:
        t = re.sub(r"#\w+", " ", plain(t))  # hashtags are checked by eye, not by dictionary
        for w in re.findall(r"[A-Za-z][A-Za-z'\-]*", t):
            for part in w.split("-"):
                part = part.strip("'")
                if part.endswith("'s"):
                    part = part[:-2]
                if len(part) > 1:
                    words.append(part.lower())
    unknown = sorted({w for w in sc.unknown(words) if w not in allowed})
    return [f"possible misspelling: {w}" for w in unknown]


def check_content(topic: dict, plan: dict, config: dict) -> dict:
    errors, warnings = [], []
    for field in ("hook", "reframe", "analogy", "steps", "why", "question", "learn", "tip", "explore", "category"):
        if not topic.get(field):
            errors.append(f"missing field: {field}")
    root = website_root(config)
    for img in topic.get("images", []):
        if not (root / img).exists():
            errors.append(f"image not found: {img}")
    errors += check_sources(topic, config)

    texts = [topic.get(k, "") for k in ("hook", "reframe", "analogy", "why", "question", "learn", "tip", "explore")] + list(topic.get("steps", [])) + config["brand"]["cta_lines"]
    errors += check_spelling(texts + [plan["caption"]])

    for text in texts + [plan["caption"]]:
        for pattern, why in GUARDRAILS:
            if re.search(pattern, plain(text), flags=re.I):
                errors.append(f"guardrail ({why}): \"{plain(text)[:70]}\"")

    cta = plan["scenes"][-1]
    if cta["kind"] != "cta" or cta["lines"] != ["Help your child build real-life skills.", "Explore Money Quest.", "Link in bio."]:
        errors.append("final scene must carry the exact brand CTA")
    steps = topic.get("steps", [])
    if len(steps) != 3 or any(word_count(st) > 10 for st in steps):
        errors.append("exercise must be exactly 3 steps of at most 10 words each")
    if not plain(topic.get("question", "")).rstrip('"').endswith("?"):
        errors.append("closing question must end with a question mark")
    if word_count(topic.get("hook", "")) > 12:
        errors.append("hook longer than 12 words")
    if not plan["scenes"][0]["text"].rstrip("*\" ").endswith(("?", "!", ".")):
        warnings.append("hook does not end with punctuation")

    vcfg = config["video"]
    if not (vcfg["min_seconds"] <= plan["duration"] <= vcfg["max_seconds"]):
        errors.append(f"duration {plan['duration']}s outside {vcfg['min_seconds']}-{vcfg['max_seconds']}s")
    for s in plan["scenes"][:-1]:
        wps = word_count(s["text"]) / s["duration"]
        if wps > vcfg["max_words_per_second"]:
            errors.append(f"{s['kind']} reads too fast ({wps:.1f} words/s)")
    if len(plan["caption"]) > 2200:
        errors.append("caption over TikTok's 2200 character limit")
    return {"errors": errors, "warnings": warnings}


# ---------------------------------------------------------------------------
def _luminance(hex_color: str) -> float:
    c = hex_color.lstrip("#")
    rgb = [int(c[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in rgb]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def contrast(a: str, b: str) -> float:
    la, lb = sorted([_luminance(a), _luminance(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)


def _probe(path: Path) -> dict:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)], capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def _volume(path: Path) -> tuple[float, float]:
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "volumedetect", "-vn", "-f", "null", "-"], capture_output=True, text=True)
    mean = float(re.search(r"mean_volume: (-?[\d.]+)", out.stderr).group(1))
    peak = float(re.search(r"max_volume: (-?[\d.]+)", out.stderr).group(1))
    return mean, peak


def _frame(path: Path, t: float, dest: Path) -> Image.Image:
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{t:.2f}", "-i", str(path), "-frames:v", "1", str(dest)], check=True)
    return Image.open(dest).convert("RGB")


def check_render(out_dir: Path, plan: dict, config: dict, contrast_pairs=None, min_font: int = 64, limits=None) -> dict:
    errors, warnings = [], []
    video = out_dir / "video.mp4"
    if not video.exists():
        return {"errors": ["video.mp4 missing"], "warnings": []}
    info = _probe(video)
    v = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
    a = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    vc = config["video"]
    if not v or v["codec_name"] != "h264" or v.get("pix_fmt") != "yuv420p":
        errors.append("video stream must be H.264 yuv420p")
    if v and (int(v["width"]), int(v["height"])) != (vc["width"], vc["height"]):
        errors.append(f"resolution {v['width']}x{v['height']} is not {vc['width']}x{vc['height']}")
    if v and eval(v["r_frame_rate"]) != vc["fps"]:  # noqa: S307 - ffprobe fraction like "30/1"
        errors.append(f"frame rate {v['r_frame_rate']} is not {vc['fps']}")
    if not a or a["codec_name"] != "aac":
        errors.append("missing AAC audio track")
    dur = float(info["format"]["duration"])
    lo, hi = limits or (vc["min_seconds"], vc["max_seconds"])
    if abs(dur - plan["duration"]) > 0.25 or not (lo <= dur <= hi + 0.05):
        errors.append(f"rendered duration {dur:.2f}s does not match plan / limits")
    size_mb = int(info["format"]["size"]) / 1e6
    if size_mb > 50:
        warnings.append(f"file is {size_mb:.1f} MB")

    sz = vc["safe_zone"]
    x_min, x_max, y_min, y_max = sz["left"], vc["width"] - sz["right"], sz["top"], vc["height"] - sz["bottom"]
    for item in json.loads((out_dir / "layout.json").read_text()):
        x0, y0, x1, y1 = item["box"]
        if x0 < x_min or x1 > x_max or y0 < y_min or y1 > y_max:
            errors.append(f"{item['scene']}/{item['element']} outside TikTok safe zone: {item['box']}")
        fs = item.get("font_size")
        if fs and item["element"].startswith("line") and fs < min_font:
            errors.append(f"{item['scene']} text shrank to {fs}px (too small on a phone)")

    if contrast_pairs is None:
        from .render import PALETTES

        contrast_pairs = []
        for kind, pal in PALETTES.items():
            for bg in pal["bg"]:
                contrast_pairs.append((f"{kind} text", pal["text"], bg))
                contrast_pairs.append((f"{kind} highlight", pal["hl"], pal["pill"] or bg))
    for name, fg, back in contrast_pairs:
        ratio = contrast(fg, back)
        if ratio < 4.5:
            errors.append(f"{name} contrast {ratio:.2f}:1 < 4.5:1")

    mean, peak = _volume(video)
    if peak > -0.3:
        errors.append(f"audio clipping (peak {peak} dB)")
    if mean < -45:
        errors.append(f"audio nearly silent (mean {mean} dB)")

    frames_dir = out_dir / "frames"
    frames_dir.mkdir(exist_ok=True)
    thumbs = []
    for i, s in enumerate(plan["scenes"]):
        t = s["start"] + min(s["duration"] - 0.2, max(1.2, s["duration"] * 0.7))
        img = _frame(video, t, frames_dir / f"{i:02d}-{s['kind']}.png")
        stat = sum(img.convert("L").resize((54, 96)).getdata()) / (54 * 96)
        if stat < 12:
            errors.append(f"scene {s['kind']} frame looks blank (mean luma {stat:.0f})")
        thumbs.append(img.resize((360, 640)))
    sheet = Image.new("RGB", (360 * len(thumbs) + 10 * (len(thumbs) + 1), 660), (20, 20, 20))
    for i, th in enumerate(thumbs):
        sheet.paste(th, (10 + i * 370, 10))
    sheet.save(out_dir / "contact_sheet.jpg", quality=88)
    return {"errors": errors, "warnings": warnings, "probe": {"duration": dur, "size_mb": round(size_mb, 2), "audio_mean_db": mean, "audio_peak_db": peak}}


def report(out_dir: Path, content: dict, render_result: dict | None) -> dict:
    result = {
        "content": content,
        "render": render_result,
        "passed": not content["errors"] and (render_result is None or not render_result["errors"]),
    }
    (out_dir / "qa_report.json").write_text(json.dumps(result, indent=2, ensure_ascii=False))
    return result
