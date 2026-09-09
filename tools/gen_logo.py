# -*- coding: utf-8 -*-
"""Генератор логотипа ЮСС.

Композиция повторяет действующий логотип ЮгСтройСегмент: ромбы, а поверх них —
буквы белым с тёмной обводкой. Буквы построены как геометрические контуры
(Ю = стойка + перемычка + кольцо, С = дуга), поэтому шрифт для открытия
файла не нужен.

Запуск:  python gen_logo.py <папка> [<папка2> ...]
"""
import os, sys

YELLOW = "#F5C518"
DARK   = "#1A2332"
WHITE  = "#FFFFFF"

CAP  = 100      # высота буквы
LW   = 330.7    # ширина блока букв
CX2  = 302      # центр второй С
OUT  = 7        # толщина обводки вокруг букв
W    = LW + 2 * OUT   # 344.7 — ширина с обводкой


def _shapes(fill, stroke, sw, ind):
    """Один проход по контурам букв: сначала заливки, потом дуги."""
    return (
        f'{ind}<g fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="miter">\n'
        f'{ind}  <path d="M0 0h20v100H0z"/>\n'
        f'{ind}  <path d="M20 40h22v20H20z"/>\n'
        f'{ind}</g>\n'
        f'{ind}<g fill="none" stroke="{stroke}" stroke-width="{sw + 20}">\n'
        f'{ind}  <circle cx="82" cy="50" r="40"/>\n'
        f'{ind}  <path d="M222.94 17.23A40 40 0 1 0 222.94 82.77"/>\n'
        f'{ind}  <path d="M{CX2 + 22.94} 17.23A40 40 0 1 0 {CX2 + 22.94} 82.77"/>\n'
        f'{ind}</g>\n'
    )


def letters(y, outline=DARK, body=WHITE, ind="  "):
    """ЮСС с обводкой: сперва раздутый тёмный контур, сверху белые буквы."""
    inner = ind + "  "
    return (
        f'{ind}<g transform="translate({OUT} {y})">\n'
        f'{_shapes(outline, outline, 2 * OUT, inner)}'
        f'{_shapes(body, body, 0, inner)}'
        f'{ind}</g>\n'
    )


def n(v):
    """Убирает хвосты вида 22.349999999999994."""
    v = round(v, 2)
    return int(v) if v == int(v) else v


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
        rhombus(cx - 108, cy, 42, 83, YELLOW, YELLOW)      # левый жёлтый
        + rhombus(cx + 108, cy, 42, 83, dark_part, dark_part)  # правый тёмный
        + rhombus(cx, cy, 84, 111, YELLOW, dark_part)      # центральный жёлто-тёмный
        + letters(61)
    )


def solo_body(dark_part):
    """Один жёлто-тёмный ромб + ЮСС поверх."""
    cx, cy = W / 2, 145
    return rhombus(cx, cy, 145, 145, YELLOW, dark_part) + letters(95)


def icon(bg, dark_part):
    """Квадрат 512 для аватарок. Эмблема вписана в круг r=256 — переживёт круглую обрезку."""
    s = 420 / W
    x = round((512 - 420) / 2, 1)
    y = round((512 - 222 * s) / 2, 1)
    inner = "".join("  " + ln + "\n" for ln in emblem_body(dark_part).splitlines())
    body = (
        f'  <rect width="512" height="512" fill="{bg}"/>\n'
        f'  <g transform="translate({x} {y}) scale({round(s, 4)})">\n'
        f'{inner}'
        f'  </g>\n'
    )
    return svg(512, 512, body)


def plain(color):
    """Только буквы, без ромбов и обводки."""
    return svg(LW, CAP, _shapes(color, color, 0, "  "))


FILES = {
    # основной вариант — буквы поверх ромбов
    "logo-uss.svg":              svg(W, 222, emblem_body(DARK)),
    "logo-uss-white.svg":        svg(W, 222, emblem_body(WHITE)),
    # один ромб, для тесных мест
    "logo-uss-solo.svg":         svg(W, 290, solo_body(DARK)),
    "logo-uss-solo-white.svg":   svg(W, 290, solo_body(WHITE)),
    # квадрат для аватарок
    "logo-uss-icon-light.svg":   icon(WHITE, DARK),
    "logo-uss-icon-dark.svg":    icon(DARK, WHITE),
    # только буквы — для мелких мест и подписей
    "logo-uss-letters.svg":      plain(DARK),
    "logo-uss-letters-white.svg": plain(WHITE),
}

for out_dir in sys.argv[1:]:
    for name, data in FILES.items():
        with open(os.path.join(out_dir, name), "w", encoding="utf-8") as f:
            f.write(data)
    print("written to", out_dir)
