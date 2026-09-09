# -*- coding: utf-8 -*-
"""Генератор логотипа ЮСС. Буквы построены как геометрические контуры,
шрифт не требуется — файл одинаково откроется в любой программе."""
import os, sys

DARK = "#1A2332"
YELLOW = "#F5C518"
WHITE = "#FFFFFF"

W, H = 330.7, 100          # габарит блока букв
CX2 = 302                  # центр второй С

def letters(color, indent="  "):
    """ЮСС: Ю = стойка + перемычка + кольцо, С = дуга с раскрытием 110 град."""
    return (
        f'{indent}<g fill="{color}">\n'
        f'{indent}  <path d="M0 0h20v100H0z"/>\n'
        f'{indent}  <path d="M20 40h22v20H20z"/>\n'
        f'{indent}</g>\n'
        f'{indent}<g fill="none" stroke="{color}" stroke-width="20">\n'
        f'{indent}  <circle cx="82" cy="50" r="40"/>\n'
        f'{indent}  <path d="M222.94 17.23A40 40 0 1 0 222.94 82.77"/>\n'
        f'{indent}  <path d="M{CX2 + 22.94} 17.23A40 40 0 1 0 {CX2 + 22.94} 82.77"/>\n'
        f'{indent}</g>\n'
    )

def svg(vw, vh, body):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vw} {vh}" '
        f'width="{vw}" height="{vh}" role="img" aria-label="ЮСС — ЮгСтройСегмент">\n'
        f'  <title>ЮСС</title>\n{body}</svg>\n'
    )

def plain(color):
    return svg(W, H, letters(color))

def mark(color, diamond_right):
    """Ромб (как в фавиконке) + буквы. Ромб 128x128, отступ до букв 40."""
    body = (
        f'  <path d="M64 0 64 128 0 64Z" fill="{YELLOW}"/>\n'
        f'  <path d="M64 0 128 64 64 128Z" fill="{diamond_right}"/>\n'
        f'  <g transform="translate(168 14)">\n{letters(color, "    ")}  </g>\n'
    )
    return svg(round(168 + W, 1), 128, body)

def icon(bg, color, diamond_right):
    """Квадрат 512 для аватарок. Всё внутри круга r=256 — переживёт круглую обрезку."""
    s = 1.2
    x = round((512 - W * s) / 2, 1)
    body = (
        f'  <rect width="512" height="512" fill="{bg}"/>\n'
        f'  <path d="M256 98 256 194 208 146Z" fill="{YELLOW}"/>\n'
        f'  <path d="M256 98 304 146 256 194Z" fill="{diamond_right}"/>\n'
        f'  <g transform="translate({x} 245) scale({s})">\n{letters(color, "    ")}  </g>\n'
    )
    return svg(512, 512, body)

FILES = {
    "logo-uss.svg":            plain(DARK),
    "logo-uss-white.svg":      plain(WHITE),
    "logo-uss-mark.svg":       mark(DARK, DARK),
    "logo-uss-mark-white.svg": mark(WHITE, WHITE),
    "logo-uss-icon-dark.svg":  icon(DARK, WHITE, WHITE),
    "logo-uss-icon-light.svg": icon(WHITE, DARK, DARK),
}

for out_dir in sys.argv[1:]:
    for name, data in FILES.items():
        with open(os.path.join(out_dir, name), "w", encoding="utf-8") as f:
            f.write(data)
    print("written to", out_dir)
