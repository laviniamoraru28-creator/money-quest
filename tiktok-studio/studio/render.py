"""Renders a scene plan to a vertical 1080x1920 MP4.

Frames are composed with Pillow and piped to ffmpeg (libx264 + AAC).
Layout keeps every piece of text inside TikTok's safe zone (away from the
top tabs, the right-hand action buttons and the bottom caption area), and
records each text box in layout.json so QA can verify it.
"""
from __future__ import annotations

import json
import math
import subprocess
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from .common import parse_highlights, plain, website_root
from . import music

W, H = 1080, 1920
CX = 500  # horizontal centre of the safe area (left 60, right 140)
CARD = (140, 300, 720)  # x, y, size
PANEL_X, PANEL_W = 70, 860
PANEL_TOP = 1060
PANEL_MAX_BOTTOM = 1490
TRANSITION = 0.35


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
    a = out.getchannel("A").point(lambda v: int(v * max(0.0, f)))
    out.putalpha(a)
    return out


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


def _render_lines(text, font, max_w, colors, line_h_factor=1.2):
    """Returns list of RGBA line images (each line its own layer, for staggered animation)."""
    tokens = parse_highlights(text)
    lines = _wrap(tokens, font, max_w)
    asc, desc = font.getmetrics()
    lh = int((asc + desc) * line_h_factor)
    space = font.getlength(" ")
    layers = []
    for line in lines:
        width = int(sum(font.getlength(w) for w, _ in line) + space * (len(line) - 1)) + 4
        img = Image.new("RGBA", (max(width, 1), lh), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        x = 0.0
        for word, hl in line:
            d.text((x, (lh - asc - desc) // 2), word, font=font, fill=colors["gold"] if hl else colors["white"])
            x += font.getlength(word) + space
        layers.append(img)
    return layers, lh


def _brand_mark(size: int, colors) -> Image.Image:
    """Gold coin with a compass star: the Money Quest compass motif."""
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((0, 0, s - 1, s - 1), fill=colors["gold"])
    m = int(s * 0.08)
    d.ellipse((m, m, s - m, s - m), outline=_hex("#B9771E"), width=max(2, int(s * 0.035)))
    c = s / 2
    r_long, r_short = s * 0.32, s * 0.09
    pts = []
    for i in range(8):
        ang = -math.pi / 2 + i * math.pi / 4
        r = r_long if i % 2 == 0 else r_short
        pts.append((c + r * math.cos(ang), c + r * math.sin(ang)))
    d.polygon(pts, fill=colors["deep"])
    d.ellipse((c - s * 0.045, c - s * 0.045, c + s * 0.045, c + s * 0.045), fill=colors["cream"])
    return img.resize((size, size), Image.LANCZOS)


class SceneArt:
    """Pre-rendered layers for one scene."""

    def __init__(self, scene, plan, config, fonts, colors, root: Path, layout: list):
        self.scene = scene
        self.kind = scene["kind"]
        src = Image.open(root / scene["image"]).convert("RGB")
        # Blurred, darkened full-bleed background from the same artwork.
        scale = max(W / src.width, H / src.height)
        bg = src.resize((int(src.width * scale) + 1, int(src.height * scale) + 1), Image.LANCZOS)
        left = (bg.width - W) // 2
        top = (bg.height - H) // 2
        bg = bg.crop((left, top, left + W, top + H)).filter(ImageFilter.GaussianBlur(28))
        shade = Image.new("RGB", (W, H), colors["deep"][:3])
        self.bg = Image.blend(bg, shade, 0.55).convert("RGBA")
        # Sharp image card source (slightly oversized for the slow zoom).
        x, y, size = CARD
        self.card_src = src.resize((int(size * 1.08), int(size * 1.08)), Image.LANCZOS)
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=44, fill=255)
        self.card_mask = mask
        border = Image.new("RGBA", (size + 16, size + 16), (0, 0, 0, 0))
        ImageDraw.Draw(border).rounded_rectangle((0, 0, size + 15, size + 15), radius=52, fill=colors["cream"])
        shadow = Image.new("RGBA", (size + 80, size + 80), (0, 0, 0, 0))
        ImageDraw.Draw(shadow).rounded_rectangle((40, 52, size + 40, size + 52), radius=52, fill=(0, 0, 0, 120))
        self.card_border = border
        self.card_shadow = shadow.filter(ImageFilter.GaussianBlur(18))

        self.lines = []
        self.label = None
        if self.kind == "cta":
            self._build_cta(scene, fonts, colors, layout)
        else:
            self._build_panel(scene, fonts, colors, layout)

    # -- standard scenes ---------------------------------------------------
    def _build_panel(self, scene, fonts, colors, layout):
        pad_x, pad_top, pad_bottom = 48, 70, 50
        size = 82 if self.kind == "hook" else 62
        max_text_w = PANEL_W - 2 * pad_x
        while True:
            font = fonts.bold(size)
            lines, lh = _render_lines(scene["text"], font, max_text_w, colors)
            height = pad_top + lh * len(lines) + pad_bottom
            if PANEL_TOP + height <= PANEL_MAX_BOTTOM or size <= 44:
                break
            size -= 2
        self.font_size = size
        panel = Image.new("RGBA", (PANEL_W, height), (0, 0, 0, 0))
        ImageDraw.Draw(panel).rounded_rectangle((0, 0, PANEL_W - 1, height - 1), radius=40, fill=colors["deep"][:3] + (236,))
        ImageDraw.Draw(panel).rounded_rectangle((0, 0, PANEL_W - 1, height - 1), radius=40, outline=colors["gold"][:3] + (180,), width=3)
        self.panel = panel
        self.panel_h = height
        self.lines = []
        for i, img in enumerate(lines):
            lx = PANEL_X + (PANEL_W - img.width) // 2 if self.kind == "hook" else PANEL_X + pad_x
            ly = PANEL_TOP + pad_top + i * lh
            self.lines.append((img, lx, ly))
            layout.append({"scene": self.kind, "element": f"line{i}", "box": [lx, ly, lx + img.width, ly + img.height], "font_size": size})
        layout.append({"scene": self.kind, "element": "panel", "box": [PANEL_X, PANEL_TOP, PANEL_X + PANEL_W, PANEL_TOP + height], "font_size": None})
        if scene.get("label"):
            f = fonts.bold(34)
            tw = int(f.getlength(scene["label"]))
            chip = Image.new("RGBA", (tw + 56, 64), (0, 0, 0, 0))
            d = ImageDraw.Draw(chip)
            d.rounded_rectangle((0, 0, tw + 55, 63), radius=32, fill=colors["gold"])
            d.text((28, 13), scene["label"], font=f, fill=colors["deep"])
            self.label = (chip, PANEL_X + 40, PANEL_TOP - 32)
            layout.append({"scene": self.kind, "element": "label", "box": [PANEL_X + 40, PANEL_TOP - 32, PANEL_X + 40 + chip.width, PANEL_TOP + 32], "font_size": 34})

    # -- closing brand scene -----------------------------------------------
    def _build_cta(self, scene, fonts, colors, layout):
        self.mark = _brand_mark(250, colors)
        self.mark_pos = (CX - 125, 330)
        items = []
        y = 620
        title_f = fonts.bold(104)
        items.append(("title", "Money Quest", title_f, colors["white"], y))
        y += 150
        line_f = fonts.bold(60)
        cta = scene["lines"]
        for text in cta[:-1]:
            for img_line in _wrap([(w, False) for w in text.split()], line_f, 820):
                items.append(("line", " ".join(w for w, _ in img_line), line_f, colors["gold"] if text.startswith("Explore") else colors["white"], y))
                y += 78
        self.cta_items = []
        for kind, text, font, color, yy in items:
            tw = int(font.getlength(text))
            asc, desc = font.getmetrics()
            img = Image.new("RGBA", (tw + 8, asc + desc + 8), (0, 0, 0, 0))
            ImageDraw.Draw(img).text((4, 4), text, font=font, fill=color)
            x = CX - img.width // 2
            self.cta_items.append((img, x, yy))
            layout.append({"scene": "cta", "element": kind, "box": [x, yy, x + img.width, yy + img.height], "font_size": font.size, "text": text})
        # "Link in bio." pill
        pill_f = fonts.bold(64)
        txt = cta[-1]
        tw = int(pill_f.getlength(txt))
        pill = Image.new("RGBA", (tw + 110, 112), (0, 0, 0, 0))
        d = ImageDraw.Draw(pill)
        d.rounded_rectangle((0, 0, tw + 109, 111), radius=56, fill=colors["gold"])
        d.text((55, 20), txt, font=pill_f, fill=colors["deep"])
        y += 30
        self.pill = (pill, CX - pill.width // 2, y)
        layout.append({"scene": "cta", "element": "pill", "box": [CX - pill.width // 2, y, CX + pill.width // 2, y + 112], "font_size": 64, "text": txt})
        y += 150
        ex_f = fonts.regular(40)
        ex_text = f"Explore further: {scene['explore']}"
        lines = _wrap([(w, False) for w in ex_text.split()], ex_f, 800)
        self.explore = []
        for ln in lines:
            t = " ".join(w for w, _ in ln)
            tw = int(ex_f.getlength(t))
            img = Image.new("RGBA", (tw + 8, 60), (0, 0, 0, 0))
            ImageDraw.Draw(img).text((4, 4), t, font=ex_f, fill=colors["cream"])
            self.explore.append((img, CX - img.width // 2, y))
            layout.append({"scene": "cta", "element": "explore", "box": [CX - img.width // 2, y, CX + img.width // 2, y + 60], "font_size": 40, "text": t})
            y += 56

    # -- per-frame drawing ---------------------------------------------------
    def frame(self, tau: float, progress: float, brand_layers) -> Image.Image:
        img = self.bg.copy()
        dur = self.scene["duration"]
        if self.kind == "cta":
            k = _ease_out(tau / 0.5)
            s = int(250 * (0.85 + 0.15 * k))
            mark = self.mark.resize((s, s), Image.LANCZOS)
            img.alpha_composite(_with_alpha(mark, k), (CX - s // 2, self.mark_pos[1] + (250 - s) // 2))
            for i, (layer, x, y) in enumerate(self.cta_items):
                kk = _ease_out((tau - 0.15 - 0.12 * i) / 0.4)
                img.alpha_composite(_with_alpha(layer, kk), (x, int(y + 30 * (1 - kk))))
            pill, px, py = self.pill
            kk = _ease_out((tau - 0.7) / 0.4)
            pulse = 1 + 0.035 * math.sin(max(0.0, tau - 1.1) * 2 * math.pi / 1.1) if tau > 1.1 else 1
            pw, ph = int(pill.width * pulse), int(pill.height * pulse)
            p2 = pill.resize((pw, ph), Image.LANCZOS)
            img.alpha_composite(_with_alpha(p2, kk), (CX - pw // 2, py - (ph - pill.height) // 2))
            for layer, x, y in self.explore:
                kk = _ease_out((tau - 1.0) / 0.4)
                img.alpha_composite(_with_alpha(layer, kk), (x, y))
            return img

        # Image card with a slow zoom (Ken Burns).
        x, y, size = CARD
        # Zoom eases from 1.00x to 1.08x over the scene: the crop window
        # shrinks from the full oversized source to `size` pixels.
        cs = self.card_src.width
        zoom = 1.0 + 0.08 * min(1.0, tau / max(dur, 0.01))
        win = min(cs, max(size, int(cs / zoom)))
        off = (cs - win) // 2
        card = self.card_src.crop((off, off, off + win, off + win)).resize((size, size), Image.LANCZOS)
        img.alpha_composite(self.card_shadow, (x - 40, y - 40))
        img.alpha_composite(self.card_border, (x - 8, y - 8))
        img.paste(card, (x, y), self.card_mask)

        # Progress bar under the brand row.
        bar_bg, bar_fg = brand_layers["bar"]
        img.alpha_composite(bar_bg, (CARD[0], 262))
        fw = max(1, int(bar_fg.width * progress))
        img.alpha_composite(bar_fg.crop((0, 0, fw, bar_fg.height)), (CARD[0], 262))

        # Panel slides up and fades in; lines follow in a stagger.
        k = _ease_out((tau - 0.05) / 0.4)
        img.alpha_composite(_with_alpha(self.panel, k), (PANEL_X, int(PANEL_TOP + 50 * (1 - k))))
        if self.label:
            chip, lx, ly = self.label
            kk = _ease_out((tau - 0.15) / 0.35)
            img.alpha_composite(_with_alpha(chip, kk), (lx, int(ly + 50 * (1 - k))))
        for i, (layer, lx, ly) in enumerate(self.lines):
            kk = _ease_out((tau - 0.2 - 0.12 * i) / 0.35)
            img.alpha_composite(_with_alpha(layer, kk), (int(lx - 24 * (1 - kk)), ly))
        return img


def _brand_layers(fonts, colors):
    mark = _brand_mark(56, colors)
    f = fonts.bold(40)
    tw = int(f.getlength("Money Quest"))
    row = Image.new("RGBA", (56 + 16 + tw + 4, 60), (0, 0, 0, 0))
    row.alpha_composite(mark, (0, 2))
    ImageDraw.Draw(row).text((72, 6), "Money Quest", font=f, fill=colors["white"])
    bar_bg = Image.new("RGBA", (CARD[2], 8), (0, 0, 0, 0))
    ImageDraw.Draw(bar_bg).rounded_rectangle((0, 0, CARD[2] - 1, 7), radius=4, fill=(255, 255, 255, 70))
    bar_fg = Image.new("RGBA", (CARD[2], 8), (0, 0, 0, 0))
    ImageDraw.Draw(bar_fg).rounded_rectangle((0, 0, CARD[2] - 1, 7), radius=4, fill=colors["gold"])
    return {"row": row, "bar": (bar_bg, bar_fg)}


def render(plan: dict, config: dict, out_dir: Path) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    fps = config["video"]["fps"]
    colors = {k: _hex(v) for k, v in config["brand"]["colors"].items()}
    fonts = Fonts(config)
    root = website_root(config)
    layout: list = []
    arts = [SceneArt(s, plan, config, fonts, colors, root, layout) for s in plan["scenes"]]
    brand = _brand_layers(fonts, colors)
    row = brand["row"]
    row_pos = (CX - row.width // 2, 200)
    layout.append({"scene": "all", "element": "brand_row", "box": [row_pos[0], row_pos[1], row_pos[0] + row.width, row_pos[1] + row.height], "font_size": 40})

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
            if t < s["start"] + s["duration"] or i == len(plan["scenes"]) - 1:
                return i
        return len(plan["scenes"]) - 1

    def compose(i, t):
        s = plan["scenes"][i]
        frame = arts[i].frame(t - s["start"], min(1.0, t / total), brand)
        frame.alpha_composite(row, row_pos)
        return frame

    cover_t = min(1.4, plan["scenes"][0]["duration"] - 0.2)
    for n in range(n_frames):
        t = n / fps
        i = scene_at(t)
        frame = compose(i, t)
        tau = t - plan["scenes"][i]["start"]
        if i > 0 and tau < TRANSITION:
            prev = compose(i - 1, t)
            frame = Image.blend(prev, frame, _ease_out(tau / TRANSITION))
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
