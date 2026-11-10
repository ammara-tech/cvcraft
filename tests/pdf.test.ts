import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { makeCvPdf, pdfFileName, pdfSafe, SIZES, wrap } from "@/lib/pdf";
import { exampleCv } from "@/lib/cv";
import { cvWith, item } from "./helpers";

describe("the PDF", () => {
  it("makes the example CV as one A4 page, at the normal size, in every template", async () => {
    for (const template of ["classic", "modern", "compact"] as const) {
      const result = await makeCvPdf({ ...exampleCv(), template });
      expect(result.pages).toBe(1);
      expect(result.size).toBe(SIZES[0]);
      const doc = await PDFDocument.load(result.bytes);
      expect(doc.getTitle()).toBe("Lindiwe Khumalo – CV");
      const [w, h] = [doc.getPage(0).getWidth(), doc.getPage(0).getHeight()];
      expect([Math.round(w), Math.round(h)]).toEqual([595, 842]);
    }
  });

  it("makes the text smaller to stay on one page, and only then adds a page", async () => {
    const bullets = ["Built and looked after a page used by forty staff every single working day of the week", "Trained new people", "Fixed many things"];
    const longish = cvWith({ experience: Array.from({ length: 6 }, (_, i) => item({ title: `Role ${i}`, bullets })) });
    const fits = await makeCvPdf(longish);
    expect(fits.pages).toBe(1);
    const huge = cvWith({ experience: Array.from({ length: 8 }, (_, i) => item({ title: `Role ${i}`, bullets: [...bullets, ...bullets] })), projects: Array.from({ length: 8 }, () => item({ bullets })) });
    const two = await makeCvPdf(huge);
    expect(two.pages).toBeGreaterThan(1);
    expect(two.size).toBe(SIZES[SIZES.length - 1]);
    expect(two.shrunk).toBe(true);
  });

  it("adds clickable links for the email and websites", async () => {
    const result = await makeCvPdf(exampleCv());
    const doc = await PDFDocument.load(result.bytes);
    const annots = doc.getPage(0).node.Annots();
    expect(annots?.size()).toBe(4); // email, phone and two links
  });

  it("swaps characters the fonts can't draw, and wraps text", async () => {
    expect(pdfSafe("“Quotes” — and →")).toBe('"Quotes" – and ->');
    expect(pdfSafe("Emoji 🎉 gone")).toBe("Emoji  gone");
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const lines = wrap("one two three four five six seven eight", font, 10, 60);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(" ")).toBe("one two three four five six seven eight");
    expect(pdfFileName({ person: { name: "Lindiwe Khumalo" } as never })).toBe("lindiwe-khumalo-cv.pdf");
  });
});
