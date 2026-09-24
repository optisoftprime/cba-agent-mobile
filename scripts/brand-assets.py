"""
Build every branded image the app needs from ONE source logo.

    python scripts/brand-assets.py path/to/logo.png [--mark path/to/mark.png]

Rebranding is otherwise a scavenger hunt — six files, three of them with rules
that are invisible until a store rejects the build or a phone draws a white box
in dark mode. This does the lot:

    assets/images/receiptLogo.png          the lockup, TRANSPARENT (light mode)
    assets/images/receiptLogoDark.png      the same with a white wordmark
    assets/images/appIcon.png              1024, OPAQUE — iOS rejects alpha
    assets/images/adaptiveIconForeground.png   Android, transparent, inside the
                                               safe circle Android masks to
    assets/images/adaptiveIconMonochrome.png   Android themed icons, silhouette

The rules this encodes, each of which has cost us a release before:
  * iOS icons must have NO alpha channel, so the icon is flattened onto white.
  * Android masks the adaptive icon to a circle and crops ~25% off each edge,
    so the mark is drawn at 66% of the canvas, centred.
  * A logo with a baked-in white background shows as a white box on a dark
    screen, so near-white pixels become transparent and the colours are
    un-mixed from that background.
  * A dark wordmark vanishes on a dark screen, so the dark variant repaints
    NEUTRAL (grey/black) pixels white and leaves coloured ones alone.

Needs Pillow (`pip install pillow`). A dev tool, not part of the app bundle.

The source should be the biggest available: an export at 1024px or more, or a
PNG rendered from the SVG. Anything smaller is upscaled and will look soft —
the script says so rather than quietly shipping a blurry icon.
"""

import argparse
import os
import sys

try:
    from PIL import Image
except ImportError:  # pragma: no cover - a dev machine without Pillow
    sys.exit("Pillow is needed: pip install pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES = os.path.join(ROOT, "assets", "images")

LOCKUP_HEIGHT = 240  # what the splash and receipt draw from
ICON = 1024
SAFE_AREA = 0.66  # Android crops the adaptive icon to roughly this
NEUTRAL_RANGE = 70  # max channel spread still counted as grey/black, not colour
WHITE_FLOOR = 8  # alpha below this is background, not a faint edge


def cut_out_background(image):
    """Drop a baked-in white background and recover the colours underneath."""
    image = image.convert("RGBA")
    if any(pixel[3] < 255 for pixel in image.getdata()):
        return image  # already transparent, nothing to un-mix

    out = Image.new("RGBA", image.size)
    source, target = image.load(), out.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, _ = source[x, y]
            alpha = 255 - min(r, g, b)
            if alpha < WHITE_FLOOR:
                target[x, y] = (0, 0, 0, 0)
                continue
            share = alpha / 255
            target[x, y] = (
                *[max(0, min(255, round((v - (1 - share) * 255) / share))) for v in (r, g, b)],
                alpha,
            )
    return out


def whiten_neutrals(image):
    """Repaint grey/black pixels white; leave the brand's colours alone."""
    out = Image.new("RGBA", image.size)
    source, target = image.load(), out.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = source[x, y]
            if a == 0:
                target[x, y] = (0, 0, 0, 0)
            elif max(r, g, b) - min(r, g, b) < NEUTRAL_RANGE:
                target[x, y] = (255, 255, 255, a)
            else:
                target[x, y] = (r, g, b, a)
    return out


def trim(image):
    box = image.getbbox()
    return image.crop(box) if box else image


def scaled_to_height(image, height):
    return image.resize((max(1, round(image.width * height / image.height)), height), Image.LANCZOS)


def centred_on(canvas_size, image, background=None):
    """Fit `image` inside the safe area of a square canvas."""
    canvas = Image.new("RGBA", (canvas_size, canvas_size), background or (0, 0, 0, 0))
    room = round(canvas_size * SAFE_AREA)
    ratio = min(room / image.width, room / image.height)
    fitted = image.resize((max(1, round(image.width * ratio)), max(1, round(image.height * ratio))), Image.LANCZOS)
    canvas.paste(fitted, ((canvas_size - fitted.width) // 2, (canvas_size - fitted.height) // 2), fitted)
    return canvas


def save(image, name):
    path = os.path.join(IMAGES, name)
    image.save(path, optimize=True)
    print(f"  {name:<32} {image.size[0]}x{image.size[1]}  {os.path.getsize(path) // 1024}KB")


def main():
    parser = argparse.ArgumentParser(description="Build the app's branded images from one logo.")
    parser.add_argument("source", help="the full lockup (mark + wordmark), as big as you have")
    parser.add_argument("--mark", help="the mark on its own, for the icons; defaults to the source")
    parser.add_argument(
        "--icon-background", default="#FFFFFF", help="behind the iOS icon, which cannot be transparent"
    )
    args = parser.parse_args()

    lockup = trim(cut_out_background(Image.open(args.source)))
    mark = trim(cut_out_background(Image.open(args.mark))) if args.mark else lockup

    if lockup.height < LOCKUP_HEIGHT or mark.height < ICON * SAFE_AREA:
        print(
            f"WARNING: the source is {lockup.width}x{lockup.height}. The icon needs a mark around "
            f"{round(ICON * SAFE_AREA)}px and the lockup {LOCKUP_HEIGHT}px tall; anything smaller is "
            "upscaled and will look soft on a phone. Ask for an SVG or a 1024px export.\n"
        )

    print("writing:")
    save(scaled_to_height(lockup, LOCKUP_HEIGHT), "receiptLogo.png")
    save(scaled_to_height(whiten_neutrals(lockup), LOCKUP_HEIGHT), "receiptLogoDark.png")

    # iOS refuses an icon with an alpha channel, so this one is flattened.
    icon = centred_on(ICON, mark, background=args.icon_background)
    save(icon.convert("RGB"), "appIcon.png")

    save(centred_on(ICON, mark), "adaptiveIconForeground.png")

    silhouette = Image.new("RGBA", mark.size)
    silhouette.putdata([(255, 255, 255, a) for (*_, a) in mark.convert("RGBA").getdata()])
    save(centred_on(ICON, silhouette), "adaptiveIconMonochrome.png")

    print("\nNothing else to change: src/theme/brand.js and app.json already point at these names.")
    print("Then: npm run check && npx expo export --platform android, and build.")


if __name__ == "__main__":
    main()
