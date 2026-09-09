# -*- coding: utf-8 -*-
"""Генератор логотипа ЮСС.

Композиция повторяет действующий логотип ЮгСтройСегмент: ромбы, а поверх них —
буквы белым с тёмной обводкой. Буквы построены как геометрические контуры
(Ю = стойка + перемычка + кольцо, С = дуга), поэтому шрифт для открытия
файла не нужен.

Запуск:  python gen_logo.py <папка> [<папка2> ...]
"""
import math, os, sys

YELLOW = "#F5C518"
DARK   = "#1A2332"
WHITE  = "#FFFFFF"

CAP  = 100      # высота буквы
LW   = 330.7    # ширина блока букв
CX1  = 200      # центр первой С
CX2  = 302      # центр второй С
R    = 40       # радиус осевой линии дуг и кольца
SW   = 20       # толщина штриха буквы
OPEN = 55       # раскрытие С: дуга идёт от +55° до -55° через 180°
OUT  = 7        # толщина обводки вокруг букв
W    = LW + 2 * OUT   # 344.7 — ширина с обводкой

# Насколько длиннее белой должна быть тёмная дуга, чтобы на срезах С
# получилась ровная тёмная полоска той же толщины, что и вся обводка.
# Длина дуги OUT на радиусе R — это угол OUT/R.
OPEN_OUT = OPEN - math.degrees(OUT / R)


def n(v):
    """Убирает хвосты вида 22.349999999999994."""
    v = round(v, 2)
    return int(v) if v == int(v) else v


def arc(cx, deg):
    """Дуга С с раскрытием deg градусов, снизу вверх через левую сторону."""
    dx, dy = R * math.cos(math.radians(deg)), R * math.sin(math.radians(deg))
    return f'M{n(cx + dx)} {n(50 - dy)}A{R} {R} 0 1 0 {n(cx + dx)} {n(50 + dy)}'


def _shapes(fill, stroke, sw, deg, ind):
    """Один проход по контурам букв: заливки Ю, затем кольцо и две дуги С."""
    return (
        f'{ind}<g fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="miter">\n'
        f'{ind}  <path d="M0 0h20v100H0z"/>\n'
        f'{ind}  <path d="M20 40h22v20H20z"/>\n'
        f'{ind}</g>\n'
        f'{ind}<g fill="none" stroke="{stroke}" stroke-width="{sw + SW}">\n'
        f'{ind}  <circle cx="82" cy="50" r="{R}"/>\n'
        f'{ind}  <path d="{arc(CX1, deg)}"/>\n'
        f'{ind}  <path d="{arc(CX2, deg)}"/>\n'
        f'{ind}</g>\n'
    )


def letters(y, outline=DARK, body=WHITE, ind="  "):
    """ЮСС с замкнутой обводкой.

    Тёмный проход раздут на OUT со всех сторон и вдобавок длиннее белого
    по дуге — иначе на срезах С обводки не будет и буква окажется незакрытой.
    """
    return (
        f'{ind}<g transform="translate({OUT} {y})">\n'
        + _shapes(outline, outline, 2 * OUT, OPEN_OUT, ind + "  ")
        + _shapes(body, body, 0, OPEN, ind + "  ")
        + f'{ind}</g>\n'
    )


def rhombus(cx, cy, hw, hh, left, right):
    """Ромб двумя половинами: левая и правая могут быть разного цвета."""
    cx, cy, hw, hh = n(cx), n(cy), n(hw), n(hh)
    return (
        f'  <path d="M{cx} {n(cy - hh)} {cx} {n(cy + hh)} {n(cx - hw)} {cy}Z" fill="{left}"/>\n'
        f'  <path d="M{cx} {n(cy - hh)} {n(cx + hw)} {cy} {cx} {n(cy + hh)}Z" fill="{right}"/>\n'
    )


def svg(vw, vh, body):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vw} {vh}" '
        f'width="{vw}" height="{vh}" role="img" aria-label="ЮСС — ЮгСтройСегмент">\n'
        f'  <title>ЮСС</title>\n{body}</svg>\n'
    )


def emblem_body(dark_part):
    """Три ромба как в действующем логотипе + ЮСС поверх.
    dark_part — чем рисовать тёмные половины: DARK на светлом фоне, WHITE на тёмном."""
    cx, cy = W / 2, 111
    return (
        rhombus(cx - 108, cy, 42, 83, YELLOW, YELLOW)          # левый жёлтый
        + rhombus(cx + 108, cy, 42, 83, dark_part, dark_part)  # правый тёмный
        + rhombus(cx, cy, 84, 111, YELLOW, dark_part)          # центральный жёлто-тёмный
        + letters(61)
    )


def icon(bg, dark_part):
    """Квадрат 512 для аватарок. Эмблема вписана в круг r=256 — переживёт круглую обрезку."""
    s = 420 / W
    x = n((512 - 420) / 2)
    y = n((512 - 222 * s) / 2)
    inner = "".join("  " + ln + "\n" for ln in emblem_body(dark_part).splitlines())
    return svg(512, 512,
               f'  <rect width="512" height="512" fill="{bg}"/>\n'
               f'  <g transform="translate({x} {y}) scale({round(s, 4)})">\n'
               f'{inner}'
               f'  </g>\n')


FILES = {
    "logo-uss.svg":            svg(W, 222, emblem_body(DARK)),   # на светлом фоне
    "logo-uss-white.svg":      svg(W, 222, emblem_body(WHITE)),  # на тёмном фоне и фото
    "logo-uss-icon-light.svg": icon(WHITE, DARK),                # аватарка на белом
    "logo-uss-icon-dark.svg":  icon(DARK, WHITE),                # аватарка на тёмном
}

for out_dir in sys.argv[1:]:
    for name, data in FILES.items():
        with open(os.path.join(out_dir, name), "w", encoding="utf-8") as f:
            f.write(data)
    print("written to", out_dir)
