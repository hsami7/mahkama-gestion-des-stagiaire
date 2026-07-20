"""Formal PDF report generator for intern profiles ("بطاقة معلومات متدرب").

Handles Arabic RTL text (reshaping + bidi) while keeping Latin values such as
emails, phone numbers, national IDs and dates untouched so they render as
standard Western numerals in the correct visual order.
"""
import os
import io
import re
import json
from datetime import datetime

_UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")

_FONT_CANDIDATES = [
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/tahoma.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
    os.path.join(os.path.dirname(__file__), "fonts", "arial.ttf"),
]
_BOLD_CANDIDATES = [
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/tahomabd.ttf",
    "C:/Windows/Fonts/segoeuib.ttf",
]

_BRAND = "#1E5631"
_BRAND_DARK = "#123D22"
_BRAND_LIGHT = "#EEF4EF"
_ACCENT = "#2E7D46"
_BORDER = "#E2E8F0"
_ROW_ALT = "#F7FAF8"
_INK = "#1A2E1F"
_MUTED = "#5A6B5A"

_ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩"
_WESTERN_DIGITS = "0123456789"
_DIGIT_MAP = {ord(a): w for a, w in zip(_ARABIC_DIGITS, _WESTERN_DIGITS)}

# Formal document titles keyed by common slug fragments.
_DOC_TITLES = {
    "convention": "اتفاقية التدريب (Convention de stage)",
    "demande": "طلب التدريب (Demande de stage)",
    "cin": "بطاقة التعريف الوطنية (CIN / ID)",
    "id": "بطاقة التعريف الوطنية (CIN / ID)",
    "identite": "بطاقة التعريف الوطنية (CIN / ID)",
    "assurance": "التأمين (Assurance / Insurance)",
    "insurance": "التأمين (Assurance / Insurance)",
    "cv": "السيرة الذاتية (CV / Resume)",
    "resume": "السيرة الذاتية (CV / Resume)",
    "photo": "الصورة الشخصية (Photo)",
    "lettre": "رسالة (Lettre)",
    "attestation": "شهادة (Attestation)",
}


def _register_font():
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.lib.fonts import addMapping

    regular = None
    bold = None
    for c in _FONT_CANDIDATES:
        if os.path.exists(c):
            try:
                pdfmetrics.registerFont(TTFont("ReportAr", c))
                regular = "ReportAr"
                break
            except Exception:
                pass
    for c in _BOLD_CANDIDATES:
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


def _doc_title(slug):
    key = str(slug).strip().lower()
    for frag, title in _DOC_TITLES.items():
        if frag in key:
            return title
    return str(slug)


def _doc_entries(intern):
    docs = {}
    if intern.documents:
        try:
            docs = json.loads(intern.documents)
        except Exception:
            docs = {}
    entries = []
    if docs:
        for k, v in docs.items():
            if k == "others":
                continue
            if v:
                entries.append(_doc_title(k))
    others = docs.get("others", []) if isinstance(docs.get("others"), list) else []
    for o in others:
        if isinstance(o, dict) and o.get("file"):
            entries.append(str(o.get("name", "مستند إضافي")))
    return entries


def _resolve_upload(path):
    """Turn a stored '/api/uploads/<name>' (or bare name) into an absolute file path."""
    if not path:
        return None
    name = str(path)
    name = re.sub(r"^/?api/uploads/", "", name)
    name = re.sub(r"^/?uploads/", "", name)
    name = name.lstrip("/")
    name = os.path.basename(name)
    if not name:
        return None
    full = os.path.join(_UPLOAD_FOLDER, name)
    return full if os.path.isfile(full) else None


def _is_pdf_file(path):
    try:
        with open(path, "rb") as f:
            return f.read(5) == b"%PDF-"
    except Exception:
        return False


def _doc_file_entries(intern):
    """Return [(title, local_path)] for every uploaded document file that exists on disk."""
    docs = {}
    if intern.documents:
        try:
            docs = json.loads(intern.documents)
        except Exception:
            docs = {}
    out = []
    if isinstance(docs, dict):
        for k, v in docs.items():
            if k == "others":
                continue
            if isinstance(v, str) and v.strip():
                local = _resolve_upload(v)
                if local:
                    out.append((_doc_title(k), local))
        others = docs.get("others", [])
        if isinstance(others, list):
            for o in others:
                if isinstance(o, dict) and o.get("file"):
                    local = _resolve_upload(o.get("file"))
                    if local:
                        out.append((str(o.get("name", "مستند إضافي")), local))
    return out


