"""Renders a scene plan to a vertical 1080x1920 MP4: text only, no images.

Each scene is a bold colour card with very large text that pops in word by
word. Scenes push upward into the next one. Frames are composed with Pillow
and piped to ffmpeg (libx264 + AAC). Every text box stays inside TikTok's
safe zone and is recorded in layout.json so QA can verify it.
"""
from __future__ import annotations

import json
import math
import subprocess
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from .common import parse_highlights, plain
from . import music

W, H = 1080, 1920
TEXT_X, TEXT_W = 80, 840          # safe area is x 60..940
TEXT_TOP, TEXT_BOTTOM = 470, 1470  # safe area is y 200..1500
CX = TEXT_X + TEXT_W // 2
TRANSITION = 0.32

# One colour card per scene type. `bg` is a vertical gradient (top, bottom).
# `hl` is the highlight colour; with `pill` the highlighted words sit on a
# solid pill of that colour instead of just changing colour.
PALETTES = {
    "hook":  {"bg": ("#0B3B36", "#0E4A43"), "text": "#FFFFFF", "hl": "#E8A33D", "pill": None,      "chip": ("#E8A33D", "#0B3B36"), "dark": True},
    "tip":   {"bg": ("#E8A33D", "#F2B95C"), "text": "#0B3B36", "hl": "#FFF8EC", "pill": "#0B3B36", "chip": ("#0B3B36", "#FFF8EC"), "dark": False},
    "why":   {"bg": ("#3A2459", "#4A2F70"), "text": "#FFFFFF", "hl": "#E8A33D", "pill": None,      "chip": ("#E8A33D", "#3A2459"), "dark": True},
    "learn": {"bg": ("#FFF8EC", "#F6E7C8"), "text": "#0B3B36", "hl": "#FFF8EC", "pill": "#0F7A6B", "chip": ("#0F7A6B", "#FFFFFF"), "dark": False},
    "cta":   {"bg": ("#0B3B36", "#0E4A43"), "text": "#FFFFFF", "hl": "#E8A33D", "pill": None,      "chip": ("#E8A33D", "#0B3B36"), "dark": True},
}
START_SIZE = {"hook": 156, "tip": 116, "why": 116, "learn": 116}
MIN_SIZE = 64


def _hex(c: str, a: int = 255) -> tuple[int, int, int, int]:
    c = c.lstrip("#")
    return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), a)


def _ease_out(x: float) -> float:
    x = min(1.0, max(0.0, x))
    return 1 - (1 - x) ** 3


class Fonts:
    def __init__(self, config: dict):
        self.bold_path = next(p for p in config["fonts"]["bold"] if Path(p).exists())
        self.reg_path = next(p for p in config["fonts"]["regular"] if Path(p).exists())

    @lru_cache(maxsize=64)
    def bold(self, size: int) -> ImageFont.FreeTypeFont:
        return ImageFont.truetype(self.bold_path, size)

    @lru_cache(maxsize=64)
    def regular(self, size: int) -> ImageFont.FreeTypeFont:
        return ImageFont.truetype(self.reg_path, size)


def _with_alpha(img: Image.Image, f: float) -> Image.Image:
    if f >= 0.999:
        return img
    out = img.copy()
    out.putalpha(out.getchannel("A").point(lambda v: int(v * max(0.0, f))))
    return out


def _gradient(top: str, bottom: str) -> Image.Image:
    a, b = _hex(top), _hex(bottom)
    col = Image.new("RGB", (1, H))
    for y in range(H):
        k = y / (H - 1)
        col.putpixel((0, y), tuple(int(a[i] + (b[i] - a[i]) * k) for i in range(3)))
    return col.resize((W, H)).convert("RGBA")


def _blob(radius: int, color: str, alpha: int) -> Image.Image:
    size = radius * 2 + 160
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(img).ellipse((80, 80, size - 80, size - 80), fill=_hex(color, alpha))
    return img.filter(ImageFilter.GaussianBlur(40))


def _wrap(tokens, font, max_w):
    lines, cur, cur_w = [], [], 0.0
    space = font.getlength(" ")
    for word, hl in tokens:
        w = font.getlength(word)
        add = w if not cur else space + w
        if cur and cur_w + add > max_w:
            lines.append(cur)
            cur, cur_w = [(word, hl)], w
        else:
            cur.append((word, hl))
            cur_w += add
    if cur:
        lines.append(cur)
    return lines


