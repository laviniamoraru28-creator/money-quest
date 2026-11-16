"""Money Quest quote series: one authentic quotation, one educational
connection, one invitation. Calm pastel template, text first.

Data lives in curriculum/quotes.json (quotation, author, source, verification
status, rights note, takeaway, CTA, caption). This module plans, checks and
renders a video for one entry and writes the editorial calendar.

Motion is deliberately gentle (fades and a few pixels of rise, slow
background drift, crossfades) to respect reduced-motion preferences.
"""
from __future__ import annotations

import json
import math
import re
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from . import music
from .common import STUDIO_ROOT, load_json, website_root, word_count

QUOTES_PATH = STUDIO_ROOT / "curriculum" / "quotes.json"
CALENDAR_PATH = STUDIO_ROOT / "QUOTE_CALENDAR.md"
PUBLISHABLE = {"verified"}
WEBSITE_TEXT = "moneyquesteducation.com"

W, H = 1080, 1920
CX = 500                 # centre of TikTok's safe area (x 60..940)
MAX_W = 820
DEEP = "#1F3D37"         # main text
MUTED = "#3F5A53"        # secondary text
CORAL = "#F3A995"        # accents and the link pill (never used for text)
CORAL_MARK = "#E9907A"
SAGE_CHIP = "#BFD6BA"
BACKGROUNDS = {          # vertical gradients: (top, bottom)
    "quote": ("#FBF6EC", "#F3EDE0"),      # cream
    "takeaway": ("#E6EFE2", "#D9E7D6"),   # sage
    "cta": ("#E7F0F6", "#DCE9F2"),        # soft blue
}
BLOBS = [("#BFD3BB", 0.18, 0.20, 420), ("#C5DAEA", 0.86, 0.50, 380), ("#F6C4B4", 0.22, 0.90, 340)]
CROSSFADE = 0.35


def contrast_pairs() -> list[tuple[str, str, str]]:
    """(label, foreground, background) pairs QA must find readable."""
    pairs = []
    for kind, (top, bottom) in BACKGROUNDS.items():
        for bg in (top, bottom):
            pairs += [(f"{kind} text", DEEP, bg), (f"{kind} secondary text", MUTED, bg)]
    for color, *_ in BLOBS[:2]:  # blobs that can sit behind text
        pairs += [("text on background shape", DEEP, color), ("secondary text on background shape", MUTED, color)]
    pairs += [("link pill", DEEP, CORAL), ("label chip", DEEP, SAGE_CHIP)]
    return pairs


# -- data -----------------------------------------------------------------------
def load_quotes() -> list[dict]:
    return load_json(QUOTES_PATH)["quotes"]


def get_quote(ident: str) -> dict:
    for q in load_quotes():
        if str(q["id"]) == str(ident) or q["slug"] == ident:
            return q
    raise SystemExit(f"Unknown quote: {ident}")


def topic_id(q: dict) -> str:
    return f"quote-{q['slug']}"


def next_quote(used_topic_ids: set[str]) -> dict | None:
    for q in load_quotes():
        if q["verification"] in PUBLISHABLE and topic_id(q) not in used_topic_ids:
            return q
    return None


# -- plan ---------------------------------------------------------------------------
def _clamp(x, lo, hi):
    return max(lo, min(hi, x))


def build_plan(q: dict) -> dict:
    d_quote = round(_clamp(0.9 + word_count(q["quote"]) / 3.0, 3.4, 8.5), 2)
    d_take = round(_clamp(0.8 + word_count(q["takeaway"]) / 3.0, 2.8, 4.2), 2)
    d_cta = 3.0
    scenes = [
        {"kind": "quote", "text": q["quote"], "start": 0.0, "duration": d_quote},
        {"kind": "takeaway", "text": q["takeaway"], "start": d_quote, "duration": d_take},
        {"kind": "cta", "text": q["cta"], "start": round(d_quote + d_take, 2), "duration": d_cta},
    ]
    return {"topic_id": topic_id(q), "category": q["pillar"], "quote_id": q["id"],
            "duration": round(d_quote + d_take + d_cta, 2), "scenes": scenes, "caption": build_caption(q)}


def build_caption(q: dict) -> str:
    return "\n".join([
        f"“{q['quote']}” — {q['author']}, {q['source_line']}",
        "",
        q["caption"],
        "",
        f"Explore {q['section']} on Money Quest. Link in bio.",
        "",
        " ".join(q["hashtags"][:5]),
    ])


