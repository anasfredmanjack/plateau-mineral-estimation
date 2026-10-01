from __future__ import annotations

from pathlib import Path
from typing import Iterable, Sequence

from docx import Document
from docx.enum.section import WD_SECTION_START
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "ARUM_ALPHA_Project_Proposal.docx"
LOGO = ROOT / "unijos_logo.png"
MAP_IMAGE = ROOT / "study_area_locator.png"

TITLE = "Machine Learning-Based Ore Grade Prediction for Tin Mineralization in Bukuru, Plateau State"
STUDENT_NAME = "ARUM ALPHA AJIJI"
MATRIC_NUMBER = "UJ/2018/EN/0456"
PROGRAMME = "B.Eng. Mining Engineering"
DEPARTMENT = "Department of Mining Engineering"
UNIVERSITY = "University of Jos"
SUPERVISOR = "Mr. Joshua D. Joro"
SUBMISSION_DATE = "03/2026"

FONT = "Times New Roman"
BLUE = RGBColor(31, 77, 120)
HEADING_BLUE = RGBColor(46, 116, 181)
DARK = RGBColor(0, 0, 0)
MUTED = RGBColor(90, 90, 90)
LIGHT_FILL = "E8EEF5"
PALE_FILL = "F4F6F9"
BORDER = "9AA7B4"
CONTENT_WIDTH_DXA = 9360
TABLE_INDENT_DXA = 120


def set_run_font(run, name=FONT, size: float | None = None, color=None, bold=None, italic=None):
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:ascii"), name)
    run._element.rPr.rFonts.set(qn("w:hAnsi"), name)
    if size is not None:
        run.font.size = Pt(size)
    if color is not None:
        run.font.color.rgb = color
    if bold is not None:
        run.bold = bold
    if italic is not None:
        run.italic = italic


def set_paragraph_format(paragraph, before=0, after=6, line=1.5, align=None, keep_with_next=False):
    fmt = paragraph.paragraph_format
    fmt.space_before = Pt(before)
    fmt.space_after = Pt(after)
    fmt.line_spacing = line
    fmt.keep_with_next = keep_with_next
    if align is not None:
        paragraph.alignment = align


def paragraph_bottom_border(paragraph, color="2E74B5", size="6"):
    p_pr = paragraph._p.get_or_add_pPr()
    p_bdr = p_pr.find(qn("w:pBdr"))
    if p_bdr is None:
        p_bdr = OxmlElement("w:pBdr")
        p_pr.append(p_bdr)
    bottom = p_bdr.find(qn("w:bottom"))
    if bottom is None:
        bottom = OxmlElement("w:bottom")
        p_bdr.append(bottom)
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), size)
    bottom.set(qn("w:space"), "4")
    bottom.set(qn("w:color"), color)


def configure_document(doc: Document):
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)
    section.header_distance = Inches(0.492)
    section.footer_distance = Inches(0.492)

    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = FONT
    normal._element.rPr.rFonts.set(qn("w:ascii"), FONT)
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), FONT)
    normal.font.size = Pt(12)
    normal.paragraph_format.space_before = Pt(0)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.5
    normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    heading_tokens = {
        "Heading 1": (14, HEADING_BLUE, 14, 8),
        "Heading 2": (12.5, BLUE, 10, 5),
        "Heading 3": (12, BLUE, 8, 4),
    }
    for name, (size, color, before, after) in heading_tokens.items():
        style = styles[name]
        style.font.name = FONT
        style._element.rPr.rFonts.set(qn("w:ascii"), FONT)
        style._element.rPr.rFonts.set(qn("w:hAnsi"), FONT)
        style.font.size = Pt(size)
        style.font.color.rgb = color
        style.font.bold = True
        style.paragraph_format.space_before = Pt(before)
        style.paragraph_format.space_after = Pt(after)
        style.paragraph_format.line_spacing = 1.15
        style.paragraph_format.keep_with_next = True

    for style_name in ["List Bullet", "List Number"]:
        style = styles[style_name]
        style.font.name = FONT
        style._element.rPr.rFonts.set(qn("w:ascii"), FONT)
        style._element.rPr.rFonts.set(qn("w:hAnsi"), FONT)
        style.font.size = Pt(12)
        style.paragraph_format.space_before = Pt(0)
        style.paragraph_format.space_after = Pt(4)
        style.paragraph_format.line_spacing = 1.35
        style.paragraph_format.left_indent = Inches(0.375)
        style.paragraph_format.first_line_indent = Inches(-0.194)

    header = section.header
    header.paragraphs[0].text = ""
    hp = header.paragraphs[0]
    set_paragraph_format(hp, after=2, line=1.0)
    r = hp.add_run("Project Proposal | Department of Mining Engineering, University of Jos")
    set_run_font(r, size=9, color=MUTED, bold=True)
    paragraph_bottom_border(hp, color="D7DBE2", size="4")

    footer = section.footer
    footer.paragraphs[0].text = ""
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    set_paragraph_format(fp, after=0, line=1.0)
    fr = fp.add_run("ARUM ALPHA AJIJI")
    set_run_font(fr, size=9, color=MUTED)

    props = doc.core_properties
    props.title = TITLE
    props.subject = "Final year project proposal in Mining Engineering"
    props.author = STUDENT_NAME
    props.comments = "Generated from local project materials and the departmental proposal format."


def add_para(
    doc: Document,
    text: str = "",
    *,
    size=12,
    bold=False,
    italic=False,
    color=DARK,
    align=None,
    before=0,
    after=6,
    line=1.5,
    style=None,
    keep_with_next=False,
):
    p = doc.add_paragraph(style=style)
    set_paragraph_format(p, before=before, after=after, line=line, align=align, keep_with_next=keep_with_next)
    if text:
        r = p.add_run(text)
        set_run_font(r, size=size, bold=bold, italic=italic, color=color)
    return p


def add_heading(doc: Document, text: str, level: int):
    p = doc.add_paragraph(style=f"Heading {level}")
    p.add_run(text)
    return p


def add_bullet(doc: Document, text: str):
    p = doc.add_paragraph(style="List Bullet")
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.add_run(text)
    return p


def add_numbered(doc: Document, text: str):
    p = doc.add_paragraph(style="List Number")
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.add_run(text)
    return p


def set_cell_text(cell, text, *, bold=False, size=9.5, color=DARK, align=None, line=1.15):
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    p = cell.paragraphs[0]
    p.text = ""
    set_paragraph_format(p, before=0, after=0, line=line, align=align)
    r = p.add_run(str(text))
    set_run_font(r, size=size, bold=bold, color=color)


