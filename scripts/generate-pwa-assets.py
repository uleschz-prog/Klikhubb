#!/usr/bin/env python3
"""Genera iconos y splash screens PWA desde public/brand/qlyk-mark.svg."""

from __future__ import annotations

import json
from pathlib import Path

import cairosvg
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SVG = ROOT / "public/brand/qlyk-mark.svg"
ICONS = ROOT / "public/icons"
SPLASH = ROOT / "public/splash"

ICON_SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512]
SPLASH_SIZES = [
    (1290, 2796, "iphone-14-pro-max"),
    (1179, 2556, "iphone-14-pro"),
    (1170, 2532, "iphone-13"),
    (1284, 2778, "iphone-12-pro-max"),
    (750, 1334, "iphone-se"),
    (2048, 2732, "ipad-pro-12"),
]


def render_mark(size: int) -> Image.Image:
    png_bytes = cairosvg.svg2png(url=str(SVG), output_width=size, output_height=size)
    from io import BytesIO

    return Image.open(BytesIO(png_bytes)).convert("RGBA")


def font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    return ImageFont.truetype(path, size)


def splash(w: int, h: int) -> Image.Image:
    img = Image.new("RGB", (w, h), "#050505")
    draw = ImageDraw.Draw(img)
    draw.ellipse((w * 0.55, -h * 0.08, w * 1.05, h * 0.42), fill=(0, 240, 255, 18))
    draw.ellipse((-w * 0.15, h * 0.62, w * 0.35, h * 1.02), fill=(0, 255, 65, 12))

    mark_size = min(w, h) // 5
    mark = render_mark(mark_size)
    mx = (w - mark_size) // 2
    my = int(h * 0.36) - mark_size // 2
    img.paste(mark, (mx, my), mark)

    title = font(max(42, w // 18))
    word = font(max(42, w // 18))
    q = "Q"
    rest = "lyk"
    bbox_q = draw.textbbox((0, 0), q, font=title)
    bbox_r = draw.textbbox((0, 0), rest, font=word)
    tw = (bbox_q[2] - bbox_q[0]) + (bbox_r[2] - bbox_r[0])
    tx = (w - tw) // 2
    ty = my + mark_size + int(h * 0.04)
    draw.text((tx, ty), q, font=title, fill=(0, 240, 255))
    draw.text((tx + bbox_q[2] - bbox_q[0], ty), rest, font=word, fill=(255, 255, 255))

    tag = font(max(18, w // 42), bold=False)
    tagline = "Del video al pago"
    bbox = draw.textbbox((0, 0), tagline, font=tag)
    draw.text(((w - bbox[2] + bbox[0]) // 2, ty + int(h * 0.08)), tagline, font=tag, fill=(140, 140, 140))
    return img


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)
    SPLASH.mkdir(parents=True, exist_ok=True)
    svg_bytes = SVG.read_bytes()

    manifest_icons = []
    for size in ICON_SIZES:
        out = ICONS / f"icon-{size}x{size}.png"
        cairosvg.svg2png(bytestring=svg_bytes, write_to=str(out), output_width=size, output_height=size)
        purpose = "any maskable" if size >= 192 else "any"
        manifest_icons.append(
            {
                "src": f"/icons/icon-{size}x{size}.png",
                "sizes": f"{size}x{size}",
                "type": "image/png",
                "purpose": purpose,
            }
        )
        print("icon", size)

    apple = ICONS / "apple-touch-icon.png"
    cairosvg.svg2png(bytestring=svg_bytes, write_to=str(apple), output_width=180, output_height=180)

    splash_manifest = []
    for w, h, name in SPLASH_SIZES:
        out = SPLASH / f"{name}-{w}x{h}.png"
        splash(w, h).save(out, "PNG", optimize=True)
        splash_manifest.append({"name": name, "w": w, "h": h, "path": f"/splash/{out.name}"})
        print("splash", name, w, h)

    (ICONS / "_generated.json").write_text(json.dumps({"icons": manifest_icons, "splash": splash_manifest}, indent=2))
    print("done")


if __name__ == "__main__":
    main()
