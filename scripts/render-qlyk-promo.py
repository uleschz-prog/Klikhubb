#!/usr/bin/env python3
"""Render Qlyk 60s vertical marketing promo (1080x1920)."""

from __future__ import annotations

import subprocess
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = Path("/opt/cursor/artifacts/qlyk-promo-build")
OUT_DIR.mkdir(parents=True, exist_ok=True)
FINAL = Path("/opt/cursor/artifacts/qlyk-video-marketing.mp4")

W, H = 1080, 1920
FPS = 30
BLACK = (5, 5, 5)
CYAN = (0, 240, 255)
GREEN = (0, 255, 65)
WHITE = (255, 255, 255)
MUTED = (255, 255, 255, 140)


def font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    return ImageFont.truetype(path, size)


def slide(
    filename: str,
    lines: list[tuple[str, int, tuple[int, int, int], str]],
    *,
    subtitle: str | None = None,
    logo: Path | None = None,
) -> Path:
    img = Image.new("RGB", (W, H), BLACK)
    draw = ImageDraw.Draw(img)

    # Accent glow
    draw.ellipse((620, -120, 1180, 440), fill=(0, 240, 255, 18))
    draw.ellipse((-180, 1320, 420, 1920), fill=(0, 255, 65, 12))

    y = 520 if logo else 680
    if logo and logo.exists():
        mark = Image.open(logo).convert("RGBA")
        mark.thumbnail((220, 220))
        img.paste(mark, ((W - mark.width) // 2, 280), mark)
        y = 560

    for text, size, color, weight in lines:
        f = font(size, bold=(weight == "bold"))
        wrapped = textwrap.fill(text, width=16 if size >= 70 else 22)
        bbox = draw.multiline_textbbox((0, 0), wrapped, font=f, spacing=12, align="center")
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        draw.multiline_text(((W - tw) // 2, y), wrapped, font=f, fill=color, spacing=12, align="center")
        y += th + 36

    if subtitle:
        sf = font(42, bold=False)
        sw = textwrap.fill(subtitle, width=28)
        bbox = draw.multiline_textbbox((0, 0), sw, font=sf, spacing=8, align="center")
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        draw.multiline_text(((W - tw) // 2, H - th - 180), sw, font=sf, fill=(180, 180, 180), spacing=8, align="center")

    path = OUT_DIR / filename
    img.save(path, "PNG")
    return path


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True)


def image_to_clip(png: Path, seconds: float, name: str) -> Path:
    out = OUT_DIR / f"{name}.mp4"
    run(
        [
            "ffmpeg",
            "-y",
            "-loop",
            "1",
            "-i",
            str(png),
            "-t",
            str(seconds),
            "-vf",
            f"scale={W}:{H},format=yuv420p",
            "-r",
            str(FPS),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            str(out),
        ]
    )
    return out


def video_clip(src: Path, seconds: float, name: str, start: float = 0) -> Path:
    out = OUT_DIR / f"{name}.mp4"
    vf = f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},format=yuv420p"
    run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            str(start),
            "-t",
            str(seconds),
            "-i",
            str(src),
            "-vf",
            vf,
            "-an",
            "-r",
            str(FPS),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            str(out),
        ]
    )
    return out


def overlay_text(src: Path, text: str, name: str, seconds: float | None = None) -> Path:
    out = OUT_DIR / f"{name}.mp4"
    dur = seconds or float(
        subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(src),
            ],
            text=True,
        ).strip()
    )
    line1, _, line2 = text.partition("\n")
    line1 = line1.replace(":", "\\:").replace("'", "\\'")
    line2 = line2.replace(":", "\\:").replace("'", "\\'")
    y_first = "1620" if not line2 else "1580"
    second = ""
    if line2:
        second = (
            f"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='{line2}':"
            f"fontcolor=0x00F0FF:fontsize=58:x=(w-text_w)/2:y=1700,"
        )
    vf = (
        f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
        f"drawbox=x=0:y=1500:w={W}:h=420:color=black@0.55:t=fill,"
        f"drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='{line1}':"
        f"fontcolor=white:fontsize=58:x=(w-text_w)/2:y={y_first},"
        f"{second}"
        f"format=yuv420p"
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(src),
            "-t",
            str(dur),
            "-vf",
            vf,
            "-an",
            "-r",
            str(FPS),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            str(out),
        ]
    )
    return out


