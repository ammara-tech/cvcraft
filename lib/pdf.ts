import { PDFDocument, PDFString, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import { bulletsOf, dateRange, hasContent, linkHref, linkLabel, newestFirst, TEMPLATES, type Cv, type Item } from "@/lib/cv";

/*
  Turns a CV into a PDF with pdf-lib, in the browser (nothing is uploaded).
  - Real, selectable text in standard fonts, so job sites' CV readers (ATS) can read it
  - Clickable email and links
  - One A4 page if at all possible: it tries the normal text size first, then slightly smaller
    sizes (down to 9pt), and only adds a second page if it still doesn't fit
  - Three looks (lib/cv.ts TEMPLATES), all in one column, which job sites read best
  Tested in tests/pdf.test.ts (which reads the PDFs back).
*/

const A4 = { width: 595.28, height: 841.89 };
const INK = rgb(0.1, 0.1, 0.12);
const SOFT = rgb(0.33, 0.34, 0.38);
const RULE = rgb(0.8, 0.81, 0.84);
export const SIZES = [10.5, 10, 9.5, 9];

/** The standard PDF fonts can only draw Windows-1252 characters, so swap anything else for a close match */
export function pdfSafe(text: string) {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/—/g, "–")
    .replace(/→/g, "->")
    .replace(/[^\x20-\x7E -ÿ–•…€]/g, "");
}

