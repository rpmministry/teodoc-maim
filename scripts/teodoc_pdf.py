#!/usr/bin/env python3
"""Genera el PDF del análisis de TeoDoc con ReportLab, estilo IBM Carbon.

Este script es el generador "de servidor" de referencia. La app desplegada en
Vercel (Next.js) no ejecuta Python, por lo que el botón «PDF» usa el equivalente
client-side (jsPDF) con el mismo diseño. Este script sirve para generar el PDF
desde un backend Python o por lotes.

Uso:
    python scripts/teodoc_pdf.py analisis.json salida.pdf
    cat analisis.json | python scripts/teodoc_pdf.py - salida.pdf

La entrada es el JSON que devuelve /api/analyze:
    { titulo, idea_principal, infografia?, desarrollo_progresivo[],
      aplicacion[], oracion }
"""
from __future__ import annotations

import json
import sys
from datetime import date
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.pdfgen import canvas as pdf_canvas

# ---------------------------------------------------------------------------
# 1. Paleta Carbon
# ---------------------------------------------------------------------------
CARBON_TEXT = colors.HexColor("#161616")       # texto principal
CARBON_SECONDARY = colors.HexColor("#525252")  # texto secundario / metadatos
CARBON_ACCENT = colors.HexColor("#0F62FE")     # azul IBM Carbon
CARBON_RULE = colors.HexColor("#E0E0E0")       # líneas sutiles
CARBON_SURFACE = colors.HexColor("#F4F4F4")    # contenedor secundario
CARBON_WHITE = colors.HexColor("#FFFFFF")

# 2. A4 con márgenes rígidos de 2 cm (54 pt)
MARGIN = 54
PAGE_W, PAGE_H = A4
CONTENT_W = PAGE_W - MARGIN * 2

# 3. Estilos: leading estrictamente proporcional al fontSize, keepWithNext en
#    encabezados para evitar títulos huérfanos.
STYLES = {
    "title": ParagraphStyle(
        "title", fontName="Helvetica-Bold", fontSize=21, leading=25,
        textColor=CARBON_TEXT, spaceAfter=6,
    ),
    "idea": ParagraphStyle(
        "idea", fontName="Helvetica-Oblique", fontSize=12, leading=17,
        textColor=CARBON_SECONDARY, spaceAfter=12,
    ),
    "h2": ParagraphStyle(
        "h2", fontName="Helvetica-Bold", fontSize=13, leading=17,
        textColor=CARBON_TEXT, spaceBefore=2, spaceAfter=4, keepWithNext=True,
    ),
    "point": ParagraphStyle(
        "point", fontName="Helvetica-Bold", fontSize=11.5, leading=15,
        textColor=CARBON_TEXT, spaceBefore=4, spaceAfter=2, keepWithNext=True,
    ),
    "body": ParagraphStyle(
        "body", fontName="Helvetica", fontSize=10, leading=14,
        textColor=CARBON_SECONDARY, spaceAfter=4,
    ),
    "verse_cita": ParagraphStyle(
        "verse_cita", fontName="Helvetica-Bold", fontSize=9.5, leading=13,
        textColor=CARBON_ACCENT,
    ),
    "verse_text": ParagraphStyle(
        "verse_text", fontName="Helvetica-Oblique", fontSize=9.5, leading=13,
        textColor=CARBON_SECONDARY,
    ),
    "bullet": ParagraphStyle(
        "bullet", fontName="Helvetica", fontSize=10, leading=14,
        textColor=CARBON_SECONDARY, leftIndent=14, bulletIndent=2, spaceAfter=4,
    ),
    "meta": ParagraphStyle(
        "meta", fontName="Helvetica", fontSize=9, leading=12,
        textColor=CARBON_SECONDARY,
    ),
}