def shade_cell(cell, fill: str):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_table_geometry(table, widths_dxa: Sequence[int]):
    tbl = table._tbl
    tbl_pr = tbl.tblPr

    tbl_w = tbl_pr.find(qn("w:tblW"))
    if tbl_w is None:
        tbl_w = OxmlElement("w:tblW")
        tbl_pr.append(tbl_w)
    tbl_w.set(qn("w:type"), "dxa")
    tbl_w.set(qn("w:w"), str(sum(widths_dxa)))

    tbl_ind = tbl_pr.find(qn("w:tblInd"))
    if tbl_ind is None:
        tbl_ind = OxmlElement("w:tblInd")
        tbl_pr.append(tbl_ind)
    tbl_ind.set(qn("w:type"), "dxa")
    tbl_ind.set(qn("w:w"), str(TABLE_INDENT_DXA))

    layout = tbl_pr.find(qn("w:tblLayout"))
    if layout is None:
        layout = OxmlElement("w:tblLayout")
        tbl_pr.append(layout)
    layout.set(qn("w:type"), "fixed")

    borders = tbl_pr.find(qn("w:tblBorders"))
    if borders is None:
        borders = OxmlElement("w:tblBorders")
        tbl_pr.append(borders)
    for side in ["top", "left", "bottom", "right", "insideH", "insideV"]:
        element = borders.find(qn(f"w:{side}"))
        if element is None:
            element = OxmlElement(f"w:{side}")
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), "4")
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), BORDER)

    margins = tbl_pr.find(qn("w:tblCellMar"))
    if margins is None:
        margins = OxmlElement("w:tblCellMar")
        tbl_pr.append(margins)
    for side, value in [("top", 100), ("bottom", 100), ("start", 120), ("end", 120)]:
        margin = margins.find(qn(f"w:{side}"))
        if margin is None:
            margin = OxmlElement(f"w:{side}")
            margins.append(margin)
        margin.set(qn("w:w"), str(value))
        margin.set(qn("w:type"), "dxa")

    grid = tbl.tblGrid
    for child in list(grid):
        grid.remove(child)
    for width in widths_dxa:
        col = OxmlElement("w:gridCol")
        col.set(qn("w:w"), str(width))
        grid.append(col)

    for row in table.rows:
        for idx, cell in enumerate(row.cells):
            tc_pr = cell._tc.get_or_add_tcPr()
            tc_w = tc_pr.find(qn("w:tcW"))
            if tc_w is None:
                tc_w = OxmlElement("w:tcW")
                tc_pr.append(tc_w)
            tc_w.set(qn("w:w"), str(widths_dxa[idx]))
            tc_w.set(qn("w:type"), "dxa")


def repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def add_table(
    doc: Document,
    headers: Sequence[str],
    rows: Sequence[Sequence[str]],
    widths_dxa: Sequence[int],
    *,
    font_size=9.5,
    header_fill=LIGHT_FILL,
):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    table.autofit = False
    set_table_geometry(table, widths_dxa)

    for idx, header in enumerate(headers):
        cell = table.rows[0].cells[idx]
        shade_cell(cell, header_fill)
        set_cell_text(cell, header, bold=True, size=font_size, align=WD_ALIGN_PARAGRAPH.CENTER, line=1.1)
    repeat_table_header(table.rows[0])

    for row in rows:
        cells = table.add_row().cells
        for idx, text in enumerate(row):
            align = WD_ALIGN_PARAGRAPH.CENTER if len(str(text)) <= 12 else WD_ALIGN_PARAGRAPH.LEFT
            set_cell_text(cells[idx], text, size=font_size, align=align, line=1.15)
    add_para(doc, "", after=4, line=1.0)
    return table


def add_caption(doc: Document, text: str):
    return add_para(doc, text, size=10, italic=True, color=MUTED, align=WD_ALIGN_PARAGRAPH.CENTER, before=2, after=8, line=1.15)


def add_callout(doc: Document, label: str, body: str):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    table.autofit = False
    set_table_geometry(table, [CONTENT_WIDTH_DXA])
    cell = table.rows[0].cells[0]
    shade_cell(cell, PALE_FILL)
    p = cell.paragraphs[0]
    p.text = ""
    set_paragraph_format(p, after=0, line=1.25)
    r1 = p.add_run(f"{label}: ")
    set_run_font(r1, size=11, color=BLUE, bold=True)
    r2 = p.add_run(body)
    set_run_font(r2, size=11, color=DARK)
    add_para(doc, "", after=4, line=1.0)


