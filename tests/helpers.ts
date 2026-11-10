import { blankCv, newId, type Cv, type Item } from "@/lib/cv";

/* Made-up CVs for the tests */
export const item = (o: Partial<Item> = {}): Item => ({ id: newId(), title: "Intern", org: "Acme", place: "Durban", from: "2025-01", to: "2025-06", bullets: ["Built a page used by 40 staff"], ...o });

export function cvWith(o: Partial<Cv> = {}): Cv {
  const base = blankCv("Test CV");
  return { ...base, person: { name: "Thabo Nkosi", headline: "Junior developer", email: "thabo@example.com", phone: "082 000 0000", location: "Durban", links: [] }, summary: "Junior developer.", skills: ["React"], ...o };
}