/** Splits text into lines that fit the width (a single word that's too long gets its own line) */
export function wrap(text: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of pdfSafe(text).split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= width || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

type Fonts = { body: PDFFont; bold: PDFFont; head: PDFFont; headBold: PDFFont };

/** Draws the CV at one text size. Returns the document and how many pages it took. */
async function draw(cv: Cv, size: number) {
  const doc = await PDFDocument.create();
  const t = cv.template;
  const serif = t === "classic";
  const fonts: Fonts = {
    body: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    head: await doc.embedFont(serif ? StandardFonts.TimesRoman : StandardFonts.Helvetica),
    headBold: await doc.embedFont(serif ? StandardFonts.TimesRomanBold : StandardFonts.HelveticaBold),
  };
  const accent = t === "modern" ? hexToRgb(cv.accent) : INK;
  const margin = t === "compact" ? 34 : 44;
  const width = A4.width - margin * 2;
  const lineGap = size * 1.35;

  let page: PDFPage = doc.addPage([A4.width, A4.height]);
  let y = A4.height - margin;

  const room = (needed: number) => {
    if (y - needed < margin) {
      page = doc.addPage([A4.width, A4.height]);
      y = A4.height - margin;
    }
  };
  const text = (s: string, x: number, sz: number, font: PDFFont, color: RGB = INK) => page.drawText(pdfSafe(s), { x, y, size: sz, font, color });
  const link = (label: string, href: string, x: number, sz: number, color: RGB) => {
    const safe = pdfSafe(label);
    page.drawText(safe, { x, y, size: sz, font: fonts.body, color });
    const w = fonts.body.widthOfTextAtSize(safe, sz);
    const annot = doc.context.register(
      doc.context.obj({ Type: "Annot", Subtype: "Link", Rect: [x, y - 2, x + w, y + sz], Border: [0, 0, 0], A: { Type: "Action", S: "URI", URI: PDFString.of(href) } }),
    );
    page.node.addAnnot(annot);
    return w;
  };
  const centred = (s: string, sz: number, font: PDFFont) => (A4.width - font.widthOfTextAtSize(pdfSafe(s), sz)) / 2;

  // ---------- The top: name, headline and contact details ----------
  const p = cv.person;
  const nameSize = t === "compact" ? 19 : 23;
  y -= nameSize * 0.8;
  const name = p.name.trim() || "Your name";
  text(name, serif ? centred(name, nameSize, fonts.headBold) : margin, nameSize, fonts.headBold, t === "modern" ? accent : INK);
  y -= nameSize * 0.55;
  if (p.headline.trim()) {
    y -= size * 1.3;
    text(p.headline, serif ? centred(p.headline, size + 1.5, fonts.head) : margin, size + 1.5, fonts.head, SOFT);
  }
  const contacts: { label: string; href?: string }[] = [
    ...(p.email.trim() ? [{ label: p.email.trim(), href: `mailto:${p.email.trim()}` }] : []),
    ...(p.phone.trim() ? [{ label: p.phone.trim(), href: `tel:${p.phone.replace(/[^\d+]/g, "")}` }] : []),
    ...(p.location.trim() ? [{ label: p.location.trim() }] : []),
    ...p.links.filter((l) => l.trim()).map((l) => ({ label: linkLabel(l), href: linkHref(l) })),
  ];
  if (contacts.length) {
    y -= size * 1.6;
    const sep = "  |  ";
    const sepW = fonts.body.widthOfTextAtSize(sep, size - 0.5);
    const total = contacts.reduce((w, c) => w + fonts.body.widthOfTextAtSize(pdfSafe(c.label), size - 0.5), 0) + sepW * (contacts.length - 1);
    // One line if it fits (centred in the classic look); otherwise it wraps between items, never inside one
    let x = serif && total <= width ? (A4.width - total) / 2 : margin;
    contacts.forEach((c, i) => {
      const w = fonts.body.widthOfTextAtSize(pdfSafe(c.label), size - 0.5);
      if (i > 0) {
        if (x + sepW + w > margin + width) {
          y -= lineGap;
          x = margin;
        } else {
          text(sep, x, size - 0.5, fonts.body, RULE);
          x += sepW;
        }
      }
      if (c.href) link(c.label, c.href, x, size - 0.5, t === "modern" ? accent : SOFT);
      else text(c.label, x, size - 0.5, fonts.body, SOFT);
      x += w;
    });
  }
  y -= size * 0.6;

  // ---------- Sections ----------
  const heading = (title: string) => {
    room(size * 5);
    y -= size * 2;
    const hs = size + 1;
    const label = t === "classic" ? title : title.toUpperCase();
    text(label, margin, hs, fonts.headBold, accent);
    y -= size * 0.55;
    page.drawLine({ start: { x: margin, y }, end: { x: margin + width, y }, thickness: t === "modern" ? 1 : 0.6, color: t === "modern" ? accent : RULE });
    y -= size * 0.4;
  };

  const paragraph = (s: string, x: number, w: number, font: PDFFont = fonts.body, color: RGB = INK) => {
    for (const line of wrap(s, font, size, w)) {
      room(lineGap);
      y -= lineGap;
      text(line, x, size, font, color);
    }
  };

  const item = (i: Item) => {
    room(lineGap * 3);
    y -= lineGap + 2;
    const dates = dateRange(i);
    const dateW = dates ? fonts.body.widthOfTextAtSize(pdfSafe(dates), size - 0.5) : 0;
    const titleLine = [i.title.trim(), t === "compact" ? i.org.trim() : ""].filter(Boolean).join(" · ") || i.org.trim();
    const titleLines = wrap(titleLine, fonts.bold, size, width - dateW - 12);
    titleLines.forEach((line, n) => {
      if (n > 0) {
        y -= lineGap;
      }
      text(line, margin, size, fonts.bold);
    });
    if (dates) {
      const firstLineY = y + (titleLines.length - 1) * lineGap;
      page.drawText(pdfSafe(dates), { x: margin + width - dateW, y: firstLineY, size: size - 0.5, font: fonts.body, color: SOFT });
    }
    const sub = [t === "compact" ? "" : i.org.trim(), i.place.trim()].filter(Boolean).join(", ");
    if (sub) paragraph(sub, margin, width, fonts.body, SOFT);
    const indent = 11;
    for (const b of bulletsOf(i)) {
      const lines = wrap(b, fonts.body, size, width - indent);
      lines.forEach((line, n) => {
        room(lineGap);
        y -= lineGap;
        if (n === 0) text("•", margin + 2, size, fonts.body, t === "modern" ? accent : INK);
        text(line, margin + indent, size, fonts.body);
      });
    }
  };

  const section = (title: string, items: Item[]) => {
    const list = newestFirst(items).filter(hasContent);
    if (!list.length) return;
    heading(title);
    list.forEach(item);
  };

  if (cv.summary.trim()) {
    heading("Profile");
    paragraph(cv.summary.trim(), margin, width);
  }
  section("Experience", cv.experience);
  section("Projects", cv.projects);
  section("Education", cv.education);
  if (cv.skills.length) {
    heading("Skills");
    if (t === "compact") paragraph(cv.skills.join(" · "), margin, width);
    else {
      // Two or three columns of skills, filled across
      const cols = width > 470 ? 3 : 2;
      const colW = width / cols;
      for (let r = 0; r < Math.ceil(cv.skills.length / cols); r++) {
        room(lineGap);
        y -= lineGap;
        for (let c = 0; c < cols; c++) {
          const s = cv.skills[r * cols + c];
          if (!s) continue;
          const line = wrap(s, fonts.body, size, colW - 14)[0] ?? "";
          text("•", margin + c * colW + 2, size, fonts.body, t === "modern" ? accent : INK);
          text(line, margin + c * colW + 11, size, fonts.body);
        }
      }
    }
  }
  const certs = cv.certifications.map((c) => c.trim()).filter(Boolean);
  if (certs.length) {
    heading("Certifications");
    for (const c of certs) {
      const lines = wrap(c, fonts.body, size, width - 11);
      lines.forEach((line, n) => {
        room(lineGap);
        y -= lineGap;
        if (n === 0) text("•", margin + 2, size, fonts.body, t === "modern" ? accent : INK);
        text(line, margin + 11, size, fonts.body);
      });
    }
  }
  if (cv.references.trim()) {
    heading("References");
    paragraph(cv.references.trim(), margin, width);
  }

  doc.setTitle(`${pdfSafe(name)} – CV`);
  doc.setAuthor(pdfSafe(name));
  doc.setCreator("CVcraft");
  doc.setProducer("CVcraft (pdf-lib)");
  doc.setSubject(pdfSafe(p.headline || TEMPLATES[t].label));
  return { doc, pages: doc.getPageCount() };
}

export type PdfResult = { bytes: Uint8Array; pages: number; size: number; shrunk: boolean };

/** The finished PDF: one page at the largest text size that fits, or two pages at the smallest */
export async function makeCvPdf(cv: Cv): Promise<PdfResult> {
  for (const size of SIZES) {
    const { doc, pages } = await draw(cv, size);
    if (pages === 1 || size === SIZES[SIZES.length - 1]) {
      return { bytes: await doc.save(), pages, size, shrunk: size < SIZES[0] };
    }
  }
  throw new Error("unreachable");
}

/** "lindiwe-khumalo-cv.pdf" */
export function pdfFileName(cv: Pick<Cv, "person">) {
  const slug = cv.person.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug || "my"}-cv.pdf`;
}