def build_filename(intern):
    """Return a dynamic filename: INT-0001_English_Name_Profile.pdf"""
    reg = "INT-%04d" % intern.id
    raw = intern.name_fr or intern.name or "Intern"
    slug = _to_western(raw)
    slug = re.sub(r"[^A-Za-z0-9]+", "_", slug).strip("_")
    if not slug:
        slug = "Intern"
    return "%s_%s_Profile.pdf" % (reg, slug)


def _status_color(status):
    s = (status or "").strip()
    mapping = {
        "نشط": ("#1E7D34", "#E6F4EA"),
        "قيد المراجعة": ("#B26A00", "#FFF4E0"),
        "منتهي": ("#5A6B5A", "#EEF1EE"),
        "مرفوض": ("#B3261E", "#FCE8E6"),
    }
    return mapping.get(s, (_BRAND, _BRAND_LIGHT))


def _photo_bytes(intern):
    """Return raw image bytes for the intern photo from a remote URL or local upload."""
    path = getattr(intern, "photo_path", None)
    if not path:
        return None
    p = str(path).strip()
    if p.lower().startswith(("http://", "https://")):
        try:
            import urllib.request
            req = urllib.request.Request(p, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=6) as resp:
                return resp.read()
        except Exception:
            return None
    local = _resolve_upload(p)
    if local and not _is_pdf_file(local):
        try:
            with open(local, "rb") as f:
                return f.read()
        except Exception:
            return None
    return None


def _fallback_avatar(side):
    """A drawn person-silhouette placeholder so the cell never looks empty."""
    from reportlab.lib import colors
    from reportlab.graphics.shapes import Drawing, Circle, Rect, Wedge
    from reportlab.platypus import Table, TableStyle

    d = Drawing(side, side)
    fg = colors.HexColor("#8AA692")
    d.add(Circle(side / 2.0, side * 0.66, side * 0.16, fillColor=fg, strokeColor=None))
    d.add(Wedge(side / 2.0, side * 0.12, side * 0.34, 0, 180, fillColor=fg, strokeColor=None))
    frame = Table([[d]], colWidths=[side], rowHeights=[side])
    frame.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(_BRAND_LIGHT)),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#CFDDD2")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return frame


def _photo_flowable(intern, size_cm=2.6):
    """Return an Image/placeholder Table flowable for the intern's avatar."""
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import Image, Table, TableStyle

    side = size_cm * cm
    data = _photo_bytes(intern)
    if data:
        try:
            from reportlab.lib.utils import ImageReader
            reader = ImageReader(io.BytesIO(data))
            img = Image(reader, width=side, height=side)
            frame = Table([[img]], colWidths=[side], rowHeights=[side])
            frame.setStyle(TableStyle([
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor(_BRAND)),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]))
            return frame
        except Exception:
            pass
    return _fallback_avatar(side)