def screenshot_clip(src: Path, seconds: float, name: str) -> Path:
    out = OUT_DIR / f"{name}.mp4"
    run(
        [
            "ffmpeg",
            "-y",
            "-loop",
            "1",
            "-i",
            str(src),
            "-t",
            str(seconds),
            "-vf",
            f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},format=yuv420p",
            "-r",
            str(FPS),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            str(out),
        ]
    )
    return out


def main() -> None:
    logo = ROOT / "public/brand/klikhubb-mark.png"
    shots = ROOT / "marketing-screenshots"

    slides = [
        slide(
            "s01-hook.png",
            [("¿Cuántos clics perdiste hoy?", 86, WHITE, "bold")],
            subtitle="Publicas · Vendes · Cobras… en apps distintas",
        ),
        slide(
            "s02-problem.png",
            [
                ("Publicas en una app.", 64, WHITE, "bold"),
                ("Vendes en otra.", 64, WHITE, "bold"),
                ("Tu audiencia se va.", 72, CYAN, "bold"),
            ],
        ),
        slide(
            "s03-logo.png",
            [("Qlyk", 140, WHITE, "bold")],
            subtitle="Del video al pago. Sin salir del feed.",
            logo=logo,
        ),
        slide(
            "s04-split.png",
            [
                ("Te quedas el", 58, WHITE, "bold"),
                ("85–90%", 130, GREEN, "bold"),
                ("de cada venta", 58, WHITE, "bold"),
            ],
            subtitle="Sin multinivel · Cuenta gratis",
        ),
        slide(
            "s05-features.png",
            [
                ("Feed + Academy", 68, CYAN, "bold"),
                ("+ Community + Wallet", 68, GREEN, "bold"),
            ],
            subtitle="Todo en un solo clic",
        ),
        slide(
            "s06-cta.png",
            [
                ("Registro GRATIS", 78, GREEN, "bold"),
                ("qlyk.vercel.app", 52, WHITE, "bold"),
            ],
            subtitle="Empieza hoy ↓",
            logo=logo,
        ),
    ]

    clips: list[Path] = []
    clips.append(image_to_clip(slides[0], 3.0, "c01"))
    clips.append(image_to_clip(slides[1], 4.0, "c02"))
    clips.append(image_to_clip(slides[2], 3.5, "c03"))

    hero = ROOT / "public/videos/qlyk-hero-demo.mp4"
    maya = ROOT / "public/videos/maya-cierre.mp4"
    clips.append(overlay_text(video_clip(hero, 8.0, "c04-raw", 0.5), "Del video al pago.\nSin salir del feed.", "c04"))
    clips.append(overlay_text(video_clip(maya, 7.0, "c05-raw", 1.0), "Subes · Venden · Cobras", "c05"))

    if (shots / "01-landing-hero.png").exists():
        clips.append(screenshot_clip(shots / "01-landing-hero.png", 4.0, "c06"))
    else:
        clips.append(image_to_clip(slides[3], 4.0, "c06"))

    clips.append(image_to_clip(slides[3], 4.0, "c07"))
    clips.append(image_to_clip(slides[4], 3.5, "c08"))

    if (shots / "02-register-page.png").exists():
        clips.append(screenshot_clip(shots / "02-register-page.png", 3.5, "c09"))
    else:
        clips.append(image_to_clip(slides[5], 3.5, "c09"))

    clips.append(image_to_clip(slides[5], 4.5, "c10"))

    concat = OUT_DIR / "concat.txt"
    concat.write_text("\n".join(f"file '{c}'" for c in clips))

    silent = OUT_DIR / "silent.mp4"
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat), "-c", "copy", str(silent)])

    # Subtle fade in/out
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(silent),
            "-vf",
            "fade=t=in:st=0:d=0.4,fade=t=out:st=42:d=1.5",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            str(FINAL),
        ]
    )

    probe = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration,size", "-of", "default=noprint_wrappers=1", str(FINAL)], text=True)
    print(f"Rendered {FINAL}\n{probe}")


if __name__ == "__main__":
    main()