def create_study_area_map():
    width, height = 1100, 720
    img = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(img)
    try:
        title_font = ImageFont.truetype("arialbd.ttf", 32)
        label_font = ImageFont.truetype("arial.ttf", 22)
        small_font = ImageFont.truetype("arial.ttf", 18)
    except OSError:
        title_font = ImageFont.load_default()
        label_font = ImageFont.load_default()
        small_font = ImageFont.load_default()

    draw.rectangle([0, 0, width - 1, height - 1], outline=(154, 167, 180), width=2)
    draw.text((45, 35), "Study Area Locator: Sheet 168 Naraguta, Plateau State", fill=(31, 77, 120), font=title_font)
    draw.text((45, 82), "Proposed field area: Bukuru/Du/Naraguta corridor, Jos South LGA", fill=(80, 80, 80), font=label_font)

    map_box = (95, 150, 780, 625)
    draw.rectangle(map_box, fill=(244, 247, 250), outline=(120, 135, 150), width=2)

    # Approximate Plateau State context polygon for a simple locator.
    plateau = [(165, 215), (330, 165), (520, 190), (690, 290), (655, 470), (500, 580), (265, 545), (145, 410)]
    draw.polygon(plateau, fill=(225, 235, 245), outline=(90, 115, 140))
    draw.text((190, 185), "Plateau State", fill=(75, 95, 115), font=label_font)

    # Sheet 168 bounding box scaled inside the context map.
    sheet = (350, 300, 620, 480)
    draw.rectangle(sheet, fill=(255, 248, 225), outline=(195, 132, 0), width=4)
    draw.text((375, 318), "Sheet 168", fill=(120, 80, 0), font=label_font)
    draw.text((382, 352), "Naraguta", fill=(120, 80, 0), font=label_font)

    places = {
        "Jos": (465, 275),
        "Bukuru": (500, 415),
        "Du": (445, 438),
        "Naraguta": (410, 335),
        "Rayfield": (535, 370),
        "Gyel": (470, 485),
    }
    for name, (x, y) in places.items():
        fill = (188, 55, 55) if name in {"Bukuru", "Du"} else (31, 77, 120)
        draw.ellipse([x - 7, y - 7, x + 7, y + 7], fill=fill)
        draw.text((x + 12, y - 12), name, fill=(45, 45, 45), font=small_font)

    # Coordinate frame.
    draw.line([95, 625, 780, 625], fill=(90, 100, 110), width=2)
    draw.line([95, 150, 95, 625], fill=(90, 100, 110), width=2)
    draw.text((95, 635), "8.50E", fill=(80, 80, 80), font=small_font)
    draw.text((725, 635), "9.00E", fill=(80, 80, 80), font=small_font)
    draw.text((32, 600), "9.50N", fill=(80, 80, 80), font=small_font)
    draw.text((32, 150), "10.00N", fill=(80, 80, 80), font=small_font)

    legend_x = 825
    draw.rectangle([legend_x, 175, 1040, 450], fill=(255, 255, 255), outline=(190, 198, 208))
    draw.text((legend_x + 20, 200), "Legend", fill=(31, 77, 120), font=label_font)
    draw.rectangle([legend_x + 25, 250, legend_x + 65, 275], fill=(255, 248, 225), outline=(195, 132, 0), width=3)
    draw.text((legend_x + 80, 248), "Radiometric grid extent", fill=(50, 50, 50), font=small_font)
    draw.ellipse([legend_x + 36, 310, legend_x + 50, 324], fill=(188, 55, 55))
    draw.text((legend_x + 80, 304), "Priority communities", fill=(50, 50, 50), font=small_font)
    draw.ellipse([legend_x + 36, 365, legend_x + 50, 379], fill=(31, 77, 120))
    draw.text((legend_x + 80, 359), "Reference settlements", fill=(50, 50, 50), font=small_font)

    note = "Grid metadata: 8.499873E-8.999431E, 9.500149N-9.999096N; WGS 84 / UTM Zone 32N."
    draw.text((45, 675), note, fill=(80, 80, 80), font=small_font)
    img.save(MAP_IMAGE)


def add_cover(doc: Document):
    if LOGO.exists():
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run()
        run.add_picture(str(LOGO), width=Inches(0.72))

    add_para(doc, "UNIVERSITY OF JOS", size=15, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, after=0, line=1.15)
    add_para(doc, "FACULTY OF ENGINEERING", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, after=0, line=1.15)
    add_para(doc, DEPARTMENT.upper(), size=12, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, after=18, line=1.15)

    add_para(doc, "FINAL YEAR PROJECT PROPOSAL", size=13, bold=True, color=HEADING_BLUE, align=WD_ALIGN_PARAGRAPH.CENTER, after=12, line=1.15)
    add_para(doc, TITLE.upper(), size=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, after=20, line=1.2)

    add_para(doc, "SUBMITTED BY:", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, after=6, line=1.2)
    cover_rows = [
        ("Name", STUDENT_NAME),
        ("Matriculation Number", MATRIC_NUMBER),
        ("Programme", PROGRAMME),
    ]
    add_table(doc, ["Item", "Details"], cover_rows, [3000, 6360], font_size=11, header_fill="F4F6F9")

    add_para(
        doc,
        f"Submitted to {DEPARTMENT}, {UNIVERSITY}, in partial fulfilment of the requirements for the award of Bachelor of Engineering in Mining Engineering Programme.",
        size=12,
        align=WD_ALIGN_PARAGRAPH.CENTER,
        before=10,
        after=14,
        line=1.35,
    )
    add_para(doc, f"Supervisor: {SUPERVISOR}", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, after=4, line=1.2)
    add_para(doc, f"Date of Submission: {SUBMISSION_DATE}", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, after=18, line=1.2)

    note = add_para(
        doc,
        "Note: The official student, matriculation number, supervisor, and submission date can be updated before departmental printing if any administrative detail changes.",
        size=10.5,
        italic=True,
        color=MUTED,
        align=WD_ALIGN_PARAGRAPH.CENTER,
        before=14,
        after=4,
        line=1.15,
    )
    paragraph_bottom_border(note, color="D7DBE2", size="4")
    doc.add_page_break()


def add_introduction(doc: Document):
    add_heading(doc, "1.0 Introduction", 1)
    add_heading(doc, "1.1 Background of the Study", 2)
    paragraphs = [
        "Mining engineering decisions depend heavily on reliable knowledge of ore grade, mineral distribution, geological controls and the cost of confirming a target. In many mineral fields, particularly those with long histories of small-scale and artisanal mining, decision makers often have scattered records, uneven sampling coverage and limited integration between geological, geophysical and spatial datasets. This creates uncertainty at the early exploration stage and can lead to poor mine planning, unnecessary drilling, inaccurate reserve classification and avoidable environmental disturbance.",
        "The Nigerian mining sector is increasingly expected to support economic diversification beyond crude oil. Nigeria has long-established mineral occurrences that include tin, columbite, tantalite, lead-zinc, gold, limestone, coal, barite and industrial minerals. Plateau State is especially important in the history of Nigerian solid minerals because of the occurrence and historical production of cassiterite, the principal ore of tin, within the Younger Granite province of the Jos Plateau. The Bukuru, Du, Naraguta, Rayfield and Gyel areas occur within this regional geological setting and are associated with historical tin mining activities and radiometric signatures related to granitic and hydrothermal processes.",
        "Traditional ore grade estimation in mineral exploration commonly uses interpolation and geostatistical techniques such as inverse distance weighting and ordinary kriging. These methods remain important because they provide spatially continuous estimates and can quantify spatial continuity when sampling is adequate. However, their performance depends on assumptions about stationarity, variogram structure and the spatial arrangement of samples. In terrains where mineralization is controlled by nonlinear interactions between lithology, structure, alteration, radiometric anomalies and geochemical ratios, machine learning can provide an additional method for identifying patterns that may not be captured by a single interpolation model.",
        "This project proposes a localized machine learning system for ore grade prediction and mineral distribution modelling for tin mineralization in Bukuru, Plateau State. The work will use available radiometric data from Sheet 168 Naraguta, field verification data where obtainable, geological information, geochemical indicators and spatial variables. The system will evaluate Random Forest and XGBoost models against traditional geostatistical baselines and present results through an interactive dashboard. The goal is not to replace geological field judgement, but to improve the quality, speed and transparency of preliminary exploration decisions.",
    ]
    for text in paragraphs:
        add_para(doc, text)

    add_heading(doc, "1.2 Statement of the Problem", 2)
    add_para(
        doc,
        "Ore grade estimation and mineral target ranking in the Bukuru area remain difficult because the local geological controls on cassiterite mineralization are spatially complex and the available datasets are not always integrated into a single decision-support workflow. Existing exploration decisions may depend on historical mining information, sparse sampling, visual field judgement or conventional interpolation methods without fully exploiting multi-source data such as radiometric potassium, thorium and uranium, geochemical assays, terrain variables and proximity to structural features.",
    )
    problem_points = [
        "High uncertainty in ore grade estimation can lead to inefficient mine planning, weak reserve classification and unnecessary drilling expenditure.",
        "Traditional geostatistical models can underperform where mineralization is controlled by nonlinear feature relationships or sharply varying geological domains.",
        "Radiometric, geological, geochemical and spatial datasets are often fragmented, making it hard to compare target areas consistently.",
        "There is limited evidence of a localized machine learning dashboard designed specifically for tin prospectivity and ore grade prediction in the Bukuru/Jos Plateau context.",
        "Without a clear digital workflow, exploration can expose communities and the environment to avoidable disturbance before target confidence is properly established.",
    ]
    for item in problem_points:
        add_bullet(doc, item)
    add_callout(
        doc,
        "Core problem",
        "The study addresses the absence of an integrated, localized and validated machine learning workflow for predicting tin ore grade and mapping mineral distribution in the Bukuru area of Plateau State.",
    )

    add_heading(doc, "1.3 Aim of the Study", 2)
    add_para(
        doc,
        "The aim of this study is to design and evaluate a machine learning based predictive system for ore grade estimation and mineral distribution modelling of tin mineralization in Bukuru, Plateau State, Nigeria.",
    )

    add_heading(doc, "1.4 Objectives of the Study", 2)
    add_para(doc, "The objectives of the project are to:", keep_with_next=True)
    objectives = [
        "compile and preprocess radiometric, geological, geochemical and spatial datasets relevant to tin mineralization in the Bukuru/Naraguta study area;",
        "develop predictive ore grade models using Random Forest and XGBoost regression algorithms;",
        "compare the predictive performance of the machine learning models with selected traditional geostatistical methods using RMSE, MAE, R2 and MAPE;",
        "produce mineral distribution maps and an interactive dashboard that communicate prediction confidence, risk level and exploration recommendations.",
    ]
    for item in objectives:
        add_numbered(doc, item)

    add_heading(doc, "1.5 Research Questions", 2)
    research_questions = [
        "Which radiometric, geological, geochemical and spatial features are most useful for predicting tin mineralization potential in the Bukuru/Naraguta area?",
        "How accurately can Random Forest and XGBoost models estimate ore grade compared with ordinary kriging and inverse distance weighting?",
        "Which parts of the study area show relatively high predicted tin mineralization potential and require priority field verification?",
        "How can prediction results be presented in a dashboard so that mining engineers, students and exploration teams can interpret the outputs responsibly?",
    ]
    for item in research_questions:
        add_numbered(doc, item)

    add_heading(doc, "1.6 Justification/Significance of the Study", 2)
    add_para(
        doc,
        "This research is justified by the need to improve exploration efficiency and reduce uncertainty in a historically important Nigerian tin province. For mining engineers and exploration companies, the work can provide a repeatable workflow for integrating radiometric and spatial evidence before expensive field campaigns are expanded. For the university and academic community, the project demonstrates how modern data science can be applied to a practical mining engineering problem in Nigeria rather than relying only on generic examples from foreign mineral fields.",
    )
    significance = [
        "Industry benefit: The system can support target ranking, reduce blind sampling and improve the planning of drilling, trenching or detailed geochemical surveys.",
        "Community benefit: Better early-stage target selection can reduce unnecessary land disturbance and help encourage safer, more responsible mineral development.",
        "Academic benefit: The project contributes a localized case study on machine learning, radiometric data and mineral prospectivity mapping in the Jos Plateau.",
        "Policy benefit: The workflow supports evidence-based decision-making in the Nigerian solid minerals sector, especially where historical mining information needs to be combined with modern geospatial data.",
        "Technology benefit: The dashboard makes technical model outputs easier to review through maps, confidence measures, risk classes and field recommendations.",
    ]
    for item in significance:
        add_bullet(doc, item)


def add_literature_review(doc: Document):
    add_heading(doc, "2.0 Literature Review", 1)
    add_heading(doc, "2.1 Conceptual Review", 2)
    concept_paragraphs = [
        "Ore grade is the concentration of a valuable mineral or metal within a rock, soil or ore sample. In tin mining, cassiterite is commonly reported as SnO2 or tin-bearing mineral concentration, and grade estimates are used to determine whether a target is economically attractive. Mineral distribution refers to the spatial arrangement of mineralized zones across a study area, while mineral prospectivity mapping combines multiple evidential layers to identify locations that are more likely to host mineralization.",
        "Cassiterite mineralization on the Jos Plateau is related to the Nigerian Younger Granite province. Tin mineralization is often associated with granitic differentiation, greisenization, hydrothermal alteration, fractures and weathering processes that concentrate resistant cassiterite grains. Because these controls vary spatially, ore grade estimation requires more than a single observation. Radiometric data are useful because potassium, thorium and uranium can indicate lithological differences, alteration zones and the geochemical character of granitic rocks.",
        "Airborne or ground gamma-ray spectrometry records radioelement concentrations for potassium, equivalent thorium and equivalent uranium. In mineral exploration, radiometric ternary images and ratios such as Th/U and K/(Th+U) can support lithological discrimination and alteration mapping. However, radiometric anomalies are not direct ore grade measurements. They must be interpreted with geology, geochemistry, structural information and field validation.",
        "Machine learning is a data-driven modelling approach in which algorithms learn relationships between predictor variables and an output variable from examples. In this project, predictor variables may include radiometric values, geochemical assay results, coordinates, elevation, slope, distance to faults and historical mine proximity. The target variable is ore grade or mineralization class. Random Forest and XGBoost are ensemble tree algorithms that can model nonlinear relationships, rank feature importance and handle complex interactions among variables.",
        "A web-based dashboard is a decision-support interface that allows users to view data, run predictions and interpret spatial outputs. For this project, the dashboard is expected to provide coordinate input, map visualization, prediction confidence, risk level, radiometric values and exploration recommendations. The dashboard is important because a model that cannot be interpreted by the intended users has limited practical value.",
    ]
    for text in concept_paragraphs:
        add_para(doc, text)

    add_heading(doc, "2.2 Theoretical Framework", 2)
    frameworks = [
        ("Mineral systems theory", "The study assumes that mineralization is controlled by source, transport, trap and preservation processes. For cassiterite, relevant indicators include granitic source rocks, hydrothermal pathways, structural conduits and weathering concentration. This theory guides the selection of geological, radiometric and spatial predictor variables."),
        ("Spatial autocorrelation and geostatistics", "Geological attributes close to one another are often more similar than attributes farther apart. This principle supports the use of kriging and inverse distance weighting as baseline methods. It also justifies spatial cross-checking of model predictions so that isolated anomalies are not accepted without geological reasoning."),
        ("Statistical learning theory", "Supervised learning models approximate the relationship between input features and known grade observations. Model performance is assessed on unseen validation or test data to reduce overfitting. This framework supports the use of train-validation-test splits, k-fold cross-validation and error metrics."),
        ("Data fusion theory", "No single dataset is expected to explain mineralization fully. Combining radiometric, geochemical, geological and terrain data should improve predictive performance by providing complementary evidence. The theory supports multi-source feature engineering and comparison against single-source baselines."),
    ]
    for label, body in frameworks:
        add_callout(doc, label, body)

    add_heading(doc, "2.3 Empirical Review/Research Gap", 2)
    add_para(
        doc,
        "Previous studies show that both geostatistical and machine learning methods have value in mineral exploration. Geostatistical approaches are well established for resource estimation and spatial interpolation, while modern machine learning is increasingly used for mineral prospectivity mapping, lithological classification and remote-sensing-based geological interpretation. The empirical literature also shows that model performance depends strongly on data quality, domain knowledge, validation design and the integration of relevant evidence layers.",
    )
    review_rows = [
        ("Journel and Huijbregts (1978)", "Established classical mining geostatistics and variogram-based resource estimation principles.", "Provides the theoretical basis for kriging as a comparison method."),
        ("Isaaks and Srivastava (1989)", "Explained applied geostatistical estimation, spatial continuity and practical variogram interpretation.", "Supports the baseline interpolation workflow and uncertainty discussion."),
        ("Bonham-Carter (1994)", "Developed GIS-based geoscience data integration and weights-of-evidence thinking.", "Shows why multiple evidential layers should be combined for prospectivity mapping."),
        ("Goovaerts (1997)", "Presented geostatistics for natural resources evaluation with emphasis on spatial dependence and prediction.", "Frames the comparison between traditional geostatistics and machine learning."),
        ("Minty (1997)", "Reviewed fundamentals of airborne gamma-ray spectrometry and radioelement mapping.", "Supports the use of K, Th and U radiometric variables in the study."),
        ("IAEA (2003)", "Provided guidelines for radioelement mapping using gamma-ray spectrometric data.", "Guides interpretation of radiometric maps and quality control of radioelement data."),
        ("Carranza (2008)", "Explained GIS-based geochemical anomaly and mineral prospectivity mapping.", "Supports the design of an evidence-layer approach rather than isolated sample interpretation."),
        ("Obaje (2009)", "Summarized Nigerian geology and mineral resources, including tin-bearing Younger Granite contexts.", "Provides Nigerian geological context for Plateau State tin mineralization."),
        ("Kinnaird (1985)", "Discussed hydrothermal alteration and mineralization in Nigerian anorogenic ring complexes.", "Links cassiterite mineralization to Younger Granite alteration and structural controls."),
        ("Breiman (2001)", "Introduced Random Forests as an ensemble method capable of robust classification and regression.", "Justifies Random Forest regression for nonlinear grade prediction."),
        ("Chen and Guestrin (2016)", "Presented XGBoost as a scalable gradient tree boosting system.", "Justifies XGBoost regression for high-performance predictive modelling."),
        ("Rodriguez-Galiano et al. (2015)", "Evaluated machine learning approaches for mineral prospectivity mapping.", "Supports comparing ensemble models with more traditional methods."),
        ("Cracknell and Reading (2014)", "Compared machine learning methods for geological mapping using remotely sensed data.", "Shows the value of machine learning for mapping geological patterns from indirect evidence."),
        ("Zuo and Carranza (2011)", "Applied support vector machines to mineral prospectivity mapping.", "Demonstrates that nonlinear algorithms can improve exploration targeting."),
        ("McCuaig and Hronsky (2014)", "Discussed the mineral systems concept for exploration targeting.", "Supports selecting features based on geological process, not only data availability."),
        ("Singer and Menzie (2010)", "Presented quantitative mineral resource assessment principles.", "Supports uncertainty-aware interpretation of predicted mineral potential."),
        ("Shirmard et al. (2021)", "Reviewed machine learning in remote sensing data processing for mineral exploration.", "Shows broad evidence that ML can support modern mineral targeting."),
        ("Local Sheet 168 metadata (2021)", "Documents K, Th and U grid sources, WGS 84 / UTM Zone 32N and geographic extents.", "Provides the local radiometric dataset foundation for this project."),
    ]
    add_table(doc, ["Source", "Relevant Contribution", "Application to This Study"], review_rows, [2300, 3720, 3340], font_size=8.7)

    add_heading(doc, "Identified Research Gap", 3)
    gaps = [
        "Most reviewed studies focus on general mineral prospectivity methods or foreign case studies rather than a localized Bukuru/Jos Plateau tin prediction system.",
        "Existing geostatistical approaches are valuable but may not fully capture nonlinear relationships among radiometric values, geology, terrain and structural controls.",
        "Many studies discuss modelling but do not deliver an interactive dashboard that can be used by students or exploration teams to review predictions on a map.",
        "The available local radiometric grids require integration with field or assay data before a field-validated grade prediction model can be defended scientifically.",
    ]
    for item in gaps:
        add_bullet(doc, item)

    add_heading(doc, "2.4 Summary of Literature", 2)
    add_para(
        doc,
        "The literature agrees that spatial data integration is central to modern mineral exploration. Geostatistics remains essential for resource estimation and spatial interpolation, but machine learning provides additional strength where relationships are nonlinear, multivariate and difficult to express through a single variogram. The main conflict in the literature is not whether machine learning is useful, but how it should be validated and interpreted. Poorly validated models can look convincing on maps while failing in the field. Therefore, this project occupies a practical niche: it proposes a localized, geologically guided, validated and dashboard-supported machine learning workflow for tin ore grade prediction in Bukuru, Plateau State.",
    )


