"""Draws the two app icons (and the Android adaptive-icon layers) with Pillow.

    python shared/icons/make_icons.py

Passenger: an orange tile with a cream bus seen from the front. Driver: a dark tile with an orange steering wheel.
Colours are the app palette (shared/tokens.js PALETTE). Writes into apps/<app>/assets/:
icon.png (1024, full bleed), android-icon-foreground.png (1024, artwork inside the 66% safe zone),
android-icon-monochrome.png (1024, white shapes for themed icons), favicon.png (48).
The Android background is a plain colour set in app.json (adaptiveIcon.backgroundColor), so there is no background image.
"""
import math
import os
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
NIGHT, CREAM, ORANGE = (19, 14, 13, 255), (255, 243, 235, 255), (255, 107, 53, 255)
WHITE, CUT = (255, 255, 255, 255), (0, 0, 0, 0)
S = 4  # draw at 4x and shrink, for smooth edges
SIZE = 1024


def canvas(fill=CUT):
    return Image.new('RGBA', (SIZE * S, SIZE * S), fill)


def rrect(d, box, r, fill):
    x0, y0, x1, y1 = [v * S for v in box]
    d.rounded_rectangle((x0, y0, x1, y1), radius=r * S, fill=fill)


def circle(d, cx, cy, r, fill):
    d.ellipse(((cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S), fill=fill)


def bus(d, k, body, detail, light):
    """A bus from the front, centred on the canvas. `k` scales the 500 x 540 drawing."""
    def p(x, y):
        return 512 + x * k, 512 + (y - 15) * k
    def box(x0, y0, x1, y1):
        a, b = p(x0, y0); c, e = p(x1, y1)
        return (a, b, c, e)
    rrect(d, box(-215, 200, -135, 270), 18 * k, detail)   # wheels
    rrect(d, box(135, 200, 215, 270), 18 * k, detail)
    rrect(d, box(-250, -250, 250, 215), 70 * k, body)     # body
    rrect(d, box(-110, -215, 110, -172), 20 * k, detail)  # route sign
    rrect(d, box(-205, -140, 205, 45), 40 * k, detail)    # windscreen
    rrect(d, box(-7, -140, 7, 45), 0, body)               # pillar
    rrect(d, box(-250, 160, 250, 215), 30 * k, detail)    # bumper
    for sx in (-150, 150):
        x, y = p(sx, 100)
        circle(d, x, y, 38 * k, light)                    # headlights


def wheel(d, k, ring, mark):
    """A steering wheel, centred on the canvas. `k` scales the 250 px radius."""
    cx = cy = 512
    R, T = 250 * k, 64 * k
    circle(d, cx, cy, R, ring)
    circle(d, cx, cy, R - T, CUT if ring == WHITE else NIGHT)
    for ang in (180, 0, 90):                              # left, right and bottom spokes
        a = math.radians(ang)
        ux, uy = math.cos(a), math.sin(a)
        nx, ny = -uy, ux
        w = 28 * k
        x0, y0 = cx + ux * 40 * k, cy + uy * 40 * k
        x1, y1 = cx + ux * (R - T + 6 * k), cy + uy * (R - T + 6 * k)
        d.polygon([((x0 + nx * w) * S, (y0 + ny * w) * S), ((x1 + nx * w) * S, (y1 + ny * w) * S),
                   ((x1 - nx * w) * S, (y1 - ny * w) * S), ((x0 - nx * w) * S, (y0 - ny * w) * S)], fill=ring)
    circle(d, cx, cy, 84 * k, ring)                       # hub
    rrect(d, (cx - 13 * k, cy - R - 2 * k, cx + 13 * k, cy - R + T + 2 * k), 8 * k, mark)  # 12 o'clock mark


def finish(img, size=SIZE):
    return img.resize((size, size), Image.LANCZOS)


def draw_passenger(k, layer):
    img = canvas(ORANGE if layer == 'tile' else CUT)
    d = ImageDraw.Draw(img)
    if layer == 'mono':
        bus(d, k, WHITE, CUT, CUT)
    else:
        bus(d, k, CREAM, NIGHT, ORANGE)
    return img


def draw_driver(k, layer):
    img = canvas(NIGHT if layer == 'tile' else CUT)
    d = ImageDraw.Draw(img)
    if layer == 'mono':
        wheel(d, k, WHITE, CUT)
    else:
        wheel(d, k, ORANGE, CREAM)
    return img


APPS = {'passenger-app': draw_passenger, 'driver-app': draw_driver}

for app, draw in APPS.items():
    out = os.path.join(ROOT, 'apps', app, 'assets')
    tile = finish(draw(1.0, 'tile'))                       # icon: artwork on the full tile
    tile.convert('RGB').save(os.path.join(out, 'icon.png'))
    finish(draw(0.82, 'fg')).save(os.path.join(out, 'android-icon-foreground.png'))   # inside the adaptive safe zone
    finish(draw(0.82, 'mono')).save(os.path.join(out, 'android-icon-monochrome.png'))
    tile.resize((48, 48), Image.LANCZOS).convert('RGBA').save(os.path.join(out, 'favicon.png'))
    bg = os.path.join(out, 'android-icon-background.png')
    if os.path.exists(bg):
        os.remove(bg)
    print('icons ->', app)
