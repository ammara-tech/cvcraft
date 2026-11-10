import { describe, expect, it } from "vitest";
import { checkCv, tipsSummary } from "@/lib/checks";
import { exampleCv } from "@/lib/cv";
import { cvWith, item } from "./helpers";

const ids = (cv: Parameters<typeof checkCv>[0]) => checkCv(cv).map((t) => t.id);

describe("the CV check", () => {
  it("is happy with the example CV", () => {
    expect(checkCv(exampleCv())).toEqual([]);
    expect(tipsSummary([])).toBe("Looking good: nothing to fix");
  });

  it("asks for the basics", () => {
    const cv = cvWith({ person: { name: "", headline: "", email: "", phone: "", location: "", links: [] } });
    expect(ids(cv).slice(0, 4)).toEqual(["name", "email", "phone", "headline"]);
    expect(ids(cvWith({ person: { ...cvWith().person, email: "thabo@example" } }))).toContain("email-shape");
  });

  it("warns about personal details employers don't need", () => {
    expect(ids(cvWith({ summary: "ID number: 900101 5009 087" }))).toContain("personal");
    expect(ids(cvWith({ summary: "Marital status: single" }))).toContain("personal");
    expect(ids(cvWith({ summary: "Grade 12 in 2019" }))).not.toContain("personal");
  });

  it("gives tips on how points are written", () => {
    const weak = cvWith({ experience: [item({ bullets: ["Responsible for the till", "Helped customers", "Cleaned tables"] })] });
    const t = ids(weak);
    expect(t).toContain("weak");
    expect(t).toContain("numbers");
    expect(ids(cvWith({ experience: [item({ bullets: ["I built my own page"] })] }))).toContain("first-person");
    expect(ids(cvWith({ experience: [item({ from: "" })] }))).toContain("dates");
    expect(ids(cvWith({ skills: [] }))).toContain("skills");
  });

  it("sums the tips up", () => {
    expect(tipsSummary([{ id: "a", level: "fix", text: "" }, { id: "b", level: "tip", text: "" }, { id: "c", level: "tip", text: "" }])).toBe("1 thing to fix, 2 tips");
  });
});