def add_methodology(doc: Document):
    add_heading(doc, "3.0 Methodology", 1)
    add_heading(doc, "3.1 Study Area", 2)
    add_para(
        doc,
        "The proposed study area is the Bukuru/Du/Naraguta corridor within Jos South and nearby parts of the Jos Plateau, Plateau State, Nigeria. The local digital dataset in the repository is Sheet 168 Naraguta, which covers approximately 8.499873E to 8.999431E longitude and 9.500149N to 9.999096N latitude. The grid metadata indicate WGS 84 / UTM Zone 32N projection with UTM extents of 445187.5 mE to 499937.5 mE and 1050187.5 mN to 1105312.5 mN.",
    )
    add_para(
        doc,
        "Geologically, the area forms part of the Jos Plateau Younger Granite province, a setting historically associated with cassiterite and related tin-columbite mineralization. The field context includes old mining localities, granitic rocks, weathered profiles, alluvial reworking and possible hydrothermal alteration zones. These features make the area suitable for a final-year project that combines mining engineering, geostatistics, geospatial analysis and machine learning.",
    )
    if MAP_IMAGE.exists():
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run().add_picture(str(MAP_IMAGE), width=Inches(6.1))
        add_caption(doc, "Figure 1: Preliminary locator diagram for the Sheet 168 Naraguta/Bukuru study area.")

    add_heading(doc, "3.2 Research Design", 2)
    add_para(
        doc,
        "The research design is an applied quantitative case study with modelling and design-based components. It is quantitative because it will use numerical radiometric, geochemical, spatial and grade variables. It is a case study because it focuses on a defined mining-geological area in Plateau State. It is design-based because the final output includes an operational dashboard and a reproducible workflow for mineral estimation.",
    )
    design_rows = [
        ("Research type", "Applied quantitative research with geospatial modelling"),
        ("Case study", "Bukuru/Du/Naraguta corridor, Sheet 168 Naraguta, Plateau State"),
        ("Modelling approach", "Random Forest, XGBoost, ordinary kriging and inverse distance weighting"),
        ("Product approach", "Interactive web dashboard for prediction, visualization and reporting"),
        ("Validation approach", "Train-validation-test split, k-fold cross-validation and field/assay verification where available"),
    ]
    add_table(doc, ["Design Element", "Description"], design_rows, [2600, 6760], font_size=9.5)

    add_heading(doc, "3.3 Data Requirements and Sources", 2)
    add_heading(doc, "Primary Data", 3)
    primary = [
        "Rock, soil or tailings samples from selected anomaly classes and accessible historical mining locations.",
        "GPS coordinates of sample points, old workings, drainage channels, structural observations and safe access routes.",
        "Field descriptions of lithology, alteration, weathering, mineral indications and mining disturbance.",
        "Laboratory assay results for tin and selected pathfinder elements where laboratory access is available.",
        "Ground radiometric readings for selected control points, if a portable radiometric instrument is available.",
    ]
    for item in primary:
        add_bullet(doc, item)
    add_heading(doc, "Secondary Data", 3)
    secondary = [
        "Sheet 168 Naraguta potassium, thorium and uranium radiometric grids and their XML metadata.",
        "Geological maps, airborne geophysical maps and mineral occurrence records from relevant Nigerian geological sources.",
        "Digital elevation model data for elevation, slope, aspect and drainage interpretation.",
        "Historical literature on the Jos Plateau Younger Granite province and tin mineralization.",
        "Existing project source code, dashboard components and data parsing utilities in the ARUM ALPHA repository.",
    ]
    for item in secondary:
        add_bullet(doc, item)

    data_rows = [
        ("Radiometric", "K percent, Th ppm, U ppm, K/(Th+U), Th/U", "Sheet 168 grids and ground checks"),
        ("Geochemical", "Sn, Fe, Cu, Pb, Zn and other available assays", "Field samples and laboratory analysis"),
        ("Spatial", "Latitude, longitude, UTM coordinates, elevation, slope, aspect", "GPS, DEM and GIS processing"),
        ("Geological", "Lithology, alteration, fractures, old workings, fault distance", "Field mapping and geological maps"),
        ("Model target", "Tin grade or mineralization class", "Assay results and verified sample records"),
    ]
    add_table(doc, ["Data Group", "Variables", "Main Source"], data_rows, [1900, 3680, 3780], font_size=9.2)

    add_heading(doc, "3.4 Data Collection Methods", 2)
    methods = [
        ("Desk study", "Collect and review geological maps, radiometric grids, previous publications, project files and mining history for Bukuru and surrounding communities."),
        ("GIS preparation", "Import radiometric grids, convert coordinate systems where necessary, clip layers to the study area and prepare a geodatabase for analysis."),
        ("Reconnaissance survey", "Visit accessible communities and mine-related locations with supervisor approval, record GPS points and identify safe sampling locations."),
        ("Sampling", "Collect representative rock, soil or tailings samples from selected radiometric anomaly zones, background zones and historical workings."),
        ("Laboratory analysis", "Prepare and submit samples for tin and pathfinder element analysis where facilities and funds permit."),
        ("Software modelling", "Use Excel, Python, QGIS/ArcGIS and the ARUM ALPHA dashboard environment to clean data, engineer features, train models and display outputs."),
    ]
    add_table(doc, ["Method", "Description"], methods, [2400, 6960], font_size=9.5)

    add_heading(doc, "3.5 Sampling Technique", 2)
    add_para(
        doc,
        "A purposive and stratified sampling approach will be used because the study is concerned with mineralization potential rather than a purely random social survey. The study area will first be divided into anomaly classes using radiometric indicators, historical mining evidence and geological setting. Samples will then be selected from high, medium and low anomaly zones so that the model can learn both mineralized and background conditions.",
    )
    sampling_rows = [
        ("Target sample size", "40 to 60 rock/soil/tailings samples, subject to access, safety and laboratory budget"),
        ("Control points", "At least 10 background or low-anomaly points for comparison"),
        ("Selection basis", "Radiometric anomaly strength, accessibility, geological setting and safe field conditions"),
        ("Sampling pattern", "Stratified purposive sampling with GPS control and duplicate/check samples where possible"),
        ("Data split", "70 percent training, 15 percent validation and 15 percent testing, with k-fold cross-validation"),
    ]
    add_table(doc, ["Sampling Item", "Planned Approach"], sampling_rows, [2600, 6760], font_size=9.5)

    add_heading(doc, "3.6 Data Analysis Methods", 2)
    analysis_rows = [
        ("Data cleaning", "Remove duplicates, correct coordinate errors, handle missing values and flag unreliable observations."),
        ("Exploratory data analysis", "Use descriptive statistics, histograms, scatter plots and correlation checks for K, Th, U, ratios and grades."),
        ("Feature engineering", "Calculate radiometric ratios, terrain derivatives, distance-to-feature variables and local neighbourhood statistics."),
        ("Model training", "Train Random Forest and XGBoost regressors using supervised grade data once assay labels are available."),
        ("Baseline comparison", "Apply inverse distance weighting and ordinary kriging to compare traditional spatial estimation with machine learning outputs."),
        ("Model evaluation", "Evaluate models using RMSE, MAE, R2, MAPE, residual plots, cross-validation and spatial reasonableness checks."),
        ("Mapping", "Generate grade prediction maps, mineral potential classes, confidence layers and priority target zones in GIS/dashboard format."),
        ("Interpretation", "Relate model results to geology, radiometric signatures, field observations and known tin mineralization controls."),
    ]
    add_table(doc, ["Analysis Stage", "Method"], analysis_rows, [2400, 6960], font_size=9.3)

    add_heading(doc, "3.7 Ethical and Safety Considerations", 2)
    safety_items = [
        "Approval and access permission will be obtained from the supervisor, department and any relevant community or site authority before fieldwork.",
        "Fieldwork will avoid unstable pits, steep mine faces, water-filled excavations, illegal mining zones and areas with security concerns.",
        "Personal protective equipment such as boots, helmet, gloves, reflective vest and first-aid materials will be used during field visits.",
        "Samples will be collected in a way that minimizes disturbance and avoids contamination of water bodies, farms or community property.",
        "Where interviews or local guidance are needed, informed consent will be requested and personal information will not be published without permission.",
        "AI-generated interpretations will be treated as decision support only; final conclusions will depend on geological evidence, laboratory data and supervisor review.",
    ]
    for item in safety_items:
        add_bullet(doc, item)


