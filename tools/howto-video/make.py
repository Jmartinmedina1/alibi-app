"""ALIBI 'How to play' cartoon. Usage: python3 make.py [en|es] [frames]   (frames = only draw test stills)"""
import math, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 720, 1280, 30
LANG = sys.argv[1] if len(sys.argv) > 1 else 'en'
ONLY_FRAMES = len(sys.argv) > 2 and sys.argv[2] == 'frames'
ART = 'art'
SFX = '/home/claude/alibi-app/app/assets/sounds'
TYPE = '/home/claude/alibi/fonts/SpecialElite-Regular.ttf'
SANS_B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

INK = (15, 42, 48); AMBER = (232, 162, 58); MANILA = (233, 216, 180); PAPER = (244, 235, 214)
RED = (194, 59, 46); GREEN = (62, 142, 90); SLATE = (28, 63, 71)

_fc = {}
def font(path, size):
    k = (path, size)
    if k not in _fc: _fc[k] = ImageFont.truetype(path, size)
    return _fc[k]

_ic = {}
def img(name):
    if name not in _ic: _ic[name] = Image.open(f'{ART}/{name}.png').convert('RGBA')
    return _ic[name]

BG = Image.open(f'{ART}/bg.png').convert('RGBA')

# ---------- easing ----------
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def prog(t, start, dur): return clamp((t - start) / dur)
def out_cubic(x): return 1 - (1 - x) ** 3
def out_back(x):
    c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2

# ---------- drawing helpers ----------
def circle_avatar(name, size, ring=AMBER, ring_w=None):
    ring_w = ring_w or max(4, size // 22)
    im = img(name).resize((size, size), Image.LANCZOS)
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)
    ImageDraw.Draw(out).ellipse((ring_w // 2, ring_w // 2, size - 1 - ring_w // 2, size - 1 - ring_w // 2), outline=ring, width=ring_w)
    return out

def put(canvas, im, cx, cy, scale=1.0, rot=0.0, alpha=1.0):
    if alpha <= 0 or scale <= 0.01: return
    if scale != 1: im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.LANCZOS)
    if rot: im = im.rotate(rot, resample=Image.BICUBIC, expand=True)
    if alpha < 1:
        a = im.getchannel('A').point(lambda v: int(v * alpha)); im = im.copy(); im.putalpha(a)
    canvas.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))

def wrap(text, f, width):
    words, lines, cur = text.split(), [], ''
    d = ImageDraw.Draw(Image.new('RGB', (1, 1)))
    for w in words:
        test = (cur + ' ' + w).strip()
        if d.textlength(test, font=f) <= width: cur = test
        else:
            lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def card(text, w, f, fill=PAPER, color=INK, pad=22, radius=14, border=None, align='left', line_gap=8):
    lines = wrap(text, f, w - 2 * pad)
    lh = f.size + line_gap
    h = pad * 2 + lh * len(lines) - line_gap
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, w - 1, h - 1), radius=radius, fill=fill, outline=border, width=4 if border else 0)
    for i, ln in enumerate(lines):
        x = pad if align == 'left' else (w - d.textlength(ln, font=f)) / 2
        d.text((x, pad + i * lh), ln, font=f, fill=color)
    return im

def stamp(text, size, color=RED):
    f = font(TYPE, size)
    d0 = ImageDraw.Draw(Image.new('RGB', (1, 1)))
    tw = int(d0.textlength(text, font=f)); pad = size // 3
    im = Image.new('RGBA', (tw + pad * 2, size + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((3, 3, im.width - 4, im.height - 4), radius=8, outline=color + (255,), width=6)
    d.text((pad, pad - size // 10), text, font=f, fill=color + (255,))
    return im

def pill(text, size, fill, color=(255, 255, 255)):
    f = font(SANS_B, size)
    d0 = ImageDraw.Draw(Image.new('RGB', (1, 1)))
    tw = int(d0.textlength(text, font=f)); padx, pady = size // 1.4, size // 2.6
    im = Image.new('RGBA', (int(tw + padx * 2), int(size + pady * 2)), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, im.width - 1, im.height - 1), radius=im.height // 2, fill=fill + (255,))
    d.text((padx, pady - size // 8), text, font=f, fill=color)
    return im

def polaroid(title, sub=None, w=300, mark='?', mark_color=INK):
    h = int(w * 1.12)
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, w - 1, h - 1), fill=PAPER + (255,))
    d.rectangle((18, 18, w - 19, int(h * 0.68)), fill=(214, 196, 158, 255))
    if mark == 'mic':
        m = mic(int(w * 0.55)); im.alpha_composite(m, ((w - m.width) // 2, int(h * 0.1)))
    else:
        f = font(TYPE, int(w * 0.36))
        tw = d.textlength(mark, font=f)
        d.text(((w - tw) / 2, int(h * 0.12)), mark, font=f, fill=mark_color)
    f2 = font(TYPE, int(w * 0.105))
    for i, ln in enumerate(wrap(title, f2, w - 30)):
        tw = d.textlength(ln, font=f2)
        d.text(((w - tw) / 2, int(h * 0.72) + i * (f2.size + 4)), ln, font=f2, fill=INK)
    return im

def arrow(d, x1, y1, x2, y2, color, width=10):
    d.line((x1, y1, x2, y2), fill=color, width=width)
    ang = math.atan2(y2 - y1, x2 - x1); L = 30
    p1 = (x2 - L * math.cos(ang - 0.45), y2 - L * math.sin(ang - 0.45))
    p2 = (x2 - L * math.cos(ang + 0.45), y2 - L * math.sin(ang + 0.45))
    d.polygon([(x2, y2), p1, p2], fill=color)

def lamp(canvas, cx, top, bottom, alpha=1.0):
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.polygon([(cx - 40, top), (cx + 40, top), (cx + 230, bottom), (cx - 230, bottom)], fill=(255, 214, 140, int(46 * alpha)))
    d.ellipse((cx - 34, top - 26, cx + 34, top + 14), fill=(255, 226, 150, int(255 * alpha)))
    d.rectangle((cx - 4, 0, cx + 4, top - 20), fill=(40, 40, 40, int(255 * alpha)))
    canvas.alpha_composite(layer)

def logo_img():
    f = font(TYPE, 150)
    d0 = ImageDraw.Draw(Image.new('RGB', (1, 1)))
    tw = int(d0.textlength('ALIBI', font=f))
    im = Image.new('RGBA', (tw + 60, 180), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.text((10, 0), 'ALIBI', font=f, fill=MANILA)
    d.ellipse((tw + 16, 118, tw + 48, 150), fill=RED)
    return im

def mic(w):
    im = Image.new('RGBA', (w, w), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    cx = w // 2
    d.rounded_rectangle((cx - w * 0.16, w * 0.08, cx + w * 0.16, w * 0.5), radius=int(w * 0.16), fill=(60, 60, 66))
    for k in range(5): d.line((cx - w * 0.14, w * (0.14 + k * 0.07), cx + w * 0.14, w * (0.14 + k * 0.07)), fill=(130, 130, 140), width=2)
    d.arc((cx - w * 0.24, w * 0.2, cx + w * 0.24, w * 0.62), 0, 180, fill=(60, 60, 66), width=max(3, w // 30))
    d.rectangle((cx - w * 0.03, w * 0.62, cx + w * 0.03, w * 0.82), fill=(60, 60, 66))
    d.rectangle((cx - w * 0.16, w * 0.82, cx + w * 0.16, w * 0.88), fill=(60, 60, 66))
    return im

# ---------- narrator (Inspector + caption bubble) ----------
def narrator(canvas, t, text, mood='inspector-suspicious'):
    a = out_cubic(prog(t, 0.0, 0.35))
    insp = img(mood).resize((210, 210), Image.LANCZOS)
    put(canvas, insp, 112, 1150 + (1 - a) * 80, alpha=a)
    f = font(TYPE, 38)
    bubble = card(text, 500, f, fill=MANILA + (255,), pad=24, border=(200, 176, 128))
    by = 1235 - bubble.height
    put(canvas, bubble, 210 + 250, by + bubble.height / 2 + (1 - a) * 40, alpha=a)
    # little bubble tail
    d = ImageDraw.Draw(canvas)
    if a > 0.9: d.polygon([(214, by + bubble.height - 70), (214, by + bubble.height - 30), (186, by + bubble.height - 40)], fill=MANILA)

# ---------- copy ----------
T = {
 'en': {
  's1': 'Last night, everyone was at the same secret place…',
  's2': '…except ONE of you: the LIAR!',
  's3': 'Detectives know the place. The Liar only gets a hint.',
  's4': 'Take turns in the HOT SEAT. Pick an answer that proves you were there!',
  's5': 'Everyone judges every answer: SUS or LEGIT?',
  's6': 'Point at the Liar… and hear their excuse!',
  's7': 'Catch the Liar: +100. If the Liar escapes: +200!',
  's8': 'Ready, detective?',
  'place': 'KARAOKE BAR', 'det': 'DETECTIVE', 'liar': 'LIAR', 'hint': 'Hint: somewhere with an audience',
  'q': 'What did you eat there?', 'a1': 'I ate nachos while my friend butchered a chorus.',
  'a2': 'I ate a pretzel that fought back.', 'sus': 'SUS', 'legit': 'LEGIT',
  'obj': 'OBJECTION!', 'excuse': '“I was undercover. As a lamp.”', 'caught': 'CAUGHT', 'play': 'PLAY NOW', 'tag': 'Everyone was there… except one of you.',
 },
 'es': {
  's1': 'Anoche, todos estuvieron en el mismo lugar secreto…',
  's2': '…menos UNO de ustedes: ¡el MENTIROSO!',
  's3': 'Los detectives conocen el lugar. El Mentiroso solo tiene una pista.',
  's4': 'Por turnos, al BANQUILLO. ¡Elige una respuesta que demuestre que estuviste ahí!',
  's5': 'Todos juzgan cada respuesta: ¿SOSPECHOSO o CREÍBLE?',
  's6': 'Señala al Mentiroso… ¡y escucha su excusa!',
  's7': 'Atrapa al Mentiroso: +100. Si se escapa: ¡+200!',
  's8': '¿Listo, detective?',
  'place': 'BAR DE KARAOKE', 'det': 'DETECTIVE', 'liar': 'MENTIROSO', 'hint': 'Pista: un lugar con público',
  'q': '¿Qué comiste allí?', 'a1': 'Comí nachos mientras mi amigo destrozaba una canción.',
  'a2': 'Comí un pretzel que se defendió.', 'sus': 'SOSPECHOSO', 'legit': 'CREÍBLE',
  'obj': '¡PROTESTO!', 'excuse': '“Estaba de incógnito. Como lámpara.”', 'caught': 'ATRAPADO', 'play': '¡A JUGAR!', 'tag': 'Todos estuvieron ahí… menos uno.',
 },
}[LANG]

CREW = ['frog', 'owl', 'raccoon', 'unicorn']   # raccoon is the Liar
POS = [(150, 560), (290, 470), (430, 470), (570, 560)]

# ---------- scenes ----------
def s1(t):  # the secret place
    c = BG.copy()
    s = out_back(prog(t, 0.1, 0.5))
    logo = logo_img()
    put(c, logo, 360, 170, scale=0.4 + 0.6 * s, alpha=clamp(s * 2))
    p = out_back(prog(t, 1.4, 0.6))
    put(c, polaroid(T['place'], mark='mic', w=280), 360, 470, scale=p, rot=-4, alpha=clamp(p * 2))
    for i, (nm, (x, y)) in enumerate(zip(CREW, [(130, 760), (283, 820), (437, 820), (590, 760)])):
        q = out_back(prog(t, 2.4 + i * 0.25, 0.45))
        put(c, circle_avatar(nm, 140), x, y + (1 - q) * 300, alpha=clamp(q * 2))
    narrator(c, t, T['s1'])
    return c

def s2(t):  # one of them is the liar
    c = BG.copy()
    for i, (nm, (x, y)) in enumerate(zip(CREW, POS)):
        liar = nm == 'raccoon'
        shake = math.sin(t * 50) * 8 * (1 - prog(t, 2.2, 0.6)) if liar and t > 1.9 else 0
        put(c, circle_avatar(nm, 150, ring=RED if liar and t > 1.9 else AMBER), x + shake, y)
        if not liar:
            q = out_back(prog(t, 0.6 + i * 0.25, 0.4))
            put(c, pill(T['det'], 20, GREEN), x, y + 105, scale=q, alpha=clamp(q * 2))
    q = out_back(prog(t, 1.9, 0.45))
    put(c, stamp(T['liar'], 56), 430, 735, scale=2.2 - 1.2 * q, rot=-10, alpha=clamp(q * 3))
    narrator(c, t, T['s2'], 'inspector-shocked' if t > 1.9 else 'inspector-suspicious')
    return c

def phone(title, color, body):
    w, h = 300, 520
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, w - 1, h - 1), radius=36, fill=(20, 24, 28, 255), outline=(90, 90, 90, 255), width=6)
    d.rounded_rectangle((16, 30, w - 17, h - 30), radius=20, fill=SLATE + (255,))
    st = stamp(title, 34, color)
    im.alpha_composite(st, ((w - st.width) // 2, 50))
    im.alpha_composite(body, ((w - body.width) // 2, 140))
    return im

def s3(t):  # detective vs liar phones
    c = BG.copy()
    left = phone(T['det'], AMBER, polaroid(T['place'], mark='mic', w=220))
    hint = card(T['hint'], 230, font(TYPE, 26), fill=MANILA + (255,), pad=16, align='center')
    body = Image.new('RGBA', (240, 360), (0, 0, 0, 0)); body.alpha_composite(polaroid('?????', mark='?', w=200, mark_color=RED), (20, 0))
    body.alpha_composite(hint, (5, 360 - hint.height))
    right = phone(T['liar'], RED, body)
    a = out_back(prog(t, 0.2, 0.6)); b = out_back(prog(t, 0.9, 0.6))
    put(c, left, 190, 560 + (1 - a) * 600, rot=4, alpha=clamp(a * 2))
    put(c, right, 530, 560 + (1 - b) * 600, rot=-4, alpha=clamp(b * 2))
    narrator(c, t, T['s3'])
    return c

def hot_seat(c, t, who, q_text, answers, chosen, t_choose):
    lamp(c, 360, 150, 640, alpha=out_cubic(prog(t, 0.0, 0.5)))
    put(c, circle_avatar(who, 230), 360, 400 + math.sin(t * 9) * 3 * (t < t_choose))
    qb = card(q_text, 560, font(TYPE, 36), fill=AMBER + (255,), align='center', pad=16)
    put(c, qb, 360, 105, alpha=out_cubic(prog(t, 0.3, 0.4)))
    y = 600
    for i, a in enumerate(answers):
        q = out_cubic(prog(t, 0.8 + i * 0.25, 0.35))
        sel = t >= t_choose and i == chosen
        im = card(a, 600, font(SANS_B, 25), fill=(255, 246, 223, 255) if sel else PAPER + (255,), border=AMBER if sel else None, pad=18)
        if t >= t_choose and i != chosen: q = q * clamp(1 - prog(t, t_choose, 0.3) * 0.65)
        put(c, im, 360 + (1 - out_cubic(prog(t, 0.8 + i * 0.25, 0.35))) * 500, y + im.height / 2, scale=1.06 if sel and t < t_choose + 0.25 else 1, alpha=q)
        y += im.height + 14

def s4(t):
    c = BG.copy()
    other = 'I danced in socks on a cold rink.' if LANG == 'en' else 'Bailé en calcetines sobre el hielo.'
    other2 = 'I ate popcorn in the front row.' if LANG == 'en' else 'Comí palomitas en primera fila.'
    hot_seat(c, t, 'frog', T['q'], [other, T['a1'], other2], 1, 3.6)
    narrator(c, t, T['s4'])
    return c

def s5(t):
    c = BG.copy()
    lamp(c, 360, 150, 560)
    put(c, circle_avatar('raccoon', 200), 360, 330)
    ans = card(T['a2'], 620, font(SANS_B, 30), fill=PAPER + (255,), pad=22)
    q = out_back(prog(t, 0.3, 0.45))
    put(c, ans, 360, 560, scale=0.6 + 0.4 * q, rot=-2, alpha=clamp(q * 2))
    badges = [(T['sus'], RED, 160, 720, 1.4), (T['sus'], RED, 560, 700, 1.9), (T['legit'], SLATE, 360, 800, 2.3), (T['sus'], RED, 250, 860, 2.7)]
    for txt, col, x, y, st in badges:
        b = out_back(prog(t, st, 0.35))
        put(c, pill(txt, 30, col), x, y, scale=b, rot=(-8 if x < 360 else 8), alpha=clamp(b * 2))
    narrator(c, t, T['s5'], 'inspector-shocked' if t > 2.7 else 'inspector-suspicious')
    return c

def s6(t):
    c = BG.copy()
    tx, ty = 360, 330
    put(c, circle_avatar('raccoon', 190, ring=RED), tx, ty)
    voters = [('frog', 130, 720), ('owl', 360, 800), ('unicorn', 590, 720)]
    d = ImageDraw.Draw(c)
    for i, (nm, x, y) in enumerate(voters):
        put(c, circle_avatar(nm, 130), x, y)
        a = prog(t, 0.4 + i * 0.3, 0.4)
        if a > 0:
            ex, ey = x + (tx - x) * 0.72 * out_cubic(a), y + (ty - y) * 0.72 * out_cubic(a)
            arrow(d, x, y - 70, ex, ey + 20, AMBER, 9)
    o = out_back(prog(t, 2.2, 0.4))
    if t > 2.2:
        sh = math.sin(t * 60) * 10 * (1 - prog(t, 2.2, 0.5))
        put(c, stamp(T['obj'], 72), 360 + sh, 540, scale=0.5 + 0.5 * o, rot=-4, alpha=clamp(o * 2))
    e = out_cubic(prog(t, 3.2, 0.4))
    put(c, card(T['excuse'], 560, font(TYPE, 36), fill=PAPER + (255,), align='center', pad=20), 360, 960 - 30 * e, alpha=e)
    narrator(c, t, T['s6'], 'inspector-smug' if t > 3.4 else 'inspector-suspicious')
    return c

def s7(t):
    c = BG.copy()
    # mugshot board with height lines
    board = Image.new('RGBA', (420, 520), (216, 201, 166, 255))
    d = ImageDraw.Draw(board)
    for i in range(0, 520, 52): d.line((0, i, 420, i), fill=(150, 130, 95, 255), width=3)
    board.alpha_composite(circle_avatar('raccoon', 280, ring=INK), (70, 60))
    put(c, board, 360, 420, rot=-2)
    s = out_back(prog(t, 0.7, 0.35))
    put(c, stamp(T['caught'], 70), 360, 610, scale=2.2 - 1.2 * s, rot=-12, alpha=clamp(s * 3))
    for i, (nm, x) in enumerate([('frog', 150), ('owl', 360), ('unicorn', 570)]):
        put(c, circle_avatar(nm, 110), x, 820)
        p = out_back(prog(t, 2.0 + i * 0.25, 0.35))
        put(c, pill('+100', 30, GREEN), x, 745 - 30 * p, scale=p, alpha=clamp(p * 2))
    narrator(c, t, T['s7'], 'inspector-smug')
    return c

def s8(t):
    c = BG.copy()
    s = out_back(prog(t, 0.1, 0.5))
    logo = logo_img()
    put(c, logo, 360, 260, scale=s, alpha=clamp(s * 2))
    put(c, card(T['tag'], 600, font(TYPE, 34), fill=(0, 0, 0, 0), color=AMBER, align='center'), 360, 400, alpha=out_cubic(prog(t, 0.6, 0.4)))
    for i, nm in enumerate(['dolphin', 'frog', 'owl', 'octopus', 'raccoon', 'panda', 'bull', 'unicorn']):
        x = 120 + (i % 4) * 160; y = 560 + (i // 4) * 165
        q = out_back(prog(t, 0.5 + i * 0.08, 0.35))
        put(c, circle_avatar(nm, 130), x, y, scale=q, alpha=clamp(q * 2))
    b = out_back(prog(t, 1.5, 0.4))
    put(c, pill(T['play'], 48, AMBER, INK), 360, 930, scale=b, alpha=clamp(b * 2))
    narrator(c, t, T['s8'], 'inspector-smug')
    return c

SCENES = [  # (draw, seconds, sound events [(t, name, vol)])
    (s1, 6.5, [(0.1, 'stamp', 0.7), (1.4, 'whoosh', 0.6), (2.4, 'tap', 0.6), (2.65, 'tap', 0.6), (2.9, 'tap', 0.6), (3.15, 'tap', 0.6)]),
    (s2, 5.0, [(0.6, 'tap', 0.6), (0.85, 'tap', 0.6), (1.1, 'tap', 0.6), (1.9, 'stamp', 0.9), (2.0, 'buzzer', 0.35)]),
    (s3, 6.0, [(0.2, 'whoosh', 0.6), (0.9, 'whoosh', 0.6)]),
    (s4, 7.0, [(0.0, 'drumroll', 0.4), (0.8, 'tap', 0.5), (1.05, 'tap', 0.5), (1.3, 'tap', 0.5), (3.6, 'thud', 0.8)]),
    (s5, 6.0, [(0.3, 'thud', 0.8), (1.4, 'tap', 0.6), (1.9, 'tap', 0.6), (2.3, 'tap', 0.6), (2.4, 'ooh', 0.6), (2.7, 'tap', 0.6)]),
    (s6, 7.0, [(0.4, 'whoosh', 0.5), (0.7, 'whoosh', 0.5), (1.0, 'whoosh', 0.5), (2.2, 'objection', 0.8)]),
    (s7, 6.5, [(0.7, 'stamp', 0.9), (1.9, 'ding', 0.6)]),
    (s8, 4.5, [(0.1, 'stamp', 0.6), (1.5, 'ding', 0.5)]),
]

def render():
    os.makedirs('out', exist_ok=True)
    if ONLY_FRAMES:
        for i, (fn, dur, _) in enumerate(SCENES):
            fn(dur * 0.8).convert('RGB').save(f'out/frame-{LANG}-{i + 1}.jpg', quality=88)
        return
    parts = []
    for i, (fn, dur, _) in enumerate(SCENES):
        tmp, final = f'out/{LANG}-s{i + 1}.tmp.mp4', f'out/{LANG}-s{i + 1}.mp4'
        p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                              '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', '-pix_fmt', 'yuv420p', tmp], stdin=subprocess.PIPE)
        n = int(dur * FPS)
        for k in range(n):
            t = k / FPS
            fr = fn(t)
            if k < 6: fr = Image.blend(Image.new('RGBA', (W, H), INK + (255,)), fr, k / 6)  # quick fade-in per scene
            p.stdin.write(fr.convert('RGB').tobytes())
        p.stdin.close()
        if p.wait() != 0: sys.exit('ffmpeg failed on scene %d' % (i + 1))
        os.replace(tmp, final)
        parts.append(final)
        print('scene', i + 1, 'ok', flush=True)
    with open(f'out/{LANG}-list.txt', 'w') as f:
        for pth in parts: f.write(f"file '{os.path.basename(pth)}'\n")
    subprocess.check_call(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', f'out/{LANG}-list.txt', '-c', 'copy', f'out/{LANG}-video.mp4'])
    # sound track
    import wave
    total = sum(d for _, d, _ in SCENES); sr = 22050
    mix = np.zeros(int(total * sr) + sr, dtype=np.float32); offset = 0.0
    cache = {}
    for _, dur, events in SCENES:
        for (et, name, vol) in events:
            if name not in cache:
                with wave.open(f'{SFX}/{name}.wav') as w: cache[name] = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
            s = cache[name]; st = int((offset + et) * sr)
            mix[st:st + len(s)] += s[:len(mix) - st] * vol
        offset += dur
    mix = np.clip(mix, -1, 1)
    with wave.open(f'out/{LANG}-audio.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((mix * 32767).astype(np.int16).tobytes())
    tmp = f'out/how-to-play-{LANG}.tmp.mp4'
    subprocess.check_call(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'out/{LANG}-video.mp4', '-i', f'out/{LANG}-audio.wav', '-map', '0:v', '-map', '1:a',
                           '-c:v', 'copy', '-c:a', 'aac', '-b:a', '96k', '-shortest', '-movflags', '+faststart', tmp])
    os.replace(tmp, f'out/how-to-play-{LANG}.mp4')
    print('done', f'out/how-to-play-{LANG}.mp4', os.path.getsize(f'out/how-to-play-{LANG}.mp4') // 1024, 'KB')

render()
