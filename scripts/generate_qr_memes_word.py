#!/usr/bin/env python3
"""Generate printable Word sheets: 6 or 8 meme QR cards per A4 page."""

from __future__ import annotations

import io
from dataclasses import dataclass
from pathlib import Path

import qrcode
from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Mm, Pt, RGBColor

SITE_URL = "https://alisherxasanov.github.io/amal-games/go-memes.html?v=1"

BLUE = RGBColor(0x22, 0x9E, 0xD9)
INK = RGBColor(0x10, 0x20, 0x18)
MUTED = RGBColor(0x33, 0x41, 0x55)
SIGN = RGBColor(0xE2, 0x5A, 0x3C)


@dataclass(frozen=True)
class Layout:
    rows: int
    cols: int
    qr_mm: float
    row_cm: float
    title_pt: float
    sub_pt: float
    scan_pt: float
    step_pt: float
    sign_pt: float
    margin_cm: float = 0.45


LAYOUTS: dict[int, Layout] = {
    6: Layout(rows=3, cols=2, qr_mm=36, row_cm=9.35, title_pt=16, sub_pt=11, scan_pt=12, step_pt=10, sign_pt=11),
    8: Layout(rows=4, cols=2, qr_mm=30, row_cm=6.95, title_pt=14, sub_pt=10, scan_pt=11, step_pt=9, sign_pt=10),
}


def make_qr_png_bytes(url: str) -> bytes:
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=1)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def set_cell_border(cell, color: str = "229ED9", size: int = 12) -> None:
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    borders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        tag = OxmlElement(f"w:{edge}")
        tag.set(qn("w:val"), "single")
        tag.set(qn("w:sz"), str(size))
        tag.set(qn("w:space"), "0")
        tag.set(qn("w:color"), color)
        borders.append(tag)
    tc_pr.append(borders)


def set_row_cant_split(row) -> None:
    tr = row._tr
    tr_pr = tr.get_or_add_trPr()
    cant = OxmlElement("w:cantSplit")
    tr_pr.append(cant)


def set_table_fixed(table) -> None:
    tbl = table._tbl
    tbl_pr = tbl.tblPr
    layout = OxmlElement("w:tblLayout")
    layout.set(qn("w:type"), "fixed")
    tbl_pr.append(layout)


def add_line(cell, text: str, *, size: float, bold: bool = False, color: RGBColor | None = None, after: float = 1, first: bool = False) -> None:
    p = cell.paragraphs[0] if first else cell.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.line_spacing = 1.0
    run = p.add_run(text)
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.name = "Arial"
    if color:
        run.font.color.rgb = color


def fill_card(cell, qr_bytes: bytes, layout: Layout) -> None:
    cell.text = ""
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    set_cell_border(cell)

    add_line(cell, "Бесплатно · без скачивания", size=layout.sub_pt - 1, bold=True, color=MUTED, after=2, first=True)
    add_line(cell, "😂 Мемы Амаля", size=layout.title_pt, bold=True, color=BLUE, after=2)
    add_line(cell, "Смешняшки · новости · что дома", size=layout.sub_pt, bold=True, color=INK, after=3)

    p = cell.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run()
    run.add_picture(io.BytesIO(qr_bytes), width=Mm(layout.qr_mm))

    add_line(cell, "📷 Наведи камеру сюда", size=layout.scan_pt, bold=True, color=BLUE, after=3)

    if layout.rows <= 3:
        steps = [
            "1. Открой камеру на телефоне",
            "2. Наведи на QR и нажми ссылку",
            "3. Напиши имя — кидай мемы",
        ]
    else:
        steps = [
            "1. Камера → QR → ссылка",
            "2. Имя → мемы и новости",
        ]

    for step in steps:
        add_line(cell, step, size=layout.step_pt, bold=True, color=INK, after=1)

    add_line(cell, "— Амаль ♥", size=layout.sign_pt, bold=True, color=SIGN, after=0)


def build_document(output_path: Path, cards_per_page: int) -> None:
    layout = LAYOUTS[cards_per_page]
    doc = Document()
    section = doc.sections[0]
    section.page_height = Mm(297)
    section.page_width = Mm(210)
    m = Cm(layout.margin_cm)
    section.top_margin = m
    section.bottom_margin = m
    section.left_margin = m
    section.right_margin = m

    qr_bytes = make_qr_png_bytes(SITE_URL)
    table = doc.add_table(rows=layout.rows, cols=layout.cols)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_fixed(table)

    usable_width = section.page_width - section.left_margin - section.right_margin
    col_width = int(usable_width / layout.cols)
    for col in table.columns:
        col.width = col_width

    for row in table.rows:
        set_row_cant_split(row)
        row.height = Cm(layout.row_cm)
        for cell in row.cells:
            fill_card(cell, qr_bytes, layout)

    doc.save(output_path)


def main() -> None:
    docs_dir = Path("/workspace/docs")
    artifact_dir = Path("/opt/cursor/artifacts")
    docs_dir.mkdir(parents=True, exist_ok=True)
    artifact_dir.mkdir(parents=True, exist_ok=True)

    for count in (6, 8):
        out = docs_dir / f"qr-memes-{count}-per-page.docx"
        build_document(out, count)
        artifact = artifact_dir / f"qr-memes-{count}-per-page.docx"
        artifact.write_bytes(out.read_bytes())
        print(f"Saved: {out}")
        print(f"Artifact: {artifact}")


if __name__ == "__main__":
    main()