def add_outcomes_plan_budget(doc: Document):
    add_heading(doc, "4.0 Expected Outcomes and Deliverables", 1)
    add_para(
        doc,
        "At the end of the project, the work is expected to deliver both technical outputs and practical recommendations for exploration decision-making. The project will not claim a formal mineral reserve unless the data density and validation requirements for reserve estimation are satisfied. Instead, it will provide a defensible early-stage prediction and visualization workflow.",
    )
    outcomes = [
        "A cleaned and documented geospatial dataset containing radiometric, geological, geochemical and spatial variables for the study area.",
        "A machine learning model, preferably Random Forest or XGBoost, capable of predicting tin grade or mineralization class from selected input features.",
        "A comparative performance report showing how the machine learning models perform against ordinary kriging and inverse distance weighting.",
        "Mineral distribution and prospectivity maps showing predicted grade, confidence and priority zones for field verification.",
        "An interactive web dashboard that accepts coordinate input, displays study-area data and returns prediction outputs with risk interpretation.",
        "Technical recommendations for improved exploration efficiency, field verification and future data collection in Bukuru and surrounding areas.",
        "The final deliverable: A Comprehensive Final Year Project Report.",
    ]
    for item in outcomes:
        add_bullet(doc, item)

    add_heading(doc, "5.0 Project Plan (Work Schedule/Gantt Chart)", 1)
    gantt_rows = [
        ("1", "Topic selection and supervisor approval", "X", "", "", "", "", ""),
        ("2", "Literature review and proposal development", "X", "X", "", "", "", ""),
        ("3", "Proposal defense", "", "X", "", "", "", ""),
        ("4", "Data acquisition and field planning", "", "X", "X", "", "", ""),
        ("5", "Field/lab data collection", "", "", "X", "X", "", ""),
        ("6", "Data cleaning and exploratory analysis", "", "", "X", "X", "", ""),
        ("7", "Model training and geostatistical comparison", "", "", "", "X", "X", ""),
        ("8", "Dashboard implementation and map production", "", "", "", "X", "X", ""),
        ("9", "Validation, interpretation and recommendations", "", "", "", "", "X", ""),
        ("10", "Report writing, review and correction", "", "", "", "", "X", "X"),
        ("11", "Final submission and oral presentation", "", "", "", "", "", "X"),
    ]
    add_table(doc, ["S/N", "Activity/Milestone", "Jan", "Feb", "Mar", "Apr", "May", "Jun"], gantt_rows, [650, 3650, 840, 840, 840, 840, 840, 860], font_size=8.7)
    add_para(
        doc,
        "The schedule may be adjusted depending on access to field locations, laboratory turnaround time, supervisor feedback and departmental defense dates.",
        size=10.5,
        italic=True,
        color=MUTED,
        after=8,
        line=1.2,
    )


def add_budget(doc: Document):
    add_heading(doc, "7.0 Preliminary Budget", 1)
    budget_rows = [
        ("1", "Transportation to Bukuru/Du/Naraguta field locations", "60,000", "Site visits, GPS control and sample movement"),
        ("2", "Laboratory analysis and sample preparation", "120,000", "Tin/pathfinder assays, sample bags and labels"),
        ("3", "Software, internet and data processing support", "70,000", "GIS/data handling, dashboard testing and cloud/API support"),
        ("4", "Printing, photocopying and binding", "45,000", "Proposal, draft report, final report and defense copies"),
        ("5", "Research assistance and field logistics", "65,000", "Local guide, field support and contingency movements"),
        ("6", "Miscellaneous/contingency", "40,000", "Unexpected field, communication or data costs"),
        ("", "Total Estimated Budget", "400,000", "Potential sources: personal funding, department support and industry sponsor"),
    ]
    add_table(doc, ["S/N", "Item", "Cost (NGN)", "Notes"], budget_rows, [650, 3250, 1600, 3860], font_size=8.9)