# -- content QA -------------------------------------------------------------------------
def check_content(q: dict, plan: dict, config: dict) -> dict:
    from . import qa

    errors, warnings = [], []
    for field in ("quote", "author", "source_line", "source", "verification", "rights", "takeaway", "cta", "section", "route", "caption", "hashtags"):
        if not q.get(field):
            errors.append(f"missing field: {field}")
    if q.get("verification") not in PUBLISHABLE:
        errors.append(f"quotation is '{q.get('verification')}': check it against the source and set verification to 'verified' before production")
    # The page the CTA points to must exist in the public website.
    route = q.get("route", "")
    page = website_root(config) / "src" / "app" / "[locale]" / route.strip("/") / "page.tsx"
    if not page.exists():
        errors.append(f"CTA route {route} is not a public page in the website")
    # Our own words: spelling and no exaggerated claims. The quotation itself is verbatim and exempt.
    own = [q.get("takeaway", ""), q.get("cta", ""), q.get("caption", ""), q.get("section", "")]
    errors += qa.check_spelling(own)
    for text in own:
        for pattern, why in qa.GUARDRAILS:
            if re.search(pattern, text, flags=re.I):
                errors.append(f"guardrail ({why}): \"{text[:70]}\"")
    if word_count(q.get("takeaway", "")) > 12:
        errors.append("takeaway longer than 12 words")
    if word_count(q.get("cta", "")) > 9:
        errors.append("CTA longer than 9 words")
    if not 3 <= len(q.get("hashtags", [])) <= 5:
        errors.append("use three to five hashtags")
    wps = word_count(q.get("quote", "")) / plan["scenes"][0]["duration"]
    if wps > 3.3:
        errors.append(f"quotation too long to read comfortably ({wps:.1f} words/s)")
    if not 9 <= plan["duration"] <= 18:
        errors.append(f"duration {plan['duration']}s outside 9-18s")
    elif plan["duration"] > 15.5:
        warnings.append(f"duration {plan['duration']}s is above the preferred 15s (long quotation)")
    return {"errors": errors, "warnings": warnings}


# -- rendering ----------------------------------------------------------------------------
def _hex(c: str, a: int = 255):
    c = c.lstrip("#")
    return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), a)


def _ease(x: float) -> float:
    x = _clamp(x, 0.0, 1.0)
    return 1 - (1 - x) ** 3