def build_intern_pdf(interns, mode="summary"):
    """Return a BytesIO PDF buffer containing one formal page per intern.

    mode: "summary" -> profile page(s) only.
          "full"    -> profile page(s) with uploaded document files appended.
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    )
    from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT

    font_name, font_bold = _register_font()

    def ar(text):
        return _shape(text, font_name)

    def val(text):
        if text is None or text == "":
            return "—"
        return _to_western(text)

    def cell_ar_value(text):
        return ar(text) if text else "—"

    def ar_nowrap(text):
        """Shaped Arabic that will not break across lines (spaces -> NBSP)."""
        return ar(text).replace(" ", "\u00A0")

    # --- Paragraph styles -------------------------------------------------
    sys_title = ParagraphStyle(
        "SysTitle", fontName=font_bold, fontSize=13, alignment=TA_RIGHT,
        leading=17, textColor=colors.white,
    )
    doc_kicker = ParagraphStyle(
        "DocKicker", fontName=font_name, fontSize=9.5, alignment=TA_RIGHT,
        leading=13, textColor=colors.HexColor("#D6E5DA"),
    )
    export_date_style = ParagraphStyle(
        "ExportDate", fontName=font_name, fontSize=9.5, alignment=TA_LEFT,
        leading=13, textColor=colors.HexColor("#D6E5DA"),
    )
    name_ar_style = ParagraphStyle(
        "NameAr", fontName=font_bold, fontSize=17, alignment=TA_RIGHT,
        leading=22, textColor=colors.HexColor(_INK),
    )
    name_fr_style = ParagraphStyle(
        "NameFr", fontName=font_name, fontSize=11, alignment=TA_RIGHT,
        leading=15, textColor=colors.HexColor(_MUTED),
    )
    badge_style = ParagraphStyle(
        "Badge", fontName=font_bold, fontSize=10.5, alignment=TA_CENTER,
        leading=15,
    )
    kv_label = ParagraphStyle(
        "KvLabel", fontName=font_name, fontSize=8.5, alignment=TA_RIGHT,
        leading=12, textColor=colors.HexColor(_MUTED),
    )
    kv_value = ParagraphStyle(
        "KvValue", fontName=font_bold, fontSize=12, alignment=TA_RIGHT,
        leading=16, textColor=colors.HexColor(_BRAND_DARK),
    )
    section_style = ParagraphStyle(
        "Section", fontName=font_bold, fontSize=12, alignment=TA_RIGHT,
        leading=17, textColor=colors.HexColor(_BRAND),
    )
    label_style = ParagraphStyle(
        "Label", fontName=font_bold, fontSize=9.5, alignment=TA_RIGHT,
        leading=14, textColor=colors.HexColor("#374151"),
    )
    value_style = ParagraphStyle(
        "Value", fontName=font_name, fontSize=9.5, alignment=TA_RIGHT,
        leading=14, textColor=colors.HexColor(_INK),
    )
    doc_title_style = ParagraphStyle(
        "DocTitle", fontName=font_name, fontSize=10, alignment=TA_RIGHT,
        leading=15, textColor=colors.HexColor(_INK),
    )
    doc_tag_style = ParagraphStyle(
        "DocTag", fontName=font_bold, fontSize=9, alignment=TA_LEFT,
        leading=13, textColor=colors.HexColor("#1E7D34"),
    )
    footer_style = ParagraphStyle(
        "Footer", fontName=font_name, fontSize=8, alignment=TA_CENTER,
        leading=11, textColor=colors.HexColor("#98A398"),
    )

    export_date = _to_western(datetime.now().strftime("%d/%m/%Y"))

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=1.6 * cm, leftMargin=1.6 * cm,
        topMargin=1.4 * cm, bottomMargin=1.4 * cm,
        title="Fiche Stagiaire",
    )
    content_w = doc.width
    elements = []

    for idx, intern in enumerate(interns):
        if idx > 0:
            elements.append(PageBreak())

        # --- 1. Header bar ------------------------------------------------
        header_right = [
            Paragraph(ar("سِجِلّ - نظام إدارة المتدربين"), sys_title),
            Paragraph(ar("بطاقة معلومات متدرب"), doc_kicker),
        ]
        header_left = [
            Paragraph(ar("تاريخ التصدير"), export_date_style),
            Paragraph(export_date, export_date_style),
        ]
        header = Table(
            [[header_left, header_right]],
            colWidths=[content_w * 0.32, content_w * 0.68],
        )
        header.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(_BRAND)),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 14),
            ("RIGHTPADDING", (0, 0), (-1, -1), 14),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ]))
        elements.append(header)
        elements.append(Spacer(1, 14))

        # --- 3. Hero section ---------------------------------------------
        status = intern.status or "—"
        fg, bg = _status_color(status)
        badge = Table(
            [[Paragraph(
                '<font color="%s">%s</font>' % (fg, ar(status)), badge_style,
            )]],
            colWidths=[3.4 * cm],
        )
        badge.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(bg)),
            ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor(fg)),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("ROUNDEDCORNERS", [6, 6, 6, 6]),
        ]))

        name_block = [
            Paragraph(ar(intern.name or "—"), name_ar_style),
        ]
        if intern.name_fr:
            name_block.append(Paragraph(val(intern.name_fr), name_fr_style))
        name_block.append(Spacer(1, 6))
        name_block.append(badge)

        photo = _photo_flowable(intern)
        photo_w = 2.6 * cm
        hero = Table(
            [[photo, name_block]],
            colWidths=[photo_w, content_w - photo_w],
        )
        hero.setStyle(TableStyle([
            ("VALIGN", (0, 0), (0, 0), "MIDDLE"),
            ("VALIGN", (1, 0), (1, 0), "MIDDLE"),
            ("ALIGN", (0, 0), (0, 0), "CENTER"),
            ("LEFTPADDING", (0, 0), (0, 0), 0),
            ("RIGHTPADDING", (0, 0), (0, 0), 0),
            ("LEFTPADDING", (1, 0), (1, 0), 14),
            ("RIGHTPADDING", (1, 0), (1, 0), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        elements.append(hero)
        elements.append(Spacer(1, 12))

        # Key identifiers highlight box (2 columns)
        def id_cell(label, value):
            return [Paragraph(ar(label), kv_label), Paragraph(val(value), kv_value)]

        ids = Table(
            [[id_cell("رقم الهوية الوطنية (CIN)", intern.national_id),
              id_cell("رقم التسجيل", "INT-%04d" % intern.id)]],
            colWidths=[content_w / 2.0, content_w / 2.0],
        )
        ids.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(_BRAND_LIGHT)),
            ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#D3E2D7")),
            ("LINEAFTER", (0, 0), (0, -1), 0.75, colors.HexColor("#D3E2D7")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 14),
            ("RIGHTPADDING", (0, 0), (-1, -1), 14),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ]))
        elements.append(ids)
        elements.append(Spacer(1, 18))

        # --- 4. Structured data grid (4 columns) -------------------------
        elements.append(Paragraph(ar("البيانات التفصيلية"), section_style))
        elements.append(Spacer(1, 6))

        # pairs: (label, value, is_arabic_value)
        pairs = [
            ("البريد الإلكتروني", val(intern.email), False),
            ("رقم الهاتف", val(intern.phone), False),
            ("تاريخ الازدياد", val(intern.date_of_birth), False),
            ("العنوان", intern.address, True),
            ("تاريخ البدء", val(intern.start_date), False),
            ("تاريخ الانتهاء", val(intern.end_date), False),
            ("الجامعة / المعهد", intern.university, True),
            ("القسم", intern.department, True),
            ("المؤطر (المشرف)", intern.encadrant, True),
            ("الحالة", intern.status, True),
        ]

        def make_cell(label, value, is_ar):
            v = cell_ar_value(value) if is_ar else value
            return [Paragraph(ar(label), label_style),
                    Paragraph(v, value_style)]

        grid_rows = []
        for i in range(0, len(pairs), 2):
            left = pairs[i + 1] if i + 1 < len(pairs) else ("", "", True)
            right = pairs[i]
            grid_rows.append([
                make_cell(*left) if left[0] else Paragraph("", value_style),
                make_cell(*right),
            ])

        colw = content_w / 2.0
        grid = Table(grid_rows, colWidths=[colw, colw])
        grid_style = [
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("TOPPADDING", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor(_BORDER)),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor(_BORDER)),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1),
             [colors.white, colors.HexColor(_ROW_ALT)]),
        ]
        grid.setStyle(TableStyle(grid_style))
        elements.append(grid)
        elements.append(Spacer(1, 18))

        # --- 5. Document vault summary -----------------------------------
        elements.append(Paragraph(ar("المستندات (خزنة الوثائق)"), section_style))
        elements.append(Spacer(1, 6))
        entries = _doc_entries(intern)
        if entries:
            doc_rows = []
            for title in entries:
                doc_rows.append([
                    Paragraph(ar("مرفق متوفر ✓"), doc_tag_style),
                    Paragraph(ar_nowrap(title), doc_title_style),
                ])
            dtable = Table(doc_rows, colWidths=[4.5 * cm, content_w - 4.5 * cm])
            dtable.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor(_BORDER)),
                ("LINEBELOW", (0, 0), (-1, -2), 0.5, colors.HexColor(_BORDER)),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1),
                 [colors.white, colors.HexColor(_ROW_ALT)]),
            ]))
            elements.append(dtable)
        else:
            elements.append(Paragraph(ar("لا توجد مستندات مرفقة."), value_style))

        elements.append(Spacer(1, 20))
        footer_line = (
            "وثيقة مصدرة آلياً من نظام سِجِلّ لإدارة المتدربين — تاريخ التصدير: "
            + export_date
        )
        elements.append(Paragraph(ar(footer_line), footer_style))

    doc.build(elements)
    buffer.seek(0)

    if mode != "full":
        return buffer

    # --- Full mode: append the actual uploaded document files -------------
    attachments = []
    for intern in interns:
        for title, local in _doc_file_entries(intern):
            attachments.append((intern, title, local))
    if not attachments:
        return buffer

    try:
        from pypdf import PdfReader, PdfWriter
    except Exception:
        return buffer

    writer = PdfWriter()
    try:
        for page in PdfReader(buffer).pages:
            writer.add_page(page)
    except Exception:
        buffer.seek(0)
        return buffer

    for intern, title, local in attachments:
        pages_added = False
        if _is_pdf_file(local):
            try:
                for page in PdfReader(local).pages:
                    writer.add_page(page)
                pages_added = True
            except Exception:
                pages_added = False
        else:
            img_pdf = _image_to_pdf(local)
            if img_pdf is not None:
                try:
                    for page in PdfReader(img_pdf).pages:
                        writer.add_page(page)
                    pages_added = True
                except Exception:
                    pages_added = False
        if not pages_added:
            note = _attachment_error(intern, title)
            if note is not None:
                try:
                    for page in PdfReader(note).pages:
                        writer.add_page(page)
                except Exception:
                    pass

    out = io.BytesIO()
    writer.write(out)
    out.seek(0)
    return out


def _simple_page(title_text, subtitle_text=None):
    """Build a one-page BytesIO PDF used as an attachment divider/notice."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.enums import TA_RIGHT

    font_name, font_bold = _register_font()

    def ar(text):
        return _shape(text, font_name)

    buf = io.BytesIO()
    d = SimpleDocTemplate(
        buf, pagesize=A4,
        rightMargin=1.6 * cm, leftMargin=1.6 * cm,
        topMargin=6 * cm, bottomMargin=1.4 * cm,
    )
    title_style = ParagraphStyle(
        "AttTitle", fontName=font_bold, fontSize=18, alignment=TA_RIGHT,
        leading=24, textColor=colors.HexColor(_BRAND_DARK),
    )
    sub_style = ParagraphStyle(
        "AttSub", fontName=font_name, fontSize=11, alignment=TA_RIGHT,
        leading=16, textColor=colors.HexColor(_MUTED),
    )
    els = []
    bar = Table([[Paragraph(ar(title_text), title_style)]], colWidths=[d.width])
    bar.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(_BRAND_LIGHT)),
        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#D3E2D7")),
        ("LEFTPADDING", (0, 0), (-1, -1), 16),
        ("RIGHTPADDING", (0, 0), (-1, -1), 16),
        ("TOPPADDING", (0, 0), (-1, -1), 16),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
    ]))
    els.append(bar)
    if subtitle_text:
        els.append(Spacer(1, 12))
        els.append(Paragraph(ar(subtitle_text), sub_style))
    try:
        d.build(els)
    except Exception:
        return None
    buf.seek(0)
    return buf


def _attachment_error(intern, title):
    return _simple_page(title, "تعذّر عرض هذا المستند داخل الملف المجمّع.")


def _image_to_pdf(path):
    """Render an image file onto an A4 page, returning a BytesIO PDF."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm
    from reportlab.pdfgen import canvas as pdfcanvas
    try:
        from PIL import Image as PILImage
    except Exception:
        return None
    try:
        img = PILImage.open(path)
        iw, ih = img.size
    except Exception:
        return None
    if not iw or not ih:
        return None

    buf = io.BytesIO()
    page_w, page_h = A4
    margin = 1.6 * cm
    avail_w = page_w - 2 * margin
    avail_h = page_h - 2 * margin
    scale = min(avail_w / iw, avail_h / ih)
    draw_w = iw * scale
    draw_h = ih * scale
    x = (page_w - draw_w) / 2.0
    y = (page_h - draw_h) / 2.0
    try:
        from reportlab.lib.utils import ImageReader
        c = pdfcanvas.Canvas(buf, pagesize=A4)
        c.drawImage(ImageReader(path), x, y, width=draw_w, height=draw_h,
                    preserveAspectRatio=True, mask="auto")
        c.showPage()
        c.save()
    except Exception:
        return None
    buf.seek(0)
    return buf
