/*
  What a CV is in CVcraft, and the small helpers around it. Everything is saved on the device
  (lib/storage.ts), so a CV is plain data that can be backed up as a file and loaded again.
  Tested in tests/cv.test.ts.
*/

export type Template = "classic" | "modern" | "compact";

export type Item = {
  id: string;
  title: string; // the role, qualification or project name
  org: string; // the company, school or what it was for
  place: string;
  from: string; // "2024-02", or "" for none
  to: string; // "2025-06", "" for present
  bullets: string[];
};

export type Cv = {
  id: string;
  name: string; // the version's name, e.g. "Web developer, November"
  updatedAt: number;
  template: Template;
  accent: string; // one of ACCENTS
  person: { name: string; headline: string; email: string; phone: string; location: string; links: string[] };
  summary: string;
  experience: Item[];
  education: Item[];
  projects: Item[];
  skills: string[];
  certifications: string[];
  references: string;
};

export type SectionKey = "experience" | "education" | "projects";

export const TEMPLATES: Record<Template, { label: string; about: string }> = {
  classic: { label: "Classic", about: "Serif headings, centred name. Traditional and safe for any job." },
  modern: { label: "Modern", about: "A coloured name and headings. Clean and current." },
  compact: { label: "Compact", about: "Smaller margins and inline skills, for fitting more on one page." },
};

/** Accent colours that all pass WCAG AA (4.5:1) as text on white paper */
export const ACCENTS = [
  { hex: "#1f4e79", name: "Navy" },
  { hex: "#17603f", name: "Green" },
  { hex: "#7a2e3a", name: "Wine" },
  { hex: "#4b3cc4", name: "Violet" },
  { hex: "#2b2b2b", name: "Charcoal" },
];

export const LIMITS = { name: 60, headline: 80, contact: 80, summary: 700, title: 80, org: 80, place: 60, bullet: 240, bullets: 6, items: 8, skills: 30, skill: 40, certs: 10, cert: 100, links: 3, references: 120 };

