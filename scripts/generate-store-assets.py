"""Generate Store PNGs from the existing icon and vector artwork, without network access."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "store-assets"
OUT.mkdir(exist_ok=True)

icon = Image.open(ROOT / "icons" / "icon128.png").convert("RGBA")
store_icon = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
store_icon.alpha_composite(icon.resize((96, 96), Image.Resampling.LANCZOS), (16, 16))
store_icon.save(OUT / "store-icon.png", optimize=True)

# The vector source remains the reference design. Draw at 3x for smooth edges.
scale = 3
promo = Image.new("RGB", (440 * scale, 280 * scale), "#161616")
draw = ImageDraw.Draw(promo)
def line(points, color, width):
    draw.line([(x * scale, y * scale) for x, y in points], fill=color, width=width * scale, joint="curve")
def rectangle(bounds, radius=6):
    draw.rounded_rectangle(tuple(v * scale for v in bounds), radius=radius * scale, fill="#262626", outline="#525252", width=2 * scale)

line([(110,96),(185,96),(200,100),(211,112),(220,140),(229,168),(240,180),(255,184),(330,184)], "#4589ff", 5)
line([(110,184),(185,184),(200,180),(211,168),(220,140),(229,112),(240,100),(255,96),(330,96)], "#4589ff", 5)
for y in (96, 184):
    line([(316,y-14),(330,y),(316,y+14)], "#4589ff", 5)
    rectangle((44,y-30,112,y+30))
    rectangle((332,y-30,396,y+30), 8)
    for x, half in ((66,4),(78,14),(90,8)):
        line([(x,y-half),(x,y+half)], "#78a9ff", 5)
line([(348,94),(355,94),(366,85),(366,107),(355,98),(348,98),(348,94)], "#f4f4f4", 3)
line([(374,88),(380,92),(382,96),(380,100),(374,104)], "#f4f4f4", 3)
draw.arc((348*scale,166*scale,380*scale,198*scale), 180, 360, fill="#f4f4f4", width=3*scale)
line([(348,182),(348,197),(353,197),(353,182),(348,182)], "#f4f4f4", 3)
line([(375,182),(375,197),(380,197),(380,182),(375,182)], "#f4f4f4", 3)
promo.resize((440,280), Image.Resampling.LANCZOS).save(OUT / "promo.png", optimize=True)
print("Created store-icon.png (128x128) and promo.png (440x280).")