# ---------------------------------------------------------------------------
# 4. Helpers de maquetación (flujo secuencial dentro de `story`)
# ---------------------------------------------------------------------------
def section(label: str) -> Table:
    """Encabezado de sección con barra azul a la izquierda (keepWithNext)."""
    para = Paragraph(escape(label.upper()), STYLES["h2"])
    table = Table([[para]], colWidths=[CONTENT_W])
    table.setStyle(TableStyle([
        ("LINEBEFORE", (0, 0), (0, -1), 4, CARBON_ACCENT),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    table.keepWithNext = True
    return table


def verse_block(cita: str, texto: str) -> Table:
    """Versículo: fondo #F4F4F4, barra azul y celdas Paragraph (word wrap)."""
    inner = [
        [Paragraph(escape(cita), STYLES["verse_cita"])],
        [Paragraph(f'"{escape(texto)}"', STYLES["verse_text"])],
    ]
    table = Table(inner, colWidths=[CONTENT_W - 12])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CARBON_SURFACE),
        ("LINEBEFORE", (0, 0), (0, -1), 3, CARBON_ACCENT),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def summary_table(analisis: dict) -> Table:
    """Tabla de resumen con colWidths FIJOS y celdas Paragraph."""
    desarrollo = analisis.get("desarrollo_progresivo") or []
    total_versiculos = sum(len(p.get("versiculos") or []) for p in desarrollo)
    cells = [
        Paragraph("<b>Puntos</b>", STYLES["meta"]),
        Paragraph(str(len(desarrollo)), STYLES["meta"]),
        Paragraph("<b>Versículos</b>", STYLES["meta"]),
        Paragraph(str(total_versiculos), STYLES["meta"]),
    ]
    col = CONTENT_W / 4.0
    table = Table([cells], colWidths=[col, col, col, col])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CARBON_SURFACE),
        ("BOX", (0, 0), (-1, -1), 0.5, CARBON_RULE),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, CARBON_RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


# ---------------------------------------------------------------------------
# 5. Canvas de dos pasadas: "Página X de Y" + líneas #E0E0E0
# ---------------------------------------------------------------------------
class NumberedCanvas(pdf_canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_states: list[dict] = []

    def showPage(self):  # primera pasada: guarda el estado de cada página
        self._saved_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):  # segunda pasada: dibuja encabezado/pie y guarda
        total = len(self._saved_states)
        for state in self._saved_states:
            self.__dict__.update(state)
            self._draw_chrome(total)
            super().showPage()
        super().save()

    def _draw_chrome(self, total: int) -> None:
        self.setStrokeColor(CARBON_RULE)
        self.setLineWidth(0.75)
        self.line(MARGIN, MARGIN - 20, PAGE_W - MARGIN, MARGIN - 20)
        self.line(MARGIN, PAGE_H - MARGIN + 14, PAGE_W - MARGIN, PAGE_H - MARGIN + 14)

        self.setFont("Helvetica", 8)
        self.setFillColor(CARBON_SECONDARY)
        self.drawString(MARGIN, MARGIN - 28, "TeoDoc · Análisis Ministerial")
        self.drawRightString(
            PAGE_W - MARGIN, MARGIN - 28, f"Página {self._pageNumber} de {total}"
        )
        today = date.today().strftime("%d/%m/%Y")
        self.drawString(MARGIN, PAGE_H - MARGIN + 24, today)
        self.drawRightString(PAGE_W - MARGIN, PAGE_H - MARGIN + 24, "Generado con IA")


# ---------------------------------------------------------------------------
# 6. Construcción del documento
# ---------------------------------------------------------------------------
def build(analisis: dict, output: str) -> None:
    doc = SimpleDocTemplate(
        output,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN,
        title=str(analisis.get("titulo") or "Análisis"),
        author="TeoDoc",
    )

    story = []
    story.append(Paragraph(escape(str(analisis.get("titulo") or "Análisis de prédica")), STYLES["title"]))
    story.append(Paragraph(f'"{escape(str(analisis.get("idea_principal") or ""))}"', STYLES["idea"]))
    story.append(summary_table(analisis))
    story.append(Spacer(1, 14))

    # Desarrollo bíblico
    story.append(section("Desarrollo bíblico"))
    for i, item in enumerate(analisis.get("desarrollo_progresivo") or [], start=1):
        story.append(Paragraph(f'{i}. {escape(str(item.get("punto") or ""))}', STYLES["point"]))
        story.append(Paragraph(escape(str(item.get("explicacion") or "")), STYLES["body"]))
        for v in item.get("versiculos") or []:
            story.append(verse_block(str(v.get("cita") or ""), str(v.get("texto") or "")))
            story.append(Spacer(1, 4))
        story.append(Spacer(1, 8))

    # Aplicación práctica
    story.append(section("Aplicación práctica"))
    for app in analisis.get("aplicacion") or []:
        story.append(Paragraph(escape(str(app)), STYLES["bullet"], bulletText="•"))
    story.append(Spacer(1, 8))

    # Oración ministerial
    story.append(KeepTogether([
        section("Oración ministerial"),
        Paragraph(f'"{escape(str(analisis.get("oracion") or ""))}"', STYLES["body"]),
    ]))

    doc.build(story, canvasmaker=NumberedCanvas)


def main(argv: list[str]) -> int:
    src = argv[0] if argv else "-"
    output = argv[1] if len(argv) > 1 else "TeoDoc_Analisis.pdf"
    try:
        if src == "-":
            data = json.load(sys.stdin)
        else:
            with open(src, "r", encoding="utf-8") as handle:
                data = json.load(handle)
    except (OSError, json.JSONDecodeError) as error:
        print(f"Error leyendo el análisis: {error}", file=sys.stderr)
        return 1
    build(data, output)
    print(f"PDF generado: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