let counter = 0;
export function newId() {
  counter += 1;
  return `${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export const blankItem = (): Item => ({ id: newId(), title: "", org: "", place: "", from: "", to: "", bullets: [""] });

export function blankCv(name = "My CV"): Cv {
  return {
    id: newId(),
    name,
    updatedAt: Date.now(),
    template: "modern",
    accent: ACCENTS[0].hex,
    person: { name: "", headline: "", email: "", phone: "", location: "", links: [] },
    summary: "",
    experience: [],
    education: [],
    projects: [],
    skills: [],
    certifications: [],
    references: "Available on request",
  };
}

/** A made-up graduate's CV, to see what a finished one looks like */
export function exampleCv(): Cv {
  const item = (o: Omit<Item, "id">): Item => ({ id: newId(), ...o });
  return {
    ...blankCv("Example: junior developer"),
    person: {
      name: "Lindiwe Khumalo",
      headline: "Junior web developer",
      email: "lindiwe.khumalo@example.com",
      phone: "082 000 0000",
      location: "Johannesburg",
      links: ["github.com/lindiwe-example", "lindiwe.example.com"],
    },
    summary:
      "Junior web developer who builds fast, accessible websites with Next.js and React. I've shipped three live apps used by real people, and I write tests for everything I build. Looking for a graduate role in a team that cares about quality.",
    experience: [
      item({
        title: "IT support intern",
        org: "Mosaic Logistics",
        place: "Midrand",
        from: "2025-06",
        to: "2025-12",
        bullets: ["Fixed over 200 support tickets for 80 staff, with a 95% same-day rate", "Built a small internal page that cut laptop set-up time from 2 hours to 40 minutes", "Wrote step-by-step guides that the help desk still uses"],
      }),
      item({
        title: "Waitron",
        org: "The Corner Café",
        place: "Braamfontein",
        from: "2023-02",
        to: "2025-05",
        bullets: ["Served up to 60 tables a shift while studying full time", "Trained 5 new staff on the till and orders"],
      }),
    ],
    education: [item({ title: "Diploma in IT (Software Development)", org: "Example College", place: "Johannesburg", from: "2023-01", to: "2025-11", bullets: ["Final project: a booking app for a salon, with online payments in test mode"] })],
    projects: [
      item({ title: "SpazaStock", org: "Next.js, Firebase", place: "", from: "2025-08", to: "", bullets: ["Stock and sales app for a spaza shop, used daily by its owner", "Works offline and syncs when there's signal"] }),
    ],
    skills: ["JavaScript", "TypeScript", "React", "Next.js", "HTML and CSS", "Tailwind CSS", "Firebase", "SQL", "Git and GitHub", "Testing (Vitest)", "Accessibility (WCAG)"],
    certifications: ["Responsive Web Design (freeCodeCamp)", "AWS Cloud Practitioner (in progress)"],
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2024-02" → "Feb 2024" */
export function monthLabel(month: string) {
  const m = month.match(/^(\d{4})-(\d{2})$/);
  if (!m) return "";
  return `${MONTHS[Number(m[2]) - 1] ?? ""} ${m[1]}`.trim();
}

/** "Feb 2024 – Present", "2023 – 2025", "" */
export function dateRange(item: Pick<Item, "from" | "to">) {
  const from = monthLabel(item.from);
  const to = item.to ? monthLabel(item.to) : from ? "Present" : "";
  if (!from && !to) return "";
  if (!from) return to;
  return from === to ? from : `${from} – ${to}`;
}

/** Newest first: what you're doing now, then by end date, then by start date */
export function newestFirst(items: Item[]) {
  return [...items].sort((a, b) => (b.to || "9999").localeCompare(a.to || "9999") || b.from.localeCompare(a.from));
}

/** Only the bullets with words in them */
export const bulletsOf = (item: Pick<Item, "bullets">) => item.bullets.map((b) => b.trim()).filter(Boolean);

/** Is there anything in this item to show? */
export const hasContent = (item: Item) => Boolean(item.title.trim() || item.org.trim() || bulletsOf(item).length);

/** A CV's version name for the list ("Untitled CV" if empty) */
export const cvTitle = (cv: Pick<Cv, "name" | "person">) => cv.name.trim() || (cv.person.name ? `${cv.person.name}'s CV` : "Untitled CV");

/** Makes a copy with new ids */
export function duplicateCv(cv: Cv): Cv {
  const copyItems = (items: Item[]) => items.map((i) => ({ ...i, id: newId(), bullets: [...i.bullets] }));
  return {
    ...cv,
    id: newId(),
    name: `${cvTitle(cv)} (copy)`.slice(0, LIMITS.name),
    updatedAt: Date.now(),
    person: { ...cv.person, links: [...cv.person.links] },
    experience: copyItems(cv.experience),
    education: copyItems(cv.education),
    projects: copyItems(cv.projects),
    skills: [...cv.skills],
    certifications: [...cv.certifications],
  };
}

/** Skills typed as "React, Next.js; SQL" → ["React", "Next.js", "SQL"], without repeats */
export function splitSkills(text: string) {
  const seen = new Set<string>();
  return text
    .split(/[,;\n]+/)
    .map((s) => s.replace(/\s+/g, " ").trim().slice(0, LIMITS.skill))
    .filter((s) => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()))
    .slice(0, LIMITS.skills);
}

/** Links shown without "https://" and "www.", and opened with "https://" */
export const linkLabel = (link: string) => link.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
export const linkHref = (link: string) => (/^https?:\/\//i.test(link.trim()) ? link.trim() : `https://${linkLabel(link)}`);

/** The whole CV as plain text, for pasting into job sites' forms */
export function plainText(cv: Cv) {
  const out: string[] = [];
  const p = cv.person;
  out.push(p.name, p.headline, [p.email, p.phone, p.location, ...p.links.map(linkLabel)].filter(Boolean).join(" | "), "");
  if (cv.summary.trim()) out.push("PROFILE", cv.summary.trim(), "");
  const section = (title: string, items: Item[]) => {
    const list = newestFirst(items).filter(hasContent);
    if (!list.length) return;
    out.push(title);
    for (const i of list) {
      out.push([i.title, i.org, i.place].filter(Boolean).join(", ") + (dateRange(i) ? ` (${dateRange(i)})` : ""));
      for (const b of bulletsOf(i)) out.push(`- ${b}`);
    }
    out.push("");
  };
  section("EXPERIENCE", cv.experience);
  section("PROJECTS", cv.projects);
  section("EDUCATION", cv.education);
  if (cv.skills.length) out.push("SKILLS", cv.skills.join(", "), "");
  if (cv.certifications.length) out.push("CERTIFICATIONS", ...cv.certifications.map((c) => `- ${c}`), "");
  if (cv.references.trim()) out.push("REFERENCES", cv.references.trim(), "");
  return out.filter((line, i, all) => !(line === "" && all[i - 1] === "")).join("\n").trim() + "\n";
}