def _brand_mark(size: int) -> Image.Image:
    """Gold coin with a compass star: the Money Quest compass motif."""
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((0, 0, s - 1, s - 1), fill=_hex("#E8A33D"))
    m = int(s * 0.08)
    d.ellipse((m, m, s - m, s - m), outline=_hex("#B9771E"), width=max(2, int(s * 0.035)))
    c = s / 2
    pts = []
    for i in range(8):
        ang = -math.pi / 2 + i * math.pi / 4
        r = s * 0.32 if i % 2 == 0 else s * 0.09
        pts.append((c + r * math.cos(ang), c + r * math.sin(ang)))
    d.polygon(pts, fill=_hex("#0B3B36"))
    d.ellipse((c - s * 0.045, c - s * 0.045, c + s * 0.045, c + s * 0.045), fill=_hex("#FFF8EC"))
    return img.resize((size, size), Image.LANCZOS)


class Scene:
    """Pre-rendered layers for one scene."""

    def __init__(self, scene: dict, fonts: Fonts, layout: list):
        self.scene = scene
        self.kind = scene["kind"]
        self.pal = PALETTES[self.kind]
        self.bg = _gradient(*self.pal["bg"])
        blob_color = "#FFFFFF" if self.pal["dark"] else "#0B3B36"
        self.blobs = [(_blob(430, blob_color, 16), 0.0), (_blob(300, blob_color, 14), 2.1)]
        self.fonts = fonts
        # Brand row (mark + name) in the scene's text colour.
        f = fonts.bold(40)
        tw = int(f.getlength("Money Quest"))
        row = Image.new("RGBA", (56 + 16 + tw + 4, 60), (0, 0, 0, 0))
        row.alpha_composite(_brand_mark(56), (0, 2))
        ImageDraw.Draw(row).text((72, 6), "Money Quest", font=f, fill=_hex(self.pal["text"]))
        self.row = row
        self.row_pos = (CX - row.width // 2, 200)
        layout.append({"scene": self.kind, "element": "brand_row", "box": [self.row_pos[0], 200, self.row_pos[0] + row.width, 260], "font_size": 40})
        self.bar_bg = Image.new("RGBA", (TEXT_W, 10), (0, 0, 0, 0))
        ImageDraw.Draw(self.bar_bg).rounded_rectangle((0, 0, TEXT_W - 1, 9), radius=5, fill=_hex(self.pal["text"], 60))
        self.bar_fg = Image.new("RGBA", (TEXT_W, 10), (0, 0, 0, 0))
        ImageDraw.Draw(self.bar_fg).rounded_rectangle((0, 0, TEXT_W - 1, 9), radius=5, fill=_hex(self.pal["chip"][0]))
        if self.kind == "cta":
            self._build_cta(layout)
        else:
            self._build_text(layout)

    # -- big text scenes ---------------------------------------------------------
    def _build_text(self, layout):
        scene, pal, fonts = self.scene, self.pal, self.fonts
        tokens = parse_highlights(scene["text"])
        size = START_SIZE[self.kind]
        avail_h = TEXT_BOTTOM - TEXT_TOP
        while True:
            font = fonts.bold(size)
            lines = _wrap(tokens, font, TEXT_W)
            asc, desc = font.getmetrics()
            lh = int((asc + desc) * 1.14)
            widest = max(font.getlength(w) for w, _ in tokens)
            if (lh * len(lines) <= avail_h and widest <= TEXT_W) or size <= MIN_SIZE:
                break
            size -= 4
        self.font_size = size
        space = font.getlength(" ")
        block_h = lh * len(lines)
        y0 = TEXT_TOP + (avail_h - block_h) // 2
        centered = self.kind == "hook"
        pad = int(space * 0.42)
        self.words = []  # (image, x, y)
        for li, line in enumerate(lines):
            line_w = sum(font.getlength(w) for w, _ in line) + space * (len(line) - 1)
            x = TEXT_X + (TEXT_W - line_w) / 2 if centered else float(TEXT_X)
            y = y0 + li * lh
            layout.append({"scene": self.kind, "element": f"line{li}", "box": [int(x), y, int(x + line_w) + 1, y + lh], "font_size": size})
            for word, hl in line:
                w = font.getlength(word)
                img = Image.new("RGBA", (int(w) + 2 * pad + 2, lh), (0, 0, 0, 0))
                d = ImageDraw.Draw(img)
                ty = (lh - asc - desc) // 2
                if hl and pal["pill"]:
                    d.rounded_rectangle((0, ty + int(asc * 0.08), img.width - 1, ty + asc + desc - int(desc * 0.1)), radius=int(size * 0.2), fill=_hex(pal["pill"]))
                d.text((pad, ty), word, font=font, fill=_hex(pal["hl"] if hl else pal["text"]))
                self.words.append((img, int(x) - pad, y))
                x += w + space
        if scene.get("label"):
            f = fonts.bold(44)
            tw = int(f.getlength(scene["label"]))
            chip = Image.new("RGBA", (tw + 64, 80), (0, 0, 0, 0))
            d = ImageDraw.Draw(chip)
            d.rounded_rectangle((0, 0, tw + 63, 79), radius=40, fill=_hex(pal["chip"][0]))
            d.text((32, 16), scene["label"], font=f, fill=_hex(pal["chip"][1]))
            ly = max(330, y0 - 130)
            self.label = (chip, TEXT_X, ly)
            layout.append({"scene": self.kind, "element": "label", "box": [TEXT_X, ly, TEXT_X + chip.width, ly + 80], "font_size": 44})
        else:
            self.label = None

    # -- closing brand scene -------------------------------------------------------
    def _build_cta(self, layout):
        scene, fonts = self.scene, self.fonts
        white, gold, deep, cream = _hex("#FFFFFF"), _hex("#E8A33D"), _hex("#0B3B36"), _hex("#FFF8EC")
        self.mark = _brand_mark(250)
        self.mark_y = 340
        items = []
        y = 630
        items.append(("title", "Money Quest", fonts.bold(118), white, y))
        y += 170
        line_f = fonts.bold(70)
        cta = scene["lines"]
        for text in cta[:-1]:
            for ln in _wrap([(w, False) for w in text.split()], line_f, TEXT_W):
                items.append(("line", " ".join(w for w, _ in ln), line_f, gold if text.startswith("Explore") else white, y))
                y += 90
        self.cta_items = []
        for kind, text, font, color, yy in items:
            tw = int(font.getlength(text))
            asc, desc = font.getmetrics()
            img = Image.new("RGBA", (tw + 8, asc + desc + 8), (0, 0, 0, 0))
            ImageDraw.Draw(img).text((4, 4), text, font=font, fill=color)
            x = CX - img.width // 2
            self.cta_items.append((img, x, yy))
            layout.append({"scene": "cta", "element": kind, "box": [x, yy, x + img.width, yy + img.height], "font_size": font.size, "text": text})
        pill_f = fonts.bold(72)
        txt = cta[-1]
        tw = int(pill_f.getlength(txt))
        pill = Image.new("RGBA", (tw + 120, 126), (0, 0, 0, 0))
        d = ImageDraw.Draw(pill)
        d.rounded_rectangle((0, 0, tw + 119, 125), radius=63, fill=gold)
        d.text((60, 22), txt, font=pill_f, fill=deep)
        y += 40
        self.pill = (pill, y)
        layout.append({"scene": "cta", "element": "pill", "box": [CX - pill.width // 2, y, CX + pill.width // 2, y + 126], "font_size": 72, "text": txt})
        y += 180
        ex_f = fonts.regular(42)
        self.explore = []
        for ln in _wrap([(w, False) for w in f"Explore further: {scene['explore']}".split()], ex_f, TEXT_W - 40):
            t = " ".join(w for w, _ in ln)
            tw = int(ex_f.getlength(t))
            img = Image.new("RGBA", (tw + 8, 62), (0, 0, 0, 0))
            ImageDraw.Draw(img).text((4, 4), t, font=ex_f, fill=cream)
            self.explore.append((img, CX - img.width // 2, y))
            layout.append({"scene": "cta", "element": "explore", "box": [CX - img.width // 2, y, CX + img.width // 2, y + 62], "font_size": 42, "text": t})
            y += 58

    # -- per-frame drawing -----------------------------------------------------------
    def frame(self, tau: float, t: float, progress: float) -> Image.Image:
        img = self.bg.copy()
        for i, (blob, phase) in enumerate(self.blobs):
            bx = (W * (0.15 if i == 0 else 0.7)) + 70 * math.sin(t * 0.5 + phase) - blob.width / 2
            by = (H * (0.24 if i == 0 else 0.78)) + 90 * math.cos(t * 0.4 + phase) - blob.height / 2
            img.paste(blob, (int(bx), int(by)), blob)
        img.alpha_composite(self.row, self.row_pos)
        if self.kind == "cta":
            k = _ease_out(tau / 0.5)
            s = int(250 * (0.85 + 0.15 * k))
            mark = self.mark.resize((s, s), Image.LANCZOS)
            img.alpha_composite(_with_alpha(mark, k), (CX - s // 2, self.mark_y + (250 - s) // 2))
            for i, (layer, x, y) in enumerate(self.cta_items):
                kk = _ease_out((tau - 0.15 - 0.12 * i) / 0.4)
                img.alpha_composite(_with_alpha(layer, kk), (x, int(y + 30 * (1 - kk))))
            pill, py = self.pill
            kk = _ease_out((tau - 0.7) / 0.4)
            pulse = 1 + 0.035 * math.sin((tau - 1.1) * 2 * math.pi / 1.1) if tau > 1.1 else 1
            pw, ph = int(pill.width * pulse), int(pill.height * pulse)
            img.alpha_composite(_with_alpha(pill.resize((pw, ph), Image.LANCZOS), kk), (CX - pw // 2, py - (ph - pill.height) // 2))
            for layer, x, y in self.explore:
                img.alpha_composite(_with_alpha(layer, _ease_out((tau - 1.0) / 0.4)), (x, y))
            return img

        img.alpha_composite(self.bar_bg, (TEXT_X, 290))
        fw = max(1, int(TEXT_W * progress))
        img.alpha_composite(self.bar_fg.crop((0, 0, fw, 10)), (TEXT_X, 290))
        # The hook starts immediately (it has to grab attention in the first
        # second); later scenes wait for the push transition to finish.
        start = 0.0 if self.kind == "hook" else 0.22
        stagger = min(0.075, 0.9 / max(1, len(self.words)))
        if self.label:
            chip, lx, ly = self.label
            kk = _ease_out((tau - start + 0.1) / 0.3)
            img.alpha_composite(_with_alpha(chip, kk), (int(lx - 30 * (1 - kk)), ly))
        for i, (layer, x, y) in enumerate(self.words):
            kk = _ease_out((tau - start - i * stagger) / 0.2)
            if kk <= 0:
                continue
            img.alpha_composite(_with_alpha(layer, kk), (x, int(y + 34 * (1 - kk))))
        return img


def render(plan: dict, config: dict, out_dir: Path) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    fps = config["video"]["fps"]
    fonts = Fonts(config)
    layout: list = []
    scenes = [Scene(s, fonts, layout) for s in plan["scenes"]]

    total = plan["duration"]
    n_frames = int(round(total * fps))
    audio = music.generate(total, plan["topic_id"], out_dir / "music.wav")
    video_path = out_dir / "video.mp4"
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
        "-i", str(audio),
        "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
        "-profile:v", "high", "-c:a", "aac", "-b:a", "160k",
        "-movflags", "+faststart", "-t", f"{total:.3f}", str(video_path),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    def scene_at(t):
        for i, s in enumerate(plan["scenes"]):
            if t < s["start"] + s["duration"]:
                return i
        return len(plan["scenes"]) - 1

    def compose(i, t):
        s = plan["scenes"][i]
        return scenes[i].frame(t - s["start"], t, min(1.0, t / total))

    cover_t = min(1.4, plan["scenes"][0]["duration"] - 0.2)
    for n in range(n_frames):
        t = n / fps
        i = scene_at(t)
        frame = compose(i, t)
        tau = t - plan["scenes"][i]["start"]
        if i > 0 and tau < TRANSITION:
            # Push: the previous card slides up and out, the new one follows.
            k = _ease_out(tau / TRANSITION)
            prev = compose(i - 1, t)
            canvas = Image.new("RGBA", (W, H))
            canvas.paste(prev, (0, -int(H * k)))
            canvas.paste(frame, (0, H - int(H * k)))
            frame = canvas
        rgb = frame.convert("RGB")
        if abs(t - cover_t) < 0.5 / fps:
            rgb.save(out_dir / "cover.jpg", quality=90)
        proc.stdin.write(rgb.tobytes())
    proc.stdin.close()
    if proc.wait() != 0:
        raise RuntimeError("ffmpeg failed")

    (out_dir / "layout.json").write_text(json.dumps(layout, indent=2))
    (out_dir / "plan.json").write_text(json.dumps(plan, indent=2, ensure_ascii=False))
    (out_dir / "caption.txt").write_text(plan["caption"] + "\n", encoding="utf-8")
    script_lines = [f"[{s['start']:.1f}s] {s['kind'].upper()}: {plain(s['text'])}" for s in plan["scenes"]]
    (out_dir / "script.txt").write_text("\n".join(script_lines) + "\n", encoding="utf-8")
    return {"video": str(video_path), "layout": layout, "font_used": fonts.bold_path}
