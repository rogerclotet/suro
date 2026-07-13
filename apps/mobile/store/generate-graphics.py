# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=10"]
# ///
"""Generate the store graphics from the app's brand assets, and normalize the
App Store screenshots to the size Apple requires.

Run from anywhere:  uv run apps/mobile/store/generate-graphics.py

Outputs (committed to the repo):
  - play/metadata/android/en-US/images/icon.png          512x512 hi-res icon
  - play/metadata/android/<locale>/images/featureGraphic.png  1024x500, localized tagline
  - apple/screenshots/<locale>/*.png   resized to 1320x2868 (App Store 6.9")

The App Store screenshots are captured by hand; this never invents UI, it only
resizes whatever is in apple/screenshots to the exact dimensions App Store
Connect accepts for the 6.9-inch Display slot (keeping check-metadata.mjs
green). Capture on a 6.9" simulator (iPhone 16/17 Pro Max) for best quality,
so resizing is usually a no-op. Upload the results to the matching 6.9-inch
Display section in App Store Connect — not the 6.5-inch slot.
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

# App Store 6.9" portrait (iPhone 16 Pro Max). check-metadata.mjs also accepts
# 1290x2796; target the largest so a single set covers every required device.
APPLE_SCREENSHOT = (1320, 2868)
APPLE_SCREENSHOT_DIR = STORE_DIR / "apple" / "screenshots"


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


def fit_to_cover(image: Image.Image, target: tuple[int, int]) -> Image.Image:
    """Scale `image` to fully cover `target`, then center-crop to it.

    Preserves aspect ratio with no padding bars: the capture is scaled to the
    smallest size that covers the target box and the overflow is trimmed evenly.
    For near-identical phone aspect ratios this removes only a few pixels.
    """
    target_w, target_h = target
    scale = max(target_w / image.width, target_h / image.height)
    scaled = image.resize(
        (round(image.width * scale), round(image.height * scale)), Image.LANCZOS
    )
    left = (scaled.width - target_w) // 2
    top = (scaled.height - target_h) // 2
    return scaled.crop((left, top, left + target_w, top + target_h))


def normalize_apple_screenshots() -> None:
    """Rewrite every App Store screenshot at the exact dimensions Apple requires.

    Idempotent: files already at APPLE_SCREENSHOT are skipped, so re-running is a
    no-op. Converting to RGB also drops any alpha channel, which the App Store
    rejects on screenshots.
    """
    if not APPLE_SCREENSHOT_DIR.exists():
        return
    for shot in sorted(APPLE_SCREENSHOT_DIR.rglob("*.png")):
        with Image.open(shot) as image:
            if image.size == APPLE_SCREENSHOT:
                continue
            framed = fit_to_cover(image.convert("RGB"), APPLE_SCREENSHOT)
        framed.save(shot, optimize=True)
        print(
            f"resized {shot.relative_to(MOBILE_DIR)} "
            f"-> {APPLE_SCREENSHOT[0]}x{APPLE_SCREENSHOT[1]}"
        )


def main() -> None:
    if not FONT_PATH.exists():
        raise SystemExit(
            f"font not found at {FONT_PATH} — run `pnpm install` in the repo first"
        )
    make_icon()
    for locale, tagline in TAGLINES.items():
        make_feature_graphic(locale, tagline)
    normalize_apple_screenshots()


if __name__ == "__main__":
    main()
