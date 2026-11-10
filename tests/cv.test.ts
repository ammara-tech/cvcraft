import { describe, expect, it } from "vitest";
import { ACCENTS, blankCv, cvTitle, dateRange, duplicateCv, exampleCv, linkHref, linkLabel, monthLabel, newestFirst, plainText, splitSkills } from "@/lib/cv";
import { item } from "./helpers";

describe("CV helpers", () => {
  it("writes dates the way CVs do", () => {
    expect(monthLabel("2024-02")).toBe("Feb 2024");
    expect(monthLabel("nope")).toBe("");
    expect(dateRange({ from: "2024-02", to: "" })).toBe("Feb 2024 – Present");
    expect(dateRange({ from: "2024-02", to: "2025-06" })).toBe("Feb 2024 – Jun 2025");
    expect(dateRange({ from: "2024-02", to: "2024-02" })).toBe("Feb 2024");
    expect(dateRange({ from: "", to: "" })).toBe("");
  });

  it("puts what you do now first, then the newest", () => {
    const now = item({ title: "Now", to: "" });
    const old = item({ title: "Old", from: "2020-01", to: "2021-01" });
    const recent = item({ title: "Recent", from: "2023-01", to: "2024-06" });
    expect(newestFirst([old, now, recent]).map((i) => i.title)).toEqual(["Now", "Recent", "Old"]);
  });

  it("splits typed skills, without repeats", () => {
    expect(splitSkills("React, next.js; React\nSQL ,  ")).toEqual(["React", "next.js", "SQL"]);
  });

  it("shows links short and opens them safely", () => {
    expect(linkLabel("https://www.github.com/me/")).toBe("github.com/me");
    expect(linkHref("github.com/me")).toBe("https://github.com/me");
    expect(linkHref("http://site.co.za")).toBe("http://site.co.za");
  });

  it("names, copies and starts CVs", () => {
    expect(cvTitle({ name: "", person: { name: "Thabo" } as never })).toBe("Thabo's CV");
    const ex = exampleCv();
    const copy = duplicateCv(ex);
    expect(copy.id).not.toBe(ex.id);
    expect(copy.experience[0].id).not.toBe(ex.experience[0].id);
    expect(copy.name).toBe("Example: junior developer (copy)");
    expect(blankCv().accent).toBe(ACCENTS[0].hex);
  });

  it("turns a CV into plain text for job sites' forms", () => {
    const text = plainText(exampleCv());
    expect(text.startsWith("Lindiwe Khumalo\nJunior web developer\nlindiwe.khumalo@example.com | 082 000 0000 | Johannesburg | github.com/lindiwe-example | lindiwe.example.com")).toBe(true);
    expect(text).toContain("EXPERIENCE\nIT support intern, Mosaic Logistics, Midrand (Jun 2025 – Dec 2025)\n- Fixed over 200");
    expect(text).not.toContain("\n\n\n");
  });
});