def add_references(doc: Document):
    add_heading(doc, "6.0 References", 1)
    add_para(
        doc,
        "The following references are arranged broadly in APA 7th edition style and should be updated with final page numbers, DOI links and department-specific formatting after supervisor review.",
        size=10.5,
        italic=True,
        color=MUTED,
        line=1.2,
    )
    references = [
        "Bonham-Carter, G. F. (1994). Geographic information systems for geoscientists: Modelling with GIS. Pergamon.",
        "Breiman, L. (2001). Random forests. Machine Learning, 45(1), 5-32. https://doi.org/10.1023/A:1010933404324",
        "Carranza, E. J. M. (2008). Geochemical anomaly and mineral prospectivity mapping in GIS. Elsevier.",
        "Chen, T., & Guestrin, C. (2016). XGBoost: A scalable tree boosting system. Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining, 785-794. https://doi.org/10.1145/2939672.2939785",
        "Cracknell, M. J., & Reading, A. M. (2014). Geological mapping using remote sensing data: A comparison of five machine learning algorithms, their response to variations in the spatial distribution of training data and the use of explicit spatial information. Computers & Geosciences, 63, 22-33.",
        "Durrance, E. M. (1986). Radioactivity in geology: Principles and applications. Ellis Horwood.",
        "Goovaerts, P. (1997). Geostatistics for natural resources evaluation. Oxford University Press.",
        "International Atomic Energy Agency. (2003). Guidelines for radioelement mapping using gamma ray spectrometry data. IAEA-TECDOC-1363.",
        "Isaaks, E. H., & Srivastava, R. M. (1989). An introduction to applied geostatistics. Oxford University Press.",
        "Journel, A. G., & Huijbregts, C. J. (1978). Mining geostatistics. Academic Press.",
        "Kinnaird, J. A. (1985). Hydrothermal alteration and mineralization of the Nigerian anorogenic ring complexes. Journal of African Earth Sciences, 3(1-2), 229-251.",
        "McCuaig, T. C., & Hronsky, J. M. A. (2014). The mineral systems concept: The key to exploration targeting. Society of Economic Geologists Special Publication, 18, 153-175.",
        "Minty, B. R. S. (1997). Fundamentals of airborne gamma-ray spectrometry. AGSO Journal of Australian Geology and Geophysics, 17(2), 39-50.",
        "Obaje, N. G. (2009). Geology and mineral resources of Nigeria. Springer.",
        "Rodriguez-Galiano, V. F., Sanchez-Castillo, M., Chica-Olmo, M., & Chica-Rivas, M. (2015). Machine learning predictive models for mineral prospectivity: An evaluation of neural networks, random forest, regression trees and support vector machines. Ore Geology Reviews, 71, 804-818.",
        "Sheet168_Naraguta_Potassium.grd.xml. (2021). Geosoft grid metadata for potassium radiometric data, Sheet 168 Naraguta.",
        "Sheet168_Naraguta_Th.grd.xml. (2021). Geosoft grid metadata for thorium radiometric data, Sheet 168 Naraguta.",
        "Sheet168_Naraguta_U.grd.xml. (2021). Geosoft grid metadata for uranium radiometric data, Sheet 168 Naraguta.",
        "Shirmard, H., Farahbakhsh, E., Muller, R. D., & Chandra, R. (2021). A review of machine learning in processing remote sensing data for mineral exploration. Remote Sensing, 14(10), 2321.",
        "Singer, D. A., & Menzie, W. D. (2010). Quantitative mineral resource assessments: An integrated approach. Oxford University Press.",
        "Zuo, R., & Carranza, E. J. M. (2011). Support vector machine: A tool for mapping mineral prospectivity. Computers & Geosciences, 37(12), 1967-1975.",
    ]
    for ref in references:
        p = add_para(doc, ref, size=11, before=0, after=4, line=1.25)
        p.paragraph_format.first_line_indent = Inches(-0.3)
        p.paragraph_format.left_indent = Inches(0.3)


def add_appendices_and_approval(doc: Document):
    add_heading(doc, "8.0 Appendices", 1)
    add_heading(doc, "Appendix A: Preliminary Data Checklist", 2)
    checklist = [
        ("Radiometric grids", "K, Th and U files plus XML metadata", "Available in repository"),
        ("Geological map", "Lithology and structural features", "To be obtained/confirmed"),
        ("DEM layer", "Elevation, slope and aspect", "To be downloaded from open geospatial source"),
        ("Field samples", "Rock/soil/tailings samples with GPS coordinates", "To be collected after approval"),
        ("Laboratory assays", "Tin and selected pathfinder elements", "Subject to laboratory access and budget"),
        ("Dashboard source code", "Next.js/React application for visualization", "Available in repository"),
    ]
    add_table(doc, ["Data Item", "Description", "Status"], checklist, [2200, 4300, 2860], font_size=9.2)

    add_heading(doc, "Appendix B: Preliminary Field Safety Checklist", 2)
    safety = [
        "Supervisor approval and field itinerary confirmed before departure.",
        "Community/site permission obtained before entering any mining or private area.",
        "PPE available: helmet, boots, gloves, reflective vest and first-aid kit.",
        "No entry into unstable pits, flooded excavations or unsupported mine faces.",
        "GPS, phone, power bank, sample bags, labels and field notebook checked.",
        "Weather, transport and security conditions reviewed before each visit.",
    ]
    for item in safety:
        add_bullet(doc, item)

    doc.add_page_break()
    add_heading(doc, "Approval (For Department Use Only)", 1)
    add_para(doc, "Recommendation by Supervisor:", bold=True, after=16, line=1.2)
    for _ in range(4):
        add_para(doc, "_" * 78, after=8, line=1.0)
    add_para(doc, "Name: ____________________________________________", after=10, line=1.2)
    add_para(doc, "Signature & Date: _________________________________", after=18, line=1.2)
    add_para(
        doc,
        "NB: Kindly note that any report not signed and recommended by the project supervisor will not be accepted for presentation.",
        bold=True,
        size=11,
        color=BLUE,
        after=0,
        line=1.25,
    )


def audit_docx(path: Path):
    import zipfile
    from xml.etree import ElementTree as ET

    with zipfile.ZipFile(path) as z:
        doc_xml = ET.fromstring(z.read("word/document.xml"))
        ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
        tables = doc_xml.findall(".//w:tbl", ns)
        missing = []
        for idx, tbl in enumerate(tables, 1):
            tbl_w = tbl.find(".//w:tblPr/w:tblW", ns)
            grid_cols = tbl.findall(".//w:tblGrid/w:gridCol", ns)
            if tbl_w is None or tbl_w.get(qn("w:w")) is None or not grid_cols:
                missing.append(str(idx))
        if missing:
            raise RuntimeError(f"Tables missing fixed geometry: {', '.join(missing)}")


def build():
    create_study_area_map()
    doc = Document()
    configure_document(doc)
    add_cover(doc)
    add_introduction(doc)
    add_literature_review(doc)
    add_methodology(doc)
    add_outcomes_plan_budget(doc)
    add_references(doc)
    add_budget(doc)
    add_appendices_and_approval(doc)
    doc.save(OUT)
    audit_docx(OUT)
    print(OUT)


if __name__ == "__main__":
    build()