def _font(paths: list[str], size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(next(p for p in paths if Path(p).exists()), size)


def _gradient(top: str, bottom: str) -> Image.Image:
    a, b = _hex(top), _hex(bottom)
    col = Image.new("RGB", (1, H))
    for y in range(H):
        k = y / (H - 1)
        col.putpixel((0, y), tuple(int(a[i] + (b[i] - a[i]) * k) for i in range(3)))
    return col.resize((W, H)).convert("RGBA")


def _blob(radius: int, color: str) -> Image.Image:
    size = radius * 2 + 360
    # Blur only the alpha mask: blurring an RGBA image darkens the edges.
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((180, 180, size - 180, size - 180), fill=150)
    img = Image.new("RGBA", (size, size), _hex(color, 0))
    img.putalpha(mask.filter(ImageFilter.GaussianBlur(90)))
    return img


def _wrap(text: str, font, max_w: int) -> list[str]:
    lines, cur = [], ""
    for word in text.split():
        trial = f"{cur} {word}".strip()
        if cur and font.getlength(trial) > max_w:
            lines.append(cur)
            cur = word
        else:
            cur = trial
    if cur:
        lines.append(cur)
    return lines


def _text_img(text: str, font, color: str, spacing: int = 0) -> Image.Image:
    asc, desc = font.getmetrics()
    width = int(sum(font.getlength(ch) for ch in text) + spacing * max(0, len(text) - 1)) if spacing else int(font.getlength(text))
    img = Image.new("RGBA", (width + 8, asc + desc + 8), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if spacing:
        x = 4.0
        for ch in text:
            d.text((x, 4), ch, font=font, fill=_hex(color))
            x += font.getlength(ch) + spacing
    else:
        d.text((4, 4), text, font=font, fill=_hex(color))
    return img


def _with_alpha(img: Image.Image, f: float) -> Image.Image:
    if f >= 0.999:
        return img
    out = img.copy()
    out.putalpha(out.getchannel("A").point(lambda v: int(v * max(0.0, f))))
    return out


def _fit_lines(text: str, font_paths, start: int, minimum: int, max_h: int):
    size = start
    while True:
        font = _font(font_paths, size)
        lines = _wrap(text, font, MAX_W)
        asc, desc = font.getmetrics()
        lh = int((asc + desc) * 1.22)
        if (lh * len(lines) <= max_h and all(font.getlength(l) <= MAX_W for l in lines)) or size <= minimum:
            return font, lines, lh, size
        size -= 2


class _Scene:
    """Elements are (image, x, y, delay_seconds); each fades in and rises 14px."""

    def __init__(self, kind: str, q: dict, fonts: dict, layout: list):
        from .render import _brand_mark  # reuse the Money Quest compass mark

        self.kind = kind
        self.bg = _gradient(*BACKGROUNDS[kind])
        self.elements: list[tuple[Image.Image, int, int, float]] = []
        sans_b, sans_r, serif_b = fonts["bold"], fonts["regular"], fonts["serif_bold"]

        def add(img, y, delay, name, font_size, x=None):
            x = CX - img.width // 2 if x is None else x
            self.elements.append((img, x, y, delay))
            layout.append({"scene": kind, "element": name, "box": [x, y, x + img.width, y + img.height], "font_size": font_size})

        if kind != "cta":  # small brand row
            mark = _brand_mark(48)
            name = _text_img("Money Quest", _font(sans_b, 36), DEEP)
            row = Image.new("RGBA", (48 + 14 + name.width, 56), (0, 0, 0, 0))
            row.alpha_composite(mark, (0, 4))
            row.alpha_composite(name, (62, 2))
            add(row, 210, 0.0, "brand_row", 36)

        if kind == "quote":
            font, lines, lh, size = _fit_lines(q["quote"], serif_b, 96, 60, 640)
            author_f, source_f = _font(sans_b, 46), _font(sans_r, 34)
            source_lines = _wrap(q["source_line"], source_f, MAX_W)
            block_h = lh * len(lines) + 60 + 6 + 44 + 62 + 46 * len(source_lines)
            top = 380 + max(0, (1500 - 380 - 150 - block_h) // 2) + 150
            mark = _text_img("“", _font(serif_b, 300), CORAL_MARK)
            self.elements.append((mark, CX - mark.width // 2, top - 250, 0.0))
            y = top
            for i, line in enumerate(lines):
                add(_text_img(line, font, DEEP), y, 0.25 + 0.12 * i, f"line{i}", size)
                y += lh
            y += 50
            rule = Image.new("RGBA", (120, 6), _hex(CORAL))
            self.elements.append((rule, CX - 60, y, 0.5 + 0.12 * len(lines)))
            y += 44
            add(_text_img(q["author"].upper(), author_f, DEEP, spacing=3), y, 0.6 + 0.12 * len(lines), "author", 46)
            y += 68
            for j, line in enumerate(source_lines):
                add(_text_img(line, source_f, MUTED), y, 0.7 + 0.12 * len(lines), f"source{j}", 34)
                y += 46

        elif kind == "takeaway":
            font, lines, lh, size = _fit_lines(q["takeaway"], sans_b, 92, 64, 700)
            top = 200 + (1500 - 200 - lh * len(lines)) // 2 + 40
            chip_f = _font(sans_b, 34)
            label = _text_img("WHY IT MATTERS FOR CHILDREN", chip_f, DEEP, spacing=2)
            chip = Image.new("RGBA", (label.width + 64, 76), (0, 0, 0, 0))
            ImageDraw.Draw(chip).rounded_rectangle((0, 0, chip.width - 1, 75), radius=38, fill=_hex(SAGE_CHIP))
            chip.alpha_composite(label, (32, 14))
            add(chip, top - 140, 0.15, "label", 34)
            y = top
            for i, line in enumerate(lines):
                add(_text_img(line, font, DEEP), y, 0.3 + 0.14 * i, f"line{i}", size)
                y += lh

        else:  # cta
            mark = _brand_mark(190)
            self.elements.append((mark, CX - 95, 330, 0.0))
            add(_text_img("MONEY QUEST", _font(sans_b, 88), DEEP, spacing=8), 570, 0.15, "wordmark", 88)
            font, lines, lh, size = _fit_lines(q["cta"], serif_b, 70, 56, 260)
            y = 760
            for i, line in enumerate(lines):
                add(_text_img(line, font, DEEP), y, 0.35 + 0.12 * i, f"cta{i}", size)
                y += lh
            y += 46
            pill_text = _text_img("Link in bio", _font(sans_b, 54), DEEP)
            pill = Image.new("RGBA", (pill_text.width + 110, 110), (0, 0, 0, 0))
            ImageDraw.Draw(pill).rounded_rectangle((0, 0, pill.width - 1, 109), radius=55, fill=_hex(CORAL))
            pill.alpha_composite(pill_text, (55, 20))
            add(pill, y, 0.65, "pill", 54)
            y += 170
            add(_text_img(WEBSITE_TEXT, _font(sans_b, 44), DEEP), y, 0.8, "website", 44)

    def frame(self, tau: float, t: float, blobs) -> Image.Image:
        img = self.bg.copy()
        for i, (blob, fx, fy) in enumerate(blobs):
            bx = W * fx + 18 * math.sin(t * 0.25 + i * 2.0) - blob.width / 2
            by = H * fy + 22 * math.cos(t * 0.2 + i * 1.3) - blob.height / 2
            img.paste(blob, (int(bx), int(by)), blob)
        for layer, x, y, delay in self.elements:
            k = _ease((tau - delay * 0.5) / 0.45)
            if k > 0:
                img.alpha_composite(_with_alpha(layer, k), (x, int(y + 14 * (1 - k))))
        return img


def render(q: dict, plan: dict, config: dict, out_dir: Path) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    fps = config["video"]["fps"]
    fonts = config["fonts"]
    layout: list = []
    scenes = [_Scene(s["kind"], q, fonts, layout) for s in plan["scenes"]]
    blobs = [(_blob(r, c), fx, fy) for c, fx, fy, r in BLOBS]
    total = plan["duration"]
    audio = music.generate_calm(total, plan["topic_id"], out_dir / "music.wav", config.get("quote_series", {}).get("music_rms_db", -31.0))
    video_path = out_dir / "video.mp4"
    proc = subprocess.Popen([
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
        "-i", str(audio),
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "high",
        "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-t", f"{total:.3f}", str(video_path),
    ], stdin=subprocess.PIPE)

    def scene_at(t):
        for i, s in enumerate(plan["scenes"]):
            if t < s["start"] + s["duration"]:
                return i
        return len(plan["scenes"]) - 1

    cover_t = min(2.0, plan["scenes"][0]["duration"] - 0.3)
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
        f"QUOTE: {q['quote']}\nAUTHOR: {q['author']} ({q['source_line']})\nSOURCE: {q['source']}\n"
        f"VERIFICATION: {q['verification']} - {q['verification_note']}\nRIGHTS: {q['rights']}\n"
        f"TAKEAWAY: {q['takeaway']}\nCTA: {q['cta']} | MONEY QUEST | {WEBSITE_TEXT} | Link in bio\n"
        f"SECTION: {q['section']} ({q['route']})\nKEYWORDS: {', '.join(q['keywords'])}\n", encoding="utf-8")
    return {"video": str(video_path)}


# -- editorial calendar -----------------------------------------------------------------------
def write_calendar(history: dict) -> Path:
    by_topic = {v["topic_id"]: v for v in history["videos"]}
    doc = load_json(QUOTES_PATH)
    out = ["# Money Quest quote series: editorial calendar", "",
           "Generated from `curriculum/quotes.json` by `python -m studio quote-calendar`. Edit the JSON, not this file.", "",
           "Production status comes from the studio's run history. Nothing is sent to Buffer until a video is approved.", ""]
    for q in doc["quotes"]:
        h = by_topic.get(topic_id(q), {})
        production = {"rendered": "Rendered, awaiting approval", "approved": "Approved", "qa_failed": "QA failed", "draft_in_buffer": "Produced on GitHub Actions, awaiting approval"}.get(h.get("status"), "Published or queued" if h else "Not produced")
        buffer_status = {"sent_to_phone": "Reminder sent", "queued_in_buffer": "Queued", "draft_in_buffer": "Draft", "published": "Published"}.get(h.get("status"), "Not sent")
        out += [
            f"## {q['id']}. {q['author']}: {q['pillar']}", "",
            f"- **Quotation:** “{q['quote']}”",
            f"- **Source:** {q['source']}",
            f"- **Verification:** {'Verified' if q['verification'] == 'verified' else 'Needs print check'}. {q['verification_note']}",
            f"- **Rights:** {q['rights']}",
            f"- **Educational takeaway:** {q['takeaway']}",
            f"- **Final CTA:** {q['cta']} / MONEY QUEST / {WEBSITE_TEXT} / Link in bio",
            f"- **Money Quest section:** {q['section']} (`{q['route']}`)",
            f"- **Caption:** {q['caption']}",
            f"- **Hashtags:** {' '.join(q['hashtags'])}",
            f"- **Search keywords:** {', '.join(q['keywords'])}",
            f"- **Proposed date:** {q['proposed_date']}, {q['proposed_time']}",
            f"- **Production status:** {production}",
            f"- **Buffer status:** {buffer_status}", ""]
    out += ["## Quotations considered and rejected", ""]
    for r in doc.get("rejected", []):
        out.append(f"- “{r['quote']}” ({r['attributed_to']}): {r['reason']}")
    CALENDAR_PATH.write_text("\n".join(out) + "\n", encoding="utf-8")
    return CALENDAR_PATH
