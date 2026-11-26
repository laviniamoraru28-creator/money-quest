"""Money Quest short-form template, version 2: hook, value, practical
takeaway, engagement close.

One template serves four content categories (curriculum/shorts.json):
  quotation  - a verified quotation from curriculum/quotes.json plus an action
  question   - an interactive question for parents
  activity   - a simple money activity in steps
  mistake    - a common mistake and what to try instead

Every video opens with a hook scene and ends with a close scene. The
composition changes every 2-3 seconds, each screen carries one idea, and a
simple drawn icon gives the eye something to follow. Motion stays gentle:
word-by-word text, a slow icon float and short crossfades.
"""
from __future__ import annotations

import json
import math
import re
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw

from . import music, quotes
from .common import STUDIO_ROOT, load_json, website_root, word_count
from .quotes import (BACKGROUNDS, BLOBS, CORAL, CX, DEEP, H, MAX_W, MUTED, SAGE_CHIP, W, _blob, _clamp, _ease, _fit_lines,
                     _font, _gradient, _hex, _text_img, _with_alpha, _wrap)

def _ease_punch(x: float) -> float:
    """easeOutBack: overshoots past 1.0 then settles - the "pop" a hook or
    close line scales in with, instead of just rising into place. Used only
    for the handful of elements marked punch=True below (hook/close main
    text, icons); everything else keeps the original gentle fade+rise so
    one video is not wall-to-wall motion."""
    x = _clamp(x, 0.0, 1.0)
    c1, c3 = 1.70158, 1.70158 + 1
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2

SHORTS_PATH = STUDIO_ROOT / "curriculum" / "shorts.json"
CATEGORIES = ("quotation", "question", "activity", "mistake")
BRAND = "Money Quest Academy"
WEBSITE_TEXT = "moneyquesteducation.com"
BG_FOR = {"hook": "hook", "quote": "quote", "idea": "quote", "options": "cta", "step": "quote", "mistake": "hook",
          "fix": "takeaway", "action": "takeaway", "close": "cta"}
CHIP_FOR = {"action": "TRY THIS AT HOME", "mistake": "COMMON MISTAKE", "fix": "TRY THIS INSTEAD"}
GOLD, BLUE, CREAM, SAGE = "#E8A33D", "#C5DAEA", "#FBF6EC", "#BFD6BA"
CROSSFADE = 0.3


