import { describe, expect, it } from "vitest";
import { backupText, mergeCvs, readCv, readCvs } from "@/lib/storage";
import { ACCENTS, exampleCv } from "@/lib/cv";

describe("saving and backups", () => {
  it("reads a backup back exactly", () => {
    const cv = exampleCv();
    expect(readCvs(backupText([cv]))).toEqual([cv]);
    expect(readCvs(JSON.stringify([cv]))).toEqual([cv]);
  });

  it("makes broken data safe instead of crashing", () => {
    expect(readCvs("not json")).toEqual([]);
    expect(readCvs(JSON.stringify({ hello: 1 }))).toEqual([]);
    const cv = readCv({ name: 5, template: "fancy", accent: "#ff00ff", person: { name: "A".repeat(500), links: ["x", 3] }, experience: [{ title: "Intern", from: "June", bullets: [] }] })!;
    expect(cv.name).toBe("");
    expect(cv.template).toBe("modern");
    expect(cv.accent).toBe(ACCENTS[0].hex);
    expect(cv.person.name).toHaveLength(60);
    expect(cv.person.links).toEqual(["x", ""]);
    expect(cv.experience[0].from).toBe("");
    expect(cv.experience[0].bullets).toEqual([""]);
    expect(readCv(null)).toBe(null);
  });

  it("joins imported CVs with yours, replacing the same CV", () => {
    const a = { ...exampleCv(), id: "a", updatedAt: 1 };
    const b = { ...exampleCv(), id: "b", updatedAt: 2 };
    const newerA = { ...a, name: "Newer", updatedAt: 3 };
    expect(mergeCvs([a, b], [newerA]).map((c) => [c.id, c.name])).toEqual([
      ["a", "Newer"],
      ["b", b.name],
    ]);
  });
});
