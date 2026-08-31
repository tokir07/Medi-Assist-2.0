import io
import json
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

def generate_medical_summary_pdf(record, current_patient=None) -> bytes:
    """
    Generates a beautifully structured, executive-grade clinical PDF report
    containing the Doctor's 30-Second Executive Briefing, Structured Laboratory Table,
    Plain-Language Patient Guide, and Clinical Observations.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    teal_primary = colors.HexColor("#0D9488")
    teal_dark = colors.HexColor("#0F766E")
    indigo_primary = colors.HexColor("#4F46E5")
    slate_dark = colors.HexColor("#0F172A")
    slate_body = colors.HexColor("#334155")
    slate_light = colors.HexColor("#F8FAFC")
    border_color = colors.HexColor("#E2E8F0")
    danger_red = colors.HexColor("#DC2626")
    success_green = colors.HexColor("#16A34A")
    amber_alert = colors.HexColor("#D97706")

    # Typography Styles
    style_title = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=slate_dark,
        spaceAfter=2
    )

    style_brand = ParagraphStyle(
        'DocBrand',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=teal_primary,
        alignment=TA_LEFT
    )

    style_meta_label = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9,
        textColor=colors.HexColor("#64748B"),
        textTransform='uppercase'
    )

    style_meta_val = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=slate_dark
    )

    style_section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=slate_dark,
        spaceBefore=8,
        spaceAfter=4
    )

    style_doctor_box_title = ParagraphStyle(
        'DoctorBoxTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=indigo_primary
    )

    style_doctor_box_body = ParagraphStyle(
        'DoctorBoxBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#1E1B4B")
    )

    style_body = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=slate_body
    )

    style_body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=slate_dark
    )

    style_table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=10,
        textColor=colors.HexColor("#475569")
    )

    style_table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=slate_dark
    )

    style_table_mono = ParagraphStyle(
        'TableMono',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=slate_dark
    )

    style_footer = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#94A3B8"),
        alignment=TA_CENTER
    )

    story = []

    # 1. PARSE DATA
    extracted = record.extracted_data or {}
    if isinstance(extracted, str):
        try:
            extracted = json.loads(extracted)
        except Exception:
            extracted = {}
    elif not isinstance(extracted, dict):
        extracted = {}

    params = extracted.get("parameters", [])
    flagged = [p for p in params if str(p.get("status", "")).upper() in ["HIGH", "LOW", "CRITICAL", "ABNORMAL"]]
    normal = [p for p in params if str(p.get("status", "")).upper() == "NORMAL"]

    struct_sum = {}
    if record.summary_structured:
        if isinstance(record.summary_structured, str):
            try:
                struct_sum = json.loads(record.summary_structured)
            except Exception:
                struct_sum = {}
        elif isinstance(record.summary_structured, dict):
            struct_sum = record.summary_structured

    plain_exp = struct_sum.get("plain_language_explanation", {})
    quick_summary = record.summary_quick or struct_sum.get("quick_summary") or f"Diagnostic report with {len(params)} detected parameters."
    
    # Header Status Badge Text
    verification_text = "CLINICIAN VERIFIED" if record.clinician_review_status == 'CLINICIAN_REVIEWED' else "PATIENT APPROVED" if record.approval_status == 'APPROVED' else "AI EXTRACTED & VERIFIED"
    status_bg = colors.HexColor("#EEF2FF") if record.clinician_review_status == 'CLINICIAN_REVIEWED' else colors.HexColor("#ECFDF5")
    status_fg = indigo_primary if record.clinician_review_status == 'CLINICIAN_REVIEWED' else success_green

    # 2. BRAND & DOCUMENT HEADER
    header_data = [
        [
            Paragraph(f"<b>MEDIASSIST</b> | CLINICAL INTELLIGENCE REPORT", style_brand),
            Paragraph(f"<font color='{status_fg.hexval()}'><b>{verification_text}</b></font>", ParagraphStyle('StatusBadge', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, leading=10, alignment=TA_RIGHT))
        ],
        [
            Paragraph(f"<b>{record.title}</b>", style_title),
            Paragraph(f"<font color='#64748B'>Summary v{record.summary_version or 1} • {datetime.now().strftime('%d %b %Y')}</font>", ParagraphStyle('MetaDate', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=10, alignment=TA_RIGHT))
        ]
    ]
    t_header = Table(header_data, colWidths=[360, 160])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
        ('TOPPADDING', (0,0), (-1,-1), 1),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1.5, color=teal_primary, spaceAfter=8, spaceBefore=2))

    # 3. METADATA 4-COLUMN GRID
    meta_table_data = [
        [
            Paragraph("RECORD CATEGORY", style_meta_label),
            Paragraph("FACILITY / LAB", style_meta_label),
            Paragraph("ATTENDING DOCTOR", style_meta_label),
            Paragraph("REPORT DATE", style_meta_label)
        ],
        [
            Paragraph(str(record.category or "Lab Report"), style_meta_val),
            Paragraph(str(record.hospital or "Diagnostic Center"), style_meta_val),
            Paragraph(str(record.doctor_name or "Consulting Doctor"), style_meta_val),
            Paragraph(str(record.record_date or "Recent"), style_meta_val)
        ]
    ]
    t_meta = Table(meta_table_data, colWidths=[130, 130, 130, 130])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), slate_light),
        ('BOX', (0,0), (-1,-1), 0.75, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 10))

    # 4. 🩺 DOCTOR'S 30-SECOND EXECUTIVE BRIEFING (HIGHLIGHTED CALLOUT BOX)
    flagged_pills = " • ".join([f"<b>{p.get('display_name')}:</b> {p.get('value')} {p.get('unit') or ''} ({p.get('status')})" for p in flagged]) if flagged else "All tested parameters are within standard physiological limits."
    
    doc_box_content = [
        [
            Paragraph(f"🩺 <b>DOCTOR'S EXECUTIVE BRIEFING</b> &nbsp;&nbsp;|&nbsp;&nbsp; <i>30-Second Clinical Digest</i>", style_doctor_box_title),
            Paragraph(f"<b>{len(params)} Parameters Tested ({len(flagged)} Flagged)</b>", ParagraphStyle('DocBoxMeta', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=indigo_primary, alignment=TA_RIGHT))
        ],
        [
            Paragraph(f"{quick_summary}", style_doctor_box_body),
            ""
        ],
        [
            Paragraph(f"<font color='#991B1B'><b>Key Flags:</b></font> {flagged_pills}", ParagraphStyle('DocFlags', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=11, textColor=colors.HexColor("#7F1D1D"))),
            ""
        ]
    ]
    t_doc_box = Table(doc_box_content, colWidths=[380, 140])
    t_doc_box.setStyle(TableStyle([
        ('SPAN', (0,1), (1,1)),
        ('SPAN', (0,2), (1,2)),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F5F3FF")),
        ('BOX', (0,0), (-1,-1), 1.25, indigo_primary),
        ('LINELEFT', (0,0), (0,-1), 4, indigo_primary),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_doc_box)
    story.append(Spacer(1, 10))

    # 5. SECTION 1: PLAIN LANGUAGE PATIENT SUMMARY
    story.append(Paragraph("💡 <b>1. Patient Plain-Language Guide</b> (Explained in Everyday Words)", style_section_heading))
    
    nutshell_text = plain_exp.get("nutshell") or quick_summary
    nutshell_data = [[
        Paragraph("<b>IN A NUTSHELL:</b>", style_meta_label),
        Paragraph(nutshell_text, style_body)
    ]]
    t_nutshell = Table(nutshell_data, colWidths=[90, 430])
    t_nutshell.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F0FDFA")),
        ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor("#99F6E4")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_nutshell)
    story.append(Spacer(1, 8))

    # Good News vs Needs Attention
    good_news_items = plain_exp.get("good_news") or [f"<b>{p.get('display_name')}:</b> Normal" for p in normal[:4]]
    attention_items = plain_exp.get("needs_attention") or [f"<b>{p.get('display_name')}:</b> {p.get('status')}" for p in flagged]

    good_news_p = "<br/>".join([f"• {g.replace('**', '<b>').replace('**', '</b>')}" for g in good_news_items[:4]]) or "• All tested parameters are within healthy range."
    attention_p = "<br/>".join([f"• {a.replace('**', '<b>').replace('**', '</b>')}" for a in attention_items[:4]]) or "• No out-of-range parameters detected."

    split_summary_data = [
        [
            Paragraph("🟢 <b>THE GOOD NEWS</b> (Normal Markers)", ParagraphStyle('GNTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=colors.HexColor("#15803D"))),
            Paragraph("🟡 <b>WHAT NEEDS ATTENTION</b> (Flagged Values)", ParagraphStyle('NATitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=colors.HexColor("#B45309")))
        ],
        [
            Paragraph(good_news_p, ParagraphStyle('GNBody', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor("#14532D"))),
            Paragraph(attention_p, ParagraphStyle('NABody', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor("#78350F")))
        ]
    ]
    t_split = Table(split_summary_data, colWidths=[255, 255])
    t_split.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor("#F0FDF4")),
        ('BACKGROUND', (1,0), (1,-1), colors.HexColor("#FFFBEB")),
        ('BOX', (0,0), (0,-1), 0.75, colors.HexColor("#BBF7D0")),
        ('BOX', (1,0), (1,-1), 0.75, colors.HexColor("#FDE68A")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_split)
    story.append(Spacer(1, 10))

    # 6. SECTION 2: PARAMETERS & REFERENCE RANGES TABLE
    if params:
        story.append(Paragraph(f"📊 <b>2. Structured Diagnostic Parameters</b> ({len(params)} Detected)", style_section_heading))
        table_rows = [
            [
                Paragraph("<b>Test Parameter</b>", style_table_header),
                Paragraph("<b>Observed Result</b>", style_table_header),
                Paragraph("<b>Reference Range</b>", style_table_header),
                Paragraph("<b>Status / Flag</b>", ParagraphStyle('THCenter', parent=style_table_header, alignment=TA_CENTER))
            ]
        ]

        for p in params:
            st = str(p.get("status", "NORMAL")).upper()
            st_color = "#991B1B" if st == "HIGH" else "#92400E" if st == "LOW" else "#166534"
            st_bg = "#FEE2E2" if st == "HIGH" else "#FEF3C7" if st == "LOW" else "#DCFCE7"

            val_str = f"{p.get('value')} <font color='#64748B' size='7'>{p.get('unit') or ''}</font>"
            status_badge_html = f"<font color='{st_color}'><b>{st}</b></font>"

            table_rows.append([
                Paragraph(str(p.get("display_name") or p.get("parameter_name")), style_table_cell),
                Paragraph(val_str, style_table_mono),
                Paragraph(str(p.get("reference_range") or "-"), ParagraphStyle('RangeCell', parent=style_table_cell, fontSize=8, textColor=colors.HexColor("#64748B"))),
                Paragraph(status_badge_html, ParagraphStyle('StCell', parent=style_table_cell, alignment=TA_CENTER))
            ])

        t_params = Table(table_rows, colWidths=[180, 110, 130, 90])
        t_params_style = [
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
            ('BOX', (0,0), (-1,-1), 0.75, border_color),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#F1F5F9")),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]
        for idx in range(1, len(table_rows)):
            if idx % 2 == 0:
                t_params_style.append(('BACKGROUND', (0, idx), (-1, idx), colors.HexColor("#FAFAFA")))
        t_params.setStyle(TableStyle(t_params_style))
        story.append(t_params)
        story.append(Spacer(1, 10))

    # 7. SECTION 3: DOCTOR QUESTIONS
    doctor_qs = plain_exp.get("questions_for_doctor") or [
        "What are the most impactful lifestyle changes to optimize my results?",
        "When do you recommend repeating these tests to monitor my progress?"
    ]
    qs_html = "<br/>".join([f"<b>{i+1}.</b> {q}" for i, q in enumerate(doctor_qs)])
    t_qs = Table([
        [Paragraph("🩺 <b>QUESTIONS YOU CAN ASK YOUR DOCTOR:</b>", ParagraphStyle('QSTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=10, textColor=indigo_primary))],
        [Paragraph(qs_html, ParagraphStyle('QSBody', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor("#312E81")))]
    ], colWidths=[520])
    t_qs.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EEF2FF")),
        ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor("#C7D2FE")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_qs)
    story.append(Spacer(1, 10))

    # 8. FOOTER & DISCLAIMER
    story.append(HRFlowable(width="100%", thickness=0.75, color=border_color, spaceAfter=4, spaceBefore=4))
    story.append(Paragraph(
        "<b>MediAssist Clinical Intelligence Pipeline</b> • Generated strictly from verified patient diagnostic records.<br/>"
        "This document is for clinical reference and patient health literacy. It does not replace independent professional medical consultation.",
        style_footer
    ))

    # Build PDF document
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