# -- icons: simple flat drawings, no third-party artwork -------------------------------
def icon(name: str, size: int = 230) -> Image.Image:
    s = size * 3
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    line, lw = _hex(DEEP), max(6, s // 46)
    u = s / 100

    def box(x0, y0, x1, y1):
        return (x0 * u, y0 * u, x1 * u, y1 * u)

    def coin(cx, cy, r):
        d.ellipse(box(cx - r, cy - r, cx + r, cy + r), fill=_hex(GOLD), outline=line, width=lw)
        d.ellipse(box(cx - r * 0.55, cy - r * 0.55, cx + r * 0.55, cy + r * 0.55), outline=_hex("#B9771E"), width=max(3, lw // 2))

    if name == "jar":
        d.rounded_rectangle(box(22, 26, 78, 92), radius=12 * u, fill=_hex(CREAM), outline=line, width=lw)
        d.rounded_rectangle(box(28, 12, 72, 28), radius=5 * u, fill=_hex(CORAL), outline=line, width=lw)
        for cx, cy in ((38, 78), (56, 80), (47, 66), (64, 68)):
            coin(cx, cy, 9)
    elif name == "coins":
        for i in range(4):
            y = 78 - i * 12
            d.ellipse(box(18, y - 8, 62, y + 8), fill=_hex(GOLD), outline=line, width=lw)
        coin(72, 40, 15)
    elif name == "bag":
        d.arc(box(34, 8, 66, 44), 180, 360, fill=line, width=lw)
        d.rounded_rectangle(box(20, 30, 80, 90), radius=8 * u, fill=_hex(CORAL), outline=line, width=lw)
        d.ellipse(box(36, 40, 42, 46), fill=line)
        d.ellipse(box(58, 40, 64, 46), fill=line)
    elif name == "tags":
        for (x, y, fill) in ((14, 20, SAGE), (38, 44, CORAL)):
            d.rounded_rectangle(box(x, y, x + 48, y + 34), radius=7 * u, fill=_hex(fill), outline=line, width=lw)
            d.ellipse(box(x + 6, y + 13, x + 14, y + 21), fill=_hex(CREAM), outline=line, width=max(3, lw // 2))
            d.line(box(x + 22, y + 12, x + 40, y + 12), fill=line, width=lw)
            d.line(box(x + 22, y + 22, x + 34, y + 22), fill=line, width=lw)
    elif name == "bulb":
        d.ellipse(box(24, 10, 76, 62), fill=_hex(GOLD), outline=line, width=lw)
        d.rounded_rectangle(box(38, 58, 62, 80), radius=4 * u, fill=_hex(CREAM), outline=line, width=lw)
        d.line(box(40, 68, 60, 68), fill=line, width=lw)
        d.line(box(44, 88, 56, 88), fill=line, width=lw)
    elif name == "heart":
        d.polygon([(50 * u, 88 * u), (12 * u, 46 * u), (50 * u, 30 * u), (88 * u, 46 * u)], fill=_hex(CORAL))
        d.ellipse(box(10, 16, 54, 60), fill=_hex(CORAL))
        d.ellipse(box(46, 16, 90, 60), fill=_hex(CORAL))
    elif name in ("question", "check", "cross"):
        fill = {"question": BLUE, "check": SAGE, "cross": CORAL}[name]
        d.ellipse(box(10, 10, 90, 90), fill=_hex(fill), outline=line, width=lw)
        w2 = lw * 2
        if name == "check":
            d.line([(30 * u, 52 * u), (45 * u, 66 * u), (70 * u, 36 * u)], fill=line, width=w2, joint="curve")
        elif name == "cross":
            d.line(box(34, 34, 66, 66), fill=line, width=w2)
            d.line(box(66, 34, 34, 66), fill=line, width=w2)
        else:
            d.arc(box(36, 26, 64, 54), 180, 90, fill=line, width=w2)
            d.line(box(50, 54, 50, 62), fill=line, width=w2)
            d.ellipse(box(46, 70, 54, 78), fill=line)
    elif name == "target":
        for r, fill in ((40, CORAL), (27, CREAM), (14, CORAL)):
            d.ellipse(box(50 - r, 50 - r, 50 + r, 50 + r), fill=_hex(fill), outline=line, width=lw)
    elif name == "list":
        d.rounded_rectangle(box(22, 12, 78, 92), radius=7 * u, fill=_hex(CREAM), outline=line, width=lw)
        for i, y in enumerate((34, 52, 70)):
            d.rounded_rectangle(box(30, y - 6, 42, y + 6), radius=2 * u, fill=_hex(SAGE if i < 2 else CREAM), outline=line, width=max(3, lw // 2))
            d.line(box(48, y, 70, y), fill=line, width=lw)
    else:
        raise ValueError(f"unknown icon {name}")
    return img.resize((size, size), Image.LANCZOS)


ICONS = ("jar", "coins", "bag", "tags", "bulb", "heart", "question", "check", "cross", "target", "list")


# -- data ---------------------------------------------------------------------------------
def load_shorts() -> list[dict]:
    return load_json(SHORTS_PATH)["videos"]


def calendar() -> list[str]:
    return load_json(SHORTS_PATH).get("calendar", [])


def next_short(used_topic_ids: set[str]) -> dict | None:
    for ident in calendar():
        if ident not in used_topic_ids:
            return get_short(ident)
    return None


def get_short(ident: str) -> dict:
    for v in load_shorts():
        if v["id"].lower() == str(ident).lower():
            return v
    raise SystemExit(f"Unknown video id: {ident}")


def _scene_text(scene: dict) -> str:
    if scene["kind"] == "quote":
        return quotes.get_quote(scene["quote_id"])["quote"]
    if scene["kind"] == "options":
        return " ".join(o["label"] for o in scene["options"]) + " " + scene.get("note", "")
    return scene["text"]


def build_plan(v: dict) -> dict:
    scenes, t = [], 0.0
    specs = [{"kind": "hook", "text": v["hook"], "icon": v.get("icon"), "hot_word": v.get("hot_word")}] + v["scenes"]
    steps = sum(1 for s in specs if s["kind"] == "step")
    n_step = 0
    for spec in specs:
        text = _scene_text(spec)
        words = word_count(text)
        kind = spec["kind"]
        if kind == "hook":
            dur = _clamp(0.7 + words / 3.2, 1.8, 3.0)
        elif kind == "quote":
            dur = _clamp(0.9 + words / 3.0, 3.2, 8.5)
        elif kind == "options":
            dur = 3.8
        elif kind == "close":
            dur = _clamp(0.9 + words / 3.2, 2.0, 3.0)
        else:
            dur = _clamp(0.6 + words / 3.2, 2.0, 5.0)
        scene = {**spec, "text": text, "start": round(t, 2), "duration": round(dur, 2)}
        if kind == "step":
            n_step += 1
            scene["chip"] = f"STEP {n_step} OF {steps}"
        scenes.append(scene)
        t += round(dur, 2)
    return {"topic_id": v["id"], "video_id": v["id"], "category": v["category"], "duration": round(t, 2), "scenes": scenes,
            "caption": build_caption(v)}


def build_caption(v: dict) -> str:
    return "\n".join([v["description"], "", " ".join(v["hashtags"][:5])])


# -- content QA -------------------------------------------------------------------------------
def check_content(v: dict, plan: dict, config: dict) -> dict:
    from . import qa

    errors, warnings = [], []
    for field in ("id", "category", "cover_title", "hook", "scenes", "description", "hashtags", "section", "route"):
        if not v.get(field):
            errors.append(f"missing field: {field}")
    if v.get("category") not in CATEGORIES:
        errors.append(f"category must be one of {CATEGORIES}")
    if not re.fullmatch(r"MQ-[QIAM]-\d{3}", v.get("id", "")):
        errors.append("id must look like MQ-Q-001 (Q quotation, I question, A activity, M mistake)")
    kinds = [s["kind"] for s in v.get("scenes", [])]
    if not kinds or kinds[-1] != "close":
        errors.append("the last scene must be a close (question or call to action)")
    if "action" not in kinds and "fix" not in kinds:
        errors.append("the video needs a practical takeaway (an action or fix scene)")
    if word_count(v.get("hook", "")) > 9:
        errors.append("hook longer than 9 words")

    own = [v.get("hook", ""), v.get("cover_title", ""), v.get("description", "")]
    for s in v.get("scenes", []):
        if s["kind"] == "quote":
            q = quotes.get_quote(s["quote_id"])
            if q["verification"] not in quotes.PUBLISHABLE:
                errors.append(f"quotation {q['id']} is not verified")
        elif s["kind"] == "options":
            own += [o["label"] for o in s["options"]] + [s.get("note", "")]
        else:
            own.append(s["text"])
        if s.get("icon") and s["icon"] not in ICONS:
            errors.append(f"unknown icon {s['icon']}")
    # An optional single emphasis word on the hook or a close scene - the
    # only kinds that render as big punched-in text - and it must be a word
    # actually in that text (never invented here, never silently ignored).
    for owner, text in [(v, v.get("hook", ""))] + [(s, s.get("text", "")) for s in v.get("scenes", []) if s["kind"] == "close"]:
        hot = owner.get("hot_word")
        if hot is None:
            continue
        words_in_text = {w.strip(".,!?").lower() for w in text.split()}
        if hot.lower() not in words_in_text:
            errors.append(f"hot_word \"{hot}\" is not one of the words in \"{text}\"")
    if v.get("category") == "quotation" and "quote" not in kinds:
        errors.append("a quotation video needs a quote scene")
    errors += qa.check_spelling(own)
    for text in own:
        for pattern, why in qa.GUARDRAILS:
            if "currency" in why:  # real amounts such as £5 are allowed in advice for parents
                continue
            if re.search(pattern, text, flags=re.I):
                errors.append(f"guardrail ({why}): \"{text[:70]}\"")
    # Ideas that are not quotations must be grounded in published Money Quest content.
    if v.get("category") != "quotation":
        errors += qa.check_sources(v, config)
    page = website_root(config) / "src" / "app" / "[locale]" / v.get("route", "").strip("/") / "page.tsx"
    if not page.exists():
        errors.append(f"route {v.get('route')} is not a public page in the website")
    if not 3 <= len(v.get("hashtags", [])) <= 5:
        errors.append("use three to five hashtags")
    for s in plan["scenes"]:
        if word_count(s["text"]) / s["duration"] > 3.3:
            errors.append(f"{s['kind']} scene reads too fast")
        if s["kind"] != "quote" and word_count(s["text"]) > 16:
            errors.append(f"{s['kind']} scene has more than 16 words: one idea per screen")
    if not 8 <= plan["duration"] <= 22:
        errors.append(f"duration {plan['duration']}s outside 8-22s")
    # Hooks and takeaways are never repeated; a closing line may serve at most three videos.
    def key(text):
        return re.sub(r"\W+", " ", text.lower()).strip()
    mine = {("hook", key(v["hook"]))} | {(s["kind"], key(s.get("text", ""))) for s in v["scenes"] if s["kind"] in ("close", "action")}
    counts: dict[tuple, int] = {}
    for other in load_shorts():
        for item in {("hook", key(other["hook"]))} | {(s["kind"], key(s.get("text", ""))) for s in other["scenes"] if s["kind"] in ("close", "action")}:
            counts[item] = counts.get(item, 0) + 1
    for kind, text in mine:
        if counts.get((kind, text), 0) > (3 if kind == "close" else 1):
            errors.append(f"repeated {kind} text: \"{text}\"")
    return {"errors": errors, "warnings": warnings}


def check_overlaps(layout: list) -> list[str]:
    """No two text or icon boxes in the same scene may overlap."""
    errors = []
    by_scene: dict[str, list] = {}
    for item in layout:
        by_scene.setdefault(item["scene"], []).append(item)
    for scene, items in by_scene.items():
        for i, a in enumerate(items):
            for b in items[i + 1:]:
                ax0, ay0, ax1, ay1 = a["box"]
                bx0, by0, bx1, by1 = b["box"]
                if min(ax1, bx1) - max(ax0, bx0) > 4 and min(ay1, by1) - max(ay0, by0) > 4:
                    errors.append(f"{scene}: {a['element']} overlaps {b['element']}")
    return errors


# -- rendering -----------------------------------------------------------------------------------
class _Scene:
    """Elements: (image, x, y, delay, floats). Each fades in and rises; icons float gently."""

    def __init__(self, idx: int, scene: dict, fonts: dict, layout: list):
        from .render import _brand_mark

        kind = scene["kind"]
        self.name = f"{idx:02d}-{kind}"
        self.bg = _gradient(*BACKGROUNDS[BG_FOR[kind]])
        self.elements: list[tuple] = []
        sans_b, sans_r, serif_b = fonts["bold"], fonts["regular"], fonts["serif_bold"]

        def add(img, y, delay, name, font_size=None, x=None, floats=False, punch=False):
            x = CX - img.width // 2 if x is None else x
            self.elements.append((img, x, y, delay, floats, punch))
            layout.append({"scene": self.name, "element": name, "box": [x, y, x + img.width, y + img.height], "font_size": font_size})

        def words(lines, font, y, lh, start, step, name, size, punch=False, hot_word=None):
            space = font.getlength(" ")
            n = 0
            for i, line in enumerate(lines):
                parts = line.split()
                line_w = sum(font.getlength(w) for w in parts) + space * (len(parts) - 1)
                x = CX - line_w / 2
                layout.append({"scene": self.name, "element": f"{name}{i}", "box": [int(x), y, int(x + line_w) + 8, y + lh], "font_size": size})
                for w in parts:
                    # One word per hook/close line may be marked as the single
                    # emphasis word (picked by the content author in shorts.json,
                    # never guessed here) and renders in the accent gold instead
                    # of the usual ink color - a highlight, not a new claim.
                    color = HOT_WORD_COLOR if hot_word and w.strip(".,!?").lower() == hot_word.lower() else DEEP
                    self.elements.append((_text_img(w, font, color), int(x) - 4, y, start + step * n, False, punch))
                    x += font.getlength(w) + space
                    n += 1
                y += lh
            return y, start + step * n

        def chip_img(label, fill=SAGE_CHIP):
            text = _text_img(label, _font(sans_b, 34), DEEP, spacing=2)
            img = Image.new("RGBA", (text.width + 64, 76), (0, 0, 0, 0))
            ImageDraw.Draw(img).rounded_rectangle((0, 0, img.width - 1, 75), radius=38, fill=_hex(fill))
            img.alpha_composite(text, (32, 14))
            return img

        # Subtle branding on every screen except the close, which carries the full brand line.
        if kind != "close":
            mark, name = _brand_mark(44), _text_img(BRAND, _font(sans_b, 32), DEEP)
            row = Image.new("RGBA", (44 + 12 + name.width, 52), (0, 0, 0, 0))
            row.alpha_composite(mark, (0, 4))
            row.alpha_composite(name, (56, 2))
            add(row, 208, 0.0, "brand_row", 32)

        # Build the stack top to bottom, then centre it in the safe area.
        stack: list[tuple] = []  # (builder, height)
        ic = scene.get("icon")
        chip = scene.get("chip") or CHIP_FOR.get(kind)
        if kind == "mistake":
            ic = ic or "cross"
        if kind == "fix":
            ic = ic or "check"

        if kind == "options":
            card_w, card_h, gap = 780, 170, 28
            total = len(scene["options"]) * (card_h + gap) - gap + (90 if scene.get("note") else 0)
            y = 330 + (1480 - 330 - total) // 2
            for i, opt in enumerate(scene["options"]):
                card = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
                ImageDraw.Draw(card).rounded_rectangle((0, 0, card_w - 1, card_h - 1), radius=44, fill=_hex(CREAM), outline=_hex(DEEP), width=5)
                card.alpha_composite(icon(opt["icon"], 120), (36, 25))
                label = _text_img(opt["label"], _font(sans_b, 72), DEEP)
                card.alpha_composite(label, (190, (card_h - label.height) // 2))
                add(card, y, 0.2 + 0.7 * i, f"option{i}", 72)
                y += card_h + gap
            if scene.get("note"):
                note = _text_img(scene["note"], _font(sans_b, 60), DEEP)
                add(note, y + 16, 0.2 + 0.7 * len(scene["options"]), "line_note", 60)
            return

        if kind == "quote":
            q = quotes.get_quote(scene["quote_id"])
            font, lines, lh, size = _fit_lines(q["quote"], serif_b, 92, 60, 600)
            source_f = _font(sans_r, 34)
            source_lines = _wrap(q["source_line"], source_f, MAX_W)
            block = lh * len(lines) + 50 + 44 + 66 + 46 * len(source_lines)
            y = 330 + (1480 - 330 - block) // 2
            mark = _text_img("“", _font(serif_b, 220), quotes.CORAL_MARK)
            self.elements.append((mark, CX - mark.width // 2, y - 190, 0.0, False, False))
            y, after = words(lines, font, y, lh, 0.2, 0.13, "line", size)
            y += 44
            self.elements.append((Image.new("RGBA", (120, 6), _hex(CORAL)), CX - 60, y, after + 0.1, False, False))
            y += 40
            add(_text_img(q["author"].upper(), _font(sans_b, 46), DEEP, spacing=3), y, after + 0.2, "author", 46)
            y += 66
            for j, line in enumerate(source_lines):
                add(_text_img(line, source_f, MUTED), y, after + 0.3, f"source{j}", 34)
                y += 46
            return

        big = kind in ("hook", "close")
        font, lines, lh, size = _fit_lines(scene["text"], sans_b, 112 if big else 88, 72 if big else 60, 620)
        icon_h = 250 if ic else 0
        chip_h = 110 if chip else 0
        brand_h = 250 if kind == "close" else 0
        block = icon_h + chip_h + lh * len(lines) + brand_h
        y = 330 + (1480 - 330 - block) // 2
        if ic:
            add(icon(ic, 210), y, 0.0, "icon", floats=True, punch=big)
            y += icon_h
        if chip:
            add(chip_img(chip), y, 0.1, "chip", 34)
            y += chip_h
        y, after = words(lines, font, y, lh, 0.0 if kind == "hook" else 0.2, 0.15, "line", size,
                          punch=big, hot_word=scene.get("hot_word"))
        if kind == "close":
            y += 70
            mark, name = _brand_mark(54), _text_img(BRAND, _font(sans_b, 44), DEEP)
            row = Image.new("RGBA", (54 + 14 + name.width, 62), (0, 0, 0, 0))
            row.alpha_composite(mark, (0, 4))
            row.alpha_composite(name, (68, 2))
            add(row, y, after + 0.2, "brand", 44)
            y += 80
            add(_text_img(f"{WEBSITE_TEXT}  ·  link in bio", _font(sans_r, 36), MUTED), y, after + 0.3, "website", 36)

    def frame(self, tau: float, t: float, blobs) -> Image.Image:
        img = self.bg.copy()
        for i, (blob, fx, fy) in enumerate(blobs):
            bx = W * fx + 18 * math.sin(t * 0.25 + i * 2.0) - blob.width / 2
            by = H * fy + 22 * math.cos(t * 0.2 + i * 1.3) - blob.height / 2
            img.paste(blob, (int(bx), int(by)), blob)
        for layer, x, y, delay, floats, punch in self.elements:
            start = (tau - delay * 0.5)
            if punch:
                # Scale-in "pop" for a hook/close line or its icon: opacity
                # reaches full quickly (0.14s) so the word is readable almost
                # at once, while the scale continues to settle from a slight
                # overshoot back to 1.0 over 0.32s - the "impact" entrance the
                # brief asked for, in place of the plain fade+rise every other
                # element on screen still uses.
                k = _ease(_clamp(start / 0.14, 0.0, 1.0))
                s = 0.55 + 0.45 * _ease_punch(_clamp(start / 0.32, 0.0, 1.0))
                if k <= 0:
                    continue
                cx, cy = x + layer.width / 2, y + layer.height / 2
                scaled = layer if abs(s - 1.0) < 0.01 else layer.resize(
                    (max(1, int(layer.width * s)), max(1, int(layer.height * s))), Image.LANCZOS)
                px, py = int(cx - scaled.width / 2), int(cy - scaled.height / 2)
                img.alpha_composite(_with_alpha(scaled, k), (px, py))
                continue
            k = _ease(start / 0.28)
            if k > 0:
                dy = 14 * (1 - k) + (7 * math.sin(t * 2.2) if floats else 0)
                img.alpha_composite(_with_alpha(layer, k), (x, int(y + dy)))
        return img


HOT_WORD_COLOR = "#5B3D85"  # brand purple (config.json) - passes 4.5:1 against every hook/close background


def contrast_pairs() -> list[tuple[str, str, str]]:
    hook_top, hook_bottom = BACKGROUNDS["hook"]
    cta_top, cta_bottom = BACKGROUNDS["cta"]
    return quotes.contrast_pairs() + [("option card", DEEP, CREAM)] + [
        (f"hot word on {bg}", HOT_WORD_COLOR, color)
        for bg, color in (("hook top", hook_top), ("hook bottom", hook_bottom), ("close top", cta_top), ("close bottom", cta_bottom))
    ]


def render(v: dict, plan: dict, config: dict, out_dir: Path) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    fps = config["video"]["fps"]
    layout: list = []
    scenes = [_Scene(i, s, config["fonts"], layout) for i, s in enumerate(plan["scenes"])]
    blobs = [(_blob(r, c), fx, fy) for c, fx, fy, r in BLOBS]
    total = plan["duration"]
    audio = music.generate_calm(total, plan["topic_id"], out_dir / "music.wav", config.get("quote_series", {}).get("music_rms_db", -31.0))
    video_path = out_dir / "video.mp4"
    proc = subprocess.Popen([
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-", "-i", str(audio),
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "high",
        "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-t", f"{total:.3f}", str(video_path),
    ], stdin=subprocess.PIPE)

    def scene_at(t):
        for i, s in enumerate(plan["scenes"]):
            if t < s["start"] + s["duration"]:
                return i
        return len(plan["scenes"]) - 1

    cover_t = min(1.5, plan["scenes"][0]["duration"] - 0.2)
    for n in range(int(round(total * fps))):
        t = n / fps
        i = scene_at(t)
        tau = t - plan["scenes"][i]["start"]
        frame = scenes[i].frame(tau, t, blobs)
        if i > 0 and tau < CROSSFADE:
            prev = scenes[i - 1].frame(t - plan["scenes"][i - 1]["start"], t, blobs)
            frame = Image.blend(prev, frame, _ease(tau / CROSSFADE))
        rgb = frame.convert("RGB")
        if abs(t - cover_t) < 0.5 / fps:
            rgb.save(out_dir / "cover.jpg", quality=92)
        proc.stdin.write(rgb.tobytes())
    proc.stdin.close()
    if proc.wait() != 0:
        raise RuntimeError("ffmpeg failed")
    (out_dir / "layout.json").write_text(json.dumps(layout, indent=2))
    (out_dir / "plan.json").write_text(json.dumps(plan, indent=2, ensure_ascii=False))
    (out_dir / "caption.txt").write_text(plan["caption"] + "\n", encoding="utf-8")
    (out_dir / "script.txt").write_text(
        f"ID: {v['id']}\nCATEGORY: {v['category']}\nCOVER TITLE: {v['cover_title']}\n"
        + "".join(f"[{s['start']:.1f}s +{s['duration']:.1f}s] {s['kind'].upper()}: {s['text']}\n" for s in plan["scenes"])
        + f"SECTION: {v['section']} ({v['route']})\n", encoding="utf-8")
    return {"video": str(video_path)}
