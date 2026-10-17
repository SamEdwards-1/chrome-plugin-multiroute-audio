"""Generate the raster extension icons from one simple equalizer mark.

Requires Pillow. The PNG files are checked in so packaging needs no Python.
"""

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "icons"
OUTPUT.mkdir(exist_ok=True)

image = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((0, 0, 511, 511), radius=96, fill="#161616")
for left, top in ((112, 208), (224, 112), (336, 168)):
    draw.rounded_rectangle((left, top, left + 64, 400), radius=24, fill="#4589ff")

for size in (16, 32, 48, 128):
    image.resize((size, size), Image.Resampling.LANCZOS).save(
        OUTPUT / f"icon{size}.png", optimize=True
    )
