"""Clean, formal PDF report generator for intern profiles.

Handles Arabic RTL text (reshaping + bidi) while keeping Latin values such as
emails, phone numbers, national IDs and dates untouched so they render as
standard Western numerals in the correct visual order.
"""
import os
import io
import json

_FONT_CANDIDATES = [
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/tahoma.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
    os.path.join(os.path.dirname(__file__), "fonts", "arial.ttf"),
]

_BRAND = "#1E5631"
_BRAND_LIGHT = "#F1F5F1"
_BORDER = "#C8D2C8"
_ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩"
_WESTERN_DIGITS = "0123456789"
_DIGIT_MAP = {ord(a): w for a, w in zip(_ARABIC_DIGITS, _WESTERN_DIGITS)}


def _register_font():
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.lib.fonts import addMapping

    regular = None
    bold = None
    for c in _FONT_CANDIDATES:
        if os.path.exists(c) and regular is None:
            try:
                pdfmetrics.registerFont(TTFont("ReportAr", c))
                regular = "ReportAr"
            except Exception:
                pass
    for c in ["C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/tahomabd.ttf",
              "C:/Windows/Fonts/segoeuib.ttf"]:
        if os.path.exists(c):
            try:
                pdfmetrics.registerFont(TTFont("ReportArBold", c))
                bold = "ReportArBold"
                break
            except Exception:
                pass

    if regular is None:
        return "Helvetica", "Helvetica-Bold"
    if bold is None:
        bold = regular
    try:
        addMapping("ReportAr", 0, 0, regular)
        addMapping("ReportAr", 1, 0, bold)
    except Exception:
        pass
    return regular, bold


def _to_western(text):
    return str(text).translate(_DIGIT_MAP)


def _shape(text, font_name):
    """Reshape + bidi an Arabic string for correct RTL rendering."""
    if text is None:
        return ""
    text = _to_western(text)
    if font_name == "Helvetica":
        return text
    try:
        import bidi.algorithm as bidi
        import arabic_reshaper
        return bidi.get_display(arabic_reshaper.reshape(text))
    except Exception:
        return text


def _doc_lines(intern):
    docs = {}
    if intern.documents:
        try:
            docs = json.loads(intern.documents)
        except Exception:
            docs = {}
    lines = []
    if docs:
        for k, v in docs.items():
            if k == "others":
                continue
            if v:
                lines.append(str(k))
    others = docs.get("others", []) if isinstance(docs.get("others"), list) else []
    for o in others:
        if isinstance(o, dict) and o.get("file"):
            lines.append(str(o.get("name", "مستند إضافي")))
    return lines


def build_intern_pdf(interns):
    """Return a BytesIO PDF buffer containing one formal page per intern."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    )
    from reportlab.lib.enums import TA_RIGHT, TA_CENTER

    font_name, font_bold = _register_font()

    def ar(text):
        return _shape(text, font_name)

    def val(text):
        """Latin/numeric values: force western digits, no reshaping."""
        if text is None or text == "":
            return "—"
        return _to_western(text)

    title_style = ParagraphStyle(
        "ReportTitle", fontName=font_bold, fontSize=17, alignment=TA_CENTER,
        leading=22, textColor=colors.HexColor(_BRAND),
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle", fontName=font_name, fontSize=10, alignment=TA_CENTER,
        leading=15, textColor=colors.HexColor("#5A6B5A"),
    )
    section_style = ParagraphStyle(
        "ReportSection", fontName=font_bold, fontSize=12, alignment=TA_RIGHT,
        leading=18, textColor=colors.HexColor(_BRAND), spaceBefore=6, spaceAfter=6,
    )
    label_style = ParagraphStyle(
        "ReportLabel", fontName=font_bold, fontSize=10.5, alignment=TA_RIGHT,
        leading=16, textColor=colors.HexColor("#333333"),
    )
    value_style = ParagraphStyle(
        "ReportValue", fontName=font_name, fontSize=10.5, alignment=TA_RIGHT,
        leading=16, textColor=colors.HexColor("#1A1A1A"),
    )
    footer_style = ParagraphStyle(
        "ReportFooter", fontName=font_name, fontSize=8, alignment=TA_CENTER,
        leading=12, textColor=colors.HexColor("#8A968A"),
    )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=1.8 * cm, leftMargin=1.8 * cm,
        topMargin=1.8 * cm, bottomMargin=1.8 * cm,
        title="Fiche Stagiaire",
    )
    elements = []

    for idx, intern in enumerate(interns):
        if idx > 0:
            elements.append(PageBreak())

        # Header
        elements.append(Paragraph(ar("بطاقة المتدرب"), title_style))
        name_line = ar(intern.name or "")
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(name_line, ParagraphStyle(
            "Name", fontName=font_bold, fontSize=14, alignment=TA_CENTER,
            leading=20, textColor=colors.HexColor("#1A1A1A"),
        )))
        if intern.name_fr:
            elements.append(Paragraph(val(intern.name_fr), subtitle_style))
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(
            "INT-%04d" % intern.id, subtitle_style,
        ))
        elements.append(Spacer(1, 16))

        # Rows: (label Arabic, value, is_arabic_value)
        rows = [
            ("رقم الهوية الوطنية", val(intern.national_id), False),
            ("البريد الإلكتروني", val(intern.email), False),
            ("رقم الهاتف", val(intern.phone), False),
            ("تاريخ الازدياد", val(intern.date_of_birth), False),
            ("تاريخ البدء", val(intern.start_date), False),
            ("تاريخ الانتهاء", val(intern.end_date), False),
            ("الجامعة أو المعهد", intern.university, True),
            ("القسم", intern.department, True),
            ("المؤطر", intern.encadrant, True),
            ("الحالة", intern.status, True),
            ("العنوان", intern.address, True),
        ]

        table_data = []
        for label, value, is_ar in rows:
            if is_ar:
                v = ar(value) if value else "—"
            else:
                v = value
            table_data.append([
                Paragraph(v, value_style),
                Paragraph(ar(label), label_style),
            ])

        table = Table(table_data, colWidths=[11 * cm, 6 * cm])
        table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("BACKGROUND", (1, 0), (1, -1), colors.HexColor(_BRAND_LIGHT)),
            ("ROWBACKGROUNDS", (0, 0), (0, -1), [colors.white, colors.HexColor("#FAFBFA")]),
            ("LINEBELOW", (0, 0), (-1, -1), 0.5, colors.HexColor(_BORDER)),
            ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor(_BORDER)),
            ("LINEAFTER", (1, 0), (1, -1), 0.75, colors.HexColor(_BORDER)),
        ]))
        elements.append(table)

        # Documents section
        elements.append(Spacer(1, 18))
        elements.append(Paragraph(ar("المستندات"), section_style))
        lines = _doc_lines(intern)
        if lines:
            doc_data = [[Paragraph(ar(line), value_style)] for line in lines]
            dtable = Table(doc_data, colWidths=[17 * cm])
            dtable.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("LINEBELOW", (0, 0), (-1, -1), 0.5, colors.HexColor(_BORDER)),
                ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor(_BORDER)),
            ]))
            elements.append(dtable)
        else:
            elements.append(Paragraph(ar("لا توجد مستندات."), value_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer
