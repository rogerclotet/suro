# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=10"]
# ///
"""Generate the Play Store graphics from the app's brand assets.

Run from anywhere:  uv run apps/mobile/store/generate-graphics.py

Outputs (committed to the repo):
  - play/metadata/android/en-US/images/icon.png          512x512 hi-res icon
  - play/metadata/android/<locale>/images/featureGraphic.png  1024x500, localized tagline
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

STORE_DIR = Path(__file__).resolve().parent
MOBILE_DIR = STORE_DIR.parent
ASSETS = MOBILE_DIR / "assets" / "images"
FONT_PATH = (
    MOBILE_DIR
    / "node_modules"
    / "@expo-google-fonts"
    / "convergence"
    / "400Regular"
    / "Convergence_400Regular.ttf"
)

BG = "#17100c"  # splash / adaptive-icon background
TEXT = "#ebe6de"  # dark-theme foreground
ACCENT = "#c9b07f"  # cork marker accent

TAGLINES: dict[str, str] = {
    "en-US": "Lists & plans, together",
    "es-ES": "Listas y planes, juntos",
    "ca": "Llistes i plans, junts",
}

CANVAS = (1024, 500)


def make_icon() -> None:
    out = STORE_DIR / "play" / "metadata" / "android" / "en-US" / "images" / "icon.png"
    icon = Image.open(ASSETS / "icon.png").convert("RGBA")
    icon.resize((512, 512), Image.LANCZOS).save(out, optimize=True)
    print(f"wrote {out.relative_to(MOBILE_DIR)}")


def make_feature_graphic(locale: str, tagline: str) -> None:
    out = (
        STORE_DIR
        / "play"
        / "metadata"
        / "android"
        / locale
        / "images"
        / "featureGraphic.png"
    )
    canvas = Image.new("RGB", CANVAS, BG)

    # The adaptive-icon foreground is the cork "S" on transparency with the
    # Android safe-zone padding — crop it away before sizing.
    logo = Image.open(ASSETS / "android-icon-foreground.png").convert("RGBA")
    logo = logo.crop(logo.getbbox())
    logo_h = 340
    logo_w = round(logo.width * logo_h / logo.height)
    logo = logo.resize((logo_w, logo_h), Image.LANCZOS)
    logo_x, logo_y = 140, (CANVAS[1] - logo_h) // 2
    canvas.paste(logo, (logo_x, logo_y), logo)

    draw = ImageDraw.Draw(canvas)
    name_font = ImageFont.truetype(str(FONT_PATH), 124)
    tagline_font = ImageFont.truetype(str(FONT_PATH), 44)

    text_x = logo_x + logo_w + 72
    name_bbox = draw.textbbox((0, 0), "Suro", font=name_font)
    name_h = name_bbox[3] - name_bbox[1]
    tagline_bbox = draw.textbbox((0, 0), tagline, font=tagline_font)
    tagline_h = tagline_bbox[3] - tagline_bbox[1]
    gap = 28
    block_h = name_h + gap + tagline_h
    name_y = (CANVAS[1] - block_h) // 2 - name_bbox[1]

    draw.text((text_x, name_y), "Suro", font=name_font, fill=TEXT)
    draw.text(
        (text_x, name_y + name_bbox[1] + name_h + gap - tagline_bbox[1]),
        tagline,
        font=tagline_font,
        fill=ACCENT,
    )

    canvas.save(out, optimize=True)
    print(f"wrote {out.relative_to(MOBILE_DIR)}")


def main() -> None:
    if not FONT_PATH.exists():
        raise SystemExit(
            f"font not found at {FONT_PATH} — run `pnpm install` in the repo first"
        )
    make_icon()
    for locale, tagline in TAGLINES.items():
        make_feature_graphic(locale, tagline)


if __name__ == "__main__":
    main()
